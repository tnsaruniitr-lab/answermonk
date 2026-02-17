import type {
  BuyerIntentProfile,
  SlotBank,
  SlotTerm,
  Prompt,
  PromptSet,
  Cluster,
  Shape,
} from "./types";
import { BuyerIntentProfileSchema } from "./types";
import {
  normalizeKey,
  toDisplayFallback,
  dedupeByKey,
  resolveModifier,
  ensureServiceVerb,
  BUDGET_ADJECTIVES,
} from "./presets";
import {
  buildTemplatePools,
  getShapeSuffix,
  getFallbackTemplate,
  type PromptTemplate,
  type TemplatePools,
} from "./templates";

function seededRng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;

  function next(): number {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  }

  function pick<T>(arr: T[]): T {
    return arr[Math.floor(next() * arr.length)];
  }

  function shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  return { rand: next, pick, shuffle };
}

function buildSlotBank(profile: BuyerIntentProfile): SlotBank {
  const categoryTerm: SlotTerm = {
    key: normalizeKey(profile.category),
    display: profile.category,
    verified: true,
    type: "category",
    source: "user",
  };

  const verticalTerms: SlotTerm[] = dedupeByKey(
    profile.verticals.map((v) => ({
      key: normalizeKey(v),
      display: v,
      verified: true,
      type: "vertical" as const,
      source: "user" as const,
    }))
  );

  const serviceTerms: SlotTerm[] = dedupeByKey(
    profile.services.map((s) => ({
      key: normalizeKey(s),
      display: s,
      verified: true,
      type: "service" as const,
      source: "user" as const,
    }))
  );

  const modifierTerms: SlotTerm[] = [];
  const unverifiedModifiers: SlotTerm[] = [];

  for (const raw of profile.modifiers ?? []) {
    const resolved = resolveModifier(raw, profile.persona_type);
    const term: SlotTerm = {
      key: normalizeKey(resolved.display),
      display: resolved.display,
      verified: resolved.verified,
      type: "modifier",
      source: "user",
    };
    if (resolved.verified) {
      modifierTerms.push(term);
    } else {
      unverifiedModifiers.push(term);
    }
  }

  const geoTerms: SlotTerm[] = [];
  if (profile.geo) {
    const parts = profile.geo.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      geoTerms.push({
        key: normalizeKey(parts[0]),
        display: parts[0],
        verified: true,
        type: "geo",
        source: "user",
      });
      geoTerms.push({
        key: normalizeKey(parts[1]),
        display: parts[1],
        verified: true,
        type: "geo",
        source: "user",
      });
    } else if (parts.length === 1) {
      geoTerms.push({
        key: normalizeKey(parts[0]),
        display: parts[0],
        verified: true,
        type: "geo",
        source: "user",
      });
    }
  }

  const tier = profile.budget_tier ?? "mid";
  const adjList = BUDGET_ADJECTIVES[profile.persona_type][tier];
  const budgetAdjs: SlotTerm[] = adjList.map((a) => ({
    key: normalizeKey(a),
    display: a,
    verified: true,
    type: "budget_adj" as const,
    source: "preset" as const,
  }));

  const personaMode =
    profile.persona_type === "marketing_agency" ? "provider_led" : "problem_led";

  return {
    category_terms: [categoryTerm],
    vertical_terms: dedupeByKey(verticalTerms),
    service_terms: dedupeByKey(serviceTerms),
    modifier_terms: dedupeByKey(modifierTerms),
    geo_terms: dedupeByKey(geoTerms),
    budget_adjs: budgetAdjs,
    unverified_modifiers: dedupeByKey(unverifiedModifiers),
    persona_mode: personaMode as "provider_led" | "problem_led",
  };
}

const MODIFIER_ALLOWED_CLUSTERS: Record<string, Cluster[]> = {
  marketing_agency: ["direct", "persona", "task"],
  automation_consultant: ["direct", "task"],
};

interface GenerateOptions {
  seed?: number;
  nPrompts?: number;
}

export function generatePromptSet(
  profile: BuyerIntentProfile,
  options: GenerateOptions = {}
): PromptSet {
  const validated = BuyerIntentProfileSchema.parse(profile);
  const seed = options.seed ?? Math.floor(Math.random() * 2147483646) + 1;
  const nPrompts = options.nPrompts ?? 40;
  const rng = seededRng(seed);

  const slotBank = buildSlotBank(validated);
  const pools = buildTemplatePools(validated.persona_type);

  const clusters: Cluster[] = ["direct", "persona", "budget", "task"];
  const base = Math.floor(nPrompts / 4);
  const remainder = nPrompts % 4;
  const clusterCounts: Record<Cluster, number> = {
    direct: base + (remainder > 0 ? 1 : 0),
    persona: base + (remainder > 1 ? 1 : 0),
    budget: base + (remainder > 2 ? 1 : 0),
    task: base,
  };

  const shapes = buildShapeDistribution(nPrompts, rng);

  const modifierRate =
    validated.persona_type === "automation_consultant" ? 0.45 : 0.40;
  const geoRate =
    validated.persona_type === "marketing_agency" ? 0.35 : 0.20;

  const hasModifiers = slotBank.modifier_terms.length > 0;
  const hasGeo = slotBank.geo_terms.length > 0;
  const allowedModClusters = MODIFIER_ALLOWED_CLUSTERS[validated.persona_type];

  const modMinGuarantee = hasModifiers ? 6 : 0;
  const geoMinGuarantee = hasGeo
    ? validated.persona_type === "marketing_agency"
      ? 4
      : 3
    : 0;

  const prompts: Prompt[] = [];
  const seenBaseKeys = new Set<string>();
  let modifierUsedCount = 0;
  let geoUsedCount = 0;
  let shapeIdx = 0;
  let promptCounter = 0;

  for (const cluster of clusters) {
    let generated = 0;
    let clusterRetries = 0;
    const maxClusterRetries = clusterCounts[cluster] * 10;

    while (generated < clusterCounts[cluster] && clusterRetries < maxClusterRetries) {
      clusterRetries++;
      const totalGenerated = prompts.length;
      const remaining = nPrompts - totalGenerated;
      const boostWindow = totalGenerated >= 30;

      let useModifier = false;
      let useGeo = false;

      if (hasModifiers && allowedModClusters.includes(cluster)) {
        if (boostWindow && modifierUsedCount < modMinGuarantee) {
          useModifier = true;
        } else {
          useModifier = rng.rand() < modifierRate;
        }
        if (
          validated.modifier_focus &&
          slotBank.modifier_terms.length === 1 &&
          boostWindow &&
          modifierUsedCount < modMinGuarantee
        ) {
          useModifier = true;
        }
      }

      if (hasGeo) {
        useGeo = true;
      }

      const template = pickTemplate(
        pools,
        cluster,
        useModifier,
        useGeo,
        hasModifiers && allowedModClusters.includes(cluster),
        hasGeo,
        rng
      );

      const slots: Record<string, string> = {};
      let canFill = true;

      const placeholders = extractPlaceholders(template.text);

      for (const ph of placeholders) {
        const value = fillSlot(ph, slotBank, rng, validated.persona_type);
        if (value === null) {
          canFill = false;
          break;
        }
        slots[ph] = value;
      }

      if (!canFill) {
        const fallback = getFallbackTemplate(cluster);
        const fbPlaceholders = extractPlaceholders(fallback.text);
        slots.category = slotBank.category_terms[0]?.display ?? "consultant";
        for (const ph of fbPlaceholders) {
          if (!slots[ph]) {
            const val = fillSlot(ph, slotBank, rng, validated.persona_type);
            if (val) slots[ph] = val;
          }
        }
        const baseText = fillTemplate(fallback.text, slots);
        const baseKey = normalizeKey(baseText);

        if (seenBaseKeys.has(baseKey)) {
          promptCounter++;
          if (promptCounter > nPrompts * 3) {
            seenBaseKeys.add(baseKey + `_force_${prompts.length}`);
            const shape = shapes[shapeIdx % shapes.length];
            shapeIdx++;
            prompts.push({
              id: `p_${prompts.length + 1}`,
              cluster,
              shape,
              text: baseText + getShapeSuffix(shape),
              slots_used: slots,
              tags: [cluster, shape],
              modifier_included: false,
              geo_included: false,
            });
            generated++;
            promptCounter = 0;
          }
          continue;
        }
        seenBaseKeys.add(baseKey);

        const shape = shapes[shapeIdx % shapes.length];
        shapeIdx++;

        prompts.push({
          id: `p_${prompts.length + 1}`,
          cluster,
          shape,
          text: baseText + getShapeSuffix(shape),
          slots_used: slots,
          tags: [cluster, shape],
          modifier_included: false,
          geo_included: false,
        });
        generated++;
        promptCounter = 0;
        continue;
      }

      const baseText = fillTemplate(template.text, slots);
      const baseKey = normalizeKey(baseText);

      if (seenBaseKeys.has(baseKey)) {
        promptCounter++;
        if (promptCounter > 30) {
          const fallback = getFallbackTemplate(cluster);
          const fbSlots: Record<string, string> = {
            category: slotBank.category_terms[0]?.display ?? "consultant",
          };
          const fbPh = extractPlaceholders(fallback.text);
          for (const ph of fbPh) {
            if (!fbSlots[ph]) {
              const val = fillSlot(ph, slotBank, rng, validated.persona_type);
              if (val) fbSlots[ph] = val;
            }
          }
          const fbText = fillTemplate(fallback.text, fbSlots);
          const fbKey = normalizeKey(fbText);
          if (!seenBaseKeys.has(fbKey)) {
            seenBaseKeys.add(fbKey);
            const shape = shapes[shapeIdx % shapes.length];
            shapeIdx++;
            prompts.push({
              id: `p_${prompts.length + 1}`,
              cluster,
              shape,
              text: fbText + getShapeSuffix(shape),
              slots_used: fbSlots,
              tags: [cluster, shape],
              modifier_included: false,
              geo_included: false,
            });
            generated++;
          }
          promptCounter = 0;
        }
        continue;
      }

      seenBaseKeys.add(baseKey);
      const shape = shapes[shapeIdx % shapes.length];
      shapeIdx++;

      const modIncluded = template.has_modifier && !!slots.modifier;
      const geoIncluded = template.has_geo && !!slots.geo;

      if (modIncluded) modifierUsedCount++;
      if (geoIncluded) geoUsedCount++;

      prompts.push({
        id: `p_${prompts.length + 1}`,
        cluster,
        shape,
        text: baseText + getShapeSuffix(shape),
        slots_used: slots,
        tags: [cluster, shape, ...(modIncluded ? ["has_modifier"] : []), ...(geoIncluded ? ["has_geo"] : [])],
        modifier_included: modIncluded,
        geo_included: geoIncluded,
      });

      generated++;
      promptCounter = 0;
    }

    while (generated < clusterCounts[cluster]) {
      const fallback = getFallbackTemplate(cluster);
      const fbSlots: Record<string, string> = {
        category: slotBank.category_terms[0]?.display ?? "consultant",
      };
      const fbPh = extractPlaceholders(fallback.text);
      for (const ph of fbPh) {
        const val = fillSlot(ph, slotBank, rng, validated.persona_type);
        if (val) fbSlots[ph] = val;
      }
      const fbText = fillTemplate(fallback.text, fbSlots);
      const shape = shapes[shapeIdx % shapes.length];
      shapeIdx++;
      prompts.push({
        id: `p_${prompts.length + 1}`,
        cluster,
        shape,
        text: fbText + getShapeSuffix(shape),
        slots_used: fbSlots,
        tags: [cluster, shape],
        modifier_included: false,
        geo_included: false,
      });
      generated++;
    }
  }

  const countsByCluster: Record<string, number> = {};
  const countsByShape: Record<string, number> = {};
  for (const p of prompts) {
    countsByCluster[p.cluster] = (countsByCluster[p.cluster] ?? 0) + 1;
    countsByShape[p.shape] = (countsByShape[p.shape] ?? 0) + 1;
  }

  return {
    prompt_set_id: `ps_${seed}_${Date.now()}`,
    version: "pg_v1",
    seed_used: seed,
    counts: {
      by_cluster: countsByCluster,
      by_shape: countsByShape,
      modifier_prompts: modifierUsedCount,
      geo_prompts: geoUsedCount,
    },
    slot_bank: slotBank,
    prompts,
    unverified_items: slotBank.unverified_modifiers,
  };
}

function buildShapeDistribution(n: number, rng: ReturnType<typeof seededRng>): Shape[] {
  const shapes: Shape[] = [];
  const targets: [Shape, number][] = [
    ["open", 14],
    ["top5", 10],
    ["top3", 10],
    ["best", 6],
  ];
  const totalTarget = targets.reduce((s, [, c]) => s + c, 0);

  const counts: number[] = targets.map(([, c]) => Math.floor((c / totalTarget) * n));
  let assigned = counts.reduce((s, c) => s + c, 0);
  const remainders = targets.map(([, c], i) => ({
    idx: i,
    frac: ((c / totalTarget) * n) - counts[i],
  }));
  remainders.sort((a, b) => b.frac - a.frac);
  let ri = 0;
  while (assigned < n) {
    counts[remainders[ri % remainders.length].idx]++;
    assigned++;
    ri++;
  }

  for (let i = 0; i < targets.length; i++) {
    for (let j = 0; j < counts[i]; j++) {
      shapes.push(targets[i][0]);
    }
  }

  return rng.shuffle(shapes);
}

function pickTemplate(
  pools: TemplatePools,
  cluster: Cluster,
  wantModifier: boolean,
  wantGeo: boolean,
  canUseModifier: boolean,
  canUseGeo: boolean,
  rng: ReturnType<typeof seededRng>
): PromptTemplate {
  if (wantModifier && canUseModifier && pools.modifier[cluster].length > 0) {
    return rng.pick(pools.modifier[cluster]);
  }

  if (wantGeo && canUseGeo && pools.geo[cluster].length > 0) {
    return rng.pick(pools.geo[cluster]);
  }

  const all = [
    ...pools.generic[cluster],
    ...(canUseGeo ? pools.geo[cluster] : []),
  ];

  if (all.length > 0) {
    return rng.pick(all);
  }

  return getFallbackTemplate(cluster);
}

function extractPlaceholders(text: string): string[] {
  const matches = text.match(/\{(\w+)\}/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.slice(1, -1)))];
}

function fillSlot(
  placeholder: string,
  bank: SlotBank,
  rng: ReturnType<typeof seededRng>,
  personaType: PersonaType
): string | null {
  switch (placeholder) {
    case "category":
      return bank.category_terms[0]?.display ?? null;
    case "vertical":
      return bank.vertical_terms.length > 0
        ? rng.pick(bank.vertical_terms).display
        : null;
    case "service":
      if (bank.service_terms.length === 0) return null;
      return ensureServiceVerb(
        rng.pick(bank.service_terms).display,
        personaType,
        rng.pick
      );
    case "modifier":
      return bank.modifier_terms.length > 0
        ? rng.pick(bank.modifier_terms).display
        : null;
    case "geo":
      return bank.geo_terms.length > 0
        ? rng.pick(bank.geo_terms).display
        : null;
    case "budget_adj":
      return bank.budget_adjs.length > 0
        ? rng.pick(bank.budget_adjs).display
        : null;
    default:
      return null;
  }
}

function fillTemplate(text: string, slots: Record<string, string>): string {
  let result = text.replace(/\{(\w+)\}/g, (_, key) => slots[key] ?? `{${key}}`);
  result = result.replace(/\ba\s+([aeiouAEIOU])/g, "an $1");
  return result;
}

import { classifyTier, type TierLabel } from "./tier-classifier";

interface RawRun {
  prompt_id: string;
  prompt_text?: string;
  cluster: string;
  engine: string;
  raw_text: string;
  citations?: { url: string; title?: string }[];
  candidates: any[];
  brand_found: boolean;
  brand_rank: number | null;
}

interface SegmentData {
  persona: string;
  seedType: string;
  customerType: string;
  location: string;
  resultCount: number;
  prompts: any[] | null;
  scoringResult: {
    score: {
      appearance_rate: number;
      primary_rate: number;
      avg_rank: number | null;
      valid_runs: number;
      competitors: { name: string; share: number; appearances: number }[];
      engine_breakdown: Record<string, { appearance_rate: number; primary_rate: number; valid_runs: number; total_runs: number; error_runs: number }>;
    };
    raw_runs: RawRun[];
  } | null;
}

export interface TeaserData {
  meta: {
    brandName: string;
    date: string;
    totalQueries: number;
    queriesPerEngine: number;
  };
  overallScore: {
    appearanceRate: number;
    avgRank: number | null;
    primaryRate: number;
    marketRank: number;
    competitorCount: number;
    leaderName: string;
    leaderRate: number;
  };
  engineSplit: Array<{
    engine: string;
    label: string;
    appearanceRate: number;
    primaryRate: number;
    color: "green" | "gold" | "red";
    note: string;
  }>;
  competitiveRanking: Array<{
    rank: number;
    name: string;
    share: number;
    isBrand: boolean;
  }>;
  proximityNote: string;
  segmentBreakdown: Array<{
    label: string;
    brandRank: number;
    brandVisibility: number;
    leaderName: string;
    leaderScore: number;
    gapPoints: number;
    opportunity: "high" | "closeable" | "stretch";
  }>;
  quoteContrast: {
    competitors: Array<{
      rank: number;
      name: string;
      sentence: string;
      engines: string[];
    }>;
    brand: {
      sentence: string | null;
      hasSentence: boolean;
    };
  };
  authorityGap: {
    domains: Array<{
      domain: string;
      tier: string;
      description: string;
      presence: Record<string, boolean>;
    }>;
    brandAbsentCount: number;
    totalT1Count: number;
  };
  brandVoice: Array<{
    engine: string;
    engineLabel: string;
    prompt: string;
    quote: string;
    problem: string;
    isStrong: boolean;
  }>;
  samplePrompts: Array<{
    promptText: string;
    brandRank: number | null;
    brandFound: boolean;
    winnerName: string;
    winnerRank: number;
  }>;
  socialThreads: Array<{
    platform: string;
    title: string;
    competitorsMentioned: string[];
    brandMentioned: boolean;
    engines: string[];
  }>;
  citationFootprint: {
    brandSources: number;
    leaderSources: number;
    leaderName: string;
    thirdPartyDomains: number;
    socialMentions: number;
  };
}

const ENGINE_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  claude: "Claude",
};

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function buildSegmentLabel(seg: SegmentData): string {
  const parts: string[] = [];
  if (seg.persona) parts.push(seg.persona.replace(/_/g, " "));
  if (seg.customerType) parts.push(`for ${seg.customerType}`);
  if (seg.location) parts.push(`in ${seg.location}`);
  return parts.join(" ") || "General";
}

function extractBrandSentences(runs: RawRun[], brandName: string): Map<string, string[]> {
  const engineSentences = new Map<string, string[]>();
  const brandLC = brandName.toLowerCase();

  for (const run of runs) {
    if (!run.brand_found || !run.raw_text) continue;
    const sentences = run.raw_text.split(/[.!?]+/).filter(s => s.toLowerCase().includes(brandLC));
    const cleaned = sentences.map(s => s.trim()).filter(s => s.length > 30 && s.length < 300);
    if (cleaned.length > 0) {
      const existing = engineSentences.get(run.engine) || [];
      existing.push(...cleaned);
      engineSentences.set(run.engine, existing);
    }
  }
  return engineSentences;
}

function extractCompetitorDefiningSentence(runs: RawRun[], compName: string): { sentence: string; engines: string[] } {
  const compLC = compName.toLowerCase();
  const engineSentences: Record<string, string[]> = {};

  for (const run of runs) {
    if (!run.raw_text) continue;
    const sentences = run.raw_text.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.toLowerCase().includes(compLC) && s.length > 40 && s.length < 300);

    if (sentences.length > 0) {
      if (!engineSentences[run.engine]) engineSentences[run.engine] = [];
      engineSentences[run.engine].push(...sentences);
    }
  }

  const engines = Object.keys(engineSentences);
  const allSentences = Object.values(engineSentences).flat();

  if (allSentences.length === 0) {
    return { sentence: `Mentioned across AI responses but no consistent defining narrative extracted.`, engines: [] };
  }

  const sorted = allSentences
    .map(s => ({
      text: s,
      score: s.length + (s.includes("award") ? 20 : 0) + (s.includes("specialist") ? 15 : 0) +
             (s.includes("leading") ? 15 : 0) + (s.includes("expertise") ? 10 : 0) +
             (s.includes("known for") ? 20 : 0) + (s.includes("recognised") ? 15 : 0) +
             (s.includes("recognized") ? 15 : 0) + (s.includes("top") ? 10 : 0),
    }))
    .sort((a, b) => b.score - a.score);

  let best = sorted[0].text;
  if (!best.startsWith('"')) best = `"${best}"`;
  else if (!best.endsWith('"')) best = `${best}"`;

  return { sentence: best, engines };
}

function generateEngineNote(engine: string, label: string, rate: number, primaryRate: number, brandName: string): string {
  const pctTop3 = Math.round(primaryRate * 100);
  if (rate >= 0.7) {
    return `<strong>${pctTop3}% Top-3 rate.</strong> ${label} is ${brandName}'s strongest platform — near-perfect performance.`;
  } else if (rate >= 0.3) {
    return `<strong>${pctTop3}% Top-3 rate.</strong> Mentioned but rarely prioritised. ${label} is widely used for buyer research.`;
  } else if (rate > 0) {
    return `<strong>${pctTop3}% Top-3 rate.</strong> Near-invisible. ${label} is a fast-growing AI platform — this gap compounds every month.`;
  }
  return `<strong>0% appearance.</strong> ${brandName} does not appear in ${label} responses at all. Critical blind spot.`;
}

function generateVoiceProblem(quote: string, isStrong: boolean, brandName: string): string {
  if (isStrong) {
    return `<strong style="color: var(--green);">Strongest engine for ${brandName}.</strong> This description assigns a clearer identity with specific capabilities. The full report shows how to replicate this language pattern on other engines.`;
  }
  const hasGeneric = /full.?service|based in|offering|experience across|multiple verticals/i.test(quote);
  const hasNoProof = !/award|recognised|recognized|certified|partner|leading|top|best|specialist/i.test(quote);

  if (hasGeneric && hasNoProof) {
    return `<strong>Problem:</strong> Functionally accurate, but generic. No differentiator, no proof point, no reason to choose ${brandName} over any other agency. The description triggers no selection.`;
  }
  if (hasGeneric) {
    return `<strong>Problem:</strong> Generic positioning. The description could apply to dozens of competitors. No unique value proposition is being communicated to AI engines.`;
  }
  if (hasNoProof) {
    return `<strong>Problem:</strong> No evidence or proof points. Competitors are described with awards, certifications, and specific expertise. ${brandName}'s description lacks any credibility signals.`;
  }
  return `<strong>Problem:</strong> The description is adequate but lacks the specificity and authority signals that top-ranked competitors receive. Compare to how AI describes the market leader.`;
}

function shouldMergeNames(a: string, b: string): boolean {
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();
  if (na === nb) return true;
  const ta = na.split(/\s+/);
  const tb = nb.split(/\s+/);
  if (ta.every(t => tb.includes(t))) return true;
  if (tb.every(t => ta.includes(t))) return true;
  if (na.length >= 4) {
    const re = new RegExp(`\\b${na.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (re.test(nb)) return true;
  }
  if (nb.length >= 4) {
    const re = new RegExp(`\\b${nb.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (re.test(na)) return true;
  }
  return false;
}

function deduplicateCompMap(compMap: Map<string, number>): Map<string, number> {
  const entries = [...compMap.entries()].sort((a, b) => b[1] - a[1]);
  const merged = new Map<string, number>();
  const consumed = new Set<string>();

  for (const [nameA, countA] of entries) {
    if (consumed.has(nameA)) continue;
    let total = countA;
    let bestName = nameA;

    for (const [nameB, countB] of entries) {
      if (nameB === nameA || consumed.has(nameB)) continue;
      if (shouldMergeNames(nameA, nameB)) {
        total += countB;
        consumed.add(nameB);
        if (nameB.length < bestName.length) bestName = nameB;
      }
    }

    consumed.add(nameA);
    merged.set(bestName, total);
  }
  return merged;
}

export function generateTeaserData(
  session: { id: number; brandName: string; brandDomain?: string | null; createdAt?: string; segments: SegmentData[]; citationReport?: any },
): TeaserData {
  const segments = Array.isArray(session.segments) ? session.segments.filter(s => s.scoringResult) : [];
  const brandName = session.brandName;
  const brandNameLC = brandName.toLowerCase();

  let totalWeightedAppearance = 0;
  let totalWeightedPrimary = 0;
  let totalValidRuns = 0;
  const allRanks: number[] = [];
  const allRuns: RawRun[] = [];

  const globalCompMap = new Map<string, number>();

  for (const seg of segments) {
    const score = seg.scoringResult!.score;
    const vr = score.valid_runs || 0;
    totalWeightedAppearance += score.appearance_rate * vr;
    totalWeightedPrimary += (score.primary_rate || 0) * vr;
    totalValidRuns += vr;

    const runs = seg.scoringResult!.raw_runs || [];
    allRuns.push(...runs);

    for (const run of runs) {
      if (run.brand_found && run.brand_rank != null) {
        allRanks.push(run.brand_rank);
      }
    }

    for (const c of score.competitors || []) {
      globalCompMap.set(c.name, (globalCompMap.get(c.name) || 0) + c.appearances);
    }
  }

  const overallAppearance = totalValidRuns > 0 ? totalWeightedAppearance / totalValidRuns : 0;
  const overallPrimary = totalValidRuns > 0 ? totalWeightedPrimary / totalValidRuns : 0;
  const overallAvgRank = allRanks.length > 0 ? allRanks.reduce((a, b) => a + b, 0) / allRanks.length : null;

  const brandAppearances = allRuns.filter(r => r.brand_found).length;
  const brandShare = totalValidRuns > 0 ? brandAppearances / totalValidRuns : 0;

  const dedupedCompMap = deduplicateCompMap(globalCompMap);

  const allBrands = [...Array.from(dedupedCompMap.entries())
    .filter(([name]) => !name.toLowerCase().includes(brandNameLC) && !brandNameLC.includes(name.toLowerCase()))
    .map(([name, appearances]) => ({ name, share: totalValidRuns > 0 ? appearances / totalValidRuns : 0, appearances, isBrand: false })),
    { name: brandName, share: brandShare, appearances: brandAppearances, isBrand: true },
  ].sort((a, b) => b.appearances - a.appearances);

  const marketRank = allBrands.findIndex(b => b.isBrand) + 1;
  const leaderBrand = allBrands[0];
  const competitorCount = allBrands.filter(b => !b.isBrand).length;

  const competitiveRanking = allBrands.slice(0, 10).map((b, i) => ({
    rank: i + 1,
    name: b.name,
    share: Math.round(b.share * 100),
    isBrand: b.isBrand,
  }));

  let proximityNote = "";
  const brandIdx = allBrands.findIndex(b => b.isBrand);
  if (brandIdx > 0) {
    const above = allBrands[brandIdx - 1];
    const gap = Math.round((above.share - brandShare) * 100);
    const leaderGap = Math.round((leaderBrand.share - brandShare) * 100);
    proximityNote = `${gap}pt${gap !== 1 ? "s" : ""} from #${brandIdx}. The gap to #1 is ${leaderGap}pts.`;
  }

  const engineAgg: Record<string, { totalApp: number; totalPrimary: number; totalValid: number }> = {};
  for (const seg of segments) {
    const eb = seg.scoringResult!.score.engine_breakdown;
    for (const [eng, stats] of Object.entries(eb)) {
      if (!engineAgg[eng]) engineAgg[eng] = { totalApp: 0, totalPrimary: 0, totalValid: 0 };
      engineAgg[eng].totalApp += stats.appearance_rate * stats.valid_runs;
      engineAgg[eng].totalPrimary += stats.primary_rate * stats.valid_runs;
      engineAgg[eng].totalValid += stats.valid_runs;
    }
  }

  const engineSplit = Object.entries(engineAgg)
    .map(([eng, agg]) => {
      const rate = agg.totalValid > 0 ? agg.totalApp / agg.totalValid : 0;
      const pr = agg.totalValid > 0 ? agg.totalPrimary / agg.totalValid : 0;
      return {
        engine: eng,
        label: ENGINE_LABELS[eng] || eng,
        appearanceRate: rate,
        primaryRate: pr,
        color: (rate >= 0.7 ? "green" : rate >= 0.3 ? "gold" : "red") as "green" | "gold" | "red",
        note: generateEngineNote(eng, ENGINE_LABELS[eng] || eng, rate, pr, brandName),
      };
    })
    .sort((a, b) => b.appearanceRate - a.appearanceRate);

  const segmentBreakdown = segments.map(seg => {
    const score = seg.scoringResult!.score;
    const rawComps = score.competitors || [];
    const dedupedSegComps: typeof rawComps = [];
    const segConsumed = new Set<number>();
    const sortedRawComps = [...rawComps].sort((a, b) => b.appearances - a.appearances);
    for (let i = 0; i < sortedRawComps.length; i++) {
      if (segConsumed.has(i)) continue;
      let merged = { ...sortedRawComps[i] };
      for (let j = i + 1; j < sortedRawComps.length; j++) {
        if (segConsumed.has(j)) continue;
        if (shouldMergeNames(merged.name, sortedRawComps[j].name)) {
          merged.appearances += sortedRawComps[j].appearances;
          merged.share = score.valid_runs > 0 ? Math.min(merged.appearances / score.valid_runs, 1) : 0;
          if (sortedRawComps[j].name.length < merged.name.length) merged.name = sortedRawComps[j].name;
          segConsumed.add(j);
        }
      }
      segConsumed.add(i);
      dedupedSegComps.push(merged);
    }
    const competitors = dedupedSegComps.sort((a, b) => b.appearances - a.appearances);
    const brandApp = (seg.scoringResult!.raw_runs || []).filter(r => r.brand_found).length;
    const brandVis = score.valid_runs > 0 ? brandApp / score.valid_runs : 0;

    const allInSeg = [
      ...competitors.filter(c => !c.name.toLowerCase().includes(brandNameLC) && !brandNameLC.includes(c.name.toLowerCase())),
      { name: brandName, share: brandVis, appearances: brandApp },
    ].sort((a, b) => b.appearances - a.appearances);

    const bIdx = allInSeg.findIndex(b => b.name === brandName);
    const leader = allInSeg[0];
    const gapPts = Math.round((leader.share - brandVis) * 100);

    let opportunity: "high" | "closeable" | "stretch" = "stretch";
    if (gapPts <= 15) opportunity = "high";
    else if (gapPts <= 30) opportunity = "closeable";

    return {
      label: buildSegmentLabel(seg),
      brandRank: bIdx + 1,
      brandVisibility: Math.round(brandVis * 100),
      leaderName: leader.name,
      leaderScore: Math.round(leader.share * 100),
      gapPoints: gapPts,
      opportunity,
    };
  });

  const topCompetitorNames = allBrands.filter(b => !b.isBrand).slice(0, 3).map(b => b.name);
  const quoteContrastCompetitors = topCompetitorNames.map((name, i) => {
    const { sentence, engines } = extractCompetitorDefiningSentence(allRuns, name);
    return {
      rank: i + 1,
      name,
      sentence,
      engines: engines.map(e => ENGINE_LABELS[e] || e),
    };
  });

  const brandSentences = extractBrandSentences(allRuns, brandName);
  const allBrandSentences = Array.from(brandSentences.values()).flat();
  let brandDefining: string | null = null;
  if (allBrandSentences.length > 0) {
    const sorted = allBrandSentences
      .map(s => ({ text: s, len: s.length }))
      .sort((a, b) => b.len - a.len);
    brandDefining = sorted[0].text;
  }

  const citDomainBrandMap = new Map<string, { tier: string; brands: Set<string> }>();
  const socialDomains = new Set(["reddit.com", "youtube.com", "quora.com", "twitter.com", "x.com", "linkedin.com", "tiktok.com"]);

  for (const run of allRuns) {
    if (!run.citations) continue;
    const candidates = Array.isArray(run.candidates) ? run.candidates : [];
    const mentionedBrands: string[] = [];
    for (const cand of candidates) {
      const cn = typeof cand === "string" ? cand : (cand?.name_raw || cand?.name || "");
      if (cn) mentionedBrands.push(cn);
    }
    if (run.brand_found) mentionedBrands.push(brandName);

    for (const cit of run.citations) {
      if (!cit.url) continue;
      const domain = extractDomain(cit.url);
      if (!citDomainBrandMap.has(domain)) {
        const allCompNames = allBrands.map(b => b.name);
        citDomainBrandMap.set(domain, { tier: classifyTier(domain, brandName, allCompNames), brands: new Set() });
      }
      const entry = citDomainBrandMap.get(domain)!;
      for (const mb of mentionedBrands) entry.brands.add(mb);
    }
  }

  const authorityDomains = Array.from(citDomainBrandMap.entries())
    .filter(([, d]) => d.tier === "T1" || d.tier === "T2")
    .sort((a, b) => {
      const tierOrder: Record<string, number> = { T1: 0, T2: 1 };
      return (tierOrder[a[1].tier] || 2) - (tierOrder[b[1].tier] || 2) || b[1].brands.size - a[1].brands.size;
    })
    .slice(0, 7);

  const topNamesForAuth = [...topCompetitorNames.slice(0, 3), brandName];
  const authorityGapDomains = authorityDomains.map(([domain, data]) => {
    const presence: Record<string, boolean> = {};
    for (const name of topNamesForAuth) {
      const nameLC = name.toLowerCase();
      presence[name] = Array.from(data.brands).some(b =>
        b.toLowerCase().includes(nameLC) || nameLC.includes(b.toLowerCase())
      );
    }
    let description = "";
    if (data.tier === "T1") description = "T1 · High-authority source frequently cited by AI engines";
    else description = "T2 · Mid-tier platform with notable AI retrieval weight";
    return { domain, tier: data.tier, description, presence };
  });

  let brandAbsentCount = 0;
  for (const d of authorityGapDomains) {
    if (!d.presence[brandName]) brandAbsentCount++;
  }

  const brandVoice: TeaserData["brandVoice"] = [];
  const engineOrder = ["chatgpt", "gemini", "claude"];
  const usedEngines = new Set<string>();

  for (const eng of engineOrder) {
    if (usedEngines.size >= 3) break;
    const engineRuns = allRuns.filter(r => r.engine === eng && r.brand_found && r.raw_text);
    if (engineRuns.length === 0) continue;

    const run = engineRuns[0];
    const sentences = run.raw_text.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.toLowerCase().includes(brandNameLC) && s.length > 30 && s.length < 300);

    if (sentences.length === 0) continue;
    const bestQuote = sentences.sort((a, b) => b.length - a.length)[0];

    const engineRate = engineAgg[eng] ? (engineAgg[eng].totalValid > 0 ? engineAgg[eng].totalApp / engineAgg[eng].totalValid : 0) : 0;
    const isStrong = engineRate >= 0.7;

    brandVoice.push({
      engine: eng,
      engineLabel: ENGINE_LABELS[eng] || eng,
      prompt: run.prompt_text || run.prompt_id || "AI search query",
      quote: `"${bestQuote.replace(/^[""]|[""]$/g, "")}"`,
      problem: generateVoiceProblem(bestQuote, isStrong, brandName),
      isStrong,
    });
    usedEngines.add(eng);
  }

  const samplePrompts: TeaserData["samplePrompts"] = [];
  const seenPrompts = new Set<string>();
  for (const run of allRuns) {
    if (samplePrompts.length >= 6) break;
    const pt = run.prompt_text || run.prompt_id;
    if (!pt || seenPrompts.has(pt)) continue;
    seenPrompts.add(pt);

    const candidates = Array.isArray(run.candidates) ? run.candidates : [];
    let winnerName = "Unknown";
    let winnerRank = 1;
    if (candidates.length > 0) {
      const sorted = [...candidates].sort((a: any, b: any) => (a.rank || 99) - (b.rank || 99));
      const top = sorted[0];
      winnerName = typeof top === "string" ? top : (top?.name_raw || top?.name || "Unknown");
      winnerRank = top?.rank || 1;
    }

    samplePrompts.push({
      promptText: pt,
      brandRank: run.brand_rank,
      brandFound: run.brand_found,
      winnerName,
      winnerRank,
    });
  }

  const socialThreads: TeaserData["socialThreads"] = [];
  const seenUrls = new Set<string>();
  for (const run of allRuns) {
    if (!run.citations || socialThreads.length >= 5) continue;
    for (const cit of run.citations) {
      if (!cit.url || socialThreads.length >= 5) continue;
      const domain = extractDomain(cit.url);
      const rootDomain = domain.split(".").slice(-2).join(".");
      if (!socialDomains.has(rootDomain) || seenUrls.has(cit.url)) continue;
      seenUrls.add(cit.url);

      const candidates = Array.isArray(run.candidates) ? run.candidates : [];
      const compsMentioned = candidates
        .map((c: any) => typeof c === "string" ? c : (c?.name_raw || ""))
        .filter((n: string) => n && !n.toLowerCase().includes(brandNameLC));

      socialThreads.push({
        platform: rootDomain,
        title: cit.title || `${rootDomain} discussion thread`,
        competitorsMentioned: compsMentioned.slice(0, 3),
        brandMentioned: run.brand_found,
        engines: [ENGINE_LABELS[run.engine] || run.engine],
      });
    }
  }

  const brandCitDomains = new Set<string>();
  const leaderCitDomains = new Set<string>();
  const leaderName = leaderBrand?.name || "Leader";
  const leaderLC = leaderName.toLowerCase();
  let socialMentionCount = 0;

  for (const [domain, data] of citDomainBrandMap) {
    const hasBrand = Array.from(data.brands).some(b => b.toLowerCase().includes(brandNameLC) || brandNameLC.includes(b.toLowerCase()));
    const hasLeader = Array.from(data.brands).some(b => b.toLowerCase().includes(leaderLC) || leaderLC.includes(b.toLowerCase()));
    if (hasBrand) {
      brandCitDomains.add(domain);
      const rootDomain = domain.split(".").slice(-2).join(".");
      if (socialDomains.has(rootDomain)) socialMentionCount++;
    }
    if (hasLeader) leaderCitDomains.add(domain);
  }

  const totalQueries = totalValidRuns;
  const engineCount = Object.keys(engineAgg).length;
  const queriesPerEngine = engineCount > 0 ? Math.round(totalValidRuns / engineCount) : 0;

  return {
    meta: {
      brandName,
      date: session.createdAt ? new Date(session.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      totalQueries,
      queriesPerEngine,
    },
    overallScore: {
      appearanceRate: Math.round(overallAppearance * 100),
      avgRank: overallAvgRank ? Math.round(overallAvgRank * 10) / 10 : null,
      primaryRate: Math.round(overallPrimary * 100),
      marketRank,
      competitorCount,
      leaderName: leaderBrand?.name || "",
      leaderRate: Math.round((leaderBrand?.share || 0) * 100),
    },
    engineSplit,
    competitiveRanking,
    proximityNote,
    segmentBreakdown,
    quoteContrast: {
      competitors: quoteContrastCompetitors,
      brand: {
        sentence: brandDefining,
        hasSentence: !!brandDefining,
      },
    },
    authorityGap: {
      domains: authorityGapDomains,
      brandAbsentCount,
      totalT1Count: authorityGapDomains.filter(d => d.tier === "T1").length,
    },
    brandVoice,
    samplePrompts,
    socialThreads,
    citationFootprint: {
      brandSources: brandCitDomains.size,
      leaderSources: leaderCitDomains.size,
      leaderName,
      thirdPartyDomains: brandCitDomains.size,
      socialMentions: socialMentionCount,
    },
  };
}

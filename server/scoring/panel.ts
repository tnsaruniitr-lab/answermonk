import type { Prompt } from "../promptgen/types";

export interface MiniPanelResult {
  full: Prompt[];
  mini: Prompt[];
}

export function selectMicroPanel(prompts: Prompt[]): Prompt[] {
  const byCluster: Record<string, Prompt[]> = {
    direct: [],
    task: [],
    persona: [],
    budget: [],
  };

  for (const p of prompts) {
    if (byCluster[p.cluster]) {
      byCluster[p.cluster].push(p);
    }
  }

  const selected: Prompt[] = [];
  for (const cluster of ["direct", "task", "persona", "budget"]) {
    const pool = byCluster[cluster];
    if (pool.length > 0) {
      selected.push(pool[0]);
    }
  }

  return selected;
}

export function selectMiniPanel(prompts: Prompt[]): Prompt[] {
  const byCluster: Record<string, Prompt[]> = {
    direct: [],
    task: [],
    persona: [],
    budget: [],
  };

  for (const p of prompts) {
    if (byCluster[p.cluster]) {
      byCluster[p.cluster].push(p);
    }
  }

  const selected: Prompt[] = [];

  const directPicks = pickDirect(byCluster.direct);
  const taskPicks = pickTask(byCluster.task);
  const personaPicks = pickPersona(byCluster.persona);
  const budgetPicks = pickBudget(byCluster.budget);

  selected.push(...directPicks, ...taskPicks, ...personaPicks, ...budgetPicks);

  return selected;
}

function pickDirect(prompts: Prompt[]): Prompt[] {
  const result: Prompt[] = [];

  const generic = prompts.find(
    (p) => !p.modifier_included && !p.geo_included && !hasSlot(p, "vertical"),
  );
  if (generic) result.push(generic);

  const withModifier = prompts.find(
    (p) => p.modifier_included && !p.geo_included,
  );
  if (withModifier) result.push(withModifier);
  else if (!generic && prompts.length > 0) result.push(prompts[0]);

  const withGeo = prompts.find(
    (p) => p.geo_included && !p.modifier_included,
  );
  if (withGeo) result.push(withGeo);
  else if (prompts.length > result.length) {
    const remaining = prompts.filter((p) => !result.includes(p));
    if (remaining.length > 0) result.push(remaining[0]);
  }

  while (result.length < 3 && prompts.length > result.length) {
    const remaining = prompts.filter((p) => !result.includes(p));
    if (remaining.length > 0) result.push(remaining[0]);
    else break;
  }

  return result.slice(0, 3);
}

function pickTask(prompts: Prompt[]): Prompt[] {
  const result: Prompt[] = [];

  const generic = prompts.find(
    (p) => !p.modifier_included && !p.geo_included && !hasSlot(p, "vertical"),
  );
  if (generic) result.push(generic);

  const withVertical = prompts.find(
    (p) => hasSlot(p, "vertical") && !p.modifier_included,
  );
  if (withVertical) result.push(withVertical);
  else if (prompts.length > result.length) {
    const remaining = prompts.filter((p) => !result.includes(p));
    if (remaining.length > 0) result.push(remaining[0]);
  }

  const withModifier = prompts.find(
    (p) => p.modifier_included,
  );
  if (withModifier && !result.includes(withModifier)) result.push(withModifier);
  else if (prompts.length > result.length) {
    const remaining = prompts.filter((p) => !result.includes(p));
    if (remaining.length > 0) result.push(remaining[0]);
  }

  while (result.length < 3 && prompts.length > result.length) {
    const remaining = prompts.filter((p) => !result.includes(p));
    if (remaining.length > 0) result.push(remaining[0]);
    else break;
  }

  return result.slice(0, 3);
}

function pickPersona(prompts: Prompt[]): Prompt[] {
  const result: Prompt[] = [];

  const withVertical = prompts.find(
    (p) => hasSlot(p, "vertical") && !p.geo_included,
  );
  if (withVertical) result.push(withVertical);

  const withVerticalGeo = prompts.find(
    (p) => hasSlot(p, "vertical") && p.geo_included,
  );
  if (withVerticalGeo) result.push(withVerticalGeo);
  else if (prompts.length > result.length) {
    const remaining = prompts.filter((p) => !result.includes(p));
    if (remaining.length > 0) result.push(remaining[0]);
  }

  while (result.length < 2 && prompts.length > result.length) {
    const remaining = prompts.filter((p) => !result.includes(p));
    if (remaining.length > 0) result.push(remaining[0]);
    else break;
  }

  return result.slice(0, 2);
}

function pickBudget(prompts: Prompt[]): Prompt[] {
  const result: Prompt[] = [];

  const generic = prompts.find(
    (p) => !hasSlot(p, "vertical"),
  );
  if (generic) result.push(generic);

  const withVertical = prompts.find(
    (p) => hasSlot(p, "vertical"),
  );
  if (withVertical) result.push(withVertical);
  else if (prompts.length > result.length) {
    const remaining = prompts.filter((p) => !result.includes(p));
    if (remaining.length > 0) result.push(remaining[0]);
  }

  while (result.length < 2 && prompts.length > result.length) {
    const remaining = prompts.filter((p) => !result.includes(p));
    if (remaining.length > 0) result.push(remaining[0]);
    else break;
  }

  return result.slice(0, 2);
}

function hasSlot(prompt: Prompt, slotType: string): boolean {
  return slotType in prompt.slots_used;
}

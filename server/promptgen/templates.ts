import type { Cluster, PersonaType } from "./types";

export interface PromptTemplate {
  id: string;
  cluster: Cluster;
  text: string;
  has_modifier: boolean;
  has_geo: boolean;
  persona: PersonaType | "both";
}

const SHAPE_SUFFIXES: Record<string, string> = {
  open: "",
  top3: " List the top 3.",
  top5: " List the top 5.",
  best: " Who is the best?",
};

export function getShapeSuffix(shape: string): string {
  return SHAPE_SUFFIXES[shape] || "";
}

const TEMPLATES: PromptTemplate[] = [
  // ========== DIRECT CLUSTER ==========
  // Generic
  { id: "direct_01", cluster: "direct", text: "best {category} for {vertical}", has_modifier: false, has_geo: false, persona: "both" },
  { id: "direct_02", cluster: "direct", text: "top {category} for {vertical}", has_modifier: false, has_geo: false, persona: "both" },
  { id: "direct_03", cluster: "direct", text: "best {category} for {vertical} businesses", has_modifier: false, has_geo: false, persona: "both" },
  { id: "direct_04", cluster: "direct", text: "recommended {category} for {vertical}", has_modifier: false, has_geo: false, persona: "both" },
  { id: "direct_05", cluster: "direct", text: "leading {category} for {vertical}", has_modifier: false, has_geo: false, persona: "both" },
  // Geo
  { id: "direct_06", cluster: "direct", text: "best {category} in {geo}", has_modifier: false, has_geo: true, persona: "both" },
  { id: "direct_07", cluster: "direct", text: "top {category} near {geo}", has_modifier: false, has_geo: true, persona: "both" },
  { id: "direct_08", cluster: "direct", text: "best {category} for {vertical} in {geo}", has_modifier: false, has_geo: true, persona: "both" },
  // Modifier - marketing
  { id: "direct_09", cluster: "direct", text: "best {modifier} agency for {vertical}", has_modifier: true, has_geo: false, persona: "marketing_agency" },
  { id: "direct_10", cluster: "direct", text: "best {modifier} agency", has_modifier: true, has_geo: false, persona: "marketing_agency" },
  { id: "direct_11", cluster: "direct", text: "top {modifier} agency for {vertical}", has_modifier: true, has_geo: false, persona: "marketing_agency" },
  { id: "direct_12", cluster: "direct", text: "best {modifier} agency in {geo}", has_modifier: true, has_geo: true, persona: "marketing_agency" },
  // Modifier - automation
  { id: "direct_13", cluster: "direct", text: "best {modifier} consultant", has_modifier: true, has_geo: false, persona: "automation_consultant" },
  { id: "direct_14", cluster: "direct", text: "best {modifier} expert for {vertical}", has_modifier: true, has_geo: false, persona: "automation_consultant" },
  { id: "direct_15", cluster: "direct", text: "top {modifier} automation specialist", has_modifier: true, has_geo: false, persona: "automation_consultant" },
  { id: "direct_16", cluster: "direct", text: "best {modifier} consultant in {geo}", has_modifier: true, has_geo: true, persona: "automation_consultant" },

  // ========== PERSONA CLUSTER ==========
  // Generic
  { id: "persona_01", cluster: "persona", text: "recommend a {category} who specializes in {vertical}", has_modifier: false, has_geo: false, persona: "both" },
  { id: "persona_02", cluster: "persona", text: "looking for a {category} that works with {vertical}", has_modifier: false, has_geo: false, persona: "both" },
  { id: "persona_03", cluster: "persona", text: "which {category} is best for {vertical}", has_modifier: false, has_geo: false, persona: "both" },
  { id: "persona_04", cluster: "persona", text: "find me a {category} experienced with {vertical}", has_modifier: false, has_geo: false, persona: "both" },
  { id: "persona_05", cluster: "persona", text: "I need a {category} for my {vertical} business", has_modifier: false, has_geo: false, persona: "both" },
  // Geo
  { id: "persona_06", cluster: "persona", text: "recommend a {category} in {geo} for {vertical}", has_modifier: false, has_geo: true, persona: "both" },
  { id: "persona_07", cluster: "persona", text: "looking for a {category} in {geo}", has_modifier: false, has_geo: true, persona: "both" },
  // Modifier - marketing
  { id: "persona_08", cluster: "persona", text: "who can help with {modifier} for {vertical}", has_modifier: true, has_geo: false, persona: "marketing_agency" },
  { id: "persona_09", cluster: "persona", text: "recommend a {modifier} specialist for {vertical}", has_modifier: true, has_geo: false, persona: "marketing_agency" },
  { id: "persona_10", cluster: "persona", text: "I need someone who does {modifier} for {vertical}", has_modifier: true, has_geo: false, persona: "marketing_agency" },
  // Modifier - automation
  { id: "persona_11", cluster: "persona", text: "who can help me with {modifier} automation for {vertical}", has_modifier: true, has_geo: false, persona: "automation_consultant" },
  { id: "persona_12", cluster: "persona", text: "recommend a {modifier} specialist for {vertical}", has_modifier: true, has_geo: false, persona: "automation_consultant" },

  // ========== BUDGET CLUSTER ==========
  // Generic (no modifiers in budget cluster per design)
  { id: "budget_01", cluster: "budget", text: "{budget_adj} {category} for {vertical}", has_modifier: false, has_geo: false, persona: "both" },
  { id: "budget_02", cluster: "budget", text: "find a {budget_adj} {category} for {vertical}", has_modifier: false, has_geo: false, persona: "both" },
  { id: "budget_03", cluster: "budget", text: "{budget_adj} {category} that works with {vertical}", has_modifier: false, has_geo: false, persona: "both" },
  { id: "budget_04", cluster: "budget", text: "best {budget_adj} {category}", has_modifier: false, has_geo: false, persona: "both" },
  { id: "budget_05", cluster: "budget", text: "{budget_adj} {category} for small {vertical} businesses", has_modifier: false, has_geo: false, persona: "both" },
  // Geo
  { id: "budget_06", cluster: "budget", text: "{budget_adj} {category} in {geo}", has_modifier: false, has_geo: true, persona: "both" },
  { id: "budget_07", cluster: "budget", text: "{budget_adj} {category} for {vertical} in {geo}", has_modifier: false, has_geo: true, persona: "both" },
  { id: "budget_08", cluster: "budget", text: "find a {budget_adj} {category} near {geo}", has_modifier: false, has_geo: true, persona: "both" },

  // ========== TASK CLUSTER ==========
  // Generic
  { id: "task_01", cluster: "task", text: "hire someone to {service} for {vertical}", has_modifier: false, has_geo: false, persona: "both" },
  { id: "task_02", cluster: "task", text: "who can {service} for {vertical}", has_modifier: false, has_geo: false, persona: "both" },
  { id: "task_03", cluster: "task", text: "find an expert to {service}", has_modifier: false, has_geo: false, persona: "both" },
  { id: "task_04", cluster: "task", text: "best provider to {service} for {vertical}", has_modifier: false, has_geo: false, persona: "both" },
  { id: "task_05", cluster: "task", text: "looking for help with {service} for {vertical}", has_modifier: false, has_geo: false, persona: "both" },
  // Geo
  { id: "task_06", cluster: "task", text: "hire someone to {service} in {geo}", has_modifier: false, has_geo: true, persona: "both" },
  { id: "task_07", cluster: "task", text: "who can {service} for {vertical} in {geo}", has_modifier: false, has_geo: true, persona: "both" },
  // Modifier - marketing
  { id: "task_08", cluster: "task", text: "hire someone to {service} using {modifier}", has_modifier: true, has_geo: false, persona: "marketing_agency" },
  { id: "task_09", cluster: "task", text: "who can {service} with {modifier} for {vertical}", has_modifier: true, has_geo: false, persona: "marketing_agency" },
  // Modifier - automation
  { id: "task_10", cluster: "task", text: "hire a {modifier} expert to {service}", has_modifier: true, has_geo: false, persona: "automation_consultant" },
  { id: "task_11", cluster: "task", text: "who can build a {modifier} workflow to {service}", has_modifier: true, has_geo: false, persona: "automation_consultant" },
  { id: "task_12", cluster: "task", text: "{modifier} expert to {service} for {vertical}", has_modifier: true, has_geo: false, persona: "automation_consultant" },
  { id: "task_13", cluster: "task", text: "find someone who uses {modifier} to {service}", has_modifier: true, has_geo: false, persona: "automation_consultant" },
];

const FALLBACK_TEMPLATES: Record<Cluster, PromptTemplate> = {
  direct: { id: "fallback_direct", cluster: "direct", text: "best {category}", has_modifier: false, has_geo: false, persona: "both" },
  persona: { id: "fallback_persona", cluster: "persona", text: "recommend a {category}", has_modifier: false, has_geo: false, persona: "both" },
  budget: { id: "fallback_budget", cluster: "budget", text: "{budget_adj} {category}", has_modifier: false, has_geo: false, persona: "both" },
  task: { id: "fallback_task", cluster: "task", text: "find an expert to {service}", has_modifier: false, has_geo: false, persona: "both" },
};

export function getFallbackTemplate(cluster: Cluster): PromptTemplate {
  return FALLBACK_TEMPLATES[cluster];
}

export interface TemplatePools {
  generic: Record<Cluster, PromptTemplate[]>;
  modifier: Record<Cluster, PromptTemplate[]>;
  geo: Record<Cluster, PromptTemplate[]>;
}

export function buildTemplatePools(personaType: PersonaType): TemplatePools {
  const clusters: Cluster[] = ["direct", "persona", "budget", "task"];
  const eligible = TEMPLATES.filter(
    (t) => t.persona === "both" || t.persona === personaType
  );

  const pools: TemplatePools = {
    generic: { direct: [], persona: [], budget: [], task: [] },
    modifier: { direct: [], persona: [], budget: [], task: [] },
    geo: { direct: [], persona: [], budget: [], task: [] },
  };

  for (const cluster of clusters) {
    const clusterTemplates = eligible.filter((t) => t.cluster === cluster);
    for (const t of clusterTemplates) {
      if (t.has_modifier) {
        pools.modifier[cluster].push(t);
      }
      if (t.has_geo) {
        pools.geo[cluster].push(t);
      }
      if (!t.has_modifier && !t.has_geo) {
        pools.generic[cluster].push(t);
      }
    }
  }

  return pools;
}

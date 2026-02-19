import type { Cluster, PersonaType } from "./types";

export interface PromptTemplate {
  id: string;
  cluster: Cluster;
  text: string;
  has_modifier: boolean;
  has_geo: boolean;
  persona: PersonaType | "both";
}

export function getAdvancedPrefix(count: number = 10): string {
  return `Find, list and rank ${count}`;
}

export const ADVANCED_SUFFIX: Record<string, string> = {
  marketing_agency: "Only include independent agencies or regional consultants. Exclude global holding companies, SaaS tools, and software platforms.",
  automation_consultant: "Only include independent agencies or regional consultants. Exclude global holding companies, SaaS tools, and software platforms.",
};

export function getAdvancedSuffix(personaType: PersonaType): string {
  return ADVANCED_SUFFIX[personaType] ?? "";
}

const TEMPLATES: PromptTemplate[] = [
  // ========== DIRECT CLUSTER ==========
  { id: "direct_01", cluster: "direct", text: "{category} for {vertical}", has_modifier: false, has_geo: false, persona: "both" },
  { id: "direct_02", cluster: "direct", text: "{category} for {vertical} businesses", has_modifier: false, has_geo: false, persona: "both" },
  { id: "direct_03", cluster: "direct", text: "{category} specializing in {vertical}", has_modifier: false, has_geo: false, persona: "both" },
  { id: "direct_04", cluster: "direct", text: "{category} for {vertical} in {geo}", has_modifier: false, has_geo: true, persona: "both" },
  { id: "direct_05", cluster: "direct", text: "{category} specializing in {vertical} in {geo}", has_modifier: false, has_geo: true, persona: "both" },
  { id: "direct_06", cluster: "direct", text: "{category} for {vertical} companies in {geo}", has_modifier: false, has_geo: true, persona: "both" },
  { id: "direct_07", cluster: "direct", text: "{modifier} agencies for {vertical}", has_modifier: true, has_geo: false, persona: "marketing_agency" },
  { id: "direct_08", cluster: "direct", text: "{modifier} agencies for {vertical} in {geo}", has_modifier: true, has_geo: true, persona: "marketing_agency" },
  { id: "direct_09", cluster: "direct", text: "{modifier} consultants for {vertical}", has_modifier: true, has_geo: false, persona: "automation_consultant" },
  { id: "direct_10", cluster: "direct", text: "{modifier} experts for {vertical}", has_modifier: true, has_geo: false, persona: "automation_consultant" },
  { id: "direct_11", cluster: "direct", text: "{modifier} consultants for {vertical} in {geo}", has_modifier: true, has_geo: true, persona: "automation_consultant" },

  // ========== PERSONA CLUSTER ==========
  { id: "persona_01", cluster: "persona", text: "{category} who specialize in {vertical}", has_modifier: false, has_geo: false, persona: "both" },
  { id: "persona_02", cluster: "persona", text: "{category} that work with {vertical}", has_modifier: false, has_geo: false, persona: "both" },
  { id: "persona_03", cluster: "persona", text: "{category} experienced with {vertical}", has_modifier: false, has_geo: false, persona: "both" },
  { id: "persona_04", cluster: "persona", text: "{category} for my {vertical} business", has_modifier: false, has_geo: false, persona: "both" },
  { id: "persona_05", cluster: "persona", text: "{category} in {geo} for {vertical}", has_modifier: false, has_geo: true, persona: "both" },
  { id: "persona_06", cluster: "persona", text: "{category} in {geo} that specialize in {vertical}", has_modifier: false, has_geo: true, persona: "both" },
  { id: "persona_07", cluster: "persona", text: "{modifier} specialists for {vertical}", has_modifier: true, has_geo: false, persona: "marketing_agency" },
  { id: "persona_08", cluster: "persona", text: "agencies that do {modifier} for {vertical}", has_modifier: true, has_geo: false, persona: "marketing_agency" },
  { id: "persona_09", cluster: "persona", text: "{modifier} automation specialists for {vertical}", has_modifier: true, has_geo: false, persona: "automation_consultant" },
  { id: "persona_10", cluster: "persona", text: "consultants who do {modifier} for {vertical}", has_modifier: true, has_geo: false, persona: "automation_consultant" },

  // ========== BUDGET CLUSTER ==========
  { id: "budget_01", cluster: "budget", text: "{budget_adj} {category} for {vertical}", has_modifier: false, has_geo: false, persona: "both" },
  { id: "budget_02", cluster: "budget", text: "{budget_adj} {category} that work with {vertical}", has_modifier: false, has_geo: false, persona: "both" },
  { id: "budget_03", cluster: "budget", text: "{budget_adj} {category} for {vertical} startups", has_modifier: false, has_geo: false, persona: "both" },
  { id: "budget_04", cluster: "budget", text: "{budget_adj} {category} for small {vertical} businesses", has_modifier: false, has_geo: false, persona: "both" },
  { id: "budget_05", cluster: "budget", text: "{budget_adj} {category} for {vertical} in {geo}", has_modifier: false, has_geo: true, persona: "both" },
  { id: "budget_06", cluster: "budget", text: "{budget_adj} {category} for {vertical} companies in {geo}", has_modifier: false, has_geo: true, persona: "both" },

  // ========== TASK CLUSTER ==========
  { id: "task_01", cluster: "task", text: "agencies that can {service} for {vertical}", has_modifier: false, has_geo: false, persona: "both" },
  { id: "task_02", cluster: "task", text: "providers that {service} for {vertical}", has_modifier: false, has_geo: false, persona: "both" },
  { id: "task_03", cluster: "task", text: "experts who {service} for {vertical}", has_modifier: false, has_geo: false, persona: "both" },
  { id: "task_04", cluster: "task", text: "agencies that {service} for {vertical} in {geo}", has_modifier: false, has_geo: true, persona: "both" },
  { id: "task_05", cluster: "task", text: "providers that {service} for {vertical} in {geo}", has_modifier: false, has_geo: true, persona: "both" },
  { id: "task_06", cluster: "task", text: "agencies that {service} using {modifier} for {vertical}", has_modifier: true, has_geo: false, persona: "marketing_agency" },
  { id: "task_07", cluster: "task", text: "agencies that {service} with {modifier} for {vertical}", has_modifier: true, has_geo: false, persona: "marketing_agency" },
  { id: "task_08", cluster: "task", text: "{modifier} experts who {service} for {vertical}", has_modifier: true, has_geo: false, persona: "automation_consultant" },
  { id: "task_09", cluster: "task", text: "consultants who use {modifier} to {service} for {vertical}", has_modifier: true, has_geo: false, persona: "automation_consultant" },
  { id: "task_10", cluster: "task", text: "{modifier} experts who {service} for {vertical}", has_modifier: true, has_geo: false, persona: "automation_consultant" },
];

const FALLBACK_TEMPLATES: Record<Cluster, PromptTemplate> = {
  direct: { id: "fallback_direct", cluster: "direct", text: "{category} for {vertical}", has_modifier: false, has_geo: false, persona: "both" },
  persona: { id: "fallback_persona", cluster: "persona", text: "{category} for {vertical}", has_modifier: false, has_geo: false, persona: "both" },
  budget: { id: "fallback_budget", cluster: "budget", text: "{budget_adj} {category} for {vertical}", has_modifier: false, has_geo: false, persona: "both" },
  task: { id: "fallback_task", cluster: "task", text: "experts who {service} for {vertical}", has_modifier: false, has_geo: false, persona: "both" },
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

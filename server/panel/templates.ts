import type { Territory } from "./territories";

export interface PanelPrompt {
  id: string;
  territory_id: string;
  territory_label: string;
  query_type: "task_v1" | "task_v2" | "generic" | "local";
  text: string;
  cluster: string;
}

const BUYER_PHRASES = ["businesses", "companies", "startups", "local businesses", "brands"];
const HIRING_VERBS = ["hire", "work with", "partner with", "outsource to", "engage"];

const VAGUE_INDUSTRIES = new Set([
  "businesses", "companies", "startups", "smes", "brands",
  "clients", "all industries", "various industries",
  "multiple industries", "any industry", "b2b", "b2c",
  "small businesses", "enterprises",
]);

const SUFFIX = "Only list names. Do not include software tools. Only include agencies/consultants, not SaaS products or platforms.";
const LOCAL_PREFERENCE = "Prefer independent agencies or regional firms, not global holding companies.";

function buildIndustryClause(industry: string | null): string {
  if (!industry) return "";
  if (VAGUE_INDUSTRIES.has(industry.toLowerCase().trim())) return "";
  return ` in the ${industry} industry`;
}

function buildIndustryClauseForGeneric(industry: string | null): string {
  if (!industry) return "";
  if (VAGUE_INDUSTRIES.has(industry.toLowerCase().trim())) return "";
  return ` that work with ${industry} brands`;
}

export function generatePanelPrompts(
  territories: Territory[],
  industryPrimary: string | null,
  city: string,
): PanelPrompt[] {
  const prompts: PanelPrompt[] = [];
  const industryClause = buildIndustryClause(industryPrimary);
  const genericIndustryClause = buildIndustryClauseForGeneric(industryPrimary);

  for (const territory of territories) {
    const tid = territory.id;
    const label = territory.label;

    prompts.push({
      id: `${tid}_task_v1`,
      territory_id: tid,
      territory_label: label,
      query_type: "task_v1",
      text: `Give a numbered list of 10 agencies or consultants ${BUYER_PHRASES[0]} ${HIRING_VERBS[0]} to ${territory.taskPhrases[0]}${industryClause}. ${SUFFIX}`,
      cluster: "task",
    });

    prompts.push({
      id: `${tid}_task_v2`,
      territory_id: tid,
      territory_label: label,
      query_type: "task_v2",
      text: `Give a numbered list of 10 agencies or consultants ${BUYER_PHRASES[2]} ${HIRING_VERBS[2]} to ${territory.taskPhrases[1]}${industryClause}. ${SUFFIX}`,
      cluster: "task",
    });

    prompts.push({
      id: `${tid}_generic`,
      territory_id: tid,
      territory_label: label,
      query_type: "generic",
      text: `Give a numbered list of 10 ${territory.categoryPhrase}${genericIndustryClause}. ${SUFFIX}`,
      cluster: "generic",
    });

    prompts.push({
      id: `${tid}_local`,
      territory_id: tid,
      territory_label: label,
      query_type: "local",
      text: `Give a numbered list of 10 agencies or consultants ${BUYER_PHRASES[0]} ${HIRING_VERBS[0]} to ${territory.taskPhrases[0]}${industryClause} in ${city}. ${LOCAL_PREFERENCE} ${SUFFIX}`,
      cluster: "local",
    });
  }

  return prompts;
}

import { pool } from "../db";

export interface PeoplePromptTemplate {
  index: number;
  track: "A" | "B";
  angle: string;
  template: string;
}

export interface PeopleConfig {
  queryRounds: number;
  chatgptModel: string;
  geminiModel: string;
  claudeModel: string;
  webSearch: { chatgpt: boolean; gemini: boolean; claude: boolean };
  maxConcurrentAudits: number;
  budgetCapUsd: number;
  promptTemplates: PeoplePromptTemplate[];
}

export const DEFAULT_PEOPLE_CONFIG: PeopleConfig = {
  queryRounds: 3,
  chatgptModel: "gpt-4o",
  geminiModel: "gemini-2.5-flash",
  claudeModel: "claude-sonnet-4-5",
  webSearch: { chatgpt: true, gemini: true, claude: false },
  maxConcurrentAudits: 3,
  budgetCapUsd: 5.0,
  promptTemplates: [
    {
      index: 1, track: "A", angle: "Full identity",
      template: "Tell me about {{identity_string}}. Who are they, what are they known for, and what is their professional background?",
    },
    {
      index: 2, track: "A", angle: "Role-first",
      template: "Who is {{name}}, the {{role}}? What is their background and what are they known for professionally?",
    },
    {
      index: 3, track: "A", angle: "Company-first",
      template: "Tell me about {{name}} from {{company}}. What is their role, background, and what have they accomplished?",
    },
    {
      index: 4, track: "A", angle: "Expertise framing",
      template: "What is {{name}} known for in {{industry}}? What are their main contributions, expertise areas, and professional reputation?",
    },
    {
      index: 1, track: "B", angle: "Default recognition",
      template: "Who is {{name}}? Tell me who this person is, what they do, and what they are best known for.",
    },
    {
      index: 2, track: "B", angle: "Name landscape",
      template: "Who are the most well-known and notable people named {{name}}? List up to 10 people, numbered 1 through 10 in order of prominence. For each person include their full name, profession, and what they are specifically known for.",
    },
    {
      index: 3, track: "B", angle: "Industry context",
      template: "Who are the leading {{name}}s in {{industry}}? Are there any prominent professionals, entrepreneurs, or public figures with this name in this field?",
    },
  ],
};

export async function getPeopleConfig(): Promise<PeopleConfig> {
  try {
    const { rows } = await pool.query(
      `SELECT value FROM admin_config WHERE key = 'people'`
    );
    if (rows.length === 0) return DEFAULT_PEOPLE_CONFIG;
    const saved = rows[0].value as Partial<PeopleConfig>;
    return {
      ...DEFAULT_PEOPLE_CONFIG,
      ...saved,
      webSearch: { ...DEFAULT_PEOPLE_CONFIG.webSearch, ...(saved.webSearch ?? {}) },
      promptTemplates: saved.promptTemplates ?? DEFAULT_PEOPLE_CONFIG.promptTemplates,
    };
  } catch {
    return DEFAULT_PEOPLE_CONFIG;
  }
}

export async function savePeopleConfig(updates: Partial<PeopleConfig>): Promise<void> {
  const current = await getPeopleConfig();
  const merged: PeopleConfig = {
    ...current,
    ...updates,
    webSearch: { ...current.webSearch, ...(updates.webSearch ?? {}) },
    promptTemplates: updates.promptTemplates ?? current.promptTemplates,
  };
  await pool.query(
    `INSERT INTO admin_config (key, value, updated_at)
     VALUES ('people', $1, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
    [JSON.stringify(merged)]
  );
}

export function fillTemplate(
  template: string,
  vars: {
    name: string;
    role?: string;
    company?: string;
    past_company?: string;
    education?: string;
    industry?: string;
    identity_string?: string;
  }
): string {
  let result = template;

  result = result.replace(/\{\{identity_string\}\}/g, vars.identity_string || vars.name || "");
  result = result.replace(/\{\{name\}\}/g, vars.name || "");
  result = result.replace(/\{\{role\}\}/g, vars.role || "");
  result = result.replace(/\{\{company\}\}/g, vars.company || "");
  result = result.replace(/\{\{past_company\}\}/g, vars.past_company || "");
  result = result.replace(/\{\{education\}\}/g, vars.education || "");
  result = result.replace(/\{\{industry\}\}/g, vars.industry || "their industry");

  result = result
    .replace(/,\s*the\s+[,?.]/g, (m) => m.slice(-1))
    .replace(/\bthe\s+[,?.]/g, (m) => m.slice(-1))
    .replace(/,\s*from\s+[,?.]/g, (m) => m.slice(-1))
    .replace(/\bfrom\s+[,?.]/g, (m) => m.slice(-1))
    .replace(/,\s*,/g, ",")
    .replace(/\s{2,}/g, " ")
    .replace(/,\s*\?/g, "?")
    .replace(/,\s*\./g, ".")
    .trim();

  return result;
}

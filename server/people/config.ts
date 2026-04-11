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
      index: 1, track: "A", angle: "Identity & profile",
      template: `Tell me about {{identity_string}}. Who are they, what are they known for, and what is their professional background? Also provide: (1) a one-sentence definition of who this person is, (2) their key achievements, (3) their professional green flags, and (4) their professional red flags.`,
    },
    {
      index: 1, track: "B", angle: "Name landscape",
      template: `Who are the most well-known and notable people named {{name}}? List as many as you can confidently identify, up to 10 people, numbered in order of prominence. For each person write their full name with a parenthetical disambiguator (e.g. "Jake Stein (Australian footballer)"), their profession, and 1-2 sentences on what they are known for.`,
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

    // Lock both templates — Track A parser extracts structured fields that depend on
    // the prompt's specific questions, and Track B regex parser depends on the numbered
    // list format. Always use the default templates.
    const LOCKED_KEYS = new Set(["A-1", "B-1"]);
    const savedTemplates = saved.promptTemplates ?? [];
    const mergedTemplates = DEFAULT_PEOPLE_CONFIG.promptTemplates.map((def) => {
      const key = `${def.track}-${def.index}`;
      if (LOCKED_KEYS.has(key)) return def;
      const dbTpl = savedTemplates.find((t) => t.track === def.track && t.index === def.index);
      return dbTpl ?? def;
    });
    return {
      ...DEFAULT_PEOPLE_CONFIG,
      ...saved,
      webSearch: { ...DEFAULT_PEOPLE_CONFIG.webSearch, ...(saved.webSearch ?? {}) },
      promptTemplates: mergedTemplates,
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

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface ParsedPerson {
  name: string;
  description: string;
  rank: number;
  urls: string[];
}

export interface ParsedTrackAResult {
  subjectName: string | null;
  statedFacts: { fact: string; value: string; sourceUrl: string | null; status: string }[];
  targetFound: boolean;
  summaryDescription: string;
}

export interface ParsedTrackBResult {
  defaultSubject: string | null;
  defaultDescription: string | null;
  nameLandscape: ParsedPerson[];
  targetFound: boolean;
  targetRank: number | null;
}

export async function parseTrackAResponse(
  rawText: string,
  targetName: string,
  profile: { currentRole?: string | null; currentCompany?: string | null; education?: string[] }
): Promise<ParsedTrackAResult> {
  if (!rawText || rawText.trim().length < 10) {
    return { subjectName: null, statedFacts: [], targetFound: false, summaryDescription: "" };
  }

  try {
    const prompt = `You are analyzing an AI engine's response about a person named "${targetName}".

AI Response:
"""
${rawText.slice(0, 2000)}
"""

Extract structured information. Return JSON with this exact shape:
{
  "subjectName": "full name mentioned, or null if no person found",
  "targetFound": true/false (is this response about ${targetName} specifically?),
  "summaryDescription": "1-2 sentence summary of what the AI said about this person",
  "statedFacts": [
    { "fact": "current_role", "value": "extracted value or empty string", "sourceUrl": null, "status": "stated|not_mentioned" },
    { "fact": "current_company", "value": "extracted value or empty string", "sourceUrl": null, "status": "stated|not_mentioned" },
    { "fact": "education", "value": "extracted value or empty string", "sourceUrl": null, "status": "stated|not_mentioned" },
    { "fact": "location", "value": "extracted value or empty string", "sourceUrl": null, "status": "stated|not_mentioned" },
    { "fact": "expertise", "value": "extracted value or empty string", "sourceUrl": null, "status": "stated|not_mentioned" }
  ]
}

Only return valid JSON, no markdown, no explanation.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 600,
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    return {
      subjectName: parsed.subjectName ?? null,
      statedFacts: parsed.statedFacts ?? [],
      targetFound: Boolean(parsed.targetFound),
      summaryDescription: parsed.summaryDescription ?? "",
    };
  } catch (err) {
    console.error("[parser] Track A parse error:", err);
    const targetFound = rawText.toLowerCase().includes(targetName.toLowerCase().split(" ")[0]);
    return {
      subjectName: targetFound ? targetName : null,
      statedFacts: [],
      targetFound,
      summaryDescription: rawText.slice(0, 200),
    };
  }
}

export async function parseTrackBResponse(
  rawText: string,
  targetName: string,
  queryType: "default" | "landscape" | "industry"
): Promise<ParsedTrackBResult> {
  if (!rawText || rawText.trim().length < 10) {
    return { defaultSubject: null, defaultDescription: null, nameLandscape: [], targetFound: false, targetRank: null };
  }

  try {
    const prompt = `You are analyzing an AI engine's response about people named "${targetName}".

Query type: "${queryType}" (default=who is X, landscape=list all Xs, industry=leading Xs in a field)

AI Response:
"""
${rawText.slice(0, 3000)}
"""

Extract structured information. Return JSON:
{
  "defaultSubject": "primary person described (for 'default' queries), or null",
  "defaultDescription": "brief description of who the AI thinks ${targetName} is (for 'default' queries), or null",
  "nameLandscape": [
    { "name": "full name", "description": "what they are known for", "rank": 1, "urls": [] }
  ],
  "targetFound": true/false,
  "targetRank": number or null (rank position if found in landscape)
}

For 'default' queries: nameLandscape can be empty, focus on defaultSubject and defaultDescription.
For 'landscape'/'industry' queries: extract ALL people mentioned with ranks.
Only return valid JSON.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 800,
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    return {
      defaultSubject: parsed.defaultSubject ?? null,
      defaultDescription: parsed.defaultDescription ?? null,
      nameLandscape: parsed.nameLandscape ?? [],
      targetFound: Boolean(parsed.targetFound),
      targetRank: parsed.targetRank ?? null,
    };
  } catch (err) {
    console.error("[parser] Track B parse error:", err);
    const targetFound = rawText.toLowerCase().includes(targetName.toLowerCase().split(" ")[0]);
    return {
      defaultSubject: targetFound ? targetName : null,
      defaultDescription: targetFound ? rawText.slice(0, 200) : null,
      nameLandscape: [],
      targetFound,
      targetRank: null,
    };
  }
}

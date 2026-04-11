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
  oneLiner: string;
  keyAchievements: string[];
  greenFlags: string[];
  redFlags: string[];
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
  const empty: ParsedTrackAResult = {
    subjectName: null, statedFacts: [], targetFound: false,
    summaryDescription: "", oneLiner: "", keyAchievements: [], greenFlags: [], redFlags: [],
  };
  if (!rawText || rawText.trim().length < 10) return empty;

  try {
    const prompt = `You are analyzing an AI engine's response about a person named "${targetName}".

AI Response:
"""
${rawText.slice(0, 3000)}
"""

Extract structured information. Return JSON with this exact shape:
{
  "subjectName": "full name mentioned, or null if no person found",
  "targetFound": true/false (is this response specifically about ${targetName}?),
  "summaryDescription": "1-2 sentence summary of what the AI said",
  "oneLiner": "the AI's one-sentence definition of this person, or empty string if not provided",
  "keyAchievements": ["achievement 1", "achievement 2"],
  "greenFlags": ["positive professional signal 1", "positive signal 2"],
  "redFlags": ["concern 1", "concern 2"],
  "statedFacts": [
    { "fact": "current_role", "value": "extracted value or empty string", "sourceUrl": null, "status": "stated|not_mentioned" },
    { "fact": "current_company", "value": "extracted value or empty string", "sourceUrl": null, "status": "stated|not_mentioned" },
    { "fact": "education", "value": "extracted value or empty string", "sourceUrl": null, "status": "stated|not_mentioned" },
    { "fact": "location", "value": "extracted value or empty string", "sourceUrl": null, "status": "stated|not_mentioned" },
    { "fact": "expertise", "value": "extracted value or empty string", "sourceUrl": null, "status": "stated|not_mentioned" }
  ]
}

For keyAchievements, greenFlags, redFlags: return empty arrays [] if the AI did not provide them.
Only return valid JSON, no markdown, no explanation.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 1000,
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    return {
      subjectName: parsed.subjectName ?? null,
      statedFacts: parsed.statedFacts ?? [],
      targetFound: Boolean(parsed.targetFound),
      summaryDescription: parsed.summaryDescription ?? "",
      oneLiner: parsed.oneLiner ?? "",
      keyAchievements: Array.isArray(parsed.keyAchievements) ? parsed.keyAchievements : [],
      greenFlags: Array.isArray(parsed.greenFlags) ? parsed.greenFlags : [],
      redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
    };
  } catch (err) {
    console.error("[parser] Track A parse error:", err);
    const targetFound = rawText.toLowerCase().includes(targetName.toLowerCase().split(" ")[0]);
    return {
      subjectName: targetFound ? targetName : null,
      statedFacts: [],
      targetFound,
      summaryDescription: rawText.slice(0, 200),
      oneLiner: "",
      keyAchievements: [],
      greenFlags: [],
      redFlags: [],
    };
  }
}

export async function parseTrackBResponse(
  rawText: string,
  targetName: string,
  queryType: "landscape" | "default" | "industry"
): Promise<ParsedTrackBResult> {
  if (!rawText || rawText.trim().length < 10) {
    return { defaultSubject: null, defaultDescription: null, nameLandscape: [], targetFound: false, targetRank: null };
  }

  // All Track B queries are now landscape — use the direct regex parser (no LLM cost)
  const landscape = parseNameLandscapeRegex(rawText);
  const targetFound = rawText.toLowerCase().includes(targetName.toLowerCase());
  return {
    defaultSubject: null,
    defaultDescription: null,
    nameLandscape: landscape,
    targetFound,
    targetRank: null,  // isTarget resolved later in runner via profile anchor matching
  };
}

// Direct regex parser for numbered landscape lists — no LLM, handles full-length responses
function parseNameLandscapeRegex(rawText: string): ParsedPerson[] {
  const people: ParsedPerson[] = [];

  // Split on numbered list items: "1. ", "1) ", "### 1. ", "## 1. ", "\n1."
  const sections = rawText.split(/\n(?=\s*(?:#{1,3}\s*)?\d+[\.\)]\s)/);

  for (const section of sections) {
    const numMatch = section.match(/^\s*(?:#{1,3}\s*)?(\d+)[\.\)]\s/);
    if (!numMatch) continue;
    const rank = parseInt(numMatch[1]);
    if (rank < 1 || rank > 10) continue;

    // Strip the rank prefix to get content
    const content = section.replace(/^\s*(?:#{1,3}\s*)?\d+[\.\)]\s*/, "").trim();

    // Extract name: bold text first, else first line
    let name = "";
    const boldMatch = content.match(/^\*{1,2}([^*\n]+?)\*{1,2}/);
    if (boldMatch) {
      name = boldMatch[1].trim();
    } else {
      name = content.split("\n")[0].trim();
    }
    // Strip "- Subtitle" pattern Claude appends to names
    name = name.replace(/\s*[-–—]\s+[A-Z][a-z].*$/, "").trim();
    name = name.replace(/\*+/g, "").trim();

    if (!name || name.length < 2 || name.length > 120) continue;

    // Validate: base name (strip parentheticals) should be 1–5 words max.
    // This filters out Claude's numbered caveats like "Include people I cannot verify..."
    const baseName = name.replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim();
    const baseWordCount = baseName.split(/\s+/).filter((w) => w.length > 0).length;
    if (baseWordCount < 1 || baseWordCount > 5) continue;
    if (!/^[A-Z]/.test(baseName)) continue;

    // Build description from subsequent lines
    const lines = content.split("\n").slice(1);
    const descParts: string[] = [];
    for (const line of lines) {
      const cleaned = line
        .replace(/^\s*[-*•]\s*\*{1,2}[^*:]+\*{1,2}:\s*/, "")
        .replace(/\*{1,2}/g, "")
        .replace(/^\s*[-*•#>\s]+/, "")
        .trim();
      if (cleaned.length > 12) {
        descParts.push(cleaned);
        if (descParts.length >= 4) break;
      }
    }
    const description = descParts.join(" ").slice(0, 500);

    const urls = [...section.matchAll(/https?:\/\/[^\s\)\]"'>,]+/g)]
      .map(m => m[0].replace(/[,.)]+$/, ""))
      .filter(u => !u.includes("vertexaisearch") && !u.includes("google.com/search"));

    people.push({ name, description, rank, urls });
  }

  return people.sort((a, b) => a.rank - b.rank).slice(0, 10);
}

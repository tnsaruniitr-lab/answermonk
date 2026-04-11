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
  wrongPerson: boolean;   // true when the AI described a DIFFERENT person with the same name
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

export interface SynthesisResult {
  oneLiner: string;
  keyAchievements: string[];
  greenFlags: string[];
  redFlags: string[];
  consistencyScore: number;   // 0–100
  consistencyLabel: "high" | "medium" | "low";
  foundInMost: boolean;
  notes: string;
}

export async function parseTrackAResponse(
  rawText: string,
  targetName: string,
  profile: { currentRole?: string | null; currentCompany?: string | null; education?: string[] }
): Promise<ParsedTrackAResult> {
  const empty: ParsedTrackAResult = {
    subjectName: null, statedFacts: [], targetFound: false, wrongPerson: false,
    summaryDescription: "", oneLiner: "", keyAchievements: [], greenFlags: [], redFlags: [],
  };
  if (!rawText || rawText.trim().length < 10) return empty;

  try {
    // Build an anchor description so the LLM knows WHICH person we're looking for,
    // not just the name. This prevents "targetFound: true" for name-sharers.
    const anchorLines: string[] = [];
    if (profile.currentRole)    anchorLines.push(`- Role: ${profile.currentRole}`);
    if (profile.currentCompany) anchorLines.push(`- Company: ${profile.currentCompany}`);
    if (profile.education?.length) anchorLines.push(`- Education: ${profile.education.join(", ")}`);
    const anchorBlock = anchorLines.length > 0
      ? `\nThe SPECIFIC person we are auditing has these known details:\n${anchorLines.join("\n")}\n`
      : "\nNote: we only have the name for this person — no role, company, or education data available.\n";

    const prompt = `You are analyzing an AI engine's response about a specific individual named "${targetName}".
${anchorBlock}
AI Response:
"""
${rawText.slice(0, 3000)}
"""

Extract structured information. Return JSON with this exact shape:
{
  "subjectName": "full name mentioned, or null if no person found",
  "targetFound": true if the response is clearly about the SPECIFIC person described above (matching role/company/education), false if: (a) the response says they cannot find this person, (b) the response is about a DIFFERENT person who happens to share the name, or (c) there is not enough information to confirm it is the same individual,
  "wrongPerson": true if the response describes a DIFFERENT person with the same name (not the one we audited), false otherwise,
  "summaryDescription": "1-2 sentence summary of what the AI said",
  "oneLiner": "the AI's one-sentence definition of this person (only if targetFound=true), or empty string",
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

For keyAchievements, greenFlags, redFlags: return empty arrays [] if the AI did not provide them, or if targetFound=false.
Only return valid JSON, no markdown, no explanation.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 1000,
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    const targetFound = Boolean(parsed.targetFound);
    const wrongPerson = Boolean(parsed.wrongPerson);
    return {
      subjectName: parsed.subjectName ?? null,
      statedFacts: parsed.statedFacts ?? [],
      targetFound,
      wrongPerson,
      summaryDescription: parsed.summaryDescription ?? "",
      oneLiner: targetFound ? (parsed.oneLiner ?? "") : "",
      keyAchievements: targetFound && Array.isArray(parsed.keyAchievements) ? parsed.keyAchievements : [],
      greenFlags:      targetFound && Array.isArray(parsed.greenFlags)      ? parsed.greenFlags      : [],
      redFlags:        targetFound && Array.isArray(parsed.redFlags)         ? parsed.redFlags        : [],
    };
  } catch (err) {
    console.error("[parser] Track A parse error:", err);
    return {
      subjectName: null, statedFacts: [], targetFound: false, wrongPerson: false,
      summaryDescription: rawText.slice(0, 200), oneLiner: "",
      keyAchievements: [], greenFlags: [], redFlags: [],
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

// Synthesise N Track A raw responses for one engine into one authoritative profile.
// Uses GPT-4o-mini to find only what is CONSISTENT across the majority of rounds,
// discarding outliers and noise. Returns the intersection plus a consistency score.
export async function synthesiseTrackAResponses(
  rawTexts: string[],
  targetName: string
): Promise<SynthesisResult> {
  const empty: SynthesisResult = {
    oneLiner: "", keyAchievements: [], greenFlags: [], redFlags: [],
    consistencyScore: 0, consistencyLabel: "low", foundInMost: false, notes: "",
  };

  const valid = rawTexts.filter((t) => t && t.trim().length > 20);
  if (valid.length === 0) return empty;

  // With only 1 response there is nothing to cross-check — parse it and assign a neutral score.
  if (valid.length === 1) {
    try {
      const single = await parseTrackAResponse(valid[0], targetName, {});
      const score = single.targetFound ? 50 : 10;
      return {
        oneLiner: single.oneLiner,
        keyAchievements: single.keyAchievements,
        greenFlags: single.greenFlags,
        redFlags: single.redFlags,
        consistencyScore: score,
        consistencyLabel: "medium",
        foundInMost: single.targetFound,
        notes: "Only one response available — no cross-round consistency check possible.",
      };
    } catch { return empty; }
  }

  const threshold = Math.ceil(valid.length / 2);
  const responsesBlock = valid
    .map((t, i) => `=== Response ${i + 1} ===\n${t.slice(0, 1800)}`)
    .join("\n\n");

  const prompt = `You are analyzing ${valid.length} AI responses about a specific person named "${targetName}". Each response is from a separate query round of the same prompt — they may agree or contradict each other.

${responsesBlock}

CRITICAL RULE: Your task is strictly about the SPECIFIC person described in the audit brief — NOT about any other person who happens to share the same name.

Step 1 — determine if the specific target was found:
Set "foundInMost" = true ONLY if most responses confirm finding and describing the exact same individual (same role, company, context) that was asked about. If most responses say the person is unknown, not found, or describe someone else with the same name, set "foundInMost" = false.

Step 2 — extract consistent facts ONLY about the target:
- If "foundInMost" = true: extract only what is consistent across at least ${threshold} of the ${valid.length} responses about that specific person.
- If "foundInMost" = false: "keyAchievements", "greenFlags" and "redFlags" MUST be empty arrays []. Do NOT report facts about OTHER people who share the same name — that data is irrelevant and misleading for the audit subject.

Return JSON:
{
  "oneLiner": "If foundInMost is true: one sentence defining who this specific person is, based only on claims that appear in most responses. If foundInMost is false: one sentence summarising why the AI does not recognise this specific person (e.g. name ambiguity, no public profile).",
  "keyAchievements": ["ONLY if foundInMost=true: achievements of the specific target mentioned in multiple responses. Otherwise: []"],
  "greenFlags": ["ONLY if foundInMost=true: positive signals about the specific target mentioned in multiple responses. Otherwise: []"],
  "redFlags": ["ONLY if foundInMost=true: concerns about the specific target mentioned in multiple responses. Otherwise: []"],
  "consistencyScore": a number 0-100 where 100 = all responses agree completely, 0 = completely contradictory,
  "foundInMost": true or false as determined in Step 1,
  "notes": "one sentence explaining the consistency level"
}

Only return valid JSON.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 1200,
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    const score = Math.min(100, Math.max(0, Number(parsed.consistencyScore) || 0));
    const foundInMost = Boolean(parsed.foundInMost);

    // Hard guard: never surface facts about OTHER people with the same name.
    // If the target wasn't found, achievements/flags belong to name-sharers — discard them.
    return {
      oneLiner: parsed.oneLiner ?? "",
      keyAchievements: foundInMost && Array.isArray(parsed.keyAchievements) ? parsed.keyAchievements : [],
      greenFlags:      foundInMost && Array.isArray(parsed.greenFlags)      ? parsed.greenFlags      : [],
      redFlags:        foundInMost && Array.isArray(parsed.redFlags)         ? parsed.redFlags        : [],
      consistencyScore: score,
      consistencyLabel: score >= 65 ? "high" : score >= 35 ? "medium" : "low",
      foundInMost,
      notes: parsed.notes ?? "",
    };
  } catch (err) {
    console.error("[parser] synthesiseTrackAResponses error:", err);
    return empty;
  }
}

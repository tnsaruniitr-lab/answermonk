import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export const ALIAS_STOPWORDS = new Set([
  "digital", "marketing", "creative", "agency", "media",
  "solutions", "group", "consulting", "services", "global",
  "studio", "labs", "hub", "works", "network", "partners",
  "dubai", "uae", "ksa", "saudi", "london", "india", "me", "mena",
  "abu dhabi", "qatar", "bahrain", "cairo", "riyadh", "jeddah",
  "new york", "singapore", "mumbai",
]);

export interface AliasEntry {
  original: string;
  tokens: string;
  compact: string;
}

function normalizeToTokens(text: string): string {
  let result = text.toLowerCase().trim();
  result = result.replace(/[^\w\s]/g, " ");
  result = result.replace(/\s+/g, " ").trim();
  return result;
}

function normalizeToCompact(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isStopword(alias: string): boolean {
  const lower = alias.toLowerCase().trim();
  return ALIAS_STOPWORDS.has(lower);
}

export function extractAliasesFromHTML(html: string, brandName: string): string[] {
  const variants: string[] = [];

  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch) {
    const titleParts = titleMatch[1]
      .split(/[|\-–—:]/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 3 && s.length <= 60);
    variants.push(...titleParts);
  }

  const ogMatch = html.match(/<meta\s+property="og:site_name"\s+content="([^"]+)"/i)
    || html.match(/<meta\s+content="([^"]+)"\s+property="og:site_name"/i);
  if (ogMatch) variants.push(ogMatch[1].trim());

  const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)
    || html.match(/<meta\s+content="([^"]+)"\s+property="og:title"/i);
  if (ogTitleMatch) {
    const parts = ogTitleMatch[1].split(/[|\-–—:]/).map((s) => s.trim()).filter((s) => s.length >= 3);
    variants.push(...parts);
  }

  const ldMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (ldMatches) {
    for (const match of ldMatches) {
      try {
        const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, "");
        const data = JSON.parse(jsonContent);
        if (data.name) variants.push(data.name);
        if (data.alternateName) variants.push(data.alternateName);
        if (data.legalName) variants.push(data.legalName);
      } catch {}
    }
  }

  return variants;
}

export async function expandAliasesWithLLM(brandName: string): Promise<string[]> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        {
          role: "system",
          content: "You list common name variations for a company/brand. Return ONLY a JSON array of strings. Include abbreviations, short forms, and common misspellings. Maximum 8 variants.",
        },
        {
          role: "user",
          content: `List common name variations for "${brandName}". Return JSON array only.`,
        },
      ],
      max_completion_tokens: 128,
      temperature: 0,
    });

    const content = completion.choices[0]?.message?.content ?? "[]";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item: unknown): item is string => typeof item === "string" && item.trim().length > 0);
  } catch (err) {
    console.error("Alias LLM expansion failed:", err);
    return [];
  }
}

export function buildAliasSet(
  brandName: string,
  websiteVariants: string[],
  extractedVariants: string[],
  llmVariants: string[],
): AliasEntry[] {
  const allRaw = [brandName, ...websiteVariants, ...extractedVariants, ...llmVariants];
  const seen = new Set<string>();
  const result: AliasEntry[] = [];

  for (const raw of allRaw) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.length < 3) continue;
    if (isStopword(trimmed)) continue;

    const tokens = normalizeToTokens(trimmed);
    if (seen.has(tokens)) continue;
    seen.add(tokens);

    const compact = normalizeToCompact(trimmed);

    result.push({ original: trimmed, tokens, compact });
  }

  return result;
}

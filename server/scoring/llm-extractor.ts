import OpenAI from "openai";
import { extractCandidates, getDomainRoot } from "./extractor";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const EXTRACTION_PROMPT = `You are a brand/company name extraction tool. Respond ONLY with a JSON array of strings — no other text, no explanation, no markdown.

Given an AI-generated response, extract ONLY the company, product, or brand names that are being recommended or listed as options.

Rules:
- Return ONLY a JSON array of strings, nothing else
- Only include actual company, product, or brand names
- Do NOT include generic terms, categories, section headers, or descriptive labels (e.g. "Specialty", "Features", "Pricing", "Services", "Best For", "Strengths", "Key Features", "Overview", "Pros", "Cons")
- Do NOT include phrases, sentences, or disclaimers — only proper names
- If a brand has a qualifier like "Nexa Digital" keep the full name
- If no brands are found, return []
- Maximum 10 brands
- Keep original spelling
- Do NOT return duplicate brands

Example input: "1. **HubSpot** - Great for marketing\\n   - Specialty: Inbound\\n2. **Salesforce** - Enterprise CRM"
Example output: ["HubSpot", "Salesforce"]`;

export interface LLMExtractionResult {
  brands: string[];
  valid: boolean;
}

const SKIP_PATTERNS = [
  /^i('m| am) not sure/i,
  /^i cannot/i,
  /^i can't/i,
  /^\[error/i,
  /^sorry,? i/i,
  /^as an ai/i,
];

const MIN_RESPONSE_LENGTH = 30;
const LIST_MARKER = /^\s*(\d+[\.\)]|[-•])\s/m;

const DOMAIN_PATTERN = /\b([a-z0-9][-a-z0-9]*\.(?:com|io|ai|co|org|net|dev|app|xyz|me|us|uk|ca|de|fr|in|ae|sg))\b/i;
const LEGAL_SUFFIXES = /\b(inc|llc|ltd|gmbh|co|company|corp|corporation|plc|sa|ag|bv|nv|pty|pte)\.?\s*$/i;

function shouldSkipExtraction(rawText: string): boolean {
  const trimmed = rawText.trim();
  if (trimmed.length < MIN_RESPONSE_LENGTH && !LIST_MARKER.test(trimmed)) return true;
  return SKIP_PATTERNS.some((p) => p.test(trimmed));
}

function extractDomain(text: string): string | null {
  const match = text.match(DOMAIN_PATTERN);
  return match ? match[1].toLowerCase() : null;
}

function normalizeName(raw: string): string {
  let norm = raw.toLowerCase().trim();
  norm = norm.replace(/[^\w\s.]/g, "");
  norm = norm.replace(LEGAL_SUFFIXES, "").trim();
  norm = norm.replace(/\s+/g, " ");
  return norm;
}

function deduplicateBrands(brands: string[]): string[] {
  const seen = new Map<string, string>();
  const result: string[] = [];

  for (const brand of brands) {
    const norm = normalizeName(brand);
    if (!seen.has(norm)) {
      seen.set(norm, brand);
      result.push(brand);
    }
  }

  return result;
}

function reconcileDomains(brands: string[]): string[] {
  const domainEntries = new Map<string, number>();
  const nameRoots = new Map<string, number>();

  for (let i = 0; i < brands.length; i++) {
    const domain = extractDomain(brands[i]);
    if (domain) {
      const root = getDomainRoot(domain);
      domainEntries.set(root, i);
    } else {
      const norm = normalizeName(brands[i]);
      const singleToken = norm.split(/\s+/);
      if (singleToken.length === 1) {
        nameRoots.set(singleToken[0], i);
      }
    }
  }

  const dropIndices = new Set<number>();
  for (const [root, domIdx] of domainEntries) {
    if (nameRoots.has(root)) {
      dropIndices.add(domIdx);
    }
  }

  if (dropIndices.size === 0) return brands;
  return brands.filter((_, i) => !dropIndices.has(i));
}

function isProductVariant(shorter: string, longer: string): boolean {
  const longerLower = longer.toLowerCase();
  const shorterLower = shorter.toLowerCase();

  if (!longerLower.startsWith(shorterLower)) return false;

  const remainder = longer.slice(shorter.length).trim();
  if (remainder.length === 0) return false;

  const startsWithSpace = longer[shorter.length] === " ";
  if (!startsWithSpace) return false;

  const variantSuffixes = [
    /^(pro|plus|premium|enterprise|cloud|studio|suite|platform|hub|crm|marketing|analytics|commerce|ai|one|360|teams|business|professional|starter|basic|advanced|ultimate|max|lite)$/i,
  ];
  const remainderWords = remainder.trim().split(/\s+/);
  const firstWord = remainderWords[0];

  if (remainderWords.length <= 3 && variantSuffixes.some((p) => p.test(firstWord))) {
    return true;
  }

  if (remainderWords.length <= 3) {
    return true;
  }

  return false;
}

function deduplicateSubstrings(brands: string[]): string[] {
  const dropIndices = new Set<number>();

  for (let i = 0; i < brands.length; i++) {
    if (dropIndices.has(i)) continue;
    for (let j = i + 1; j < brands.length; j++) {
      if (dropIndices.has(j)) continue;

      const shorter = brands[i].length <= brands[j].length ? i : j;
      const longer = shorter === i ? j : i;

      if (brands[shorter].length < 3) continue;

      if (isProductVariant(brands[shorter], brands[longer])) {
        dropIndices.add(longer);
      }
    }
  }

  if (dropIndices.size === 0) return brands;
  return brands.filter((_, i) => !dropIndices.has(i));
}

function verifyAgainstSource(brands: string[], rawText: string): string[] {
  const lowerText = rawText.toLowerCase();

  return brands.filter((brand) => {
    const lower = brand.toLowerCase();
    if (lowerText.includes(lower)) return true;

    const tokens = lower.split(/\s+/).filter((t) => t.length >= 3);
    if (tokens.length >= 2) {
      const matchCount = tokens.filter((t) => lowerText.includes(t)).length;
      if (matchCount >= Math.ceil(tokens.length * 0.6)) return true;
    }

    const noSpaces = lower.replace(/\s+/g, "");
    if (noSpaces.length >= 4 && lowerText.includes(noSpaces)) return true;

    return false;
  });
}

function postProcessBrands(brands: string[], rawText: string): string[] {
  let result = deduplicateBrands(brands);
  result = reconcileDomains(result);
  result = deduplicateSubstrings(result);
  result = verifyAgainstSource(result, rawText);
  return result.slice(0, 10);
}

export async function extractBrandsWithLLM(
  rawText: string,
  query?: string,
): Promise<LLMExtractionResult> {
  if (shouldSkipExtraction(rawText)) {
    return { brands: [], valid: false };
  }

  try {
    const userMessage = query
      ? `Query that was asked: "${query}"\n\nAI response to extract brands from:\n${rawText}`
      : `AI response to extract brands from:\n${rawText}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: EXTRACTION_PROMPT },
        { role: "user", content: userMessage },
      ],
      max_tokens: 256,
      temperature: 0,
    });

    const content = completion.choices[0]?.message?.content ?? "[]";

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return fallbackToRegex(rawText);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) {
      return fallbackToRegex(rawText);
    }

    const rawBrands = parsed
      .filter((item: unknown): item is string => typeof item === "string" && item.trim().length > 0)
      .map((b: string) => b.trim());

    if (rawBrands.length === 0) {
      return fallbackToRegex(rawText);
    }

    const brands = postProcessBrands(rawBrands, rawText);

    return {
      brands,
      valid: brands.length >= 1,
    };
  } catch (err) {
    console.error("LLM extraction failed, falling back to regex:", err);
    return fallbackToRegex(rawText);
  }
}

function fallbackToRegex(rawText: string): LLMExtractionResult {
  try {
    const regexResult = extractCandidates(rawText);
    const brands = regexResult.candidates.map((c) => c.name_raw);
    return {
      brands: postProcessBrands(brands, rawText),
      valid: regexResult.valid,
    };
  } catch {
    return { brands: [], valid: false };
  }
}

export function llmResultToExtractedCandidates(result: LLMExtractionResult) {
  return {
    candidates: result.brands.map((name, i) => ({
      name_raw: name,
      name_norm: normalizeName(name),
      domain: extractDomain(name),
      rank: i + 1,
    })),
    valid: result.valid,
  };
}

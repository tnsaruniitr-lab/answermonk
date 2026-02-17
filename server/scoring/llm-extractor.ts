import OpenAI from "openai";

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

Example input: "1. **HubSpot** - Great for marketing\\n   - Specialty: Inbound\\n2. **Salesforce** - Enterprise CRM"
Example output: ["HubSpot", "Salesforce"]`;

export interface LLMExtractionResult {
  brands: string[];
  valid: boolean;
}

export async function extractBrandsWithLLM(
  rawText: string,
  query?: string,
): Promise<LLMExtractionResult> {
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
      return { brands: [], valid: false };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) {
      return { brands: [], valid: false };
    }

    const brands = parsed
      .filter((item: unknown): item is string => typeof item === "string" && item.trim().length > 0)
      .map((b: string) => b.trim())
      .slice(0, 10);

    return {
      brands,
      valid: brands.length >= 2,
    };
  } catch (err) {
    console.error("LLM extraction failed:", err);
    return { brands: [], valid: false };
  }
}

const DOMAIN_PATTERN = /\b([a-z0-9][-a-z0-9]*\.(?:com|io|ai|co|org|net|dev|app|xyz|me|us|uk|ca|de|fr|in|ae|sg))\b/i;
const LEGAL_SUFFIXES = /\b(inc|llc|ltd|gmbh|co|company|corp|corporation|plc|sa|ag|bv|nv|pty|pte)\.?\s*$/i;

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

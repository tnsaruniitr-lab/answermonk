import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import type { Engine } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const SYSTEM_PROMPT = `You are a helpful product recommendation expert. When asked about products, services, or brands in a category, provide a numbered list of the top recommendations. Format your response EXACTLY as:

1. **BrandName** - Brief description
2. **BrandName** - Brief description
...

Rules:
- List between 5 and 10 recommendations, ranked by overall quality and popularity.
- Each line MUST start with a number followed by a period.
- The brand name MUST be wrapped in ** bold markers **.
- Be specific with brand/product names. Do not include generic descriptions without a specific brand name.
- Do not use sub-lists or nested numbering.`;

function buildUserPrompt(query: string): string {
  return `${query}\n\nPlease provide a ranked list of the top recommendations.`;
}

export interface EngineResult {
  rawText: string;
  topBrands: string[];
  brandPosition: number | null;
  presenceState: 0 | 1 | 2;
}

const LIST_PATTERNS = [
  /^\s*\d+[\.\)]\s*\*{1,2}([^*]+)\*{1,2}/,
  /^\s*\d+[\.\)]\s*\[([^\]]+)\]/,
  /^\s*\d+[\.\)]\s*([A-Z][A-Za-z0-9\s\.&']+?)(?:\s*[-–—:]\s|$)/,
  /^\s*[-•]\s*\*{1,2}([^*]+)\*{1,2}/,
  /^\s*[-•]\s*([A-Z][A-Za-z0-9\s\.&']+?)(?:\s*[-–—:]\s|$)/,
];

function extractBrandName(raw: string): string {
  return raw
    .replace(/[*[\]#]/g, "")
    .replace(/\(.*?\)/g, "")
    .trim();
}

function parseBrandsFromResponse(text: string, targetBrand: string): Omit<EngineResult, "rawText"> {
  const lines = text.split("\n");
  const brands: string[] = [];

  for (const line of lines) {
    for (const pattern of LIST_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        const name = extractBrandName(match[1]);
        if (name.length > 1 && name.length < 80) {
          brands.push(name);
        }
        break;
      }
    }
  }

  const normalizedTarget = targetBrand.toLowerCase().trim();
  const targetTokens = normalizedTarget.split(/\s+/);
  let brandPosition: number | null = null;
  let presenceState: 0 | 1 | 2 = 0;

  for (let i = 0; i < brands.length; i++) {
    const brandLower = brands[i].toLowerCase();
    if (
      brandLower === normalizedTarget ||
      brandLower.includes(normalizedTarget) ||
      normalizedTarget.includes(brandLower) ||
      targetTokens.every((token) => brandLower.includes(token))
    ) {
      brandPosition = i + 1;
      break;
    }
  }

  if (brandPosition === null) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes(normalizedTarget)) {
      presenceState = 1;
    }
  } else {
    presenceState = brandPosition <= 3 ? 2 : 1;
  }

  return {
    topBrands: brands.slice(0, 10),
    brandPosition,
    presenceState,
  };
}

async function queryChatGPT(query: string, brand: string): Promise<EngineResult> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(query) },
    ],
    max_tokens: 1024,
    temperature: 0.7,
  });

  const rawText = completion.choices[0]?.message?.content ?? "";
  const parsed = parseBrandsFromResponse(rawText, brand);
  return { rawText, ...parsed };
}

async function queryClaude(query: string, brand: string): Promise<EngineResult> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    messages: [
      { role: "user", content: `${SYSTEM_PROMPT}\n\n${buildUserPrompt(query)}` },
    ],
  });

  const rawText = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const parsed = parseBrandsFromResponse(rawText, brand);
  return { rawText, ...parsed };
}

function stubEngine(query: string, brand: string, engine: Engine): EngineResult {
  const normalizedBrand = brand.toLowerCase().trim();
  const isFound = Math.random() > 0.35;
  const position = isFound ? Math.floor(Math.random() * 8) + 1 : null;
  const presenceState: 0 | 1 | 2 = isFound ? (position && position <= 3 ? 2 : 1) : 0;

  const genericBrands = [
    "HubSpot", "Salesforce", "Zoho", "Pipedrive", "Monday.com",
    "ClickUp", "Zendesk", "Freshworks", "Oracle", "SAP",
  ].filter((b) => b.toLowerCase() !== normalizedBrand);

  const topBrands = [...genericBrands].sort(() => 0.5 - Math.random()).slice(0, 7);
  if (position) {
    topBrands.splice(position - 1, 0, brand);
  }

  return {
    rawText: `[Simulated ${engine} response] Top recommendations for "${query}": ${topBrands.slice(0, 10).join(", ")}`,
    topBrands: topBrands.slice(0, 10),
    brandPosition: position,
    presenceState,
  };
}

export async function queryEngine(
  engine: Engine,
  query: string,
  brand: string
): Promise<EngineResult> {
  try {
    switch (engine) {
      case "chatgpt":
        return await queryChatGPT(query, brand);
      case "claude":
        return await queryClaude(query, brand);
      case "gemini":
      case "deepseek":
        return stubEngine(query, brand, engine);
      default:
        return stubEngine(query, brand, engine);
    }
  } catch (err) {
    console.error(`Engine ${engine} failed:`, err);
    return {
      rawText: `[Error: ${engine} unavailable]`,
      topBrands: [],
      brandPosition: null,
      presenceState: 0,
    };
  }
}

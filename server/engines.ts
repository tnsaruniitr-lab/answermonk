import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import type { Engine } from "@shared/schema";
import { extractBrandsWithLLM, llmResultToExtractedCandidates } from "./scoring/llm-extractor";
import { buildBrandIdentity, matchRun } from "./scoring/matcher";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const gemini = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
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

async function parseBrandsFromResponse(text: string, targetBrand: string, query?: string): Promise<Omit<EngineResult, "rawText">> {
  const llmResult = await extractBrandsWithLLM(text, query);
  const extraction = llmResultToExtractedCandidates(llmResult);
  const brandIdentity = buildBrandIdentity(targetBrand);
  const matchResult = matchRun(extraction.candidates, brandIdentity);

  let presenceState: 0 | 1 | 2 = 0;
  let brandPosition: number | null = null;

  if (matchResult.brand.brand_found) {
    brandPosition = matchResult.brand.brand_rank;
    presenceState = brandPosition !== null && brandPosition <= 3 ? 2 : 1;
  } else {
    const lowerText = text.toLowerCase();
    const normalizedTarget = targetBrand.toLowerCase().trim();
    if (lowerText.includes(normalizedTarget)) {
      presenceState = 1;
    }
  }

  return {
    topBrands: llmResult.brands.slice(0, 10),
    brandPosition,
    presenceState,
  };
}

async function queryChatGPTWithWebSearch(query: string, brand: string): Promise<EngineResult> {
  try {
    const directOpenai = new OpenAI({
      apiKey: process.env.OPENAI_DIRECT_API_KEY,
    });

    const response = await directOpenai.responses.create({
      model: "gpt-5.2",
      tools: [{ type: "web_search" as any }],
      input: query,
      temperature: 0.2,
    });

    const rawText = (response as any).output_text ?? "";
    const parsed = await parseBrandsFromResponse(rawText, brand, query);
    return { rawText, ...parsed };
  } catch (err) {
    console.error("Web search failed, falling back to standard query:", err);
    return queryChatGPTStandard(query, brand);
  }
}

async function queryChatGPTStandard(query: string, brand: string): Promise<EngineResult> {
  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      { role: "user", content: query },
    ],
    max_completion_tokens: 1024,
    temperature: 0.2,
  });

  const rawText = completion.choices[0]?.message?.content ?? "";
  const parsed = await parseBrandsFromResponse(rawText, brand, query);
  return { rawText, ...parsed };
}

async function queryChatGPT(query: string, brand: string, webSearch: boolean = false): Promise<EngineResult> {
  if (webSearch) {
    return queryChatGPTWithWebSearch(query, brand);
  }
  return queryChatGPTStandard(query, brand);
}

async function queryClaude(query: string, brand: string): Promise<EngineResult> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    messages: [
      { role: "user", content: query },
    ],
  });

  const rawText = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const parsed = await parseBrandsFromResponse(rawText, brand, query);
  return { rawText, ...parsed };
}

async function queryGeminiWithWebSearch(query: string, brand: string): Promise<EngineResult> {
  try {
    const response = await gemini.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: query,
      config: {
        maxOutputTokens: 8192,
        tools: [{ googleSearch: {} }],
      },
    });

    const rawText = response.text ?? "";
    const parsed = await parseBrandsFromResponse(rawText, brand, query);
    return { rawText, ...parsed };
  } catch (err) {
    console.error("Gemini web search failed, falling back to standard query:", err);
    return queryGeminiStandard(query, brand);
  }
}

async function queryGeminiStandard(query: string, brand: string): Promise<EngineResult> {
  const response = await gemini.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: query,
    config: { maxOutputTokens: 8192 },
  });

  const rawText = response.text ?? "";
  const parsed = await parseBrandsFromResponse(rawText, brand, query);
  return { rawText, ...parsed };
}

async function queryGemini(query: string, brand: string, webSearch: boolean = false): Promise<EngineResult> {
  if (webSearch) {
    return queryGeminiWithWebSearch(query, brand);
  }
  return queryGeminiStandard(query, brand);
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
  brand: string,
  webSearch: boolean = false
): Promise<EngineResult> {
  try {
    switch (engine) {
      case "chatgpt":
        return await queryChatGPT(query, brand, webSearch);
      case "claude":
        return await queryClaude(query, brand);
      case "gemini":
        return await queryGemini(query, brand, webSearch);
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

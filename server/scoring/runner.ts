import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import type { Prompt } from "../promptgen/types";
import { extractBrandsWithLLM, llmResultToExtractedCandidates } from "./llm-extractor";
import { type ExtractionResult } from "./extractor";
import { matchRun, buildBrandIdentity, type BrandIdentity, type RunMatchResult, type AliasEntry } from "./matcher";
import { computeGEOScore, type RunData, type GEOScore } from "./scorer";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const gemini = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY,
});

type ScoringEngine = "chatgpt" | "gemini" | "claude";
const ENGINES: ScoringEngine[] = ["chatgpt", "gemini", "claude"];

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 500;
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 2000;

export interface Citation {
  url: string;
  title?: string;
}

export type WebSearchStatus = "grounded" | "ungrounded" | "fallback" | "not_applicable";

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
}

export interface CostBreakdown {
  engine_costs: Record<ScoringEngine, { tokens: TokenUsage; cost_usd: number; calls: number }>;
  extraction_costs: { tokens: TokenUsage; cost_usd: number; calls: number };
  total_cost_usd: number;
}

const MODEL_PRICING: Record<string, { input_per_1m: number; output_per_1m: number }> = {
  "gpt-5.2": { input_per_1m: 2.0, output_per_1m: 8.0 },
  "gpt-4o": { input_per_1m: 2.50, output_per_1m: 10.0 },
  "gpt-4o-mini": { input_per_1m: 0.15, output_per_1m: 0.60 },
  "claude-sonnet-4-5": { input_per_1m: 3.0, output_per_1m: 15.0 },
  "gemini-2.5-flash": { input_per_1m: 0.15, output_per_1m: 0.60 },
};

function calcCost(model: string, usage: TokenUsage): number {
  const pricing = MODEL_PRICING[model] || { input_per_1m: 1.0, output_per_1m: 3.0 };
  return (usage.input_tokens * pricing.input_per_1m + usage.output_tokens * pricing.output_per_1m) / 1_000_000;
}

export interface RawRunResult {
  prompt_id: string;
  cluster: string;
  engine: ScoringEngine;
  raw_text: string;
  citations: Citation[];
  extraction: ExtractionResult;
  match: RunMatchResult;
  webSearchStatus: WebSearchStatus;
  fallbackReason?: string;
}

export interface ScoringRunResult {
  score: GEOScore;
  raw_runs: RawRunResult[];
  brand_identity: BrandIdentity;
  cost?: CostBreakdown;
}

export async function runScoring(
  prompts: Prompt[],
  brandName: string,
  brandDomain?: string | null,
  onProgress?: (completed: number, total: number) => void,
  aliases?: AliasEntry[],
  categoryHint?: string,
  enabledEngines?: ScoringEngine[],
  chatgptModel?: string,
): Promise<ScoringRunResult> {
  const brand = buildBrandIdentity(brandName, brandDomain, aliases);
  const activeEngines = enabledEngines && enabledEngines.length > 0 ? enabledEngines : ENGINES;
  const totalCalls = prompts.length * activeEngines.length;
  let completed = 0;
  const activeChatgptModel = chatgptModel ?? "gpt-5.2";

  const allRawRuns: RawRunResult[] = [];

  const ENGINE_MODELS: Record<ScoringEngine, string> = {
    chatgpt: activeChatgptModel,
    claude: "claude-sonnet-4-5",
    gemini: "gemini-2.5-flash",
  };

  const costTracker: {
    engines: Record<ScoringEngine, { tokens: TokenUsage; calls: number }>;
    extraction: { tokens: TokenUsage; calls: number };
  } = {
    engines: {
      chatgpt: { tokens: { input_tokens: 0, output_tokens: 0 }, calls: 0 },
      gemini: { tokens: { input_tokens: 0, output_tokens: 0 }, calls: 0 },
      claude: { tokens: { input_tokens: 0, output_tokens: 0 }, calls: 0 },
    },
    extraction: { tokens: { input_tokens: 0, output_tokens: 0 }, calls: 0 },
  };

  console.log(`[Scoring] Running with engines: ${activeEngines.join(", ")}`);
  const engineResults = await Promise.all(
    activeEngines.map(async (engine) => {
      const runs: RawRunResult[] = [];
      for (let i = 0; i < prompts.length; i += BATCH_SIZE) {
        const batch = prompts.slice(i, i + BATCH_SIZE);

        const batchResults = await Promise.all(
          batch.map(async (prompt) => {
            for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
              try {
                if (attempt > 0) {
                  const delay = RETRY_BASE_MS * Math.pow(2, attempt - 1);
                  console.log(`Retry ${attempt}/${MAX_RETRIES} for ${engine} prompt ${prompt.id} after ${delay}ms`);
                  await sleep(delay);
                }
                const engineResponse = await queryEngine(engine, prompt.text, activeChatgptModel);

                if (engineResponse.usage) {
                  costTracker.engines[engine].tokens.input_tokens += engineResponse.usage.input_tokens;
                  costTracker.engines[engine].tokens.output_tokens += engineResponse.usage.output_tokens;
                  costTracker.engines[engine].calls++;
                }

                const llmResult = await extractBrandsWithLLM(engineResponse.text, prompt.text, categoryHint);

                if (llmResult.usage) {
                  costTracker.extraction.tokens.input_tokens += llmResult.usage.input_tokens;
                  costTracker.extraction.tokens.output_tokens += llmResult.usage.output_tokens;
                  costTracker.extraction.calls++;
                }

                const extraction = llmResultToExtractedCandidates(llmResult);
                const match = matchRun(extraction.candidates, brand);

                completed++;
                onProgress?.(completed, totalCalls);

                return {
                  prompt_id: prompt.id,
                  cluster: prompt.cluster,
                  engine,
                  raw_text: engineResponse.text,
                  citations: engineResponse.citations,
                  extraction,
                  match,
                  webSearchStatus: engineResponse.webSearchStatus,
                  fallbackReason: engineResponse.fallbackReason,
                } as RawRunResult;
              } catch (err) {
                const isRetryErr = isRetryableError(err);
                if (!isRetryErr || attempt === MAX_RETRIES) {
                  console.error(`Scoring engine ${engine} failed for prompt ${prompt.id} (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`, err);
                  break;
                }
              }
            }

            completed++;
            onProgress?.(completed, totalCalls);

            return {
              prompt_id: prompt.id,
              cluster: prompt.cluster,
              engine,
              raw_text: `[Error: ${engine} unavailable]`,
              citations: [],
              extraction: { candidates: [], valid: false },
              match: {
                brand: { brand_found: false, brand_rank: null, match_tier: null },
                competitors: [],
              },
              webSearchStatus: "fallback" as WebSearchStatus,
              fallbackReason: "Engine completely unavailable after all retries",
            } as RawRunResult;
          }),
        );

        runs.push(...batchResults);

        if (i + BATCH_SIZE < prompts.length) {
          await sleep(BATCH_DELAY_MS);
        }
      }
      return runs;
    }),
  );

  for (const runs of engineResults) {
    allRawRuns.push(...runs);
  }

  const runDataList: RunData[] = allRawRuns.map((r) => ({
    prompt_id: r.prompt_id,
    cluster: r.cluster,
    engine: r.engine,
    valid: r.extraction.valid,
    brand: r.match.brand,
    competitors: r.match.competitors,
  }));

  const score = computeGEOScore(runDataList);

  const costBreakdown: CostBreakdown = {
    engine_costs: {
      chatgpt: {
        tokens: costTracker.engines.chatgpt.tokens,
        cost_usd: calcCost(ENGINE_MODELS.chatgpt, costTracker.engines.chatgpt.tokens),
        calls: costTracker.engines.chatgpt.calls,
      },
      gemini: {
        tokens: costTracker.engines.gemini.tokens,
        cost_usd: calcCost(ENGINE_MODELS.gemini, costTracker.engines.gemini.tokens),
        calls: costTracker.engines.gemini.calls,
      },
      claude: {
        tokens: costTracker.engines.claude.tokens,
        cost_usd: calcCost(ENGINE_MODELS.claude, costTracker.engines.claude.tokens),
        calls: costTracker.engines.claude.calls,
      },
    },
    extraction_costs: {
      tokens: costTracker.extraction.tokens,
      cost_usd: calcCost("gpt-5.2", costTracker.extraction.tokens),
      calls: costTracker.extraction.calls,
    },
    total_cost_usd: 0,
  };
  costBreakdown.total_cost_usd =
    costBreakdown.engine_costs.chatgpt.cost_usd +
    costBreakdown.engine_costs.gemini.cost_usd +
    costBreakdown.engine_costs.claude.cost_usd +
    costBreakdown.extraction_costs.cost_usd;

  console.log(`[Cost] Session cost: $${costBreakdown.total_cost_usd.toFixed(4)} (ChatGPT: $${costBreakdown.engine_costs.chatgpt.cost_usd.toFixed(4)}, Gemini: $${costBreakdown.engine_costs.gemini.cost_usd.toFixed(4)}, Claude: $${costBreakdown.engine_costs.claude.cost_usd.toFixed(4)}, Extraction: $${costBreakdown.extraction_costs.cost_usd.toFixed(4)})`);

  return {
    score,
    raw_runs: allRawRuns,
    brand_identity: brand,
    cost: costBreakdown,
  };
}

interface EngineResponse {
  text: string;
  citations: Citation[];
  webSearchStatus: WebSearchStatus;
  fallbackReason?: string;
  usage?: TokenUsage;
}

async function queryEngine(engine: ScoringEngine, promptText: string, chatgptModel?: string): Promise<EngineResponse> {
  switch (engine) {
    case "chatgpt":
      return queryChatGPT(promptText, chatgptModel);
    case "claude":
      return queryClaude(promptText);
    case "gemini":
      return queryGemini(promptText);
  }
}

function parseCitationsFromMarkdown(text: string): Citation[] {
  const citations: Citation[] = [];
  const seen = new Set<string>();
  const urlRegex = /\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
  let match;
  while ((match = urlRegex.exec(text)) !== null) {
    const url = match[2];
    if (!seen.has(url)) {
      seen.add(url);
      citations.push({ url, title: match[1] || undefined });
    }
  }
  return citations;
}

async function queryChatGPT(prompt: string, model: string = "gpt-5.2"): Promise<EngineResponse> {
  try {
    const directOpenai = new OpenAI({
      apiKey: process.env.OPENAI_DIRECT_API_KEY,
    });

    const response = await directOpenai.responses.create({
      model,
      tools: [{ type: "web_search" as any }],
      tool_choice: "required" as any,
      input: prompt,
      temperature: 0.2,
    });

    const text = (response as any).output_text ?? "";
    const citations: Citation[] = [];
    const seen = new Set<string>();
    const output = (response as any).output;
    let webSearchToolUsed = false;
    if (Array.isArray(output)) {
      for (const item of output) {
        if (item.type === "web_search_call") {
          webSearchToolUsed = true;
        }
        if (item.type === "message" && Array.isArray(item.content)) {
          for (const part of item.content) {
            if (part.type === "output_text" && Array.isArray(part.annotations)) {
              for (const ann of part.annotations) {
                if (ann.type === "url_citation" && ann.url && !seen.has(ann.url)) {
                  seen.add(ann.url);
                  citations.push({ url: ann.url, title: ann.title || undefined });
                }
              }
            }
          }
        }
      }
    }
    if (citations.length === 0) {
      citations.push(...parseCitationsFromMarkdown(text));
    }

    const webSearchStatus: WebSearchStatus = webSearchToolUsed
      ? "grounded"
      : "ungrounded";

    const usage: TokenUsage = {
      input_tokens: (response as any).usage?.input_tokens ?? 0,
      output_tokens: (response as any).usage?.output_tokens ?? 0,
    };

    return { text, citations, webSearchStatus, usage };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error("Quick mode ChatGPT web search failed, falling back to standard:", err);
    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 1024,
      temperature: 0.2,
    });
    const usage: TokenUsage = {
      input_tokens: completion.usage?.prompt_tokens ?? 0,
      output_tokens: completion.usage?.completion_tokens ?? 0,
    };
    return {
      text: completion.choices[0]?.message?.content ?? "",
      citations: [],
      webSearchStatus: "fallback",
      fallbackReason: reason,
      usage,
    };
  }
}

async function queryClaude(prompt: string): Promise<EngineResponse> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  const usage: TokenUsage = {
    input_tokens: message.usage?.input_tokens ?? 0,
    output_tokens: message.usage?.output_tokens ?? 0,
  };
  return { text, citations: [], webSearchStatus: "not_applicable", usage };
}

async function queryGemini(prompt: string): Promise<EngineResponse> {
  try {
    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        maxOutputTokens: 8192,
        tools: [{ googleSearch: {} }],
      },
    });
    const text = response.text ?? "";
    const groundingMeta = (response as any).candidates?.[0]?.groundingMetadata;
    const citations: Citation[] = [];
    const seen = new Set<string>();
    const hasGroundingMetadata = !!(groundingMeta?.groundingChunks?.length > 0 || groundingMeta?.searchEntryPoint);
    if (groundingMeta?.groundingChunks) {
      for (const chunk of groundingMeta.groundingChunks) {
        const url = chunk?.web?.uri;
        if (url && !seen.has(url)) {
          seen.add(url);
          citations.push({ url, title: chunk?.web?.title || undefined });
        }
      }
    }
    if (citations.length === 0) {
      citations.push(...parseCitationsFromMarkdown(text));
    }

    const webSearchStatus: WebSearchStatus = citations.length > 0
      ? "grounded"
      : hasGroundingMetadata
        ? "grounded"
        : "ungrounded";

    const usageMeta = (response as any).usageMetadata;
    const usage: TokenUsage = {
      input_tokens: usageMeta?.promptTokenCount ?? 0,
      output_tokens: usageMeta?.candidatesTokenCount ?? 0,
    };

    return { text, citations, webSearchStatus, usage };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error("Quick mode Gemini web search failed, falling back to standard:", err);
    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { maxOutputTokens: 1024 },
    });
    const usageMeta = (response as any).usageMetadata;
    const usage: TokenUsage = {
      input_tokens: usageMeta?.promptTokenCount ?? 0,
      output_tokens: usageMeta?.candidatesTokenCount ?? 0,
    };
    return {
      text: response.text ?? "",
      citations: [],
      webSearchStatus: "fallback",
      fallbackReason: reason,
      usage,
    };
  }
}

function isRetryableError(err: unknown): boolean {
  if (err && typeof err === "object") {
    const status = (err as any).status ?? (err as any).statusCode ?? (err as any).code;
    if (status === 429 || status === 500 || status === 502 || status === 503 || status === 529) return true;
    const msg = String((err as any).message ?? "");
    if (msg.includes("rate") || msg.includes("429") || msg.includes("overloaded") || msg.includes("capacity") || msg.includes("timeout") || msg.includes("ECONNRESET")) return true;
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

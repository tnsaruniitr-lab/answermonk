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
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
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
}

export async function runScoring(
  prompts: Prompt[],
  brandName: string,
  brandDomain?: string | null,
  onProgress?: (completed: number, total: number) => void,
  aliases?: AliasEntry[],
): Promise<ScoringRunResult> {
  const brand = buildBrandIdentity(brandName, brandDomain, aliases);
  const totalCalls = prompts.length * ENGINES.length;
  let completed = 0;

  const allRawRuns: RawRunResult[] = [];

  const engineResults = await Promise.all(
    ENGINES.map(async (engine) => {
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
                const engineResponse = await queryEngine(engine, prompt.text);
                const llmResult = await extractBrandsWithLLM(engineResponse.text, prompt.text);
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

  return {
    score,
    raw_runs: allRawRuns,
    brand_identity: brand,
  };
}

interface EngineResponse {
  text: string;
  citations: Citation[];
  webSearchStatus: WebSearchStatus;
  fallbackReason?: string;
}

async function queryEngine(engine: ScoringEngine, promptText: string): Promise<EngineResponse> {
  switch (engine) {
    case "chatgpt":
      return queryChatGPT(promptText);
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

async function queryChatGPT(prompt: string): Promise<EngineResponse> {
  try {
    const directOpenai = new OpenAI({
      apiKey: process.env.OPENAI_DIRECT_API_KEY,
    });

    const response = await directOpenai.responses.create({
      model: "gpt-5.2",
      tools: [{ type: "web_search" as any }],
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

    const webSearchStatus: WebSearchStatus = citations.length > 0
      ? "grounded"
      : webSearchToolUsed
        ? "ungrounded"
        : "ungrounded";

    return { text, citations, webSearchStatus };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error("Quick mode ChatGPT web search failed, falling back to standard:", err);
    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 1024,
      temperature: 0.2,
    });
    return {
      text: completion.choices[0]?.message?.content ?? "",
      citations: [],
      webSearchStatus: "fallback",
      fallbackReason: reason,
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
  return { text, citations: [], webSearchStatus: "not_applicable" };
}

async function queryGemini(prompt: string): Promise<EngineResponse> {
  try {
    const response = await gemini.models.generateContent({
      model: "gemini-3-flash-preview",
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

    return { text, citations, webSearchStatus };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error("Quick mode Gemini web search failed, falling back to standard:", err);
    const response = await gemini.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { maxOutputTokens: 1024 },
    });
    return {
      text: response.text ?? "",
      citations: [],
      webSearchStatus: "fallback",
      fallbackReason: reason,
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

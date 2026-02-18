import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import type { Prompt } from "../promptgen/types";
import { extractBrandsWithLLM, llmResultToExtractedCandidates } from "./llm-extractor";
import { type ExtractionResult } from "./extractor";
import { matchRun, buildBrandIdentity, type BrandIdentity, type RunMatchResult } from "./matcher";
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

export interface RawRunResult {
  prompt_id: string;
  cluster: string;
  engine: ScoringEngine;
  raw_text: string;
  extraction: ExtractionResult;
  match: RunMatchResult;
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
): Promise<ScoringRunResult> {
  const brand = buildBrandIdentity(brandName, brandDomain);
  const totalCalls = prompts.length * ENGINES.length;
  let completed = 0;

  const allRawRuns: RawRunResult[] = [];

  for (let i = 0; i < prompts.length; i += BATCH_SIZE) {
    const batch = prompts.slice(i, i + BATCH_SIZE);

    const batchPromises = batch.flatMap((prompt) =>
      ENGINES.map(async (engine) => {
        try {
          const rawText = await queryEngine(engine, prompt.text);
          const llmResult = await extractBrandsWithLLM(rawText, prompt.text);
          const extraction = llmResultToExtractedCandidates(llmResult);
          const match = matchRun(extraction.candidates, brand);

          const result: RawRunResult = {
            prompt_id: prompt.id,
            cluster: prompt.cluster,
            engine,
            raw_text: rawText,
            extraction,
            match,
          };

          completed++;
          onProgress?.(completed, totalCalls);

          return result;
        } catch (err) {
          console.error(`Scoring engine ${engine} failed for prompt ${prompt.id}:`, err);
          completed++;
          onProgress?.(completed, totalCalls);

          return {
            prompt_id: prompt.id,
            cluster: prompt.cluster,
            engine,
            raw_text: `[Error: ${engine} unavailable]`,
            extraction: { candidates: [], valid: false },
            match: {
              brand: { brand_found: false, brand_rank: null, match_tier: null },
              competitors: [],
            },
          } as RawRunResult;
        }
      }),
    );

    const batchResults = await Promise.all(batchPromises);
    allRawRuns.push(...batchResults);

    if (i + BATCH_SIZE < prompts.length) {
      await sleep(BATCH_DELAY_MS);
    }
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

async function queryEngine(engine: ScoringEngine, promptText: string): Promise<string> {
  switch (engine) {
    case "chatgpt":
      return queryChatGPT(promptText);
    case "claude":
      return queryClaude(promptText);
    case "gemini":
      return queryGemini(promptText);
  }
}

async function queryChatGPT(prompt: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1024,
    temperature: 0.7,
  });
  return completion.choices[0]?.message?.content ?? "";
}

async function queryClaude(prompt: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

async function queryGemini(prompt: string): Promise<string> {
  const response = await gemini.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: { maxOutputTokens: 1024 },
  });
  return response.text ?? "";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

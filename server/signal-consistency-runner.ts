import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { db } from "./db";
import { signalConsistencyJobs } from "@shared/schema";
import { eq } from "drizzle-orm";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const gemini = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim()
    .slice(0, 8000);
}

async function fetchWebsiteContent(url: string): Promise<string> {
  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    const response = await fetch(normalized, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GEOBot/1.0)" },
      signal: AbortSignal.timeout(12000),
    });
    const html = await response.text();
    return stripHtml(html);
  } catch {
    return `[Could not fetch website content for ${url} — using URL only]`;
  }
}

async function discoverSignals(websiteContent: string): Promise<any> {
  const prompt = `You are an AI visibility analyst. Your job is not to evaluate how good this brand is — your job is to determine what signals would cause an AI system to confidently and consistently represent this brand when someone asks about its category.

You will read the website content below and identify the 4 most important signals for this specific brand's AI visibility.

A signal qualifies if:
- It is something an LLM could plausibly have absorbed from public web content
- It is specific enough that consistent LLM responses would confirm it
- It is something this brand is actively claiming or demonstrating, not just aspirational
- It differentiates this brand from generic players in its category

For each signal, also identify what weak or inconsistent LLM responses would look like — this will be used to design the test question.

Return ONLY valid JSON:
{
  "brand_name": "",
  "category": "",
  "segment": "b2b_saas | agency | service | other",
  "signals": [
    {
      "id": "signal_1",
      "name": "",
      "why_it_matters_for_ai_visibility": "",
      "what_strong_looks_like": "",
      "what_weak_looks_like": "",
      "question": ""
    }
  ]
}

Question rules:
- Must NOT name the brand
- Must be a natural question a real person would ask
- Must be open enough that multiple brands could answer it
- The brand should appear in the response only if it genuinely has presence on this signal

Website content:
${websiteContent}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });
  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Claude returned invalid JSON for signal discovery");
  return JSON.parse(jsonMatch[0]);
}

async function queryChatGPT(question: string): Promise<string> {
  const prompt = `${question}\n\nPlease answer based on current, reliable information.`;
  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });
  return response.choices[0]?.message?.content ?? "";
}

async function queryGemini(question: string): Promise<string> {
  const prompt = `${question}\n\nPlease answer based on current, reliable information.`;
  const response = await gemini.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      maxOutputTokens: 8192,
      tools: [{ googleSearch: {} }],
    },
  });
  return response.text ?? "";
}

async function scoreConsistency(
  brandName: string,
  signal: any,
  engine: string,
  responses: string[]
): Promise<any> {
  const prompt = `You are evaluating AI visibility consistency for a brand.

Brand: ${brandName}
Signal being tested: ${signal.name}
What strong looks like: ${signal.what_strong_looks_like}
What weak looks like: ${signal.what_weak_looks_like}
Question that was asked: ${signal.question}
Engine tested: ${engine}

Below are ${responses.length} independent responses from ${engine} to the same question, collected across separate sessions.

Your job is to evaluate: does this engine have a stable, consistent representation of this brand on this specific signal — or is it uncertain, contradictory, or silent?

Score strictly. Absence is a low score, not a neutral one.

Return ONLY valid JSON:
{
  "signal_name": "",
  "engine": "",
  "presence_rate": 0.0,
  "consistency_score": 0,
  "sentiment": "positive | neutral | negative | mixed",
  "what_the_engine_believes": "",
  "contradictions_found": [],
  "gaps_vs_brand_claim": "",
  "verdict": "strong | partial | weak | absent"
}

Scoring guide:
90-100: Brand appears in most responses with the same consistent message
70-89:  Brand appears often but with some variation in framing
50-69:  Brand appears sometimes, inconsistent or vague when it does
30-49:  Brand rarely appears or is mentioned incidentally
0-29:   Brand absent or contradicted

Responses:
${JSON.stringify(responses.map(r => r.slice(0, 600)))}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Claude returned invalid JSON for scoring");
  return JSON.parse(jsonMatch[0]);
}

async function updateJob(jobId: number, updates: Record<string, any>) {
  await db.update(signalConsistencyJobs).set(updates).where(eq(signalConsistencyJobs.id, jobId));
}

export async function runSignalConsistency(jobId: number): Promise<void> {
  try {
    const [job] = await db.select().from(signalConsistencyJobs).where(eq(signalConsistencyJobs.id, jobId));
    if (!job) throw new Error("Job not found");

    const brands = (job.brands as string[]).filter(Boolean);
    const engines = (job.engines as string[]).filter(Boolean);
    const runCount = job.runCount;

    // ── Phase 1: Discover signals ──────────────────────────────────────────────
    await updateJob(jobId, { status: "discovering", progress: 5 });

    const discoveredSignals: Record<string, any> = {};
    await Promise.all(brands.map(async (url) => {
      try {
        const content = await fetchWebsiteContent(url);
        discoveredSignals[url] = await discoverSignals(content);
      } catch (err) {
        discoveredSignals[url] = { error: String(err), brand_name: url, signals: [] };
      }
    }));

    await updateJob(jobId, { discoveredSignals, progress: 25 });

    // ── Phase 2: Collect responses (Prompt B) ─────────────────────────────────
    await updateJob(jobId, { status: "running", progress: 25 });

    const rawResponses: Record<string, Record<string, Record<string, string[]>>> = {};
    const activeBrands = brands.filter(url => discoveredSignals[url]?.signals?.length > 0);

    await Promise.all(activeBrands.map(async (url) => {
      const signals = discoveredSignals[url].signals as any[];
      rawResponses[url] = {};

      await Promise.all(signals.map(async (signal: any) => {
        rawResponses[url][signal.id] = {};
        await Promise.all(engines.map(async (engine) => {
          const responses: string[] = [];
          for (let i = 0; i < runCount; i++) {
            try {
              const text = engine === "chatgpt"
                ? await queryChatGPT(signal.question)
                : await queryGemini(signal.question);
              responses.push(text);
              await new Promise(r => setTimeout(r, 300));
            } catch (err) {
              responses.push(`[Error: ${String(err).slice(0, 100)}]`);
            }
          }
          rawResponses[url][signal.id][engine] = responses;
        }));
      }));
    }));

    await updateJob(jobId, { rawResponses, progress: 75 });

    // ── Phase 3: Score consistency (Prompt C) ─────────────────────────────────
    await updateJob(jobId, { status: "scoring", progress: 75 });

    const scoringResults: Record<string, Record<string, Record<string, any>>> = {};
    await Promise.all(activeBrands.map(async (url) => {
      const brandData = discoveredSignals[url];
      const signals = brandData.signals as any[];
      scoringResults[url] = {};

      await Promise.all(signals.map(async (signal: any) => {
        scoringResults[url][signal.id] = {};
        await Promise.all(engines.map(async (engine) => {
          try {
            const responses = rawResponses[url]?.[signal.id]?.[engine] ?? [];
            scoringResults[url][signal.id][engine] = await scoreConsistency(
              brandData.brand_name, signal, engine, responses
            );
          } catch (err) {
            scoringResults[url][signal.id][engine] = {
              error: String(err), verdict: "absent", consistency_score: 0, presence_rate: 0,
              sentiment: "neutral", what_the_engine_believes: "", contradictions_found: [],
              gaps_vs_brand_claim: "", signal_name: signal.name, engine,
            };
          }
        }));
      }));
    }));

    await updateJob(jobId, { scoringResults, status: "done", progress: 100 });
  } catch (err) {
    console.error("[signal-consistency] Job error:", err);
    await updateJob(jobId, { status: "error", errorMessage: String(err) });
  }
}

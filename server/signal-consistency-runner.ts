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

// ── HTML helpers ──────────────────────────────────────────────────────────────

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

function extractBrandName(html: string, url: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]{2,80})<\/title>/i);
  const h1Match = html.match(/<h1[^>]*>([^<]{2,60})<\/h1>/i);
  const raw = (titleMatch?.[1] ?? h1Match?.[1] ?? "")
    .replace(/\s*[\|\-–—\/].*/, "")
    .replace(/&amp;/g, "&")
    .replace(/&[a-z]+;/gi, "")
    .trim();
  if (raw && raw.length >= 2 && raw.length <= 60) return raw;
  const domain = url.replace(/^https?:\/\/(www\.)?/, "").split(/[\.\/]/)[0];
  return domain.charAt(0).toUpperCase() + domain.slice(1);
}

async function fetchWebsite(url: string): Promise<{ html: string; text: string }> {
  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    const res = await fetch(normalized, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GEOBot/1.0)" },
      signal: AbortSignal.timeout(12000),
    });
    const html = await res.text();
    return { html, text: stripHtml(html) };
  } catch {
    return { html: "", text: `[Could not fetch ${url}]` };
  }
}

// ── Prompt 1 — Signal Derivation (primary brand only) ────────────────────────

async function deriveSignals(websiteContent: string): Promise<any> {
  const prompt = `You are an AI visibility analyst.

Read the website content below and identify the 4 most important signals that determine how well this brand is represented in LLM responses.

Focus only on brand-level signals: legitimacy, trust, authority, consistency of positioning, and credibility. Do not derive signals at the service or product level.

A signal qualifies if:
- It reflects what the brand is fundamentally claiming about itself
- It is something an LLM could have absorbed from public web content
- It differentiates this brand from generic players in its category
- Weak or absent LLM responses on this signal would indicate a real visibility or trust gap

Return ONLY valid JSON:
{
  "brand_name": "",
  "business_type": "",
  "segment": "b2b_saas | agency | service | other",
  "signals": [
    {
      "id": "signal_1",
      "name": "",
      "why_it_matters_for_ai_visibility": "",
      "what_strong_looks_like": "",
      "what_weak_looks_like": "",
      "base_question": ""
    }
  ]
}

base_question rules:
- Must NOT name the brand
- Written at business type level only — no services, no locations
- A natural question a real person would ask
- Open enough that multiple brands could appear in the answer
- Brand should appear only if it genuinely has presence on this signal

Website content:
${websiteContent}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });
  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Claude returned invalid JSON for signal derivation");
  return JSON.parse(jsonMatch[0]);
}

// ── Prompt 2 — Response Collection ───────────────────────────────────────────

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

// ── Prompt 3 — Consistency Scoring ───────────────────────────────────────────

async function scoreConsistency(
  brandName: string,
  businessType: string,
  signal: any,
  engine: string,
  responses: string[]
): Promise<any> {
  const prompt = `You are a brand visibility judge.

You will evaluate how consistently an AI engine represents a brand across multiple independent responses to the same question.

Brand: ${brandName}
Business type: ${businessType}
Signal: ${signal.name}
Question asked: ${signal.base_question}
Engine: ${engine}

What strong looks like: ${signal.what_strong_looks_like}
What weak looks like: ${signal.what_weak_looks_like}

Below are ${responses.length} independent responses collected in separate sessions.
Score strictly. Absence is a low score, not a neutral one.
A brand that appears inconsistently is worse than one that is consistently absent — inconsistency signals noise, not presence.

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

Scoring:
90-100 → Appears in most responses with the same consistent message
70-89  → Appears often, minor variation in framing
50-69  → Appears sometimes, vague or inconsistent when it does
30-49  → Rarely appears or only mentioned incidentally
0-29   → Absent or contradicted

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

// ── DB helper ─────────────────────────────────────────────────────────────────

async function updateJob(jobId: number, updates: Record<string, any>) {
  await db.update(signalConsistencyJobs).set(updates).where(eq(signalConsistencyJobs.id, jobId));
}

// ── Main runner ───────────────────────────────────────────────────────────────

export async function runSignalConsistency(jobId: number): Promise<void> {
  try {
    const [job] = await db.select().from(signalConsistencyJobs).where(eq(signalConsistencyJobs.id, jobId));
    if (!job) throw new Error("Job not found");

    const brands = (job.brands as string[]).filter(Boolean);
    const engines = (job.engines as string[]).filter(Boolean);
    const runCount = job.runCount;
    const [primaryUrl, ...competitorUrls] = brands;

    // ── Stage 1: Derive signals from primary brand; extract names for competitors ──
    await updateJob(jobId, { status: "discovering", progress: 5 });

    const [primarySite, ...competitorSites] = await Promise.all(
      brands.map(url => fetchWebsite(url))
    );

    // Primary brand: full signal derivation
    let primaryData: any;
    try {
      primaryData = await deriveSignals(primarySite.text);
    } catch (err) {
      throw new Error(`Signal derivation failed for primary brand: ${err}`);
    }

    // Competitors: brand name extraction only — they inherit primary brand's signals
    const discoveredSignals: Record<string, any> = {};
    discoveredSignals[primaryUrl] = primaryData;

    competitorUrls.forEach((url, i) => {
      const site = competitorSites[i];
      const brandName = extractBrandName(site.html, url);
      discoveredSignals[url] = {
        brand_name: brandName,
        business_type: primaryData.business_type,
        segment: primaryData.segment,
        signals: primaryData.signals, // inherited — same framework, different brand
        inherited: true,
      };
    });

    await updateJob(jobId, { discoveredSignals, progress: 20 });

    // ── Stage 2: Collect responses ONCE per signal × engine ───────────────────
    // base_question is brand-agnostic — same responses scored per brand in Stage 3
    await updateJob(jobId, { status: "running", progress: 20 });

    const signals = primaryData.signals as any[];
    // rawResponses keyed by signal_id → engine → responses[]  (NOT per brand)
    const rawResponses: Record<string, Record<string, string[]>> = {};

    await Promise.all(signals.map(async (signal: any) => {
      rawResponses[signal.id] = {};
      await Promise.all(engines.map(async (engine) => {
        const responses: string[] = [];
        for (let i = 0; i < runCount; i++) {
          try {
            const text = engine === "chatgpt"
              ? await queryChatGPT(signal.base_question)
              : await queryGemini(signal.base_question);
            responses.push(text);
            await new Promise(r => setTimeout(r, 300));
          } catch (err) {
            responses.push(`[Error: ${String(err).slice(0, 100)}]`);
          }
        }
        rawResponses[signal.id][engine] = responses;
      }));
    }));

    await updateJob(jobId, { rawResponses, progress: 75 });

    // ── Stage 3: Score each brand × signal × engine against same responses ────
    await updateJob(jobId, { status: "scoring", progress: 75 });

    const scoringResults: Record<string, Record<string, Record<string, any>>> = {};

    await Promise.all(brands.map(async (url) => {
      const brandData = discoveredSignals[url];
      const brandName = brandData.brand_name;
      const businessType = primaryData.business_type;
      scoringResults[url] = {};

      await Promise.all(signals.map(async (signal: any) => {
        scoringResults[url][signal.id] = {};
        await Promise.all(engines.map(async (engine) => {
          try {
            // Same response array, different brand name → Claude searches for each brand
            const responses = rawResponses[signal.id]?.[engine] ?? [];
            scoringResults[url][signal.id][engine] = await scoreConsistency(
              brandName, businessType, signal, engine, responses
            );
          } catch (err) {
            scoringResults[url][signal.id][engine] = {
              error: String(err), verdict: "absent", consistency_score: 0,
              presence_rate: 0, sentiment: "neutral", what_the_engine_believes: "",
              contradictions_found: [], gaps_vs_brand_claim: "",
              signal_name: signal.name, engine,
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

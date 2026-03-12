import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { db } from "../db";
import { brandIntelligenceJobs } from "@shared/schema";
import { eq } from "drizzle-orm";

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

export const ATTRIBUTE_KEYS = [
  "primary_credential",
  "years_in_market",
  "staff_qualification",
  "geographic_coverage",
  "response_time",
  "service_model",
  "service_list",
  "target_customer",
  "proof_numbers",
  "price_tier",
  "brand_wedge",
  "closest_competitor",
  "known_gap",
  "identity_summary",
] as const;

export type AttributeKey = (typeof ATTRIBUTE_KEYS)[number];

export const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  primary_credential: "Primary Credential",
  years_in_market: "Years in Market",
  staff_qualification: "Staff Qualification",
  geographic_coverage: "Geographic Coverage",
  response_time: "Response/Delivery Time",
  service_model: "Service Model",
  service_list: "Core Services",
  target_customer: "Target Customer",
  proof_numbers: "Proof Numbers",
  price_tier: "Price Tier",
  brand_wedge: "Brand Wedge",
  closest_competitor: "Closest Competitor",
  known_gap: "Known Gap vs Leader",
  identity_summary: "Identity Summary",
};

const ATTRIBUTE_GUIDE: Record<AttributeKey, string> = {
  primary_credential: "Most important specific accreditation or certification this brand holds",
  years_in_market: "Founding year or specific number of years operating",
  staff_qualification: "Specific qualification level of staff/team",
  geographic_coverage: "Specific locations, cities, or regions served",
  response_time: "Any stated delivery or response time commitment",
  service_model: "How they deliver — subscription, on-demand, retainer, in-person, etc.",
  service_list: "Specific named services or products this brand offers",
  target_customer: "Most specific customer type who benefits most from this brand",
  proof_numbers: "Specific proof points — review count, satisfaction %, award names",
  price_tier: "'budget', 'mid-market', or 'premium' with one-line reason",
  brand_wedge: "The ONE thing this brand is distinctively known for — not generic to category",
  closest_competitor: "Which other brand in this market is most similar to this one",
  known_gap: "The most important thing this brand lacks vs. the category leader",
  identity_summary: "One sentence: 'Brand X is known for [specific thing]' OR 'No clear distinctive identity found'",
};

const VARIATION_INTROS = [
  "Describe what you specifically know about this brand — what makes it distinct from others in its market.",
  "How does this brand compare to competitors in its market? Focus on what makes it DIFFERENT from the category norm.",
  "What type of customer would most benefit from choosing this brand over alternatives? What specific attributes drive that recommendation?",
];

function buildPrompt(brandName: string, brandUrl: string | null | undefined, variationIndex: number): string {
  const urlPart = brandUrl ? ` (website: ${brandUrl})` : "";
  const intro = VARIATION_INTROS[variationIndex % 3];

  const templateObj: Record<string, { value: null; evidence_type: string }> = {};
  for (const key of ATTRIBUTE_KEYS) {
    templateObj[key] = { value: null, evidence_type: "GENERIC" };
  }

  const guideLines = ATTRIBUTE_KEYS.map((k) => `- ${k}: ${ATTRIBUTE_GUIDE[k]}`).join("\n");

  return `You are analyzing the brand "${brandName}"${urlPart} to understand how it appears in your training knowledge.

${intro}

Fill the following JSON attribute table. Return ONLY valid JSON — no markdown, no extra text, just the raw JSON object.

RULES:
1. If an attribute applies equally to ANY brand in this category, set evidence_type to "GENERIC" and value to null.
2. Only populate attributes where you have SPECIFIC knowledge about THIS brand — not the category.
3. Use concrete specifics: exact numbers, certification names, specific service names.
4. Evidence types:
   - EXPLICIT: you directly recall this from known text or sources about this brand
   - INFERRED: you are reasoning from a real signal specific to this brand (not category logic)
   - ABSENT: you have no specific knowledge about this brand for this attribute — value MUST be null
   - GENERIC: this value applies to every brand in the category, not distinctive to this one — value MUST be null
5. CRITICAL — do NOT fill a field if you don't genuinely know it. Set evidence_type to "ABSENT" and leave value as null. A fabricated answer is far worse than an honest null. The presence of all 14 fields in the template does NOT mean you must fill all 14 — you should expect most fields to be null for brands you have little specific knowledge about.

Attribute guide:
${guideLines}

Fill this JSON (keep all keys, replace values only):
${JSON.stringify(templateObj, null, 2)}`;
}

function parseAttributeJSON(text: string): Record<string, { value: string | null; evidence_type: string }> | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function callEngine(engine: string, prompt: string): Promise<string> {
  if (engine === "gemini") {
    const response = await gemini.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { maxOutputTokens: 8192 },
    });
    return response.text ?? "";
  }

  if (engine === "chatgpt") {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });
    return response.choices[0]?.message?.content ?? "";
  }

  if (engine === "claude") {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    const block = response.content[0];
    return block.type === "text" ? block.text : "";
  }

  throw new Error(`Unknown engine: ${engine}`);
}

export interface AttributeResult {
  confidence_pct: number;
  mode_value: string | null;
  mode_evidence: string;
  value_counts: Record<string, number>;
  evidence_counts: Record<string, number>;
}

export interface DiagnosisResult {
  root_cause: "STRONG" | "WEAK_SIGNAL" | "CATEGORY_BLUR" | "ABSENCE";
  avg_confidence: number;
  strong_attributes: AttributeKey[];
  weak_attributes: AttributeKey[];
  absent_attributes: AttributeKey[];
  identity_summary: string | null;
}

export interface AggregatedResults {
  brand_name: string;
  brand_url: string | null;
  engine: string;
  run_count: number;
  attributes: Record<AttributeKey, AttributeResult>;
  diagnosis: DiagnosisResult;
}

function aggregateRuns(
  brandName: string,
  brandUrl: string | null | undefined,
  engine: string,
  rawRuns: Array<Record<string, { value: string | null; evidence_type: string }>>
): AggregatedResults {
  const attributes = {} as Record<AttributeKey, AttributeResult>;
  const total = rawRuns.length;

  for (const key of ATTRIBUTE_KEYS) {
    const valueCounts: Record<string, number> = {};
    const evidenceCounts: Record<string, number> = {};
    let informativeCount = 0;

    for (const run of rawRuns) {
      const attr = run[key];
      if (!attr) continue;
      const et = attr.evidence_type ?? "GENERIC";
      evidenceCounts[et] = (evidenceCounts[et] || 0) + 1;
      if (attr.value !== null && et !== "GENERIC" && et !== "ABSENT") {
        informativeCount++;
        const val = String(attr.value).trim();
        if (val) valueCounts[val] = (valueCounts[val] || 0) + 1;
      }
    }

    const confidence_pct = total > 0 ? Math.round((informativeCount / total) * 100) : 0;
    const modeValueEntry = Object.entries(valueCounts).sort((a, b) => b[1] - a[1])[0];
    const modeEvidenceEntry = Object.entries(evidenceCounts)
      .filter(([k]) => k !== "GENERIC" && k !== "ABSENT")
      .sort((a, b) => b[1] - a[1])[0];

    const fallbackEvidenceEntry = Object.entries(evidenceCounts)
      .sort((a, b) => b[1] - a[1])[0];

    attributes[key] = {
      confidence_pct,
      mode_value: modeValueEntry?.[0] ?? null,
      mode_evidence: modeEvidenceEntry?.[0] ?? fallbackEvidenceEntry?.[0] ?? "ABSENT",
      value_counts: valueCounts,
      evidence_counts: evidenceCounts,
    };
  }

  const diagnosticKeys = ATTRIBUTE_KEYS.filter((k) => k !== "identity_summary" && k !== "closest_competitor");
  const avgConfidence =
    diagnosticKeys.reduce((sum, k) => sum + attributes[k].confidence_pct, 0) / diagnosticKeys.length;

  const strong_attributes = diagnosticKeys.filter((k) => attributes[k].confidence_pct >= 70);
  const weak_attributes = diagnosticKeys.filter(
    (k) => attributes[k].confidence_pct >= 30 && attributes[k].confidence_pct < 70
  );
  const absent_attributes = diagnosticKeys.filter((k) => attributes[k].confidence_pct < 30);

  let root_cause: DiagnosisResult["root_cause"];
  if (avgConfidence < 20) {
    root_cause = "ABSENCE";
  } else if (avgConfidence < 45) {
    const explicitCount = diagnosticKeys.filter((k) => attributes[k].mode_evidence === "EXPLICIT").length;
    root_cause = explicitCount < 2 ? "CATEGORY_BLUR" : "WEAK_SIGNAL";
  } else if (avgConfidence < 65) {
    root_cause = "WEAK_SIGNAL";
  } else {
    root_cause = "STRONG";
  }

  return {
    brand_name: brandName,
    brand_url: brandUrl ?? null,
    engine,
    run_count: total,
    attributes,
    diagnosis: {
      root_cause,
      avg_confidence: Math.round(avgConfidence),
      strong_attributes,
      weak_attributes,
      absent_attributes,
      identity_summary: attributes.identity_summary?.mode_value ?? null,
    },
  };
}

export async function runBrandIntelligence(jobId: number): Promise<void> {
  const [job] = await db.select().from(brandIntelligenceJobs).where(eq(brandIntelligenceJobs.id, jobId));
  if (!job) throw new Error(`Job ${jobId} not found`);

  await db
    .update(brandIntelligenceJobs)
    .set({ status: "running", progress: 0 })
    .where(eq(brandIntelligenceJobs.id, jobId));

  const rawRuns: Array<Record<string, { value: string | null; evidence_type: string }>> = [];
  const failedRuns: number[] = [];

  for (let i = 0; i < job.runCount; i++) {
    try {
      const prompt = buildPrompt(job.brandName, job.brandUrl, i);
      const text = await callEngine(job.engine, prompt);
      const parsed = parseAttributeJSON(text);
      if (parsed) {
        rawRuns.push(parsed);
      } else {
        console.error(`[brand-intelligence] Job ${jobId} run ${i}: failed to parse JSON. Response preview: ${text.slice(0, 200)}`);
        failedRuns.push(i);
      }
    } catch (err) {
      console.error(`[brand-intelligence] Job ${jobId} run ${i} threw error:`, err);
      failedRuns.push(i);
    }

    await db
      .update(brandIntelligenceJobs)
      .set({ progress: i + 1 })
      .where(eq(brandIntelligenceJobs.id, jobId));

    if (i < job.runCount - 1) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  if (rawRuns.length === 0) {
    await db
      .update(brandIntelligenceJobs)
      .set({ status: "failed", error: "All runs failed to produce valid responses" })
      .where(eq(brandIntelligenceJobs.id, jobId));
    return;
  }

  const results = aggregateRuns(job.brandName, job.brandUrl, job.engine, rawRuns);

  await db
    .update(brandIntelligenceJobs)
    .set({
      status: "completed",
      progress: job.runCount,
      results: results as any,
      rawRuns: rawRuns as any,
    })
    .where(eq(brandIntelligenceJobs.id, jobId));
}

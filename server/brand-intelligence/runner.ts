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

function buildPrompt(
  brandName: string,
  brandUrl: string | null | undefined,
  variationIndex: number,
  webSearch: boolean
): string {
  const urlPart = brandUrl ? ` (website: ${brandUrl})` : "";
  const intro = VARIATION_INTROS[variationIndex % 3];

  const templateObj: Record<string, { value: null; evidence_type: string; sources?: string[] }> = {};
  for (const key of ATTRIBUTE_KEYS) {
    templateObj[key] = webSearch
      ? { value: null, evidence_type: "GENERIC", sources: [] }
      : { value: null, evidence_type: "GENERIC" };
  }

  const guideLines = ATTRIBUTE_KEYS.map((k) => `- ${k}: ${ATTRIBUTE_GUIDE[k]}`).join("\n");

  const sourcesRule = webSearch
    ? `6. SOURCES — For each attribute you fill with EXPLICIT or INFERRED evidence, list in "sources" the specific URL(s) from your web search that directly informed that value. Only include URLs genuinely about this brand and this attribute. If no specific URL applies, leave sources as [].`
    : "";

  return `You are analyzing the brand "${brandName}"${urlPart} to understand how it appears in ${webSearch ? "web sources" : "your training knowledge"}.

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
${sourcesRule}

Attribute guide:
${guideLines}

Fill this JSON (keep all keys, replace values only):
${JSON.stringify(templateObj, null, 2)}`;
}

function parseAttributeJSON(
  text: string
): Record<string, { value: string | null; evidence_type: string; sources?: string[] }> | null {
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

interface EngineCallResult {
  text: string;
  sessionSources: string[];
}

async function callEngine(engine: string, prompt: string, webSearch: boolean): Promise<EngineCallResult> {
  if (engine === "gemini") {
    if (webSearch) {
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
      const sessionSources: string[] = [];
      if (groundingMeta?.groundingChunks) {
        for (const chunk of groundingMeta.groundingChunks) {
          const url = chunk?.web?.uri;
          if (url) sessionSources.push(url);
        }
      }
      return { text, sessionSources };
    } else {
      const response = await gemini.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { maxOutputTokens: 8192 },
      });
      return { text: response.text ?? "", sessionSources: [] };
    }
  }

  if (engine === "chatgpt") {
    if (webSearch) {
      const directOpenai = new OpenAI({ apiKey: process.env.OPENAI_DIRECT_API_KEY });
      const response = await directOpenai.responses.create({
        model: "gpt-4o",
        tools: [{ type: "web_search" as any }],
        tool_choice: "required" as any,
        input: prompt,
        temperature: 0.5,
      } as any);
      const text = (response as any).output_text ?? "";
      const sessionSources: string[] = [];
      const output = (response as any).output;
      if (Array.isArray(output)) {
        for (const item of output) {
          if (item.type === "message" && Array.isArray(item.content)) {
            for (const part of item.content) {
              if (part.type === "output_text" && Array.isArray(part.annotations)) {
                for (const ann of part.annotations) {
                  if (ann.type === "url_citation" && ann.url) {
                    sessionSources.push(ann.url);
                  }
                }
              }
            }
          }
        }
      }
      return { text, sessionSources };
    } else {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });
      return { text: response.choices[0]?.message?.content ?? "", sessionSources: [] };
    }
  }

  if (engine === "claude") {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    const block = response.content[0];
    return { text: block.type === "text" ? block.text : "", sessionSources: [] };
  }

  throw new Error(`Unknown engine: ${engine}`);
}

export interface AttributeResult {
  confidence_pct: number;
  mode_value: string | null;
  mode_evidence: string;
  value_counts: Record<string, number>;
  evidence_counts: Record<string, number>;
  sources: string[];
}

export interface DiagnosisResult {
  root_cause: "STRONG" | "WEAK_SIGNAL" | "CATEGORY_BLUR" | "ABSENCE";
  avg_confidence: number;
  strong_attributes: AttributeKey[];
  weak_attributes: AttributeKey[];
  absent_attributes: AttributeKey[];
  identity_summary: string | null;
}

export interface AttributePacketMatch {
  idealValue: string;
  matchScore: number;
  gapType: "aligned" | "inconsistent" | "misaligned" | "absent";
}

export interface ConceptCoverage {
  concept: string;
  status: "present" | "partial" | "absent";
  evidence: string | null;
}

export interface PacketAnalysis {
  idealIdentity: string;
  recognizedIdentity: string;
  identityMatchScore: number;
  identityConcepts: ConceptCoverage[];
  attributeMatches: Partial<Record<AttributeKey, AttributePacketMatch>>;
  overallPacketFit: number;
}

export interface PacketDefinition {
  idealIdentity: string;
  template?: string;
  attributes: Partial<Record<AttributeKey, string>>;
}

export interface AggregatedResults {
  brand_name: string;
  brand_url: string | null;
  engine: string;
  run_count: number;
  web_search: boolean;
  attributes: Record<AttributeKey, AttributeResult>;
  diagnosis: DiagnosisResult;
  packetAnalysis?: PacketAnalysis;
}

function aggregateRuns(
  brandName: string,
  brandUrl: string | null | undefined,
  engine: string,
  webSearch: boolean,
  rawRuns: Array<Record<string, { value: string | null; evidence_type: string; sources?: string[] }>>
): AggregatedResults {
  const attributes = {} as Record<AttributeKey, AttributeResult>;
  const total = rawRuns.length;

  for (const key of ATTRIBUTE_KEYS) {
    const valueCounts: Record<string, number> = {};
    const evidenceCounts: Record<string, number> = {};
    const sourceCounts: Record<string, number> = {};
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
        if (Array.isArray(attr.sources)) {
          for (const url of attr.sources) {
            if (url && typeof url === "string") {
              sourceCounts[url] = (sourceCounts[url] || 0) + 1;
            }
          }
        }
      }
    }

    const confidence_pct = total > 0 ? Math.round((informativeCount / total) * 100) : 0;
    const modeValueEntry = Object.entries(valueCounts).sort((a, b) => b[1] - a[1])[0];
    const modeEvidenceEntry = Object.entries(evidenceCounts)
      .filter(([k]) => k !== "GENERIC" && k !== "ABSENT")
      .sort((a, b) => b[1] - a[1])[0];
    const fallbackEvidenceEntry = Object.entries(evidenceCounts).sort((a, b) => b[1] - a[1])[0];

    const topSources = Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([url]) => url);

    attributes[key] = {
      confidence_pct,
      mode_value: modeValueEntry?.[0] ?? null,
      mode_evidence: modeEvidenceEntry?.[0] ?? fallbackEvidenceEntry?.[0] ?? "ABSENT",
      value_counts: valueCounts,
      evidence_counts: evidenceCounts,
      sources: topSources,
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
    web_search: webSearch,
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

function gapType(confidencePct: number, matchScore: number): "aligned" | "inconsistent" | "misaligned" | "absent" {
  if (confidencePct < 40) return "absent";
  if (matchScore >= 75) return "aligned";
  if (matchScore >= 40) return "inconsistent";
  return "misaligned";
}

async function runPacketAnalysis(
  brandName: string,
  aggregated: AggregatedResults,
  packet: PacketDefinition
): Promise<PacketAnalysis> {
  const packetAttrs = packet.attributes as Record<string, string>;
  const attrKeys = ATTRIBUTE_KEYS.filter((k) => packetAttrs[k]);

  const attrRows = attrKeys.map((k) => ({
    key: k,
    ideal: packetAttrs[k],
    recognized: aggregated.attributes[k]?.mode_value ?? null,
    confidence_pct: aggregated.attributes[k]?.confidence_pct ?? 0,
  }));

  const recognizedNonNull = ATTRIBUTE_KEYS.filter(
    (k) => k !== "identity_summary" && aggregated.attributes[k]?.mode_value
  ).map((k) => `${ATTRIBUTE_LABELS[k]}: ${aggregated.attributes[k].mode_value}`);

  const batchPrompt = `You are a brand intelligence analyst comparing what an AI recognizes about "${brandName}" against an ideal healthcare brand packet.

TASK 1 — ATTRIBUTE MATCH SCORES (0-100):
For each attribute, score how well the "recognized" value semantically matches the "ideal" value.
- 100: semantically equivalent (e.g. "in-home care" = "at-home care")
- 75: largely equivalent, minor phrasing difference
- 50: partial overlap (some concepts match, some don't)
- 25: weak connection (same domain but different values)
- 0: no meaningful match OR recognized is null/absent

TASK 2 — RECOGNIZED IDENTITY:
Write a single factual sentence (max 30 words) describing ${brandName} using ONLY the recognized attribute values. Do not invent anything not in the list.

TASK 3 — IDENTITY CONCEPT COVERAGE:
The ideal identity is: "${packet.idealIdentity}"
Extract 5-7 key concepts from that ideal. For each concept, check if the recognized identity covers it.

Recognized attributes:
${recognizedNonNull.length > 0 ? recognizedNonNull.join("\n") : "No attributes recognized."}

Attributes to score:
${JSON.stringify(attrRows, null, 2)}

Return ONLY valid JSON in this exact shape (no markdown):
{
  "attributeScores": { "attribute_key": 0, ... },
  "recognizedIdentity": "...",
  "identityConcepts": [
    { "concept": "...", "status": "present|partial|absent", "evidence": "..." }
  ]
}`;

  let attributeScores: Record<string, number> = {};
  let recognizedIdentity = `${brandName} — no attributes recognized.`;
  let identityConcepts: ConceptCoverage[] = [];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: batchPrompt }],
      temperature: 0.2,
    });
    const raw = response.choices[0]?.message?.content ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      attributeScores = parsed.attributeScores ?? {};
      recognizedIdentity = parsed.recognizedIdentity ?? recognizedIdentity;
      identityConcepts = Array.isArray(parsed.identityConcepts) ? parsed.identityConcepts : [];
    }
  } catch (err) {
    console.error("[brand-intelligence] Packet analysis LLM call failed:", err);
  }

  const attributeMatches: Partial<Record<AttributeKey, AttributePacketMatch>> = {};
  let totalScore = 0;
  let scoredCount = 0;

  for (const key of attrKeys) {
    const idealValue = packetAttrs[key];
    const matchScore = Math.round(Math.max(0, Math.min(100, attributeScores[key] ?? 0)));
    const confidence_pct = aggregated.attributes[key]?.confidence_pct ?? 0;
    attributeMatches[key] = {
      idealValue,
      matchScore,
      gapType: gapType(confidence_pct, matchScore),
    };
    totalScore += matchScore;
    scoredCount++;
  }

  const overallPacketFit = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;

  const presentCount = identityConcepts.filter((c) => c.status === "present").length;
  const partialCount = identityConcepts.filter((c) => c.status === "partial").length;
  const totalConcepts = identityConcepts.length || 1;
  const identityMatchScore = Math.round(((presentCount + partialCount * 0.5) / totalConcepts) * 100);

  return {
    idealIdentity: packet.idealIdentity,
    recognizedIdentity,
    identityMatchScore,
    identityConcepts,
    attributeMatches,
    overallPacketFit,
  };
}

export async function runBrandIntelligence(jobId: number): Promise<void> {
  const [job] = await db.select().from(brandIntelligenceJobs).where(eq(brandIntelligenceJobs.id, jobId));
  if (!job) throw new Error(`Job ${jobId} not found`);

  await db
    .update(brandIntelligenceJobs)
    .set({ status: "running", progress: 0 })
    .where(eq(brandIntelligenceJobs.id, jobId));

  const rawRuns: Array<Record<string, { value: string | null; evidence_type: string; sources?: string[] }>> = [];
  const failedRuns: number[] = [];
  const webSearch = job.webSearch ?? false;

  for (let i = 0; i < job.runCount; i++) {
    try {
      const prompt = buildPrompt(job.brandName, job.brandUrl, i, webSearch);
      const { text, sessionSources } = await callEngine(job.engine, prompt, webSearch);
      const parsed = parseAttributeJSON(text);
      if (parsed) {
        if (webSearch && sessionSources.length > 0) {
          for (const key of ATTRIBUTE_KEYS) {
            const attr = parsed[key];
            if (attr && attr.value !== null && attr.evidence_type !== "GENERIC" && attr.evidence_type !== "ABSENT") {
              if (!Array.isArray(attr.sources) || attr.sources.length === 0) {
                attr.sources = sessionSources.slice(0, 3);
              }
            }
          }
        }
        rawRuns.push(parsed);
      } else {
        console.error(`[brand-intelligence] Job ${jobId} run ${i}: failed to parse JSON. Preview: ${text.slice(0, 300)}`);
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

  const results = aggregateRuns(job.brandName, job.brandUrl, job.engine, webSearch, rawRuns);

  if (job.packetMode && job.packetDefinition) {
    try {
      const packet = job.packetDefinition as unknown as PacketDefinition;
      results.packetAnalysis = await runPacketAnalysis(job.brandName, results, packet);
    } catch (err) {
      console.error("[brand-intelligence] Packet analysis failed:", err);
    }
  }

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

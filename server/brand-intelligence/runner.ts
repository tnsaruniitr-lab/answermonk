import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { db } from "../db";
import { brandIntelligenceJobs } from "@shared/schema";
import { eq } from "drizzle-orm";
import { getKnowledgeGraph, type CategoryKnowledgeGraph } from "./knowledge-graph";
import { resolveGroundingUrls } from "../report/grounding-resolver";

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

  const templateObj: Record<string, { value: null; evidence_type: string }> = {};
  for (const key of ATTRIBUTE_KEYS) {
    templateObj[key] = { value: null, evidence_type: "GENERIC" };
  }

  const guideLines = ATTRIBUTE_KEYS.map((k) => `- ${k}: ${ATTRIBUTE_GUIDE[k]}`).join("\n");

  const outputInstruction = webSearch
    ? `First write ONE sentence summarising the main web sources you found for this brand (this triggers proper source attribution). Then on the next line return the JSON object — no markdown fences, no other text.`
    : `Return ONLY valid JSON — no markdown, no extra text, just the raw JSON object.`;

  return `You are analyzing the brand "${brandName}"${urlPart} to understand how it appears in ${webSearch ? "web sources" : "your training knowledge"}.

${intro}

Fill the following JSON attribute table. ${outputInstruction}

RULES:
1. If an attribute applies equally to ANY brand in this category, set evidence_type to "GENERIC" and value to null.
2. Only populate attributes where you have SPECIFIC knowledge about THIS brand — not the category.
3. Use concrete specifics: exact numbers, certification names, specific service names.
4. Evidence types:
   - EXPLICIT: you directly recall this from known text or sources about this brand
   - INFERRED: you are reasoning from a real signal specific to this brand (not category logic)
   - ABSENT: you have no specific knowledge about this brand for this attribute — value MUST be null
   - GENERIC: this value applies to every brand in the category, not distinctive to this one — value MUST be null
5. CRITICAL — do NOT fill a field if you don't genuinely know it. Set evidence_type to "ABSENT" and leave value as null. A fabricated answer is far worse than an honest null.

Attribute guide:
${guideLines}

Fill this JSON (keep all keys, replace values only):
${JSON.stringify(templateObj, null, 2)}`;
}

function extractOutermostJson(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\" && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    if (ch === "}") { depth--; if (depth === 0) return text.slice(start, i + 1); }
  }
  return null;
}

function parseAttributeJSON(
  text: string
): Record<string, { value: string | null; evidence_type: string; sources?: string[] }> | null {
  try {
    const jsonStr = extractOutermostJson(text);
    if (!jsonStr) return null;
    const parsed = JSON.parse(jsonStr);
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed;
  } catch (err) {
    console.error("[brand-intelligence] JSON parse error:", String(err).slice(0, 120));
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
          maxOutputTokens: 32768,
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
        model: "gemini-2.5-flash",
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
                  if (ann.type === "url_citation" && ann.url &&
                      (ann.url.startsWith("http://") || ann.url.startsWith("https://"))) {
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
        model: "gpt-5.2",
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
  coherence_pct: number;
  per_run_values: Array<string | null>;
}

export interface DiagnosisResult {
  root_cause: "STRONG" | "WEAK_SIGNAL" | "CATEGORY_BLUR" | "ABSENCE";
  avg_confidence: number;
  avg_coherence: number;
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

export interface BenchmarkAttributeResult {
  gapClassification: "exceeds" | "aligned" | "underspecified" | "outside";
  score: number;
  note: string;
  categoryTier: "floor" | "signal" | "differentiator" | "unknown";
  categoryValue: string | null;
}

export interface BenchmarkAnalysis {
  categoryName: string;
  categoryPresenceScore: number;
  identityCoherenceScore: number;
  brandIdentitySummary: string;
  wedgeCollision: {
    detected: boolean;
    collidingWinner?: string;
    note: string;
  };
  attributeResults: Partial<Record<AttributeKey, BenchmarkAttributeResult>>;
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
  benchmarkAnalysis?: BenchmarkAnalysis;
}

// ── Semantic coherence helpers ───────────────────────────────────────────────

const STOPWORDS = new Set([
  "and","the","in","at","of","for","a","an","or","to","with","on","by",
  "from","as","is","are","was","were","be","been","its","their","our",
  "your","this","that","these","those","also","across","including","such",
  "both","per","via","over","about","home","based","care","services",
]);

function tokenizeValue(val: string): Set<string> {
  return new Set(
    val.toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 2 && !STOPWORDS.has(w))
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Greedy single-linkage clustering by Jaccard token overlap.
 * Returns the size of the largest cluster and a representative value.
 */
function computeSemanticMode(
  values: string[],
  threshold = 0.4
): { modeValue: string; modeCount: number } {
  if (values.length === 0) return { modeValue: "", modeCount: 0 };
  const tokenSets = values.map(tokenizeValue);
  const clusterOf = new Array<number>(values.length).fill(-1);
  let nextId = 0;

  for (let i = 0; i < values.length; i++) {
    if (clusterOf[i] !== -1) continue;
    clusterOf[i] = nextId;
    for (let j = i + 1; j < values.length; j++) {
      if (clusterOf[j] !== -1) continue;
      if (jaccardSimilarity(tokenSets[i], tokenSets[j]) >= threshold) {
        clusterOf[j] = nextId;
      }
    }
    nextId++;
  }

  const counts: Record<number, number> = {};
  for (const id of clusterOf) counts[id] = (counts[id] ?? 0) + 1;
  const modeId = Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
  const modeCount = counts[modeId];
  const modeValue = values[clusterOf.indexOf(modeId)];
  return { modeValue, modeCount };
}

// ─────────────────────────────────────────────────────────────────────────────

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

    const perRunValues: Array<string | null> = rawRuns.map((run) => {
      const attr = run[key];
      if (!attr || attr.evidence_type === "ABSENT" || attr.evidence_type === "GENERIC") return null;
      return attr.value ?? null;
    });

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
            if (url && typeof url === "string" &&
                (url.startsWith("http://") || url.startsWith("https://"))) {
              sourceCounts[url] = (sourceCounts[url] || 0) + 1;
            }
          }
        }
      }
    }

    const confidence_pct = total > 0 ? Math.round((informativeCount / total) * 100) : 0;
    const modeEvidenceEntry = Object.entries(evidenceCounts)
      .filter(([k]) => k !== "GENERIC" && k !== "ABSENT")
      .sort((a, b) => b[1] - a[1])[0];
    const fallbackEvidenceEntry = Object.entries(evidenceCounts).sort((a, b) => b[1] - a[1])[0];

    const topSources = Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([url]) => url);

    // Semantic coherence: group values by token overlap instead of exact match
    const informativeValues = rawRuns
      .map((run) => run[key])
      .filter((attr) => attr && attr.value !== null && attr.evidence_type !== "GENERIC" && attr.evidence_type !== "ABSENT")
      .map((attr) => String(attr!.value).trim())
      .filter((v) => v.length > 0);

    const totalInformative = informativeValues.length;
    let semanticModeValue: string | null = null;
    let semanticModeCount = 0;

    if (totalInformative > 0) {
      const { modeValue, modeCount } = computeSemanticMode(informativeValues);
      semanticModeValue = modeValue || null;
      semanticModeCount = modeCount;
    }

    const coherence_pct = totalInformative > 0 ? Math.round((semanticModeCount / totalInformative) * 100) : 0;

    attributes[key] = {
      confidence_pct,
      mode_value: semanticModeValue,
      mode_evidence: modeEvidenceEntry?.[0] ?? fallbackEvidenceEntry?.[0] ?? "ABSENT",
      value_counts: valueCounts,
      evidence_counts: evidenceCounts,
      sources: topSources,
      coherence_pct,
      per_run_values: perRunValues,
    };
  }

  const diagnosticKeys = ATTRIBUTE_KEYS.filter((k) => k !== "identity_summary" && k !== "closest_competitor");
  const avgConfidence =
    diagnosticKeys.reduce((sum, k) => sum + attributes[k].confidence_pct, 0) / diagnosticKeys.length;

  const coherentKeys = diagnosticKeys.filter((k) => {
    const total = Object.values(attributes[k].value_counts).reduce((a, b) => a + b, 0);
    return total > 0;
  });
  const avg_coherence =
    coherentKeys.length > 0
      ? Math.round(coherentKeys.reduce((sum, k) => sum + attributes[k].coherence_pct, 0) / coherentKeys.length)
      : 0;

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
      avg_coherence,
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
      model: "gpt-5.2",
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

async function runBenchmarkAnalysis(
  brandName: string,
  aggregated: AggregatedResults,
  graph: CategoryKnowledgeGraph
): Promise<BenchmarkAnalysis> {
  const attrSummaries = ATTRIBUTE_KEYS.map((k) => {
    const norm = graph.attributes[k];
    const recognized = aggregated.attributes[k];
    return {
      key: k,
      label: ATTRIBUTE_LABELS[k],
      tier: norm?.tier ?? "unknown",
      categoryStandard: norm?.description ?? "No category standard established",
      recognizedValue: recognized?.mode_value ?? null,
      coherence: recognized?.coherence_pct ?? 0,
      confidence: recognized?.confidence_pct ?? 0,
      distinctValues: Object.keys(recognized?.value_counts ?? {}).length,
    };
  });

  const prompt = `You are evaluating the AI-recognized brand identity of "${brandName}" against the ${graph.name} category leaders.

WINNER BRANDS: ${graph.winnerNames.join(", ")}

WINNER DIFFERENTIATING WEDGES (each brand owns exactly one unique position):
${graph.winnerWedges.map((w) => `- ${w.brand}: ${w.wedge}`).join("\n")}

ATTRIBUTE-BY-ATTRIBUTE EVALUATION:
${attrSummaries
  .map(
    (a) => `[${a.key}] ${a.label} | Category Tier: ${a.tier.toUpperCase()}
  Category standard: ${a.categoryStandard}
  Target brand recognized value: ${a.recognizedValue ?? "NULL — not recognized by AI"}
  Recognition confidence: ${a.confidence}% across runs | Identity coherence: ${a.coherence}% (${a.distinctValues} distinct values seen)`
  )
  .join("\n\n")}

Evaluate each attribute. Return ONLY valid JSON:
{
  "attributeEvaluations": {
    "attribute_key": {
      "gapClassification": "exceeds|aligned|underspecified|outside",
      "score": 0,
      "note": "one specific actionable sentence about this gap or strength"
    }
  },
  "brandIdentitySummary": "one sentence using ONLY the recognized values listed above — do not invent",
  "wedgeCollision": {
    "detected": false,
    "collidingWinner": null,
    "note": "one sentence assessing brand_wedge uniqueness vs winner wedges"
  }
}

Gap classification rules:
- exceeds: recognized value meets or surpasses the category standard (JCI Gold Seal exceeds DHA-licensed floor; 24/7 > on-demand)
- aligned: recognized value is semantically equivalent to the category standard
- underspecified: brand is in the right category but too generic ("licensed provider" vs "DHA-licensed"; "patients" vs "elderly and post-surgical")
- outside: recognized value is categorically disconnected from winners (wrong domain, non-human patients, unrelated service type)
- If recognized value is null/absent AND attribute is floor tier: score 0, classification = "outside"
- If recognized value is null/absent AND attribute is signal/differentiator tier: score 25, classification = "underspecified"

Score: 100=exceeds, 90=fully aligned, 75=mostly aligned minor gap, 50=underspecified in-category, 25=borderline or null signal-tier, 0=outside or null floor-tier

Note: when coherence < 50%, the brand renders inconsistent values across runs — mention this as identity instability risk.
Wedge collision: check if recognized brand_wedge semantically overlaps with any winner's owned wedge above.`;

  let attributeEvaluations: Record<string, { gapClassification: string; score: number; note: string }> = {};
  let brandIdentitySummary = `${brandName} — insufficient AI recognition data to synthesize identity.`;
  let wedgeCollision: BenchmarkAnalysis["wedgeCollision"] = {
    detected: false,
    note: "No brand wedge recognized.",
  };

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });
    const raw = response.choices[0]?.message?.content ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      attributeEvaluations = parsed.attributeEvaluations ?? {};
      brandIdentitySummary = parsed.brandIdentitySummary ?? brandIdentitySummary;
      if (parsed.wedgeCollision) {
        wedgeCollision = {
          detected: !!parsed.wedgeCollision.detected,
          collidingWinner: parsed.wedgeCollision.collidingWinner ?? undefined,
          note: parsed.wedgeCollision.note ?? "",
        };
      }
    }
  } catch (err) {
    console.error("[brand-intelligence] Benchmark analysis LLM call failed:", err);
  }

  const attributeResults: Partial<Record<AttributeKey, BenchmarkAttributeResult>> = {};
  for (const key of ATTRIBUTE_KEYS) {
    const ev = attributeEvaluations[key];
    const norm = graph.attributes[key];
    if (ev) {
      attributeResults[key] = {
        gapClassification: ev.gapClassification as BenchmarkAttributeResult["gapClassification"],
        score: Math.round(Math.max(0, Math.min(100, ev.score))),
        note: ev.note,
        categoryTier: (norm?.tier ?? "unknown") as BenchmarkAttributeResult["categoryTier"],
        categoryValue: norm?.canonicalValue ?? null,
      };
    }
  }

  const scoredValues = Object.values(attributeResults);
  const categoryPresenceScore =
    scoredValues.length > 0
      ? Math.round(scoredValues.reduce((sum, r) => sum + r.score, 0) / scoredValues.length)
      : 0;

  const diagnosticKeys = ATTRIBUTE_KEYS.filter((k) => k !== "identity_summary" && k !== "closest_competitor");
  const coherentKeys = diagnosticKeys.filter((k) => {
    const vals = Object.values(aggregated.attributes[k]?.value_counts ?? {});
    return vals.reduce((a, b) => a + b, 0) > 0;
  });
  const identityCoherenceScore =
    coherentKeys.length > 0
      ? Math.round(
          coherentKeys.reduce((sum, k) => sum + (aggregated.attributes[k]?.coherence_pct ?? 0), 0) /
            coherentKeys.length
        )
      : 0;

  return {
    categoryName: graph.name,
    categoryPresenceScore,
    identityCoherenceScore,
    brandIdentitySummary,
    wedgeCollision,
    attributeResults,
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
                attr.sources = sessionSources;
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

  // Resolve grounding redirect URLs to actual destination URLs, then deduplicate by hostname.
  // Dedup always runs regardless of whether any vertex URLs were resolved, so that multiple
  // pages on the same domain (e.g. feelvaleo.com/about, feelvaleo.com/services) collapse to one.
  if (webSearch) {
    let resolved = new Map<string, { resolvedUrl: string }>();
    try {
      const allSources = ATTRIBUTE_KEYS.flatMap((k) => results.attributes[k]?.sources ?? []);
      resolved = await resolveGroundingUrls(allSources, 8);
    } catch (err) {
      console.error("[brand-intelligence] Grounding URL resolution failed:", err);
    }
    for (const key of ATTRIBUTE_KEYS) {
      const attr = results.attributes[key];
      if (attr?.sources?.length) {
        const resolvedUrls = attr.sources
          .map((url) => resolved.get(url)?.resolvedUrl ?? url)
          .filter((url) => url.startsWith("http"));
        // Deduplicate by hostname — always runs so same-domain pages collapse to one entry
        const seen = new Set<string>();
        attr.sources = resolvedUrls.filter((url) => {
          try {
            const host = new URL(url).hostname.replace(/^www\./, "");
            if (seen.has(host)) return false;
            seen.add(host);
            return true;
          } catch { return false; }
        });
      }
    }
  }

  if (job.packetMode && job.packetDefinition) {
    try {
      const packet = job.packetDefinition as unknown as PacketDefinition;
      results.packetAnalysis = await runPacketAnalysis(job.brandName, results, packet);
    } catch (err) {
      console.error("[brand-intelligence] Packet analysis failed:", err);
    }
  }

  if (job.benchmarkMode && job.benchmarkCategory) {
    const graph = getKnowledgeGraph(job.benchmarkCategory);
    if (graph) {
      try {
        results.benchmarkAnalysis = await runBenchmarkAnalysis(job.brandName, results, graph);
      } catch (err) {
        console.error("[brand-intelligence] Benchmark analysis failed:", err);
      }
    } else {
      console.error(`[brand-intelligence] Unknown benchmark category: ${job.benchmarkCategory}`);
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

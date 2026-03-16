import OpenAI from "openai";
import { db } from "./db";
import { citationSignalIntelligence, citationPageMentions, multiSegmentSessions } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const GPT4O_INPUT_COST_PER_1M = 2.50;
const GPT4O_OUTPUT_COST_PER_1M = 10.00;

export interface SignalRanking {
  rank: number;
  signal_key: string;
  signal_name: string;
  signal?: string;
  why_it_matters: string;
  evidence_pattern: string;
  demonstrated_by: string[];
  example: string;
  confidence: "high" | "medium" | "low";
}

export interface BrandPlaybookEntry {
  brand: string;
  segments_present: number;
  appearance_rate: string;
  cross_engine_presence: string;
  strongest_signals: string[];
  what_works: string[];
  examples: string[];
}

export interface SignalIntelligenceResult {
  signal_rankings: SignalRanking[];
  brand_playbook: BrandPlaybookEntry[];
}

export interface SignalIntelligenceResponse {
  result: SignalIntelligenceResult;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  promptText: string;
  cached: boolean;
  createdAt?: Date;
}

function extractTopCompetitors(citationReport: any, topN = 4): { name: string; appearanceRate: number; segmentsPresent: number }[] {
  if (!citationReport?.segments) return [];

  const competitorMap = new Map<string, { appearances: number; segments: number }>();

  for (const seg of citationReport.segments) {
    const topK: { name: string; appearance_rate: number }[] = seg.comparison?.topK || [];
    for (const c of topK) {
      if (!c.name) continue;
      const existing = competitorMap.get(c.name) || { appearances: 0, segments: 0 };
      competitorMap.set(c.name, {
        appearances: existing.appearances + c.appearance_rate,
        segments: existing.segments + 1,
      });
    }
  }

  return Array.from(competitorMap.entries())
    .map(([name, data]) => ({
      name,
      appearanceRate: data.appearances / (citationReport.segments.length || 1),
      segmentsPresent: data.segments,
    }))
    .sort((a, b) => b.segmentsPresent - a.segmentsPresent || b.appearanceRate - a.appearanceRate)
    .slice(0, topN);
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function buildSystemMessage(): string {
  return `You are an AI citation-pattern analyst.`;
}

function buildPrompt(
  brandName: string,
  topCompetitors: { name: string; appearanceRate: number; segmentsPresent: number }[],
  competitorPages: { brand: string; domain: string; url: string; content: string }[],
  aiResponses: { engine: string; response: string; url: string }[],
  segmentCount: number,
): string {
  const competitorSummary = topCompetitors.map(c =>
    `- ${c.name}: appears in ${c.segmentsPresent}/${segmentCount} segments, avg ${Math.round(c.appearanceRate * 100)}% visibility`
  ).join("\n");

  const pagesBlock = competitorPages.map(p =>
    `### ${p.brand} — ${p.domain}\nURL: ${p.url}\n${p.content.slice(0, 700)}`
  ).join("\n\n");

  const aiBlock = aiResponses.slice(0, 80).map(r =>
    `[${r.engine}] ${r.url}\n${r.response.slice(0, 250)}`
  ).join("\n\n");

  return `You are given citation data and scraped evidence from ChatGPT, Gemini, and Claude for the home healthcare market in Dubai across multiple search segments.

The target brand is: ${brandName}

Your job is to identify the real drivers of AI-engine citation visibility in this market, not just repeated brand appearances.

Return a JSON object with exactly two keys:

signal_rankings

brand_playbook

Important analysis rules:

Focus on signals that plausibly influence why AI engines cite certain brands in this market.

Prioritize repeated, evidenced patterns across engines and segments.

Do not give generic SEO advice.

Every signal must be grounded in actual evidence from the provided data.

Prefer signals that are commercially meaningful and structurally reusable.

Separate service breadth from service depth.

Separate onsite trust signals from offsite authority/mentions.

Treat repetition across multiple engines as stronger evidence than a single-engine citation.

If evidence is weak for a signal, lower its rank.

Signal framework to evaluate:
You must explicitly consider and rank among these types of signals:

context_consistency

authority_domain_mentions

trust_signals

service_width

service_depth

local_regulatory_relevance

entity_clarity

geo_relevance

clinical_specificity

brand_prominence_across_engines

structured_service_architecture

third_party_validation

Definitions:

context_consistency = whether the same brand is described consistently across pages, engines, and search intents

authority_domain_mentions = presence on or mentions from strong third-party domains relevant to healthcare, local directories, press, review sites, government, insurers, etc.

trust_signals = explicit signals such as DHA licensing, doctor/nurse qualifications, years in operation, testimonials, ratings, contact/address transparency, medical process clarity

service_width = number of distinct home healthcare service categories covered

service_depth = how specifically and thoroughly each service is described, including sub-services, care types, eligibility, process, and condition-specific detail

local_regulatory_relevance = Dubai/UAE healthcare compliance, DHA references, local accreditation, insurance/local ops relevance

entity_clarity = how clearly the site explains what the company is, who it serves, and what exactly it offers

geo_relevance = how strongly pages are tailored to Dubai/UAE intent

clinical_specificity = presence of medically specific service details, care pathways, clinician types, and use-case clarity

brand_prominence_across_engines = repeated citation across ChatGPT, Gemini, and Claude

structured_service_architecture = whether services are separated into crawlable, clearly titled pages/hubs

third_party_validation = reviews, awards, partnerships, media mentions, directories, aggregator citations

---

## Top Competing Brands by AI Visibility
${competitorSummary}

## Scraped Pages from Top Competitor Websites
${pagesBlock}

## AI Engine Response Summaries (what engines said about citation URLs)
${aiBlock}

---

Output requirements:

"signal_rankings"
Return an array of the top 8 signals ranked from #1 to #8.
For each object include:

rank

signal_key

signal_name

why_it_matters

evidence_pattern

demonstrated_by

example

confidence

Field rules:

signal_key must use snake_case from the signal framework above

signal_name must be short and human-readable

why_it_matters must explain why this affects AI citation specifically in Dubai home healthcare

evidence_pattern must describe the repeated pattern seen across brands/engines/segments

demonstrated_by must be an array of competitor brands that clearly exhibit this signal

example must include one concrete example with real URL or specific page detail from the provided data

confidence must be one of: high, medium, low

"brand_playbook"
Return an array for the top 4 repeating competitor brands.
For each object include:

brand

segments_present

appearance_rate

cross_engine_presence

strongest_signals

what_works

examples

Field rules:

appearance_rate must be formatted like "57%"

cross_engine_presence must state which of ChatGPT, Gemini, Claude cited the brand

strongest_signals must be an array of 3-5 signal_key values from signal_rankings

what_works must be an array of specific, evidence-based reasons this brand gets cited

examples must be an array of 2-4 concrete examples with real URLs or page details from the provided data

Important constraints:

Do not invent evidence.

Do not include recommendations for ${brandName}.

Do not collapse all signals into "authority" or "trust"; keep distinct drivers separate.

Do not use vague phrases like "strong SEO," "good content," or "well optimized" unless tied to actual evidence.

If two signals overlap, explain the distinction clearly.

Base the ranking on actual citation-driver strength, not on what sounds strategically nice.

Return ONLY valid JSON. No markdown, no commentary outside the JSON object.`;
}

export async function runSignalIntelligence(sessionId: number, force = false): Promise<SignalIntelligenceResponse> {
  if (!force) {
    const existing = await db
      .select()
      .from(citationSignalIntelligence)
      .where(eq(citationSignalIntelligence.sessionId, sessionId))
      .orderBy(desc(citationSignalIntelligence.createdAt))
      .limit(1);

    if (existing.length > 0) {
      const row = existing[0];
      return {
        result: row.result as SignalIntelligenceResult,
        promptTokens: row.promptTokens,
        completionTokens: row.completionTokens,
        costUsd: row.costUsd,
        promptText: row.promptText || "",
        cached: true,
        createdAt: row.createdAt || undefined,
      };
    }
  }

  const session = await db
    .select()
    .from(multiSegmentSessions)
    .where(eq(multiSegmentSessions.id, sessionId))
    .limit(1);

  if (!session.length) throw new Error("Session not found");

  const { brandName, citationReport } = session[0] as any;
  const report = citationReport as any;

  if (!report?.segments?.length) {
    throw new Error("No citation report found for this session. Run citation analysis first.");
  }

  const topCompetitors = extractTopCompetitors(report, 4);
  const topDomains = new Set<string>();
  const brandDomainLower = (session[0].brandDomain || "").toLowerCase();

  for (const c of topCompetitors) {
    const segData = report.segments.flatMap((s: any) =>
      (s.scores?.competitorA?.authority?.topDomains || [])
        .concat(s.scores?.competitorB?.authority?.topDomains || [])
    );
    for (const d of segData) {
      if (d.domain && !d.domain.includes(brandDomainLower)) topDomains.add(d.domain);
    }
  }

  const citationRows = await db
    .select({
      url: citationPageMentions.url,
      resolvedUrl: citationPageMentions.resolvedUrl,
      domain: citationPageMentions.domain,
      brand: citationPageMentions.brand,
      scrapedContent: citationPageMentions.scrapedContent,
      aiResponseText: citationPageMentions.aiResponseText,
      fetchStatus: citationPageMentions.fetchStatus,
    })
    .from(citationPageMentions)
    .where(eq(citationPageMentions.sessionId, sessionId));

  const competitorNames = topCompetitors.map(c => c.name.toLowerCase());
  const competitorPages: { brand: string; domain: string; url: string; content: string }[] = [];
  const seenDomains = new Set<string>();

  for (const row of citationRows) {
    if (row.fetchStatus !== "crawled" || !row.scrapedContent) continue;
    const domain = row.domain || extractDomain(row.resolvedUrl || row.url);
    if (seenDomains.has(domain)) continue;
    if (brandDomainLower && domain.includes(brandDomainLower)) continue;

    const brandMatch = competitorNames.find(n => domain.includes(n.split(" ")[0].toLowerCase()));
    if (brandMatch || topDomains.has(domain)) {
      const matchedBrand = topCompetitors.find(c =>
        domain.includes(c.name.split(" ")[0].toLowerCase())
      )?.name || row.brand || domain;

      competitorPages.push({
        brand: matchedBrand,
        domain,
        url: row.resolvedUrl || row.url,
        content: row.scrapedContent,
      });
      seenDomains.add(domain);
    }
    if (competitorPages.length >= 20) break;
  }

  const aiResponses: { engine: string; response: string; url: string }[] = [];
  for (const row of citationRows) {
    if (row.fetchStatus !== "ai_fallback" || !row.aiResponseText) continue;
    const entries = row.aiResponseText as any[];
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      if (entry?.response) {
        aiResponses.push({
          engine: entry.engine || "unknown",
          response: entry.response,
          url: row.resolvedUrl || row.url,
        });
      }
    }
  }

  const promptText = buildPrompt(brandName, topCompetitors, competitorPages, aiResponses, report.segments.length);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: buildSystemMessage() },
      { role: "user", content: promptText },
    ],
    response_format: { type: "json_object" },
    max_tokens: 4500,
    temperature: 0.3,
  });

  const rawContent = completion.choices[0]?.message?.content || "{}";
  let result: SignalIntelligenceResult;
  try {
    result = JSON.parse(rawContent);
  } catch {
    throw new Error("OpenAI returned invalid JSON");
  }

  const usage = completion.usage;
  const promptTokens = usage?.prompt_tokens || 0;
  const completionTokens = usage?.completion_tokens || 0;
  const costUsd = (promptTokens / 1_000_000) * GPT4O_INPUT_COST_PER_1M +
    (completionTokens / 1_000_000) * GPT4O_OUTPUT_COST_PER_1M;

  await db.insert(citationSignalIntelligence).values({
    sessionId,
    result: result as any,
    promptTokens,
    completionTokens,
    costUsd,
    promptText,
  });

  return {
    result,
    promptTokens,
    completionTokens,
    costUsd,
    promptText,
    cached: false,
  };
}

export async function getSignalIntelligence(sessionId: number): Promise<SignalIntelligenceResponse | null> {
  const existing = await db
    .select()
    .from(citationSignalIntelligence)
    .where(eq(citationSignalIntelligence.sessionId, sessionId))
    .orderBy(desc(citationSignalIntelligence.createdAt))
    .limit(1);

  if (!existing.length) return null;

  const row = existing[0];
  return {
    result: row.result as SignalIntelligenceResult,
    promptTokens: row.promptTokens,
    completionTokens: row.completionTokens,
    costUsd: row.costUsd,
    promptText: row.promptText || "",
    cached: true,
    createdAt: row.createdAt || undefined,
  };
}

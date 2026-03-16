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
  signal: string;
  why_it_matters: string;
  demonstrated_by: string[];
  example: string;
}

export interface BrandPlaybookEntry {
  brand: string;
  segments_present: number;
  appearance_rate: string;
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

  return `You are a Generative Engine Optimization (GEO) expert analyst.

You have been given citation data from AI engine responses (ChatGPT, Gemini, Claude) for the home healthcare market in Dubai, across ${segmentCount} search segments.

The brand being analysed is: ${brandName}

## Top Competing Brands by AI Visibility
${competitorSummary}

## Scraped Pages from Top Competitor Websites
${pagesBlock}

## AI Engine Response Summaries (what engines said about citation URLs)
${aiBlock}

---

Analyse all the above and return a JSON object with exactly two keys:

### 1. signal_rankings
An array of the top 6 signals that drive AI engine citation in this market, ranked #1 (most impactful) to #6.
For each signal provide:
- rank (number)
- signal (short name, e.g. "DHA Licensing & Accreditation")
- why_it_matters (1-2 sentences on why AI engines weight this signal heavily in this specific market)
- demonstrated_by (array of brand names from the competitor list that clearly show this signal)
- example (one concrete, specific example of how a brand demonstrates this — cite a real URL or page detail from the data above)

### 2. brand_playbook
An array covering the top 3-4 repeating competitor brands. For each:
- brand (name)
- segments_present (number of segments they appear in)
- appearance_rate (formatted as "XX%")
- what_works (array of 3-4 specific, concrete things this brand does that causes AI engines to cite them — not generic advice, reference actual page content or patterns from the scraped data)
- examples (array of 2-3 specific examples citing real URLs or page details from the scraped data above)

Return ONLY valid JSON. No markdown, no commentary outside the JSON object.`;
}

export async function runSignalIntelligence(sessionId: number): Promise<SignalIntelligenceResponse> {
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
    messages: [{ role: "user", content: promptText }],
    response_format: { type: "json_object" },
    max_tokens: 3000,
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

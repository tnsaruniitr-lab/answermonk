import OpenAI from "openai";
import type { CrawledPage } from "./crawler";
import type { ClassifiedSource } from "./classifier";
import type { QueryDimensions } from "./intentParser";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface QuoteEvidence {
  quote: string;
  context: string;
  brandMentioned: string | null;
  listPosition: number | null;
  totalInList: number | null;
  proximityCategory: "same_chunk" | "nearby_chunk" | "distant";
  tokenDistance: number;
  dimensionRelevance: Record<string, "supported" | "weak_support" | "neutral" | "contradicted">;
}

export interface SourceExtraction {
  url: string;
  domain: string;
  brandsFound: string[];
  brandMentionCount: number;
  targetBrandFound: boolean;
  targetBrandPosition: number | null;
  totalBrandsListed: number;
  quotes: QuoteEvidence[];
  overallRelevance: "high" | "medium" | "low";
}

const TOKEN_WINDOW_MIN = 15;
const TOKEN_WINDOW_MAX = 25;

function tokenize(text: string): string[] {
  return text.split(/\s+/).filter(t => t.length > 0);
}

function extractListPositions(text: string, brandName: string): { position: number | null; total: number } {
  const lower = text.toLowerCase();
  const brandLower = brandName.toLowerCase();
  const listPatterns = [
    /(?:^|\n)\s*(\d+)[.)\-:]\s+(.+?)(?:\n|$)/g,
    /(?:^|\n)\s*#(\d+)[.:\s]+(.+?)(?:\n|$)/g,
  ];

  let position: number | null = null;
  let maxNum = 0;

  for (const pattern of listPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const num = parseInt(match[1], 10);
      const itemText = match[2].toLowerCase();
      if (num > maxNum) maxNum = num;
      if (itemText.includes(brandLower) && position === null) {
        position = num;
      }
    }
  }

  return { position, total: maxNum };
}

function measureProximity(
  text: string,
  brandName: string,
  queryTerm: string,
): { category: "same_chunk" | "nearby_chunk" | "distant"; tokenDistance: number } {
  const tokens = tokenize(text.toLowerCase());
  const brandTokens = tokenize(brandName.toLowerCase());
  const queryTokens = tokenize(queryTerm.toLowerCase());

  let brandIdx = -1;
  let queryIdx = -1;

  for (let i = 0; i < tokens.length; i++) {
    if (brandIdx < 0 && brandTokens.some(bt => tokens[i].includes(bt))) {
      brandIdx = i;
    }
    if (queryIdx < 0 && queryTokens.some(qt => tokens[i].includes(qt))) {
      queryIdx = i;
    }
    if (brandIdx >= 0 && queryIdx >= 0) break;
  }

  if (brandIdx < 0 || queryIdx < 0) {
    return { category: "distant", tokenDistance: 999 };
  }

  const distance = Math.abs(brandIdx - queryIdx);
  if (distance <= 25) return { category: "same_chunk", tokenDistance: distance };
  if (distance <= 75) return { category: "nearby_chunk", tokenDistance: distance };
  return { category: "distant", tokenDistance: distance };
}

function extractQuoteWindows(
  text: string,
  brandName: string,
): string[] {
  const lower = text.toLowerCase();
  const brandLower = brandName.toLowerCase();
  const quotes: string[] = [];

  let idx = 0;
  while (idx < lower.length) {
    const pos = lower.indexOf(brandLower, idx);
    if (pos < 0) break;

    const before = text.slice(Math.max(0, pos - 200), pos);
    const after = text.slice(pos, Math.min(text.length, pos + brandLower.length + 200));
    const window = (before + after).trim();

    const tokens = tokenize(window);
    const brandTokenIdx = tokens.findIndex(t => t.toLowerCase().includes(brandLower));
    const windowSize = TOKEN_WINDOW_MIN + Math.min(quotes.length, TOKEN_WINDOW_MAX - TOKEN_WINDOW_MIN);
    const start = Math.max(0, brandTokenIdx - Math.floor(windowSize / 2));
    const end = Math.min(tokens.length, start + windowSize);
    quotes.push(tokens.slice(start, end).join(" "));

    idx = pos + brandLower.length;
    if (quotes.length >= 10) break;
  }

  return quotes;
}

export async function extractEvidenceFromPages(
  pages: CrawledPage[],
  classified: ClassifiedSource[],
  brandName: string,
  competitors: string[],
  dimensions: QueryDimensions,
): Promise<SourceExtraction[]> {
  const comparisonPages = pages.filter((p, i) => {
    const cls = classified[i];
    return p.accessible && cls && cls.isComparisonSurface && p.wordCount > 50;
  });

  if (comparisonPages.length === 0) {
    return [];
  }

  const truncatedPages = comparisonPages.map(p => ({
    ...p,
    cleanText: p.cleanText.slice(0, 8000),
  }));

  const batchSize = 3;
  const allExtractions: SourceExtraction[] = [];

  for (let i = 0; i < truncatedPages.length; i += batchSize) {
    const batch = truncatedPages.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(page => extractSinglePage(page, brandName, competitors, dimensions)),
    );
    allExtractions.push(...batchResults);
  }

  return allExtractions;
}

async function extractSinglePage(
  page: CrawledPage,
  brandName: string,
  competitors: string[],
  dimensions: QueryDimensions,
): Promise<SourceExtraction> {
  const brandLower = brandName.toLowerCase();
  const textLower = page.cleanText.toLowerCase();
  const targetBrandFound = textLower.includes(brandLower);
  const brandMentionCount = (textLower.match(new RegExp(escapeRegex(brandLower), "gi")) || []).length;

  const allBrands = [brandName, ...competitors];
  const brandsFound = allBrands.filter(b => textLower.includes(b.toLowerCase()));

  const { position: targetBrandPosition, total: totalBrandsListed } = extractListPositions(page.cleanText, brandName);

  const quoteWindows = extractQuoteWindows(page.cleanText, brandName);

  const proximity = measureProximity(page.cleanText, brandName, dimensions.category);

  const quotes: QuoteEvidence[] = quoteWindows.map(q => ({
    quote: q,
    context: page.title || page.url,
    brandMentioned: brandName,
    listPosition: targetBrandPosition,
    totalInList: totalBrandsListed || null,
    proximityCategory: proximity.category,
    tokenDistance: proximity.tokenDistance,
    dimensionRelevance: {},
  }));

  let overallRelevance: "high" | "medium" | "low" = "low";
  if (targetBrandFound && proximity.category === "same_chunk") overallRelevance = "high";
  else if (targetBrandFound || brandsFound.length >= 2) overallRelevance = "medium";

  try {
    const llmResult = await llmExtractDimensionRelevance(
      page.cleanText.slice(0, 4000),
      brandName,
      dimensions,
    );

    for (const quote of quotes) {
      quote.dimensionRelevance = llmResult.dimensionRelevance;
    }
    if (llmResult.overallRelevance) overallRelevance = llmResult.overallRelevance;
  } catch (err) {
    console.error(`[insights] LLM extraction failed for ${page.url}:`, err);
  }

  return {
    url: page.url,
    domain: new URL(page.url).hostname.replace(/^www\./, ""),
    brandsFound,
    brandMentionCount,
    targetBrandFound,
    targetBrandPosition,
    totalBrandsListed,
    quotes,
    overallRelevance,
  };
}

async function llmExtractDimensionRelevance(
  text: string,
  brandName: string,
  dimensions: QueryDimensions,
): Promise<{
  dimensionRelevance: Record<string, "supported" | "weak_support" | "neutral" | "contradicted">;
  overallRelevance: "high" | "medium" | "low";
}> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content: `You analyze source content for evidence about a brand across search intent dimensions. Return valid JSON only.`,
      },
      {
        role: "user",
        content: `Given this source content (truncated):
---
${text}
---

Brand being analyzed: "${brandName}"

Search intent dimensions:
- Category: ${dimensions.category}
- Geo: ${dimensions.geo}
- Audience: ${dimensions.audience}
- Qualifier: ${dimensions.qualifier}

For each dimension, classify the evidence as:
- "supported": Clear evidence the source covers this dimension for this brand
- "weak_support": Indirect or partial evidence
- "neutral": No relevant evidence either way
- "contradicted": Evidence that contradicts this dimension for this brand

Also rate overallRelevance as "high", "medium", or "low" based on how relevant this source is for the search intent.

Return JSON: {"dimensionRelevance":{"category":"...","geo":"...","audience":"...","qualifier":"..."},"overallRelevance":"..."}`,
      },
    ],
    max_tokens: 300,
  });

  const responseText = response.choices[0]?.message?.content?.trim() || "";
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      dimensionRelevance: parsed.dimensionRelevance || {},
      overallRelevance: parsed.overallRelevance || "low",
    };
  }

  return { dimensionRelevance: {}, overallRelevance: "low" };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

import OpenAI from "openai";
import type { CrawledPage } from "./crawler";
import type { ClassifiedSource, SurfaceType } from "./classifier";
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

export interface CompetitorPassage {
  competitorName: string;
  passage: string;
  context: string;
}

export interface SourceExtraction {
  url: string;
  domain: string;
  surfaceType: SurfaceType;
  brandsFound: string[];
  brandMentionCount: number;
  targetBrandFound: boolean;
  targetBrandPosition: number | null;
  totalBrandsListed: number;
  quotes: QuoteEvidence[];
  competitorPassages: CompetitorPassage[];
  overallRelevance: "high" | "medium" | "low";
  positioningSignals?: PositioningSignal[];
}

export interface PositioningSignal {
  dimension: string;
  found: boolean;
  location: "title" | "heading" | "first_200_words" | "body" | "faq";
  snippet: string;
}

const TOKEN_WINDOW_MIN = 15;
const TOKEN_WINDOW_MAX = 25;

const SKIP_SURFACE_TYPES: Set<SurfaceType> = new Set(["social", "redirect_wrapper"]);

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

function measureDimensionProximity(
  text: string,
  brandName: string,
  dimensionKeywords: string[],
): { category: "same_chunk" | "nearby_chunk" | "distant"; tokenDistance: number } {
  const tokens = tokenize(text.toLowerCase());
  const brandTokens = tokenize(brandName.toLowerCase());

  let brandIdx = -1;
  for (let i = 0; i < tokens.length; i++) {
    if (brandTokens.some(bt => tokens[i].includes(bt))) {
      brandIdx = i;
      break;
    }
  }

  if (brandIdx < 0) return { category: "distant", tokenDistance: 999 };

  let minDistance = 999;
  for (const keyword of dimensionKeywords) {
    const kwTokens = tokenize(keyword.toLowerCase());
    for (let i = 0; i < tokens.length; i++) {
      if (kwTokens.some(kt => tokens[i].includes(kt))) {
        const dist = Math.abs(brandIdx - i);
        if (dist < minDistance) minDistance = dist;
      }
    }
  }

  if (minDistance <= 25) return { category: "same_chunk", tokenDistance: minDistance };
  if (minDistance <= 75) return { category: "nearby_chunk", tokenDistance: minDistance };
  return { category: "distant", tokenDistance: minDistance };
}

function getDimensionKeywords(dimensions: QueryDimensions): Record<string, string[]> {
  const keywords: Record<string, string[]> = {};
  if (dimensions.category && dimensions.category !== "general") {
    keywords.category = tokenize(dimensions.category.toLowerCase());
  }
  if (dimensions.geo && dimensions.geo !== "global") {
    keywords.geo = tokenize(dimensions.geo.toLowerCase());
  }
  if (dimensions.audience && dimensions.audience !== "general") {
    keywords.audience = tokenize(dimensions.audience.toLowerCase());
  }
  return keywords;
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

function extractPositioningSignals(
  page: CrawledPage,
  dimensions: QueryDimensions,
): PositioningSignal[] {
  const signals: PositioningSignal[] = [];
  const html = page.rawHtml;
  const text = page.cleanText;
  const titleLower = page.title.toLowerCase();
  const first200Words = tokenize(text).slice(0, 200).join(" ").toLowerCase();

  const headingMatches = html.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi) || [];
  const headingText = headingMatches.map(h => h.replace(/<[^>]+>/g, "").trim().toLowerCase()).join(" ");

  const faqText = extractFaqContent(html).toLowerCase();

  const dimChecks: Array<{ dimension: string; value: string; keywords: string[] }> = [];

  if (dimensions.category && dimensions.category !== "general") {
    const kws = dimensions.category.toLowerCase().split(/[\s,]+/).filter(k => k.length > 2);
    dimChecks.push({ dimension: "category", value: dimensions.category, keywords: kws });
  }
  if (dimensions.geo && dimensions.geo !== "global") {
    const geoTerms = getGeoVariants(dimensions.geo);
    dimChecks.push({ dimension: "geo", value: dimensions.geo, keywords: geoTerms });
  }
  if (dimensions.audience && dimensions.audience !== "general") {
    const kws = dimensions.audience.toLowerCase().split(/[\s,]+/).filter(k => k.length > 2);
    dimChecks.push({ dimension: "audience", value: dimensions.audience, keywords: kws });
  }

  for (const check of dimChecks) {
    const locations: Array<{ name: "title" | "heading" | "first_200_words" | "body" | "faq"; text: string }> = [
      { name: "title", text: titleLower },
      { name: "heading", text: headingText },
      { name: "first_200_words", text: first200Words },
      { name: "faq", text: faqText },
      { name: "body", text: text.toLowerCase() },
    ];

    let found = false;
    for (const loc of locations) {
      if (check.keywords.some(kw => loc.text.includes(kw))) {
        const matchIdx = loc.text.indexOf(check.keywords.find(kw => loc.text.includes(kw))!);
        const snippetStart = Math.max(0, matchIdx - 40);
        const snippetEnd = Math.min(loc.text.length, matchIdx + 60);
        const snippet = loc.text.slice(snippetStart, snippetEnd).trim();

        signals.push({
          dimension: check.dimension,
          found: true,
          location: loc.name,
          snippet: `...${snippet}...`,
        });
        found = true;
        break;
      }
    }

    if (!found) {
      signals.push({
        dimension: check.dimension,
        found: false,
        location: "body",
        snippet: `No mention of "${check.value}" found on this page`,
      });
    }
  }

  return signals;
}

function getGeoVariants(geo: string): string[] {
  const lower = geo.toLowerCase();
  const variants = [lower];
  const geoMap: Record<string, string[]> = {
    uae: ["uae", "united arab emirates", "dubai", "abu dhabi", "sharjah", "gcc", "middle east", "mena"],
    dubai: ["dubai", "uae", "united arab emirates", "gcc", "middle east", "mena"],
    saudi: ["saudi", "saudi arabia", "ksa", "riyadh", "jeddah", "gcc", "middle east", "mena"],
    gcc: ["gcc", "gulf", "uae", "saudi", "bahrain", "kuwait", "oman", "qatar", "middle east", "mena"],
    "middle east": ["middle east", "mena", "gcc", "uae", "saudi", "gulf"],
  };
  for (const [key, vals] of Object.entries(geoMap)) {
    if (lower.includes(key)) {
      return [...new Set([...variants, ...vals])];
    }
  }
  return variants;
}

function extractFaqContent(html: string): string {
  const faqPatterns = [
    /<div[^>]*(?:faq|frequently)[^>]*>([\s\S]*?)<\/div>/gi,
    /<section[^>]*(?:faq|frequently)[^>]*>([\s\S]*?)<\/section>/gi,
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi,
  ];
  let faqText = "";
  for (const pattern of faqPatterns) {
    const matches = html.match(pattern);
    if (matches) {
      for (const m of matches) {
        faqText += m.replace(/<[^>]+>/g, " ") + " ";
      }
    }
  }
  return faqText.replace(/\s+/g, " ").trim();
}

export async function extractEvidenceFromPages(
  pages: CrawledPage[],
  classified: ClassifiedSource[],
  brandName: string,
  competitors: string[],
  dimensions: QueryDimensions,
): Promise<SourceExtraction[]> {
  const analyzablePages: Array<{ page: CrawledPage; cls: ClassifiedSource }> = [];
  for (let i = 0; i < pages.length; i++) {
    const cls = classified[i];
    if (!cls || !pages[i].accessible || pages[i].wordCount < 30) continue;
    if (SKIP_SURFACE_TYPES.has(cls.surfaceType)) continue;
    analyzablePages.push({ page: pages[i], cls });
  }

  console.log(`[insights] Extracting evidence from ${analyzablePages.length} pages (skipped ${pages.length - analyzablePages.length} social/redirect/inaccessible)`);

  if (analyzablePages.length === 0) {
    return [];
  }

  const batchSize = 3;
  const allExtractions: SourceExtraction[] = [];
  const dimKeywords = getDimensionKeywords(dimensions);

  for (let i = 0; i < analyzablePages.length; i += batchSize) {
    const batch = analyzablePages.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(({ page, cls }) =>
        extractSinglePage(page, cls, brandName, competitors, dimensions, dimKeywords),
      ),
    );
    allExtractions.push(...batchResults);
  }

  return allExtractions;
}

async function extractSinglePage(
  page: CrawledPage,
  cls: ClassifiedSource,
  brandName: string,
  competitors: string[],
  dimensions: QueryDimensions,
  dimKeywords: Record<string, string[]>,
): Promise<SourceExtraction> {
  const brandLower = brandName.toLowerCase();
  const textLower = page.cleanText.toLowerCase();
  const targetBrandFound = textLower.includes(brandLower);
  const brandMentionCount = (textLower.match(new RegExp(escapeRegex(brandLower), "gi")) || []).length;

  const allBrands = [brandName, ...competitors];
  const brandsFound = allBrands.filter(b => textLower.includes(b.toLowerCase()));

  const { position: targetBrandPosition, total: totalBrandsListed } = extractListPositions(page.cleanText, brandName);

  const quoteWindows = targetBrandFound ? extractQuoteWindows(page.cleanText, brandName) : [];

  const competitorPassages: CompetitorPassage[] = [];
  for (const comp of competitors) {
    if (!textLower.includes(comp.toLowerCase())) continue;
    const passages = extractQuoteWindows(page.cleanText, comp).slice(0, 2);
    for (const p of passages) {
      competitorPassages.push({
        competitorName: comp,
        passage: p,
        context: page.title || page.url,
      });
    }
    if (competitorPassages.length >= 6) break;
  }

  const proximities: Record<string, { category: "same_chunk" | "nearby_chunk" | "distant"; distance: number }> = {};
  for (const [dim, keywords] of Object.entries(dimKeywords)) {
    const prox = measureDimensionProximity(page.cleanText, brandName, keywords);
    proximities[dim] = { category: prox.category, distance: prox.tokenDistance };
  }

  const bestProximity = Object.values(proximities).reduce(
    (best, p) => (p.distance < best.distance ? p : best),
    { category: "distant" as const, distance: 999 },
  );

  const quotes: QuoteEvidence[] = quoteWindows.map(q => ({
    quote: q,
    context: page.title || page.url,
    brandMentioned: brandName,
    listPosition: targetBrandPosition,
    totalInList: totalBrandsListed || null,
    proximityCategory: bestProximity.category,
    tokenDistance: bestProximity.distance,
    dimensionRelevance: {},
  }));

  let positioningSignals: PositioningSignal[] | undefined;
  if (cls.surfaceType === "brand_owned" || cls.surfaceType === "competitor_owned") {
    positioningSignals = extractPositioningSignals(page, dimensions);
  }

  let overallRelevance = computeBaseRelevance(
    cls.surfaceType,
    targetBrandFound,
    brandsFound.length,
    bestProximity,
    positioningSignals,
  );

  try {
    const llmResult = await llmExtractDimensionRelevance(
      page.cleanText.slice(0, 4000),
      brandName,
      dimensions,
      cls.surfaceType,
    );

    for (const quote of quotes) {
      const adjustedRelevance = { ...llmResult.dimensionRelevance };
      for (const [dim, prox] of Object.entries(proximities)) {
        if (prox.category === "distant" && adjustedRelevance[dim] === "supported") {
          adjustedRelevance[dim] = "weak_support";
        }
      }
      quote.dimensionRelevance = adjustedRelevance;
    }
    if (llmResult.overallRelevance) overallRelevance = llmResult.overallRelevance;

    if (cls.surfaceType === "brand_owned" || cls.surfaceType === "competitor_owned") {
      if (overallRelevance === "low") overallRelevance = "medium";
    }
  } catch (err) {
    console.error(`[insights] LLM extraction failed for ${page.url}:`, err);
  }

  return {
    url: page.url,
    domain: new URL(page.url).hostname.replace(/^www\./, ""),
    surfaceType: cls.surfaceType,
    brandsFound,
    brandMentionCount,
    targetBrandFound,
    targetBrandPosition,
    totalBrandsListed,
    quotes,
    competitorPassages,
    overallRelevance,
    positioningSignals,
  };
}

function computeBaseRelevance(
  surfaceType: SurfaceType,
  targetBrandFound: boolean,
  brandsFoundCount: number,
  proximity: { category: string; distance: number },
  positioningSignals?: PositioningSignal[],
): "high" | "medium" | "low" {
  if (surfaceType === "brand_owned") {
    if (positioningSignals && positioningSignals.some(s => s.found)) return "high";
    return "medium";
  }

  if (surfaceType === "competitor_owned") {
    if (positioningSignals && positioningSignals.some(s => s.found)) return "medium";
    return "low";
  }

  if (surfaceType === "comparison") {
    if (targetBrandFound && proximity.category === "same_chunk") return "high";
    if (targetBrandFound || brandsFoundCount >= 2) return "medium";
    return "low";
  }

  if (surfaceType === "authority") {
    if (targetBrandFound) return "high";
    if (brandsFoundCount >= 1) return "medium";
    return "low";
  }

  if (surfaceType === "eligibility") {
    if (targetBrandFound && proximity.category !== "distant") return "high";
    if (targetBrandFound || brandsFoundCount >= 1) return "medium";
    return "low";
  }

  if (targetBrandFound) return "medium";
  return "low";
}

async function llmExtractDimensionRelevance(
  text: string,
  brandName: string,
  dimensions: QueryDimensions,
  surfaceType: SurfaceType,
): Promise<{
  dimensionRelevance: Record<string, "supported" | "weak_support" | "neutral" | "contradicted">;
  overallRelevance: "high" | "medium" | "low";
}> {
  const surfaceContext = surfaceType === "brand_owned"
    ? "This is the brand's own website. Check if it clearly positions itself for the given dimensions."
    : surfaceType === "competitor_owned"
    ? "This is a competitor's website. Check how strongly it positions for the given dimensions."
    : surfaceType === "authority"
    ? "This is a news/authority source. Check if it provides credibility signals for the given dimensions."
    : "This is a comparison/eligibility source. Check evidence for each dimension.";

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content: `You analyze source content for evidence about a brand across search intent dimensions. ${surfaceContext}

IMPORTANT for audience dimension: Do NOT require literal keyword matches. LLMs infer audience from semantic signals:
- Pricing structure (free tier, per-seat pricing → SMB)
- Onboarding language (self-serve, "get started" → SMB; "contact sales", "enterprise agreement" → Enterprise)
- Integration partners (QuickBooks, Xero → SMB; SAP, Oracle → Enterprise)
- Wording like "teams", "growing businesses", "startups" → SMB
- Card limits, approval workflows, employee counts → indicate target audience
- Industry terms and use cases → indicate vertical audience

Classify audience as "supported" if the content semantically targets the audience, even without using the exact audience label.

Return valid JSON only.`,
      },
      {
        role: "user",
        content: `Given this source content (truncated):
---
${text}
---

Brand being analyzed: "${brandName}"
Source type: ${surfaceType}

Search intent dimensions:
- Category: ${dimensions.category}
- Geo: ${dimensions.geo}
- Audience: ${dimensions.audience}
- Qualifier: ${dimensions.qualifier}

For each dimension, classify the evidence as:
- "supported": Clear evidence the source covers this dimension (explicit or semantic/inferred)
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

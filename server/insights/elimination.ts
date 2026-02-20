import type { SourceExtraction, PositioningSignal } from "./extractor";
import type { QueryDimensions } from "./intentParser";
import { getGeoSynonyms, getAudienceSynonyms, getCategorySynonyms, classifyEvidence, type SynonymMap } from "./synonyms";

export type EliminationReason = "geo_mismatch" | "audience_mismatch" | "category_mismatch" | "missing_evidence" | "weak_positioning" | "no_citations";

export interface EliminationSignal {
  dimension: string;
  reason: EliminationReason;
  confidence: "high" | "medium" | "low";
  evidence: string;
  suggestion: string;
}

export interface CompetitorInsight {
  name: string;
  mentionCount: number;
  avgPosition: number | null;
  sourceCount: number;
  strengthFactors: string[];
  evidenceType: "citation_backed" | "model_knowledge" | "mixed";
}

export function detectEliminationSignals(
  extractions: SourceExtraction[],
  brandName: string,
  competitors: string[],
  dimensions: QueryDimensions,
): EliminationSignal[] {
  const signals: EliminationSignal[] = [];
  const geoMap = getGeoSynonyms(dimensions.geo);
  const audienceMap = getAudienceSynonyms(dimensions.audience);
  const categoryMap = getCategorySynonyms(dimensions.category);

  const brandExtractions = extractions.filter(e => e.targetBrandFound);
  const totalSources = extractions.filter(e => e.brandsFound.length > 0).length;

  if (brandExtractions.length === 0 && totalSources > 0) {
    signals.push({
      dimension: "overall",
      reason: "no_citations",
      confidence: "high",
      evidence: `Brand "${brandName}" was not found in any of the ${totalSources} analyzed sources that mention competitors.`,
      suggestion: `Consider creating or contributing to comparison articles and review sites. Getting listed on editorial comparison pages that AI engines cite increases the probability of being included in AI recommendations.`,
    });
    return signals;
  }

  checkDimensionElimination(brandExtractions, "geo", geoMap, dimensions.geo, signals);
  checkDimensionElimination(brandExtractions, "audience", audienceMap, dimensions.audience, signals);
  checkDimensionElimination(brandExtractions, "category", categoryMap, dimensions.category, signals);

  const brandPositions = brandExtractions
    .filter(e => e.targetBrandPosition !== null)
    .map(e => e.targetBrandPosition!);
  const avgPosition = brandPositions.length > 0 ? brandPositions.reduce((a, b) => a + b, 0) / brandPositions.length : null;

  if (avgPosition !== null && avgPosition > 5) {
    signals.push({
      dimension: "positioning",
      reason: "weak_positioning",
      confidence: avgPosition > 8 ? "high" : "medium",
      evidence: `When listed, "${brandName}" appears at an average position of ${avgPosition.toFixed(1)} across comparison sources, which reduces the likelihood of being recommended by AI engines.`,
      suggestion: `Focus on improving brand visibility in editorial sources. Higher positions in listicles and comparison pages correlate with higher positions in AI recommendations. Consider improving reviews on G2, Capterra, and similar platforms.`,
    });
  }

  const brandSourceRate = totalSources > 0 ? brandExtractions.length / totalSources : 0;
  if (brandSourceRate < 0.3 && brandExtractions.length > 0) {
    signals.push({
      dimension: "visibility",
      reason: "missing_evidence",
      confidence: brandSourceRate < 0.15 ? "high" : "medium",
      evidence: `Brand "${brandName}" appears in ${brandExtractions.length} of ${totalSources} analyzed sources (${(brandSourceRate * 100).toFixed(0)}%), suggesting limited citation coverage relative to competitors.`,
      suggestion: `Increasing presence in editorial comparisons, industry publications, and review platforms broadens the evidence base AI engines draw from. Focus on authoritative sources that already mention competitors.`,
    });
  }

  detectBrandSitePositioningGaps(extractions, brandName, dimensions, competitors, signals);

  return signals;
}

function detectBrandSitePositioningGaps(
  extractions: SourceExtraction[],
  brandName: string,
  dimensions: QueryDimensions,
  competitors: string[],
  signals: EliminationSignal[],
): void {
  const brandOwnedPages = extractions.filter(e => e.surfaceType === "brand_owned" && e.positioningSignals);
  if (brandOwnedPages.length === 0) return;

  const competitorPages = extractions.filter(e => e.surfaceType === "competitor_owned" && e.positioningSignals);

  for (const dim of ["category", "geo", "audience"] as const) {
    const dimValue = dimensions[dim];
    if (!dimValue || dimValue === "global" || dimValue === "general") continue;

    const brandSignals = brandOwnedPages.flatMap(p => p.positioningSignals || []).filter(s => s.dimension === dim);
    const brandHasDimension = brandSignals.some(s => s.found);
    const brandInProminentLocation = brandSignals.some(s =>
      s.found && (s.location === "title" || s.location === "heading" || s.location === "first_200_words"),
    );

    const competitorSignals = competitorPages.flatMap(p => p.positioningSignals || []).filter(s => s.dimension === dim);
    const competitorHasDimension = competitorSignals.some(s => s.found);
    const competitorInProminentLocation = competitorSignals.some(s =>
      s.found && (s.location === "title" || s.location === "heading" || s.location === "first_200_words"),
    );

    if (!brandHasDimension) {
      const evidence = competitorHasDimension
        ? `Your website does not mention "${dimValue}" while competitor sites prominently feature it. ${competitorSignals.filter(s => s.found).map(s => s.snippet).slice(0, 2).join("; ")}`
        : `Your website does not mention "${dimValue}" in any prominent location (title, headings, or first 200 words). Buyers searching for ${dim}-specific queries may not find alignment on your site.`;

      const reasonMap: Record<string, EliminationReason> = {
        geo: "geo_mismatch",
        audience: "audience_mismatch",
        category: "category_mismatch",
      };

      signals.push({
        dimension: dim,
        reason: reasonMap[dim] || "weak_positioning",
        confidence: competitorHasDimension ? "high" : "medium",
        evidence,
        suggestion: getPositioningSuggestion(dim, dimValue),
      });
    } else if (!brandInProminentLocation && competitorInProminentLocation) {
      signals.push({
        dimension: dim,
        reason: "weak_positioning",
        confidence: "low",
        evidence: `Your website mentions "${dimValue}" but not in prominent locations (title, headings, or first 200 words). Competitors feature it more prominently: ${competitorSignals.filter(s => s.found && (s.location === "title" || s.location === "heading")).map(s => s.snippet).slice(0, 2).join("; ")}`,
        suggestion: getPositioningSuggestion(dim, dimValue),
      });
    }
  }
}

function getPositioningSuggestion(dimension: string, value: string): string {
  switch (dimension) {
    case "geo":
      return `Add "${value}" prominently to your website — in the page title, hero section, and headings. AI engines use on-site geographic signals to determine relevance for location-specific queries. Consider adding a dedicated "${value}" landing page.`;
    case "audience":
      return `Make your target audience "${value}" explicit on your website — in headings, value propositions, and case studies. AI engines look for audience alignment signals when recommending providers for specific segments.`;
    case "category":
      return `Ensure "${value}" is prominently featured in your website's title, hero section, and primary headings. Clear category positioning on your own site strengthens the association AI engines make between your brand and this category.`;
    default:
      return `Improve positioning for "${dimension}: ${value}" on your website by featuring it in prominent locations (title, headings, first paragraph).`;
  }
}

function checkDimensionElimination(
  brandExtractions: SourceExtraction[],
  dimension: string,
  synonymMap: SynonymMap,
  dimensionValue: string,
  signals: EliminationSignal[],
): void {
  if (dimensionValue === "global" || dimensionValue === "general" || dimensionValue === "best") {
    return;
  }

  let supported = 0;
  let weak = 0;
  let contradicted = 0;

  for (const ext of brandExtractions) {
    for (const quote of ext.quotes) {
      const rel = quote.dimensionRelevance[dimension];
      if (rel === "supported") supported++;
      else if (rel === "weak_support") weak++;
      else if (rel === "contradicted") contradicted++;
    }
  }

  const total = supported + weak + contradicted;
  if (total === 0) return;

  if (contradicted > 0 && contradicted >= supported) {
    const reasonMap: Record<string, EliminationReason> = {
      geo: "geo_mismatch",
      audience: "audience_mismatch",
      category: "category_mismatch",
    };
    signals.push({
      dimension,
      reason: reasonMap[dimension] || "missing_evidence",
      confidence: contradicted > supported + weak ? "high" : "medium",
      evidence: `Sources citing "${dimension}" dimension show ${contradicted} contradictory signals vs ${supported} supportive signals for "${dimensionValue}". This may reduce the model's confidence in recommending the brand for this specific ${dimension}.`,
      suggestion: getSuggestionForDimension(dimension, dimensionValue),
    });
  } else if (supported === 0 && weak > 0) {
    signals.push({
      dimension,
      reason: "missing_evidence",
      confidence: "low",
      evidence: `No strong evidence found for "${dimensionValue}" in citation sources — only ${weak} weak/indirect signals. The AI model may lack sufficient evidence to associate the brand with this ${dimension}.`,
      suggestion: getSuggestionForDimension(dimension, dimensionValue),
    });
  }
}

function getSuggestionForDimension(dimension: string, value: string): string {
  switch (dimension) {
    case "geo":
      return `Strengthen ${value}-specific content signals: ensure the brand website, directory listings, and PR mentions explicitly reference ${value}. AI engines often use geographic signals from citation sources to determine relevance for location-specific queries.`;
    case "audience":
      return `Create more content explicitly targeting "${value}" as an audience segment. Case studies, landing pages, and third-party mentions that specify this audience segment increase the probability of being recommended for ${value}-specific queries.`;
    case "category":
      return `Ensure the brand is strongly positioned within the "${value}" category across comparison sources, review platforms, and directory listings. Category alignment in citation sources is a key signal for AI recommendation engines.`;
    default:
      return `Improve evidence for the "${dimension}" dimension by creating and securing mentions in authoritative sources.`;
  }
}

export function analyzeCompetitors(
  extractions: SourceExtraction[],
  brandName: string,
  competitors: string[],
  aiResponses: Record<string, string[]>,
): CompetitorInsight[] {
  const insights: CompetitorInsight[] = [];
  const allBrandsAcrossSources = new Map<string, { count: number; positions: number[]; sourceUrls: Set<string> }>();

  for (const ext of extractions) {
    for (const brand of ext.brandsFound) {
      const lower = brand.toLowerCase();
      if (lower === brandName.toLowerCase()) continue;
      if (!allBrandsAcrossSources.has(lower)) {
        allBrandsAcrossSources.set(lower, { count: 0, positions: [], sourceUrls: new Set() });
      }
      const entry = allBrandsAcrossSources.get(lower)!;
      entry.count += ext.quotes.filter(q => q.brandMentioned?.toLowerCase() === lower).length || 1;
      entry.sourceUrls.add(ext.url);
    }
  }

  const engineMentions = new Map<string, Set<string>>();
  for (const [engine, texts] of Object.entries(aiResponses)) {
    for (const text of texts) {
      const lower = text.toLowerCase();
      for (const comp of competitors) {
        if (lower.includes(comp.toLowerCase())) {
          if (!engineMentions.has(comp.toLowerCase())) engineMentions.set(comp.toLowerCase(), new Set());
          engineMentions.get(comp.toLowerCase())!.add(engine);
        }
      }
    }
  }

  for (const comp of competitors) {
    const lower = comp.toLowerCase();
    const sourceData = allBrandsAcrossSources.get(lower);
    const enginesPresent = engineMentions.get(lower);

    if (!sourceData && !enginesPresent) continue;

    const strengthFactors: string[] = [];
    let evidenceType: "citation_backed" | "model_knowledge" | "mixed" = "model_knowledge";

    if (sourceData && sourceData.sourceUrls.size > 0) {
      strengthFactors.push(`Found in ${sourceData.sourceUrls.size} citation source(s)`);
      evidenceType = "citation_backed";
    }
    if (enginesPresent && enginesPresent.size > 0) {
      strengthFactors.push(`Recommended by ${enginesPresent.size} AI engine(s)`);
      if (evidenceType === "citation_backed") evidenceType = "mixed";
    }

    insights.push({
      name: comp,
      mentionCount: sourceData?.count || 0,
      avgPosition: null,
      sourceCount: sourceData?.sourceUrls.size || 0,
      strengthFactors,
      evidenceType,
    });
  }

  insights.sort((a, b) => b.sourceCount - a.sourceCount || b.mentionCount - a.mentionCount);
  return insights.slice(0, 10);
}

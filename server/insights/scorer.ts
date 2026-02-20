import type { SourceExtraction } from "./extractor";
import type { ClassifiedSource } from "./classifier";
import type { EliminationSignal, CompetitorInsight } from "./elimination";
import type { QueryDimensions } from "./intentParser";

export interface AttributionCheck {
  engine: string;
  citationCount: number;
  hasCitations: boolean;
  evidenceType: "citation_driven" | "model_knowledge" | "mixed";
}

export interface ComparativeScore {
  brandName: string;
  sourcePresenceRate: number;
  avgListPosition: number | null;
  citationCoverage: number;
  dimensionSupport: Record<string, number>;
  eliminationRisk: "high" | "medium" | "low" | "none";
  overallConfidence: number;
}

export interface InsightsScore {
  brandScore: ComparativeScore;
  competitorScores: ComparativeScore[];
  attributionChecks: AttributionCheck[];
  summary: {
    totalSourcesCrawled: number;
    accessibleSources: number;
    comparisonSurfaces: number;
    brandFoundInSources: number;
    avgSourceCredibility: number;
    crossEngineSources: number;
  };
}

export function computeInsightsScore(
  extractions: SourceExtraction[],
  classified: ClassifiedSource[],
  brandName: string,
  competitors: string[],
  dimensions: QueryDimensions,
  eliminationSignals: EliminationSignal[],
  citationsByEngine: Record<string, string[]>,
): InsightsScore {
  const brandExtractions = extractions.filter(e => e.targetBrandFound);
  const comparisonSources = classified.filter(c => c.isComparisonSurface);
  const totalComparison = comparisonSources.length || 1;

  const brandScore = computeBrandScore(
    brandName,
    brandExtractions,
    totalComparison,
    dimensions,
    eliminationSignals,
  );

  const competitorScores = competitors.slice(0, 8).map(comp =>
    computeCompetitorScore(comp, extractions, totalComparison, dimensions),
  );

  const attributionChecks = computeAttributionChecks(citationsByEngine);

  const accessibleSources = classified.length;
  const avgTier = classified.length > 0
    ? classified.reduce((sum, c) => sum + c.tier, 0) / classified.length
    : 3;
  const crossEngineSources = classified.filter(c => c.crossEngineCitations >= 2).length;

  return {
    brandScore,
    competitorScores: competitorScores.filter(c => c.sourcePresenceRate > 0),
    attributionChecks,
    summary: {
      totalSourcesCrawled: classified.length,
      accessibleSources,
      comparisonSurfaces: comparisonSources.length,
      brandFoundInSources: brandExtractions.length,
      avgSourceCredibility: Math.round((4 - avgTier) / 3 * 100),
      crossEngineSources,
    },
  };
}

function computeBrandScore(
  brandName: string,
  brandExtractions: SourceExtraction[],
  totalComparison: number,
  dimensions: QueryDimensions,
  eliminationSignals: EliminationSignal[],
): ComparativeScore {
  const sourcePresenceRate = brandExtractions.length / totalComparison;

  const positions = brandExtractions
    .filter(e => e.targetBrandPosition !== null)
    .map(e => e.targetBrandPosition!);
  const avgListPosition = positions.length > 0
    ? positions.reduce((a, b) => a + b, 0) / positions.length
    : null;

  const dimensionSupport: Record<string, number> = {};
  for (const dim of ["category", "geo", "audience", "qualifier"]) {
    let supportCount = 0;
    let totalChecked = 0;
    for (const ext of brandExtractions) {
      for (const quote of ext.quotes) {
        const rel = quote.dimensionRelevance[dim];
        if (rel) {
          totalChecked++;
          if (rel === "supported") supportCount += 1;
          else if (rel === "weak_support") supportCount += 0.5;
        }
      }
    }
    dimensionSupport[dim] = totalChecked > 0 ? supportCount / totalChecked : 0;
  }

  const highRiskSignals = eliminationSignals.filter(s => s.confidence === "high").length;
  const mediumRiskSignals = eliminationSignals.filter(s => s.confidence === "medium").length;

  let eliminationRisk: "high" | "medium" | "low" | "none" = "none";
  if (highRiskSignals >= 2 || (highRiskSignals >= 1 && mediumRiskSignals >= 2)) {
    eliminationRisk = "high";
  } else if (highRiskSignals >= 1 || mediumRiskSignals >= 2) {
    eliminationRisk = "medium";
  } else if (mediumRiskSignals >= 1 || eliminationSignals.length > 0) {
    eliminationRisk = "low";
  }

  const citationCoverage = sourcePresenceRate;
  const dimAvg = Object.values(dimensionSupport).reduce((a, b) => a + b, 0) / (Object.values(dimensionSupport).length || 1);
  const riskPenalty = eliminationRisk === "high" ? 0.3 : eliminationRisk === "medium" ? 0.15 : eliminationRisk === "low" ? 0.05 : 0;
  const overallConfidence = Math.max(0, Math.min(100, Math.round(
    ((sourcePresenceRate * 0.4) + (dimAvg * 0.3) + ((avgListPosition ? Math.max(0, (10 - avgListPosition) / 10) : 0.5) * 0.3) - riskPenalty) * 100,
  )));

  return {
    brandName,
    sourcePresenceRate,
    avgListPosition,
    citationCoverage,
    dimensionSupport,
    eliminationRisk,
    overallConfidence,
  };
}

function computeCompetitorScore(
  compName: string,
  extractions: SourceExtraction[],
  totalComparison: number,
  dimensions: QueryDimensions,
): ComparativeScore {
  const compLower = compName.toLowerCase();
  const compExtractions = extractions.filter(e =>
    e.brandsFound.some(b => b.toLowerCase() === compLower),
  );

  const sourcePresenceRate = compExtractions.length / totalComparison;

  return {
    brandName: compName,
    sourcePresenceRate,
    avgListPosition: null,
    citationCoverage: sourcePresenceRate,
    dimensionSupport: {},
    eliminationRisk: "none",
    overallConfidence: Math.round(sourcePresenceRate * 100),
  };
}

function computeAttributionChecks(
  citationsByEngine: Record<string, string[]>,
): AttributionCheck[] {
  return Object.entries(citationsByEngine).map(([engine, urls]) => {
    const citationCount = urls.length;
    const hasCitations = citationCount > 0;
    let evidenceType: "citation_driven" | "model_knowledge" | "mixed" = "model_knowledge";
    if (citationCount >= 3) evidenceType = "citation_driven";
    else if (citationCount > 0) evidenceType = "mixed";

    return { engine, citationCount, hasCitations, evidenceType };
  });
}

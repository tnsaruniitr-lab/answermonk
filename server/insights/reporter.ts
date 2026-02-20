import type { InsightsScore, ComparativeScore, AttributionCheck } from "./scorer";
import type { EliminationSignal, CompetitorInsight } from "./elimination";
import type { SourceExtraction, PositioningSignal } from "./extractor";
import type { ClassifiedSource, SurfaceType } from "./classifier";
import type { QueryDimensions } from "./intentParser";

export interface InsightCard {
  id: string;
  type: "elimination" | "competitor" | "attribution" | "opportunity" | "strength";
  severity: "high" | "medium" | "low" | "info";
  title: string;
  body: string;
  evidence: string[];
  recommendation: string;
  affectedDimension: string | null;
}

export interface InsightsReport {
  generatedAt: string;
  brandName: string;
  dimensions: QueryDimensions;
  overallConfidence: number;
  eliminationRisk: string;
  cards: InsightCard[];
  score: InsightsScore;
  competitorInsights: CompetitorInsight[];
  topSources: Array<{
    url: string;
    domain: string;
    relevance: string;
    brandsFound: string[];
    surfaceType: string;
    crossEngineCitations: number;
  }>;
  allSourcesCount: number;
}

const SURFACE_TYPE_PRIORITY: Record<SurfaceType, number> = {
  comparison: 0,
  authority: 1,
  eligibility: 2,
  brand_owned: 3,
  competitor_owned: 4,
  social: 8,
  redirect_wrapper: 9,
  unknown: 7,
};

export function generateReport(
  brandName: string,
  dimensions: QueryDimensions,
  score: InsightsScore,
  eliminationSignals: EliminationSignal[],
  competitorInsights: CompetitorInsight[],
  extractions: SourceExtraction[],
  classified?: ClassifiedSource[],
): InsightsReport {
  const cards: InsightCard[] = [];

  for (const signal of eliminationSignals) {
    cards.push({
      id: `elim-${signal.dimension}-${signal.reason}`,
      type: "elimination",
      severity: signal.confidence,
      title: getEliminationTitle(signal),
      body: signal.evidence,
      evidence: [signal.evidence],
      recommendation: signal.suggestion,
      affectedDimension: signal.dimension,
    });
  }

  const topCompetitors = competitorInsights.slice(0, 5);
  for (const comp of topCompetitors) {
    if (comp.sourceCount > score.summary.brandFoundInSources) {
      cards.push({
        id: `comp-${comp.name.toLowerCase().replace(/\s+/g, "-")}`,
        type: "competitor",
        severity: comp.sourceCount > score.summary.brandFoundInSources * 2 ? "high" : "medium",
        title: `${comp.name} has stronger citation coverage`,
        body: `${comp.name} appears in ${comp.sourceCount} source(s) vs your ${score.summary.brandFoundInSources}. ${comp.strengthFactors.join(". ")}.`,
        evidence: comp.strengthFactors,
        recommendation: `Analyze the sources citing ${comp.name} to identify editorial opportunities. Consider contributing to the same publications, directories, or review platforms where ${comp.name} is present.`,
        affectedDimension: null,
      });
    }
  }

  for (const check of score.attributionChecks) {
    if (check.evidenceType === "model_knowledge") {
      cards.push({
        id: `attr-${check.engine}`,
        type: "attribution",
        severity: "info",
        title: `${capitalizeEngine(check.engine)} relies on training data, not citations`,
        body: `${capitalizeEngine(check.engine)} provided ${check.citationCount} citation(s) for its recommendations. When citation count is low, the engine likely relies on its training data rather than real-time source evidence, making recommendations less transparent and harder to influence.`,
        evidence: [`Citation count: ${check.citationCount}`],
        recommendation: `For citation-driven engines, focus on getting mentioned in high-authority sources. For model-knowledge engines, ensure brand mentions are consistent across the web to improve training data representation.`,
        affectedDimension: null,
      });
    }
  }

  if (score.brandScore.sourcePresenceRate > 0.5 && score.brandScore.eliminationRisk === "none") {
    cards.push({
      id: "strength-coverage",
      type: "strength",
      severity: "info",
      title: "Strong citation coverage detected",
      body: `"${brandName}" appears in ${(score.brandScore.sourcePresenceRate * 100).toFixed(0)}% of analyzed sources, indicating strong editorial visibility. This increases the probability of being recommended by AI engines.`,
      evidence: [`Presence rate: ${(score.brandScore.sourcePresenceRate * 100).toFixed(0)}%`],
      recommendation: "Maintain current editorial presence. Focus on improving position within existing listings to move from mentioned to top-recommended.",
      affectedDimension: null,
    });
  }

  const classifiedMap = new Map<string, ClassifiedSource>();
  if (classified) {
    for (const c of classified) {
      classifiedMap.set(c.url, c);
    }
  }

  const opportunitySources = extractions
    .filter(e => e.overallRelevance === "high" && !e.targetBrandFound)
    .filter(e => {
      const cls = classifiedMap.get(e.url);
      const isCitedByMultipleEngines = cls ? cls.crossEngineCitations >= 2 : false;
      const isTier1or2 = cls ? cls.tier <= 2 : false;
      const isComparisonSurface = e.surfaceType === "comparison";
      return isCitedByMultipleEngines || isTier1or2 || isComparisonSurface;
    })
    .slice(0, 3);

  for (const source of opportunitySources) {
    const cls = classifiedMap.get(source.url);
    const qualifiers: string[] = [];
    if (cls?.crossEngineCitations && cls.crossEngineCitations >= 2) qualifiers.push(`cited by ${cls.crossEngineCitations} AI engines`);
    if (cls?.tier && cls.tier <= 2) qualifiers.push(`Tier ${cls.tier} credibility`);
    if (source.surfaceType === "comparison") qualifiers.push("comparison surface");

    cards.push({
      id: `opp-${source.domain.replace(/[^a-z0-9]/gi, "-")}`,
      type: "opportunity",
      severity: "medium",
      title: `Opportunity: ${source.domain}`,
      body: `${source.domain} is a highly relevant source (${qualifiers.join(", ")}) that mentions ${source.brandsFound.length} competitor(s) but not "${brandName}". Getting listed here could increase AI citation probability.`,
      evidence: [`Competitors found: ${source.brandsFound.join(", ")}`, ...qualifiers],
      recommendation: `Reach out to ${source.domain} for inclusion in their comparison content. This source already covers the target category and is cited by AI engines.`,
      affectedDimension: null,
    });
  }

  cards.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2, info: 3 };
    const typeOrder = { elimination: 0, competitor: 1, opportunity: 2, attribution: 3, strength: 4 };
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return typeOrder[a.type] - typeOrder[b.type];
  });

  const topSources = extractions
    .sort((a, b) => {
      const relOrder = { high: 0, medium: 1, low: 2 };
      const relDiff = relOrder[a.overallRelevance] - relOrder[b.overallRelevance];
      if (relDiff !== 0) return relDiff;
      const surfDiff = (SURFACE_TYPE_PRIORITY[a.surfaceType] || 7) - (SURFACE_TYPE_PRIORITY[b.surfaceType] || 7);
      if (surfDiff !== 0) return surfDiff;
      const clsA = classifiedMap.get(a.url);
      const clsB = classifiedMap.get(b.url);
      const tierDiff = ((clsA?.tier || 3) - (clsB?.tier || 3));
      if (tierDiff !== 0) return tierDiff;
      return (clsB?.crossEngineCitations || 0) - (clsA?.crossEngineCitations || 0);
    })
    .map(e => {
      const cls = classifiedMap.get(e.url);
      return {
        url: e.url,
        domain: e.domain,
        relevance: e.overallRelevance,
        brandsFound: e.brandsFound,
        surfaceType: e.surfaceType,
        crossEngineCitations: cls?.crossEngineCitations || 0,
      };
    });

  return {
    generatedAt: new Date().toISOString(),
    brandName,
    dimensions,
    overallConfidence: score.brandScore.overallConfidence,
    eliminationRisk: score.brandScore.eliminationRisk,
    cards,
    score,
    competitorInsights,
    topSources,
    allSourcesCount: extractions.length,
  };
}

function getEliminationTitle(signal: EliminationSignal): string {
  switch (signal.reason) {
    case "geo_mismatch":
      return `Geographic mismatch may reduce recommendation probability`;
    case "audience_mismatch":
      return `Audience targeting gap detected in citations`;
    case "category_mismatch":
      return `Category alignment issue in source evidence`;
    case "missing_evidence":
      return `Insufficient evidence for "${signal.dimension}" dimension`;
    case "weak_positioning":
      return `Weak positioning detected on brand website`;
    case "no_citations":
      return `Brand not found in any analyzed sources`;
    default:
      return `Potential elimination signal detected`;
  }
}

function capitalizeEngine(engine: string): string {
  const names: Record<string, string> = {
    chatgpt: "ChatGPT",
    gemini: "Gemini",
    claude: "Claude",
  };
  return names[engine] || engine;
}

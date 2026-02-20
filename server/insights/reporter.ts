import type { InsightsScore, ComparativeScore, AttributionCheck } from "./scorer";
import type { EliminationSignal, CompetitorInsight } from "./elimination";
import type { SourceExtraction } from "./extractor";
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
  }>;
}

export function generateReport(
  brandName: string,
  dimensions: QueryDimensions,
  score: InsightsScore,
  eliminationSignals: EliminationSignal[],
  competitorInsights: CompetitorInsight[],
  extractions: SourceExtraction[],
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
        body: `${comp.name} appears in ${comp.sourceCount} comparison source(s) vs your ${score.summary.brandFoundInSources}. ${comp.strengthFactors.join(". ")}.`,
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
      body: `"${brandName}" appears in ${(score.brandScore.sourcePresenceRate * 100).toFixed(0)}% of comparison sources, indicating strong editorial visibility. This increases the probability of being recommended by AI engines.`,
      evidence: [`Presence rate: ${(score.brandScore.sourcePresenceRate * 100).toFixed(0)}%`],
      recommendation: "Maintain current editorial presence. Focus on improving position within existing listings to move from mentioned to top-recommended.",
      affectedDimension: null,
    });
  }

  const highRelevanceSources = extractions
    .filter(e => e.overallRelevance === "high" && !e.targetBrandFound)
    .slice(0, 3);

  for (const source of highRelevanceSources) {
    cards.push({
      id: `opp-${source.domain.replace(/[^a-z0-9]/gi, "-")}`,
      type: "opportunity",
      severity: "medium",
      title: `Opportunity: ${source.domain}`,
      body: `${source.domain} is a highly relevant comparison source that mentions ${source.brandsFound.length} competitors but not "${brandName}". Getting listed here could increase AI citation probability.`,
      evidence: [`Competitors found: ${source.brandsFound.join(", ")}`],
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
    .filter(e => e.overallRelevance !== "low")
    .sort((a, b) => {
      const relOrder = { high: 0, medium: 1, low: 2 };
      return relOrder[a.overallRelevance] - relOrder[b.overallRelevance];
    })
    .slice(0, 10)
    .map(e => ({
      url: e.url,
      domain: e.domain,
      relevance: e.overallRelevance,
      brandsFound: e.brandsFound,
    }));

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
      return `Low list positioning across comparison sources`;
    case "no_citations":
      return `Brand not found in any comparison sources`;
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

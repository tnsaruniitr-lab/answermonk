import { crawlUrls, type CrawledPage } from "./crawler";
import { classifySources, type ClassifiedSource } from "./classifier";
import { decomposeQuery, type QueryDimensions } from "./intentParser";
import { extractEvidenceFromPages, type SourceExtraction } from "./extractor";
import { detectEliminationSignals, analyzeCompetitors, type EliminationSignal, type CompetitorInsight } from "./elimination";
import { computeInsightsScore, type InsightsScore } from "./scorer";
import { generateReport, type InsightsReport } from "./reporter";

export interface InsightsInput {
  jobId: number;
  brandName: string;
  brandDomain: string | null;
  persona: string;
  services: string[];
  verticals: string[];
  geo: string | null;
  citationsByEngine: Record<string, string[]>;
  competitorNames: string[];
  aiResponses: Record<string, string[]>;
}

export interface InsightsProgress {
  stage: string;
  percent: number;
  message: string;
}

export async function runInsightsAnalysis(
  input: InsightsInput,
  onProgress?: (progress: InsightsProgress) => void,
): Promise<InsightsReport> {
  const {
    brandName,
    brandDomain,
    persona,
    services,
    verticals,
    geo,
    citationsByEngine,
    competitorNames,
    aiResponses,
  } = input;

  onProgress?.({ stage: "decompose", percent: 5, message: "Decomposing search intent..." });
  const dimensions = await decomposeQuery(brandName, persona, services, geo, verticals);
  console.log(`[insights] Dimensions: ${JSON.stringify(dimensions)}`);

  const allCitationUrls = Object.values(citationsByEngine).flat();
  const uniqueUrls = [...new Set(allCitationUrls)];

  if (uniqueUrls.length === 0) {
    onProgress?.({ stage: "complete", percent: 100, message: "No citations to analyze" });
    return generateReport(
      brandName,
      dimensions,
      {
        brandScore: {
          brandName,
          sourcePresenceRate: 0,
          avgListPosition: null,
          citationCoverage: 0,
          dimensionSupport: {},
          eliminationRisk: "high",
          overallConfidence: 0,
        },
        competitorScores: [],
        attributionChecks: Object.entries(citationsByEngine).map(([engine, urls]) => ({
          engine,
          citationCount: urls.length,
          hasCitations: urls.length > 0,
          evidenceType: urls.length > 0 ? "mixed" as const : "model_knowledge" as const,
        })),
        summary: {
          totalSourcesCrawled: 0,
          accessibleSources: 0,
          comparisonSurfaces: 0,
          brandFoundInSources: 0,
          avgSourceCredibility: 0,
          crossEngineSources: 0,
        },
      },
      [
        {
          dimension: "overall",
          reason: "no_citations",
          confidence: "high",
          evidence: "No citation URLs were available from any AI engine. Insights analysis requires citations to analyze.",
          suggestion: "Run scoring with web search enabled (ChatGPT and Gemini support web search) to generate citation URLs for analysis.",
        },
      ],
      [],
      [],
    );
  }

  onProgress?.({ stage: "crawl", percent: 10, message: `Crawling ${uniqueUrls.length} citation sources...` });
  const pages = await crawlUrls(uniqueUrls, (done, total) => {
    const pct = 10 + Math.round((done / total) * 40);
    onProgress?.({ stage: "crawl", percent: pct, message: `Crawled ${done}/${total} sources...` });
  });

  onProgress?.({ stage: "classify", percent: 55, message: "Classifying sources..." });
  const classified = classifySources(
    pages,
    brandDomain,
    brandName,
    competitorNames,
    citationsByEngine,
  );

  onProgress?.({ stage: "extract", percent: 60, message: "Extracting evidence from sources..." });
  const extractions = await extractEvidenceFromPages(
    pages,
    classified,
    brandName,
    competitorNames,
    dimensions,
  );

  onProgress?.({ stage: "eliminate", percent: 80, message: "Detecting elimination signals..." });
  const eliminationSignals = detectEliminationSignals(
    extractions,
    brandName,
    competitorNames,
    dimensions,
  );

  const competitorInsights = analyzeCompetitors(
    extractions,
    brandName,
    competitorNames,
    aiResponses,
  );

  onProgress?.({ stage: "score", percent: 90, message: "Computing scores..." });
  const insightsScore = computeInsightsScore(
    extractions,
    classified,
    brandName,
    competitorNames,
    dimensions,
    eliminationSignals,
    citationsByEngine,
  );

  onProgress?.({ stage: "report", percent: 95, message: "Generating report..." });
  const report = generateReport(
    brandName,
    dimensions,
    insightsScore,
    eliminationSignals,
    competitorInsights,
    extractions,
  );

  onProgress?.({ stage: "complete", percent: 100, message: "Analysis complete" });
  return report;
}

export type { InsightsReport, InsightCard } from "./reporter";
export type { QueryDimensions } from "./intentParser";
export type { EliminationSignal, CompetitorInsight } from "./elimination";
export type { InsightsScore, ComparativeScore, AttributionCheck } from "./scorer";

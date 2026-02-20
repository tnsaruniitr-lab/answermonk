import type { SegmentInput } from "./citation-crawler";
import { crawlCitations, extractCitationUrlsPerSegment } from "./citation-crawler";
import { canonicalizeUrl } from "../crawler";
import { selectAllComparisonTargets, type SegmentComparison } from "./comparison-targets";
import { extractAllSnippets, type PageSnippets, type BrandSnippet } from "./snippet-extractor";
import { classifyAllSources, type ClassifiedSource } from "./source-classifier";
import { buildAllIntentDictionaries, type IntentDictionary } from "./intent-dictionary";
import { scoreBrandForSegment, type BrandSegmentScore } from "./scorer";
import { collectEvidence, type SegmentEvidence } from "./evidence-collector";
import { recommendActions, type ActionRecommendation } from "./action-recommender";
import type { CrawledPage } from "../crawler";

export interface SegmentAnalysisResult {
  segmentId: string;
  segmentLabel: string;
  comparison: SegmentComparison;
  scores: {
    brand: BrandSegmentScore;
    competitorA: BrandSegmentScore;
    competitorB: BrandSegmentScore;
  };
  evidence: SegmentEvidence;
  action: ActionRecommendation;
}

export interface FullAnalysisReport {
  brandName: string;
  segments: SegmentAnalysisResult[];
  totalCitationsCrawled: number;
  totalAccessible: number;
  analyzedAt: string;
}

export type ProgressCallback = (step: string, detail: string, pct: number) => void;

export async function runSegmentAnalysis(
  brandName: string,
  segments: SegmentInput[],
  onProgress?: ProgressCallback,
): Promise<FullAnalysisReport> {
  const validSegments = segments.filter(s => s.scoringResult);
  if (validSegments.length === 0) {
    return {
      brandName,
      segments: [],
      totalCitationsCrawled: 0,
      totalAccessible: 0,
      analyzedAt: new Date().toISOString(),
    };
  }

  onProgress?.("targets", "Selecting comparison targets...", 5);
  const comparisons = selectAllComparisonTargets(brandName, validSegments);

  onProgress?.("dictionaries", "Building intent dictionaries...", 10);
  const intentDicts = buildAllIntentDictionaries(
    validSegments.map(s => ({
      id: s.id,
      seedType: s.seedType,
      customerType: s.customerType,
    })),
  );

  onProgress?.("crawling", "Crawling citation URLs...", 15);
  const pages = await crawlCitations(validSegments, (done, total) => {
    const pct = 15 + Math.round((done / total) * 40);
    onProgress?.("crawling", `Crawled ${done}/${total} pages...`, pct);
  });

  const totalCitationsCrawled = pages.length;
  const totalAccessible = pages.filter(p => p.accessible).length;

  onProgress?.("snippets", "Extracting brand snippets...", 60);
  const allTrackedBrands = new Set<string>();
  allTrackedBrands.add(brandName);
  for (const comp of comparisons) {
    allTrackedBrands.add(comp.competitors[0].name);
    allTrackedBrands.add(comp.competitors[1].name);
  }
  const trackedBrandsArray = [...allTrackedBrands].filter(b => !b.startsWith("Competitor ") && !b.startsWith("Unknown "));

  const pageSnippetsList = extractAllSnippets(pages, trackedBrandsArray);

  onProgress?.("classifying", "Classifying sources...", 70);
  const brandCountPerPage = new Map<string, number>();
  for (const ps of pageSnippetsList) {
    const brandsOnPage = new Set(ps.snippets.map(s => s.brand.toLowerCase()));
    brandCountPerPage.set(ps.page.canonicalUrl, brandsOnPage.size);
  }
  const classifiedSources = classifyAllSources(pages, brandCountPerPage);

  onProgress?.("scoring", "Scoring brands per segment...", 80);
  const segmentResults: SegmentAnalysisResult[] = [];

  const citationUrlsPerSegment = extractCitationUrlsPerSegment(validSegments);

  for (let i = 0; i < validSegments.length; i++) {
    const seg = validSegments[i];
    const comparison = comparisons.find(c => c.segmentId === seg.id);
    if (!comparison) continue;

    const intentDict = intentDicts.get(seg.id);
    if (!intentDict) continue;

    const rawCitationUrls = citationUrlsPerSegment.get(seg.id) || [];
    const segCitationUrls = new Set(rawCitationUrls.map(u => u.toLowerCase()));
    const segCitationCanonical = new Set(rawCitationUrls.map(u => canonicalizeUrl(u)));
    const segPageSnippets = pageSnippetsList.filter(ps =>
      segCitationUrls.has(ps.page.url.toLowerCase()) ||
      segCitationUrls.has(ps.page.resolvedUrl.toLowerCase()) ||
      segCitationCanonical.has(ps.page.canonicalUrl) ||
      segCitationCanonical.has(canonicalizeUrl(ps.page.url))
    );

    const allSegSnippets = segPageSnippets.flatMap(ps => ps.snippets);

    const brandScore = scoreBrandForSegment(
      brandName, true, allSegSnippets, segPageSnippets, classifiedSources, intentDict,
    );
    const compAScore = scoreBrandForSegment(
      comparison.competitors[0].name, false, allSegSnippets, segPageSnippets, classifiedSources, intentDict,
    );
    const compBScore = scoreBrandForSegment(
      comparison.competitors[1].name, false, allSegSnippets, segPageSnippets, classifiedSources, intentDict,
    );

    const evidence = collectEvidence(seg.id, brandScore, compAScore, compBScore);
    const action = recommendActions(evidence, brandScore, intentDict);

    const segmentLabel = [seg.seedType, seg.customerType].filter(Boolean).join(" for ");

    segmentResults.push({
      segmentId: seg.id,
      segmentLabel,
      comparison,
      scores: { brand: brandScore, competitorA: compAScore, competitorB: compBScore },
      evidence,
      action,
    });

    const pct = 80 + Math.round(((i + 1) / validSegments.length) * 15);
    onProgress?.("scoring", `Scored segment ${i + 1}/${validSegments.length}`, pct);
  }

  onProgress?.("complete", "Analysis complete", 100);

  return {
    brandName,
    segments: segmentResults,
    totalCitationsCrawled,
    totalAccessible,
    analyzedAt: new Date().toISOString(),
  };
}

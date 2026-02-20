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

const PERSONA_CORE_LABELS: Record<string, string> = {
  marketing_agency: "marketing agency",
  automation_consultant: "automation",
  corporate_cards_provider: "corporate cards",
  expense_management_software: "expense management",
  accounting_automation: "accounting automation",
  invoice_management: "invoice management",
  restaurant: "restaurant",
};

function buildSegmentLabel(seg: { persona?: string; seedType: string; customerType: string }): string {
  const personaLabel = seg.persona ? (PERSONA_CORE_LABELS[seg.persona] || seg.persona.replace(/_/g, " ")) : "";
  const seedLabel = seg.seedType ? seg.seedType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "";
  const category = personaLabel
    ? `${personaLabel.charAt(0).toUpperCase() + personaLabel.slice(1)} ${seedLabel}`
    : seedLabel;
  return [category, seg.customerType].filter(Boolean).join(" for ");
}

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
  modelUnderstanding?: string;
  differential?: string;
}

export interface GlobalAuthority {
  label: string;
  uniqueDomains: number;
  highTierDomains: { domain: string; tier: string }[];
  totalMentions: number;
}

export interface FullAnalysisReport {
  brandName: string;
  segments: SegmentAnalysisResult[];
  globalAuthority: GlobalAuthority;
  totalCitationsCrawled: number;
  totalAccessible: number;
  analyzedAt: string;
}

export type ProgressCallback = (step: string, detail: string, pct: number) => void;

export async function runSegmentAnalysis(
  brandName: string,
  segments: SegmentInput[],
  onProgress?: ProgressCallback,
  brandDomain?: string,
): Promise<FullAnalysisReport> {
  const validSegments = segments.filter(s => s.scoringResult);
  if (validSegments.length === 0) {
    return {
      brandName,
      segments: [],
      globalAuthority: { label: "Minimal", uniqueDomains: 0, highTierDomains: [], totalMentions: 0 },
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
  const allBrandDomains = new Set<string>();
  if (brandDomain) {
    const d = brandDomain.toLowerCase().replace(/^www\./, "").replace(/^https?:\/\//, "");
    allBrandDomains.add(d);
  }
  for (const comp of comparisons) {
    for (const c of comp.competitors) {
      const cLower = c.name.toLowerCase().replace(/\s+/g, "");
      allBrandDomains.add(`${cLower}.com`);
      allBrandDomains.add(`${cLower}.io`);
      allBrandDomains.add(`${cLower}.co`);
    }
  }
  const brandNameDomain = brandName.toLowerCase().replace(/\s+/g, "");
  allBrandDomains.add(`${brandNameDomain}.com`);
  allBrandDomains.add(`${brandNameDomain}.io`);
  allBrandDomains.add(`${brandNameDomain}.co`);
  const classifiedSources = classifyAllSources(pages, brandCountPerPage, allBrandDomains);

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

    const segmentLabel = buildSegmentLabel(seg);

    const modelUnderstanding = deriveModelUnderstanding(brandName, allSegSnippets, intentDict);
    const differential = buildDifferential(brandName, brandScore, compAScore, compBScore, intentDict);

    segmentResults.push({
      segmentId: seg.id,
      segmentLabel,
      comparison,
      scores: { brand: brandScore, competitorA: compAScore, competitorB: compBScore },
      evidence,
      action,
      modelUnderstanding,
      differential,
    });

    const pct = 80 + Math.round(((i + 1) / validSegments.length) * 15);
    onProgress?.("scoring", `Scored segment ${i + 1}/${validSegments.length}`, pct);
  }

  onProgress?.("global", "Computing global authority...", 96);
  const globalAuthority = computeGlobalAuthority(brandName, pageSnippetsList, classifiedSources);

  onProgress?.("complete", "Analysis complete", 100);

  return {
    brandName,
    segments: segmentResults,
    globalAuthority,
    totalCitationsCrawled,
    totalAccessible,
    analyzedAt: new Date().toISOString(),
  };
}

function computeGlobalAuthority(
  brandName: string,
  pageSnippetsList: PageSnippets[],
  classifiedSources: Map<string, ClassifiedSource>,
): GlobalAuthority {
  const domainMap = new Map<string, { tier: string; mentions: number }>();
  const brandLower = brandName.toLowerCase();

  for (const ps of pageSnippetsList) {
    const source = classifiedSources.get(ps.page.canonicalUrl);
    if (!source || source.isBrandOwned) continue;

    const brandSnippets = ps.snippets.filter(s => s.brand.toLowerCase() === brandLower);
    if (brandSnippets.length === 0) continue;

    const existing = domainMap.get(source.domain);
    if (existing) {
      existing.mentions += brandSnippets.length;
    } else {
      domainMap.set(source.domain, { tier: source.tier, mentions: brandSnippets.length });
    }
  }

  const highTierDomains = [...domainMap.entries()]
    .filter(([_, d]) => d.tier === "T1" || d.tier === "T2")
    .sort((a, b) => {
      const tierOrder: Record<string, number> = { T1: 0, T2: 1, T3: 2 };
      return (tierOrder[a[1].tier] || 2) - (tierOrder[b[1].tier] || 2) || b[1].mentions - a[1].mentions;
    })
    .slice(0, 10)
    .map(([domain, d]) => ({ domain, tier: d.tier }));

  const totalMentions = [...domainMap.values()].reduce((sum, d) => sum + d.mentions, 0);

  let label: string;
  if (domainMap.size >= 5) label = "High";
  else if (domainMap.size >= 2) label = "Moderate";
  else if (domainMap.size >= 1) label = "Low";
  else label = "Minimal";

  return {
    label,
    uniqueDomains: domainMap.size,
    highTierDomains,
    totalMentions,
  };
}

function deriveModelUnderstanding(
  brandName: string,
  allSnippets: BrandSnippet[],
  intentDict: IntentDictionary,
): string {
  const brandSnippets = allSnippets.filter(s => s.brand.toLowerCase() === brandName.toLowerCase());
  if (brandSnippets.length === 0) return "Not mentioned in retrieved sources";

  const termCounts = new Map<string, number>();

  for (const snippet of brandSnippets) {
    const lower = snippet.text.toLowerCase();
    const allTerms = [
      ...intentDict.category_terms,
      ...intentDict.category_terms_weak,
      ...intentDict.audience_terms,
      ...intentDict.audience_terms_weak,
    ];
    for (const term of allTerms) {
      if (lower.includes(term)) {
        termCounts.set(term, (termCounts.get(term) || 0) + 1);
      }
    }
  }

  const sorted = [...termCounts.entries()].sort((a, b) => b[1] - a[1]);
  const topTerms = sorted.slice(0, 3).map(([term]) => term);

  if (topTerms.length === 0) return "Generic mentions without category context";
  return topTerms.join(" + ");
}

function buildDifferential(
  brandName: string,
  brandScore: BrandSegmentScore,
  compAScore: BrandSegmentScore,
  compBScore: BrandSegmentScore,
  intentDict: IntentDictionary,
): string {
  const parts: string[] = [];

  const brandCatSnippets = brandScore.context.explicitCategory + brandScore.context.weakCategory;
  const brandAudSnippets = brandScore.context.explicitAudience + brandScore.context.weakAudience + brandScore.context.adjacentAudience;

  const competitors = [compAScore, compBScore].filter(c => c.brand !== brandName);
  const strongestComp = competitors.sort((a, b) => {
    const aTotal = a.context.explicitCategory + a.context.weakCategory;
    const bTotal = b.context.explicitCategory + b.context.weakCategory;
    return bTotal - aTotal;
  })[0];

  if (strongestComp) {
    const compCatSnippets = strongestComp.context.explicitCategory + strongestComp.context.weakCategory;
    const compAudSnippets = strongestComp.context.explicitAudience + strongestComp.context.weakAudience + (strongestComp.context.adjacentAudience || 0);

    if (compCatSnippets > brandCatSnippets) {
      parts.push(`${compCatSnippets} sources describe ${strongestComp.brand} in category terms vs ${brandCatSnippets} for ${brandName}`);
    }
    if (compAudSnippets > brandAudSnippets) {
      parts.push(`${compAudSnippets} sources associate ${strongestComp.brand} with this audience vs ${brandAudSnippets} for ${brandName}`);
    }

    if (strongestComp.authority.supportingDomains > brandScore.authority.supportingDomains) {
      parts.push(`${strongestComp.brand} appears on ${strongestComp.authority.supportingDomains} third-party sources vs ${brandScore.authority.supportingDomains} for ${brandName}`);
    }
  }

  if (parts.length === 0) {
    if (brandScore.context.label === "strong" || brandScore.context.label === "medium") {
      return `${brandName} has competitive positioning in this segment`;
    }
    return `Insufficient citation data for differential analysis`;
  }

  return parts.join(". ") + ".";
}

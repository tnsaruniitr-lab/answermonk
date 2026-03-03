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
  seo_agency: "SEO agency",
  performance_marketing_agency: "performance marketing agency",
  content_marketing_agency: "content marketing agency",
  social_media_agency: "social media agency",
  web_design_agency: "web design agency",
  pr_agency: "PR agency",
  branding_agency: "branding agency",
  digital_marketing_agency: "digital marketing agency",
  automation_consultant: "automation",
  corporate_cards_provider: "corporate cards",
  expense_management_software: "expense management",
  accounting_automation: "accounting automation",
  invoice_management: "invoice management",
  restaurant: "restaurant",
  in_home_healthcare: "in-home healthcare",
  at_home_healthcare: "at-home healthcare",
  weight_loss_help: "weight loss",
  in_home_blood_tests: "in-home blood tests",
  at_home_blood_tests: "at-home blood tests",
};

function buildSegmentLabel(seg: { persona?: string; seedType: string; customerType: string; serviceType?: string }): string {
  const personaLabel = seg.persona ? (PERSONA_CORE_LABELS[seg.persona] || seg.persona.replace(/_/g, " ")) : "";
  const isBlankSeed = !seg.seedType || seg.seedType.toLowerCase() === "blank";
  const seedLabel = isBlankSeed ? "" : seg.seedType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const category = personaLabel
    ? (seedLabel ? `${personaLabel.charAt(0).toUpperCase() + personaLabel.slice(1)} ${seedLabel}` : personaLabel.charAt(0).toUpperCase() + personaLabel.slice(1))
    : seedLabel;
  const parts = [category];
  if (seg.serviceType) parts.push(`(${seg.serviceType})`);
  if (seg.customerType) parts.push(`for ${seg.customerType}`);
  return parts.filter(Boolean).join(" ");
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
  differential?: DifferentialAnalysis;
}

export interface DifferentialEvidence {
  quote: string;
  sourceUrl: string;
  sourceDomain: string;
  sourceTitle: string;
}

export interface DifferentialPoint {
  statement: string;
  competitorExamples: DifferentialEvidence[];
  brandExamples: DifferentialEvidence[];
}

export interface DifferentialAnalysis {
  summary: string;
  points: DifferentialPoint[];
}

export interface GlobalAuthority {
  label: string;
  uniqueDomains: number;
  highTierDomains: { domain: string; tier: string }[];
  allDomains: { domain: string; tier: string; mentions: number }[];
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
      globalAuthority: { label: "Minimal", uniqueDomains: 0, highTierDomains: [], allDomains: [], totalMentions: 0 },
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
      persona: s.persona,
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
    const allCompetitorNames = comparison.competitors.map(c => c.name);
    const action = recommendActions(evidence, brandScore, intentDict, brandName, allCompetitorNames);

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

  const allDomains = [...domainMap.entries()]
    .sort((a, b) => {
      const tierOrder: Record<string, number> = { T1: 0, T2: 1, T3: 2, T4: 3 };
      return (tierOrder[a[1].tier] ?? 4) - (tierOrder[b[1].tier] ?? 4) || b[1].mentions - a[1].mentions;
    })
    .map(([domain, d]) => ({ domain, tier: d.tier, mentions: d.mentions }));

  return {
    label,
    uniqueDomains: domainMap.size,
    highTierDomains,
    allDomains,
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

function snippetToEvidence(s: { text: string; pageUrl: string; pageDomain: string; pageTitle: string }): DifferentialEvidence {
  const quote = s.text.length > 160 ? s.text.slice(0, 157) + "..." : s.text;
  return { quote, sourceUrl: s.pageUrl, sourceDomain: s.pageDomain, sourceTitle: s.pageTitle };
}

function domainToEvidence(d: { domain: string; tier: string; snippet: string; pageUrl?: string; pageTitle?: string }): DifferentialEvidence {
  const quote = d.snippet.length > 160 ? d.snippet.slice(0, 157) + "..." : d.snippet;
  return { quote, sourceUrl: d.pageUrl || "", sourceDomain: d.domain, sourceTitle: d.pageTitle || d.domain };
}

function buildDifferential(
  brandName: string,
  brandScore: BrandSegmentScore,
  compAScore: BrandSegmentScore,
  compBScore: BrandSegmentScore,
  _intentDict: IntentDictionary,
): DifferentialAnalysis {
  const points: DifferentialPoint[] = [];

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
      const compExamples = [...strongestComp.context.explicitSnippets, ...strongestComp.context.weakSnippets]
        .slice(0, 2).map(snippetToEvidence);
      const brandExamples = [...brandScore.context.explicitSnippets, ...brandScore.context.weakSnippets]
        .slice(0, 2).map(snippetToEvidence);
      points.push({
        statement: `${compCatSnippets} sources describe ${strongestComp.brand} in category terms vs ${brandCatSnippets} for ${brandName}`,
        competitorExamples: compExamples,
        brandExamples,
      });
    }
    if (compAudSnippets > brandAudSnippets) {
      const compAudExplicit = [...strongestComp.context.explicitSnippets].filter(s => true).slice(0, 2);
      const brandAudExplicit = [...brandScore.context.explicitSnippets].slice(0, 2);
      points.push({
        statement: `${compAudSnippets} sources associate ${strongestComp.brand} with this audience vs ${brandAudSnippets} for ${brandName}`,
        competitorExamples: compAudExplicit.map(snippetToEvidence),
        brandExamples: brandAudExplicit.map(snippetToEvidence),
      });
    }

    if (strongestComp.authority.supportingDomains > brandScore.authority.supportingDomains) {
      points.push({
        statement: `${strongestComp.brand} appears on ${strongestComp.authority.supportingDomains} third-party sources vs ${brandScore.authority.supportingDomains} for ${brandName}`,
        competitorExamples: strongestComp.authority.topDomains.slice(0, 2).map(domainToEvidence),
        brandExamples: brandScore.authority.topDomains.slice(0, 2).map(domainToEvidence),
      });
    }
  }

  if (points.length === 0) {
    const summary = (brandScore.context.label === "strong" || brandScore.context.label === "medium")
      ? `${brandName} has competitive positioning in this segment`
      : `Insufficient citation data for differential analysis`;
    return { summary, points: [] };
  }

  return {
    summary: points.map(p => p.statement).join(". ") + ".",
    points,
  };
}

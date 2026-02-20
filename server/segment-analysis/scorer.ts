import type { BrandSnippet, PageSnippets } from "./snippet-extractor";
import type { ClassifiedSource, SourceTier, SurfaceType } from "./source-classifier";
import type { IntentDictionary, SnippetMatchLevel } from "./intent-dictionary";
import { classifySnippetMatch } from "./intent-dictionary";
import { TIER_WEIGHTS } from "./source-classifier";

export type StrengthLabel = "strong" | "medium" | "weak" | "absent";

export interface RetrievedAuthorityScore {
  label: StrengthLabel;
  supportingDomains: number;
  weightedScore: number;
  surfaceDiversityBonus: number;
  totalScore: number;
  topDomains: { domain: string; tier: SourceTier; snippet: string }[];
}

export interface ContextConsistencyScore {
  label: StrengthLabel;
  totalSnippets: number;
  explicitCategory: number;
  weakCategory: number;
  noCategory: number;
  explicitAudience: number;
  weakAudience: number;
  noAudience: number;
  categoryRate: number;
  audienceRate: number;
  explicitSnippets: BrandSnippet[];
  weakSnippets: BrandSnippet[];
  genericSnippets: BrandSnippet[];
}

export interface ComparativePresenceScore {
  label: StrengthLabel;
  totalComparisonSurfaces: number;
  presentOnSurfaces: number;
  absentFromSurfaces: number;
  avgProminence: number | null;
  comparisonPages: { url: string; domain: string; present: boolean; position: number | null; title: string }[];
}

export interface BrandSegmentScore {
  brand: string;
  isBrand: boolean;
  authority: RetrievedAuthorityScore;
  context: ContextConsistencyScore;
  comparative: ComparativePresenceScore;
}

function labelFromScore(score: number, thresholds: [number, number, number]): StrengthLabel {
  if (score >= thresholds[0]) return "strong";
  if (score >= thresholds[1]) return "medium";
  if (score > thresholds[2]) return "weak";
  return "absent";
}

export function scoreRetrievedAuthority(
  brand: string,
  snippetsByPage: Map<string, BrandSnippet[]>,
  classifiedSources: Map<string, ClassifiedSource>,
  intentDict: IntentDictionary,
): RetrievedAuthorityScore {
  const domainMap = new Map<string, { tier: SourceTier; snippet: string; weight: number }>();

  for (const [canonicalUrl, snippets] of snippetsByPage) {
    const source = classifiedSources.get(canonicalUrl);
    if (!source) continue;

    const brandSnippets = snippets.filter(s => s.brand.toLowerCase() === brand.toLowerCase());
    if (brandSnippets.length === 0) continue;

    const hasSupporting = brandSnippets.some(s => {
      const match = classifySnippetMatch(s.text, intentDict);
      return match.categoryMatch !== "none" || match.audienceMatch !== "none";
    });
    if (!hasSupporting) continue;

    const existing = domainMap.get(source.domain);
    if (!existing || source.tierWeight > existing.weight) {
      domainMap.set(source.domain, {
        tier: source.tier,
        snippet: brandSnippets[0].text,
        weight: source.tierWeight,
      });
    }
  }

  let weightedScore = 0;
  for (const entry of domainMap.values()) {
    weightedScore += entry.weight;
  }

  const surfaceTypes = new Set<SurfaceType>();
  for (const [canonicalUrl, snippets] of snippetsByPage) {
    const brandSnippets = snippets.filter(s => s.brand.toLowerCase() === brand.toLowerCase());
    if (brandSnippets.length === 0) continue;
    const source = classifiedSources.get(canonicalUrl);
    if (source) surfaceTypes.add(source.surfaceType);
  }
  const surfaceDiversityBonus = Math.min(surfaceTypes.size * 0.1, 0.3);

  const totalScore = weightedScore + surfaceDiversityBonus;

  const topDomains = [...domainMap.entries()]
    .sort((a, b) => b[1].weight - a[1].weight)
    .slice(0, 3)
    .map(([domain, data]) => ({ domain, tier: data.tier, snippet: data.snippet }));

  return {
    label: labelFromScore(totalScore, [2.0, 1.0, 0]),
    supportingDomains: domainMap.size,
    weightedScore,
    surfaceDiversityBonus,
    totalScore,
    topDomains,
  };
}

export function scoreContextConsistency(
  brand: string,
  allSnippets: BrandSnippet[],
  intentDict: IntentDictionary,
): ContextConsistencyScore {
  const brandSnippets = allSnippets.filter(s => s.brand.toLowerCase() === brand.toLowerCase());

  let explicitCategory = 0;
  let weakCategory = 0;
  let noCategory = 0;
  let explicitAudience = 0;
  let weakAudience = 0;
  let noAudience = 0;

  const explicitSnippets: BrandSnippet[] = [];
  const weakSnippetsList: BrandSnippet[] = [];
  const genericSnippets: BrandSnippet[] = [];

  for (const snippet of brandSnippets) {
    const match = classifySnippetMatch(snippet.text, intentDict);

    if (match.categoryMatch === "explicit") {
      explicitCategory++;
    } else if (match.categoryMatch === "weak") {
      weakCategory++;
    } else {
      noCategory++;
    }

    if (match.audienceMatch === "explicit") {
      explicitAudience++;
    } else if (match.audienceMatch === "weak") {
      weakAudience++;
    } else {
      noAudience++;
    }

    if (match.categoryMatch === "explicit" || match.audienceMatch === "explicit") {
      explicitSnippets.push(snippet);
    } else if (match.categoryMatch === "weak" || match.audienceMatch === "weak") {
      weakSnippetsList.push(snippet);
    } else {
      genericSnippets.push(snippet);
    }
  }

  const total = brandSnippets.length;
  const categoryRate = total > 0 ? (explicitCategory + weakCategory * 0.5) / total : 0;
  const audienceRate = total > 0 && intentDict.audience_terms.length > 0
    ? (explicitAudience + weakAudience * 0.5) / total : -1;

  const overallRate = audienceRate >= 0 ? (categoryRate + audienceRate) / 2 : categoryRate;

  return {
    label: total === 0 ? "absent" : labelFromScore(overallRate, [0.6, 0.3, 0]),
    totalSnippets: total,
    explicitCategory,
    weakCategory,
    noCategory,
    explicitAudience,
    weakAudience,
    noAudience,
    categoryRate,
    audienceRate,
    explicitSnippets: explicitSnippets.slice(0, 3),
    weakSnippets: weakSnippetsList.slice(0, 2),
    genericSnippets: genericSnippets.slice(0, 2),
  };
}

export function scoreComparativePresence(
  brand: string,
  pageSnippetsList: PageSnippets[],
  classifiedSources: Map<string, ClassifiedSource>,
): ComparativePresenceScore {
  const comparisonPages: { url: string; domain: string; present: boolean; position: number | null; title: string }[] = [];

  for (const ps of pageSnippetsList) {
    const source = classifiedSources.get(ps.page.canonicalUrl);
    if (!source || source.comparisonSurfaceScore === 0) continue;

    const brandSnippets = ps.snippets.filter(
      s => s.brand.toLowerCase() === brand.toLowerCase()
    );
    const isPresent = brandSnippets.length > 0;

    let position: number | null = null;
    if (isPresent) {
      const listSnippets = brandSnippets.filter(s => s.source === "list_item");
      if (listSnippets.length > 0) {
        const brandLower = brand.toLowerCase();
        for (let i = 0; i < ps.page.listItems.length; i++) {
          if (ps.page.listItems[i].toLowerCase().includes(brandLower)) {
            position = i + 1;
            break;
          }
        }
      }
      if (position === null) {
        const idx = ps.page.cleanText.toLowerCase().indexOf(brand.toLowerCase());
        if (idx >= 0) {
          position = Math.ceil(idx / ps.page.cleanText.length * 10) + 1;
        }
      }
    }

    comparisonPages.push({
      url: ps.page.url,
      domain: ps.page.domain,
      present: isPresent,
      position,
      title: ps.page.title,
    });
  }

  const totalComparisonSurfaces = comparisonPages.length;
  const presentOnSurfaces = comparisonPages.filter(p => p.present).length;
  const absentFromSurfaces = totalComparisonSurfaces - presentOnSurfaces;

  const positions = comparisonPages
    .filter(p => p.present && p.position !== null)
    .map(p => p.position!);
  const avgProminence = positions.length > 0
    ? Math.round(positions.reduce((a, b) => a + b, 0) / positions.length * 10) / 10
    : null;

  let label: StrengthLabel;
  if (totalComparisonSurfaces === 0) {
    label = "absent";
  } else if (presentOnSurfaces === 0) {
    label = "absent";
  } else {
    const presenceRate = presentOnSurfaces / totalComparisonSurfaces;
    label = labelFromScore(presenceRate, [0.7, 0.3, 0]);
  }

  return {
    label,
    totalComparisonSurfaces,
    presentOnSurfaces,
    absentFromSurfaces,
    avgProminence,
    comparisonPages: comparisonPages.slice(0, 5),
  };
}

export function scoreBrandForSegment(
  brand: string,
  isBrand: boolean,
  allSnippets: BrandSnippet[],
  pageSnippetsList: PageSnippets[],
  classifiedSources: Map<string, ClassifiedSource>,
  intentDict: IntentDictionary,
): BrandSegmentScore {
  const snippetsByPage = new Map<string, BrandSnippet[]>();
  for (const snippet of allSnippets) {
    const key = snippet.pageUrl;
    const pageData = pageSnippetsList.find(ps => ps.page.url === key);
    if (pageData) {
      const canonical = pageData.page.canonicalUrl;
      const existing = snippetsByPage.get(canonical) || [];
      existing.push(snippet);
      snippetsByPage.set(canonical, existing);
    }
  }

  return {
    brand,
    isBrand,
    authority: scoreRetrievedAuthority(brand, snippetsByPage, classifiedSources, intentDict),
    context: scoreContextConsistency(brand, allSnippets, intentDict),
    comparative: scoreComparativePresence(brand, pageSnippetsList, classifiedSources),
  };
}

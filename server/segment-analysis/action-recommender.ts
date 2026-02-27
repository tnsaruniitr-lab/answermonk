import type { BrandSegmentScore } from "./scorer";
import type { SegmentEvidence } from "./evidence-collector";
import type { IntentDictionary } from "./intent-dictionary";
import { classifyTier } from "../report/tier-classifier";

export interface ActionRecommendation {
  primary: string;
  secondary: string | null;
  gapType: "category" | "audience" | "comparative" | "authority" | "none";
}

export function recommendActions(
  evidence: SegmentEvidence,
  brandScore: BrandSegmentScore,
  intentDict: IntentDictionary,
  brandName?: string,
  competitorNames?: string[],
): ActionRecommendation {
  const categoryTerms = intentDict.category_terms.slice(0, 3).map(t => `"${t}"`).join(", ");
  const audienceTerms = intentDict.audience_terms.slice(0, 3).map(t => `"${t}"`).join(", ");

  const categoryGap = brandScore.context.label === "absent" || brandScore.context.label === "weak";
  const audienceGap = brandScore.context.audienceRate >= 0 && brandScore.context.audienceRate < 0.3;
  const comparativeGap = brandScore.comparative.label === "absent" || brandScore.comparative.presentOnSurfaces === 0;
  const authorityGap = brandScore.authority.label === "absent" || brandScore.authority.label === "weak";

  if (categoryGap && audienceGap) {
    return {
      primary: `Add explicit ${categoryTerms} wording to your homepage H1, first 200 words, and directory profiles (G2, Crunchbase). Include ${audienceTerms} in the same sentence as your category.`,
      secondary: comparativeGap ? buildComparativeAction(evidence, brandName, competitorNames) : null,
      gapType: "category",
    };
  }

  if (categoryGap) {
    return {
      primary: `Add explicit ${categoryTerms} phrasing to your homepage H1, first 200 words, and directory profiles (G2, Crunchbase, LinkedIn description).`,
      secondary: comparativeGap ? buildComparativeAction(evidence, brandName, competitorNames) : null,
      gapType: "category",
    };
  }

  if (audienceGap) {
    return {
      primary: `Add explicit audience targeting — include ${audienceTerms} in the same sentence as your category phrase on key pages and directory profiles.`,
      secondary: comparativeGap ? buildComparativeAction(evidence, brandName, competitorNames) : null,
      gapType: "audience",
    };
  }

  if (comparativeGap) {
    return {
      primary: buildComparativeAction(evidence, brandName, competitorNames),
      secondary: authorityGap ? buildAuthorityAction(evidence, brandName, competitorNames) : null,
      gapType: "comparative",
    };
  }

  if (authorityGap) {
    return {
      primary: buildAuthorityAction(evidence, brandName, competitorNames),
      secondary: null,
      gapType: "authority",
    };
  }

  return {
    primary: "Your brand positioning is well-aligned for this segment. Focus on maintaining and expanding your presence across cited sources.",
    secondary: null,
    gapType: "none",
  };
}

function isCompetitorOwnedDomain(domain: string, brandName?: string, competitorNames?: string[]): boolean {
  if (!brandName || !competitorNames) return false;
  const tier = classifyTier(domain, brandName, competitorNames);
  return tier === "T4" || tier === "brand_owned";
}

function buildComparativeAction(evidence: SegmentEvidence, brandName?: string, competitorNames?: string[]): string {
  const compPages = evidence.factors.find(f => f.factor === "comparative");
  const competitorDomains = [
    ...compPages?.competitorAEvidence || [],
    ...compPages?.competitorBEvidence || [],
  ]
    .map(e => e.domain)
    .filter((d, i, arr) => arr.indexOf(d) === i)
    .filter(d => !isCompetitorOwnedDomain(d, brandName, competitorNames))
    .slice(0, 3);

  if (competitorDomains.length > 0) {
    return `Get listed on comparison surfaces where competitors appear: ${competitorDomains.join(", ")}. Prioritize Tier 1/2 domains.`;
  }

  return `Get listed on comparison and directory sites where competitors appear. Look for listicles, review sites, and industry directories in your segment.`;
}

function buildAuthorityAction(evidence: SegmentEvidence, brandName?: string, competitorNames?: string[]): string {
  const authFactor = evidence.factors.find(f => f.factor === "authority");
  const competitorDomains = [
    ...authFactor?.competitorAEvidence || [],
    ...authFactor?.competitorBEvidence || [],
  ]
    .map(e => e.domain)
    .filter((d, i, arr) => arr.indexOf(d) === i)
    .filter(d => !isCompetitorOwnedDomain(d, brandName, competitorNames))
    .slice(0, 3);

  if (competitorDomains.length > 0) {
    return `Get referenced on higher-authority sources. Competitors appear on: ${competitorDomains.join(", ")}. Target similar publications with PR, guest content, or directory profiles.`;
  }

  return `Increase your presence on authoritative sources — target industry publications, review platforms, and analyst reports relevant to your segment.`;
}

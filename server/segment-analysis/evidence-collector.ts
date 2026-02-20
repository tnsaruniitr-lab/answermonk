import type { BrandSegmentScore, StrengthLabel } from "./scorer";
import type { BrandSnippet } from "./snippet-extractor";

export interface EvidenceItem {
  snippet: string;
  source: string;
  domain: string;
  url: string;
  tier?: string;
}

export interface FactorEvidence {
  factor: "authority" | "context" | "comparative";
  factorLabel: string;
  brandLabel: StrengthLabel;
  competitorALabel: StrengthLabel;
  competitorBLabel: StrengthLabel;
  brandEvidence: EvidenceItem[];
  competitorAEvidence: EvidenceItem[];
  competitorBEvidence: EvidenceItem[];
  absenceStatement: string | null;
  summary: string;
}

export interface SegmentEvidence {
  segmentId: string;
  winner: string;
  winnerReason: string;
  winnerSnippet: EvidenceItem | null;
  brandSnippet: EvidenceItem | null;
  factors: FactorEvidence[];
}

function pickTopSnippets(snippets: BrandSnippet[], max: number): EvidenceItem[] {
  const seen = new Set<string>();
  const result: EvidenceItem[] = [];

  const prioritized = [...snippets].sort((a, b) => {
    const sourceOrder: Record<string, number> = { list_item: 0, table_row: 1, heading: 2, paragraph: 3 };
    return (sourceOrder[a.source] ?? 3) - (sourceOrder[b.source] ?? 3);
  });

  for (const s of prioritized) {
    if (seen.has(s.hash)) continue;
    seen.add(s.hash);
    result.push({
      snippet: s.text,
      source: s.pageTitle || s.pageDomain,
      domain: s.pageDomain,
      url: s.pageUrl,
    });
    if (result.length >= max) break;
  }

  return result;
}

function determineWinner(
  brand: BrandSegmentScore,
  compA: BrandSegmentScore,
  compB: BrandSegmentScore,
): { winner: BrandSegmentScore; reason: string } {
  const scores = [brand, compA, compB].map(b => ({
    brand: b,
    total: strengthToNum(b.authority.label) + strengthToNum(b.context.label) + strengthToNum(b.comparative.label),
    contextScore: strengthToNum(b.context.label),
    authorityScore: strengthToNum(b.authority.label),
  }));

  scores.sort((a, b) => b.total - a.total || b.contextScore - a.contextScore);

  const winner = scores[0];
  let reason: string;

  if (winner.authorityScore > scores[1].authorityScore && winner.contextScore >= scores[1].contextScore) {
    reason = `Higher retrieved authority across sources`;
  } else if (winner.contextScore > scores[1].contextScore) {
    reason = `Stronger context consistency for this segment's terms`;
  } else if (strengthToNum(winner.brand.comparative.label) > strengthToNum(scores[1].brand.comparative.label)) {
    reason = `More present on comparison surfaces`;
  } else {
    reason = `Stronger overall presence in retrieved sources`;
  }

  return { winner: winner.brand, reason };
}

function strengthToNum(label: StrengthLabel): number {
  const map: Record<StrengthLabel, number> = { strong: 3, medium: 2, weak: 1, absent: 0 };
  return map[label];
}

export function collectEvidence(
  segmentId: string,
  brand: BrandSegmentScore,
  compA: BrandSegmentScore,
  compB: BrandSegmentScore,
): SegmentEvidence {
  const { winner, reason } = determineWinner(brand, compA, compB);

  const winnerAuthSnippets = winner.authority.topDomains.slice(0, 1);
  const winnerSnippet: EvidenceItem | null = winnerAuthSnippets.length > 0
    ? { snippet: winnerAuthSnippets[0].snippet, source: winnerAuthSnippets[0].domain, domain: winnerAuthSnippets[0].domain, url: "", tier: winnerAuthSnippets[0].tier }
    : winner.context.explicitSnippets.length > 0
      ? { snippet: winner.context.explicitSnippets[0].text, source: winner.context.explicitSnippets[0].pageDomain, domain: winner.context.explicitSnippets[0].pageDomain, url: winner.context.explicitSnippets[0].pageUrl }
      : null;

  const brandAuthSnippets = brand.authority.topDomains.slice(0, 1);
  const brandSnippet: EvidenceItem | null = brandAuthSnippets.length > 0
    ? { snippet: brandAuthSnippets[0].snippet, source: brandAuthSnippets[0].domain, domain: brandAuthSnippets[0].domain, url: "", tier: brandAuthSnippets[0].tier }
    : brand.context.explicitSnippets.length > 0
      ? { snippet: brand.context.explicitSnippets[0].text, source: brand.context.explicitSnippets[0].pageDomain, domain: brand.context.explicitSnippets[0].pageDomain, url: brand.context.explicitSnippets[0].pageUrl }
      : null;

  const authorityEvidence = buildFactorEvidence(
    "authority",
    "Retrieved Authority",
    brand, compA, compB,
    b => b.authority.topDomains.map(d => ({
      snippet: d.snippet,
      source: d.domain,
      domain: d.domain,
      url: "",
      tier: d.tier,
    })),
    (b) => {
      if (b.authority.label === "absent") return `Not found on any third-party supporting sources`;
      return `${b.authority.supportingDomains} third-party domain(s), weighted score ${b.authority.totalScore.toFixed(1)}`;
    },
  );

  const contextEvidence = buildFactorEvidence(
    "context",
    "Context Consistency",
    brand, compA, compB,
    b => pickTopSnippets([...b.context.explicitSnippets, ...b.context.weakSnippets, ...b.context.genericSnippets], 2),
    (b) => {
      if (b.context.totalSnippets === 0) return `No mentions found`;
      const catRate = Math.round(b.context.categoryRate * 100);
      const audRate = Math.round(b.context.audienceRate * 100);
      return `${catRate}% category match, ${audRate}% audience match across ${b.context.totalSnippets} snippets`;
    },
  );

  const comparativeEvidence = buildFactorEvidence(
    "comparative",
    "Comparison Presence",
    brand, compA, compB,
    b => b.comparative.comparisonPages
      .filter(p => p.present)
      .slice(0, 2)
      .map(p => ({
        snippet: `Listed on ${p.title || p.domain}${p.position ? ` (position ${p.position})` : ""}`,
        source: p.title || p.domain,
        domain: p.domain,
        url: p.url,
      })),
    (b) => {
      if (b.comparative.totalComparisonSurfaces === 0) return `No comparison surfaces found`;
      if (b.comparative.presentOnSurfaces === 0) return `Absent from all ${b.comparative.totalComparisonSurfaces} comparison surfaces`;
      return `Present on ${b.comparative.presentOnSurfaces}/${b.comparative.totalComparisonSurfaces} comparison surfaces`;
    },
  );

  return {
    segmentId,
    winner: winner.brand,
    winnerReason: reason,
    winnerSnippet,
    brandSnippet,
    factors: [authorityEvidence, contextEvidence, comparativeEvidence],
  };
}

function buildFactorEvidence(
  factor: "authority" | "context" | "comparative",
  factorLabel: string,
  brand: BrandSegmentScore,
  compA: BrandSegmentScore,
  compB: BrandSegmentScore,
  getEvidence: (b: BrandSegmentScore) => EvidenceItem[],
  getSummary: (b: BrandSegmentScore) => string,
): FactorEvidence {
  const brandEv = getEvidence(brand).slice(0, 2);
  const compAEv = getEvidence(compA).slice(0, 2);
  const compBEv = getEvidence(compB).slice(0, 2);

  const labelMap: Record<string, StrengthLabel> = {
    authority: brand.authority.label,
    context: brand.context.label,
    comparative: brand.comparative.label,
  };
  const labelMapA: Record<string, StrengthLabel> = {
    authority: compA.authority.label,
    context: compA.context.label,
    comparative: compA.comparative.label,
  };
  const labelMapB: Record<string, StrengthLabel> = {
    authority: compB.authority.label,
    context: compB.context.label,
    comparative: compB.comparative.label,
  };

  let absenceStatement: string | null = null;
  if (labelMap[factor] === "absent" && (labelMapA[factor] !== "absent" || labelMapB[factor] !== "absent")) {
    absenceStatement = `Your brand was not found in any ${factorLabel.toLowerCase()} sources for this segment.`;
  }

  return {
    factor,
    factorLabel,
    brandLabel: labelMap[factor],
    competitorALabel: labelMapA[factor],
    competitorBLabel: labelMapB[factor],
    brandEvidence: brandEv,
    competitorAEvidence: compAEv,
    competitorBEvidence: compBEv,
    absenceStatement,
    summary: getSummary(brand),
  };
}

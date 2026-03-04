import { computeGEOScore, type GEOScore, type RunData } from "./scorer";
import { normalizeName } from "./extractor";

export interface CompetitorListItem {
  name: string;
  appearances: number;
  segments: string[];
}

export interface CompetitorLensResult {
  competitorName: string;
  overall: GEOScore;
  perSegment: Record<string, GEOScore>;
  verbatimQuotes: CompetitorQuote[];
  strongestClusters: { cluster: string; rate: number; appearances: number }[];
}

export interface CompetitorQuote {
  engine: string;
  promptId: string;
  sentence: string;
}

interface FrontendRawRun {
  prompt_id: string;
  prompt_text?: string;
  cluster: string;
  engine: string;
  raw_text: string;
  citations?: any[];
  candidates: { name_raw: string; name_norm: string; rank: number; domain?: string }[];
  brand_found: boolean;
  brand_rank: number | null;
}

export function getAvailableCompetitors(
  segmentRuns: Record<string, FrontendRawRun[]>,
): CompetitorListItem[] {
  const compMap = new Map<string, { name_raw: string; count: number; segments: Set<string> }>();

  for (const [segKey, runs] of Object.entries(segmentRuns)) {
    for (const run of runs) {
      if (!run.candidates || run.candidates.length === 0) continue;

      const competitorCandidates = run.brand_found && run.brand_rank !== null
        ? run.candidates.filter((c) => c.rank !== run.brand_rank)
        : run.candidates;

      for (const cand of competitorCandidates) {
        const norm = cand.name_norm || normalizeName(cand.name_raw);
        const existing = compMap.get(norm);
        if (existing) {
          existing.count++;
          existing.segments.add(segKey);
        } else {
          compMap.set(norm, {
            name_raw: cand.name_raw,
            count: 1,
            segments: new Set([segKey]),
          });
        }
      }
    }
  }

  return [...compMap.entries()]
    .map(([, data]) => ({
      name: data.name_raw,
      appearances: data.count,
      segments: [...data.segments],
    }))
    .sort((a, b) => b.appearances - a.appearances);
}

export function reScoreForCompetitor(
  segmentRuns: Record<string, FrontendRawRun[]>,
  competitorName: string,
): CompetitorLensResult {
  const compNorm = normalizeName(competitorName);

  const allRunData: RunData[] = [];
  const perSegment: Record<string, GEOScore> = {};
  const verbatimQuotes: CompetitorQuote[] = [];

  for (const [segKey, runs] of Object.entries(segmentRuns)) {
    const segRunData: RunData[] = [];

    for (const run of runs) {
      const hasCandidates = run.candidates && run.candidates.length > 0;

      const nonBrandCandidates = hasCandidates && run.brand_found && run.brand_rank !== null
        ? run.candidates.filter((c) => c.rank !== run.brand_rank)
        : (run.candidates || []);

      const compCandidate = nonBrandCandidates.find(
        (c) => (c.name_norm || normalizeName(c.name_raw)) === compNorm ||
               normalizeName(c.name_raw) === compNorm
      );

      const brandMatch = {
        brand_found: !!compCandidate,
        brand_rank: compCandidate?.rank ?? null,
        match_tier: compCandidate ? ("exact" as const) : null,
      };

      const others = nonBrandCandidates
        .filter((c) => {
          const cn = c.name_norm || normalizeName(c.name_raw);
          return cn !== compNorm && normalizeName(c.name_raw) !== compNorm;
        })
        .map((c) => ({
          name_raw: c.name_raw,
          name_norm: c.name_norm || normalizeName(c.name_raw),
          rank: c.rank,
        }));

      if (run.brand_found && run.brand_rank !== null) {
        others.push({
          name_raw: "[Original Brand]",
          name_norm: "[original_brand]",
          rank: run.brand_rank,
        });
      }

      const rd: RunData = {
        prompt_id: run.prompt_id,
        cluster: run.cluster,
        engine: run.engine,
        valid: hasCandidates,
        brand: brandMatch,
        competitors: others,
      };

      segRunData.push(rd);
      allRunData.push(rd);

      if (compCandidate && run.raw_text) {
        const sentences = extractMentionSentences(run.raw_text, competitorName);
        for (const sentence of sentences.slice(0, 3)) {
          verbatimQuotes.push({
            engine: run.engine,
            promptId: run.prompt_id,
            sentence,
          });
        }
      }
    }

    perSegment[segKey] = computeGEOScore(segRunData);
  }

  const overall = computeGEOScore(allRunData);

  const clusterCounts = new Map<string, { appearances: number; total: number }>();
  for (const rd of allRunData) {
    if (!rd.valid) continue;
    const existing = clusterCounts.get(rd.cluster) || { appearances: 0, total: 0 };
    existing.total++;
    if (rd.brand.brand_found) existing.appearances++;
    clusterCounts.set(rd.cluster, existing);
  }

  const strongestClusters = [...clusterCounts.entries()]
    .map(([cluster, counts]) => ({
      cluster,
      rate: counts.total > 0 ? counts.appearances / counts.total : 0,
      appearances: counts.appearances,
    }))
    .sort((a, b) => b.rate - a.rate);

  return {
    competitorName,
    overall,
    perSegment,
    verbatimQuotes: verbatimQuotes.slice(0, 15),
    strongestClusters,
  };
}

function extractMentionSentences(rawText: string, brandName: string): string[] {
  const sentences = rawText
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  const brandLower = brandName.toLowerCase();
  const results: string[] = [];

  for (const sentence of sentences) {
    if (sentence.toLowerCase().includes(brandLower)) {
      const clean = sentence.replace(/\*\*/g, "").replace(/#{1,3}\s*/g, "").trim();
      if (clean.length > 15 && clean.length < 500) {
        results.push(clean);
      }
    }
  }

  return results;
}

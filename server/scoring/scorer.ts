import type { MatchResult, CompetitorEntry } from "./matcher";

export interface RunData {
  prompt_id: string;
  cluster: string;
  engine: string;
  valid: boolean;
  brand: MatchResult;
  competitors: CompetitorEntry[];
}

export interface ClusterBreakdown {
  appearance_rate: number;
  primary_rate: number;
  valid_runs: number;
}

export interface CompetitorScore {
  name: string;
  share: number;
  appearances: number;
}

export interface GEOScore {
  valid_runs: number;
  total_runs: number;
  invalid_runs: number;
  appearance_rate: number;
  primary_rate: number;
  avg_rank: number | null;
  competitors: CompetitorScore[];
  cluster_breakdown: Record<string, ClusterBreakdown>;
  engine_breakdown: Record<string, { appearance_rate: number; primary_rate: number; valid_runs: number; total_runs: number; error_runs: number }>;
}

export function computeGEOScore(runs: RunData[]): GEOScore {
  const validRuns = runs.filter((r) => r.valid);
  const V = validRuns.length;
  const totalRuns = runs.length;
  const invalidRuns = totalRuns - V;

  if (V === 0) {
    const ebZero: Record<string, { appearance_rate: number; primary_rate: number; valid_runs: number; total_runs: number; error_runs: number }> = {};
    const allGroups = groupBy(runs, (r) => r.engine);
    for (const [engine, engineRuns] of Object.entries(allGroups)) {
      ebZero[engine] = { appearance_rate: 0, primary_rate: 0, valid_runs: 0, total_runs: engineRuns.length, error_runs: engineRuns.length };
    }
    return {
      valid_runs: 0,
      total_runs: totalRuns,
      invalid_runs: invalidRuns,
      appearance_rate: 0,
      primary_rate: 0,
      avg_rank: null,
      competitors: [],
      cluster_breakdown: {},
      engine_breakdown: ebZero,
    };
  }

  const A = validRuns.filter((r) => r.brand.brand_found).length;
  const T = validRuns.filter(
    (r) => r.brand.brand_found && r.brand.brand_rank !== null && r.brand.brand_rank <= 3,
  ).length;

  const ranksWhenFound = validRuns
    .filter((r) => r.brand.brand_found && r.brand.brand_rank !== null)
    .map((r) => r.brand.brand_rank!);

  const avgRank =
    ranksWhenFound.length > 0
      ? ranksWhenFound.reduce((sum, r) => sum + r, 0) / ranksWhenFound.length
      : null;

  const competitorFreq = new Map<string, { name_raw: string; count: number }>();
  for (const run of validRuns) {
    const seenInRun = new Set<string>();
    for (const comp of run.competitors) {
      const existing = competitorFreq.get(comp.name_norm);
      if (seenInRun.has(comp.name_norm)) continue;
      seenInRun.add(comp.name_norm);
      if (existing) {
        existing.count++;
      } else {
        competitorFreq.set(comp.name_norm, { name_raw: comp.name_raw, count: 1 });
      }
    }
  }

  const mergedFreq = deduplicateCompetitors(competitorFreq);

  const competitors: CompetitorScore[] = [...mergedFreq.entries()]
    .map(([norm, data]) => ({
      name: data.name_raw,
      share: data.count / V,
      appearances: data.count,
    }))
    .sort((a, b) => b.share - a.share)
    .slice(0, 10);

  const clusterBreakdown: Record<string, ClusterBreakdown> = {};
  const clusterGroups = groupBy(validRuns, (r) => r.cluster);
  for (const [cluster, clusterRuns] of Object.entries(clusterGroups)) {
    const cv = clusterRuns.length;
    const ca = clusterRuns.filter((r) => r.brand.brand_found).length;
    const ct = clusterRuns.filter(
      (r) => r.brand.brand_found && r.brand.brand_rank !== null && r.brand.brand_rank <= 3,
    ).length;
    clusterBreakdown[cluster] = {
      appearance_rate: cv > 0 ? ca / cv : 0,
      primary_rate: cv > 0 ? ct / cv : 0,
      valid_runs: cv,
    };
  }

  const engineBreakdown: Record<string, { appearance_rate: number; primary_rate: number; valid_runs: number; total_runs: number; error_runs: number }> = {};
  const allEngineGroups = groupBy(runs, (r) => r.engine);
  for (const [engine, allEngineRuns] of Object.entries(allEngineGroups)) {
    const engineValid = allEngineRuns.filter((r) => r.valid);
    const ev = engineValid.length;
    const ea = engineValid.filter((r) => r.brand.brand_found).length;
    const et = engineValid.filter(
      (r) => r.brand.brand_found && r.brand.brand_rank !== null && r.brand.brand_rank <= 3,
    ).length;
    engineBreakdown[engine] = {
      appearance_rate: ev > 0 ? ea / ev : 0,
      primary_rate: ev > 0 ? et / ev : 0,
      valid_runs: ev,
      total_runs: allEngineRuns.length,
      error_runs: allEngineRuns.length - ev,
    };
  }

  return {
    valid_runs: V,
    total_runs: totalRuns,
    invalid_runs: invalidRuns,
    appearance_rate: A / V,
    primary_rate: T / V,
    avg_rank: avgRank ? Math.round(avgRank * 10) / 10 : null,
    competitors,
    cluster_breakdown: clusterBreakdown,
    engine_breakdown: engineBreakdown,
  };
}

function shouldMergeNames(normA: string, normB: string): boolean {
  if (normA === normB) return true;
  const tokensA = normA.split(/\s+/);
  const tokensB = normB.split(/\s+/);
  if (tokensA.every(t => tokensB.includes(t))) return true;
  if (tokensB.every(t => tokensA.includes(t))) return true;
  if (normA.length >= 4) {
    const re = new RegExp(`\\b${normA.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (re.test(normB)) return true;
  }
  if (normB.length >= 4) {
    const re = new RegExp(`\\b${normB.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (re.test(normA)) return true;
  }
  return false;
}

function deduplicateCompetitors(
  freq: Map<string, { name_raw: string; count: number }>
): Map<string, { name_raw: string; count: number }> {
  const entries = [...freq.entries()].sort((a, b) => b[1].count - a[1].count);
  const merged = new Map<string, { name_raw: string; count: number }>();
  const consumed = new Set<string>();

  for (const [normA, dataA] of entries) {
    if (consumed.has(normA)) continue;

    let mergedCount = dataA.count;
    let bestName = dataA.name_raw;
    let bestNorm = normA;

    for (const [normB, dataB] of entries) {
      if (normB === normA || consumed.has(normB)) continue;
      if (shouldMergeNames(normA, normB)) {
        mergedCount += dataB.count;
        consumed.add(normB);
        if (normB.length < bestNorm.length) {
          bestName = dataB.name_raw;
          bestNorm = normB;
        }
      }
    }

    consumed.add(normA);
    merged.set(bestNorm, { name_raw: bestName, count: mergedCount });
  }

  return merged;
}

function groupBy<T>(items: T[], key: (item: T) => string): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const item of items) {
    const k = key(item);
    if (!groups[k]) groups[k] = [];
    groups[k].push(item);
  }
  return groups;
}

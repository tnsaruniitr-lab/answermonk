// Accepts raw pool.query rows (snake_case) from runner.ts
export interface RawQueryRow {
  engine: string;
  query_index: number;
  identity_match: string | null;
  cited_urls: string[] | null;
  name_landscape: any[] | null;
  target_rank: number | null;
  target_found: boolean;
  stated_facts: any[] | null;
}

export interface EngineAppearanceStat {
  appearanceRate: number;  // 0–100
  totalQueries: number;
  foundCount: number;
  avgRank: number | null;  // null when foundCount === 0
}

export interface PeopleScoreResult {
  recognitionScore: number;
  recognitionGrade: string;
  proofScore: number;
  proofGrade: string;
  diagnosticText: string;
  perEngineAppearance: Record<string, EngineAppearanceStat>;
}

const ENGINES = ["chatgpt", "gemini", "claude"];

const ENGINE_WEIGHTS: Record<string, number> = {
  chatgpt: 0.40,
  gemini: 0.40,
  claude: 0.20,
};

function getGrade(score: number): string {
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 45) return "C";
  if (score >= 25) return "D";
  return "F";
}

function rankToScore(rank: number | null | undefined, totalFound: number): number {
  if (!rank || rank < 1) return 0;
  if (rank === 1) return 100;
  if (rank === 2) return 82;
  if (rank === 3) return 67;
  if (rank === 4) return 52;
  if (rank === 5) return 38;
  return Math.max(10, 38 - (rank - 5) * 4);
}

export function calculatePerEngineAppearance(trackBResults: RawQueryRow[]): Record<string, EngineAppearanceStat> {
  // Appearance rate = how many landscape runs (qi=2) did the target person appear in,
  // detected by anchor-keyword matching against each extracted list entry (target_rank set
  // in runner.ts). This is honest — "did AI include this person in its top-10 list?"
  const landscapeRows = trackBResults.filter(r => r.query_index === 2);
  const result: Record<string, EngineAppearanceStat> = {};
  for (const engine of ENGINES) {
    const rows = landscapeRows.filter(r => r.engine === engine);
    const found = rows.filter(r => r.target_rank != null && r.target_rank > 0);
    const ranks = found
      .map(r => r.target_rank)
      .filter((v): v is number => v != null && v > 0);
    result[engine] = {
      appearanceRate: rows.length > 0 ? Math.round((found.length / rows.length) * 100) : 0,
      totalQueries: rows.length,
      foundCount: found.length,
      avgRank: ranks.length > 0 ? Math.round(ranks.reduce((a, b) => a + b, 0) / ranks.length) : null,
    };
  }
  return result;
}

export function calculateRecognitionScore(trackBResults: RawQueryRow[]): number {
  if (trackBResults.length === 0) return 0;

  const defaultResults = trackBResults.filter(r => r.query_index === 1);
  const landscapeResults = trackBResults.filter(r => r.query_index === 2);

  let defaultScore = 0;
  for (const r of defaultResults) {
    const w = ENGINE_WEIGHTS[r.engine] ?? 0.33;
    const isConfirmed = r.identity_match === "confirmed";
    const isPartial = r.identity_match === "partial";
    defaultScore += w * (isConfirmed ? 100 : isPartial ? 40 : 0);
  }
  if (defaultResults.length > 0) {
    defaultScore = defaultScore / defaultResults.reduce((sum, r) => sum + (ENGINE_WEIGHTS[r.engine] ?? 0.33), 0);
  }

  let rankScore = 0;
  let rankCount = 0;
  for (const r of landscapeResults) {
    const w = ENGINE_WEIGHTS[r.engine] ?? 0.33;
    const landscape = (r.name_landscape as any[]) ?? [];
    const score = rankToScore(r.target_rank ?? null, landscape.length);
    rankScore += w * score;
    rankCount += w;
  }
  if (rankCount > 0) rankScore = rankScore / rankCount;

  const foundCount = trackBResults.filter(r => r.target_found).length;
  const presenceScore = trackBResults.length > 0 ? (foundCount / trackBResults.length) * 100 : 0;

  const recognition = Math.round(defaultScore * 0.45 + rankScore * 0.35 + presenceScore * 0.20);
  return Math.min(100, Math.max(0, recognition));
}

export function calculateProofScore(trackAResults: RawQueryRow[]): number {
  if (trackAResults.length === 0) return 0;

  const totalWeight = trackAResults.reduce((s, r) => s + (ENGINE_WEIGHTS[r.engine] ?? 0.33), 0);

  let identityRateScore = 0;
  for (const r of trackAResults) {
    const w = ENGINE_WEIGHTS[r.engine] ?? 0.33;
    const pts = r.identity_match === "confirmed" ? 100 : r.identity_match === "partial" ? 40 : 0;
    identityRateScore += (w / totalWeight) * pts;
  }

  const allCitedUrls = trackAResults.flatMap(r => (r.cited_urls as string[]) ?? []);
  const uniqueDomains = new Set(allCitedUrls.map(u => {
    try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; }
  }));
  const diversityScore = Math.min(100, uniqueDomains.size * 20);

  const consistentFacts = trackAResults.filter(r =>
    r.identity_match === "confirmed" || r.identity_match === "partial"
  ).length;
  const consistencyScore = trackAResults.length > 0
    ? (consistentFacts / trackAResults.length) * 100
    : 0;

  const hasCitations = allCitedUrls.length > 0;
  const coverageScore = hasCitations ? Math.min(100, allCitedUrls.length * 15) : 10;

  const proof = Math.round(
    identityRateScore * 0.35 +
    diversityScore * 0.25 +
    consistencyScore * 0.25 +
    coverageScore * 0.15
  );
  return Math.min(100, Math.max(0, proof));
}

export function buildDiagnosticText(recognitionScore: number, proofScore: number): string {
  const recGrade = getGrade(recognitionScore);
  const proofGrade = getGrade(proofScore);

  if (recGrade === "A" && proofGrade === "A") {
    return "AI recognises you prominently by name alone and backs it with strong, accurate sources. You have a well-established AI identity.";
  }
  if (recGrade === "A" && (proofGrade === "B" || proofGrade === "C")) {
    return "AI surfaces you readily by name but your source backing is thin. Recognition is strong — now strengthen the web evidence that supports it.";
  }
  if ((recGrade === "B" || recGrade === "C") && (proofGrade === "A" || proofGrade === "B")) {
    return "AI describes you accurately when given context but you don't surface prominently by name alone. Your problem is discovery, not reputation — increase your web authority footprint.";
  }
  if (recGrade === "D" || recGrade === "F") {
    if (proofScore > 40) {
      return "AI barely finds you unprompted but describes you correctly when given context. You need press mentions, Wikipedia presence, and broader web authority to surface by name alone.";
    }
    return "AI has little to no knowledge of you. Building your AI identity requires authoritative web presence — Wikipedia, press coverage, and high-authority directory listings.";
  }
  if (proofGrade === "D" || proofGrade === "F") {
    return "AI is aware of your name but the knowledge is poorly sourced and inconsistent. Focus on creating and claiming high-authority profiles that AI engines can reliably cite.";
  }
  return "Your AI identity is developing. Focus on building consistent, authoritative web presence across press, directories, and professional profiles.";
}

export function buildScores(
  trackAResults: RawQueryRow[],
  trackBResults: RawQueryRow[]
): PeopleScoreResult {
  const recognitionScore = calculateRecognitionScore(trackBResults);
  const proofScore = calculateProofScore(trackAResults);
  const recognitionGrade = getGrade(recognitionScore);
  const proofGrade = getGrade(proofScore);
  const diagnosticText = buildDiagnosticText(recognitionScore, proofScore);
  const perEngineAppearance = calculatePerEngineAppearance(trackBResults);

  return { recognitionScore, recognitionGrade, proofScore, proofGrade, diagnosticText, perEngineAppearance };
}

/**
 * Evidence scoring + quality gate for the GEO Directory.
 *
 * Scoring table (from plan: docs/geo-directory-plan.md):
 *   Citation frequency data present          +2
 *   Named authority-source present           +2
 *   Brand appears across 3+ distinct prompts +2
 *   Structured entity signals                +1
 *
 * Publishing threshold: evidence_score >= 3 AND brand_count >= 3
 *
 * Manual overrides sit on top:
 *   force-publish  → publish even if gate fails (requires logged reason)
 *   force-block    → block even if gate passes  (persists permanently)
 */

/** Authority domains that count as +2 evidence signal */
const AUTHORITY_DOMAINS = new Set([
  "dha.gov.ae", "haad.ae", "moh.gov.ae", "mohap.gov.ae",
  "g2.com", "capterra.com", "trustpilot.com", "trustradius.com",
  "reddit.com", "quora.com",
  "abudhabi.ae", "dubai.ae",
  "forbes.com", "bloomberg.com", "techcrunch.com",
  "healthgrades.com", "zocdoc.com",
]);

export interface ScoredSegment {
  scoringResult?: {
    raw_runs?: Array<{
      appeared?: boolean;
      citations?: Array<{ url?: string; domain?: string }>;
    }>;
    score?: {
      appearance_rate?: number;
      competitors?: Array<{ name: string; share?: number }>;
      engine_breakdown?: Record<string, unknown>;
    };
  };
}

export interface EvidenceBreakdown {
  citationFrequency: boolean;   // +2
  authoritySource: boolean;     // +2
  repeatedAppearance: boolean;  // +2
  entitySignals: boolean;       // +1
  evidenceScore: number;
  brandCount: number;
  passesGate: boolean;
}

/** Extract the hostname from a citation URL or domain field. */
function extractDomain(citation: { url?: string; domain?: string }): string {
  const raw = citation.domain || citation.url || "";
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return raw.replace(/^www\./, "").split("/")[0];
  }
}

/**
 * Compute the numeric evidence score for a segment.
 * Returns a full breakdown so the gate decision is auditable.
 */
export function computeEvidenceScore(seg: ScoredSegment): EvidenceBreakdown {
  const sr      = seg.scoringResult ?? {};
  const score   = sr.score ?? {};
  const rawRuns = sr.raw_runs ?? [];

  // ── Signal 1: Citation frequency (+2) ────────────────────────────
  // At least one prompt run returned citations.
  const citationFrequency = rawRuns.some(
    (r) => Array.isArray(r.citations) && r.citations.length > 0,
  );

  // ── Signal 2: Named authority source (+2) ────────────────────────
  // Any citation domain matches the authority list.
  const allCitationDomains = rawRuns.flatMap((r) =>
    (r.citations ?? []).map(extractDomain),
  );
  const authoritySource = allCitationDomains.some((d) => AUTHORITY_DOMAINS.has(d));

  // ── Signal 3: Repeated appearance across 3+ prompts (+2) ─────────
  // Brand appeared in at least 3 of the prompt runs.
  const appearedRuns = rawRuns.filter((r) => r.appeared === true).length;
  const repeatedAppearance = appearedRuns >= 3
    || (score.appearance_rate ?? 0) >= 0.15;   // ≥15% of prompts

  // ── Signal 4: Structured entity signals (+1) ─────────────────────
  // Scoring produced a competitor list and per-engine breakdown.
  const entitySignals =
    Array.isArray(score.competitors) &&
    score.competitors.length >= 2 &&
    !!score.engine_breakdown;

  const evidenceScore =
    (citationFrequency  ? 2 : 0) +
    (authoritySource    ? 2 : 0) +
    (repeatedAppearance ? 2 : 0) +
    (entitySignals      ? 1 : 0);

  const brandCount = Array.isArray(score.competitors)
    ? score.competitors.length
    : 0;

  const passesGate = evidenceScore >= 3 && brandCount >= 3;

  return {
    citationFrequency,
    authoritySource,
    repeatedAppearance,
    entitySignals,
    evidenceScore,
    brandCount,
    passesGate,
  };
}

/** Publishing threshold constants — exported for use in override logic. */
export const MIN_EVIDENCE_SCORE = 3;
export const MIN_BRAND_COUNT    = 3;

/**
 * Determine the initial publish_status for a segment.
 *
 * Automatic path:
 *   passes gate  → "draft"   (ready for review / publish trigger)
 *   fails gate   → "draft"   (still draft, will not be published automatically)
 *
 * Override path (applied after this function):
 *   force-publish → "published"  (requires logged reason)
 *   force-block   → "blocked"    (permanent — survives re-scoring)
 */
export function derivePublishStatus(breakdown: EvidenceBreakdown): "draft" {
  // All segments start as draft. The quality gate result is stored
  // in evidence_score and brand_count so that the publish pipeline
  // can filter: WHERE evidence_score >= 3 AND brand_count >= 3
  // and only push those to published.
  return "draft";
}

/**
 * Apply a force-publish override.
 * Caller must supply a non-empty reason — enforced here.
 */
export function forcePublish(
  _slug: string,
  reason: string,
): { status: "published"; reason: string } {
  if (!reason || reason.trim().length < 3) {
    throw new Error("force-publish requires a non-empty reason (min 3 chars)");
  }
  return { status: "published", reason: reason.trim() };
}

/**
 * Apply a force-block override.
 * Once blocked, status persists even if the segment is re-scored.
 */
export function forceBlock(_slug: string): { status: "blocked" } {
  return { status: "blocked" };
}

/**
 * sessionToDirectory.ts
 *
 * Maps completed multi-segment analysis sessions into the GEO directory.
 * Called automatically when a session finishes scoring AND when backfilling.
 *
 * Mapping rules:
 *  - segment.persona / serviceType / seedType / customerType → service key
 *  - segment.location → location
 *  - segment.scoringResult.score.competitors → ranking_snapshot brands
 *  - segment.scoringResult.score.valid_runs  → evidence_score
 *  - citationReport page domains             → authority_sources
 *
 * Minimum quality gate: MIN_COMPETITORS brands AND MIN_VALID_RUNS runs.
 * Pages are auto-published immediately when the gate is cleared.
 */

import { storage } from "../storage";
import { normaliseSegment } from "./normalise";
import { db } from "../db";
import { multiSegmentSessions } from "../../shared/schema";
import { desc, isNotNull } from "drizzle-orm";

const MIN_COMPETITORS = 3;
const MIN_VALID_RUNS  = 5;

// ── Vertical classifier ────────────────────────────────────────────────────
// Maps a raw persona string to one of five industry verticals.
// Matching is keyword-based (lowercase), so it stays in sync as personas evolve.
const HEALTHCARE_KEYWORDS = [
  "health", "doctor", "nurse", "blood test", "iv drip", "physiother",
  "medical", "clinic", "newborn", "weight loss", "dental", "pharmacy",
  "care provider", "home care", "hospital",
];
const VC_KEYWORDS = [
  "seed fund", "series a", "series b", "series c", "venture capital",
  "early stage capital", "vc fund", "angel invest", "startup fund",
  "series invest", "pre-seed",
];
const MARKETING_KEYWORDS = [
  "marketing agency", "seo agency", "pr agency", "branding agency",
  "content marketing", "social media", "web design", "web development",
  "digital marketing", "performance marketing",
];

export function deriveVertical(persona: string): string {
  const p = persona.toLowerCase();
  if (HEALTHCARE_KEYWORDS.some((kw) => p.includes(kw))) return "healthcare";
  if (VC_KEYWORDS.some((kw) => p.includes(kw)))          return "venture-capital";
  if (MARKETING_KEYWORDS.some((kw) => p.includes(kw)))   return "marketing";
  // Everything else (expense management, collections, corporate cards, etc.)
  return "b2b-saas";
}

interface SegmentCompetitor {
  name:        string;
  share:       number;
  appearances: number;
}

interface RawSegment {
  serviceType?:  string;
  seedType?:     string;
  persona?:      string;
  customerType?: string;
  location?:     string;
  scoringResult?: {
    score?: {
      competitors?:      SegmentCompetitor[];
      valid_runs?:       number;
      engine_breakdown?: Record<string, unknown>;
    };
  };
}

interface Snippet { pageDomain?: string; }
interface CitationSegment {
  scores?: { context?: { genericSnippets?: Snippet[] } };
}
interface CitationReport {
  segments?: CitationSegment[];
}

export interface SyncResult {
  sessionId: number;
  published: number;
  skipped:   number;
  errors:    string[];
}

/** Extract authority source domains from the citation report for a segment. */
function authorityDomainsFromCitation(
  citationReport: CitationReport | null | undefined,
  segIdx: number,
): string[] {
  const snippets =
    citationReport?.segments?.[segIdx]?.scores?.context?.genericSnippets ?? [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of snippets) {
    if (s.pageDomain && !seen.has(s.pageDomain)) {
      seen.add(s.pageDomain);
      out.push(s.pageDomain);
      if (out.length >= 8) break;
    }
  }
  return out;
}

/**
 * Sync a single completed session into the directory.
 * Safe to call multiple times — the upsert is idempotent.
 */
export async function syncSessionToDirectory(
  sessionId: number,
): Promise<SyncResult> {
  const result: SyncResult = { sessionId, published: 0, skipped: 0, errors: [] };

  let session: Awaited<ReturnType<typeof storage.getMultiSegmentSession>>;
  try {
    session = await storage.getMultiSegmentSession(sessionId);
  } catch (e) {
    result.errors.push(`Failed to fetch session ${sessionId}: ${String(e)}`);
    return result;
  }

  if (!session) {
    result.errors.push(`Session ${sessionId} not found`);
    return result;
  }

  const segments: RawSegment[]    = Array.isArray(session.segments) ? (session.segments as RawSegment[]) : [];
  const citationReport             = (session.citationReport ?? null) as CitationReport | null;

  for (let i = 0; i < segments.length; i++) {
    const seg         = segments[i];
    const score       = seg.scoringResult?.score;
    const competitors = score?.competitors ?? [];
    const validRuns   = score?.valid_runs ?? 0;

    if (competitors.length < MIN_COMPETITORS || validRuns < MIN_VALID_RUNS) {
      result.skipped++;
      continue;
    }

    // Resolve service key — prefer serviceType, skip blank seedType sentinels
    const rawSeedType = seg.seedType && seg.seedType !== "__blank__" ? seg.seedType : undefined;
    const normalisedSeg = normaliseSegment({
      serviceType:  seg.serviceType  || undefined,
      seedType:     rawSeedType,
      persona:      seg.persona      || undefined,
      customerType: seg.customerType || undefined,
      location:     seg.location     || undefined,
    });

    // Derive industry vertical — prefer persona unless it is an internal marker like "pnc"
    const INTERNAL_PERSONA_MARKERS = new Set(["pnc", "pnc_v2", "competitor", "landing_guided", "__blank__"]);
    const rawPersona = (seg.persona || "").trim();
    const personaForVertical = (!rawPersona || INTERNAL_PERSONA_MARKERS.has(rawPersona.toLowerCase()))
      ? (seg.serviceType || normalisedSeg.rawQuery || seg.seedType || "")
      : rawPersona;
    const vertical = deriveVertical(personaForVertical);

    if (!normalisedSeg.canonicalSlug) {
      result.skipped++;
      continue;
    }

    // Build ranking snapshot — no domain available from scoring, falls back to hash slug on brand pages
    const brands = competitors.map((c) => ({
      name:            c.name,
      domain:          null as string | null,
      appearance_rate: Math.round(c.share * 100) / 100,
    }));

    const rankingSnapshot = {
      brands,
      authority_sources: authorityDomainsFromCitation(citationReport, i),
    };

    // Engine set from breakdown keys, or fall back to standard three
    const engineSet = Object.keys(score?.engine_breakdown ?? {});
    const engines   = engineSet.length > 0 ? engineSet : ["chatgpt", "claude", "gemini"];

    const today = new Date().toISOString().slice(0, 10);

    try {
      await storage.upsertDirectoryPage({
        sessionId:        sessionId,
        segmentIndex:     i,
        rawQuery:         normalisedSeg.rawQuery,
        canonicalQuery:   normalisedSeg.canonicalQuery,
        canonicalSlug:    normalisedSeg.canonicalSlug,
        canonicalLocation: normalisedSeg.canonicalLocation,
        clusterId:        normalisedSeg.clusterId,
        vertical,
        publishStatus:    "published",
        dataVersion:      today,
        engineSet:        engines,
        evidenceScore:    validRuns,
        brandCount:       brands.length,
        rankingSnapshot,
        firstPublishedAt: new Date(),
        dedupeParentId:   null,
      });
      result.published++;
      console.log(
        `[dir-sync] Published: ${normalisedSeg.canonicalSlug} (session ${sessionId}, seg ${i})`,
      );
    } catch (e) {
      result.errors.push(`Upsert failed for ${normalisedSeg.canonicalSlug}: ${String(e)}`);
    }
  }

  return result;
}

/**
 * Backfill the last N completed sessions (those with at least one scored segment).
 * Returns per-session results.
 */
export async function backfillRecentSessions(
  limit = 10,
): Promise<SyncResult[]> {
  const sessions = await db
    .select({ id: multiSegmentSessions.id })
    .from(multiSegmentSessions)
    .where(isNotNull(multiSegmentSessions.segments))
    .orderBy(desc(multiSegmentSessions.id))
    .limit(limit * 3); // fetch 3× to account for sessions without scoring data

  const results: SyncResult[] = [];
  let done = 0;

  for (const { id } of sessions) {
    if (done >= limit) break;
    const r = await syncSessionToDirectory(id);
    if (r.published > 0 || r.errors.length > 0) done++;
    results.push(r);
  }

  return results;
}

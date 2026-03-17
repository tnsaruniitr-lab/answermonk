/**
 * Normalisation engine for the GEO Directory.
 *
 * Rules (from plan: docs/geo-directory-plan.md):
 *  - Strip filler words: best, top, in, providers, services, companies, the, and, for, a, an
 *  - Normalise order: {serviceType} {location}
 *  - canonical_slug  = "best-{service}-{location}" (hyphens)
 *  - cluster_id      = "{service}_{location}"       (underscores, no "best" prefix)
 *  - canonical_slug is IMMUTABLE once publish_status = published
 *  - Authority domains: strip paths + www. before storage
 */

const FILLER_WORDS = new Set([
  "best", "top", "in", "providers", "services", "companies",
  "the", "and", "for", "a", "an", "of", "with",
]);

/** Lowercase, strip punctuation, remove filler words, collapse whitespace. */
function normaliseText(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !FILLER_WORDS.has(w))
    .join(" ")
    .trim();
}

/** Convert a normalised string to a URL slug (hyphens). */
function toSlug(normalised: string): string {
  return normalised.replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

/** Convert a normalised string to a cluster key (underscores). */
function toClusterKey(normalised: string): string {
  return normalised.replace(/\s+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

export interface SegmentInput {
  /**
   * The verbatim user-typed query, stored in raw_query without modification.
   * If omitted, a synthetic "best {service} in {location}" is used as a fallback.
   * Callers should always pass the original input here for audit trail accuracy.
   */
  rawInput?: string;
  serviceType?: string;
  seedType?: string;
  persona?: string;
  customerType?: string;
  location?: string;
}

export interface NormalisedSegment {
  rawQuery: string;
  canonicalQuery: string;
  canonicalSlug: string;
  canonicalLocation: string | null;
  clusterId: string | null;
}

/**
 * Derive all normalisation fields from a segment object.
 *
 * Service segment  → /best-{service}-{location}
 * Customer segment → /best-{persona}-{location}
 */
export function normaliseSegment(seg: SegmentInput): NormalisedSegment {
  const rawService = (
    seg.serviceType || seg.seedType || seg.persona || seg.customerType || ""
  ).trim();
  const rawLocation = (seg.location || "").trim();

  // Use verbatim caller-provided input if present; otherwise synthesise a fallback.
  const rawQuery = seg.rawInput?.trim()
    ?? (rawLocation ? `best ${rawService} in ${rawLocation}` : `best ${rawService}`);

  const normService  = normaliseText(rawService);
  const normLocation = normaliseText(rawLocation);

  const canonicalQuery    = [normService, normLocation].filter(Boolean).join(" ");
  const canonicalSlug     = ["best", toSlug(normService), toSlug(normLocation)].filter(Boolean).join("-");
  const canonicalLocation = normLocation || null;
  const clusterId         = [toClusterKey(normService), toClusterKey(normLocation)].filter(Boolean).join("_") || null;

  return { rawQuery, canonicalQuery, canonicalSlug, canonicalLocation, clusterId };
}

/**
 * Strip paths and www. from authority source URLs so they are
 * stored in a clean, consistent format.
 *
 * Examples:
 *   reddit.com/r/dubai  → reddit.com
 *   www.g2.com          → g2.com
 *   dha.gov.ae/en       → dha.gov.ae
 */
export function normaliseAuthoritySource(raw: string): string {
  try {
    const withProtocol = raw.startsWith("http") ? raw : `https://${raw}`;
    const hostname = new URL(withProtocol).hostname;
    return hostname.replace(/^www\./, "");
  } catch {
    return raw
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      .split("?")[0]
      .trim();
  }
}

/**
 * Normalise an array of authority sources, deduplicate, and sort.
 */
export function normaliseAuthoritySources(sources: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const s of sources) {
    const norm = normaliseAuthoritySource(s);
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      result.push(norm);
    }
  }
  return result.sort();
}

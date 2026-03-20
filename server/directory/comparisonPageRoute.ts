/**
 * Step 11 — Comparison page route.
 *
 * URL: /compare/{brand1-slug}-vs-{brand2-slug}-{location}
 * Example: /compare/valeo-health-vs-nightingale-home-healthcare-dubai
 *
 * Gate rules (from plan):
 *   - co-occurrence ≥ 3 (both brands in same published page) AND
 *   - evidence difference ≥ 1% (|avg_rate_brand1 - avg_rate_brand2| ≥ 0.01)
 *   → HTTP 404 if either gate fails
 *   → HTTP 200 with comparison page if both pass
 *
 * URL parsing:
 *   Split on "-vs-" → brand1part and "{brand2}-{location}"
 *   Location = last hyphen-segment of part2; brand2 = rest of part2
 *
 * Sections:
 *   1. H1 with both brand names + location
 *   2. Co-occurrence badge
 *   3. Comparison paragraph (data-driven, 2 sentences)
 *   4. Side-by-side metric cards
 *   5. Per-query evidence differences
 *   6. Shared query page links
 *   7. JSON-LD WebPage + BreadcrumbList
 */

import type { Express, Request, Response } from "express";
import { db } from "../db";
import { directoryPages } from "@shared/schema";
import { and, eq } from "drizzle-orm";

const CO_OCCURRENCE_THRESHOLD = 3;
const EVIDENCE_DIFF_THRESHOLD  = 0.01; // 1 percentage point

// ─── Types ────────────────────────────────────────────────────────

interface BrandEntry {
  name: string;
  domain?: string;
  appearance_rate?: number;
  evidence?: string[];
}

interface RankingSnapshot {
  brands?: BrandEntry[];
  authority_sources?: string[];
}

interface SharedPage {
  slug: string;
  location: string;
  canonicalLocation: string | null;
  clusterId: string | null;
  rate1: number;
  rate2: number;
  evidenceDiff: number; // rate1 - rate2
  evidence1: string[];
  evidence2: string[];
  authoritySources: string[];
}

interface ComparisonData {
  brand1Slug: string;
  brand2Slug: string;
  brand1Name: string;
  brand2Name: string;
  brand1Domain: string | null;
  brand2Domain: string | null;
  location: string;
  sharedPages: SharedPage[];
  avgRate1: number;
  avgRate2: number;
  peakRate1: number;
  peakRate2: number;
  pagesLeading1: number;
  pagesLeading2: number;
  tied: number;
}

// ─── Helpers ──────────────────────────────────────────────────────

/** Deterministic 4-char base-36 hash — used as name-slug suffix when no domain is available. */
function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) >>> 0;
  }
  return h.toString(36).slice(0, 4).padStart(4, "0");
}

/**
 * Prefer domain-based brand slugs (globally unique entity identifier).
 * Fall back to name slug + deterministic hash suffix to prevent collisions.
 */
function brandToSlug(name: string, domain?: string | null): string {
  if (domain) {
    return domain
      .replace(/^www\./, "")
      .replace(/\./g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .toLowerCase();
  }
  const nameSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${nameSlug}-${simpleHash(name)}`;
}

function slugToBrandTitle(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function toTitleCase(s: string): string {
  return s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function canonicalBase(req: Request): string {
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
  const host  = (req.headers["x-forwarded-host"] as string) || (req.headers.host as string) || "";
  return `${proto}://${host}`;
}

/**
 * Derive H1 from stored DB fields — never parse the slug.
 * Works correctly for multi-word locations like "abu dhabi".
 */
function h1FromDb(canonicalLocation: string | null, clusterId: string | null): string {
  if (!canonicalLocation || !clusterId) return "AI Search Rankings";
  const locKey     = canonicalLocation.replace(/\s+/g, "_");
  const serviceKey = clusterId.endsWith(`_${locKey}`)
    ? clusterId.slice(0, -(locKey.length + 1))
    : clusterId;
  const service = serviceKey.replace(/_/g, " ");
  return `Best ${toTitleCase(service)} in ${toTitleCase(canonicalLocation)}`;
}

// ─── URL parsing ──────────────────────────────────────────────────

interface ParsedComparison {
  brand1Slug: string;
  brand2Slug: string;
  location: string;
}

function parseComparisonSlug(slug: string): ParsedComparison | null {
  // Split on first occurrence of -vs-
  const vsIdx = slug.indexOf("-vs-");
  if (vsIdx === -1) return null;

  const brand1Slug = slug.slice(0, vsIdx);
  const rest       = slug.slice(vsIdx + 4); // after "-vs-"

  // Location = last hyphen-separated token; brand2 = everything before last token
  const tokens = rest.split("-");
  if (tokens.length < 2) return null;

  const location  = tokens[tokens.length - 1];
  const brand2Slug = tokens.slice(0, -1).join("-");

  if (!brand1Slug || !brand2Slug || !location) return null;
  return { brand1Slug, brand2Slug, location };
}

// ─── Data aggregation ─────────────────────────────────────────────

async function buildComparisonData(
  brand1Slug: string,
  brand2Slug: string,
  location: string,
): Promise<ComparisonData | null> {
  const pages = await db
    .select({
      canonicalSlug:     directoryPages.canonicalSlug,
      canonicalLocation: directoryPages.canonicalLocation,
      clusterId:         directoryPages.clusterId,
      rankingSnapshot:   directoryPages.rankingSnapshot,
    })
    .from(directoryPages)
    .where(
      and(
        eq(directoryPages.publishStatus, "published"),
        eq(directoryPages.canonicalLocation, location),
      ),
    );

  const sharedPages: SharedPage[] = [];
  let brand1Name: string | null  = null;
  let brand1Domain: string | null = null;
  let brand2Name: string | null  = null;
  let brand2Domain: string | null = null;

  for (const page of pages) {
    const snap = page.rankingSnapshot as RankingSnapshot | null;
    if (!snap?.brands) continue;

    const b1 = snap.brands.find((b) => brandToSlug(b.name, b.domain) === brand1Slug);
    const b2 = snap.brands.find((b) => brandToSlug(b.name, b.domain) === brand2Slug);

    if (!b1 || !b2) continue;

    // Capture canonical names
    if (!brand1Name) { brand1Name = b1.name; brand1Domain = b1.domain ?? null; }
    if (!brand2Name) { brand2Name = b2.name; brand2Domain = b2.domain ?? null; }

    const rate1 = b1.appearance_rate ?? 0;
    const rate2 = b2.appearance_rate ?? 0;

    sharedPages.push({
      slug:              page.canonicalSlug,
      location:          page.canonicalLocation ?? location,
      canonicalLocation: page.canonicalLocation,
      clusterId:         page.clusterId,
      rate1,
      rate2,
      evidenceDiff:      rate1 - rate2,
      evidence1:         b1.evidence ?? [],
      evidence2:         b2.evidence ?? [],
      authoritySources:  snap.authority_sources ?? [],
    });
  }

  // Gate: co-occurrence ≥ 3
  if (sharedPages.length < CO_OCCURRENCE_THRESHOLD) return null;

  const avgRate1 = sharedPages.reduce((s, p) => s + p.rate1, 0) / sharedPages.length;
  const avgRate2 = sharedPages.reduce((s, p) => s + p.rate2, 0) / sharedPages.length;

  // Gate: evidence difference ≥ threshold
  if (Math.abs(avgRate1 - avgRate2) < EVIDENCE_DIFF_THRESHOLD) return null;

  const peakRate1      = Math.max(...sharedPages.map((p) => p.rate1));
  const peakRate2      = Math.max(...sharedPages.map((p) => p.rate2));
  const pagesLeading1  = sharedPages.filter((p) => p.rate1 > p.rate2).length;
  const pagesLeading2  = sharedPages.filter((p) => p.rate2 > p.rate1).length;
  const tied           = sharedPages.filter((p) => p.rate1 === p.rate2).length;

  return {
    brand1Slug,
    brand2Slug,
    brand1Name:   brand1Name!,
    brand2Name:   brand2Name!,
    brand1Domain,
    brand2Domain,
    location,
    sharedPages,
    avgRate1,
    avgRate2,
    peakRate1,
    peakRate2,
    pagesLeading1,
    pagesLeading2,
    tied,
  };
}

// ─── Comparison paragraph (data-driven) ──────────────────────────

function buildComparisonParagraph(d: ComparisonData): { p1: string; p2: string } {
  const loc     = toTitleCase(d.location);
  const n1      = d.brand1Name;
  const n2      = d.brand2Name;
  const avg1Pct = `${Math.round(d.avgRate1 * 100)}%`;
  const avg2Pct = `${Math.round(d.avgRate2 * 100)}%`;
  const leader  = d.avgRate1 > d.avgRate2 ? n1 : n2;
  const trailer = d.avgRate1 > d.avgRate2 ? n2 : n1;
  const leaderPct  = d.avgRate1 > d.avgRate2 ? avg1Pct : avg2Pct;
  const trailerPct = d.avgRate1 > d.avgRate2 ? avg2Pct : avg1Pct;
  const diffPct = `${Math.round(Math.abs(d.avgRate1 - d.avgRate2) * 100)}`;

  const p1 = `Across ${d.sharedPages.length} shared AI-analysed queries in ${loc}, ${leader} averages ${leaderPct} AI visibility compared to ${trailer}'s ${trailerPct} — a ${diffPct}-point gap based on AnswerMonk GEO prompt analysis.`;

  const leadCount = d.avgRate1 > d.avgRate2 ? d.pagesLeading1 : d.pagesLeading2;
  const p2 = `${leader} leads on ${leadCount} of ${d.sharedPages.length} shared query pages. This comparison is based on co-occurrence data only — both brands were independently cited by ChatGPT, Claude, Gemini, and Perplexity across the same query categories.`;

  return { p1, p2 };
}

// ─── JSON-LD ──────────────────────────────────────────────────────

function buildJsonLd(d: ComparisonData, canonicalUrl: string): string {
  const graph = [
    {
      "@type": "WebPage",
      "@id": canonicalUrl,
      url: canonicalUrl,
      name: `${d.brand1Name} vs ${d.brand2Name} in ${toTitleCase(d.location)} — AI Visibility`,
      description: `AI search visibility comparison of ${d.brand1Name} and ${d.brand2Name} across ${d.sharedPages.length} shared queries in ${toTitleCase(d.location)}.`,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home",      item: canonicalUrl.replace(/\/compare\/.+/, "/") },
        { "@type": "ListItem", position: 2, name: "Directory", item: canonicalUrl.replace(/\/compare\/.+/, "/directory") },
        { "@type": "ListItem", position: 3, name: "Comparisons", item: canonicalUrl.replace(/\/compare\/.+/, "/compare") },
        { "@type": "ListItem", position: 4, name: `${d.brand1Name} vs ${d.brand2Name}`, item: canonicalUrl },
      ],
    },
  ];
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2);
}

// ─── CSS ─────────────────────────────────────────────────────────

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #070d1a; color: #e2e8f0; font-family: Inter, system-ui, sans-serif; line-height: 1.7; }
  a { color: #818cf8; text-decoration: none; }
  a:hover { color: #a5b4fc; }
  nav { border-bottom: 1px solid rgba(255,255,255,0.06); padding: 14px 28px; display: flex; align-items: center; gap: 8px; }
  .logo-icon { width: 28px; height: 28px; border-radius: 7px; background: linear-gradient(135deg,#3b82f6,#7c3aed); }
  .brand-nav { font-weight: 600; font-size: 14px; color: #fff; }
  .brand-nav span { color: #60a5fa; font-weight: 300; }
  .breadcrumb { padding: 12px 28px; font-size: 12px; color: #475569; }
  .breadcrumb a { color: #475569; }
  main { max-width: 880px; margin: 0 auto; padding: 28px 28px 80px; }
  .badge { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; padding: 3px 10px; border-radius: 99px; font-weight: 500; background: rgba(59,130,246,0.1); color: #93c5fd; border: 1px solid rgba(59,130,246,0.2); margin-bottom: 14px; }
  h1 { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; color: #f8fafc; margin-bottom: 6px; line-height: 1.3; }
  .sub { font-size: 13px; color: #475569; margin-bottom: 28px; }
  .editorial { background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.15); border-left: 3px solid #6366f1; border-radius: 10px; padding: 18px 22px; margin-bottom: 32px; }
  .editorial p { font-size: 14px; color: #94a3b8; line-height: 1.8; }
  .editorial p + p { margin-top: 12px; }
  h2 { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin: 28px 0 12px; }
  .metric-row { display: grid; grid-template-columns: 1fr auto 1fr; gap: 12px; align-items: center; margin-bottom: 28px; }
  .metric-col { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 16px; }
  .metric-col.winner { border-color: rgba(34,197,94,0.2); background: rgba(34,197,94,0.04); }
  .metric-brand { font-size: 12px; font-weight: 600; color: #94a3b8; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
  .metric-big { font-size: 28px; font-weight: 700; color: #f1f5f9; }
  .metric-label { font-size: 11px; color: #475569; }
  .metric-sub { font-size: 12px; color: #64748b; margin-top: 8px; }
  .vs-divider { text-align: center; font-size: 14px; font-weight: 600; color: #334155; }
  .query-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
  .query-row { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 14px 18px; }
  .query-title { font-size: 14px; font-weight: 500; color: #f1f5f9; margin-bottom: 8px; }
  .query-slug a { font-size: 11px; color: #6366f1; font-family: monospace; }
  .rates { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0; }
  .rate-box { border-radius: 7px; padding: 8px 10px; }
  .rate-box.b1 { background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.15); }
  .rate-box.b2 { background: rgba(124,58,237,0.08); border: 1px solid rgba(124,58,237,0.15); }
  .rate-label { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
  .rate-val { font-size: 18px; font-weight: 700; }
  .rate-val.b1 { color: #60a5fa; }
  .rate-val.b2 { color: #a78bfa; }
  .evidence-line { font-size: 12px; color: #475569; margin-top: 4px; }
  .evidence-line::before { content: "›"; margin-right: 5px; color: #1e293b; }
  .methodology-bar { border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px; display: flex; gap: 16px; flex-wrap: wrap; }
  .meth-link { font-size: 12px; color: #374151; }
  .meth-link:hover { color: #64748b; }
`;

// ─── HTML builder ─────────────────────────────────────────────────

function buildComparisonHtml(d: ComparisonData, canonicalUrl: string): string {
  const { p1, p2 } = buildComparisonParagraph(d);
  const jsonLd      = buildJsonLd(d, canonicalUrl);
  const locTitle    = toTitleCase(d.location);

  const avg1Pct = `${Math.round(d.avgRate1 * 100)}%`;
  const avg2Pct = `${Math.round(d.avgRate2 * 100)}%`;
  const isB1Winner = d.avgRate1 >= d.avgRate2;

  const metricRow = `
  <div class="metric-row">
    <div class="metric-col ${isB1Winner ? "winner" : ""}">
      <div class="metric-brand">${d.brand1Name}</div>
      <div class="metric-big ${isB1Winner ? "" : ""}">${avg1Pct}</div>
      <div class="metric-label">avg AI visibility</div>
      <div class="metric-sub">
        Peak ${Math.round(d.peakRate1 * 100)}% · Leads on ${d.pagesLeading1} page${d.pagesLeading1 !== 1 ? "s" : ""}
        ${d.brand1Domain ? `<br><span style="font-family:monospace;font-size:10px;color:#334155">${d.brand1Domain}</span>` : ""}
      </div>
    </div>
    <div class="vs-divider">vs</div>
    <div class="metric-col ${!isB1Winner ? "winner" : ""}">
      <div class="metric-brand">${d.brand2Name}</div>
      <div class="metric-big">${avg2Pct}</div>
      <div class="metric-label">avg AI visibility</div>
      <div class="metric-sub">
        Peak ${Math.round(d.peakRate2 * 100)}% · Leads on ${d.pagesLeading2} page${d.pagesLeading2 !== 1 ? "s" : ""}
        ${d.brand2Domain ? `<br><span style="font-family:monospace;font-size:10px;color:#334155">${d.brand2Domain}</span>` : ""}
      </div>
    </div>
  </div>`;

  const queryRows = d.sharedPages
    .sort((a, b) => Math.abs(b.evidenceDiff) - Math.abs(a.evidenceDiff))
    .map((p) => {
      const ev1 = p.evidence1.map((e) => `<div class="evidence-line">${e}</div>`).join("");
      const ev2 = p.evidence2.map((e) => `<div class="evidence-line">${e}</div>`).join("");
      return `
      <div class="query-row">
        <div class="query-title">${h1FromDb(p.canonicalLocation, p.clusterId)}</div>
        <div class="query-slug"><a href="/${p.slug}">/${p.slug}</a></div>
        <div class="rates">
          <div class="rate-box b1">
            <div class="rate-label">${d.brand1Name}</div>
            <div class="rate-val b1">${Math.round(p.rate1 * 100)}%</div>
            ${ev1}
          </div>
          <div class="rate-box b2">
            <div class="rate-label">${d.brand2Name}</div>
            <div class="rate-val b2">${Math.round(p.rate2 * 100)}%</div>
            ${ev2}
          </div>
        </div>
      </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${d.brand1Name} vs ${d.brand2Name} in ${locTitle} — AI Visibility | AnswerMonk GEO</title>
  <meta name="description" content="${d.brand1Name} averages ${avg1Pct} vs ${d.brand2Name}'s ${avg2Pct} AI visibility across ${d.sharedPages.length} shared queries in ${locTitle}. AnswerMonk GEO.">
  <meta name="robots" content="index,follow">
  <link rel="canonical" href="${canonicalUrl}">
  <script type="application/ld+json">
${jsonLd}
  </script>
  <style>${CSS}</style>
</head>
<body>

<nav>
  <div class="logo-icon"></div>
  <span class="brand-nav">AnswerMonk <span>GEO</span></span>
</nav>

<div class="breadcrumb">
  <a href="/">Home</a> › <a href="/directory">Directory</a> › <a href="/compare">Comparisons</a> › ${d.brand1Name} vs ${d.brand2Name}
</div>

<main>

  <div class="badge">⬡ ${d.sharedPages.length} shared query pages · ${locTitle}</div>

  <h1>${d.brand1Name} vs ${d.brand2Name} in ${locTitle} — AI Visibility Comparison</h1>
  <div class="sub">Prompt-level AI search visibility · AnswerMonk GEO analysis</div>

  <!-- §1 Editorial comparison paragraph -->
  <div class="editorial">
    <p>${p1}</p>
    <p>${p2}</p>
  </div>

  <!-- §2 Side-by-side metrics -->
  <h2>Side-by-Side Metrics</h2>
  ${metricRow}

  <!-- §3 Per-query evidence differences -->
  <h2>Evidence Differences by Query Page</h2>
  <div class="query-list">
    ${queryRows}
  </div>

  <!-- Methodology -->
  <div class="methodology-bar">
    <a href="/methodology" class="meth-link">Methodology ↗</a>
    <a href="/about-the-data" class="meth-link">About the Data ↗</a>
    <a href="/how-rankings-work" class="meth-link">How Rankings Work ↗</a>
  </div>

</main>
</body>
</html>`;
}

// ─── All comparison slugs (for sitemap) ──────────────────────────

export async function getAllComparisonSlugs(): Promise<string[]> {
  const pages = await db
    .select({
      canonicalSlug:    directoryPages.canonicalSlug,
      canonicalLocation: directoryPages.canonicalLocation,
      rankingSnapshot:  directoryPages.rankingSnapshot,
    })
    .from(directoryPages)
    .where(eq(directoryPages.publishStatus, "published"));

  // Accumulate per-location brand pairs and their co-occurrence counts
  const pairCount = new Map<string, number>();

  for (const page of pages) {
    const snap = page.rankingSnapshot as RankingSnapshot | null;
    if (!snap?.brands || !page.canonicalLocation) continue;
    const slugs = snap.brands.map((b) => brandToSlug(b.name, b.domain)).sort();
    for (let i = 0; i < slugs.length; i++) {
      for (let j = i + 1; j < slugs.length; j++) {
        const key = `${slugs[i]}|${slugs[j]}|${page.canonicalLocation}`;
        pairCount.set(key, (pairCount.get(key) ?? 0) + 1);
      }
    }
  }

  const result: string[] = [];
  for (const [key, count] of pairCount.entries()) {
    if (count < CO_OCCURRENCE_THRESHOLD) continue;
    const [b1, b2, loc] = key.split("|");
    result.push(`${b1}-vs-${b2}-${loc}`);
  }
  return result.sort();
}

// ─── Route registration ───────────────────────────────────────────

export function registerComparisonPageRoutes(app: Express): void {
  app.get("/compare/:slug", async (req: Request, res: Response) => {
    const rawSlug = req.params.slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
    const parsed  = parseComparisonSlug(rawSlug);

    if (!parsed) return res.status(404).send("Invalid comparison URL format");

    const { brand1Slug, brand2Slug, location } = parsed;

    try {
      const data = await buildComparisonData(brand1Slug, brand2Slug, location);

      if (!data) {
        return res.status(404).send(
          `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="robots" content="noindex,nofollow"><title>Comparison not available</title></head><body><h1>Comparison not available</h1><p>Co-occurrence below threshold (requires ${CO_OCCURRENCE_THRESHOLD}+ shared query pages).</p></body></html>`,
        );
      }

      const canonicalUrl = `${canonicalBase(req)}/compare/${rawSlug}`;
      const html = buildComparisonHtml(data, canonicalUrl);

      res
        .set("Content-Type", "text/html; charset=utf-8")
        .set("Cache-Control", "public, max-age=300, stale-while-revalidate=60")
        .set("Surrogate-Key", "geo-directory-comparison")
        .status(200)
        .send(html);
    } catch (err) {
      console.error("[directory] comparison page error:", err);
      res.status(500).send("Internal server error");
    }
  });
}

/**
 * Step 9 — Brand entity page route.
 *
 * URL: /brand/:brandSlug
 * Example: /brand/valeo-health
 *
 * Data is derived at runtime by scanning all published directory_pages
 * and aggregating every occurrence of the brand across ranking_snapshots.
 *
 * Sections:
 *   1. Brand name + H1
 *   2. Top-line visibility stat
 *   3. Service categories (derived from query page slugs)
 *   4. Detected locations
 *   5. Per-query appearance rates
 *   6. Recurring authority sources
 *   7. Linked query pages
 *   8. JSON-LD Organization @graph
 */

import type { Express, Request, Response } from "express";
import { db } from "../db";
import { directoryPages } from "@shared/schema";
import { eq } from "drizzle-orm";

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

interface PageOccurrence {
  slug: string;
  h1: string;
  location: string | null;
  clusterId: string | null;
  appearanceRate: number;
  evidence: string[];
  authoritySources: string[];
}

interface BrandPageData {
  slug: string;
  name: string;
  domain: string | null;
  occurrences: PageOccurrence[];
  allLocations: string[];
  allAuthoritySources: string[];
  avgAppearanceRate: number;
  maxAppearanceRate: number;
}

// ─── Helpers ──────────────────────────────────────────────────────

/**
 * Deterministic 4-char base-36 hash of any string.
 * Used as suffix for name-only brand slugs to prevent collisions.
 * e.g. "Care" → "1k4z", "Care!" → "3mq8" (different originals, different hashes)
 */
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
 *   domain: "vestacare.ae"  → "vestacare-ae"
 *   name only: "Care"       → "care-1k4z"
 *   name only: "Care!"      → "care-3mq8"  ← different from "Care"
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
  const tc = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
  return `Best ${tc(service)} in ${tc(canonicalLocation)}`;
}

function scoreColor(rate: number): string {
  const p = rate * 100;
  return p >= 75 ? "#22c55e" : p >= 50 ? "#f59e0b" : "#ef4444";
}

function canonicalBase(req: Request): string {
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
  const host  = (req.headers["x-forwarded-host"] as string) || (req.headers.host as string) || "";
  return `${proto}://${host}`;
}

// ─── Data aggregation ─────────────────────────────────────────────

async function buildBrandData(brandSlug: string): Promise<BrandPageData | null> {
  const pages = await db
    .select({
      canonicalSlug:     directoryPages.canonicalSlug,
      canonicalLocation: directoryPages.canonicalLocation,
      clusterId:         directoryPages.clusterId,
      rankingSnapshot:   directoryPages.rankingSnapshot,
    })
    .from(directoryPages)
    .where(eq(directoryPages.publishStatus, "published"));

  const occurrences: PageOccurrence[] = [];
  let brandName: string | null = null;
  let brandDomain: string | null = null;

  for (const page of pages) {
    if (!page.rankingSnapshot) continue;
    const snap = page.rankingSnapshot as RankingSnapshot;
    const match = (snap.brands ?? []).find(
      (b) => brandToSlug(b.name, b.domain) === brandSlug,
    );
    if (!match) continue;

    // Capture canonical name + domain on first match
    if (!brandName) {
      brandName  = match.name;
      brandDomain = match.domain ?? null;
    }

    occurrences.push({
      slug:             page.canonicalSlug,
      // Use DB fields for H1 — never parse the slug (breaks multi-word locations)
      h1:               h1FromDb(page.canonicalLocation, page.clusterId),
      location:         page.canonicalLocation,
      clusterId:        page.clusterId,
      appearanceRate:   match.appearance_rate ?? 0,
      evidence:         match.evidence ?? [],
      authoritySources: snap.authority_sources ?? [],
    });
  }

  if (occurrences.length === 0) return null;

  const allLocations = [...new Set(occurrences.map((o) => o.location).filter(Boolean) as string[])];
  const allAuthoritySources = [
    ...new Set(occurrences.flatMap((o) => o.authoritySources)),
  ].sort();

  const rates = occurrences.map((o) => o.appearanceRate);
  const avgAppearanceRate = rates.reduce((a, b) => a + b, 0) / rates.length;
  const maxAppearanceRate = Math.max(...rates);

  return {
    slug:       brandSlug,
    name:       brandName!,
    domain:     brandDomain,
    occurrences,
    allLocations,
    allAuthoritySources,
    avgAppearanceRate,
    maxAppearanceRate,
  };
}

// ─── JSON-LD ──────────────────────────────────────────────────────

function buildJsonLd(brand: BrandPageData, canonicalUrl: string): string {
  const graph = [
    {
      "@type": "WebPage",
      "@id": canonicalUrl,
      url: canonicalUrl,
      name: `${brand.name} — AI Search Visibility`,
    },
    {
      "@type": "Organization",
      "@id": `${canonicalUrl}#org`,
      name: brand.name,
      url: brand.domain ? `https://${brand.domain}` : undefined,
      description: `AI search visibility data for ${brand.name}, aggregated from ${brand.occurrences.length} query page${brand.occurrences.length !== 1 ? "s" : ""}.`,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home",      item: canonicalUrl.replace(/\/brand\/.+/, "/") },
        { "@type": "ListItem", position: 2, name: "Directory", item: canonicalUrl.replace(/\/brand\/.+/, "/directory") },
        { "@type": "ListItem", position: 3, name: brand.name,  item: canonicalUrl },
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
  .logo-icon { width: 28px; height: 28px; border-radius: 7px; background: linear-gradient(135deg,#3b82f6,#7c3aed); display: flex; align-items: center; justify-content: center; }
  .brand-nav { font-weight: 600; font-size: 14px; color: #fff; }
  .brand-nav span { color: #60a5fa; font-weight: 300; }
  .breadcrumb { padding: 12px 28px; font-size: 12px; color: #475569; }
  .breadcrumb a { color: #475569; }
  .breadcrumb a:hover { color: #94a3b8; }
  main { max-width: 860px; margin: 0 auto; padding: 28px 28px 80px; }
  .badges { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
  .badge { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; padding: 3px 10px; border-radius: 99px; font-weight: 500; }
  .badge-green { background: rgba(34,197,94,0.1); color: #4ade80; border: 1px solid rgba(34,197,94,0.2); }
  .badge-blue { background: rgba(59,130,246,0.1); color: #93c5fd; border: 1px solid rgba(59,130,246,0.2); }
  h1 { font-size: 26px; font-weight: 700; letter-spacing: -0.02em; color: #f8fafc; margin-bottom: 6px; }
  .sub { font-size: 14px; color: #475569; margin-bottom: 28px; }
  h2 { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin: 28px 0 12px; }
  .stat-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 28px; }
  .stat-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 14px 18px; }
  .stat-val { font-size: 22px; font-weight: 700; color: #f1f5f9; }
  .stat-lbl { font-size: 11px; color: #475569; margin-top: 2px; }
  .chip-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; }
  .chip { font-size: 12px; padding: 4px 10px; border-radius: 7px; border: 1px solid rgba(255,255,255,0.07); color: #94a3b8; background: rgba(255,255,255,0.03); }
  .auth-chip { background: rgba(99,102,241,0.08); color: #818cf8; border: 1px solid rgba(99,102,241,0.15); }
  .query-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
  .query-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 14px 18px; display: flex; align-items: flex-start; gap: 14px; }
  .query-rate { font-size: 18px; font-weight: 700; min-width: 54px; text-align: right; flex-shrink: 0; }
  .query-body { flex: 1; }
  .query-title { font-size: 14px; font-weight: 500; color: #f1f5f9; margin-bottom: 4px; }
  .query-link { font-size: 12px; color: #475569; font-family: monospace; }
  .query-link a { color: #6366f1; text-decoration: none; }
  .query-link a:hover { color: #818cf8; }
  .evidence-line { font-size: 12px; color: #64748b; margin-top: 4px; }
  .evidence-line::before { content: "›"; margin-right: 5px; color: #334155; }
  .methodology-bar { border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px; display: flex; gap: 16px; flex-wrap: wrap; }
  .meth-link { font-size: 12px; color: #374151; text-decoration: none; }
  .meth-link:hover { color: #64748b; }
`;

// ─── HTML builder ─────────────────────────────────────────────────

function buildBrandPageHtml(brand: BrandPageData, canonicalUrl: string): string {
  const pct = (r: number) => `${Math.round(r * 100)}%`;
  const avgPct = pct(brand.avgAppearanceRate);
  const maxPct = pct(brand.maxAppearanceRate);
  const jsonLd  = buildJsonLd(brand, canonicalUrl);

  const domainChip = brand.domain
    ? `<span class="badge badge-blue">🌐 ${brand.domain}</span>`
    : "";

  const locationChips = brand.allLocations
    .map((l) => `<span class="chip">${l.charAt(0).toUpperCase() + l.slice(1)}</span>`)
    .join("");

  const authChips = brand.allAuthoritySources
    .map((s) => `<span class="chip auth-chip">${s}</span>`)
    .join("");

  const queryCards = brand.occurrences
    .sort((a, b) => b.appearanceRate - a.appearanceRate)
    .map((o) => {
      const color = scoreColor(o.appearanceRate);
      const evidenceLines = o.evidence
        .map((e) => `<div class="evidence-line">${e}</div>`)
        .join("");
      return `
      <div class="query-card">
        <div class="query-rate" style="color:${color}">${pct(o.appearanceRate)}</div>
        <div class="query-body">
          <div class="query-title">${o.h1}</div>
          <div class="query-link"><a href="/${o.slug}">/${o.slug}</a></div>
          ${evidenceLines}
        </div>
      </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brand.name} — AI Search Visibility | AnswerMonk</title>
  <meta name="description" content="${brand.name} appears in ${brand.occurrences.length} AI-analysed queries with an average visibility rate of ${avgPct}. Data from AnswerMonk.">
  <meta name="robots" content="index,follow">
  <link rel="canonical" href="${canonicalUrl}">
  <meta property="og:title" content="${brand.name} — AI Search Visibility">
  <meta property="og:description" content="${brand.name} averages ${avgPct} AI visibility across ${brand.occurrences.length} analysed queries.">
  <meta property="og:url" content="${canonicalUrl}">
  <script type="application/ld+json">
${jsonLd}
  </script>
  <style>${CSS}</style>
</head>
<body>

<nav>
  <div class="logo-icon">✦</div>
  <span class="brand-nav">AnswerMonk</span>
</nav>

<div class="breadcrumb">
  <a href="/">Home</a> › <a href="/directory">Directory</a> › <a href="/directory">Brands</a> › ${brand.name}
</div>

<main>

  <div class="badges">
    <span class="badge badge-green">⬡ ${brand.occurrences.length} query page${brand.occurrences.length !== 1 ? "s" : ""} tracked</span>
    ${domainChip}
  </div>

  <h1>${brand.name}</h1>
  <div class="sub">AI search visibility data — AnswerMonk analysis</div>

  <!-- Top-line stats -->
  <div class="stat-row">
    <div class="stat-card">
      <div class="stat-val" style="color:#22c55e">${maxPct}</div>
      <div class="stat-lbl">Peak AI visibility</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">${avgPct}</div>
      <div class="stat-lbl">Average across queries</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">${brand.occurrences.length}</div>
      <div class="stat-lbl">Query pages ranked</div>
    </div>
  </div>

  <!-- Detected locations -->
  ${brand.allLocations.length > 0 ? `
  <h2>Detected Locations</h2>
  <div class="chip-row">${locationChips}</div>
  ` : ""}

  <!-- Authority sources -->
  ${brand.allAuthoritySources.length > 0 ? `
  <h2>Recurring Authority Sources</h2>
  <div class="chip-row">${authChips}</div>
  ` : ""}

  <!-- Per-query appearance rates -->
  <h2>AI Visibility by Query</h2>
  <div class="query-list">
    ${queryCards}
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

// ─── All brand slugs (for sitemap) ───────────────────────────────

export async function getAllBrandSlugs(): Promise<string[]> {
  const pages = await db
    .select({ rankingSnapshot: directoryPages.rankingSnapshot })
    .from(directoryPages)
    .where(eq(directoryPages.publishStatus, "published"));

  const slugs = new Set<string>();
  for (const page of pages) {
    if (!page.rankingSnapshot) continue;
    const snap = page.rankingSnapshot as RankingSnapshot;
    for (const b of snap.brands ?? []) {
      slugs.add(brandToSlug(b.name, b.domain));
    }
  }
  return [...slugs].sort();
}

// ─── Route registration ───────────────────────────────────────────

export function registerBrandPageRoutes(app: Express): void {
  app.get("/brand/:slug", async (req: Request, res: Response) => {
    const brandSlug = req.params.slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!brandSlug) return res.status(404).send("Not found");

    try {
      const brand = await buildBrandData(brandSlug);
      if (!brand) return res.status(404).send("Brand not found");

      const canonicalUrl = `${canonicalBase(req)}/brand/${brandSlug}`;
      const html = buildBrandPageHtml(brand, canonicalUrl);

      res
        .set("Content-Type", "text/html; charset=utf-8")
        .set("Cache-Control", "public, max-age=300, stale-while-revalidate=60")
        .set("Surrogate-Key", "geo-directory-brand")
        .status(200)
        .send(html);
    } catch (err) {
      console.error("[directory] brand page error:", err);
      res.status(500).send("Internal server error");
    }
  });
}

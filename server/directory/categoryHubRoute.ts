/**
 * Step 10 — Category hub route.
 *
 * URL: /{location}/{category}
 * Example: /dubai/home-healthcare
 *
 * Rules (from plan):
 *   - Only renders when 5+ published pages exist in the cluster
 *   - Returns HTTP 404 if cluster has fewer than 5 published pages
 *   - Must include 2-paragraph data-driven editorial summary
 *   - All cluster query pages linked from hub
 *   - JSON-LD CollectionPage schema
 *
 * Cluster ID derivation:
 *   /{location}/{category} → cluster_id = {category_underscored}_{location}
 *   /dubai/home-healthcare → home_healthcare_dubai
 */

import type { Express, NextFunction, Request, Response } from "express";
import { db } from "../db";
import { directoryPages } from "@shared/schema";
import { and, desc, eq } from "drizzle-orm";

const HUB_THRESHOLD = 5; // minimum published pages to render hub

// ─── Types ────────────────────────────────────────────────────────

interface BrandEntry {
  name: string;
  domain?: string;
  appearance_rate?: number;
}

interface RankingSnapshot {
  brands?: BrandEntry[];
  authority_sources?: string[];
}

interface ClusterPage {
  canonicalSlug: string;
  canonicalQuery: string;
  canonicalLocation: string | null;
  clusterId: string | null;
  evidenceScore: number;
  brandCount: number;
  rankingSnapshot: RankingSnapshot | null;
}

interface HubData {
  location: string;
  category: string;          // hyphenated e.g. home-healthcare
  clusterId: string;
  pageCount: number;
  pages: ClusterPage[];
  topBrands: Array<{ name: string; avgRate: number; domain?: string }>;
  allAuthoritySources: string[];
  totalBrandOccurrences: number;
}

// ─── Helpers ──────────────────────────────────────────────────────

function toTitleCase(str: string): string {
  return str
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Derive H1 from stored DB fields — never parse the slug.
 * canonicalLocation = "abu dhabi" | "dubai" etc. (space-separated after normalisation)
 * clusterId         = "home_healthcare_abu_dhabi" etc.
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

function canonicalBase(req: Request): string {
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
  const host  = (req.headers["x-forwarded-host"] as string) || (req.headers.host as string) || "";
  return `${proto}://${host}`;
}

// ─── Data aggregation ─────────────────────────────────────────────

type HubResult =
  | { status: "empty" }            // 0 published pages → caller should next()
  | { status: "insufficient"; count: number }  // 1-4 pages → 404
  | { status: "ok"; hub: HubData };            // 5+ pages → render

async function buildHubData(
  location: string,
  category: string,
): Promise<HubResult> {
  // Normalise both sides to underscores so "abu-dhabi" → "abu_dhabi" matches DB
  const clusterId = `${category.replace(/-/g, "_")}_${location.replace(/-/g, "_")}`;

  const pages = await db
    .select({
      canonicalSlug:     directoryPages.canonicalSlug,
      canonicalQuery:    directoryPages.canonicalQuery,
      canonicalLocation: directoryPages.canonicalLocation,
      clusterId:         directoryPages.clusterId,
      evidenceScore:     directoryPages.evidenceScore,
      brandCount:        directoryPages.brandCount,
      rankingSnapshot:   directoryPages.rankingSnapshot,
    })
    .from(directoryPages)
    .where(
      and(
        eq(directoryPages.clusterId, clusterId),
        eq(directoryPages.publishStatus, "published"),
      ),
    )
    .orderBy(desc(directoryPages.evidenceScore));

  if (pages.length === 0) return { status: "empty" };
  if (pages.length < HUB_THRESHOLD) return { status: "insufficient", count: pages.length };

  // Aggregate brand appearances across all pages
  const brandMap = new Map<string, { rates: number[]; domain?: string }>();
  const authSet  = new Set<string>();

  for (const page of pages) {
    const snap = page.rankingSnapshot as RankingSnapshot | null;
    if (!snap) continue;
    for (const b of snap.brands ?? []) {
      const entry = brandMap.get(b.name) ?? { rates: [], domain: b.domain };
      entry.rates.push(b.appearance_rate ?? 0);
      if (b.domain && !entry.domain) entry.domain = b.domain;
      brandMap.set(b.name, entry);
    }
    for (const s of snap.authority_sources ?? []) authSet.add(s);
  }

  const topBrands = [...brandMap.entries()]
    .map(([name, { rates, domain }]) => ({
      name,
      domain,
      avgRate: rates.reduce((a, b) => a + b, 0) / rates.length,
    }))
    .sort((a, b) => b.avgRate - a.avgRate)
    .slice(0, 6);

  return {
    status: "ok",
    hub: {
      location,
      category,
      clusterId,
      pageCount: pages.length,
      pages: pages.map((p) => ({
        canonicalSlug:     p.canonicalSlug,
        canonicalQuery:    p.canonicalQuery,
        canonicalLocation: p.canonicalLocation,
        clusterId:         p.clusterId,
        evidenceScore:     p.evidenceScore,
        brandCount:        p.brandCount,
        rankingSnapshot:   p.rankingSnapshot as RankingSnapshot | null,
      })),
      topBrands,
      allAuthoritySources: [...authSet].sort(),
      totalBrandOccurrences: [...brandMap.values()].reduce((s, v) => s + v.rates.length, 0),
    },
  };
}

// ─── Editorial summary (2 paragraphs, data-driven) ────────────────

function buildEditorialSummary(hub: HubData): { p1: string; p2: string } {
  const locTitle = toTitleCase(hub.location);
  const catTitle = toTitleCase(hub.category);
  const top3     = hub.topBrands.slice(0, 3);

  // ── Paragraph 1: lead brand + cluster size ─────────────────────
  const topName = top3[0]?.name;
  const topPct  = top3[0] ? `${Math.round(top3[0].avgRate * 100)}%` : null;
  const second  = top3[1]?.name;
  const third   = top3[2]?.name;

  let p1: string;
  if (topName && topPct) {
    const othersStr = [second, third].filter(Boolean).join(" and ");
    const othersSentence = othersStr
      ? ` ${othersStr} ${third ? "are" : "is"} the next most-cited ${third ? "brands" : "brand"} in this cluster.`
      : "";
    p1 = `Across ${hub.pageCount} analysed ${catTitle} quer${hub.pageCount === 1 ? "y" : "ies"} in ${locTitle}, ${topName} is the most AI-visible provider — cited in ${topPct} of responses across ChatGPT, Claude, Gemini, and Perplexity.${othersSentence}`;
  } else {
    p1 = `Nexalytics GEO has analysed ${hub.pageCount} ${catTitle} quer${hub.pageCount === 1 ? "y" : "ies"} in ${locTitle}. AI visibility rankings will appear here as data is collected.`;
  }

  // ── Paragraph 2: authority sources + data freshness ────────────
  const authSources = hub.allAuthoritySources.slice(0, 4);
  let p2: string;
  if (authSources.length > 0) {
    const authList = authSources.length === 1
      ? authSources[0]
      : `${authSources.slice(0, -1).join(", ")} and ${authSources[authSources.length - 1]}`;
    p2 = `${authList} ${authSources.length === 1 ? "is" : "are"} among the most frequently cited authority sources when AI engines respond to ${catTitle} queries in ${locTitle}. Nexalytics GEO tracks rankings across all ${hub.pageCount} cluster variant${hub.pageCount === 1 ? "" : "s"} continuously, updating each time new prompt analysis is collected.`;
  } else {
    p2 = `Nexalytics GEO monitors ${hub.pageCount} ${catTitle} query variant${hub.pageCount === 1 ? "" : "s"} in ${locTitle} across ChatGPT, Claude, Gemini, and Perplexity. Rankings are updated each time new prompt analysis data is collected.`;
  }

  return { p1, p2 };
}

// ─── JSON-LD ──────────────────────────────────────────────────────

function buildJsonLd(hub: HubData, canonicalUrl: string): string {
  const graph = [
    {
      "@type": "CollectionPage",
      "@id": canonicalUrl,
      url: canonicalUrl,
      name: `Best ${toTitleCase(hub.category)} in ${toTitleCase(hub.location)} — AI Rankings`,
      description: `Aggregated AI search visibility data for ${hub.pageCount} ${toTitleCase(hub.category)} queries in ${toTitleCase(hub.location)}.`,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home",      item: canonicalUrl.replace(/\/[^/]+\/[^/]+$/, "/") },
        { "@type": "ListItem", position: 2, name: "Directory", item: canonicalUrl.replace(/\/[^/]+\/[^/]+$/, "/directory") },
        { "@type": "ListItem", position: 3, name: toTitleCase(hub.location), item: canonicalUrl.replace(/\/[^/]+$/, "") },
        { "@type": "ListItem", position: 4, name: toTitleCase(hub.category), item: canonicalUrl },
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
  main { max-width: 900px; margin: 0 auto; padding: 28px 28px 80px; }
  .badge { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; padding: 3px 10px; border-radius: 99px; font-weight: 500; background: rgba(99,102,241,0.1); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.2); margin-bottom: 14px; }
  h1 { font-size: 26px; font-weight: 700; letter-spacing: -0.02em; color: #f8fafc; margin-bottom: 6px; }
  .sub { font-size: 14px; color: #475569; margin-bottom: 28px; }
  .editorial { background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.15); border-left: 3px solid #6366f1; border-radius: 10px; padding: 18px 22px; margin-bottom: 32px; }
  .editorial p { font-size: 14px; color: #94a3b8; line-height: 1.8; }
  .editorial p + p { margin-top: 12px; }
  h2 { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin: 28px 0 12px; }
  .brand-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 28px; }
  .brand-tile { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 14px; }
  .tile-name { font-size: 14px; font-weight: 500; color: #f1f5f9; margin-bottom: 4px; }
  .tile-rate { font-size: 20px; font-weight: 700; }
  .tile-domain { font-size: 11px; color: #374151; font-family: monospace; margin-top: 2px; }
  .chip-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; }
  .auth-chip { font-size: 12px; padding: 4px 10px; border-radius: 7px; background: rgba(99,102,241,0.08); color: #818cf8; border: 1px solid rgba(99,102,241,0.15); }
  .page-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
  .page-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; }
  .page-title { font-size: 14px; color: #f1f5f9; font-weight: 500; margin-bottom: 4px; }
  .page-slug { font-size: 11px; color: #374151; font-family: monospace; }
  .page-slug a { color: #6366f1; }
  .page-meta { text-align: right; font-size: 12px; color: #475569; }
  .methodology-bar { border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px; display: flex; gap: 16px; flex-wrap: wrap; }
  .meth-link { font-size: 12px; color: #374151; text-decoration: none; }
  .meth-link:hover { color: #64748b; }
`;

// ─── HTML builder ─────────────────────────────────────────────────

function buildHubHtml(hub: HubData, canonicalUrl: string): string {
  const locTitle = toTitleCase(hub.location);
  const catTitle = toTitleCase(hub.category);
  const { p1, p2 } = buildEditorialSummary(hub);
  const jsonLd = buildJsonLd(hub, canonicalUrl);

  const brandTiles = hub.topBrands
    .map((b) => {
      const pct   = `${Math.round(b.avgRate * 100)}%`;
      const color = b.avgRate >= 0.75 ? "#22c55e" : b.avgRate >= 0.5 ? "#f59e0b" : "#ef4444";
      return `
      <div class="brand-tile">
        <div class="tile-name">${b.name}</div>
        <div class="tile-rate" style="color:${color}">${pct}</div>
        ${b.domain ? `<div class="tile-domain">${b.domain}</div>` : ""}
      </div>`;
    })
    .join("\n");

  const authChips = hub.allAuthoritySources
    .map((s) => `<span class="auth-chip">${s}</span>`)
    .join("");

  const pageCards = hub.pages
    .map((p) => {
      // Use DB fields for H1 — never parse the slug
      const h1 = h1FromDb(p.canonicalLocation, p.clusterId);
      return `
      <div class="page-card">
        <div>
          <div class="page-title">${h1}</div>
          <div class="page-slug"><a href="/${p.canonicalSlug}">/${p.canonicalSlug}</a></div>
        </div>
        <div class="page-meta">
          Score ${p.evidenceScore} · ${p.brandCount} brand${p.brandCount !== 1 ? "s" : ""}
        </div>
      </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Best ${catTitle} in ${locTitle} — AI Rankings | Nexalytics GEO</title>
  <meta name="description" content="AI search visibility rankings for ${hub.pageCount} ${catTitle} queries in ${locTitle}. Based on ${hub.totalBrandOccurrences} brand appearances analysed by Nexalytics GEO.">
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
  <span class="brand-nav">Nexalytics <span>GEO</span></span>
</nav>

<div class="breadcrumb">
  <a href="/">Home</a> › <a href="/directory">Directory</a> › <a href="/${hub.location}">${locTitle}</a> › ${catTitle}
</div>

<main>

  <div class="badge">⬡ ${hub.pageCount} query variants · ${hub.location}</div>

  <h1>Best ${catTitle} in ${locTitle}</h1>
  <div class="sub">AI Search Visibility — Category Hub · Nexalytics GEO</div>

  <!-- §1 Editorial summary (2 paragraphs, data-driven) -->
  <div class="editorial">
    <p>${p1}</p>
    <p>${p2}</p>
  </div>

  <!-- §2 Top brands across cluster -->
  <h2>Top Brands Across This Category</h2>
  <div class="brand-grid">${brandTiles}</div>

  <!-- §3 Authority sources -->
  ${hub.allAuthoritySources.length > 0 ? `
  <h2>Authority Sources</h2>
  <div class="chip-row">${authChips}</div>
  ` : ""}

  <!-- §4 All cluster query pages -->
  <h2>All ${catTitle} Query Pages in ${locTitle} (${hub.pageCount})</h2>
  <div class="page-list">${pageCards}</div>

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

// ─── Route registration ───────────────────────────────────────────

export function registerCategoryHubRoutes(app: Express): void {
  // Pattern: /{location}/{category-with-hyphens}
  // Inline regex is unsupported in newer path-to-regexp — validate inside handler
  app.get("/:location/:category", async (req: Request, res: Response, next: NextFunction) => {
    const { location, category } = req.params;

    // Only handle clean lowercase slugs (no dots, slashes, uppercase, etc.)
    const slugRe = /^[a-z][a-z0-9-]*$/;
    if (!slugRe.test(location) || !slugRe.test(category)) {
      return res.status(404).send("Not found");
    }

    // Skip known non-hub path prefixes
    const reserved = new Set(["api", "brand", "sitemaps", "directory", "start", "v2", "share", "summary", "teaser", "assets"]);
    if (reserved.has(location)) return res.status(404).send("Not found");

    try {
      const result = await buildHubData(location, category);

      if (result.status === "empty") {
        // No published pages for this cluster → not a directory path, pass to React SPA
        return next();
      }

      if (result.status === "insufficient") {
        // Has pages but below threshold → 404 with noindex
        return res.status(404).send(
          `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="robots" content="noindex,nofollow"><title>Not enough data</title></head><body><h1>Not enough data</h1><p>This category hub requires at least ${HUB_THRESHOLD} published pages. Currently has ${result.count}.</p></body></html>`,
        );
      }

      // status === "ok"
      const canonicalUrl = `${canonicalBase(req)}/${location}/${category}`;
      const html = buildHubHtml(result.hub, canonicalUrl);

      res
        .set("Content-Type", "text/html; charset=utf-8")
        .set("Cache-Control", "public, max-age=300, stale-while-revalidate=60")
        .set("Surrogate-Key", "geo-directory-hub")
        .status(200)
        .send(html);
    } catch (err) {
      console.error("[directory] category hub error:", err);
      res.status(500).send("Internal server error");
    }
  });
}

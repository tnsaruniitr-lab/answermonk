/**
 * Step 5 + 6 — Express HTML route for directory query pages.
 *
 * URL pattern: /best-{service}-{location}
 * Returns: complete server-rendered HTML (not React SPA)
 *
 * 8-section template (locked):
 *   1. Title + H1
 *   2. Direct answer paragraph — top 3 brands + stat
 *   3. Ranked list — numbered
 *   4. Evidence block per brand
 *   5. Authority sources
 *   6. Versioning block
 *   7. Related queries
 *   8. Methodology link
 *
 * JSON-LD @graph: WebPage, Dataset, ItemList, Organization, BreadcrumbList
 */

import type { Express, Request, Response } from "express";
import { db } from "../db";
import { directoryPages, queryPageVersions } from "@shared/schema";
import { and, desc, eq, ne, sql } from "drizzle-orm";

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

interface PageVersion {
  dataVersion: string;
  analysisWindow?: string | null;
  promptCount: number;
  rankingSnapshotJson: RankingSnapshot;
}

interface RelatedPage {
  canonicalSlug: string;
  canonicalLocation: string | null;
  clusterId: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────

function titleCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Derive H1 from stored DB fields — never parse the slug.
 * canonicalLocation = "abu dhabi" | "dubai" etc.
 * clusterId         = "home_healthcare_abu_dhabi" etc.
 */
function h1FromDb(canonicalLocation: string | null, clusterId: string | null): string {
  if (!canonicalLocation || !clusterId) return "AI Search Rankings";
  const locKey = canonicalLocation.replace(/\s+/g, "_");
  const serviceKey = clusterId.endsWith(`_${locKey}`)
    ? clusterId.slice(0, -(locKey.length + 1))
    : clusterId;
  const service = serviceKey.replace(/_/g, " ");
  return `Best ${titleCase(service)} in ${titleCase(canonicalLocation)}`;
}

/** Derive the parent category hub URL from DB fields. */
function hubUrlFromDb(canonicalLocation: string | null, clusterId: string | null): string | null {
  if (!canonicalLocation || !clusterId) return null;
  const locKey     = canonicalLocation.replace(/\s+/g, "_");
  const serviceKey = clusterId.endsWith(`_${locKey}`)
    ? clusterId.slice(0, -(locKey.length + 1))
    : clusterId;
  const categorySlug  = serviceKey.replace(/_/g, "-");
  const locationSlug  = canonicalLocation.replace(/\s+/g, "-");
  return `/${locationSlug}/${categorySlug}`;
}

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

function scoreColor(rate: number): string {
  const pct = rate * 100;
  if (pct >= 75) return "#22c55e";
  if (pct >= 50) return "#f59e0b";
  return "#ef4444";
}

function scoreLabel(rate: number): string {
  const pct = rate * 100;
  if (pct >= 75) return "High Visibility";
  if (pct >= 50) return "Moderate";
  return "Low Visibility";
}

function canonicalBase(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host  = req.headers["x-forwarded-host"] || req.headers.host || "";
  return `${proto}://${host}`;
}

// ─── JSON-LD @graph ───────────────────────────────────────────────

function buildJsonLd(opts: {
  canonicalUrl: string;
  h1: string;
  slug: string;
  brands: BrandEntry[];
  lastUpdated: string;
  promptCount: number;
  dataVersion: string;
}): string {
  const { canonicalUrl, h1, slug, brands, lastUpdated, promptCount, dataVersion } = opts;

  const itemList = brands.map((b, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: b.name,
    url: b.domain ? `https://${b.domain}` : undefined,
  }));

  const orgGraphItems = brands.slice(0, 3).map((b) => ({
    "@type": "Organization",
    name: b.name,
    url: b.domain ? `https://${b.domain}` : undefined,
  }));

  const graph = [
    {
      "@type": "WebPage",
      "@id": canonicalUrl,
      url: canonicalUrl,
      name: h1,
      description: `AI visibility rankings for ${h1} based on ${promptCount} prompts analysed in ${dataVersion}.`,
      dateModified: lastUpdated,
    },
    {
      "@type": "Dataset",
      "@id": `${canonicalUrl}#dataset`,
      name: `AI Search Rankings: ${h1}`,
      description: `Ranked list of AI-visible brands for the query "${slug}", derived from ${promptCount} prompts across ChatGPT, Claude, Gemini, and Perplexity.`,
      dateModified: lastUpdated,
      creator: { "@type": "Organization", name: "Nexalytics GEO" },
    },
    {
      "@type": "ItemList",
      "@id": `${canonicalUrl}#rankings`,
      name: `${h1} — AI Visibility Rankings`,
      numberOfItems: brands.length,
      itemListElement: itemList,
    },
    ...orgGraphItems,
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home",      item: canonicalUrl.replace(/\/best-.+/, "/") },
        { "@type": "ListItem", position: 2, name: "Directory", item: canonicalUrl.replace(/\/best-.+/, "/directory") },
        { "@type": "ListItem", position: 3, name: h1,          item: canonicalUrl },
      ],
    },
  ];

  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2);
}

// ─── CSS ─────────────────────────────────────────────────────────

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #070d1a; color: #e2e8f0; font-family: Inter, system-ui, sans-serif; line-height: 1.6; }
  a { color: inherit; }
  nav { border-bottom: 1px solid rgba(255,255,255,0.06); padding: 14px 28px; display: flex; align-items: center; gap: 8px; }
  .logo-icon { width: 28px; height: 28px; border-radius: 7px; background: linear-gradient(135deg,#3b82f6,#7c3aed); display: flex; align-items: center; justify-content: center; font-size: 14px; }
  .brand { font-weight: 600; font-size: 14px; color: #fff; }
  .brand span { color: #60a5fa; font-weight: 300; }
  .breadcrumb { padding: 12px 28px; display: flex; align-items: center; gap: 6px; font-size: 12px; color: #475569; }
  .breadcrumb a { text-decoration: none; color: #475569; }
  .breadcrumb a:hover { color: #94a3b8; }
  main { max-width: 860px; margin: 0 auto; padding: 20px 28px 60px; }
  .badges { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
  .badge { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; padding: 3px 10px; border-radius: 99px; font-weight: 500; }
  .badge-green { background: rgba(34,197,94,0.1); color: #4ade80; border: 1px solid rgba(34,197,94,0.2); }
  .badge-indigo { background: rgba(99,102,241,0.1); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.2); }
  h1 { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 8px; line-height: 1.3; color: #f8fafc; }
  h1 .sub { display: block; font-size: 15px; font-weight: 400; color: #475569; margin-top: 4px; letter-spacing: 0; }
  .answer-box { background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2); border-left: 3px solid #6366f1; border-radius: 10px; padding: 16px 20px; margin: 20px 0 28px; font-size: 15px; line-height: 1.7; color: #cbd5e1; }
  .answer-box strong { color: #fff; }
  .answer-box .stat { color: #a5b4fc; }
  .hub-link { display: flex; align-items: center; gap: 6px; padding: 10px 14px; background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.15); border-radius: 9px; text-decoration: none; font-size: 13px; color: #818cf8; margin-bottom: 24px; width: fit-content; }
  .hub-link:hover { background: rgba(99,102,241,0.1); color: #a5b4fc; }
  .section-label { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 14px; }
  .rankings { display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px; }
  .brand-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px 18px; }
  .brand-card.top { border-color: rgba(34,197,94,0.2); }
  .brand-row { display: flex; align-items: flex-start; gap: 14px; }
  .rank-num { width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 14px; font-weight: 700; color: #475569; }
  .rank-num.top { background: rgba(34,197,94,0.15); color: #4ade80; }
  .brand-content { flex: 1; }
  .brand-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
  .brand-name { font-weight: 600; font-size: 15px; color: #f1f5f9; margin-bottom: 2px; }
  .brand-name a { color: #f1f5f9; text-decoration: none; }
  .brand-name a:hover { color: #a5b4fc; text-decoration: underline; }
  .brand-domain { font-size: 11px; color: #374151; font-family: monospace; }
  .brand-score { text-align: right; }
  .score-pct { font-size: 20px; font-weight: 700; }
  .score-lbl { font-size: 10px; opacity: 0.7; }
  .score-bar-bg { height: 3px; background: rgba(255,255,255,0.06); border-radius: 99px; margin-bottom: 10px; overflow: hidden; }
  .score-bar { height: 100%; border-radius: 99px; }
  .evidence-line { margin: 0 0 4px; font-size: 13px; color: #64748b; line-height: 1.5; }
  .evidence-line::before { content: "›"; color: #334155; margin-right: 6px; }
  .brand-sources { display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap; }
  .source-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; padding: 2px 8px; border-radius: 6px; background: rgba(255,255,255,0.04); color: #475569; border: 1px solid rgba(255,255,255,0.07); }
  .block { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; }
  .block-title { font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; }
  .authority-chips { display: flex; gap: 8px; flex-wrap: wrap; }
  .auth-chip { font-size: 12px; padding: 4px 10px; border-radius: 7px; background: rgba(99,102,241,0.08); color: #818cf8; border: 1px solid rgba(99,102,241,0.15); }
  .version-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 24px; font-size: 12px; }
  .version-key { color: #374151; }
  .version-val { color: #94a3b8; font-weight: 500; }
  .related { display: flex; flex-direction: column; gap: 8px; margin-bottom: 28px; }
  .related-link { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 9px; text-decoration: none; color: #94a3b8; font-size: 13px; transition: border-color 0.2s, color 0.2s; }
  .related-link:hover { border-color: rgba(99,102,241,0.25); color: #a5b4fc; }
  .methodology-bar { border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px; display: flex; gap: 16px; flex-wrap: wrap; align-items: center; }
  .meth-link { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #374151; text-decoration: none; }
  .meth-link:hover { color: #64748b; }
  .jsonld-note { font-size: 11px; color: #1e293b; margin-left: auto; }
`;

// ─── HTML builder ─────────────────────────────────────────────────

function buildQueryPageHtml(opts: {
  slug: string;
  canonicalUrl: string;
  robots: string;
  canonicalLocation: string | null;
  clusterId: string | null;
  page: { evidenceScore: number; brandCount: number; lastUpdatedAt: Date | null };
  version: PageVersion | null;
  related: RelatedPage[];
}): string {
  const { slug, canonicalUrl, robots, canonicalLocation, clusterId, page, version, related } = opts;

  // H1 derived from DB fields — never parse the slug
  const h1 = h1FromDb(canonicalLocation, clusterId);

  // Derive hub URL from DB fields
  const hubUrl = hubUrlFromDb(canonicalLocation, clusterId);
  const locTitle = canonicalLocation ? titleCase(canonicalLocation) : "";
  const locKey = (canonicalLocation ?? "").replace(/\s+/g, "_");
  const serviceKey = (clusterId ?? "").endsWith(`_${locKey}`)
    ? (clusterId ?? "").slice(0, -(locKey.length + 1))
    : (clusterId ?? "");
  const catTitle = titleCase(serviceKey.replace(/_/g, " "));

  const snapshot: RankingSnapshot = version?.rankingSnapshotJson ?? {};
  const brands: BrandEntry[] = snapshot.brands ?? [];
  const authSources: string[] = snapshot.authority_sources ?? [];
  const top3Names = brands.slice(0, 3).map((b) => b.name);
  const topStr = top3Names.length > 0
    ? top3Names.slice(0, -1).join(", ") + (top3Names.length > 1 ? ", and " : "") + top3Names[top3Names.length - 1]
    : "multiple providers";
  const promptCount = version?.promptCount ?? 0;
  const dataVersion = version?.dataVersion ?? "v1";
  const analysisWindow = version?.analysisWindow ?? "2026";
  const lastUpdated = page.lastUpdatedAt?.toISOString().split("T")[0] ?? new Date().toISOString().split("T")[0];
  const topRate = brands[0]?.appearance_rate ?? 0;

  const jsonLd = buildJsonLd({ canonicalUrl, h1, slug, brands, lastUpdated, promptCount, dataVersion });

  // ── Hub link ───────────────────────────────────────────────────
  const hubLinkHtml = hubUrl
    ? `<a href="${hubUrl}" class="hub-link">📂 View all ${catTitle} rankings in ${locTitle} →</a>`
    : "";

  // ── Related query rows ─────────────────────────────────────────
  const relatedHtml = related.length > 0
    ? related.map((r) => {
        const rH1 = h1FromDb(r.canonicalLocation, r.clusterId);
        return `<a href="/${r.canonicalSlug}" class="related-link">${rH1} <span>›</span></a>`;
      }).join("\n")
    : `<p style="font-size:13px;color:#374151;">No related queries yet.</p>`;

  // ── Brand cards ────────────────────────────────────────────────
  const brandCardsHtml = brands.length > 0
    ? brands.map((b, i) => {
        const rate = b.appearance_rate ?? 0;
        const pct = Math.round(rate * 100);
        const color = scoreColor(rate);
        const label = scoreLabel(rate);
        const evidenceLines = (b.evidence ?? [`Appears in AI search results for ${h1}`])
          .map((e) => `<p class="evidence-line">${e}</p>`).join("");
        const domainChips = b.domain
          ? `<div class="brand-sources"><span class="source-chip">${b.domain}</span></div>`
          : "";
        const brandSlug = brandToSlug(b.name, b.domain);
        return `
          <div class="brand-card ${i === 0 ? "top" : ""}">
            <div class="brand-row">
              <div class="rank-num ${i === 0 ? "top" : ""}">${i + 1}</div>
              <div class="brand-content">
                <div class="brand-header">
                  <div>
                    <div class="brand-name"><a href="/brand/${brandSlug}">${b.name}</a></div>
                    ${b.domain ? `<div class="brand-domain">${b.domain}</div>` : ""}
                  </div>
                  <div class="brand-score">
                    <div class="score-pct" style="color:${color}">${pct}%</div>
                    <div class="score-lbl" style="color:${color}">${label}</div>
                  </div>
                </div>
                <div class="score-bar-bg">
                  <div class="score-bar" style="width:${pct}%;background:${color}"></div>
                </div>
                ${evidenceLines}
                ${domainChips}
              </div>
            </div>
          </div>`;
      }).join("\n")
    : `<p style="font-size:13px;color:#374151;padding:16px 0;">Rankings are being compiled. Check back soon.</p>`;

  // ── Authority sources ─────────────────────────────────────────
  const authHtml = authSources.length > 0
    ? authSources.map((s) => `<span class="auth-chip">${s}</span>`).join("")
    : `<span style="font-size:12px;color:#374151;">Sources being compiled.</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${h1} (${analysisWindow} AI Analysis) | Nexalytics GEO</title>
  <meta name="description" content="${topStr} are the top AI-visible providers for ${h1}, based on ${promptCount} prompts analysed by Nexalytics GEO.">
  <meta name="robots" content="${robots}">
  <link rel="canonical" href="${canonicalUrl}">

  <!-- Open Graph -->
  <meta property="og:title" content="${h1} (AI Analysis)">
  <meta property="og:description" content="AI visibility rankings: ${topStr} lead in AI search for ${h1}.">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:type" content="website">

  <script type="application/ld+json">
${jsonLd}
  </script>

  <style>${CSS}</style>
</head>
<body>

  <nav>
    <div class="logo-icon">✦</div>
    <span class="brand">Nexalytics <span>GEO</span></span>
  </nav>

  <!-- Breadcrumb -->
  <div class="breadcrumb">
    <a href="/">Home</a>
    <span>›</span>
    <a href="/directory">Directory</a>
    ${hubUrl ? `<span>›</span><a href="${hubUrl}">${catTitle} in ${locTitle}</a>` : ""}
    <span>›</span>
    <span style="color:#94a3b8">${h1}</span>
  </div>

  <main>

    <!-- Freshness badges -->
    <div class="badges">
      <span class="badge badge-green">⏱ Last updated: ${lastUpdated}</span>
      <span class="badge badge-indigo">⬡ ${dataVersion} · ${promptCount} prompts</span>
    </div>

    <!-- §1 H1 -->
    <h1>${h1}<span class="sub">${analysisWindow} AI Search Analysis</span></h1>

    <!-- §2 Direct answer paragraph -->
    <div class="answer-box">
      <strong>${topStr}</strong> are the most frequently cited providers for <em>${h1}</em>
      across ChatGPT, Claude, Gemini and Perplexity, based on Nexalytics GEO analysis of
      <span class="stat">${promptCount} prompts</span> (${analysisWindow}).
      The top-ranked brand appeared in
      <span class="stat">${Math.round(topRate * 100)}% of AI responses</span>.
    </div>

    <!-- Hub link — parent category page -->
    ${hubLinkHtml}

    <!-- §3 + §4 Ranked list with evidence -->
    <div class="section-label">AI Visibility Rankings</div>
    <div class="rankings">
      ${brandCardsHtml}
    </div>

    <!-- §5 Authority sources -->
    <div class="block">
      <div class="block-title">🔒 Authority Sources Driving Rankings</div>
      <div class="authority-chips">${authHtml}</div>
    </div>

    <!-- §6 Versioning block -->
    <div class="block">
      <div class="version-grid">
        <div><span class="version-key">Analysis window: </span><span class="version-val">${analysisWindow}</span></div>
        <div><span class="version-key">Engines analysed: </span><span class="version-val">ChatGPT · Claude · Gemini · Perplexity</span></div>
        <div><span class="version-key">Prompts run: </span><span class="version-val">${promptCount} intent-based queries</span></div>
        <div><span class="version-key">Data version: </span><span class="version-val">${dataVersion}</span></div>
      </div>
    </div>

    <!-- §7 Related queries -->
    <div class="section-label">Related Queries</div>
    <div class="related">${relatedHtml}</div>

    <!-- §8 Methodology links -->
    <div class="methodology-bar">
      <a href="/methodology" class="meth-link">Methodology ↗</a>
      <a href="/about-the-data" class="meth-link">About the Data ↗</a>
      <a href="/how-rankings-work" class="meth-link">How Rankings Work ↗</a>
      <span class="jsonld-note">&lt;script type="application/ld+json"&gt; @graph embedded ✓</span>
    </div>

  </main>
</body>
</html>`;
}

// ─── Route registration ───────────────────────────────────────────

export function registerQueryPageRoutes(app: Express): void {
  // Matches /best-anything-here (directory query pages only — no /api/ or SPA routes)
  app.get(/^\/best-.+/, async (req: Request, res: Response) => {
    const rawSlug = req.path.slice(1); // strip leading /
    // Safety: only alphanumeric + hyphens
    if (!/^best-[a-z0-9-]+$/.test(rawSlug)) {
      return res.status(404).send("Not found");
    }

    try {
      // ── Fetch page row (all columns) ───────────────────────────
      const [page] = await db
        .select()
        .from(directoryPages)
        .where(eq(directoryPages.canonicalSlug, rawSlug));

      if (!page) return res.status(404).send("Not found");

      // Blocked and draft pages are not public — serve a hard 404
      if (page.publishStatus === "blocked" || page.publishStatus === "draft") {
        return res.status(404).send("Not found");
      }

      // ── Fetch latest version ────────────────────────────────────
      const [latestVersion] = await db
        .select()
        .from(queryPageVersions)
        .where(eq(queryPageVersions.pageSlug, rawSlug))
        .orderBy(desc(queryPageVersions.createdAt))
        .limit(1);

      // If no version row, try to use ranking_snapshot from the page row itself
      let versionData: PageVersion | null = null;
      if (latestVersion) {
        versionData = {
          dataVersion: latestVersion.dataVersion,
          analysisWindow: latestVersion.analysisWindow,
          promptCount: latestVersion.promptCount,
          rankingSnapshotJson: latestVersion.rankingSnapshotJson as RankingSnapshot,
        };
      } else if (page.rankingSnapshot) {
        versionData = {
          dataVersion: page.dataVersion ?? "v1",
          analysisWindow: null,
          promptCount: 0,
          rankingSnapshotJson: page.rankingSnapshot as RankingSnapshot,
        };
      }

      // ── Related queries (fetch DB fields needed for H1) ────────
      const related: RelatedPage[] = page.clusterId
        ? await db
            .select({
              canonicalSlug:     directoryPages.canonicalSlug,
              canonicalLocation: directoryPages.canonicalLocation,
              clusterId:         directoryPages.clusterId,
            })
            .from(directoryPages)
            .where(
              and(
                eq(directoryPages.clusterId, page.clusterId),
                ne(directoryPages.canonicalSlug, rawSlug),
                eq(directoryPages.publishStatus, "published"),
              ),
            )
            .orderBy(desc(directoryPages.evidenceScore))
            .limit(3)
        : [];

      // ── Robots meta ─────────────────────────────────────────────
      const robots = page.publishStatus === "published" ? "index,follow" : "noindex,nofollow";

      // ── Response ────────────────────────────────────────────────
      const canonicalUrl = `${canonicalBase(req)}/${rawSlug}`;
      const html = buildQueryPageHtml({
        slug: rawSlug,
        canonicalUrl,
        robots,
        canonicalLocation: page.canonicalLocation,
        clusterId:         page.clusterId,
        page: {
          evidenceScore: page.evidenceScore,
          brandCount:    page.brandCount,
          lastUpdatedAt: page.lastUpdatedAt,
        },
        version: versionData,
        related,
      });

      res
        .set("Content-Type", "text/html; charset=utf-8")
        .set("Cache-Control", "public, max-age=300, stale-while-revalidate=60")
        .set("Surrogate-Key", "geo-directory-page")
        .status(200)
        .send(html);
    } catch (err) {
      console.error("[directory] query page error:", err);
      res.status(500).send("Internal server error");
    }
  });
}

/**
 * Step 8 — Sitemap index + sub-sitemaps.
 *
 * Architecture (plan §Sitemap size control):
 *   /sitemap.xml                  → sitemap index (lists all sub-sitemaps)
 *   /sitemaps/query-pages-1.xml   → published query pages batch 1 (≤50,000)
 *   /sitemaps/brands.xml          → brand entity pages (populated at Step 9)
 *   /sitemaps/hubs.xml            → category hubs (populated at Step 10)
 *
 * Indexing rules:
 *   published  → included, index,follow
 *   draft      → excluded
 *   noindex    → excluded
 *   blocked    → excluded
 *
 * Cache-Control: no-cache (sitemap must always reflect live DB state)
 */

import type { Express, Request, Response } from "express";
import { db } from "../db";
import { directoryPages } from "@shared/schema";
import { desc, eq } from "drizzle-orm";
import { getAllBrandSlugs } from "./brandPageRoute";
import { getAllComparisonSlugs } from "./comparisonPageRoute";

const URLS_PER_BATCH = 50_000;

function xmlHeader(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>`;
}

function canonicalBase(req: Request): string {
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
  const host  = (req.headers["x-forwarded-host"] as string) || (req.headers.host as string) || "";
  return `${proto}://${host}`;
}

function respond(res: Response, xml: string): void {
  res
    .set("Content-Type", "application/xml; charset=utf-8")
    .set("Cache-Control", "no-cache, no-store, must-revalidate")
    .status(200)
    .send(xml);
}

// ─── /sitemap.xml — index ─────────────────────────────────────────

async function buildSitemapIndex(base: string): Promise<string> {
  const now = new Date().toISOString().split("T")[0];
  const sitemaps = [
    `${base}/sitemaps/query-pages-1.xml`,
    `${base}/sitemaps/brands.xml`,
    `${base}/sitemaps/hubs.xml`,
    `${base}/sitemaps/comparisons.xml`,
  ];

  const entries = sitemaps
    .map(
      (loc) => `  <sitemap>\n    <loc>${loc}</loc>\n    <lastmod>${now}</lastmod>\n  </sitemap>`,
    )
    .join("\n");

  return `${xmlHeader()}
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;
}

// ─── /sitemaps/query-pages-1.xml ─────────────────────────────────

async function buildQueryPagesSitemap(base: string, batch: number): Promise<string> {
  const pages = await db
    .select({
      canonicalSlug: directoryPages.canonicalSlug,
      lastUpdatedAt: directoryPages.lastUpdatedAt,
    })
    .from(directoryPages)
    .where(eq(directoryPages.publishStatus, "published"))
    .orderBy(desc(directoryPages.lastUpdatedAt))
    .limit(URLS_PER_BATCH)
    .offset((batch - 1) * URLS_PER_BATCH);

  if (pages.length === 0) {
    return `${xmlHeader()}
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;
  }

  const urls = pages
    .map((p) => {
      const lastmod = p.lastUpdatedAt
        ? new Date(p.lastUpdatedAt).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];
      return `  <url>\n    <loc>${base}/${p.canonicalSlug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
    })
    .join("\n");

  return `${xmlHeader()}
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

// ─── /sitemaps/brands.xml ────────────────────────────────────────

async function buildBrandsSitemap(base: string): Promise<string> {
  const slugs = await getAllBrandSlugs();
  if (slugs.length === 0) {
    return `${xmlHeader()}\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>`;
  }
  const today = new Date().toISOString().split("T")[0];
  const urls = slugs
    .map((s) => `  <url>\n    <loc>${base}/brand/${s}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`)
    .join("\n");
  return `${xmlHeader()}\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

// ─── /sitemaps/hubs.xml — dynamic from clusters with 5+ pages ────

async function buildHubsSitemap(base: string): Promise<string> {
  const HUB_THRESHOLD = 5;
  const today = new Date().toISOString().split("T")[0];

  const rows = await db
    .select({ clusterId: directoryPages.clusterId, canonicalLocation: directoryPages.canonicalLocation })
    .from(directoryPages)
    .where(eq(directoryPages.publishStatus, "published"));

  // Count pages per cluster
  const clusterCount = new Map<string, { location: string; count: number }>();
  for (const row of rows) {
    if (!row.clusterId || !row.canonicalLocation) continue;
    const entry = clusterCount.get(row.clusterId) ?? { location: row.canonicalLocation, count: 0 };
    entry.count++;
    clusterCount.set(row.clusterId, entry);
  }

  const urls: string[] = [];
  for (const [clusterId, { location, count }] of clusterCount.entries()) {
    if (count < HUB_THRESHOLD) continue;
    // cluster_id = {category_underscored}_{location}
    // Strip location suffix to get category
    const locSuffix = `_${location}`;
    if (!clusterId.endsWith(locSuffix)) continue;
    const categoryUnderscored = clusterId.slice(0, -locSuffix.length);
    const categoryHyphenated  = categoryUnderscored.replace(/_/g, "-");
    const hubUrl = `${base}/${location}/${categoryHyphenated}`;
    urls.push(
      `  <url>\n    <loc>${hubUrl}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`,
    );
  }

  return `${xmlHeader()}\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
}

// ─── /sitemaps/comparisons.xml — qualifying brand pair pages ─────

async function buildComparisonsSitemap(base: string): Promise<string> {
  const slugs = await getAllComparisonSlugs();
  if (slugs.length === 0) {
    return `${xmlHeader()}\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>`;
  }
  const today = new Date().toISOString().split("T")[0];
  const urls = slugs
    .map((s) => `  <url>\n    <loc>${base}/compare/${s}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.5</priority>\n  </url>`)
    .join("\n");
  return `${xmlHeader()}\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

// ─── Route registration ───────────────────────────────────────────

export function registerSitemapRoutes(app: Express): void {
  // Sitemap index
  app.get("/sitemap.xml", async (req: Request, res: Response) => {
    try {
      const base = canonicalBase(req);
      const xml  = await buildSitemapIndex(base);
      respond(res, xml);
    } catch (err) {
      console.error("[sitemap] index error:", err);
      res.status(500).send("Internal server error");
    }
  });

  // Query pages — batch 1 (expand to batch 2, 3… when > 50k pages)
  app.get("/sitemaps/query-pages-:batch.xml", async (req: Request, res: Response) => {
    const batch = parseInt(req.params.batch, 10);
    if (isNaN(batch) || batch < 1) return res.status(404).send("Not found");
    try {
      const base = canonicalBase(req);
      const xml  = await buildQueryPagesSitemap(base, batch);
      respond(res, xml);
    } catch (err) {
      console.error("[sitemap] query pages error:", err);
      res.status(500).send("Internal server error");
    }
  });

  // Brand pages
  app.get("/sitemaps/brands.xml", async (req: Request, res: Response) => {
    try {
      const base = canonicalBase(req);
      const xml  = await buildBrandsSitemap(base);
      respond(res, xml);
    } catch (err) {
      console.error("[sitemap] brands error:", err);
      res.status(500).send("Internal server error");
    }
  });

  // Category hubs
  app.get("/sitemaps/hubs.xml", async (req: Request, res: Response) => {
    try {
      const base = canonicalBase(req);
      const xml  = await buildHubsSitemap(base);
      respond(res, xml);
    } catch (err) {
      console.error("[sitemap] hubs error:", err);
      res.status(500).send("Internal server error");
    }
  });

  // Comparison pages
  app.get("/sitemaps/comparisons.xml", async (req: Request, res: Response) => {
    try {
      const base = canonicalBase(req);
      const xml  = await buildComparisonsSitemap(base);
      respond(res, xml);
    } catch (err) {
      console.error("[sitemap] comparisons error:", err);
      res.status(500).send("Internal server error");
    }
  });
}

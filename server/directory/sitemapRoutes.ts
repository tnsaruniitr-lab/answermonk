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

// ─── /sitemaps/brands.xml — placeholder for Step 9 ───────────────

function buildBrandsSitemap(): string {
  return `${xmlHeader()}
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<!-- Brand entity pages will be added in Step 9 -->
</urlset>`;
}

// ─── /sitemaps/hubs.xml — placeholder for Step 10 ────────────────

function buildHubsSitemap(): string {
  return `${xmlHeader()}
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<!-- Category hub pages will be added in Step 10 -->
</urlset>`;
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
  app.get("/sitemaps/brands.xml", (_req: Request, res: Response) => {
    respond(res, buildBrandsSitemap());
  });

  // Category hubs
  app.get("/sitemaps/hubs.xml", (_req: Request, res: Response) => {
    respond(res, buildHubsSitemap());
  });
}

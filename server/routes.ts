
import path from "path";
import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { createServer } from "http";
import { registerQueryPageRoutes } from "./directory/queryPageRoute";
import { registerMethodologyRoutes } from "./directory/methodologyRoutes";
import { registerSitemapRoutes } from "./directory/sitemapRoutes";
import { registerBrandPageRoutes } from "./directory/brandPageRoute";
import { registerCategoryHubRoutes } from "./directory/categoryHubRoute";
import { registerComparisonPageRoutes } from "./directory/comparisonPageRoute";
import { syncSessionToDirectory, backfillRecentSessions } from "./directory/sessionToDirectory";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { 
  EvalRequestSchema, 
  AggregateRequestSchema, 
  EngineEnum, 
  type Engine,
  type EngineOutput 
} from "@shared/schema";
import { z } from "zod";
import { queryEngine } from "./engines";
import { generatePromptSet } from "./promptgen/generator";
import { BuyerIntentProfileSchema } from "./promptgen/types";
import { getPresetsForPersona, PERSONA_CATEGORY_LABELS, MARKETING_CHANNELS, AUTOMATION_SERVICES, AUTOMATION_KNOWN_TOOLS, MARKETING_VERTICALS, AUTOMATION_VERTICALS, CORPORATE_CARDS_SERVICES, CORPORATE_CARDS_VERTICALS, CORPORATE_CARDS_MODIFIERS, EXPENSE_MANAGEMENT_SERVICES, EXPENSE_MANAGEMENT_VERTICALS, EXPENSE_MANAGEMENT_MODIFIERS, ACCOUNTING_AUTOMATION_SERVICES, ACCOUNTING_AUTOMATION_VERTICALS, ACCOUNTING_AUTOMATION_MODIFIERS, INVOICE_MANAGEMENT_SERVICES, INVOICE_MANAGEMENT_VERTICALS, INVOICE_MANAGEMENT_MODIFIERS, CREDIT_MANAGEMENT_SERVICES, CREDIT_MANAGEMENT_VERTICALS, CREDIT_MANAGEMENT_MODIFIERS, CM_PERSONAS, RESTAURANT_OFFERINGS, RESTAURANT_VERTICALS, RESTAURANT_MODIFIERS, CONSTRUCTION_MANAGEMENT_SERVICES, CONSTRUCTION_MANAGEMENT_VERTICALS, CONSTRUCTION_MANAGEMENT_MODIFIERS, HEALTHCARE_SERVICES, HEALTHCARE_VERTICALS, HEALTHCARE_MODIFIERS, WEIGHT_LOSS_SERVICES, WEIGHT_LOSS_VERTICALS, WEIGHT_LOSS_MODIFIERS, BLOOD_TEST_SERVICES, BLOOD_TEST_VERTICALS, BLOOD_TEST_MODIFIERS, REAL_ESTATE_SERVICES, REAL_ESTATE_VERTICALS, REAL_ESTATE_MODIFIERS, BUDGET_ADJECTIVES, DECISION_MAKERS } from "./promptgen/presets";
import { selectMiniPanel, selectMicroPanel } from "./scoring/panel";
import { runScoring } from "./scoring/runner";
import { getAvailableCompetitors, reScoreForCompetitor, buildCompetitorReportSegments } from "./scoring/competitor-lens";
import { insertSavedProfileSchema, insertMultiSegmentSessionSchema, insertSavedV2ConfigSchema } from "@shared/schema";
import { analyzePanelWebsite } from "./panel/generator";
import { runInsightsAnalysis, type InsightsInput } from "./insights";
import { runSegmentAnalysis } from "./segment-analysis";
import { runSignalIntelligence, getSignalIntelligence } from "./signal-intelligence";
import Anthropic from "@anthropic-ai/sdk";

const anthropicClassifier = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});
const CLAUDE_INPUT_COST_PER_1M = 3.00;
const CLAUDE_OUTPUT_COST_PER_1M = 15.00;
import { generateReport } from "./report/generator";
import { generateTeaserData } from "./report/teaser-generator";
import { brandIntelligenceJobs, signalConsistencyJobs } from "@shared/schema";
import { runBrandIntelligence } from "./brand-intelligence/runner";
import { runSignalConsistency } from "./signal-consistency-runner";
import { resolveGroundingUrls } from "./report/grounding-resolver";
import { desc, asc, eq as eqDrizzle } from "drizzle-orm";
import { db as directoryDb } from "./db";
import { directoryPages as directoryPagesTable } from "@shared/schema";
import { analyzeUrl } from "./url-analyzer";
import { pncExtract, pncV1Generate, pncV2Generate, pncClassify, pncClassifyGenerate } from "./pnc";

/** ------------------------
 * Scoring helpers (From user provided logic)
 * ------------------------ */
function normalizeWeights(w: Record<string, number>) {
  const sum = Object.values(w).reduce((a, b) => a + b, 0) || 1;
  const out: Record<string, number> = { ...w };
  Object.keys(out).forEach((k) => (out[k] = out[k] / sum));
  return out;
}

/**
 * Presence state:
 * 2 = strong presence, 1 = weak presence, 0 = absent
 */
function presenceScore(presenceByEngine: Record<string, 0 | 1 | 2>, weights: Record<string, number>) {
  const wn = normalizeWeights(weights);
  let s = 0;
  Object.keys(wn).forEach((e) => {
    s += wn[e] * (presenceByEngine[e] / 2);
  });
  return Math.round(s * 100);
}

/**
 * Rank score: if found at position pos (1..10), use decay 1 / pos^p
 */
function rankScore(posByEngine: Record<string, number | null>, weights: Record<string, number>, p = 1.2) {
  const wn = normalizeWeights(weights);
  let s = 0;
  Object.keys(wn).forEach((e) => {
    const pos = posByEngine[e];
    if (pos && pos >= 1) {
      s += wn[e] * (1 / Math.pow(pos, p));
    }
  });
  return Math.round(s * 100);
}

function classifyCitationUrl(url: string, engine: string): string {
  const u = (url || "").toLowerCase();
  if (u.includes("reddit.com") || u.includes("quora.com") || u.includes("/forum") || u.includes("expatsofdubai")) return "Community Thread";
  if (u.includes("indeed.com") || u.includes("/jobs") || u.includes("/careers") || u.includes("/cmp/")) return "Jobs Listing";
  if (u.includes("linkedin.com")) return "Social Media Profile";
  if (u.includes("dha.gov") || u.includes("mohap") || u.includes("dhcc.ae") || u.includes("ocat.ae") || u.includes("haad.")) return "Government / Regulatory";
  if (u.includes("mordorintelligence") || u.includes("statista") || u.includes("cbinsights")) return "Market Research";
  const newsDomains = ["gulfnews", "zawya", "thenational", "baabeetv", "digitalmarketingdeal", "meamarkets", "dxbnews", "uaetimes", "uaedigital", "arabianews", "linkcentre"];
  if (newsDomains.some(d => u.includes(d))) return "News / PR";
  if (u.includes("/press-release") || u.includes("/press/")) return "News / PR";
  const reviewDomains = ["trustpilot", "trustindex", "sitejabber", "provenexpert", "goprofiled", "bestthings", "zaubee", "dubaireview", "doctify", "okadoc"];
  if (reviewDomains.some(d => u.includes(d))) return "Review Platform";
  if (u.includes("/reviews")) return "Review Platform";
  const dirDomains = ["healthfinder", "ensun.io", "elderlycareindubai", "trusteddoctors", "health1.ae", "edarabia", "justdial", "zorg4u", "bestinhood", "servicemarket", "dubai.clinic", "edurar", "justlife", "arabiamd", "dubaisbest", "2gis.ae"];
  if (dirDomains.some(d => u.includes(d))) return "Directory Listing";
  if (u.includes("/listing") || u.includes("/listings/") || u.includes("/search/")) return "Directory Listing";
  const compPhrases = ["best-home", "top-home", "best-nursing", "home-health-care-agencies", "top-10", "best-10", "complete-guide", "best-home-healthcare", "top-rated"];
  if (compPhrases.some(p => u.includes(p))) return "Comparison Article";
  if (u.includes("/blog/") || u.includes("/article") || u.includes("/post/") || u.includes("/news/") || u.includes("/insights/")) return "Brand Blog / Article";
  if (u.includes("/about") || u.includes("/team") || u.includes("/contact") || u.includes("/faq") || u.includes("/accreditation")) return "Brand About / Contact";
  const serviceTerms = ["/home-nursing", "/doctor", "/physio", "/elderly", "/palliative", "/wound", "/iv-", "/nursing", "/services", "/home-care", "/healthcare", "/at-home", "/nurse"];
  if (serviceTerms.some(p => u.includes(p))) return "Brand Service Page";
  if (u.match(/^https?:\/\/[^/]+\/?$/) || u.endsWith("/")) return "Brand Homepage";
  if (engine === "gemini") return "Brand Homepage";
  return "Brand Inner Page";
}

async function resolveVertexRedirect(url: string, timeoutMs = 8000): Promise<string> {
  const https = await import("https");
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const req = (https as any).request(
        { hostname: parsed.hostname, path: parsed.pathname + parsed.search, method: "HEAD", timeout: timeoutMs,
          headers: { "User-Agent": "Mozilla/5.0 (compatible; GEO-resolver/1.0)" } },
        (res: any) => {
          const loc = res.headers["location"];
          if (loc) {
            try { resolve(loc.startsWith("http") ? loc : new URL(loc, url).href); }
            catch { resolve(url); }
          } else { resolve(url); }
        }
      );
      req.on("error", () => resolve(url));
      req.on("timeout", () => { req.destroy(); resolve(url); });
      req.end();
    } catch { resolve(url); }
  });
}

async function populateCitationUrls(sessionId: number): Promise<void> {
  const { pool } = await import("./db");
  await pool.query(`DELETE FROM citation_urls WHERE session_id = $1`, [sessionId]);
  const res = await pool.query(`
    SELECT
      seg->>'persona' as segment_persona,
      run->>'engine' as engine,
      run->>'prompt_text' as prompt_text,
      cite->>'url' as cite_url,
      cite->>'title' as title
    FROM multi_segment_sessions s,
    jsonb_array_elements(s.segments) seg,
    jsonb_array_elements(seg->'scoringResult'->'raw_runs') run,
    jsonb_array_elements(run->'citations') cite
    WHERE s.id = $1
      AND run->'citations' != 'null'::jsonb
      AND jsonb_array_length(run->'citations') > 0
      AND (
        (run->>'engine' = 'gemini' AND cite->>'url' IS NOT NULL AND cite->>'url' != '')
        OR
        (run->>'engine' = 'chatgpt' AND cite->>'url' IS NOT NULL AND cite->>'url' != '')
      )
  `, [sessionId]);

  if (res.rows.length === 0) return;

  // Resolve Gemini Vertex redirect URLs concurrently
  const vertexUrls = [...new Set(
    res.rows
      .filter((r: any) => r.engine === "gemini" && r.cite_url?.includes("vertexaisearch"))
      .map((r: any) => r.cite_url as string)
  )];

  const resolved = new Map<string, string>();
  const CONCURRENCY = 20;
  const queue = [...vertexUrls];
  async function worker() {
    while (queue.length > 0) {
      const url = queue.shift();
      if (!url || resolved.has(url)) continue;
      const dest = await resolveVertexRedirect(url);
      resolved.set(url, dest);
      await new Promise(r => setTimeout(r, 50));
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const urlEngineMap = new Map<string, { engine: string; url: string; title: string; count: number }>();
  const values: string[] = [];
  const params: any[] = [sessionId];
  for (const row of res.rows) {
    let url = "";
    if (row.engine === "gemini") {
      if (row.cite_url?.includes("vertexaisearch")) {
        const dest = resolved.get(row.cite_url);
        url = (dest && dest !== row.cite_url) ? dest : (row.title ? "https://" + row.title.replace(/^https?:\/\//, "") : "");
      } else {
        url = row.cite_url || "";
      }
    } else {
      url = (row.cite_url || "").replace(/[?&]utm_source=[^&]*/g, "").replace(/[?&]$/, "");
    }
    if (!url) continue;
    if (!url.startsWith("http")) url = "https://" + url;

    const key = `${row.engine}||${url}`;
    const existing = urlEngineMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      urlEngineMap.set(key, { engine: row.engine, url, title: row.title || "", count: 1 });
    }
  }

  // Build deduplicated insert rows (unique per url+engine, with citation_count)
  for (const { engine, url, title, count } of urlEngineMap.values()) {
    const category = classifyCitationUrl(url, engine);
    params.push(engine, url, title, category, count);
    const base = params.length - 4;
    values.push(`($1, $${base}, $${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`);
  }

  if (values.length === 0) return;
  await pool.query(`
    INSERT INTO citation_urls (session_id, engine, url, title, url_category, citation_count)
    VALUES ${values.join(",")}
  `, params);

  // Set domain and brand columns from url
  await pool.query(`
    UPDATE citation_urls
    SET domain = regexp_replace(regexp_replace(url, '^https?://(www\\.)?', ''), '/.*$', '')
    WHERE session_id = $1 AND url IS NOT NULL
  `, [sessionId]);

  await pool.query(`
    UPDATE citation_urls
    SET brand = CASE
      WHEN split_part(domain, '.', 1) IN ('www','m','en','blog','mobile','shop','store','app','go','get','my','help','support','mail','api','cdn','media','news','jobs','careers')
        THEN split_part(domain, '.', 2)
      ELSE split_part(domain, '.', 1)
    END
    WHERE session_id = $1 AND domain IS NOT NULL AND brand IS NULL
  `, [sessionId]);
}

async function tagMentionedBrands(sessionId: number, brandNames: string[]): Promise<void> {
  if (!brandNames.length) return;
  const { pool } = await import("./db");

  // Ensure columns exist
  await pool.query(`ALTER TABLE citation_urls ADD COLUMN IF NOT EXISTS mentioned_brands TEXT`);
  await pool.query(`ALTER TABLE citation_urls ADD COLUMN IF NOT EXISTS brand_context JSONB`);

  // Case-insensitive brand name match across a text blob → comma-separated list
  function matchBrands(text: string): string {
    const lower = text.toLowerCase();
    return brandNames.filter(b => lower.includes(b.toLowerCase())).join(", ");
  }

  // For each brand found in page text, extract ~400 chars of surrounding prose
  // This becomes the "How they appear" verbatim language sent to Claude
  function extractBrandContext(text: string): Record<string, string> {
    const context: Record<string, string> = {};
    for (const brand of brandNames) {
      const idx = text.toLowerCase().indexOf(brand.toLowerCase());
      if (idx === -1) continue;
      // Expand to sentence boundaries within ±350 chars
      const start = Math.max(0, idx - 280);
      const end = Math.min(text.length, idx + brand.length + 280);
      let snippet = text.slice(start, end).replace(/\s+/g, " ").trim();
      // Trim to nearest sentence start/end if possible
      const sentStart = snippet.indexOf(". ");
      if (sentStart > 0 && sentStart < 80) snippet = snippet.slice(sentStart + 2);
      const sentEnd = snippet.lastIndexOf(". ");
      if (sentEnd > snippet.length - 80 && sentEnd > 0) snippet = snippet.slice(0, sentEnd + 1);
      if (snippet.length > 30) context[brand] = snippet.trim();
    }
    return context;
  }

  // ── Pass 1: fast URL+title check (no fetch needed) ─────────────────────────
  const { rows: untagged } = await pool.query(
    `SELECT id, url, title, citation_count FROM citation_urls
     WHERE session_id = $1 AND mentioned_brands IS NULL
     ORDER BY citation_count DESC`,
    [sessionId]
  );

  const needsFetch: typeof untagged = [];

  for (const row of untagged) {
    const combined = `${row.url ?? ""} ${row.title ?? ""}`;
    const matched = matchBrands(combined);
    if (matched || (row.citation_count ?? 0) <= 2) {
      await pool.query(`UPDATE citation_urls SET mentioned_brands = $1 WHERE id = $2`, [matched, row.id]);
    } else {
      needsFetch.push(row);
    }
  }

  // ── Pass 2: context-backfill for rows tagged in a prior run but missing context
  const { rows: needsContext } = await pool.query(
    `SELECT id, url, title, citation_count FROM citation_urls
     WHERE session_id = $1
       AND mentioned_brands IS NOT NULL AND mentioned_brands != ''
       AND brand_context IS NULL
     ORDER BY citation_count DESC
     LIMIT 60`,
    [sessionId]
  );

  // ── Pass 3: fetch page body — both new unmatched URLs and context-backfill ──
  const toFetch = [...needsFetch.slice(0, 50), ...needsContext];

  async function fetchAndTag(row: any, contextOnly = false) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7000);
      const resp = await fetch(row.url, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AnswerMonkBot/1.0)" },
      });
      clearTimeout(timer);
      const html = await resp.text();
      const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
      const matched = contextOnly ? undefined : matchBrands(text);
      const context = extractBrandContext(text);
      const contextJson = Object.keys(context).length > 0 ? context : null;

      if (contextOnly) {
        await pool.query(
          `UPDATE citation_urls SET brand_context = $1 WHERE id = $2`,
          [contextJson, row.id]
        );
      } else {
        await pool.query(
          `UPDATE citation_urls SET mentioned_brands = $1, brand_context = $2 WHERE id = $3`,
          [matched ?? "", contextJson, row.id]
        );
      }
    } catch {
      if (!contextOnly) {
        await pool.query(`UPDATE citation_urls SET mentioned_brands = '' WHERE id = $1`, [row.id]);
      }
    }
  }

  const CONCURRENCY = 5;
  // Mark which rows are context-only (already had mentioned_brands from a prior run)
  const contextOnlyIds = new Set(needsContext.map((r: any) => r.id));
  const queue = [...needsFetch.slice(0, 50), ...needsContext];
  async function worker() {
    while (queue.length > 0) {
      const row = queue.shift();
      if (row) await fetchAndTag(row, contextOnlyIds.has(row.id));
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
}

function requireAdmin(req: any, res: any, next: any) {
  next();
}

async function runLlmClassification(sessionId: number): Promise<{ updated: number; total: number; tokens: number; costUsd: number }> {
  const { pool } = await import("./db");

  // Fetch one representative URL per domain (highest-cited URL for each domain).
  // Classifying at the domain level reduces API calls from ~6 chunks (422 URLs)
  // to ~2 chunks (~150 domains), cutting classification time by ~65%.
  const { rows: domainRows } = await pool.query<{ domain: string; url: string; title: string }>(
    `SELECT DISTINCT ON (domain) domain, url, title
     FROM citation_urls
     WHERE session_id = $1 AND domain IS NOT NULL AND url IS NOT NULL
     ORDER BY domain, citation_count DESC NULLS LAST`,
    [sessionId]
  );
  if (domainRows.length === 0) return { updated: 0, total: 0, tokens: 0, costUsd: 0 };

  // Also get total URL count for reporting
  const { rows: countRows } = await pool.query<{ cnt: string }>(
    `SELECT COUNT(*) AS cnt FROM citation_urls WHERE session_id = $1 AND url IS NOT NULL`,
    [sessionId]
  );
  const totalUrls = parseInt(countRows[0]?.cnt ?? "0", 10);

  const VALID_CATEGORIES = [
    "Community Thread", "Jobs Listing", "Social Media Profile",
    "Government / Regulatory", "Market Research", "News / PR",
    "Review Platform", "Directory Listing", "Comparison Article",
    "Brand Blog / Article", "Brand About / Contact", "Brand Service Page",
    "Brand Homepage", "Brand Inner Page",
  ];

  const CHUNK_SIZE = 80;
  const chunks: typeof domainRows[] = [];
  for (let i = 0; i < domainRows.length; i += CHUNK_SIZE) chunks.push(domainRows.slice(i, i + CHUNK_SIZE));

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  const domainClassifications: { domain: string; category: string }[] = [];

  for (const chunk of chunks) {
    const domainList = chunk.map((r, i) =>
      `${i + 1}. domain: ${r.domain} | title: ${r.title || "(no title)"} | example_url: ${r.url}`
    ).join("\n");

    const systemPrompt = `You are a website domain classifier. Classify each domain into exactly one of these categories based on what the domain is as a whole:
${VALID_CATEGORIES.map(c => `- "${c}"`).join("\n")}

Rules:
- "Brand Homepage": the root/primary website of a brand or company
- "Brand Service Page": a brand's own service/product pages
- "Brand Blog / Article": a brand's own blog or editorial content
- "Brand About / Contact": about, team, contact, FAQ, accreditation pages
- "Brand Inner Page": any other page on a brand's own domain
- "Review Platform": third-party review sites (Trustpilot, Doctify, Okadoc, GoProfiled, etc.)
- "Directory Listing": health/business directories, aggregator listings
- "News / PR": news sites, press releases, media outlets
- "Comparison Article": "best X", "top 10", comparison or guide sites
- "Government / Regulatory": .gov domains, regulatory authority sites
- "Community Thread": Reddit, Quora, forums, expat communities
- "Social Media Profile": LinkedIn, Instagram, Facebook, Twitter/X
- "Market Research": Statista, Mordor Intelligence, market report sites
- "Jobs Listing": Indeed, LinkedIn jobs, careers sites

Classify the domain as a whole, not just the example URL. Return ONLY valid JSON: {"classifications": [{"id": <number>, "category": "<category>"}, ...]}. No extra text.`;

    const userPrompt = `Classify these ${chunk.length} domains:\n${domainList}`;

    const response = await anthropicClassifier.messages.create({
      model: "claude-sonnet-4-5",
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      max_tokens: 2000,
      temperature: 0.1,
    });

    totalInputTokens += response.usage?.input_tokens || 0;
    totalOutputTokens += response.usage?.output_tokens || 0;

    let parsed: any = null;
    try {
      const raw = response.content[0].type === "text" ? response.content[0].text : "{}";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      const obj = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
      parsed = Array.isArray(obj) ? obj : (obj.classifications || obj.results || obj.urls || Object.values(obj)[0]);
    } catch { parsed = []; }

    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        const rowIndex = (item.id ?? 0) - 1;
        const row = chunk[rowIndex];
        if (row && VALID_CATEGORIES.includes(item.category)) {
          domainClassifications.push({ domain: row.domain, category: item.category });
        }
      }
    }
  }

  // Apply each domain's classification to ALL citation_urls rows for that domain in one UPDATE
  let totalUpdated = 0;
  for (const { domain, category } of domainClassifications) {
    const result = await pool.query(
      `UPDATE citation_urls SET llm_pagetype_classification = $1 WHERE session_id = $2 AND domain = $3`,
      [category, sessionId, domain]
    );
    totalUpdated += result.rowCount ?? 0;
  }

  const costUsd = (totalInputTokens / 1_000_000) * CLAUDE_INPUT_COST_PER_1M
    + (totalOutputTokens / 1_000_000) * CLAUDE_OUTPUT_COST_PER_1M;

  return {
    updated: totalUpdated,
    total: totalUrls,
    tokens: totalInputTokens + totalOutputTokens,
    costUsd: Math.round(costUsd * 10000) / 10000,
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ── Directory HTML routes (must be before React SPA catch-all) ─────────────
  registerSitemapRoutes(app);
  registerMethodologyRoutes(app);
  registerBrandPageRoutes(app);
  registerComparisonPageRoutes(app);

  // ── Public directory listing API (must be before /:location/:category hub) ──
  app.get("/api/directory", async (req: Request, res: Response) => {
    try {
      const locationFilter = typeof req.query.location === "string" ? req.query.location.trim() : null;
      const categoryFilter = typeof req.query.category === "string" ? req.query.category.trim() : null;
      const sortParam      = typeof req.query.sort     === "string" ? req.query.sort.trim()     : "newest";

      const rows = await directoryDb
        .select({
          canonicalSlug:     directoryPagesTable.canonicalSlug,
          canonicalQuery:    directoryPagesTable.canonicalQuery,
          canonicalLocation: directoryPagesTable.canonicalLocation,
          clusterId:         directoryPagesTable.clusterId,
          vertical:          directoryPagesTable.vertical,
          dataVersion:       directoryPagesTable.dataVersion,
          lastUpdatedAt:     directoryPagesTable.lastUpdatedAt,
          firstPublishedAt:  directoryPagesTable.firstPublishedAt,
          evidenceScore:     directoryPagesTable.evidenceScore,
          brandCount:        directoryPagesTable.brandCount,
          rankingSnapshot:   directoryPagesTable.rankingSnapshot,
        })
        .from(directoryPagesTable)
        .where(eqDrizzle(directoryPagesTable.publishStatus, "published"))
        .orderBy(
          sortParam === "oldest"
            ? asc(directoryPagesTable.firstPublishedAt)
            : desc(directoryPagesTable.lastUpdatedAt)
        );

      const toServiceType = (r: { clusterId: string | null; canonicalLocation: string | null }) => {
        const loc = r.canonicalLocation ?? "";
        let st    = r.clusterId ?? "";
        if (loc && st.endsWith(`_${loc}`)) {
          st = st.slice(0, -(loc.length + 1)).replace(/_/g, "-");
        }
        return st;
      };

      const pages = rows
        .map((r) => {
          const snapshot = r.rankingSnapshot as { brands?: { name?: string }[] } | null;
          const brandNames = (snapshot?.brands ?? [])
            .map((b) => b.name ?? "")
            .filter(Boolean)
            .slice(0, 10);
          return {
            slug:           r.canonicalSlug,
            canonicalQuery: r.canonicalQuery ?? "",
            serviceType:    toServiceType(r),
            location:       r.canonicalLocation ?? "",
            vertical:       r.vertical ?? "other",
            dataVersion:    r.dataVersion ?? null,
            lastUpdated:    r.lastUpdatedAt?.toISOString() ?? null,
            firstPublished: r.firstPublishedAt?.toISOString() ?? null,
            evidenceScore:  r.evidenceScore,
            brandCount:     r.brandCount,
            brandNames,
          };
        })
        .filter((p) => {
          if (locationFilter && p.location !== locationFilter) return false;
          if (categoryFilter && p.vertical !== categoryFilter) return false;
          return true;
        });

      const allRows = rows.map((r) => ({
        location: r.canonicalLocation ?? "",
        vertical: r.vertical ?? "other",
      }));

      const locations  = [...new Set(allRows.map((r) => r.location).filter(Boolean))].sort();
      const categories = [...new Set(allRows.map((r) => r.vertical).filter(Boolean))].sort();

      res.json({ pages, filters: { locations, categories } });
    } catch (err) {
      console.error("[api/directory] error:", err);
      res.status(500).json({ message: "Failed to load directory" });
    }
  });

  registerCategoryHubRoutes(app);
  registerQueryPageRoutes(app);

  // ── Landing page submission ────────────────────────────────────────────────
  const isDev = process.env.NODE_ENV !== "production";
  const landingRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 100 : 3,      // per IP (trust proxy enabled — reads real IP via X-Forwarded-For)
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many submissions from this IP. Please try again later." },
  });

  function normalizeDomain(url: string): string {
    try {
      const withProtocol = url.startsWith("http") ? url : `https://${url}`;
      const parsed = new URL(withProtocol);
      return parsed.hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      return url.toLowerCase().replace(/^www\./, "").replace(/^https?:\/\//, "");
    }
  }

  app.post("/api/landing/submit", landingRateLimit, async (req: Request, res: Response) => {
    try {
      const { websiteUrl, _hp } = req.body;

      // Layer 1: Honeypot — bots fill hidden fields, humans don't
      if (_hp && _hp.length > 0) {
        return res.status(200).json({ ok: true }); // silent reject
      }

      // Basic validation
      if (!websiteUrl || typeof websiteUrl !== "string" || websiteUrl.trim().length < 3) {
        return res.status(400).json({ error: "A valid website URL is required." });
      }

      // Domain format validation — must look like a real domain
      const cleanedForValidation = websiteUrl.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "");
      const domainRegex = /^([\w\-]+\.)+[\w\-]{2,}(\/[^\s]*)?$/;
      if (!domainRegex.test(cleanedForValidation)) {
        return res.status(400).json({ error: "Please enter a valid website URL, e.g. yourcompany.com" });
      }

      const domain = normalizeDomain(websiteUrl.trim());
      const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";

      // Layer 2: Domain deduplication — same domain within 6 hours returns cached submission
      const existing = await storage.getLandingSubmissionByDomain(domain, 6);
      if (existing) {
        const ageMs = Date.now() - new Date(existing.createdAt).getTime();
        const isStuckProcessing = existing.status === "processing" && ageMs > 5 * 60 * 1000;
        const isError = existing.status === "error";

        // If PNC died mid-flight (server restart or crash), re-launch it on the same record
        if (isStuckProcessing || isError) {
          console.log(`[Landing] Re-launching PNC for submission ${existing.id} (${existing.status}, age=${Math.round(ageMs / 1000)}s)`);
          await storage.updateLandingSubmission(existing.id, { status: "processing", pncResult: null });
          (async () => {
            try {
              const { result } = await pncExtract(existing.websiteUrl);
              await storage.updateLandingSubmission(existing.id, { status: "complete", pncResult: result as any });
            } catch (err) {
              console.error("[Landing] PNC re-extraction failed:", err);
              await storage.updateLandingSubmission(existing.id, { status: "error" });
            }
          })();
          return res.status(200).json({ id: existing.id, cached: true, status: "processing", pncResult: null });
        }

        const normalizedStatus = existing.status === "done" ? "complete" : existing.status;
        return res.status(200).json({ id: existing.id, cached: true, status: normalizedStatus, pncResult: existing.pncResult });
      }

      // Layer 3: Global analysis cap — 30 total in production
      if (!isDev) {
        const totalCount = await storage.countLandingSubmissions();
        if (totalCount >= 30) {
          return res.status(429).json({ error: "We've reached capacity for now. Join the waitlist and we'll let you know when a spot opens up." });
        }
      }

      // Layer 4: Write to DB
      const submission = await storage.createLandingSubmission({
        websiteUrl: websiteUrl.trim(),
        normalizedDomain: domain,
        ipAddress: ip,
        status: "processing",
      });

      // Kick off PNC extraction asynchronously — don't await
      (async () => {
        try {
          const { result } = await pncExtract(websiteUrl.trim());
          await storage.updateLandingSubmission(submission.id, {
            status: "complete",
            pncResult: result as any,
          });
        } catch (err) {
          console.error("[Landing] PNC extraction failed:", err);
          await storage.updateLandingSubmission(submission.id, { status: "error" });
        }
      })();

      return res.status(201).json({ id: submission.id, cached: false, status: "processing" });
    } catch (err) {
      console.error("[Landing] Submit error:", err);
      return res.status(500).json({ error: "Submission failed. Please try again." });
    }
  });

  app.get("/api/landing/submission/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
      const submissions = await storage.listLandingSubmissions();
      const sub = submissions.find((s) => s.id === id);
      if (!sub) return res.status(404).json({ error: "Not found" });
      const normalized = { ...sub, status: sub.status === "done" ? "complete" : sub.status };
      return res.json(normalized);
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch submission" });
    }
  });
  const CONCURRENCY_LIMIT = 3;

  app.get("/api/capacity", async (_req: Request, res: Response) => {
    try {
      const running = await storage.countRunningSessions();
      return res.json({ running, limit: CONCURRENCY_LIMIT, available: running < CONCURRENCY_LIMIT });
    } catch (err) {
      return res.status(500).json({ error: "Failed to check capacity" });
    }
  });

  app.get("/api/stats", async (_req: Request, res: Response) => {
    try {
      const { pool } = await import("./db");
      const result = await pool.query(
        `SELECT COUNT(*) AS total FROM multi_segment_sessions
         WHERE parent_session_id IS NULL`
      );
      const total = parseInt(result.rows[0]?.total ?? "0", 10);
      return res.json({ auditsCompleted: total });
    } catch (err) {
      console.error("[stats] query failed:", err);
      return res.json({ auditsCompleted: 0 });
    }
  });

  app.get("/api/landing/submissions", async (_req: Request, res: Response) => {
    try {
      const submissions = await storage.listLandingSubmissions();
      return res.json(submissions);
    } catch (err) {
      return res.status(500).json({ error: "Failed to list submissions" });
    }
  });

  app.get("/api/waitlist", async (_req: Request, res: Response) => {
    try {
      const entries = await storage.listWaitlistEntries();
      return res.json(entries);
    } catch (err) {
      return res.status(500).json({ error: "Failed to list waitlist" });
    }
  });

  app.post("/api/waitlist", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        website: z.string().min(1),
        email: z.string().email(),
        submissionId: z.number().int().positive().optional(),
      });
      const { website, email, submissionId } = schema.parse(req.body);
      await storage.createWaitlistEntry(website, email, submissionId);
      return res.status(201).json({ ok: true });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid email or website" });
      return res.status(500).json({ error: "Failed to join waitlist" });
    }
  });

  app.post("/api/landing/run-analysis", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        submissionId: z.number().int().positive(),
        services: z.array(z.string().min(1)).min(1),
        customers: z.array(z.string().min(1)).min(1),
        city: z.string().min(1),
        engines: z.array(z.enum(["chatgpt", "gemini", "claude"])).min(1).optional(),
      });
      const { submissionId, services, customers, city, engines } = schema.parse(req.body);
      console.log(`[AnswerMonk] run-analysis received — engines from client: ${JSON.stringify(engines ?? "not sent (fallback will apply)")}`);

      const submissions = await storage.listLandingSubmissions();
      const submission = submissions.find((s) => s.id === submissionId);
      if (!submission) return res.status(404).json({ error: "Submission not found" });

      // Capacity check — queue if 3 analyses already running
      const running = await storage.countRunningSessions();
      if (running >= CONCURRENCY_LIMIT) {
        return res.status(200).json({
          queued: true,
          website: submission.normalizedDomain,
          submissionId,
        });
      }

      // Mark as running so capacity counter picks it up immediately
      await storage.updateLandingSubmission(submissionId, { status: "running" } as any);

      const url = submission.websiteUrl;

      const { result: pncResult } = await pncClassifyGenerate(services, customers, city, url);

      const brandName = (pncResult as any).business_name || submission.normalizedDomain || "Brand";
      const brandDomain = submission.normalizedDomain || undefined;

      const segments: any[] = [
        ...((pncResult as any).by_service || []).map((group: any, i: number) => ({
          id: `svc-${i}`,
          persona: group.service,
          seedType: group.service,
          serviceType: group.service,
          customerType: null,
          customerTypeEnabled: false,
          location: city,
          prompts: (group.prompts || []).map((p: any, j: number) => ({ id: `svc-${i}-p${j}`, text: p.text })),
          scoringResult: null,
        })),
        ...((pncResult as any).by_customer || []).map((group: any, i: number) => ({
          id: `cust-${i}`,
          persona: group.customer,
          seedType: group.customer,
          serviceType: null,
          customerType: group.customer,
          customerTypeEnabled: true,
          location: city,
          prompts: (group.prompts || []).map((p: any, j: number) => ({ id: `cust-${i}-p${j}`, text: p.text })),
          scoringResult: null,
        })),
      ];

      const firstService = (Array.isArray(services) ? services[0] : "") || "";
      const rawSlug = firstService && city
        ? `${firstService}-in-${city}`
        : firstService || city || brandName;
      const sessionSlug = rawSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

      const session = await storage.createMultiSegmentSession({
        brandName,
        brandDomain: brandDomain || null,
        slug: sessionSlug || null,
        promptsPerSegment: 8,
        segments,
        sessionType: "landing_guided",
      });

      // Fire scoring for all segments in parallel — 150ms stagger to spread API burst
      (async () => {
        const updatedSegments = segments.map((s: any) => ({ ...s }));
        const stagger = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

        const results = await Promise.allSettled(
          segments.map(async (seg: any, i: number) => {
            await stagger(i * 150);
            const scoringRes = await runScoring(
              seg.prompts as any,
              brandName,
              brandDomain,
              undefined,
              undefined,
              undefined,
              engines ?? ["chatgpt", "gemini", "claude"],
            );
            updatedSegments[i] = {
              ...seg,
              scoringResult: {
                score: scoringRes.score,
                raw_runs: scoringRes.raw_runs.map((r: any) => ({
                  prompt_id: r.prompt_id,
                  prompt_text: (seg.prompts as any[]).find((p: any) => p.id === r.prompt_id)?.text || "",
                  engine: r.engine,
                  cluster: r.cluster,
                  raw_text: r.raw_text,
                  citations: r.citations || [],
                  candidates: r.extraction?.candidates || [],
                  brand_found: r.match?.brand?.brand_found ?? false,
                  brand_rank: r.match?.brand?.brand_rank ?? null,
                  webSearchStatus: r.webSearchStatus,
                })),
              },
            };
            await storage.updateMultiSegmentSessionSegments(session.id, updatedSegments);
            console.log(`[Landing] Scored segment ${i + 1}/${segments.length} for session ${session.id}`);
          }),
        );

        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed > 0) console.warn(`[Landing] ${failed}/${segments.length} segment(s) failed for session ${session.id}`);

        // Final authoritative write — guarantees correct state regardless of intermediate write ordering
        await storage.updateMultiSegmentSessionSegments(session.id, updatedSegments);

        console.log(`[Landing] All segments complete for session ${session.id}`);
        // Populate citation_urls from the stored scoring data so the authority scan can run
        populateCitationUrls(session.id).then(async () => {
          console.log(`[Landing] citation_urls populated for session ${session.id}`);
          try {
            const classifyResult = await runLlmClassification(session.id);
            console.log(`[Landing] Auto-classified ${classifyResult.updated}/${classifyResult.total} URLs for session ${session.id} ($${classifyResult.costUsd})`);
          } catch (classifyErr) {
            console.error(`[Landing] citation_urls classify error for session ${session.id}:`, classifyErr);
          }
        }).catch((e) => console.error(`[Landing] citation_urls populate error for session ${session.id}:`, e));
        // Mark submission as done so the slot frees up
        storage.updateLandingSubmission(submissionId, { status: "done" } as any).catch(() => {});
        // Auto-publish to GEO directory — fire-and-forget, never blocks the response
        syncSessionToDirectory(session.id).then((r) => {
          console.log(`[dir-sync] Landing session ${session.id}: published=${r.published} skipped=${r.skipped} errors=${r.errors.length}`);
        }).catch((e) => console.error("[dir-sync] Landing hook error:", e));
      })();

      return res.status(201).json({ sessionId: session.id });
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid request" });
      console.error("[Landing] run-analysis error:", err);
      return res.status(500).json({ error: err.message || "Analysis setup failed" });
    }
  });

  // ── End landing page submission ────────────────────────────────────────────

  app.post(api.eval.run.path, async (req, res) => {
    try {
      const parsed = EvalRequestSchema.parse(req.body);
      const { query, brand, engine, webSearch } = parsed;

      const result = await queryEngine(engine, query, brand, webSearch);

      const response = {
        engine,
        query,
        brand,
        found_state: result.presenceState,
        pos: result.brandPosition,
        top10_brands: result.topBrands,
        raw_answer_text: result.rawText,
        citations: [],
        ts: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        console.error("Engine eval error:", err);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  /**
   * Aggregator: consumes engineOutputs (real or stub) and returns two scores + leaderboard
   */
  app.post(api.aggregate.run.path, async (req, res) => {
    try {
      const parsed = AggregateRequestSchema.parse(req.body);
      const { query, brand, weights, rankDecayP, engineOutputs } = parsed;

      const presenceByEngine: Record<string, 0 | 1 | 2> = { chatgpt: 0, gemini: 0, claude: 0, deepseek: 0 };
      const posByEngine: Record<string, number | null> = {};
      const rawResponses: Record<string, string> = {};

      const brandData = new Map<string, { freq: number; positions: Record<string, number | null> }>();

      for (const out of engineOutputs) {
        presenceByEngine[out.engine] = out.presenceState as 0 | 1 | 2;
        posByEngine[out.engine] = out.position ?? null;
        if (out.rawAnswerText) {
          rawResponses[out.engine] = out.rawAnswerText;
        }

        for (let i = 0; i < out.topBrands.length; i++) {
          const k = out.topBrands[i].trim();
          if (!k) continue;
          const existing = brandData.get(k) || { freq: 0, positions: {} };
          existing.freq += 1;
          existing.positions[out.engine] = i + 1;
          brandData.set(k, existing);
        }
      }

      const presence = presenceScore(presenceByEngine, weights);
      const ranking = rankScore(posByEngine, weights, rankDecayP);

      const leaderboard = [...brandData.entries()]
        .filter(([name]) => name.length < 60 && name.split(/\s+/).length <= 8)
        .map(([name, data]) => {
          const compPresenceByEngine: Record<string, 0 | 1 | 2> = { chatgpt: 0, gemini: 0, claude: 0, deepseek: 0 };
          const compPosByEngine: Record<string, number | null> = { chatgpt: null, gemini: null, claude: null, deepseek: null };
          for (const [eng, pos] of Object.entries(data.positions)) {
            if (pos !== null) {
              compPresenceByEngine[eng] = pos <= 3 ? 2 : 1;
              compPosByEngine[eng] = pos;
            }
          }
          const compPresence = presenceScore(compPresenceByEngine, weights);
          const compRanking = rankScore(compPosByEngine, weights, rankDecayP);
          return { name, freq: data.freq, presenceScore: compPresence, rankingScore: compRanking };
        })
        .sort((a, b) => b.presenceScore - a.presenceScore || b.rankingScore - a.rankingScore)
        .slice(0, 10);

      const response = {
        query,
        brand,
        weights,
        rankDecayP,
        presenceScore: presence,
        rankingScore: ranking,
        perEngine: { presenceByEngine, posByEngine, rawResponses },
        leaderboard,
        ts: new Date().toISOString(),
      };

      // Store result in DB for history
      await storage.createAnalysisResult({
        query,
        brand,
        presenceScore: presence,
        rankScore: ranking,
        engineScores: { presenceByEngine, posByEngine },
      });

      res.status(200).json(response);
    } catch (err) {
       if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get(api.history.list.path, async (req, res) => {
    const history = await storage.getAnalysisHistory();
    res.json(history);
  });

  app.post("/api/promptsets", async (req, res) => {
    try {
      const profile = BuyerIntentProfileSchema.parse(req.body.profile ?? req.body);
      const seed = req.body.seed ? Number(req.body.seed) : undefined;
      const VALID_COUNTS = [3, 5, 10, 15, 20];
      const rawCount = req.body.result_count ? Number(req.body.result_count) : undefined;
      const resultCount = rawCount && VALID_COUNTS.includes(rawCount) ? rawCount : undefined;
      const result = generatePromptSet(profile, { seed, resultCount });
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors.map((e) => e.message).join(", ") });
      } else {
        console.error("Prompt generation error:", err);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  const MARKETING_MODIFIERS = [
    "HubSpot", "Salesforce", "Marketo", "Mailchimp", "ActiveCampaign",
    "Semrush", "Ahrefs", "Moz", "Google Analytics", "Google Ads",
    "Meta Ads", "Hootsuite", "Sprout Social", "Canva", "Figma",
    "Klaviyo", "Brevo", "ConvertKit", "Unbounce", "Webflow",
    "Buffer", "Later", "Loomly", "Sprinklr", "Brandwatch",
    "BuzzSumo", "Clearscope", "Surfer SEO", "Jasper", "Copy.ai",
    "Hotjar", "Crazy Egg", "Optimizely", "VWO", "Google Tag Manager",
    "Zapier", "Make", "Notion", "Asana", "Monday.com",
    "Wistia", "Vidyard", "Loom", "Calendly", "Typeform",
  ];

  app.get("/api/promptgen/presets", (req, res) => {
    const persona = req.query.persona as string;
    const AGENCY_PERSONAS = ["marketing_agency", "seo_agency", "performance_marketing_agency", "content_marketing_agency", "social_media_agency", "web_design_agency", "pr_agency", "branding_agency", "digital_marketing_agency"];
    if (AGENCY_PERSONAS.includes(persona)) {
      res.json({
        services: MARKETING_CHANNELS,
        verticals: MARKETING_VERTICALS,
        modifiers: MARKETING_MODIFIERS,
        decision_makers: DECISION_MAKERS,
        budget_tiers: Object.keys(BUDGET_ADJECTIVES.marketing_agency),
      });
    } else if (persona === "automation_consultant") {
      res.json({
        services: AUTOMATION_SERVICES,
        verticals: AUTOMATION_VERTICALS,
        modifiers: AUTOMATION_KNOWN_TOOLS.slice(0, 40),
        decision_makers: DECISION_MAKERS,
        budget_tiers: Object.keys(BUDGET_ADJECTIVES.automation_consultant),
      });
    } else if (persona === "corporate_cards_provider") {
      res.json({
        services: CORPORATE_CARDS_SERVICES,
        verticals: CORPORATE_CARDS_VERTICALS,
        modifiers: CORPORATE_CARDS_MODIFIERS,
        decision_makers: DECISION_MAKERS,
        budget_tiers: Object.keys(BUDGET_ADJECTIVES.corporate_cards_provider),
      });
    } else if (persona === "expense_management_software") {
      res.json({
        services: EXPENSE_MANAGEMENT_SERVICES,
        verticals: EXPENSE_MANAGEMENT_VERTICALS,
        modifiers: EXPENSE_MANAGEMENT_MODIFIERS,
        decision_makers: DECISION_MAKERS,
        budget_tiers: Object.keys(BUDGET_ADJECTIVES.expense_management_software),
      });
    } else if (persona === "accounting_automation") {
      res.json({
        services: ACCOUNTING_AUTOMATION_SERVICES,
        verticals: ACCOUNTING_AUTOMATION_VERTICALS,
        modifiers: ACCOUNTING_AUTOMATION_MODIFIERS,
        decision_makers: DECISION_MAKERS,
        budget_tiers: Object.keys(BUDGET_ADJECTIVES.accounting_automation),
      });
    } else if (persona === "invoice_management") {
      res.json({
        services: INVOICE_MANAGEMENT_SERVICES,
        verticals: INVOICE_MANAGEMENT_VERTICALS,
        modifiers: INVOICE_MANAGEMENT_MODIFIERS,
        decision_makers: DECISION_MAKERS,
        budget_tiers: Object.keys(BUDGET_ADJECTIVES.invoice_management),
      });
    } else if ((CM_PERSONAS as readonly string[]).includes(persona)) {
      res.json({
        services: CREDIT_MANAGEMENT_SERVICES,
        verticals: CREDIT_MANAGEMENT_VERTICALS,
        modifiers: CREDIT_MANAGEMENT_MODIFIERS,
        decision_makers: DECISION_MAKERS,
        budget_tiers: Object.keys(BUDGET_ADJECTIVES.invoice_reminder_software),
      });
    } else if (persona === "restaurant") {
      res.json({
        services: RESTAURANT_OFFERINGS,
        verticals: RESTAURANT_VERTICALS,
        modifiers: RESTAURANT_MODIFIERS,
        decision_makers: DECISION_MAKERS,
        budget_tiers: Object.keys(BUDGET_ADJECTIVES.restaurant),
      });
    } else if (persona === "construction_management") {
      res.json({
        services: CONSTRUCTION_MANAGEMENT_SERVICES,
        verticals: CONSTRUCTION_MANAGEMENT_VERTICALS,
        modifiers: CONSTRUCTION_MANAGEMENT_MODIFIERS,
        decision_makers: DECISION_MAKERS,
        budget_tiers: Object.keys(BUDGET_ADJECTIVES.construction_management),
      });
    } else if (persona === "in_home_healthcare" || persona === "at_home_healthcare") {
      res.json({
        services: HEALTHCARE_SERVICES,
        verticals: HEALTHCARE_VERTICALS,
        modifiers: HEALTHCARE_MODIFIERS,
        decision_makers: DECISION_MAKERS,
        budget_tiers: Object.keys(BUDGET_ADJECTIVES[persona as keyof typeof BUDGET_ADJECTIVES]),
      });
    } else if (persona === "weight_loss_help") {
      res.json({
        services: WEIGHT_LOSS_SERVICES,
        verticals: WEIGHT_LOSS_VERTICALS,
        modifiers: WEIGHT_LOSS_MODIFIERS,
        decision_makers: DECISION_MAKERS,
        budget_tiers: Object.keys(BUDGET_ADJECTIVES.weight_loss_help),
      });
    } else if (persona === "in_home_blood_tests" || persona === "at_home_blood_tests") {
      res.json({
        services: BLOOD_TEST_SERVICES,
        verticals: BLOOD_TEST_VERTICALS,
        modifiers: BLOOD_TEST_MODIFIERS,
        decision_makers: DECISION_MAKERS,
        budget_tiers: Object.keys(BUDGET_ADJECTIVES[persona as keyof typeof BUDGET_ADJECTIVES]),
      });
    } else if (persona === "real_estate_agency" || persona === "real_estate_broker" || persona === "property_dealer") {
      res.json({
        services: REAL_ESTATE_SERVICES,
        verticals: REAL_ESTATE_VERTICALS,
        modifiers: REAL_ESTATE_MODIFIERS,
        decision_makers: DECISION_MAKERS,
        budget_tiers: Object.keys(BUDGET_ADJECTIVES[persona as keyof typeof BUDGET_ADJECTIVES]),
      });
    } else {
      const agencyPreset = {
          services: MARKETING_CHANNELS,
          verticals: MARKETING_VERTICALS,
          modifiers: MARKETING_MODIFIERS,
          decision_makers: DECISION_MAKERS,
        };
      res.json({
        marketing_agency: agencyPreset,
        seo_agency: agencyPreset,
        performance_marketing_agency: agencyPreset,
        content_marketing_agency: agencyPreset,
        social_media_agency: agencyPreset,
        web_design_agency: agencyPreset,
        pr_agency: agencyPreset,
        branding_agency: agencyPreset,
        digital_marketing_agency: agencyPreset,
        automation_consultant: {
          services: AUTOMATION_SERVICES,
          verticals: AUTOMATION_VERTICALS,
          modifiers: AUTOMATION_KNOWN_TOOLS.slice(0, 40),
          decision_makers: DECISION_MAKERS,
        },
        corporate_cards_provider: {
          services: CORPORATE_CARDS_SERVICES,
          verticals: CORPORATE_CARDS_VERTICALS,
          modifiers: CORPORATE_CARDS_MODIFIERS,
          decision_makers: DECISION_MAKERS,
        },
        expense_management_software: {
          services: EXPENSE_MANAGEMENT_SERVICES,
          verticals: EXPENSE_MANAGEMENT_VERTICALS,
          modifiers: EXPENSE_MANAGEMENT_MODIFIERS,
          decision_makers: DECISION_MAKERS,
        },
        accounting_automation: {
          services: ACCOUNTING_AUTOMATION_SERVICES,
          verticals: ACCOUNTING_AUTOMATION_VERTICALS,
          modifiers: ACCOUNTING_AUTOMATION_MODIFIERS,
          decision_makers: DECISION_MAKERS,
        },
        invoice_management: {
          services: INVOICE_MANAGEMENT_SERVICES,
          verticals: INVOICE_MANAGEMENT_VERTICALS,
          modifiers: INVOICE_MANAGEMENT_MODIFIERS,
          decision_makers: DECISION_MAKERS,
        },
        ...Object.fromEntries(
          CM_PERSONAS.map((p) => [p, {
            services: CREDIT_MANAGEMENT_SERVICES,
            verticals: CREDIT_MANAGEMENT_VERTICALS,
            modifiers: CREDIT_MANAGEMENT_MODIFIERS,
            decision_makers: DECISION_MAKERS,
          }])
        ),
        restaurant: {
          services: RESTAURANT_OFFERINGS,
          verticals: RESTAURANT_VERTICALS,
          modifiers: RESTAURANT_MODIFIERS,
          decision_makers: DECISION_MAKERS,
        },
        construction_management: {
          services: CONSTRUCTION_MANAGEMENT_SERVICES,
          verticals: CONSTRUCTION_MANAGEMENT_VERTICALS,
          modifiers: CONSTRUCTION_MANAGEMENT_MODIFIERS,
          decision_makers: DECISION_MAKERS,
        },
        in_home_healthcare: {
          services: HEALTHCARE_SERVICES,
          verticals: HEALTHCARE_VERTICALS,
          modifiers: HEALTHCARE_MODIFIERS,
          decision_makers: DECISION_MAKERS,
        },
        at_home_healthcare: {
          services: HEALTHCARE_SERVICES,
          verticals: HEALTHCARE_VERTICALS,
          modifiers: HEALTHCARE_MODIFIERS,
          decision_makers: DECISION_MAKERS,
        },
        weight_loss_help: {
          services: WEIGHT_LOSS_SERVICES,
          verticals: WEIGHT_LOSS_VERTICALS,
          modifiers: WEIGHT_LOSS_MODIFIERS,
          decision_makers: DECISION_MAKERS,
        },
        in_home_blood_tests: {
          services: BLOOD_TEST_SERVICES,
          verticals: BLOOD_TEST_VERTICALS,
          modifiers: BLOOD_TEST_MODIFIERS,
          decision_makers: DECISION_MAKERS,
        },
        at_home_blood_tests: {
          services: BLOOD_TEST_SERVICES,
          verticals: BLOOD_TEST_VERTICALS,
          modifiers: BLOOD_TEST_MODIFIERS,
          decision_makers: DECISION_MAKERS,
        },
        real_estate_agency: {
          services: REAL_ESTATE_SERVICES,
          verticals: REAL_ESTATE_VERTICALS,
          modifiers: REAL_ESTATE_MODIFIERS,
          decision_makers: DECISION_MAKERS,
        },
        real_estate_broker: {
          services: REAL_ESTATE_SERVICES,
          verticals: REAL_ESTATE_VERTICALS,
          modifiers: REAL_ESTATE_MODIFIERS,
          decision_makers: DECISION_MAKERS,
        },
        property_dealer: {
          services: REAL_ESTATE_SERVICES,
          verticals: REAL_ESTATE_VERTICALS,
          modifiers: REAL_ESTATE_MODIFIERS,
          decision_makers: DECISION_MAKERS,
        },
      });
    }
  });

  const ScoringRequestSchema = z.object({
    brand_name: z.string().default(""),
    brand_domain: z.string().optional(),
    mode: z.enum(["micro", "quick", "full"]),
    prompts: z.array(z.object({
      id: z.string(),
      text: z.string(),
      cluster: z.string().optional(),
      shape: z.string().optional(),
      slots_used: z.record(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      modifier_included: z.boolean().optional(),
      geo_included: z.boolean().optional(),
    })),
    profile: z.object({
      persona: z.string(),
      services: z.array(z.string()),
      verticals: z.array(z.string()),
      geo: z.string().nullable(),
    }).optional(),
    source: z.string().optional(),
    engines: z.array(z.enum(["chatgpt", "gemini", "claude"])).min(1).optional(),
  });

  app.post("/api/scoring/run", async (req, res) => {
    try {
      const parsed = ScoringRequestSchema.parse(req.body);
      let promptsToRun = parsed.prompts;

      if (parsed.mode === "micro") {
        promptsToRun = selectMicroPanel(parsed.prompts as any);
      } else if (parsed.mode === "quick") {
        promptsToRun = selectMiniPanel(parsed.prompts as any);
      }

      const job = await storage.createScoringJob({
        brandName: parsed.brand_name,
        brandDomain: parsed.brand_domain || null,
        mode: parsed.mode,
        status: "running",
        promptCount: promptsToRun.length,
        engineCount: parsed.engines?.length ?? 3,
        source: parsed.source || null,
      });

      const categoryHint = parsed.profile?.persona
        ? PERSONA_CATEGORY_LABELS[parsed.profile.persona]
        : undefined;

      try {
        const result = await runScoring(
          promptsToRun as any,
          parsed.brand_name,
          parsed.brand_domain,
          undefined,
          undefined,
          categoryHint,
          parsed.engines,
        );

        await storage.updateScoringJob(job.id, {
          status: "completed",
          resultJson: result.score as any,
          rawData: {
            runs: result.raw_runs.map((r) => ({
              prompt_id: r.prompt_id,
              prompt_text: (promptsToRun as any[]).find((p: any) => p.id === r.prompt_id)?.text || "",
              cluster: r.cluster,
              engine: r.engine,
              raw_text: r.raw_text,
              citations: r.citations || [],
              candidates: r.extraction.candidates,
              valid: r.extraction.valid,
              brand_found: r.match.brand.brand_found,
              brand_rank: r.match.brand.brand_rank,
              match_tier: r.match.brand.match_tier,
              webSearchStatus: r.webSearchStatus,
              fallbackReason: r.fallbackReason,
            })),
            brand_identity: result.brand_identity,
            profile: parsed.profile || null,
          } as any,
        });

        if (parsed.profile) {
          try {
            await storage.upsertSavedProfile({
              brandName: parsed.brand_name,
              brandDomain: parsed.brand_domain || null,
              persona: parsed.profile.persona,
              verticals: parsed.profile.verticals,
              services: parsed.profile.services,
              modifiers: [],
              geo: parsed.profile.geo || null,
              budgetTier: "mid",
              decisionMakers: [],
            });
          } catch (profileErr) {
            console.warn("[scoring] Auto-save profile failed (non-fatal):", profileErr);
          }
        }

        res.status(200).json({
          job_id: job.id,
          score: result.score,
          prompts_used: promptsToRun.length,
          mode: parsed.mode,
          raw_runs: result.raw_runs.map((r) => ({
            prompt_id: r.prompt_id,
            prompt_text: (promptsToRun as any[]).find((p: any) => p.id === r.prompt_id)?.text || "",
            cluster: r.cluster,
            engine: r.engine,
            raw_text: r.raw_text,
            citations: r.citations || [],
            candidates: r.extraction.candidates,
            brand_found: r.match.brand.brand_found,
            brand_rank: r.match.brand.brand_rank,
          })),
        });
      } catch (runErr) {
        await storage.updateScoringJob(job.id, { status: "failed" });
        throw runErr;
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors.map((e) => e.message).join(", ") });
      } else {
        console.error("Scoring error:", err);
        res.status(500).json({ message: "Scoring failed. Please try again." });
      }
    }
  });

  app.get("/api/scoring/history", async (_req, res) => {
    const history = await storage.getScoringHistory();
    res.json(history);
  });

  app.get("/api/scoring/v2-groups", async (_req, res) => {
    try {
      const groups = await storage.getV2SegmentGroups();
      res.json(groups);
    } catch (err) {
      console.error("Error fetching V2 segment groups:", err);
      res.status(500).json({ message: "Failed to load V2 segment groups" });
    }
  });

  app.get("/api/scoring/v2-groups/:groupKey", async (req, res) => {
    try {
      const group = await storage.getV2SegmentGroup(req.params.groupKey);
      if (!group) {
        return res.status(404).json({ message: "V2 group not found" });
      }

      const segments = group.segments.map((job) => {
        const profile = (job.rawData as any)?.profile;
        const result = job.resultJson as any;
        const rawRuns = (job.rawData as any)?.runs;
        return {
          persona: profile?.persona || "",
          seedType: profile?.seedType || (profile?.persona === "restaurant" ? "restaurants" : "providers"),
          customerType: profile?.verticals?.[0] || "",
          location: profile?.geo || "",
          resultCount: job.promptCount,
          prompts: null,
          scoringResult: result ? {
            score: result,
            raw_runs: rawRuns || [],
          } : null,
          jobId: job.id,
        };
      });

      res.json({
        id: group.groupKey,
        brandName: group.brandName,
        brandDomain: group.brandDomain,
        promptsPerSegment: group.segments[0]?.promptCount || 0,
        segments,
        createdAt: group.createdAt,
      });
    } catch (err) {
      console.error("Error fetching V2 group:", err);
      res.status(500).json({ message: "Failed to load V2 group" });
    }
  });

  app.get("/api/profiles", async (_req, res) => {
    try {
      const profiles = await storage.listSavedProfiles();
      res.json(profiles);
    } catch (err) {
      console.error("Error listing profiles:", err);
      res.status(500).json({ message: "Failed to load profiles" });
    }
  });

  app.post("/api/profiles", async (req, res) => {
    try {
      const parsed = insertSavedProfileSchema.parse(req.body);
      const profile = await storage.upsertSavedProfile(parsed);
      res.status(200).json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors.map((e) => e.message).join(", ") });
      } else {
        console.error("Error saving profile:", err);
        res.status(500).json({ message: "Failed to save profile" });
      }
    }
  });

  app.post("/api/multisegment/sessions", async (req, res) => {
    try {
      const parsed = insertMultiSegmentSessionSchema.parse(req.body);
      const session = await storage.createMultiSegmentSession(parsed);
      res.status(201).json(session);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors.map((e) => e.message).join(", ") });
      } else {
        console.error("Error saving multi-segment session:", err);
        res.status(500).json({ message: "Failed to save session" });
      }
    }
  });

  const SegmentPatchSchema = z.object({
    segments: z.array(z.object({
      persona: z.string(),
      seedType: z.string().optional(),
      serviceType: z.string().optional(),
      customerType: z.string().optional(),
      customerTypeEnabled: z.boolean().optional(),
      location: z.string().optional(),
      resultCount: z.number().optional(),
      prompts: z.any().nullable().optional(),
      scoringResult: z.any().nullable().optional(),
    })),
  });

  app.patch("/api/multisegment/sessions/:id/segments", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid session ID" });
        return;
      }
      const parsed = SegmentPatchSchema.parse(req.body);
      await storage.updateMultiSegmentSessionSegments(id, parsed.segments);
      res.json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors.map((e) => e.message).join(", ") });
      } else {
        console.error("Error updating session segments:", err);
        res.status(500).json({ message: "Failed to update session" });
      }
    }
  });

  let _directoryRecentCache: { data: any[]; ts: number } | null = null;
  const DIRECTORY_CACHE_TTL_MS = 60_000;

  app.get("/api/directory/recent", async (_req, res) => {
    try {
      if (_directoryRecentCache && Date.now() - _directoryRecentCache.ts < DIRECTORY_CACHE_TTL_MS) {
        res.setHeader("Cache-Control", "public, max-age=60");
        return res.json(_directoryRecentCache.data);
      }

      const { pool } = await import("./db");
      const result = await pool.query(`
        SELECT
          mss.id,
          mss.brand_name,
          mss.brand_domain,
          mss.slug,
          mss.created_at,
          ps.elem AS primary_seg
        FROM multi_segment_sessions mss,
        LATERAL (
          SELECT elem
          FROM jsonb_array_elements(mss.segments) AS elem
          WHERE (elem->'scoringResult') IS NOT NULL
            AND jsonb_typeof(elem->'scoringResult') = 'object'
          LIMIT 1
        ) ps
        WHERE (mss.session_type IS DISTINCT FROM 'competitor')
          AND mss.segments IS NOT NULL
          AND jsonb_array_length(mss.segments) > 0
        ORDER BY mss.created_at DESC
        LIMIT 12
      `);

      const tiles = result.rows
        .filter((row: any) => row.primary_seg)
        .map((row: any) => {
          const seg = row.primary_seg;
          const GENERIC = ["service", "customer", "providers", "provider"];
          const rawSeed   = (seg?.seedType  || "").trim();
          const seedType  = GENERIC.includes(rawSeed.toLowerCase())
            ? (seg?.serviceType || seg?.customerType || seg?.persona || rawSeed).trim()
            : (rawSeed || seg?.serviceType || seg?.customerType || seg?.persona || "").trim();
          const location  = (seg?.location  || "").trim();
          const persona   = (seg?.persona   || seg?.customerType || "").trim();
          const sr        = seg?.scoringResult ?? {};
          const score     = sr?.score ?? {};
          const competitors: any[] = (score.competitors ?? []).slice(0, 3);
          const eb        = score.engine_breakdown ?? {};

          let query = "";
          if (seedType && location)       query = `Best ${seedType} in ${location}`;
          else if (seedType)              query = `Best ${seedType}`;
          else if (persona && location)   query = `Best ${persona} in ${location}`;
          else if (persona)               query = `Best ${persona}`;
          else                            query = row.brand_name ?? "GEO Analysis";

          return {
            id:          row.id,
            sessionId:   row.id,
            slug:        row.slug ?? null,
            query,
            category:    seedType || persona || "Analysis",
            brandName:   row.brand_name,
            brandDomain: row.brand_domain,
            topBrand:    competitors[0]?.name ?? null,
            topScore:    Math.round((competitors[0]?.share ?? 0) * 100),
            rivals:      competitors.slice(1, 3).map((c: any) => ({ name: c.name, share: Math.round((c.share ?? 0) * 100) })).filter((c: any) => c.name),
            engines: {
              chatgpt: (eb.chatgpt?.appearance_rate ?? 0) > 0,
              gemini:  (eb.gemini?.appearance_rate  ?? 0) > 0,
              claude:  (eb.claude?.appearance_rate  ?? 0) > 0,
            },
            createdAt: row.created_at,
          };
        });

      _directoryRecentCache = { data: tiles, ts: Date.now() };
      res.setHeader("Cache-Control", "public, max-age=60");
      res.json(tiles);
    } catch (err) {
      console.error("[directory/recent] error:", err);
      res.status(500).json({ message: "Failed to load recent analyses" });
    }
  });

  // ── Search index — lightweight payload for client-side fuzzy search ──────────
  let _searchIndexCache: { data: any[]; ts: number } | null = null;
  const SEARCH_INDEX_TTL_MS = 5 * 60 * 1000;

  app.get("/api/directory/search-index", async (_req, res) => {
    try {
      if (_searchIndexCache && Date.now() - _searchIndexCache.ts < SEARCH_INDEX_TTL_MS) {
        res.setHeader("Cache-Control", "public, max-age=300");
        return res.json(_searchIndexCache.data);
      }

      const { pool } = await import("./db");
      const result = await pool.query(`
        SELECT id, brand_name, brand_domain, slug, segments
        FROM multi_segment_sessions
        WHERE session_type IS DISTINCT FROM 'competitor'
          AND (brand_name IS NOT NULL AND brand_name != '' OR brand_domain IS NOT NULL AND brand_domain != '')
        ORDER BY created_at DESC
        LIMIT 500
      `);

      const GENERIC = ["service", "customer", "providers", "provider"];

      const index = result.rows.map((row: any) => {
        const segments: any[] = Array.isArray(row.segments) ? row.segments : [];

        // derive category + query from first scorable segment
        let category = "";
        let query = "";
        for (const seg of segments) {
          const sr = seg?.scoringResult ?? {};
          if (!sr.score) continue;
          const rawSeed = (seg?.seedType || "").trim();
          const seedType = GENERIC.includes(rawSeed.toLowerCase())
            ? (seg?.serviceType || seg?.customerType || seg?.persona || rawSeed).trim()
            : (rawSeed || seg?.serviceType || seg?.customerType || seg?.persona || "").trim();
          const location = (seg?.location || "").trim();
          category = seedType || (seg?.persona || "").trim();
          query = seedType && location ? `${seedType} in ${location}` : seedType || location;
          break;
        }

        // topBrands: top-3 from primary segment (what's visible on the card)
        // otherBrands: remaining ranked brands (share > 0) from all segments
        const topBrandSet = new Set<string>();
        const otherBrandSet = new Set<string>();
        let primaryDone = false;
        for (const seg of segments) {
          const sr = seg?.scoringResult ?? {};
          if (!sr.score) continue;
          const competitors: any[] = sr.score.competitors ?? [];
          competitors.forEach((c: any, idx: number) => {
            if (!c?.name || (c?.share ?? 0) <= 0) return;
            const name = c.name.trim();
            if (!primaryDone && idx < 3) topBrandSet.add(name);
            else otherBrandSet.add(name);
          });
          primaryDone = true; // after first scorable segment, rest go to otherBrands
        }

        const ownBrand = (row.brand_name || "").trim();
        const domain = (row.brand_domain || "").trim();
        // strip TLD so "dosteli.de" → "dosteli" is also searchable
        const domainRoot = domain.replace(/\.[a-z]{2,}$/i, "");
        return {
          id: row.id,
          slug: row.slug ?? null,
          category,
          query,
          ownBrand,
          domain,
          domainRoot,
          topBrands: Array.from(topBrandSet),
          otherBrands: Array.from(otherBrandSet).filter(b => !topBrandSet.has(b)),
        };
      }).filter((r: any) => r.category || r.ownBrand || r.domain);

      _searchIndexCache = { data: index, ts: Date.now() };
      res.setHeader("Cache-Control", "public, max-age=300");
      res.json(index);
    } catch (err) {
      console.error("[directory/search-index] error:", err);
      res.status(500).json({ message: "Failed to build search index" });
    }
  });

  app.get("/api/multisegment/sessions", async (_req, res) => {
    try {
      const sessions = await storage.listMultiSegmentSessions();
      res.json(sessions);
    } catch (err) {
      console.error("Error listing multi-segment sessions:", err);
      res.status(500).json({ message: "Failed to load sessions" });
    }
  });

  app.get("/api/multisegment/by-slug/:slug", async (req, res) => {
    try {
      const session = await storage.getMultiSegmentSessionBySlug(req.params.slug);
      if (!session) {
        res.status(404).json({ message: "Session not found" });
        return;
      }
      res.json(session);
    } catch (err) {
      console.error("Error getting session by slug:", err);
      res.status(500).json({ message: "Failed to load session" });
    }
  });

  app.get("/api/multisegment/sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid session ID" });
        return;
      }
      const session = await storage.getMultiSegmentSession(id);
      if (!session) {
        res.status(404).json({ message: "Session not found" });
        return;
      }
      res.json(session);
    } catch (err) {
      console.error("Error getting multi-segment session:", err);
      res.status(500).json({ message: "Failed to load session" });
    }
  });

  app.post("/api/competitor-lens/analyse", async (req, res) => {
    try {
      const schema = z.object({
        competitorName: z.string().min(1),
        segments: z.record(z.array(z.any())),
        brandName: z.string().optional(),
      });
      const parsed = schema.parse(req.body);
      const result = reScoreForCompetitor(parsed.segments, parsed.competitorName, parsed.brandName);
      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors.map((e) => e.message).join(", ") });
      } else {
        console.error("Competitor lens error:", err);
        res.status(500).json({ message: "Failed to analyse competitor" });
      }
    }
  });

  app.post("/api/competitor-lens/list", async (req, res) => {
    try {
      const schema = z.object({
        segments: z.record(z.array(z.any())),
      });
      const parsed = schema.parse(req.body);
      const competitors = getAvailableCompetitors(parsed.segments);
      res.json(competitors);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors.map((e) => e.message).join(", ") });
      } else {
        console.error("Competitor list error:", err);
        res.status(500).json({ message: "Failed to list competitors" });
      }
    }
  });

  app.post("/api/competitor-lens/report", async (req, res) => {
    try {
      const schema = z.object({
        competitorName: z.string().min(1),
        sessionId: z.number().optional(),
        groupKey: z.string().optional(),
        segments: z.array(z.any()),
        brandName: z.string().optional(),
        brandDomain: z.string().optional(),
      });
      const parsed = schema.parse(req.body);

      if (parsed.sessionId) {
        const parentSession = await storage.getMultiSegmentSession(parsed.sessionId);
        if (parentSession && (parentSession as any).sessionType === "competitor") {
          res.status(400).json({ message: "Cannot generate competitor reports from a competitor session. Use the original brand session instead." });
          return;
        }
      }

      const competitorSegments = buildCompetitorReportSegments(
        parsed.segments,
        parsed.competitorName,
      );

      const report = await generateReport({
        id: parsed.sessionId || 0,
        brandName: parsed.competitorName,
        brandDomain: null,
        segments: competitorSegments as any,
        citationReport: null,
      });

      const promptsPerSegment = competitorSegments[0]?.resultCount || 3;
      const compSession = await storage.createMultiSegmentSession({
        brandName: parsed.competitorName,
        brandDomain: null,
        promptsPerSegment,
        segments: competitorSegments as any,
        sessionType: "competitor",
        parentSessionId: parsed.sessionId || null,
        competitorName: parsed.competitorName,
        parentBrandName: parsed.brandName || null,
        cachedReport: report,
      });

      res.json({ report, competitorSessionId: compSession.id });
    } catch (err) {
      console.error("Competitor report error:", err);
      res.status(500).json({ message: "Failed to generate competitor report" });
    }
  });

  app.post("/api/competitor-lens/batch-reports", async (req, res) => {
    try {
      const schema = z.object({
        competitors: z.array(z.string().min(1)).min(1).max(20),
        sessionId: z.number().optional(),
        segments: z.array(z.any()),
        brandName: z.string().optional(),
        brandDomain: z.string().optional(),
      });
      const parsed = schema.parse(req.body);

      if (parsed.sessionId) {
        const parentSession = await storage.getMultiSegmentSession(parsed.sessionId);
        if (parentSession && (parentSession as any).sessionType === "competitor") {
          res.status(400).json({ message: "Cannot generate competitor reports from a competitor session." });
          return;
        }
      }

      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      const results: Array<{ name: string; slug: string; sessionId: number; success: boolean; error?: string }> = [];

      for (let i = 0; i < parsed.competitors.length; i++) {
        const competitorName = parsed.competitors[i];
        const slug = competitorName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

        res.write(`data: ${JSON.stringify({ type: "progress", index: i, total: parsed.competitors.length, name: competitorName, status: "generating" })}\n\n`);

        try {
          let finalSlug = slug;
          const existingBySlug = await storage.getMultiSegmentSessionBySlug(slug);
          if (existingBySlug) {
            if ((existingBySlug as any).sessionType === "competitor" && (existingBySlug as any).competitorName?.toLowerCase() === competitorName.toLowerCase()) {
              results.push({ name: competitorName, slug, sessionId: existingBySlug.id, success: true });
              res.write(`data: ${JSON.stringify({ type: "progress", index: i, total: parsed.competitors.length, name: competitorName, status: "exists", slug, sessionId: existingBySlug.id })}\n\n`);
              continue;
            }
            let suffix = 2;
            while (await storage.getMultiSegmentSessionBySlug(`${slug}-${suffix}`)) {
              suffix++;
            }
            finalSlug = `${slug}-${suffix}`;
          }

          const competitorSegments = buildCompetitorReportSegments(parsed.segments, competitorName);
          const report = await generateReport({
            id: parsed.sessionId || 0,
            brandName: competitorName,
            brandDomain: null,
            segments: competitorSegments as any,
            citationReport: null,
          });

          const promptsPerSegment = competitorSegments[0]?.resultCount || 3;
          const compSession = await storage.createMultiSegmentSession({
            brandName: competitorName,
            brandDomain: null,
            promptsPerSegment,
            segments: competitorSegments as any,
            sessionType: "competitor",
            parentSessionId: parsed.sessionId || null,
            competitorName,
            parentBrandName: parsed.brandName || null,
            cachedReport: report,
            slug: finalSlug,
          });

          results.push({ name: competitorName, slug: finalSlug, sessionId: compSession.id, success: true });
          res.write(`data: ${JSON.stringify({ type: "progress", index: i, total: parsed.competitors.length, name: competitorName, status: "done", slug: finalSlug, sessionId: compSession.id })}\n\n`);
        } catch (err: any) {
          console.error(`Batch report error for ${competitorName}:`, err);
          results.push({ name: competitorName, slug: finalSlug, sessionId: 0, success: false, error: err.message });
          res.write(`data: ${JSON.stringify({ type: "progress", index: i, total: parsed.competitors.length, name: competitorName, status: "error", error: err.message })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ type: "complete", results })}\n\n`);
      res.end();
    } catch (err) {
      console.error("Batch competitor report error:", err);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to start batch report generation" });
      } else {
        res.write(`data: ${JSON.stringify({ type: "error", message: "Batch processing failed" })}\n\n`);
        res.end();
      }
    }
  });

  app.post("/api/v2configs", async (req, res) => {
    try {
      const parsed = insertSavedV2ConfigSchema.parse(req.body);
      const config = await storage.createV2Config(parsed);
      res.status(201).json(config);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors.map((e) => e.message).join(", ") });
      } else {
        console.error("Error saving V2 config:", err);
        res.status(500).json({ message: "Failed to save config" });
      }
    }
  });

  app.get("/api/v2configs", async (_req, res) => {
    try {
      const configs = await storage.listV2Configs();
      res.json(configs);
    } catch (err) {
      console.error("Error listing V2 configs:", err);
      res.status(500).json({ message: "Failed to load configs" });
    }
  });

  app.delete("/api/multisegment/sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid session ID" });
        return;
      }
      await storage.deleteMultiSegmentSession(id);
      res.status(204).end();
    } catch (err) {
      console.error("Error deleting multi-segment session:", err);
      res.status(500).json({ message: "Failed to delete session" });
    }
  });

  app.delete("/api/v2configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid config ID" });
        return;
      }
      await storage.deleteV2Config(id);
      res.status(204).end();
    } catch (err) {
      console.error("Error deleting V2 config:", err);
      res.status(500).json({ message: "Failed to delete config" });
    }
  });

  app.get("/api/scoring/results/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: "Invalid job ID" });
      return;
    }
    const job = await storage.getScoringJob(id);
    if (!job) {
      res.status(404).json({ message: "Scoring job not found" });
      return;
    }
    res.json(job);
  });

  const PanelAnalyzeSchema = z.object({
    brand_name: z.string().min(1),
    website_url: z.string().min(3),
    city: z.string().min(1),
    seeded_services: z.array(z.string()).optional().default([]),
  });

  app.post("/api/panel/analyze", async (req, res) => {
    try {
      const parsed = PanelAnalyzeSchema.parse(req.body);
      const result = await analyzePanelWebsite(
        parsed.brand_name,
        parsed.website_url,
        parsed.city,
        parsed.seeded_services,
      );

      res.status(200).json({
        brand_name: parsed.brand_name,
        website_url: parsed.website_url,
        city: parsed.city,
        industry: result.industryPrimary || "General",
        service_keywords: [...new Set([
          ...parsed.seeded_services,
          ...result.extractedProfile.primary_services,
          ...result.extractedProfile.secondary_services,
        ])],
        territories: result.territories.map((t) => ({
          territory_id: t.territory.id,
          label: t.territory.label,
          score: t.score,
          matched_keywords: t.matchedKeywords.map((k) => k.phrase),
        })),
        aliases: result.aliases,
        prompts: result.prompts,
        raw_extraction: result.extractedProfile,
        all_territory_scores: result.allTerritoryScores.map((s) => ({
          territory_id: s.territory.id,
          label: s.territory.label,
          score: s.score,
          matched_keywords: s.matchedKeywords.map((k) => k.phrase),
        })),
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors.map((e) => e.message).join(", ") });
      } else if (err instanceof Error) {
        console.error("Panel analyze error:", err);
        res.status(500).json({ message: err.message });
      } else {
        res.status(500).json({ message: "Panel analysis failed" });
      }
    }
  });

  const PanelScoreSchema = z.object({
    brand_name: z.string().min(1),
    brand_domain: z.string().optional(),
    city: z.string().min(1),
    prompts: z.array(z.object({
      id: z.string(),
      territory_id: z.string(),
      territory_label: z.string(),
      query_type: z.string(),
      text: z.string(),
      cluster: z.string(),
    })),
    aliases: z.array(z.object({
      original: z.string(),
      tokens: z.string(),
      compact: z.string(),
    })).optional(),
    panel_context: z.any().optional(),
  });

  app.post("/api/panel/score", async (req, res) => {
    try {
      const parsed = PanelScoreSchema.parse(req.body);

      const promptsForRunner = parsed.prompts.map((p) => ({
        id: p.id,
        cluster: p.cluster,
        shape: "open" as const,
        text: p.text,
        slots_used: { territory: p.territory_id },
        tags: [p.territory_label, p.query_type],
        modifier_included: false,
        geo_included: p.query_type === "local",
      }));

      const job = await storage.createScoringJob({
        brandName: parsed.brand_name,
        brandDomain: parsed.brand_domain || null,
        mode: "panel",
        status: "running",
        promptCount: promptsForRunner.length,
        engineCount: 3,
      });

      try {
        const result = await runScoring(
          promptsForRunner,
          parsed.brand_name,
          parsed.brand_domain,
          undefined,
          parsed.aliases,
        );

        await storage.updateScoringJob(job.id, {
          status: "completed",
          resultJson: result.score as any,
          rawData: {
            runs: result.raw_runs.map((r) => ({
              prompt_id: r.prompt_id,
              prompt_text: promptsForRunner.find((p) => p.id === r.prompt_id)?.text || "",
              cluster: r.cluster,
              engine: r.engine,
              raw_text: r.raw_text,
              citations: r.citations || [],
              candidates: r.extraction.candidates,
              valid: r.extraction.valid,
              brand_found: r.match.brand.brand_found,
              brand_rank: r.match.brand.brand_rank,
              match_tier: r.match.brand.match_tier,
            })),
            brand_identity: result.brand_identity,
            panel_context: parsed.panel_context,
            aliases: parsed.aliases,
            profile: {
              persona: "panel",
              services: (parsed.panel_context as any)?.service_keywords || [],
              verticals: [(parsed.panel_context as any)?.industry || ""],
              geo: parsed.city || null,
            },
          } as any,
        });

        res.status(200).json({
          job_id: job.id,
          score: result.score,
          prompts_used: promptsForRunner.length,
          mode: "panel",
          raw_runs: result.raw_runs.map((r) => ({
            prompt_id: r.prompt_id,
            prompt_text: promptsForRunner.find((p) => p.id === r.prompt_id)?.text || "",
            cluster: r.cluster,
            engine: r.engine,
            raw_text: r.raw_text,
            citations: r.citations || [],
            candidates: r.extraction.candidates,
            brand_found: r.match.brand.brand_found,
            brand_rank: r.match.brand.brand_rank,
          })),
        });
      } catch (runErr) {
        await storage.updateScoringJob(job.id, { status: "failed" });
        throw runErr;
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors.map((e) => e.message).join(", ") });
      } else {
        console.error("Panel scoring error:", err);
        res.status(500).json({ message: "Panel scoring failed. Please try again." });
      }
    }
  });

  const InsightsRequestSchema = z.object({
    jobId: z.number().int().positive(),
    competitorNames: z.array(z.string()).default([]),
    force: z.boolean().default(false),
  });

  app.post("/api/insights/analyze", async (req, res) => {
    try {
      const parsed = InsightsRequestSchema.parse(req.body);
      const job = await storage.getScoringJob(parsed.jobId);
      if (!job) {
        res.status(404).json({ message: "Scoring job not found" });
        return;
      }
      if (job.status !== "completed") {
        res.status(400).json({ message: "Scoring job must be completed before running insights" });
        return;
      }

      if (parsed.force) {
        await storage.updateScoringJob(parsed.jobId, { insightsJson: null, insightsStatus: null } as any);
      }

      await storage.updateScoringJob(parsed.jobId, { insightsStatus: "running" } as any);

      const rawData = job.rawData as any;
      const runs = rawData?.runs || [];

      const storedProfile = rawData?.profile || {};
      const persona = storedProfile.persona || "general";
      const services: string[] = storedProfile.services || [];
      const verticals: string[] = storedProfile.verticals || [];
      const geo: string | null = storedProfile.geo || null;

      const promptTexts: string[] = runs
        .map((r: any) => r.prompt_text)
        .filter((t: string) => t && t.length > 0);

      const citationsByEngine: Record<string, string[]> = {};
      const aiResponses: Record<string, string[]> = {};

      for (const run of runs) {
        const engine = run.engine as string;
        if (!citationsByEngine[engine]) citationsByEngine[engine] = [];
        if (!aiResponses[engine]) aiResponses[engine] = [];

        if (run.citations && Array.isArray(run.citations)) {
          for (const c of run.citations) {
            const url = typeof c === "string" ? c : c.url;
            if (url && typeof url === "string") {
              citationsByEngine[engine].push(url);
            }
          }
        }
        if (run.raw_text) {
          aiResponses[engine].push(run.raw_text);
        }
      }

      const competitorNames = parsed.competitorNames.length > 0
        ? parsed.competitorNames
        : extractCompetitorsFromRuns(runs, job.brandName);

      const input: InsightsInput = {
        jobId: parsed.jobId,
        brandName: job.brandName,
        brandDomain: job.brandDomain || null,
        persona,
        services,
        verticals,
        geo,
        citationsByEngine,
        competitorNames,
        aiResponses,
        promptTexts,
      };

      const report = await runInsightsAnalysis(input, (progress) => {
        console.log(`[insights] Job ${parsed.jobId}: ${progress.stage} - ${progress.percent}% - ${progress.message}`);
      });

      await storage.updateScoringJob(parsed.jobId, {
        insightsJson: report as any,
        insightsStatus: "completed",
      } as any);

      res.json(report);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors.map((e) => e.message).join(", ") });
      } else {
        console.error("Insights analysis error:", err);
        const jobId = req.body?.jobId;
        if (jobId) {
          await storage.updateScoringJob(jobId, { insightsStatus: "failed" } as any).catch(() => {});
        }
        res.status(500).json({ message: "Insights analysis failed. Please try again." });
      }
    }
  });

  app.get("/api/insights/:jobId", async (req, res) => {
    const jobId = parseInt(req.params.jobId, 10);
    if (isNaN(jobId)) {
      res.status(400).json({ message: "Invalid job ID" });
      return;
    }
    const job = await storage.getScoringJob(jobId);
    if (!job) {
      res.status(404).json({ message: "Scoring job not found" });
      return;
    }
    if (!job.insightsJson) {
      res.status(404).json({ message: "No insights available for this job", insightsStatus: job.insightsStatus || null });
      return;
    }
    res.json(job.insightsJson);
  });

  function extractCompetitorsFromRuns(runs: any[], brandName: string): string[] {
    const brandLower = brandName.toLowerCase();
    const competitorCounts = new Map<string, number>();

    for (const run of runs) {
      const candidates = run.candidates || [];
      for (const c of candidates) {
        const name = typeof c === "string" ? c : c.name || c;
        if (typeof name === "string" && name.toLowerCase() !== brandLower) {
          competitorCounts.set(name, (competitorCounts.get(name) || 0) + 1);
        }
      }
    }

    return Array.from(competitorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name]) => name);
  }

  const analysisProgress = new Map<string, { step: string; detail: string; pct: number; startedAt: number; crawlDone?: number; crawlTotal?: number; crawlSuccess?: number; crawlFailed?: number }>();

  // ── Sub-process timing log (per session) ──────────────────────────────────
  const subProcessLog = new Map<number, { name: string; label: string; startedAt: number | null; completedAt: number | null }[]>();
  function spInit(sId: number) {
    subProcessLog.set(sId, [
      { name: "persist_db",       label: "Persist to DB",         startedAt: null, completedAt: null },
      { name: "domain_classify",  label: "Domain Classification",  startedAt: null, completedAt: null },
      { name: "tag_brands",       label: "Tag Brand Mentions",     startedAt: null, completedAt: null },
      { name: "claude_insights",  label: "AI Insights",            startedAt: null, completedAt: null },
    ]);
    setTimeout(() => subProcessLog.delete(sId), 10 * 60 * 1000);
  }
  function spStart(sId: number, name: string) {
    const log = subProcessLog.get(sId);
    if (!log) return;
    const p = log.find(e => e.name === name);
    if (p) p.startedAt = Date.now();
  }
  function spDone(sId: number, name: string) {
    const log = subProcessLog.get(sId);
    if (!log) return;
    const p = log.find(e => e.name === name);
    if (p && !p.completedAt) p.completedAt = Date.now();
  }

  (globalThis as any).__getActiveAnalyses = () => {
    const active: any[] = [];
    analysisProgress.forEach((v, k) => {
      if (v.step !== "complete" && v.step !== "error") {
        active.push({ key: k, ...v });
      }
    });
    return active;
  };

  app.get("/api/segment-analysis/progress/:key", (req, res) => {
    const key = req.params.key;
    const progress = analysisProgress.get(key);
    if (!progress) {
      res.status(404).json({ step: "unknown", detail: "No active analysis", pct: 0 });
      return;
    }
    res.json(progress);
  });

  app.get("/api/segment-analysis/subprocess-log/:sessionId", (req, res) => {
    const sid = parseInt(req.params.sessionId, 10);
    if (isNaN(sid)) { res.status(400).json({ message: "Invalid session ID" }); return; }
    res.json(subProcessLog.get(sid) ?? []);
  });

  app.post("/api/segment-analysis/analyze", async (req, res) => {
    let progressKey = `temp-${Date.now()}`;
    try {
      const { brandName, segments, brandDomain, sessionId, groupKey, progressKey: clientProgressKey } = req.body;
      if (!brandName || !segments || !Array.isArray(segments)) {
        res.status(400).json({ message: "brandName and segments array required" });
        return;
      }

      progressKey = clientProgressKey || (sessionId ? `session-${sessionId}` : groupKey ? `group-${groupKey}` : `temp-${Date.now()}`);

      const normalizedSegments = segments.map((seg: any) => ({
        id: seg.id,
        persona: seg.persona,
        seedType: seg.seedType,
        customerType: seg.customerType,
        location: seg.location,
        scoringResult: seg.scoringResult ? {
          score: seg.scoringResult.score,
          raw_runs: (seg.scoringResult.raw_runs || []).map((run: any) => ({
            prompt: run.prompt || run.prompt_text || run.prompt_id || "",
            engine: run.engine,
            response: run.response || run.raw_text || "",
            brands_found: run.brands_found || (run.candidates ? run.candidates.map((c: any) => typeof c === "string" ? c : c.name_raw || c.name || c) : []),
            rank: run.rank ?? run.brand_rank ?? null,
            citations: run.citations || [],
            cluster: run.cluster,
          })),
        } : undefined,
      }));

      analysisProgress.set(progressKey, { step: "starting", detail: "Initializing analysis...", pct: 0, startedAt: Date.now() });
      if (sessionId && typeof sessionId === "number") spInit(sessionId);

      // Respond immediately so the HTTP proxy doesn't time-out the long crawl
      res.json({ progressKey, status: "started" });

      // Run the full crawl + persist pipeline in the background
      (async () => {
        try {
          const report = await runSegmentAnalysis(brandName, normalizedSegments, (step, detail, pct, extra?: any) => {
            console.log(`[segment-analysis] ${step}: ${detail} (${pct}%)`);
            const prev = analysisProgress.get(progressKey);
            const entry: any = { step, detail, pct, startedAt: prev?.startedAt || Date.now() };
            if (extra) {
              entry.crawlDone = extra.done;
              entry.crawlTotal = extra.total;
              entry.crawlSuccess = extra.success;
              entry.crawlFailed = extra.failed;
            }
            analysisProgress.set(progressKey, entry);
          }, brandDomain || undefined, typeof sessionId === "number" ? sessionId : undefined);

          if (sessionId && typeof sessionId === "number") {
            spStart(sessionId, "persist_db");
            try {
              await storage.updateCitationReport(sessionId, report);
              console.log(`[segment-analysis] Persisted citation report for session ${sessionId}`);
            } catch (persistErr) {
              console.error("Failed to persist citation report:", persistErr);
            }
            syncSessionToDirectory(sessionId).then((r) => {
              console.log(`[dir-sync] Citation hook session ${sessionId}: published=${r.published} skipped=${r.skipped}`);
            }).catch((e) => console.error("[dir-sync] Citation hook error:", e));
            analysisProgress.set(progressKey, { step: "labeling", detail: "Indexing citation URLs…", pct: 99, startedAt: analysisProgress.get(progressKey)?.startedAt || Date.now() });
            try {
              await populateCitationUrls(sessionId);
              console.log(`[segment-analysis] Populated citation_urls for session ${sessionId}`);
            } catch (citErr) {
              console.error("Failed to populate citation_urls:", citErr);
            }
            spDone(sessionId, "persist_db");
            spStart(sessionId, "domain_classify");
            analysisProgress.set(progressKey, { step: "classifying_urls", detail: "Classifying citation page types with AI…", pct: 99.5, startedAt: analysisProgress.get(progressKey)?.startedAt || Date.now() });
            try {
              const classifyResult = await runLlmClassification(sessionId);
              console.log(`[segment-analysis] Auto-classified ${classifyResult.updated}/${classifyResult.total} URLs for session ${sessionId} ($${classifyResult.costUsd})`);
            } catch (classifyErr) {
              console.error("Failed to auto-classify citation URLs:", classifyErr);
            }
            spDone(sessionId, "domain_classify");
          } else if (groupKey && typeof groupKey === "string") {
            try {
              const cacheKey = `group:${groupKey}:citation`;
              await storage.setReportCache(cacheKey, report);
              console.log(`[segment-analysis] Persisted citation report for group key ${groupKey}`);
            } catch (persistErr) {
              console.error("Failed to persist citation report for group key:", persistErr);
            }
          }

          analysisProgress.set(progressKey, { step: "complete", detail: `Done — ${report.totalAccessible} pages crawled, ${report.totalCitationsCrawled - report.totalAccessible} failed`, pct: 100, startedAt: analysisProgress.get(progressKey)?.startedAt || Date.now() });
          setTimeout(() => analysisProgress.delete(progressKey), 60000);
        } catch (bgErr) {
          console.error("Segment analysis background error:", bgErr);
          analysisProgress.set(progressKey, { step: "error", detail: String(bgErr), pct: 0, startedAt: analysisProgress.get(progressKey)?.startedAt || Date.now() });
          setTimeout(() => analysisProgress.delete(progressKey), 30000);
        }
      })();
    } catch (err) {
      console.error("Segment analysis setup error:", err);
      if (!res.headersSent) {
        res.status(500).json({ message: "Analysis setup failed", error: String(err) });
      }
    }
  });

  app.get("/api/citation-urls/summary", async (req, res) => {
    try {
      const sessionId = parseInt(req.query.sessionId as string);
      if (isNaN(sessionId)) { res.status(400).json({ message: "sessionId required" }); return; }
      const { pool } = await import("./db");
      const result = await pool.query(`
        SELECT
          url_category,
          COUNT(*) as total_citations,
          COUNT(DISTINCT url) as total_unique_urls,
          COUNT(*) FILTER (WHERE engine = 'chatgpt') as chatgpt_citations,
          COUNT(DISTINCT url) FILTER (WHERE engine = 'chatgpt') as chatgpt_unique_urls,
          COUNT(*) FILTER (WHERE engine = 'gemini') as gemini_citations,
          COUNT(DISTINCT url) FILTER (WHERE engine = 'gemini') as gemini_unique_urls
        FROM citation_urls
        WHERE session_id = $1
        GROUP BY url_category
        ORDER BY total_citations DESC
      `, [sessionId]);
      res.json({ rows: result.rows, sessionId });
    } catch (err) {
      res.status(500).json({ message: "Failed to load citation URL summary", error: String(err) });
    }
  });

  app.get("/api/citation-urls/by-segment", async (req, res) => {
    try {
      const sessionId = parseInt(req.query.sessionId as string);
      if (isNaN(sessionId)) { res.status(400).json({ message: "sessionId required" }); return; }
      const { pool } = await import("./db");
      const result = await pool.query(`
        SELECT
          segment_persona,
          engine,
          url_category,
          COUNT(*) as citations,
          COUNT(DISTINCT url) as unique_urls
        FROM citation_urls
        WHERE session_id = $1
        GROUP BY segment_persona, engine, url_category
        ORDER BY segment_persona, engine, citations DESC
      `, [sessionId]);
      const segments = [...new Set(result.rows.map((r: any) => r.segment_persona))].sort();
      res.json({ rows: result.rows, segments, sessionId });
    } catch (err) {
      res.status(500).json({ message: "Failed to load segment breakdown", error: String(err) });
    }
  });

  app.get("/api/citation-urls/authority", async (req, res) => {
    try {
      const sessionId = parseInt(req.query.sessionId as string);
      const category = req.query.category as string | undefined;
      if (isNaN(sessionId)) { res.status(400).json({ message: "sessionId required" }); return; }
      const { pool } = await import("./db");
      const brandCats = ["Brand Homepage","Brand Service Page","Brand Inner Page","Brand About / Contact","Brand Blog / Article"];
      const catFilter = category ? `AND url_category = $2` : ``;
      const params: any[] = [sessionId];
      if (category) params.push(category);
      const result = await pool.query(`
        SELECT
          domain,
          url_category,
          COUNT(*) as total_citations,
          COUNT(*) FILTER (WHERE engine = 'chatgpt') as chatgpt_citations,
          COUNT(*) FILTER (WHERE engine = 'gemini') as gemini_citations,
          json_agg(
            json_build_object(
              'url', url,
              'title', title,
              'engine', engine,
              'segment', segment_persona,
              'count', url_count
            ) ORDER BY url_count DESC
          ) as urls
        FROM (
          SELECT domain, url_category, url, title, engine, segment_persona,
            COUNT(*) as url_count
          FROM citation_urls
          WHERE session_id = $1
            AND url_category NOT IN (${brandCats.map(c => `'${c}'`).join(",")})
            ${catFilter}
          GROUP BY domain, url_category, url, title, engine, segment_persona
        ) sub
        GROUP BY domain, url_category
        ORDER BY total_citations DESC
      `, params);

      const catResult = await pool.query(`
        SELECT DISTINCT url_category
        FROM citation_urls
        WHERE session_id = $1
          AND url_category NOT IN (${brandCats.map(c => `'${c}'`).join(",")})
        ORDER BY url_category
      `, [sessionId]);

      res.json({
        domains: result.rows,
        categories: catResult.rows.map((r: any) => r.url_category),
        sessionId,
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to load authority data", error: String(err) });
    }
  });

  app.get("/api/citation-urls/list", async (req, res) => {
    try {
      const sessionId = parseInt(req.query.sessionId as string);
      const category = req.query.category as string | undefined;
      const engine = req.query.engine as string | undefined;
      const domain = req.query.domain as string | undefined;
      if (isNaN(sessionId)) { res.status(400).json({ message: "sessionId required" }); return; }
      const { pool } = await import("./db");
      const conditions = ["session_id = $1"];
      const params: any[] = [sessionId];
      if (category) { params.push(category); conditions.push(`url_category = $${params.length}`); }
      if (engine) { params.push(engine); conditions.push(`engine = $${params.length}`); }
      if (domain) { params.push(domain); conditions.push(`domain = $${params.length}`); }

      if (domain) {
        // Use citation_urls — SUM(citation_count) gives true citation frequency per URL
        const result = await pool.query(`
          SELECT
            url,
            domain,
            MAX(title) as title,
            MAX(llm_pagetype_classification) as llm_pagetype_classification,
            SUM(citation_count) as citation_count,
            MAX(CASE WHEN engine = 'chatgpt' THEN 1 ELSE 0 END) as in_chatgpt,
            MAX(CASE WHEN engine = 'gemini' THEN 1 ELSE 0 END) as in_gemini,
            MAX(CASE WHEN engine = 'claude' THEN 1 ELSE 0 END) as in_claude
          FROM citation_urls
          WHERE session_id = $1 AND domain = $2
          GROUP BY url, domain
          ORDER BY citation_count DESC, url
        `, [sessionId, domain]);
        res.json({ rows: result.rows });
      } else {
        const result = await pool.query(`
          SELECT url, domain, engine, url_category, segment_persona, title,
            COUNT(*) OVER (PARTITION BY url) as citation_count
          FROM citation_urls
          WHERE ${conditions.join(" AND ")}
          ORDER BY citation_count DESC, url
        `, params);
        res.json({ rows: result.rows });
      }
    } catch (err) {
      res.status(500).json({ message: "Failed to load citation URLs", error: String(err) });
    }
  });

  app.get("/api/multi-segment-sessions/:id/citation-mentions", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { res.status(400).json({ message: "Invalid session ID" }); return; }
      const mentions = await storage.getCitationMentions(id);
      res.json({ mentions, total: mentions.length });
    } catch (err) {
      res.status(500).json({ message: "Failed to load citation mentions", error: String(err) });
    }
  });

  app.get("/api/citations/session/:sessionId/rows", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      if (isNaN(sessionId)) return res.status(400).json({ message: "Invalid session ID" });
      const { db } = await import("./db");
      const { citationPageMentions } = await import("@shared/schema");
      const { eq, asc } = await import("drizzle-orm");
      const rows = await db.select().from(citationPageMentions)
        .where(eq(citationPageMentions.sessionId, sessionId))
        .orderBy(asc(citationPageMentions.domainCategory), asc(citationPageMentions.brand), asc(citationPageMentions.domain))
        .limit(5000);
      res.json({ rows, total: rows.length });
    } catch (err) {
      res.status(500).json({ message: "Failed to load citation rows", error: String(err) });
    }
  });

  app.get("/api/multi-segment-sessions/:id/citation-report", async (req, res) => {
    try {
      const id = req.params.id;
      if (id.startsWith("v2auto-")) {
        const cacheKey = `group:${id}:citation`;
        const cached = await storage.getReportCache(cacheKey);
        res.json({ report: cached || null });
        return;
      }
      const numId = parseInt(id, 10);
      if (isNaN(numId)) {
        res.status(400).json({ message: "Invalid session ID" });
        return;
      }
      const session = await storage.getMultiSegmentSession(numId);
      if (!session) {
        res.status(404).json({ message: "Session not found" });
        return;
      }
      res.json({ report: session.citationReport || null });
    } catch (err) {
      res.status(500).json({ message: "Failed to load citation report", error: String(err) });
    }
  });

  app.get("/api/multi-segment-sessions/:id/signal-intelligence", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { res.status(400).json({ message: "Invalid session ID" }); return; }
      const result = await getSignalIntelligence(id);
      res.json({ result: result || null });
    } catch (err) {
      res.status(500).json({ message: "Failed to load signal intelligence", error: String(err) });
    }
  });

  app.post("/api/multi-segment-sessions/:id/signal-intelligence", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { res.status(400).json({ message: "Invalid session ID" }); return; }
      const force = req.body?.force === true || req.query.force === "true";
      const result = await runSignalIntelligence(id, force);
      res.json(result);
    } catch (err) {
      console.error("[signal-intelligence] Error:", err);
      res.status(500).json({ message: String(err) });
    }
  });

  app.get("/api/multi-segment-sessions/:id/citation-sources", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { res.status(400).json({ message: "Invalid session ID" }); return; }

      const { db } = await import("./db");
      const { sql: drizzleSql } = await import("drizzle-orm");

      // Query 1: direct citations (non-ai_platform rows, all engines)
      const directRows = await db.execute(drizzleSql`
        SELECT
          domain,
          domain_category,
          SUM(appearances) as total_appearances,
          MAX(in_chatgpt) as in_chatgpt,
          MAX(in_gemini) as in_gemini,
          MAX(in_claude) as in_claude,
          MAX(segment_count) as segment_count
        FROM (
          SELECT
            domain,
            domain_category,
            COUNT(*) as appearances,
            MAX(CASE WHEN 'chatgpt' = ANY(engines) THEN 1 ELSE 0 END) as in_chatgpt,
            MAX(CASE WHEN 'gemini' = ANY(engines) THEN 1 ELSE 0 END) as in_gemini,
            MAX(CASE WHEN 'claude' = ANY(engines) THEN 1 ELSE 0 END) as in_claude,
            COALESCE(MAX(array_length(segment_indices, 1)), 1) as segment_count
          FROM citation_page_mentions
          WHERE session_id = ${id}
            AND domain_category IS NOT NULL
            AND domain_category != 'ai_platform'
            AND domain IS NOT NULL AND domain != ''
          GROUP BY domain, domain_category, source_type
        ) sub
        GROUP BY domain, domain_category
      `);

      // Query 2: Gemini grounding redirects — extract real domain from resolved_url
      const geminiRows = await db.execute(drizzleSql`
        SELECT
          LOWER(REGEXP_REPLACE(
            REGEXP_REPLACE(resolved_url, '^https?://(www\\.)?', ''),
            '[/?#:].*$', ''
          )) as resolved_domain,
          COUNT(*) as appearances
        FROM citation_page_mentions
        WHERE session_id = ${id}
          AND domain_category = 'ai_platform'
          AND resolved_url IS NOT NULL AND resolved_url != ''
          AND resolved_url NOT LIKE '%vertexaisearch%'
          AND resolved_url NOT LIKE '%googleapis%'
          AND resolved_url NOT LIKE '%google.com%'
        GROUP BY resolved_domain
        HAVING LENGTH(LOWER(REGEXP_REPLACE(
          REGEXP_REPLACE(resolved_url, '^https?://(www\\.)?', ''),
          '[/?#:].*$', ''
        ))) > 3
        ORDER BY appearances DESC
      `);

      // Build a map from the direct rows (use "pending" category — will be overridden by LLM below)
      const domainMap = new Map<string, {
        domain: string; category: string; appearances: number;
        inChatgpt: boolean; inGemini: boolean; inClaude: boolean; segmentCount: number;
      }>();

      for (const row of directRows.rows) {
        const key = String(row.domain).toLowerCase();
        domainMap.set(key, {
          domain: String(row.domain),
          category: "general_web",
          appearances: Number(row.total_appearances),
          inChatgpt: Number(row.in_chatgpt) === 1,
          inGemini: Number(row.in_gemini) === 1,
          inClaude: Number(row.in_claude) === 1,
          segmentCount: Number(row.segment_count),
        });
      }

      // Merge Gemini resolved domains
      for (const row of geminiRows.rows) {
        const resolvedDomain = String(row.resolved_domain || "").trim();
        if (!resolvedDomain || resolvedDomain.length < 4) continue;
        const geminiAppearances = Number(row.appearances);
        const existing = domainMap.get(resolvedDomain);
        if (existing) {
          existing.appearances += geminiAppearances;
          existing.inGemini = true;
        } else {
          domainMap.set(resolvedDomain, {
            domain: resolvedDomain,
            category: "general_web",
            appearances: geminiAppearances,
            inChatgpt: false,
            inGemini: true,
            inClaude: false,
            segmentCount: 1,
          });
        }
      }

      // Fallback: if citation_page_mentions was empty (e.g. landing page sessions),
      // build domainMap directly from citation_urls which is always populated
      if (domainMap.size === 0) {
        const { pool: fallbackPool } = await import("./db");
        const cuRows = await fallbackPool.query(
          `SELECT domain, engine, SUM(citation_count)::int AS total_count
           FROM citation_urls
           WHERE session_id = $1 AND domain IS NOT NULL AND domain != ''
           GROUP BY domain, engine
           ORDER BY domain`,
          [id]
        );
        for (const row of cuRows.rows) {
          const key = String(row.domain).toLowerCase();
          const existing = domainMap.get(key);
          const count = Number(row.total_count);
          const eng = String(row.engine || "");
          if (existing) {
            existing.appearances += count;
            if (eng === "chatgpt") existing.inChatgpt = true;
            if (eng === "gemini") existing.inGemini = true;
            if (eng === "claude") existing.inClaude = true;
          } else {
            domainMap.set(key, {
              domain: String(row.domain),
              category: "general_web",
              appearances: count,
              inChatgpt: eng === "chatgpt",
              inGemini: eng === "gemini",
              inClaude: eng === "claude",
              segmentCount: 1,
            });
          }
        }
        console.log(`[citation-sources] fallback from citation_urls: ${domainMap.size} domains for session ${id}`);
      }

      // Apply LLM modal classification per domain from citation_urls
      // LLM categories map to internal weight categories; any containing "Brand" → "brand"
      const LLM_TO_INTERNAL: Record<string, string> = {
        "Government / Regulatory": "government",
        "News / PR": "news_media",
        "Review Platform": "review_platform",
        "Directory Listing": "directory",
        "Community Thread": "social_media",
        "Social Media Profile": "social_media",
        "Comparison Article": "comparison",
        "Market Research": "comparison",
        "Jobs Listing": "general_web",
      };
      const { pool } = await import("./db");
      const llmResult = await pool.query(
        `SELECT domain, llm_pagetype_classification, COUNT(*) as cnt
         FROM citation_urls
         WHERE session_id = $1 AND llm_pagetype_classification IS NOT NULL AND domain IS NOT NULL
         GROUP BY domain, llm_pagetype_classification
         ORDER BY domain, cnt DESC`,
        [id]
      );
      // Build modal per domain (first row per domain = most frequent category)
      const llmModalMap = new Map<string, string>();
      for (const row of llmResult.rows) {
        const d = String(row.domain).toLowerCase();
        if (!llmModalMap.has(d)) llmModalMap.set(d, String(row.llm_pagetype_classification));
      }
      // Apply to domainMap
      for (const [key, entry] of domainMap.entries()) {
        const llmCat = llmModalMap.get(key);
        if (llmCat) {
          entry.category = llmCat.toLowerCase().includes("brand")
            ? "brand"
            : (LLM_TO_INTERNAL[llmCat] ?? "general_web");
        }
      }

      // Override appearances with SUM(citation_count) from citation_urls so domain total
      // matches the sum of per-URL counts shown in the URL expander
      const cuCountResult = await pool.query(
        `SELECT domain, SUM(citation_count) as total_count
         FROM citation_urls
         WHERE session_id = $1 AND domain IS NOT NULL
         GROUP BY domain`,
        [id]
      );
      for (const row of cuCountResult.rows) {
        const key = String(row.domain).toLowerCase();
        const entry = domainMap.get(key);
        if (entry) entry.appearances = Number(row.total_count);
      }

      const CATEGORY_LABELS: Record<string, string> = {
        government: "Government & Regulatory",
        news_media: "News & Media",
        review_platform: "Review Platforms",
        directory: "Directories",
        social_media: "Social Media",
        general_web: "General Web",
        comparison: "Comparison & Research",
        brand: "Brand / Competitor",
      };

      const grouped: Record<string, any[]> = {};
      for (const entry of domainMap.values()) {
        const cat = entry.category;
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push({
          domain: entry.domain,
          appearances: entry.appearances,
          inChatgpt: entry.inChatgpt,
          inGemini: entry.inGemini,
          inClaude: entry.inClaude,
          segmentCount: entry.segmentCount,
        });
      }

      const categories = Object.entries(grouped)
        .map(([key, domains]) => ({
          key,
          label: CATEGORY_LABELS[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
          domains: domains.sort((a, b) => b.appearances - a.appearances),
          totalDomains: domains.length,
          totalAppearances: domains.reduce((s, d) => s + d.appearances, 0),
        }))
        .sort((a, b) => b.totalAppearances - a.totalAppearances);

      const CATEGORY_WEIGHT: Record<string, number> = {
        government: 1.8,
        news_media: 1.5,
        review_platform: 1.4,
        directory: 1.3,
        social_media: 1.2,
        comparison: 1.1,
        general_web: 1.0,
      };
      const CATEGORY_WHY: Record<string, string> = {
        government: "Government & regulatory credentialing source",
        news_media: "Authoritative media coverage",
        review_platform: "Third-party trust & reviews aggregator",
        directory: "Listing & directory platform",
        social_media: "Public community discussion & social proof",
        general_web: "Third-party general reference",
        comparison: "Comparison / ranking platform",
      };

      const authoritySources = Array.from(domainMap.values())
        .filter(e => e.category !== "brand")
        .map(e => {
          const engineCount = (e.inChatgpt ? 1 : 0) + (e.inGemini ? 1 : 0) + (e.inClaude ? 1 : 0);
          const crossEngineMultiplier = engineCount === 3 ? 2.0 : engineCount === 2 ? 1.5 : 1.0;
          const catWeight = CATEGORY_WEIGHT[e.category] ?? 1.0;
          const authorityScore = Math.round(e.appearances * crossEngineMultiplier * catWeight);
          return {
            domain: e.domain,
            category: e.category,
            categoryLabel: CATEGORY_LABELS[e.category] || e.category,
            why: CATEGORY_WHY[e.category] || "Third-party reference",
            appearances: e.appearances,
            inChatgpt: e.inChatgpt,
            inGemini: e.inGemini,
            inClaude: e.inClaude,
            engineCount,
            authorityScore,
          };
        })
        .sort((a, b) => b.authorityScore - a.authorityScore)
        .slice(0, 25);

      const brandMentions = Array.from(domainMap.values())
        .filter(e => e.category === "brand")
        .map(e => {
          const engineCount = (e.inChatgpt ? 1 : 0) + (e.inGemini ? 1 : 0) + (e.inClaude ? 1 : 0);
          return {
            domain: e.domain,
            appearances: e.appearances,
            inChatgpt: e.inChatgpt,
            inGemini: e.inGemini,
            inClaude: e.inClaude,
            engineCount,
          };
        })
        .sort((a, b) => b.appearances - a.appearances)
        .slice(0, 25);

      res.json({ categories, authoritySources, brandMentions });
    } catch (err) {
      console.error("[citation-sources] Error:", err);
      res.status(500).json({ message: String(err) });
    }
  });

  app.post("/api/multi-segment-sessions/:id/classify-citation-urls", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id, 10);
      if (isNaN(sessionId)) { res.status(400).json({ message: "Invalid session ID" }); return; }
      const result = await runLlmClassification(sessionId);
      if (result.total === 0) { res.status(404).json({ message: "No citation URLs found for this session. Run citation analysis first." }); return; }
      res.json(result);
    } catch (err) {
      console.error("[classify-citation-urls] Error:", err);
      res.status(500).json({ message: String(err) });
    }
  });

  app.get("/api/multi-segment-sessions/:id/report", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid session ID" });
        return;
      }
      const session = await storage.getMultiSegmentSession(id);
      if (!session) {
        const staticPath = path.join(__dirname, "static-reports", `${id}.json`);
        try {
          const fs = await import("fs");
          if (fs.existsSync(staticPath)) {
            const staticData = JSON.parse(fs.readFileSync(staticPath, "utf-8"));
            res.json(staticData);
            return;
          }
        } catch {}
        res.status(404).json({ message: "Session not found" });
        return;
      }
      const force = req.query.force === "true";
      const cachedOnly = req.query.cached_only === "true";
      if (!force && session.cachedReport) {
        res.json({ report: session.cachedReport, cached: true });
        return;
      }
      if (cachedOnly) {
        res.json({ report: null, cached: false });
        return;
      }
      const report = await generateReport({
        id: session.id,
        brandName: session.brandName,
        brandDomain: session.brandDomain,
        createdAt: session.createdAt ? new Date(session.createdAt).toISOString() : undefined,
        segments: Array.isArray(session.segments) ? session.segments as any : [],
        citationReport: session.citationReport as any || null,
      });
      await storage.updateCachedReport(session.id, report);
      res.json({ report });
    } catch (err) {
      res.status(500).json({ message: "Failed to generate report", error: String(err) });
    }
  });

  app.get("/api/scoring/v2-groups/:groupKey/report", async (req, res) => {
    try {
      const groupKey = req.params.groupKey;
      const group = await storage.getV2SegmentGroup(groupKey);
      if (!group) {
        res.status(404).json({ message: "V2 group not found" });
        return;
      }
      if (!group.segments || group.segments.length === 0) {
        res.status(400).json({ message: "No segments found in this session" });
        return;
      }

      const force = req.query.force === "true";
      const cachedOnly = req.query.cached_only === "true";
      const cacheKey = `group:${groupKey}:report`;
      if (!force) {
        const cached = await storage.getReportCache(cacheKey);
        if (cached) {
          res.json({ report: cached, cached: true });
          return;
        }
      }
      if (cachedOnly) {
        res.json({ report: null, cached: false });
        return;
      }

      const segments = group.segments.map((job) => {
        const profile = (job.rawData as any)?.profile;
        const result = job.resultJson as any;
        const rawRuns = (job.rawData as any)?.runs;
        return {
          persona: profile?.persona || "",
          seedType: profile?.seedType || (profile?.persona === "restaurant" ? "restaurants" : "providers"),
          customerType: profile?.verticals?.[0] || "",
          location: profile?.geo || "",
          resultCount: job.promptCount,
          prompts: null,
          scoringResult: result ? {
            score: result,
            raw_runs: rawRuns || [],
          } : null,
        };
      });

      const report = await generateReport({
        id: 0,
        brandName: group.brandName,
        brandDomain: group.brandDomain,
        createdAt: group.createdAt ? new Date(group.createdAt).toISOString() : undefined,
        segments: segments as any,
        citationReport: null,
      });
      await storage.setReportCache(cacheKey, report);
      res.json({ report });
    } catch (err) {
      console.error("Error generating V2 group report:", err);
      res.status(500).json({ message: "Failed to generate report", error: String(err) });
    }
  });

  app.post("/api/multi-segment-sessions/:id/teaser", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid session ID" });
        return;
      }
      const session = await storage.getMultiSegmentSession(id);
      if (!session) {
        res.status(404).json({ message: "Session not found" });
        return;
      }
      const force = req.query.force === "true";
      const cacheKey = `teaser:${id}`;
      if (!force) {
        const cached = await storage.getReportCache(cacheKey);
        if (cached) {
          res.json({ teaser: cached, cached: true });
          return;
        }
      }

      const teaser = generateTeaserData({
        id: session.id,
        brandName: session.brandName,
        brandDomain: session.brandDomain,
        createdAt: session.createdAt ? new Date(session.createdAt).toISOString() : undefined,
        segments: Array.isArray(session.segments) ? session.segments as any : [],
        citationReport: session.citationReport as any || null,
      });
      await storage.setReportCache(cacheKey, teaser);
      res.json({ teaser });
    } catch (err) {
      console.error("Teaser generation error:", err);
      res.status(500).json({ message: "Failed to generate teaser", error: String(err) });
    }
  });

  app.get("/api/share/teaser/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid session ID" });
        return;
      }
      const cacheKey = `teaser:${id}`;
      const cached = await storage.getReportCache(cacheKey);
      if (cached) {
        res.json({ teaser: cached, cached: true });
        return;
      }

      const session = await storage.getMultiSegmentSession(id);
      if (!session) {
        res.status(404).json({ message: "Session not found" });
        return;
      }
      const teaser = generateTeaserData({
        id: session.id,
        brandName: session.brandName,
        brandDomain: session.brandDomain,
        createdAt: session.createdAt ? new Date(session.createdAt).toISOString() : undefined,
        segments: Array.isArray(session.segments) ? session.segments as any : [],
        citationReport: session.citationReport as any || null,
      });
      await storage.setReportCache(cacheKey, teaser);
      res.json({ teaser });
    } catch (err) {
      console.error("Teaser share error:", err);
      res.status(500).json({ message: "Failed to load teaser", error: String(err) });
    }
  });

  app.get("/api/share/teaser/by-slug/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      if (!slug) {
        res.status(400).json({ message: "Invalid slug" });
        return;
      }
      const session = await storage.getMultiSegmentSessionBySlug(slug);
      if (!session) {
        res.status(404).json({ message: "Session not found" });
        return;
      }
      const cacheKey = `teaser:${session.id}`;
      const cached = await storage.getReportCache(cacheKey);
      if (cached) {
        res.json({ teaser: cached, cached: true, sessionId: session.id });
        return;
      }
      const teaser = generateTeaserData({
        id: session.id,
        brandName: session.brandName,
        brandDomain: session.brandDomain,
        createdAt: session.createdAt ? new Date(session.createdAt).toISOString() : undefined,
        segments: Array.isArray(session.segments) ? session.segments as any : [],
        citationReport: session.citationReport as any || null,
      });
      await storage.setReportCache(cacheKey, teaser);
      res.json({ teaser, sessionId: session.id });
    } catch (err) {
      console.error("Teaser slug share error:", err);
      res.status(500).json({ message: "Failed to load teaser", error: String(err) });
    }
  });

  app.post("/api/share/teaser/:id/lead", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id, 10);
      if (isNaN(sessionId)) {
        res.status(400).json({ message: "Invalid session ID" });
        return;
      }
      const { interests, comments } = req.body;
      if (!Array.isArray(interests) || interests.length === 0) {
        res.status(400).json({ message: "At least one interest is required" });
        return;
      }
      const session = await storage.getMultiSegmentSession(sessionId);
      if (!session) {
        res.status(404).json({ message: "Session not found" });
        return;
      }
      const lead = await storage.createTeaserLead({
        sessionId,
        brandName: session.brandName,
        interests,
        comments: comments || null,
      });
      res.json({ success: true, lead });
    } catch (err) {
      console.error("Lead submission error:", err);
      res.status(500).json({ message: "Failed to submit" });
    }
  });

  app.post("/api/share/summary-lead", async (req, res) => {
    try {
      const { email, brandName, sessionId, sourcePage } = req.body;
      if (!email || typeof email !== "string" || !email.includes("@")) {
        res.status(400).json({ message: "Valid email is required" });
        return;
      }
      if (!brandName || typeof brandName !== "string") {
        res.status(400).json({ message: "Brand name is required" });
        return;
      }
      const lead = await storage.createSummaryLead({
        email: email.trim().toLowerCase(),
        brandName,
        sessionId: sessionId ? parseInt(sessionId, 10) : null,
        sourcePage: sourcePage || null,
      });
      res.json({ success: true, id: lead.id });
    } catch (err) {
      console.error("Summary lead submission error:", err);
      res.status(500).json({ message: "Failed to submit" });
    }
  });

  app.get("/api/leads", async (_req, res) => {
    try {
      const [summaryLeadsList, teaserLeadsList] = await Promise.all([
        storage.listSummaryLeads(),
        storage.listTeaserLeads(),
      ]);
      res.json({ summaryLeads: summaryLeadsList, teaserLeads: teaserLeadsList });
    } catch (err) {
      console.error("Leads list error:", err);
      res.status(500).json({ message: "Failed to load leads" });
    }
  });

  app.post("/api/webhooks/incoming", async (req, res) => {
    try {
      const body = req.body || {};
      const result = body.result || {};

      const url = body.url || result.url || result.company_summary?.website || null;
      const resolvedName =
        body.business_name || body.businessName ||
        result.company || result.business_name || result.businessName ||
        result.company_summary?.company_name || null;
      const rawServices =
        body.services ||
        result.services ||
        result.service_type ||
        (result.best_shortlist_for_prompt_seeds?.service_type) ||
        null;
      const resolvedServices = Array.isArray(rawServices)
        ? rawServices.map((s: any) => (typeof s === "object" && s.category ? s.category : String(s)))
        : typeof rawServices === "string"
        ? [rawServices]
        : null;
      const city =
        body.city || result.city ||
        result.company_summary?.geography || null;

      const lead = await storage.createIncomingLead({
        url,
        businessName: resolvedName,
        services: resolvedServices,
        city,
        rawPayload: body,
        status: "pending",
      });
      res.json({ success: true, id: lead.id });
    } catch (err) {
      console.error("Incoming webhook error:", err);
      res.status(500).json({ message: "Failed to store incoming lead" });
    }
  });

  app.get("/api/incoming-leads", async (_req, res) => {
    try {
      const leads = await storage.listIncomingLeads();
      res.json(leads);
    } catch (err) {
      console.error("Incoming leads list error:", err);
      res.status(500).json({ message: "Failed to load incoming leads" });
    }
  });

  app.patch("/api/incoming-leads/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body;
      await storage.updateIncomingLeadStatus(id, status);
      res.json({ success: true });
    } catch (err) {
      console.error("Incoming lead status update error:", err);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  app.get("/api/share/summary/static/collectmaxx", async (req, res) => {
    try {
      const path = require("path");
      const fs = require("fs");
      const filePath = path.join(__dirname, "../server/static-reports/collectmaxx.json");
      if (!fs.existsSync(filePath)) {
        res.status(404).json({ message: "Report not found" });
        return;
      }
      const report = JSON.parse(fs.readFileSync(filePath, "utf8"));
      res.json({ report, cached: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to load report" });
    }
  });

  app.get("/api/share/summary/by-slug/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      if (!slug) {
        res.status(400).json({ message: "Invalid slug" });
        return;
      }
      const session = await storage.getMultiSegmentSessionBySlug(slug);
      if (!session) {
        const path = require("path");
        const fs = require("fs");
        const staticMap: Record<string, string> = { "collectmaxx-reminders": "collectmaxx" };
        if (staticMap[slug]) {
          const filePath = path.join(__dirname, `../server/static-reports/${staticMap[slug]}.json`);
          if (fs.existsSync(filePath)) {
            const report = JSON.parse(fs.readFileSync(filePath, "utf8"));
            res.json({ report, cached: true });
            return;
          }
        }
        res.status(404).json({ message: "Session not found" });
        return;
      }
      if (session.cachedReport) {
        res.json({ report: session.cachedReport, cached: true });
        return;
      }
      const report = await generateReport({
        id: session.id,
        brandName: session.brandName,
        brandDomain: session.brandDomain,
        createdAt: session.createdAt ? new Date(session.createdAt).toISOString() : undefined,
        segments: Array.isArray(session.segments) ? session.segments as any : [],
        citationReport: session.citationReport as any || null,
      });
      await storage.updateCachedReport(session.id, report);
      res.json({ report });
    } catch (err) {
      console.error("Summary by slug error:", err);
      res.status(500).json({ message: "Failed to load summary report" });
    }
  });

  app.post("/api/multisegment/sessions/:id/slug", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { slug } = req.body;
      if (!slug || isNaN(id)) {
        res.status(400).json({ message: "id and slug required" });
        return;
      }
      const existing = await storage.getMultiSegmentSessionBySlug(slug);
      if (existing && existing.id !== id) {
        res.status(409).json({ message: "Slug already in use" });
        return;
      }
      await storage.updateMultiSegmentSessionSlug(id, slug);
      res.json({ success: true, slug });
    } catch (err) {
      console.error("Set slug error:", err);
      res.status(500).json({ message: "Failed to set slug" });
    }
  });

  // ── Directory backfill ─────────────────────────────────────────────────────
  // POST /api/internal/directory/backfill?limit=10
  // Reads the last N sessions and publishes any that pass the quality gate.
  app.post("/api/internal/directory/backfill", async (req, res) => {
    try {
      const secret = req.headers["x-admin-key"] as string | undefined;
      if (secret !== process.env.ADMIN_PASSWORD) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const limit = Math.min(parseInt(String(req.query.limit ?? "10"), 10) || 10, 50);
      const results = await backfillRecentSessions(limit);
      const totalPublished = results.reduce((s, r) => s + r.published, 0);
      const totalSkipped   = results.reduce((s, r) => s + r.skipped,   0);
      const totalErrors    = results.flatMap((r) => r.errors);
      console.log(`[dir-backfill] limit=${limit} sessions=${results.length} published=${totalPublished} skipped=${totalSkipped} errors=${totalErrors.length}`);
      return res.json({ sessions: results.length, published: totalPublished, skipped: totalSkipped, errors: totalErrors });
    } catch (err) {
      console.error("[dir-backfill] error:", err);
      return res.status(500).json({ message: "Backfill failed", error: String(err) });
    }
  });

  app.post("/api/internal/migrate-session", async (req, res) => {
    try {
      const secret = req.headers["x-migrate-key"];
      if (secret !== process.env.ADMIN_PASSWORD) {
        res.status(403).json({ message: "Forbidden" });
        return;
      }
      const { brandName, brandDomain, promptsPerSegment, segments, cachedReport, citationReport, sessionType, parentSessionId, competitorName, parentBrandName, slug } = req.body;
      if (!slug || !brandName) {
        res.status(400).json({ message: "slug and brandName required" });
        return;
      }
      const existing = await storage.getMultiSegmentSessionBySlug(slug);
      if (existing) {
        res.json({ message: "Already exists", id: existing.id });
        return;
      }
      const session = await storage.createMultiSegmentSession({
        brandName,
        brandDomain: brandDomain || null,
        promptsPerSegment: promptsPerSegment || 10,
        segments: segments || [],
        sessionType: sessionType || "competitor",
        parentSessionId: parentSessionId || null,
        competitorName: competitorName || null,
        parentBrandName: parentBrandName || null,
        slug,
      });
      if (cachedReport) {
        await storage.updateCachedReport(session.id, cachedReport);
      }
      if (citationReport) {
        await storage.updateCitationReport(session.id, citationReport);
      }
      res.json({ message: "Migrated", id: session.id });
    } catch (err) {
      console.error("Migration error:", err);
      res.status(500).json({ message: "Migration failed" });
    }
  });

  app.get("/api/teaser-leads", async (_req, res) => {
    try {
      const leads = await storage.listTeaserLeads();
      res.json({ leads });
    } catch (err) {
      console.error("Lead listing error:", err);
      res.status(500).json({ message: "Failed to list leads" });
    }
  });

  app.get("/api/analytics/session/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      if (isNaN(sessionId)) return res.status(400).json({ message: "Invalid session ID" });

      res.set("Cache-Control", "no-store");
      res.removeHeader("ETag");
      const { pool } = await import("./db");
      const brand = typeof req.query.brand === "string" && req.query.brand ? req.query.brand : null;

      const sessionRes = await pool.query(
        "SELECT id, brand_name, segments, created_at FROM multi_segment_sessions WHERE id = $1",
        [sessionId]
      );
      const session = sessionRes.rows[0];
      if (!session) return res.status(404).json({ message: "Session not found" });

      const domainExtract = `CASE
        WHEN domain = 'vertexaisearch.cloud.google.com' AND resolved_url IS NOT NULL AND resolved_url NOT LIKE '%vertexaisearch%'
        THEN regexp_replace(resolved_url, '^https?://([^/?#]+).*$', '\\1')
        ELSE domain
      END`;

      const brandFilter = brand ? `AND brand = $2` : "";
      const params = brand ? [sessionId, brand] : [sessionId];

      const matrixQuery = `
        WITH extracted AS (
          SELECT
            ${domainExtract} as effective_domain,
            brand,
            engine,
            COALESCE(domain_category, 'unknown') as domain_category
          FROM citation_page_mentions, UNNEST(engines) as engine
          WHERE session_id = $1
        ),
        domain_totals AS (
          SELECT
            effective_domain,
            MAX(domain_category) as domain_category,
            SUM(CASE WHEN engine = 'gemini' THEN 1 ELSE 0 END)::int as gemini_total,
            SUM(CASE WHEN engine = 'chatgpt' THEN 1 ELSE 0 END)::int as chatgpt_total
          FROM extracted
          GROUP BY effective_domain
        ),
        top_gemini AS (
          SELECT effective_domain FROM domain_totals ORDER BY gemini_total DESC LIMIT 10
        ),
        top_chatgpt AS (
          SELECT effective_domain FROM domain_totals ORDER BY chatgpt_total DESC LIMIT 10
        ),
        top_domains AS (
          SELECT dt.*
          FROM domain_totals dt
          WHERE dt.effective_domain IN (SELECT effective_domain FROM top_gemini)
             OR dt.effective_domain IN (SELECT effective_domain FROM top_chatgpt)
        )
        SELECT
          e.effective_domain,
          e.brand,
          t.gemini_total,
          t.chatgpt_total,
          t.domain_category,
          SUM(CASE WHEN e.engine = 'gemini' THEN 1 ELSE 0 END)::int as gemini_count,
          SUM(CASE WHEN e.engine = 'chatgpt' THEN 1 ELSE 0 END)::int as chatgpt_count
        FROM extracted e
        JOIN top_domains t ON e.effective_domain = t.effective_domain
        GROUP BY e.effective_domain, e.brand, t.gemini_total, t.chatgpt_total, t.domain_category
        ORDER BY t.gemini_total DESC, e.brand
      `;

      const [brandsRes, sessionTotalsRes, statsRes, categoryRes, domainRes, sessionCategoryRes, authorityRes, matrixRes] = await Promise.all([
        pool.query(
          `SELECT DISTINCT brand FROM citation_page_mentions WHERE session_id = $1 ORDER BY brand`,
          [sessionId]
        ),
        pool.query(`
          SELECT engine, COUNT(*) as total
          FROM citation_page_mentions, UNNEST(engines) as engine
          WHERE session_id = $1
          GROUP BY engine
        `, [sessionId]),
        pool.query(`
          SELECT engine,
            COUNT(*) as total,
            COUNT(DISTINCT ${domainExtract}) as unique_domains
          FROM citation_page_mentions, UNNEST(engines) as engine
          WHERE session_id = $1 ${brandFilter}
          GROUP BY engine
        `, params),
        pool.query(`
          SELECT COALESCE(domain_category, 'unknown') as category, engine, COUNT(*) as count
          FROM citation_page_mentions, UNNEST(engines) as engine
          WHERE session_id = $1 ${brandFilter}
          GROUP BY domain_category, engine
        `, params),
        pool.query(`
          SELECT
            ${domainExtract} as effective_domain,
            MAX(COALESCE(domain_category, 'unknown')) as domain_category,
            SUM(CASE WHEN engine = 'gemini' THEN 1 ELSE 0 END)::int as gemini_count,
            SUM(CASE WHEN engine = 'chatgpt' THEN 1 ELSE 0 END)::int as chatgpt_count
          FROM citation_page_mentions, UNNEST(engines) as engine
          WHERE session_id = $1 ${brandFilter}
          GROUP BY effective_domain
          ORDER BY (SUM(CASE WHEN engine = 'gemini' THEN 1 ELSE 0 END) + SUM(CASE WHEN engine = 'chatgpt' THEN 1 ELSE 0 END)) DESC
        `, params),
        brand
          ? pool.query(`
              SELECT COALESCE(domain_category, 'unknown') as category, engine, COUNT(*) as count
              FROM citation_page_mentions, UNNEST(engines) as engine
              WHERE session_id = $1
              GROUP BY domain_category, engine
            `, [sessionId])
          : Promise.resolve({ rows: [] } as any),
        brand
          ? pool.query(`
              SELECT
                ${domainExtract} as effective_domain,
                MAX(COALESCE(domain_category, 'unknown')) as domain_category,
                SUM(CASE WHEN engine = 'gemini' THEN 1 ELSE 0 END)::int as gemini_count,
                SUM(CASE WHEN engine = 'chatgpt' THEN 1 ELSE 0 END)::int as chatgpt_count
              FROM citation_page_mentions, UNNEST(engines) as engine
              WHERE session_id = $1
              GROUP BY effective_domain
              ORDER BY (SUM(CASE WHEN engine = 'gemini' THEN 1 ELSE 0 END) + SUM(CASE WHEN engine = 'chatgpt' THEN 1 ELSE 0 END)) DESC
              LIMIT 50
            `, [sessionId])
          : Promise.resolve({ rows: [] } as any),
        pool.query(matrixQuery, [sessionId]),
      ]);

      const sessionTotals: Record<string, number> = {};
      for (const row of sessionTotalsRes.rows) {
        sessionTotals[row.engine] = parseInt(row.total);
      }

      const engineStats: Record<string, { total: number; uniqueDomains: number }> = {};
      for (const row of statsRes.rows) {
        engineStats[row.engine] = { total: parseInt(row.total), uniqueDomains: parseInt(row.unique_domains) };
      }

      const categoryMap: Record<string, { category: string; gemini: number; chatgpt: number }> = {};
      for (const row of categoryRes.rows) {
        if (!categoryMap[row.category]) categoryMap[row.category] = { category: row.category, gemini: 0, chatgpt: 0 };
        if (row.engine === "gemini") categoryMap[row.category].gemini = parseInt(row.count);
        if (row.engine === "chatgpt") categoryMap[row.category].chatgpt = parseInt(row.count);
      }

      const sessionCategoryMap: Record<string, { category: string; gemini: number; chatgpt: number }> = {};
      for (const row of sessionCategoryRes.rows) {
        if (!sessionCategoryMap[row.category]) sessionCategoryMap[row.category] = { category: row.category, gemini: 0, chatgpt: 0 };
        if (row.engine === "gemini") sessionCategoryMap[row.category].gemini = parseInt(row.count);
        if (row.engine === "chatgpt") sessionCategoryMap[row.category].chatgpt = parseInt(row.count);
      }

      res.json({
        session: {
          id: session.id,
          brandName: session.brand_name,
          segmentCount: Array.isArray(session.segments) ? session.segments.length : 0,
          createdAt: session.created_at,
        },
        brands: brandsRes.rows.map((r: any) => r.brand),
        selectedBrand: brand,
        sessionTotals,
        engineStats,
        categoryBreakdown: Object.values(categoryMap),
        sessionCategoryBreakdown: brand ? Object.values(sessionCategoryMap) : null,
        sourceAuthority: brand ? (() => {
          const brandMap: Record<string, { gemini: number; chatgpt: number }> = {};
          for (const r of domainRes.rows) {
            brandMap[r.effective_domain] = { gemini: r.gemini_count, chatgpt: r.chatgpt_count };
          }
          return authorityRes.rows.map((r: any) => ({
            domain: r.effective_domain,
            category: r.domain_category,
            sessionGemini: r.gemini_count,
            sessionChatgpt: r.chatgpt_count,
            brandGemini: brandMap[r.effective_domain]?.gemini ?? 0,
            brandChatgpt: brandMap[r.effective_domain]?.chatgpt ?? 0,
          }));
        })() : null,
        domainAggregates: domainRes.rows.map((r: any) => ({
          domain: r.effective_domain,
          domainCategory: r.domain_category,
          geminiCount: r.gemini_count,
          chatgptCount: r.chatgpt_count,
        })),
        citationMatrix: matrixRes.rows.map((r: any) => ({
          domain: r.effective_domain,
          brand: r.brand,
          domainCategory: r.domain_category,
          geminiTotal: r.gemini_total,
          chatgptTotal: r.chatgpt_total,
          geminiCount: r.gemini_count,
          chatgptCount: r.chatgpt_count,
        })),
      });
    } catch (err) {
      console.error("Analytics error:", err);
      res.status(500).json({ message: "Failed to load analytics", error: String(err) });
    }
  });

  app.get("/api/analytics/session/:sessionId/authority", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      if (isNaN(sessionId)) return res.status(400).json({ message: "Invalid session ID" });

      const { pool } = await import("./db");
      const brand = typeof req.query.brand === "string" && req.query.brand ? req.query.brand : null;

      const domainExtract = `CASE
        WHEN domain = 'vertexaisearch.cloud.google.com' AND resolved_url IS NOT NULL AND resolved_url NOT LIKE '%vertexaisearch%'
        THEN regexp_replace(resolved_url, '^https?://([^/?#]+).*$', '\\1')
        ELSE domain
      END`;

      const params = brand ? [sessionId, brand] : [sessionId];
      const brandGeminiExpr = brand
        ? `COUNT(CASE WHEN engine = 'gemini' AND brand = $2 THEN 1 END)::int`
        : `0::int`;
      const brandChatgptExpr = brand
        ? `COUNT(CASE WHEN engine = 'chatgpt' AND brand = $2 THEN 1 END)::int`
        : `0::int`;

      const result = await pool.query(`
        SELECT
          ${domainExtract} as effective_domain,
          MAX(COALESCE(domain_category, 'unknown')) as domain_category,
          COUNT(CASE WHEN engine = 'gemini' THEN 1 END)::int as session_gemini,
          COUNT(CASE WHEN engine = 'chatgpt' THEN 1 END)::int as session_chatgpt,
          ${brandGeminiExpr} as brand_gemini,
          ${brandChatgptExpr} as brand_chatgpt
        FROM citation_page_mentions, UNNEST(engines) as engine
        WHERE session_id = $1
        GROUP BY effective_domain
        HAVING COUNT(*) > 0
        ORDER BY (COUNT(CASE WHEN engine = 'gemini' THEN 1 END) + COUNT(CASE WHEN engine = 'chatgpt' THEN 1 END)) DESC
        LIMIT 50
      `, params);

      res.json({
        domains: result.rows.map((r: any) => ({
          domain: r.effective_domain,
          category: r.domain_category,
          sessionGemini: r.session_gemini,
          sessionChatgpt: r.session_chatgpt,
          brandGemini: r.brand_gemini,
          brandChatgpt: r.brand_chatgpt,
        })),
      });
    } catch (err) {
      console.error("Authority error:", err);
      res.status(500).json({ message: "Failed to load authority data", error: String(err) });
    }
  });

  // ===== BRAND INTELLIGENCE ROUTES =====

  app.post("/api/brand-intelligence", async (req, res) => {
    try {
      const packetAttributeSchema = z.record(z.string()).optional();
      const schema = z.object({
        brandName: z.string().min(1),
        brandUrl: z.string().url().optional().or(z.literal("")),
        engine: z.enum(["chatgpt", "gemini", "claude"]),
        runCount: z.number().int().min(5).max(20).default(15),
        webSearch: z.boolean().default(true),
        packetMode: z.boolean().default(false),
        packetDefinition: z.object({
          idealIdentity: z.string(),
          template: z.string().optional(),
          attributes: packetAttributeSchema,
        }).optional(),
        benchmarkMode: z.boolean().default(false),
        benchmarkCategory: z.string().optional(),
      });
      const body = schema.parse(req.body);
      const { db } = await import("./db");
      const [job] = await db
        .insert(brandIntelligenceJobs)
        .values({
          brandName: body.brandName,
          brandUrl: body.brandUrl || null,
          engine: body.engine,
          runCount: body.runCount,
          webSearch: body.webSearch,
          packetMode: body.packetMode,
          packetDefinition: body.packetDefinition ?? null,
          benchmarkMode: body.benchmarkMode,
          benchmarkCategory: body.benchmarkCategory ?? null,
          status: "pending",
          progress: 0,
        })
        .returning();

      runBrandIntelligence(job.id).catch((err) => {
        console.error("Brand intelligence runner error:", err);
        db.update(brandIntelligenceJobs)
          .set({ status: "failed", error: String(err) })
          .where(eqDrizzle(brandIntelligenceJobs.id, job.id))
          .catch(console.error);
      });

      res.json({ id: job.id });
    } catch (err) {
      console.error("Brand intelligence start error:", err);
      res.status(400).json({ message: "Failed to start brand intelligence job", error: String(err) });
    }
  });

  app.get("/api/brand-intelligence", async (req, res) => {
    try {
      const { db } = await import("./db");
      const jobs = await db
        .select({
          id: brandIntelligenceJobs.id,
          brandName: brandIntelligenceJobs.brandName,
          brandUrl: brandIntelligenceJobs.brandUrl,
          engine: brandIntelligenceJobs.engine,
          runCount: brandIntelligenceJobs.runCount,
          webSearch: brandIntelligenceJobs.webSearch,
          packetMode: brandIntelligenceJobs.packetMode,
          benchmarkMode: brandIntelligenceJobs.benchmarkMode,
          benchmarkCategory: brandIntelligenceJobs.benchmarkCategory,
          status: brandIntelligenceJobs.status,
          progress: brandIntelligenceJobs.progress,
          createdAt: brandIntelligenceJobs.createdAt,
        })
        .from(brandIntelligenceJobs)
        .orderBy(desc(brandIntelligenceJobs.createdAt))
        .limit(30);
      res.json(jobs);
    } catch (err) {
      console.error("Brand intelligence list error:", err);
      res.status(500).json({ message: "Failed to list jobs" });
    }
  });

  app.get("/api/brand-intelligence/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
      const { db } = await import("./db");
      const [job] = await db
        .select()
        .from(brandIntelligenceJobs)
        .where(eqDrizzle(brandIntelligenceJobs.id, id));
      if (!job) return res.status(404).json({ message: "Job not found" });
      res.json(job);
    } catch (err) {
      console.error("Brand intelligence get error:", err);
      res.status(500).json({ message: "Failed to get job" });
    }
  });

  app.post("/api/brand-intelligence/:id/resolve-sources", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
      const { db } = await import("./db");
      const [job] = await db.select().from(brandIntelligenceJobs).where(eqDrizzle(brandIntelligenceJobs.id, id));
      if (!job) return res.status(404).json({ message: "Job not found" });
      if (job.status !== "completed") return res.status(400).json({ message: "Job is not completed" });

      const results = job.results as Record<string, any>;
      if (!results?.attributes) return res.status(400).json({ message: "No attributes in results" });

      const attrKeys = Object.keys(results.attributes);
      const allSources: string[] = attrKeys.flatMap((k) => results.attributes[k]?.sources ?? []);
      const resolved = await resolveGroundingUrls(allSources, 8);

      let changed = 0;
      for (const key of attrKeys) {
        const attr = results.attributes[key];
        if (!attr?.sources?.length) continue;
        const resolvedUrls = attr.sources
          .map((url: string) => resolved.get(url)?.resolvedUrl ?? url)
          .filter((url: string) => url.startsWith("http"));
        const seen = new Set<string>();
        attr.sources = resolvedUrls.filter((url: string) => {
          try {
            const host = new URL(url).hostname.replace(/^www\./, "");
            if (seen.has(host)) return false;
            seen.add(host);
            return true;
          } catch { return false; }
        });
        changed++;
      }

      await db
        .update(brandIntelligenceJobs)
        .set({ results: results as any })
        .where(eqDrizzle(brandIntelligenceJobs.id, id));

      res.json({ resolved: resolved.size, attributesUpdated: changed });
    } catch (err) {
      console.error("Resolve sources error:", err);
      res.status(500).json({ message: "Failed to resolve sources", error: String(err) });
    }
  });

  // ── Signal Consistency ───────────────────────────────────────────────────
  app.post("/api/signal-consistency", async (req, res) => {
    try {
      const body = z.object({
        brands: z.array(z.string()).min(1).max(3),
        engines: z.array(z.enum(["chatgpt", "gemini"])).min(1),
        runCount: z.number().int().min(1).max(30).default(10),
      }).parse(req.body);

      const { db } = await import("./db");
      const [job] = await db
        .insert(signalConsistencyJobs)
        .values({
          brands: body.brands,
          engines: body.engines,
          runCount: body.runCount,
          status: "pending",
          progress: 0,
        })
        .returning();

      runSignalConsistency(job.id).catch((err) => {
        console.error("[signal-consistency] Async runner error:", err);
      });

      res.json({ id: job.id });
    } catch (err) {
      console.error("Signal consistency create error:", err);
      res.status(500).json({ message: String(err) });
    }
  });

  app.get("/api/signal-consistency", async (req, res) => {
    try {
      const { db } = await import("./db");
      const jobs = await db
        .select({
          id: signalConsistencyJobs.id,
          status: signalConsistencyJobs.status,
          brands: signalConsistencyJobs.brands,
          engines: signalConsistencyJobs.engines,
          runCount: signalConsistencyJobs.runCount,
          progress: signalConsistencyJobs.progress,
          createdAt: signalConsistencyJobs.createdAt,
        })
        .from(signalConsistencyJobs)
        .orderBy(desc(signalConsistencyJobs.createdAt))
        .limit(20);
      res.json(jobs);
    } catch (err) {
      console.error("Signal consistency list error:", err);
      res.status(500).json({ message: String(err) });
    }
  });

  app.get("/api/signal-consistency/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
      const { db } = await import("./db");
      const [job] = await db
        .select()
        .from(signalConsistencyJobs)
        .where(eqDrizzle(signalConsistencyJobs.id, id));
      if (!job) return res.status(404).json({ message: "Job not found" });
      res.json(job);
    } catch (err) {
      console.error("Signal consistency get error:", err);
      res.status(500).json({ message: String(err) });
    }
  });

  // ── Context Audit: crawl status ──────────────────────────────────────────
  app.get("/api/crawl/status/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const { pool } = await import("./db");
      const [statusRes, totalRes] = await Promise.all([
        pool.query(`
          SELECT
            count(*) AS crawled,
            count(*) FILTER (WHERE accessible = true) AS accessible,
            count(*) FILTER (WHERE accessible = false) AS failed,
            count(*) FILTER (WHERE accessible = true AND EXISTS (
              SELECT 1 FROM page_brand_mentions pbm WHERE pbm.crawled_page_url = url
            )) AS analyzed
          FROM crawled_pages WHERE session_id = $1
        `, [sessionId]),
        pool.query(`SELECT count(*) AS total FROM citation_urls WHERE session_id = $1`, [sessionId]),
      ]);
      res.json({
        total_citation_urls: parseInt(totalRes.rows[0].total),
        crawled: parseInt(statusRes.rows[0].crawled),
        accessible: parseInt(statusRes.rows[0].accessible),
        failed: parseInt(statusRes.rows[0].failed),
        analyzed: parseInt(statusRes.rows[0].analyzed),
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to get crawl status", error: String(err) });
    }
  });

  app.post("/api/crawl/run/:sessionId", requireAdmin, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const { spawn } = await import("child_process");
      const proc = spawn("node", ["server/crawl/crawl-citation-urls.mjs", String(sessionId)], {
        detached: true,
        stdio: "ignore",
        env: { ...process.env },
        cwd: process.cwd(),
      });
      proc.unref();
      res.json({ message: "Crawl started in background", sessionId });
    } catch (err) {
      res.status(500).json({ message: "Failed to start crawl", error: String(err) });
    }
  });

  app.post("/api/crawl/analyze/:sessionId", requireAdmin, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const { spawn } = await import("child_process");
      const proc = spawn("node", ["server/crawl/analyze-crawled-pages.mjs", String(sessionId)], {
        detached: true,
        stdio: "ignore",
        env: { ...process.env },
      });
      proc.unref();
      res.json({ message: "Analysis started in background", sessionId });
    } catch (err) {
      res.status(500).json({ message: "Failed to start analysis", error: String(err) });
    }
  });

  // ── Context Audit: per-brand context ─────────────────────────────────────
  app.get("/api/brand-context/:sessionId/:brand", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const brand = req.params.brand;
      const { pool } = await import("./db");
      const { rows } = await pool.query(`
        SELECT
          pbm.brand, pbm.mention_count, pbm.rank_position,
          pbm.attributes, pbm.services, pbm.trust_signals,
          pbm.sentiment, pbm.framing, pbm.snippets, pbm.analyzed_at,
          cp.url AS page_url, cp.title AS page_title, cp.url_category,
          cp.domain, cp.publish_date, cp.trust_signals AS page_trust_signals,
          cp.word_count
        FROM page_brand_mentions pbm
        JOIN crawled_pages cp ON cp.url = pbm.crawled_page_url
        WHERE pbm.session_id = $1 AND pbm.brand = $2
        ORDER BY
          CASE cp.url_category
            WHEN 'Comparison Article' THEN 1
            WHEN 'Community Thread' THEN 2
            WHEN 'Review Platform' THEN 3
            WHEN 'Directory Listing' THEN 4
            WHEN 'Brand Homepage' THEN 5
            ELSE 6
          END,
          pbm.rank_position NULLS LAST
      `, [sessionId, brand]);
      res.json({ brand, pages: rows });
    } catch (err) {
      res.status(500).json({ message: "Failed to get brand context", error: String(err) });
    }
  });

  // ── Context Audit: consistency overview ──────────────────────────────────
  app.get("/api/context-consistency/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const { pool } = await import("./db");
      const { rows } = await pool.query(`
        WITH brand_stats AS (
          SELECT
            pbm.brand,
            count(DISTINCT pbm.crawled_page_url) AS page_count,
            count(DISTINCT cp.url_category) AS category_count,
            count(*) FILTER (WHERE pbm.sentiment = 'positive') AS positive_pages,
            count(*) FILTER (WHERE pbm.sentiment = 'neutral') AS neutral_pages,
            count(*) FILTER (WHERE pbm.sentiment = 'negative') AS negative_pages,
            min(pbm.rank_position) AS best_rank,
            count(*) FILTER (WHERE pbm.rank_position IS NOT NULL) AS ranked_pages
          FROM page_brand_mentions pbm
          JOIN crawled_pages cp ON cp.url = pbm.crawled_page_url
          WHERE pbm.session_id = $1
          GROUP BY pbm.brand
        ),
        brand_attrs AS (
          SELECT pbm.brand, jsonb_agg(DISTINCT attr) AS all_attributes
          FROM page_brand_mentions pbm,
               jsonb_array_elements_text(pbm.attributes) attr
          WHERE pbm.session_id = $1
          GROUP BY pbm.brand
        ),
        brand_svcs AS (
          SELECT pbm.brand, jsonb_agg(DISTINCT svc) AS all_services
          FROM page_brand_mentions pbm,
               jsonb_array_elements_text(pbm.services) svc
          WHERE pbm.session_id = $1
          GROUP BY pbm.brand
        ),
        brand_trust AS (
          SELECT pbm.brand, jsonb_agg(DISTINCT ts) AS all_trust_signals
          FROM page_brand_mentions pbm,
               jsonb_array_elements_text(pbm.trust_signals) ts
          WHERE pbm.session_id = $1
          GROUP BY pbm.brand
        )
        SELECT
          bs.*,
          COALESCE(ba.all_attributes, '[]') AS all_attributes,
          COALESCE(bsv.all_services, '[]') AS all_services,
          COALESCE(bt.all_trust_signals, '[]') AS all_trust_signals
        FROM brand_stats bs
        LEFT JOIN brand_attrs ba ON ba.brand = bs.brand
        LEFT JOIN brand_svcs bsv ON bsv.brand = bs.brand
        LEFT JOIN brand_trust bt ON bt.brand = bs.brand
        ORDER BY bs.page_count DESC
        LIMIT 30
      `, [sessionId]);
      res.json({ brands: rows });
    } catch (err) {
      res.status(500).json({ message: "Failed to get context consistency", error: String(err) });
    }
  });

  app.get("/api/geo-metrics/:sessionId", async (_req, res) => {
    try {
      const fs = await import("fs");
      const csvPath = path.join(process.cwd(), "outputs", "brand_scores.csv");
      if (!fs.existsSync(csvPath)) {
        return res.status(404).json({ message: "Brand scores not yet generated. Run analyze_geo_healthcare.py first." });
      }
      const raw = fs.readFileSync(csvPath, "utf-8").trim();
      const lines = raw.split("\n");
      const headers = lines[0].split(",");
      const brands = lines.slice(1).map(line => {
        const vals = line.split(",");
        const obj: Record<string, string | number> = {};
        headers.forEach((h, i) => {
          const v = vals[i]?.trim() ?? "";
          obj[h.trim()] = isNaN(Number(v)) || v === "" ? v : Number(v);
        });
        return obj;
      });
      res.json({ brands });
    } catch (err) {
      res.status(500).json({ message: "Failed to load geo metrics", error: String(err) });
    }
  });

  app.get("/api/geo-metrics-detail/:sessionId", async (_req, res) => {
    try {
      const fs = await import("fs");
      const jsonPath = path.join(process.cwd(), "outputs", "brand_metrics_detail.json");
      if (!fs.existsSync(jsonPath)) {
        return res.status(404).json({ message: "Brand detail not yet generated. Run analyze_geo_healthcare.py first." });
      }
      const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Failed to load geo metrics detail", error: String(err) });
    }
  });

  app.post("/api/pnc/extract", async (req, res) => {
    try {
      const schema = z.object({ url: z.string().url() });
      const { url } = schema.parse(req.body);
      const { result, cost } = await pncExtract(url);
      res.json({ ...result, _cost: cost });
    } catch (err: any) {
      if (err instanceof z.ZodError) res.status(400).json({ message: "Please enter a valid URL" });
      else { console.error("[pnc/extract]", err.message); res.status(422).json({ message: err.message || "Extraction failed" }); }
    }
  });

  app.post("/api/pnc/classify", async (req, res) => {
    try {
      const schema = z.object({ url: z.string().url() });
      const { url } = schema.parse(req.body);
      const { result, cost } = await pncClassify(url);
      res.json({ ...result, _cost: cost });
    } catch (err: any) {
      if (err instanceof z.ZodError) res.status(400).json({ message: "Please enter a valid URL" });
      else { console.error("[pnc/classify]", err.message); res.status(422).json({ message: err.message || "Classification failed" }); }
    }
  });

  app.post("/api/pnc/classify-generate", async (req, res) => {
    try {
      const schema = z.object({
        services: z.array(z.string()),
        customers: z.array(z.string()),
        loc: z.string(),
        url: z.string(),
      });
      const { services, customers, loc, url } = schema.parse(req.body);
      const { result, cost } = await pncClassifyGenerate(services, customers, loc, url);
      res.json({ ...result, _cost: cost });
    } catch (err: any) {
      if (err instanceof z.ZodError) res.status(400).json({ message: "Invalid request" });
      else { console.error("[pnc/classify-generate]", err.message); res.status(422).json({ message: err.message || "Generation failed" }); }
    }
  });

  app.post("/api/pnc/v1-generate", async (req, res) => {
    try {
      const schema = z.object({
        b1: z.array(z.string()), b2: z.array(z.string()),
        b3: z.array(z.string()), b4: z.array(z.string()),
        inclCust: z.boolean(), loc: z.string(),
      });
      const { b1, b2, b3, b4, inclCust, loc } = schema.parse(req.body);
      const { result, cost } = await pncV1Generate(b1, b2, b3, b4, inclCust, loc);
      res.json({ prompts: result, _cost: cost });
    } catch (err: any) {
      if (err instanceof z.ZodError) res.status(400).json({ message: "Invalid request" });
      else { console.error("[pnc/v1-generate]", err.message); res.status(422).json({ message: err.message || "Generation failed" }); }
    }
  });

  app.post("/api/pnc/v2-generate", async (req, res) => {
    try {
      const schema = z.object({ url: z.string().url(), loc: z.string() });
      const { url, loc } = schema.parse(req.body);
      const { result, cost } = await pncV2Generate(url, loc);
      res.json({ ...result, _cost: cost });
    } catch (err: any) {
      if (err instanceof z.ZodError) res.status(400).json({ message: "Please enter a valid URL" });
      else { console.error("[pnc/v2-generate]", err.message); res.status(422).json({ message: err.message || "Generation failed" }); }
    }
  });

  // ── Citation Domain URL lazy-loader ──────────────────────────────────────────
  app.get("/api/multi-segment-sessions/:id/citation-domains/:domain", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id, 10);
      if (isNaN(sessionId)) { res.status(400).json({ message: "Invalid session ID" }); return; }
      const domain = decodeURIComponent(req.params.domain);
      const { pool } = await import("./db");
      const { rows } = await pool.query(
        `SELECT url, title, llm_pagetype_classification, citation_count
         FROM citation_urls
         WHERE session_id = $1 AND domain = $2
         ORDER BY citation_count DESC, id ASC
         LIMIT 50`,
        [sessionId, domain]
      );
      res.json({ urls: rows });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Citation AI Insights ─────────────────────────────────────────────────────

  // GET — list past insight runs for a session (+ citation row count for cost estimation)
  app.get("/api/multi-segment-sessions/:id/citation-insights", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id, 10);
      if (isNaN(sessionId)) { res.status(400).json({ message: "Invalid session ID" }); return; }
      const { pool } = await import("./db");
      const [rowCountResult, insightsResult] = await Promise.all([
        pool.query("SELECT COUNT(*)::int AS count FROM citation_urls WHERE session_id = $1", [sessionId]),
        pool.query(
          "SELECT id, model, result_text, input_tokens, output_tokens, row_count, created_at FROM citation_insights WHERE session_id = $1 ORDER BY created_at DESC",
          [sessionId]
        ),
      ]);
      res.json({
        rowCount: rowCountResult.rows[0]?.count ?? 0,
        insights: insightsResult.rows,
      });
    } catch (err: any) {
      console.error("[citation-insights] GET error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  // POST — run a new insight analysis
  app.post("/api/multi-segment-sessions/:id/citation-insights", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id, 10);
      if (isNaN(sessionId)) { res.status(400).json({ message: "Invalid session ID" }); return; }

      const { model, promptOverride, outputSchemaOverride, webSearch, citationAnalysisMode } = z.object({
        model: z.string(),
        promptOverride: z.string().optional(),
        outputSchemaOverride: z.string().optional(),
        webSearch: z.boolean().optional(),
        citationAnalysisMode: z.enum(["url_rows", "domain_aggregated"]).optional(),
      }).parse(req.body);
      const { pool } = await import("./db");

      // Ensure mentioned_brands column exists (safe to run multiple times)
      await pool.query(`ALTER TABLE citation_urls ADD COLUMN IF NOT EXISTS mentioned_brands TEXT`);

      // ── Step 1: Identify top 3 ranked competitors from session scoring data ──
      let top3Brands: { name: string; appearances: number }[] = [];
      try {
        const sessionRow = await pool.query(
          `SELECT brand_name, segments FROM multi_segment_sessions WHERE id = $1`,
          [sessionId]
        );
        if (sessionRow.rows.length > 0) {
          const { brand_name: clientBrand, segments } = sessionRow.rows[0];
          const clientBrandLC = (clientBrand ?? "").toLowerCase();
          const competitorMap = new Map<string, number>();

          for (const seg of (segments ?? [])) {
            const competitors: { name: string; appearances: number }[] =
              seg?.scoringResult?.score?.competitors ?? [];
            for (const comp of competitors) {
              if (!comp.name) continue;
              const nameLC = comp.name.toLowerCase();
              if (nameLC.includes(clientBrandLC) || clientBrandLC.includes(nameLC)) continue;
              competitorMap.set(comp.name, (competitorMap.get(comp.name) ?? 0) + (comp.appearances ?? 0));
            }
          }

          top3Brands = Array.from(competitorMap.entries())
            .map(([name, appearances]) => ({ name, appearances }))
            .sort((a, b) => b.appearances - a.appearances)
            .slice(0, 3);
        }
      } catch (e) {
        console.warn("[citation-insights] Could not fetch top3 brands:", e);
      }

      // ── Step 2: Tag citation URLs with which brands appear in their content ──
      const brandNamesToTag = top3Brands.map(b => b.name);
      if (brandNamesToTag.length > 0) {
        console.log(`[citation-insights] Tagging mentioned_brands for session ${sessionId} with brands:`, brandNamesToTag);
        spStart(sessionId, "tag_brands");
        await tagMentionedBrands(sessionId, brandNamesToTag);
        spDone(sessionId, "tag_brands");
        console.log(`[citation-insights] mentioned_brands tagging complete`);
      }

      // ── Step 3: Build CSV for Claude ──────────────────────────────────────────
      await pool.query(`ALTER TABLE citation_urls ADD COLUMN IF NOT EXISTS brand_context JSONB`);

      let csvText: string;
      let csvRowCount = 0;

      // Auto-populate citation_urls if empty (e.g. sessions scored before this step was added)
      const { rows: existingCheck } = await pool.query(
        `SELECT 1 FROM citation_urls WHERE session_id = $1 LIMIT 1`, [sessionId]
      );
      if (existingCheck.length === 0) {
        console.log(`[citation-insights] citation_urls empty for session ${sessionId} — auto-populating`);
        await populateCitationUrls(sessionId);
        console.log(`[citation-insights] auto-populate complete for session ${sessionId}`);
      }

      if (citationAnalysisMode === "domain_aggregated") {
        // ── Domain-aggregated mode: one row per domain, sum citations, collect page types ──
        // ~60–80 rows vs 250 URL rows — ~75% fewer tokens, same analytical signal
        const { rows: domainRows } = await pool.query(
          `SELECT
             domain,
             SUM(citation_count)::int AS total_citations,
             COUNT(*)::int AS url_count,
             STRING_AGG(DISTINCT COALESCE(engine, ''), ', ') AS engines_seen,
             STRING_AGG(DISTINCT COALESCE(url_category, ''), ', ') AS page_types,
             STRING_AGG(DISTINCT COALESCE(llm_pagetype_classification, ''), ', ') AS llm_classifications,
             STRING_AGG(DISTINCT COALESCE(mentioned_brands, ''), ', ') AS mentioned_brands,
             MAX(brand) AS primary_brand
           FROM citation_urls
           WHERE session_id = $1 AND domain IS NOT NULL
           GROUP BY domain
           ORDER BY total_citations DESC`,
          [sessionId]
        );
        if (!domainRows.length) { res.status(404).json({ message: "No citation data found for this session" }); return; }

        const domainCsvHeader = "domain,total_citations,url_count,engines_seen,page_types,llm_classifications,mentioned_brands,primary_brand";
        const domainCsvRows = domainRows.map(r =>
          [r.domain ?? "", r.total_citations ?? 0, r.url_count ?? 0,
           r.engines_seen ?? "", r.page_types ?? "", r.llm_classifications ?? "",
           r.mentioned_brands ?? "", r.primary_brand ?? ""]
          .map(v => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
        );
        csvRowCount = domainRows.length;
        csvText = [domainCsvHeader, ...domainCsvRows].join("\n")
          + `\n\nNOTE: Domain-aggregated view — ${domainRows.length} unique domains summarised from all citation URLs.`;
        console.log(`[citation-insights] Domain-aggregated CSV: ${domainRows.length} domain rows`);

      } else {
        // ── Standard mode: individual URL rows (current behaviour, untouched) ──
        const { rows } = await pool.query(
          `SELECT id, session_id, engine, prompt_text, segment_persona, url, title,
                  created_at, url_category, domain, brand, citation_count,
                  llm_pagetype_classification,
                  COALESCE(mentioned_brands, '') AS mentioned_brands,
                  brand_context
           FROM citation_urls WHERE session_id = $1 ORDER BY citation_count DESC, id ASC`,
          [sessionId]
        );
        if (!rows.length) { res.status(404).json({ message: "No citation data found for this session" }); return; }

        const MAX_CSV_ROWS = 250;
        const BRAND_CONTEXT_CHAR_LIMIT = 120;
        const rowsForCsv = rows.length > MAX_CSV_ROWS ? rows.slice(0, MAX_CSV_ROWS) : rows;
        const truncated = rows.length > MAX_CSV_ROWS;
        const csvHeader = "engine,url_category,llm_pagetype_classification,domain,brand,url,title,citation_count,mentioned_brands,brand_context";
        const csvRows = rowsForCsv.map(r => {
          let contextObj = r.brand_context as Record<string, string> | null;
          if (contextObj && typeof contextObj === "object") {
            const trimmed: Record<string, string> = {};
            for (const [k, v] of Object.entries(contextObj)) {
              trimmed[k] = typeof v === "string" ? v.slice(0, BRAND_CONTEXT_CHAR_LIMIT) : String(v).slice(0, BRAND_CONTEXT_CHAR_LIMIT);
            }
            contextObj = trimmed;
          }
          const contextStr = contextObj ? JSON.stringify(contextObj) : "";
          return [r.engine ?? "", r.url_category ?? "", r.llm_pagetype_classification ?? "",
           r.domain ?? "", r.brand ?? "", r.url ?? "",
           `"${(r.title ?? "").replace(/"/g, '""')}"`,
           r.citation_count ?? 0, r.mentioned_brands ?? "", contextStr]
          .map(v => `"${String(v).replace(/"/g, '""')}"`)
          .join(",");
        });
        csvRowCount = rows.length;
        const truncationNote = truncated ? `\n\nNOTE: CSV truncated to top ${MAX_CSV_ROWS} rows by citation_count (${rows.length} total rows). All highest-cited URLs are included.` : "";
        csvText = [csvHeader, ...csvRows].join("\n") + truncationNote;
        console.log(`[citation-insights] Standard CSV: ${rowsForCsv.length}/${rows.length} URL rows`);
      }

      // Replace [BRAND A/B/C] placeholders in prompt with actual top-ranked names
      function injectTopBrands(prompt: string, brands: { name: string; appearances: number }[]): string {
        let out = prompt;
        const labels = ["[BRAND A]", "[BRAND B]", "[BRAND C]"];
        for (let i = 0; i < labels.length; i++) {
          const replacement = brands[i]
            ? `${brands[i].name} (${brands[i].appearances} AI query appearances)`
            : `[Brand ${String.fromCharCode(65 + i)} — not enough data]`;
          out = out.split(labels[i]).join(replacement);
        }
        return out;
      }

      const defaultPromptPrefix = `You are an AI search visibility analyst reviewing citation data from a GEO (Generative Engine Optimization) study.

The CSV data below contains every URL cited by ChatGPT and Gemini when answering questions about this brand's market. Key columns:
- url_category / llm_pagetype_classification: page type (comparison article, directory, news, etc.)
- citation_count: how many times this URL was cited by AI engines
- mentioned_brands: brands confirmed to appear on this page (fetched and scanned — your ONLY attribution source)
- brand_context: JSON object mapping brand name → verbatim text snippet extracted from that page around the brand mention. This is the exact language the page uses to describe each brand.

CRITICAL — BRAND ATTRIBUTION RULES:
- Use mentioned_brands as your ONLY source of truth for which brands appear in each URL.
- A single URL can mention multiple brands (comma-separated). Sum citation_count for each brand across all rows where that brand appears in mentioned_brands.
- Do NOT use the "brand" column for brand attribution — it is the publishing domain, not the analysed brand.
- Rows with an empty mentioned_brands column are third-party pages that mention none of the target brands — use them for tactic and source analysis but do not attribute citations to any brand.

CRITICAL — HOW THEY APPEAR RULES:
- The brand_context column is your PRIMARY source for the how_they_appear field. It contains verbatim text scraped directly from the citing page showing exactly how each brand is described.
- Copy the most representative sentence or phrase from brand_context as the how_they_appear value. Do NOT paraphrase — use the actual extracted language.
- Only if brand_context is empty or absent for a brand on a given row should you synthesise your own description based on the page title and URL pattern.
- A how_they_appear value must NEVER say "UNATTRIBUTED", "unverified", or any placeholder — if you have no real language, omit the field entirely.

TASK: Identify what the most-cited brands and pages are doing RIGHT — specific tactics, signals, and page patterns that correlate with high citation frequency.`;

      const defaultOutputSchema = `Return ONLY a valid JSON object with this EXACT structure (no markdown fences, no explanation before or after — just raw JSON):

{
  "summary": {
    "total_citations": <number — sum of all citation_count values>,
    "domains_analysed": <number — count of unique domains>,
    "cross_engine_brands": <number — brands appearing in BOTH ChatGPT AND Gemini>,
    "key_finding": "<single most important insight from this data — one sentence, specific>"
  },
  "page_type_distribution": {
    "winner": "<page type with most citations>",
    "winner_citations": <number>,
    "summary": "<2-3 sentence explanation of the distribution pattern>"
  },
  "cross_engine_champions": [
    { "brand": "<name>", "chatgpt": <citations in chatgpt>, "gemini": <citations in gemini>, "total": <combined total> }
  ],
  "tactics": [
    {
      "rank": <number starting at 1>,
      "title": "<CRITICAL: write as an ACTION VERB PHRASE describing what winning brands DO — e.g. 'Dominate 10 major MENA VC comparison listicles', 'Secure mentions in high-authority startup media', 'Build exhaustive directory presence across VC databases' — NEVER use category labels like 'Comparison Articles' or 'News and PR' as the title>",
      "impact": "<HIGHEST|VERY HIGH|HIGH|MEDIUM|LOW>",
      "citations": <total citation count supporting this tactic>,
      "confidence": "<HIGH|MEDIUM|LOW>",
      "mechanism": "<paragraph explaining WHY this factor signals credibility or relevance to AI training — be specific>",
      "examples": [
        { "url": "<exact URL from the CSV>", "brand": "<brand name>", "count": <citation_count number>, "description": "<one sentence on what this page contains>" }
      ],
      "why_it_works": ["<specific signal 1>", "<specific signal 2>", "<specific signal 3>"],
      "brand_performance": [
        {
          "brand": "<brand name>",
          "citation_count": <number of citations for this tactic>,
          "performance_rating": "<Strong|Partial|Weak>",
          "what_they_do": "<one sentence describing exactly how this brand executes this tactic, with URL reference>",
          "how_they_appear": "<verbatim language from the source pages describing this brand — copy exact quotes including any data points>",
          "evidence_urls": [
            { "url": "<exact URL from the CSV>", "count": <citation_count> }
          ]
        }
      ]
    }
  ],
  "sources": [
    { "domain": "<domain>", "type": "<Government|Directory|Community|News|Review Platform|Brand|Aggregator|Other>", "importance": "<High|Medium|Low>", "appearances": <number> }
  ],
  "unusual_findings": [
    { "title": "<short title>", "finding": "<explanation of what is unusual and why it matters>" }
  ],
  "actions": [
    {
      "brand": "<brand name>",
      "weakest_tactic": "<tactic title where this brand has the fewest citations>",
      "weakest_tactic_citations": <number>,
      "strongest_brand_on_tactic": "<which of the three brands leads on that tactic>",
      "strongest_brand_citations": <number>,
      "action": "<one specific action that replicates exactly what the stronger brand does — name the URL or platform>"
    }
  ],
  "quick_win": "<one sentence naming a specific URL or platform from the CSV with its citation count and the exact step to take to get listed or cited there>"
}

Rules for content:
- Tactic titles MUST be action verb phrases (e.g. "Dominate MENA VC comparison articles") — never category labels
- Base ALL rankings strictly on citation_count evidence from this CSV — no generic SEO advice
- For tactics: rank from most to least impactful. Identify ALL meaningful tactics (typically 8-12), not just the top 4
- Every tactic MUST have a brand_performance array with ALL three target brands, even if count is 0
- For sources: include all notable domains that shape AI knowledge in this market (8-15 entries)
- confidence: HIGH = 5+ brands show this pattern, MEDIUM = 3-4, LOW = 1-2
- how_they_appear must contain specific verbatim language — not "they are mentioned" but the actual words the source uses
- For unusual_findings: include 3-5 genuinely surprising or counterintuitive patterns
- actions array MUST contain exactly one entry per brand (three total) — identify the single weakest tactic per brand and the most actionable replication step
- quick_win must reference a specific domain and citation count from the CSV data`;

      const instructionsText = promptOverride ?? defaultPromptPrefix;
      const schemaText = outputSchemaOverride ?? defaultOutputSchema;
      const combined = injectTopBrands(instructionsText + "\n\n" + schemaText, top3Brands);
      const systemPrompt = combined + `\n\nCSV DATA:\n${csvText}`;

      let resultText = "";
      let inputTokens: number | null = null;
      let outputTokens: number | null = null;

      spStart(sessionId, "claude_insights");
      if (model.startsWith("claude")) {
        const Anthropic = (await import("@anthropic-ai/sdk")).default;
        const anthropic = new Anthropic({
          apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
          baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
        });
        const claudeModel = model === "claude-haiku-4-5" ? "claude-haiku-4-5" : "claude-sonnet-4-5";
        console.log(`[citation-insights] model received="${model}" → using claudeModel="${claudeModel}"`);

        if (webSearch) {
          // Multi-turn loop with Anthropic web_search tool
          const webSearchTool = { type: "web_search_20250305" as const, name: "web_search" };
          let messages: any[] = [{ role: "user", content: systemPrompt }];
          let totalInput = 0;
          let totalOutput = 0;
          let maxIter = 12;

          while (maxIter-- > 0) {
            const response = await anthropic.messages.create({
              model: claudeModel,
              max_tokens: 16000,
              tools: [webSearchTool],
              messages,
            });

            totalInput += response.usage?.input_tokens ?? 0;
            totalOutput += response.usage?.output_tokens ?? 0;

            // Collect any text blocks in this turn
            const textBlocks = response.content.filter((b: any) => b.type === "text");
            if (textBlocks.length > 0) resultText = textBlocks.map((b: any) => b.text).join("");

            if (response.stop_reason === "max_tokens") {
              console.warn("[citation-insights] Response truncated by max_tokens limit — output may be incomplete");
              break;
            }
            if (response.stop_reason === "end_turn") break;

            if (response.stop_reason === "tool_use") {
              messages.push({ role: "assistant", content: response.content });
              const toolResults = response.content
                .filter((b: any) => b.type === "tool_use")
                .map((b: any) => ({ type: "tool_result", tool_use_id: b.id, content: "" }));
              messages.push({ role: "user", content: toolResults });
            } else {
              break;
            }
          }

          // If Claude returned prose instead of JSON, nudge it back to JSON output
          const looksLikeJson = resultText.trim().startsWith("{") || resultText.trim().startsWith("[");
          if (!looksLikeJson) {
            try {
              messages.push({ role: "assistant", content: resultText || "Research complete." });
              messages.push({
                role: "user",
                content: "Your research is complete. Now output your final analysis as a raw JSON object exactly matching the output structure specified in your original instructions. Return ONLY the JSON — no prose, no markdown fences, no explanation before or after.",
              });
              const finalResponse = await anthropic.messages.create({
                model: claudeModel,
                max_tokens: 16000,
                messages,
              });
              totalInput += finalResponse.usage?.input_tokens ?? 0;
              totalOutput += finalResponse.usage?.output_tokens ?? 0;
              const finalText = finalResponse.content
                .filter((b: any) => b.type === "text")
                .map((b: any) => b.text)
                .join("");
              if (finalText) resultText = finalText;
            } catch (e) {
              console.warn("[citation-insights] JSON nudge failed:", e);
            }
          }

          inputTokens = totalInput || null;
          outputTokens = totalOutput || null;
        } else {
          const response = await anthropic.messages.create({
            model: claudeModel,
            max_tokens: 16000,
            messages: [{ role: "user", content: systemPrompt }],
          });
          resultText = response.content[0].type === "text" ? response.content[0].text : "";
          inputTokens = response.usage?.input_tokens ?? null;
          outputTokens = response.usage?.output_tokens ?? null;
        }
      } else if (model.startsWith("gpt") || model === "gpt-4o" || model === "gpt-5.2") {
        const OpenAI = (await import("openai")).default;
        const openai = new OpenAI({
          apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
          baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
        });
        const response = await openai.chat.completions.create({
          model: model,
          messages: [{ role: "user", content: systemPrompt }],
          max_completion_tokens: 4096,
        });
        resultText = response.choices[0]?.message?.content ?? "";
        inputTokens = response.usage?.prompt_tokens ?? null;
        outputTokens = response.usage?.completion_tokens ?? null;
      } else if (model.startsWith("gemini")) {
        const { GoogleGenAI } = await import("@google/genai");
        const geminiClient = new GoogleGenAI({
          apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
          httpOptions: { apiVersion: "", baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL },
        });
        const response = await geminiClient.models.generateContent({
          model: "gemini-2.5-flash",
          contents: systemPrompt,
          config: { maxOutputTokens: 8192 },
        });
        resultText = response.text ?? "";
        inputTokens = response.usageMetadata?.promptTokenCount ?? null;
        outputTokens = response.usageMetadata?.candidatesTokenCount ?? null;
      } else {
        res.status(400).json({ message: `Unknown model: ${model}` }); return;
      }
      spDone(sessionId, "claude_insights");

      // Persist the result
      const insertResult = await pool.query(
        `INSERT INTO citation_insights (session_id, model, result_text, input_tokens, output_tokens, row_count)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at`,
        [sessionId, model, resultText, inputTokens, outputTokens, csvRowCount]
      );

      res.json({
        id: insertResult.rows[0].id,
        model,
        resultText,
        inputTokens,
        outputTokens,
        rowCount: csvRowCount,
        createdAt: insertResult.rows[0].created_at,
      });
    } catch (err: any) {
      console.error("[citation-insights] POST error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/analyze-url", async (req, res) => {
    try {
      const schema = z.object({ url: z.string().url() });
      const { url } = schema.parse(req.body);
      const result = await analyzeUrl(url);
      res.json(result);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Please enter a valid URL including https://" });
      } else {
        console.error("[analyze-url]", err.message);
        res.status(422).json({ message: err.message || "Failed to analyze URL" });
      }
    }
  });

  app.post("/api/agents/interest", async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email(),
        agentId: z.string().min(1),
        agentName: z.string().min(1),
      });
      const data = schema.parse(req.body);
      const result = await storage.createAgentInterest(data);
      res.status(201).json(result);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid email or agent data." });
      } else {
        console.error("[agents/interest]", err.message);
        res.status(500).json({ message: "Failed to register interest." });
      }
    }
  });

  // ── Bot-detection SSR for /reports/:slug ─────────────────────────────────
  // AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Googlebot etc.) don't run
  // JavaScript, so they see a blank SPA shell. This middleware intercepts
  // requests from known bots and returns fully-rendered HTML with real session
  // data injected — no changes to the React app, zero impact on real users.

  const BOT_UA_RE = /GPTBot|ChatGPT-User|ClaudeBot|Claude-Web|anthropic-ai|PerplexityBot|Googlebot|Google-Extended|bingbot|BingPreview|DuckDuckBot|Baiduspider|YandexBot|facebookexternalhit|Twitterbot|LinkedInBot|Slurp|ia_archiver|AhrefsBot|SemrushBot/i;

  function isBotRequest(req: Request): boolean {
    const ua = req.get("user-agent") || "";
    return BOT_UA_RE.test(ua);
  }

  function escapeHtml(str: string): string {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function buildReportHtml(session: any, slug: string): string {
    const brandName = escapeHtml(session.brandName || session.brand_name || "Brand");
    const brandDomain = escapeHtml(session.brandDomain || session.brand_domain || "");
    const segments: any[] = Array.isArray(session.segments) ? session.segments : [];

    const GENERIC = ["service", "customer", "providers", "provider"];
    let category = "";
    let location = "";
    let queryText = "";
    let shareOfVoice = 0;
    const competitors: { name: string; share: number }[] = [];

    for (const seg of segments) {
      const sr = seg?.scoringResult ?? {};
      if (!sr.score) continue;
      const rawSeed = (seg?.seedType || "").trim();
      const seedType = GENERIC.includes(rawSeed.toLowerCase())
        ? (seg?.serviceType || seg?.customerType || seg?.persona || rawSeed).trim()
        : (rawSeed || seg?.serviceType || seg?.customerType || seg?.persona || "").trim();
      location = (seg?.location || "").trim();
      category = seedType || (seg?.persona || "").trim();
      queryText = category && location ? `${category} in ${location}` : category || location;

      const compList: any[] = sr.score.competitors ?? [];
      compList.forEach((c: any) => {
        if (c?.name && (c.share ?? 0) > 0) {
          competitors.push({ name: c.name, share: Math.round((c.share ?? 0) * 100) });
        }
      });

      // derive brand's own share-of-voice from appearance_rate across engines
      const eb = sr.score.engine_breakdown ?? {};
      const rates = Object.values(eb).map((e: any) => e?.appearance_rate ?? 0);
      if (rates.length) {
        shareOfVoice = Math.round((rates.reduce((a: number, b: number) => a + b, 0) / rates.length) * 100);
      }
      break;
    }

    const top5 = competitors.slice(0, 5);
    const canonicalUrl = `https://answermonk.ai/reports/${encodeURIComponent(slug)}`;
    const pageTitle = queryText
      ? `${brandName} AI Visibility — ${queryText} | AnswerMonk`
      : `${brandName} AI Visibility Report | AnswerMonk`;
    const description = queryText
      ? `AnswerMonk AI visibility report for ${brandName} in the "${queryText}" category. Share-of-voice: ${shareOfVoice}%. Top AI-cited competitors: ${top5.slice(0, 3).map(c => c.name).join(", ")}.`
      : `AnswerMonk AI visibility analysis for ${brandName}. Showing share-of-voice, competitor rankings, and citation sources across ChatGPT, Claude, and Gemini.`;

    const competitorRows = top5.map((c, i) =>
      `<tr><td>${i + 1}</td><td>${escapeHtml(c.name)}</td><td>${c.share}%</td></tr>`
    ).join("\n");

    const schemaReport = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Report",
      "name": pageTitle,
      "description": description,
      "url": canonicalUrl,
      "about": {
        "@type": "Organization",
        "name": brandName,
        ...(brandDomain ? { "url": `https://${brandDomain}` } : {}),
      },
      "publisher": {
        "@type": "Organization",
        "name": "AnswerMonk",
        "url": "https://answermonk.ai",
      },
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${pageTitle}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${canonicalUrl}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${pageTitle}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:site_name" content="AnswerMonk" />
  <script type="application/ld+json">${schemaReport}</script>
</head>
<body>
  <header>
    <a href="https://answermonk.ai">AnswerMonk — AI Search Visibility Platform</a>
  </header>

  <main>
    <h1>${pageTitle}</h1>
    ${queryText ? `<p>This report analyzes AI search visibility for <strong>${brandName}</strong>${brandDomain ? ` (${brandDomain})` : ""} in the <strong>${queryText}</strong> category across ChatGPT, Claude, and Gemini.</p>` : `<p>This report analyzes AI search visibility for <strong>${brandName}</strong>${brandDomain ? ` (${brandDomain})` : ""} across ChatGPT, Claude, and Gemini.</p>`}

    <section>
      <h2>AI Visibility Score</h2>
      <p><strong>${brandName}</strong> has an AI share-of-voice score of <strong>${shareOfVoice}%</strong> for the query category "${escapeHtml(queryText || category)}".</p>
      <p>Share of voice measures how often a brand appears in AI-generated answers, weighted by rank position and engine market share (ChatGPT 35%, Gemini 35%, Claude 20%, Perplexity 10%).</p>
    </section>

    ${top5.length ? `
    <section>
      <h2>Competitor Rankings in AI Search</h2>
      <p>The following brands were most frequently cited by AI engines in response to "${escapeHtml(queryText || category)}" queries:</p>
      <table>
        <thead><tr><th>Rank</th><th>Brand</th><th>AI Citation Share</th></tr></thead>
        <tbody>${competitorRows}</tbody>
      </table>
    </section>` : ""}

    <section>
      <h2>About This Report</h2>
      <p>This AI visibility report was generated by <a href="https://answermonk.ai">AnswerMonk</a>, a platform that measures how brands appear in responses from ChatGPT, Claude, Gemini, and Perplexity. The analysis runs a network of intent-based search prompts across AI engines and measures share-of-voice, competitor presence, and citation sources.</p>
      <p>Run a free AI visibility audit for your brand at <a href="https://answermonk.ai">answermonk.ai</a>.</p>
    </section>
  </main>

  <footer>
    <p>© AnswerMonk — AI Search Visibility Intelligence. <a href="https://answermonk.ai">answermonk.ai</a></p>
  </footer>
</body>
</html>`;
  }

  app.get("/reports/:slug", async (req: Request, res: Response, next: NextFunction) => {
    if (!isBotRequest(req)) return next();

    const slug = req.params.slug;
    const trailingId = slug.match(/-(\d+)$/)?.[1];
    const numericOnly = /^\d+$/.test(slug);

    try {
      let session: any = null;
      if (!trailingId && !numericOnly) {
        session = await storage.getMultiSegmentSessionBySlug(slug);
      }
      if (!session && trailingId) {
        session = await storage.getMultiSegmentSession(parseInt(trailingId, 10));
      }
      if (!session && numericOnly) {
        session = await storage.getMultiSegmentSession(parseInt(slug, 10));
      }

      if (!session) {
        return next();
      }

      const html = buildReportHtml(session, slug);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600");
      return res.send(html);
    } catch (err) {
      console.error("[bot-ssr/reports]", err);
      return next();
    }
  });

  return httpServer;
}

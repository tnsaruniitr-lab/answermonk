
import path from "path";
import type { Express } from "express";
import type { Server } from "http";
import { createServer } from "http";
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
import { generateReport } from "./report/generator";
import { generateTeaserData } from "./report/teaser-generator";
import { brandIntelligenceJobs } from "@shared/schema";
import { runBrandIntelligence } from "./brand-intelligence/runner";
import { resolveGroundingUrls } from "./report/grounding-resolver";
import { desc, eq as eqDrizzle } from "drizzle-orm";
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
  const CONCURRENCY = 5;
  const queue = [...vertexUrls];
  async function worker() {
    while (queue.length > 0) {
      const url = queue.shift();
      if (!url || resolved.has(url)) continue;
      const dest = await resolveVertexRedirect(url);
      resolved.set(url, dest);
      await new Promise(r => setTimeout(r, 150));
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

function requireAdmin(req: any, res: any, next: any) {
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

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

  app.get("/api/multisegment/sessions", async (_req, res) => {
    try {
      const sessions = await storage.listMultiSegmentSessions();
      res.json(sessions);
    } catch (err) {
      console.error("Error listing multi-segment sessions:", err);
      res.status(500).json({ message: "Failed to load sessions" });
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
      res.json({ step: "unknown", detail: "No active analysis", pct: 0 });
      return;
    }
    res.json(progress);
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
        try {
          await storage.updateCitationReport(sessionId, report);
          console.log(`[segment-analysis] Persisted citation report for session ${sessionId}`);
        } catch (persistErr) {
          console.error("Failed to persist citation report:", persistErr);
        }
        try {
          await populateCitationUrls(sessionId);
          console.log(`[segment-analysis] Populated citation_urls for session ${sessionId}`);
        } catch (citErr) {
          console.error("Failed to populate citation_urls:", citErr);
        }
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

      res.json({ ...report, progressKey });
    } catch (err) {
      console.error("Segment analysis error:", err);
      analysisProgress.set(progressKey, { step: "error", detail: String(err), pct: 0, startedAt: analysisProgress.get(progressKey)?.startedAt || Date.now() });
      setTimeout(() => analysisProgress.delete(progressKey), 30000);
      res.status(500).json({ message: "Analysis failed", error: String(err) });
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
      if (isNaN(sessionId)) { res.status(400).json({ message: "sessionId required" }); return; }
      const { pool } = await import("./db");
      const conditions = ["session_id = $1"];
      const params: any[] = [sessionId];
      if (category) { params.push(category); conditions.push(`url_category = $${params.length}`); }
      if (engine) { params.push(engine); conditions.push(`engine = $${params.length}`); }
      const result = await pool.query(`
        SELECT url, domain, engine, url_category, segment_persona, title,
          COUNT(*) OVER (PARTITION BY url) as citation_count
        FROM citation_urls
        WHERE ${conditions.join(" AND ")}
        ORDER BY citation_count DESC, url
      `, params);
      res.json({ rows: result.rows });
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
      const result = await runSignalIntelligence(id);
      res.json(result);
    } catch (err) {
      console.error("[signal-intelligence] Error:", err);
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
        webSearch: z.boolean().default(false),
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

  return httpServer;
}

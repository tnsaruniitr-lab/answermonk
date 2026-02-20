
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
import { getPresetsForPersona, MARKETING_CHANNELS, AUTOMATION_SERVICES, AUTOMATION_KNOWN_TOOLS, MARKETING_VERTICALS, AUTOMATION_VERTICALS, CORPORATE_CARDS_SERVICES, CORPORATE_CARDS_VERTICALS, CORPORATE_CARDS_MODIFIERS, EXPENSE_MANAGEMENT_SERVICES, EXPENSE_MANAGEMENT_VERTICALS, EXPENSE_MANAGEMENT_MODIFIERS, ACCOUNTING_AUTOMATION_SERVICES, ACCOUNTING_AUTOMATION_VERTICALS, ACCOUNTING_AUTOMATION_MODIFIERS, INVOICE_MANAGEMENT_SERVICES, INVOICE_MANAGEMENT_VERTICALS, INVOICE_MANAGEMENT_MODIFIERS, RESTAURANT_OFFERINGS, RESTAURANT_VERTICALS, RESTAURANT_MODIFIERS, BUDGET_ADJECTIVES, DECISION_MAKERS } from "./promptgen/presets";
import { selectMiniPanel, selectMicroPanel } from "./scoring/panel";
import { runScoring } from "./scoring/runner";
import { insertSavedProfileSchema, insertMultiSegmentSessionSchema, insertSavedV2ConfigSchema } from "@shared/schema";
import { analyzePanelWebsite } from "./panel/generator";
import { runInsightsAnalysis, type InsightsInput } from "./insights";
import { runSegmentAnalysis } from "./segment-analysis";

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
    if (persona === "marketing_agency") {
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
    } else if (persona === "restaurant") {
      res.json({
        services: RESTAURANT_OFFERINGS,
        verticals: RESTAURANT_VERTICALS,
        modifiers: RESTAURANT_MODIFIERS,
        decision_makers: DECISION_MAKERS,
        budget_tiers: Object.keys(BUDGET_ADJECTIVES.restaurant),
      });
    } else {
      res.json({
        marketing_agency: {
          services: MARKETING_CHANNELS,
          verticals: MARKETING_VERTICALS,
          modifiers: MARKETING_MODIFIERS,
          decision_makers: DECISION_MAKERS,
        },
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
        restaurant: {
          services: RESTAURANT_OFFERINGS,
          verticals: RESTAURANT_VERTICALS,
          modifiers: RESTAURANT_MODIFIERS,
          decision_makers: DECISION_MAKERS,
        },
      });
    }
  });

  const ScoringRequestSchema = z.object({
    brand_name: z.string().min(1),
    brand_domain: z.string().optional(),
    mode: z.enum(["micro", "quick", "full"]),
    prompts: z.array(z.object({
      id: z.string(),
      cluster: z.string(),
      shape: z.string(),
      text: z.string(),
      slots_used: z.record(z.string()),
      tags: z.array(z.string()),
      modifier_included: z.boolean(),
      geo_included: z.boolean(),
    })),
    profile: z.object({
      persona: z.string(),
      services: z.array(z.string()),
      verticals: z.array(z.string()),
      geo: z.string().nullable(),
    }).optional(),
    source: z.string().optional(),
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
        engineCount: 3,
        source: parsed.source || null,
      });

      try {
        const result = await runScoring(
          promptsToRun as any,
          parsed.brand_name,
          parsed.brand_domain,
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
          seedType: profile?.persona || "",
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

  app.post("/api/segment-analysis/analyze", async (req, res) => {
    try {
      const { brandName, segments } = req.body;
      if (!brandName || !segments || !Array.isArray(segments)) {
        res.status(400).json({ message: "brandName and segments array required" });
        return;
      }

      const normalizedSegments = segments.map((seg: any) => ({
        id: seg.id,
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

      const report = await runSegmentAnalysis(brandName, normalizedSegments, (step, detail, pct) => {
        console.log(`[segment-analysis] ${step}: ${detail} (${pct}%)`);
      });

      res.json(report);
    } catch (err) {
      console.error("Segment analysis error:", err);
      res.status(500).json({ message: "Analysis failed", error: String(err) });
    }
  });

  return httpServer;
}

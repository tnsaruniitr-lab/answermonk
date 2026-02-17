
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
import { getPresetsForPersona, MARKETING_CHANNELS, AUTOMATION_SERVICES, AUTOMATION_KNOWN_TOOLS, MARKETING_VERTICALS, AUTOMATION_VERTICALS, BUDGET_ADJECTIVES } from "./promptgen/presets";
import { selectMiniPanel } from "./scoring/panel";
import { runScoring } from "./scoring/runner";

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
      const { query, brand, engine } = parsed;

      const result = await queryEngine(engine, query, brand);

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
      const result = generatePromptSet(profile, { seed });
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
        budget_tiers: Object.keys(BUDGET_ADJECTIVES.marketing_agency),
      });
    } else if (persona === "automation_consultant") {
      res.json({
        services: AUTOMATION_SERVICES,
        verticals: AUTOMATION_VERTICALS,
        modifiers: AUTOMATION_KNOWN_TOOLS.slice(0, 40),
        budget_tiers: Object.keys(BUDGET_ADJECTIVES.automation_consultant),
      });
    } else {
      res.json({
        marketing_agency: {
          services: MARKETING_CHANNELS,
          verticals: MARKETING_VERTICALS,
          modifiers: MARKETING_MODIFIERS,
        },
        automation_consultant: {
          services: AUTOMATION_SERVICES,
          verticals: AUTOMATION_VERTICALS,
          modifiers: AUTOMATION_KNOWN_TOOLS.slice(0, 40),
        },
      });
    }
  });

  const ScoringRequestSchema = z.object({
    brand_name: z.string().min(1),
    brand_domain: z.string().optional(),
    mode: z.enum(["quick", "full"]),
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
  });

  app.post("/api/scoring/run", async (req, res) => {
    try {
      const parsed = ScoringRequestSchema.parse(req.body);
      let promptsToRun = parsed.prompts;

      if (parsed.mode === "quick") {
        promptsToRun = selectMiniPanel(parsed.prompts as any);
      }

      const job = await storage.createScoringJob({
        brandName: parsed.brand_name,
        brandDomain: parsed.brand_domain || null,
        mode: parsed.mode,
        status: "running",
        promptCount: promptsToRun.length,
        engineCount: 3,
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
              cluster: r.cluster,
              engine: r.engine,
              raw_text: r.raw_text,
              candidates: r.extraction.candidates,
              valid: r.extraction.valid,
              brand_found: r.match.brand.brand_found,
              brand_rank: r.match.brand.brand_rank,
              match_tier: r.match.brand.match_tier,
            })),
            brand_identity: result.brand_identity,
          } as any,
        });

        res.status(200).json({
          job_id: job.id,
          score: result.score,
          prompts_used: promptsToRun.length,
          mode: parsed.mode,
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

  return httpServer;
}

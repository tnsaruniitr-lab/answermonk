
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

  /**
   * Single-engine evaluator (stub)
   * Later: call the engine API, extract top brands, determine presence + position
   */
  app.post(api.eval.run.path, (req, res) => {
    try {
      const parsed = EvalRequestSchema.parse(req.body);
      const { query, brand, engine, topN } = parsed;

      // STUB: Simulate finding the brand randomly for now
      // This allows the UI to show different states
      const randomFoundState = Math.floor(Math.random() * 3); // 0, 1, or 2
      const randomPos = randomFoundState > 0 ? Math.floor(Math.random() * 10) + 1 : null;
      
      // Generate some fake "competitors"
      const competitors = ["Salesforce", "HubSpot", "Zoho", "Pipedrive", "Monday.com"];
      // Inject the queried brand into the top list if found
      const topBrands = [...competitors];
      if (randomPos && randomPos <= topBrands.length) {
        topBrands.splice(randomPos - 1, 0, brand);
      } else if (randomFoundState > 0) {
        topBrands.push(brand);
      }
      
      const top10 = topBrands.slice(0, 10);

      const response = {
        engine,
        query,
        brand,
        found_state: randomFoundState,
        pos: randomPos,
        top10_brands: top10,
        raw_answer_text: `[Stubbed Analysis from ${engine}] Searched for "${query}". Detected "${brand}" with state ${randomFoundState} at position ${randomPos}.`,
        citations: [],
        ts: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
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

      // Build per-engine presence/pos
      const presenceByEngine: Record<string, 0 | 1 | 2> = { chatgpt: 0, gemini: 0, claude: 0, deepseek: 0 };
      const posByEngine: Record<string, number | null> = {};

      // Merge brands across engines for leaderboard seed
      const brandCounts = new Map<string, number>();

      for (const out of engineOutputs) {
        presenceByEngine[out.engine] = out.presenceState as 0 | 1 | 2;
        posByEngine[out.engine] = out.position ?? null;

        for (const b of out.topBrands) {
          const k = b.trim();
          if (!k) continue;
          brandCounts.set(k, (brandCounts.get(k) ?? 0) + 1);
        }
      }

      const presence = presenceScore(presenceByEngine, weights);
      const ranking = rankScore(posByEngine, weights, rankDecayP);

      // Naive leaderboard: by frequency across engines
      const leaderboard = [...brandCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, freq]) => ({ name, freq }));

      const response = {
        query,
        brand,
        weights,
        rankDecayP,
        presenceScore: presence,
        rankingScore: ranking,
        perEngine: { presenceByEngine, posByEngine },
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

  return httpServer;
}

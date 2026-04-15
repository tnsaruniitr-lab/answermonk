import type { Express, Request, Response } from "express";
import { pool } from "../db";

const MOCK_RESULT = {
  runMetadata: {
    requestId: "mock-001",
    theme: "sample-brand",
    brandName: "Sample Brand",
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    elapsedSec: 42,
    quotaUsed: { youtube: 612, anthropic: 0.09 },
    modesRan: ["nano", "trendingInNiche", "trendingCrossNiche"],
  },
  modes: {
    nano: {
      funnel: [
        { stage: "search_results", count: 200 },
        { stage: "duration_filter", count: 140 },
        { stage: "subs_filter", count: 89 },
        { stage: "velocity_filter", count: 34 },
        { stage: "engagement_filter", count: 21 },
        { stage: "relevance_filter", count: 15 },
        { stage: "final", count: 10 },
      ],
      totalFound: 200,
      totalKept: 10,
      videos: [
        {
          videoId: "abc123",
          title: "How We Planned a Group Trip for 12 People Without Losing Our Minds",
          url: "https://youtube.com/watch?v=abc123",
          channel: { title: "@wanderpack", subscriberCount: 18400, customUrl: "@wanderpack" },
          metrics: { viewCount: 284000, likeCount: 9800, engagementRate: 0.038, overperfRatio: 6.2, compositeScore: 8.7, durationSec: 142, ageHours: 36 },
          relevance: { score: 9, reason: "Directly addresses group travel coordination pain point", transfersTo: "trip planning" },
          seedKeyword: "group trip planning",
        },
        {
          videoId: "def456",
          title: "Budget breakdown: ₹15,000 Goa trip with 8 friends",
          url: "https://youtube.com/watch?v=def456",
          channel: { title: "@rupeetravel", subscriberCount: 31200, customUrl: "@rupeetravel" },
          metrics: { viewCount: 412000, likeCount: 14200, engagementRate: 0.041, overperfRatio: 8.1, compositeScore: 9.1, durationSec: 98, ageHours: 22 },
          relevance: { score: 8, reason: "Budget-split format aligns with coordination pain point", transfersTo: "budget hacks" },
          seedKeyword: "budget group travel india",
        },
      ],
    },
  },
  analysis: {
    patternBrief: {
      hookFormulas: [
        { template: "[number] friends, [destination], [crazy constraint]", sourceVideos: [0, 1], example: "12 friends, Goa, ₹8,000 each", whyItWorks: "Specificity creates instant relatability — viewer immediately maps their own crew", variations: ["[n] people, [budget] budget, [days] days", "Planning [destination] with [group] — here's what nobody tells you"] },
        { template: "We almost cancelled [trip] because of [coordination problem]", sourceVideos: [0], example: "We almost cancelled Manali because nobody could agree on dates", whyItWorks: "Opens on tension. Viewer has lived this. They stay to see the resolution.", variations: ["The one app that saved our [destination] trip", "This is why group trips fall apart (and how we fixed it)"] },
      ],
      narrativeArcs: [
        { name: "Problem → Tool → Relief", structure: "Open with chaos → introduce the fix → show happy outcome", timing: "5s hook + 15s problem + 20s solution + 10s payoff + 5s CTA", sourceVideos: [0, 1], whenToUse: "Onboarding and awareness content" },
        { name: "Budget Reveal", structure: "Tease final number → break down components → deliver verdict", timing: "3s tease + 25s breakdown + 10s verdict + 7s CTA", sourceVideos: [1], whenToUse: "Top-of-funnel, high shareability" },
      ],
      topCTAs: [
        { type: "follow-for-part-2", example: "Follow to see how the trip actually went", count: 8, sourceVideos: [0, 1] },
        { type: "comment-prompt", example: "Drop your biggest group trip disaster below", count: 6, sourceVideos: [0] },
      ],
      contentGapsForBrand: [
        { gap: "No content shows the real-time coordination process", evidence: "All videos show retrospective — nobody documents live chaos", brandFit: "TRYPS can own this with screen-share or notification content", priority: "high" },
        { gap: "Budget split mechanics never explained clearly", evidence: "Comments full of 'how did you split it?' questions", brandFit: "Direct product use-case — show the split screen in-app", priority: "high" },
      ],
    },
    drafts: [
      {
        number: 1,
        title: "12 friends. One group chat. Zero coordination.",
        hookSpoken: "We had 12 people, 4 cities, and a group chat with 847 unread messages. This is how we fixed it.",
        hookDerivesFrom: "hookFormulas[0]",
        arc: { setup: "Show the chaos: screenshots of the unread chat, conflicting dates, split payment fights", payoff: "Open TRYPS — one view shows who's in, who's paid, what's booked", cta: "Follow to see how the actual trip went" },
        arcDerivesFrom: "narrativeArcs[0]",
        durationSec: 55,
        vibe: "relatable-chaotic-honest",
        addresses: { brandPillar: "trip planning", audienceQuestion: "How do you coordinate with a big group?", contentGap: "Real-time coordination process" },
        difficulty: "easy",
        whyItllWork: "Opens on a feeling every viewer has had. Resolution is immediate and visual. High share potential.",
        rationaleScore: 9,
        priority: "high",
      },
      {
        number: 2,
        title: "The ₹12,000 Goa split — live breakdown",
        hookSpoken: "₹12,000. 8 people. Here's exactly how we split it so nobody felt cheated.",
        hookDerivesFrom: "hookFormulas[0] variant",
        arc: { setup: "Show total trip cost, then break it into accommodation/transport/food/activities", payoff: "TRYPS split screen — each person's amount, one-tap pay", cta: "Comment your group trip budget and I'll tell you if it's realistic" },
        arcDerivesFrom: "narrativeArcs[1]",
        durationSec: 45,
        vibe: "informative-satisfying",
        addresses: { brandPillar: "budget hacks", audienceQuestion: "How do you split costs fairly?", contentGap: "Budget split mechanics" },
        difficulty: "easy",
        whyItllWork: "Budget content always performs. Comment CTA drives engagement signal for algorithm.",
        rationaleScore: 8,
        priority: "high",
      },
    ],
    diversityCheck: { distinctHookFormulasUsed: 2, distinctNarrativeArcsUsed: 2, contentGapsAddressed: 2, brandPillarsCovered: 2 },
  },
  warnings: ["Mode 2 (mid) skipped — Quick mode selected", "2 videos had no captions — excluded from pattern extraction"],
};

async function savePlan(brandId: number, keywordsUsed: string[], language: string, mode: string, result: any): Promise<number> {
  const { rows } = await pool.query(
    `INSERT INTO shortform_plans (brand_id, keywords_used, language, mode, result)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [brandId, keywordsUsed, language, mode, JSON.stringify(result)]
  );
  return rows[0].id;
}

export function registerShortformRoutes(app: Express) {
  // ── list saved plans for a brand ──
  app.get("/api/shortform/plans/:brandId", async (req: Request, res: Response) => {
    try {
      const brandId = parseInt(req.params.brandId, 10);
      if (isNaN(brandId)) return res.status(400).json({ error: "Invalid brandId" });

      const { rows } = await pool.query(
        `SELECT id, brand_id, keywords_used, language, mode, created_at,
                result->'runMetadata' AS run_metadata,
                jsonb_array_length(COALESCE(result->'analysis'->'drafts', '[]'::jsonb)) AS draft_count,
                (SELECT COUNT(*) FROM jsonb_each(COALESCE(result->'modes', '{}'::jsonb))) AS video_mode_count
         FROM shortform_plans
         WHERE brand_id = $1
         ORDER BY created_at DESC
         LIMIT 20`,
        [brandId]
      );
      return res.json({ plans: rows });
    } catch (err) {
      console.error("[shortform/plans GET]", err);
      return res.status(500).json({ error: "Failed to fetch plans" });
    }
  });

  // ── get full result for a single plan ──
  app.get("/api/shortform/plans/:brandId/:planId", async (req: Request, res: Response) => {
    try {
      const planId = parseInt(req.params.planId, 10);
      if (isNaN(planId)) return res.status(400).json({ error: "Invalid planId" });

      const { rows } = await pool.query(
        `SELECT * FROM shortform_plans WHERE id = $1`,
        [planId]
      );
      if (rows.length === 0) return res.status(404).json({ error: "Plan not found" });
      return res.json(rows[0]);
    } catch (err) {
      console.error("[shortform/plan GET]", err);
      return res.status(500).json({ error: "Failed to fetch plan" });
    }
  });

  // ── create new plan (proxy to Claude + save) ──
  app.post("/api/shortform/plan", async (req: Request, res: Response) => {
    const upstream = process.env.SHORTFORM_API_URL || null;
    const secret = process.env.SHORTFORM_API_SECRET || null;
    const { brandId, keywords, brand, modes } = req.body;
    const keywordsUsed: string[] = keywords?.seeds ?? [];
    const language: string = brand?.draftLanguage ?? "en";
    const mode: string = (modes?.mid === true) ? "full" : "quick";

    let result: any;

    if (!upstream || !secret) {
      await new Promise(r => setTimeout(r, 1500));
      result = { ...MOCK_RESULT, _mock: true };
    } else {
      try {
        const upstreamRes = await fetch(`${upstream}/api/mine`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${secret}`,
          },
          body: JSON.stringify(req.body),
          signal: AbortSignal.timeout(120_000),
        });
        if (!upstreamRes.ok) {
          const body = await upstreamRes.json().catch(() => ({}));
          return res.status(upstreamRes.status).json(body);
        }
        result = await upstreamRes.json();
      } catch (err: any) {
        const isTimeout = err.name === "TimeoutError";
        console.error("[shortform proxy] error:", err.message);
        return res.status(isTimeout ? 504 : 502).json({
          error: isTimeout ? "Request timed out — try Quick mode or fewer keywords" : "Content planner unavailable",
          code: isTimeout ? 504 : 502,
        });
      }
    }

    // Persist the result
    let planId: number | null = null;
    if (brandId && typeof brandId === "number") {
      try {
        planId = await savePlan(brandId, keywordsUsed, language, mode, result);
      } catch (err) {
        console.error("[shortform] failed to save plan:", err);
      }
    }

    return res.json({ ...result, _planId: planId });
  });
}

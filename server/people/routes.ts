import type { Express, Request, Response } from "express";
import { pool } from "../db";
import { getPeopleConfig, savePeopleConfig } from "./config";

function extractNameFromLinkedInUrl(url: string): string {
  try {
    const match = url.match(/linkedin\.com\/in\/([^/?#]+)/);
    if (!match) return "Unknown";
    return match[1]
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  } catch {
    return "Unknown";
  }
}

export function registerPeopleRoutes(app: Express): void {
  app.post("/api/people/crawl", async (req: Request, res: Response) => {
    try {
      const { linkedinUrl } = req.body;
      if (!linkedinUrl || typeof linkedinUrl !== "string") {
        return res.status(400).json({ error: "linkedinUrl is required" });
      }

      const { crawlLinkedInProfile, buildAnchorGroups } = await import("./linkedin");
      const profile = await crawlLinkedInProfile(linkedinUrl);

      const slug = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const name = profile.name || extractNameFromLinkedInUrl(linkedinUrl);

      const { rows } = await pool.query(
        `INSERT INTO people_sessions
          (slug, linkedin_url, name, headline, "current_role", current_company,
           past_companies, roles, education, location, industry, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING id`,
        [
          slug, linkedinUrl, name, profile.headline, profile.currentRole,
          profile.currentCompany, profile.pastCompanies, profile.roles,
          profile.education, profile.location, profile.industry,
          "selecting",
        ]
      );

      const sessionId = rows[0].id;
      const anchors = buildAnchorGroups(profile);
      return res.json({ sessionId, slug, name, profile, anchors, crawlSuccess: profile.crawlSuccess });
    } catch (err) {
      console.error("[api/people/crawl]", err);
      return res.status(500).json({ error: "Crawl failed" });
    }
  });

  app.post("/api/people/run/:sessionId", async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId, 10);
      if (isNaN(sessionId)) return res.status(400).json({ error: "Invalid sessionId" });

      const { anchors } = req.body;
      if (anchors) {
        await pool.query(
          `UPDATE people_sessions SET selected_anchors = $1 WHERE id = $2`,
          [JSON.stringify(anchors), sessionId]
        );
      }

      const config = await getPeopleConfig();

      const { rows: capRows } = await pool.query(
        `WITH cap AS (SELECT COUNT(*) AS cnt FROM people_sessions WHERE status = 'analyzing')
         UPDATE people_sessions SET status = 'analyzing'
         WHERE id = $1 AND (SELECT cnt FROM cap) < $2
         RETURNING id`,
        [sessionId, config.maxConcurrentAudits]
      );

      if (capRows.length === 0) {
        await pool.query(
          `UPDATE people_sessions SET status = 'queued' WHERE id = $1`,
          [sessionId]
        );
        return res.json({ queued: true, sessionId });
      }

      const { runPeopleAudit } = await import("./runner");
      runPeopleAudit(sessionId, config).catch((err) => {
        console.error("[api/people/run] async error:", err);
      });

      return res.json({ started: true, sessionId });
    } catch (err) {
      console.error("[api/people/run]", err);
      return res.status(500).json({ error: "Failed to start audit" });
    }
  });

  app.get("/api/people/session/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

      const { rows } = await pool.query(
        `SELECT * FROM people_sessions WHERE id = $1`,
        [id]
      );
      if (rows.length === 0) return res.status(404).json({ error: "Session not found" });
      return res.json(rows[0]);
    } catch (err) {
      console.error("[api/people/session]", err);
      return res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  app.get("/api/people/report/:slug", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;

      const { rows: sessionRows } = await pool.query(
        `SELECT * FROM people_sessions WHERE slug = $1`,
        [slug]
      );
      if (sessionRows.length === 0) return res.status(404).json({ error: "Session not found" });
      const session = sessionRows[0];

      const { rows: scoreRows } = await pool.query(
        `SELECT * FROM people_scores WHERE session_id = $1`,
        [session.id]
      );
      const scores = scoreRows[0] ?? null;

      const { rows: resultRows } = await pool.query(
        `SELECT * FROM people_query_results WHERE session_id = $1 ORDER BY track, query_index, engine`,
        [session.id]
      );

      return res.json({
        session,
        scores: scores
          ? {
              recognitionScore: scores.recognition_score,
              recognitionGrade: scores.recognition_grade,
              proofScore: scores.proof_score,
              proofGrade: scores.proof_grade,
              diagnosticText: scores.diagnostic_text,
            }
          : null,
        reportData: scores?.report_data ?? null,
        results: resultRows,
      });
    } catch (err) {
      console.error("[api/people/report]", err);
      return res.status(500).json({ error: "Failed to fetch report" });
    }
  });

  app.get("/api/people/config", async (_req: Request, res: Response) => {
    try {
      const config = await getPeopleConfig();
      return res.json(config);
    } catch (err) {
      console.error("[api/people/config GET]", err);
      return res.status(500).json({ error: "Failed to load config" });
    }
  });

  app.post("/api/people/config", async (req: Request, res: Response) => {
    try {
      const updates = req.body;
      if (!updates || typeof updates !== "object") {
        return res.status(400).json({ error: "Invalid config" });
      }
      await savePeopleConfig(updates);
      const saved = await getPeopleConfig();
      return res.json(saved);
    } catch (err) {
      console.error("[api/people/config POST]", err);
      return res.status(500).json({ error: "Failed to save config" });
    }
  });

  app.get("/api/people/sessions", async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const offset = parseInt(req.query.offset as string) || 0;

      const { rows } = await pool.query(
        `SELECT ps.id, ps.slug, ps.name, ps.linkedin_url, ps.status,
                ps.created_at, ps.error_message,
                ps.selected_anchors,
                ps.current_company, ps.current_role,
                ps.past_companies, ps.roles, ps.education,
                pc.recognition_score, pc.recognition_grade,
                pc.proof_score, pc.proof_grade
         FROM people_sessions ps
         LEFT JOIN people_scores pc ON pc.session_id = ps.id
         ORDER BY ps.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const { rows: countRows } = await pool.query(
        `SELECT COUNT(*) AS total FROM people_sessions`
      );

      return res.json({ sessions: rows, total: parseInt(countRows[0].total) });
    } catch (err) {
      console.error("[api/people/sessions]", err);
      return res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.get("/api/people/sessions/:id/detail", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

      const [sessionRes, scoresRes, resultsRes] = await Promise.all([
        pool.query(`SELECT * FROM people_sessions WHERE id = $1`, [id]),
        pool.query(`SELECT * FROM people_scores WHERE session_id = $1`, [id]),
        pool.query(
          `SELECT track, query_index, query_text, engine, round,
                  raw_response, identity_match, cited_urls, target_rank, target_found,
                  stated_facts, error
           FROM people_query_results
           WHERE session_id = $1
           ORDER BY track, query_index, round, engine`,
          [id]
        ),
      ]);

      if (sessionRes.rows.length === 0) return res.status(404).json({ error: "Not found" });

      return res.json({
        session: sessionRes.rows[0],
        scores: scoresRes.rows[0] ?? null,
        results: resultsRes.rows,
      });
    } catch (err) {
      console.error("[api/people/sessions/detail]", err);
      return res.status(500).json({ error: "Failed to fetch detail" });
    }
  });
}

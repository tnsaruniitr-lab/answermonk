import { readFileSync, existsSync } from "fs";
import { gunzipSync } from "zlib";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { pool } from "../db";

function getSeedDir(): string {
  try {
    if (import.meta.dirname) return import.meta.dirname;
  } catch {}
  try {
    return dirname(fileURLToPath(import.meta.url));
  } catch {}
  return join(process.cwd(), "server", "seed");
}

const SEED_DIR = getSeedDir();

async function seedIfNeeded() {
  const sessionsGz = join(SEED_DIR, "sessions.jsonl.gz");
  if (!existsSync(sessionsGz)) {
    console.log("[seed] No seed files found, skipping.");
    return;
  }

  const client = await pool.connect();
  try {
    const check = await client.query("SELECT COUNT(*) as cnt FROM multi_segment_sessions WHERE id IN (11, 14)");
    if (parseInt(check.rows[0].cnt) >= 2) {
      console.log("[seed] Sessions 11 & 14 already exist, skipping seed.");
      return;
    }

    console.log("[seed] Seeding production database with demo data...");

    if (existsSync(sessionsGz)) {
      const raw = gunzipSync(readFileSync(sessionsGz)).toString("utf-8");
      for (const line of raw.trim().split("\n")) {
        const r = JSON.parse(line);
        await client.query(
          `INSERT INTO multi_segment_sessions (id, brand_name, brand_domain, prompts_per_segment, segments, citation_report, cached_report, session_type, parent_session_id, competitor_name, parent_brand_name, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
           ON CONFLICT (id) DO NOTHING`,
          [r.id, r.brand_name, r.brand_domain, r.prompts_per_segment,
           JSON.stringify(r.segments), r.citation_report ? JSON.stringify(r.citation_report) : null,
           r.cached_report ? JSON.stringify(r.cached_report) : null,
           r.session_type, r.parent_session_id || null, r.competitor_name || null,
           r.parent_brand_name || null, r.created_at]
        );
      }
      await client.query("SELECT setval('multi_segment_sessions_id_seq', GREATEST((SELECT MAX(id) FROM multi_segment_sessions), 1))");
      console.log("[seed] Sessions inserted.");
    }

    const cacheFile = join(SEED_DIR, "cache.jsonl");
    if (existsSync(cacheFile)) {
      for (const line of readFileSync(cacheFile, "utf-8").trim().split("\n")) {
        const r = JSON.parse(line);
        await client.query(
          `INSERT INTO report_cache (id, cache_key, report_data, created_at)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (cache_key) DO NOTHING`,
          [r.id, r.cache_key, JSON.stringify(r.report_data), r.created_at]
        );
      }
      await client.query("SELECT setval('report_cache_id_seq', GREATEST((SELECT MAX(id) FROM report_cache), 1))");
      console.log("[seed] Cache inserted.");
    }

    const templatesFile = join(SEED_DIR, "templates.jsonl");
    if (existsSync(templatesFile)) {
      for (const line of readFileSync(templatesFile, "utf-8").trim().split("\n")) {
        const r = JSON.parse(line);
        await client.query(
          `INSERT INTO saved_v2_configs (id, name, brand_name, brand_domain, prompts_per_segment, segments, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT (id) DO NOTHING`,
          [r.id, r.name, r.brand_name, r.brand_domain, r.prompts_per_segment, JSON.stringify(r.segments), r.created_at]
        );
      }
      await client.query("SELECT setval('saved_v2_configs_id_seq', GREATEST((SELECT MAX(id) FROM saved_v2_configs), 1))");
      console.log("[seed] Templates inserted.");
    }

    const leadsFile = join(SEED_DIR, "leads.jsonl");
    if (existsSync(leadsFile)) {
      const content = readFileSync(leadsFile, "utf-8").trim();
      if (content) {
        for (const line of content.split("\n")) {
          const r = JSON.parse(line);
          await client.query(
            `INSERT INTO teaser_leads (id, session_id, brand_name, interests, comments, created_at)
             VALUES ($1,$2,$3,$4,$5,$6)
             ON CONFLICT (id) DO NOTHING`,
            [r.id, r.session_id, r.brand_name, r.interests, r.comments, r.created_at]
          );
        }
        await client.query("SELECT setval('teaser_leads_id_seq', GREATEST((SELECT MAX(id) FROM teaser_leads), 1))");
        console.log("[seed] Leads inserted.");
      }
    }

    console.log("[seed] Production seed complete!");
  } catch (err) {
    console.error("[seed] Error during seeding:", err);
  } finally {
    client.release();
  }
}

export { seedIfNeeded };

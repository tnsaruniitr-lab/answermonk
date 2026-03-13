/**
 * LLM analysis pass: for each crawled page, extract brand mentions,
 * services, trust signals, sentiment, and framing using Gemini Flash.
 * Usage: node server/crawl/analyze-crawled-pages.mjs [sessionId]
 * Default sessionId: 77
 */
import pg from "pg";
import { GoogleGenAI } from "@google/genai";

const SESSION_ID = parseInt(process.argv[2] || "77");
const CONCURRENCY = 3;
const DELAY_MS = 600;

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const gemini = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

function buildPrompt(page) {
  const headings = (page.headings || []).map(h => `[${h.tag}] ${h.text}`).join("\n");
  const listItems = (page.list_items || []).slice(0, 20).join("\n");
  const tableRows = (page.table_rows || []).slice(0, 15).join("\n");
  const brandWindows = (page.brand_windows || []).map(b =>
    `BRAND "${b.name}":\n${b.windows.slice(0, 2).join("\n---\n")}`
  ).join("\n\n");
  const trustSigs = (page.trust_signals || []).map(t => `${t.label}: ${t.snippet}`).join("\n");

  return `You are analyzing a web page to extract brand intelligence for a GEO (Generative Engine Optimization) audit.

PAGE INFO:
URL: ${page.url}
Category: ${page.url_category}
Title: ${page.title || "N/A"}
Meta: ${page.meta_description || "N/A"}

HEADINGS:
${headings || "None"}

LIST ITEMS (rankings, services, features):
${listItems || "None"}

TABLE ROWS:
${tableRows || "None"}

BRAND MENTION WINDOWS (40 words each side):
${brandWindows || "None"}

TRUST SIGNALS FOUND:
${trustSigs || "None"}

---

For EACH brand mentioned on this page, output a JSON array. Each element:
{
  "brand": "<exact brand name as found on page>",
  "brand_slug": "<lowercase slug, e.g. valeo, nightingale, care24>",
  "mention_count": <integer>,
  "rank_position": <integer or null — only if this is a ranked list/comparison>,
  "attributes": ["<descriptor1>", "<descriptor2>", ...],
  "services": ["<service1>", "<service2>", ...],
  "trust_signals": ["<signal1>", ...],
  "sentiment": "positive" | "neutral" | "negative",
  "framing": "recommended" | "listed" | "compared" | "criticized" | "mentioned",
  "snippets": ["<1-2 key text excerpts 20-30 words each>"]
}

Rules:
- Only include brands that are ACTUALLY mentioned on the page. Do not invent.
- For brand's own homepage/service pages: the brand is always "mentioned" with full attributes.
- For comparison articles: extract ranking position from numbered lists or headings.
- attributes: descriptive words/phrases used (e.g. "premium", "JCI-accredited", "24/7 nursing", "affordable")
- services: specific services mentioned for that brand (e.g. "home nursing", "physiotherapy", "elderly care")
- trust_signals: certifications, ratings, years of operation, patient counts found for that brand
- sentiment: how the page frames the brand overall
- framing: recommended = actively suggested; listed = appears in a list without endorsement; compared = part of comparison; criticized = negative framing; mentioned = brief/neutral mention

Respond ONLY with valid JSON array. No markdown, no explanation.`;
}

function parseGeminiResponse(text) {
  try {
    const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const parsed = JSON.parse(clean);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(item =>
      item && typeof item.brand === "string" && item.brand.length > 0
    );
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { }
    }
    return [];
  }
}

async function analyzePage(page) {
  const prompt = buildPrompt(page);
  const response = await gemini.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { temperature: 0.1, maxOutputTokens: 2048 },
  });
  const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return parseGeminiResponse(text);
}

async function storeMentions(pageUrl, sessionId, mentions) {
  for (const m of mentions) {
    if (!m.brand || !m.brand_slug) continue;
    await pool.query(`
      INSERT INTO page_brand_mentions (crawled_page_url, session_id, brand, mention_count, rank_position, attributes, services, trust_signals, sentiment, framing, snippets)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (crawled_page_url, brand) DO UPDATE SET
        mention_count = EXCLUDED.mention_count,
        rank_position = EXCLUDED.rank_position,
        attributes = EXCLUDED.attributes,
        services = EXCLUDED.services,
        trust_signals = EXCLUDED.trust_signals,
        sentiment = EXCLUDED.sentiment,
        framing = EXCLUDED.framing,
        snippets = EXCLUDED.snippets,
        analyzed_at = NOW()
    `, [
      pageUrl, sessionId,
      m.brand_slug || m.brand.toLowerCase().replace(/[^a-z0-9]/g, ""),
      m.mention_count || 1,
      m.rank_position || null,
      JSON.stringify(m.attributes || []),
      JSON.stringify(m.services || []),
      JSON.stringify(m.trust_signals || []),
      m.sentiment || "neutral",
      m.framing || "mentioned",
      JSON.stringify(m.snippets || []),
    ]);
  }
}

async function main() {
  const { rows: pages } = await pool.query(`
    SELECT cp.id, cp.url, cp.domain, cp.url_category, cp.title, cp.meta_description,
           cp.headings, cp.list_items, cp.table_rows, cp.brand_windows, cp.trust_signals,
           cp.word_count
    FROM crawled_pages cp
    WHERE cp.session_id = $1
      AND cp.accessible = true
      AND NOT EXISTS (
        SELECT 1 FROM page_brand_mentions pbm WHERE pbm.crawled_page_url = cp.url
      )
    ORDER BY cp.word_count DESC
  `, [SESSION_ID]);

  console.log(`Analyzing ${pages.length} pages for session ${SESSION_ID}`);

  let done = 0, success = 0, failed = 0;
  const queue = [...pages];

  async function worker() {
    while (queue.length > 0) {
      const page = queue.shift();
      if (!page) break;
      try {
        const mentions = await analyzePage(page);
        await storeMentions(page.url, SESSION_ID, mentions);
        done++;
        success++;
        const brandSummary = mentions.map(m => `${m.brand_slug}(${m.sentiment || "?"}${m.rank_position != null ? "#" + m.rank_position : ""})`).join(", ") || "no brands";
        console.log(`[${done}/${pages.length}] OK  ${page.url.slice(0, 65)}`);
        console.log(`           → ${brandSummary.slice(0, 100)}`);
      } catch (err) {
        done++;
        failed++;
        console.log(`[${done}/${pages.length}] ERR ${page.url.slice(0, 65)} — ${err.message?.slice(0, 80)}`);
      }
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  console.log(`\nDone. ${success} analyzed, ${failed} failed out of ${done} total.`);
  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });

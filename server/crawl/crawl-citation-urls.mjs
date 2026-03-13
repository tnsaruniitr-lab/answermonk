/**
 * Crawl all citation URLs for a session and store structured data in crawled_pages.
 * Usage: node server/crawl/crawl-citation-urls.mjs [sessionId]
 * Default sessionId: 77
 */
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import pg from "pg";
import * as crypto from "crypto";

const SESSION_ID = parseInt(process.argv[2] || "77");
const CONCURRENCY = 5;
const DELAY_MS = 800;
const TIMEOUT_MS = 12000;

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const BRAND_VARIANTS = {
  valeo: ["Valeo Health", "Valeo Healthcare", "Valeo"],
  vestacare: ["Vesta Care", "VestaCare"],
  care24: ["Care24", "Care 24"],
  nightingaledubai: ["Nightingale Dubai", "Nightingale"],
  firstresponsehealthcare: ["First Response Healthcare", "First Response"],
  loyalhealthcare: ["Loyal Healthcare"],
  aimshealthcare: ["AIMS Healthcare", "Aims Healthcare"],
  manzilhealth: ["Manzil Health", "Manzil"],
  emirateshomenursing: ["Emirates Home Nursing"],
  enayati: ["Enayati"],
  lifewinhomecare: ["Lifewin Home Care", "Lifewin"],
  neohealth: ["Neo Health", "NeoHealth"],
  vitalzone: ["Vital Zone", "VitalZone"],
  yadalamal: ["Yad Al Amal"],
  carehubuae: ["CareHub UAE", "Care Hub"],
  eurekahomehealthcare: ["Eureka Home Healthcare", "Eureka"],
  jprhomehealthcare: ["JPR Home Healthcare", "JPR Healthcare"],
  dardoc: ["DarDoc"],
  baytihealth: ["Bayti Health", "Bayti"],
  elderlycareindubai: ["Elderly Care Dubai"],
  asterclinic: ["Aster Clinic", "Aster Clinics"],
  asterdmhealthcare: ["Aster DM Healthcare", "Aster DM"],
  asterhospitals: ["Aster Hospitals", "Aster Hospital"],
  emahs: ["EMAHS"],
  hmsmirdifhospital: ["HMS Mirdif Hospital", "HMS Mirdif"],
  nmc: ["NMC Health", "NMC"],
  burjeel: ["Burjeel Hospital", "Burjeel"],
  dha: ["DHA", "Dubai Health Authority"],
};

const ALL_BRAND_TERMS = Object.entries(BRAND_VARIANTS).flatMap(([slug, names]) =>
  names.map(name => ({ slug, name }))
);

const TRUST_PATTERNS = [
  { label: "DHA Licensed", regex: /\bDHA[-\s]?licens/i },
  { label: "MOHAP Approved", regex: /\bMOHAP\b/i },
  { label: "JCI Accredited", regex: /\bJCI[-\s]?accredit/i },
  { label: "ISO Certified", regex: /\bISO\s*\d{4,5}/i },
  { label: "24/7 Service", regex: /24\s*[\/x]\s*7|24\s*hours?\s*a\s*day/i },
  { label: "Licensed", regex: /\blicens(?:ed|ing)\b/i },
  { label: "Accredited", regex: /\baccredited\b/i },
  { label: "Certified", regex: /\bcertified\b/i },
];

function extractBrandWindows(text, windowWords = 40) {
  const words = text.split(/\s+/);
  const results = [];
  for (const { slug, name } of ALL_BRAND_TERMS) {
    const nameLower = name.toLowerCase();
    for (let i = 0; i < words.length; i++) {
      if (words.slice(i, i + name.split(" ").length).join(" ").toLowerCase().includes(nameLower)) {
        const start = Math.max(0, i - windowWords);
        const end = Math.min(words.length, i + name.split(" ").length + windowWords);
        const snippet = words.slice(start, end).join(" ");
        const existing = results.find(r => r.slug === slug);
        if (existing) {
          if (existing.windows.length < 3) existing.windows.push(snippet);
        } else {
          results.push({ slug, name, windows: [snippet] });
        }
        i += name.split(" ").length;
      }
    }
  }
  return results;
}

function extractTrustSignals(text) {
  const found = [];
  for (const { label, regex } of TRUST_PATTERNS) {
    if (regex.test(text)) {
      const match = text.match(regex);
      if (match) {
        const idx = match.index;
        const snippet = text.slice(Math.max(0, idx - 30), idx + 80).replace(/\s+/g, " ").trim();
        found.push({ label, snippet });
      }
    }
  }
  return found;
}

function cleanText($) {
  $("script, style, nav, footer, header, aside, noscript, iframe, [class*='cookie'], [class*='banner'], [class*='popup'], [id*='cookie']").remove();
  const main = $("main, article, [role='main'], #content, .content, .main-content").first();
  const text = (main.length ? main : $("body")).text();
  return text.replace(/\s+/g, " ").trim();
}

function extractHeadings($) {
  const headings = [];
  $("h1, h2, h3").each((_, el) => {
    const t = $(el).text().trim();
    if (t && t.length > 2 && t.length < 200) headings.push({ tag: el.name, text: t });
  });
  return headings.slice(0, 20);
}

function extractListItems($) {
  const items = [];
  $("li").each((_, el) => {
    const t = $(el).text().replace(/\s+/g, " ").trim();
    if (t && t.length > 5 && t.length < 300) items.push(t);
  });
  return items.slice(0, 40);
}

function extractTableRows($) {
  const rows = [];
  $("tr").each((_, el) => {
    const cells = [];
    $(el).find("td, th").each((__, cell) => {
      const t = $(cell).text().replace(/\s+/g, " ").trim();
      if (t) cells.push(t);
    });
    const row = cells.join(" | ");
    if (row.length > 5 && row.length < 400) rows.push(row);
  });
  return rows.slice(0, 30);
}

function contentHash(text) {
  return crypto.createHash("md5").update(text.slice(0, 500).toLowerCase().replace(/\s+/g, " ").trim()).digest("hex");
}

async function crawlUrl(url, urlCategory) {
  const result = { url, urlCategory, status: null, title: null, metaDescription: null, wordCount: 0, publishDate: null, hash: null, headings: [], listItems: [], tableRows: [], brandWindows: [], trustSignals: [], accessible: false, error: null };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    clearTimeout(timer);
    result.status = res.status;

    if (!res.ok) { result.error = `HTTP ${res.status}`; return result; }

    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html") && !ct.includes("application/xhtml")) {
      result.error = "Non-HTML content"; return result;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    result.title = $("title").first().text().trim().slice(0, 200) || null;
    result.metaDescription = $('meta[name="description"]').attr("content")?.trim().slice(0, 400)
      || $('meta[property="og:description"]').attr("content")?.trim().slice(0, 400) || null;

    const datePatterns = [
      /<meta\s+property="article:published_time"\s+content="([^"]+)"/i,
      /<meta\s+name="date"\s+content="([^"]+)"/i,
      /<time[^>]*datetime="([^"]+)"/i,
      /"datePublished"\s*:\s*"([^"]+)"/i,
    ];
    for (const p of datePatterns) {
      const m = html.match(p);
      if (m) { result.publishDate = m[1]; break; }
    }

    const bodyText = cleanText($);
    result.wordCount = bodyText.split(/\s+/).length;
    result.hash = contentHash(bodyText);
    result.headings = extractHeadings($);
    result.listItems = extractListItems($);
    result.tableRows = extractTableRows($);
    result.brandWindows = extractBrandWindows(bodyText);
    result.trustSignals = extractTrustSignals(bodyText);
    result.accessible = result.wordCount > 50;

  } catch (err) {
    result.error = err.message?.slice(0, 100) || "Unknown error";
  }
  return result;
}

async function storePage(r, domain, sessionId) {
  await pool.query(`
    INSERT INTO crawled_pages (url, domain, url_category, session_id, http_status, accessible, title, meta_description, word_count, publish_date, content_hash, headings, list_items, table_rows, brand_windows, trust_signals)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    ON CONFLICT (url) DO UPDATE SET
      http_status = EXCLUDED.http_status,
      accessible = EXCLUDED.accessible,
      title = EXCLUDED.title,
      meta_description = EXCLUDED.meta_description,
      word_count = EXCLUDED.word_count,
      publish_date = EXCLUDED.publish_date,
      content_hash = EXCLUDED.content_hash,
      headings = EXCLUDED.headings,
      list_items = EXCLUDED.list_items,
      table_rows = EXCLUDED.table_rows,
      brand_windows = EXCLUDED.brand_windows,
      trust_signals = EXCLUDED.trust_signals,
      crawled_at = NOW()
  `, [
    r.url, domain, r.urlCategory, sessionId,
    r.status, r.accessible, r.title, r.metaDescription,
    r.wordCount, r.publishDate, r.hash,
    JSON.stringify(r.headings), JSON.stringify(r.listItems),
    JSON.stringify(r.tableRows), JSON.stringify(r.brandWindows),
    JSON.stringify(r.trustSignals),
  ]);
}

async function main() {
  const { rows: urlRows } = await pool.query(`
    SELECT url, domain, url_category FROM citation_urls
    WHERE session_id = $1
    ORDER BY citation_count DESC
  `, [SESSION_ID]);

  console.log(`Crawling ${urlRows.length} URLs for session ${SESSION_ID}`);

  let done = 0, success = 0, failed = 0;
  const queue = [...urlRows];

  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      const result = await crawlUrl(item.url, item.url_category);
      await storePage(result, item.domain, SESSION_ID);
      done++;
      if (result.accessible) success++;
      else failed++;
      const status = result.accessible ? "OK" : (result.error || `HTTP ${result.status}`);
      const brands = result.brandWindows.map(b => b.slug).join(", ") || "none";
      const trust = result.trustSignals.map(t => t.label).join(", ") || "none";
      console.log(`[${done}/${urlRows.length}] ${status.padEnd(12)} ${item.url.slice(0, 70)}`);
      if (result.accessible) {
        console.log(`           brands: ${brands.slice(0, 80)} | trust: ${trust.slice(0, 60)}`);
      }
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  console.log(`\nDone. ${success} accessible, ${failed} failed out of ${done} total.`);
  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });

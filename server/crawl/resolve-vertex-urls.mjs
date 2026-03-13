/**
 * One-time script: resolves Gemini Vertex redirect URLs for a session
 * and rebuilds citation_urls with accurate full page URLs.
 *
 * Usage: node server/crawl/resolve-vertex-urls.mjs [sessionId]
 * Default sessionId: 77
 */

import https from "https";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const SESSION_ID = parseInt(process.argv[2] || "77");
const CONCURRENCY = 5;
const DELAY_MS = 200;

function classifyCitationUrl(url, engine) {
  const u = (url || "").toLowerCase();
  if (u.includes("reddit.com") || u.includes("quora.com") || u.includes("/forum") || u.includes("expatsofdubai")) return "Community Thread";
  if (u.includes("indeed.com") || u.includes("/jobs") || u.includes("/careers") || u.includes("/cmp/")) return "Jobs Listing";
  if (u.includes("linkedin.com")) return "Social Media Profile";
  if (u.includes("dha.gov") || u.includes("mohap") || u.includes("dhcc.ae") || u.includes("ocat.ae") || u.includes("haad.")) return "Government / Regulatory";
  if (u.includes("mordorintelligence") || u.includes("statista") || u.includes("cbinsights")) return "Market Research";
  const newsDomains = ["gulfnews","zawya","thenational","baabeetv","digitalmarketingdeal","meamarkets","dxbnews","uaetimes","uaedigital","arabianews","linkcentre"];
  if (newsDomains.some(d => u.includes(d))) return "News / PR";
  if (u.includes("/press-release") || u.includes("/press/")) return "News / PR";
  const reviewDomains = ["trustpilot","trustindex","sitejabber","provenexpert","goprofiled","bestthings","zaubee","dubaireview","doctify","okadoc"];
  if (reviewDomains.some(d => u.includes(d))) return "Review Platform";
  if (u.includes("/reviews")) return "Review Platform";
  const dirDomains = ["healthfinder","ensun.io","elderlycareindubai","trusteddoctors","health1.ae","edarabia","justdial","zorg4u","bestinhood","servicemarket","dubai.clinic","edurar","justlife","arabiamd","dubaisbest","2gis.ae"];
  if (dirDomains.some(d => u.includes(d))) return "Directory Listing";
  if (u.includes("/listing") || u.includes("/listings/") || u.includes("/search/")) return "Directory Listing";
  const compPhrases = ["best-home","top-home","best-nursing","home-health-care-agencies","top-10","best-10","complete-guide","best-home-healthcare","top-rated"];
  if (compPhrases.some(p => u.includes(p))) return "Comparison Article";
  if (u.includes("/blog/") || u.includes("/article") || u.includes("/post/") || u.includes("/news/") || u.includes("/insights/")) return "Brand Blog / Article";
  if (u.includes("/about") || u.includes("/team") || u.includes("/contact") || u.includes("/faq") || u.includes("/accreditation")) return "Brand About / Contact";
  const serviceTerms = ["/home-nursing","/doctor","/physio","/elderly","/palliative","/wound","/iv-","/nursing","/services","/home-care","/healthcare","/at-home","/nurse"];
  if (serviceTerms.some(p => u.includes(p))) return "Brand Service Page";
  if (u.match(/^https?:\/\/[^/]+\/?$/) || u.endsWith("/")) return "Brand Homepage";
  return "Brand Inner Page";
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/.*$/, "");
  }
}

function extractBrand(domain) {
  const generic = ["www","m","en","blog","mobile","shop","store","app","go","get","my","help","support","mail","api","cdn","media","news","jobs","careers"];
  const parts = domain.split(".");
  return generic.includes(parts[0]) ? parts[1] : parts[0];
}

function resolveRedirect(url, timeoutMs = 8000) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const options = {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: "HEAD",
        timeout: timeoutMs,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; GEO-resolver/1.0)" },
      };
      const req = https.request(options, (res) => {
        const loc = res.headers["location"];
        if (loc) {
          try {
            const resolved = loc.startsWith("http") ? loc : new URL(loc, url).href;
            resolve({ ok: true, url: resolved });
          } catch {
            resolve({ ok: false, url });
          }
        } else {
          resolve({ ok: true, url });
        }
      });
      req.on("error", () => resolve({ ok: false, url }));
      req.on("timeout", () => { req.destroy(); resolve({ ok: false, url }); });
      req.end();
    } catch {
      resolve({ ok: false, url });
    }
  });
}

async function resolveInBatches(urls, concurrency = CONCURRENCY) {
  const results = new Map();
  const queue = [...urls];
  let done = 0;

  async function worker() {
    while (queue.length > 0) {
      const url = queue.shift();
      if (!url || results.has(url)) continue;
      const result = await resolveRedirect(url);
      results.set(url, result.url);
      done++;
      if (done % 50 === 0) {
        console.log(`  Resolved ${done}/${urls.length}...`);
      }
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

async function run() {
  console.log(`\n=== Resolving Vertex URLs for session ${SESSION_ID} ===\n`);

  // Step 1: Extract all citations from raw session JSON
  const { rows } = await pool.query(`
    SELECT
      seg->>'persona' as segment_persona,
      run->>'engine' as engine,
      run->>'prompt_text' as prompt_text,
      cite->>'url' as cite_url,
      cite->>'title' as cite_title
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
  `, [SESSION_ID]);

  console.log(`Found ${rows.length} total citation rows from raw JSON`);

  // Step 2: Collect unique Vertex URLs to resolve
  const vertexUrls = [...new Set(
    rows
      .filter(r => r.engine === "gemini" && r.cite_url?.includes("vertexaisearch"))
      .map(r => r.cite_url)
  )];

  console.log(`Unique Vertex redirect URLs to resolve: ${vertexUrls.length}`);
  console.log(`ChatGPT direct URL rows: ${rows.filter(r => r.engine === "chatgpt").length}`);
  console.log(`\nResolving Vertex redirects (${CONCURRENCY} concurrent)...\n`);

  // Step 3: Resolve all Vertex URLs
  const resolved = await resolveInBatches(vertexUrls);

  // Stats
  let successCount = 0;
  let fallbackCount = 0;
  for (const [vertexUrl, resolvedUrl] of resolved) {
    if (resolvedUrl !== vertexUrl) successCount++;
    else fallbackCount++;
  }
  console.log(`\nResolved: ${successCount} succeeded, ${fallbackCount} unchanged (expired/failed)\n`);

  // Step 4: Build the final rows for citation_urls
  const insertRows = [];
  for (const row of rows) {
    let finalUrl = "";

    if (row.engine === "gemini") {
      if (row.cite_url?.includes("vertexaisearch")) {
        // Use resolved URL; fall back to https://title (domain) if failed
        const resolvedUrl = resolved.get(row.cite_url);
        if (resolvedUrl && resolvedUrl !== row.cite_url) {
          finalUrl = resolvedUrl;
        } else {
          // Fallback: use title as domain
          const t = (row.cite_title || "").trim();
          finalUrl = t ? (t.startsWith("http") ? t : "https://" + t) : "";
        }
      } else if (row.cite_url) {
        finalUrl = row.cite_url;
      }
    } else {
      // ChatGPT: strip utm_source param
      finalUrl = (row.cite_url || "").replace(/[?&]utm_source=[^&]*/g, "").replace(/[?&]$/, "");
    }

    if (!finalUrl) continue;
    if (!finalUrl.startsWith("http")) finalUrl = "https://" + finalUrl;

    insertRows.push({
      segment_persona: row.segment_persona,
      engine: row.engine,
      prompt_text: row.prompt_text,
      url: finalUrl,
      title: row.cite_title || "",
    });
  }

  console.log(`Prepared ${insertRows.length} rows for citation_urls`);

  // Step 5: Delete existing and re-insert
  await pool.query(`DELETE FROM citation_urls WHERE session_id = $1`, [SESSION_ID]);
  console.log(`Deleted existing citation_urls for session ${SESSION_ID}`);

  if (insertRows.length === 0) {
    console.log("No rows to insert. Exiting.");
    await pool.end();
    return;
  }

  const values = [];
  const params = [SESSION_ID];
  for (const row of insertRows) {
    const category = classifyCitationUrl(row.url, row.engine);
    params.push(row.engine, row.prompt_text, row.segment_persona, row.url, row.title, category);
    const base = params.length - 5;
    values.push(`($1, $${base}, $${base+1}, $${base+2}, $${base+3}, $${base+4}, $${base+5})`);
  }

  await pool.query(`
    INSERT INTO citation_urls (session_id, engine, prompt_text, segment_persona, url, title, url_category)
    VALUES ${values.join(",")}
  `, params);

  // Step 6: Update domain and brand
  await pool.query(`
    UPDATE citation_urls
    SET domain = regexp_replace(regexp_replace(url, '^https?://(www\\.)?', ''), '/.*$', '')
    WHERE session_id = $1 AND url IS NOT NULL
  `, [SESSION_ID]);

  await pool.query(`
    UPDATE citation_urls
    SET brand = CASE
      WHEN split_part(domain, '.', 1) IN ('www','m','en','blog','mobile','shop','store','app','go','get','my','help','support','mail','api','cdn','media','news','jobs','careers')
        THEN split_part(domain, '.', 2)
      ELSE split_part(domain, '.', 1)
    END
    WHERE session_id = $1 AND domain IS NOT NULL AND brand IS NULL
  `, [SESSION_ID]);

  // Final stats
  const stats = await pool.query(`
    SELECT 
      count(*) as total,
      count(DISTINCT url) as unique_urls,
      count(DISTINCT domain) as unique_domains,
      count(CASE WHEN engine = 'gemini' THEN 1 END) as gemini_rows,
      count(CASE WHEN engine = 'chatgpt' THEN 1 END) as chatgpt_rows
    FROM citation_urls WHERE session_id = $1
  `, [SESSION_ID]);

  const s = stats.rows[0];
  console.log(`\n=== Done! citation_urls for session ${SESSION_ID} ===`);
  console.log(`Total rows:     ${s.total}`);
  console.log(`Unique URLs:    ${s.unique_urls}`);
  console.log(`Unique domains: ${s.unique_domains}`);
  console.log(`Gemini rows:    ${s.gemini_rows}`);
  console.log(`ChatGPT rows:   ${s.chatgpt_rows}`);

  // Sample resolved Gemini URLs
  const sample = await pool.query(`
    SELECT url, domain, url_category FROM citation_urls 
    WHERE session_id = $1 AND engine = 'gemini'
    ORDER BY random() LIMIT 10
  `, [SESSION_ID]);
  console.log(`\nSample resolved Gemini URLs:`);
  sample.rows.forEach(r => console.log(`  [${r.url_category}] ${r.url}`));

  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });

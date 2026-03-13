import fetch from "node-fetch";
import * as cheerio from "cheerio";

const BRAND_VARIANTS = {
  vestacare: ["Vesta Care", "VestaCare", "vestacare"],
  nightingale: ["Nightingale"],
  care24: ["Care24", "Care 24"],
  montgohealth: ["Montgo Health", "MontgoHealth"],
  firstresponsehealthcare: ["First Response Healthcare", "First Response"],
  loyalhealthcare: ["Loyal Healthcare"],
  emirateshomenursing: ["Emirates Home Nursing"],
  enayati: ["Enayati"],
  manzilhealth: ["Manzil"],
  aimshealthcare: ["AIMS Healthcare", "Aims Healthcare"],
  yadalamal: ["Yad Al Amal"],
};

const ALL_BRAND_TERMS = Object.values(BRAND_VARIANTS).flat();

const TEST_URLS = [
  { url: "https://vestacare.ae", type: "Root domain / Gemini (Brand Homepage)" },
  { url: "https://firstresponsehealthcare.com/ae/dubai", type: "Deep page / ChatGPT (Brand Inner Page)" },
  { url: "https://healthfinder.ae", type: "Directory root / Gemini" },
  { url: "https://ensun.io", type: "Directory root / Gemini" },
  { url: "https://dha.gov.ae", type: "Government / Gemini" },
  { url: "https://baabeetv.com", type: "News/PR / Gemini" },
  { url: "https://dubaireview.ae", type: "Review Platform / Gemini" },
  { url: "https://quora.com", type: "Community Thread / Gemini (JS-heavy)" },
];

function extractWords(text, matchTerm, windowWords = 40) {
  const words = text.split(/\s+/);
  const results = [];
  const termLower = matchTerm.toLowerCase();
  for (let i = 0; i < words.length; i++) {
    if (words[i].toLowerCase().includes(termLower)) {
      const start = Math.max(0, i - windowWords);
      const end = Math.min(words.length, i + windowWords + 1);
      results.push("..." + words.slice(start, end).join(" ") + "...");
      i += 3;
    }
  }
  return results;
}

function cleanText($) {
  $("script, style, nav, footer, header, aside, noscript, iframe, [class*='cookie'], [class*='banner']").remove();
  const main = $("main, article, [role='main'], #content, .content").first();
  const text = (main.length ? main : $("body")).text();
  return text.replace(/\s+/g, " ").trim().slice(0, 8000);
}

async function crawlUrl({ url, type }) {
  const start = Date.now();
  const result = { url, type, status: null, title: null, meta: null, headings: [], textLength: 0, brandMatches: [], error: null, ms: 0 };

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
      timeout: 12000,
    });

    result.status = res.status;

    if (!res.ok) {
      result.error = `HTTP ${res.status}`;
      result.ms = Date.now() - start;
      return result;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    result.title = $("title").first().text().trim().slice(0, 120) || null;
    result.meta = $('meta[name="description"]').attr("content")?.trim().slice(0, 200) || null;
    result.headings = [];
    $("h1, h2, h3").each((_, el) => {
      const t = $(el).text().trim();
      if (t && t.length > 2) result.headings.push({ tag: el.name, text: t.slice(0, 100) });
    });
    result.headings = result.headings.slice(0, 10);

    const bodyText = cleanText($);
    result.textLength = bodyText.length;

    for (const term of ALL_BRAND_TERMS) {
      if (bodyText.toLowerCase().includes(term.toLowerCase())) {
        const snippets = extractWords(bodyText, term, 40);
        if (snippets.length) result.brandMatches.push({ brand: term, snippets: snippets.slice(0, 2) });
      }
    }

  } catch (err) {
    result.error = err.message?.slice(0, 80) || "Unknown error";
  }

  result.ms = Date.now() - start;
  return result;
}

async function main() {
  console.log("=".repeat(70));
  console.log("CRAWL TEST — 8 URLs across all category types");
  console.log("=".repeat(70));

  for (const item of TEST_URLS) {
    console.log(`\n${"─".repeat(70)}`);
    console.log(`URL:    ${item.url}`);
    console.log(`TYPE:   ${item.type}`);

    const r = await crawlUrl(item);

    console.log(`STATUS: ${r.status ?? "no response"}  |  TIME: ${r.ms}ms`);
    if (r.error) console.log(`ERROR:  ${r.error}`);
    if (r.title) console.log(`TITLE:  ${r.title}`);
    if (r.meta)  console.log(`META:   ${r.meta}`);
    if (r.headings.length) {
      console.log(`HEADS:  ${r.headings.map(h => `[${h.tag}] ${h.text}`).join(" | ").slice(0, 200)}`);
    }
    console.log(`TEXT:   ${r.textLength} chars extracted`);
    if (r.brandMatches.length) {
      console.log(`BRANDS FOUND: ${r.brandMatches.map(b => b.brand).join(", ")}`);
      r.brandMatches.slice(0, 2).forEach(b => {
        console.log(`  → "${b.brand}": ${b.snippets[0]?.slice(0, 150)}`);
      });
    } else {
      console.log(`BRANDS FOUND: none`);
    }

    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log("DONE");
}

main().catch(console.error);

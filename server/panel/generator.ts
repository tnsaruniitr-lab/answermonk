import OpenAI from "openai";
import puppeteer from "puppeteer-core";
import { selectTopTerritories, type TerritoryScore } from "./territories";
import { generatePanelPrompts, type PanelPrompt } from "./templates";
import { extractAliasesFromHTML, expandAliasesWithLLM, buildAliasSet, type AliasEntry } from "./aliases";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const FETCH_TIMEOUT = 10000;
const BROWSER_TIMEOUT = 20000;
const MAX_HTML_SIZE = 500000;
const MIN_TEXT_LENGTH = 200;

function findChromiumPath(): string {
  const fs = require("fs");
  const possiblePaths = [
    "/nix/var/nix/profiles/default/bin/chromium",
    process.env.CHROMIUM_PATH,
  ];
  const nixStore = "/nix/store";
  try {
    const entries = fs.readdirSync(nixStore);
    for (const entry of entries) {
      if (entry.includes("chromium") && !entry.includes(".drv")) {
        const binPath = `${nixStore}/${entry}/bin/chromium`;
        if (fs.existsSync(binPath)) {
          possiblePaths.push(binPath);
        }
      }
    }
  } catch {}
  for (const p of possiblePaths) {
    if (p && fs.existsSync(p)) return p;
  }
  return "chromium";
}

async function fetchPageWithBrowser(url: string): Promise<{ html: string; finalUrl: string } | null> {
  let browser;
  try {
    const executablePath = findChromiumPath();
    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
      ],
    });
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    await page.goto(url, { waitUntil: "networkidle2", timeout: BROWSER_TIMEOUT });
    await page.waitForSelector("body", { timeout: 5000 }).catch(() => {});
    const html = await page.content();
    const finalUrl = page.url();
    return { html: html.slice(0, MAX_HTML_SIZE), finalUrl };
  } catch (err) {
    console.error(`Browser fetch failed for ${url}:`, err);
    return null;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

export interface ExtractionResult {
  primary_services: string[];
  secondary_services: string[];
  industries_served: string[];
  client_size_indicators: string[];
  positioning_terms: string[];
  geo_mentions: string[];
  brand_name_variants: string[];
}

export interface PanelAnalysisResult {
  prompts: PanelPrompt[];
  territories: TerritoryScore[];
  allTerritoryScores: TerritoryScore[];
  extractedProfile: ExtractionResult;
  industryPrimary: string | null;
  aliases: AliasEntry[];
  brandDomain: string;
  pagesUsed: string[];
}

const SECOND_PAGE_PATHS = ["/services", "/service", "/about"];

async function fetchPage(url: string): Promise<{ html: string; finalUrl: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BrandSense/1.0)",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return null;
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_HTML_SIZE) {
      const html = new TextDecoder().decode(buffer.slice(0, MAX_HTML_SIZE));
      return { html, finalUrl: response.url };
    }

    const html = new TextDecoder().decode(buffer);
    return { html, finalUrl: response.url };
  } catch (err) {
    console.error(`Failed to fetch ${url}:`, err);
    return null;
  }
}

function extractTextFromHTML(html: string): string {
  let text = html;
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ");
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, " ");
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, " ");
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, " ");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/&[a-z]+;/gi, " ");
  text = text.replace(/&#?\w+;/gi, " ");
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

function extractMetadata(html: string): string {
  const parts: string[] = [];

  const metaDesc = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)
    || html.match(/<meta\s+content="([^"]+)"\s+name="description"/i);
  if (metaDesc) parts.push(metaDesc[1]);

  const ogDesc = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i)
    || html.match(/<meta\s+content="([^"]+)"\s+property="og:description"/i);
  if (ogDesc) parts.push(ogDesc[1]);

  const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)
    || html.match(/<meta\s+content="([^"]+)"\s+property="og:title"/i);
  if (ogTitle) parts.push(ogTitle[1]);

  const ldMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (ldMatches) {
    for (const match of ldMatches) {
      try {
        const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, "");
        const data = JSON.parse(jsonContent);
        if (data.description) parts.push(data.description);
        if (data.name) parts.push(data.name);
        if (data.knowsAbout) parts.push(Array.isArray(data.knowsAbout) ? data.knowsAbout.join(", ") : data.knowsAbout);
      } catch {}
    }
  }

  return parts.join(". ");
}

const SECTION_KEYWORDS = [
  "services", "solutions", "what we do", "our work", "capabilities",
  "expertise", "about", "industries", "sectors", "clients",
  "offerings", "specialties", "approach", "methodology",
];

function extractSmartContent(fullText: string, maxLength: number): string {
  if (fullText.length <= maxLength) return fullText;

  const headBudget = Math.floor(maxLength * 0.4);
  const windowBudget = maxLength - headBudget;
  const head = fullText.slice(0, headBudget);

  const lowerText = fullText.toLowerCase();
  const windows: { start: number; end: number; keyword: string }[] = [];
  const windowRadius = 500;

  for (const keyword of SECTION_KEYWORDS) {
    let searchFrom = headBudget;
    while (searchFrom < lowerText.length) {
      const idx = lowerText.indexOf(keyword, searchFrom);
      if (idx === -1) break;
      const start = Math.max(headBudget, idx - windowRadius);
      const end = Math.min(fullText.length, idx + keyword.length + windowRadius);
      windows.push({ start, end, keyword });
      searchFrom = idx + keyword.length;
    }
  }

  if (windows.length === 0) {
    return fullText.slice(0, maxLength);
  }

  windows.sort((a, b) => a.start - b.start);

  const merged: { start: number; end: number }[] = [];
  for (const w of windows) {
    if (merged.length > 0 && w.start <= merged[merged.length - 1].end) {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, w.end);
    } else {
      merged.push({ start: w.start, end: w.end });
    }
  }

  let windowText = "";
  let budgetLeft = windowBudget;
  for (const m of merged) {
    const chunk = fullText.slice(m.start, m.end);
    if (chunk.length <= budgetLeft) {
      windowText += " ... " + chunk;
      budgetLeft -= chunk.length;
    } else {
      windowText += " ... " + chunk.slice(0, budgetLeft);
      break;
    }
  }

  return head + windowText;
}

function canonicalizeDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/.*$/, "");
  }
}

export async function analyzePanelWebsite(
  brandName: string,
  websiteUrl: string,
  city: string,
): Promise<PanelAnalysisResult> {
  let normalizedUrl = websiteUrl;
  if (!normalizedUrl.startsWith("http")) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  console.log(`[panel] Attempting browser render for ${normalizedUrl}...`);
  let homePage = await fetchPageWithBrowser(normalizedUrl);
  let usedBrowser = !!homePage;

  if (!homePage) {
    console.log(`[panel] Browser render failed, falling back to simple fetch...`);
    homePage = await fetchPage(normalizedUrl);
  }

  if (!homePage) {
    throw new Error("Could not fetch the website. Please check the URL and try again.");
  }

  let homeText = extractTextFromHTML(homePage.html);
  if (usedBrowser && homeText.length < MIN_TEXT_LENGTH) {
    console.log(`[panel] Browser returned thin content (${homeText.length} chars), trying simple fetch...`);
    const fallback = await fetchPage(normalizedUrl);
    if (fallback) {
      const fallbackText = extractTextFromHTML(fallback.html);
      if (fallbackText.length > homeText.length) {
        homePage = fallback;
        homeText = fallbackText;
        usedBrowser = false;
      }
    }
  }

  console.log(`[panel] Using ${usedBrowser ? "browser" : "fetch"} result (${homeText.length} chars text)`);

  const brandDomain = canonicalizeDomain(homePage.finalUrl);
  const baseUrl = new URL(homePage.finalUrl);
  const baseOrigin = baseUrl.origin;

  const pagesUsed = [homePage.finalUrl];
  let combinedHTML = homePage.html;

  for (const path of SECOND_PAGE_PATHS) {
    const secondUrl = `${baseOrigin}${path}`;
    const secondPage = usedBrowser
      ? await fetchPageWithBrowser(secondUrl)
      : await fetchPage(secondUrl);
    if (!secondPage && usedBrowser) {
      const fallbackSecond = await fetchPage(secondUrl);
      if (fallbackSecond) {
        pagesUsed.push(fallbackSecond.finalUrl);
        combinedHTML += "\n" + fallbackSecond.html;
        break;
      }
    } else if (secondPage) {
      pagesUsed.push(secondPage.finalUrl);
      combinedHTML += "\n" + secondPage.html;
      break;
    }
  }

  const mainText = extractTextFromHTML(combinedHTML);
  const metadataText = extractMetadata(combinedHTML);

  let contentForExtraction: string;
  if (mainText.length < MIN_TEXT_LENGTH) {
    contentForExtraction = `Website metadata:\n${metadataText}\n\nPage content:\n${mainText}`;
  } else {
    const smartText = extractSmartContent(mainText, 8000);
    contentForExtraction = metadataText
      ? `Website metadata:\n${metadataText}\n\nPage content:\n${smartText}`
      : smartText;
  }

  const extractedProfile = await extractWithGPT(contentForExtraction);

  const industryPrimary = selectPrimaryIndustry(
    extractedProfile.industries_served,
    mainText + " " + metadataText,
  );

  const { selected: territories, allScores } = selectTopTerritories(
    [...extractedProfile.primary_services, ...extractedProfile.secondary_services],
    extractedProfile.positioning_terms,
  );

  const prompts = generatePanelPrompts(
    territories.map((t) => t.territory),
    industryPrimary,
    city,
  );

  const websiteVariants = extractAliasesFromHTML(combinedHTML, brandName);
  let llmVariants: string[] = [];
  try {
    llmVariants = await expandAliasesWithLLM(brandName);
  } catch {}
  const aliases = buildAliasSet(
    brandName,
    websiteVariants,
    extractedProfile.brand_name_variants,
    llmVariants,
  );

  return {
    prompts,
    territories,
    allTerritoryScores: allScores,
    extractedProfile,
    industryPrimary,
    aliases,
    brandDomain,
    pagesUsed,
  };
}

const EXTRACTION_SYSTEM_PROMPT = `You extract structured business information from website content. Return ONLY valid JSON, no other text. Do not infer or guess — only extract what is explicitly stated in the provided content.`;

async function extractWithGPT(content: string): Promise<ExtractionResult> {
  const userPrompt = `Extract the following from this company website content.

RULES:
- Only include items explicitly mentioned or clearly supported by the text. Do not infer.
- If a field has no evidence in the text, return [] (empty array). Never return null.
- Deduplicate entries. Keep each entry under 5 words.
- brand_name_variants must be company-name-like strings only (no slogans, no taglines, no service descriptions, no marketing phrases).

Return valid JSON only, matching this exact schema:
{
  "primary_services": ["string"] (the main services offered, max 5),
  "secondary_services": ["string"] (additional services, max 8),
  "industries_served": ["string"] (specific industries/verticals they serve),
  "client_size_indicators": ["string"] (e.g. "enterprise", "SMB", "startups"),
  "positioning_terms": ["string"] (how they describe themselves: "full service", "boutique", etc.),
  "geo_mentions": ["string"] (cities, countries, regions mentioned),
  "brand_name_variants": ["string"] (any name variants, abbreviations, or legal names found)
}

Website content:
${content}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: 1024,
      temperature: 0,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return emptyExtractionResult();
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      primary_services: Array.isArray(parsed.primary_services) ? parsed.primary_services.slice(0, 5) : [],
      secondary_services: Array.isArray(parsed.secondary_services) ? parsed.secondary_services.slice(0, 8) : [],
      industries_served: Array.isArray(parsed.industries_served) ? parsed.industries_served : [],
      client_size_indicators: Array.isArray(parsed.client_size_indicators) ? parsed.client_size_indicators : [],
      positioning_terms: Array.isArray(parsed.positioning_terms) ? parsed.positioning_terms : [],
      geo_mentions: Array.isArray(parsed.geo_mentions) ? parsed.geo_mentions : [],
      brand_name_variants: Array.isArray(parsed.brand_name_variants) ? parsed.brand_name_variants : [],
    };
  } catch (err) {
    console.error("GPT extraction failed:", err);
    return emptyExtractionResult();
  }
}

function emptyExtractionResult(): ExtractionResult {
  return {
    primary_services: [],
    secondary_services: [],
    industries_served: [],
    client_size_indicators: [],
    positioning_terms: [],
    geo_mentions: [],
    brand_name_variants: [],
  };
}

const VAGUE_INDUSTRIES = new Set([
  "businesses", "companies", "startups", "smes", "brands",
  "clients", "all industries", "various industries",
  "multiple industries", "any industry",
]);

function selectPrimaryIndustry(
  industries: string[],
  fullText: string,
): string | null {
  if (industries.length === 0) return null;

  const lowerText = fullText.toLowerCase();
  let bestIndustry: string | null = null;
  let bestCount = 0;

  for (const industry of industries) {
    const lower = industry.toLowerCase().trim();
    if (VAGUE_INDUSTRIES.has(lower)) continue;

    const regex = new RegExp(`\\b${lower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    const matches = lowerText.match(regex);
    const count = matches ? matches.length : 0;

    if (count > bestCount || (count === bestCount && bestIndustry === null)) {
      bestCount = count;
      bestIndustry = industry;
    }
  }

  return bestIndustry;
}

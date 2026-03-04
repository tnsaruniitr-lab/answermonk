import puppeteer from "puppeteer-core";
import * as fs from "fs";
import * as crypto from "crypto";

const FETCH_TIMEOUT = 8000;
const BROWSER_TIMEOUT = 10000;
const MAX_HTML_SIZE = 500000;
const MIN_TEXT_LENGTH = 200;
const MAX_CONCURRENT = 20;
const LARGE_CRAWL_THRESHOLD = 200;
const LARGE_CRAWL_CONCURRENT = 8;

export interface CrawledPage {
  url: string;
  resolvedUrl: string;
  canonicalUrl: string;
  domain: string;
  title: string;
  metaDescription: string;
  publishDate: string | null;
  cleanText: string;
  rawHtml: string;
  contentHash: string;
  accessible: boolean;
  wordCount: number;
  headings: string[];
  listItems: string[];
  tableRows: string[];
}

function findChromiumPath(): string {
  try {
    const { execSync } = require("child_process");
    const whichResult = execSync("which chromium 2>/dev/null", { encoding: "utf-8" }).trim();
    if (whichResult && fs.existsSync(whichResult)) return whichResult;
  } catch {}
  const fallbacks = [
    process.env.CHROMIUM_PATH,
    "/nix/var/nix/profiles/default/bin/chromium",
  ];
  for (const p of fallbacks) {
    if (p && fs.existsSync(p)) return p;
  }
  return "chromium";
}

const CHROMIUM_PATH = findChromiumPath();

export function stripUtmParams(url: string): string {
  try {
    const u = new URL(url);
    const keysToRemove: string[] = [];
    u.searchParams.forEach((_, key) => {
      if (key.startsWith("utm_") || key === "ref" || key === "source") {
        keysToRemove.push(key);
      }
    });
    keysToRemove.forEach(k => u.searchParams.delete(k));
    return u.toString();
  } catch {
    return url;
  }
}

export function canonicalizeUrl(url: string): string {
  try {
    const u = new URL(stripUtmParams(url));
    let path = u.pathname.replace(/\/+$/, "") || "/";
    return `${u.protocol}//${u.hostname}${path}`.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

export function canonicalizeDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/.*$/, "");
  }
}

export function extractTextFromHTML(html: string): string {
  let text = html;
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ");
  text = text.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, " ");
  text = text.replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, " ");
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, " ");
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, " ");
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, " ");
  text = text.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, " ");
  text = text.replace(/style="[^"]*"/gi, "");
  text = text.replace(/class="[^"]*"/gi, "");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/&[a-z]+;/gi, " ");
  text = text.replace(/&#?\w+;/gi, " ");
  text = text.replace(/\{[^}]*\}/g, " ");
  text = text.replace(/\.[a-zA-Z_][\w-]*\s*\{/g, " ");
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

export function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : "";
}

export function extractMetaDescription(html: string): string {
  const match = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)
    || html.match(/<meta\s+content="([^"]+)"\s+name="description"/i);
  return match ? match[1].trim() : "";
}

export function extractMetadata(html: string): string {
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

export function extractPublishDate(html: string, url: string): string | null {
  const datePatterns = [
    /<meta\s+property="article:published_time"\s+content="([^"]+)"/i,
    /<meta\s+content="([^"]+)"\s+property="article:published_time"/i,
    /<meta\s+name="date"\s+content="([^"]+)"/i,
    /<time[^>]*datetime="([^"]+)"[^>]*>/i,
  ];
  for (const p of datePatterns) {
    const m = html.match(p);
    if (m) return m[1];
  }
  const ldMatch = html.match(/"datePublished"\s*:\s*"([^"]+)"/i);
  if (ldMatch) return ldMatch[1];
  const urlDateMatch = url.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
  if (urlDateMatch) return `${urlDateMatch[1]}-${urlDateMatch[2]}-${urlDateMatch[3]}`;
  return null;
}

export function computeContentHash(text: string): string {
  const normalized = text.slice(0, 500).toLowerCase().replace(/\s+/g, " ").trim();
  return crypto.createHash("md5").update(normalized).digest("hex");
}

export function extractHeadings(html: string): string[] {
  const headings: string[] = [];
  const regex = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (text.length > 2 && text.length < 500) {
      headings.push(text);
    }
  }
  return headings;
}

export function extractListItems(html: string): string[] {
  const items: string[] = [];
  const regex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (text.length > 5 && text.length < 1000) {
      items.push(text);
    }
  }
  return items;
}

export function extractTableRows(html: string): string[] {
  const rows: string[] = [];
  const regex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const cells: string[] = [];
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch;
    while ((cellMatch = cellRegex.exec(match[1])) !== null) {
      const text = cellMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (text) cells.push(text);
    }
    const rowText = cells.join(" | ");
    if (rowText.length > 5 && rowText.length < 1000) {
      rows.push(rowText);
    }
  }
  return rows;
}

export const SECTION_KEYWORDS = [
  "services", "solutions", "what we do", "our work", "capabilities",
  "expertise", "about", "industries", "sectors", "clients",
  "offerings", "specialties", "approach", "methodology",
];

export function extractSmartContent(fullText: string, maxLength: number): string {
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

export async function fetchWithHttp(url: string): Promise<{ html: string; finalUrl: string } | null> {
  try {
    const cleanUrl = stripUtmParams(url);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(cleanUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return null;
    }

    const buffer = await response.arrayBuffer();
    const html = new TextDecoder().decode(buffer.slice(0, MAX_HTML_SIZE));
    return { html, finalUrl: response.url };
  } catch {
    return null;
  }
}

export async function fetchWithBrowser(url: string): Promise<{ html: string; finalUrl: string } | null> {
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROMIUM_PATH,
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
    await page.goto(stripUtmParams(url), { waitUntil: "networkidle2", timeout: BROWSER_TIMEOUT });
    await page.waitForSelector("body", { timeout: 5000 }).catch(() => {});
    const html = await page.content();
    const finalUrl = page.url();
    return { html: html.slice(0, MAX_HTML_SIZE), finalUrl };
  } catch {
    return null;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

const SINGLE_URL_TIMEOUT = 15000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => {
      setTimeout(() => {
        console.log(`[crawler] TIMEOUT after ${ms}ms: ${label}`);
        resolve(null);
      }, ms);
    }),
  ]);
}

export async function crawlSingleUrl(url: string): Promise<CrawledPage> {
  const failResult: CrawledPage = {
    url,
    resolvedUrl: url,
    canonicalUrl: canonicalizeUrl(url),
    domain: canonicalizeDomain(url),
    title: "",
    metaDescription: "",
    publishDate: null,
    cleanText: "",
    rawHtml: "",
    contentHash: "",
    accessible: false,
    wordCount: 0,
    headings: [],
    listItems: [],
    tableRows: [],
  };

  const doWork = async (): Promise<CrawledPage> => {
    let result = await fetchWithHttp(url);

    if (result) {
      const text = extractTextFromHTML(result.html);
      if (text.split(/\s+/).length < MIN_TEXT_LENGTH / 5) {
        const browserResult = await fetchWithBrowser(url);
        if (browserResult) {
          result = browserResult;
        }
      }
    } else {
      result = await fetchWithBrowser(url);
    }

    if (!result) return failResult;

    const resolvedUrl = result.finalUrl || url;
    const canonical = canonicalizeUrl(resolvedUrl);
    const domain = canonicalizeDomain(resolvedUrl);

    const cleanText = extractTextFromHTML(result.html);
    const title = extractTitle(result.html);
    const metaDescription = extractMetaDescription(result.html);
    const publishDate = extractPublishDate(result.html, resolvedUrl);
    const contentHash = computeContentHash(cleanText);
    const wordCount = cleanText.split(/\s+/).length;
    const headings = extractHeadings(result.html);
    const listItems = extractListItems(result.html);
    const tableRows = extractTableRows(result.html);

    if (resolvedUrl !== url) {
      console.log(`[crawler] Redirect resolved: ${url} -> ${resolvedUrl}`);
    }

    return {
      url: resolvedUrl,
      resolvedUrl,
      canonicalUrl: canonical,
      domain,
      title,
      metaDescription,
      publishDate,
      cleanText,
      rawHtml: result.html,
      contentHash,
      accessible: true,
      wordCount,
      headings,
      listItems,
      tableRows,
    };
  };

  const result = await withTimeout(doWork(), SINGLE_URL_TIMEOUT, url);
  return result || failResult;
}

export interface CrawlProgress {
  done: number;
  total: number;
  success: number;
  failed: number;
}

export async function crawlUrls(
  urls: string[],
  onProgress?: (progress: CrawlProgress) => void,
): Promise<CrawledPage[]> {
  const canonicalSeen = new Map<string, number>();
  const uniqueUrls: string[] = [];

  for (const url of urls) {
    const canonical = canonicalizeUrl(url);
    if (!canonicalSeen.has(canonical)) {
      canonicalSeen.set(canonical, uniqueUrls.length);
      uniqueUrls.push(url);
    }
  }

  const concurrency = uniqueUrls.length > LARGE_CRAWL_THRESHOLD ? LARGE_CRAWL_CONCURRENT : MAX_CONCURRENT;
  console.log(`[crawler] Crawling ${uniqueUrls.length} unique URLs (from ${urls.length} total) — concurrency ${concurrency}`);

  const results: CrawledPage[] = new Array(uniqueUrls.length);
  let doneCount = 0;
  let successCount = 0;
  let failCount = 0;

  let activeCount = 0;
  let nextIndex = 0;

  const emitProgress = () => {
    const p: CrawlProgress = { done: doneCount, total: uniqueUrls.length, success: successCount, failed: failCount };
    onProgress?.(p);
  };

  await new Promise<void>((resolveAll) => {
    const onComplete = (idx: number, page: CrawledPage) => {
      page.rawHtml = "";
      results[idx] = page;
      doneCount++;
      if (page.accessible) successCount++;
      else failCount++;
      activeCount--;

      if (doneCount % 20 === 0 || doneCount === uniqueUrls.length) {
        console.log(`[crawler] Progress: ${doneCount}/${uniqueUrls.length} done (${successCount} ok, ${failCount} failed)`);
        emitProgress();
      }

      if (doneCount === uniqueUrls.length) {
        resolveAll();
      } else {
        tryLaunch();
      }
    };

    const tryLaunch = () => {
      while (activeCount < concurrency && nextIndex < uniqueUrls.length) {
        const idx = nextIndex++;
        activeCount++;
        crawlSingleUrl(uniqueUrls[idx])
          .then((page) => onComplete(idx, page))
          .catch(() => {
            onComplete(idx, {
              url: uniqueUrls[idx],
              resolvedUrl: uniqueUrls[idx],
              canonicalUrl: canonicalizeUrl(uniqueUrls[idx]),
              domain: canonicalizeDomain(uniqueUrls[idx]),
              title: "", metaDescription: "", publishDate: null,
              cleanText: "", rawHtml: "", contentHash: "",
              accessible: false, wordCount: 0,
              headings: [], listItems: [], tableRows: [],
            });
          });
      }
    };
    if (uniqueUrls.length === 0) {
      resolveAll();
    } else {
      tryLaunch();
    }
  });

  const hashSeen = new Map<string, number>();
  const deduplicated: CrawledPage[] = [];

  for (const page of results) {
    if (!page || !page.accessible || !page.contentHash) {
      if (page) deduplicated.push(page);
      continue;
    }
    if (hashSeen.has(page.contentHash)) {
      continue;
    }
    hashSeen.set(page.contentHash, deduplicated.length);
    deduplicated.push(page);
  }

  console.log(`[crawler] Complete: ${deduplicated.length} pages after dedup (${successCount} crawled, ${failCount} failed)`);
  return deduplicated;
}

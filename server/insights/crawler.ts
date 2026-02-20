import puppeteer from "puppeteer-core";
import * as fs from "fs";
import * as crypto from "crypto";

const FETCH_TIMEOUT = 12000;
const BROWSER_TIMEOUT = 20000;
const MAX_HTML_SIZE = 500000;
const MIN_TEXT_LENGTH = 200;
const MAX_CONCURRENT = 5;

export interface CrawledPage {
  url: string;
  resolvedUrl: string;
  canonicalUrl: string;
  title: string;
  metaDescription: string;
  publishDate: string | null;
  cleanText: string;
  rawHtml: string;
  contentHash: string;
  accessible: boolean;
  wordCount: number;
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

function stripUtmParams(url: string): string {
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

function canonicalizeUrl(url: string): string {
  try {
    const u = new URL(stripUtmParams(url));
    let path = u.pathname.replace(/\/+$/, "") || "/";
    return `${u.protocol}//${u.hostname}${path}`.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function extractTextFromHTML(html: string): string {
  let text = html;
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ");
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, " ");
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, " ");
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, " ");
  text = text.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, " ");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/&[a-z]+;/gi, " ");
  text = text.replace(/&#?\w+;/gi, " ");
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : "";
}

function extractMetaDescription(html: string): string {
  const match = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)
    || html.match(/<meta\s+content="([^"]+)"\s+name="description"/i);
  return match ? match[1].trim() : "";
}

function extractPublishDate(html: string, url: string): string | null {
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

function computeContentHash(text: string): string {
  const normalized = text.slice(0, 500).toLowerCase().replace(/\s+/g, " ").trim();
  return crypto.createHash("md5").update(normalized).digest("hex");
}

async function fetchWithHttp(url: string): Promise<{ html: string; finalUrl: string } | null> {
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

async function fetchWithBrowser(url: string): Promise<{ html: string; finalUrl: string } | null> {
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

async function crawlSingleUrl(url: string): Promise<CrawledPage> {
  let result = await fetchWithHttp(url);
  let usedBrowser = false;

  if (result) {
    const text = extractTextFromHTML(result.html);
    if (text.split(/\s+/).length < MIN_TEXT_LENGTH / 5) {
      const browserResult = await fetchWithBrowser(url);
      if (browserResult) {
        result = browserResult;
        usedBrowser = true;
      }
    }
  } else {
    result = await fetchWithBrowser(url);
    usedBrowser = true;
  }

  if (!result) {
    return {
      url,
      resolvedUrl: url,
      canonicalUrl: canonicalizeUrl(url),
      title: "",
      metaDescription: "",
      publishDate: null,
      cleanText: "",
      rawHtml: "",
      contentHash: "",
      accessible: false,
      wordCount: 0,
    };
  }

  const resolvedUrl = result.finalUrl || url;
  const canonicalUrl = canonicalizeUrl(resolvedUrl);

  const cleanText = extractTextFromHTML(result.html);
  const title = extractTitle(result.html);
  const metaDescription = extractMetaDescription(result.html);
  const publishDate = extractPublishDate(result.html, resolvedUrl);
  const contentHash = computeContentHash(cleanText);
  const wordCount = cleanText.split(/\s+/).length;

  if (resolvedUrl !== url) {
    console.log(`[insights] Redirect resolved: ${url} -> ${resolvedUrl}`);
  }

  return {
    url: resolvedUrl,
    resolvedUrl,
    canonicalUrl,
    title,
    metaDescription,
    publishDate,
    cleanText,
    rawHtml: result.html,
    contentHash,
    accessible: true,
    wordCount,
  };
}

export async function crawlUrls(
  urls: string[],
  onProgress?: (done: number, total: number) => void,
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

  console.log(`[insights] Crawling ${uniqueUrls.length} unique URLs (from ${urls.length} total)`);

  const results: CrawledPage[] = [];
  for (let i = 0; i < uniqueUrls.length; i += MAX_CONCURRENT) {
    const batch = uniqueUrls.slice(i, i + MAX_CONCURRENT);
    const batchResults = await Promise.all(batch.map(url => crawlSingleUrl(url)));
    results.push(...batchResults);
    onProgress?.(results.length, uniqueUrls.length);
  }

  const hashSeen = new Map<string, number>();
  const deduplicated: CrawledPage[] = [];

  for (const page of results) {
    if (!page.accessible || !page.contentHash) {
      deduplicated.push(page);
      continue;
    }
    if (hashSeen.has(page.contentHash)) {
      console.log(`[insights] Dedup: ${page.url} (same content as previous page)`);
      continue;
    }
    hashSeen.set(page.contentHash, deduplicated.length);
    deduplicated.push(page);
  }

  console.log(`[insights] ${deduplicated.length} pages after deduplication`);
  return deduplicated;
}

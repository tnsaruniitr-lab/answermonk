import type { CrawledPage } from "../crawler";
import * as crypto from "crypto";

export interface BrandSnippet {
  brand: string;
  text: string;
  source: "list_item" | "table_row" | "heading" | "paragraph";
  pageUrl: string;
  pageDomain: string;
  pageTitle: string;
  hash: string;
}

export interface PageSnippets {
  page: CrawledPage;
  snippets: BrandSnippet[];
  detectedEntities: string[];
}

function tokenWindow(text: string, matchStart: number, matchEnd: number, windowSize: number = 35): string {
  const words = text.split(/\s+/);
  let charCount = 0;
  let startWordIdx = 0;
  let endWordIdx = words.length - 1;

  for (let i = 0; i < words.length; i++) {
    if (charCount + words[i].length >= matchStart) {
      startWordIdx = i;
      break;
    }
    charCount += words[i].length + 1;
  }

  charCount = 0;
  for (let i = 0; i < words.length; i++) {
    charCount += words[i].length + 1;
    if (charCount >= matchEnd) {
      endWordIdx = i;
      break;
    }
  }

  const windowStart = Math.max(0, startWordIdx - windowSize);
  const windowEnd = Math.min(words.length - 1, endWordIdx + windowSize);

  return words.slice(windowStart, windowEnd + 1).join(" ");
}

function snippetHash(text: string): string {
  return crypto.createHash("md5").update(text.toLowerCase().replace(/\s+/g, " ").trim()).digest("hex");
}

function isJunkSnippet(text: string): boolean {
  if (text.includes("{") && text.includes("}")) return true;
  if (text.includes("background-image") || text.includes("font-size") || text.includes("margin:")) return true;
  if (/\.[\w-]+\s*\{/.test(text)) return true;
  const tokens = text.split(/\s+/);
  if (tokens.length === 0) return true;
  const nonAlpha = tokens.filter(t => !/[a-zA-Z]{2,}/.test(t)).length;
  if (nonAlpha / tokens.length > 0.5) return true;
  return false;
}

function findBrandInItems(
  brand: string,
  items: string[],
  source: "list_item" | "table_row" | "heading",
  pageUrl: string,
  pageDomain: string,
  pageTitle: string,
): BrandSnippet[] {
  const results: BrandSnippet[] = [];
  const brandLower = brand.toLowerCase();
  const brandRegex = new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");

  for (const item of items) {
    if (isJunkSnippet(item)) continue;
    if (brandRegex.test(item) || item.toLowerCase().includes(brandLower)) {
      results.push({
        brand,
        text: item.trim(),
        source,
        pageUrl,
        pageDomain,
        pageTitle,
        hash: snippetHash(item),
      });
    }
    brandRegex.lastIndex = 0;
  }

  return results;
}

function findBrandInText(
  brand: string,
  text: string,
  pageUrl: string,
  pageDomain: string,
  pageTitle: string,
): BrandSnippet[] {
  const results: BrandSnippet[] = [];
  const brandRegex = new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
  let match;

  while ((match = brandRegex.exec(text)) !== null) {
    const snippet = tokenWindow(text, match.index, match.index + match[0].length, 35);
    if (isJunkSnippet(snippet)) continue;
    results.push({
      brand,
      text: snippet.trim(),
      source: "paragraph",
      pageUrl,
      pageDomain,
      pageTitle,
      hash: snippetHash(snippet),
    });
  }

  return results;
}

export function detectEntities(text: string, trackedBrands: string[]): string[] {
  const trackedLower = new Set(trackedBrands.map(b => b.toLowerCase()));
  const entities = new Set<string>();

  const patterns = [
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\b/g,
    /\b([A-Z][a-zA-Z]+(?:\.[a-z]+)?)\b/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const candidate = match[1].trim();
      if (candidate.length < 3 || candidate.length > 40) continue;
      if (trackedLower.has(candidate.toLowerCase())) continue;

      const skipWords = new Set([
        "The", "This", "That", "These", "Those", "Here", "There",
        "What", "When", "Where", "Which", "How", "Why", "Who",
        "And", "But", "For", "Not", "Yes", "All", "Any", "Our",
        "Their", "Your", "Its", "Has", "Had", "Was", "Were",
        "Are", "Been", "Being", "Have", "Does", "Did", "Will",
        "Would", "Could", "Should", "May", "Might", "Must",
        "January", "February", "March", "April", "June", "July",
        "August", "September", "October", "November", "December",
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
        "Saturday", "Sunday", "Read", "More", "Learn", "Click",
        "Share", "Follow", "Subscribe", "Sign", "Log", "View",
        "See", "Get", "Try", "Start", "Join", "Download",
      ]);

      if (skipWords.has(candidate)) continue;
      entities.add(candidate);
    }
  }

  return [...entities].slice(0, 30);
}

export function extractSnippetsFromPage(
  page: CrawledPage,
  brands: string[],
): PageSnippets {
  if (!page.accessible || !page.cleanText) {
    return { page, snippets: [], detectedEntities: [] };
  }

  const allSnippets: BrandSnippet[] = [];
  const seenHashes = new Set<string>();

  for (const brand of brands) {
    const listSnippets = findBrandInItems(
      brand, page.listItems, "list_item",
      page.url, page.domain, page.title,
    );
    const tableSnippets = findBrandInItems(
      brand, page.tableRows, "table_row",
      page.url, page.domain, page.title,
    );
    const headingSnippets = findBrandInItems(
      brand, page.headings, "heading",
      page.url, page.domain, page.title,
    );

    const structuralSnippets = [...listSnippets, ...tableSnippets, ...headingSnippets];
    for (const s of structuralSnippets) {
      if (!seenHashes.has(s.hash)) {
        seenHashes.add(s.hash);
        allSnippets.push(s);
      }
    }

    const textSnippets = findBrandInText(
      brand, page.cleanText,
      page.url, page.domain, page.title,
    );
    for (const s of textSnippets) {
      if (!seenHashes.has(s.hash)) {
        seenHashes.add(s.hash);
        allSnippets.push(s);
      }
    }
  }

  const detectedEntities = detectEntities(page.cleanText, brands);

  return { page, snippets: allSnippets, detectedEntities };
}

export function extractAllSnippets(
  pages: CrawledPage[],
  brands: string[],
): PageSnippets[] {
  return pages.map(page => extractSnippetsFromPage(page, brands));
}

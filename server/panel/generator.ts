import OpenAI from "openai";
import { selectTopTerritories, type TerritoryScore } from "./territories";
import { generatePanelPrompts, type PanelPrompt } from "./templates";
import { extractAliasesFromHTML, expandAliasesWithLLM, buildAliasSet, type AliasEntry } from "./aliases";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const FETCH_TIMEOUT = 10000;
const MAX_HTML_SIZE = 500000;
const MIN_TEXT_LENGTH = 200;

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

  const homePage = await fetchPage(normalizedUrl);
  if (!homePage) {
    throw new Error("Could not fetch the website. Please check the URL and try again.");
  }

  const brandDomain = canonicalizeDomain(homePage.finalUrl);
  const baseUrl = new URL(homePage.finalUrl);
  const baseOrigin = baseUrl.origin;

  const pagesUsed = [homePage.finalUrl];
  let combinedHTML = homePage.html;

  for (const path of SECOND_PAGE_PATHS) {
    const secondUrl = `${baseOrigin}${path}`;
    const secondPage = await fetchPage(secondUrl);
    if (secondPage) {
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
    const trimmedText = mainText.length > 8000 ? mainText.slice(0, 8000) : mainText;
    contentForExtraction = metadataText
      ? `Website metadata:\n${metadataText}\n\nPage content:\n${trimmedText}`
      : trimmedText;
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

const EXTRACTION_SYSTEM_PROMPT = `You extract structured business information from website content. Return ONLY valid JSON, no other text.`;

async function extractWithGPT(content: string): Promise<ExtractionResult> {
  const userPrompt = `Extract the following from this company website content.
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

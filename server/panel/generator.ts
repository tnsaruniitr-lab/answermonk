import OpenAI from "openai";
import { selectTopTerritories, type TerritoryScore } from "./territories";
import { generatePanelPrompts, type PanelPrompt } from "./templates";
import { extractAliasesFromHTML, expandAliasesWithLLM, buildAliasSet, type AliasEntry } from "./aliases";
import {
  fetchWithHttp,
  fetchWithBrowser,
  extractTextFromHTML,
  extractMetadata,
  extractSmartContent,
  canonicalizeDomain,
} from "../crawler";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

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

export async function analyzePanelWebsite(
  brandName: string,
  websiteUrl: string,
  city: string,
  seededServices: string[] = [],
): Promise<PanelAnalysisResult> {
  let normalizedUrl = websiteUrl;
  if (!normalizedUrl.startsWith("http")) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  console.log(`[panel] Attempting browser render for ${normalizedUrl}...`);
  let homePage = await fetchWithBrowser(normalizedUrl);
  let usedBrowser = !!homePage;

  if (!homePage) {
    console.log(`[panel] Browser render failed, falling back to simple fetch...`);
    homePage = await fetchWithHttp(normalizedUrl);
  }

  if (!homePage) {
    throw new Error("Could not fetch the website. Please check the URL and try again.");
  }

  let homeText = extractTextFromHTML(homePage.html);
  if (usedBrowser && homeText.length < MIN_TEXT_LENGTH) {
    console.log(`[panel] Browser returned thin content (${homeText.length} chars), trying simple fetch...`);
    const fallback = await fetchWithHttp(normalizedUrl);
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
      ? await fetchWithBrowser(secondUrl)
      : await fetchWithHttp(secondUrl);
    if (!secondPage && usedBrowser) {
      const fallbackSecond = await fetchWithHttp(secondUrl);
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

  let extractedProfile = await extractWithGPT(contentForExtraction);

  const hasServices = extractedProfile.primary_services.length > 0 || extractedProfile.secondary_services.length > 0;
  if (!hasServices) {
    console.log(`[panel] Extraction returned no services, trying GPT inference from brand name + domain...`);
    extractedProfile = await inferProfileWithGPT(brandName, brandDomain, mainText + " " + metadataText);
  }

  const industryPrimary = selectPrimaryIndustry(
    extractedProfile.industries_served,
    mainText + " " + metadataText,
  );

  const allServices = [...new Set([
    ...seededServices,
    ...extractedProfile.primary_services,
    ...extractedProfile.secondary_services,
  ])];
  const { selected: territories, allScores } = selectTopTerritories(
    allServices,
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

async function inferProfileWithGPT(brandName: string, domain: string, snippets: string): Promise<ExtractionResult> {
  const trimmedSnippets = snippets.trim().slice(0, 2000);
  const prompt = `A company's website at "${domain}" (brand name: "${brandName}") had very little readable text content. Here are the few snippets we could extract:

"${trimmedSnippets}"

Based on the brand name, domain, and these snippets, infer what this company most likely does. Focus on their likely services.

Return valid JSON only:
{
  "primary_services": ["string"] (most likely main services, max 5),
  "secondary_services": ["string"] (other probable services, max 5),
  "industries_served": ["string"] (likely industries they serve),
  "client_size_indicators": [],
  "positioning_terms": ["string"] (how they likely position themselves),
  "geo_mentions": [],
  "brand_name_variants": []
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        { role: "system", content: "You infer a company's business profile from minimal information. Return ONLY valid JSON. Be reasonable — stick to common services for the type of company suggested by the name and domain." },
        { role: "user", content: prompt },
      ],
      max_completion_tokens: 512,
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return emptyExtractionResult();

    const parsed = JSON.parse(jsonMatch[0]);
    console.log(`[panel] GPT inference returned services: ${JSON.stringify(parsed.primary_services)}`);
    return {
      primary_services: Array.isArray(parsed.primary_services) ? parsed.primary_services.slice(0, 5) : [],
      secondary_services: Array.isArray(parsed.secondary_services) ? parsed.secondary_services.slice(0, 5) : [],
      industries_served: Array.isArray(parsed.industries_served) ? parsed.industries_served : [],
      client_size_indicators: Array.isArray(parsed.client_size_indicators) ? parsed.client_size_indicators : [],
      positioning_terms: Array.isArray(parsed.positioning_terms) ? parsed.positioning_terms : [],
      geo_mentions: Array.isArray(parsed.geo_mentions) ? parsed.geo_mentions : [],
      brand_name_variants: Array.isArray(parsed.brand_name_variants) ? parsed.brand_name_variants : [],
    };
  } catch (err) {
    console.error("GPT inference failed:", err);
    return emptyExtractionResult();
  }
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

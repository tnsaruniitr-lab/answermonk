import type { CrawledPage } from "./crawler";

export type SourceCategory = "third_party_editorial" | "review_platform" | "listicle" | "brand_owned" | "competitor_owned" | "social" | "redirect_wrapper" | "unknown";
export type SurfaceType = "comparison" | "eligibility" | "authority" | "brand_owned" | "competitor_owned" | "social" | "redirect_wrapper" | "unknown";
export type CredibilityTier = 1 | 2 | 3;

export interface ClassifiedSource {
  url: string;
  category: SourceCategory;
  surfaceType: SurfaceType;
  tier: CredibilityTier;
  domain: string;
  isComparisonSurface: boolean;
  crossEngineCitations: number;
}

const TIER_1_DOMAINS = new Set([
  "forbes.com", "forbesmiddleeast.com",
  "techcrunch.com", "bloomberg.com", "reuters.com",
  "wired.com", "theverge.com", "venturebeat.com",
  "g2.com", "capterra.com", "trustpilot.com",
  "clutch.co", "crunchbase.com", "producthunt.com",
  "gartner.com", "forrester.com",
  "arabianbusiness.com", "gulfnews.com", "khaleejtimes.com",
  "thenationalnews.com", "zawya.com", "wamda.com",
  "entrepreneur.com", "inc.com", "fastcompany.com",
  "businessinsider.com", "cnbc.com", "ft.com",
  "wsj.com", "nytimes.com", "theguardian.com",
  "bbc.com", "bbc.co.uk",
  "arabnews.com", "cbinsights.com",
]);

const TIER_2_PATTERNS = [
  /blog\./i, /medium\.com/i, /substack\.com/i,
  /fintech/i, /tech/i, /digital/i,
  /\.io$/i, /\.co$/i,
];

const REVIEW_DOMAINS = new Set([
  "g2.com", "capterra.com", "trustpilot.com", "clutch.co",
  "softwareadvice.com", "getapp.com", "trustradius.com",
  "comparably.com", "glassdoor.com",
]);

const SOCIAL_DOMAINS = new Set([
  "linkedin.com", "twitter.com", "x.com",
  "facebook.com", "instagram.com", "youtube.com",
  "reddit.com", "tiktok.com",
]);

const AUTHORITY_DOMAINS = new Set([
  "crunchbase.com", "cbinsights.com", "pitchbook.com",
  "owler.com", "zoominfo.com",
]);

const REDIRECT_DOMAINS = new Set([
  "vertexaisearch.cloud.google.com",
]);

function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return hostname;
  } catch {
    return url;
  }
}

function extractRootDomain(domain: string): string {
  const parts = domain.split(".");
  if (parts.length <= 2) return domain;
  return parts.slice(-2).join(".");
}

function determineSurfaceType(
  category: SourceCategory,
  page: CrawledPage,
  domain: string,
  rootDomain: string,
): SurfaceType {
  if (category === "social") return "social";
  if (category === "brand_owned") return "brand_owned";
  if (category === "competitor_owned") return "competitor_owned";
  if (REDIRECT_DOMAINS.has(domain) || REDIRECT_DOMAINS.has(rootDomain)) return "redirect_wrapper";

  if (category === "review_platform" || category === "listicle") return "comparison";

  if (AUTHORITY_DOMAINS.has(rootDomain)) return "authority";

  const text = page.cleanText.toLowerCase();
  const title = page.title.toLowerCase();

  const newsSignals = /\b(funding|raised|partnership|launches?|announces?|acquisition|series [a-d]|backed by|investors?)\b/i;
  if (TIER_1_DOMAINS.has(rootDomain) && newsSignals.test(text)) return "authority";

  const comparisonSignals = /\b(top\s+\d+|best\s+\d+|\d+\s+best|ranked|ranking|comparison|compared|versus|vs\.?|alternatives?|competitors?)\b/i;
  if (comparisonSignals.test(title) || comparisonSignals.test(text.slice(0, 2000))) return "comparison";

  const brandCount = countDistinctBrandMentions(text);
  if (brandCount >= 3) return "comparison";

  if (category === "third_party_editorial") {
    if (newsSignals.test(text.slice(0, 2000))) return "authority";
    return "eligibility";
  }

  return "eligibility";
}

function countDistinctBrandMentions(text: string): number {
  const brandPatterns = /\b(inc\.|corp\.|ltd\.|llc|™|®|\bplatform\b|\bsolution\b|\bsoftware\b)/gi;
  const matches = text.match(brandPatterns);
  return matches ? Math.min(matches.length, 20) : 0;
}

export function classifySources(
  pages: CrawledPage[],
  brandDomain: string | null,
  brandName: string,
  competitorNames: string[],
  citationsByEngine: Record<string, string[]>,
): ClassifiedSource[] {
  const brandRoot = brandDomain ? extractRootDomain(extractDomain(brandDomain)) : null;

  const competitorLowerNames = competitorNames.map(c => c.toLowerCase().replace(/\s+/g, ""));

  const domainEngineCounts = new Map<string, Set<string>>();
  for (const [engine, urls] of Object.entries(citationsByEngine)) {
    for (const u of urls) {
      const rootDom = extractRootDomain(extractDomain(u));
      if (!domainEngineCounts.has(rootDom)) {
        domainEngineCounts.set(rootDom, new Set());
      }
      domainEngineCounts.get(rootDom)!.add(engine);
    }
  }

  return pages.map(page => {
    const domain = extractDomain(page.url);
    const rootDomain = extractRootDomain(domain);
    const crossEngineCitations = domainEngineCounts.get(rootDomain)?.size || 0;

    let category: SourceCategory = "unknown";
    let tier: CredibilityTier = 3;

    if (REDIRECT_DOMAINS.has(domain) || REDIRECT_DOMAINS.has(rootDomain)) {
      category = "unknown";
      tier = 3;
    } else if (SOCIAL_DOMAINS.has(rootDomain)) {
      category = "social";
      tier = 3;
    } else if (brandRoot && (rootDomain === brandRoot || domain.includes(brandName.toLowerCase().replace(/\s+/g, "")))) {
      category = "brand_owned";
      tier = 3;
    } else if (competitorLowerNames.some(c => domain.includes(c) || rootDomain.includes(c))) {
      category = "competitor_owned";
      tier = 3;
    } else if (REVIEW_DOMAINS.has(rootDomain)) {
      category = "review_platform";
      tier = 1;
    } else if (TIER_1_DOMAINS.has(rootDomain)) {
      category = "third_party_editorial";
      tier = 1;
    } else {
      const text = page.cleanText.toLowerCase();
      const listPatterns = /\b(top\s+\d+|best\s+\d+|\d+\s+best|ranked|ranking|comparison|compared|versus|vs\.?)\b/i;
      if (listPatterns.test(text) || listPatterns.test(page.title)) {
        category = "listicle";
      } else {
        category = "third_party_editorial";
      }

      if (TIER_2_PATTERNS.some(p => p.test(domain))) {
        tier = 2;
      } else {
        tier = 3;
      }
    }

    if (crossEngineCitations >= 2 && tier > 1) {
      tier = Math.max(1, tier - 1) as CredibilityTier;
    }

    const surfaceType = determineSurfaceType(category, page, domain, rootDomain);
    const isComparisonSurface = surfaceType === "comparison";

    return {
      url: page.url,
      category,
      surfaceType,
      tier,
      domain,
      isComparisonSurface,
      crossEngineCitations,
    };
  });
}

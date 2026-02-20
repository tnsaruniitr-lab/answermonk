import type { CrawledPage } from "./crawler";

export type SourceCategory = "third_party_editorial" | "review_platform" | "listicle" | "brand_owned" | "competitor_owned" | "social" | "unknown";
export type CredibilityTier = 1 | 2 | 3;

export interface ClassifiedSource {
  url: string;
  category: SourceCategory;
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

export function classifySources(
  pages: CrawledPage[],
  brandDomain: string | null,
  brandName: string,
  competitorNames: string[],
  citationsByEngine: Record<string, string[]>,
): ClassifiedSource[] {
  const brandRoot = brandDomain ? extractRootDomain(extractDomain(brandDomain)) : null;
  const competitorDomains = new Set<string>();

  const urlEngineCounts = new Map<string, number>();
  for (const [, urls] of Object.entries(citationsByEngine)) {
    const seen = new Set<string>();
    for (const u of urls) {
      const domain = extractDomain(u);
      if (!seen.has(domain)) {
        seen.add(domain);
        urlEngineCounts.set(domain, (urlEngineCounts.get(domain) || 0) + 1);
      }
    }
  }

  return pages.map(page => {
    const domain = extractDomain(page.url);
    const rootDomain = extractRootDomain(domain);
    const crossEngineCitations = urlEngineCounts.get(domain) || 0;

    let category: SourceCategory = "unknown";
    let tier: CredibilityTier = 3;

    if (SOCIAL_DOMAINS.has(rootDomain)) {
      category = "social";
      tier = 3;
    } else if (brandRoot && (rootDomain === brandRoot || domain.includes(brandName.toLowerCase().replace(/\s+/g, "")))) {
      category = "brand_owned";
      tier = 3;
    } else if (competitorDomains.has(rootDomain)) {
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

    const isComparisonSurface = category !== "brand_owned" && category !== "competitor_owned" && category !== "social";

    return {
      url: page.url,
      category,
      tier,
      domain,
      isComparisonSurface,
      crossEngineCitations,
    };
  });
}

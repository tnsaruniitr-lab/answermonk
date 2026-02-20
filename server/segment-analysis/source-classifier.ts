import type { CrawledPage } from "../crawler";

export type SourceTier = "T1" | "T2" | "T3";
export type SurfaceType = "editorial" | "directory" | "listicle" | "product" | "press" | "profile" | "social" | "unknown";

export const TIER_WEIGHTS: Record<SourceTier, number> = {
  T1: 1.0,
  T2: 0.7,
  T3: 0.4,
};

export interface ClassifiedSource {
  url: string;
  domain: string;
  tier: SourceTier;
  tierWeight: number;
  surfaceType: SurfaceType;
  comparisonSurfaceScore: number;
  title: string;
  isBrandOwned: boolean;
}

const T1_DOMAINS = new Set([
  "forbes.com", "techcrunch.com", "bloomberg.com", "wsj.com",
  "nytimes.com", "reuters.com", "cnbc.com", "ft.com",
  "g2.com", "capterra.com", "gartner.com", "forrester.com",
  "crunchbase.com", "producthunt.com", "trustpilot.com",
  "yelp.com", "tripadvisor.com", "bbb.org",
  "hbr.org", "inc.com", "entrepreneur.com", "fastcompany.com",
  "wired.com", "theverge.com", "arstechnica.com",
  "businessinsider.com", "zdnet.com", "cnet.com",
  "marketwatch.com", "barrons.com", "investopedia.com",
  "clutch.co", "goodfirms.co", "sortlist.com",
  "thenational.ae", "arabianbusiness.com", "gulfnews.com",
  "khaleejtimes.com",
]);

const T2_DOMAINS = new Set([
  "medium.com", "substack.com", "dev.to",
  "hubspot.com", "semrush.com", "ahrefs.com", "moz.com",
  "shopify.com", "wordpress.com",
  "linkedin.com", "twitter.com", "x.com",
  "reddit.com", "quora.com",
  "wikipedia.org",
  "builtwith.com", "stackshare.io",
  "glassdoor.com", "indeed.com",
  "angel.co", "wellfound.com",
  "zoominfo.com", "apollo.io",
]);

function classifyTier(domain: string): SourceTier {
  const d = domain.toLowerCase().replace(/^www\./, "");

  if (T1_DOMAINS.has(d)) return "T1";
  if (T2_DOMAINS.has(d)) return "T2";

  for (const t1 of T1_DOMAINS) {
    if (d.endsWith(`.${t1}`)) return "T1";
  }
  for (const t2 of T2_DOMAINS) {
    if (d.endsWith(`.${t2}`)) return "T2";
  }

  if (d.endsWith(".gov") || d.endsWith(".edu") || d.endsWith(".org")) return "T1";

  return "T3";
}

function classifySurfaceType(page: CrawledPage): SurfaceType {
  const text = (page.cleanText + " " + page.title + " " + page.metaDescription).toLowerCase();
  const url = page.url.toLowerCase();

  const listicleSignals = [
    "top ", "best ", " vs ", "compared", "comparison", "alternatives",
    "review", "ranking", "ranked", "list of",
  ];
  const listicleCount = listicleSignals.filter(s => text.includes(s)).length;

  if (listicleCount >= 2 || url.includes("vs-") || url.includes("compare") || url.includes("alternatives")) {
    return "listicle";
  }

  const directorySignals = [
    "directory", "listing", "find a ", "browse ", "category",
    "vendor", "provider", "supplier", "agency",
  ];
  if (directorySignals.some(s => text.includes(s)) && page.listItems.length > 5) {
    return "directory";
  }

  const pressSignals = [
    "press release", "announces", "announced", "funding", "raised",
    "series a", "series b", "series c", "seed round", "acquisition",
    "pr newswire", "businesswire", "globenewswire",
  ];
  if (pressSignals.filter(s => text.includes(s)).length >= 2) {
    return "press";
  }

  const editorialSignals = [
    "article", "opinion", "analysis", "report", "insight",
    "guide", "how to", "explained", "deep dive",
  ];
  if (editorialSignals.filter(s => text.includes(s)).length >= 2) {
    return "editorial";
  }

  const productSignals = [
    "pricing", "features", "sign up", "free trial", "get started",
    "demo", "request a demo", "plans", "subscribe",
  ];
  if (productSignals.filter(s => text.includes(s)).length >= 3) {
    return "product";
  }

  const profileSignals = [
    "about us", "our team", "our story", "who we are", "our mission",
    "founded", "headquarters", "contact us",
  ];
  if (profileSignals.filter(s => text.includes(s)).length >= 2) {
    return "profile";
  }

  const socialDomains = ["linkedin.com", "twitter.com", "x.com", "facebook.com", "instagram.com", "reddit.com"];
  if (socialDomains.some(d => page.domain.includes(d))) {
    return "social";
  }

  return "unknown";
}

function isDomainOwnedByBrand(pageDomain: string, brandDomains: Set<string>): boolean {
  const d = pageDomain.toLowerCase().replace(/^www\./, "");
  for (const bd of brandDomains) {
    if (d === bd || d.endsWith(`.${bd}`)) return true;
  }
  return false;
}

export function classifySource(
  page: CrawledPage,
  trackedBrandsOnPage: number,
  brandDomains: Set<string> = new Set(),
): ClassifiedSource {
  const tier = classifyTier(page.domain);
  const surfaceType = classifySurfaceType(page);
  const isBrandOwned = isDomainOwnedByBrand(page.domain, brandDomains);

  let comparisonSurfaceScore = 0;
  if (isBrandOwned) {
    comparisonSurfaceScore = 0;
  } else if (surfaceType === "product") {
    comparisonSurfaceScore = 0;
  } else if (trackedBrandsOnPage >= 2) {
    comparisonSurfaceScore = 2;
  } else if (surfaceType === "listicle" || surfaceType === "directory") {
    comparisonSurfaceScore = 1;
  }

  return {
    url: page.url,
    domain: page.domain,
    tier,
    tierWeight: TIER_WEIGHTS[tier],
    surfaceType,
    comparisonSurfaceScore,
    title: page.title,
    isBrandOwned,
  };
}

export function classifyAllSources(
  pages: CrawledPage[],
  brandCountPerPage: Map<string, number>,
  brandDomains: Set<string> = new Set(),
): Map<string, ClassifiedSource> {
  const result = new Map<string, ClassifiedSource>();
  for (const page of pages) {
    if (!page.accessible) continue;
    const brandsOnPage = brandCountPerPage.get(page.canonicalUrl) || 0;
    result.set(page.canonicalUrl, classifySource(page, brandsOnPage, brandDomains));
  }
  return result;
}

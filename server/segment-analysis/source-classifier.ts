import type { CrawledPage } from "../crawler";

export type SourceTier = "T1" | "T2" | "T3";
export type SurfaceType = "editorial" | "directory" | "listicle" | "product" | "press" | "profile" | "social" | "unknown";
export type ComparisonTier = "A" | "B" | "C" | null;

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
  comparisonTier: ComparisonTier;
  title: string;
  isBrandOwned: boolean;
}

const COMPARISON_TIER_WEIGHTS: Record<string, number> = {
  A: 3.0,
  B: 1.0,
  C: 0.2,
};

const SOCIAL_DOMAINS = new Set(["linkedin.com", "twitter.com", "x.com", "facebook.com", "instagram.com", "reddit.com"]);
const INVESTOR_DOMAINS = new Set(["crunchbase.com", "pitchbook.com", "angel.co", "wellfound.com", "dealroom.co"]);

function classifyComparisonTier(page: CrawledPage, surfaceType: SurfaceType, isBrandOwned: boolean): ComparisonTier {
  if (isBrandOwned) return null;
  if (surfaceType === "product") return null;

  const d = page.domain.toLowerCase().replace(/^www\./, "");

  if (surfaceType === "listicle" || surfaceType === "directory") return "A";

  const reviewDomains = ["g2.com", "capterra.com", "trustpilot.com", "gartner.com", "forrester.com", "yelp.com", "tripadvisor.com", "goodfirms.co", "clutch.co", "sortlist.com"];
  if (reviewDomains.some(rd => d === rd || d.endsWith(`.${rd}`))) return "A";

  const url = page.url.toLowerCase();
  if (url.includes("alternatives") || url.includes("vs-") || url.includes("compare") || url.includes("best-") || url.includes("top-")) return "A";

  if (surfaceType === "press" || surfaceType === "editorial") return "B";

  if (SOCIAL_DOMAINS.has(d)) return "C";
  if (INVESTOR_DOMAINS.has(d)) return "C";
  if (surfaceType === "profile") return "C";

  return null;
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

  if (/\.gov(\.[a-z]{2})?$/.test(d) || d.endsWith(".edu") || d.endsWith(".org")) return "T1";

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
  const compTier = classifyComparisonTier(page, surfaceType, isBrandOwned);

  let comparisonSurfaceScore = 0;
  if (compTier) {
    comparisonSurfaceScore = COMPARISON_TIER_WEIGHTS[compTier] || 0;
  } else if (!isBrandOwned && surfaceType !== "product" && trackedBrandsOnPage >= 2) {
    comparisonSurfaceScore = COMPARISON_TIER_WEIGHTS["B"];
  }

  return {
    url: page.url,
    domain: page.domain,
    tier,
    tierWeight: TIER_WEIGHTS[tier],
    surfaceType,
    comparisonSurfaceScore,
    comparisonTier: compTier || (trackedBrandsOnPage >= 2 && !isBrandOwned ? "B" : null),
    title: page.title,
    isBrandOwned,
  };
}

// ── Domain category classification ──────────────────────────────────────────

const GOVERNMENT_DOMAINS = new Set([
  "dha.gov.ae", "services.dha.gov.ae", "moh.gov.ae", "haad.ae", "dhcc.ae",
  "tamm.abudhabi", "mohap.gov.ae", "seha.ae",
]);

const SOCIAL_MEDIA_DOMAINS = new Set([
  "linkedin.com", "twitter.com", "x.com", "facebook.com", "instagram.com",
  "reddit.com", "youtube.com", "tiktok.com", "pinterest.com", "snapchat.com",
]);

const REVIEW_PLATFORMS = new Set([
  "trustpilot.com", "trustindex.io", "provenexpert.com", "yelp.com",
  "tripadvisor.com", "google.com", "maps.google.com", "g2.com",
  "capterra.com", "clutch.co", "goodfirms.co",
  "doctify.com", "sitejabber.com", "justdial.com", "linkcentre.com",
  "vitals.com", "ratemds.com", "healthgrades.com", "zocdoc.com",
]);

const HEALTHCARE_DIRECTORIES = new Set([
  "healthfinder.ae", "gooddoctoruae.com", "doctorsathome.ae", "2gis.ae",
  "zaubee.com", "dubaisbest.com", "okadoc.com", "practo.com", "zocdoc.com",
  "servicemarket.com", "healthconnect.ae", "doctorondemand.com",
  "nearfinderme.com", "platinumlist.net",
]);

const MARKET_RESEARCH_DOMAINS = new Set([
  "mordorintelligence.com", "statista.com", "grandviewresearch.com",
  "marketsandmarkets.com", "ibisworld.com", "euromonitor.com",
  "alliedmarketresearch.com", "businessresearchinsights.com",
]);

const JOBS_PLATFORMS = new Set([
  "indeed.com", "ae.indeed.com", "glassdoor.com", "bayt.com",
  "naukrigulf.com", "monster.com", "linkedin.com",
]);

const NEWS_MEDIA_DOMAINS = new Set([
  "gulfnews.com", "khaleejtimes.com", "arabianbusiness.com",
  "thenationalnews.com", "thenational.ae", "zawya.com", "wam.ae",
  "timeoutdubai.com", "timeoutabudhabi.com", "meamarkets.digital",
  "digitalmarketingdeal.me", "forbes.com", "bloomberg.com", "reuters.com",
  "cnbc.com", "businessinsider.com", "techcrunch.com", "wired.com",
  "health.baabeetv.com", "baabeetv.com", "expatwoman.com", "expatsofdubai.com",
]);

const HOSPITAL_CLINIC_DOMAINS = new Set([
  "medcare.ae", "asterclinic.ae", "kingscollegehospitaldubai.com",
  "apollocare.ae", "emirateshospitals.ae", "royalclinicdubai.com",
  "montgohealth.com", "burjeel.com", "cloverleaf.ae", "valeohealth.ae",
  "feelvaleo.com", "aster.ae", "asterathome.ae", "lakecitymedical.ae",
]);

const COMMUNITY_DOMAINS = new Set([
  "reddit.com", "expatsofdubai.com", "gludo.org", "mumsnet.com",
  "expat.com", "internations.org", "dubaiforum.ae",
  "quora.com", "forum.creuniversity.com", "yahooanswers.com",
]);

const BUSINESS_DIRECTORY_DOMAINS = new Set([
  "ensun.io", "crunchbase.com", "zoominfo.com", "apollo.io",
  "dnb.com", "hoovers.com", "kompass.com", "yellowpages.ae",
  "bizwiki.com", "hotfrog.ae", "cylex.ae", "foursquare.com",
]);

const HOSPITAL_CLINIC_EXTRA = new Set([
  "gimcdubai.com", "modernfamilymedicalcentre.com", "sidrahc.com",
  "fakeeh.health", "trudocgroup.com", "oradoctors.com",
  "arabiamd.com", "malaak.me", "snappycare.com",
]);

// Known healthcare provider domains that don't contain obvious keywords
const KNOWN_HEALTHCARE_PROVIDERS = new Set([
  "nightingaledubai.com", "yadalamal.com", "royal-maison.com",
  "medilifeglobal.com", "manzilhealth.com", "vestacare.ae",
]);

const NEWS_MEDIA_EXTRA = new Set([
  "uaedigitalnews.com", "m.edarabia.com", "edarabia.com",
  "dubaihealthlicense.com",
]);

// Healthcare domain keyword detection
const HEALTHCARE_KEYWORDS = [
  "health", "care", "clinic", "nurse", "nursing", "medical", "doctor",
  "physio", "therapy", "hospital", "homecare", "homehealthcare",
  "homehealth", "elderlycare", "eldercare", "wellnes", "wellness",
];

function isHealthcareProviderDomain(domain: string): boolean {
  const d = domain.toLowerCase();
  return HEALTHCARE_KEYWORDS.some(kw => d.includes(kw));
}

export function detectPageType(url: string): string {
  if (!url || url.includes("vertexaisearch.cloud.google.com")) return "unknown";
  let path = "";
  try {
    path = new URL(url).pathname.toLowerCase();
  } catch {
    return "unknown";
  }
  // Strip trailing slash and normalise
  const p = path.replace(/\/+$/, "") || "/";

  if (p === "" || p === "/") return "homepage";
  if (/\/(blog|blogs|insight|insights|thought-leadership|resources|learn|knowledge)(\/|$)/.test(p)) return "blog_post";
  if (/\/(news|press|press-release|media|announcements|article|articles|story|stories|post|posts)(\/|$)/.test(p)) return "article";
  if (/\/(service|services|solution|solutions|offering|offerings|what-we-do|our-services|care-services)(\/|$)/.test(p)) return "service_page";
  if (/\/(about|who-we-are|our-story|team|leadership|mission)(\/|$)/.test(p)) return "about_page";
  if (/\/(company|companies|organisation|organization)(\/|$)/.test(p)) return "company_profile";
  if (/\/(profile|provider|doctor|physician|nurse|staff|therapist|caregiver)(\/|$)/.test(p)) return "profile";
  if (/\/(contact|contact-us|get-in-touch|reach-us)(\/|$)/.test(p)) return "contact_page";
  if (/\/(product|products|plan|plans|pricing)(\/|$)/.test(p)) return "product_page";
  if (/\/(faq|faqs|help|support|questions)(\/|$)/.test(p)) return "faq_page";
  if (/\/(review|reviews|testimonial|testimonials|rating|ratings)(\/|$)/.test(p)) return "review_page";
  if (/\/(location|locations|branch|branches|clinic|clinics|centre|center)(\/|$)/.test(p)) return "location_page";
  if (/\/(category|categories|tag|tags|topic|topics)(\/|$)/.test(p)) return "category_page";
  return "inner_page";
}

export function classifyDomainCategory(domain: string): string {
  const d = domain.toLowerCase().replace(/^www\./, "").replace(/^(jm|uk|ae|us|in)\./,"");

  if (d.includes("vertexaisearch")) return "ai_platform";
  if (GOVERNMENT_DOMAINS.has(d) || /\.gov(\.[a-z]{2})?$/.test(d)) return "government";
  if (MARKET_RESEARCH_DOMAINS.has(d)) return "market_research";
  if (NEWS_MEDIA_DOMAINS.has(d) || NEWS_MEDIA_EXTRA.has(d)) return "news_media";
  if (REVIEW_PLATFORMS.has(d)) return "review_platform";
  if (HEALTHCARE_DIRECTORIES.has(d)) return "healthcare_directory";
  if (HOSPITAL_CLINIC_DOMAINS.has(d) || HOSPITAL_CLINIC_EXTRA.has(d)) return "hospital_clinic";
  if (JOBS_PLATFORMS.has(d)) return "jobs_platform";
  if (SOCIAL_MEDIA_DOMAINS.has(d)) return "social_media";
  if (COMMUNITY_DOMAINS.has(d)) return "community";
  if (BUSINESS_DIRECTORY_DOMAINS.has(d)) return "business_directory";

  // UAE domain, known provider, or healthcare keyword in domain → healthcare provider
  if (d.endsWith(".ae") || KNOWN_HEALTHCARE_PROVIDERS.has(d) || isHealthcareProviderDomain(d)) return "healthcare_provider";

  return "general_web";
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

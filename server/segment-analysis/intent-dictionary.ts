export interface IntentDictionary {
  segmentId: string;
  category_terms: string[];
  category_terms_weak: string[];
  audience_terms: string[];
  audience_terms_weak: string[];
  audience_terms_adjacent: string[];
  service_terms: string[];
  audienceBucket: string;
}

interface SegmentTerms {
  explicit: string[];
  weak: string[];
}

const SEGMENT_CATEGORY_DICTIONARY: Record<string, SegmentTerms> = {
  "expense_management_software": {
    explicit: [
      "expense management", "expense management software", "expense tracking",
      "expense platform", "expense automation", "expense reporting",
      "expense solution", "expense app", "expense tool",
    ],
    weak: [
      "spend management", "spend controls", "spend tracking", "spend platform",
      "receipt capture", "receipt scanning", "receipt matching",
      "reimbursement", "reimbursements", "approval workflow", "approval workflows",
      "invoice management", "accounts payable", "ap automation",
      "expense card", "corporate expense",
    ],
  },
  "corporate_cards_provider": {
    explicit: [
      "corporate card", "corporate cards", "business card", "business cards",
      "company card", "company cards", "virtual card", "virtual cards",
      "corporate credit card", "corporate credit cards",
      "physical and virtual cards", "physical card", "physical cards",
    ],
    weak: [
      "spend card", "spend cards", "card issuance", "card management",
      "cards for employees", "employee card", "employee cards",
      "prepaid card", "prepaid cards", "charge card", "charge cards",
      "card controls", "card program",
    ],
  },
  "marketing_agency": {
    explicit: [
      "marketing agency", "marketing agencies", "digital agency",
      "digital agencies", "marketing firm", "marketing company",
      "marketing services", "digital marketing agency",
    ],
    weak: [
      "marketing partner", "agency partner", "creative agency",
      "advertising agency", "ad agency", "media agency",
      "full-service agency", "marketing consultant",
    ],
  },
  "seo_agency": {
    explicit: [
      "seo agency", "seo agencies", "seo company", "seo firm",
      "seo services", "seo consultant", "search engine optimization",
    ],
    weak: [
      "organic search", "search ranking", "keyword research",
      "link building", "technical seo", "seo strategy",
    ],
  },
  "web_design": {
    explicit: [
      "web design", "web design agency", "website design",
      "web development", "web developer", "website development",
    ],
    weak: [
      "website builder", "frontend development", "ui design",
      "ux design", "responsive design", "web studio",
    ],
  },
  "social_media": {
    explicit: [
      "social media agency", "social media management",
      "social media marketing", "smm", "social media services",
    ],
    weak: [
      "social strategy", "community management", "influencer marketing",
      "content creation", "social advertising", "social campaigns",
    ],
  },
  "pr_agency": {
    explicit: [
      "pr agency", "public relations agency", "pr firm",
      "pr company", "public relations firm", "pr services",
    ],
    weak: [
      "media relations", "press coverage", "communications agency",
      "crisis communications", "media outreach",
    ],
  },
  "branding_agency": {
    explicit: [
      "branding agency", "branding agencies", "brand agency",
      "brand design agency", "brand strategy agency",
    ],
    weak: [
      "brand identity", "brand design", "brand development",
      "visual identity", "brand consulting",
    ],
  },
  "restaurant": {
    explicit: ["restaurant", "restaurants", "dining", "eatery", "eateries"],
    weak: ["food place", "dine-in", "food service", "bistro", "brasserie"],
  },
  "italian_restaurant": {
    explicit: [
      "italian restaurant", "italian restaurants", "italian dining",
      "italian food", "italian cuisine", "trattoria", "pizzeria",
    ],
    weak: ["pasta", "risotto", "italian kitchen", "osteria"],
  },
  "pizza": {
    explicit: ["pizza restaurant", "pizza place", "pizzeria", "pizza shop", "pizza"],
    weak: ["pizza delivery", "pizza chain"],
  },
  "sushi": {
    explicit: [
      "sushi restaurant", "sushi bar", "japanese restaurant",
      "japanese food", "sushi",
    ],
    weak: ["japanese cuisine", "sashimi", "omakase", "ramen"],
  },
  "coffee_shop": {
    explicit: ["coffee shop", "coffee shops", "cafe", "cafes", "coffee house", "coffeehouse"],
    weak: ["espresso bar", "specialty coffee", "coffee roaster"],
  },
  "hotel": {
    explicit: ["hotel", "hotels", "accommodation", "lodging", "resort", "resorts"],
    weak: ["hospitality", "stay", "booking", "guest house"],
  },
  "saas": {
    explicit: ["saas", "software as a service", "cloud software", "software platform"],
    weak: ["platform", "software solution", "cloud solution", "tool"],
  },
  "crm": {
    explicit: [
      "crm", "crm software", "crm platform",
      "customer relationship management", "crm solution",
    ],
    weak: ["contact management", "sales pipeline", "lead management", "sales tool"],
  },
  "project_management": {
    explicit: [
      "project management", "project management tool",
      "project management software", "pm tool", "task management",
    ],
    weak: ["project tracking", "project planning", "collaboration tool", "workflow management"],
  },
  "accounting_software": {
    explicit: [
      "accounting software", "accounting platform",
      "bookkeeping software", "accounting tool", "accounting solution",
    ],
    weak: ["bookkeeping", "financial reporting", "general ledger", "tax software"],
  },
  "fleet_management": {
    explicit: [
      "fleet management", "fleet cards", "fleet tracking",
      "fleet solution", "vehicle management",
    ],
    weak: ["fleet operations", "vehicle tracking", "fuel card", "fleet card"],
  },
  "fintech": {
    explicit: ["fintech", "financial technology", "fintech company", "fintech platform"],
    weak: ["financial services", "digital finance", "neobank", "digital banking"],
  },
  "payment_processing": {
    explicit: [
      "payment processing", "payment gateway", "payment solution",
      "payment platform", "online payments",
    ],
    weak: ["checkout", "payment infrastructure", "acquiring", "merchant services"],
  },
};

const AUDIENCE_DICTIONARY: Record<string, SegmentTerms> = {
  "startups": {
    explicit: [
      "startup", "startups", "early-stage", "early stage",
      "seed stage", "series a", "founders", "founder",
    ],
    weak: [
      "new business", "new businesses", "fast-growing", "fast growing",
      "growth-stage", "emerging company", "emerging companies",
      "young company", "young companies",
    ],
  },
  "smbs": {
    explicit: [
      "sme", "smes", "smb", "smbs",
      "small business", "small businesses",
      "small and medium", "small & medium",
      "small-to-medium", "small to medium",
      "small and medium-sized", "small and medium sized",
    ],
    weak: [
      "businesses", "companies", "growing business", "growing businesses",
      "mid-sized", "midsize", "medium-sized",
    ],
  },
  "enterprise": {
    explicit: [
      "enterprise", "enterprises", "large enterprise",
      "large business", "large businesses", "large company",
      "large companies", "corporate", "corporates",
    ],
    weak: [
      "multinational", "global company", "fortune 500",
      "large-scale", "large organization",
    ],
  },
  "mid-market": {
    explicit: [
      "mid-market", "midmarket", "mid market",
      "medium business", "medium businesses", "medium-sized",
    ],
    weak: [
      "growing company", "scaling business", "100-500 employees",
    ],
  },
  "freelancer": {
    explicit: [
      "freelancer", "freelancers", "freelance",
      "independent", "solo", "solopreneur",
    ],
    weak: ["self-employed", "contractor", "independent worker"],
  },
  "agency": {
    explicit: [
      "agency", "agencies", "digital agency", "digital agencies",
      "marketing agency", "marketing agencies",
    ],
    weak: ["consultancy", "firm", "service provider"],
  },
  "ecommerce": {
    explicit: [
      "ecommerce", "e-commerce", "online store", "online stores",
      "online shop", "online retail",
    ],
    weak: ["d2c", "direct to consumer", "shopify store", "online seller"],
  },
  "families": {
    explicit: ["family", "families", "family-friendly", "kids", "children"],
    weak: ["kid-friendly", "family dining", "family restaurant"],
  },
  "couples": {
    explicit: ["date night", "romantic", "romantic dining", "couples"],
    weak: ["intimate", "fine dining"],
  },
  "business_dining": {
    explicit: ["business lunch", "corporate dining", "business dinner", "business dining"],
    weak: ["client lunch", "working lunch", "executive dining"],
  },
  "students": {
    explicit: ["student", "students", "college", "university"],
    weak: ["campus", "academic", "budget-friendly"],
  },
  "professionals": {
    explicit: ["professional", "professionals", "business professional", "executive", "executives"],
    weak: ["white-collar", "manager", "managers"],
  },
  "developers": {
    explicit: ["developer", "developers", "engineer", "engineers", "dev", "devs", "programmer", "programmers"],
    weak: ["technical", "coding", "software engineer"],
  },
};

const AUDIENCE_ADJACENCY: Record<string, string[]> = {
  "startups": ["smbs", "freelancer"],
  "smbs": ["startups", "mid-market"],
  "enterprise": ["mid-market"],
  "mid-market": ["smbs", "enterprise"],
  "freelancer": ["startups", "smbs"],
  "agency": ["smbs"],
  "ecommerce": ["smbs"],
  "families": ["couples"],
  "couples": ["families"],
  "business_dining": ["professionals"],
  "professionals": ["business_dining", "enterprise"],
  "students": [],
  "developers": ["professionals"],
};

function lookupSegmentTerms(value: string, dictionary: Record<string, SegmentTerms>): { explicit: string[]; weak: string[] } {
  const lower = value.toLowerCase().trim().replace(/\s+/g, "_");

  if (dictionary[lower]) {
    return dictionary[lower];
  }

  const withoutUnderscores = lower.replace(/_/g, " ");
  for (const [key, terms] of Object.entries(dictionary)) {
    const keyNorm = key.replace(/_/g, " ");
    if (keyNorm === withoutUnderscores) {
      return terms;
    }
    if (terms.explicit.some(t => t === withoutUnderscores) || terms.weak.some(t => t === withoutUnderscores)) {
      return terms;
    }
  }

  return { explicit: [withoutUnderscores], weak: [] };
}

function resolveAudienceBucketKey(customerType: string): string {
  const lower = customerType.toLowerCase().trim().replace(/\s+/g, "_");
  if (AUDIENCE_DICTIONARY[lower]) return lower;
  const withoutUnderscores = lower.replace(/_/g, " ");
  for (const [key, terms] of Object.entries(AUDIENCE_DICTIONARY)) {
    const keyNorm = key.replace(/_/g, " ");
    if (keyNorm === withoutUnderscores) return key;
    if (terms.explicit.some(t => t === withoutUnderscores) || terms.weak.some(t => t === withoutUnderscores)) return key;
  }
  return lower;
}

export function buildIntentDictionary(
  segmentId: string,
  seedType: string,
  customerType: string,
  service?: string,
): IntentDictionary {
  const catTerms = lookupSegmentTerms(seedType, SEGMENT_CATEGORY_DICTIONARY);
  const audTerms = customerType ? lookupSegmentTerms(customerType, AUDIENCE_DICTIONARY) : { explicit: [], weak: [] };
  const svcTerms = service ? lookupSegmentTerms(service, SEGMENT_CATEGORY_DICTIONARY) : { explicit: [], weak: [] };

  const bucketKey = customerType ? resolveAudienceBucketKey(customerType) : "";
  const adjacentBuckets = AUDIENCE_ADJACENCY[bucketKey] || [];
  const adjacentTerms: string[] = [];
  for (const adjKey of adjacentBuckets) {
    const adjTerms = AUDIENCE_DICTIONARY[adjKey];
    if (adjTerms) {
      adjacentTerms.push(...adjTerms.explicit, ...adjTerms.weak);
    }
  }

  return {
    segmentId,
    category_terms: catTerms.explicit,
    category_terms_weak: catTerms.weak,
    audience_terms: audTerms.explicit,
    audience_terms_weak: audTerms.weak,
    audience_terms_adjacent: adjacentTerms,
    service_terms: [...svcTerms.explicit, ...svcTerms.weak],
    audienceBucket: bucketKey,
  };
}

export function buildAllIntentDictionaries(
  segments: { id: string; seedType: string; customerType: string; service?: string }[],
): Map<string, IntentDictionary> {
  const map = new Map<string, IntentDictionary>();
  for (const seg of segments) {
    map.set(seg.id, buildIntentDictionary(seg.id, seg.seedType, seg.customerType, seg.service));
  }
  return map;
}

export type SnippetMatchLevel = "explicit" | "weak" | "adjacent" | "none";

export function classifySnippetMatch(
  snippetText: string,
  dict: IntentDictionary,
): { categoryMatch: SnippetMatchLevel; audienceMatch: SnippetMatchLevel } {
  const lower = snippetText.toLowerCase();

  let categoryMatch: SnippetMatchLevel = "none";
  for (const term of dict.category_terms) {
    if (lower.includes(term)) {
      categoryMatch = "explicit";
      break;
    }
  }
  if (categoryMatch === "none") {
    const allWeakTerms = [...dict.category_terms_weak, ...dict.service_terms];
    for (const term of allWeakTerms) {
      if (lower.includes(term)) {
        categoryMatch = "weak";
        break;
      }
    }
  }

  let audienceMatch: SnippetMatchLevel = "none";
  const hasAudienceTerms = dict.audience_terms.length > 0 || dict.audience_terms_weak.length > 0;
  if (hasAudienceTerms) {
    for (const term of dict.audience_terms) {
      if (lower.includes(term)) {
        audienceMatch = "explicit";
        break;
      }
    }
    if (audienceMatch === "none") {
      for (const term of dict.audience_terms_weak) {
        if (lower.includes(term)) {
          audienceMatch = "weak";
          break;
        }
      }
    }
    if (audienceMatch === "none" && dict.audience_terms_adjacent.length > 0) {
      for (const term of dict.audience_terms_adjacent) {
        if (lower.includes(term)) {
          audienceMatch = "adjacent";
          break;
        }
      }
    }
  }

  return { categoryMatch, audienceMatch };
}

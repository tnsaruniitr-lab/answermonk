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
  "web_design_agency": {
    explicit: [
      "web design", "web design agency", "website design",
      "web development", "web developer", "website development",
    ],
    weak: [
      "website builder", "frontend development", "ui design",
      "ux design", "responsive design", "web studio",
    ],
  },
  "social_media_agency": {
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
  "performance_marketing_agency": {
    explicit: [
      "performance marketing agency", "performance marketing",
      "performance agency", "growth marketing agency",
    ],
    weak: [
      "paid media", "roi-driven marketing", "conversion optimization",
      "paid advertising", "media buying", "growth hacking",
    ],
  },
  "content_marketing_agency": {
    explicit: [
      "content marketing agency", "content agency",
      "content marketing", "content strategy agency",
    ],
    weak: [
      "content creation", "blog writing", "content strategy",
      "copywriting", "editorial", "thought leadership",
    ],
  },
  "digital_marketing_agency": {
    explicit: [
      "digital marketing agency", "digital agency",
      "digital marketing", "online marketing agency",
    ],
    weak: [
      "online advertising", "digital strategy", "internet marketing",
      "multi-channel marketing", "omnichannel marketing",
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
  "in_home_healthcare": {
    explicit: [
      "in-home healthcare", "in home healthcare", "home healthcare",
      "home health care", "home nursing", "home care services",
      "home medical care", "in-home nursing", "home health services",
    ],
    weak: [
      "home visit", "home visits", "house call", "house calls",
      "nursing at home", "doctor at home", "physiotherapy at home",
      "home physiotherapy", "home lab test", "home caregiver",
      "domiciliary care", "home health aide",
    ],
  },
  "at_home_healthcare": {
    explicit: [
      "at-home healthcare", "at home healthcare", "home healthcare providers",
      "at-home health services", "at-home medical care",
      "home health care provider", "at home health care",
    ],
    weak: [
      "home visit", "home visits", "healthcare at home",
      "medical home visit", "doctor home visit", "nurse at home",
      "home-based care", "mobile healthcare",
    ],
  },
  "weight_loss_help": {
    explicit: [
      "weight loss", "weight loss clinic", "weight loss program",
      "weight management", "weight loss provider", "weight loss center",
      "slimming clinic", "weight loss service",
    ],
    weak: [
      "diet plan", "nutrition program", "bariatric", "fat loss",
      "body sculpting", "meal plan", "calorie management",
      "fitness nutrition", "weight reduction",
    ],
  },
  "in_home_blood_tests": {
    explicit: [
      "in-home blood test", "home blood test", "blood test at home",
      "home lab test", "home pathology", "at-home blood work",
      "home sample collection", "home blood draw",
    ],
    weak: [
      "mobile phlebotomy", "home diagnostics", "lab at home",
      "home health checkup", "doorstep blood test", "home lab services",
    ],
  },
  "at_home_blood_tests": {
    explicit: [
      "at-home blood test", "at home blood test", "blood test at home",
      "home blood testing", "home lab test", "at-home lab work",
      "home sample collection", "mobile blood test",
    ],
    weak: [
      "mobile phlebotomy", "home diagnostics", "lab at doorstep",
      "home health screening", "doorstep lab test",
    ],
  },
  "at_home_nurses": {
    explicit: [
      "at-home nurse", "at home nurse", "nurse at home", "nursing at home",
      "home nurse", "home nursing service", "home nursing services",
      "private nurse at home", "home nursing care",
    ],
    weak: [
      "home caregiver", "home health aide", "domiciliary nursing",
      "visiting nurse", "community nurse", "bedside nursing at home",
      "wound care nurse at home", "private nursing", "in-home nurse",
    ],
  },
  "at_home_care_provider": {
    explicit: [
      "at-home care provider", "at home care provider", "home care provider",
      "home care company", "home care agency", "home care services provider",
      "home healthcare provider", "home health provider",
    ],
    weak: [
      "home care", "care at home", "home-based care", "domiciliary care",
      "homecare agency", "home support services", "home care specialist",
      "private home care", "mobile healthcare provider",
    ],
  },
  "care_at_home_services": {
    explicit: [
      "care at home services", "care at home", "home care services",
      "home care service", "in-home care services", "at-home care services",
      "home based care services", "home health services",
    ],
    weak: [
      "homecare services", "domiciliary care services", "home support",
      "home care assistance", "personal care at home", "home attendant",
      "home aide services", "residential care services",
    ],
  },
  "doctor_at_home": {
    explicit: [
      "doctor at home", "doctor home visit", "GP at home", "physician at home",
      "home doctor service", "home doctor", "doctor on call",
      "doctor home call", "home visit doctor",
    ],
    weak: [
      "home medical visit", "medical home visit", "house call doctor",
      "home physician", "mobile doctor", "doorstep doctor",
      "on-demand doctor", "home consultation", "home GP",
    ],
  },
  "home_physiotherapy": {
    explicit: [
      "home physiotherapy", "physiotherapy at home", "physio at home",
      "home physical therapy", "physical therapy at home",
      "home physio", "home rehabilitation", "home rehab services",
    ],
    weak: [
      "home exercise program", "mobile physiotherapy", "doorstep physiotherapy",
      "home-based physiotherapy", "at-home physiotherapy",
      "home occupational therapy", "home speech therapy",
      "post-surgery rehab at home", "sports physio at home",
    ],
  },
  "home_iv_therapy": {
    explicit: [
      "home IV therapy", "IV therapy at home", "home intravenous therapy",
      "IV drip at home", "home IV drip", "IV infusion at home",
      "home infusion therapy", "mobile IV therapy",
    ],
    weak: [
      "vitamin drip at home", "hydration drip at home", "home drip therapy",
      "IV hydration at home", "wellness drip at home",
      "home vitamin infusion", "doorstep IV", "mobile drip",
    ],
  },
  "elderly_care_at_home": {
    explicit: [
      "elderly care at home", "senior care at home", "home care for elderly",
      "home elder care", "old age care at home", "geriatric care at home",
      "home care for seniors", "elderly home care",
    ],
    weak: [
      "companion care", "dementia care at home", "Alzheimer's care at home",
      "palliative care at home", "end of life care at home",
      "home care for older adults", "senior home help",
      "old age nursing", "elderly companion", "home respite care",
    ],
  },
  "home_health_checkup": {
    explicit: [
      "home health checkup", "health checkup at home", "home health screening",
      "home wellness checkup", "health screening at home",
      "home full body checkup", "doorstep health checkup",
    ],
    weak: [
      "home preventive health", "home diagnostic package",
      "health check at home", "home body checkup",
      "mobile health screening", "at-home health assessment",
      "comprehensive health check at home",
    ],
  },
  "construction_management": {
    explicit: [
      "construction management", "construction management software",
      "construction project management", "construction platform",
    ],
    weak: [
      "building management", "site management", "project tracking",
      "construction scheduling", "contractor management",
    ],
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
  persona?: string,
): IntentDictionary {
  const effectiveSeedType = (!seedType || seedType.toLowerCase() === "blank") && persona
    ? persona
    : seedType;
  const catTerms = lookupSegmentTerms(effectiveSeedType, SEGMENT_CATEGORY_DICTIONARY);
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
  segments: { id: string; seedType: string; customerType: string; service?: string; persona?: string }[],
): Map<string, IntentDictionary> {
  const map = new Map<string, IntentDictionary>();
  for (const seg of segments) {
    map.set(seg.id, buildIntentDictionary(seg.id, seg.seedType, seg.customerType, seg.service, seg.persona));
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

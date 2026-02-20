export interface IntentDictionary {
  segmentId: string;
  category_terms: string[];
  audience_terms: string[];
  service_terms: string[];
}

const CATEGORY_SYNONYMS: Record<string, string[]> = {
  "corporate card": ["corporate cards", "business card", "business cards", "company card", "company cards", "virtual card", "virtual cards", "spend card", "expense card"],
  "corporate cards": ["corporate card", "business card", "business cards", "company card", "virtual card", "spend card", "expense card"],
  "credit card": ["credit cards", "charge card", "charge cards"],
  "expense management": ["expense tracking", "expense reporting", "expense software", "spend management"],
  "payment processing": ["payment gateway", "payment solution", "payment platform", "online payments"],
  "marketing agency": ["marketing agencies", "digital agency", "digital agencies", "marketing firm", "marketing company"],
  "seo agency": ["seo agencies", "seo company", "seo firm", "seo services", "seo consultant"],
  "web design": ["web design agency", "website design", "web development", "web developer"],
  "social media": ["social media agency", "social media management", "social media marketing", "smm"],
  "pr agency": ["public relations agency", "pr firm", "pr company", "public relations firm"],
  "branding agency": ["branding agencies", "brand agency", "brand design agency", "brand strategy agency"],
  "restaurant": ["restaurants", "dining", "eatery", "eateries", "food place"],
  "italian restaurant": ["italian restaurants", "italian dining", "italian food", "italian cuisine", "trattoria", "pizzeria"],
  "pizza": ["pizza restaurant", "pizza place", "pizzeria", "pizza shop"],
  "sushi": ["sushi restaurant", "sushi bar", "japanese restaurant", "japanese food"],
  "coffee shop": ["coffee shops", "cafe", "cafes", "coffee house", "coffeehouse"],
  "hotel": ["hotels", "accommodation", "lodging", "resort", "resorts"],
  "saas": ["software", "platform", "cloud software", "software solution"],
  "crm": ["crm software", "crm platform", "customer relationship management", "crm solution"],
  "project management": ["project management tool", "project management software", "pm tool", "task management"],
  "accounting software": ["accounting platform", "bookkeeping software", "accounting tool", "accounting solution"],
  "fleet management": ["fleet cards", "fleet tracking", "fleet solution", "vehicle management"],
  "fintech": ["financial technology", "fintech company", "fintech platform"],
};

const AUDIENCE_SYNONYMS: Record<string, string[]> = {
  "startups": ["startup", "early-stage", "early stage", "seed stage", "new business", "new businesses"],
  "smb": ["smbs", "sme", "smes", "small business", "small businesses", "small and medium", "small & medium"],
  "sme": ["smes", "smb", "smbs", "small business", "small businesses"],
  "enterprise": ["enterprises", "large enterprise", "large business", "large businesses", "large company", "large companies", "corporate", "corporates"],
  "mid-market": ["midmarket", "mid market", "medium business", "medium businesses", "medium-sized"],
  "freelancer": ["freelancers", "freelance", "independent", "solo", "solopreneur"],
  "agency": ["agencies", "digital agency", "digital agencies", "marketing agency", "marketing agencies"],
  "ecommerce": ["e-commerce", "online store", "online stores", "online shop", "online retail"],
  "families": ["family", "family-friendly", "kids", "children"],
  "couples": ["date night", "romantic", "romantic dining"],
  "business dining": ["business lunch", "corporate dining", "business dinner"],
  "students": ["student", "college", "university"],
  "professionals": ["professional", "business professional", "executive", "executives"],
  "developers": ["developer", "engineer", "engineers", "dev", "devs", "programmer", "programmers"],
};

function expandTerms(value: string, synonymMap: Record<string, string[]>): string[] {
  const lower = value.toLowerCase().trim();
  if (!lower) return [];

  const terms = new Set<string>();
  terms.add(lower);

  if (synonymMap[lower]) {
    for (const syn of synonymMap[lower]) {
      terms.add(syn.toLowerCase());
    }
  }

  for (const [key, syns] of Object.entries(synonymMap)) {
    if (syns.map(s => s.toLowerCase()).includes(lower)) {
      terms.add(key.toLowerCase());
      for (const syn of syns) {
        terms.add(syn.toLowerCase());
      }
    }
  }

  return [...terms];
}

export function buildIntentDictionary(
  segmentId: string,
  seedType: string,
  customerType: string,
  service?: string,
): IntentDictionary {
  const category_terms = expandTerms(seedType, CATEGORY_SYNONYMS);
  const audience_terms = expandTerms(customerType, AUDIENCE_SYNONYMS);
  const service_terms = service ? expandTerms(service, CATEGORY_SYNONYMS) : [];

  return {
    segmentId,
    category_terms,
    audience_terms,
    service_terms,
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

export type SnippetMatchLevel = "explicit" | "weak" | "none";

export function classifySnippetMatch(
  snippetText: string,
  dict: IntentDictionary,
): { categoryMatch: SnippetMatchLevel; audienceMatch: SnippetMatchLevel } {
  const lower = snippetText.toLowerCase();

  let categoryMatch: SnippetMatchLevel = "none";
  const allCategoryTerms = [...dict.category_terms, ...dict.service_terms];
  for (const term of allCategoryTerms) {
    if (lower.includes(term)) {
      categoryMatch = "explicit";
      break;
    }
  }
  if (categoryMatch === "none") {
    const partials = allCategoryTerms.flatMap(t => t.split(/\s+/)).filter(w => w.length > 3);
    const partialHits = partials.filter(p => lower.includes(p));
    if (partialHits.length >= 1) {
      categoryMatch = "weak";
    }
  }

  let audienceMatch: SnippetMatchLevel = "none";
  if (dict.audience_terms.length > 0) {
    for (const term of dict.audience_terms) {
      if (lower.includes(term)) {
        audienceMatch = "explicit";
        break;
      }
    }
    if (audienceMatch === "none") {
      const partials = dict.audience_terms.flatMap(t => t.split(/\s+/)).filter(w => w.length > 3);
      const partialHits = partials.filter(p => lower.includes(p));
      if (partialHits.length >= 1) {
        audienceMatch = "weak";
      }
    }
  }

  return { categoryMatch, audienceMatch };
}

export interface SynonymMap {
  direct: string[];
  regional: string[];
  implied: string[];
  ambiguous: string[];
  contradictory: string[];
}

export type EvidenceStrength = "supported" | "weak_support" | "neutral" | "contradicted";

const GEO_SYNONYMS: Record<string, SynonymMap> = {
  uae: {
    direct: ["uae", "united arab emirates", "dubai", "abu dhabi", "sharjah", "ajman", "ras al khaimah", "fujairah", "umm al quwain"],
    regional: ["gcc", "middle east", "mena", "gulf region", "gulf states", "arabian gulf", "gulf countries"],
    implied: ["dubai-based", "abu dhabi-based", "uae-based", "difc", "adgm", "licensed in difc", "licensed in adgm", "dwtc", "dmcc", "jafza", "dfsa", "emirates"],
    ambiguous: ["global", "international", "worldwide", "multinational", "multi-country"],
    contradictory: ["us-only", "us only", "united states only", "europe-only", "europe only", "north america only", "uk-only", "uk only"],
  },
  saudi: {
    direct: ["saudi", "saudi arabia", "ksa", "riyadh", "jeddah", "dammam"],
    regional: ["gcc", "middle east", "mena", "gulf region", "gulf states"],
    implied: ["saudi-based", "riyadh-based", "sama regulated", "licensed in saudi"],
    ambiguous: ["global", "international", "worldwide"],
    contradictory: ["us-only", "europe-only"],
  },
  global: {
    direct: ["global", "worldwide", "international"],
    regional: [],
    implied: ["available everywhere", "multi-country", "multi-region"],
    ambiguous: [],
    contradictory: [],
  },
};

const AUDIENCE_SYNONYMS: Record<string, SynonymMap> = {
  startups: {
    direct: ["startup", "startups", "start-up", "start-ups", "early-stage"],
    regional: ["sme", "smes", "small business", "small businesses", "smb", "smbs"],
    implied: ["founder", "founders", "seed", "series a", "pre-seed", "bootstrapped", "new business", "young company"],
    ambiguous: ["company", "companies", "business", "businesses", "organization", "organizations", "enterprise"],
    contradictory: ["enterprise-only", "large corporation", "fortune 500 only"],
  },
  enterprise: {
    direct: ["enterprise", "large enterprise", "corporation", "corporate", "large company"],
    regional: ["mid-market", "mid market", "midsize"],
    implied: ["fortune 500", "fortune 1000", "publicly traded", "multinational corporation"],
    ambiguous: ["company", "companies", "business", "businesses", "organization"],
    contradictory: ["startup-only", "smb-only", "small business only"],
  },
  sme: {
    direct: ["sme", "smes", "small and medium", "small & medium", "small business", "smb"],
    regional: ["startup", "startups", "growing business"],
    implied: ["mid-size", "mid-market", "growing company", "scaling"],
    ambiguous: ["company", "companies", "business", "businesses"],
    contradictory: ["enterprise-only", "large corporation only"],
  },
};

const CATEGORY_SYNONYMS: Record<string, SynonymMap> = {
  "corporate cards": {
    direct: ["corporate card", "corporate cards", "business card", "business cards", "company card", "company cards"],
    regional: ["spend card", "spend cards", "expense card", "expense cards", "virtual card", "virtual cards"],
    implied: ["card issuing", "card issuance", "prepaid card", "debit card", "credit card"],
    ambiguous: ["payment", "payments", "fintech", "financial"],
    contradictory: [],
  },
  "expense management": {
    direct: ["expense management", "expense tracking", "expense reporting", "expense software"],
    regional: ["spend management", "spend tracking", "spend control"],
    implied: ["receipt scanning", "receipt management", "reimbursement", "expense automation"],
    ambiguous: ["financial management", "finance software", "accounting"],
    contradictory: [],
  },
  "marketing agency": {
    direct: ["marketing agency", "digital marketing agency", "marketing firm", "marketing company"],
    regional: ["digital agency", "advertising agency", "creative agency", "media agency"],
    implied: ["full-service agency", "growth agency", "performance agency"],
    ambiguous: ["agency", "consultancy", "studio"],
    contradictory: [],
  },
  seo: {
    direct: ["seo", "search engine optimization", "seo agency", "seo services"],
    regional: ["organic search", "search marketing", "search visibility"],
    implied: ["keyword ranking", "link building", "on-page optimization", "technical seo"],
    ambiguous: ["digital marketing", "online marketing"],
    contradictory: [],
  },
};

export function getGeoSynonyms(geo: string): SynonymMap {
  const key = geo.toLowerCase().replace(/[^a-z]/g, "");
  return GEO_SYNONYMS[key] || {
    direct: [geo.toLowerCase()],
    regional: [],
    implied: [],
    ambiguous: ["global", "international", "worldwide"],
    contradictory: [],
  };
}

export function getAudienceSynonyms(audience: string): SynonymMap {
  const key = audience.toLowerCase().replace(/[^a-z]/g, "");
  for (const [k, v] of Object.entries(AUDIENCE_SYNONYMS)) {
    if (key.includes(k) || k.includes(key)) return v;
    if (v.direct.some(d => key.includes(d.replace(/[^a-z]/g, "")))) return v;
  }
  return {
    direct: [audience.toLowerCase()],
    regional: [],
    implied: [],
    ambiguous: [],
    contradictory: [],
  };
}

export function getCategorySynonyms(category: string): SynonymMap {
  const lower = category.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_SYNONYMS)) {
    if (lower.includes(k) || k.includes(lower)) return v;
    if (v.direct.some(d => lower.includes(d))) return v;
  }
  return {
    direct: [category.toLowerCase()],
    regional: [],
    implied: [],
    ambiguous: [],
    contradictory: [],
  };
}

export function classifyEvidence(text: string, synonymMap: SynonymMap): EvidenceStrength {
  const lower = text.toLowerCase();

  for (const term of synonymMap.contradictory) {
    if (lower.includes(term)) return "contradicted";
  }
  for (const term of synonymMap.direct) {
    if (lower.includes(term)) return "supported";
  }
  for (const term of synonymMap.implied) {
    if (lower.includes(term)) return "supported";
  }
  for (const term of synonymMap.regional) {
    if (lower.includes(term)) return "weak_support";
  }
  for (const term of synonymMap.ambiguous) {
    if (lower.includes(term)) return "neutral";
  }

  return "neutral";
}

export function findMatchingTerms(text: string, synonymMap: SynonymMap): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  const allTerms = [
    ...synonymMap.direct,
    ...synonymMap.regional,
    ...synonymMap.implied,
    ...synonymMap.ambiguous,
    ...synonymMap.contradictory,
  ];
  for (const term of allTerms) {
    if (lower.includes(term)) found.push(term);
  }
  return found;
}

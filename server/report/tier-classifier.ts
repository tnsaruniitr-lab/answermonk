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

const AI_INFRA_DOMAINS = new Set([
  "vertexaisearch.cloud.google.com",
]);

export type TierLabel = "T1" | "T2" | "T3" | "T4" | "brand_owned";

export function isAIInfraDomain(domain: string): boolean {
  const d = domain.toLowerCase().replace(/^www\./, "");
  for (const ai of AI_INFRA_DOMAINS) {
    if (d === ai || d.endsWith(`.${ai}`)) return true;
  }
  return false;
}

function extractDomainWords(domain: string): string[] {
  const base = domain.toLowerCase().replace(/^www\./, "").replace(/\.\w+(\.\w+)?$/, "");
  return base.split(/[-_.]/).filter(w => w.length > 0);
}

function extractNameTokens(name: string): string[] {
  return name.toLowerCase()
    .replace(/['']/g, "")
    .split(/[\s\-_&,]+/)
    .filter(w => w.length > 2 && !["the", "and", "for", "inc", "llc", "ltd", "pvt", "group", "services", "healthcare", "health", "medical", "care", "home", "clinic", "hospital", "center", "centre"].includes(w));
}

function extractCoreName(name: string): string {
  return name.toLowerCase()
    .replace(/['']/g, "")
    .split(/[\s\-_&,]+/)
    .filter(w => w.length > 2 && !["the", "and", "for", "inc", "llc", "ltd", "pvt", "group", "services"].includes(w))
    .slice(0, 2)
    .join("");
}

function buildAcronym(name: string): string {
  const words = name.toLowerCase()
    .replace(/[''–—\-]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 1 && !["the", "and", "of", "for", "in", "at", "by"].includes(w));
  if (words.length < 2) return "";
  return words.map(w => w[0]).join("");
}

export function isDomainOwnedByEntity(domain: string, entityName: string): boolean {
  const d = domain.toLowerCase().replace(/^www\./, "");
  const domBase = d.replace(/\.\w+(\.\w+)?$/, "");

  const nameNoSpaces = entityName.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (domBase.includes(nameNoSpaces) || nameNoSpaces.includes(domBase)) {
    return true;
  }

  const coreName = extractCoreName(entityName);
  if (coreName.length >= 3 && (domBase.includes(coreName) || coreName.includes(domBase))) {
    return true;
  }

  const acronym = buildAcronym(entityName);
  if (acronym.length >= 2 && domBase.startsWith(acronym)) {
    return true;
  }

  const nameTokens = extractNameTokens(entityName);
  const domWords = extractDomainWords(domain);

  if (nameTokens.length > 0 && domWords.length > 0) {
    const matchCount = nameTokens.filter(t => domWords.some(dw => dw.includes(t) || t.includes(dw))).length;
    if (matchCount >= Math.max(1, Math.ceil(nameTokens.length * 0.6))) {
      return true;
    }
  }

  return false;
}

export function classifyTier(domain: string, _competitorName?: string, allCompetitorNames?: string[]): TierLabel {
  const d = domain.toLowerCase().replace(/^www\./, "");

  if (_competitorName && isDomainOwnedByEntity(d, _competitorName)) {
    return "brand_owned";
  }

  if (T1_DOMAINS.has(d)) return "T1";
  if (T2_DOMAINS.has(d)) return "T2";

  for (const t1 of T1_DOMAINS) {
    if (d.endsWith(`.${t1}`)) return "T1";
  }
  for (const t2 of T2_DOMAINS) {
    if (d.endsWith(`.${t2}`)) return "T2";
  }

  if (/\.gov(\.[a-z]{2})?$/.test(d) || d.endsWith(".edu") || d.endsWith(".org")) return "T1";

  if (allCompetitorNames && allCompetitorNames.length > 0) {
    for (const compName of allCompetitorNames) {
      if (isDomainOwnedByEntity(d, compName)) {
        return "T4";
      }
    }
  }

  return "T3";
}

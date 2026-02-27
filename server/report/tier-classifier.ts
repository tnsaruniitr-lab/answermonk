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

export function classifyTier(domain: string, _competitorName?: string): "T1" | "T2" | "brand_owned" | "T3" {
  const d = domain.toLowerCase().replace(/^www\./, "");

  if (_competitorName) {
    const compLC = _competitorName.toLowerCase().replace(/\s+/g, "");
    if (d.includes(compLC) || compLC.includes(d.replace(/\.\w+$/, ""))) {
      return "brand_owned";
    }
  }

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

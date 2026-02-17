import type { PersonaType, BudgetTier } from "./types";

export const MARKETING_CHANNELS: string[] = [
  "SEO",
  "Local SEO",
  "Google Ads/PPC",
  "Bing Ads",
  "YouTube Ads",
  "Meta Ads",
  "TikTok Ads",
  "LinkedIn Ads",
  "Pinterest Ads",
  "Snapchat Ads",
  "X (Twitter) Ads",
  "Social Media Management",
  "Influencer Marketing",
  "Community Management",
  "Content Marketing",
  "Blog Writing",
  "Video Marketing",
  "Podcast Marketing",
  "Email Marketing",
  "SMS Marketing",
  "WhatsApp Marketing",
  "PR",
  "Affiliate Marketing",
  "Programmatic/Display",
  "Conversion Rate Optimization",
  "Reputation Management",
  "Branding & Design",
];

export const AUTOMATION_SERVICES: string[] = [
  "lead enrichment",
  "CRM automation",
  "outbound sequences",
  "pipeline management",
  "data scraping",
  "lead scoring",
  "email automation",
  "workflow automation",
  "sales prospecting",
  "contact enrichment",
  "meeting scheduling",
  "follow-up automation",
  "lead routing",
  "deal tracking",
  "revenue forecasting",
  "customer onboarding automation",
  "churn prediction",
  "proposal automation",
  "contract management",
  "invoice automation",
  "reporting dashboards",
  "data sync across tools",
  "lead list building",
  "cold email campaigns",
  "LinkedIn outreach",
  "multi-channel sequences",
  "intent signal tracking",
  "account-based marketing",
  "sales enablement",
  "territory management",
  "commission tracking",
  "call recording analysis",
  "chatbot setup",
  "helpdesk automation",
  "ticket routing",
  "customer feedback loops",
  "NPS automation",
  "renewal management",
  "upsell automation",
  "partner management",
  "referral tracking",
  "document automation",
  "e-signature workflows",
  "inventory sync",
  "order management",
  "shipping automation",
  "social selling automation",
  "webinar follow-up",
  "event-triggered workflows",
  "API integrations",
  "Clay automation",
];

export const AUTOMATION_KNOWN_TOOLS: string[] = [
  "Salesforce", "HubSpot", "Pipedrive", "Zoho CRM", "Freshsales", "Close",
  "Copper", "Monday Sales CRM", "Microsoft Dynamics 365", "Apollo", "Outreach",
  "Salesloft", "Lemlist", "Instantly", "Smartlead", "Woodpecker", "Reply.io",
  "Mailshake", "Clay", "Clearbit", "ZoomInfo", "Lusha", "RocketReach",
  "Cognism", "LeadIQ", "Phantombuster", "BuiltWith", "Zapier", "Make", "n8n",
  "Tray.io", "Workato", "Power Automate", "Activepieces", "Marketo", "Pardot",
  "ActiveCampaign", "Mailchimp", "Brevo", "Klaviyo", "Customer.io", "Drip",
  "Airtable", "Notion", "Monday.com", "ClickUp", "Asana", "Smartsheet",
  "Slack", "Intercom", "Drift", "Zendesk", "Freshdesk", "Gong", "Chorus",
  "Clari", "People.ai", "Bardeen", "La Growth Machine", "Relay", "Loom",
  "Calendly", "Chili Piper", "DocuSign", "PandaDoc", "Proposify",
  "Highspot", "Seismic", "Vidyard", "Bombora", "6sense", "Demandbase",
  "Seamless.ai", "Kaspr", "Surfe", "Mixmax", "Yesware", "Groove",
  "Freshworks CRM", "Nutshell", "Keap", "Insightly",
];

export const MARKETING_VERTICALS: string[] = [
  "law firms",
  "dentists",
  "medical clinics",
  "real estate agents",
  "restaurants",
  "gyms",
  "home services",
  "B2B SaaS",
  "ecommerce",
  "accountants",
  "cosmetic clinics",
  "interior designers",
  "coaches",
  "recruitment agencies",
  "luxury retail",
  "automotive dealers",
  "insurance agencies",
  "financial advisors",
  "veterinary clinics",
  "wedding planners",
  "construction companies",
  "travel agencies",
  "hotels",
  "nonprofits",
  "education",
  "startups",
  "healthcare",
  "logistics",
  "pet services",
  "photographers",
  "F&B",
];

export const AUTOMATION_VERTICALS: string[] = [
  "recruiters",
  "founders",
  "agencies",
  "sales teams",
  "ops managers",
  "real estate teams",
  "ecommerce operators",
  "revenue operations",
  "customer success teams",
  "marketing teams",
  "HR departments",
  "finance teams",
  "legal teams",
  "product managers",
  "growth teams",
  "demand gen teams",
  "SDR/BDR teams",
  "account executives",
  "consultants",
  "freelancers",
];

export const BUDGET_ADJECTIVES: Record<PersonaType, Record<BudgetTier, string[]>> = {
  marketing_agency: {
    budget: ["affordable", "low-cost", "budget-friendly"],
    mid: ["reasonably priced", "good value", "well-priced"],
    premium: ["premium", "high-end", "top-tier"],
  },
  automation_consultant: {
    budget: ["freelancer-friendly", "startup-budget", "affordable"],
    mid: ["experienced", "good value", "mid-range"],
    premium: ["premium", "senior", "expert-level"],
  },
};

export const ALIAS_MAP: Record<string, string> = {
  "cly": "Clay",
  "clay.com": "Clay",
  "clai": "Clay",
  "hub spot": "HubSpot",
  "hubspot crm": "HubSpot",
  "fb ads": "Meta Ads",
  "facebook ads": "Meta Ads",
  "ig ads": "Meta Ads",
  "instagram ads": "Meta Ads",
  "meta": "Meta Ads",
  "g ads": "Google Ads/PPC",
  "google ads": "Google Ads/PPC",
  "adwords": "Google Ads/PPC",
  "ppc": "Google Ads/PPC",
  "google ppc": "Google Ads/PPC",
  "bing": "Bing Ads",
  "bing ppc": "Bing Ads",
  "linkedin": "LinkedIn Ads",
  "linkedin ads": "LinkedIn Ads",
  "tiktok": "TikTok Ads",
  "tik tok": "TikTok Ads",
  "pinterest": "Pinterest Ads",
  "snapchat": "Snapchat Ads",
  "twitter ads": "X (Twitter) Ads",
  "twitter": "X (Twitter) Ads",
  "x ads": "X (Twitter) Ads",
  "youtube": "YouTube Ads",
  "yt ads": "YouTube Ads",
  "integromat": "Make",
  "make.com": "Make",
  "zap": "Zapier",
  "zapier.com": "Zapier",
  "active campaign": "ActiveCampaign",
  "activecampaign": "ActiveCampaign",
  "send in blue": "Brevo",
  "sendinblue": "Brevo",
  "mail chimp": "Mailchimp",
  "dynamics": "Microsoft Dynamics 365",
  "dynamics 365": "Microsoft Dynamics 365",
  "d365": "Microsoft Dynamics 365",
  "ms dynamics": "Microsoft Dynamics 365",
  "power automate": "Power Automate",
  "ms power automate": "Power Automate",
  "sales force": "Salesforce",
  "sfdc": "Salesforce",
  "sf": "Salesforce",
  "pipe drive": "Pipedrive",
  "zoho": "Zoho CRM",
  "apollo.io": "Apollo",
  "lemlist.com": "Lemlist",
  "instantly.ai": "Instantly",
  "smart lead": "Smartlead",
  "smartlead.ai": "Smartlead",
  "rocket reach": "RocketReach",
  "zoom info": "ZoomInfo",
  "built with": "BuiltWith",
  "phantom buster": "Phantombuster",
  "clear bit": "Clearbit",
  "lead iq": "LeadIQ",
  "customer io": "Customer.io",
  "customerio": "Customer.io",
  "click up": "ClickUp",
  "air table": "Airtable",
  "smart sheet": "Smartsheet",
  "fresh desk": "Freshdesk",
  "fresh sales": "Freshsales",
  "zen desk": "Zendesk",
  "reply io": "Reply.io",
  "mail shake": "Mailshake",
  "seo": "SEO",
  "local seo": "Local SEO",
  "content marketing": "Content Marketing",
  "email marketing": "Email Marketing",
  "sms marketing": "SMS Marketing",
  "whatsapp marketing": "WhatsApp Marketing",
  "influencer marketing": "Influencer Marketing",
  "social media": "Social Media Management",
  "smm": "Social Media Management",
  "affiliate marketing": "Affiliate Marketing",
  "cro": "Conversion Rate Optimization",
  "pr": "PR",
  "branding": "Branding & Design",
  "reputation management": "Reputation Management",
  "video marketing": "Video Marketing",
  "blog writing": "Blog Writing",
  "podcast marketing": "Podcast Marketing",
  "community management": "Community Management",
  "programmatic": "Programmatic/Display",
  "display ads": "Programmatic/Display",
};

export function normalizeKey(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function toDisplayFallback(s: string): string {
  return s
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function dedupeByKey<T extends { key: string }>(terms: T[]): T[] {
  const seen = new Set<string>();
  return terms.filter((t) => {
    const k = normalizeKey(t.key);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function resolveModifier(
  raw: string,
  personaType: PersonaType
): { display: string; verified: boolean } {
  const key = normalizeKey(raw);
  const aliased = ALIAS_MAP[key];

  if (aliased) {
    const knownList = personaType === "marketing_agency" ? MARKETING_CHANNELS : AUTOMATION_KNOWN_TOOLS;
    const isKnown = knownList.some((p) => normalizeKey(p) === normalizeKey(aliased));
    return { display: aliased, verified: isKnown };
  }

  const knownList = personaType === "marketing_agency" ? MARKETING_CHANNELS : AUTOMATION_KNOWN_TOOLS;
  const exactMatch = knownList.find((p) => normalizeKey(p) === key);
  if (exactMatch) {
    return { display: exactMatch, verified: true };
  }

  return { display: toDisplayFallback(raw), verified: false };
}

const SERVICE_VERB_PREFIXES: Record<PersonaType, string[]> = {
  marketing_agency: ["run", "manage", "handle"],
  automation_consultant: ["set up", "build", "automate"],
};

export function ensureServiceVerb(service: string, personaType: PersonaType, rngPick?: <T>(arr: T[]) => T): string {
  const lower = service.trim().toLowerCase();
  const verbPatterns = /^(set up|build|automate|run|manage|execute|create|design|develop|implement|optimize|handle|deliver|provide|offer|do|perform|launch|drive|grow|scale|improve)\b/i;
  if (verbPatterns.test(lower)) {
    return service.trim();
  }
  const verbs = SERVICE_VERB_PREFIXES[personaType];
  const verb = rngPick ? rngPick(verbs) : verbs[0];
  return `${verb} ${service.trim()}`;
}

export function getPresetsForPersona(personaType: PersonaType) {
  if (personaType === "marketing_agency") {
    return {
      services: MARKETING_CHANNELS,
      verticals: MARKETING_VERTICALS,
    };
  }
  return {
    services: AUTOMATION_SERVICES,
    verticals: AUTOMATION_VERTICALS,
  };
}

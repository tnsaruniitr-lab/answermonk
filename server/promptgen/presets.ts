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
  "Performance Marketing",
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
  "invoice management",
  "accounting automation",
  "expense management",
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
  "staffing companies",
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
  "enterprise customers",
  "banks",
  "financial services",
  "beauty",
  "retail",
  "beauty retail",
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

export const CORPORATE_CARDS_SERVICES: string[] = [
  "corporate credit cards",
  "virtual cards",
  "expense cards",
  "team spending cards",
  "prepaid business cards",
  "travel cards",
  "procurement cards",
  "subscription management cards",
  "departmental budgets",
  "real-time spend tracking",
  "card issuance",
  "spend controls",
  "receipt matching",
  "approval workflows",
  "multi-currency cards",
  "rewards programs",
  "cashback programs",
  "credit line management",
  "employee card programs",
  "vendor payment cards",
  "invoice management",
  "accounting automation",
  "expense management",
];

export const CORPORATE_CARDS_VERTICALS: string[] = [
  "startups",
  "SMBs",
  "enterprises",
  "tech companies",
  "ecommerce businesses",
  "agencies",
  "consulting firms",
  "SaaS companies",
  "fintech companies",
  "remote teams",
  "construction companies",
  "healthcare organizations",
  "nonprofits",
  "law firms",
  "accounting firms",
  "logistics companies",
  "real estate firms",
  "manufacturing companies",
  "retail businesses",
  "hospitality companies",
];

export const CORPORATE_CARDS_MODIFIERS: string[] = [
  "Brex", "Ramp", "Divvy", "Airbase", "Navan", "SAP Concur", "Coupa",
  "Stripe", "Marqeta", "Lithic", "Extend", "Center", "Emburse",
  "US Bank", "JPMorgan", "American Express", "Visa Commercial", "Mastercard",
  "Mercury", "Relay", "Greenlight", "Wex", "Comdata", "Bill.com",
];

export const EXPENSE_MANAGEMENT_SERVICES: string[] = [
  "expense reporting",
  "receipt scanning",
  "mileage tracking",
  "per diem management",
  "travel expense management",
  "policy compliance",
  "automated approvals",
  "reimbursement processing",
  "expense categorization",
  "budget tracking",
  "spend analytics",
  "invoice management",
  "vendor payments",
  "accounts payable automation",
  "tax compliance",
  "audit trails",
  "multi-entity management",
  "project expense tracking",
  "client billing",
  "ERP integration",
  "accounting automation",
  "expense management",
];

export const EXPENSE_MANAGEMENT_VERTICALS: string[] = [
  "startups",
  "SMBs",
  "enterprises",
  "tech companies",
  "consulting firms",
  "professional services",
  "accounting firms",
  "law firms",
  "healthcare organizations",
  "construction companies",
  "nonprofits",
  "government agencies",
  "educational institutions",
  "manufacturing companies",
  "logistics companies",
  "real estate firms",
  "agencies",
  "remote teams",
  "field service companies",
  "retail chains",
];

export const EXPENSE_MANAGEMENT_MODIFIERS: string[] = [
  "SAP Concur", "Expensify", "Brex", "Ramp", "Navan", "Emburse",
  "Divvy", "Airbase", "Center", "Fyle", "Zoho Expense", "Certify",
  "Abacus", "Spendesk", "Pleo", "Soldo", "Payhawk", "Yokoy",
  "Coupa", "AppZen", "Oversight", "Chrome River", "Mesh Payments",
  "QuickBooks", "Xero", "NetSuite", "Sage Intacct",
];

export const ACCOUNTING_AUTOMATION_SERVICES: string[] = [
  "bookkeeping automation",
  "bank reconciliation",
  "accounts payable",
  "accounts receivable",
  "general ledger management",
  "financial reporting",
  "tax preparation",
  "payroll processing",
  "multi-entity consolidation",
  "revenue recognition",
  "fixed asset management",
  "budgeting & forecasting",
  "cash flow management",
  "journal entry automation",
  "intercompany transactions",
  "audit preparation",
  "compliance management",
  "chart of accounts setup",
  "financial close automation",
  "expense categorization",
  "vendor management",
  "client accounting",
];

export const ACCOUNTING_AUTOMATION_VERTICALS: string[] = [
  "startups",
  "SMBs",
  "enterprises",
  "accounting firms",
  "bookkeeping firms",
  "CFO services",
  "tax firms",
  "professional services",
  "SaaS companies",
  "ecommerce businesses",
  "real estate firms",
  "construction companies",
  "nonprofits",
  "healthcare organizations",
  "law firms",
  "agencies",
  "manufacturing companies",
  "retail businesses",
  "franchise businesses",
  "remote teams",
];

export const ACCOUNTING_AUTOMATION_MODIFIERS: string[] = [
  "QuickBooks", "Xero", "NetSuite", "Sage Intacct", "FreshBooks",
  "Wave", "Zoho Books", "MYOB", "Kashoo", "ZipBooks",
  "Bench", "Pilot", "Botkeeper", "Vic.ai", "BlackLine",
  "FloQast", "Trintech", "Dext", "Hubdoc", "AutoEntry",
  "Bill.com", "Tipalti", "Stampli", "Ramp", "Brex",
];

export const INVOICE_MANAGEMENT_SERVICES: string[] = [
  "invoice generation",
  "invoice tracking",
  "automated invoicing",
  "recurring invoices",
  "invoice approval workflows",
  "payment collection",
  "overdue reminders",
  "multi-currency invoicing",
  "invoice templates",
  "e-invoicing compliance",
  "credit note management",
  "purchase order matching",
  "vendor invoice processing",
  "invoice scanning & OCR",
  "payment gateway integration",
  "dunning management",
  "subscription billing",
  "time-based billing",
  "project billing",
  "client portal",
  "invoice analytics",
  "batch invoicing",
];

export const INVOICE_MANAGEMENT_VERTICALS: string[] = [
  "freelancers",
  "SMBs",
  "enterprises",
  "agencies",
  "consulting firms",
  "accounting firms",
  "law firms",
  "construction companies",
  "professional services",
  "SaaS companies",
  "ecommerce businesses",
  "healthcare providers",
  "IT services",
  "creative studios",
  "engineering firms",
  "logistics companies",
  "manufacturing companies",
  "real estate firms",
  "field service companies",
  "staffing agencies",
];

export const INVOICE_MANAGEMENT_MODIFIERS: string[] = [
  "FreshBooks", "QuickBooks", "Xero", "Zoho Invoice", "Wave",
  "Bill.com", "Tipalti", "Stampli", "Coupa", "SAP Concur",
  "Stripe Invoicing", "Square Invoices", "PayPal Invoicing", "HoneyBook", "Bonsai",
  "Harvest", "Invoicely", "Invoice Ninja", "Hiveage", "AND.CO",
  "Melio", "Payoneer", "Wise Business", "Chargebee", "Recurly",
];

export const RESTAURANT_OFFERINGS: string[] = [
  "fine dining",
  "casual dining",
  "fast casual",
  "QSR / quick service",
  "cloud kitchen",
  "café / coffee shop",
  "bakery",
  "pizzeria",
  "steakhouse",
  "sushi bar",
  "seafood restaurant",
  "brunch spot",
  "rooftop dining",
  "family restaurant",
  "buffet",
  "food truck",
  "pop-up restaurant",
  "catering service",
  "private dining",
  "bar & grill",
  "gastropub",
  "wine bar",
  "cocktail lounge",
  "tasting menu",
  "farm-to-table",
  "vegan / plant-based",
  "organic restaurant",
  "halal restaurant",
  "kosher restaurant",
  "gluten-free friendly",
];

export const RESTAURANT_VERTICALS: string[] = [
  "Italian cuisine",
  "Japanese cuisine",
  "Chinese cuisine",
  "Mexican cuisine",
  "Indian cuisine",
  "Thai cuisine",
  "French cuisine",
  "Mediterranean cuisine",
  "Middle Eastern cuisine",
  "Korean cuisine",
  "Vietnamese cuisine",
  "Greek cuisine",
  "Turkish cuisine",
  "Lebanese cuisine",
  "American cuisine",
  "Spanish cuisine",
  "Peruvian cuisine",
  "Ethiopian cuisine",
  "Brazilian cuisine",
  "Filipino cuisine",
  "fusion cuisine",
  "burgers",
  "pizza",
  "seafood",
  "BBQ / smokehouse",
  "vegetarian",
  "breakfast & brunch",
  "desserts & sweets",
  "healthy / wellness",
  "comfort food",
  "street food",
  "international",
];

export const RESTAURANT_MODIFIERS: string[] = [
  "Yelp", "Google Maps", "TripAdvisor", "OpenTable", "Resy",
  "DoorDash", "Uber Eats", "Grubhub", "Deliveroo", "Talabat",
  "Zomato", "TheFork", "Toast POS", "Square for Restaurants",
  "Lightspeed", "Clover", "SevenRooms", "Olo", "ChowNow",
  "MenuDrive", "BentoBox", "Popmenu", "TouchBistro", "Upserve",
];

export const CONSTRUCTION_MANAGEMENT_SERVICES: string[] = [
  "project management",
  "construction scheduling",
  "BOQ management",
  "change order management",
  "daily progress reporting",
  "snag management",
  "procurement management",
  "vendor order management",
  "material management",
  "site survey",
  "design management",
  "pre-sales CRM",
  "bill of materials",
  "installed progress tracking",
  "site expense tracking",
  "purchase requests",
  "rate contracts",
  "invoice management",
  "approval workflows",
  "analytics & dashboards",
  "task management",
  "element libraries",
  "third-party collaboration",
  "ERP integration",
];

export const CONSTRUCTION_MANAGEMENT_VERTICALS: string[] = [
  "Interior design firms",
  "General contractors",
  "Construction companies",
  "Real estate developers",
  "Fit-out contractors",
  "Architecture firms",
  "MEP contractors",
  "Civil engineering firms",
  "Renovation companies",
  "Commercial builders",
  "Residential builders",
  "Infrastructure companies",
  "Turnkey project firms",
  "Design-build firms",
  "Facility management companies",
];

export const CONSTRUCTION_MANAGEMENT_MODIFIERS: string[] = [
  "Procore", "Buildertrend", "PlanGrid", "Fieldwire", "Autodesk Construction Cloud",
  "CoConstruct", "BuilderStorm", "Aconex", "Oracle Primavera", "Microsoft Project",
  "Smartsheet", "Monday.com", "Asana", "ClickUp", "Zoho Projects",
  "SAP S/4HANA", "Tally", "QuickBooks", "Xero", "Sage",
  "RDash", "Powerplay", "Infurnia", "SiteSupervisor", "Katerra",
];

export const HEALTHCARE_VERTICALS: string[] = [
  "elderly care", "post-surgery recovery", "chronic disease management",
  "physiotherapy", "nursing care", "palliative care", "pediatric care",
  "maternity care", "mental health", "rehabilitation",
  "diabetes management", "cardiac care", "respiratory care",
];

export const HEALTHCARE_SERVICES: string[] = [
  "home nursing", "doctor visits", "physiotherapy", "lab tests",
  "IV drip therapy", "wound care", "medication management",
  "health checkups", "vaccination", "telehealth",
];

export const HEALTHCARE_MODIFIERS: string[] = [];

export const WEIGHT_LOSS_VERTICALS: string[] = [
  "women", "men", "postpartum", "seniors", "teens",
  "diabetes patients", "PCOS", "thyroid conditions",
  "busy professionals", "brides-to-be",
];

export const WEIGHT_LOSS_SERVICES: string[] = [
  "diet plans", "meal delivery", "personal training", "nutrition coaching",
  "online programs", "group coaching", "supplements", "clinical weight loss",
];

export const WEIGHT_LOSS_MODIFIERS: string[] = [];

export const BLOOD_TEST_VERTICALS: string[] = [
  "corporate wellness", "elderly", "chronic patients", "athletes",
  "pregnant women", "families", "annual checkups", "pre-employment",
];

export const BLOOD_TEST_SERVICES: string[] = [
  "CBC", "lipid panel", "thyroid panel", "vitamin deficiency",
  "diabetes screening", "liver function", "kidney function",
  "allergy testing", "hormone panel", "full body checkup",
];

export const BLOOD_TEST_MODIFIERS: string[] = [];

export const REAL_ESTATE_SERVICES: string[] = [
  "an off-plan luxury apartment",
  "a luxury villa",
  "a penthouse",
  "a townhouse",
  "an independent house",
  "a studio apartment",
  "a duplex",
  "a beachfront property",
  "a waterfront property",
  "a golf community property",
  "a branded residence",
  "a serviced apartment",
  "a holiday home",
  "a freehold property",
  "a leasehold property",
  "a ready-to-move property",
  "an off-plan property",
  "a rental yield investment property",
  "commercial real estate",
  "an office space",
  "a retail space",
  "a warehouse",
  "a plot of land",
  "a mixed-use property",
];

export const REAL_ESTATE_VERTICALS: string[] = [
  "First-Time Buyers",
  "Investors",
  "Expats / Relocators",
  "High-Net-Worth Individuals",
  "Corporate Buyers",
  "Families",
  "Retirees",
  "NRIs (Non-Resident Indians)",
  "Developers",
  "Landlords",
  "Short-Term Rental Investors",
  "Portfolio Investors",
  "End Users",
  "Foreign Nationals",
];

export const REAL_ESTATE_MODIFIERS: string[] = [
  "RERA registered",
  "DLD approved",
  "DMCC free zone",
  "high ROI",
  "payment plan available",
  "post-handover payment",
  "golden visa eligible",
  "tenant occupied",
  "brand new",
  "resale",
  "off-market",
  "distressed sale",
  "below market value",
  "high floor",
  "sea view",
  "city view",
  "fully furnished",
  "semi-furnished",
  "smart home",
  "gated community",
];

export const DECISION_MAKERS: string[] = [
  "Founder",
  "Co-Founder",
  "Owner",
  "CEO",
  "COO",
  "CFO",
  "CTO",
  "CMO",
  "CRO",
  "Managing Director",
  "Director",
  "General Manager",
  "VP Sales",
  "VP Marketing",
  "VP Engineering",
  "VP Operations",
  "VP Growth",
  "VP Revenue",
  "VP Business Development",
  "VP Product",
  "Head of Marketing",
  "Head of Sales",
  "Head of Operations",
  "Head of Growth",
  "Head of Digital",
  "Head of Content",
  "Head of SEO",
  "Head of Paid Media",
  "Head of Demand Gen",
  "Head of Revenue Operations",
  "Head of Partnerships",
  "Head of Strategy",
  "Head of Product",
  "Head of Engineering",
  "Head of HR",
  "Head of People",
  "Head of Finance",
  "Head of Customer Success",
  "Marketing Director",
  "Sales Director",
  "Operations Director",
  "Creative Director",
  "Digital Director",
  "Marketing Manager",
  "Brand Manager",
  "Product Manager",
  "Project Manager",
  "Operations Manager",
  "Account Manager",
  "Business Development Manager",
  "Growth Manager",
  "Community Manager",
  "Content Manager",
  "SEO Manager",
  "PPC Manager",
  "Social Media Manager",
  "Email Marketing Manager",
  "Performance Marketing Manager",
  "Revenue Operations Manager",
  "Customer Success Manager",
  "HR Manager",
  "Procurement Manager",
  "Partner",
  "Principal",
  "Practice Lead",
  "Team Lead",
  "Senior Consultant",
  "Strategist",
  "Advisor",
  "Board Member",
  "Investor",
  "Solopreneur",
  "Freelancer",
];

export const BUDGET_ADJECTIVES: Record<PersonaType, Record<BudgetTier, string[]>> = {
  marketing_agency: {
    budget: ["affordable", "low-cost", "budget-friendly"],
    mid: ["reasonably priced", "good value", "well-priced"],
    premium: ["premium", "high-end", "top-tier"],
  },
  seo_agency: {
    budget: ["affordable", "low-cost", "budget-friendly"],
    mid: ["reasonably priced", "good value", "well-priced"],
    premium: ["premium", "high-end", "top-tier"],
  },
  performance_marketing_agency: {
    budget: ["affordable", "low-cost", "budget-friendly"],
    mid: ["reasonably priced", "good value", "well-priced"],
    premium: ["premium", "high-end", "top-tier"],
  },
  content_marketing_agency: {
    budget: ["affordable", "low-cost", "budget-friendly"],
    mid: ["reasonably priced", "good value", "well-priced"],
    premium: ["premium", "high-end", "top-tier"],
  },
  social_media_agency: {
    budget: ["affordable", "low-cost", "budget-friendly"],
    mid: ["reasonably priced", "good value", "well-priced"],
    premium: ["premium", "high-end", "top-tier"],
  },
  web_design_agency: {
    budget: ["affordable", "low-cost", "budget-friendly"],
    mid: ["reasonably priced", "good value", "well-priced"],
    premium: ["premium", "high-end", "top-tier"],
  },
  pr_agency: {
    budget: ["affordable", "low-cost", "budget-friendly"],
    mid: ["reasonably priced", "good value", "well-priced"],
    premium: ["premium", "high-end", "top-tier"],
  },
  branding_agency: {
    budget: ["affordable", "low-cost", "budget-friendly"],
    mid: ["reasonably priced", "good value", "well-priced"],
    premium: ["premium", "high-end", "top-tier"],
  },
  digital_marketing_agency: {
    budget: ["affordable", "low-cost", "budget-friendly"],
    mid: ["reasonably priced", "good value", "well-priced"],
    premium: ["premium", "high-end", "top-tier"],
  },
  automation_consultant: {
    budget: ["freelancer-friendly", "startup-budget", "affordable"],
    mid: ["experienced", "good value", "mid-range"],
    premium: ["premium", "senior", "expert-level"],
  },
  corporate_cards_provider: {
    budget: ["affordable", "low-cost", "startup-friendly"],
    mid: ["competitive", "flexible", "scalable"],
    premium: ["premium", "enterprise-grade", "full-featured"],
  },
  expense_management_software: {
    budget: ["affordable", "budget-friendly", "cost-effective"],
    mid: ["mid-market", "scalable", "feature-rich"],
    premium: ["enterprise", "premium", "comprehensive"],
  },
  accounting_automation: {
    budget: ["affordable", "budget-friendly", "low-cost"],
    mid: ["mid-market", "scalable", "feature-rich"],
    premium: ["enterprise", "premium", "comprehensive"],
  },
  invoice_management: {
    budget: ["affordable", "budget-friendly", "free-tier"],
    mid: ["mid-market", "scalable", "professional"],
    premium: ["enterprise", "premium", "full-featured"],
  },
  restaurant: {
    budget: ["affordable", "budget-friendly", "cheap eats"],
    mid: ["mid-range", "good value", "reasonably priced"],
    premium: ["upscale", "fine dining", "luxury"],
  },
  construction_management: {
    budget: ["affordable", "budget-friendly", "cost-effective"],
    mid: ["mid-market", "scalable", "feature-rich"],
    premium: ["enterprise", "premium", "comprehensive"],
  },
  in_home_healthcare: {
    budget: ["affordable", "budget-friendly", "cost-effective"],
    mid: ["reliable", "trusted", "well-reviewed"],
    premium: ["premium", "luxury", "concierge"],
  },
  at_home_healthcare: {
    budget: ["affordable", "budget-friendly", "cost-effective"],
    mid: ["reliable", "trusted", "well-reviewed"],
    premium: ["premium", "luxury", "concierge"],
  },
  weight_loss_help: {
    budget: ["affordable", "budget-friendly", "cost-effective"],
    mid: ["effective", "trusted", "well-reviewed"],
    premium: ["premium", "clinical", "medically-supervised"],
  },
  in_home_blood_tests: {
    budget: ["affordable", "budget-friendly", "low-cost"],
    mid: ["reliable", "accredited", "convenient"],
    premium: ["premium", "comprehensive", "concierge"],
  },
  at_home_blood_tests: {
    budget: ["affordable", "budget-friendly", "low-cost"],
    mid: ["reliable", "accredited", "convenient"],
    premium: ["premium", "comprehensive", "concierge"],
  },
  real_estate_agency: {
    budget: ["affordable", "budget-friendly", "value"],
    mid: ["reputable", "established", "trusted"],
    premium: ["luxury", "premium", "exclusive"],
  },
  real_estate_broker: {
    budget: ["affordable", "budget-friendly", "value"],
    mid: ["reputable", "experienced", "trusted"],
    premium: ["luxury", "premium", "top-tier"],
  },
  property_dealer: {
    budget: ["affordable", "budget-friendly", "value"],
    mid: ["reputable", "reliable", "established"],
    premium: ["premium", "exclusive", "high-end"],
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

function getModifierKnownList(personaType: PersonaType): string[] {
  switch (personaType) {
    case "marketing_agency":
    case "seo_agency":
    case "performance_marketing_agency":
    case "content_marketing_agency":
    case "social_media_agency":
    case "web_design_agency":
    case "pr_agency":
    case "branding_agency":
    case "digital_marketing_agency": return MARKETING_CHANNELS;
    case "corporate_cards_provider": return CORPORATE_CARDS_MODIFIERS;
    case "expense_management_software": return EXPENSE_MANAGEMENT_MODIFIERS;
    case "accounting_automation": return ACCOUNTING_AUTOMATION_MODIFIERS;
    case "invoice_management": return INVOICE_MANAGEMENT_MODIFIERS;
    case "restaurant": return RESTAURANT_MODIFIERS;
    case "construction_management": return CONSTRUCTION_MANAGEMENT_MODIFIERS;
    case "in_home_healthcare":
    case "at_home_healthcare": return HEALTHCARE_MODIFIERS;
    case "weight_loss_help": return WEIGHT_LOSS_MODIFIERS;
    case "in_home_blood_tests":
    case "at_home_blood_tests": return BLOOD_TEST_MODIFIERS;
    case "real_estate_agency":
    case "real_estate_broker":
    case "property_dealer": return REAL_ESTATE_MODIFIERS;
    default: return AUTOMATION_KNOWN_TOOLS;
  }
}

export function resolveModifier(
  raw: string,
  personaType: PersonaType
): { display: string; verified: boolean } {
  const key = normalizeKey(raw);
  const aliased = ALIAS_MAP[key];

  if (aliased) {
    const knownList = getModifierKnownList(personaType);
    const isKnown = knownList.some((p) => normalizeKey(p) === normalizeKey(aliased));
    return { display: aliased, verified: isKnown };
  }

  const knownList = getModifierKnownList(personaType);
  const exactMatch = knownList.find((p) => normalizeKey(p) === key);
  if (exactMatch) {
    return { display: exactMatch, verified: true };
  }

  return { display: toDisplayFallback(raw), verified: false };
}

const SERVICE_VERB_PREFIXES: Record<PersonaType, string[]> = {
  marketing_agency: ["run", "manage", "handle"],
  seo_agency: ["run", "manage", "handle"],
  performance_marketing_agency: ["run", "manage", "handle"],
  content_marketing_agency: ["create", "produce", "manage"],
  social_media_agency: ["run", "manage", "handle"],
  web_design_agency: ["design", "build", "create"],
  pr_agency: ["run", "manage", "handle"],
  branding_agency: ["create", "develop", "design"],
  digital_marketing_agency: ["run", "manage", "handle"],
  automation_consultant: ["set up", "build", "automate"],
  corporate_cards_provider: ["provide", "offer", "manage"],
  expense_management_software: ["handle", "automate", "manage"],
  accounting_automation: ["automate", "streamline", "manage"],
  invoice_management: ["automate", "handle", "manage"],
  restaurant: ["serve", "offer", "feature"],
  construction_management: ["provide", "manage", "handle"],
  in_home_healthcare: ["provide", "offer", "deliver"],
  at_home_healthcare: ["provide", "offer", "deliver"],
  weight_loss_help: ["provide", "offer", "deliver"],
  in_home_blood_tests: ["provide", "offer", "conduct"],
  at_home_blood_tests: ["provide", "offer", "conduct"],
  real_estate_agency: ["list", "sell", "offer"],
  real_estate_broker: ["list", "broker", "offer"],
  property_dealer: ["list", "deal", "offer"],
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

const AGENCY_PERSONAS = ["marketing_agency", "seo_agency", "performance_marketing_agency", "content_marketing_agency", "social_media_agency", "web_design_agency", "pr_agency", "branding_agency", "digital_marketing_agency"];

export const PERSONA_CATEGORY_LABELS: Record<string, string> = {
  marketing_agency: "marketing agencies or digital marketing agencies",
  seo_agency: "SEO agencies or search engine optimization agencies",
  performance_marketing_agency: "performance marketing agencies",
  content_marketing_agency: "content marketing agencies",
  social_media_agency: "social media marketing agencies",
  web_design_agency: "web design or web development agencies",
  pr_agency: "PR agencies or public relations agencies",
  branding_agency: "branding agencies",
  digital_marketing_agency: "digital marketing agencies",
  automation_consultant: "automation consultants or business automation platforms",
  corporate_cards_provider: "corporate card providers or spend management platforms",
  expense_management_software: "expense management software or platforms",
  accounting_automation: "accounting automation software or platforms",
  invoice_management: "invoice management software or platforms",
  restaurant: "restaurants, cafes, or dining establishments",
  construction_management: "construction management software or platforms",
  in_home_healthcare: "in-home healthcare providers or home health services",
  at_home_healthcare: "at-home healthcare providers or home health services",
  weight_loss_help: "weight loss clinics, programs, or services",
  in_home_blood_tests: "at-home blood testing or mobile lab services",
  at_home_blood_tests: "at-home blood testing or mobile lab services",
  real_estate_agency: "real estate agencies or property agencies",
  real_estate_broker: "real estate brokers or property brokers",
  property_dealer: "property dealers or real estate dealers",
};

export function getPresetsForPersona(personaType: PersonaType) {
  if (AGENCY_PERSONAS.includes(personaType)) {
    return {
      services: MARKETING_CHANNELS,
      verticals: MARKETING_VERTICALS,
    };
  }
  if (personaType === "corporate_cards_provider") {
    return {
      services: CORPORATE_CARDS_SERVICES,
      verticals: CORPORATE_CARDS_VERTICALS,
    };
  }
  if (personaType === "expense_management_software") {
    return {
      services: EXPENSE_MANAGEMENT_SERVICES,
      verticals: EXPENSE_MANAGEMENT_VERTICALS,
    };
  }
  if (personaType === "accounting_automation") {
    return {
      services: ACCOUNTING_AUTOMATION_SERVICES,
      verticals: ACCOUNTING_AUTOMATION_VERTICALS,
    };
  }
  if (personaType === "invoice_management") {
    return {
      services: INVOICE_MANAGEMENT_SERVICES,
      verticals: INVOICE_MANAGEMENT_VERTICALS,
    };
  }
  if (personaType === "restaurant") {
    return {
      services: RESTAURANT_OFFERINGS,
      verticals: RESTAURANT_VERTICALS,
    };
  }
  if (personaType === "construction_management") {
    return {
      services: CONSTRUCTION_MANAGEMENT_SERVICES,
      verticals: CONSTRUCTION_MANAGEMENT_VERTICALS,
    };
  }
  if (personaType === "in_home_healthcare" || personaType === "at_home_healthcare") {
    return {
      services: HEALTHCARE_SERVICES,
      verticals: HEALTHCARE_VERTICALS,
    };
  }
  if (personaType === "weight_loss_help") {
    return {
      services: WEIGHT_LOSS_SERVICES,
      verticals: WEIGHT_LOSS_VERTICALS,
    };
  }
  if (personaType === "in_home_blood_tests" || personaType === "at_home_blood_tests") {
    return {
      services: BLOOD_TEST_SERVICES,
      verticals: BLOOD_TEST_VERTICALS,
    };
  }
  if (personaType === "real_estate_agency" || personaType === "real_estate_broker" || personaType === "property_dealer") {
    return {
      services: REAL_ESTATE_SERVICES,
      verticals: REAL_ESTATE_VERTICALS,
    };
  }
  return {
    services: AUTOMATION_SERVICES,
    verticals: AUTOMATION_VERTICALS,
  };
}

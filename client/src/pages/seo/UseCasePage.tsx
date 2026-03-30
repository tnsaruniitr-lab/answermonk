import { SEOLayout, PageHero, Section, ProseP, ProseList, CTABox } from "./SEOLayout";

const CONFIG: Record<string, {
  title: string;
  description: string;
  eyebrow: string;
  headline: string;
  sub: string;
  sections: { heading: string; body?: string; bullets?: string[] }[];
}> = {
  brands: {
    title: "AI Search Visibility for Brands | AnswerMonk",
    description: "Track how your brand appears in ChatGPT, Gemini, and AI search. Benchmark competitors, find citation gaps, and improve AI recommendations for your brand.",
    eyebrow: "Use Case — Brands",
    headline: "AI search visibility for brands",
    sub: "Your customers are asking AI engines for recommendations. AnswerMonk shows where your brand appears in those answers — and what it will take to rank higher.",
    sections: [
      {
        heading: "The problem brands face",
        body: "When a prospective customer asks ChatGPT \"What is the best [your product category]?\", AI engines give a direct answer naming three to five brands. If your brand is not among them, that buyer continues their journey without ever reaching your website. Traditional analytics do not capture this — there is no referring traffic, no session, no click. The loss is invisible.",
      },
      {
        heading: "What AnswerMonk gives brand teams",
        bullets: [
          "Your brand's appearance rate across ChatGPT, Gemini, Claude, and Perplexity for every relevant query in your category",
          "A competitor leaderboard showing which brands AI currently favors and by how much",
          "Citation source analysis — which review platforms, directories, and publications drive AI mentions in your space",
          "Segment-level breakdown — visibility by service type, customer persona, and location",
          "Trend data to track whether your visibility is improving after content or PR efforts",
        ],
      },
      {
        heading: "How brand teams use the data",
        bullets: [
          "Identify which service segments have the lowest AI visibility and prioritize content investment there",
          "Find competitor citation sources and ensure your brand is listed on the same platforms",
          "Use the prompt network to understand which buyer questions your brand is missing",
          "Report AI visibility as a metric alongside traditional SEO KPIs",
          "Track the effect of PR campaigns on AI citation frequency",
        ],
      },
      {
        heading: "What changes after an audit",
        body: "The most common immediate action after an AnswerMonk audit is closing citation source gaps. Brands that appear in AI responses almost always have complete profiles on the top two or three review platforms in their category. If you are missing from those platforms — or have thin, unreviewed profiles — that is the first bottleneck to fix.",
      },
    ],
  },
  agencies: {
    title: "AI Search Visibility Audits for Agencies | AnswerMonk",
    description: "Run AI visibility audits for clients. Benchmark competitor brands in AI search, generate insight reports, and demonstrate new value beyond traditional SEO metrics.",
    eyebrow: "Use Case — Agencies",
    headline: "AI search visibility audits for agencies",
    sub: "Add AI search visibility to your client offering. Run audits, benchmark competitors, and deliver reports that traditional SEO tools cannot produce.",
    sections: [
      {
        heading: "Why agencies are adding AI visibility to their service mix",
        body: "Clients are asking about ChatGPT and AI search. They want to know whether they appear when buyers use AI to find their category. Traditional SEO reporting does not answer this — keyword rankings and organic traffic tell you nothing about AI recommendation frequency. Agencies that can answer this question have a significant pitch advantage.",
      },
      {
        heading: "What AnswerMonk gives agency teams",
        bullets: [
          "Full AI search audit for any client domain in 3–8 minutes",
          "Competitive landscape — every brand AI recommends in the client's category, ranked by appearance rate",
          "Citation source map — the third-party sites driving AI visibility in the client's space",
          "Segment-level reports by service type and customer persona",
          "Exportable data for inclusion in client reports and presentations",
        ],
      },
      {
        heading: "Client conversations the audit enables",
        bullets: [
          "\"Your brand appears in 12% of relevant AI queries. Your top competitor appears in 67%.\"",
          "\"ChatGPT recommends your brand for enterprise queries but not for SMB queries — here is why.\"",
          "\"You are missing from three of the four citation sources that drive AI recommendations in your category.\"",
          "\"After last month's PR push, your Gemini appearance rate increased from 18% to 34%.\"",
        ],
      },
      {
        heading: "Positioning the service",
        body: "The clearest positioning for agencies is \"AI search visibility audit\" — a parallel to the traditional SEO audit, but focused on AI engines. The audit becomes the basis for a new content and citation strategy, generating retainer work around building and monitoring AI presence over time.",
      },
    ],
  },
  "b2b-saas": {
    title: "AI Search Visibility for B2B SaaS Companies | AnswerMonk",
    description: "Track how ChatGPT and AI search recommend your SaaS product. See which competitors AI favors and which queries your brand is missing.",
    eyebrow: "Use Case — B2B SaaS",
    headline: "AI search visibility for B2B SaaS",
    sub: "Developers and operators are using ChatGPT to evaluate tools before visiting any vendor website. Know where your SaaS brand stands in those conversations.",
    sections: [
      {
        heading: "How B2B SaaS buyers use AI search",
        body: "The typical B2B SaaS buying journey now includes at least one AI query. Developers ask ChatGPT for the best monitoring tools, API platforms, or workflow software before opening any vendor site. Product managers ask for tool comparisons. Operators ask for recommendations by use case. The brands that appear in those answers get consideration. The brands that don't are invisible during a critical decision window.",
      },
      {
        heading: "The categories where AI visibility matters most",
        bullets: [
          "Developer tools — CLI utilities, APIs, libraries, and platforms",
          "Productivity software — project management, documentation, communication",
          "Data and analytics tools",
          "Security and compliance platforms",
          "CRM and sales tools",
          "Finance and billing software",
        ],
      },
      {
        heading: "What AnswerMonk surfaces for SaaS brands",
        bullets: [
          "Appearance rate broken down by use case — do you appear for enterprise queries but miss SMB?",
          "Competitor presence in AI — who does ChatGPT consistently recommend alongside or instead of you?",
          "Citation source gaps — G2, Capterra, Product Hunt, GitHub, and developer forums that drive AI mentions",
          "Query coverage — which buyer prompts trigger your brand vs which do not",
        ],
      },
      {
        heading: "The fastest wins for SaaS brands",
        body: "For most SaaS companies, the highest-leverage actions are: (1) ensuring complete, reviewed profiles on G2 and Capterra — AI engines cite these heavily; (2) publishing comparison pages against named alternatives — these match comparison prompts AI users make frequently; (3) creating use-case pages that match how buyers phrase their AI queries.",
      },
    ],
  },
  ecommerce: {
    title: "AI Search Visibility for Ecommerce Brands | AnswerMonk",
    description: "See how your ecommerce brand appears in ChatGPT and AI product recommendation searches. Track competitors and improve AI-driven product discovery.",
    eyebrow: "Use Case — Ecommerce",
    headline: "AI search visibility for ecommerce brands",
    sub: "Shoppers increasingly ask AI engines for product recommendations before visiting any brand website. See where your brand stands in those answers.",
    sections: [
      {
        heading: "How AI is changing product discovery",
        body: "\"What is the best running shoe for flat feet?\" \"Which mattress brand has the best reviews for back pain?\" \"What luggage brand do most frequent travelers use?\" These are real queries people submit to ChatGPT and Gemini instead of typing into Google. The AI gives a direct answer naming specific brands. If your brand is not named, that shopper may never find you.",
      },
      {
        heading: "How AnswerMonk works for ecommerce",
        bullets: [
          "We identify your product categories and customer segments from your domain",
          "We generate the recommendation prompts buyers actually use for your category",
          "We run them across ChatGPT, Gemini, Claude, and Perplexity",
          "We show which brands dominate and which sources they cite",
        ],
      },
      {
        heading: "What ecommerce brands typically discover",
        bullets: [
          "Competitor brands with strong Trustpilot or review platform presence consistently appear; those without do not",
          "AI engines often recommend category-specific brands over broad retailers for niche queries",
          "Product recommendation prompts are dominated by brands with editorial coverage, not just SEO rankings",
          "AI local recommendations (best store in [city]) are driven by Google Business data and local directories",
        ],
      },
      {
        heading: "Priority actions for ecommerce brands",
        bullets: [
          "Ensure strong presence on Trustpilot, Google, and category-specific review platforms",
          "Pursue editorial coverage in category-relevant publications — gift guides, best-of lists, and reviews",
          "Create content that answers the exact recommendation prompts buyers use",
          "Track AI visibility for each product category separately — you may dominate in one and be absent in another",
        ],
      },
    ],
  },
  "local-business": {
    title: "AI Search Visibility for Local Businesses | AnswerMonk",
    description: "Find out if your local business appears when customers ask ChatGPT or Gemini for the best service in your area. Track AI local recommendations.",
    eyebrow: "Use Case — Local Business",
    headline: "AI search visibility for local businesses",
    sub: "\"Best dentist in [city]\", \"emergency plumber near me\", \"top-rated restaurant in [neighbourhood]\" — these queries are going to AI engines. See if your business appears.",
    sections: [
      {
        heading: "AI is changing local search",
        body: "Local businesses have long focused on Google Maps and local SEO. AI search adds a new layer: when someone asks ChatGPT or Gemini for the best service provider in an area, the AI often gives a direct recommendation by name. These recommendations are drawn from the AI's training data, live web retrieval, and review platform data — not just from Google Maps ranking.",
      },
      {
        heading: "Which local queries go to AI search",
        bullets: [
          "\"Best [service] in [city]\" — restaurants, dentists, lawyers, plumbers, mechanics",
          "\"Who are the most reputable [service providers] in [area]?\"",
          "\"What is the best-reviewed [service] near [landmark]?\"",
          "\"What [service] do locals recommend in [city]?\"",
        ],
      },
      {
        heading: "What drives local AI visibility",
        bullets: [
          "Google Business Profile completeness and review volume — Gemini draws heavily from this",
          "Yelp and local directory presence — heavily cited by AI for local recommendations",
          "Third-party editorial mentions in local news, city guides, and neighbourhood blogs",
          "Consistent NAP (name, address, phone) data across directories",
          "Review quality and recency — AI models distinguish between brands with high review counts and recent positive sentiment",
        ],
      },
      {
        heading: "What AnswerMonk shows local businesses",
        bullets: [
          "Whether your business appears in AI responses for your service category and location",
          "Which competitors AI recommends in your area",
          "Which citation sources are driving those recommendations",
          "The specific query types your business does or does not appear for",
        ],
      },
    ],
  },
  healthcare: {
    title: "AI Search Visibility for Healthcare Brands | AnswerMonk",
    description: "Measure how your healthcare brand appears in ChatGPT, Gemini, and AI search. Track AI recommendations for clinics, providers, and health services — and benchmark competitors.",
    eyebrow: "Use Case — Healthcare",
    headline: "AI search visibility for healthcare brands",
    sub: "Patients and caregivers ask ChatGPT and Gemini for healthcare recommendations. AnswerMonk shows whether your clinic, service, or health brand appears — and which competitors AI recommends instead.",
    sections: [
      {
        heading: "How AI search is changing patient discovery",
        body: "The patient journey increasingly includes an AI step. Someone experiencing symptoms, researching a treatment option, or looking for a specialist asks ChatGPT or Gemini before booking an appointment or calling a clinic. The AI gives a direct recommendation — naming specific providers, clinics, or services. If your brand is not among them, that patient may never reach your website.",
      },
      {
        heading: "Healthcare query types going to AI engines",
        bullets: [
          "\"Best physiotherapist in [city]\" and variations across healthcare specialties",
          "\"What is the most reputable fertility clinic in [location]?\"",
          "\"Which home healthcare provider should I use for elderly care?\"",
          "\"Find a trusted specialist for [condition] in [area]\"",
          "\"What are the top-rated dental clinics near me?\"",
        ],
      },
      {
        heading: "What drives AI visibility for healthcare brands",
        bullets: [
          "Google Business Profile completeness — Gemini draws heavily on this for local provider queries",
          "Healthcare-specific directories such as Healthgrades, Zocdoc, and specialist listing sites",
          "Review volume and rating on Google, Facebook, and sector-specific platforms",
          "Editorial mentions in health publications, city guides, and authoritative health content",
          "Consistent brand entity across platforms — same name, location, specialty, and contact details",
        ],
      },
      {
        heading: "What AnswerMonk gives healthcare teams",
        bullets: [
          "AI appearance rate across ChatGPT, Gemini, Claude, and Perplexity for your service category and location",
          "Competitor leaderboard — which providers AI recommends most frequently in your market",
          "Citation source breakdown — which platforms and directories are driving AI recommendations in healthcare",
          "Segment analysis — are you visible for specialist queries but not for general practice queries?",
          "Gap identification — the exact sources and content types missing from your AI visibility profile",
        ],
      },
    ],
  },
  "financial-services": {
    title: "AI Search Visibility for Financial Services Brands | AnswerMonk",
    description: "Track how your financial services firm appears in ChatGPT, Gemini, and AI search recommendations. Measure AI citation frequency for wealth management, insurance, lending, and advisory services.",
    eyebrow: "Use Case — Financial Services",
    headline: "AI search visibility for financial services brands",
    sub: "Prospective clients ask AI engines which financial advisor, wealth manager, or insurer to trust. AnswerMonk shows where your firm appears in those answers — and what competitors are doing better.",
    sections: [
      {
        heading: "How financial services buyers use AI search",
        body: "Financial services decisions involve significant research. Before choosing a wealth manager, insurance provider, or financial advisor, buyers increasingly query ChatGPT or Perplexity for recommendations — asking for the most trusted options in their location, for their situation. The brands that appear in those answers get the shortlist. The brands that don't are invisible during the most important stage of the decision.",
      },
      {
        heading: "AI queries common in financial services",
        bullets: [
          "\"Best financial advisor for small business owners in [city]\"",
          "\"Most reputable wealth management firms in [region]\"",
          "\"Which insurance broker should I use for [type of cover]?\"",
          "\"What are the top-rated mortgage brokers in [area]?\"",
          "\"Who are the trusted accountants for freelancers in [city]?\"",
        ],
      },
      {
        heading: "Trust signals that drive AI visibility in finance",
        bullets: [
          "Regulatory credentials and professional body membership — prominently listed across all platforms",
          "Review volume and average rating on Google Business and financial service directories",
          "Independent editorial mentions in financial press, comparison sites, and advisory columns",
          "Clear and consistent entity definition — firm name, specialism, and location identical everywhere",
          "FAQ and explanatory content that answers the decision-stage questions buyers ask AI",
        ],
      },
      {
        heading: "What AnswerMonk provides for financial services firms",
        bullets: [
          "AI share-of-voice score for your firm across all four major LLMs",
          "Competitor ranking by AI citation frequency in your specialism and location",
          "Citation source breakdown — which directories and publications drive AI recommendations in your sector",
          "Query-level data — the specific buyer prompts your firm appears for vs those where competitors win",
          "Action recommendations based on citation gap patterns",
        ],
      },
    ],
  },
  "professional-services": {
    title: "AI Search Visibility for Professional Services Firms | AnswerMonk",
    description: "See how your law firm, consulting practice, or professional services brand appears in ChatGPT and AI search recommendations. Track AI visibility and benchmark competitors.",
    eyebrow: "Use Case — Professional Services",
    headline: "AI search visibility for professional services firms",
    sub: "When clients search for a lawyer, consultant, or specialist using ChatGPT or Gemini, they get a direct recommendation. AnswerMonk shows whether your firm is in that answer.",
    sections: [
      {
        heading: "The AI search shift in professional services",
        body: "Professional services buyers have always relied on referrals and reputation. AI search engines are becoming the digital proxy for this: a prospective client with a legal problem, a consulting need, or a specialist requirement asks ChatGPT for a recommendation before calling anyone. The firms that appear in that answer are the ones that get the call.",
      },
      {
        heading: "Professional services categories where AI visibility matters",
        bullets: [
          "Law firms — corporate, employment, family, immigration, and specialist practice areas",
          "Management and strategy consulting",
          "Accounting and audit firms",
          "Recruitment and executive search",
          "Engineering and technical consulting",
          "HR, training, and organisational development",
        ],
      },
      {
        heading: "What drives AI visibility for professional services",
        bullets: [
          "Authoritative directory listings — Legal 500, Chambers, industry body directories, and specialism-specific platforms",
          "Review presence on Google Business and professional service directories",
          "Editorial mentions in trade press, legal journals, business publications, and industry reports",
          "Case study and methodology content that demonstrates expertise in a citable format",
          "Clear, consistent firm description across all platforms — specialism, geography, firm size, and type of client served",
        ],
      },
      {
        heading: "What AnswerMonk shows professional services firms",
        bullets: [
          "AI appearance rate for your firm across ChatGPT, Gemini, Claude, and Perplexity",
          "Full competitor ranking by citation frequency in your practice area and location",
          "Citation source breakdown — which directories, publications, and platforms drive AI recommendations",
          "Prompt-level data — the specific client questions your firm does and doesn't appear for",
          "Gap analysis identifying the highest-leverage actions to improve AI recommendation frequency",
        ],
      },
    ],
  },
  dubai: {
    title: "AI Search Visibility for Dubai Brands | AnswerMonk",
    description: "Track how your Dubai brand appears in ChatGPT, Gemini, and AI search recommendations. AnswerMonk measures AI visibility for Dubai businesses across all service categories.",
    eyebrow: "Use Case — Dubai",
    headline: "AI search visibility for Dubai brands",
    sub: "Buyers in Dubai and the UAE are asking ChatGPT and Gemini for local service recommendations. AnswerMonk shows whether your brand appears — and which competitors AI recommends in your category.",
    sections: [
      {
        heading: "AI search and the Dubai market",
        body: "Dubai's buyer market is sophisticated and tech-forward. AI chatbot adoption for product and service research in the UAE is significantly above global averages. When an executive, expat, or local buyer wants a recommendation — for a healthcare provider, legal firm, home service, restaurant, or B2B service — they are increasingly asking ChatGPT or Gemini. The brand named in that answer has a significant advantage.",
      },
      {
        heading: "Dubai query types going to AI engines",
        bullets: [
          "\"Best [service] in Dubai\" and \"best [service] in [area of Dubai]\"",
          "\"Most reputable [professional service] in the UAE\"",
          "\"Top-rated [home service] near [Dubai neighbourhood]\"",
          "\"Which [business service] should I use as an expat in Dubai?\"",
          "\"Trusted [healthcare] providers in Dubai\"",
        ],
      },
      {
        heading: "What drives AI visibility for Dubai brands",
        bullets: [
          "Google Business Profile completeness and UAE-specific directory presence",
          "Review volume on Google, Trustpilot, and Dubai-specific review platforms",
          "Editorial mentions in Gulf Business, Khaleej Times, and UAE-specific publications",
          "Consistent entity definition — brand name, address (Dubai/UAE), and category identical across all platforms",
          "English and Arabic content that answers the questions UAE buyers ask AI engines",
        ],
      },
      {
        heading: "What AnswerMonk measures for Dubai businesses",
        bullets: [
          "AI share-of-voice score for your brand across ChatGPT, Gemini, Claude, and Perplexity for Dubai-specific queries",
          "Full competitor ranking — which brands AI recommends most frequently in your category in Dubai",
          "Citation source breakdown — which directories and publications drive AI recommendations in the UAE market",
          "Segment analysis — visibility by service type, customer persona, and specific Dubai location",
          "Gap identification — exact platforms and content types needed to close the competitor gap",
        ],
      },
    ],
  },
};

export default function UseCasePage({ useCase }: { useCase: string }) {
  const cfg = CONFIG[useCase] || CONFIG["brands"];
  return (
    <SEOLayout title={cfg.title} description={cfg.description}>
      <PageHero eyebrow={cfg.eyebrow} headline={cfg.headline} sub={cfg.sub} />
      {cfg.sections.map((s, i) => (
        <Section key={i} title={s.heading}>
          {s.body && <ProseP>{s.body}</ProseP>}
          {s.bullets && <ProseList items={s.bullets} />}
        </Section>
      ))}
      <CTABox />
    </SEOLayout>
  );
}

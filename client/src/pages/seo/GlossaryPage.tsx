import { SEOLayout, PageHero, Section, ProseP, ProseList, CTABox } from "./SEOLayout";
import { Link } from "wouter";

const CONFIG: Record<string, {
  title: string;
  description: string;
  term: string;
  headline: string;
  sub: string;
  sections: { heading: string; body?: string; bullets?: string[] }[];
}> = {
  "generative-engine-optimization": {
    title: "What is Generative Engine Optimization (GEO)? | AnswerMonk",
    description: "Generative Engine Optimization (GEO) is the practice of improving a brand's visibility in AI-generated search results from ChatGPT, Gemini, Claude, and Perplexity.",
    term: "Generative Engine Optimization",
    headline: "What is Generative Engine Optimization (GEO)?",
    sub: "GEO is the practice of optimizing a brand's presence in AI-generated search results — the answers ChatGPT, Gemini, Claude, and Perplexity generate when users ask them for recommendations.",
    sections: [
      {
        heading: "Definition",
        body: "Generative Engine Optimization (GEO) refers to the set of strategies used to improve how often and how prominently a brand appears in AI-generated answers. Where traditional SEO targets ranked URL lists on search engines, GEO targets the synthesized recommendations that AI engines produce when users ask natural-language questions.",
      },
      {
        heading: "Why GEO emerged as a distinct discipline",
        body: "The adoption of AI assistants for discovery and research created a new surface where brand visibility must be managed. A brand can hold the #1 Google ranking for a keyword and still be absent from ChatGPT's answer to the same query. The signals that determine AI recommendation are related to but distinct from traditional SEO signals — making GEO a separate optimization practice.",
      },
      {
        heading: "What GEO involves",
        bullets: [
          "Measuring AI visibility — tracking which AI engines mention your brand, for which queries, and at what frequency",
          "Citation source optimization — ensuring your brand appears on the third-party platforms AI engines use as sources",
          "Entity clarity — making your brand's identity, category, and value proposition consistently clear across the web",
          "Citable content creation — producing content that AI engines can reference when synthesizing answers",
          "Monitoring and iteration — tracking visibility changes as AI models are updated",
        ],
      },
      {
        heading: "GEO vs SEO",
        body: "SEO and GEO overlap significantly in their foundations — both reward credibility, consistent presence, and high-quality content. But GEO places more weight on third-party citation breadth, entity recognition, and category association than on keyword-optimized page ranking. A brand that does well at SEO has a structural advantage in GEO, but it does not guarantee AI visibility.",
      },
      {
        heading: "Measuring GEO performance",
        body: "GEO performance is measured through AI visibility audits — running the prompt queries buyers actually use through AI engines and recording which brands appear. Key metrics include appearance rate (what percentage of relevant prompts trigger a brand mention), share of voice (weighted score across engines and prompt types), and rank position within AI responses.",
      },
    ],
  },
  "ai-visibility-score": {
    title: "What is an AI Visibility Score? | AnswerMonk",
    description: "An AI visibility score measures how often and how prominently a brand appears in AI search results from ChatGPT, Gemini, Claude, and Perplexity.",
    term: "AI Visibility Score",
    headline: "What is an AI visibility score?",
    sub: "An AI visibility score is a quantified measure of how often and how prominently a brand appears in AI-generated search responses across engines like ChatGPT, Gemini, Claude, and Perplexity.",
    sections: [
      {
        heading: "Definition",
        body: "An AI visibility score aggregates a brand's performance across multiple AI engines and query types into a single number. A score of 100 means the brand dominates every tested query across every engine. A score of 0 means the brand does not appear in any AI response for queries relevant to its category.",
      },
      {
        heading: "What goes into the score",
        bullets: [
          "Appearance rate — the percentage of tested prompts in which the brand is mentioned at least once",
          "Rank position — whether the brand is mentioned first, second, or fifth in the AI response",
          "Engine weight — ChatGPT and Gemini carry more weight than Perplexity due to relative usage volume",
          "Prompt coverage — how broadly the brand appears across different query types (discovery, comparison, recommendation)",
          "Segment consistency — whether visibility is consistent across service types and customer personas or concentrated in a narrow area",
        ],
      },
      {
        heading: "How to interpret your score",
        body: "An AI visibility score below 20 typically indicates the brand has little to no presence in AI responses for its category — either it is not in the training data or the citation sources that trigger its mention are absent. A score between 20 and 50 indicates partial visibility — the brand appears in some query types but is absent from others. Above 50 indicates consistent, meaningful AI presence. Above 70 indicates market leadership in AI search for the category.",
      },
      {
        heading: "Why the score changes over time",
        body: "AI models are retrained on new data periodically. A brand that builds citation breadth and content depth today will see its score improve in subsequent model training cycles. Conversely, brands that lose ground in review platforms or press coverage may see scores decline. This is why tracking the score over time — not just at a single point — matters for understanding the trend.",
      },
      {
        heading: "Score vs ranking",
        body: "Unlike SEO rankings which measure a specific URL's position for a specific keyword, an AI visibility score measures entity presence — how well the model recognizes and recommends your brand across a category of queries. Two brands can both rank #1 in Google for different keywords while having very different AI visibility scores.",
      },
    ],
  },
  "ai-search-visibility": {
    title: "What is AI Search Visibility? | AnswerMonk",
    description: "AI search visibility refers to how often and how prominently a brand appears in AI-generated answers from ChatGPT, Gemini, Claude, and Perplexity when buyers search for products and services.",
    term: "AI Search Visibility",
    headline: "What is AI search visibility?",
    sub: "AI search visibility is the measure of how often your brand appears — and how prominently — when people use AI engines to find products, services, or recommendations in your category.",
    sections: [
      {
        heading: "Definition",
        body: "AI search visibility refers to a brand's presence in the answers that AI engines generate in response to natural-language queries. When a buyer asks ChatGPT \"What is the best accounting software for freelancers?\", the brands that appear in the answer have AI search visibility for that query. The brands that don't appear have zero visibility for that query, regardless of their traditional SEO performance.",
      },
      {
        heading: "Why AI search visibility matters",
        body: "AI engines are now a primary discovery channel for many product and service categories. ChatGPT alone serves hundreds of millions of queries per day. Gemini is integrated into Google Search through AI Overviews, reaching Google's full user base. When buyers use these tools to find recommendations, the brands that appear win attention. The brands that don't are invisible at a critical decision point.",
      },
      {
        heading: "How AI search visibility differs from SEO",
        bullets: [
          "SEO targets URL rankings for specific keywords; AI search visibility targets entity presence across a category of prompts",
          "SEO success is measured by click-through rate; AI search visibility is measured by appearance rate in AI responses",
          "SEO is influenced by on-page optimization and backlinks; AI search visibility is more influenced by citation breadth, entity clarity, and third-party review presence",
          "SEO rankings are deterministic for a given query; AI responses vary across sessions and models",
        ],
      },
      {
        heading: "How to measure AI search visibility",
        body: "The most reliable method is to run the prompts your buyers actually use through AI engines and record which brands appear. This is what an AI search audit does. Metrics to track include appearance rate (how many relevant prompts trigger your brand), share of voice (weighted score against competitors), and citation source coverage (which sources AI uses to support your mentions).",
      },
      {
        heading: "Who needs to track AI search visibility",
        bullets: [
          "Any brand in a category where buyers use AI for discovery or comparison",
          "B2B SaaS companies — AI tool discovery is now common among developers and operators",
          "Professional services — legal, financial, and consulting buyers use AI to shortlist providers",
          "Ecommerce brands — AI product recommendation queries are growing rapidly",
          "Local businesses — AI local recommendations are replacing some traditional local search behavior",
        ],
      },
    ],
  },
  aeo: {
    title: "What is AEO (Answer Engine Optimization)? | AnswerMonk",
    description: "Answer Engine Optimization (AEO) is the practice of improving a brand's visibility in AI answer engines — ChatGPT, Gemini, Claude, and Perplexity. Definition, signals, and how to measure AEO performance.",
    term: "Answer Engine Optimization (AEO)",
    headline: "What is Answer Engine Optimization (AEO)?",
    sub: "AEO is the practice of optimizing your brand to appear in the direct answers that AI engines give buyers — rather than the ranked lists that traditional search engines return.",
    sections: [
      {
        heading: "Definition",
        body: "Answer Engine Optimization (AEO) refers to the strategies used to improve a brand's presence in the responses that AI answer engines — ChatGPT, Gemini, Claude, and Perplexity — generate when users ask them buying questions. AEO is focused on the answer format: the AI's direct, synthesized response, not a list of links the user selects from.",
      },
      {
        heading: "AEO vs GEO vs SEO",
        body: "AEO and GEO (Generative Engine Optimization) are often used interchangeably — both describe optimization for AI-generated answers. The distinction from SEO is more significant: SEO is about ranking in a list of links, AEO is about being named in a direct answer. AEO tends to emphasize the conversational, question-answer format specifically — the idea that AI engines are \"answer engines\" rather than search engines.",
      },
      {
        heading: "The key signals AEO targets",
        bullets: [
          "Citation source coverage — appearing on the review platforms, directories, and publications AI engines retrieve when forming answers",
          "Entity clarity — consistent brand definition (name, category, location, services) across all platforms the AI can encounter",
          "Direct-answer content — FAQ pages, HowTo content, and concise explanations that AI engines can extract and cite",
          "Structured data — FAQPage, HowTo, and Organization schema that gives AI crawlers machine-readable entity signals",
          "Authority signals — press mentions, third-party validation, and review volume that make a brand credible to cite",
        ],
      },
      {
        heading: "How AEO performance is measured",
        body: "AEO performance is measured through AI answer audits: running the buyer questions your audience submits to AI engines through those engines and recording which brands appear in the answers, how prominently, and across which query types. Metrics include appearance rate, share of voice, and prompt coverage. These are measured across engines (ChatGPT, Gemini, Claude, Perplexity) because different models retrieve differently.",
      },
      {
        heading: "What makes AEO distinct from SEO as a practice",
        bullets: [
          "AEO optimizes for model retrieval, not crawler indexing — the mechanisms are different",
          "AEO treats your brand as an entity to be recognized, not a page to be ranked",
          "AEO focuses on third-party citation source presence more than on-page content quality",
          "AEO is measured in brand appearance rate, not keyword position",
          "AEO results vary by AI engine — optimization for ChatGPT and Gemini requires different emphases",
        ],
      },
    ],
  },
  "ai-share-of-voice": {
    title: "What is AI Share of Voice? | AnswerMonk",
    description: "AI share of voice measures how often your brand appears in AI-generated answers relative to competitors. Definition, how it's calculated, and how to improve it.",
    term: "AI Share of Voice",
    headline: "What is AI share of voice?",
    sub: "AI share of voice is the percentage of relevant AI-generated answers in which your brand is mentioned, weighted by engine market share and position — measured against all competitors in your category.",
    sections: [
      {
        heading: "Definition",
        body: "AI share of voice is a competitive metric that measures what proportion of AI answer engine responses in a given category mention your brand. A brand with a 40% share of voice appears in 40% of the AI-generated answers for that category's buyer queries, accounting for engine weighting and position within the response.",
      },
      {
        heading: "How AI share of voice is calculated",
        bullets: [
          "A prompt network is built — 25–30 buyer queries covering the range of how real buyers ask about the category",
          "Each prompt is run across all major AI engines: ChatGPT, Gemini, Claude, and Perplexity",
          "Brand appearances are recorded for each prompt and engine",
          "Appearances are weighted by engine market share (ChatGPT 35%, Gemini 35%, Claude 20%, Perplexity 10%)",
          "Position within the response is weighted — first mention scores higher than fifth mention",
          "Weighted scores are aggregated to a 0–100 composite share-of-voice score",
        ],
      },
      {
        heading: "How to interpret your AI share of voice score",
        body: "A score below 20 indicates minimal AI presence — the brand rarely appears in AI responses for its category. 20–50 indicates partial visibility — appearing for some query types but not others. 50–70 indicates consistent AI presence across most query types. Above 70 indicates category leadership in AI search. Most established brands in competitive categories score between 15 and 45 without dedicated GEO/AEO investment.",
      },
      {
        heading: "AI share of voice vs traditional share of voice",
        body: "Traditional share of voice measures brand mentions in media, advertising, or social contexts. AI share of voice measures something more specific: how often a brand is the recommended brand when a buyer asks an AI engine for help. This is a purchase-intent signal, not a brand awareness signal. The buyer has already decided to seek a recommendation — the question is which brand gets it.",
      },
      {
        heading: "Why AI share of voice changes over time",
        body: "AI models are updated periodically. New training data enters the models' knowledge base, retrieval indexes are refreshed, and web sources AI engines query are updated. A brand that gains press coverage, expands its review platform presence, or publishes content that AI engines can cite may see share of voice improve in the next measurement period. Brands that lose ground in third-party sources may see it decline.",
      },
    ],
  },
  "prompt-network": {
    title: "What is a Prompt Network in AI Visibility? | AnswerMonk",
    description: "A prompt network is the set of buyer queries run through AI engines during an AI visibility audit. Definition, how prompt networks are built, and why prompt quality determines audit quality.",
    term: "Prompt Network",
    headline: "What is a prompt network?",
    sub: "A prompt network is the complete set of buyer queries used to audit a brand's AI visibility. The quality, breadth, and intent-accuracy of the prompts directly determines the quality of the audit results.",
    sections: [
      {
        heading: "Definition",
        body: "A prompt network is a structured set of natural-language queries representing how real buyers search for products, services, or recommendations in a given category using AI engines. When an AI visibility audit runs, these prompts are submitted to ChatGPT, Gemini, Claude, and Perplexity. The brands that appear in responses are recorded and scored.",
      },
      {
        heading: "Why prompt networks exist",
        body: "AI engines do not have fixed rankings that you can look up for a keyword the way Google does. A brand's AI visibility is determined by how it performs across a range of queries, not a single one. A prompt network systematically covers the space of buyer intent — discovery queries, comparison queries, location-specific queries, persona-specific queries — so that the resulting visibility score is representative, not just a snapshot of one query type.",
      },
      {
        heading: "What a complete prompt network includes",
        bullets: [
          "Category discovery prompts — \"What are the best [category] providers?\"",
          "Location-specific prompts — \"Best [category] in [city]\" and \"[category] near [location]\"",
          "Persona-specific prompts — \"[category] for [buyer type]\" or \"[category] recommended by [professional type]\"",
          "Comparison prompts — \"Compare [brand] vs alternatives\" or \"What is the best [category] for [use case]?\"",
          "Trust-signal prompts — \"Most reputable [category]\" or \"highest-rated [category]\"",
          "Service-type prompts — variations that cover the specific sub-services or product lines in the category",
        ],
      },
      {
        heading: "How AnswerMonk builds prompt networks",
        body: "AnswerMonk's prompt network creator reads a brand's domain and extracts service types, customer segments, and locations automatically. It then generates 25–30 intent-based prompts covering the full range of buyer query types for that category. This takes 60–90 seconds and requires no manual input — the agent reads the site and produces the network.",
      },
      {
        heading: "Prompt network size and sampling",
        body: "25–30 prompts is typically sufficient to get a representative share-of-voice score for a category. Larger categories or brands serving multiple distinct segments may require separate prompt networks per segment to avoid averaging out important differences. A brand may have high visibility for enterprise prompts and low visibility for SMB prompts — a single blended network would mask this difference.",
      },
    ],
  },
  "llm-traffic": {
    title: "What is LLM Traffic? | AnswerMonk",
    description: "LLM traffic is website traffic that originates from AI language model interfaces — ChatGPT, Gemini, Claude, and Perplexity. Definition, how to measure it, and how it differs from SEO traffic.",
    term: "LLM Traffic",
    headline: "What is LLM traffic?",
    sub: "LLM traffic is referral traffic that arrives at your website from AI language model interfaces — when ChatGPT, Claude, Gemini, or Perplexity recommends your brand and a user clicks through.",
    sections: [
      {
        heading: "Definition",
        body: "LLM traffic (also called AI referral traffic) is website traffic that originates from a user clicking a link or following a recommendation in an AI-generated response. When ChatGPT, Gemini, Claude, or Perplexity names a brand and includes a URL, users who click that link generate LLM traffic to the brand's website.",
      },
      {
        heading: "How LLM traffic differs from SEO traffic",
        body: "SEO traffic comes from a user selecting a URL from a ranked list of results after deciding which link to click. LLM traffic comes from a user following an AI recommendation — the AI has already told the user your brand is the right answer. This pre-qualification means LLM traffic typically carries higher purchase intent than equivalent organic search traffic. The user arrives already convinced, not still deciding.",
      },
      {
        heading: "How to measure LLM traffic in analytics",
        bullets: [
          "In Google Analytics 4, look for sessions with referral source domains: chatgpt.com, claude.ai, gemini.google.com, perplexity.ai",
          "Create a custom segment filtering sessions by these referrers to isolate the channel",
          "Track conversion rate for LLM-referred sessions vs other organic traffic — the comparison typically shows higher intent",
          "Monitor this channel monthly — it is growing as AI engine usage grows",
          "Note that some LLM traffic may be misattributed to direct traffic if the referrer is stripped",
        ],
      },
      {
        heading: "The relationship between AI share of voice and LLM traffic",
        body: "LLM traffic is the downstream effect of AI share of voice. A brand with high share of voice in AI responses for its category receives more LLM traffic than a brand with low share of voice. Increasing share of voice — through citation source coverage, entity clarity, and citable content — increases the likelihood that users clicking from AI interfaces land on your site.",
      },
      {
        heading: "Why LLM traffic volume is smaller but more valuable",
        body: "LLM traffic is still smaller than organic search traffic for most brands. But the conversion and engagement quality tends to be higher. AI interfaces are increasingly used in the later stages of research — when a user is ready to decide, not just explore. This makes LLM-referred sessions disproportionately valuable relative to their volume. As AI usage grows, the volume differential will narrow.",
      },
    ],
  },
  "chatgpt-citations": {
    title: "What are ChatGPT Citations? | AnswerMonk",
    description: "A ChatGPT citation is when ChatGPT names or recommends your brand in a response. Definition, what determines whether ChatGPT cites a brand, and how to earn more ChatGPT citations.",
    term: "ChatGPT Citations",
    headline: "What are ChatGPT citations?",
    sub: "A ChatGPT citation is when ChatGPT names your brand in a response to a buyer query. Earning ChatGPT citations consistently is the core goal of AI search optimization for brands in most categories.",
    sections: [
      {
        heading: "Definition",
        body: "A ChatGPT citation occurs when ChatGPT includes your brand in a response — either as a specific recommendation, a named example, or a mentioned alternative. For buyer-intent queries (\"what is the best X?\", \"who are the top providers of Y?\"), citations translate directly to consideration by the buyer asking the question. ChatGPT is the most widely used AI interface globally, making its citations disproportionately valuable.",
      },
      {
        heading: "What determines whether ChatGPT cites a brand",
        body: "ChatGPT's recommendations are shaped by two sources: its training data (what it learned during model training) and live web retrieval (what it finds when browsing mode is enabled). Brands that appear frequently across both sources in the context of a category query are cited more often. The primary signals:",
        bullets: [
          "Training data presence — how frequently the brand was mentioned across the web content used in model training",
          "Third-party source coverage — presence on review platforms, directories, and industry publications that ChatGPT retrieves",
          "Entity recognition — whether ChatGPT's model has a clear, consistent understanding of what the brand is and what it does",
          "Review signal quality — volume and recency of reviews on platforms ChatGPT treats as authoritative",
          "Web retrieval quality — for live browsing, the quality and authority of pages ChatGPT finds about the brand",
        ],
      },
      {
        heading: "How to measure ChatGPT citations",
        body: "The most direct method is to run your category's buyer prompts through ChatGPT and record when your brand appears. Do this across 20–30 prompts representing the full range of buyer queries in your space. Your appearance rate (percentage of prompts where ChatGPT cites you) and your rank position within responses are the key metrics. An AI visibility audit automates this process and compares your results against competitors.",
      },
      {
        heading: "How to earn more ChatGPT citations",
        bullets: [
          "Get listed and reviewed on the platforms ChatGPT retrieves most for your category (G2, Capterra, Trustpilot, Yelp, or sector-specific directories)",
          "Build consistent brand mentions across indexed publications and editorial content",
          "Create FAQ and HowTo content on your site that directly answers buyer questions — ChatGPT cites these in browse mode",
          "Ensure your Organization schema and entity data is complete and consistent across platforms",
          "Pursue press coverage in publications ChatGPT treats as authoritative in your industry",
        ],
      },
      {
        heading: "ChatGPT citations vs mentions on other AI engines",
        body: "Each AI engine has its own retrieval logic and training data composition. A brand that ChatGPT cites frequently may be less prominent in Gemini responses, and vice versa. This is why cross-engine measurement matters — a single engine audit gives a partial picture. Share of voice across ChatGPT, Gemini, Claude, and Perplexity gives the complete view.",
      },
    ],
  },
};

export default function GlossaryPage({ term }: { term: string }) {
  const cfg = CONFIG[term] || CONFIG["ai-search-visibility"];
  return (
    <SEOLayout title={cfg.title} description={cfg.description}>
      <div style={{ marginBottom: 8, fontSize: 12, color: "#9ca3af", lineHeight: 1.8, flexWrap: "wrap" }}>
        <Link href="/glossary/ai-search-visibility"><span style={{ cursor: "pointer", color: "#7c3aed" }}>AI Search Visibility</span></Link>
        {" · "}
        <Link href="/glossary/ai-visibility-score"><span style={{ cursor: "pointer", color: "#7c3aed" }}>AI Visibility Score</span></Link>
        {" · "}
        <Link href="/glossary/generative-engine-optimization"><span style={{ cursor: "pointer", color: "#7c3aed" }}>GEO</span></Link>
        {" · "}
        <Link href="/glossary/aeo"><span style={{ cursor: "pointer", color: "#7c3aed" }}>AEO</span></Link>
        {" · "}
        <Link href="/glossary/ai-share-of-voice"><span style={{ cursor: "pointer", color: "#7c3aed" }}>AI Share of Voice</span></Link>
        {" · "}
        <Link href="/glossary/prompt-network"><span style={{ cursor: "pointer", color: "#7c3aed" }}>Prompt Network</span></Link>
        {" · "}
        <Link href="/glossary/llm-traffic"><span style={{ cursor: "pointer", color: "#7c3aed" }}>LLM Traffic</span></Link>
        {" · "}
        <Link href="/glossary/chatgpt-citations"><span style={{ cursor: "pointer", color: "#7c3aed" }}>ChatGPT Citations</span></Link>
      </div>
      <PageHero eyebrow={`Glossary — ${cfg.term}`} headline={cfg.headline} sub={cfg.sub} />
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

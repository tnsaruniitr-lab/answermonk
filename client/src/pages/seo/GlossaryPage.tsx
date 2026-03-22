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
};

export default function GlossaryPage({ term }: { term: string }) {
  const cfg = CONFIG[term] || CONFIG["ai-search-visibility"];
  return (
    <SEOLayout title={cfg.title} description={cfg.description}>
      <div style={{ marginBottom: 8, fontSize: 12, color: "#9ca3af" }}>
        <Link href="/glossary/ai-search-visibility"><span style={{ cursor: "pointer", color: "#7c3aed" }}>AI Search Visibility</span></Link>
        {" · "}
        <Link href="/glossary/ai-visibility-score"><span style={{ cursor: "pointer", color: "#7c3aed" }}>AI Visibility Score</span></Link>
        {" · "}
        <Link href="/glossary/generative-engine-optimization"><span style={{ cursor: "pointer", color: "#7c3aed" }}>GEO</span></Link>
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

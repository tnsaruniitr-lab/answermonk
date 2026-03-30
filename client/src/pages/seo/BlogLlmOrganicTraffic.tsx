import { useEffect } from "react";
import { Link } from "wouter";
import { SEOLayout, PageHero, Section, ProseP, ProseList, CTABox } from "./SEOLayout";

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is LLM organic traffic?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "LLM organic traffic is website traffic that arrives from AI language model interfaces — ChatGPT, Claude, Gemini, and Perplexity — when those models recommend your brand in response to a user query. Unlike paid search, it is earned through visibility in AI-generated responses rather than bought through ads."
      }
    },
    {
      "@type": "Question",
      "name": "How do I increase organic traffic from LLMs?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "To increase organic traffic from LLMs, you need to appear in the sources those models retrieve: review platforms, industry directories, press coverage, and structured content on your website. The core actions are: get listed on citation sources LLMs use, publish content that directly answers buyer queries, strengthen entity clarity, and track your appearance rate across models with regular audits."
      }
    },
    {
      "@type": "Question",
      "name": "Which LLMs send the most referral traffic?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "ChatGPT and Gemini currently drive the most referral traffic due to their browser integrations and market share. Perplexity is notable for sending high-intent clicks because its interface is explicitly search-oriented. Claude typically sends less direct traffic but influences research and recommendation pipelines for professional buyers."
      }
    },
    {
      "@type": "Question",
      "name": "How do I measure traffic from LLMs in analytics?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "In Google Analytics 4, LLM referral traffic appears under referral sources from domains like chatgpt.com, claude.ai, gemini.google.com, and perplexity.ai. You can also track it by filtering sessions with these referrers. However, GA4 only shows traffic that already exists — to understand why you're receiving or not receiving it, you need an AI visibility audit that shows your appearance rate across these engines."
      }
    }
  ]
};

function StatBox({ stat, label }: { stat: string; label: string }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%)",
      border: "1px solid rgba(99,102,241,0.18)",
      borderRadius: 12, padding: "20px 24px", textAlign: "center",
    }}>
      <div style={{ fontSize: 32, fontWeight: 800, color: "#4f46e5", lineHeight: 1 }}>{stat}</div>
      <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6, lineHeight: 1.4 }}>{label}</div>
    </div>
  );
}

export default function BlogLlmOrganicTraffic() {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "blog-llm-traffic-schema";
    script.textContent = JSON.stringify(FAQ_SCHEMA);
    document.head.appendChild(script);
    return () => { document.getElementById("blog-llm-traffic-schema")?.remove(); };
  }, []);

  return (
    <SEOLayout
      title="How to Increase Organic Traffic from LLMs (ChatGPT, Claude, Gemini) | AnswerMonk"
      description="LLMs are becoming a significant source of referral traffic for brands they recommend. Learn how to earn and grow organic traffic from ChatGPT, Claude, Gemini, and Perplexity."
    >
      <PageHero
        eyebrow="Blog"
        headline="How to increase organic traffic from LLMs"
        sub="ChatGPT, Claude, Gemini, and Perplexity now send referral traffic to brands they recommend. Here's how to earn that traffic — and how to measure it."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 48 }}>
        <StatBox stat="13%" label="of all web searches now involve an AI-generated response" />
        <StatBox stat="3×" label="higher purchase intent in AI-referred sessions vs display ads" />
        <StatBox stat="4" label="LLMs tracked by AnswerMonk: ChatGPT, Gemini, Claude, Perplexity" />
      </div>

      <Section title="LLM traffic is real — and growing">
        <ProseP>
          A new referral source is appearing in analytics dashboards: chatgpt.com, perplexity.ai, claude.ai, gemini.google.com. Brands that appear in AI-generated recommendations receive clicks from users who are already pre-qualified — the model has already told them your brand fits their need.
        </ProseP>
        <ProseP>
          This traffic channel is still small compared to Google organic, but it is growing sharply and it converts at rates that make it disproportionately valuable. A buyer who has received a specific AI recommendation for your brand is far warmer than one who clicked a ranked URL from a results page.
        </ProseP>
        <ProseP>
          Most brands don't know they're missing it — because they've never measured their visibility inside AI responses. That's the first thing to fix.
        </ProseP>
      </Section>

      <Section title="How LLMs decide what to recommend">
        <ProseP>
          Unlike a search engine that ranks pages, a language model generates a response by synthesising from what it knows. The brands and sources it draws on to build that response are not random — they reflect patterns in its training data and, for models with live retrieval, what it finds when it searches the current web.
        </ProseP>
        <ProseP>
          The primary factors that determine whether your brand appears in an LLM response:
        </ProseP>
        <ProseList items={[
          "Citation coverage — whether your brand appears on the third-party sources (review sites, directories, industry publications) that LLMs retrieve",
          "Entity consistency — whether your brand name, description, and category are the same across all platforms",
          "Content relevance — whether your website and external mentions use the same language buyers use in AI queries",
          "Volume and recency of mentions — both in your training data footprint and in live web retrieval",
          "Schema markup — structured data that gives AI crawlers a direct, machine-readable signal about your brand",
        ]} />
      </Section>

      <Section title="Step 1 — Audit your current LLM appearance rate">
        <ProseP>
          You cannot improve what you don't measure. The starting point is knowing your current appearance rate: what percentage of the buyer queries in your category trigger a mention of your brand, on which engines, and in what position?
        </ProseP>
        <ProseP>
          <Link href="/start"><span style={{ color: "#7c3aed", textDecoration: "underline", cursor: "pointer" }}>AnswerMonk's free audit</span></Link> runs your category's natural-language buyer prompts across all four major LLMs and returns your share-of-voice score, which queries you appear on, which you don't, and which competitors are beating you where. That data tells you exactly where to focus.
        </ProseP>
      </Section>

      <Section title="Step 2 — Close your citation source gaps">
        <ProseP>
          The fastest path to increasing LLM organic traffic is appearing on the sources those models retrieve. In most categories, the top three to five citation sources account for the majority of AI recommendations. Your competitors are almost certainly on sources you're not.
        </ProseP>
        <ProseList items={[
          "Identify the platforms your competitors get cited from — an AI audit surfaces these directly",
          "Claim, complete, and actively maintain profiles on all major review platforms in your vertical",
          "Get listed in category-specific directories and industry publications that LLMs reference",
          "Ensure every listing uses consistent language — same brand name, same category description, same location format",
        ]} />
      </Section>

      <Section title="Step 3 — Publish content structured for AI retrieval">
        <ProseP>
          AI models retrieve content that directly answers buyer questions. The pages most likely to be cited are ones with clear topical focus, a defined audience, and specific answers — not general marketing pages.
        </ProseP>
        <ProseList items={[
          "Use-case pages per customer segment — one page per buyer type you serve",
          "Comparison pages — your brand vs alternatives, written with specific feature comparisons",
          "FAQ content built around the questions buyers ask AI models in your category",
          "How-it-works or methodology content that explains your process clearly",
          "Case studies with measurable outcomes — AI models cite specifics more than generalities",
        ]} />
      </Section>

      <Section title="Step 4 — Add structured data across key pages">
        <ProseP>
          JSON-LD schema is a direct machine-readable signal to AI crawlers about what your brand is and what it does. It's one of the few explicit GEO signals you fully control.
        </ProseP>
        <ProseList items={[
          "Organization schema on your homepage — name, URL, description, same-as links to social profiles",
          "FAQPage schema on any page with question-and-answer content",
          "HowTo schema on process or methodology pages",
          "Product or SoftwareApplication schema if relevant to your category",
          "LocalBusiness schema with consistent NAP (name, address, phone) if you serve a specific geography",
        ]} />
      </Section>

      <Section title="Step 5 — Build press and third-party mentions">
        <ProseP>
          LLMs are trained on web content. A brand that appears in ten indexed industry articles carries a larger training data footprint than a brand with a polished website but no external mentions. External validation also drives live retrieval — when a model searches the web before answering, press coverage and expert mentions are exactly what it finds.
        </ProseP>
        <ProseList items={[
          "Publish original data and research — this is the most citable content type for industry publications",
          "Contribute expert commentary to roundups and 'best of' lists in your category",
          "Get interviewed or featured in newsletters and podcasts that are indexed by LLMs",
          "Engage in Reddit and specialist forum threads where buyers ask the questions you want to answer",
        ]} />
      </Section>

      <Section title="Step 6 — Track LLM traffic in analytics">
        <ProseP>
          Once you've started building LLM visibility, track the downstream impact. In Google Analytics 4, filter sessions by referrer to find traffic from chatgpt.com, perplexity.ai, claude.ai, and gemini.google.com. Set up a segment or comparison so you can watch this channel grow alongside your AI visibility score.
        </ProseP>
        <ProseP>
          Run your <Link href="/start"><span style={{ color: "#7c3aed", textDecoration: "underline", cursor: "pointer" }}>AnswerMonk audit</span></Link> monthly and compare your appearance rate over time. Tie the changes in your score to the actions you took — citation source additions, new content, press coverage — to understand what's working in your specific category.
        </ProseP>
      </Section>

      <CTABox />
    </SEOLayout>
  );
}

import { useEffect } from "react";
import { Link } from "wouter";
import { SEOLayout, PageHero, Section, ProseP, ProseList, CTABox } from "./SEOLayout";

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is GEO vs SEO?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "SEO (Search Engine Optimization) is the practice of optimizing your website to rank higher in Google's list of results. GEO (Generative Engine Optimization) is the practice of optimizing your brand to appear in AI-generated answers from ChatGPT, Gemini, Claude, and Perplexity. While SEO targets ranked URL lists, GEO targets conversational recommendations."
      }
    },
    {
      "@type": "Question",
      "name": "Should I do GEO or SEO?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You should do both, because they share significant overlap. Good SEO signals — authoritative content, structured data, strong third-party mentions — also improve GEO performance. But GEO requires additional actions SEO doesn't: appearing on the specific citation sources AI models retrieve, building entity consistency, and optimizing for how AI engines understand (not rank) your brand."
      }
    },
    {
      "@type": "Question",
      "name": "Is GEO replacing SEO?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "GEO is not replacing SEO — it is extending it. Google still drives the majority of web traffic for most businesses. But AI-generated answers are taking an increasing share of the queries that previously led to a Google search, particularly in research and recommendation categories. Brands need both strategies."
      }
    },
    {
      "@type": "Question",
      "name": "What tools are used for GEO?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "GEO tools measure a brand's appearance rate and share of voice across AI engines. AnswerMonk is one such tool — it generates the buyer prompts in your category, runs them across ChatGPT, Gemini, Claude, and Perplexity, and returns a share-of-voice score, competitor leaderboard, and citation source breakdown. Traditional SEO tools like Ahrefs and Semrush do not cover AI engine visibility."
      }
    }
  ]
};

function CompareRow({ label, seo, geo }: { label: string; seo: string; geo: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(99,102,241,0.08)" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</div>
      <div style={{ fontSize: 13, color: "#6b7280" }}>{seo}</div>
      <div style={{ fontSize: 13, color: "#4f46e5", fontWeight: 500 }}>{geo}</div>
    </div>
  );
}

export default function BlogGeoVsSeo() {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "blog-geo-vs-seo-schema";
    script.textContent = JSON.stringify(FAQ_SCHEMA);
    document.head.appendChild(script);
    return () => { document.getElementById("blog-geo-vs-seo-schema")?.remove(); };
  }, []);

  return (
    <SEOLayout
      title="GEO vs SEO: What's the Difference and Why Both Matter | AnswerMonk"
      description="GEO (Generative Engine Optimization) and SEO target different systems with different signals. Here's how they differ, where they overlap, and what you need to do for both."
    >
      <PageHero
        eyebrow="Blog"
        headline="GEO vs SEO: what's the difference and why both matter"
        sub="Search engine optimization gets you into Google's ranked list. Generative engine optimization gets you into ChatGPT's answer. They share overlap — but they're not the same thing."
      />

      <Section title="The core difference">
        <ProseP>
          SEO is a competition for position in a ranked list. Google evaluates pages using hundreds of signals — backlinks, content quality, page speed, technical structure — and returns an ordered list of results. A user then chooses which result to click. The brand with the best page wins the click.
        </ProseP>
        <ProseP>
          GEO is a competition to be recommended by a model. ChatGPT, Gemini, Claude, and Perplexity don't return a list — they return a synthesised answer. If a user asks "what's the best accounting software for a small law firm?", the model picks one or two brands and explains why. There is no position 2 to 10. You're either in the answer or you're not.
        </ProseP>
        <ProseP>
          This changes the stakes. An SEO win moves you from position 8 to position 3 — still visible. A GEO win moves you from invisible to recommended. A GEO loss means a competitor gets the recommendation every time that query is asked.
        </ProseP>
      </Section>

      <Section title="Side by side">
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, padding: "10px 0", borderBottom: "2px solid rgba(99,102,241,0.15)", marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>Factor</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>SEO</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.08em" }}>GEO</div>
          </div>
          <CompareRow label="Target system" seo="Google Search" geo="ChatGPT, Gemini, Claude, Perplexity" />
          <CompareRow label="Output format" seo="Ranked list of URLs" geo="Conversational recommendation" />
          <CompareRow label="Primary signal" seo="Backlinks + page authority" geo="Citation sources + entity consistency" />
          <CompareRow label="Content that works" seo="Keyword-rich pages with high authority" geo="Specific, citable answers to buyer questions" />
          <CompareRow label="Measurement" seo="Keyword rankings, organic sessions" geo="Appearance rate, share of voice across engines" />
          <CompareRow label="Competition" seo="Compete for ranked positions" geo="Compete to be named in the answer" />
          <CompareRow label="Tooling" seo="Ahrefs, Semrush, Moz" geo="AnswerMonk, Profound, custom prompt audits" />
        </div>
      </Section>

      <Section title="Where SEO and GEO overlap">
        <ProseP>
          Good SEO creates a strong foundation for GEO. Many of the signals that help you rank on Google also help you appear in AI responses — because AI models were partly trained on web content that Google already ranked highly.
        </ProseP>
        <ProseList items={[
          "Authoritative, well-structured content — citable by both Google and AI models",
          "Backlinks from reputable publications — build training data footprint and retrieval authority",
          "Technical crawlability — fast, clean pages are indexed by both traditional and AI crawlers",
          "Schema markup — structured data helps both Google and AI engines understand your brand",
          "Strong domain authority — correlates with AI citation frequency in most categories",
        ]} />
        <ProseP>
          If you have strong SEO, you have a head start on GEO. But you are not done — because there are GEO signals that SEO tools don't measure and SEO tactics don't address.
        </ProseP>
      </Section>

      <Section title="Where GEO requires different actions">
        <ProseP>
          AI engines retrieve from a different set of sources than Google indexes. The gaps are significant:
        </ProseP>
        <ProseList items={[
          "Citation source coverage — AI models heavily weight review platforms, directories, and industry lists that Google often ignores for ranking purposes",
          "Entity consistency — AI models build a representation of your brand from everything it encounters; inconsistent descriptions across platforms create confusion that reduces citation confidence",
          "Prompt-matched content — SEO targets keywords; GEO targets the natural-language questions buyers ask AI models, which are often longer and more intent-specific",
          "llms.txt — a newer standard (gaining adoption with Perplexity) that directly tells AI crawlers what your site is about",
          "AI-engine-specific schema — FAQPage and HowTo schema are disproportionately picked up by AI retrieval vs traditional crawlers",
        ]} />
      </Section>

      <Section title="Which matters more right now?">
        <ProseP>
          Google still drives the majority of web traffic for most businesses. SEO is not optional. But the rate of change favors GEO: AI-generated answers are displacing traditional results pages for research and recommendation queries at an accelerating rate — exactly the high-intent queries where SEO previously delivered its best leads.
        </ProseP>
        <ProseP>
          The brands most at risk from the shift are those in categories where buyers research before buying: professional services, SaaS, healthcare, financial services, education, and local services. If a buyer used to Google "best X in Y" and click a result, they now ask ChatGPT and receive a direct recommendation. If your brand isn't the one recommended, that lead is gone.
        </ProseP>
        <ProseP>
          The practical answer: run both, measure both, and allocate more attention to GEO in any category where AI-generated answers are already displacing Google results. <Link href="/start"><span style={{ color: "#7c3aed", textDecoration: "underline", cursor: "pointer" }}>An AI visibility audit</span></Link> will show you exactly how exposed you are right now.
        </ProseP>
      </Section>

      <Section title="How to measure GEO (without guessing)">
        <ProseP>
          Traditional SEO tools — Ahrefs, Semrush, Moz — don't measure AI engine visibility. They track Google rankings. To measure GEO, you need to run your category's buyer prompts across ChatGPT, Gemini, Claude, and Perplexity and record how often your brand appears, in what position, and on which queries.
        </ProseP>
        <ProseP>
          <Link href="/methodology"><span style={{ color: "#7c3aed", textDecoration: "underline", cursor: "pointer" }}>AnswerMonk automates this process</span></Link> — it generates the full prompt network for your brand, runs it across all four engines, and returns a share-of-voice score, competitor leaderboard, and citation source breakdown. The output tells you not just where you stand, but exactly what's driving the gap between you and the brands that are winning AI recommendations in your category.
        </ProseP>
      </Section>

      <CTABox />
    </SEOLayout>
  );
}

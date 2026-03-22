import { SEOLayout, PageHero, Section, ProseP, ProseList, CTABox } from "./SEOLayout";

export default function Methodology() {
  return (
    <SEOLayout
      title="How AnswerMonk Measures AI Search Visibility | Methodology"
      description="Learn exactly how AnswerMonk audits your brand's visibility in ChatGPT, Gemini, Claude, and Perplexity — from prompt generation to share-of-voice scoring."
    >
      <PageHero
        eyebrow="Methodology"
        headline="How AnswerMonk measures AI search visibility"
        sub="A transparent breakdown of our audit process — from crawling your website to calculating your share-of-voice score across AI engines."
      />

      <Section title="Step 1 — Website crawl and segment extraction">
        <ProseP>
          The audit begins by crawling your brand's domain. We extract the core services, product categories, and customer types your business targets. This is not a simple keyword scrape — we parse page structure, headings, navigation, and semantic content to identify genuine service segments.
        </ProseP>
        <ProseP>
          The output is a set of segments — each representing a distinct service type and customer persona. A SaaS company might produce segments like "project management software for remote teams" or "time tracking for agencies." A local business might produce "emergency plumber in Dubai" or "commercial HVAC contractor."
        </ProseP>
      </Section>

      <Section title="Step 2 — Prompt network generation">
        <ProseP>
          For each segment, we generate a network of natural-language prompts — the kind of queries a real buyer would ask an AI engine. These prompts fall into three categories:
        </ProseP>
        <ProseList items={[
          "Discovery prompts — \"What is the best [service] for [customer type]?\"",
          "Comparison prompts — \"Compare [service category] options for [use case]\"",
          "Recommendation prompts — \"Which [service] do most [customer type] use?\"",
        ]} />
        <ProseP>
          A typical audit generates 20–30 prompts per session, covering the full surface of how buyers ask AI engines for recommendations in your category.
        </ProseP>
      </Section>

      <Section title="Step 3 — Cross-engine scoring">
        <ProseP>
          Each prompt is run against four AI engines simultaneously: ChatGPT (OpenAI), Gemini (Google), Claude (Anthropic), and Perplexity. We capture the full response and identify which brands are mentioned, in what position, and with what frequency.
        </ProseP>
        <ProseP>
          Engine weights in the overall score reflect current market share and influence:
        </ProseP>
        <ProseList items={[
          "ChatGPT — 35%",
          "Gemini — 35%",
          "Claude — 20%",
          "Perplexity — 10%",
        ]} />
      </Section>

      <Section title="Step 4 — Appearance rate and share of voice">
        <ProseP>
          <strong>Appearance rate</strong> is the percentage of prompts in which a brand is mentioned at least once by a given engine. A brand with a 70% appearance rate appears in 7 out of every 10 relevant queries tested.
        </ProseP>
        <ProseP>
          <strong>Share of voice</strong> is a weighted composite score combining appearance rate, rank position (first mention vs fifth mention), and engine weight. A score of 100 means the brand dominates every tested query on every engine. A score of 0 means it does not appear.
        </ProseP>
      </Section>

      <Section title="Step 5 — Competitor detection">
        <ProseP>
          We detect competitors organically from AI responses — not from a pre-set list you provide. Every brand mentioned by an AI engine across the prompt set is recorded and ranked. This reveals who AI systems actually consider your competition, which is often different from who you track in traditional SEO.
        </ProseP>
      </Section>

      <Section title="Step 6 — Citation source crawling">
        <ProseP>
          When AI engines cite external sources alongside their answers, those citations are crawled and classified. We identify whether citations come from review platforms, directories, industry publications, government databases, or brand-owned pages.
        </ProseP>
        <ProseP>
          This citation map shows which third-party sources are driving AI visibility in your category — and which you need to be listed on to compete.
        </ProseP>
      </Section>

      <Section title="Limitations and transparency">
        <ProseList items={[
          "AI engine responses vary across sessions. Scores represent an average across multiple prompt runs, not a single snapshot.",
          "AI models are retrained periodically. Scores should be tracked over time, not treated as permanent.",
          "We do not control AI engine outputs. We measure what they produce — we do not influence it.",
          "Citation coverage depends on which sources AI engines choose to cite. Some industries have sparse citation footprints.",
        ]} />
      </Section>

      <CTABox />
    </SEOLayout>
  );
}

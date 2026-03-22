import { SEOLayout, PageHero, Section, ProseP, ProseList, CTABox } from "./SEOLayout";

export default function AiSearchAudit() {
  return (
    <SEOLayout
      title="AI Search Visibility Audit for Brands and Agencies | AnswerMonk"
      description="Run a free AI search audit to see how your brand appears in ChatGPT, Gemini, Claude, and Perplexity. Get a share-of-voice score, competitor breakdown, and citation sources."
    >
      <PageHero
        eyebrow="AI Search Audit"
        headline="Find out where your brand stands in AI search — in minutes"
        sub="Enter your domain and get a full visibility audit across ChatGPT, Gemini, Claude, and Perplexity. See your share-of-voice score, who's beating you, and which sources drive AI mentions in your category."
      />

      <Section title="What the audit covers">
        <ProseList items={[
          "Share-of-voice score — how often your brand appears in AI responses relative to competitors",
          "Appearance rate per AI engine — ChatGPT, Gemini, Claude, Perplexity",
          "Competitor leaderboard — every brand AI mentions in your category, ranked by AI presence",
          "Prompt coverage — which customer queries and use cases your brand shows up for",
          "Citation source map — which third-party sites are driving AI mentions in your space",
          "Segment breakdown — visibility by service type and customer persona",
        ]} />
      </Section>

      <Section title="How the audit works">
        <ProseP>
          The audit takes 3–8 minutes end to end. Here is what happens:
        </ProseP>
        <ProseList items={[
          "We crawl your domain and extract your core service segments and customer types",
          "We generate 20–30 natural-language prompts that real buyers ask AI engines",
          "We run every prompt across ChatGPT, Gemini, Claude, and Perplexity simultaneously",
          "We record every brand mention, position, and citation from every AI response",
          "We calculate your share-of-voice score and compile the full competitor and citation report",
        ]} />
      </Section>

      <Section title="Who the audit is for">
        <ProseP>
          The audit is useful for any organization that sells a product or service and wants to understand how AI search engines represent them to potential buyers.
        </ProseP>
        <ProseList items={[
          "Marketing teams who want to understand their AI search footprint before buyers make decisions",
          "Agencies running AI visibility audits for clients",
          "B2B SaaS companies whose buyers increasingly discover tools through ChatGPT",
          "Ecommerce brands tracking category recommendations in AI",
          "Local businesses appearing (or not appearing) in AI local recommendations",
        ]} />
      </Section>

      <Section title="What you get in the report">
        <ProseP>
          The report is structured in four layers:
        </ProseP>
        <ProseList items={[
          "Overall score — a single 0–100 AI visibility score weighted across all engines and segments",
          "Engine breakdown — your appearance rate and rank position on each AI engine separately",
          "Competitor analysis — full leaderboard of brands appearing in your prompt network",
          "Citation intelligence — the third-party sources cited by AI engines in your category, with classification by type",
        ]} />
      </Section>

      <Section title="Is it free?">
        <ProseP>
          The core AI search audit is free. Enter your domain, confirm your service segments, and receive a full report — no credit card required.
        </ProseP>
      </Section>

      <CTABox />
    </SEOLayout>
  );
}

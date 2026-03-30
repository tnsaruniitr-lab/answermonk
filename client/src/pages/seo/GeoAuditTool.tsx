import { Link } from "wouter";
import { SEOLayout, PageHero, Section, ProseP, ProseList, CTABox } from "./SEOLayout";

export default function GeoAuditTool() {
  return (
    <SEOLayout
      title="GEO Audit Tool — Generative Engine Optimization Audit | AnswerMonk"
      description="Run a GEO audit to measure how your brand appears in ChatGPT, Gemini, Claude, and Perplexity. AnswerMonk's GEO audit tool shows your AI share of voice, competitors, and citation gaps."
    >
      <PageHero
        eyebrow="GEO Audit"
        headline="GEO audit tool: measure your brand's generative engine visibility"
        sub="A GEO audit shows whether your brand appears in AI-generated answers — and what competitors are doing better. Run one in under 10 minutes."
      />

      <Section title="What is a GEO audit?">
        <ProseP>
          A GEO audit (Generative Engine Optimization audit) measures how your brand appears in responses from large language model search engines — ChatGPT, Gemini, Claude, and Perplexity. Where a traditional SEO audit checks Google rankings and backlink profiles, a GEO audit checks AI citation frequency and share of voice.
        </ProseP>
        <ProseP>
          The output of a GEO audit answers three questions: Does your brand appear when buyers ask AI engines for recommendations in your category? How frequently, compared to competitors? And what is driving the gap?
        </ProseP>
      </Section>

      <Section title="What AnswerMonk's GEO audit measures">
        <ProseList items={[
          "AI share-of-voice score (0–100): your brand's weighted citation frequency across all engines and prompts",
          "Engine-by-engine breakdown: how often you appear on ChatGPT, Gemini, Claude, and Perplexity separately",
          "Competitor leaderboard: every brand AI recommends in your category, ranked by appearance rate",
          "Citation source analysis: which review sites, directories, and publications are driving AI recommendations in your space",
          "Segment gaps: which service types, customer personas, or locations your brand is missing from AI results",
          "Prompt coverage: the specific buyer queries your brand does and does not appear for",
        ]} />
      </Section>

      <Section title="How the GEO audit works">
        <ProseP>
          Drop in your domain. AnswerMonk's prompt network creator reads your site, extracts your service types and customer segments, and automatically generates 25–30 intent-based buyer prompts. These are the natural-language queries real buyers submit to AI engines when researching your category.
        </ProseP>
        <ProseP>
          Each prompt is fired against ChatGPT, Gemini, Claude, and Perplexity via live API calls — not simulated or cached. Responses are parsed for brand mentions, position, and source citations. Results are aggregated into a share-of-voice score weighted by engine market share (ChatGPT 35%, Gemini 35%, Claude 20%, Perplexity 10%).
        </ProseP>
        <ProseP>
          The full audit takes 3–8 minutes and requires no manual configuration. <Link href="/methodology"><span style={{ color: "#7c3aed", textDecoration: "underline", cursor: "pointer" }}>Full methodology →</span></Link>
        </ProseP>
      </Section>

      <Section title="What you do with GEO audit results">
        <ProseList items={[
          "Close citation source gaps — get listed on the platforms your competitors are cited from that you're missing",
          "Fix entity consistency issues — your brand description, category, and location should be identical across all platforms",
          "Build content that answers the specific buyer prompts where you're absent",
          "Track your GEO score over time — re-audit monthly to measure the impact of content and PR activity",
          "Report AI visibility as a KPI alongside traditional SEO metrics",
        ]} />
      </Section>

      <Section title="GEO audit vs SEO audit: the difference">
        <ProseP>
          A traditional SEO audit checks technical crawlability, on-page optimisation, and backlink authority. These signals matter for Google rankings. A GEO audit checks AI citation frequency, source coverage, and entity consistency — the signals that determine whether AI engines recommend your brand.
        </ProseP>
        <ProseP>
          Both audits are complementary. Strong SEO signals help GEO performance because AI models partially draw on content that ranks well. But GEO requires additional actions that SEO audits don't cover — particularly citation source coverage and prompt-matched content. <Link href="/blog/geo-vs-seo"><span style={{ color: "#7c3aed", textDecoration: "underline", cursor: "pointer" }}>GEO vs SEO explained →</span></Link>
        </ProseP>
      </Section>

      <Section title="Who needs a GEO audit">
        <ProseList items={[
          "Any brand selling in a category where buyers research AI engines before making a decision",
          "Agencies adding GEO and AI visibility to their client service offering",
          "B2B SaaS companies whose buyers evaluate tools via ChatGPT comparisons",
          "Local service businesses checking AI local recommendations in their area",
          "Marketing teams who have run SEO and PR campaigns and want to see if they moved AI visibility",
        ]} />
      </Section>

      <CTABox />
    </SEOLayout>
  );
}

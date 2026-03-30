import { SEOLayout, PageHero, Section, ProseP, ProseList, CTABox } from "./SEOLayout";

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid rgba(99,102,241,0.12)", borderRadius: 12,
      padding: "20px 22px", boxShadow: "0 1px 8px rgba(99,102,241,0.07)",
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>{desc}</div>
    </div>
  );
}

export default function AiSearchVisibilitySoftware() {
  return (
    <SEOLayout
      title="AI Search Visibility Software | AnswerMonk"
      description="AnswerMonk is AI search visibility software that measures how your brand appears in ChatGPT, Gemini, Claude, and Perplexity. Track share of voice, benchmark competitors, and close citation gaps."
    >
      <PageHero
        eyebrow="Product"
        headline="AI search visibility software for brands and agencies"
        sub="AnswerMonk measures how often your brand appears in AI-generated answers across ChatGPT, Gemini, Claude, and Perplexity — then shows exactly what competitors are doing better."
      />

      <Section title="What AI search visibility software does">
        <ProseP>
          Traditional SEO tools track keyword rankings. AI search visibility software tracks something different: how often your brand is named when a buyer asks ChatGPT, Gemini, Claude, or Perplexity for a recommendation in your category.
        </ProseP>
        <ProseP>
          The gap between these two metrics is growing. A brand can rank on page one of Google and be completely absent from AI-generated answers — or vice versa. Without software that directly measures AI citation frequency, you have no visibility into this channel.
        </ProseP>
      </Section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 40 }}>
        <FeatureCard title="Prompt network generation" desc="Automatically builds 25–30 intent-based buyer prompts for your category from your domain. No manual input required." />
        <FeatureCard title="Cross-engine scoring" desc="Every prompt runs across ChatGPT, Gemini, Claude, and Perplexity simultaneously. Results weighted by engine market share." />
        <FeatureCard title="Share-of-voice score" desc="A single 0–100 composite score summarising how often and how prominently your brand appears across all engines and queries." />
        <FeatureCard title="Competitor leaderboard" desc="See every brand AI recommends in your category, ranked by citation frequency. Understand the gap and which sources drive it." />
        <FeatureCard title="Citation source breakdown" desc="Identifies the third-party platforms — review sites, directories, publications — that are generating AI recommendations in your category." />
        <FeatureCard title="Segment-level visibility" desc="Breaks down visibility by service type, customer persona, and location so you know exactly where the gaps are." />
      </div>

      <Section title="Who uses AI search visibility software">
        <ProseList items={[
          "Brand and marketing teams tracking whether campaign and PR activity moves AI citation frequency",
          "Agencies offering AI visibility audits as part of their GEO or AEO service",
          "B2B SaaS companies monitoring whether ChatGPT recommends them for their target use cases",
          "Local businesses and franchises checking whether AI engines recommend them for location-based queries",
          "Ecommerce brands tracking AI product recommendations in their category",
          "In-house SEO teams adding AI visibility as a KPI alongside traditional organic metrics",
        ]} />
      </Section>

      <Section title="How AnswerMonk differs from traditional SEO tools">
        <ProseP>
          Tools like Ahrefs and Semrush measure Google rankings and backlink profiles. They do not query AI engines, do not measure citation frequency, and do not show competitor share of voice in AI responses. They are built for a world where search means a list of ten blue links.
        </ProseP>
        <ProseP>
          AnswerMonk is built for the parallel world where buyers get a direct AI-generated recommendation — and that recommendation determines which brands get consideration. The measurement approach is fundamentally different: prompt generation → live API queries → appearance tracking → share-of-voice scoring.
        </ProseP>
        <ProseList items={[
          "Measures AI engine outputs directly — no proxies, no estimates",
          "Generates prompts automatically from your domain — no keyword research required",
          "Covers ChatGPT, Gemini, Claude, and Perplexity in a single run",
          "Returns results in 3–8 minutes",
          "Shows competitor data at the same time — not just your own score",
        ]} />
      </Section>

      <Section title="What a typical report contains">
        <ProseList items={[
          "Your brand's overall AI share-of-voice score",
          "Engine-by-engine breakdown: appearance rate on ChatGPT, Gemini, Claude, and Perplexity separately",
          "Full competitor ranking by citation share across all engines",
          "Citation source map: the top platforms generating AI mentions in your category",
          "Gap analysis: which query types and segments your brand is missing",
          "Action recommendations based on citation source patterns",
        ]} />
      </Section>

      <CTABox />
    </SEOLayout>
  );
}

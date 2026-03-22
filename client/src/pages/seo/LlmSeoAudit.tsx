import { SEOLayout, PageHero, Section, ProseP, ProseList, CTABox } from "./SEOLayout";
import { Link } from "wouter";

export default function LlmSeoAudit() {
  return (
    <SEOLayout
      title="LLM SEO Audit — Optimize Your Brand for AI Search | AnswerMonk"
      description="An LLM SEO audit measures and improves your brand's visibility in large language model responses. Track AI citations, appearance rates, and competitor gaps across ChatGPT, Gemini, and Claude."
    >
      <PageHero
        eyebrow="LLM SEO Audit"
        headline="LLM SEO audit — optimize your brand for AI search"
        sub="Large language models are now a primary discovery surface for brands. An LLM SEO audit measures your current visibility and identifies the specific gaps preventing you from appearing in AI-generated recommendations."
      />

      <Section title="What is LLM SEO?">
        <ProseP>
          LLM SEO — sometimes called <Link href="/glossary/generative-engine-optimization"><span style={{ color: "#7c3aed", textDecoration: "underline", cursor: "pointer" }}>Generative Engine Optimization (GEO)</span></Link> — is the practice of improving a brand's presence in AI-generated answers. Where traditional SEO optimizes for ranked URL positions in search engines, LLM SEO optimizes for brand mentions in the synthesized responses that ChatGPT, Gemini, Claude, and Perplexity generate.
        </ProseP>
        <ProseP>
          The key difference: SEO is about getting clicks. LLM SEO is about being named. When an AI engine answers "What is the best [product] for [use case]?", the brands it names have already won the recommendation — before the user clicks anything.
        </ProseP>
      </Section>

      <Section title="What an LLM SEO audit covers">
        <ProseList items={[
          "AI appearance rate — how often your brand is mentioned across tested prompts and engines",
          "Share of voice — your brand's weighted score relative to all competitors named by AI engines",
          "Engine-level breakdown — your visibility profile on ChatGPT, Gemini, Claude, and Perplexity separately",
          "Competitor benchmarking — who the AI engines recommend instead of, or alongside, your brand",
          "Citation source gaps — which third-party platforms drive AI recommendations in your category that you are not listed on",
          "Prompt coverage gaps — which buyer query types your brand is missing from entirely",
        ]} />
      </Section>

      <Section title="How LLM SEO differs from traditional SEO">
        <ProseList items={[
          "Signals: LLM visibility is driven more by citation breadth, entity clarity, and third-party review presence than by on-page keyword optimization and backlinks",
          "Measurement: LLM SEO uses appearance rate and share of voice; traditional SEO uses keyword rankings and organic traffic",
          "Competition: your AI search competitors may not be your SEO competitors — AI engines construct their own competitive set based on training data",
          "Ranking: LLM responses do not have a fixed ranking algorithm; they vary across sessions and model versions",
          "Attribution: traffic from LLM recommendations is hard to attribute — there is often no referral click",
        ]} />
      </Section>

      <Section title="What happens after an LLM SEO audit">
        <ProseP>
          The audit surfaces a prioritized action list. The most common first actions are:
        </ProseP>
        <ProseList items={[
          "Close citation source gaps — get listed on the review platforms and directories AI engines use for your category",
          "Create citable content — methodology pages, comparison pages, use-case pages, and glossary content that AI engines can reference",
          "Strengthen entity signals — consistent brand name, description, and category association across all platforms",
          "Build third-party mentions — press coverage and editorial placement in indexed publications",
        ]} />
      </Section>

      <Section title="How often to run an LLM SEO audit">
        <ProseP>
          AI models are retrained periodically, and the competitive landscape in AI search changes faster than traditional search. A monthly audit cadence is appropriate for most brands actively working to improve their AI visibility. A quarterly cadence is sufficient for tracking and reporting without active optimization.
        </ProseP>
      </Section>

      <CTABox />
    </SEOLayout>
  );
}

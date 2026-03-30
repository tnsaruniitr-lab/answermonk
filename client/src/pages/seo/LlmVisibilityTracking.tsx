import { Link } from "wouter";
import { SEOLayout, PageHero, Section, ProseP, ProseList, CTABox } from "./SEOLayout";

export default function LlmVisibilityTracking() {
  return (
    <SEOLayout
      title="LLM Visibility Tracking — Monitor Your Brand in AI Search | AnswerMonk"
      description="Track how your brand appears in ChatGPT, Gemini, Claude, and Perplexity over time. LLM visibility tracking with AnswerMonk shows citation frequency, share of voice trends, and competitor movements."
    >
      <PageHero
        eyebrow="LLM Monitoring"
        headline="LLM visibility tracking: monitor your brand across AI engines"
        sub="ChatGPT, Gemini, Claude, and Perplexity are recommending brands to buyers every day. LLM visibility tracking tells you how often your brand is one of them — and whether that's changing."
      />

      <Section title="Why LLM visibility needs ongoing tracking">
        <ProseP>
          A one-time AI audit tells you where you stand today. LLM visibility tracking tells you whether your position is improving or deteriorating — and why.
        </ProseP>
        <ProseP>
          AI engines change their outputs continuously as models are updated, as new content enters retrieval indexes, and as the competitive landscape in your category shifts. A brand that appears prominently in ChatGPT responses this month may not next month. A competitor that was invisible last quarter may have caught up. Without tracking, you have no early warning and no way to measure whether your GEO and AEO actions are working.
        </ProseP>
      </Section>

      <Section title="What LLM visibility tracking monitors">
        <ProseList items={[
          "Share-of-voice score over time: your composite citation frequency across all engines for all prompts in your category",
          "Engine-level trends: changes in appearance rate on ChatGPT, Gemini, Claude, and Perplexity individually",
          "Competitor movement: which brands are gaining or losing AI citation share in your category",
          "Citation source changes: whether new sources are driving recommendations or established ones are losing influence",
          "Prompt-level shifts: which specific buyer queries you've gained or lost visibility on between periods",
          "Segment performance: whether specific service types or personas are trending differently",
        ]} />
      </Section>

      <Section title="When to re-audit (and why timing matters)">
        <ProseP>
          The most valuable comparison points align with actions you've taken:
        </ProseP>
        <ProseList items={[
          "After joining a new review platform or directory — measure whether citation frequency changed",
          "After a PR campaign or press coverage push — track whether AI retrieval picked it up",
          "After publishing new FAQ or use-case content — see if it improved prompt-level appearance",
          "After a competitor makes a major move — check whether their AI citation share jumped",
          "Monthly cadence as a baseline — catch organic drift before it compounds",
        ]} />
        <ProseP>
          LLM outputs can shift significantly within 4–6 weeks after any major content or citation change. Monthly tracking catches these shifts early enough to respond.
        </ProseP>
      </Section>

      <Section title="What tracking reveals that a one-time audit misses">
        <ProseList items={[
          "Seasonal patterns — some categories see higher AI recommendation frequency at specific times of year",
          "Model update effects — when OpenAI, Google, or Anthropic update their models, citation patterns can shift materially",
          "Competitor catch-up — brands that were far behind often improve faster than leaders expect",
          "Content decay — AI engines stop citing sources that become outdated; freshness of your citation sources matters",
          "New query types — as buyers' AI usage evolves, new prompt patterns emerge that your current content may not cover",
        ]} />
      </Section>

      <Section title="How to set up LLM visibility tracking with AnswerMonk">
        <ProseP>
          Run your initial audit to establish a baseline. AnswerMonk generates your prompt network — the 25–30 buyer prompts in your category — and runs them across all four major LLMs. The results give you your starting share-of-voice score, competitor ranking, and citation source map.
        </ProseP>
        <ProseP>
          Re-run the audit after each significant action or at your chosen cadence. Compare results period over period: which prompts moved, which engines showed changes, which competitors shifted. The pattern of change points directly to what's working and what to do next.
        </ProseP>
        <ProseP>
          <Link href="/start"><span style={{ color: "#7c3aed", textDecoration: "underline", cursor: "pointer" }}>Run your baseline audit →</span></Link> · <Link href="/methodology"><span style={{ color: "#7c3aed", textDecoration: "underline", cursor: "pointer" }}>Methodology →</span></Link>
        </ProseP>
      </Section>

      <Section title="LLM tracking vs social listening vs SEO rank tracking">
        <ProseP>
          Social listening tools monitor brand mentions on social platforms. SEO rank trackers monitor Google keyword positions. LLM visibility tracking monitors a third channel: AI engine recommendation frequency.
        </ProseP>
        <ProseP>
          These three channels have significant overlap in outcome — a buyer who sees your brand on social, finds it on Google, and gets it recommended by ChatGPT is far more likely to convert than a buyer who only encounters it on one channel. But each requires its own measurement approach. LLM visibility tracking is the only way to know what's happening in the AI recommendation channel.
        </ProseP>
      </Section>

      <CTABox />
    </SEOLayout>
  );
}

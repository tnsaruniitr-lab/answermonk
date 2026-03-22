import { SEOLayout, PageHero, Section, ProseP, ProseList, CTABox } from "./SEOLayout";

const CONFIG: Record<string, {
  title: string;
  description: string;
  competitor: string;
  headline: string;
  sub: string;
  sections: { heading: string; body?: string; bullets?: string[] }[];
}> = {
  "answermonk-vs-profound": {
    title: "AnswerMonk vs Profound — AI Search Visibility Tools Compared",
    description: "Compare AnswerMonk and Profound for AI search visibility tracking. See how they differ on audit depth, engine coverage, citation analysis, and pricing.",
    competitor: "Profound",
    headline: "AnswerMonk vs Profound",
    sub: "Both tools track brand visibility in AI search. Here is how they differ on depth, engine coverage, methodology, and use case fit.",
    sections: [
      {
        heading: "What both tools do",
        body: "AnswerMonk and Profound both measure how brands appear in AI-generated search results. Both track appearance rates across AI engines and provide competitive benchmarking. The core problem they solve — AI search visibility is invisible without dedicated tooling — is the same.",
      },
      {
        heading: "Where AnswerMonk differs",
        bullets: [
          "Prompt network generation from your actual website — AnswerMonk crawls your domain to generate the prompts real buyers use for your specific segments, rather than relying on manually input keywords",
          "Citation source crawling — AnswerMonk crawls and classifies the sources AI engines cite in your category, showing which third-party platforms drive competitor visibility",
          "Free audit entry point — run a full audit without a paid subscription to see your baseline before committing",
          "Segment-level breakdown — visibility is reported per service type and customer persona, not just at the brand level",
        ],
      },
      {
        heading: "Engine coverage",
        body: "AnswerMonk tracks ChatGPT (OpenAI), Gemini (Google), Claude (Anthropic), and Perplexity. Coverage across AI engines matters because brands can have significantly different visibility profiles on different engines — appearing frequently on ChatGPT while being absent from Gemini, or vice versa.",
      },
      {
        heading: "Which tool fits which use case",
        bullets: [
          "AnswerMonk is a strong fit for brands and agencies wanting a fast, free baseline audit with deep citation analysis",
          "Profound is known for enterprise-scale tracking and integrations with marketing data stacks",
          "For teams running frequent audits across multiple client domains, compare the per-audit cost structures before committing",
        ],
      },
      {
        heading: "The question to ask before choosing",
        body: "The most important question is not which interface you prefer — it is whether the tool generates prompts that match how your buyers actually use AI search. A tool that tracks the wrong queries produces a misleading visibility score. AnswerMonk's approach of generating prompts from your website content is designed to match real buyer intent in your specific category.",
      },
    ],
  },
  "answermonk-vs-ahrefs-brand-radar": {
    title: "AnswerMonk vs Ahrefs Brand Radar — AI Visibility Tools Compared",
    description: "Compare AnswerMonk and Ahrefs Brand Radar for tracking brand mentions in AI search. See differences in methodology, engine coverage, and use cases.",
    competitor: "Ahrefs Brand Radar",
    headline: "AnswerMonk vs Ahrefs Brand Radar",
    sub: "Ahrefs Brand Radar and AnswerMonk both track brand mentions in AI search. Here is what sets them apart.",
    sections: [
      {
        heading: "The shared goal",
        body: "Both AnswerMonk and Ahrefs Brand Radar are built around the same insight: brands need to track their visibility in AI-generated answers, not just traditional search rankings. Both tools query AI engines, record brand mentions, and provide competitive comparison.",
      },
      {
        heading: "Context matters for Ahrefs Brand Radar",
        body: "Ahrefs Brand Radar lives within the broader Ahrefs SEO suite, making it a natural addition for teams already using Ahrefs for backlink and keyword data. For those users, Brand Radar provides AI visibility data inside their existing workflow. The trade-off is that it is not available as a standalone tool — access requires an Ahrefs subscription.",
      },
      {
        heading: "Where AnswerMonk is different",
        bullets: [
          "Standalone and accessible — run an AI search audit without an existing SEO tool subscription",
          "Website-driven prompt generation — prompts are generated from your actual website content to match buyer intent in your specific segment, not from a generic keyword list",
          "Citation source intelligence — AnswerMonk surfaces which third-party sites drive AI recommendations in your category, giving a clear action list",
          "Free audit — no subscription required to see your baseline visibility score",
          "Segment-level reporting — visibility broken down by service type and customer persona, not just brand level",
        ],
      },
      {
        heading: "If you already use Ahrefs",
        body: "For teams running Ahrefs, Brand Radar is worth enabling as an additional signal layer. It is not a replacement for a deeper prompt-level audit. The most complete view of AI search visibility comes from combining traditional SEO data (where Ahrefs excels) with prompt-level AI visibility measurement focused on buyer intent (where AnswerMonk specializes).",
      },
      {
        heading: "Bottom line",
        body: "Choose based on your starting point. If you are already in the Ahrefs ecosystem and want a quick AI visibility layer, Brand Radar is convenient. If you want a standalone, deeper audit that surfaces citation source gaps and generates buyer-intent prompts from your website, AnswerMonk is the more purpose-built option.",
      },
    ],
  },
};

export default function ComparePage({ competitor }: { competitor: string }) {
  const cfg = CONFIG[competitor] || CONFIG["answermonk-vs-profound"];
  return (
    <SEOLayout title={cfg.title} description={cfg.description}>
      <PageHero eyebrow={`Compare — AnswerMonk vs ${cfg.competitor}`} headline={cfg.headline} sub={cfg.sub} />
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

import { SEOLayout, PageHero, Section, ProseP, ProseList, CTABox } from "./SEOLayout";

export default function AiSearchCompetitorAnalysis() {
  return (
    <SEOLayout
      title="AI Search Competitor Analysis | AnswerMonk"
      description="See which brands dominate AI search in your category. AnswerMonk's AI search competitor analysis shows competitor citation share, source coverage, and prompt-level advantages — across ChatGPT, Gemini, Claude, and Perplexity."
    >
      <PageHero
        eyebrow="Competitive Intelligence"
        headline="AI search competitor analysis: see who dominates AI recommendations in your category"
        sub="Which brands does ChatGPT recommend instead of yours? What sources are driving their advantage? AI search competitor analysis answers both questions in a single audit."
      />

      <Section title="What AI search competitor analysis reveals">
        <ProseP>
          Traditional competitive intelligence tools show backlink profiles, keyword rankings, and estimated traffic. They tell you what's happening on Google. AI search competitor analysis shows what's happening in the channel Google doesn't see: the AI recommendation layer.
        </ProseP>
        <ProseP>
          When a buyer asks ChatGPT "what is the best [your category]?", the AI names two or three brands. An AI search competitor analysis tells you which brands those are, how consistently they appear, which queries trigger them, and — critically — why AI engines favour them over your brand.
        </ProseP>
      </Section>

      <Section title="What the competitor analysis includes">
        <ProseList items={[
          "Full competitor leaderboard: every brand AI recommends in your category, ranked by weighted citation share across all engines",
          "Engine-level breakdown: which competitors dominate on ChatGPT vs Gemini vs Claude vs Perplexity",
          "Query-level data: which specific buyer prompts trigger competitor recommendations that your brand misses",
          "Citation source map: which review platforms, directories, and publications are feeding competitor visibility",
          "Gap analysis: the sources your competitors appear on that you don't — the highest-leverage actions",
          "Prompt-segment data: whether competitor advantages are category-wide or concentrated in specific service types or personas",
        ]} />
      </Section>

      <Section title="How the analysis is generated">
        <ProseP>
          AnswerMonk builds a full prompt network for your category — 25–30 buyer prompts representing the natural-language questions AI users ask about your space. These prompts are fired against ChatGPT, Gemini, Claude, and Perplexity. Every brand named in every response is recorded. Citation sources are crawled and classified.
        </ProseP>
        <ProseP>
          The output is a ranked leaderboard with your brand's position, every competitor's position, and the gap between them measured in citation share percentage points. You see not just who's ahead, but by how much and across which queries.
        </ProseP>
      </Section>

      <Section title="How to close the gap on competitors who are ahead">
        <ProseP>
          The most consistent pattern in AI search competitive gaps is citation source coverage. Brands that dominate AI responses are listed, with complete and reviewed profiles, on the top two to four platforms in their category. Brands that are behind are missing from one or more of these platforms — or have thin, unreviewed profiles.
        </ProseP>
        <ProseList items={[
          "Identify every citation platform your top competitors appear on — this is the first output of the analysis",
          "Claim and fully complete profiles on any platform you're missing",
          "Build review volume on platforms where your profile exists but has fewer reviews than leading competitors",
          "Create content that directly answers the buyer prompts where competitors appear and you don't",
          "Publish comparison content (your brand vs each major competitor) — AI engines frequently cite these pages",
          "Track citation share monthly to confirm that gaps are closing",
        ]} />
      </Section>

      <Section title="How this differs from traditional competitive SEO analysis">
        <ProseP>
          SEO competitive analysis compares domain authority, backlink profiles, and keyword overlap. It tells you who ranks above you on Google and why. AI search competitor analysis compares citation frequency, source coverage, and prompt-level appearance — a completely different dataset reflecting a completely different distribution channel.
        </ProseP>
        <ProseP>
          A competitor with a weaker SEO profile can dominate AI search if they have comprehensive review platform presence and consistent third-party mentions. And a brand with strong Google rankings can be nearly invisible in AI responses if their citation source coverage is thin. Both analyses are necessary. Neither replaces the other.
        </ProseP>
      </Section>

      <Section title="Who uses AI search competitor analysis">
        <ProseList items={[
          "Brand and marketing teams tracking competitor movements in AI recommendation channels",
          "Agencies building AI visibility strategies for clients who want to close specific competitor gaps",
          "B2B SaaS companies monitoring how AI engines compare them to direct competitors",
          "Category leaders checking whether challengers are gaining AI citation share",
          "New market entrants identifying the fastest path to AI recommendation parity",
        ]} />
      </Section>

      <CTABox />
    </SEOLayout>
  );
}

import { Link } from "wouter";
import { SEOLayout, PageHero, Section, ProseP, ProseList, CTABox } from "./SEOLayout";

export default function AeoAudit() {
  return (
    <SEOLayout
      title="AEO Audit — Answer Engine Optimization Audit | AnswerMonk"
      description="An AEO audit measures how your brand appears in AI answer engines — ChatGPT, Gemini, Claude, and Perplexity. Run an answer engine optimization audit in minutes."
    >
      <PageHero
        eyebrow="AEO Audit"
        headline="AEO audit: measure your visibility in AI answer engines"
        sub="Answer engine optimization (AEO) is about appearing in the direct answers AI gives buyers. An AEO audit tells you where your brand stands — and what it will take to change it."
      />

      <Section title="What is AEO (answer engine optimization)?">
        <ProseP>
          Answer engine optimization is the practice of improving a brand's visibility in AI-generated answers. Where SEO targets Google's ranked result list, AEO targets the conversational responses that ChatGPT, Gemini, Claude, and Perplexity generate when users ask buying questions.
        </ProseP>
        <ProseP>
          These AI engines are answer engines, not search engines. They don't return a list of links for the user to choose from — they synthesise a direct recommendation. The brand named in that recommendation gets the click, the consideration, and often the sale. The brand not named gets nothing.
        </ProseP>
      </Section>

      <Section title="What an AEO audit measures">
        <ProseList items={[
          "Citation frequency: how often your brand appears in AI answers for buyer queries in your category",
          "Share of voice: your brand's weighted appearance rate relative to every competitor named by AI engines",
          "Engine breakdown: your appearance rate on ChatGPT, Gemini, Claude, and Perplexity individually",
          "Query coverage: which specific buyer prompts trigger a mention of your brand vs which do not",
          "Citation sources: which third-party platforms are feeding AI engines information about your category",
          "Competitor positioning: which brands appear alongside or instead of yours, and how consistently",
        ]} />
      </Section>

      <Section title="The key AEO signals this audit evaluates">
        <ProseP>
          AI answer engines draw on several types of signals when forming recommendations. An AEO audit evaluates your brand's performance across all of them:
        </ProseP>
        <ProseList items={[
          "Citation source coverage — are you listed on the review platforms, directories, and industry lists that AI engines retrieve?",
          "Entity consistency — does your brand appear with the same name, description, and category across all platforms?",
          "Content relevance — does your website have pages that directly answer the buyer questions being asked?",
          "Schema markup — do you have Organization, FAQPage, and HowTo structured data signalling your brand to AI crawlers?",
          "Third-party mention volume — do AI engines encounter your brand frequently across indexed sources?",
          "Recency — how recently have you been mentioned in sources that AI engines retrieve?",
        ]} />
      </Section>

      <Section title="How the AEO audit runs">
        <ProseP>
          Enter your domain. AnswerMonk's prompt network creator automatically generates 25–30 buyer prompts for your category — the natural-language questions your customers are submitting to AI answer engines. No keyword research required.
        </ProseP>
        <ProseP>
          Each prompt is sent to ChatGPT, Gemini, Claude, and Perplexity via live API. Responses are parsed for brand mentions, position, and citation sources. Results are aggregated and scored. The full run takes 3–8 minutes. You see your share-of-voice score, the full competitor leaderboard, and the citation sources driving results in your category.
        </ProseP>
        <ProseP>
          <Link href="/methodology"><span style={{ color: "#7c3aed", textDecoration: "underline", cursor: "pointer" }}>Full methodology and scoring explanation →</span></Link>
        </ProseP>
      </Section>

      <Section title="What changes after an AEO audit">
        <ProseP>
          The most common action after an AEO audit is closing citation source gaps. In most categories, three to five platforms (review sites, directories, or publications) generate the majority of AI recommendations. Brands that dominate AI responses are almost always listed on all of them with complete, reviewed profiles. Brands that are absent from AI responses often have gaps on one or more of these platforms.
        </ProseP>
        <ProseList items={[
          "List and complete profiles on every citation platform your competitors are cited from",
          "Build FAQ and HowTo content that directly answers the buyer prompts AI engines are processing",
          "Add Organization and FAQPage schema markup to key pages on your site",
          "Pursue press coverage in publications that AI engines frequently cite in your category",
          "Re-audit monthly to track whether your citation share is moving",
        ]} />
      </Section>

      <Section title="AEO vs GEO vs SEO: which one do you need?">
        <ProseP>
          AEO and GEO are often used interchangeably — both describe optimisation for AI-generated responses. The key distinction from SEO is that SEO targets ranked result lists, while AEO/GEO targets conversational answers. If your buyers are using ChatGPT, Gemini, Claude, or Perplexity to research your category, you need AEO/GEO — not just SEO.
        </ProseP>
        <ProseP>
          <Link href="/blog/geo-vs-seo"><span style={{ color: "#7c3aed", textDecoration: "underline", cursor: "pointer" }}>GEO vs SEO: the full breakdown →</span></Link>
        </ProseP>
      </Section>

      <CTABox />
    </SEOLayout>
  );
}

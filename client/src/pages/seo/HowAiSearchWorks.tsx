import { SEOLayout, PageHero, Section, ProseP, ProseList, CTABox } from "./SEOLayout";
import { Link } from "wouter";

export default function HowAiSearchWorks() {
  return (
    <SEOLayout
      title="How AI Search Works — ChatGPT, Gemini, Perplexity Explained | AnswerMonk"
      description="Understand how AI search engines like ChatGPT, Gemini, Claude, and Perplexity generate answers and why some brands get recommended while others don't."
    >
      <PageHero
        eyebrow="Education"
        headline="How AI search works — and why it matters for brands"
        sub="AI search engines don't return a list of links. They generate a recommended answer. Understanding how they do this is the first step to appearing in them."
      />

      <Section title="Traditional search vs AI search">
        <ProseP>
          Traditional search engines like Google return a ranked list of URLs. Users click through and read the source. The entire game is about being one of the top ten links.
        </ProseP>
        <ProseP>
          AI search engines — ChatGPT, Gemini, Claude, Perplexity — generate a synthesized answer directly. Instead of ten blue links, users get a paragraph or a numbered list that names specific brands, tools, or services. There is no link to click through to, because the answer is already there.
        </ProseP>
        <ProseP>
          The implication for brands: you either appear in the answer, or you don't exist. There is no page-two consolation prize.
        </ProseP>
      </Section>

      <Section title="The four major AI search engines">
        <ProseP>
          <strong>ChatGPT (OpenAI)</strong> — The most widely used AI assistant globally. As of 2025, ChatGPT processes hundreds of millions of queries per day. Its recommendations are drawn from training data and, in some queries, live web search. It carries the highest weight in most AI visibility analyses because of its reach.
        </ProseP>
        <ProseP>
          <strong>Gemini (Google)</strong> — Google's AI model, integrated deeply into Search through AI Overviews. Gemini draws on Google's web index, making it heavily influenced by traditional SEO signals. Any brand ranking well in Google has a structural advantage in Gemini, but it is not guaranteed.
        </ProseP>
        <ProseP>
          <strong>Claude (Anthropic)</strong> — Known for nuanced, detailed responses. Claude is increasingly used for research-oriented queries and professional tasks. It tends to name established, well-documented brands rather than newer ones with thinner online footprints.
        </ProseP>
        <ProseP>
          <strong>Perplexity</strong> — A search-native AI that always runs live web retrieval before answering. It cites sources explicitly, making it one of the more transparent AI engines for understanding which third-party sites drive recommendations.
        </ProseP>
      </Section>

      <Section title="How AI engines decide which brands to mention">
        <ProseP>
          AI engines do not have a ranking algorithm in the traditional sense. They synthesize answers based on patterns in their training data and, where applicable, live web retrieval. Several factors influence which brands appear:
        </ProseP>
        <ProseList items={[
          "Training data frequency — brands that appear often in credible web sources are more likely to appear in AI responses",
          "Third-party citations — review platforms, directories, and industry publications that mention a brand feed its AI presence",
          "Entity clarity — brands with a clear, consistent description across the web are easier for AI to identify and recommend confidently",
          "Category association — being explicitly associated with a service category in training data determines which queries trigger a brand mention",
          "Recency — models with web retrieval give weight to recent mentions; those without may underweight newer brands",
        ]} />
      </Section>

      <Section title="Why AI search visibility is different from SEO">
        <ProseP>
          SEO targets specific URLs and keyword rankings. AI search visibility is about entity presence — whether the AI model recognizes your brand as a credible answer to a category of questions.
        </ProseP>
        <ProseP>
          A brand can rank #1 in Google for "best project management software" and still not be mentioned by ChatGPT in the same query. The signals are related but not identical. AI models weight synthesis and citation breadth differently from search engine ranking algorithms.
        </ProseP>
        <ProseP>
          This is why <Link href="/methodology"><span style={{ color: "#7c3aed", textDecoration: "underline", cursor: "pointer" }}>measuring AI visibility separately</span></Link> matters — your traditional SEO score does not predict your AI search score.
        </ProseP>
      </Section>

      <Section title="What happens when a buyer uses AI to find your category">
        <ProseP>
          A buyer types "What is the best [your service] for [your customer type]?" into ChatGPT. The model generates a list of three to five options. If your brand is not among them, that buyer may never visit your site. The AI made the decision on their behalf.
        </ProseP>
        <ProseP>
          This pattern is already dominant in B2B SaaS, where developers and operators routinely use ChatGPT to evaluate tools before even visiting a vendor website. It is rapidly expanding into local services, ecommerce, and professional services.
        </ProseP>
      </Section>

      <CTABox />
    </SEOLayout>
  );
}

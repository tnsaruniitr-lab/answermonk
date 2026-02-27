import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

interface CompetitorContext {
  name: string;
  rank: number;
  share: number;
  appearances: number;
  totalRuns: number;
  perEngine: Record<string, { appearances: number; totalRuns: number; avgRank: number | null }>;
  crossEngineConsistency: "strong" | "moderate" | "weak";
  authoritySources: Array<{ domain: string; tier: string }>;
  allMentionSentences: Array<{ sentence: string; engine: string; prompt?: string }>;
  segmentLabel: string;
  brandName: string;
}

export async function generateCompetitorNarrative(ctx: CompetitorContext): Promise<string> {
  const engineSummaries = Object.entries(ctx.perEngine)
    .filter(([, s]) => s.appearances > 0)
    .map(([e, s]) => `${e}: ${s.appearances}/${s.totalRuns} runs${s.avgRank ? `, avg rank #${s.avgRank}` : ""}`)
    .join("; ");

  const t1Sources = ctx.authoritySources.filter(s => s.tier === "T1").map(s => s.domain);
  const t2Sources = ctx.authoritySources.filter(s => s.tier === "T2").map(s => s.domain);
  const t3Sources = ctx.authoritySources.filter(s => s.tier === "T3").map(s => s.domain);

  const sampleSentences = ctx.allMentionSentences.slice(0, 20);
  const groupedByEngine: Record<string, string[]> = {};
  for (const s of sampleSentences) {
    if (!groupedByEngine[s.engine]) groupedByEngine[s.engine] = [];
    groupedByEngine[s.engine].push(s.sentence);
  }

  const quotesBlock = Object.entries(groupedByEngine)
    .map(([engine, sentences]) => `--- ${engine.toUpperCase()} ---\n${sentences.map(s => `• ${s}`).join("\n")}`)
    .join("\n\n");

  const sourceSummary = [
    ...t1Sources.map(s => `${s} (T1)`),
    ...t2Sources.map(s => `${s} (T2)`),
    ...t3Sources.slice(0, 4).map(s => `${s} (T3)`),
  ].slice(0, 6).join(", ") || "none found";

  const prompt = `Analyze why "${ctx.name}" ranks #${ctx.rank} in AI recommendations for "${ctx.segmentLabel}". Brand under analysis: "${ctx.brandName}".

DATA:
- Appearance: ${Math.round(ctx.share * 100)}% (${ctx.appearances}/${ctx.totalRuns} runs)
- Engines: ${engineSummaries}
- Cross-engine consistency: ${ctx.crossEngineConsistency}
- Authority sources cited alongside: ${sourceSummary}

VERBATIM AI ENGINE EXCERPTS:
${quotesBlock}

Respond in EXACTLY this structure (use these exact headers, keep each section to 1-2 lines max):

**Core Positioning:** What identity/context do AI engines associate with this brand? (e.g. "positioned as X with emphasis on Y")

**Key LLM Mentions:**
- [Engine]: "[short verbatim quote]" — what this signals
- [Engine]: "[short verbatim quote]" — what this signals
(include 2-3 engine-specific examples)

**Source Credibility:** Which authority sources back their ranking? Are they editorially strong (T1/T2) or mostly brand-driven? (1 line)

**Vulnerability:** Where is their positioning weak or attackable by ${ctx.brandName}? (1 line)

Rules: Be direct and specific. Use actual data from the excerpts. No filler. Total response under 200 words.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.2,
    });

    return response.choices[0]?.message?.content?.trim() || "";
  } catch (error) {
    console.error(`Failed to generate narrative for ${ctx.name}:`, error);
    return "";
  }
}

export function extractAllMentionSentences(
  competitorName: string,
  runs: Array<{ raw_text: string; engine: string; prompt_text?: string; candidates: any[] }>,
  maxPerEngine: number = 8,
): Array<{ sentence: string; engine: string; prompt?: string }> {
  const nameLC = competitorName.toLowerCase();
  const results: Array<{ sentence: string; engine: string; prompt?: string }> = [];
  const engineCounts: Record<string, number> = {};

  for (const run of runs) {
    if (!run.raw_text) continue;
    const engine = run.engine;
    if (!engineCounts[engine]) engineCounts[engine] = 0;
    if (engineCounts[engine] >= maxPerEngine) continue;

    const candidates = Array.isArray(run.candidates) ? run.candidates : [];
    const compFound = candidates.some((cand: any) => {
      const cn = typeof cand === "string" ? cand : (cand?.name_norm || cand?.name_raw || "");
      return cn.toLowerCase().includes(nameLC) || nameLC.includes(cn.toLowerCase());
    });
    if (!compFound) continue;

    const paragraphs = run.raw_text.split(/\n\n+/);
    for (const para of paragraphs) {
      if (engineCounts[engine] >= maxPerEngine) break;
      if (!para.toLowerCase().includes(nameLC)) continue;
      const cleaned = para
        .replace(/^#+\s*/gm, "")
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .trim();

      if (cleaned.length < 20 || cleaned.length > 800) continue;

      const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(s => s.length > 15);
      const relevantSentences = sentences.filter(s => s.toLowerCase().includes(nameLC));

      if (relevantSentences.length > 0) {
        const combined = relevantSentences.slice(0, 3).join(" ");
        const snippet = combined.length > 300 ? combined.substring(0, 300) + "..." : combined;
        results.push({ sentence: snippet, engine, prompt: run.prompt_text });
        engineCounts[engine]++;
      } else if (sentences.length > 0) {
        const snippet = sentences.slice(0, 2).join(" ");
        const trimmed = snippet.length > 300 ? snippet.substring(0, 300) + "..." : snippet;
        results.push({ sentence: trimmed, engine, prompt: run.prompt_text });
        engineCounts[engine]++;
      }
    }
  }

  return results;
}

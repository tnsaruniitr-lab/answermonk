import { classifyTier, type TierLabel } from "./tier-classifier";

interface RawRun {
  prompt_id: string;
  prompt_text?: string;
  cluster: string;
  engine: string;
  raw_text: string;
  citations?: { url: string; title?: string }[];
  candidates: any[];
  brand_found: boolean;
  brand_rank: number | null;
}

interface SegmentData {
  persona: string;
  seedType: string;
  customerType: string;
  location: string;
  resultCount: number;
  prompts: any[] | null;
  scoringResult: {
    score: {
      appearance_rate: number;
      primary_rate: number;
      avg_rank: number | null;
      valid_runs: number;
      competitors: { name: string; share: number; appearances: number }[];
      engine_breakdown: Record<string, { appearance_rate: number; primary_rate: number; valid_runs: number; total_runs: number; error_runs: number }>;
    };
    raw_runs: RawRun[];
  } | null;
}

export interface TeaserData {
  meta: {
    brandName: string;
    date: string;
    totalQueries: number;
    queriesPerEngine: number;
  };
  overallScore: {
    appearanceRate: number;
    avgRank: number | null;
    primaryRate: number;
    marketRank: number;
    competitorCount: number;
    leaderName: string;
    leaderRate: number;
  };
  engineSplit: Array<{
    engine: string;
    label: string;
    appearanceRate: number;
    primaryRate: number;
    color: "green" | "gold" | "red";
    note: string;
  }>;
  competitiveRanking: Array<{
    rank: number;
    name: string;
    share: number;
    isBrand: boolean;
  }>;
  proximityNote: string;
  segmentBreakdown: Array<{
    label: string;
    brandRank: number;
    brandVisibility: number;
    leaderName: string;
    leaderScore: number;
    gapPoints: number;
    opportunity: "high" | "closeable" | "stretch";
  }>;
  quoteContrast: {
    competitors: Array<{
      rank: number;
      name: string;
      sentence: string;
      engines: string[];
    }>;
    brand: {
      sentence: string | null;
      hasSentence: boolean;
    };
  };
  authorityGap: {
    domains: Array<{
      domain: string;
      tier: string;
      description: string;
      presence: Record<string, boolean>;
    }>;
    brandAbsentCount: number;
    totalT1Count: number;
  };
  brandVoice: Array<{
    engine: string;
    engineLabel: string;
    prompt: string;
    quote: string;
    problem: string;
    isStrong: boolean;
  }>;
  samplePrompts: Array<{
    promptText: string;
    brandRank: number | null;
    brandFound: boolean;
    winnerName: string;
    winnerRank: number;
  }>;
  socialThreads: Array<{
    platform: string;
    title: string;
    competitorsMentioned: string[];
    brandMentioned: boolean;
    engines: string[];
  }>;
  citationFootprint: {
    brandSources: number;
    leaderSources: number;
    leaderName: string;
    thirdPartyDomains: number;
    socialMentions: number;
  };
  topPlayerInsights: Array<{
    title: string;
    detail: string;
    sources?: string[];
  }>;
  keyActions: Array<{
    title: string;
    detail: string;
    priority: "critical" | "high" | "medium";
  }>;
  engineSegmentHeatmap: Array<{
    segmentLabel: string;
    engines: Record<string, number>;
  }>;
  citationScale: {
    totalCitationsCrawled: number;
    totalCitationPages: number;
    totalRuns: number;
    totalEngines: number;
  };
  promptShowdown: Array<{
    promptText: string;
    results: Array<{ engine: string; engineLabel: string; brandRank: number | null; brandFound: boolean; topResult: string }>;
    dateLabel: string;
  }>;
}

const ENGINE_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  claude: "Claude",
};

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function cleanQuoteText(text: string): string {
  let s = text;
  s = s.replace(/\(?\[?https?:\/\/[^\s)\]]*[)\]]*/g, "");
  s = s.replace(/[a-z0-9./-]+\.(com|co|ae|org|net|io|dev)\b[^\s)]*\)*/gi, "");
  s = s.replace(/utm_source=\w+\)*/g, "");
  s = s.replace(/\(\s*\)/g, "");
  s = s.replace(/\[\s*\]/g, "");
  s = s.replace(/\)+/g, " ");
  s = s.replace(/#{1,6}\s*/g, "");
  s = s.replace(/\*+/g, "");
  s = s.replace(/_{1,2}([^_]+)_{1,2}/g, "$1");
  s = s.replace(/`([^`]+)`/g, "$1");
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  s = s.replace(/\|/g, " ");
  s = s.replace(/:---?\s*/g, "");
  s = s.replace(/^[-*]\s+/gm, "");
  s = s.replace(/^\d+\)\s*/gm, "");
  s = s.replace(/^\d+\.\s*/gm, "");
  s = s.replace(/---+/g, " ");
  s = s.replace(/✓|✗|→|←/g, "");
  s = s.replace(/\s{2,}/g, " ");
  return s.trim();
}

function isCleanSentence(text: string): boolean {
  if (/\|.*\|/.test(text)) return false;
  if (/^:?---/.test(text)) return false;
  if ((text.match(/\d+/g) || []).length > 6) return false;
  if (/Summary Table|Ranking:|Selection Criteria/i.test(text)) return false;
  const words = text.split(/\s+/).filter(w => w.length > 2);
  if (words.length < 5) return false;
  return true;
}

function cleanLeadingArtifacts(text: string): string {
  let s = text;
  s = s.replace(/^\d+\s+/, "");
  s = s.replace(/^[–—-]\s*/, "");
  s = s.replace(/^\(\s*/, "");
  s = s.replace(/\(\s*$/g, "");
  s = s.replace(/\s*[–—-]\s*$/g, "");
  s = s.replace(/\s+,\s*$/g, "");
  let opens = 0;
  for (const ch of s) {
    if (ch === "(") opens++;
    if (ch === ")") opens--;
  }
  if (opens > 0) {
    for (let i = 0; i < opens; i++) s += ")";
  }
  if (opens < 0) {
    for (let i = 0; i < -opens; i++) s = s.replace(/\)/, "");
  }
  s = s.replace(/\s{2,}/g, " ");
  return s.trim();
}

function buildSegmentLabel(seg: SegmentData): string {
  const parts: string[] = [];
  if (seg.persona) {
    const persona = seg.persona.replace(/_/g, " ");
    parts.push(persona.charAt(0).toUpperCase() + persona.slice(1));
  }
  if (seg.customerType) {
    parts.push(parts.length > 0 ? `· ${seg.customerType}` : seg.customerType);
  }
  if (seg.location) {
    parts.push(parts.length > 0 ? `· ${seg.location}` : seg.location);
  }
  return parts.join(" ") || "General";
}

function splitIntoSentences(rawText: string): string[] {
  const lines = rawText.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
  const sentences: string[] = [];
  for (const line of lines) {
    const parts = line.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
    sentences.push(...parts);
  }
  return sentences;
}

function extractBrandSentences(runs: RawRun[], brandName: string): Map<string, string[]> {
  const engineSentences = new Map<string, string[]>();
  const brandLC = brandName.toLowerCase();

  for (const run of runs) {
    if (!run.brand_found || !run.raw_text) continue;
    const sentences = splitIntoSentences(run.raw_text).filter(s => s.toLowerCase().includes(brandLC));
    const cleaned = sentences.map(s => cleanQuoteText(s.trim())).filter(s => s.length > 30 && s.length < 300 && isCleanSentence(s));
    if (cleaned.length > 0) {
      const existing = engineSentences.get(run.engine) || [];
      existing.push(...cleaned);
      engineSentences.set(run.engine, existing);
    }
  }
  return engineSentences;
}

function extractCompetitorDefiningSentence(runs: RawRun[], compName: string): { sentence: string; engines: string[] } {
  const compLC = compName.toLowerCase();
  const engineSentences: Record<string, string[]> = {};

  for (const run of runs) {
    if (!run.raw_text) continue;
    const sentences = splitIntoSentences(run.raw_text)
      .map(s => cleanQuoteText(s))
      .filter(s => s.toLowerCase().includes(compLC) && s.length > 40 && s.length < 300 && isCleanSentence(s));

    if (sentences.length > 0) {
      if (!engineSentences[run.engine]) engineSentences[run.engine] = [];
      engineSentences[run.engine].push(...sentences);
    }
  }

  const engines = Object.keys(engineSentences);
  const allSentences = Object.values(engineSentences).flat();

  if (allSentences.length === 0) {
    return { sentence: `Mentioned across AI responses but no consistent defining narrative extracted.`, engines: [] };
  }

  const sorted = allSentences
    .map(s => ({
      text: s,
      score: s.length + (s.includes("award") ? 20 : 0) + (s.includes("specialist") ? 15 : 0) +
             (s.includes("leading") ? 15 : 0) + (s.includes("expertise") ? 10 : 0) +
             (s.includes("known for") ? 20 : 0) + (s.includes("recognised") ? 15 : 0) +
             (s.includes("recognized") ? 15 : 0) + (s.includes("top") ? 10 : 0),
    }))
    .sort((a, b) => b.score - a.score);

  let best = cleanLeadingArtifacts(sorted[0].text);
  if (!best.startsWith('"')) best = `"${best}"`;
  else if (!best.endsWith('"')) best = `${best}"`;

  return { sentence: best, engines };
}

function generateEngineNote(engine: string, label: string, rate: number, primaryRate: number, brandName: string): string {
  const pctVis = Math.round(rate * 100);
  const pctTop3 = Math.round(primaryRate * 100);
  if (rate <= 0) {
    return `<strong>0% visibility.</strong> Not appearing at all — highest-priority gap.`;
  }
  if (rate >= 0.7 && primaryRate >= 0.4) {
    return `<strong>${pctVis}% visibility · ${pctTop3}% Top-3.</strong> Strong inclusion; strong preference.`;
  }
  if (rate >= 0.7 && primaryRate < 0.4) {
    return `<strong>${pctVis}% visibility · ${pctTop3}% Top-3.</strong> Often mentioned, rarely recommended.`;
  }
  if (rate >= 0.3) {
    return `<strong>${pctVis}% visibility · ${pctTop3}% Top-3.</strong> Mentioned but rarely prioritised. ${label} is widely used for buyer research.`;
  }
  return `<strong>${pctVis}% visibility · ${pctTop3}% Top-3.</strong> Near-invisible. ${label} is a fast-growing AI platform — this gap compounds every month.`;
}

function generateVoiceProblem(quote: string, isStrong: boolean, brandName: string): string {
  if (isStrong) {
    return `<strong style="color: var(--green);">Strongest engine for ${brandName}.</strong> This description assigns a clearer identity with specific capabilities. The full audit shows how to replicate this language pattern on other engines.`;
  }
  const hasGeneric = /full.?service|based in|offering|experience across|multiple verticals/i.test(quote);
  const hasNoProof = !/award|recognised|recognized|certified|partner|leading|top|best|specialist/i.test(quote);

  if (hasGeneric && hasNoProof) {
    return `<strong>Problem:</strong> Functionally accurate, but generic. No differentiator, no proof point, no reason to choose ${brandName} over any other agency. The description triggers no selection.`;
  }
  if (hasGeneric) {
    return `<strong>Problem:</strong> Generic positioning. The description could apply to dozens of competitors. No unique value proposition is being communicated to AI engines.`;
  }
  if (hasNoProof) {
    return `<strong>Problem:</strong> No evidence or proof points. Competitors are described with awards, certifications, and specific expertise. ${brandName}'s description lacks any credibility signals.`;
  }
  return `<strong>Problem:</strong> The description is adequate but lacks the specificity and authority signals that top-ranked competitors receive. Compare to how AI describes the market leader.`;
}

function shouldMergeNames(a: string, b: string): boolean {
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();
  if (na === nb) return true;
  const ta = na.split(/\s+/);
  const tb = nb.split(/\s+/);
  if (ta.every(t => tb.includes(t))) return true;
  if (tb.every(t => ta.includes(t))) return true;
  if (na.length >= 4) {
    const re = new RegExp(`\\b${na.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (re.test(nb)) return true;
  }
  if (nb.length >= 4) {
    const re = new RegExp(`\\b${nb.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (re.test(na)) return true;
  }
  return false;
}

function recountCompetitorsFromRuns(
  runs: RawRun[],
  brandNameLC: string
): Map<string, number> {
  const allCandidateNames = new Set<string>();
  for (const run of runs) {
    for (const c of run.candidates || []) {
      if (c.name_raw) allCandidateNames.add(c.name_raw);
    }
  }

  const nameToGroup = new Map<string, string>();
  const groups: string[][] = [];
  const nameArr = Array.from(allCandidateNames);
  const assigned = new Set<string>();
  for (let i = 0; i < nameArr.length; i++) {
    if (assigned.has(nameArr[i])) continue;
    const group = [nameArr[i]];
    assigned.add(nameArr[i]);
    for (let j = i + 1; j < nameArr.length; j++) {
      if (assigned.has(nameArr[j])) continue;
      if (group.some(g => shouldMergeNames(g, nameArr[j]))) {
        group.push(nameArr[j]);
        assigned.add(nameArr[j]);
      }
    }
    groups.push(group);
  }

  for (const group of groups) {
    const canonical = group.reduce((a, b) => a.length <= b.length ? a : b);
    for (const name of group) {
      nameToGroup.set(name.toLowerCase(), canonical);
    }
  }

  const result = new Map<string, number>();
  for (const run of runs) {
    const seenGroups = new Set<string>();
    for (const c of run.candidates || []) {
      if (!c.name_raw) continue;
      const group = nameToGroup.get(c.name_raw.toLowerCase()) || c.name_raw;
      if (seenGroups.has(group)) continue;
      seenGroups.add(group);
      const groupLC = group.toLowerCase();
      if (groupLC.includes(brandNameLC) || brandNameLC.includes(groupLC)) continue;
      result.set(group, (result.get(group) || 0) + 1);
    }
  }

  return result;
}

function recountSegmentCompetitors(
  runs: RawRun[],
  validRuns: number,
): { name: string; share: number; appearances: number }[] {
  const allCandidateNames = new Set<string>();
  for (const run of runs) {
    for (const c of run.candidates || []) {
      if (c.name_raw) allCandidateNames.add(c.name_raw);
    }
  }

  const nameToGroup = new Map<string, string>();
  const nameArr = Array.from(allCandidateNames);
  const assigned = new Set<string>();
  for (let i = 0; i < nameArr.length; i++) {
    if (assigned.has(nameArr[i])) continue;
    const group = [nameArr[i]];
    assigned.add(nameArr[i]);
    for (let j = i + 1; j < nameArr.length; j++) {
      if (assigned.has(nameArr[j])) continue;
      if (group.some(g => shouldMergeNames(g, nameArr[j]))) {
        group.push(nameArr[j]);
        assigned.add(nameArr[j]);
      }
    }
    const canonical = group.reduce((a, b) => a.length <= b.length ? a : b);
    for (const name of group) {
      nameToGroup.set(name.toLowerCase(), canonical);
    }
  }

  const counts = new Map<string, number>();
  for (const run of runs) {
    const seenGroups = new Set<string>();
    for (const c of run.candidates || []) {
      if (!c.name_raw) continue;
      const group = nameToGroup.get(c.name_raw.toLowerCase()) || c.name_raw;
      if (seenGroups.has(group)) continue;
      seenGroups.add(group);
      counts.set(group, (counts.get(group) || 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([name, appearances]) => ({
      name,
      share: validRuns > 0 ? appearances / validRuns : 0,
      appearances,
    }))
    .sort((a, b) => b.appearances - a.appearances);
}

export function generateTeaserData(
  session: { id: number; brandName: string; brandDomain?: string | null; createdAt?: string; segments: SegmentData[]; citationReport?: any },
): TeaserData {
  const segments = Array.isArray(session.segments) ? session.segments.filter(s => s.scoringResult) : [];
  const brandName = session.brandName;
  const brandNameLC = brandName.toLowerCase();

  let totalWeightedAppearance = 0;
  let totalWeightedPrimary = 0;
  let totalValidRuns = 0;
  const allRanks: number[] = [];
  const allRuns: RawRun[] = [];

  for (const seg of segments) {
    const score = seg.scoringResult!.score;
    const vr = score.valid_runs || 0;
    totalWeightedAppearance += score.appearance_rate * vr;
    totalWeightedPrimary += (score.primary_rate || 0) * vr;
    totalValidRuns += vr;

    const runs = seg.scoringResult!.raw_runs || [];
    allRuns.push(...runs);

    for (const run of runs) {
      if (run.brand_found && run.brand_rank != null) {
        allRanks.push(run.brand_rank);
      }
    }
  }

  const overallAppearance = totalValidRuns > 0 ? totalWeightedAppearance / totalValidRuns : 0;
  const overallPrimary = totalValidRuns > 0 ? totalWeightedPrimary / totalValidRuns : 0;
  const overallAvgRank = allRanks.length > 0 ? allRanks.reduce((a, b) => a + b, 0) / allRanks.length : null;

  const brandAppearances = allRuns.filter(r => r.brand_found).length;
  const brandShare = totalValidRuns > 0 ? brandAppearances / totalValidRuns : 0;

  const globalCompMap = recountCompetitorsFromRuns(allRuns, brandNameLC);

  const allBrands = [...Array.from(globalCompMap.entries())
    .filter(([name]) => !name.toLowerCase().includes(brandNameLC) && !brandNameLC.includes(name.toLowerCase()))
    .map(([name, appearances]) => ({ name, share: totalValidRuns > 0 ? appearances / totalValidRuns : 0, appearances, isBrand: false })),
    { name: brandName, share: brandShare, appearances: brandAppearances, isBrand: true },
  ].sort((a, b) => b.appearances - a.appearances);

  const marketRank = allBrands.findIndex(b => b.isBrand) + 1;
  const leaderBrand = allBrands[0];
  const competitorCount = allBrands.filter(b => !b.isBrand).length;

  const competitiveRanking = allBrands.slice(0, 10).map((b, i) => ({
    rank: i + 1,
    name: b.name,
    share: Math.round(b.share * 100),
    isBrand: b.isBrand,
  }));

  let proximityNote = "";
  const brandIdx = allBrands.findIndex(b => b.isBrand);
  if (brandIdx > 0) {
    const above = allBrands[brandIdx - 1];
    const gap = Math.round((above.share - brandShare) * 100);
    const leaderGap = Math.round((leaderBrand.share - brandShare) * 100);
    proximityNote = `${gap}pt${gap !== 1 ? "s" : ""} from #${brandIdx}. The gap to #1 is ${leaderGap}pts.`;
  }

  const engineAgg: Record<string, { totalApp: number; totalPrimary: number; totalValid: number }> = {};
  for (const seg of segments) {
    const eb = seg.scoringResult!.score.engine_breakdown;
    for (const [eng, stats] of Object.entries(eb)) {
      if (!engineAgg[eng]) engineAgg[eng] = { totalApp: 0, totalPrimary: 0, totalValid: 0 };
      engineAgg[eng].totalApp += stats.appearance_rate * stats.valid_runs;
      engineAgg[eng].totalPrimary += stats.primary_rate * stats.valid_runs;
      engineAgg[eng].totalValid += stats.valid_runs;
    }
  }

  const engineSplit = Object.entries(engineAgg)
    .map(([eng, agg]) => {
      const rate = agg.totalValid > 0 ? agg.totalApp / agg.totalValid : 0;
      const pr = agg.totalValid > 0 ? agg.totalPrimary / agg.totalValid : 0;
      return {
        engine: eng,
        label: ENGINE_LABELS[eng] || eng,
        appearanceRate: rate,
        primaryRate: pr,
        color: (rate >= 0.7 ? "green" : rate >= 0.3 ? "gold" : "red") as "green" | "gold" | "red",
        note: generateEngineNote(eng, ENGINE_LABELS[eng] || eng, rate, pr, brandName),
      };
    })
    .sort((a, b) => b.appearanceRate - a.appearanceRate);

  const segmentBreakdown = segments.map(seg => {
    const score = seg.scoringResult!.score;
    const segRuns = seg.scoringResult!.raw_runs || [];
    const competitors = recountSegmentCompetitors(segRuns, score.valid_runs || 0);
    const brandApp = (seg.scoringResult!.raw_runs || []).filter(r => r.brand_found).length;
    const brandVis = score.valid_runs > 0 ? brandApp / score.valid_runs : 0;

    const allInSeg = [
      ...competitors.filter(c => !c.name.toLowerCase().includes(brandNameLC) && !brandNameLC.includes(c.name.toLowerCase())),
      { name: brandName, share: brandVis, appearances: brandApp },
    ].sort((a, b) => b.appearances - a.appearances);

    const bIdx = allInSeg.findIndex(b => b.name === brandName);
    const leader = allInSeg[0];
    const gapPts = Math.round((leader.share - brandVis) * 100);

    let opportunity: "high" | "closeable" | "stretch" = "stretch";
    if (gapPts <= 15) opportunity = "high";
    else if (gapPts <= 30) opportunity = "closeable";

    return {
      label: buildSegmentLabel(seg),
      brandRank: bIdx + 1,
      brandVisibility: Math.round(brandVis * 100),
      leaderName: leader.name,
      leaderScore: Math.round(leader.share * 100),
      gapPoints: gapPts,
      opportunity,
    };
  });

  const topCompetitorNames = allBrands.filter(b => !b.isBrand).slice(0, 3).map(b => b.name);
  const quoteContrastCompetitors = topCompetitorNames.map((name, i) => {
    const { sentence, engines } = extractCompetitorDefiningSentence(allRuns, name);
    return {
      rank: i + 1,
      name,
      sentence,
      engines: engines.map(e => ENGINE_LABELS[e] || e),
    };
  });

  const brandSentences = extractBrandSentences(allRuns, brandName);
  const allBrandSentences = Array.from(brandSentences.values()).flat();
  let brandDefining: string | null = null;
  if (allBrandSentences.length > 0) {
    const scored = allBrandSentences
      .map(s => {
        const parenCount = (s.match(/[()]/g) || []).length;
        const parenPenalty = parenCount > 4 ? -50 : 0;
        const hasProof = /award|recognised|recognized|certified|leading|top|best|specialist|known for/i.test(s) ? 20 : 0;
        const lenScore = Math.min(s.length, 200);
        return { text: s, score: lenScore + hasProof + parenPenalty };
      })
      .sort((a, b) => b.score - a.score);
    brandDefining = cleanLeadingArtifacts(scored[0].text);
  }

  const citDomainBrandMap = new Map<string, { tier: string; brands: Set<string> }>();
  const socialDomains = new Set(["reddit.com", "youtube.com", "quora.com", "twitter.com", "x.com", "linkedin.com", "tiktok.com"]);

  for (const run of allRuns) {
    if (!run.citations) continue;
    const candidates = Array.isArray(run.candidates) ? run.candidates : [];
    const mentionedBrands: string[] = [];
    for (const cand of candidates) {
      const cn = typeof cand === "string" ? cand : (cand?.name_raw || cand?.name || "");
      if (cn) mentionedBrands.push(cn);
    }
    if (run.brand_found) mentionedBrands.push(brandName);

    for (const cit of run.citations) {
      if (!cit.url) continue;
      const domain = extractDomain(cit.url);
      if (!citDomainBrandMap.has(domain)) {
        const allCompNames = allBrands.map(b => b.name);
        citDomainBrandMap.set(domain, { tier: classifyTier(domain, brandName, allCompNames), brands: new Set() });
      }
      const entry = citDomainBrandMap.get(domain)!;
      for (const mb of mentionedBrands) entry.brands.add(mb);
    }
  }

  const authorityDomains = Array.from(citDomainBrandMap.entries())
    .filter(([, d]) => d.tier === "T1" || d.tier === "T2")
    .sort((a, b) => {
      const tierOrder: Record<string, number> = { T1: 0, T2: 1 };
      return (tierOrder[a[1].tier] || 2) - (tierOrder[b[1].tier] || 2) || b[1].brands.size - a[1].brands.size;
    })
    .slice(0, 7);

  const topNamesForAuth = [...topCompetitorNames.slice(0, 3), brandName];
  const authorityGapDomains = authorityDomains.map(([domain, data]) => {
    const presence: Record<string, boolean> = {};
    for (const name of topNamesForAuth) {
      const nameLC = name.toLowerCase();
      presence[name] = Array.from(data.brands).some(b =>
        b.toLowerCase().includes(nameLC) || nameLC.includes(b.toLowerCase())
      );
    }
    let description = "";
    if (data.tier === "T1") description = "T1 · High-authority source frequently cited by AI engines";
    else description = "T2 · Mid-tier platform with notable AI retrieval weight";
    return { domain, tier: data.tier, description, presence };
  });

  let brandAbsentCount = 0;
  for (const d of authorityGapDomains) {
    if (!d.presence[brandName]) brandAbsentCount++;
  }

  const brandVoice: TeaserData["brandVoice"] = [];
  const engineOrder = ["chatgpt", "gemini", "claude"];
  const usedEngines = new Set<string>();

  for (const eng of engineOrder) {
    if (usedEngines.size >= 3) break;
    const engineRuns = allRuns.filter(r => r.engine === eng && r.brand_found && r.raw_text);
    if (engineRuns.length === 0) continue;

    let bestQuote = "";
    let bestPrompt = "";
    let bestScore = 0;

    for (const run of engineRuns) {
      const sentences = splitIntoSentences(run.raw_text)
        .map(s => cleanQuoteText(s))
        .filter(s => s.toLowerCase().includes(brandNameLC) && s.length > 30 && s.length < 300 && isCleanSentence(s));

      for (const sent of sentences) {
        const cleaned = cleanLeadingArtifacts(sent);
        const prose = cleaned.split(/\s+/).filter(w => w.length > 3).length;
        const score = prose + (cleaned.length > 80 ? 20 : 0) + (/known for|specialist|expertise|award|leading|recognized/i.test(cleaned) ? 15 : 0);
        if (score > bestScore) {
          bestScore = score;
          bestQuote = cleaned;
          bestPrompt = run.prompt_text || run.prompt_id || "AI search query";
        }
      }
    }

    if (!bestQuote) continue;

    const engineRate = engineAgg[eng] ? (engineAgg[eng].totalValid > 0 ? engineAgg[eng].totalApp / engineAgg[eng].totalValid : 0) : 0;
    const isStrong = engineRate >= 0.7;

    brandVoice.push({
      engine: eng,
      engineLabel: ENGINE_LABELS[eng] || eng,
      prompt: bestPrompt,
      quote: `"${bestQuote.replace(/^[""]|[""]$/g, "")}"`,
      problem: generateVoiceProblem(bestQuote, isStrong, brandName),
      isStrong,
    });
    usedEngines.add(eng);
  }

  const samplePrompts: TeaserData["samplePrompts"] = [];
  const seenPrompts = new Set<string>();
  for (const run of allRuns) {
    if (samplePrompts.length >= 6) break;
    const pt = run.prompt_text || run.prompt_id;
    if (!pt || seenPrompts.has(pt)) continue;
    seenPrompts.add(pt);

    const candidates = Array.isArray(run.candidates) ? run.candidates : [];
    let winnerName = "Unknown";
    let winnerRank = 1;
    if (candidates.length > 0) {
      const sorted = [...candidates].sort((a: any, b: any) => (a.rank || 99) - (b.rank || 99));
      const top = sorted[0];
      winnerName = typeof top === "string" ? top : (top?.name_raw || top?.name || "Unknown");
      winnerRank = top?.rank || 1;
    }

    samplePrompts.push({
      promptText: pt,
      brandRank: run.brand_rank,
      brandFound: run.brand_found,
      winnerName,
      winnerRank,
    });
  }

  const socialThreads: TeaserData["socialThreads"] = [];
  const seenUrls = new Set<string>();
  for (const run of allRuns) {
    if (!run.citations || socialThreads.length >= 5) continue;
    for (const cit of run.citations) {
      if (!cit.url || socialThreads.length >= 5) continue;
      const domain = extractDomain(cit.url);
      const rootDomain = domain.split(".").slice(-2).join(".");
      if (!socialDomains.has(rootDomain) || seenUrls.has(cit.url)) continue;
      seenUrls.add(cit.url);

      const candidates = Array.isArray(run.candidates) ? run.candidates : [];
      const compsMentioned = candidates
        .map((c: any) => typeof c === "string" ? c : (c?.name_raw || ""))
        .filter((n: string) => n && !n.toLowerCase().includes(brandNameLC));

      socialThreads.push({
        platform: rootDomain,
        title: cit.title || `${rootDomain} discussion thread`,
        competitorsMentioned: compsMentioned.slice(0, 3),
        brandMentioned: run.brand_found,
        engines: [ENGINE_LABELS[run.engine] || run.engine],
      });
    }
  }

  const brandCitDomains = new Set<string>();
  const leaderCitDomains = new Set<string>();
  const leaderName = leaderBrand?.name || "Leader";
  const leaderLC = leaderName.toLowerCase();
  let socialMentionCount = 0;

  for (const [domain, data] of citDomainBrandMap) {
    const hasBrand = Array.from(data.brands).some(b => b.toLowerCase().includes(brandNameLC) || brandNameLC.includes(b.toLowerCase()));
    const hasLeader = Array.from(data.brands).some(b => b.toLowerCase().includes(leaderLC) || leaderLC.includes(b.toLowerCase()));
    if (hasBrand) {
      brandCitDomains.add(domain);
      const rootDomain = domain.split(".").slice(-2).join(".");
      if (socialDomains.has(rootDomain)) socialMentionCount++;
    }
    if (hasLeader) leaderCitDomains.add(domain);
  }

  const totalQueries = totalValidRuns;
  const engineCount = Object.keys(engineAgg).length;
  const queriesPerEngine = engineCount > 0 ? Math.round(totalValidRuns / engineCount) : 0;

  const topPlayerInsights: TeaserData["topPlayerInsights"] = [];
  const leaderForInsights = leaderBrand?.name || "the market leader";
  const leaderAppRate = Math.round((leaderBrand?.share || 0) * 100);
  const brandAppRate = Math.round(overallAppearance * 100);

  const allAuthSources = authorityGapDomains.map(d => d.domain);
  const leaderT1Count = authorityGapDomains.filter(d => d.presence[leaderForInsights]).length;
  const brandT1Count = authorityGapDomains.filter(d => d.presence[brandName]).length;
  const sourceDiff = leaderT1Count - brandT1Count;
  if (sourceDiff > 0) {
    topPlayerInsights.push({
      title: `Present on ${leaderT1Count} of ${authorityGapDomains.length} authority sources`,
      detail: `LLMs pull from these authority sources when building recommendations. ${leaderForInsights} appears on ${sourceDiff} more than ${brandName}. The full audit details how to increase your visibility on each.`,
      sources: allAuthSources,
    });
  } else if (authorityGapDomains.length > 0) {
    topPlayerInsights.push({
      title: `${authorityGapDomains.length} authority sources drive AI recommendations`,
      detail: `These high-authority domains are cited by ChatGPT, Gemini, and Claude when recommending agencies. Presence on these sources directly influences whether a brand gets recommended. The full audit maps your coverage vs competitors.`,
      sources: allAuthSources,
    });
  } else {
    topPlayerInsights.push({
      title: "Authority source presence shapes AI recommendations",
      detail: `AI engines pull from a network of high-authority sources when building their recommendation lists. ${leaderForInsights} has established presence across these sources. The full audit identifies which sources matter most and how to get listed.`,
      sources: [],
    });
  }

  const leaderEngineConsistency = Object.values(engineAgg).filter(e => e.totalValid > 0).map(e => e.totalApp / e.totalValid);
  const leaderMinEngine = leaderEngineConsistency.length > 0 ? Math.min(...leaderEngineConsistency) : 0;
  if (leaderMinEngine > 0.5) {
    topPlayerInsights.push({
      title: "Consistent visibility across all 3 engines",
      detail: `${leaderForInsights} maintains strong presence on ChatGPT, Gemini, and Claude simultaneously. No blind spots means prospects find them regardless of which AI they use.`,
    });
  } else {
    const bestEngineEntry = engineSplit[0];
    if (bestEngineEntry) {
      topPlayerInsights.push({
        title: `Dominates ${bestEngineEntry.label} with ${Math.round(bestEngineEntry.appearanceRate * 100)}% visibility`,
        detail: `Top competitors concentrate their presence on the highest-traffic AI platform, ensuring they capture the majority of AI-driven buyer research.`,
      });
    }
  }

  if (quoteContrastCompetitors.length > 0 && quoteContrastCompetitors[0].engines.length >= 2) {
    topPlayerInsights.push({
      title: "AI repeats a defining sentence about them",
      detail: `${quoteContrastCompetitors[0].name} has a consistent narrative that AI engines repeat unprompted. This "signature line" drives selection when prospects compare options.`,
    });
  }

  const bestSegment = segmentBreakdown.reduce((best, seg) => seg.leaderScore > best.leaderScore ? seg : best, segmentBreakdown[0]);
  if (bestSegment && bestSegment.leaderScore > brandAppRate) {
    topPlayerInsights.push({
      title: `${bestSegment.leaderScore}% visibility in their strongest segment`,
      detail: `In the "${bestSegment.label}" segment, ${bestSegment.leaderName} achieves ${bestSegment.leaderScore}% visibility vs ${brandName}'s ${bestSegment.brandVisibility}%. Segment-specific optimization drives this gap.`,
    });
  }

  const keyActions: TeaserData["keyActions"] = [];

  const weakestEngine = engineSplit.reduce((w, e) => e.appearanceRate < w.appearanceRate ? e : w, engineSplit[0]);
  if (weakestEngine && weakestEngine.appearanceRate < 0.5) {
    keyActions.push({
      title: `Fix ${weakestEngine.label} visibility (currently ${Math.round(weakestEngine.appearanceRate * 100)}%)`,
      detail: `${weakestEngine.label} is ${brandName}'s weakest engine. The full audit maps exactly which content signals ${weakestEngine.label} prioritises and how to optimise for them.`,
      priority: "critical",
    });
  }

  const missingT1 = authorityGapDomains.find(d => !d.presence[brandName] && d.tier === "T1");
  if (missingT1) {
    keyActions.push({
      title: `Get listed on ${missingT1.domain}`,
      detail: `This T1 authority source is cited by AI engines across all 3 platforms. Your top competitors appear here — ${brandName} does not. The full audit includes the acquisition strategy.`,
      priority: "critical",
    });
  }

  if (!brandDefining || brandDefining.length < 50) {
    keyActions.push({
      title: "Build a defining AI narrative",
      detail: `${brandName} has no consistent "signature sentence" that AI engines repeat. Top competitors have one. The full audit defines exactly what this sentence should be.`,
      priority: "high",
    });
  } else {
    keyActions.push({
      title: "Strengthen your AI narrative",
      detail: `${brandName} has a basic narrative but it lacks the specificity and proof points that drive AI selection. The full audit shows how to upgrade it.`,
      priority: "high",
    });
  }

  const highOppSegment = segmentBreakdown.find(s => s.opportunity === "high" || s.opportunity === "closeable");
  if (highOppSegment) {
    keyActions.push({
      title: `Close the gap in "${highOppSegment.label}"`,
      detail: `Only ${highOppSegment.gapPoints} points from #1 in this segment. This is your quickest win — the full audit includes the specific actions to close it.`,
      priority: highOppSegment.opportunity === "high" ? "high" : "medium",
    });
  }

  if (socialMentionCount < 3) {
    keyActions.push({
      title: "Increase social & forum presence",
      detail: `${brandName} appears in only ${socialMentionCount} social/forum threads that AI engines cite. Competitors are mentioned in significantly more. The full audit maps the specific threads and platforms.`,
      priority: "medium",
    });
  }

  const engineSegmentHeatmap: TeaserData["engineSegmentHeatmap"] = segments.map(seg => {
    const eb = seg.scoringResult!.score.engine_breakdown;
    const engines: Record<string, number> = {};
    for (const [eng, stats] of Object.entries(eb)) {
      engines[eng] = Math.round((stats.valid_runs > 0 ? stats.appearance_rate : 0) * 100);
    }
    return {
      segmentLabel: buildSegmentLabel(seg),
      engines,
    };
  });

  const totalCitations = allRuns.reduce((sum, r) => sum + (r.citations?.length || 0), 0);
  const citDomainCount = citDomainBrandMap.size;
  const citationScale: TeaserData["citationScale"] = {
    totalCitationsCrawled: totalCitations,
    totalCitationPages: citDomainCount,
    totalRuns: totalValidRuns,
    totalEngines: Object.keys(engineAgg).length,
  };

  const promptShowdown: TeaserData["promptShowdown"] = [];
  const dateLabel = session.createdAt
    ? new Date(session.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const promptSegmentLabels = new Map<string, Set<string>>();
  for (const seg of segments) {
    const segLabel = buildSegmentLabel(seg);
    const segRuns = seg.scoringResult!.raw_runs || [];
    for (const run of segRuns) {
      const pt = run.prompt_text || run.prompt_id;
      if (!pt) continue;
      if (!promptSegmentLabels.has(pt)) promptSegmentLabels.set(pt, new Set());
      promptSegmentLabels.get(pt)!.add(segLabel);
    }
  }

  const promptGroups = new Map<string, RawRun[]>();
  for (const run of allRuns) {
    const pt = run.prompt_text || run.prompt_id;
    if (!pt) continue;
    if (!promptGroups.has(pt)) promptGroups.set(pt, []);
    promptGroups.get(pt)!.push(run);
  }

  const showdownCandidates = Array.from(promptGroups.entries())
    .filter(([, runs]) => runs.length >= 2)
    .map(([promptText, runs]) => {
      const brandFoundCount = runs.filter(r => r.brand_found).length;
      const hasMultipleEngines = new Set(runs.map(r => r.engine)).size >= 2;
      const segLabels = promptSegmentLabels.get(promptText) || new Set(["unknown"]);
      const segmentLabel = Array.from(segLabels)[0];
      return { promptText, runs, brandFoundCount, hasMultipleEngines, segmentLabel, segLabels };
    })
    .sort((a, b) => {
      if (a.hasMultipleEngines !== b.hasMultipleEngines) return a.hasMultipleEngines ? -1 : 1;
      return b.brandFoundCount - a.brandFoundCount;
    });

  const normalizePrompt = (p: string) => p.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/);
  const wordOverlap = (a: string[], b: string[]) => {
    const setB = new Set(b);
    const common = a.filter(w => setB.has(w) && w.length > 3).length;
    return common / Math.max(a.length, b.length, 1);
  };

  const diverseCandidates: typeof showdownCandidates = [];
  const usedSegments = new Set<string>();
  if (showdownCandidates.length > 0) {
    diverseCandidates.push(showdownCandidates[0]);
    showdownCandidates[0].segLabels.forEach(s => usedSegments.add(s));
  }
  for (let round = 0; round < 2 && diverseCandidates.length < 3; round++) {
    let bestCandidate: typeof showdownCandidates[0] | null = null;
    let bestScore = -1;
    for (const c of showdownCandidates) {
      if (diverseCandidates.includes(c)) continue;
      const words = normalizePrompt(c.promptText);
      const maxOverlap = diverseCandidates.reduce((max, sel) => {
        return Math.max(max, wordOverlap(words, normalizePrompt(sel.promptText)));
      }, 0);
      const diversityScore = (1 - maxOverlap) * 100;
      const hasNewSegment = Array.from(c.segLabels).some(s => !usedSegments.has(s));
      const segmentBonus = hasNewSegment ? 30 : 0;
      const brandBonus = c.brandFoundCount > 0 ? 10 : 0;
      const score = diversityScore + segmentBonus + brandBonus;
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = c;
      }
    }
    if (bestCandidate) {
      diverseCandidates.push(bestCandidate);
      bestCandidate.segLabels.forEach(s => usedSegments.add(s));
    }
  }

  for (const candidate of diverseCandidates.slice(0, 3)) {
    const results: TeaserData["promptShowdown"][0]["results"] = [];
    const seenEngines = new Set<string>();
    for (const run of candidate.runs) {
      if (seenEngines.has(run.engine)) continue;
      seenEngines.add(run.engine);
      const candidates = Array.isArray(run.candidates) ? run.candidates : [];
      let topResult = "Unknown";
      if (candidates.length > 0) {
        const sorted = [...candidates].sort((a: any, b: any) => (a.rank || 99) - (b.rank || 99));
        topResult = typeof sorted[0] === "string" ? sorted[0] : (sorted[0]?.name_raw || sorted[0]?.name || "Unknown");
      }
      results.push({
        engine: run.engine,
        engineLabel: ENGINE_LABELS[run.engine] || run.engine,
        brandRank: run.brand_rank,
        brandFound: run.brand_found,
        topResult,
      });
    }
    promptShowdown.push({
      promptText: candidate.promptText,
      results,
      dateLabel,
    });
  }

  return {
    meta: {
      brandName,
      date: dateLabel,
      totalQueries,
      queriesPerEngine,
    },
    overallScore: {
      appearanceRate: Math.round(overallAppearance * 100),
      avgRank: overallAvgRank ? Math.round(overallAvgRank * 10) / 10 : null,
      primaryRate: Math.round(overallPrimary * 100),
      marketRank,
      competitorCount,
      leaderName: leaderBrand?.name || "",
      leaderRate: Math.round((leaderBrand?.share || 0) * 100),
    },
    engineSplit,
    competitiveRanking,
    proximityNote,
    segmentBreakdown,
    quoteContrast: {
      competitors: quoteContrastCompetitors,
      brand: {
        sentence: brandDefining,
        hasSentence: !!brandDefining,
      },
    },
    authorityGap: {
      domains: authorityGapDomains,
      brandAbsentCount,
      totalT1Count: authorityGapDomains.filter(d => d.tier === "T1").length,
    },
    brandVoice,
    samplePrompts,
    socialThreads,
    citationFootprint: {
      brandSources: brandCitDomains.size,
      leaderSources: leaderCitDomains.size,
      leaderName,
      thirdPartyDomains: brandCitDomains.size,
      socialMentions: socialMentionCount,
    },
    topPlayerInsights,
    keyActions,
    engineSegmentHeatmap,
    citationScale,
    promptShowdown,
  };
}

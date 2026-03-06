import { classifyTier, isAIInfraDomain, isDomainOwnedByEntity, type TierLabel } from "./tier-classifier";
import { generateCompetitorNarrative, extractAllMentionSentences } from "./competitor-narrative";
import { resolveGroundingUrls, collectAllCitationUrls } from "./grounding-resolver";

function shouldMergeCompNames(a: string, b: string): boolean {
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
      if (group.some(g => shouldMergeCompNames(g, nameArr[j]))) {
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
  serviceType?: string;
  location: string;
  resultCount: number;
  prompts: any[] | null;
  scoringResult: {
    score: {
      appearance_rate: number;
      primary_rate: number;
      avg_rank: number | null;
      competitors: { name: string; share: number; appearances: number }[];
      engine_breakdown: Record<string, any>;
      cluster_breakdown: Record<string, any>;
      valid_runs: number;
      invalid_runs: number;
    };
    raw_runs?: RawRun[];
  } | null;
}

interface CitationReportSegment {
  segmentId: string;
  segmentLabel: string;
  scores: {
    brand: any;
    competitorA: any;
    competitorB: any;
  };
  evidence: any;
  action: { gapType: string; primary: string; secondary: string | null };
  modelUnderstanding?: string;
  differential?: any;
}

interface CitationReport {
  brandName: string;
  segments: CitationReportSegment[];
  globalAuthority?: {
    label: string;
    totalMentions: number;
    uniqueDomains: number;
    highTierDomains: string[];
  };
  totalCitationsCrawled?: number;
}

export interface ReportData {
  meta: {
    brandName: string;
    brandDomain: string | null;
    sessionId: number;
    analyzedAt: string;
    segmentCount: number;
    totalRuns: number;
    zeroVisibility?: boolean;
  };
  section1: {
    overall: {
      appearanceRate: number;
      primaryRate: number;
      avgRank: number | null;
      totalValidRuns: number;
    };
    perSegment: Array<{
      persona: string;
      location: string;
      customerType: string;
      appearanceRate: number;
      primaryRate: number;
      avgRank: number | null;
      validRuns: number;
    }>;
    engineHeatmap: Record<string, Record<string, {
      appearanceRate: number;
      primaryRate: number;
      validRuns: number;
    }>>;
    grounding: Record<string, {
      withCitations: number;
      total: number;
      pct: number;
    }>;
  };
  section2: {
    perSegment: Array<{
      segmentLabel: string;
      top5: Array<{ name: string; share: number; appearances: number; isBrand?: boolean }>;
      deepDives: Array<{
        name: string;
        share: number;
        appearances: number;
        authoritySources: Array<{
          domain: string;
          urls: string[];
          tier: string;
        }>;
        uniqueDomainCount: number;
        phrases: string[];
        comparisonSurfaces: Array<{
          url: string;
          domain: string;
          position: number | null;
          tier: string;
          brandPresent: boolean;
        }>;
        perEngine: Record<string, {
          appearances: number;
          totalRuns: number;
          avgRank: number | null;
        }>;
        crossEngineConsistency: "strong" | "moderate" | "weak";
        geoFactors: {
          citationDensity: "strong" | "moderate" | "weak";
          categoryMatch: "strong" | "moderate" | "weak";
          comparisonPresence: "strong" | "moderate" | "weak";
          crossEngine: "strong" | "moderate" | "weak";
        };
      }>;
    }>;
    crossSegmentOverlap: Array<{
      name: string;
      segmentCount: number;
      segments: string[];
      totalAppearances: number;
    }>;
    brandComparison: {
      uniqueDomainCount: number;
      authorityLabel: string;
      comparisonPagesPresent: number;
      comparisonPagesTotal: number;
      brandCitationDomains: Array<{ domain: string; tier: string; mentions: number }>;
    };
  };
  section3: {
    gapAnalysis: Array<{
      segmentLabel: string;
      gapType: string;
      authority: { label: string; detail: string };
      context: { label: string; detail: string };
      comparative: { label: string; detail: string };
    }>;
    recommendations: Array<{
      segmentLabel: string;
      quickWins: string;
      secondaryAction: string;
      getListedHere: string[];
      useThesePhrases: string[];
      missingSources: Array<{ domain: string; tier: string }>;
      competitorEditorialMentions: Array<{ domain: string; tier: string; competitors: string[] }>;
    }>;
    modelUnderstanding: string | null;
  };
  competitorPlaybook: {
    perSegment: Array<{
      segmentLabel: string;
      topCompetitors: Array<{
        name: string;
        rank: number;
        share: number;
        appearances: number;
        narrative: string;
        whyTheyRank: string;
        quickStats: {
          totalMentions: number;
          authoritySourceCount: number;
          engineCount: number;
          avgRankAcrossEngines: number | null;
          topThemes: string[];
          bestPromptMatch: { promptKeyword: string; quote: string; engine: string } | null;
        };
        enginePresence: Record<string, { appearances: number; totalRuns: number; avgRank: number | null }>;
        crossEngineConsistency: "strong" | "moderate" | "weak";
        authoritySources: Array<{ domain: string; tier: string; urls: string[]; isAIInfra?: boolean }>;
        contextThemes: Array<{ theme: string; count: number; engines: string[] }>;
        exampleQuotes: Array<{ quote: string; engine: string; prompt?: string }>;
        socialMentions: Array<{ domain: string; url: string; context: string }>;
        derivedActions: string[];
      }>;
      highFrequencySources: Array<{
        domain: string;
        tier: string;
        count: number;
        competitors: string[];
        actionable: string;
      }>;
    }>;
  };
  appendix: {
    domainsByTier: {
      T1: Array<{ domain: string; urls: string[]; mentionedEntities: string[] }>;
      T2: Array<{ domain: string; urls: string[]; mentionedEntities: string[] }>;
      T3: Array<{ domain: string; urls: string[]; mentionedEntities: string[] }>;
      T4: Array<{ domain: string; urls: string[]; mentionedEntities: string[] }>;
      brand_owned: Array<{ domain: string; urls: string[]; mentionedEntities: string[] }>;
    };
    totalDomains: number;
  };
}

const PERSONA_LABELS: Record<string, string> = {
  marketing_agency: "Marketing Agency",
  automation_consultant: "Automation",
  corporate_cards_provider: "Corporate Cards",
  expense_management_software: "Expense Management",
  accounting_automation: "Accounting Automation",
  invoice_management: "Invoice Management",
  restaurant: "Restaurant",
  construction_management: "Construction Management",
  in_home_healthcare: "In-Home Healthcare",
  at_home_healthcare: "At-Home Healthcare",
  weight_loss_help: "Weight Loss",
  in_home_blood_tests: "In-Home Blood Tests",
  at_home_blood_tests: "At-Home Blood Tests",
  real_estate_agency: "Real Estate",
  real_estate_broker: "Real Estate",
  property_dealer: "Property",
};

function buildSegmentLabel(seg: { persona: string; seedType: string; customerType: string; serviceType?: string }): string {
  const pLabel = seg.persona ? (PERSONA_LABELS[seg.persona] || seg.persona.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())) : "";
  const sLabel = seg.seedType && seg.seedType !== "__blank__"
    ? seg.seedType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    : "";
  const category = pLabel && sLabel ? `${pLabel} ${sLabel}` : pLabel || sLabel;
  const parts = [category];
  if (seg.serviceType) parts.push(`(${seg.serviceType})`);
  if (seg.customerType) parts.push(`for ${seg.customerType}`);
  return parts.filter(Boolean).join(" ");
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function wordOverlap(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }
  return overlap / Math.max(wordsA.size, wordsB.size);
}

const SOCIAL_DOMAINS = new Set([
  "reddit.com", "quora.com", "twitter.com", "x.com", "facebook.com",
  "linkedin.com", "youtube.com", "tiktok.com", "instagram.com",
  "medium.com", "trustpilot.com", "glassdoor.com",
]);

function isSocialDomain(domain: string): boolean {
  const d = domain.toLowerCase().replace(/^www\./, "");
  for (const sd of SOCIAL_DOMAINS) {
    if (d === sd || d.endsWith(`.${sd}`)) return true;
  }
  return false;
}

function extractContextThemes(competitorName: string, runs: RawRun[]): Array<{ theme: string; count: number; engines: string[] }> {
  const nameLC = competitorName.toLowerCase();
  const themeMap = new Map<string, { count: number; engines: Set<string> }>();
  
  const ATTRIBUTE_PATTERNS = [
    /(?:jci|iso|nabh)[\s-]*(?:accredited|certified|compliant)/gi,
    /(?:24\/7|round[\s-]*the[\s-]*clock|24[\s-]*hour)/gi,
    /(?:dha|moh|haad|doe)[\s-]*(?:licensed|approved|certified|registered)/gi,
    /(?:multilingual|multi[\s-]*language|arabic[\s-]*speaking|english[\s-]*speaking)/gi,
    /(?:home[\s-]*visit|house[\s-]*call|in[\s-]*home|at[\s-]*home|doorstep)/gi,
    /(?:affordable|competitive[\s-]*pric|cost[\s-]*effective|budget[\s-]*friendly|low[\s-]*cost)/gi,
    /(?:premium|luxury|high[\s-]*end|vip|concierge)/gi,
    /(?:experienced|qualified|board[\s-]*certified|specialist|expert)/gi,
    /(?:fast|quick|rapid|same[\s-]*day|next[\s-]*day|within[\s-]*hours)/gi,
    /(?:comprehensive|full[\s-]*range|wide[\s-]*range|end[\s-]*to[\s-]*end|holistic)/gi,
    /(?:trusted|reputable|reliable|well[\s-]*known|established|recognized)/gi,
    /(?:personalized|customized|tailored|individualized)/gi,
    /(?:technology|app|digital|online|platform|portal|telehealth|telemedicine)/gi,
    /(?:insurance|covered|accepted|cashless)/gi,
    /(?:satisfaction|rating|review|rated|star)/gi,
  ];

  for (const run of runs) {
    if (!run.raw_text) continue;
    const sentences = run.raw_text.split(/[.!?\n]+/).map(s => s.trim()).filter(s => s.length > 15 && s.length < 500);
    
    for (const sentence of sentences) {
      if (!sentence.toLowerCase().includes(nameLC)) continue;
      
      for (const pattern of ATTRIBUTE_PATTERNS) {
        pattern.lastIndex = 0;
        const match = pattern.exec(sentence);
        if (match) {
          const theme = match[0].toLowerCase().trim();
          if (!themeMap.has(theme)) {
            themeMap.set(theme, { count: 0, engines: new Set() });
          }
          const entry = themeMap.get(theme)!;
          entry.count++;
          entry.engines.add(run.engine);
        }
      }
    }
  }

  const consolidated = new Map<string, { theme: string; count: number; engines: Set<string> }>();
  for (const [theme, data] of themeMap) {
    let key = theme;
    if (/24/.test(theme)) key = "24/7 availability";
    else if (/jci|iso|nabh/.test(theme)) key = "accredited/certified";
    else if (/dha|moh|haad/.test(theme)) key = "government licensed";
    else if (/multilingual|arabic|english/.test(theme)) key = "multilingual";
    else if (/home|house|doorstep/.test(theme)) key = "home visits";
    else if (/affordable|cost|budget|low/.test(theme)) key = "affordable pricing";
    else if (/premium|luxury|vip|concierge/.test(theme)) key = "premium service";
    else if (/experienced|qualified|board|specialist|expert/.test(theme)) key = "experienced staff";
    else if (/fast|quick|rapid|same|next|within/.test(theme)) key = "fast service";
    else if (/comprehensive|full|wide|end.*end|holistic/.test(theme)) key = "comprehensive services";
    else if (/trusted|reputable|reliable|well.*known|established|recognized/.test(theme)) key = "trusted brand";
    else if (/personalized|customized|tailored|individualized/.test(theme)) key = "personalized care";
    else if (/technology|app|digital|online|platform|portal|telehealth|telemedicine/.test(theme)) key = "tech-enabled";
    else if (/insurance|covered|cashless/.test(theme)) key = "insurance accepted";
    else if (/satisfaction|rating|review|rated|star/.test(theme)) key = "high ratings";

    if (!consolidated.has(key)) {
      consolidated.set(key, { theme: key, count: 0, engines: new Set() });
    }
    const e = consolidated.get(key)!;
    e.count += data.count;
    for (const eng of data.engines) e.engines.add(eng);
  }

  return Array.from(consolidated.values())
    .map(e => ({ theme: e.theme, count: e.count, engines: Array.from(e.engines) }))
    .sort((a, b) => b.engines.length - a.engines.length || b.count - a.count)
    .slice(0, 8);
}

function extractExampleQuotes(competitorName: string, runs: RawRun[], maxQuotes: number = 6): Array<{ quote: string; engine: string; prompt?: string }> {
  const nameLC = competitorName.toLowerCase();
  const quotes: Array<{ quote: string; engine: string; prompt?: string }> = [];
  const seenEngines = new Set<string>();

  for (const run of runs) {
    if (!run.raw_text) continue;
    const sentences = run.raw_text.split(/[.!?\n]+/).map(s => s.trim()).filter(s => s.length > 20 && s.length < 400);

    for (const sentence of sentences) {
      if (!sentence.toLowerCase().includes(nameLC)) continue;
      if (sentence.toLowerCase().startsWith("here") || sentence.toLowerCase().startsWith("sure") || sentence.toLowerCase().startsWith("i ")) continue;

      let snippet = sentence;
      if (snippet.length > 200) {
        const idx = snippet.toLowerCase().indexOf(nameLC);
        const start = Math.max(0, idx - 60);
        snippet = snippet.substring(start, start + 200);
        if (start > 0) snippet = "..." + snippet;
        if (start + 200 < sentence.length) snippet = snippet + "...";
      }

      const isDuplicate = quotes.some(q => wordOverlap(q.quote, snippet) > 0.7);
      if (!isDuplicate) {
        const prioritize = !seenEngines.has(run.engine);
        if (prioritize) seenEngines.add(run.engine);
        quotes.push({ quote: snippet, engine: run.engine, prompt: run.prompt_text });
        if (quotes.length >= maxQuotes) return quotes;
      }
    }
  }

  return quotes;
}

function extractSocialMentions(competitorName: string, runs: RawRun[]): Array<{ domain: string; url: string; context: string }> {
  const nameLC = competitorName.toLowerCase();
  const mentions: Array<{ domain: string; url: string; context: string }> = [];
  const seenDomains = new Set<string>();

  for (const run of runs) {
    if (!run.citations) continue;
    const candidates = Array.isArray(run.candidates) ? run.candidates : [];
    const compFound = candidates.some((cand: any) => {
      const cn = typeof cand === "string" ? cand : (cand?.name_norm || cand?.name_raw || "");
      return cn.toLowerCase().includes(nameLC) || nameLC.includes(cn.toLowerCase());
    });
    if (!compFound) continue;

    for (const cit of run.citations) {
      if (!cit.url) continue;
      const domain = extractDomain(cit.url);
      if (!isSocialDomain(domain)) continue;
      if (seenDomains.has(domain)) continue;
      seenDomains.add(domain);

      let context = "";
      if (run.raw_text) {
        const sentences = run.raw_text.split(/[.!?\n]+/).map(s => s.trim());
        const relevant = sentences.find(s => s.toLowerCase().includes(nameLC) && s.length > 15 && s.length < 300);
        if (relevant) {
          context = relevant.length > 150 ? relevant.substring(0, 150) + "..." : relevant;
        }
      }

      mentions.push({ domain, url: cit.url, context });
      if (mentions.length >= 5) return mentions;
    }
  }

  return mentions;
}

const PROMPT_INTENT_KEYWORDS: Record<string, string[]> = {
  "trusted": ["trust", "reliable", "reputable", "established", "credible"],
  "top rated": ["rated", "rating", "review", "star", "score"],
  "affordable": ["affordable", "budget", "cost", "cheap", "price", "value"],
  "popular": ["popular", "well-known", "famous", "widely", "common"],
  "best": ["best", "leading", "top", "premier", "finest"],
  "premium": ["premium", "luxury", "exclusive", "high-end", "vip"],
  "recommended": ["recommend", "suggest", "advise", "endorsed"],
  "comprehensive": ["comprehensive", "full-service", "wide range", "holistic", "end-to-end"],
  "fastest": ["fast", "quick", "rapid", "same-day", "urgent", "emergency"],
  "specialized": ["specialist", "specialized", "expert", "focused", "niche"],
};

function findBestPromptMatch(
  quotes: Array<{ quote: string; engine: string; prompt?: string }>,
): { promptKeyword: string; quote: string; engine: string } | null {
  let bestMatch: { promptKeyword: string; quote: string; engine: string; score: number } | null = null;

  for (const q of quotes) {
    if (!q.prompt || !q.quote) continue;
    const promptLC = q.prompt.toLowerCase();

    for (const [keyword, synonyms] of Object.entries(PROMPT_INTENT_KEYWORDS)) {
      const promptHasIntent = synonyms.some(s => promptLC.includes(s)) || promptLC.includes(keyword);
      if (!promptHasIntent) continue;

      const quoteLC = q.quote.toLowerCase();
      const matchCount = synonyms.filter(s => quoteLC.includes(s)).length;
      if (matchCount === 0) continue;

      const score = matchCount + (quoteLC.includes(keyword) ? 2 : 0);
      if (!bestMatch || score > bestMatch.score) {
        const shortQuote = q.quote.length > 120 ? q.quote.substring(0, 120) + "..." : q.quote;
        bestMatch = { promptKeyword: keyword, quote: shortQuote, engine: q.engine, score };
      }
    }
  }

  return bestMatch ? { promptKeyword: bestMatch.promptKeyword, quote: bestMatch.quote, engine: bestMatch.engine } : null;
}

function computeQuickStats(
  comp: { appearances: number },
  perEngine: Record<string, { appearances: number; totalRuns: number; avgRank: number | null }>,
  authoritySources: Array<{ domain: string; tier: string; isAIInfra?: boolean }>,
  contextThemes: Array<{ theme: string; count: number; engines: string[] }>,
  exampleQuotes: Array<{ quote: string; engine: string; prompt?: string }>,
) {
  const activeEngines = Object.entries(perEngine).filter(([, s]) => s.appearances > 0);
  const avgRanks = activeEngines.map(([, s]) => s.avgRank).filter((r): r is number => r !== null);
  const overallAvgRank = avgRanks.length > 0 ? Math.round((avgRanks.reduce((a, b) => a + b, 0) / avgRanks.length) * 10) / 10 : null;
  const topThemes = contextThemes
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(t => t.theme);
  const bestPromptMatch = findBestPromptMatch(exampleQuotes);

  return {
    totalMentions: comp.appearances,
    authoritySourceCount: authoritySources.filter(s => !s.isAIInfra).length,
    engineCount: activeEngines.length,
    avgRankAcrossEngines: overallAvgRank,
    topThemes,
    bestPromptMatch,
  };
}

function computeHighFrequencySources(
  topCompetitors: Array<{ name: string; authoritySources: Array<{ domain: string; tier: string; isAIInfra?: boolean }> }>,
  brandName: string,
): Array<{ domain: string; tier: string; count: number; competitors: string[]; actionable: string }> {
  const domainMap = new Map<string, { tier: string; competitors: Set<string> }>();

  for (const comp of topCompetitors) {
    for (const src of comp.authoritySources) {
      if (src.isAIInfra) continue;
      if (!domainMap.has(src.domain)) {
        domainMap.set(src.domain, { tier: src.tier, competitors: new Set() });
      }
      domainMap.get(src.domain)!.competitors.add(comp.name);
    }
  }

  const results: Array<{ domain: string; tier: string; count: number; competitors: string[]; actionable: string }> = [];

  for (const [domain, data] of domainMap) {
    if (data.competitors.size < 2) continue;
    const compNames = Array.from(data.competitors);
    const count = compNames.length;
    const total = topCompetitors.length;

    let actionable = "";
    if (data.tier === "T1") {
      actionable = `High-authority source backing ${count}/${total} competitors — prioritize editorial coverage or PR outreach to ${domain}.`;
    } else if (data.tier === "T2") {
      actionable = `Mid-tier platform listing ${count}/${total} competitors — ensure ${brandName} has an optimized presence on ${domain}.`;
    } else {
      actionable = `Directory/blog listing ${count}/${total} competitors — get ${brandName} listed on ${domain} to match competitor visibility.`;
    }

    results.push({ domain, tier: data.tier, count, competitors: compNames, actionable });
  }

  return results.sort((a, b) => b.count - a.count || (a.tier < b.tier ? -1 : 1));
}

function buildWhyTheyRank(
  comp: { name: string; share: number; appearances: number },
  perEngine: Record<string, { appearances: number; totalRuns: number; avgRank: number | null }>,
  crossEngine: "strong" | "moderate" | "weak",
  authoritySources: Array<{ domain: string; tier: string }>,
  themes: Array<{ theme: string; count: number; engines: string[] }>,
  validRuns: number,
): string {
  const parts: string[] = [];
  const pct = validRuns > 0 ? Math.round((comp.appearances / validRuns) * 100) : 0;
  parts.push(`Appears in ${pct}% of AI responses (${comp.appearances}/${validRuns} runs)`);

  const engines = Object.entries(perEngine)
    .filter(([, s]) => s.appearances > 0)
    .map(([e, s]) => `${e === "chatgpt" ? "ChatGPT" : e === "gemini" ? "Gemini" : "Claude"} (${s.appearances}/${s.totalRuns}${s.avgRank ? `, avg #${s.avgRank}` : ""})`);
  if (engines.length > 0) {
    parts.push(`Present on ${engines.join(", ")}`);
  }

  const t1Sources = authoritySources.filter(s => s.tier === "T1");
  const t2Sources = authoritySources.filter(s => s.tier === "T2");
  if (t1Sources.length > 0) {
    parts.push(`Backed by ${t1Sources.length} high-authority source${t1Sources.length > 1 ? "s" : ""}: ${t1Sources.slice(0, 3).map(s => s.domain).join(", ")}`);
  }
  if (t2Sources.length > 0) {
    parts.push(`Also cited on ${t2Sources.length} mid-tier source${t2Sources.length > 1 ? "s" : ""}`);
  }

  if (themes.length > 0) {
    const crossEngineThemes = themes.filter(t => t.engines.length >= 2);
    if (crossEngineThemes.length > 0) {
      parts.push(`Key positioning themes (cross-engine): ${crossEngineThemes.slice(0, 3).map(t => t.theme).join(", ")}`);
    }
  }

  return parts.join(". ") + ".";
}

function deriveBrandActions(
  compName: string,
  themes: Array<{ theme: string; count: number; engines: string[] }>,
  authoritySources: Array<{ domain: string; tier: string; urls: string[] }>,
  socialMentions: Array<{ domain: string }>,
  brandName: string,
): string[] {
  const actions: string[] = [];

  const crossEngineThemes = themes.filter(t => t.engines.length >= 2);
  if (crossEngineThemes.length > 0) {
    actions.push(`${compName} is consistently described as "${crossEngineThemes.slice(0, 2).map(t => t.theme).join('" and "')}" across multiple AI engines. Ensure your website and profiles use similar phrasing if applicable.`);
  }

  const t1Sources = authoritySources.filter(s => s.tier === "T1");
  if (t1Sources.length > 0) {
    actions.push(`${compName} is backed by ${t1Sources.length} high-authority sources (${t1Sources.slice(0, 3).map(s => s.domain).join(", ")}). Target these same publications with PR, guest content, or directory submissions.`);
  }

  if (socialMentions.length > 0) {
    actions.push(`${compName} has presence on ${socialMentions.map(s => s.domain).join(", ")}. Build your brand visibility on these platforms with reviews, posts, and community engagement.`);
  }

  const singleEngineThemes = themes.filter(t => t.engines.length === 1);
  if (singleEngineThemes.length > 0) {
    actions.push(`Weak spot: ${compName} is only mentioned as "${singleEngineThemes[0].theme}" on one engine. If you can demonstrate this attribute more consistently, you can outposition them.`);
  }

  if (actions.length === 0) {
    actions.push(`Monitor ${compName}'s positioning and ensure your brand messaging covers the same key attributes to remain competitive.`);
  }

  return actions.slice(0, 4);
}

function extractPhrases(competitorName: string, runs: RawRun[], maxPhrases: number = 5, maxLen: number = 160): string[] {
  const phrases: string[] = [];
  const nameLC = competitorName.toLowerCase();
  const nameVariants = [nameLC];

  for (const run of runs) {
    if (!run.raw_text) continue;
    const sentences = run.raw_text.split(/[.!?\n]+/).map(s => s.trim()).filter(s => s.length > 15 && s.length < 500);

    for (const sentence of sentences) {
      if (!sentence.toLowerCase().includes(nameLC)) continue;

      let snippet = sentence;
      if (snippet.length > maxLen) {
        const idx = snippet.toLowerCase().indexOf(nameLC);
        const start = Math.max(0, idx - 40);
        snippet = snippet.substring(start, start + maxLen);
        if (start > 0) snippet = "..." + snippet;
        if (start + maxLen < sentence.length) snippet = snippet + "...";
      }

      const isDuplicate = phrases.some(p => wordOverlap(p, snippet) > 0.8);
      if (!isDuplicate) {
        phrases.push(snippet);
        if (phrases.length >= maxPhrases) return phrases;
      }
    }
  }

  return phrases;
}

function computePerEngineStats(runs: RawRun[], competitorName: string): Record<string, { appearances: number; totalRuns: number; avgRank: number | null }> {
  const engines = ["chatgpt", "gemini", "claude"];
  const result: Record<string, { appearances: number; totalRuns: number; avgRank: number | null }> = {};
  const nameLC = competitorName.toLowerCase();

  for (const engine of engines) {
    const engineRuns = runs.filter(r => r.engine === engine);
    let appearances = 0;
    const ranks: number[] = [];

    for (const run of engineRuns) {
      const candidates = Array.isArray(run.candidates) ? run.candidates : [];
      for (let i = 0; i < candidates.length; i++) {
        const cand = candidates[i];
        const candName = typeof cand === "string" ? cand : (cand?.name_norm || cand?.name_raw || "");
        if (candName.toLowerCase().includes(nameLC) || nameLC.includes(candName.toLowerCase())) {
          appearances++;
          const rank = typeof cand === "object" && cand?.rank ? cand.rank : i + 1;
          ranks.push(rank);
          break;
        }
      }
    }

    result[engine] = {
      appearances,
      totalRuns: engineRuns.length,
      avgRank: ranks.length > 0 ? Math.round((ranks.reduce((a, b) => a + b, 0) / ranks.length) * 10) / 10 : null,
    };
  }

  return result;
}

function computeCrossEngineConsistency(perEngine: Record<string, { appearances: number; totalRuns: number }>): "strong" | "moderate" | "weak" {
  const enginesWithPresence = Object.values(perEngine).filter(e => e.appearances > 0).length;
  if (enginesWithPresence >= 3) return "strong";
  if (enginesWithPresence >= 2) return "moderate";
  return "weak";
}

function computeGeoFactors(
  uniqueDomains: number,
  citationReport: CitationReport | null,
  segmentIdx: number,
  competitorName: string,
  comparisonSurfacesCount: number,
  crossEngine: "strong" | "moderate" | "weak"
): { citationDensity: "strong" | "moderate" | "weak"; categoryMatch: "strong" | "moderate" | "weak"; comparisonPresence: "strong" | "moderate" | "weak"; crossEngine: "strong" | "moderate" | "weak" } {
  const citationDensity = uniqueDomains > 5 ? "strong" : uniqueDomains >= 2 ? "moderate" : "weak";

  let categoryMatch: "strong" | "moderate" | "weak" = "weak";
  if (citationReport?.segments?.[segmentIdx]) {
    const seg = citationReport.segments[segmentIdx];
    const compScores = [seg.scores?.competitorA, seg.scores?.competitorB].filter(Boolean);
    for (const cs of compScores) {
      if (cs?.brand?.toLowerCase()?.includes(competitorName.toLowerCase()) || competitorName.toLowerCase().includes(cs?.brand?.toLowerCase() || "")) {
        const catRate = cs?.context?.categoryRate || 0;
        categoryMatch = catRate > 0.5 ? "strong" : catRate > 0.2 ? "moderate" : "weak";
        break;
      }
    }
  }

  const comparisonPresence = comparisonSurfacesCount > 3 ? "strong" : comparisonSurfacesCount > 0 ? "moderate" : "weak";

  return { citationDensity, categoryMatch, comparisonPresence, crossEngine };
}

export async function generateReport(
  session: { id: number; brandName: string; brandDomain?: string | null; createdAt?: string; segments: SegmentData[]; citationReport?: CitationReport | null },
): Promise<ReportData> {
  const segments = Array.isArray(session.segments) ? session.segments.filter(s => s.scoringResult) : [];
  const citationReport = session.citationReport || null;

  // --- RESOLVE GEMINI GROUNDING URLs ---
  const allCitUrls = collectAllCitationUrls(segments as any);
  const groundingMap = await resolveGroundingUrls(allCitUrls);
  const resolvedCount = Array.from(groundingMap.values()).filter(r => r.resolvedDomain).length;
  if (resolvedCount > 0) {
    console.log(`[report] Resolved ${resolvedCount}/${groundingMap.size} Gemini grounding URLs`);
    for (const seg of segments) {
      const runs = seg.scoringResult?.raw_runs;
      if (!runs) continue;
      for (const run of runs as any[]) {
        if (!run.citations) continue;
        run.citations = run.citations.map((cit: any) => {
          if (!cit.url) return cit;
          const resolved = groundingMap.get(cit.url);
          if (resolved && resolved.resolvedDomain) {
            return { ...cit, url: resolved.resolvedUrl, originalGroundingUrl: cit.url };
          }
          return cit;
        });
      }
    }
  }

  // --- SECTION 1: Visibility Dashboard ---

  // Overall stats: weighted by valid_runs
  let totalWeightedAppearance = 0;
  let totalWeightedPrimary = 0;
  let totalValidRuns = 0;
  const allRanks: number[] = [];

  const perSegment = segments.map(seg => {
    const score = seg.scoringResult!.score;
    const vr = score.valid_runs || 0;
    totalWeightedAppearance += score.appearance_rate * vr;
    totalWeightedPrimary += (score.primary_rate || 0) * vr;
    totalValidRuns += vr;

    const runs = seg.scoringResult!.raw_runs || [];
    for (const run of runs) {
      if (run.brand_found && run.brand_rank != null) {
        allRanks.push(run.brand_rank);
      }
    }

    return {
      persona: seg.persona,
      location: seg.location,
      customerType: seg.customerType,
      appearanceRate: score.appearance_rate,
      primaryRate: score.primary_rate || 0,
      avgRank: score.avg_rank,
      validRuns: vr,
    };
  });

  const overall = {
    appearanceRate: totalValidRuns > 0 ? Math.round((totalWeightedAppearance / totalValidRuns) * 1000) / 1000 : 0,
    primaryRate: totalValidRuns > 0 ? Math.round((totalWeightedPrimary / totalValidRuns) * 1000) / 1000 : 0,
    avgRank: allRanks.length > 0 ? Math.round((allRanks.reduce((a, b) => a + b, 0) / allRanks.length) * 10) / 10 : null,
    totalValidRuns,
  };

  // Engine heatmap: segmentLabel -> engine -> metrics
  const engineHeatmap: Record<string, Record<string, { appearanceRate: number; primaryRate: number; validRuns: number }>> = {};
  for (const seg of segments) {
    const label = buildSegmentLabel(seg);
    const eb = seg.scoringResult!.score.engine_breakdown || {};
    engineHeatmap[label] = {};
    for (const [engine, data] of Object.entries(eb)) {
      const ed = data as any;
      engineHeatmap[label][engine] = {
        appearanceRate: ed.appearance_rate || 0,
        primaryRate: ed.primary_rate || 0,
        validRuns: ed.valid_runs || 0,
      };
    }
  }

  // Grounding: % of runs with citations per engine (proxy)
  const groundingAccum: Record<string, { withCitations: number; total: number }> = {};
  for (const seg of segments) {
    const runs = seg.scoringResult!.raw_runs || [];
    for (const run of runs) {
      if (!groundingAccum[run.engine]) groundingAccum[run.engine] = { withCitations: 0, total: 0 };
      groundingAccum[run.engine].total++;
      if (run.citations && run.citations.length > 0) {
        groundingAccum[run.engine].withCitations++;
      }
    }
  }
  const grounding: Record<string, { withCitations: number; total: number; pct: number }> = {};
  for (const [engine, acc] of Object.entries(groundingAccum)) {
    grounding[engine] = {
      ...acc,
      pct: acc.total > 0 ? Math.round((acc.withCitations / acc.total) * 100) : 0,
    };
  }

  // --- SECTION 2: Competitive Landscape ---

  const allCompetitorNames = new Set<string>();
  for (const seg of segments) {
    for (const c of (seg.scoringResult?.score.competitors || [])) {
      allCompetitorNames.add(c.name);
    }
  }
  const competitorNamesList = Array.from(allCompetitorNames);

  const allCompetitorMap = new Map<string, { segments: Set<string>; totalAppearances: number }>();

  const appendixDomainMap = new Map<string, { tier: TierLabel; urls: Set<string>; mentionedEntities: Set<string>; engines: Set<string>; urlEngines: Map<string, Set<string>> }>();

  const perSegmentSection2 = segments.map((seg, segIdx) => {
    const segLabel = buildSegmentLabel(seg);
    const score = seg.scoringResult!.score;
    const runs = seg.scoringResult!.raw_runs || [];
    const competitors = recountCompetitorsFromRuns(runs, score.valid_runs || 0);

    const brandAppearances = runs.filter((r: any) => r.brand_found).length;
    const brandShare = score.valid_runs > 0 ? Math.round((brandAppearances / score.valid_runs) * 1000) / 1000 : 0;
    const brandEntry = { name: session.brandName, share: brandShare, appearances: brandAppearances, isBrand: true };

    const brandNameLC = session.brandName.toLowerCase();
    const competitorEntries = competitors
      .filter(c => !c.name.toLowerCase().includes(brandNameLC) && !brandNameLC.includes(c.name.toLowerCase()))
      .slice(0, 10)
      .map(c => ({
        name: c.name,
        share: score.valid_runs > 0 ? Math.round((c.appearances / score.valid_runs) * 1000) / 1000 : 0,
        appearances: c.appearances,
        isBrand: false,
      }));

    const allEntries = [...competitorEntries, brandEntry].sort((a, b) => b.appearances - a.appearances);
    const top5 = allEntries.slice(0, 10);

    for (const c of competitors) {
      if (!allCompetitorMap.has(c.name)) {
        allCompetitorMap.set(c.name, { segments: new Set(), totalAppearances: 0 });
      }
      const entry = allCompetitorMap.get(c.name)!;
      entry.segments.add(segLabel);
      entry.totalAppearances += c.appearances;
    }

    const deepDives = competitors.slice(0, 3).map(comp => {
      const perEngine = computePerEngineStats(runs, comp.name);
      const crossEngine = computeCrossEngineConsistency(perEngine);

      // Authority sources from citations
      const domainUrlMap = new Map<string, Set<string>>();
      for (const run of runs) {
        if (!run.citations) continue;
        const candidates = Array.isArray(run.candidates) ? run.candidates : [];
        const compFound = candidates.some((cand: any) => {
          const cn = typeof cand === "string" ? cand : (cand?.name_norm || cand?.name_raw || "");
          return cn.toLowerCase().includes(comp.name.toLowerCase()) || comp.name.toLowerCase().includes(cn.toLowerCase());
        });
        if (!compFound) continue;

        for (const cit of run.citations) {
          if (!cit.url) continue;
          const domain = extractDomain(cit.url);
          if (!domainUrlMap.has(domain)) domainUrlMap.set(domain, new Set());
          domainUrlMap.get(domain)!.add(cit.url);
        }
      }

      const authoritySources = Array.from(domainUrlMap.entries())
        .map(([domain, urls]) => ({
          domain,
          urls: Array.from(urls).slice(0, 20),
          tier: classifyTier(domain, comp.name, competitorNamesList),
        }))
        .sort((a, b) => {
          const tierOrder: Record<string, number> = { T1: 0, T2: 1, brand_owned: 2, T3: 3, T4: 4 };
          return (tierOrder[a.tier] || 4) - (tierOrder[b.tier] || 4);
        })
        .slice(0, 10);

      const uniqueDomainCount = domainUrlMap.size;

      const phrases = extractPhrases(comp.name, runs);

      // Comparison surfaces from citation report
      let comparisonSurfaces: Array<{ url: string; domain: string; position: number | null; tier: string; brandPresent: boolean }> = [];
      if (citationReport?.segments?.[segIdx]) {
        const crSeg = citationReport.segments[segIdx];
        const brandComp = crSeg.scores?.brand?.comparative?.comparisonPages || [];
        const compScores = [crSeg.scores?.competitorA, crSeg.scores?.competitorB].filter(Boolean);

        for (const cs of compScores) {
          if (!cs?.brand?.toLowerCase()?.includes(comp.name.toLowerCase()) &&
              !comp.name.toLowerCase().includes(cs?.brand?.toLowerCase() || "")) continue;

          const compPages = cs?.comparative?.comparisonPages || [];
          for (const page of compPages) {
            if (!page.present) continue;
            const brandOnPage = brandComp.some((bp: any) => bp.url === page.url && bp.present);
            comparisonSurfaces.push({
              url: page.url,
              domain: page.domain,
              position: page.position,
              tier: page.comparisonTier || "C",
              brandPresent: brandOnPage,
            });
          }
        }
        comparisonSurfaces = comparisonSurfaces.slice(0, 10);
      }

      const geoFactors = computeGeoFactors(
        uniqueDomainCount,
        citationReport,
        segIdx,
        comp.name,
        comparisonSurfaces.length,
        crossEngine
      );

      return {
        name: comp.name,
        share: score.valid_runs > 0 ? Math.round((comp.appearances / score.valid_runs) * 1000) / 1000 : 0,
        appearances: comp.appearances,
        authoritySources,
        uniqueDomainCount,
        phrases,
        comparisonSurfaces,
        perEngine,
        crossEngineConsistency: crossEngine,
        geoFactors,
      };
    });

    for (const run of runs) {
      if (!run.citations) continue;
      const candidates = Array.isArray(run.candidates) ? run.candidates : [];
      const mentionedInRun: string[] = [];
      for (const cand of candidates) {
        const cn = typeof cand === "string" ? cand : (cand?.name_norm || cand?.name_raw || "");
        if (cn) mentionedInRun.push(cn);
      }
      if (run.brand_found) mentionedInRun.push(session.brandName);

      for (const cit of run.citations) {
        if (!cit.url) continue;
        const domain = extractDomain(cit.url);
        if (!appendixDomainMap.has(domain)) {
          const tier = classifyTier(domain, session.brandName, competitorNamesList);
          appendixDomainMap.set(domain, { tier, urls: new Set(), mentionedEntities: new Set(), engines: new Set(), urlEngines: new Map() });
        }
        const entry = appendixDomainMap.get(domain)!;
        entry.urls.add(cit.url);
        const runEngine = run.engine || "";
        if (runEngine) {
          entry.engines.add(runEngine);
          if (!entry.urlEngines.has(cit.url)) entry.urlEngines.set(cit.url, new Set());
          entry.urlEngines.get(cit.url)!.add(runEngine);
        }
        for (const m of mentionedInRun) {
          entry.mentionedEntities.add(m);
        }
      }
    }

    return { segmentLabel: segLabel, top5, deepDives };
  });

  const dedupedAllCompMap = new Map<string, { segments: Set<string>; totalAppearances: number }>();
  const compMapEntries = [...allCompetitorMap.entries()].sort((a, b) => b[1].totalAppearances - a[1].totalAppearances);
  const compMapConsumed = new Set<string>();
  for (const [nameA, dataA] of compMapEntries) {
    if (compMapConsumed.has(nameA)) continue;
    const merged = { segments: new Set(dataA.segments), totalAppearances: dataA.totalAppearances };
    let bestName = nameA;
    for (const [nameB, dataB] of compMapEntries) {
      if (nameB === nameA || compMapConsumed.has(nameB)) continue;
      if (shouldMergeCompNames(nameA, nameB)) {
        for (const s of dataB.segments) merged.segments.add(s);
        merged.totalAppearances += dataB.totalAppearances;
        if (nameB.length < bestName.length) bestName = nameB;
        compMapConsumed.add(nameB);
      }
    }
    compMapConsumed.add(nameA);
    dedupedAllCompMap.set(bestName, merged);
  }

  const crossSegmentOverlap = Array.from(dedupedAllCompMap.entries())
    .filter(([, v]) => v.segments.size >= 2)
    .map(([name, v]) => ({
      name,
      segmentCount: v.segments.size,
      segments: Array.from(v.segments),
      totalAppearances: v.totalAppearances,
    }))
    .sort((a, b) => b.segmentCount - a.segmentCount || b.totalAppearances - a.totalAppearances)
    .slice(0, 10);

  // Brand comparison stats
  let brandUniqueDomains = 0;
  let brandAuthorityLabel = "unknown";
  let brandCompPagesPresent = 0;
  let brandCompPagesTotal = 0;

  let brandCitationDomainsFromReport: Array<{ domain: string; tier: string; mentions: number }> = [];

  if (citationReport) {
    brandUniqueDomains = citationReport.globalAuthority?.uniqueDomains || 0;
    brandAuthorityLabel = citationReport.globalAuthority?.label || "unknown";
    brandCitationDomainsFromReport = citationReport.globalAuthority?.allDomains || [];

    if (brandCitationDomainsFromReport.length === 0 && brandUniqueDomains > 0) {
      const domainSet = new Map<string, { tier: string; mentions: number }>();
      for (const crSeg of citationReport.segments || []) {
        const brandAuth = crSeg.scores?.brand?.authority;
        if (brandAuth?.topDomains) {
          for (const td of brandAuth.topDomains) {
            const existing = domainSet.get(td.domain);
            if (existing) {
              existing.mentions += 1;
            } else {
              domainSet.set(td.domain, { tier: td.tier, mentions: 1 });
            }
          }
        }
      }
      brandCitationDomainsFromReport = [...domainSet.entries()]
        .sort((a, b) => {
          const tierOrder: Record<string, number> = { T1: 0, T2: 1, T3: 2, T4: 3 };
          return (tierOrder[a[1].tier] ?? 4) - (tierOrder[b[1].tier] ?? 4) || b[1].mentions - a[1].mentions;
        })
        .map(([domain, d]) => ({ domain, tier: d.tier, mentions: d.mentions }));
    }

    for (const crSeg of citationReport.segments || []) {
      const brandComp = crSeg.scores?.brand?.comparative;
      if (brandComp) {
        brandCompPagesPresent += brandComp.presentOnSurfaces || 0;
        brandCompPagesTotal += brandComp.totalComparisonSurfaces || 0;
      }
    }
  }

  if (brandCitationDomainsFromReport.length === 0) {
    const brandNameLower = session.brandName.toLowerCase();
    const fallbackDomains: Array<{ domain: string; tier: string; mentions: number }> = [];
    for (const [domain, entry] of appendixDomainMap) {
      if (entry.tier === "T4" || entry.tier === "brand_owned") continue;
      const entities = Array.from(entry.mentionedEntities).map(e => e.toLowerCase());
      if (entities.some(e => e.includes(brandNameLower) || brandNameLower.includes(e))) {
        fallbackDomains.push({ domain, tier: entry.tier, mentions: entry.urls.size });
      }
    }
    if (fallbackDomains.length > 0) {
      const tierOrder: Record<string, number> = { T1: 0, T2: 1, T3: 2, T4: 3 };
      fallbackDomains.sort((a, b) =>
        (tierOrder[a.tier] ?? 4) - (tierOrder[b.tier] ?? 4) || b.mentions - a.mentions
      );
      brandCitationDomainsFromReport = fallbackDomains;
      brandUniqueDomains = fallbackDomains.length;
      if (brandUniqueDomains >= 5) brandAuthorityLabel = "high";
      else if (brandUniqueDomains >= 2) brandAuthorityLabel = "moderate";
      else if (brandUniqueDomains >= 1) brandAuthorityLabel = "weak";
    }
  }

  // --- SECTION 3: Actionable Insights ---

  const gapAnalysis = segments.map((seg, segIdx) => {
    const segLabel = buildSegmentLabel(seg);
    const crSeg = citationReport?.segments?.[segIdx];

    const brandAuth = crSeg?.scores?.brand?.authority;
    const brandCtx = crSeg?.scores?.brand?.context;
    const brandComp = crSeg?.scores?.brand?.comparative;

    return {
      segmentLabel: segLabel,
      gapType: crSeg?.action?.gapType || "none",
      authority: {
        label: brandAuth?.label || "unknown",
        detail: `${brandAuth?.supportingDomains || 0} supporting domains, weighted score ${brandAuth?.totalScore?.toFixed(1) || "0"}.${brandAuth?.topDomains?.length ? " Top: " + brandAuth.topDomains.slice(0, 3).map((d: any) => d.domain).join(", ") : ""}`,
      },
      context: {
        label: brandCtx?.label || "unknown",
        detail: `Category match: ${((brandCtx?.categoryRate || 0) * 100).toFixed(0)}%, Audience match: ${((brandCtx?.audienceRate || 0) * 100).toFixed(0)}%`,
      },
      comparative: {
        label: brandComp?.label || "unknown",
        detail: `Present on ${brandComp?.presentOnSurfaces || 0} of ${brandComp?.totalComparisonSurfaces || 0} comparison surfaces`,
      },
    };
  });

  const recommendations = segments.map((seg, segIdx) => {
    const segLabel = buildSegmentLabel(seg);
    const crSeg = citationReport?.segments?.[segIdx];

    const getListedHere: string[] = [];
    const brandCompPages = crSeg?.scores?.brand?.comparative?.comparisonPages || [];
    for (const page of brandCompPages) {
      if (!page.present && page.url) {
        const pageDomain = extractDomain(page.url);
        const pageTier = classifyTier(pageDomain, session.brandName, competitorNamesList);
        if (pageTier === "T4") continue;
        getListedHere.push(page.url);
        if (getListedHere.length >= 10) break;
      }
    }

    const useThesePhrases: string[] = [];
    const runs = seg.scoringResult!.raw_runs || [];
    const topComps = [...(seg.scoringResult!.score.competitors || [])].sort((a, b) => b.appearances - a.appearances).slice(0, 3);
    for (const comp of topComps) {
      const compPhrases = extractPhrases(comp.name, runs, 3, 120);
      for (const p of compPhrases) {
        if (useThesePhrases.length >= 8) break;
        useThesePhrases.push(p);
      }
    }

    const missingSources: Array<{ domain: string; tier: string }> = [];
    if (crSeg) {
      const compScores = [crSeg.scores?.competitorA, crSeg.scores?.competitorB].filter(Boolean);
      const brandDomains = new Set((crSeg.scores?.brand?.authority?.topDomains || []).map((d: any) => d.domain?.toLowerCase()));
      for (const cs of compScores) {
        for (const td of (cs?.authority?.topDomains || [])) {
          if (!brandDomains.has(td.domain?.toLowerCase()) && (td.tier === "T1" || td.tier === "T2" || td.tier === "T3")) {
            const tdTier = classifyTier(td.domain, session.brandName, competitorNamesList);
            if (tdTier === "T4" || tdTier === "brand_owned") continue;
            const already = missingSources.some(m => m.domain === td.domain);
            if (!already) {
              missingSources.push({ domain: td.domain, tier: tdTier });
              if (missingSources.length >= 10) break;
            }
          }
        }
      }
    }

    const competitorEditorialMentions: Array<{ domain: string; tier: string; competitors: string[] }> = [];
    for (const [domain, entry] of appendixDomainMap) {
      if (entry.tier !== "T1" && entry.tier !== "T2" && entry.tier !== "T3") continue;
      const mentionedComps = Array.from(entry.mentionedEntities).filter(
        e => e.toLowerCase() !== session.brandName.toLowerCase()
      );
      if (mentionedComps.length === 0) continue;
      const hasBrand = entry.mentionedEntities.has(session.brandName);
      if (hasBrand) continue;
      competitorEditorialMentions.push({
        domain,
        tier: entry.tier,
        competitors: mentionedComps.slice(0, 5),
      });
    }
    competitorEditorialMentions.sort((a, b) => {
      const tierOrder: Record<string, number> = { T1: 0, T2: 1, T3: 2 };
      return (tierOrder[a.tier] || 3) - (tierOrder[b.tier] || 3);
    });

    return {
      segmentLabel: segLabel,
      quickWins: crSeg?.action?.primary || "No specific recommendations available.",
      secondaryAction: crSeg?.action?.secondary || "",
      getListedHere,
      useThesePhrases,
      missingSources,
      competitorEditorialMentions: competitorEditorialMentions.slice(0, 10),
    };
  });

  let modelUnderstanding: string | null = null;
  if (citationReport?.segments) {
    const understandings = citationReport.segments
      .map(s => s.modelUnderstanding)
      .filter(Boolean);
    if (understandings.length > 0) {
      modelUnderstanding = understandings.join(" | ");
    }
  }

  const playbookPerSegment: Array<{ segmentLabel: string; topCompetitors: any[] }> = [];

  interface NarrativeJob {
    segIdx: number;
    compIdx: number;
    ctx: Parameters<typeof generateCompetitorNarrative>[0];
  }
  const narrativeJobs: NarrativeJob[] = [];

  for (let segI = 0; segI < segments.length; segI++) {
    const seg = segments[segI];
    const segLabel = buildSegmentLabel(seg);
    const score = seg.scoringResult!.score;
    const runs = seg.scoringResult!.raw_runs || [];
    const competitors = [...(score.competitors || [])].sort((a, b) => b.appearances - a.appearances);

    const topCompetitors: any[] = [];

    for (let idx = 0; idx < Math.min(3, competitors.length); idx++) {
      const comp = competitors[idx];
      const perEngine = computePerEngineStats(runs, comp.name);
      const crossEngine = computeCrossEngineConsistency(perEngine);

      const domainUrlMap = new Map<string, { urls: Set<string>; tier: string }>();
      const compLC = comp.name.toLowerCase();
      for (const run of runs) {
        if (!run.citations) continue;
        const candidates = Array.isArray(run.candidates) ? run.candidates : [];
        const compFound = candidates.some((cand: any) => {
          const cn = typeof cand === "string" ? cand : (cand?.name_norm || cand?.name_raw || "");
          return cn.toLowerCase().includes(compLC) || compLC.includes(cn.toLowerCase());
        });
        if (!compFound) continue;

        const rawLC = (run.raw_text || "").toLowerCase();
        const compSections: string[] = [];
        if (rawLC) {
          const blocks = rawLC.split(/\n\n+/);
          for (let bi = 0; bi < blocks.length; bi++) {
            if (blocks[bi].includes(compLC)) {
              if (bi > 0) compSections.push(blocks[bi - 1]);
              compSections.push(blocks[bi]);
              if (bi + 1 < blocks.length) compSections.push(blocks[bi + 1]);
            }
          }
        }
        const compContext = compSections.join(" ");

        for (const cit of run.citations) {
          if (!cit.url) continue;
          const domain = extractDomain(cit.url);

          if (isAIInfraDomain(domain)) {
            if (!domainUrlMap.has(domain)) {
              domainUrlMap.set(domain, { urls: new Set(), tier: classifyTier(domain, session.brandName, competitorNamesList) });
            }
            domainUrlMap.get(domain)!.urls.add(cit.url);
            continue;
          }

          const domLC = domain.toLowerCase();
          const citInCompContext = compContext.includes(domLC) ||
            compContext.includes(domLC.replace(/\.\w+$/, ""));

          if (!citInCompContext && compSections.length > 0) continue;

          if (!domainUrlMap.has(domain)) {
            const tier = classifyTier(domain, session.brandName, competitorNamesList);
            domainUrlMap.set(domain, { urls: new Set(), tier });
          }
          domainUrlMap.get(domain)!.urls.add(cit.url);
        }
      }

      const authoritySources = Array.from(domainUrlMap.entries())
        .map(([domain, data]) => ({ domain, tier: data.tier, urls: Array.from(data.urls).slice(0, 5), isAIInfra: isAIInfraDomain(domain) }))
        .filter(s => {
          if (s.tier === "T4" || s.tier === "brand_owned") return false;
          if (isDomainOwnedByEntity(s.domain, comp.name)) return false;
          return true;
        })
        .sort((a, b) => {
          if (a.isAIInfra !== b.isAIInfra) return a.isAIInfra ? 1 : -1;
          const tierOrder: Record<string, number> = { T1: 0, T2: 1, T3: 2 };
          return (tierOrder[a.tier] || 3) - (tierOrder[b.tier] || 3);
        })
        .slice(0, 10);

      const contextThemes = extractContextThemes(comp.name, runs);
      const allMentionSentences = extractAllMentionSentences(comp.name, runs as any);
      const exampleQuotes = allMentionSentences.slice(0, 6).map(s => ({
        quote: s.sentence,
        engine: s.engine,
        prompt: s.prompt,
      }));
      const socialMentions = extractSocialMentions(comp.name, runs);

      const whyTheyRank = buildWhyTheyRank(
        comp, perEngine, crossEngine,
        authoritySources, contextThemes,
        score.valid_runs,
      );

      const derivedActions = deriveBrandActions(
        comp.name, contextThemes, authoritySources,
        socialMentions, session.brandName,
      );

      narrativeJobs.push({
        segIdx: segI,
        compIdx: idx,
        ctx: {
          name: comp.name,
          rank: idx + 1,
          share: score.valid_runs > 0 ? comp.appearances / score.valid_runs : 0,
          appearances: comp.appearances,
          totalRuns: score.valid_runs,
          perEngine,
          crossEngineConsistency: crossEngine,
          authoritySources: authoritySources.map(s => ({ domain: s.domain, tier: s.tier })),
          allMentionSentences,
          segmentLabel: segLabel,
          brandName: session.brandName,
        },
      });

      const quickStats = computeQuickStats(comp, perEngine, authoritySources, contextThemes, exampleQuotes);

      topCompetitors.push({
        name: comp.name,
        rank: idx + 1,
        share: score.valid_runs > 0 ? Math.round((comp.appearances / score.valid_runs) * 1000) / 1000 : 0,
        appearances: comp.appearances,
        narrative: "",
        whyTheyRank,
        quickStats,
        enginePresence: perEngine,
        crossEngineConsistency: crossEngine,
        authoritySources,
        contextThemes,
        exampleQuotes,
        socialMentions,
        derivedActions,
      });
    }

    const highFrequencySources = computeHighFrequencySources(topCompetitors, session.brandName);
    playbookPerSegment.push({ segmentLabel: segLabel, topCompetitors, highFrequencySources });
  }

  const narrativeResults = await Promise.allSettled(
    narrativeJobs.map(j => generateCompetitorNarrative(j.ctx))
  );
  for (let i = 0; i < narrativeJobs.length; i++) {
    const job = narrativeJobs[i];
    const result = narrativeResults[i];
    if (result.status === "fulfilled" && result.value) {
      playbookPerSegment[job.segIdx].topCompetitors[job.compIdx].narrative = result.value;
    }
  }

  return {
    meta: {
      brandName: session.brandName,
      brandDomain: session.brandDomain || null,
      sessionId: session.id,
      analyzedAt: session.createdAt || new Date().toISOString(),
      segmentCount: segments.length,
      totalRuns: segments.reduce((sum, s) => sum + (s.scoringResult?.raw_runs?.length || 0), 0),
      zeroVisibility: overall.appearanceRate === 0,
    },
    section1: { overall, perSegment, engineHeatmap, grounding },
    section2: {
      perSegment: perSegmentSection2,
      crossSegmentOverlap,
      brandComparison: {
        uniqueDomainCount: brandUniqueDomains,
        authorityLabel: brandAuthorityLabel,
        comparisonPagesPresent: brandCompPagesPresent,
        comparisonPagesTotal: brandCompPagesTotal,
        brandCitationDomains: brandCitationDomainsFromReport,
      },
    },
    section3: { gapAnalysis, recommendations, modelUnderstanding },
    competitorPlaybook: { perSegment: playbookPerSegment },
    appendix: buildAppendix(appendixDomainMap),
  };
}

function buildAppendix(domainMap: Map<string, { tier: TierLabel; urls: Set<string>; mentionedEntities: Set<string>; engines: Set<string>; urlEngines: Map<string, Set<string>> }>) {
  const domainsByTier: Record<TierLabel, Array<{ domain: string; urls: Array<{ url: string; engines: string[] }>; mentionedEntities: string[]; engines: string[] }>> = {
    T1: [], T2: [], T3: [], T4: [], brand_owned: [],
  };

  for (const [domain, entry] of domainMap) {
    const urlList = Array.from(entry.urls).slice(0, 10).map(url => ({
      url,
      engines: Array.from(entry.urlEngines.get(url) || []),
    }));
    domainsByTier[entry.tier].push({
      domain,
      urls: urlList,
      mentionedEntities: Array.from(entry.mentionedEntities),
      engines: Array.from(entry.engines),
    });
  }

  for (const tier of Object.keys(domainsByTier) as TierLabel[]) {
    domainsByTier[tier].sort((a, b) => a.domain.localeCompare(b.domain));
  }

  return {
    domainsByTier,
    totalDomains: domainMap.size,
  };
}

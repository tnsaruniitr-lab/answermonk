import { classifyTier } from "./tier-classifier";

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
      top5: Array<{ name: string; share: number; appearances: number }>;
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
    }>;
    modelUnderstanding: string | null;
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
};

function buildSegmentLabel(seg: { persona: string; seedType: string; customerType: string }): string {
  const pLabel = seg.persona ? (PERSONA_LABELS[seg.persona] || seg.persona.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())) : "";
  const sLabel = seg.seedType && seg.seedType !== "__blank__"
    ? seg.seedType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    : "";
  const category = pLabel && sLabel ? `${pLabel} ${sLabel}` : pLabel || sLabel;
  return [category, seg.customerType].filter(Boolean).join(" for ");
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

export function generateReport(
  session: { id: number; brandName: string; brandDomain?: string | null; createdAt?: string; segments: SegmentData[]; citationReport?: CitationReport | null },
): ReportData {
  const segments = Array.isArray(session.segments) ? session.segments.filter(s => s.scoringResult) : [];
  const citationReport = session.citationReport || null;

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

  const allCompetitorMap = new Map<string, { segments: Set<string>; totalAppearances: number }>();

  const perSegmentSection2 = segments.map((seg, segIdx) => {
    const segLabel = buildSegmentLabel(seg);
    const score = seg.scoringResult!.score;
    const runs = seg.scoringResult!.raw_runs || [];
    const competitors = [...(score.competitors || [])].sort((a, b) => b.appearances - a.appearances);

    const top5 = competitors.slice(0, 10).map(c => ({
      name: c.name,
      share: score.valid_runs > 0 ? Math.round((c.appearances / score.valid_runs) * 1000) / 1000 : 0,
      appearances: c.appearances,
    }));

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
          tier: classifyTier(domain, comp.name),
        }))
        .sort((a, b) => {
          const tierOrder: Record<string, number> = { T1: 0, T2: 1, brand_owned: 2, T3: 3 };
          return (tierOrder[a.tier] || 3) - (tierOrder[b.tier] || 3);
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

    return { segmentLabel: segLabel, top5, deepDives };
  });

  const crossSegmentOverlap = Array.from(allCompetitorMap.entries())
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

  if (citationReport) {
    brandUniqueDomains = citationReport.globalAuthority?.uniqueDomains || 0;
    brandAuthorityLabel = citationReport.globalAuthority?.label || "unknown";
    for (const crSeg of citationReport.segments || []) {
      const brandComp = crSeg.scores?.brand?.comparative;
      if (brandComp) {
        brandCompPagesPresent += brandComp.presentOnSurfaces || 0;
        brandCompPagesTotal += brandComp.totalComparisonSurfaces || 0;
      }
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
          if (!brandDomains.has(td.domain?.toLowerCase()) && (td.tier === "T1" || td.tier === "T2")) {
            const already = missingSources.some(m => m.domain === td.domain);
            if (!already) {
              missingSources.push({ domain: td.domain, tier: td.tier || "T3" });
              if (missingSources.length >= 10) break;
            }
          }
        }
      }
    }

    return {
      segmentLabel: segLabel,
      quickWins: crSeg?.action?.primary || "No specific recommendations available.",
      secondaryAction: crSeg?.action?.secondary || "",
      getListedHere,
      useThesePhrases,
      missingSources,
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

  return {
    meta: {
      brandName: session.brandName,
      brandDomain: session.brandDomain || null,
      sessionId: session.id,
      analyzedAt: session.createdAt || new Date().toISOString(),
      segmentCount: segments.length,
      totalRuns: segments.reduce((sum, s) => sum + (s.scoringResult?.raw_runs?.length || 0), 0),
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
      },
    },
    section3: { gapAnalysis, recommendations, modelUnderstanding },
  };
}

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Loader2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Shield,
  Target,
  BarChart3,
  Trophy,
  Search,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";

interface RawRunInput {
  prompt: string;
  engine: string;
  response: string;
  brands_found: string[];
  rank: number | null;
  citations?: { url: string; title?: string }[];
  cluster?: string;
}

interface SegmentInput {
  id: string;
  persona?: string;
  seedType: string;
  customerType: string;
  location?: string;
  scoringResult?: {
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
    raw_runs?: RawRunInput[];
  };
}

interface EvidenceItem {
  snippet: string;
  source: string;
  domain: string;
  url: string;
  tier?: string;
}

interface FactorEvidence {
  factor: "authority" | "context" | "comparative";
  factorLabel: string;
  brandLabel: string;
  competitorALabel: string;
  competitorBLabel: string;
  brandEvidence: EvidenceItem[];
  competitorAEvidence: EvidenceItem[];
  competitorBEvidence: EvidenceItem[];
  absenceStatement: string | null;
  summary: string;
}

interface ComparisonTarget {
  name: string;
  appearance_rate: number;
  isBrand: boolean;
}

interface SegmentAnalysisResult {
  segmentId: string;
  segmentLabel: string;
  comparison: {
    segmentId: string;
    brand: ComparisonTarget;
    competitors: [ComparisonTarget, ComparisonTarget];
    topK: ComparisonTarget[];
  };
  scores: {
    brand: BrandScore;
    competitorA: BrandScore;
    competitorB: BrandScore;
  };
  evidence: {
    segmentId: string;
    winner: string;
    winnerReason: string;
    winnerSnippet: EvidenceItem | null;
    brandSnippet: EvidenceItem | null;
    factors: FactorEvidence[];
  };
  action: {
    primary: string;
    secondary: string | null;
    gapType: string;
  };
  modelUnderstanding?: string;
  differential?: {
    summary: string;
    points: {
      statement: string;
      competitorExamples: { quote: string; sourceUrl: string; sourceDomain: string; sourceTitle: string }[];
      brandExamples: { quote: string; sourceUrl: string; sourceDomain: string; sourceTitle: string }[];
    }[];
  };
}

interface BrandScore {
  brand: string;
  authority: {
    label: string;
    totalScore: number;
    supportingDomains: number;
    topDomains: { domain: string; tier: string; snippet: string; pageUrl?: string; pageTitle?: string }[];
  };
  context: {
    label: string;
    categoryRate: number;
    audienceRate: number;
    totalSnippets: number;
    explicitCategory: number;
    weakCategory: number;
    explicitAudience: number;
    weakAudience: number;
    adjacentAudience: number;
    explicitSnippets: any[];
    weakSnippets: any[];
    genericSnippets: any[];
  };
  comparative: {
    label: string;
    presentOnSurfaces: number;
    totalComparisonSurfaces: number;
    weightedScore: number;
    comparisonPages: { domain: string; url: string; title: string; present: boolean; position: number | null }[];
  };
}

interface GlobalAuthority {
  label: string;
  uniqueDomains: number;
  highTierDomains: { domain: string; tier: string }[];
  totalMentions: number;
}

interface FullAnalysisReport {
  brandName: string;
  segments: SegmentAnalysisResult[];
  globalAuthority: GlobalAuthority;
  totalCitationsCrawled: number;
  totalAccessible: number;
  analyzedAt: string;
}

interface SegmentCitationAnalyzerProps {
  brandName: string;
  sessionId?: number | null;
  groupKey?: string | null;
  segments: {
    id: string;
    persona?: string;
    seedType: string;
    customerType: string;
    location?: string;
    scoringResult: any;
  }[];
}

const strengthValue: Record<string, number> = {
  strong: 4,
  medium: 3,
  weak: 2,
  absent: 1,
};

const strengthBadge: Record<string, string> = {
  strong: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  weak: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  absent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function getOverallRank(seg: SegmentAnalysisResult, brandName: string): number {
  const scores = [
    { name: seg.scores.brand.brand, val: seg.comparison.brand.appearance_rate },
    { name: seg.scores.competitorA.brand, val: seg.comparison.competitors[0]?.appearance_rate || 0 },
    { name: seg.scores.competitorB.brand, val: seg.comparison.competitors[1]?.appearance_rate || 0 },
  ];
  scores.sort((a, b) => b.val - a.val);
  let pos = 1;
  for (let i = 0; i < scores.length; i++) {
    if (i > 0 && scores[i].val < scores[i - 1].val) pos = i + 1;
    if (scores[i].name === brandName) return pos;
  }
  return 3;
}

function getInternalFactorRanks(factors: FactorEvidence[]): Record<string, number> {
  const vals = factors.map(f => ({
    factor: f.factor,
    val: strengthValue[f.brandLabel] || 0,
  }));
  vals.sort((a, b) => b.val - a.val);
  const ranks: Record<string, number> = {};
  let pos = 1;
  for (let i = 0; i < vals.length; i++) {
    if (i > 0 && vals[i].val < vals[i - 1].val) pos = i + 1;
    ranks[vals[i].factor] = pos;
  }
  return ranks;
}

const medalColor: Record<number, string> = {
  1: "text-amber-500",
  2: "text-slate-400",
  3: "text-orange-500 dark:text-orange-400",
};

const rankBadgeStyle: Record<number, string> = {
  1: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700",
  2: "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-600",
  3: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/15 dark:text-orange-400 dark:border-orange-700",
};

const rankLabel: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };

const factorIcons: Record<string, typeof Shield> = {
  authority: Shield,
  context: Target,
  comparative: BarChart3,
};

export function SegmentCitationAnalyzer({ brandName, sessionId, groupKey, segments }: SegmentCitationAnalyzerProps) {
  const [report, setReport] = useState<FullAnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPersisted, setLoadingPersisted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSegments, setExpandedSegments] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<{ step: string; detail: string; pct: number } | null>(null);
  const [crawlResult, setCrawlResult] = useState<{ crawled: number; failed: number } | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const segmentsWithScores = segments.filter(s => s.scoringResult);
  const cacheId = sessionId || groupKey;

  useEffect(() => {
    if (!cacheId) return;
    let cancelled = false;
    setLoadingPersisted(true);
    fetch(`/api/multi-segment-sessions/${cacheId}/citation-report`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data.report) {
          setReport(data.report);
          const allIds = new Set((data.report.segments || []).map((s: SegmentAnalysisResult) => s.segmentId));
          setExpandedSegments(allIds);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingPersisted(false); });
    return () => { cancelled = true; };
  }, [cacheId]);

  const unknownCount = useRef(0);
  const startProgressPolling = (key: string) => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    unknownCount.current = 0;
    progressInterval.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/segment-analysis/progress/${key}`);
        const data = await res.json();
        if (data.step === "unknown") {
          unknownCount.current++;
          if (unknownCount.current >= 3) {
            setProgress({ step: "lost", detail: "Server connection lost — analysis may have been interrupted by a deployment. Please re-run.", pct: 0 });
            if (progressInterval.current) clearInterval(progressInterval.current);
            progressInterval.current = null;
            setLoading(false);
          }
          return;
        }
        unknownCount.current = 0;
        setProgress(data);
        if (data.step === "complete" || data.step === "error") {
          if (progressInterval.current) clearInterval(progressInterval.current);
          progressInterval.current = null;
        }
      } catch {
        unknownCount.current++;
        if (unknownCount.current >= 3) {
          setProgress({ step: "lost", detail: "Server connection lost — analysis may have been interrupted. Please re-run.", pct: 0 });
          if (progressInterval.current) clearInterval(progressInterval.current);
          progressInterval.current = null;
          setLoading(false);
        }
      }
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    setProgress({ step: "starting", detail: "Initializing analysis...", pct: 0 });
    setCrawlResult(null);
    try {
      const payload: SegmentInput[] = segmentsWithScores.map(s => ({
        id: s.id,
        persona: s.persona,
        seedType: s.seedType,
        customerType: s.customerType,
        location: s.location,
        scoringResult: s.scoringResult,
      }));

      const progressKey = sessionId ? `session-${sessionId}` : groupKey ? `group-${groupKey}` : `temp-${Date.now()}`;
      startProgressPolling(progressKey);

      const res = await apiRequest("POST", "/api/segment-analysis/analyze", {
        brandName,
        segments: payload,
        sessionId: sessionId || undefined,
        groupKey: groupKey || undefined,
        progressKey,
      });
      const data = await res.json();

      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }

      setCrawlResult({
        crawled: data.totalAccessible || 0,
        failed: (data.totalCitationsCrawled || 0) - (data.totalAccessible || 0),
      });

      setReport(data);
      const allIds = new Set(data.segments.map((s: SegmentAnalysisResult) => s.segmentId));
      setExpandedSegments(allIds);
      setProgress({ step: "complete", detail: "Analysis complete", pct: 100 });
    } catch (err) {
      setError(String(err));
      setProgress(null);
    } finally {
      setLoading(false);
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    }
  };

  const toggleSegment = (id: string) => {
    setExpandedSegments(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loadingPersisted) {
    return (
      <Card className="p-6 mt-4">
        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading saved citation analysis...</span>
        </div>
      </Card>
    );
  }

  if (!report && !loading) {
    return (
      <Card className="p-5 mt-4 border-dashed border-2 border-primary/20 bg-primary/5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2" data-testid="text-citation-analyzer-title">
              <Search className="w-4 h-4 text-primary" />
              Segment Citation Analyzer
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Understand why brands rank differently across segments by analyzing citation sources, context consistency, and comparison presence.
            </p>
          </div>
          <Button
            onClick={runAnalysis}
            disabled={segmentsWithScores.length < 1}
            size="sm"
            data-testid="button-run-citation-analysis"
          >
            <Search className="w-3.5 h-3.5 mr-1.5" />
            Analyze {segmentsWithScores.length} Segment{segmentsWithScores.length !== 1 ? "s" : ""}
          </Button>
        </div>
      </Card>
    );
  }

  if (loading) {
    const pct = progress?.pct ?? 0;
    const stepLabels: Record<string, string> = {
      starting: "Initializing...",
      targets: "Selecting comparison targets",
      dictionaries: "Building intent dictionaries",
      crawling: "Crawling citation URLs",
      snippets: "Extracting brand snippets",
      classifying: "Classifying sources",
      scoring: "Scoring brands per segment",
      global: "Computing global authority",
      complete: "Complete",
      lost: "Connection Lost",
      error: "Error",
    };
    const stepLabel = progress ? (stepLabels[progress.step] || progress.step) : "Starting...";
    const isLost = progress?.step === "lost";
    const isError = progress?.step === "error";
    return (
      <Card className={`p-6 mt-4 ${isLost || isError ? "border-destructive/50" : ""}`}>
        <div className="flex flex-col py-6 gap-4">
          <div className="flex items-center gap-3">
            {isLost || isError ? (
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
            ) : (
              <Loader2 className="w-5 h-5 animate-spin text-primary flex-shrink-0" />
            )}
            <div className="flex-1">
              <div className="text-sm font-medium" data-testid="text-analysis-step">{stepLabel}</div>
              {progress?.detail && (
                <div className="text-xs text-muted-foreground mt-0.5" data-testid="text-analysis-detail">{progress.detail}</div>
              )}
            </div>
            <div className="text-xs font-mono text-muted-foreground" data-testid="text-analysis-pct">{pct}%</div>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden" data-testid="progress-bar-container">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
              style={{ width: `${pct}%` }}
              data-testid="progress-bar-fill"
            />
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-5 mt-4 border-red-200 dark:border-red-900">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4" />
          Analysis failed: {error}
        </div>
        <Button onClick={runAnalysis} size="sm" variant="outline" className="mt-3" data-testid="button-retry-citation-analysis">
          Retry
        </Button>
      </Card>
    );
  }

  if (!report || report.segments.length === 0) {
    return (
      <Card className="p-5 mt-4">
        <div className="text-sm text-muted-foreground">No citation analysis results available.</div>
      </Card>
    );
  }

  const ga = report.globalAuthority;

  return (
    <div className="mt-4 space-y-4" data-testid="segment-citation-results">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Search className="w-4 h-4 text-primary" />
          Citation Analysis — {report.brandName}
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            {report.totalAccessible} crawled
          </span>
          {(report.totalCitationsCrawled - report.totalAccessible) > 0 && (
            <span className="flex items-center gap-1 text-orange-500">
              <AlertTriangle className="w-3 h-3" />
              {report.totalCitationsCrawled - report.totalAccessible} failed
            </span>
          )}
          <Button onClick={runAnalysis} size="sm" variant="ghost" className="h-7 text-xs" data-testid="button-rerun-citation-analysis">
            Re-run
          </Button>
        </div>
      </div>

      {ga && (
        <Card className="p-3 bg-muted/30" data-testid="card-global-authority">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium">Global Model Familiarity</span>
              <Badge className={`${ga.label === "High" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : ga.label === "Moderate" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"} text-[10px]`}>
                {ga.label}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              Mentioned across {ga.uniqueDomains} third-party domain{ga.uniqueDomains !== 1 ? "s" : ""}
            </span>
          </div>
          {ga.highTierDomains.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {ga.highTierDomains.map((d, i) => (
                <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">
                  {d.domain}
                  <span className="ml-1 opacity-60">{d.tier}</span>
                </Badge>
              ))}
            </div>
          )}
        </Card>
      )}

      <AnimatePresence mode="popLayout">
        {report.segments.map((seg) => (
          <motion.div
            key={seg.segmentId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <SegmentCard
              seg={seg}
              brandName={report.brandName}
              expanded={expandedSegments.has(seg.segmentId)}
              onToggle={() => toggleSegment(seg.segmentId)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function SegmentCard({
  seg,
  brandName,
  expanded,
  onToggle,
}: {
  seg: SegmentAnalysisResult;
  brandName: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const compAName = seg.comparison.competitors[0]?.name || "Competitor A";
  const compBName = seg.comparison.competitors[1]?.name || "Competitor B";
  return (
    <Card className="overflow-hidden" data-testid={`card-citation-segment-${seg.segmentId}`}>
      <Collapsible open={expanded} onOpenChange={onToggle}>
        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors text-left">
          <div className="flex items-center gap-3 min-w-0">
            {expanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{seg.segmentLabel}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                vs {compAName} & {compBName}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {(() => {
              const overallRank = getOverallRank(seg, brandName);
              const style = rankBadgeStyle[overallRank] || rankBadgeStyle[3];
              const color = medalColor[overallRank] || medalColor[3];
              const internalRanks = getInternalFactorRanks(seg.evidence.factors);
              return (
                <>
                  <Badge className={`${style} text-[10px] border`}>
                    <Trophy className={`w-3 h-3 mr-1 ${color}`} />
                    {rankLabel[overallRank]}
                    {overallRank === 1 && (
                      <span className="ml-1 bg-amber-500 text-white text-[8px] font-bold uppercase rounded-full px-1.5 py-0">Winner</span>
                    )}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {seg.evidence.factors.map(f => {
                      const fRank = internalRanks[f.factor] || 3;
                      const fColor = medalColor[fRank] || medalColor[3];
                      const Icon = factorIcons[f.factor] || Target;
                      return (
                        <span key={f.factor} className="inline-flex items-center gap-0.5" title={`${f.factorLabel}: ${rankLabel[fRank]}`}>
                          <Icon className="w-3 h-3 text-muted-foreground" />
                          <Trophy className={`w-2.5 h-2.5 ${fColor}`} />
                        </span>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4 border-t">
            <div className="pt-3 grid grid-cols-4 gap-3 text-xs">
              <div className="font-medium text-muted-foreground uppercase tracking-wide pt-6">Factor</div>
              <BrandHeader name={brandName} isYou />
              <BrandHeader name={compAName} />
              <BrandHeader name={compBName} />

              {seg.evidence.factors.map(f => (
                <FactorRow key={f.factor} factor={f} brandName={brandName} compAName={compAName} compBName={compBName} />
              ))}
            </div>

            {seg.modelUnderstanding && (
              <div className="bg-muted/40 rounded-lg p-3" data-testid={`model-understanding-${seg.segmentId}`}>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">The model understands {brandName} as</div>
                <div className="text-xs font-semibold italic">"{seg.modelUnderstanding}"</div>
              </div>
            )}

            {seg.differential && seg.differential.summary !== `${brandName} has competitive positioning in this segment` && seg.differential.summary !== "Insufficient citation data for differential analysis" && (
              <div className="bg-orange-50 dark:bg-orange-900/10 rounded-lg p-3 space-y-3" data-testid={`differential-${seg.segmentId}`}>
                <div className="text-[10px] uppercase tracking-wide text-orange-700 dark:text-orange-400">Why competitors rank higher</div>
                {seg.differential.points.length === 0 && (
                  <p className="text-xs leading-relaxed text-orange-800 dark:text-orange-300">{seg.differential.summary}</p>
                )}
                {seg.differential.points.map((pt, pi) => (
                  <div key={pi} className="space-y-1.5">
                    <p className="text-xs font-medium text-orange-800 dark:text-orange-300">{pt.statement}</p>
                    {pt.competitorExamples.length > 0 && (
                      <div className="pl-2 border-l-2 border-orange-200 dark:border-orange-800 space-y-1">
                        {pt.competitorExamples.map((ex, ei) => (
                          <div key={ei} className="text-[11px] text-orange-700 dark:text-orange-400">
                            <span className="italic">"{ex.quote}"</span>
                            <span className="text-[10px] ml-1 text-orange-500 dark:text-orange-500">
                              — {ex.sourceUrl ? (
                                <a href={ex.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-orange-700 dark:hover:text-orange-300" data-testid={`link-diff-comp-${pi}-${ei}`}>{ex.sourceDomain}</a>
                              ) : ex.sourceDomain}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {pt.brandExamples.length > 0 && (
                      <div className="pl-2 border-l-2 border-orange-100 dark:border-orange-900 space-y-1">
                        <div className="text-[10px] text-orange-500 dark:text-orange-600">{brandName}'s mentions:</div>
                        {pt.brandExamples.map((ex, ei) => (
                          <div key={ei} className="text-[11px] text-orange-600 dark:text-orange-500">
                            <span className="italic">"{ex.quote}"</span>
                            <span className="text-[10px] ml-1 text-orange-400 dark:text-orange-600">
                              — {ex.sourceUrl ? (
                                <a href={ex.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-orange-600 dark:hover:text-orange-400" data-testid={`link-diff-brand-${pi}-${ei}`}>{ex.sourceDomain}</a>
                              ) : ex.sourceDomain}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {seg.action.gapType !== "none" && (
              <div className="bg-primary/5 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <Lightbulb className="w-3.5 h-3.5" />
                  Recommended Action
                </div>
                <p className="text-xs leading-relaxed">{seg.action.primary}</p>
                {seg.action.secondary && (
                  <p className="text-xs leading-relaxed text-muted-foreground">{seg.action.secondary}</p>
                )}
              </div>
            )}

            {seg.action.gapType === "none" && (
              <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-3 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-green-700 dark:text-green-400">Well Positioned</div>
                  <p className="text-xs text-green-600 dark:text-green-400/80 mt-0.5">{seg.action.primary}</p>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function BrandHeader({ name, isYou }: { name: string; isYou?: boolean }) {
  return (
    <div className="text-center">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
        {isYou ? "You" : ""}
      </div>
      <div className="text-xs font-medium truncate" title={name}>{name}</div>
    </div>
  );
}

function FactorRow({
  factor,
  brandName,
  compAName,
  compBName,
}: {
  factor: FactorEvidence;
  brandName: string;
  compAName: string;
  compBName: string;
}) {
  const [showEvidence, setShowEvidence] = useState(false);
  const Icon = factorIcons[factor.factor] || Target;

  return (
    <>
      <div className="flex items-start gap-1.5 pt-2">
        <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <div className="font-medium text-xs">{factor.factorLabel}</div>
          <button
            onClick={() => setShowEvidence(!showEvidence)}
            className="text-[10px] text-primary hover:underline mt-0.5"
            data-testid={`button-toggle-evidence-${factor.factor}`}
          >
            {showEvidence ? "Hide evidence" : "Show evidence"}
          </button>
        </div>
      </div>

      <StrengthCell label={factor.brandLabel} summary={factor.summary} />
      <StrengthCell label={factor.competitorALabel} />
      <StrengthCell label={factor.competitorBLabel} />

      {showEvidence && (
        <div className="col-span-4 bg-muted/30 rounded-lg p-3 space-y-3">
          {factor.absenceStatement && (
            <div className="flex items-start gap-1.5 text-xs text-orange-600 dark:text-orange-400">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {factor.absenceStatement}
            </div>
          )}

          <EvidenceColumn label={brandName} items={factor.brandEvidence} isYou />
          {factor.competitorAEvidence.length > 0 && (
            <EvidenceColumn label={compAName} items={factor.competitorAEvidence} />
          )}
          {factor.competitorBEvidence.length > 0 && (
            <EvidenceColumn label={compBName} items={factor.competitorBEvidence} />
          )}

          {factor.brandEvidence.length === 0 && factor.competitorAEvidence.length === 0 && factor.competitorBEvidence.length === 0 && (
            <div className="text-xs text-muted-foreground italic">No supporting evidence found for this factor.</div>
          )}
        </div>
      )}
    </>
  );
}

function StrengthCell({ label, summary }: { label: string; summary?: string }) {
  return (
    <div className="text-center pt-2">
      <Badge className={`${strengthBadge[label] || strengthBadge.absent} text-[10px] px-1.5 py-0`}>
        {label}
      </Badge>
      {summary && (
        <div className="text-[10px] text-muted-foreground mt-1 leading-tight">{summary}</div>
      )}
    </div>
  );
}

function EvidenceColumn({ label, items, isYou }: { label: string; items: EvidenceItem[]; isYou?: boolean }) {
  if (items.length === 0) return null;

  return (
    <div>
      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
        {isYou ? `${label} (You)` : label}
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <div className="min-w-0 flex-1">
              <div className="text-foreground leading-relaxed">{item.snippet}</div>
              <div className="flex items-center gap-1.5 mt-0.5 text-muted-foreground">
                <span className="truncate max-w-[200px]">{item.source}</span>
                {item.tier && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0">{item.tier}</Badge>
                )}
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

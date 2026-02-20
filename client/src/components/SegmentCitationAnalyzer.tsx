import { useState } from "react";
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
}

interface BrandScore {
  brand: string;
  authority: {
    label: string;
    totalScore: number;
    supportingDomains: number;
    topDomains: { domain: string; tier: string; snippet: string }[];
  };
  context: {
    label: string;
    categoryRate: number;
    audienceRate: number;
    totalSnippets: number;
    explicitSnippets: any[];
    weakSnippets: any[];
    genericSnippets: any[];
  };
  comparative: {
    label: string;
    presentOnSurfaces: number;
    totalComparisonSurfaces: number;
    comparisonPages: { domain: string; url: string; title: string; present: boolean; position: number | null }[];
  };
}

interface FullAnalysisReport {
  brandName: string;
  segments: SegmentAnalysisResult[];
  totalCitationsCrawled: number;
  totalAccessible: number;
  analyzedAt: string;
}

interface SegmentCitationAnalyzerProps {
  brandName: string;
  segments: {
    id: string;
    seedType: string;
    customerType: string;
    location?: string;
    scoringResult: any;
  }[];
}

const strengthColor: Record<string, string> = {
  strong: "text-green-600 dark:text-green-400",
  medium: "text-yellow-600 dark:text-yellow-400",
  weak: "text-orange-500 dark:text-orange-400",
  absent: "text-red-500 dark:text-red-400",
};

const strengthBadge: Record<string, string> = {
  strong: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  weak: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  absent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const factorIcons: Record<string, typeof Shield> = {
  authority: Shield,
  context: Target,
  comparative: BarChart3,
};

export function SegmentCitationAnalyzer({ brandName, segments }: SegmentCitationAnalyzerProps) {
  const [report, setReport] = useState<FullAnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSegments, setExpandedSegments] = useState<Set<string>>(new Set());

  const segmentsWithScores = segments.filter(s => s.scoringResult);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload: SegmentInput[] = segmentsWithScores.map(s => ({
        id: s.id,
        seedType: s.seedType,
        customerType: s.customerType,
        location: s.location,
        scoringResult: s.scoringResult,
      }));

      const res = await apiRequest("POST", "/api/segment-analysis/analyze", {
        brandName,
        segments: payload,
      });
      const data = await res.json();
      setReport(data);
      const allIds = new Set(data.segments.map((s: SegmentAnalysisResult) => s.segmentId));
      setExpandedSegments(allIds);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
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
    return (
      <Card className="p-6 mt-4">
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <div className="text-sm font-medium">Analyzing citation sources...</div>
          <div className="text-xs text-muted-foreground">
            Crawling URLs, extracting snippets, classifying sources, and scoring brands
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

  return (
    <div className="mt-4 space-y-4" data-testid="segment-citation-results">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Search className="w-4 h-4 text-primary" />
          Citation Analysis — {report.brandName}
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{report.totalCitationsCrawled} URLs crawled</span>
          <span>{report.totalAccessible} accessible</span>
          <Button onClick={runAnalysis} size="sm" variant="ghost" className="h-7 text-xs" data-testid="button-rerun-citation-analysis">
            Re-run
          </Button>
        </div>
      </div>

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
  const isWinner = seg.evidence.winner === brandName;

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
            {isWinner ? (
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px]">
                <Trophy className="w-3 h-3 mr-1" />
                Leading
              </Badge>
            ) : (
              <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[10px]">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Behind
              </Badge>
            )}
            {seg.evidence.factors.map(f => {
              const Icon = factorIcons[f.factor] || Target;
              return (
                <span key={f.factor} className={`inline-flex items-center gap-0.5 text-[10px] ${strengthColor[f.brandLabel]}`}>
                  <Icon className="w-3 h-3" />
                  {f.brandLabel}
                </span>
              );
            })}
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

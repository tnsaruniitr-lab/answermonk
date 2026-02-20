import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Lightbulb,
  AlertTriangle,
  Shield,
  Target,
  TrendingUp,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Loader2,
  Search,
  Users,
  Globe,
  Eye,
  Zap,
  BarChart3,
  Building2,
  Newspaper,
  Star,
  FileText,
} from "lucide-react";

interface InsightCard {
  id: string;
  type: "elimination" | "competitor" | "attribution" | "opportunity" | "strength";
  severity: "high" | "medium" | "low" | "info";
  title: string;
  body: string;
  evidence: string[];
  recommendation: string;
  affectedDimension: string | null;
}

interface InsightsReport {
  generatedAt: string;
  brandName: string;
  dimensions: {
    category: string;
    geo: string;
    audience: string;
    qualifier: string;
    rawQuery: string;
  };
  overallConfidence: number;
  eliminationRisk: string;
  cards: InsightCard[];
  score: {
    brandScore: {
      brandName: string;
      sourcePresenceRate: number;
      avgListPosition: number | null;
      citationCoverage: number;
      dimensionSupport: Record<string, number>;
      eliminationRisk: string;
      overallConfidence: number;
    };
    competitorScores: Array<{
      brandName: string;
      sourcePresenceRate: number;
      overallConfidence: number;
    }>;
    attributionChecks: Array<{
      engine: string;
      citationCount: number;
      hasCitations: boolean;
      evidenceType: string;
    }>;
    summary: {
      totalSourcesCrawled: number;
      accessibleSources: number;
      comparisonSurfaces: number;
      brandFoundInSources: number;
      avgSourceCredibility: number;
      crossEngineSources: number;
    };
  };
  competitorInsights: Array<{
    name: string;
    mentionCount: number;
    sourceCount: number;
    strengthFactors: string[];
    evidenceType: string;
  }>;
  topSources: Array<{
    url: string;
    domain: string;
    relevance: string;
    brandsFound: string[];
    surfaceType?: string;
    crossEngineCitations?: number;
  }>;
  allSourcesCount?: number;
}

const SEVERITY_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  high: { bg: "bg-red-50 dark:bg-red-950/20", border: "border-red-200 dark:border-red-900/40", icon: "text-red-500" },
  medium: { bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-200 dark:border-amber-900/40", icon: "text-amber-500" },
  low: { bg: "bg-blue-50 dark:bg-blue-950/20", border: "border-blue-200 dark:border-blue-900/40", icon: "text-blue-500" },
  info: { bg: "bg-slate-50 dark:bg-slate-900/20", border: "border-slate-200 dark:border-slate-800", icon: "text-slate-500" },
};

const TYPE_ICONS: Record<string, any> = {
  elimination: AlertTriangle,
  competitor: Users,
  attribution: Eye,
  opportunity: Target,
  strength: Shield,
};

const ENGINE_NAMES: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  claude: "Claude",
};

const SURFACE_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  comparison: { label: "Comparison", icon: BarChart3, color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" },
  authority: { label: "Authority", icon: Newspaper, color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" },
  eligibility: { label: "Eligibility", icon: FileText, color: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400" },
  brand_owned: { label: "Brand Site", icon: Building2, color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" },
  competitor_owned: { label: "Competitor", icon: Users, color: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400" },
  unknown: { label: "Other", icon: Globe, color: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400" },
};

function ConfidenceGauge({ value, label }: { value: number; label: string }) {
  const color = value >= 60 ? "text-emerald-500" : value >= 30 ? "text-amber-500" : "text-red-500";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-secondary"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${value}, 100`}
            className={color}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-bold ${color}`}>{value}</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
}

function InsightCardComponent({ card }: { card: InsightCard }) {
  const [expanded, setExpanded] = useState(false);
  const styles = SEVERITY_STYLES[card.severity] || SEVERITY_STYLES.info;
  const Icon = TYPE_ICONS[card.type] || Lightbulb;

  return (
    <div className={`border rounded-lg ${styles.border} ${styles.bg} overflow-hidden`}>
      <button
        className="w-full text-left px-4 py-3 flex items-start gap-3"
        onClick={() => setExpanded(!expanded)}
        data-testid={`button-insight-${card.id}`}
      >
        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${styles.icon}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">{card.title}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-medium ${
              card.severity === "high" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" :
              card.severity === "medium" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
              card.severity === "low" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
              "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}>
              {card.severity}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{card.body}</p>
        </div>
        <div className="shrink-0 mt-1">
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-inherit">
          <div className="pt-3">
            <p className="text-xs text-muted-foreground">{card.body}</p>
          </div>
          <div className="bg-background/60 rounded-md p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium">Recommendation</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{card.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function AnalysisSummary({ report }: { report: InsightsReport }) {
  const s = report.score.summary;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <Card className="p-3 space-y-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Sources Crawled</span>
        <div className="text-lg font-bold">{s.totalSourcesCrawled}</div>
        <span className="text-[10px] text-muted-foreground">{s.accessibleSources} accessible</span>
      </Card>
      <Card className="p-3 space-y-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Pages Analyzed</span>
        <div className="text-lg font-bold">{report.allSourcesCount || s.comparisonSurfaces}</div>
        <span className="text-[10px] text-muted-foreground">{s.brandFoundInSources} mention you</span>
      </Card>
      <Card className="p-3 space-y-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Source Quality</span>
        <div className="text-lg font-bold">{s.avgSourceCredibility}%</div>
        <span className="text-[10px] text-muted-foreground">avg credibility</span>
      </Card>
      <Card className="p-3 space-y-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Cross-Engine</span>
        <div className="text-lg font-bold">{s.crossEngineSources}</div>
        <span className="text-[10px] text-muted-foreground">cited by 2+ engines</span>
      </Card>
    </div>
  );
}

function DimensionBreakdown({ dimensions, support }: { dimensions: InsightsReport["dimensions"]; support: Record<string, number> }) {
  const dims = [
    { key: "category", label: "Category", value: dimensions.category, icon: Search },
    { key: "geo", label: "Geography", value: dimensions.geo, icon: Globe },
    { key: "audience", label: "Audience", value: dimensions.audience, icon: Users },
    { key: "qualifier", label: "Qualifier", value: dimensions.qualifier, icon: TrendingUp },
  ];

  return (
    <div className="mb-6">
      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-muted-foreground" />
        Intent Dimension Coverage
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {dims.map(d => {
          const pct = Math.round((support[d.key] || 0) * 100);
          const color = pct >= 60 ? "bg-emerald-500" : pct >= 30 ? "bg-amber-500" : "bg-red-500";
          return (
            <Card key={d.key} className="p-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <d.icon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{d.label}</span>
              </div>
              <span className="text-xs font-medium block truncate">{d.value}</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] font-medium w-8 text-right">{pct}%</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function AttributionSection({ checks }: { checks: InsightsReport["score"]["attributionChecks"] }) {
  return (
    <div className="mb-6">
      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
        <Eye className="w-4 h-4 text-muted-foreground" />
        Attribution by Engine
      </h4>
      <div className="grid grid-cols-3 gap-3">
        {checks.map(c => (
          <Card key={c.engine} className="p-3 space-y-1.5">
            <span className="text-xs font-medium">{ENGINE_NAMES[c.engine] || c.engine}</span>
            <div className="text-lg font-bold">{c.citationCount}</div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded inline-block ${
              c.evidenceType === "citation_driven" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" :
              c.evidenceType === "mixed" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
              "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}>
              {c.evidenceType === "citation_driven" ? "Citation-driven" : c.evidenceType === "mixed" ? "Mixed" : "Model knowledge"}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SurfaceTypeBadge({ surfaceType }: { surfaceType: string }) {
  const config = SURFACE_TYPE_CONFIG[surfaceType] || SURFACE_TYPE_CONFIG.unknown;
  const Icon = config.icon;
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded inline-flex items-center gap-1 ${config.color}`}>
      <Icon className="w-2.5 h-2.5" />
      {config.label}
    </span>
  );
}

function TopSourcesList({ sources, allSourcesCount }: { sources: InsightsReport["topSources"]; allSourcesCount?: number }) {
  const [showAll, setShowAll] = useState(false);
  if (sources.length === 0) return null;

  const initialCount = 10;
  const displaySources = showAll ? sources : sources.slice(0, initialCount);
  const hasMore = sources.length > initialCount;

  return (
    <div className="mb-6">
      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
        <Globe className="w-4 h-4 text-muted-foreground" />
        Key Sources Analyzed
        <span className="text-[10px] text-muted-foreground font-normal">
          ({sources.length} total)
        </span>
      </h4>
      <Card className="divide-y divide-border max-h-[500px] overflow-y-auto">
        {displaySources.map((s, idx) => (
          <a
            key={idx}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/50 transition-colors group"
            data-testid={`link-insight-source-${idx}`}
          >
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0 group-hover:text-blue-500" />
            <div className="min-w-0 flex-1">
              <span className="text-sm text-blue-600 dark:text-blue-400 group-hover:underline truncate block">
                {s.domain}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-muted-foreground">
                  {s.brandsFound.length} brand{s.brandsFound.length !== 1 ? "s" : ""} found
                </span>
                {s.crossEngineCitations && s.crossEngineCitations >= 2 && (
                  <span className="text-[10px] text-muted-foreground">
                    {s.crossEngineCitations} engines
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {s.surfaceType && <SurfaceTypeBadge surfaceType={s.surfaceType} />}
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                s.relevance === "high" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" :
                s.relevance === "medium" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
                "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}>
                {s.relevance}
              </span>
            </div>
          </a>
        ))}
      </Card>
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto"
          data-testid="button-show-all-sources"
        >
          {showAll ? (
            <>
              <ChevronDown className="w-3 h-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronRight className="w-3 h-3" />
              Show all {sources.length} sources
            </>
          )}
        </button>
      )}
    </div>
  );
}

function InsightsDisplay({ report }: { report: InsightsReport }) {
  const eliminationCards = report.cards.filter(c => c.type === "elimination");
  const competitorCards = report.cards.filter(c => c.type === "competitor");
  const opportunityCards = report.cards.filter(c => c.type === "opportunity");
  const otherCards = report.cards.filter(c => !["elimination", "competitor", "opportunity"].includes(c.type));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <ConfidenceGauge value={report.overallConfidence} label="Citation Confidence" />
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold">Insights for {report.brandName}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Analyzed {report.allSourcesCount || report.score.summary.totalSourcesCrawled} citation sources across {report.score.attributionChecks.length} AI engines.
            {report.eliminationRisk !== "none" && (
              <span className={`ml-1 font-medium ${
                report.eliminationRisk === "high" ? "text-red-500" :
                report.eliminationRisk === "medium" ? "text-amber-500" : "text-blue-500"
              }`}>
                Elimination risk: {report.eliminationRisk}
              </span>
            )}
          </p>
        </div>
      </div>

      <AnalysisSummary report={report} />

      <DimensionBreakdown
        dimensions={report.dimensions}
        support={report.score.brandScore.dimensionSupport}
      />

      <AttributionSection checks={report.score.attributionChecks} />

      {eliminationCards.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Elimination Signals ({eliminationCards.length})
          </h4>
          <div className="space-y-2">
            {eliminationCards.map(card => (
              <InsightCardComponent key={card.id} card={card} />
            ))}
          </div>
        </div>
      )}

      {competitorCards.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-500" />
            Competitor Insights ({competitorCards.length})
          </h4>
          <div className="space-y-2">
            {competitorCards.map(card => (
              <InsightCardComponent key={card.id} card={card} />
            ))}
          </div>
        </div>
      )}

      {opportunityCards.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-500" />
            Opportunities ({opportunityCards.length})
          </h4>
          <div className="space-y-2">
            {opportunityCards.map(card => (
              <InsightCardComponent key={card.id} card={card} />
            ))}
          </div>
        </div>
      )}

      {otherCards.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-muted-foreground" />
            Additional Insights
          </h4>
          <div className="space-y-2">
            {otherCards.map(card => (
              <InsightCardComponent key={card.id} card={card} />
            ))}
          </div>
        </div>
      )}

      <TopSourcesList sources={report.topSources} allSourcesCount={report.allSourcesCount} />
    </div>
  );
}

interface InsightsPanelProps {
  jobId: number;
  brandName: string;
  brandDomain?: string | null;
}

export default function InsightsPanel({ jobId, brandName, brandDomain }: InsightsPanelProps) {
  const queryClient = useQueryClient();

  const { data: existingReport, isLoading: loadingExisting } = useQuery<InsightsReport | null>({
    queryKey: ["/api/insights", jobId],
    queryFn: async () => {
      const res = await fetch(`/api/insights/${jobId}`);
      if (!res.ok) {
        if (res.status === 404) {
          const body = await res.json().catch(() => ({}));
          if (body.insightsStatus === "running") {
            return { _status: "running" } as any;
          }
          return null;
        }
        throw new Error("Failed to fetch insights");
      }
      return res.json();
    },
    refetchInterval: (query) => {
      const data = query.state.data as any;
      if (data?._status === "running") return 5000;
      return false;
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/insights/analyze", {
        jobId,
        competitorNames: [],
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/insights", jobId], data);
      queryClient.invalidateQueries({ queryKey: ["/api/scoring/results", jobId] });
    },
  });

  if (loadingExisting) {
    return (
      <div className="flex items-center gap-2 py-4">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading insights...</span>
      </div>
    );
  }

  const reportData = existingReport as any;

  if (reportData?._status === "running" || analyzeMutation.isPending) {
    return (
      <div className="text-center py-8 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
        <h3 className="text-sm font-medium">Analyzing Citation Sources...</h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Crawling and analyzing citation URLs from AI engine responses. This typically takes 30-80 seconds.
        </p>
      </div>
    );
  }

  if (existingReport && !reportData?._status) {
    return <InsightsDisplay report={existingReport} />;
  }

  return (
    <div className="text-center py-8 space-y-4">
      <div className="flex flex-col items-center gap-2">
        <Lightbulb className="w-8 h-8 text-muted-foreground" />
        <h3 className="text-sm font-medium">Analyze Citation Sources</h3>
        <p className="text-xs text-muted-foreground max-w-md">
          Crawl and analyze the citation URLs from AI engine responses to understand why competitors rank higher,
          identify elimination signals, and get actionable recommendations.
        </p>
      </div>
      <Button
        onClick={() => analyzeMutation.mutate()}
        disabled={analyzeMutation.isPending}
        className="gap-2"
        data-testid="button-analyze-sources"
      >
        {analyzeMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing Sources...
          </>
        ) : (
          <>
            <Search className="w-4 h-4" />
            Analyze Sources
          </>
        )}
      </Button>
      {analyzeMutation.isError && (
        <p className="text-xs text-red-500">
          Analysis failed. Please try again.
        </p>
      )}
    </div>
  );
}

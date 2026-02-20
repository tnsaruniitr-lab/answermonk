import { useState, useMemo } from "react";
import { useRoute, Link } from "wouter";
import { useScoringResult } from "@/hooks/use-analysis";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Globe,
  ExternalLink,
  BarChart3,
  Trophy,
  Target,
  Eye,
  TrendingUp,
  Zap,
  Filter,
  Lightbulb,
} from "lucide-react";
import InsightsPanel from "@/components/InsightsPanel";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CompetitorScore {
  name: string;
  share: number;
  appearances: number;
}

interface ClusterBreakdown {
  appearance_rate: number;
  primary_rate: number;
}

interface GEOScore {
  valid_runs: number;
  total_runs: number;
  invalid_runs: number;
  appearance_rate: number;
  primary_rate: number;
  avg_rank: number | null;
  competitors: CompetitorScore[];
  cluster_breakdown: Record<string, ClusterBreakdown>;
  engine_breakdown: Record<string, { appearance_rate: number; primary_rate: number; valid_runs: number; total_runs?: number; error_runs?: number }>;
}

interface RawRunCitation {
  url: string;
  title?: string;
}

interface RawRun {
  prompt_id: string;
  prompt_text?: string;
  cluster: string;
  engine: string;
  raw_text: string;
  citations?: RawRunCitation[];
  candidates: string[];
  brand_found: boolean;
  brand_rank: number | null;
}

const ENGINE_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  claude: "Claude",
};

const CLUSTER_LABELS: Record<string, string> = {
  direct: "Direct",
  persona: "Persona",
  budget: "Budget",
  task: "Task",
};

const CLUSTER_DESCRIPTIONS: Record<string, string> = {
  direct: "Do they know your name?",
  persona: "Right audience fit?",
  task: "Linked to your services?",
  budget: "Right price positioning?",
};

function ScoreCard({ label, value, icon: Icon, description }: { label: string; value: string; icon: any; description: string }) {
  return (
    <Card className="p-4 space-y-1">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <p className="text-[10px] text-muted-foreground leading-tight">{description}</p>
    </Card>
  );
}

function AllSourcesSection({ runs }: { runs: RawRun[] }) {
  const [copied, setCopied] = useState(false);
  const [engineFilter, setEngineFilter] = useState<string>("all");

  const allCitations = useMemo(() => {
    const seen = new Set<string>();
    const result: { url: string; title?: string; engine: string }[] = [];
    for (const r of runs) {
      if (r.citations) {
        for (const c of r.citations) {
          if (c.url && !seen.has(c.url)) {
            seen.add(c.url);
            result.push({ url: c.url, title: c.title, engine: r.engine });
          }
        }
      }
    }
    return result;
  }, [runs]);

  const filtered = engineFilter === "all" ? allCitations : allCitations.filter(c => c.engine === engineFilter);
  const engines = [...new Set(allCitations.map(c => c.engine))];

  if (allCitations.length === 0) return null;

  const handleCopy = () => {
    const text = filtered.map(c => c.url).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Globe className="w-4 h-4 text-muted-foreground" />
          All Sources ({filtered.length})
        </h3>
        <div className="flex items-center gap-2">
          {engines.length > 1 && (
            <Select value={engineFilter} onValueChange={setEngineFilter}>
              <SelectTrigger className="h-7 text-xs w-[120px]" data-testid="select-source-engine-filter">
                <Filter className="w-3 h-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Engines</SelectItem>
                {engines.map(e => (
                  <SelectItem key={e} value={e}>{ENGINE_LABELS[e] || e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 text-xs gap-1.5"
            data-testid="button-copy-all-sources"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied!" : "Copy All URLs"}
          </Button>
        </div>
      </div>
      <Card className="divide-y divide-border max-h-[500px] overflow-y-auto">
        {filtered.map((c, idx) => {
          let hostname = c.url;
          try {
            hostname = new URL(c.url).hostname.replace(/^www\./, "");
          } catch {}
          return (
            <a
              key={idx}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/50 transition-colors group"
              data-testid={`link-all-source-${idx}`}
            >
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0 group-hover:text-blue-500" />
              <div className="min-w-0 flex-1">
                <span className="text-sm text-blue-600 dark:text-blue-400 group-hover:underline truncate block">
                  {c.title || hostname}
                </span>
                <span className="text-[10px] text-muted-foreground truncate block">
                  {c.url}
                </span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground shrink-0">
                {(ENGINE_LABELS[c.engine] || c.engine).slice(0, 3)}
              </span>
            </a>
          );
        })}
      </Card>
    </div>
  );
}

function RawRunsSection({ runs }: { runs: RawRun[] }) {
  const [engineFilter, setEngineFilter] = useState<string>("all");
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const g: Record<string, RawRun[]> = {};
    for (const r of runs) {
      if (engineFilter !== "all" && r.engine !== engineFilter) continue;
      if (!g[r.prompt_id]) g[r.prompt_id] = [];
      g[r.prompt_id].push(r);
    }
    return g;
  }, [runs, engineFilter]);

  const engines = [...new Set(runs.map(r => r.engine))];

  const togglePrompt = (id: string) => {
    setExpandedPrompts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Zap className="w-4 h-4 text-muted-foreground" />
          Detailed Results
        </h3>
        {engines.length > 1 && (
          <Select value={engineFilter} onValueChange={setEngineFilter}>
            <SelectTrigger className="h-7 text-xs w-[120px]" data-testid="select-detail-engine-filter">
              <Filter className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Engines</SelectItem>
              {engines.map(e => (
                <SelectItem key={e} value={e}>{ENGINE_LABELS[e] || e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="space-y-1.5">
        {Object.entries(grouped).map(([promptId, promptRuns]) => {
          const isExpanded = expandedPrompts.has(promptId);
          const anyFound = promptRuns.some(r => r.brand_found);
          const firstRun = promptRuns[0];
          return (
            <div key={promptId} className="border border-border rounded-md overflow-hidden">
              <button
                className={`w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-secondary/30 transition-colors ${anyFound ? "" : "opacity-70"}`}
                onClick={() => togglePrompt(promptId)}
                data-testid={`button-expand-prompt-${promptId}`}
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                <span className="text-xs flex-1 truncate">{firstRun.prompt_text || promptId}</span>
                <div className="flex gap-1 shrink-0">
                  {promptRuns.map(r => (
                    <span
                      key={r.engine}
                      className={`text-[10px] px-1.5 py-0.5 rounded ${r.brand_found ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-secondary text-muted-foreground'}`}
                    >
                      {(ENGINE_LABELS[r.engine] || r.engine).slice(0, 3)}
                    </span>
                  ))}
                </div>
              </button>
              {isExpanded && (
                <div className="px-4 pb-3 space-y-3">
                  {promptRuns.map((r) => (
                    <div key={r.engine} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium">{ENGINE_LABELS[r.engine] || r.engine}</span>
                        <div className="flex items-center gap-2">
                          {r.brand_found && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                              Found {r.brand_rank !== null ? `#${r.brand_rank}` : ""}
                            </span>
                          )}
                          {r.candidates.length > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              {r.candidates.length} brands extracted
                            </span>
                          )}
                        </div>
                      </div>
                      <pre className="text-xs text-muted-foreground bg-secondary/50 rounded-md p-3 whitespace-pre-wrap font-[inherit] leading-relaxed max-h-48 overflow-y-auto">
                        {r.raw_text}
                      </pre>
                      {r.citations && r.citations.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="text-[10px] text-muted-foreground font-medium">Sources:</span>
                          {r.citations.map((c, idx) => {
                            let displayUrl = c.title || c.url;
                            try {
                              const parsed = new URL(c.url);
                              displayUrl = c.title || parsed.hostname.replace(/^www\./, '');
                            } catch {}
                            return (
                              <a
                                key={idx}
                                href={c.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0.5 rounded"
                              >
                                <Globe className="w-2.5 h-2.5 flex-shrink-0" />
                                <span className="truncate max-w-[160px]">{displayUrl}</span>
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {Object.keys(grouped).length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No results match the current filters.</p>
        )}
      </div>
    </div>
  );
}

export default function ScoringDetail() {
  const [, params] = useRoute("/scoring/:id");
  const id = params?.id ? parseInt(params.id, 10) : null;
  const { data: job, isLoading, error } = useScoringResult(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="w-full border-b border-border sticky top-0 z-50 bg-background">
          <div className="max-w-3xl mx-auto px-6 h-14 flex items-center">
            <Link href="/">
              <span className="text-base font-semibold tracking-tight" data-testid="text-logo">BrandSense</span>
            </Link>
          </div>
        </nav>
        <main className="max-w-3xl mx-auto px-6 py-10 space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-md" />)}
          </div>
          <Skeleton className="h-40 w-full" />
        </main>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="w-full border-b border-border sticky top-0 z-50 bg-background">
          <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/">
              <span className="text-base font-semibold tracking-tight">BrandSense</span>
            </Link>
            <Link href="/history">
              <Button variant="ghost" size="sm" className="gap-1.5 text-sm">
                <ArrowLeft className="w-3.5 h-3.5" /> History
              </Button>
            </Link>
          </div>
        </nav>
        <main className="max-w-3xl mx-auto px-6 py-20 text-center">
          <p className="text-muted-foreground">Result not found.</p>
        </main>
      </div>
    );
  }

  const score: GEOScore | null = job.resultJson;
  const rawRuns: RawRun[] = job.rawData?.runs || [];

  return (
    <div className="min-h-screen bg-background">
      <nav className="w-full border-b border-border sticky top-0 z-50 bg-background">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/">
            <span className="text-base font-semibold tracking-tight" data-testid="text-logo">BrandSense</span>
          </Link>
          <Link href="/history">
            <Button variant="ghost" size="sm" className="gap-1.5 text-sm" data-testid="button-back-history">
              <ArrowLeft className="w-3.5 h-3.5" /> History
            </Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="pb-6 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold tracking-tight" data-testid="text-detail-heading">
              GEO Score for {job.brandName}
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground uppercase tracking-wider font-medium">
              {job.mode}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {job.promptCount} prompts x {job.engineCount} engines
            {score ? ` = ${score.valid_runs} valid runs` : ""}
            {score && score.invalid_runs > 0 && ` (${score.invalid_runs} invalid)`}
            {job.createdAt && ` · ${format(new Date(job.createdAt), "MMM d, yyyy 'at' h:mm a")}`}
          </p>
        </div>

        {score && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <ScoreCard
                label="Appearance Rate"
                value={`${Math.round(score.appearance_rate * 100)}%`}
                icon={Eye}
                description="How often AI mentions you"
              />
              <ScoreCard
                label="Top 3 Rate"
                value={`${Math.round(score.primary_rate * 100)}%`}
                icon={Trophy}
                description="How often you're a top pick"
              />
              <ScoreCard
                label="Avg Rank"
                value={score.avg_rank !== null ? `#${score.avg_rank}` : "N/A"}
                icon={TrendingUp}
                description={score.avg_rank !== null ? "Your typical position when found" : "Not found in any responses"}
              />
            </div>

            {Object.keys(score.engine_breakdown).length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                  By Engine
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(score.engine_breakdown).map(([engine, data]) => {
                    const hasErrors = (data.error_runs ?? 0) > 0;
                    const allFailed = data.valid_runs === 0 && hasErrors;
                    return (
                      <Card key={engine} className={`p-3 space-y-1.5 ${allFailed ? "opacity-60" : ""}`}>
                        <span className="text-xs font-medium text-muted-foreground">
                          {ENGINE_LABELS[engine] || engine}
                        </span>
                        {allFailed ? (
                          <div className="text-sm text-destructive font-medium">
                            All {data.total_runs ?? 0} calls failed
                          </div>
                        ) : (
                          <>
                            <div className="text-lg font-semibold">
                              {Math.round(data.appearance_rate * 100)}%
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs text-muted-foreground">Top 3</span>
                              <span className="text-xs font-medium">{Math.round(data.primary_rate * 100)}%</span>
                            </div>
                            {hasErrors && (
                              <div className="text-xs text-destructive">
                                {data.error_runs} of {data.total_runs} calls failed
                              </div>
                            )}
                          </>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {Object.keys(score.cluster_breakdown).length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  By Query Type
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(score.cluster_breakdown).map(([cluster, data]) => (
                    <Card key={cluster} className="p-3 space-y-1.5">
                      <span className="text-xs font-medium text-muted-foreground capitalize">
                        {CLUSTER_LABELS[cluster] || cluster}
                      </span>
                      <div className="text-lg font-semibold">
                        {Math.round(data.appearance_rate * 100)}%
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        {CLUSTER_DESCRIPTIONS[cluster] || ""}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">Top 3</span>
                        <span className="text-xs font-medium">{Math.round(data.primary_rate * 100)}%</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {(() => {
              const brandEntry = {
                name: job.brandName,
                share: score.appearance_rate,
                appearances: 0,
                isBrand: true as const,
              };
              const allEntries = [brandEntry, ...score.competitors.map(c => ({ ...c, isBrand: false as const }))]
                .sort((a, b) => b.share - a.share);
              return allEntries.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    Brand & Competitor Rankings
                  </h3>
                  <Card>
                    <div className="divide-y divide-border">
                      {allEntries.map((entry, i) => (
                        <div
                          key={entry.name}
                          className={`flex items-center justify-between gap-4 px-4 py-2.5 ${entry.isBrand ? "bg-primary/10" : ""}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs text-muted-foreground font-mono w-5 text-right shrink-0">
                              {i + 1}
                            </span>
                            <span className={`text-sm truncate ${entry.isBrand ? "font-semibold text-primary" : ""}`}>
                              {entry.name}
                              {entry.isBrand && (
                                <span className="ml-1.5 text-[10px] uppercase tracking-wider font-medium text-primary/70">
                                  You
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${entry.isBrand ? "bg-primary" : "bg-foreground/40"}`}
                                style={{ width: `${Math.round(entry.share * 100)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-medium w-10 text-right ${entry.isBrand ? "text-primary" : ""}`}>
                              {Math.round(entry.share * 100)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              );
            })()}
          </>
        )}

        {rawRuns.length > 0 && <AllSourcesSection runs={rawRuns} />}

        {score && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Insights & Recommendations</h3>
            </div>
            <Card className="p-6">
              <InsightsPanel
                jobId={id!}
                brandName={job.brandName}
                brandDomain={job.brandDomain}
              />
            </Card>
          </div>
        )}

        {rawRuns.length > 0 && (
          <div className="mb-8">
            <RawRunsSection runs={rawRuns} />
          </div>
        )}

        <div className="pb-16" />
      </main>
    </div>
  );
}

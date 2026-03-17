import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import {
  Brain,
  Globe,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Search,
  BarChart3,
  ArrowLeft,
  Clock,
  TrendingUp,
  Anchor,
  Users,
} from "lucide-react";

type Verdict = "strong" | "partial" | "weak" | "absent";

type SignalScore = {
  signal_name: string;
  engine: string;
  presence_rate: number;
  consistency_score: number;
  sentiment: string;
  what_the_engine_believes: string;
  contradictions_found: string[];
  gaps_vs_brand_claim: string;
  verdict: Verdict;
  error?: string;
};

type Signal = {
  id: string;
  name: string;
  why_it_matters_for_ai_visibility: string;
  what_strong_looks_like: string;
  what_weak_looks_like: string;
  base_question: string;
};

type BrandEntry = {
  brand_name: string;
  business_type: string;
  segment: string;
  signals: Signal[];
  inherited?: boolean;
  error?: string;
};

type Job = {
  id: number;
  status: string;
  brands: string[];
  engines: string[];
  runCount: number;
  progress: number;
  discoveredSignals?: Record<string, BrandEntry>;
  // rawResponses keyed by signal_id → engine → responses (not per brand)
  rawResponses?: Record<string, Record<string, string[]>>;
  scoringResults?: Record<string, Record<string, Record<string, SignalScore>>>;
  errorMessage?: string;
  createdAt: string;
};

const VERDICT_CONFIG: Record<Verdict, { label: string; color: string; bg: string; ring: string }> = {
  strong:  { label: "Strong",  color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800", ring: "#10b981" },
  partial: { label: "Partial", color: "text-yellow-700 dark:text-yellow-400",   bg: "bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800",  ring: "#eab308" },
  weak:    { label: "Weak",    color: "text-orange-700 dark:text-orange-400",   bg: "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800",  ring: "#f97316" },
  absent:  { label: "Absent",  color: "text-red-700 dark:text-red-400",         bg: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800",               ring: "#ef4444" },
};

const STATUS_PHASES = [
  { key: "pending",     label: "Queued",             pct: 0   },
  { key: "discovering", label: "Deriving signals",   pct: 20  },
  { key: "running",     label: "Collecting responses",pct: 50 },
  { key: "scoring",     label: "Scoring brands",     pct: 80  },
  { key: "done",        label: "Complete",           pct: 100 },
  { key: "error",       label: "Error",              pct: 100 },
];

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
  if (score >= 40) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const r = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#eab308" : score >= 40 ? "#f97316" : "#ef4444";
  const cx = size / 2;
  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="currentColor" strokeWidth="3.5" className="text-muted/20" />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth="3.5"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`} />
      <text x={cx} y={cx + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>{score}</text>
    </svg>
  );
}

function EngineChip({ engine }: { engine: string }) {
  return engine === "chatgpt"
    ? <span className="text-xs font-semibold text-green-700 dark:text-green-400">ChatGPT</span>
    : <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Gemini</span>;
}

function BrandScoreCell({ score, brandName }: { score?: SignalScore; brandName: string }) {
  if (!score) return <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground text-center">Pending…</div>;
  if (score.error) return <div className="rounded-lg border border-destructive/30 p-3 text-xs text-destructive">Error</div>;
  const vc = VERDICT_CONFIG[score.verdict] ?? VERDICT_CONFIG.absent;
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-lg border ${vc.bg}`}>
      <button className="w-full px-3 py-2.5 flex items-center gap-2.5 text-left" onClick={() => setOpen(o => !o)}>
        <ScoreRing score={score.consistency_score ?? 0} size={44} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate">{brandName}</p>
          <p className={`text-xs ${vc.color}`}>{vc.label} · {Math.round((score.presence_rate ?? 0) * 100)}% presence</p>
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-3 pb-3 text-xs space-y-2 border-t border-current/10 pt-2">
          {score.what_the_engine_believes && (
            <div>
              <p className="font-medium text-muted-foreground mb-0.5">What the engine believes</p>
              <p>{score.what_the_engine_believes}</p>
            </div>
          )}
          {score.gaps_vs_brand_claim && (
            <div>
              <p className="font-medium text-muted-foreground mb-0.5">Gaps vs brand claim</p>
              <p>{score.gaps_vs_brand_claim}</p>
            </div>
          )}
          {score.contradictions_found?.length > 0 && (
            <div>
              <p className="font-medium text-orange-600 dark:text-orange-400 mb-0.5">Contradictions</p>
              <ul className="space-y-0.5">
                {score.contradictions_found.map((c, i) => <li key={i} className="text-muted-foreground">· {c}</li>)}
              </ul>
            </div>
          )}
          <p className="text-muted-foreground/60">Sentiment: {score.sentiment}</p>
        </div>
      )}
    </div>
  );
}

// One row per signal: question + brand scores side by side per engine
function SignalRow({ signal, brands, urls, scoringResults, engines }: {
  signal: Signal;
  brands: BrandEntry[];
  urls: string[];
  scoringResults?: Record<string, Record<string, Record<string, SignalScore>>>;
  engines: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  // Average scores across brands for quick header badges
  const avgPerEngine: Record<string, number> = {};
  engines.forEach(eng => {
    const scores = urls.map(url => scoringResults?.[url]?.[signal.id]?.[eng]?.consistency_score ?? null).filter(s => s !== null) as number[];
    if (scores.length) avgPerEngine[eng] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  });

  return (
    <div className="rounded-xl border bg-card">
      <button
        className="w-full text-left px-5 py-4 flex items-start gap-3"
        onClick={() => setExpanded(e => !e)}
        data-testid={`signal-row-${signal.id}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-sm">{signal.name}</span>
            {Object.entries(avgPerEngine).map(([eng, avg]) => (
              <Badge key={eng} variant="outline" className={`text-xs ${scoreColor(avg)}`}>
                <EngineChip engine={eng} /> <span className="ml-1">{avg}</span>
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground italic">"{signal.base_question}"</p>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4">
          {/* Signal metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="font-medium text-muted-foreground mb-1">Why it matters for AI visibility</p>
              <p>{signal.why_it_matters_for_ai_visibility}</p>
            </div>
            <div className="grid grid-rows-2 gap-2">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2">
                <p className="font-medium text-emerald-700 dark:text-emerald-400 mb-0.5">Strong looks like</p>
                <p className="text-muted-foreground">{signal.what_strong_looks_like}</p>
              </div>
              <div className="rounded-lg bg-red-50 dark:bg-red-950/30 px-3 py-2">
                <p className="font-medium text-red-700 dark:text-red-400 mb-0.5">Weak looks like</p>
                <p className="text-muted-foreground">{signal.what_weak_looks_like}</p>
              </div>
            </div>
          </div>

          {/* Per-engine scoring grid */}
          {engines.map(eng => (
            <div key={eng}>
              <div className="flex items-center gap-2 mb-2">
                <EngineChip engine={eng} />
                <span className="text-xs text-muted-foreground">— {urls.length} brand{urls.length !== 1 ? "s" : ""} scored on same responses</span>
              </div>
              <div className={`grid gap-2 ${urls.length === 1 ? "grid-cols-1 max-w-sm" : urls.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {urls.map((url, i) => (
                  <BrandScoreCell
                    key={url}
                    score={scoringResults?.[url]?.[signal.id]?.[eng]}
                    brandName={brands[i]?.brand_name ?? url}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SignalConsistency() {
  const qc = useQueryClient();
  const [urls, setUrls] = useState(["", "", ""]);
  const [engines, setEngines] = useState<string[]>(["chatgpt", "gemini"]);
  const [runCount, setRunCount] = useState(10);
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: job, refetch: refetchJob } = useQuery<Job>({
    queryKey: ["/api/signal-consistency", activeJobId],
    queryFn: async () => {
      if (!activeJobId) throw new Error("No job");
      const res = await fetch(`/api/signal-consistency/${activeJobId}`);
      if (!res.ok) throw new Error("Failed to fetch job");
      return res.json();
    },
    enabled: !!activeJobId,
    refetchInterval: false,
  });

  useEffect(() => {
    if (!activeJobId) return;
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      const fresh = await refetchJob();
      if (fresh.data?.status === "done" || fresh.data?.status === "error") {
        if (pollingRef.current) clearInterval(pollingRef.current);
      }
    }, 3000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [activeJobId, refetchJob]);

  const mutation = useMutation({
    mutationFn: async () => {
      const validBrands = urls.filter(u => u.trim());
      if (!validBrands.length) throw new Error("Enter at least one brand URL");
      if (!engines.length) throw new Error("Select at least one engine");
      const data = await apiRequest("POST", "/api/signal-consistency", {
        brands: validBrands, engines, runCount,
      });
      return data.json();
    },
    onSuccess: (data) => {
      setActiveJobId(data.id);
      qc.invalidateQueries({ queryKey: ["/api/signal-consistency"] });
    },
  });

  function toggleEngine(eng: string) {
    setEngines(prev => prev.includes(eng) ? prev.filter(e => e !== eng) : [...prev, eng]);
  }

  const isRunning = job && !["done", "error"].includes(job.status);
  const phase = STATUS_PHASES.find(p => p.key === job?.status);
  const activeBrandUrls = urls.filter(u => u.trim());

  // Primary brand's signals (drives the framework)
  const primaryUrl = activeBrandUrls[0];
  const primaryData = job?.discoveredSignals?.[primaryUrl];
  const signals: Signal[] = primaryData?.signals ?? [];

  // All brand entries in order
  const allBrandEntries = activeBrandUrls.map(url => job?.discoveredSignals?.[url]).filter(Boolean) as BrandEntry[];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-start gap-4">
          <Link href="/brand-intelligence">
            <button className="mt-1 text-muted-foreground hover:text-foreground transition-colors" data-testid="link-back-brand-intelligence">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Brain className="w-6 h-6" />
              Signal Consistency
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Primary brand sets the signal framework. All brands are scored on the same 4 questions — results are genuinely comparable.
            </p>
          </div>
        </div>

        {/* Setup card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Brand URLs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {urls.map((url, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    {i === 0
                      ? <><Anchor className="w-3 h-3 text-primary" /><Label className="text-xs font-semibold text-primary">Primary Brand</Label></>
                      : <><Users className="w-3 h-3 text-muted-foreground" /><Label className="text-xs text-muted-foreground">Competitor {i}</Label></>
                    }
                    {i === 0 && <span className="text-xs text-muted-foreground ml-1">— sets signal framework</span>}
                  </div>
                  <Input
                    placeholder={i === 0 ? "e.g. vestacare.ae" : i === 1 ? "e.g. competitor.com" : "optional"}
                    value={url}
                    onChange={e => setUrls(prev => { const n = [...prev]; n[i] = e.target.value; return n; })}
                    data-testid={`input-brand-url-${i}`}
                    disabled={isRunning || mutation.isPending}
                    className={i === 0 ? "border-primary/40 focus-visible:ring-primary/30" : ""}
                  />
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex flex-wrap items-center gap-6">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Engines</Label>
                <div className="flex items-center gap-4">
                  {[
                    { id: "chatgpt", label: "ChatGPT (gpt-5.2)",   color: "text-green-700 dark:text-green-400" },
                    { id: "gemini",  label: "Gemini (2.5 Flash)",  color: "text-blue-700 dark:text-blue-400"  },
                  ].map(({ id, label, color }) => (
                    <div key={id} className="flex items-center gap-2">
                      <Checkbox
                        id={`engine-${id}`}
                        checked={engines.includes(id)}
                        onCheckedChange={() => toggleEngine(id)}
                        disabled={isRunning || mutation.isPending}
                        data-testid={`checkbox-engine-${id}`}
                      />
                      <label htmlFor={`engine-${id}`} className={`text-sm cursor-pointer ${color}`}>{label}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Runs per question</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number" min={1} max={30} value={runCount}
                    onChange={e => setRunCount(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-20"
                    disabled={isRunning || mutation.isPending}
                    data-testid="input-run-count"
                  />
                  <span className="text-xs text-muted-foreground">
                    × 4 signals × {engines.length} engine{engines.length !== 1 ? "s" : ""} = {runCount * 4 * engines.length} collection calls
                  </span>
                </div>
              </div>

              <div className="ml-auto">
                <Button
                  onClick={() => mutation.mutate()}
                  disabled={isRunning || mutation.isPending || !activeBrandUrls.length || !engines.length}
                  data-testid="button-run-analysis"
                  className="gap-2"
                >
                  {(isRunning || mutation.isPending)
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Running…</>
                    : <><Zap className="w-4 h-4" />Start Analysis</>}
                </Button>
              </div>
            </div>

            {mutation.isError && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />{(mutation.error as Error)?.message ?? "Unknown error"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Progress */}
        {job && (
          <Card>
            <CardContent className="pt-5 pb-5 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {job.status === "done"
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    : job.status === "error"
                      ? <AlertCircle className="w-4 h-4 text-destructive" />
                      : <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                  <span className="font-medium">{phase?.label ?? job.status}</span>
                </div>
                <span className="text-muted-foreground tabular-nums">{job.progress}%</span>
              </div>
              <Progress value={job.progress} className="h-2" />
              <div className="flex items-center gap-0 text-xs text-muted-foreground flex-wrap">
                {STATUS_PHASES.slice(0, 5).map((p, i) => {
                  const isActive = job.status === p.key;
                  const isDone = job.progress > p.pct || job.status === "done";
                  return (
                    <div key={p.key} className="flex items-center">
                      {i > 0 && <div className={`w-6 h-px ${isDone ? "bg-primary" : "bg-muted"} mx-1`} />}
                      <span className={isActive ? "text-primary font-medium" : isDone ? "text-foreground" : ""}>{p.label}</span>
                    </div>
                  );
                })}
              </div>
              {job.status === "error" && (
                <p className="text-sm text-destructive">{job.errorMessage}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Signal framework (shown once signals are derived) */}
        {primaryData && !primaryData.error && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">
                  {job?.status === "discovering" ? "Deriving signal framework…" : "Signal framework"}
                </h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Anchor className="w-3 h-3" />
                <span className="font-medium">{primaryData.brand_name}</span>
                <span>·</span>
                <span>{primaryData.business_type}</span>
                {allBrandEntries.length > 1 && (
                  <span className="ml-2 text-muted-foreground/70">
                    · competitors tested on same questions
                  </span>
                )}
              </div>
              {/* Competitor badges */}
              <div className="flex gap-1.5 ml-auto flex-wrap">
                {allBrandEntries.map((b, i) => (
                  <span key={i} className={`text-xs px-2 py-0.5 rounded-full border ${i === 0 ? "border-primary/40 text-primary bg-primary/5" : "border-border text-muted-foreground bg-muted/30"}`}>
                    {i === 0 ? <Anchor className="w-2.5 h-2.5 inline mr-1" /> : null}{b.brand_name}
                  </span>
                ))}
              </div>
            </div>

            {/* Signal rows — each shows all brands compared */}
            {signals.length > 0 ? (
              <div className="space-y-2">
                {signals.map(signal => (
                  <SignalRow
                    key={signal.id}
                    signal={signal}
                    brands={allBrandEntries}
                    urls={activeBrandUrls.filter(u => job?.discoveredSignals?.[u])}
                    scoringResults={job?.scoringResults}
                    engines={job?.engines ?? engines}
                  />
                ))}
              </div>
            ) : job?.status === "discovering" ? (
              <div className="rounded-xl border p-6 flex items-center gap-3 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />Reading primary brand…
              </div>
            ) : null}
          </div>
        )}

        {/* Summary footer */}
        {job?.status === "done" && job.scoringResults && (
          <div className="flex items-center gap-2 pt-2 pb-4 text-xs text-muted-foreground">
            <BarChart3 className="w-4 h-4" />
            <span>
              {activeBrandUrls.length} brand{activeBrandUrls.length !== 1 ? "s" : ""} · {job.runCount} runs per question · {job.engines?.length} engine{job.engines?.length !== 1 ? "s" : ""}
            </span>
            <TrendingUp className="w-4 h-4 ml-auto" />
            <span>All brands scored on same {signals.length} questions</span>
            <Clock className="w-4 h-4 ml-2" />
            <span>{new Date(job.createdAt).toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

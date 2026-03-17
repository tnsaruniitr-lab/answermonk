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
  question: string;
};

type DiscoveredBrand = {
  brand_name: string;
  category: string;
  segment: string;
  signals: Signal[];
  error?: string;
};

type Job = {
  id: number;
  status: string;
  brands: string[];
  engines: string[];
  runCount: number;
  progress: number;
  discoveredSignals?: Record<string, DiscoveredBrand>;
  scoringResults?: Record<string, Record<string, Record<string, SignalScore>>>;
  errorMessage?: string;
  createdAt: string;
};

const VERDICT_CONFIG: Record<Verdict, { label: string; color: string; bg: string }> = {
  strong:  { label: "Strong",   color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800" },
  partial: { label: "Partial",  color: "text-yellow-700 dark:text-yellow-400",   bg: "bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800" },
  weak:    { label: "Weak",     color: "text-orange-700 dark:text-orange-400",   bg: "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800" },
  absent:  { label: "Absent",   color: "text-red-700 dark:text-red-400",         bg: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800" },
};

const STATUS_PHASES = [
  { key: "pending",     label: "Queued",              pct: 0  },
  { key: "discovering", label: "Discovering signals", pct: 25 },
  { key: "running",     label: "Collecting responses",pct: 50 },
  { key: "scoring",     label: "Scoring consistency", pct: 80 },
  { key: "done",        label: "Complete",            pct: 100},
  { key: "error",       label: "Error",               pct: 100},
];

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
  if (score >= 40) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

function ScoreRing({ score }: { score: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#eab308" : score >= 40 ? "#f97316" : "#ef4444";
  return (
    <svg width="56" height="56" className="flex-shrink-0">
      <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/20" />
      <circle
        cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 28 28)"
      />
      <text x="28" y="32" textAnchor="middle" fontSize="12" fontWeight="700" fill={color}>{score}</text>
    </svg>
  );
}

function EngineLabel({ engine }: { engine: string }) {
  return engine === "chatgpt"
    ? <span className="font-semibold text-green-700 dark:text-green-400">ChatGPT</span>
    : <span className="font-semibold text-blue-700 dark:text-blue-400">Gemini</span>;
}

function SignalCard({ signal, scores }: { signal: Signal; scores?: Record<string, SignalScore> }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl border bg-card">
      <button
        className="w-full text-left px-5 py-4 flex items-start gap-3"
        onClick={() => setExpanded(e => !e)}
        data-testid={`signal-card-${signal.id}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-sm">{signal.name}</span>
            {scores && Object.entries(scores).map(([eng, s]) => (
              <Badge key={eng} variant="outline" className={`text-xs ${VERDICT_CONFIG[s.verdict]?.color ?? ""}`}>
                {eng === "chatgpt" ? "ChatGPT" : "Gemini"} · {s.consistency_score ?? 0}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground italic">"{signal.question}"</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4">
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

          {scores && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(scores).map(([eng, s]) => {
                if (s.error) return (
                  <div key={eng} className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
                    <p className="font-medium mb-1"><EngineLabel engine={eng} /> — Error</p>
                    <p>{s.error}</p>
                  </div>
                );
                const vc = VERDICT_CONFIG[s.verdict] ?? VERDICT_CONFIG.absent;
                return (
                  <div key={eng} className={`rounded-lg border px-4 py-3 ${vc.bg}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <ScoreRing score={s.consistency_score ?? 0} />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <EngineLabel engine={eng} />
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${vc.color} ${vc.bg}`}>
                            {vc.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Presence {Math.round((s.presence_rate ?? 0) * 100)}% · Sentiment: {s.sentiment}
                        </p>
                      </div>
                    </div>
                    {s.what_the_engine_believes && (
                      <div className="text-xs mb-2">
                        <p className="font-medium mb-0.5">What the engine believes</p>
                        <p className="text-muted-foreground">{s.what_the_engine_believes}</p>
                      </div>
                    )}
                    {s.gaps_vs_brand_claim && (
                      <div className="text-xs mb-2">
                        <p className="font-medium mb-0.5">Gaps vs brand claim</p>
                        <p className="text-muted-foreground">{s.gaps_vs_brand_claim}</p>
                      </div>
                    )}
                    {s.contradictions_found?.length > 0 && (
                      <div className="text-xs">
                        <p className="font-medium mb-1 text-orange-700 dark:text-orange-400">Contradictions found</p>
                        <ul className="space-y-0.5">
                          {s.contradictions_found.map((c, i) => (
                            <li key={i} className="text-muted-foreground">· {c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BrandResultPanel({ url, brandData, scores }: {
  url: string;
  brandData: DiscoveredBrand;
  scores?: Record<string, Record<string, SignalScore>>;
}) {
  if (brandData.error) return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
      <AlertCircle className="w-4 h-4 inline mr-1" />Could not analyse: {brandData.error}
    </div>
  );

  const allScores = scores ? Object.values(scores).flatMap(s => Object.values(s)) : [];
  const avgScore = allScores.length
    ? Math.round(allScores.reduce((a, b) => a + (b.consistency_score ?? 0), 0) / allScores.length)
    : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <h3 className="font-semibold text-base">{brandData.brand_name}</h3>
          <p className="text-xs text-muted-foreground">{brandData.category} · {brandData.segment}</p>
        </div>
        {avgScore !== null && (
          <div className="ml-auto flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className={`text-sm font-bold ${scoreColor(avgScore)}`}>{avgScore}</span>
            <span className="text-xs text-muted-foreground">avg consistency</span>
          </div>
        )}
      </div>
      <div className="space-y-2">
        {brandData.signals.map(signal => (
          <SignalCard
            key={signal.id}
            signal={signal}
            scores={scores?.[signal.id]}
          />
        ))}
      </div>
    </div>
  );
}

export default function SignalConsistency() {
  const qc = useQueryClient();
  const [urls, setUrls] = useState(["", "", ""]);
  const [engines, setEngines] = useState<string[]>(["chatgpt", "gemini"]);
  const [runCount, setRunCount] = useState(10);
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [activeBrand, setActiveBrand] = useState(0);
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
        brands: validBrands,
        engines,
        runCount,
      });
      return data.json();
    },
    onSuccess: (data) => {
      setActiveJobId(data.id);
      setActiveBrand(0);
      qc.invalidateQueries({ queryKey: ["/api/signal-consistency"] });
    },
  });

  function toggleEngine(eng: string) {
    setEngines(prev =>
      prev.includes(eng) ? prev.filter(e => e !== eng) : [...prev, eng]
    );
  }

  const isRunning = job && !["done", "error"].includes(job.status);
  const phase = STATUS_PHASES.find(p => p.key === job?.status);
  const activeBrands = urls.filter(u => u.trim());

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
              Claude discovers what matters most for each brand, then tests how consistently ChatGPT and Gemini represent those signals.
            </p>
          </div>
        </div>

        {/* Setup card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Brand URLs
              <span className="text-xs font-normal text-muted-foreground ml-1">Enter up to 3 brands to analyse in parallel</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {urls.map((url, i) => (
                <div key={i} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Brand {i + 1}</Label>
                  <Input
                    placeholder={i === 0 ? "e.g. vestacare.ae" : i === 1 ? "e.g. competitor.com" : "optional"}
                    value={url}
                    onChange={e => setUrls(prev => { const n = [...prev]; n[i] = e.target.value; return n; })}
                    data-testid={`input-brand-url-${i}`}
                    disabled={isRunning || mutation.isPending}
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
                    { id: "chatgpt", label: "ChatGPT (gpt-5.2)", color: "text-green-700 dark:text-green-400" },
                    { id: "gemini",  label: "Gemini (2.5 Flash)", color: "text-blue-700 dark:text-blue-400" },
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
                    type="number"
                    min={1}
                    max={30}
                    value={runCount}
                    onChange={e => setRunCount(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-20"
                    disabled={isRunning || mutation.isPending}
                    data-testid="input-run-count"
                  />
                  <span className="text-xs text-muted-foreground">
                    × 4 signals × {engines.length} engine{engines.length !== 1 ? "s" : ""} = {runCount * 4 * engines.length * activeBrands.length || 0} total calls
                  </span>
                </div>
              </div>

              <div className="ml-auto">
                <Button
                  onClick={() => mutation.mutate()}
                  disabled={isRunning || mutation.isPending || !activeBrands.length || !engines.length}
                  data-testid="button-run-analysis"
                  className="gap-2"
                >
                  {(isRunning || mutation.isPending) ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Running…</>
                  ) : (
                    <><Zap className="w-4 h-4" />Start Analysis</>
                  )}
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
            <CardContent className="pt-5 pb-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {job.status === "done" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : job.status === "error" ? (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    ) : (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    )}
                    <span className="font-medium">{phase?.label ?? job.status}</span>
                  </div>
                  <span className="text-muted-foreground tabular-nums">{job.progress}%</span>
                </div>
                <Progress value={job.progress} className="h-2" />

                {/* Phase indicators */}
                <div className="flex items-center gap-0 text-xs text-muted-foreground">
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
                  <p className="text-sm text-destructive mt-2">{job.errorMessage}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Discovered signals (shown during running phase) */}
        {job?.discoveredSignals && job.status !== "pending" && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Search className="w-4 h-4" />
              {job.status === "discovering" ? "Discovering signals…" : "Signals discovered"}
            </h2>

            {/* Brand tabs */}
            {activeBrands.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {activeBrands.map((url, i) => {
                  const brandData = job.discoveredSignals?.[url];
                  return (
                    <button
                      key={url}
                      onClick={() => setActiveBrand(i)}
                      data-testid={`tab-brand-${i}`}
                      className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                        activeBrand === i
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/40 hover:bg-muted border-border"
                      }`}
                    >
                      {brandData?.brand_name ?? url}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Active brand signals */}
            {activeBrands.map((url, i) => {
              if (i !== activeBrand) return null;
              const brandData = job.discoveredSignals?.[url];
              if (!brandData) return (
                <div key={url} className="rounded-xl border p-6 flex items-center gap-3 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />Analysing {url}…
                </div>
              );
              return (
                <div key={url} className="space-y-3">
                  <BrandResultPanel
                    url={url}
                    brandData={brandData}
                    scores={job.scoringResults?.[url]}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Final results header */}
        {job?.status === "done" && job.scoringResults && (
          <div className="flex items-center gap-2 pt-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Analysis complete · {activeBrands.length} brand{activeBrands.length !== 1 ? "s" : ""} · {job.runCount} runs per question
            </span>
            <Clock className="w-4 h-4 text-muted-foreground ml-auto" />
            <span className="text-xs text-muted-foreground">{new Date(job.createdAt).toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, Component } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  ArrowRight, Sparkles, Globe, Activity, BarChart3, Code, Bot, Zap,
  Database, Loader2, AlertCircle, Plus, X, MapPin, CheckCircle2, Brain,
} from "lucide-react";
import { AuthoritySourcesPanel } from "@/components/AuthoritySourcesPanel";
import { DispatchFeedLive } from "@/components/DispatchFeedLive";
import { RecentAnalysisTiles } from "@/components/RecentAnalysisTiles";
import { SessionSummaryHero } from "@/components/SessionSummaryHero";

function normalizeDomain(url: string): string {
  try {
    const withProtocol = url.startsWith("http") ? url : `https://${url}`;
    const parsed = new URL(withProtocol);
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return url.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "");
  }
}

const AGENT_STEPS = [
  { emoji: "🔍", label: "Crawling {domain} homepage…" },
  { emoji: "🌐", label: "Running web intelligence search…" },
  { emoji: "📊", label: "Identifying service offerings…" },
  { emoji: "👥", label: "Mapping customer segments…" },
  { emoji: "🏙️", label: "Pinpointing geographic footprint…" },
  { emoji: "🔎", label: "Scouting competitor landscape…" },
  { emoji: "✨", label: "Compiling GEO intelligence brief…" },
];

const RUN_STEPS = [
  { emoji: "🧠", label: "Classifying segments with AI reasoning engine…" },
  { emoji: "✍️", label: "Drafting {n} targeted search prompts…" },
  { emoji: "🔗", label: "Wiring prompt network to scoring pipeline…" },
  { emoji: "🚀", label: "Dispatching to ChatGPT · Claude · Gemini…" },
  { emoji: "📡", label: "Calibrating brand visibility scoring model…" },
  { emoji: "🏆", label: "Benchmarking against competitor landscape…" },
  { emoji: "📋", label: "Compiling your GEO Intelligence Report…" },
];

function SegmentResultCard({ seg, brandName }: { seg: any; brandName: string }) {
  const sr = seg.scoringResult;
  const score = sr?.score || {};
  const appearance = Math.round((score.appearance_rate ?? 0) * 100);
  const primary = Math.round((score.primary_rate ?? 0) * 100);
  const avgRank = score.avg_rank != null ? `#${score.avg_rank}` : "—";
  const engines = score.engine_breakdown || {};
  const rawRuns = sr?.raw_runs || [];
  const citationCount = rawRuns.reduce((s: number, r: any) => s + (r.citations?.length || 0), 0);
  const label = seg.persona || seg.serviceType || seg.customerType || seg.label || "Segment";
  const type = seg.seedType || seg.type || "service";

  const rawCompetitors: { name: string; share: number; isBrand?: boolean }[] = (score.competitors || []).slice(0, 8);
  const brandAlreadyIn = rawCompetitors.some((c) => c.name?.toLowerCase() === brandName?.toLowerCase());
  const allRankings = [
    ...rawCompetitors,
    ...(!brandAlreadyIn && brandName ? [{ name: brandName, share: score.appearance_rate ?? 0, isBrand: true }] : []),
  ]
    .sort((a, b) => b.share - a.share)
    .slice(0, 8)
    .map((c) => ({ ...c, isBrand: c.isBrand || c.name?.toLowerCase() === brandName?.toLowerCase() }));

  return (
    <div className="bg-[#111827]/80 border border-white/10 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/5">
        <div className="w-6 h-6 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center flex-shrink-0">
          <span className="text-green-400 leading-none" style={{ fontSize: "10px" }}>✓</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">{label}</p>
          <p className="text-slate-500 text-xs">{type} · 8 prompts</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-bold text-white">{appearance}%</p>
          <p className="text-slate-500 text-xs">Appearance</p>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/5">
        <div className="p-3 text-center">
          <p className="text-lg font-bold text-white">{primary}%</p>
          <p className="text-slate-500 text-xs">Top 3</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-lg font-bold text-white">{avgRank}</p>
          <p className="text-slate-500 text-xs">Avg Rank</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-lg font-bold text-white">{citationCount}</p>
          <p className="text-slate-500 text-xs">Citations</p>
        </div>
      </div>

      {/* Engine breakdown */}
      {Object.keys(engines).length > 0 && (
        <div className="divide-y divide-white/5 border-b border-white/5">
          {Object.entries(engines).map(([eng, data]: [string, any]) => {
            const label = eng === "chatgpt" ? "ChatGPT" : eng === "gemini" ? "Gemini" : "Claude";
            const pct = Math.round((data.appearance_rate ?? 0) * 100);
            const top3pct = Math.round((data.primary_rate ?? 0) * 100);
            return (
              <div key={eng} className="flex items-center gap-3 px-4 py-2">
                <span className="text-xs text-slate-400 w-16">{label}</span>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-slate-400 w-20 text-right">{pct}% · Top3: {top3pct}%</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Rankings */}
      {allRankings.length > 0 && (
        <div className="p-4">
          <p className="text-xs text-slate-500 mb-3 font-mono uppercase tracking-wider">Rankings</p>
          <div className="space-y-2.5">
            {allRankings.map((c, idx) => {
              const pct = Math.round((c.share ?? 0) * 100);
              const maxPct = Math.round((allRankings[0]?.share ?? 1) * 100) || 1;
              const barWidth = Math.round((pct / maxPct) * 100);
              return (
                <div key={c.name} className="flex items-center gap-2.5">
                  <span className={`text-[10px] font-mono w-4 text-right flex-shrink-0 ${c.isBrand ? "text-blue-400 font-bold" : "text-slate-600"}`}>
                    {idx + 1}
                  </span>
                  <span className={`text-xs w-32 truncate flex-shrink-0 ${c.isBrand ? "text-blue-300 font-semibold" : "text-slate-400"}`}>
                    {c.name}
                    {c.isBrand && <span className="ml-1 text-[9px] text-blue-500 font-mono uppercase">you</span>}
                  </span>
                  <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${c.isBrand ? "bg-gradient-to-r from-blue-500 to-violet-500" : "bg-slate-600"}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className={`text-xs w-8 text-right flex-shrink-0 tabular-nums ${c.isBrand ? "text-blue-300 font-semibold" : "text-slate-500"}`}>
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function LandingInner() {
  const [, navigate] = useLocation();
  const [url, setUrl] = useState("");
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentStep, setAgentStep] = useState(0);
  const [runStep, setRunStep] = useState(0);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [replayMode, setReplayMode] = useState(false);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const chipsInitialized = useRef(false);

  const [services, setServices] = useState<string[]>([]);
  const [customers, setCustomers] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [city, setCity] = useState("");
  const [newServiceInput, setNewServiceInput] = useState("");
  const [newCustomerInput, setNewCustomerInput] = useState("");
  const [showIntelligence, setShowIntelligence] = useState(false);
  const [customerLimitError, setCustomerLimitError] = useState(false);
  const [serviceLimitError, setServiceLimitError] = useState(false);

  const MAX_SELECTED = 4;

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const submitMutation = useMutation({
    mutationFn: async (websiteUrl: string) => {
      const res = await apiRequest("POST", "/api/landing/submit", {
        websiteUrl,
        _hp: honeypotRef.current?.value ?? "",
      });
      return res.json();
    },
    onSuccess: (data) => {
      setSubmissionId(data.id);
      setError(null);
    },
    onError: (err: any) => {
      setError(err?.message || "Something went wrong. Please try again.");
    },
  });

  const { data: submission } = useQuery({
    queryKey: ["/api/landing/submission", submissionId],
    queryFn: async () => {
      const res = await fetch(`/api/landing/submission/${submissionId}`);
      return res.json();
    },
    enabled: submissionId !== null,
    refetchInterval: (data) =>
      data?.state?.data?.status === "complete" || data?.state?.data?.status === "error" ? false : 2000,
  });

  const isProcessing = submitMutation.isPending || (submissionId !== null && submission?.status === "processing");
  const isComplete = submission?.status === "complete";

  useEffect(() => {
    if (!chipsInitialized.current && submission?.status === "complete" && submission?.pncResult) {
      chipsInitialized.current = true;
      const svcs: string[] = submission.pncResult.service_types || submission.pncResult.serviceTypes || [];
      const custs: string[] = submission.pncResult.customer_types || submission.pncResult.customerTypes || [];
      const ct: string = submission.pncResult.city || "";
      setServices(svcs);
      setCustomers(custs);
      setSelectedServices(new Set(svcs.slice(0, MAX_SELECTED)));
      setSelectedCustomers(new Set(custs.slice(0, MAX_SELECTED)));
      setCity(ct);
    }
  }, [submission?.status, submission?.pncResult]);

  useEffect(() => {
    if (!submissionId) { setAgentStep(0); return; }
    if (!isProcessing) return;
    setAgentStep(0);
    const iv = setInterval(() => {
      setAgentStep((prev) => Math.min(prev + 1, AGENT_STEPS.length - 1));
    }, 1800);
    return () => clearInterval(iv);
  }, [submissionId, isProcessing]);

  useEffect(() => {
    if (isComplete) setAgentStep(AGENT_STEPS.length);
  }, [isComplete]);

  const runMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/landing/run-analysis", {
        submissionId,
        services: Array.from(selectedServices),
        customers: Array.from(selectedCustomers),
        city: city.trim() || "Global",
      });
      return res.json();
    },
    onSuccess: (data) => {
      setActiveSessionId(data.sessionId);
    },
    onError: (err: any) => {
      setError(err?.message || "Analysis setup failed. Please try again.");
    },
  });

  const { data: scoringSession } = useQuery<any>({
    queryKey: ["/api/multisegment/sessions", activeSessionId],
    queryFn: async () => {
      const res = await fetch(`/api/multisegment/sessions/${activeSessionId}`);
      return res.json();
    },
    enabled: activeSessionId !== null,
    refetchInterval: (q) => {
      const segs: any[] = Array.isArray(q?.state?.data?.segments) ? q.state.data.segments : [];
      const allDone = segs.length > 0 && segs.every((s) => s.scoringResult !== null);
      return allDone ? false : 4000;
    },
  });

  const scoringSegs: any[] = scoringSession ? (Array.isArray(scoringSession.segments) ? scoringSession.segments : []) : [];
  const scoredSegs = scoringSegs.filter((s) => s.scoringResult !== null);
  const allSegmentsDone = scoringSegs.length > 0 && scoringSegs.every((s) => s.scoringResult !== null);
  const isScoring = activeSessionId !== null && !allSegmentsDone;

  const isError = submission?.status === "error" || runMutation.isError;
  const isRunning = runMutation.isPending;

  useEffect(() => {
    if (!isRunning) { setRunStep(0); return; }
    setRunStep(0);
    const iv = setInterval(() => {
      setRunStep((prev) => Math.min(prev + 1, RUN_STEPS.length - 1));
    }, 1400);
    return () => clearInterval(iv);
  }, [isRunning]);

  function handleTileSelect(sessionId: number) {
    setActiveSessionId(sessionId);
    setReplayMode(true);
    setShowIntelligence(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function exitReplay() {
    setActiveSessionId(null);
    setReplayMode(false);
    setShowIntelligence(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = url.trim();
    if (!trimmed) return;
    submitMutation.mutate(trimmed);
  }

  function toggleService(s: string) {
    setSelectedServices((prev) => {
      if (!prev.has(s) && prev.size >= MAX_SELECTED) {
        setServiceLimitError(true);
        return prev;
      }
      setServiceLimitError(false);
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  }

  function toggleCustomer(c: string) {
    setSelectedCustomers((prev) => {
      if (!prev.has(c) && prev.size >= MAX_SELECTED) {
        setCustomerLimitError(true);
        return prev;
      }
      setCustomerLimitError(false);
      const next = new Set(prev);
      if (next.has(c)) next.delete(c); else next.add(c);
      return next;
    });
  }

  function addService() {
    const s = newServiceInput.trim();
    if (!s || services.includes(s)) { setNewServiceInput(""); return; }
    setServices((prev) => [...prev, s]);
    setSelectedServices((prev) => {
      if (prev.size >= MAX_SELECTED) { setServiceLimitError(true); return prev; }
      return new Set([...prev, s]);
    });
    setNewServiceInput("");
  }

  function addCustomer() {
    const c = newCustomerInput.trim();
    if (!c || customers.includes(c)) { setNewCustomerInput(""); return; }
    setCustomers((prev) => [...prev, c]);
    setSelectedCustomers((prev) => {
      if (prev.size >= MAX_SELECTED) { setCustomerLimitError(true); return prev; }
      return new Set([...prev, c]);
    });
    setNewCustomerInput("");
  }

  const canRun = selectedServices.size > 0 && selectedCustomers.size > 0 && city.trim().length > 0;

  const steps = [
    { title: "Website Ingestion", desc: "Deep crawl of domain architecture", icon: Globe },
    { title: "Signal Discovery", desc: "Entity & service extraction via PNC", icon: Activity },
    { title: "Prompt Execution", desc: "Cross-engine query runs", icon: Code },
    { title: "Insight Report", desc: "Visibility & gap analysis", icon: BarChart3 },
  ];

  return (
    <div
      className="min-h-screen bg-[#0A0F1E] text-slate-200 font-sans overflow-hidden relative"
      data-testid="landing-page"
    >
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.05)_0%,_transparent_60%)] pointer-events-none" />

      <nav className="relative z-10 flex items-center px-8 py-6 max-w-7xl mx-auto border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-white">
            Nexalytics <span className="text-blue-400 font-light">GEO</span>
          </span>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        {!replayMode && (
          <>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              Intelligence Engine v2.0 — Live
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
              Dominate{" "}
              <span style={{background: "linear-gradient(to right, #60a5fa, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"}}>
                AI search results
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
              See which brands AI recommends in your category, why they win, and which sources shape those answers.
            </p>
          </>
        )}

        {/* URL Input — hidden once complete or in replay mode */}
        {!isComplete && !isError && !replayMode && (
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative group">
            <input
              ref={honeypotRef}
              name="_hp"
              type="text"
              tabIndex={-1}
              aria-hidden="true"
              autoComplete="off"
              className="absolute opacity-0 pointer-events-none w-0 h-0"
            />
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-violet-500 rounded-2xl blur opacity-20 group-hover:opacity-35 transition duration-1000" />
            <div className="relative flex items-center bg-[#111827]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl">
              <div className="pl-4 flex-shrink-0">
                <Globe className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter your website URL (e.g., acme.com)"
                className="flex-1 bg-transparent border-none outline-none text-white px-4 py-4 text-lg placeholder:text-slate-500"
                disabled={isProcessing}
                data-testid="input-website-url"
              />
              <button
                type="submit"
                disabled={isProcessing || !url.trim()}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="disabled:opacity-50 disabled:cursor-not-allowed px-7 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-all duration-300 min-w-[130px] justify-center text-[15px]"
                style={{
                  background: "linear-gradient(135deg, #ffffff 0%, #e8eeff 100%)",
                  color: "#0a0f1e",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.6), 0 0 30px rgba(255,255,255,0.25), 0 0 60px rgba(139,92,246,0.2), 0 4px 20px rgba(0,0,0,0.5)",
                  letterSpacing: "-0.01em",
                }}
                data-testid="button-analyze"
              >
                {isProcessing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Analyzing</>
                ) : (
                  <>Analyze <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${isHovered ? "translate-x-1" : ""}`} /></>
                )}
              </button>
            </div>
            {error && (
              <div className="mt-3 flex items-center gap-2 text-red-400 text-sm justify-center" data-testid="text-error">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}
          </form>
        )}

        {/* Recent Analyses directory — visible when idle */}
        {!isProcessing && !isRunning && activeSessionId === null && (
          <RecentAnalysisTiles onSelect={handleTileSelect} />
        )}

        {/* Processing — PNC extracting */}
        {isProcessing && submissionId && (
          <div className="mt-8 max-w-md mx-auto" data-testid="status-processing">
            <div className="relative">
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-blue-500/50 via-violet-500/40 to-blue-500/50 blur-sm" />
              <div className="relative bg-[#0a0f1a] rounded-2xl p-6">
                {/* Bot header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/30 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-blue-400 animate-pulse" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#0a0f1a] animate-pulse" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold leading-tight">GEO Agent · Active</p>
                    <p className="text-blue-400/70 text-xs font-mono truncate">analyzing {normalizeDomain(url)}</p>
                  </div>
                  <div className="ml-auto flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-1 h-1 rounded-full bg-blue-400/60 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>

                {/* Step feed */}
                <div className="space-y-2">
                  {AGENT_STEPS.map((step, i) => {
                    const done = i < agentStep;
                    const running = i === agentStep && agentStep < AGENT_STEPS.length;
                    const pending = i > agentStep;
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-3 transition-all duration-500 ${pending ? "opacity-25" : "opacity-100"}`}
                      >
                        <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                          {done && (
                            <div className="w-4 h-4 rounded-full bg-green-500/15 border border-green-500/40 flex items-center justify-center">
                              <span className="text-green-400 leading-none" style={{ fontSize: "8px" }}>✓</span>
                            </div>
                          )}
                          {running && <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />}
                          {pending && <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mx-auto" />}
                        </div>
                        <p className={`text-xs font-mono transition-colors duration-300 ${
                          done ? "text-slate-600" :
                          running ? "text-blue-300" :
                          "text-slate-700"
                        }`}>
                          {step.emoji} {step.label.replace("{domain}", normalizeDomain(url))}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GEO Agent — Phase 2: cooking the report */}
        {isRunning && (
          <div className="mt-8 max-w-md mx-auto" data-testid="status-running">
            <div className="relative">
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-violet-500/50 via-indigo-500/40 to-violet-500/50 blur-sm" />
              <div className="relative bg-[#0a0f1a] rounded-2xl p-6">
                {/* Agent header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-violet-400 animate-pulse" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-violet-400 border-2 border-[#0a0f1a] animate-pulse" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold leading-tight">GEO Agent · Computing Report</p>
                    <p className="text-violet-400/70 text-xs font-mono truncate">building prompt network for {normalizeDomain(url)}</p>
                  </div>
                  <div className="ml-auto flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-1 h-1 rounded-full bg-violet-400/60 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>

                {/* Step feed */}
                <div className="space-y-2">
                  {RUN_STEPS.map((step, i) => {
                    const done = i < runStep;
                    const running = i === runStep && runStep < RUN_STEPS.length;
                    const pending = i > runStep;
                    const label = step.label.replace("{n}", String((selectedServices.size + selectedCustomers.size) * 8));
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-3 transition-all duration-500 ${pending ? "opacity-25" : "opacity-100"}`}
                      >
                        <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                          {done && (
                            <div className="w-4 h-4 rounded-full bg-violet-500/15 border border-violet-500/40 flex items-center justify-center">
                              <span className="text-violet-400 leading-none" style={{ fontSize: "8px" }}>✓</span>
                            </div>
                          )}
                          {running && <div className="w-4 h-4 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />}
                          {pending && <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mx-auto" />}
                        </div>
                        <p className={`text-xs font-mono transition-colors duration-300 ${
                          done ? "text-slate-600" :
                          running ? "text-violet-300" :
                          "text-slate-700"
                        }`}>
                          {step.emoji} {label}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom label */}
                <p className="mt-5 text-[10px] text-slate-600 font-mono text-center">Scoring fires in background — your report will be ready in ~60s</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Live Scoring Feed — shown after run-analysis returns ── */}
        {activeSessionId !== null && !isRunning && (
          <div className="mt-8 max-w-xl mx-auto space-y-4" ref={resultsRef}>

            {/* Replay mode header — back button + brand context */}
            {replayMode && (
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={exitReplay}
                  data-testid="button-exit-replay"
                  className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  Back to analyses
                </button>
                <span className="text-xs text-slate-600 font-mono">
                  {scoringSession?.brandName || ""}
                </span>
              </div>
            )}

            {/* Session summary hero — appears as soon as the first segment scores */}
            {scoredSegs.length > 0 && (
              <SessionSummaryHero
                brandName={scoringSession?.brandName || ""}
                brandDomain={scoringSession?.brandDomain || undefined}
                scoredSegs={scoredSegs}
                totalSegs={scoringSegs.length}
              />
            )}

            {/* Scored segment cards — appear one by one as they complete */}
            {scoredSegs.map((seg) => (
              <SegmentResultCard key={seg.id} seg={seg} brandName={scoringSession?.brandName || ""} />
            ))}

            {/* Live Dispatch Feed — shown while scoring is in progress */}
            {isScoring && (
              <DispatchFeedLive
                scoringSegs={scoringSegs}
                scoredSegs={scoredSegs}
                brandName={scoringSession?.brandName || ""}
                brandDomain={scoringSession?.brandDomain || undefined}
              />
            )}

            {/* All done — single CTA button */}
            {allSegmentsDone && !showIntelligence && (
              <div className="flex justify-center">
                <button
                  onClick={() => setShowIntelligence(true)}
                  data-testid="btn-analyse-intelligence"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600/20 border border-violet-500/40 hover:bg-violet-600/30 hover:border-violet-500/60 text-violet-300 font-semibold transition-all duration-200"
                >
                  <Brain className="w-4 h-4" />
                  Analyse Citation Intelligence
                </button>
              </div>
            )}

            {/* Citation Intelligence panel — revealed after button press */}
            {allSegmentsDone && showIntelligence && activeSessionId !== null && (
              <div className="mt-2">
                <AuthoritySourcesPanel
                  autoRun
                  sessionId={activeSessionId}
                  brandName={scoringSession?.brandName || ""}
                  segments={scoredSegs.map((s: any, i: number) => ({
                    id: s.id || `seg-${i}`,
                    persona: s.persona || s.serviceType || s.label || `Segment ${i + 1}`,
                    seedType: s.seedType || "",
                    customerType: s.customerType || "",
                    location: s.location || "",
                    scoringResult: s.scoringResult,
                  }))}
                />
              </div>
            )}
          </div>
        )}

        {/* Error state */}
        {isError && !isRunning && (
          <div className="mt-8 max-w-md mx-auto" data-testid="status-error">
            <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <p className="text-white font-medium">Analysis failed</p>
              <p className="text-slate-400 text-sm mt-1">{error || "We couldn't process that request. Please try again."}</p>
              <button
                onClick={() => { setSubmissionId(null); setError(null); runMutation.reset(); }}
                className="mt-4 text-blue-400 text-sm underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* ── Chip Confirm UI — shown when PNC extraction is complete ── */}
        {isComplete && !isRunning && !activeSessionId && (
          <div className="mt-8 max-w-2xl mx-auto text-left" data-testid="status-complete">

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-white font-semibold">Signals detected for {normalizeDomain(url)}</p>
                <p className="text-slate-400 text-xs mt-0.5">Confirm your services and customer types, then generate your report.</p>
              </div>
            </div>

            {/* Services */}
            <div className="bg-[#111827]/60 border border-white/10 rounded-2xl p-5 mb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Services &mdash; <span className="text-blue-400">{selectedServices.size} selected</span>
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {services.map((s) => {
                  const on = selectedServices.has(s);
                  const locked = !on && selectedServices.size >= MAX_SELECTED;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleService(s)}
                      data-testid={`chip-service-${s}`}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 select-none ${
                        on
                          ? "bg-blue-500/20 border-blue-500/50 text-blue-300 cursor-pointer"
                          : locked
                          ? "bg-white/3 border-white/5 text-slate-600 cursor-not-allowed opacity-50"
                          : "bg-white/5 border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-400 cursor-pointer"
                      }`}
                    >
                      {on && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />}
                      {s}
                      {on && <X className="w-3 h-3 opacity-50 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {serviceLimitError && (
                <p className="text-xs text-amber-400/90 mb-2 flex items-center gap-1.5">
                  <span className="inline-block w-3.5 h-3.5 rounded-full border border-amber-400/70 text-center leading-none" style={{fontSize:"9px"}}>!</span>
                  Max 4 segments on the free scan — unlock more in the full audit.
                </p>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newServiceInput}
                  onChange={(e) => setNewServiceInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addService(); } }}
                  placeholder="Add a service…"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/40 transition-colors"
                  data-testid="input-add-service"
                />
                <button
                  type="button"
                  onClick={addService}
                  disabled={!newServiceInput.trim()}
                  className="p-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  data-testid="button-add-service"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Customer Types */}
            <div className="bg-[#111827]/60 border border-white/10 rounded-2xl p-5 mb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Customer Types &mdash; <span className="text-violet-400">{selectedCustomers.size} selected</span>
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {customers.map((c) => {
                  const on = selectedCustomers.has(c);
                  const locked = !on && selectedCustomers.size >= MAX_SELECTED;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCustomer(c)}
                      data-testid={`chip-customer-${c}`}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 select-none ${
                        on
                          ? "bg-violet-500/20 border-violet-500/50 text-violet-300 cursor-pointer"
                          : locked
                          ? "bg-white/3 border-white/5 text-slate-600 cursor-not-allowed opacity-50"
                          : "bg-white/5 border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-400 cursor-pointer"
                      }`}
                    >
                      {on && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />}
                      {c}
                      {on && <X className="w-3 h-3 opacity-50 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {customerLimitError && (
                <p className="text-xs text-amber-400/90 mb-2 flex items-center gap-1.5">
                  <span className="inline-block w-3.5 h-3.5 rounded-full border border-amber-400/70 text-center leading-none" style={{fontSize:"9px"}}>!</span>
                  Max 4 segments on the free scan — unlock more in the full audit.
                </p>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCustomerInput}
                  onChange={(e) => setNewCustomerInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomer(); } }}
                  placeholder="Add a customer type…"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-violet-500/40 transition-colors"
                  data-testid="input-add-customer"
                />
                <button
                  type="button"
                  onClick={addCustomer}
                  disabled={!newCustomerInput.trim()}
                  className="p-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-400 hover:bg-violet-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  data-testid="button-add-customer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* City */}
            <div className="bg-[#111827]/60 border border-white/10 rounded-2xl p-5 mb-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Location</p>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Dubai, New York, London"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-white/25 transition-colors"
                  data-testid="input-city"
                />
              </div>
            </div>

            {/* Generate button */}
            {error && (
              <div className="mb-3 flex items-center gap-2 text-red-400 text-sm" data-testid="text-run-error">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}
            <button
              type="button"
              onClick={() => { setError(null); runMutation.mutate(); }}
              disabled={!canRun || isRunning}
              className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.45)]"
              data-testid="button-run-analysis"
            >
              <Sparkles className="w-5 h-5" />
              Generate My GEO Report
              <ArrowRight className="w-4 h-4" />
            </button>
            {!canRun && (
              <p className="text-slate-500 text-xs text-center mt-2">Select at least one service, one customer type, and enter a city.</p>
            )}
          </div>
        )}

        {/* Trust bar */}
        {!isComplete && !isRunning && (
          <div className="mt-14 pt-8 border-t border-white/5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-5">
              Analyzing signals across primary intelligence engines
            </p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-14 opacity-50 hover:opacity-80 transition-opacity duration-500">
              <div className="flex items-center gap-2 font-medium"><Bot className="w-5 h-5" /> ChatGPT</div>
              <div className="flex items-center gap-2 font-medium"><Zap className="w-5 h-5" /> Claude</div>
              <div className="flex items-center gap-2 font-medium"><Sparkles className="w-5 h-5" /> Gemini</div>
              <div className="flex items-center gap-2 font-medium"><Database className="w-5 h-5" /> Perplexity</div>
            </div>
          </div>
        )}
      </main>

      {/* Pipeline visualization */}
      <section className="relative z-10 py-16 bg-black/20 border-y border-white/5 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold text-white">The Intelligence Pipeline</h2>
            <p className="text-slate-400 mt-2">From raw domain to actionable GEO insights in minutes.</p>
          </div>
          <div className="relative">
            <div className="absolute top-8 left-0 w-full h-0.5 bg-slate-800 hidden md:block" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {steps.map((item, index) => (
                <div key={item.title} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border transition-all duration-500 ${
                      activeStep === index
                        ? "bg-blue-500/20 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.3)] text-blue-400"
                        : "bg-[#111827] border-white/10 text-slate-500"
                    }`}
                    data-testid={`step-${index}`}
                  >
                    <item.icon className="w-7 h-7" />
                  </div>
                  <h3 className={`font-semibold mb-1 transition-colors text-center ${activeStep === index ? "text-white" : "text-slate-300"}`}>
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-500 text-center">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="relative z-10 py-20 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              color: "blue",
              icon: <Code className="w-6 h-6 text-blue-400" />,
              title: "Prompt Network",
              desc: "Auto-generate 25–30 intent-based prompts mapped to your exact services and customer personas. Test across query variations at scale.",
            },
            {
              color: "violet",
              icon: <Activity className="w-6 h-6 text-violet-400" />,
              title: "Signal Intelligence",
              desc: "Identify exactly which third-party citations, reviews, and mentions are feeding AI models and shaping your brand's narrative.",
            },
            {
              color: "emerald",
              icon: <BarChart3 className="w-6 h-6 text-emerald-400" />,
              title: "Live Reporting",
              desc: "Beautiful dashboards showing share of voice, competitor matrices, and clear action items to improve your AI search presence.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="bg-gradient-to-b from-[#111827] to-[#0D1326] border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all group"
              data-testid={`card-feature-${card.title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className={`w-12 h-12 rounded-lg bg-${card.color}-500/10 border border-${card.color}-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                {card.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{card.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features definition list — semantic for LLM crawlers */}
      <section
        id="features"
        aria-labelledby="features-heading"
        className="relative z-10 max-w-4xl mx-auto px-6 pb-4"
      >
        <h2 id="features-heading" className="sr-only">Key features of Nexalytics GEO Intelligence</h2>
        <dl className="sr-only">
          <div>
            <dt>Prompt Network Creator (PNC)</dt>
            <dd>Automatically generates service-specific and persona-specific search prompts from your website using AI analysis. Produces 25–30 intent-based queries per analysis run — no manual configuration required.</dd>
          </div>
          <div>
            <dt>Cross-engine scoring across ChatGPT, Claude, and Gemini</dt>
            <dd>Every prompt is run against all three major AI engines simultaneously. Results are weighted by engine market share: ChatGPT 35%, Gemini 35%, Claude 20%, Perplexity 10%.</dd>
          </div>
          <div>
            <dt>Competitor leaderboard</dt>
            <dd>Identifies which competitors appear most frequently in AI responses for your target prompts, with their presence score and rank position per engine.</dd>
          </div>
          <div>
            <dt>Citation source breakdown</dt>
            <dd>Crawls and classifies all URLs cited by AI engines — directories, review platforms, brand pages, media coverage — to show which third-party sites drive AI recommendations in your category.</dd>
          </div>
          <div>
            <dt>Signal Consistency analysis</dt>
            <dd>Checks whether AI models agree on the same facts about your brand — location, services, attributes — or produce conflicting information across engines.</dd>
          </div>
        </dl>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        aria-labelledby="faq-heading"
        className="relative z-10 max-w-3xl mx-auto px-6 py-16"
      >
        <h2 id="faq-heading" className="text-2xl font-semibold text-white text-center mb-10">
          Common questions about GEO and AI search
        </h2>
        <div className="space-y-6">
          {[
            {
              q: "What is GEO (Generative Engine Optimization)?",
              a: "GEO is the practice of optimizing a brand's presence in AI-generated search results from engines like ChatGPT, Claude, Gemini, and Perplexity. Unlike traditional SEO — which targets ranked URL lists — GEO focuses on how often and how prominently a brand is mentioned within the AI-generated answer text itself.",
            },
            {
              q: "How does the Prompt Network Creator (PNC) work?",
              a: "The PNC analyzes your website to extract service types and customer segments. It then auto-generates 25–30 natural-language search prompts that a real customer might ask an AI engine — for example: \"Find the 10 most trusted [service] providers in [city]\". These prompts run against multiple AI engines and results are scored for presence, rank position, and share of voice.",
            },
            {
              q: "What is a share-of-voice score in AI search?",
              a: "Share of voice in AI search measures how often your brand appears in AI engine responses relative to competitors, weighted by rank position and engine importance. A score of 100 means your brand is the top-cited answer across all tested prompts and engines. A score of 0 means your brand does not appear.",
            },
            {
              q: "What are citation sources in AI search results?",
              a: "AI engines cite external sources when generating answers. These may include review platforms (G2, Trustpilot), directories (Clutch, Yelp), industry publications, and brand websites. Nexalytics crawls and classifies these citation sources to show which third-party sites drive AI visibility for your brand and competitors.",
            },
            {
              q: "How long does a GEO analysis take?",
              a: "A full analysis — website extraction, prompt generation, cross-engine scoring, and report generation — typically completes in 3 to 8 minutes depending on the number of service segments and AI engine response times.",
            },
          ].map(({ q, a }) => (
            <article
              key={q}
              className="bg-[#111827]/50 border border-white/8 rounded-xl p-6 hover:border-white/15 transition-colors"
            >
              <h3 className="text-white font-medium mb-2">{q}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{a}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-sm text-slate-500">
        <p>© 2026 Nexalytics GEO. All rights reserved.</p>
      </footer>
    </div>
  );
}

class LandingErrorBoundary extends Component<{ children: React.ReactNode }, { error: string | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(err: Error) {
    return { error: err.message };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center p-8">
          <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
            <p className="text-white font-semibold mb-2">Something went wrong</p>
            <p className="text-slate-400 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ error: null })}
              className="mt-4 text-blue-400 text-sm underline"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Landing() {
  return (
    <LandingErrorBoundary>
      <LandingInner />
    </LandingErrorBoundary>
  );
}

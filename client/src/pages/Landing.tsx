import { useState, useEffect, useRef, Component } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  ArrowRight, Sparkles, Globe, Activity, BarChart3, Code, Bot, Zap,
  Database, Loader2, AlertCircle, Plus, X, MapPin, CheckCircle2, Brain,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthoritySourcesPanel } from "@/components/AuthoritySourcesPanel";
import { CitationSourcesPreview } from "@/components/CitationSourcesPreview";
import { DispatchFeedLive } from "@/components/DispatchFeedLive";
import { RecentAnalysisTiles } from "@/components/RecentAnalysisTiles";
import { SessionSummaryHero } from "@/components/SessionSummaryHero";
import { HireAgentsPanel } from "@/components/HireAgentsPanel";

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

function stripPromptPrefix(text: string): string {
  return text.replace(/^find,?\s*list\s*and\s*rank\s*\d+\s*\w+\s*/i, "").trim();
}

function SegmentResultCard({ seg, brandName, selected, onToggle }: { seg: any; brandName: string; selected?: boolean; onToggle?: () => void }) {
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

  const firstPromptText = rawRuns[0]?.prompt_text || (seg.prompts?.[0]?.text ?? "");
  const promptContext = firstPromptText ? stripPromptPrefix(firstPromptText) : "";

  const isSelectable = onToggle !== undefined;
  const isSelected = isSelectable ? (selected ?? true) : true;

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
    <div
      onClick={isSelectable ? onToggle : undefined}
      className="border rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 transition-all"
      style={{
        background: "#111827cc",
        borderColor: isSelectable
          ? isSelected ? "rgba(34,197,94,0.35)" : "rgba(255,255,255,0.06)"
          : "rgba(255,255,255,0.10)",
        opacity: isSelectable && !isSelected ? 0.5 : 1,
        cursor: isSelectable ? "pointer" : "default",
        boxShadow: isSelected && isSelectable ? "0 0 0 1px rgba(34,197,94,0.1) inset" : "none",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/5">
        {/* Checkbox or static checkmark */}
        {isSelectable ? (
          <div
            className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all duration-200"
            style={{
              background: isSelected ? "#22c55e" : "transparent",
              border: isSelected ? "2px solid #22c55e" : "2px solid rgba(255,255,255,0.18)",
            }}
          >
            {isSelected && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-green-400 leading-none" style={{ fontSize: "10px" }}>✓</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate capitalize">{label}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="inline-block text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full"
              style={{ background: type === "customer" ? "rgba(139,92,246,0.12)" : "rgba(59,130,246,0.12)", color: type === "customer" ? "#a78bfa" : "#60a5fa", border: `1px solid ${type === "customer" ? "rgba(139,92,246,0.25)" : "rgba(59,130,246,0.25)"}` }}>
              {type === "customer" ? "Customer" : "Service"}
            </span>
            {promptContext && (
              <span className="text-[10px] text-slate-500 truncate font-mono max-w-[200px]" title={promptContext}>
                {promptContext}
              </span>
            )}
          </div>
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
  const [competitors, setCompetitors] = useState<{name: string; location: string; known_for: string}[]>([]);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [city, setCity] = useState("");
  const [newServiceInput, setNewServiceInput] = useState("");
  const [newCustomerInput, setNewCustomerInput] = useState("");
  const [showIntelligence, setShowIntelligence] = useState(false);
  const [activeTab, setActiveTab] = useState<"reports" | "directory" | "agents">("reports");
  const { toast } = useToast();
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<Set<string>>(new Set());
  const [customerLimitError, setCustomerLimitError] = useState(false);
  const [serviceLimitError, setServiceLimitError] = useState(false);
  const [queuedData, setQueuedData] = useState<{ website: string; submissionId: number } | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);

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
      const comps: {name: string; location: string; known_for: string}[] =
        (submission.pncResult.competitors || []).map((c: any) => ({
          name: c.name || "",
          location: c.location || "",
          known_for: c.known_for || "",
        }));
      setServices(svcs);
      setCustomers(custs);
      setCompetitors(comps);
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
      if (data.queued) {
        setQueuedData({ website: data.website, submissionId: data.submissionId });
        return;
      }
      setActiveSessionId(data.sessionId);
    },
    onError: (err: any) => {
      setError(err?.message || "Analysis setup failed. Please try again.");
    },
  });

  async function handleWaitlistSubmit() {
    if (!waitlistEmail.includes("@") || !queuedData) return;
    setWaitlistSubmitting(true);
    try {
      await apiRequest("POST", "/api/waitlist", {
        website: queuedData.website,
        email: waitlistEmail,
        submissionId: queuedData.submissionId,
      });
      setWaitlistSubmitted(true);
    } catch {
      // fail silently — still show confirmed
      setWaitlistSubmitted(true);
    } finally {
      setWaitlistSubmitting(false);
    }
  }

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

  useEffect(() => {
    if (scoredSegs.length > 0) {
      setSelectedSegmentIds((prev) => {
        const next = new Set(prev);
        scoredSegs.forEach((s: any) => { if (s.id) next.add(s.id); });
        return next;
      });
    }
  }, [scoredSegs.length]);

  useEffect(() => {
    setSelectedSegmentIds(new Set());
    setShowIntelligence(false);
  }, [activeSessionId]);

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
      className="relative min-h-screen w-full overflow-hidden flex flex-col font-sans"
      style={{ background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)" }}
      data-testid="landing-page"
    >
      {/* Aurora orbs — vh-based positions so they stay in the hero viewport regardless of doc height */}
      <div style={{ position: 'absolute', top: '-10vh', left: '-5vw', width: '39vw', height: '39vw', background: '#fbcfe8', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.35, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '10vh', right: '-10vw', width: '47vw', height: '47vw', background: '#c4b5fd', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.35, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '44vh', left: '20vw', width: '39vw', height: '39vw', background: '#a7f3d0', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.35, pointerEvents: 'none' }} />

      {/* Nav — matches mockup exactly */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="text-xl font-bold text-indigo-900 tracking-tight">
          Nexalytics <span style={{ color: "rgba(79,70,229,0.8)" }}>GEO</span>
        </div>
      </header>

      <main className="relative z-10 text-center">

        {/* Hero — vertically centered with same -mt-20 trick as mockup */}
        <div
          className="flex flex-col items-center justify-center px-4"
          style={{ minHeight: "calc(100vh - 88px)", marginTop: "-80px" }}
        >
        <div className="space-y-8 max-w-3xl flex flex-col items-center w-full">

            {!replayMode && (
              <>
                {/* Eyebrow */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-violet-200 text-violet-700 text-sm font-medium shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                  </span>
                  Intelligence Engine v2.0 — Live
                </div>

                {/* Heading */}
                <h1
                  className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight"
                  style={{ color: "#1e1b4b" }}
                >
                  Dominate{" "}
                  <span style={{ background: "linear-gradient(to right, #60a5fa, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    AI search results
                  </span>
                </h1>

                {/* Subtext */}
                <p className="text-lg md:text-xl max-w-xl mx-auto leading-relaxed" style={{ color: "#374151" }}>
                  When customers ask AI,{" "}
                  <span style={{ color: "#1e1b4b", fontWeight: 500 }}>see which brands get recommended, why they win, and how to beat them.</span>
                </p>
              </>
            )}

            {/* URL Input — hidden once complete or in replay mode */}
            {!isComplete && !isError && !replayMode && (
              <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto space-y-4">
                <input
                  ref={honeypotRef}
                  name="_hp"
                  type="text"
                  tabIndex={-1}
                  aria-hidden="true"
                  autoComplete="off"
                  className="absolute opacity-0 pointer-events-none w-0 h-0"
                />
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter your website URL..."
                    disabled={isProcessing}
                    data-testid="input-website-url"
                    className="flex-1 px-5 py-4 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-gray-800 placeholder-gray-400 text-lg"
                  />
                  <button
                    type="submit"
                    disabled={isProcessing}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    data-testid="button-analyze"
                    className="px-8 py-4 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 whitespace-nowrap text-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                    style={{ backgroundColor: "#7c3aed" }}
                  >
                    {isProcessing ? (
                      <><Loader2 className="w-5 h-5 animate-spin" />Analysing</>
                    ) : (
                      <>Analyse <span>&rarr;</span></>
                    )}
                  </button>
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm justify-center" data-testid="text-error">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                  </div>
                )}
              </form>
            )}

            {/* Example chip */}
            {!isComplete && !isError && !isProcessing && !replayMode && (
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium cursor-default transition-colors hover:bg-white/80"
                style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(209,213,219,0.5)", color: "#4b5563", backdropFilter: "blur(8px)" }}
              >
                Try: <span style={{ color: "#111827", fontWeight: 600 }}>warbyparker.com</span>
                <span className="flex items-center gap-1 ml-1" style={{ color: "#7c3aed" }}>
                  View free example <span className="text-xs">&rarr;</span>
                </span>
              </div>
            )}

          </div>
        </div>

        {/* ── Mode tab switcher ── */}
        {!replayMode && (
          <div className="flex justify-center mt-6 mb-2">
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 12,
                padding: "4px",
                backdropFilter: "blur(8px)",
              }}
            >
              {(["reports", "directory", "agents"] as const).map((tab) => {
                const labels: Record<string, string> = { reports: "Reports", directory: "Directory", agents: "Hire Agents" };
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    data-testid={`tab-${tab}`}
                    onClick={() => {
                      if (tab === "directory") {
                        toast({
                          title: "Coming soon",
                          description: "The directory is on its way — stay tuned.",
                          duration: 2500,
                        });
                        return;
                      }
                      setActiveTab(tab);
                    }}
                    style={{
                      padding: "6px 18px",
                      borderRadius: 8,
                      border: "none",
                      cursor: tab === "directory" ? "default" : "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                      transition: "all 0.2s",
                      background: isActive ? "rgba(124,58,237,0.12)" : "transparent",
                      color: tab === "directory" ? "#94a3b8" : isActive ? "#6d28d9" : "#64748b",
                      boxShadow: isActive ? "inset 0 1px 0 rgba(124,58,237,0.08)" : "none",
                      borderBottom: isActive ? "1px solid rgba(124,58,237,0.25)" : "1px solid transparent",
                    }}
                  >
                    {labels[tab]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tab content ── */}
        {activeTab === "reports" && (
          <>

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

        {/* ── Queue / Waitlist Screen — shown when engine is at capacity ── */}
        {queuedData !== null && !waitlistSubmitted && (
          <div
            className="mt-8 max-w-lg mx-auto rounded-2xl overflow-hidden"
            style={{ background: "linear-gradient(160deg, #0d0f1a 0%, #0a0c14 100%)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="p-6 space-y-5">
              {/* Status badge */}
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs font-semibold text-amber-300">Intelligence Engine at Capacity</span>
                </div>
              </div>

              {/* Headline */}
              <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-2">Your audit is queued</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  3 audits are running right now. We've already crawled your site and found your segments — your full analysis will start the moment a slot opens.
                </p>
              </div>

              {/* Website chip */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-indigo-400" style={{ background: "rgba(99,102,241,0.2)" }}>
                  {queuedData.website.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-indigo-300 truncate">{queuedData.website}</div>
                  <div className="text-xs text-slate-500">Step 1 complete · waiting for scoring slot</div>
                </div>
                <div className="text-xs font-bold text-amber-400 px-2 py-0.5 rounded-md" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)" }}>
                  #1 next
                </div>
              </div>

              {/* Email capture */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-white mb-1">Notify me when it's ready</p>
                  <p className="text-xs text-slate-500">We'll email you the moment your GEO Intelligence Report is complete.</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleWaitlistSubmit()}
                    placeholder="you@company.com"
                    data-testid="input-waitlist-email"
                    className="flex-1 px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "inherit" }}
                  />
                  <button
                    onClick={handleWaitlistSubmit}
                    disabled={waitlistSubmitting || !waitlistEmail.includes("@")}
                    data-testid="button-waitlist-submit"
                    className="px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all"
                    style={{
                      background: waitlistEmail.includes("@") ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.06)",
                      opacity: waitlistSubmitting ? 0.6 : 1,
                      cursor: waitlistEmail.includes("@") && !waitlistSubmitting ? "pointer" : "not-allowed",
                      boxShadow: waitlistEmail.includes("@") ? "0 0 20px rgba(99,102,241,0.3)" : "none",
                    }}
                  >
                    {waitlistSubmitting ? "..." : "Notify me →"}
                  </button>
                </div>
              </div>

              <p className="text-center text-xs text-slate-700">No account needed · Report emailed directly to you</p>
            </div>
          </div>
        )}

        {/* ── Waitlist confirmed ── */}
        {queuedData !== null && waitlistSubmitted && (
          <div
            className="mt-8 max-w-lg mx-auto rounded-2xl overflow-hidden text-center"
            style={{ background: "linear-gradient(160deg, #0d0f1a 0%, #0a0c14 100%)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="p-8 space-y-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto" style={{ background: "rgba(16,185,129,0.15)", border: "2px solid rgba(16,185,129,0.3)" }}>
                ✓
              </div>
              <h2 className="text-xl font-bold text-white">You're in the queue</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                We've saved your spot for <span className="text-indigo-400 font-semibold">{queuedData.website}</span>. The moment a slot opens your audit runs automatically — we'll send the report straight to your inbox.
              </p>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {[
                  { label: "Queue position", value: "#1 — next up" },
                  { label: "Est. wait", value: "~12 min" },
                  { label: "Segments ready", value: `${services.length} found` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="text-sm font-bold text-white">{value}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{label}</div>
                  </div>
                ))}
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
            {allSegmentsDone && scoredSegs.length > 0 && (
              <p className="text-[10px] font-mono tracking-wider uppercase text-slate-500 px-1">
                Unselect a segment if you think it's irrelevant to your brand
              </p>
            )}
            {scoredSegs.map((seg) => (
              <SegmentResultCard
                key={seg.id}
                seg={seg}
                brandName={scoringSession?.brandName || ""}
                selected={allSegmentsDone ? selectedSegmentIds.has(seg.id) : undefined}
                onToggle={allSegmentsDone ? () => setSelectedSegmentIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(seg.id)) next.delete(seg.id); else next.add(seg.id);
                  return next;
                }) : undefined}
              />
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

            {/* Citation sources preview — always visible once scoring completes */}
            {allSegmentsDone && activeSessionId !== null && (
              <div className="mt-4">
                <CitationSourcesPreview sessionId={activeSessionId} />
              </div>
            )}

            {/* All done — single CTA button */}
            {allSegmentsDone && !showIntelligence && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => setShowIntelligence(true)}
                  disabled={selectedSegmentIds.size === 0}
                  data-testid="btn-analyse-intelligence"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-all duration-300 shadow-[0_0_20px_rgba(124,58,237,0.25)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                  style={{ backgroundColor: "#7c3aed" }}
                >
                  Analyse Citation Intelligence
                  {selectedSegmentIds.size < scoredSegs.length && selectedSegmentIds.size > 0 && (
                    <span className="text-xs font-normal opacity-60">· {selectedSegmentIds.size} of {scoredSegs.length}</span>
                  )}
                  <ArrowRight className="w-4 h-4" />
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
                  segments={scoredSegs
                    .filter((s: any) => selectedSegmentIds.has(s.id))
                    .map((s: any, i: number) => ({
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
                <p className="text-slate-400 text-xs mt-0.5">Confirm your services, customer types and competitor landscape, then generate your report.</p>
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

            {/* Competitor Landscape */}
            {competitors.length > 0 && (
              <div className="bg-[#111827]/60 border border-white/10 rounded-2xl p-5 mb-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Competitor Landscape &mdash; <span className="text-amber-400">{competitors.length} detected</span>
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {competitors.map((comp) => (
                    <div key={comp.name} className="group relative">
                      <div
                        data-testid={`chip-competitor-${comp.name}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border bg-amber-500/10 border-amber-500/25 text-amber-300 select-none cursor-default"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70 flex-shrink-0" />
                        {comp.name}
                        {comp.location && (
                          <span className="text-amber-500/50 text-xs font-normal">{comp.location}</span>
                        )}
                      </div>
                      {comp.known_for && (
                        <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover:block z-20 pointer-events-none">
                          <div className="bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 max-w-[220px] shadow-xl whitespace-normal leading-relaxed">
                            {comp.known_for}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-600">These brands may appear in AI responses for your target prompts. Hover a chip to see what they're known for.</p>
              </div>
            )}

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
          </>
        )}

        {/* Hire Agents tab */}
        {activeTab === "agents" && (
          <HireAgentsPanel />
        )}
      </main>

      {/* Pipeline visualization */}
      <section className="relative z-10 py-16 border-y border-black/5" style={{ background: "rgba(255,255,255,0.4)", backdropFilter: "blur(8px)" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold text-indigo-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>The Intelligence Pipeline</h2>
            <p className="text-slate-500 mt-2">From raw domain to actionable GEO insights in minutes.</p>
          </div>
          <div className="relative">
            <div className="absolute top-8 left-0 w-full h-0.5 bg-black/5 hidden md:block" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {steps.map((item, index) => (
                <div key={item.title} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border transition-all duration-500 ${
                      activeStep === index
                        ? "border-violet-300 shadow-[0_0_20px_rgba(124,58,237,0.2)] text-violet-600"
                        : "border-black/8 text-slate-400"
                    }`}
                    style={{ background: activeStep === index ? "rgba(124,58,237,0.08)" : "rgba(255,255,255,0.7)" }}
                    data-testid={`step-${index}`}
                  >
                    <item.icon className="w-7 h-7" />
                  </div>
                  <h3 className={`font-semibold mb-1 transition-colors text-center ${activeStep === index ? "text-indigo-900" : "text-slate-600"}`}>
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-400 text-center">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
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

      {/* Intelligence Brief / FAQ */}
      <section
        id="faq"
        aria-labelledby="faq-heading"
        className="relative z-10 max-w-3xl mx-auto px-6 py-16"
      >
        {/* Section header */}
        <div className="flex items-center gap-3 justify-center mb-2">
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c3aed", boxShadow: "0 0 8px rgba(124,58,237,0.5)" }} className="animate-pulse" />
          <span style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: "0.2em", color: "#7c3aed" }}>
            AGENT INTELLIGENCE BRIEF
          </span>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c3aed", boxShadow: "0 0 8px rgba(124,58,237,0.5)" }} className="animate-pulse" />
        </div>
        <h2 id="faq-heading" className="text-2xl font-bold text-center mb-1" style={{ color: "#1e1b4b", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          How the agents work
        </h2>
        <p className="text-center text-sm mb-10" style={{ color: "#64748b" }}>
          Everything you need to brief your team before the first run.
        </p>

        <div className="space-y-4">
          {[
            {
              id: "Q-001",
              tag: "GEO",
              color: "#6366f1",
              q: "What does the GEO agent actually measure?",
              a: "The GEO agent fires natural-language prompts at ChatGPT, Claude, Gemini, and Perplexity — the same way a real customer would ask. It records every brand mentioned in every response, scores their rank position and frequency, and computes an authority score for your brand against every competitor in the category. Not ranked URLs. Actual AI answer text.",
            },
            {
              id: "Q-002",
              tag: "PNC",
              color: "#8b5cf6",
              q: "How does the Prompt Network agent generate its queries?",
              a: "Drop in a URL. The PNC agent reads your site, extracts your service types and customer segments, then auto-generates 25–30 real-world prompts a buyer would actually type — e.g. \"Find the 10 most trusted [service] providers in [city]\". No manual configuration. The agent builds the full prompt network before the first query fires.",
            },
            {
              id: "Q-003",
              tag: "SCORE",
              color: "#10b981",
              q: "What does a share-of-voice score of 100 mean?",
              a: "100 means your brand is the top-cited answer across every prompt, every engine, every run. 0 means the AI doesn't mention you at all. Everything in between is weighted by rank position and engine importance. The score updates every time an agent run completes — it's a live signal, not a snapshot.",
            },
            {
              id: "Q-004",
              tag: "CITATION",
              color: "#f59e0b",
              q: "What does the citation intelligence agent crawl?",
              a: "When AI engines generate answers, they pull from external sources — Trustpilot, Clutch, G2, industry publications, directories, brand sites. The citation agent crawls every URL cited in your results, classifies the source type, and tells you which third-party platforms are deciding your AI visibility. Fix those sources, move the score.",
            },
            {
              id: "Q-005",
              tag: "RUNTIME",
              color: "#3b82f6",
              q: "How long does a full agent run take?",
              a: "Typically 3 to 8 minutes end-to-end — from URL drop to full scored report. That covers site extraction, prompt network generation, multi-engine firing, citation crawling, source classification, and authority scoring across all segments. The crawl phase is the variable; the agents run in parallel to keep it tight.",
            },
          ].map(({ id, tag, color, q, a }) => (
            <article
              key={id}
              style={{
                background: "rgba(255,255,255,0.75)",
                border: "1px solid rgba(0,0,0,0.07)",
                borderRadius: 12,
                overflow: "hidden",
                backdropFilter: "blur(8px)",
              }}
            >
              {/* Query bar */}
              <div style={{
                background: "rgba(255,255,255,0.9)",
                borderBottom: "1px solid rgba(0,0,0,0.06)",
                padding: "8px 16px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}>
                <span style={{
                  fontFamily: "monospace",
                  fontSize: 9,
                  color: "#94a3b8",
                  letterSpacing: "0.1em",
                }}>
                  {id}
                </span>
                <span style={{
                  background: `${color}15`,
                  border: `1px solid ${color}35`,
                  color,
                  fontSize: 8,
                  fontFamily: "monospace",
                  letterSpacing: "0.15em",
                  padding: "2px 7px",
                  borderRadius: 4,
                  fontWeight: 700,
                }}>
                  {tag}
                </span>
                <span style={{ fontFamily: "monospace", fontSize: 10, color: "#94a3b8", marginLeft: "auto" }}>
                  RESOLVED
                </span>
              </div>

              {/* Body */}
              <div style={{ padding: "14px 16px" }}>
                <h3 style={{
                  fontFamily: "monospace",
                  fontSize: 12,
                  color: "#374151",
                  marginBottom: 10,
                  letterSpacing: "0.01em",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                }}>
                  <span style={{ color, flexShrink: 0 }}>›</span>
                  {q}
                </h3>
                <p style={{
                  fontSize: 13,
                  color: "#4b5563",
                  lineHeight: 1.65,
                  margin: 0,
                  paddingLeft: 16,
                }}>
                  {a}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }} className="relative z-10 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.15em", color: "#94a3b8" }}>
            NEXALYTICS GEO
          </span>
          <span style={{ color: "#cbd5e1", fontSize: 10 }}>·</span>
          <span style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.15em", color: "#94a3b8" }}>
            CITATION INTELLIGENCE
          </span>
          <span style={{ color: "#cbd5e1", fontSize: 10 }}>·</span>
          <span style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.15em", color: "#94a3b8" }}>
            GEO SCORING
          </span>
        </div>
        <p style={{ fontFamily: "monospace", fontSize: 9, color: "#cbd5e1", letterSpacing: "0.1em" }}>
          © 2026 NEXALYTICS. ALL RIGHTS RESERVED.
        </p>
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

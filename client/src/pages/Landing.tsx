import { useState, useEffect, useRef, Component, lazy, Suspense, useMemo } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  ArrowRight, Sparkles, Globe, Activity, BarChart3, Code, Bot, Zap,
  Database, Loader2, AlertCircle, Plus, X, MapPin, CheckCircle2, Brain,
  Search, TrendingUp, Rocket, ChevronDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAdminSettings, getEnabledEngines } from "@/hooks/useAdminSettings";
import { RecentAnalysisTiles } from "@/components/RecentAnalysisTiles";
import { AnalysisPipelineHeader } from "@/components/AnalysisPipelineHeader";
import { MonkWordmark } from "@/components/MonkWordmark";
const AuthoritySourcesPanel = lazy(() =>
  import("@/components/AuthoritySourcesPanel").then(m => ({ default: m.AuthoritySourcesPanel }))
);
const CitationSourcesPreview = lazy(() =>
  import("@/components/CitationSourcesPreview").then(m => ({ default: m.CitationSourcesPreview }))
);
const DispatchFeedLive = lazy(() =>
  import("@/components/DispatchFeedLive").then(m => ({ default: m.DispatchFeedLive }))
);
const SessionSummaryHero = lazy(() =>
  import("@/components/SessionSummaryHero").then(m => ({ default: m.SessionSummaryHero }))
);
const HireAgentsPanel = lazy(() =>
  import("@/components/HireAgentsPanel").then(m => ({ default: m.HireAgentsPanel }))
);

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
  // Strip "Find, list and rank N" and any trailing qualifier words (most/best/top/highest + adjective)
  return text
    .replace(/^find,?\s*list\s*and\s*rank\s*\d+\s*/i, "")
    .replace(/^(most|best|top|highest|well-reviewed)\s+/i, "")
    .replace(/^(trusted|reliable|affordable|rated|experienced|reviewed|recommended)\s+/i, "")
    .trim();
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return url; }
}

function isVertexAiUrl(url: string): boolean {
  try { return new URL(url).hostname.includes("vertexaisearch.cloud.google.com"); }
  catch { return false; }
}

function SegmentResultCard({ seg, brandName, detectedService, selected, onToggle }: { seg: any; brandName: string; detectedService?: string; selected?: boolean; onToggle?: () => void }) {
  const sr = seg.scoringResult;
  const score = sr?.score || {};
  const appearance = Math.round((score.appearance_rate ?? 0) * 100);
  const primary = Math.round((score.primary_rate ?? 0) * 100);
  const avgRank = score.avg_rank != null ? `#${score.avg_rank.toFixed(1)}` : "—";
  const enginesBreakdown = score.engine_breakdown || {};
  const rawRuns = sr?.raw_runs || [];
  const citationCount = rawRuns.reduce((s: number, r: any) => s + (r.citations?.length || 0), 0);
  const label = seg.persona || seg.serviceType || seg.customerType || seg.label || "Segment";
  const isCustomer = !!seg.customerType || seg.customerTypeEnabled === true;

  const firstPromptText = rawRuns[0]?.prompt_text || (seg.prompts?.[0]?.text ?? "");
  const promptContext = firstPromptText ? stripPromptPrefix(firstPromptText) : "";
  const totalResponses = rawRuns.length;

  const [showCitations, setShowCitations] = useState(false);

  const aggregatedCitations = useMemo(() => {
    const map = new Map<string, { url: string; title: string; domain: string; engines: Set<string> }>();
    for (const run of rawRuns) {
      const engine = run.engine || "";
      for (const cit of (run.citations || [])) {
        if (!cit.url) continue;
        if (!map.has(cit.url)) {
          map.set(cit.url, { url: cit.url, title: cit.title || "", domain: getDomain(cit.url), engines: new Set() });
        }
        if (engine) map.get(cit.url)!.engines.add(engine);
      }
    }
    return Array.from(map.values());
  }, [rawRuns]);

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

  const engineList = (["chatgpt", "gemini", "claude"] as const).filter((e) => enginesBreakdown[e]);
  const engMeta = { chatgpt: { label: "ChatGPT", color: "#22c55e" }, gemini: { label: "Gemini", color: "#3b82f6" }, claude: { label: "Claude", color: "#a78bfa" } };

  return (
    <div
      onClick={isSelectable ? onToggle : undefined}
      className="animate-in fade-in slide-in-from-bottom-4 duration-500"
      style={{
        backgroundColor: "#0d1526",
        border: `1px solid ${isSelectable ? (isSelected ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.07)") : "rgba(255,255,255,0.08)"}`,
        borderRadius: 16,
        overflow: "hidden",
        opacity: isSelectable && !isSelected ? 0.55 : 1,
        cursor: isSelectable ? "pointer" : "default",
        boxShadow: isSelected && isSelectable ? "0 0 0 1px rgba(34,197,94,0.1) inset, 0 4px 28px rgba(0,0,0,0.5)" : "0 4px 20px rgba(0,0,0,0.4)",
        transition: "opacity 0.2s, border-color 0.2s",
      }}
    >
      {/* ── Gradient banner ── */}
      <div style={{
        background: "linear-gradient(100deg, #3730a3 0%, #4f46e5 45%, #6d28d9 100%)",
        padding: "14px clamp(14px, 4vw, 24px)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        borderBottom: "1px solid rgba(255,255,255,0.12)",
      }}>
        <div style={{ fontSize: 48, fontWeight: 900, color: "#ffffff", lineHeight: 1, letterSpacing: "-0.02em", flexShrink: 0, textShadow: "0 0 20px rgba(255,255,255,0.3)" }}>
          {appearance}%
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", lineHeight: 1.6, fontWeight: 500 }}>
            {isCustomer ? (
              <>
                Who shows up when{" "}
                <span style={{ display: "inline-block", background: "rgba(167,139,250,0.35)", border: "1px solid rgba(167,139,250,0.5)", color: "#f5f3ff", fontWeight: 700, borderRadius: 6, padding: "0px 7px", lineHeight: 1.7 }}>{seg.customerType}</span>
                {" "}search for{" "}
                {detectedService && <span style={{ display: "inline-block", background: "rgba(167,139,250,0.35)", border: "1px solid rgba(167,139,250,0.5)", color: "#f5f3ff", fontWeight: 700, borderRadius: 6, padding: "0px 7px", lineHeight: 1.7 }}>{detectedService}</span>}
                {seg.location ? <> in <span style={{ display: "inline-block", background: "rgba(99,102,241,0.35)", border: "1px solid rgba(99,102,241,0.5)", color: "#e0e7ff", fontWeight: 700, borderRadius: 6, padding: "0px 7px", lineHeight: 1.7 }}>{seg.location}</span></> : ""}{" "}
                — you appear in{" "}
                <span style={{ display: "inline-block", background: "rgba(255,255,255,0.22)", border: "1px solid rgba(255,255,255,0.3)", color: "#ffffff", fontWeight: 800, borderRadius: 6, padding: "0px 7px", lineHeight: 1.7 }}>{appearance}% of searches</span>
              </>
            ) : (
              <>
                Who shows up when customers search for{" "}
                <span style={{ display: "inline-block", background: "rgba(167,139,250,0.35)", border: "1px solid rgba(167,139,250,0.5)", color: "#f5f3ff", fontWeight: 700, borderRadius: 6, padding: "0px 7px", lineHeight: 1.7 }}>
                  {seg.serviceType || seg.persona || label}
                </span>
                {seg.location ? <> in <span style={{ display: "inline-block", background: "rgba(99,102,241,0.35)", border: "1px solid rgba(99,102,241,0.5)", color: "#e0e7ff", fontWeight: 700, borderRadius: 6, padding: "0px 7px", lineHeight: 1.7 }}>{seg.location}</span></> : ""}{" "}
                — you appear in{" "}
                <span style={{ display: "inline-block", background: "rgba(255,255,255,0.22)", border: "1px solid rgba(255,255,255,0.3)", color: "#ffffff", fontWeight: 800, borderRadius: 6, padding: "0px 7px", lineHeight: 1.7 }}>{appearance}% of searches</span>
              </>
            )}
          </div>
        </div>
        {/* Selection indicator */}
        {isSelectable && (
          <div style={{ marginLeft: "auto", flexShrink: 0, width: 20, height: 20, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", background: isSelected ? "#22c55e" : "rgba(255,255,255,0.12)", border: isSelected ? "2px solid #22c55e" : "2px solid rgba(255,255,255,0.2)", transition: "all 0.2s" }}>
            {isSelected && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* ── Card identity ── */}
      <div style={{ padding: "14px clamp(14px, 4vw, 24px)", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "inline-block", backgroundColor: isCustomer ? "rgba(139,92,246,0.15)" : "rgba(59,130,246,0.15)", color: isCustomer ? "#c4b5fd" : "#93c5fd", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6, border: isCustomer ? "1px solid rgba(139,92,246,0.25)" : "1px solid rgba(59,130,246,0.25)" }}>
            {isCustomer ? "Customer" : "Service"}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#ffffff", lineHeight: 1.25, textTransform: "capitalize" }}>{label}</div>
          {promptContext && (
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>"{promptContext}"</div>
          )}
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#64748b", textAlign: "center", flexShrink: 0, marginLeft: 8 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>{primary}%</div>
            <div>Top 3</div>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>{avgRank}</div>
            <div>Avg Rank</div>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>{citationCount}</div>
            <div>Citations</div>
          </div>
        </div>
      </div>

      {/* ── Engine breakdown — horizontal bars ── */}
      {engineList.length > 0 && (
        <div style={{ padding: "12px clamp(14px, 4vw, 24px)", display: "flex", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          {engineList.map((eng) => {
            const data = enginesBreakdown[eng];
            const pct = Math.round((data?.appearance_rate ?? 0) * 100);
            const meta = engMeta[eng];
            return (
              <div key={eng} style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  <span style={{ color: "#ffffff" }}>{meta.label}</span>
                  <span style={{ color: "#ffffff", fontWeight: 800 }}>{pct}%</span>
                </div>
                <div style={{ height: 5, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", backgroundColor: meta.color, borderRadius: 3 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Rankings ── */}
      {allRankings.length > 0 && (
        <div style={{ padding: "16px clamp(14px, 4vw, 24px)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
            AI Search Rankings
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {allRankings.map((c, idx) => {
              const pct = Math.round((c.share ?? 0) * 100);
              const maxPct = Math.round((allRankings[0]?.share ?? 1) * 100) || 1;
              const barWidth = Math.round((pct / maxPct) * 100);
              return (
                <div key={c.name} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  ...(c.isBrand ? {
                    backgroundColor: "rgba(67,56,202,0.14)",
                    padding: "8px 10px",
                    margin: "0 -10px",
                    borderRadius: 8,
                    border: "1px solid rgba(67,56,202,0.3)",
                  } : {}),
                }}>
                  <div style={{ width: 20, fontSize: 12, fontWeight: 700, color: c.isBrand ? "#a5b4fc" : "#64748b", textAlign: "right", flexShrink: 0 }}>
                    {idx + 1}
                  </div>
                  <div style={{ width: "clamp(80px, 38%, 148px)", fontSize: 13, fontWeight: 700, color: c.isBrand ? "#ffffff" : "#f1f5f9", flexShrink: 0, display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                    {c.isBrand && <span style={{ backgroundColor: "#4338ca", color: "white", fontSize: 9, padding: "2px 6px", borderRadius: 100, fontWeight: "bold", flexShrink: 0 }}>YOU</span>}
                  </div>
                  <div style={{ flex: 1, height: 6, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${barWidth}%`, height: "100%", background: c.isBrand ? "linear-gradient(90deg,#4338ca,#818cf8)" : "linear-gradient(90deg,#3b82f6,#6366f1)", borderRadius: 3, boxShadow: c.isBrand ? "0 0 8px rgba(67,56,202,0.4)" : "0 0 6px rgba(59,130,246,0.3)", transition: "width 0.7s ease" }} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: c.isBrand ? "#c7d2fe" : "#94a3b8", width: 36, textAlign: "right", flexShrink: 0 }}>
                    {pct}%
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: 11, color: "#475569", textAlign: "center" }}>
            Analysis across {totalResponses} responses · ChatGPT, Gemini, Claude
          </div>
        </div>
      )}

      {/* ── Citations ── */}
      {aggregatedCitations.length > 0 && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowCitations(v => !v); }}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px clamp(14px, 4vw, 24px)", background: "transparent", border: "none", cursor: "pointer" }}
            data-testid="btn-toggle-citations"
          >
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "rgba(255,255,255,0.9)", letterSpacing: "0.01em" }}>
              Citations · {aggregatedCitations.length} sources
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,0.75)", transition: "color 0.2s", flexShrink: 1, textAlign: "right" }}>
              {showCitations ? "Hide" : "View all URLs referred to by LLMs"}
              <ChevronDown
                size={12}
                style={{ color: "rgba(255,255,255,0.35)", transform: showCitations ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}
              />
            </span>
          </button>

          {showCitations && (
            <div onClick={(e) => e.stopPropagation()} style={{ borderTop: "1px solid rgba(255,255,255,0.05)", maxHeight: 320, overflowY: "auto" }}>
              {aggregatedCitations.map((cit, i) => (
                <div
                  key={cit.url}
                  style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px clamp(14px, 4vw, 24px)", borderBottom: i < aggregatedCitations.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}
                  data-testid={`row-citation-${i}`}
                >
                  <span style={{ fontSize: 9, fontFamily: "monospace", width: 20, textAlign: "right", flexShrink: 0, marginTop: 2, color: "rgba(255,255,255,0.25)" }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <a href={cit.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 500, color: "#60a5fa", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={cit.url} data-testid={`link-citation-domain-${i}`}>
                      {isVertexAiUrl(cit.url) ? (cit.title || getDomain(cit.url)) : cit.url}
                    </a>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    {Array.from(cit.engines).map(eng => (
                      <span key={eng} style={{ fontSize: 8, padding: "2px 4px", borderRadius: 3, fontWeight: 500, background: eng === "gemini" ? "rgba(59,130,246,0.2)" : eng === "chatgpt" ? "rgba(34,197,94,0.2)" : "rgba(167,139,250,0.2)", color: eng === "gemini" ? "#93c5fd" : eng === "chatgpt" ? "#86efac" : "#c4b5fd" }}>
                        {eng === "chatgpt" ? "GPT" : eng === "gemini" ? "Gem" : "Cla"}
                      </span>
                    ))}
                    <a href={cit.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 4, color: "rgba(255,255,255,0.25)", textDecoration: "none" }} data-testid={`link-citation-open-${i}`}>
                      <span style={{ fontSize: 11 }}>↗</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const FLIPPER_ENGINES = [
  { name: "ChatGPT",    color: "#10a37f" },
  { name: "Gemini",     color: "#4285f4" },
  { name: "Claude",     color: "#d97706" },
  { name: "Perplexity", color: "#6366f1" },
];

const AM_FLIPPER_CSS = `
  @keyframes amFlipIn  { from { transform: rotateX(90deg); opacity: 0 } to { transform: rotateX(0deg); opacity: 1 } }
  @keyframes amFlipOut { from { transform: rotateX(0deg); opacity: 1 } to { transform: rotateX(-90deg); opacity: 0 } }
  .am-flip-in  { animation: amFlipIn  0.2s ease-out forwards; }
  .am-flip-out { animation: amFlipOut 0.18s ease-in  forwards; }
`;

function HeroFlipperText() {
  const [idx, setIdx] = useState(0);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (!document.getElementById("am-flipper-styles")) {
      const el = document.createElement("style");
      el.id = "am-flipper-styles";
      el.textContent = AM_FLIPPER_CSS;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setFlipping(true);
      setTimeout(() => {
        setIdx(i => (i + 1) % FLIPPER_ENGINES.length);
        setFlipping(false);
      }, 200);
    }, 2200);
    return () => clearInterval(t);
  }, []);

  const engine = FLIPPER_ENGINES[idx];

  return (
    <>
      Analyse and improve how you're recommended{" "}
      <span style={{ whiteSpace: "nowrap" }}>
        across{" "}
        <span style={{ display: "inline-block", perspective: 400, verticalAlign: "middle" }}>
          <span
            key={engine.name}
            className={flipping ? "am-flip-out" : "am-flip-in"}
            style={{
              display: "inline-block",
              color: engine.color,
              fontWeight: 700,
            }}
          >
            {engine.name}
          </span>
        </span>
      </span>
    </>
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
  const crawlCardRef = useRef<HTMLDivElement>(null);
  const dispatchFeedRef = useRef<HTMLDivElement>(null);
  const lastSegCardRef = useRef<HTMLDivElement>(null);
  const rankingsBarRef = useRef<HTMLDivElement>(null);
  const lastInitializedId = useRef<number | null>(null);

  const [services, setServices] = useState<string[]>([]);
  const [customers, setCustomers] = useState<string[]>([]);
  const [competitors, setCompetitors] = useState<{name: string; location: string; known_for: string}[]>([]);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [city, setCity] = useState("");
  const [newServiceInput, setNewServiceInput] = useState("");
  const [newCustomerInput, setNewCustomerInput] = useState("");
  const [intelligenceExpanded, setIntelligenceExpanded] = useState(false);
  const [scanStarted, setScanStarted] = useState(false);
  const [activeTab, setActiveTab] = useState<"reports" | "directory" | "agents">("reports");
  const { toast } = useToast();
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<Set<string>>(new Set());
  const [rankingsExpanded, setRankingsExpanded] = useState<boolean>(false);
  const [citationsExpanded, setCitationsExpanded] = useState<boolean>(false);
  const citationsBarRef = useRef<HTMLDivElement>(null);
  const [customerLimitError, setCustomerLimitError] = useState(false);
  const [serviceLimitError, setServiceLimitError] = useState(false);
  const [queuedData, setQueuedData] = useState<{ website: string; submissionId: number } | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  const _adminSettings = getAdminSettings();
  const MAX_SERVICES = _adminSettings.maxServices ?? 3;
  const MAX_CUSTOMERS = _adminSettings.maxCustomers ?? 2;
  const MAX_SELECTED = Math.max(MAX_SERVICES, MAX_CUSTOMERS);

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

  const { data: stats } = useQuery<{ auditsCompleted: number }>({
    queryKey: ["/api/stats"],
    staleTime: 5 * 60 * 1000,
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
    if (
      submission?.status === "complete" &&
      submission?.pncResult &&
      submissionId !== null &&
      lastInitializedId.current !== submissionId
    ) {
      lastInitializedId.current = submissionId;
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
      setSelectedServices(new Set(svcs.slice(0, MAX_SERVICES)));
      setSelectedCustomers(new Set(custs.slice(0, MAX_CUSTOMERS)));
      setCity(ct);
    }
  }, [submission?.status, submission?.pncResult, submissionId]);

  // Clear stale chip state whenever the user resets to a new URL
  useEffect(() => {
    if (!submissionId) {
      lastInitializedId.current = null;
      setServices([]);
      setCustomers([]);
      setCompetitors([]);
      setSelectedServices(new Set());
      setSelectedCustomers(new Set());
      setCity("");
    }
  }, [submissionId]);

  useEffect(() => {
    if (!submissionId) { setAgentStep(0); return; }
    if (!isProcessing) return;
    setAgentStep(0);
    const iv = setInterval(() => {
      setAgentStep((prev) => Math.min(prev + 1, AGENT_STEPS.length - 1));
    }, 1800);
    // Case 1: scroll to crawl card when processing starts
    setTimeout(() => {
      crawlCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    return () => clearInterval(iv);
  }, [submissionId, isProcessing]);

  useEffect(() => {
    if (isComplete) {
      setAgentStep(AGENT_STEPS.length);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [isComplete]);

  const runMutation = useMutation({
    mutationFn: async () => {
      const enabledEngines = getEnabledEngines();
      console.log("[AnswerMonk] run-analysis firing — engines payload:", enabledEngines);
      const res = await apiRequest("POST", "/api/landing/run-analysis", {
        submissionId,
        services: Array.from(selectedServices),
        customers: Array.from(selectedCustomers),
        city: city.trim() || "Global",
        engines: enabledEngines,
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.queued) {
        setQueuedData({ website: data.website, submissionId: data.submissionId });
        return;
      }
      setActiveSessionId(data.sessionId);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    },
    onError: (err: any) => {
      setError(err?.message || "Analysis setup failed. Please try again.");
    },
  });

  async function handleWaitlistSubmit() {
    if (!waitlistEmail.includes("@")) return;
    const website = queuedData?.website || normalizeDomain(url);
    const sid = queuedData?.submissionId ?? submissionId ?? undefined;
    setWaitlistSubmitting(true);
    try {
      await apiRequest("POST", "/api/waitlist", {
        website,
        email: waitlistEmail,
        submissionId: sid,
      });
      setWaitlistSubmitted(true);
    } catch {
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
      return allDone ? false : 1500;
    },
  });

  const scoringSegs: any[] = scoringSession ? (Array.isArray(scoringSession.segments) ? scoringSession.segments : []) : [];
  const scoredSegs = scoringSegs.filter((s) => s.scoringResult !== null);
  const allSegmentsDone = scoringSegs.length > 0 && scoringSegs.every((s) => s.scoringResult !== null);
  // The detected service name — used in customer-segment headline ("when [CustomerType] search for [detectedService]")
  const detectedService: string = scoringSegs.find((s: any) => s.serviceType && !s.customerType)?.serviceType || "";
  const isScoring = activeSessionId !== null && !allSegmentsDone;
  const emailBarVisible = (isScoring || allSegmentsDone) && !waitlistSubmitted;

  const { data: pipelineData } = useQuery<{ rowCount: number; insights: any[] }>({
    queryKey: ["/api/multi-segment-sessions", activeSessionId, "citation-insights"],
    queryFn: async () => {
      const res = await fetch(`/api/multi-segment-sessions/${activeSessionId}/citation-insights`);
      return res.json();
    },
    enabled: allSegmentsDone && activeSessionId !== null,
    refetchInterval: (q) => {
      const d = q?.state?.data as any;
      if ((d?.insights?.length ?? 0) > 0) return false;
      return 4000;
    },
  });
  const pipelineCrawlDone = (pipelineData?.rowCount ?? 0) > 0;
  const pipelineReportDone = (pipelineData?.insights?.length ?? 0) > 0;

  const isError = submission?.status === "error" || runMutation.isError;
  const isRunning = runMutation.isPending;

  useEffect(() => {
    if (!isRunning) { setRunStep(0); return; }
    setRunStep(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
    const iv = setInterval(() => {
      setRunStep((prev) => Math.min(prev + 1, RUN_STEPS.length - 1));
    }, 1400);
    return () => clearInterval(iv);
  }, [isRunning]);

  // Case 2: scroll to top when scoring session first becomes active so pipeline header is visible
  useEffect(() => {
    if (activeSessionId !== null) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 150);
    }
  }, [activeSessionId]);

  useEffect(() => {
    if (scoredSegs.length > 0) {
      setSelectedSegmentIds((prev) => {
        const next = new Set(prev);
        scoredSegs.forEach((s: any) => { if (s.id) next.add(s.id); });
        return next;
      });
    }
    // Scrolling removed — user stays anchored on dispatch feed; final scroll fires on allSegmentsDone
  }, [scoredSegs.length]);

  useEffect(() => {
    setSelectedSegmentIds(new Set());
    setIntelligenceExpanded(false);
    setScanStarted(false);
    setCitationsExpanded(false);
  }, [activeSessionId]);

  useEffect(() => {
    if (allSegmentsDone) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
      setTimeout(() => {
        setRankingsExpanded(false);
      }, 600);
    }
  }, [allSegmentsDone]);

  useEffect(() => {
    setRankingsExpanded(false);
  }, [activeSessionId]);

  function handleTileSelect(sessionId: number) {
    setActiveSessionId(sessionId);
    setReplayMode(true);
    setIntelligenceExpanded(false);
    setScanStarted(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function exitReplay() {
    setActiveSessionId(null);
    setReplayMode(false);
    setIntelligenceExpanded(false);
    setScanStarted(false);
  }

  function isValidDomain(input: string): boolean {
    const cleaned = input.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "");
    // Must have at least one dot, no spaces, valid characters, TLD ≥ 2 chars
    return /^([\w\-]+\.)+[\w\-]{2,}(\/[^\s]*)?$/.test(cleaned);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = url.trim();
    if (!trimmed) return;
    if (!isValidDomain(trimmed)) {
      setError("Please enter a valid website URL, e.g. yourcompany.com");
      return;
    }
    submitMutation.mutate(trimmed);
  }

  function toggleService(s: string) {
    setSelectedServices((prev) => {
      if (!prev.has(s) && prev.size >= MAX_SERVICES) {
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
      if (!prev.has(c) && prev.size >= MAX_CUSTOMERS) {
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
      if (prev.size >= MAX_SERVICES) { setServiceLimitError(true); return prev; }
      return new Set([...prev, s]);
    });
    setNewServiceInput("");
  }

  function addCustomer() {
    const c = newCustomerInput.trim();
    if (!c || customers.includes(c)) { setNewCustomerInput(""); return; }
    setCustomers((prev) => [...prev, c]);
    setSelectedCustomers((prev) => {
      if (prev.size >= MAX_CUSTOMERS) { setCustomerLimitError(true); return prev; }
      return new Set([...prev, c]);
    });
    setNewCustomerInput("");
  }

  const canRun = selectedServices.size > 0 && selectedCustomers.size > 0 && city.trim().length > 0;

  const steps = [
    { title: "Signal Extraction", desc: "Your site, category, and competitors are ingested — we identify the signals AI engines use to decide who gets cited", icon: Brain },
    { title: "LLM Scoring", desc: "Real buyer prompts are fired at ChatGPT, Claude, Gemini, and Perplexity — we record exactly where your brand appears (or doesn't)", icon: Search },
    { title: "Audit Analysis", desc: "We map which domains, sources, and content patterns are driving your competitors' AI citations right now", icon: TrendingUp },
    { title: "Deploy Agents", desc: "You get a prioritised action plan — the exact content and authority fixes that move your brand into AI answers", icon: Rocket },
  ];

  return (
    <div
      className="relative min-h-screen w-full overflow-clip flex flex-col font-sans"
      style={{ background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)" }}
      data-testid="landing-page"
    >
      {(isComplete || activeSessionId !== null) && (
        <AnalysisPipelineHeader
          allSegmentsDone={allSegmentsDone}
          crawlDone={pipelineCrawlDone}
          reportDone={pipelineReportDone}
          profileActive={activeSessionId === null}
        />
      )}
      {(isComplete || activeSessionId !== null) && <div style={{ height: 64, flexShrink: 0 }} />}

      {/* Aurora orbs — vh-based positions so they stay in the hero viewport regardless of doc height */}
      <div style={{ position: 'absolute', top: '-10vh', left: '-5vw', width: '39vw', height: '39vw', background: '#fbcfe8', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.35, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '10vh', right: '-10vw', width: '47vw', height: '47vw', background: '#c4b5fd', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.35, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '44vh', left: '20vw', width: '39vw', height: '39vw', background: '#a7f3d0', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.35, pointerEvents: 'none' }} />

      {/* Nav — hidden once signals extracted or analysis session active (pipeline header takes over) */}
      {!isComplete && activeSessionId === null && (
        <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
          <div className="flex items-center">
            <MonkWordmark size="md" />
          </div>
          <nav className="flex items-center gap-2">
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
              }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: 14, fontWeight: 600, color: "#4f46e5",
                padding: "7px 16px", borderRadius: 99,
                background: "rgba(99,102,241,0.07)",
                border: "1px solid rgba(99,102,241,0.18)",
                textDecoration: "none", transition: "background 0.15s",
                cursor: "pointer",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.13)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(99,102,241,0.07)")}
            >
              How it works
            </a>
          </nav>
        </header>
      )}

      <main className="relative z-10 text-center">

        {/* Hero — vertically centered with same -mt-20 trick as mockup */}
        <div
          className={`flex flex-col items-center px-4 ${(activeSessionId !== null && !isRunning) ? "pt-0 pb-0" : `pb-8 ${(isComplete || activeSessionId !== null) ? "pt-4" : "pt-12"}`}`}
        >
        <div className="max-w-3xl flex flex-col items-center w-full">

            {!replayMode && activeSessionId === null && !isComplete && (
              <>
                {/* Eyebrow */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-violet-200 text-violet-700 text-sm font-medium shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                  </span>
                  AI Visibility Agent - Live
                </div>

                {/* Heading */}
                <h1
                  className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight"
                  style={{ color: "#1e1b4b", marginTop: 10 }}
                >
                  When customers ask AI -{" "}
                  <span style={{ background: "linear-gradient(to right, #60a5fa, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    are you the answer?
                  </span>
                </h1>

                {/* Subtext */}
                <p className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: "#374151", marginTop: 14 }}>
                  <HeroFlipperText />
                </p>
              </>
            )}

            {/* URL Input — hidden once complete or in replay mode */}
            {!isComplete && !isError && !replayMode && (
              <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto space-y-4" style={{ marginTop: 40 }}>
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
                    placeholder="Enter your website to see AI search analysis..."
                    disabled={isProcessing}
                    data-testid="input-website-url"
                    className="flex-1 px-5 py-4 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-gray-800 placeholder-gray-400 text-sm"
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
                      <>Audit now <span>&rarr;</span></>
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

  
          </div>
        </div>

        {/* ── Mode tab switcher ── */}
        {!replayMode && !isComplete && activeSessionId === null && (
          <div className="w-full max-w-7xl mx-auto px-6 flex justify-center mt-8 mb-3">
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: "rgba(255,255,255,0.75)",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 14,
                padding: "5px",
                backdropFilter: "blur(10px)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
              }}
            >
              {(["reports", "directory", "agents"] as const).map((tab) => {
                const labels: Record<string, string> = { reports: "Reports", directory: "AI Directory", agents: "Hire Agents" };
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    data-testid={`tab-${tab}`}
                    onClick={() => {
                      if (tab === "directory") {
                        toast({
                          title: "Coming soon",
                          description: "AI Directory is on its way - stay tuned.",
                          duration: 2500,
                        });
                        return;
                      }
                      setActiveTab(tab);
                    }}
                    style={{
                      padding: "9px 24px",
                      borderRadius: 10,
                      border: "none",
                      cursor: tab === "directory" ? "default" : "pointer",
                      fontSize: 14,
                      fontWeight: isActive ? 700 : 500,
                      letterSpacing: "0.01em",
                      transition: "all 0.2s",
                      background: isActive ? "rgba(124,58,237,0.10)" : "transparent",
                      color: isActive ? "#6d28d9" : "#64748b",
                      opacity: tab === "directory" ? 0.5 : 1,
                      boxShadow: isActive ? "0 1px 4px rgba(124,58,237,0.15)" : "none",
                      borderBottom: isActive ? "1.5px solid rgba(124,58,237,0.25)" : "1.5px solid transparent",
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

        {/* Recent Analyses directory — visible only when truly idle (no submission in flight) */}
        {!isProcessing && !isRunning && !isComplete && !isError && activeSessionId === null && !replayMode && (
          <div className="w-full max-w-7xl mx-auto px-6">
            <RecentAnalysisTiles onSelect={handleTileSelect} />
          </div>
        )}

        {/* Processing — PNC extracting */}
        {isProcessing && submissionId && (
          <div className="mt-8 max-w-md mx-auto" data-testid="status-processing" ref={crawlCardRef}>
            <div className="relative">
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-blue-400/30 via-violet-400/20 to-blue-400/30 blur-sm" />
              <div className="relative bg-white/85 backdrop-blur-xl rounded-2xl p-6 border border-white/90 shadow-lg">
                {/* Bot header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-violet-50 border border-blue-200 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-blue-600 animate-pulse" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white animate-pulse" />
                  </div>
                  <div>
                    <p className="text-gray-900 text-sm font-semibold leading-tight">GEO Agent · Active</p>
                    <p className="text-blue-600/70 text-xs font-mono truncate">analyzing {normalizeDomain(url)}</p>
                  </div>
                  <div className="ml-auto flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-1 h-1 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
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
                        className={`flex items-center gap-3 transition-all duration-500 ${pending ? "opacity-30" : "opacity-100"}`}
                      >
                        <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                          {done && (
                            <div className="w-4 h-4 rounded-full bg-green-50 border border-green-300 flex items-center justify-center">
                              <span className="text-green-600 leading-none" style={{ fontSize: "8px" }}>✓</span>
                            </div>
                          )}
                          {running && <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />}
                          {pending && <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mx-auto" />}
                        </div>
                        <p className={`text-xs font-mono transition-colors duration-300 ${
                          done ? "text-gray-400" :
                          running ? "text-blue-600" :
                          "text-gray-500"
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
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-violet-400/30 via-indigo-400/20 to-violet-400/30 blur-sm" />
              <div className="relative bg-white/85 backdrop-blur-xl rounded-2xl p-6 border border-white/90 shadow-lg">
                {/* Agent header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-violet-600 animate-pulse" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-violet-500 border-2 border-white animate-pulse" />
                  </div>
                  <div>
                    <p className="text-gray-900 text-sm font-semibold leading-tight">GEO Agent · Computing Report</p>
                    <p className="text-violet-600/70 text-xs font-mono truncate">building prompt network for {normalizeDomain(url)}</p>
                  </div>
                  <div className="ml-auto flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-1 h-1 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
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
                        className={`flex items-center gap-3 transition-all duration-500 ${pending ? "opacity-30" : "opacity-100"}`}
                      >
                        <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                          {done && (
                            <div className="w-4 h-4 rounded-full bg-violet-50 border border-violet-300 flex items-center justify-center">
                              <span className="text-violet-600 leading-none" style={{ fontSize: "8px" }}>✓</span>
                            </div>
                          )}
                          {running && <div className="w-4 h-4 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />}
                          {pending && <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mx-auto" />}
                        </div>
                        <p className={`text-xs font-mono transition-colors duration-300 ${
                          done ? "text-gray-400" :
                          running ? "text-violet-600" :
                          "text-gray-500"
                        }`}>
                          {step.emoji} {label}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom label */}
                <p className="mt-5 text-[10px] text-gray-400 font-mono text-center">Scoring fires in background — your report will be ready in ~60s</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Queue / Waitlist Screen — shown when engine is at capacity ── */}
        {queuedData !== null && !waitlistSubmitted && (
          <div
            className="mt-8 max-w-lg mx-auto rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 24px rgba(99,102,241,0.08)" }}
          >
            <div className="p-6 space-y-5">
              {/* Status badge */}
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-xs font-semibold text-amber-700">Intelligence Engine at Capacity</span>
                </div>
              </div>

              {/* Headline */}
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Your audit is queued</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  3 audits are running right now. We've already crawled your site and found your segments — your full analysis will start the moment a slot opens.
                </p>
              </div>

              {/* Website chip */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.18)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-indigo-600" style={{ background: "rgba(99,102,241,0.12)" }}>
                  {queuedData.website.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-indigo-700 truncate">{queuedData.website}</div>
                  <div className="text-xs text-gray-400">Step 1 complete · waiting for scoring slot</div>
                </div>
                <div className="text-xs font-bold text-amber-700 px-2 py-0.5 rounded-md" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }}>
                  #1 next
                </div>
              </div>

              {/* Email capture */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">Notify me when it's ready</p>
                  <p className="text-xs text-gray-400">We'll email you the moment your GEO Intelligence Report is complete.</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleWaitlistSubmit()}
                    placeholder="you@company.com"
                    data-testid="input-waitlist-email"
                    className="flex-1 px-4 py-3 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none"
                    style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.12)", fontFamily: "inherit" }}
                  />
                  <button
                    onClick={handleWaitlistSubmit}
                    disabled={waitlistSubmitting || !waitlistEmail.includes("@")}
                    data-testid="button-waitlist-submit"
                    className="px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all"
                    style={{
                      background: waitlistEmail.includes("@") ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(0,0,0,0.08)",
                      color: waitlistEmail.includes("@") ? "#fff" : "#9ca3af",
                      opacity: waitlistSubmitting ? 0.6 : 1,
                      cursor: waitlistEmail.includes("@") && !waitlistSubmitting ? "pointer" : "not-allowed",
                      boxShadow: waitlistEmail.includes("@") ? "0 0 20px rgba(99,102,241,0.25)" : "none",
                    }}
                  >
                    {waitlistSubmitting ? "..." : "Notify me →"}
                  </button>
                </div>
              </div>

              <p className="text-center text-xs text-gray-400">No account needed · Report emailed directly to you</p>
            </div>
          </div>
        )}

        {/* ── Waitlist confirmed ── */}
        {queuedData !== null && waitlistSubmitted && (
          <div
            className="mt-8 max-w-lg mx-auto rounded-2xl overflow-hidden text-center"
            style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 24px rgba(99,102,241,0.08)" }}
          >
            <div className="p-8 space-y-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto" style={{ background: "rgba(16,185,129,0.1)", border: "2px solid rgba(16,185,129,0.3)" }}>
                ✓
              </div>
              <h2 className="text-xl font-bold text-gray-900">You're in the queue</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                We've saved your spot for <span className="text-indigo-600 font-semibold">{queuedData.website}</span>. The moment a slot opens your audit runs automatically — we'll send the report straight to your inbox.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                {[
                  { label: "Queue position", value: "#1 — next up" },
                  { label: "Est. wait", value: "~12 min" },
                  { label: "Segments ready", value: `${services.length} found` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl p-3" style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.12)" }}>
                    <div className="text-sm font-bold text-gray-900">{value}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Live Scoring Feed — shown after run-analysis returns ── */}
        {activeSessionId !== null && !isRunning && (
          <div className="mt-2 max-w-xl mx-auto space-y-4" ref={resultsRef} style={{ scrollMarginTop: 72 }}>

            {/* Back button — always visible once results are showing */}
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={exitReplay}
                data-testid="button-exit-replay"
                className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
                style={{ color: "#818cf8" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#a5b4fc")}
                onMouseLeave={e => (e.currentTarget.style.color = "#818cf8")}
              >
                <ArrowRight className="w-4 h-4 rotate-180" style={{ strokeWidth: 2.5 }} />
                {replayMode ? "Back to analyses" : "← New analysis"}
              </button>
              {replayMode && (
                <span className="text-xs text-slate-600 font-mono">
                  {scoringSession?.brandName || ""}
                </span>
              )}
            </div>

            {/* Sticky email bar — visible during scoring and after, above all analysis boxes */}
            {emailBarVisible && (
              <div style={{
                position: "sticky",
                top: 60,
                zIndex: 60,
                background: "linear-gradient(110deg, #3730a3 0%, #4f46e5 50%, #6d28d9 100%)",
                borderRadius: 14,
                padding: "10px 14px",
                boxShadow: "0 4px 20px rgba(79,70,229,0.3)",
                display: "flex",
                flexDirection: "column",
                gap: 5,
                marginBottom: 8,
                overflow: "hidden",
              }}>
                <span style={{ fontSize: 12, color: "#fff", fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1 }}>
                  ~2–3 min per stage
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.7)", fontWeight: 500, whiteSpace: "nowrap" }}>
                    wait · or get
                  </span>
                  <input
                    value={waitlistEmail}
                    onChange={e => setWaitlistEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleWaitlistSubmit()}
                    placeholder="your@email.com"
                    data-sticky-email
                    style={{
                      background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 7, padding: "3px 9px", fontSize: 11.5, color: "#fff",
                      outline: "none", flex: 1, minWidth: 100, maxWidth: 180,
                    }}
                  />
                  <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.7)", fontWeight: 500, whiteSpace: "nowrap" }}>
                    when done
                  </span>
                  <button
                    onClick={handleWaitlistSubmit}
                    disabled={waitlistSubmitting || !waitlistEmail.includes("@")}
                    style={{
                      display: "inline-flex", alignItems: "center",
                      background: waitlistEmail.includes("@") ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.15)",
                      color: waitlistEmail.includes("@") ? "#3730a3" : "rgba(255,255,255,0.4)",
                      border: "none", borderRadius: 7, padding: "3px 10px",
                      fontSize: 12, fontWeight: 800, cursor: waitlistEmail.includes("@") ? "pointer" : "not-allowed",
                      whiteSpace: "nowrap", flexShrink: 0,
                    }}
                  >
                    {waitlistSubmitting ? "…" : "→"}
                  </button>
                </div>
              </div>
            )}

            {/* Session summary hero — appears once all segments are scored */}
            {allSegmentsDone && scoredSegs.length > 0 && (
              <Suspense fallback={null}>
                <SessionSummaryHero
                  brandName={scoringSession?.brandName || ""}
                  brandDomain={scoringSession?.brandDomain || undefined}
                  scoredSegs={scoredSegs}
                  totalSegs={scoringSegs.length}
                />
              </Suspense>
            )}

            {/* Scored segment cards — appear one by one as they complete, with skeletons for pending */}

            {/* Sticky slim rankings bar — always visible once all segments done */}
            {allSegmentsDone && scoredSegs.length > 0 && (
              <div
                ref={rankingsBarRef}
                style={{
                  position: "sticky",
                  top: emailBarVisible ? 110 : 60,
                  zIndex: 50,
                  borderRadius: rankingsExpanded ? "14px 14px 0 0" : 14,
                  background: "linear-gradient(110deg, #3730a3 0%, #4f46e5 50%, #6d28d9 100%)",
                  padding: "10px 14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  boxShadow: "0 4px 20px rgba(79,70,229,0.3)",
                  minHeight: 42,
                  overflow: "hidden",
                }}
                onClick={() => {
                  const wasExpanded = rankingsExpanded;
                  setRankingsExpanded(v => !v);
                  if (wasExpanded) {
                    setTimeout(() => {
                      const bar = rankingsBarRef.current;
                      if (!bar) return;
                      const top = bar.getBoundingClientRect().top + window.scrollY - 72;
                      window.scrollTo({ top, behavior: "smooth" });
                    }, 50);
                  }
                }}
              >
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap", minWidth: 0, overflow: "hidden" }}>
                  <span style={{ fontSize: 13.5, color: "#ffffff", fontWeight: 800, letterSpacing: "-0.02em", flexShrink: 0 }}>See competitor rankings</span>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "4px 11px", fontSize: 11.5, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                  {rankingsExpanded ? (
                    <><ChevronDown style={{ width: 12, height: 12, transform: "rotate(180deg)", display: "inline" }} /> Collapse</>
                  ) : (
                    <>View all rankings →</>
                  )}
                </div>
              </div>
            )}

            {/* Individual segment cards — shown during scoring or when expanded */}
            <style>{`
              @keyframes am-shimmer {
                0% { background-position: -400px 0; }
                100% { background-position: 400px 0; }
              }
              .am-shimmer {
                background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%);
                background-size: 800px 100%;
                animation: am-shimmer 1.8s infinite linear;
              }
            `}</style>
            {rankingsExpanded && scoringSegs.map((seg, i) => {
              const isDone = seg.scoringResult !== null;
              const doneIndex = scoredSegs.findIndex((s) => s.id === seg.id);
              if (isDone) {
                return (
                  <div key={seg.id} ref={doneIndex === scoredSegs.length - 1 ? lastSegCardRef : undefined}>
                    <SegmentResultCard
                      seg={seg}
                      brandName={scoringSession?.brandName || ""}
                      detectedService={detectedService}
                    />
                  </div>
                );
              }
              return (
                <div key={seg.id} style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", background: "#0d1526" }}>
                  <div style={{ padding: "14px 16px 12px", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="am-shimmer" style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="am-shimmer" style={{ height: 13, borderRadius: 6, width: "55%", marginBottom: 6 }} />
                      <div className="am-shimmer" style={{ height: 10, borderRadius: 5, width: "35%" }} />
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[60, 44].map((w, k) => (
                        <div key={k} className="am-shimmer" style={{ width: w, height: 22, borderRadius: 6 }} />
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: "12px 16px 14px" }}>
                    <div className="am-shimmer" style={{ height: 36, borderRadius: 8, marginBottom: 10 }} />
                    <div style={{ display: "flex", gap: 8 }}>
                      {[1, 2, 3].map((k) => (
                        <div key={k} style={{ flex: 1, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 8px" }}>
                          <div className="am-shimmer" style={{ height: 20, borderRadius: 5, marginBottom: 6, width: "60%", margin: "0 auto 6px" }} />
                          <div className="am-shimmer" style={{ height: 10, borderRadius: 4, width: "70%", margin: "0 auto" }} />
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#6366f1", animation: "pulse 1.2s ease-in-out infinite" }} />
                      <div className="am-shimmer" style={{ height: 10, borderRadius: 4, width: 140 }} />
                    </div>
                  </div>
                </div>
              );
            })}


            {/* Live Dispatch Feed — shown while scoring is in progress */}
            {isScoring && (
              <div ref={dispatchFeedRef}>
                {scoredSegs.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: "#4f46e5",
                      background: "rgba(99,102,241,0.08)",
                      border: "1px solid rgba(99,102,241,0.18)",
                      borderRadius: 20,
                      padding: "3px 10px",
                    }}>
                      <span style={{ color: "#10b981" }}>✓</span>
                      {scoredSegs.length} of {scoringSegs.length} segments ranked
                    </div>
                  </div>
                )}
                <Suspense fallback={null}>
                  <DispatchFeedLive
                    scoringSegs={scoringSegs}
                    scoredSegs={scoredSegs}
                    brandName={scoringSession?.brandName || ""}
                    brandDomain={scoringSession?.brandDomain || undefined}
                    enabledEngines={getEnabledEngines().map(e =>
                      e === "chatgpt" ? "ChatGPT" : e === "gemini" ? "Gemini" : "Claude"
                    )}
                  />
                </Suspense>
              </div>
            )}


            {/* Scan button — shown before scan is started */}
            {allSegmentsDone && activeSessionId !== null && !scanStarted && (
              <div className="flex justify-center" style={{ marginTop: 12 }}>
                <button
                  data-testid="btn-scan-authority"
                  onClick={() => { setScanStarted(true); setIntelligenceExpanded(true); }}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    background: "linear-gradient(110deg, #3730a3 0%, #4f46e5 50%, #6d28d9 100%)",
                    color: "#fff", border: "none", borderRadius: 12,
                    padding: "11px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                    boxShadow: "0 4px 20px rgba(79,70,229,0.35)",
                  }}
                >
                  {pipelineCrawlDone ? "View Authority Sources →" : "Scan Authority Sources & Analyse →"}
                </button>
              </div>
            )}

            {/* Citation sources preview — collapsible bar, shows only after crawl completes */}
            {allSegmentsDone && activeSessionId !== null && scanStarted && pipelineCrawlDone && (
              <>
                <div
                  ref={citationsBarRef}
                  style={{
                    borderRadius: 14,
                    background: "linear-gradient(110deg, #3730a3 0%, #4f46e5 50%, #6d28d9 100%)",
                    padding: "10px 14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    boxShadow: "0 4px 20px rgba(79,70,229,0.3)",
                    marginTop: 8,
                    minHeight: 42,
                    overflow: "hidden",
                    position: "sticky",
                    top: emailBarVisible ? 110 : 60,
                    zIndex: 51,
                  }}
                  onClick={() => setCitationsExpanded(v => !v)}
                >
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap", minWidth: 0, overflow: "hidden" }}>
                    <span style={{ fontSize: 13.5, color: "#ffffff", fontWeight: 800, letterSpacing: "-0.02em", flexShrink: 0 }}>See authority domains which LLMs refer to</span>
                    <span style={{ width: 1, height: 10, background: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
                    <span style={{ fontSize: 10.5, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 20, padding: "2px 8px", color: "#c7d2fe", fontWeight: 500, flexShrink: 0 }}>LLMs cites</span>
                  </div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "4px 11px", fontSize: 11.5, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {citationsExpanded ? (
                      <><ChevronDown style={{ width: 12, height: 12, transform: "rotate(180deg)", display: "inline" }} /> Collapse</>
                    ) : (
                      <>All sources →</>
                    )}
                  </div>
                </div>
                {citationsExpanded && (
                  <div style={{ marginTop: 8 }}>
                    <Suspense fallback={null}>
                      <CitationSourcesPreview sessionId={activeSessionId} />
                    </Suspense>
                  </div>
                )}
              </>
            )}

            {/* Citation Intelligence collapsible bar — shows only after scan is started */}
            {allSegmentsDone && activeSessionId !== null && scanStarted && (
              <>
                <div
                  style={{
                    borderRadius: 14,
                    background: "linear-gradient(110deg, #3730a3 0%, #4f46e5 50%, #6d28d9 100%)",
                    padding: "10px 14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    boxShadow: "0 4px 20px rgba(79,70,229,0.3)",
                    marginTop: 8,
                    minHeight: 42,
                    overflow: "hidden",
                    position: "sticky",
                    top: emailBarVisible ? 110 : 60,
                    zIndex: 52,
                  }}
                  data-testid="btn-analyse-intelligence"
                  onClick={() => setIntelligenceExpanded(v => !v)}
                >
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap", minWidth: 0, overflow: "hidden" }}>
                    <span style={{ fontSize: 13.5, color: "#ffffff", fontWeight: 800, letterSpacing: "-0.02em", flexShrink: 0 }}>What are competitors doing better?</span>
                  </div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "4px 11px", fontSize: 11.5, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {intelligenceExpanded ? (
                      <><ChevronDown style={{ width: 12, height: 12, transform: "rotate(180deg)", display: "inline" }} /> Collapse</>
                    ) : (
                      <>Run analysis →</>
                    )}
                  </div>
                </div>
                {intelligenceExpanded && (
                  <div style={{ marginTop: 8 }}>
                    <Suspense fallback={null}>
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
                    </Suspense>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Error state */}
        {isError && !isRunning && (
          <div className="mt-8 max-w-lg mx-auto rounded-2xl overflow-hidden" data-testid="status-error"
            style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 24px rgba(99,102,241,0.08)" }}
          >
            <div className="p-6 space-y-5">
              {!waitlistSubmitted ? (
                <>
                  <div className="flex justify-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.25)" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      <span className="text-xs font-semibold text-red-600">Audit interrupted</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      We're on it. Leave your email and we'll send you the complete results as soon as it's done.
                    </p>
                  </div>
                  {url && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.18)" }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-indigo-600" style={{ background: "rgba(99,102,241,0.12)" }}>
                        {normalizeDomain(url).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-indigo-700 truncate">{normalizeDomain(url)}</div>
                        <div className="text-xs text-gray-400">Analysis incomplete</div>
                      </div>
                    </div>
                  )}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-900">Get notified when it's ready</p>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={waitlistEmail}
                        onChange={(e) => setWaitlistEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleWaitlistSubmit()}
                        placeholder="you@company.com"
                        data-testid="input-error-email"
                        className="flex-1 px-4 py-3 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none"
                        style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.12)", fontFamily: "inherit" }}
                      />
                      <button
                        onClick={handleWaitlistSubmit}
                        disabled={waitlistSubmitting || !waitlistEmail.includes("@")}
                        data-testid="button-error-notify"
                        className="px-5 py-3 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          background: waitlistEmail.includes("@") ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(0,0,0,0.08)",
                          color: waitlistEmail.includes("@") ? "#fff" : "#9ca3af",
                          opacity: waitlistSubmitting ? 0.6 : 1,
                          cursor: waitlistEmail.includes("@") && !waitlistSubmitting ? "pointer" : "not-allowed",
                          boxShadow: waitlistEmail.includes("@") ? "0 0 20px rgba(99,102,241,0.25)" : "none",
                        }}
                      >
                        {waitlistSubmitting ? "..." : "Notify me →"}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={() => { setSubmissionId(null); setError(null); runMutation.reset(); }}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline"
                    >
                      Or try again with a different URL
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-2 space-y-3">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto" style={{ background: "rgba(16,185,129,0.1)", border: "2px solid rgba(16,185,129,0.3)" }}>
                    ✓
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">You're on the list</h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    We'll send the complete audit to <span className="text-indigo-600 font-semibold">{waitlistEmail}</span> as soon as it's ready. Usually within a few minutes.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Chip Confirm UI — shown when PNC extraction is complete ── */}
        {isComplete && !isRunning && !activeSessionId && (
          <div className="mt-8 max-w-2xl mx-auto text-left" data-testid="status-complete">

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 font-semibold">Signals detected for {normalizeDomain(url)}</p>
                <p className="text-gray-500 text-xs mt-0.5">Confirm your services, customer types and competitor landscape, then generate your report.</p>
              </div>
              <button
                onClick={() => {
                  setSubmissionId(null);
                  setError(null);
                  setUrl("");
                  runMutation.reset();
                }}
                data-testid="button-reset-analysis"
                className="flex-shrink-0 text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
              >
                ← New URL
              </button>
            </div>

            {/* Services */}
            <div className="bg-white/80 border border-gray-200 rounded-2xl p-5 mb-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Services &mdash; <span className="text-blue-600">{selectedServices.size} selected</span>
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {services.map((s) => {
                  const on = selectedServices.has(s);
                  const locked = !on && selectedServices.size >= MAX_SERVICES;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleService(s)}
                      data-testid={`chip-service-${s}`}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 select-none ${
                        on
                          ? "bg-blue-50 border-blue-300 text-blue-700 cursor-pointer"
                          : locked
                          ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-50"
                          : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 cursor-pointer"
                      }`}
                    >
                      {on && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
                      {s}
                      {on && <X className="w-3 h-3 opacity-50 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {serviceLimitError && (
                <p className="text-xs text-amber-600 mb-2 flex items-center gap-1.5">
                  <span className="inline-block w-3.5 h-3.5 rounded-full border border-amber-500 text-center leading-none" style={{fontSize:"9px"}}>!</span>
                  Max {MAX_SERVICES} services on the free scan — unlock more in the full audit.
                </p>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newServiceInput}
                  onChange={(e) => setNewServiceInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addService(); } }}
                  placeholder="Add a service…"
                  className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-blue-300 transition-colors"
                  data-testid="input-add-service"
                />
                <button
                  type="button"
                  onClick={addService}
                  disabled={!newServiceInput.trim()}
                  className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  data-testid="button-add-service"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Customer Types */}
            <div className="bg-white/80 border border-gray-200 rounded-2xl p-5 mb-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Customer Types &mdash; <span className="text-violet-600">{selectedCustomers.size} selected</span>
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {customers.map((c) => {
                  const on = selectedCustomers.has(c);
                  const locked = !on && selectedCustomers.size >= MAX_CUSTOMERS;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCustomer(c)}
                      data-testid={`chip-customer-${c}`}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 select-none ${
                        on
                          ? "bg-violet-50 border-violet-300 text-violet-700 cursor-pointer"
                          : locked
                          ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-50"
                          : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 cursor-pointer"
                      }`}
                    >
                      {on && <span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />}
                      {c}
                      {on && <X className="w-3 h-3 opacity-50 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {customerLimitError && (
                <p className="text-xs text-amber-600 mb-2 flex items-center gap-1.5">
                  <span className="inline-block w-3.5 h-3.5 rounded-full border border-amber-500 text-center leading-none" style={{fontSize:"9px"}}>!</span>
                  Max {MAX_CUSTOMERS} customer types on the free scan — unlock more in the full audit.
                </p>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCustomerInput}
                  onChange={(e) => setNewCustomerInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomer(); } }}
                  placeholder="Add a customer type…"
                  className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-violet-300 transition-colors"
                  data-testid="input-add-customer"
                />
                <button
                  type="button"
                  onClick={addCustomer}
                  disabled={!newCustomerInput.trim()}
                  className="p-1.5 rounded-lg bg-violet-50 border border-violet-200 text-violet-600 hover:bg-violet-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  data-testid="button-add-customer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Competitor Landscape */}
            {competitors.length > 0 && (
              <div className="bg-white/80 border border-gray-200 rounded-2xl p-5 mb-4 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Competitor Landscape &mdash; <span className="text-amber-600">{competitors.length} detected</span>
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {competitors.map((comp) => (
                    <div key={comp.name} className="group relative">
                      <div
                        data-testid={`chip-competitor-${comp.name}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border bg-amber-50 border-amber-200 text-amber-700 select-none cursor-default"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                        {comp.name}
                        {comp.location && (
                          <span className="text-amber-500 text-xs font-normal">{comp.location}</span>
                        )}
                      </div>
                      {comp.known_for && (
                        <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover:block z-20 pointer-events-none">
                          <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 max-w-[220px] shadow-xl whitespace-normal leading-relaxed">
                            {comp.known_for}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400">These brands may appear in AI responses for your target prompts. Hover a chip to see what they're known for.</p>
              </div>
            )}

            {/* City */}
            <div className="bg-white/80 border border-gray-200 rounded-2xl p-5 mb-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Location</p>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Dubai, New York, London"
                  className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-violet-300 transition-colors"
                  data-testid="input-city"
                />
              </div>
            </div>

            {/* Generate button */}
            {error && (
              <div className="mb-3 flex items-center gap-2 text-red-500 text-sm" data-testid="text-run-error">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}
            <button
              type="button"
              onClick={() => { setError(null); runMutation.mutate(); }}
              disabled={!canRun || isRunning}
              className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_30px_rgba(99,102,241,0.2)] hover:shadow-[0_0_40px_rgba(99,102,241,0.35)]"
              data-testid="button-run-analysis"
            >
              <Sparkles className="w-5 h-5" />
              Activate Audit Agent
              <ArrowRight className="w-4 h-4" />
            </button>
            {!canRun && (
              <p className="text-gray-400 text-xs text-center mt-2">Select at least one service, one customer type, and enter a city.</p>
            )}
          </div>
        )}

          </>
        )}

        {/* Hire Agents tab */}
        {activeTab === "agents" && (
          <Suspense fallback={null}>
            <HireAgentsPanel />
          </Suspense>
        )}
      </main>

      {/* Pipeline visualization */}
      <section id="how-it-works" className="relative z-10 py-16" style={{ background: "linear-gradient(180deg, rgba(237,233,254,0.25) 0%, rgba(236,253,245,0.25) 100%)" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold" style={{ color: "#1e1b4b" }}>The Intelligence Pipeline</h2>
            <p className="text-sm mt-2" style={{ color: "#64748b" }}>From raw domain to actionable GEO insights in minutes.</p>
          </div>
          <div className="relative">
            <div className="absolute top-8 left-0 w-full h-px hidden md:block" style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.15) 20%, rgba(99,102,241,0.15) 80%, transparent)" }} />
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

          {/* Engine trust strip — always visible in this section */}
          <div className="mt-12 pt-8 border-t" style={{ borderColor: "rgba(99,102,241,0.15)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-center mb-5" style={{ color: "#6366f1", letterSpacing: "0.08em" }}>
              Analyzing signals across primary intelligence engines
            </p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-14" style={{ color: "#374151" }}>
              <div className="flex items-center gap-2 font-semibold text-sm"><Bot className="w-5 h-5" style={{ color: "#6366f1" }} /> ChatGPT</div>
              <div className="flex items-center gap-2 font-semibold text-sm"><Zap className="w-5 h-5" style={{ color: "#6366f1" }} /> Claude</div>
              <div className="flex items-center gap-2 font-semibold text-sm"><Sparkles className="w-5 h-5" style={{ color: "#6366f1" }} /> Gemini</div>
              <div className="flex items-center gap-2 font-semibold text-sm"><Database className="w-5 h-5" style={{ color: "#6366f1" }} /> Perplexity</div>
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
        <h2 id="features-heading" className="sr-only">Key features of AnswerMonk Intelligence</h2>
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
        <h2 id="faq-heading" className="text-2xl font-bold text-center mb-1" style={{ color: "#1e1b4b" }}>
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
            ANSWERMONK
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
          © 2026 ANSWERMONK. ALL RIGHTS RESERVED.
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

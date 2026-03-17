import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Brain,
  Loader2,
  Sparkles,
  Globe,
  Shield,
  RefreshCw,
  AlertCircle,
  Building2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ────────────────────────────────────────────────────────────────────

interface SegmentInput {
  id: string;
  persona: string;
  seedType: string;
  customerType: string;
  location: string;
  scoringResult: any;
}

interface DomainEntry {
  domain: string;
  appearances: number;
  inChatgpt: boolean;
  inGemini: boolean;
  inClaude: boolean;
  engineCount: number;
  category?: string;
  categoryLabel?: string;
  authorityScore?: number;
}

interface CitationSourcesData {
  authoritySources: DomainEntry[];
  brandMentions: DomainEntry[];
}

interface InsightRun {
  id: number;
  model: string;
  result_text: string;
  created_at: string;
  row_count?: number;
  input_tokens?: number;
  output_tokens?: number;
}

interface CitationInsightsData {
  rowCount: number;
  insights: InsightRun[];
}

interface DomainUrl {
  url: string;
  title?: string;
  llm_pagetype_classification?: string;
  citation_count: number;
}

interface Props {
  sessionId: number;
  brandName: string;
  segments: SegmentInput[];
  groupKey?: string | null;
  autoRun?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function EngineBadges({
  inChatgpt,
  inGemini,
  inClaude,
}: {
  inChatgpt: boolean;
  inGemini: boolean;
  inClaude: boolean;
}) {
  return (
    <div className="flex gap-1 shrink-0">
      {inChatgpt && (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">
          GPT
        </span>
      )}
      {inGemini && (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
          Gem
        </span>
      )}
      {inClaude && (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-medium">
          Cld
        </span>
      )}
    </div>
  );
}

// ── Domain Row (expandable, lazy URL loading) ─────────────────────────────────

function DomainRow({
  domain,
  appearances,
  inChatgpt,
  inGemini,
  inClaude,
  rank,
  sessionId,
  maxAppearances,
}: DomainEntry & { rank: number; sessionId: number; maxAppearances: number }) {
  const [open, setOpen] = useState(false);

  const { data, isFetching } = useQuery<{ urls: DomainUrl[] }>({
    queryKey: ["/api/multi-segment-sessions", sessionId, "citation-domains", domain],
    queryFn: async () => {
      const res = await fetch(
        `/api/multi-segment-sessions/${sessionId}/citation-domains/${encodeURIComponent(domain)}`
      );
      if (!res.ok) throw new Error("Failed to load URLs");
      return res.json();
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const barPct = maxAppearances > 0 ? Math.round((appearances / maxAppearances) * 100) : 0;

  return (
    <div className="border-b border-border/40 last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/30 transition-colors text-left"
        data-testid={`domain-row-${domain}`}
      >
        <span className="text-[10px] text-muted-foreground font-mono w-4 text-right shrink-0">
          {rank}
        </span>
        <span className="text-xs font-medium flex-1 min-w-0 truncate">{domain}</span>
        <div className="flex items-center gap-2 shrink-0">
          <EngineBadges inChatgpt={inChatgpt} inGemini={inGemini} inClaude={inClaude} />
          <div className="w-16 h-1 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-primary/70"
              style={{ width: `${barPct}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground w-5 text-right tabular-nums">
            {appearances}
          </span>
          {open ? (
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pt-1 pl-12 space-y-1 bg-secondary/10">
              {isFetching && (
                <div className="flex items-center gap-2 py-1.5 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Loading pages…
                </div>
              )}
              {!isFetching &&
                data?.urls.map((u, i) => (
                  <a
                    key={i}
                    href={u.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 py-1 group"
                    data-testid={`domain-url-link-${i}`}
                  >
                    <ExternalLink className="w-3 h-3 mt-0.5 text-muted-foreground shrink-0 group-hover:text-blue-500" />
                    <span className="flex-1 min-w-0">
                      <span className="text-xs text-blue-600 dark:text-blue-400 group-hover:underline block truncate">
                        {u.title || u.url}
                      </span>
                      {u.llm_pagetype_classification && (
                        <span className="text-[10px] text-muted-foreground">
                          {u.llm_pagetype_classification}
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                      ×{u.citation_count}
                    </span>
                  </a>
                ))}
              {!isFetching && data?.urls.length === 0 && (
                <p className="text-xs text-muted-foreground py-1">No URLs found for this domain.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Mission Control Loader ────────────────────────────────────────────────────

const STREAM_POOLS = [
  ["healthfinder.ae","dha.gov.ae","nhfd.ae","haad.to","seha.ae","moh.gov.ae"],
  ["reddit.com","trustpilot.com","g2.com","capterra.com","glassdoor.com","quora.com"],
  ["gulfnews.com","thenationalnews.com","arabianbusiness.com","zawya.com","entrepreneur.com"],
];
const STATUSES = ["CRAWLING","RESOLVING","CLASSIFYING","INDEXED"];

function useCrawlProgress(sessionId: number, active: boolean) {
  const [progress, setProgress] = useState<{ step: string; detail: string; pct: number } | null>(null);

  useEffect(() => {
    if (!active) return;
    const key = `session-${sessionId}`;
    let alive = true;
    const poll = async () => {
      try {
        const res = await fetch(`/api/segment-analysis/progress/${key}`);
        if (res.ok && alive) setProgress(await res.json());
      } catch { /* silent */ }
    };
    poll();
    const id = setInterval(poll, 800);
    return () => { alive = false; clearInterval(id); };
  }, [sessionId, active]);

  return progress;
}

function MissionControlLoader({
  sessionId,
  crawlPending,
  insightsPending,
}: {
  sessionId: number;
  crawlPending: boolean;
  insightsPending: boolean;
}) {
  const progress = useCrawlProgress(sessionId, crawlPending);
  const [streamDomains, setStreamDomains] = useState(STREAM_POOLS.map(p => p[0]));
  const [streamStatus, setStreamStatus] = useState([0, 1, 2]);
  const tick = useRef(0);

  // Parse real numbers from progress detail string
  const crawledMatch = progress?.detail?.match(/(\d+)\/(\d+)/);
  const okMatch = progress?.detail?.match(/(\d+) ok/);
  const realCrawled = crawledMatch ? parseInt(crawledMatch[1]) : null;
  const realTotal = crawledMatch ? parseInt(crawledMatch[2]) : null;
  const realOk = okMatch ? parseInt(okMatch[1]) : null;

  const [animCrawled, setAnimCrawled] = useState(0);
  const [animOk, setAnimOk] = useState(0);
  const [animClassified, setAnimClassified] = useState(0);
  const animCrawledRef = useRef(0);

  // Animate stream domains
  useEffect(() => {
    if (!crawlPending) return;
    const id = setInterval(() => {
      tick.current++;
      if (tick.current % 4 === 0) {
        setStreamDomains(STREAM_POOLS.map(pool => pool[Math.floor(Math.random() * pool.length)]));
        setStreamStatus([
          Math.floor(Math.random() * 4),
          Math.floor(Math.random() * 4),
          Math.floor(Math.random() * 4),
        ]);
      }
      setAnimCrawled(c => {
        const next = realCrawled ? Math.min(realCrawled, c + Math.floor(Math.random() * 5) + 1) : Math.min(999, c + Math.floor(Math.random() * 4) + 1);
        animCrawledRef.current = next;
        return next;
      });
      setAnimOk(o => realOk ? Math.min(realOk, o + Math.floor(Math.random() * 4) + 1) : Math.min(800, o + Math.floor(Math.random() * 3) + 1));
      setAnimClassified(cl => Math.min(animCrawledRef.current, cl + Math.floor(Math.random() * 3) + 1));
    }, 600);
    return () => clearInterval(id);
  }, [crawlPending, realCrawled, realOk]);

  const phaseStep = progress?.step ?? "crawling";
  const phaseLabel = insightsPending
    ? "AI ANALYSIS"
    : phaseStep === "starting" ? "INITIALIZING"
    : phaseStep === "crawling" ? "CRAWLING"
    : phaseStep === "snippets" ? "EXTRACTING"
    : phaseStep === "classifying" ? "CLASSIFYING"
    : phaseStep === "scoring" || phaseStep === "global" ? "INDEXING"
    : phaseStep === "complete" ? "COMPLETE"
    : "PROCESSING";

  const displayPct = insightsPending ? 100 : (progress?.pct ?? Math.min(95, (animCrawled / (realTotal ?? 600)) * 100));
  const classifiedPct = animClassified / Math.max(animCrawled, 1);

  const streamColors = ["#3b82f6", "#6366f1", "#10b981"];

  return (
    <div style={{ background: "#040912", borderRadius: 12, overflow: "hidden", fontFamily: "system-ui, sans-serif" }}>
      {/* Status bar */}
      <div style={{ background: "#0a1628", borderBottom: "1px solid #1e3a5f", padding: "8px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#3b82f6", fontSize: 10, fontFamily: "monospace", letterSpacing: 2 }}>NEXALYTICS GEO</span>
          <span style={{ color: "#1e3a5f", fontSize: 10 }}>·</span>
          <span style={{ color: "#64748b", fontSize: 10, fontFamily: "monospace" }}>CITATION INTELLIGENCE</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: insightsPending ? "#f59e0b" : "#ef4444", animation: "mc-blink 0.8s infinite" }} />
          <span style={{ color: insightsPending ? "#f59e0b" : "#ef4444", fontSize: 10, fontFamily: "monospace", letterSpacing: 1 }}>{phaseLabel}</span>
        </div>
      </div>

      {/* Main panel */}
      <div style={{ background: "#060f1e", padding: "20px 20px 16px" }}>
        {/* Central ring */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <div style={{ position: "relative", width: 130, height: 130 }}>
            <svg viewBox="0 0 140 140" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
              <circle cx="70" cy="70" r="62" fill="none" stroke="#1e3a5f" strokeWidth="4" />
              <circle cx="70" cy="70" r="62" fill="none"
                stroke={insightsPending ? "#f59e0b" : "#3b82f6"} strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 62}`}
                strokeDashoffset={`${2 * Math.PI * 62 * (1 - displayPct / 100)}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.8s ease", filter: insightsPending ? "drop-shadow(0 0 8px #f59e0b)" : "drop-shadow(0 0 8px #3b82f6)" }}
              />
            </svg>
            <svg viewBox="0 0 140 140" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
              <circle cx="70" cy="70" r="46" fill="none" stroke="#0a1e3a" strokeWidth="2" />
              <circle cx="70" cy="70" r="46" fill="none" stroke="#6366f1" strokeWidth="2"
                strokeDasharray={`${2 * Math.PI * 46}`}
                strokeDashoffset={`${2 * Math.PI * 46 * (1 - classifiedPct)}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.8s ease", filter: "drop-shadow(0 0 5px #6366f1)" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ color: "#e2e8f0", fontSize: 26, fontWeight: 700, lineHeight: 1, fontFamily: "monospace" }}>
                {Math.round(displayPct)}%
              </div>
              <div style={{ color: insightsPending ? "#f59e0b" : "#3b82f6", fontSize: 9, letterSpacing: 1, marginTop: 4, fontFamily: "monospace" }}>
                {insightsPending ? "ANALYSING" : "CRAWLED"}
              </div>
            </div>
          </div>
        </div>

        {/* Stream monitors — hidden during insights phase */}
        {!insightsPending && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ color: "#334155", fontSize: 9, fontFamily: "monospace", marginBottom: 5, letterSpacing: 1 }}>STREAM {i + 1}</div>
                <div style={{ color: streamColors[i], fontSize: 10, fontFamily: "monospace", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {streamDomains[i]}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: streamColors[streamStatus[i] % 3], animation: "mc-pulse 1.2s infinite" }} />
                  <span style={{ color: "#475569", fontSize: 9, fontFamily: "monospace" }}>{STATUSES[streamStatus[i]]}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Claude Sonnet analysis message — insights phase */}
        {insightsPending && (
          <div style={{ background: "#0a1628", border: "1px solid #78350f", borderRadius: 8, padding: "12px 16px", marginBottom: 14, textAlign: "center" }}>
            <div style={{ color: "#f59e0b", fontSize: 11, fontFamily: "monospace", letterSpacing: 1, marginBottom: 6 }}>CLAUDE SONNET ANALYSIS</div>
            <div style={{ color: "#64748b", fontSize: 10, fontFamily: "monospace" }}>Analysing {animCrawled.toLocaleString()} citation rows · discovering GEO tactics…</div>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[
            { label: "PAGES FOUND", value: realCrawled ?? animCrawled, suffix: realTotal ? `/${realTotal}` : "", color: "#3b82f6" },
            { label: "ACCESSIBLE", value: realOk ?? animOk, suffix: "", color: "#10b981" },
            { label: "CLASSIFIED", value: animClassified, suffix: "", color: "#6366f1" },
          ].map(s => (
            <div key={s.label} style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
              <div style={{ color: s.color, fontFamily: "monospace", fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>
                {s.value.toLocaleString()}
                {s.suffix && <span style={{ color: "#1e3a5f", fontSize: 12 }}>{s.suffix}</span>}
              </div>
              <div style={{ color: "#334155", fontSize: 9, fontFamily: "monospace", letterSpacing: 1, marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Phase detail */}
        <div style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, padding: "10px 14px" }}>
          <div style={{ color: "#334155", fontSize: 9, fontFamily: "monospace", letterSpacing: 1, marginBottom: 7 }}>CURRENT OPERATION</div>
          <div style={{ color: "#475569", fontSize: 10, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {progress?.detail ?? (insightsPending ? "Running Claude Sonnet 4.5 citation intelligence analysis…" : "Initialising web crawler…")}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes mc-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes mc-blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}

// ── Structured JSON report types ─────────────────────────────────────────────

interface ReportSummary {
  total_citations: number;
  domains_analysed: number;
  cross_engine_brands: number;
  key_finding: string;
}
interface PageTypeDistribution {
  winner: string;
  winner_citations: number;
  summary: string;
}
interface CrossEngineChampion {
  brand: string;
  chatgpt: number;
  gemini: number;
  total: number;
}
interface TacticExample {
  url: string;
  brand: string;
  count: number;
}
interface Tactic {
  rank: number;
  title: string;
  impact: string;
  citations: number;
  confidence: string;
  mechanism: string;
  examples: TacticExample[];
  why_it_works: string[];
}
interface SourceEntry {
  domain: string;
  type: string;
  importance: string;
  appearances: number;
}
interface UnusualFinding {
  title: string;
  finding: string;
}
interface StructuredReportData {
  summary: ReportSummary;
  page_type_distribution: PageTypeDistribution;
  cross_engine_champions: CrossEngineChampion[];
  tactics: Tactic[];
  sources: SourceEntry[];
  unusual_findings: UnusualFinding[];
}

const IMPACT_COLORS: Record<string, string> = {
  HIGHEST: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800",
  "VERY HIGH": "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800",
  HIGH: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
  MEDIUM: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800",
  LOW: "text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700",
};

const IMPACT_BAR_COLORS: Record<string, string> = {
  HIGHEST: "bg-red-500",
  "VERY HIGH": "bg-orange-500",
  HIGH: "bg-blue-500",
  MEDIUM: "bg-violet-500",
  LOW: "bg-slate-400",
};

const SOURCE_TYPE_COLORS: Record<string, string> = {
  Government: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40",
  Directory: "text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40",
  Community: "text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40",
  News: "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/40",
  "Review Platform": "text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40",
  Brand: "text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-950/40",
  Aggregator: "text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/40",
  Other: "text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/40",
};

function TacticCard({ tactic }: { tactic: Tactic }) {
  const [open, setOpen] = useState(false);
  const impactCls = IMPACT_COLORS[tactic.impact] ?? IMPACT_COLORS.LOW;
  const barCls = IMPACT_BAR_COLORS[tactic.impact] ?? "bg-slate-400";

  return (
    <div className="border border-border/60 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/30 ${open ? "bg-secondary/20" : "bg-background"}`}
      >
        {/* Rank badge */}
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold border shrink-0 ${impactCls}`}>
          #{tactic.rank}
        </div>
        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground leading-tight truncate">{tactic.title}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${impactCls}`}>{tactic.impact}</span>
            <span className="text-[11px] text-muted-foreground">{tactic.citations} citations</span>
            <span className="text-[10px] text-muted-foreground opacity-60">· {tactic.confidence} confidence</span>
          </div>
        </div>
        {/* Mini bar */}
        <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden shrink-0 hidden sm:block">
          <div className={`h-full rounded-full ${barCls}`} style={{ width: `${Math.min(100, (tactic.citations / 200) * 100)}%` }} />
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-3 bg-secondary/10 border-t border-border/40 space-y-4">
              {/* Mechanism */}
              <p className="text-xs text-muted-foreground leading-relaxed">{tactic.mechanism}</p>

              {/* URL examples */}
              {tactic.examples?.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-foreground mb-2">Top performing pages</div>
                  <div className="space-y-1.5">
                    {tactic.examples.map((ex, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <a
                          href={ex.url.startsWith("http") ? ex.url : `https://${ex.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 min-w-0 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-mono bg-secondary/40 px-2 py-1 rounded truncate"
                        >
                          {ex.url}
                        </a>
                        <span className="text-[10px] text-muted-foreground shrink-0">{ex.count} cit.</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Why it works */}
              {tactic.why_it_works?.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-foreground mb-2">Why it works</div>
                  <div className="space-y-1">
                    {tactic.why_it_works.map((w, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className={`text-[11px] shrink-0 mt-0.5 ${IMPACT_BAR_COLORS[tactic.impact] ? "text-primary" : "text-muted-foreground"}`}>✓</span>
                        <span className="text-xs text-muted-foreground">{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ExpandableSourceRow({
  source,
  sessionId,
  maxAppearances,
}: {
  source: SourceEntry;
  sessionId: number;
  maxAppearances: number;
}) {
  const [open, setOpen] = useState(false);
  const { data, isFetching } = useQuery<{ urls: DomainUrl[] }>({
    queryKey: ["/api/multi-segment-sessions", sessionId, "citation-domains", source.domain],
    queryFn: async () => {
      const res = await fetch(`/api/multi-segment-sessions/${sessionId}/citation-domains/${encodeURIComponent(source.domain)}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });
  const typeCls = SOURCE_TYPE_COLORS[source.type] ?? SOURCE_TYPE_COLORS.Other;
  const impDots = source.importance === "High" ? 3 : source.importance === "Medium" ? 2 : 1;
  const barPct = maxAppearances > 0 ? Math.round((source.appearances / maxAppearances) * 100) : 0;

  return (
    <div className="border-b border-border/30 last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/20 transition-colors text-left"
      >
        <span className="text-sm font-medium text-foreground flex-1 min-w-0 truncate">{source.domain}</span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 ${typeCls}`}>{source.type}</span>
        <span className="flex gap-0.5 shrink-0">
          {[1, 2, 3].map((n) => (
            <span key={n} className={`text-[10px] ${n <= impDots ? "text-primary" : "text-border"}`}>●</span>
          ))}
        </span>
        <div className="w-14 h-1.5 bg-secondary rounded-full overflow-hidden shrink-0">
          <div className="h-full rounded-full bg-primary/70" style={{ width: `${barPct}%` }} />
        </div>
        <span className="text-[11px] text-muted-foreground w-6 text-right tabular-nums shrink-0">{source.appearances}</span>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-3 pt-1 pl-8 space-y-1 bg-secondary/10">
              {isFetching && <div className="flex items-center gap-2 py-1.5 text-xs text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" />Loading pages…</div>}
              {!isFetching && data?.urls.map((u, i) => (
                <a key={i} href={u.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 py-1 group">
                  <ExternalLink className="w-3 h-3 mt-0.5 text-muted-foreground shrink-0 group-hover:text-blue-500" />
                  <span className="flex-1 min-w-0">
                    <span className="text-xs text-blue-600 dark:text-blue-400 group-hover:underline block truncate">{u.title || u.url}</span>
                    {u.llm_pagetype_classification && <span className="text-[10px] text-muted-foreground">{u.llm_pagetype_classification}</span>}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">×{u.citation_count}</span>
                </a>
              ))}
              {!isFetching && (!data?.urls || data.urls.length === 0) && <p className="text-xs text-muted-foreground py-1">No URLs found.</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StructuredReport({ data, sessionId }: { data: StructuredReportData; sessionId: number }) {
  const maxSourceApps = Math.max(...(data.sources?.map((s) => s.appearances) ?? [1]), 1);
  const maxChampTotal = Math.max(...(data.cross_engine_champions?.map((c) => c.total) ?? [1]), 1);

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="rounded-xl overflow-hidden border border-border/40" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)" }}>
        <div className="px-5 py-4">
          <div className="text-[10px] text-slate-400 tracking-widest mb-1 uppercase">Citation Intelligence Report</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
            {[
              { label: "Total Citations", value: data.summary?.total_citations?.toLocaleString() ?? "—" },
              { label: "Domains Analysed", value: data.summary?.domains_analysed?.toLocaleString() ?? "—" },
              { label: "Cross-Engine Brands", value: data.summary?.cross_engine_brands?.toString() ?? "—" },
              { label: "AI Tactics Found", value: data.tactics?.length?.toString() ?? "—" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-white text-lg font-bold leading-tight">{s.value}</div>
                <div className="text-slate-400 text-[10px] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key finding callout */}
      {data.summary?.key_finding && (
        <div className="flex gap-3 items-start rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/20 px-4 py-3">
          <span className="text-lg shrink-0">⚡</span>
          <div>
            <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 mb-1">Key Finding</div>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{data.summary.key_finding}</p>
          </div>
        </div>
      )}

      {/* Page type distribution */}
      {data.page_type_distribution?.summary && (
        <div className="rounded-xl border border-border/50 bg-secondary/10 px-4 py-3">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
            <span className="text-[11px] font-semibold text-foreground">Page Type Distribution</span>
            <span className="ml-auto text-[10px] text-muted-foreground">{data.page_type_distribution.winner} leads with {data.page_type_distribution.winner_citations} citations</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{data.page_type_distribution.summary}</p>
        </div>
      )}

      {/* Cross-engine champions */}
      {data.cross_engine_champions?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-primary to-violet-500" />
            <span className="text-sm font-bold text-foreground">Cross-Engine Champions</span>
            <span className="text-[10px] text-muted-foreground ml-1">Appear in both ChatGPT + Gemini</span>
          </div>
          <div className="space-y-2">
            {data.cross_engine_champions.slice(0, 8).map((c) => (
              <div key={c.brand} className="flex items-center gap-3">
                <span className="text-xs font-medium text-foreground w-24 shrink-0 truncate">{c.brand}</span>
                <div className="flex-1 flex gap-0.5 h-3 rounded-full overflow-hidden">
                  <div className="bg-blue-500/80 rounded-l-full" style={{ width: `${(c.chatgpt / maxChampTotal) * 60}%` }} title={`ChatGPT: ${c.chatgpt}`} />
                  <div className="bg-indigo-500/80 rounded-r-full" style={{ width: `${(c.gemini / maxChampTotal) * 60}%` }} title={`Gemini: ${c.gemini}`} />
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">{c.total} total</span>
                <div className="flex gap-1 shrink-0">
                  <span className="text-[9px] px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">GPT {c.chatgpt}</span>
                  <span className="text-[9px] px-1 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">Gem {c.gemini}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tactics — collapsible cards */}
      {data.tactics?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-orange-500 to-red-500" />
            <span className="text-sm font-bold text-foreground">What Top Brands Do Differently</span>
            <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded ml-1">{data.tactics.length} tactics · ranked by citation evidence</span>
          </div>
          <div className="space-y-2">
            {data.tactics.map((t) => <TacticCard key={t.rank} tactic={t} />)}
          </div>
        </div>
      )}

      {/* Sources table */}
      {data.sources?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-green-500 to-blue-500" />
            <span className="text-sm font-bold text-foreground">Sources Shaping AI Recommendations</span>
          </div>
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 px-4 py-2 bg-secondary/30 border-b border-border/40">
              {["Source", "Type", "Weight", "Apps.", ""].map((h) => (
                <span key={h} className="text-[10px] font-semibold text-muted-foreground tracking-wide">{h}</span>
              ))}
            </div>
            {data.sources.map((s) => (
              <ExpandableSourceRow key={s.domain} source={s} sessionId={sessionId} maxAppearances={maxSourceApps} />
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 px-1">Click any source to see all individual URLs — sorted by citation frequency</p>
        </div>
      )}

      {/* Unusual findings */}
      {data.unusual_findings?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-pink-500 to-violet-500" />
            <span className="text-sm font-bold text-foreground">Unusual Findings</span>
          </div>
          <div className="space-y-2">
            {data.unusual_findings.map((f, i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-secondary/10 px-4 py-3">
                <div className="text-xs font-semibold text-foreground mb-1">{f.title}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.finding}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Markdown report renderer (legacy fallback) ───────────────────────────────

function renderInline(text: string) {
  return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
}

function MarkdownReport({ text }: { text: string }) {
  const rawSections = text.split(/\n(?=##\s)/);

  return (
    <div className="space-y-3">
      {rawSections.map((section, i) => {
        const lines = section.trim().split("\n");
        const firstLine = lines[0] || "";
        const isH2 = firstLine.startsWith("## ");
        const isH1 = firstLine.startsWith("# ");
        const heading = isH2
          ? firstLine.slice(3).trim()
          : isH1
          ? firstLine.slice(2).trim()
          : null;
        const bodyLines = heading ? lines.slice(1) : lines;
        const body = bodyLines.join("\n").trim();

        if (!body && !heading) return null;

        const blocks = body.split(/\n\n+/);

        return (
          <div
            key={i}
            className={
              heading
                ? "rounded-lg border border-border/60 bg-secondary/20 p-4"
                : "px-1"
            }
          >
            {heading && (
              <p className="text-sm font-semibold mb-2.5 text-foreground">
                {heading}
              </p>
            )}
            <div className="space-y-2">
              {blocks.map((block, j) => {
                if (!block.trim()) return null;
                const blockLines = block.trim().split("\n");
                const isList = blockLines.every(
                  (l) => l.startsWith("- ") || l.startsWith("* ") || l.match(/^\d+\.\s/)
                );

                if (isList) {
                  return (
                    <ul key={j} className="space-y-1">
                      {blockLines.map((item, k) => {
                        const content = item.replace(/^[-*]\s|^\d+\.\s/, "");
                        return (
                          <li key={k} className="flex gap-1.5 text-xs text-muted-foreground">
                            <span className="text-primary/70 shrink-0 mt-0.5">•</span>
                            <span
                              dangerouslySetInnerHTML={{ __html: renderInline(content) }}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  );
                }

                return (
                  <p
                    key={j}
                    className="text-xs text-muted-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderInline(block.trim()) }}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AuthoritySourcesPanel({ sessionId, brandName, segments, groupKey, autoRun }: Props) {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"authority" | "brand">("authority");
  const [crawlError, setCrawlError] = useState<string | null>(null);
  const autoInsightsTriggered = useRef(false);
  const autoCrawlTriggered = useRef(false);

  // Gate check: rowCount + past insight runs
  const { data: insightsData, isLoading: insightsLoading } = useQuery<CitationInsightsData>({
    queryKey: ["/api/multi-segment-sessions", sessionId, "citation-insights"],
    queryFn: async () => {
      const res = await fetch(`/api/multi-segment-sessions/${sessionId}/citation-insights`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: false,
    staleTime: 30_000,
  });

  const rowCount = insightsData?.rowCount ?? 0;
  const pastInsights = insightsData?.insights ?? [];
  const latestInsight = pastInsights[0] ?? null;
  const hasData = rowCount > 0;

  // Citation sources (enabled only when citation_urls is populated)
  const { data: sourcesData, isLoading: sourcesLoading } = useQuery<CitationSourcesData>({
    queryKey: ["/api/multi-segment-sessions", sessionId, "citation-sources"],
    queryFn: async () => {
      const res = await fetch(`/api/multi-segment-sessions/${sessionId}/citation-sources`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: hasData,
    staleTime: 60_000,
  });

  const authoritySources = sourcesData?.authoritySources ?? [];
  const brandMentions = sourcesData?.brandMentions ?? [];

  // Analyse & Crawl mutation
  const crawlMutation = useMutation({
    mutationFn: async () => {
      const payload = segments.map((s) => ({
        id: s.id,
        persona: s.persona,
        seedType: s.seedType,
        customerType: s.customerType,
        location: s.location,
        scoringResult: s.scoringResult,
      }));
      const res = await apiRequest("POST", "/api/segment-analysis/analyze", {
        brandName,
        segments: payload,
        sessionId,
        groupKey: groupKey ?? undefined,
        progressKey: `session-${sessionId}`,
      });
      return res.json();
    },
    onSuccess: () => {
      setCrawlError(null);
      qc.invalidateQueries({ queryKey: ["/api/multi-segment-sessions", sessionId, "citation-insights"] });
      qc.invalidateQueries({ queryKey: ["/api/multi-segment-sessions", sessionId, "citation-sources"] });
      // Auto-chain: fire Claude Sonnet immediately after crawl if autoRun
      if (autoRun && !autoInsightsTriggered.current) {
        autoInsightsTriggered.current = true;
        insightsMutation.mutate();
      }
    },
    onError: (err: any) => setCrawlError(String(err)),
  });

  // Claude Sonnet insights mutation
  const insightsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST",
        `/api/multi-segment-sessions/${sessionId}/citation-insights`,
        { model: "claude-sonnet-4-5" }
      );
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["/api/multi-segment-sessions", sessionId, "citation-insights"],
      });
    },
  });

  // ── Auto-run chain: fire crawl → insights without user interaction ──────────
  useEffect(() => {
    if (!autoRun || insightsLoading) return;

    // Case 1: No citation data yet → start crawl
    if (rowCount === 0 && !autoCrawlTriggered.current && !crawlMutation.isPending) {
      autoCrawlTriggered.current = true;
      crawlMutation.mutate();
      return;
    }

    // Case 2: Citation data exists but no insights yet → start Claude
    if (rowCount > 0 && pastInsights.length === 0 && !autoInsightsTriggered.current && !insightsMutation.isPending) {
      autoInsightsTriggered.current = true;
      insightsMutation.mutate();
    }
  }, [autoRun, insightsLoading, rowCount, pastInsights.length]);

  const authorityMax = authoritySources[0]?.appearances ?? 1;
  const brandMax = brandMentions[0]?.appearances ?? 1;

  return (
    <div className="space-y-4">
      {/* ── Section: Domain Intelligence ──────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            Authority Sources
            {hasData && (
              <Badge variant="secondary" className="text-[10px] font-normal ml-1">
                {rowCount.toLocaleString()} citation rows
              </Badge>
            )}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Domains ranked by citation frequency — split between authority sources and competitor
            brands.
          </p>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {/* ── Empty state / Crawl trigger ────────────────────────────── */}
          {!hasData && (
            <div className={crawlMutation.isPending ? "" : "rounded-lg border border-dashed border-border/60 bg-secondary/10 px-6 py-8 text-center space-y-3"}>
              {crawlMutation.isPending ? (
                <MissionControlLoader
                  sessionId={sessionId}
                  crawlPending={true}
                  insightsPending={false}
                />
              ) : insightsLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary/60" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Loading…</p>
                    <p className="text-xs text-muted-foreground mt-1">Checking citation data…</p>
                  </div>
                </>
              ) : (
                <>
                  <Globe className="w-8 h-8 mx-auto text-muted-foreground/40" />
                  <div>
                    <p className="text-sm font-medium text-foreground">No citation data yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Run Analyse & Crawl to scrape citation URLs and classify them with AI.
                    </p>
                  </div>
                  {crawlError && (
                    <div className="flex items-center gap-2 text-xs text-destructive justify-center">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {crawlError}
                    </div>
                  )}
                  <Button
                    size="sm"
                    onClick={() => crawlMutation.mutate()}
                    disabled={crawlMutation.isPending || segments.length === 0}
                    data-testid="button-authority-run-crawl"
                    className="gap-2"
                  >
                    {crawlMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    {crawlMutation.isPending ? "Analysing…" : "Analyse & Crawl"}
                  </Button>
                </>
              )}
            </div>
          )}

          {/* ── Tabs: Authority Sources | Competitor Brands ────────────── */}
          {hasData && (
            <>
              <div className="flex gap-1 bg-secondary/30 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab("authority")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeTab === "authority"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid="tab-authority-sources"
                >
                  <Shield className="w-3 h-3" />
                  Authority Sources
                  {authoritySources.length > 0 && (
                    <span className="text-[10px] opacity-60">({authoritySources.length})</span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("brand")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeTab === "brand"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid="tab-competitor-brands"
                >
                  <Building2 className="w-3 h-3" />
                  Competitor Brands
                  {brandMentions.length > 0 && (
                    <span className="text-[10px] opacity-60">({brandMentions.length})</span>
                  )}
                </button>
              </div>

              {sourcesLoading && (
                <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading domain data…
                </div>
              )}

              {!sourcesLoading && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                  >
                    {activeTab === "authority" && (
                      <div className="rounded-lg border border-border/60 overflow-hidden">
                        {authoritySources.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-6">
                            No authority sources found yet.
                          </p>
                        ) : (
                          authoritySources.map((d, i) => (
                            <DomainRow
                              key={d.domain}
                              {...d}
                              rank={i + 1}
                              sessionId={sessionId}
                              maxAppearances={authorityMax}
                            />
                          ))
                        )}
                      </div>
                    )}

                    {activeTab === "brand" && (
                      <div className="rounded-lg border border-border/60 overflow-hidden">
                        {brandMentions.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-6">
                            No competitor brand domains found.
                          </p>
                        ) : (
                          brandMentions.map((d, i) => (
                            <DomainRow
                              key={d.domain}
                              {...d}
                              rank={i + 1}
                              sessionId={sessionId}
                              maxAppearances={brandMax}
                            />
                          ))
                        )}
                      </div>
                    )}

                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => crawlMutation.mutate()}
                        disabled={crawlMutation.isPending}
                        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                        data-testid="button-rerun-crawl"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Re-run Analyse & Crawl
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Section: Citation AI Insights ─────────────────────────────── */}
      {hasData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              Citation AI Insights
              <Badge
                variant="secondary"
                className="text-[10px] font-normal ml-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-0"
              >
                Claude Sonnet 4.5
              </Badge>
              {pastInsights.length > 0 && (
                <Badge variant="secondary" className="text-[10px] font-normal">
                  {pastInsights.length} run{pastInsights.length > 1 ? "s" : ""}
                </Badge>
              )}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sends the full {rowCount.toLocaleString()}-row citation dataset to Claude Sonnet 4.5
              to discover what top-cited brands are doing right — ranked factors with exact
              examples.
            </p>
          </CardHeader>

          <CardContent className="space-y-4 pt-0">
            {/* Mission Control during Claude analysis (auto-run chain) */}
            {insightsMutation.isPending && autoRun && !latestInsight && (
              <MissionControlLoader
                sessionId={sessionId}
                crawlPending={false}
                insightsPending={true}
              />
            )}

            {/* Generate / re-run button — shown when not auto-running */}
            {(!insightsMutation.isPending || !autoRun || latestInsight) && (
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={() => insightsMutation.mutate()}
                  disabled={insightsMutation.isPending}
                  data-testid="button-generate-insights"
                  className="gap-2"
                  variant={latestInsight ? "outline" : "default"}
                >
                  {insightsMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {insightsMutation.isPending
                    ? "Analysing with Claude…"
                    : latestInsight
                    ? "Re-run Analysis"
                    : "Generate Intelligence Report"}
                </Button>
                {insightsMutation.isPending && (
                  <p className="text-xs text-muted-foreground">
                    This may take 30–60 seconds…
                  </p>
                )}
                {insightsMutation.isError && (
                  <div className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Generation failed. Try again.
                  </div>
                )}
              </div>
            )}

            {/* Latest insight report */}
            {latestInsight && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={latestInsight.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="rounded-lg border border-orange-200 dark:border-orange-800/60 bg-orange-50/30 dark:bg-orange-950/10 overflow-hidden">
                    {/* Report header */}
                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-orange-200/60 dark:border-orange-800/40">
                      <Brain className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                      <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                        Intelligence Report
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {latestInsight.row_count?.toLocaleString() ?? rowCount.toLocaleString()} rows
                        {latestInsight.input_tokens && (
                          <>
                            {" · "}
                            {latestInsight.input_tokens.toLocaleString()} input /{" "}
                            {latestInsight.output_tokens?.toLocaleString() ?? "—"} output tokens
                          </>
                        )}
                      </span>
                    </div>

                    {/* Formatted report body */}
                    <div className="px-4 py-4">
                      {(() => {
                        try {
                          const parsed: StructuredReportData = JSON.parse(latestInsight.result_text);
                          if (parsed?.tactics) {
                            return <StructuredReport data={parsed} sessionId={sessionId} />;
                          }
                        } catch {
                          // not JSON — fall through to markdown
                        }
                        return <MarkdownReport text={latestInsight.result_text} />;
                      })()}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

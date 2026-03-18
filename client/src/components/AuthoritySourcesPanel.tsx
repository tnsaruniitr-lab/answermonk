import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
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

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_PROMPT_PREFIX = `You are an AI search visibility analyst reviewing citation data from a GEO (Generative Engine Optimization) study.

The CSV data below contains every URL cited by ChatGPT and Gemini when answering questions about this brand's market. Each row shows: which engine cited it, the page type (human-labelled as url_category and LLM-classified as llm_pagetype_classification), the domain, the brand, the URL, the page title, and how many times it was cited (citation_count).

TASK: Identify what the most-cited brands and pages are doing RIGHT — specific tactics, signals, and page patterns that correlate with high citation frequency.`;

const DEFAULT_OUTPUT_SCHEMA = `Return ONLY a valid JSON object with this EXACT structure (no markdown fences, no explanation before or after — just raw JSON):

{
  "summary": {
    "total_citations": <number — sum of all citation_count values>,
    "domains_analysed": <number — count of unique domains>,
    "cross_engine_brands": <number — brands appearing in BOTH ChatGPT AND Gemini>,
    "key_finding": "<single most important insight from this data — one sentence, specific>"
  },
  "page_type_distribution": {
    "winner": "<page type with most citations>",
    "winner_citations": <number>,
    "summary": "<2-3 sentence explanation of the distribution pattern>"
  },
  "cross_engine_champions": [
    { "brand": "<name>", "chatgpt": <citations in chatgpt>, "gemini": <citations in gemini>, "total": <combined total> }
  ],
  "tactics": [
    {
      "rank": <number starting at 1>,
      "title": "<specific actionable tactic name — not a generic principle>",
      "impact": "<HIGHEST|VERY HIGH|HIGH|MEDIUM|LOW>",
      "citations": <total citation count supporting this tactic>,
      "confidence": "<HIGH|MEDIUM|LOW>",
      "mechanism": "<paragraph explaining WHY this factor signals credibility or relevance to AI training — be specific>",
      "examples": [
        { "url": "<exact URL from the CSV>", "brand": "<brand name>", "count": <citation_count number> }
      ],
      "why_it_works": ["<specific signal 1>", "<specific signal 2>", "<specific signal 3>"]
    }
  ],
  "sources": [
    { "domain": "<domain>", "type": "<Government|Directory|Community|News|Review Platform|Brand|Aggregator|Other>", "importance": "<High|Medium|Low>", "appearances": <number> }
  ],
  "unusual_findings": [
    { "title": "<short title>", "finding": "<explanation of what is unusual and why it matters>" }
  ]
}

Rules for content:
- Base ALL rankings strictly on citation_count evidence from this CSV — no generic SEO advice
- For tactics: rank from most to least impactful. Identify ALL meaningful tactics (typically 8-12), not just the top 4
- For each tactic: provide 2-4 specific brand + URL examples directly from the CSV
- For sources: include all notable domains that shape AI knowledge in this market (8-15 entries)
- confidence: HIGH = 5+ brands show this pattern, MEDIUM = 3-4, LOW = 1-2
- Be specific: "brand X does Y on page Z" not "brands should do Y"
- For unusual_findings: include 3-5 genuinely surprising or counterintuitive patterns`;

const DEFAULT_PROMPT = DEFAULT_PROMPT_PREFIX;

const MODEL_OPTIONS = [
  { value: "claude-haiku-3-5", label: "Claude Haiku", desc: "Fast · low cost" },
  { value: "claude-sonnet-4-5", label: "Claude Sonnet", desc: "Best quality · default" },
  { value: "gpt-4o", label: "GPT-4o", desc: "OpenAI" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5", desc: "Google" },
] as const;

const CI_SETTINGS_KEY = "ci_last_settings_v1";
function loadCISettings() {
  try { const s = localStorage.getItem(CI_SETTINGS_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
}
function saveCISettings(s: { model: string; prompt: string; schema: string; webSearch: boolean }) {
  try { localStorage.setItem(CI_SETTINGS_KEY, JSON.stringify(s)); } catch {}
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

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

      {/* Third-party source bubbles — always visible */}
      {tactic.examples?.length > 0 && (
        <div className="px-4 pb-2 pt-1 flex flex-wrap gap-1.5">
          {tactic.examples.map((ex, i) => {
            const domain = ex.url.replace(/^https?:\/\//, "").split("/")[0];
            return (
              <span key={i} style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 12, background: "rgba(99,102,241,0.13)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.28)" }}>
                <strong style={{ color: "#c7d2fe" }}>{domain}</strong> · {ex.count}
              </span>
            );
          })}
        </div>
      )}

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
  const anyData = data as any;
  const insightsList: any[] = anyData.insights ?? [];
  const topTacticsList: any[] = anyData.top_tactics ?? anyData.top_5_tactics ?? [];
  const biggestOpp: string | undefined = anyData.biggest_opportunity_missed;
  const analysisMeta: any = anyData.analysis_metadata;
  const isInsightsFormat = insightsList.length > 0 && !data.tactics && !data.summary;
  const isTopTacticsFormat = topTacticsList.length > 0 && !data.tactics && !data.summary;

  return (
    <div className="space-y-5">
      {/* Header card — only shown when we have real summary stats */}
      {data.summary && (
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
      )}

      {/* GEO Insights — primary section for the insights format */}
      {isInsightsFormat && (
        <div>
          <div style={{ padding: "10px 16px", borderRadius: 10, background: "linear-gradient(90deg, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.04) 100%)", border: "1px solid rgba(99,102,241,0.22)", marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", lineHeight: 1.3 }}>What matters in this category?</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>Learnings from the top appearances · {insightsList.length} findings</div>
          </div>
          <div className="space-y-3">
            {insightsList.map((insight: any, i: number) => (
              <div key={i} style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 16px" }} className="space-y-2">
                <div className="flex items-start gap-2">
                  <span style={{ color: "#818cf8", fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>#{insight.rank ?? i + 1}</span>
                  <span style={{ color: "#f1f5f9", fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{insight.title}</span>
                  {insight.evidence && (
                    <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)", flexShrink: 0 }}>{insight.evidence}</span>
                  )}
                </div>
                {insight.what_they_do && (
                  <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
                    <span style={{ color: "#cbd5e1", fontWeight: 600 }}>What they do: </span>{insight.what_they_do}
                  </p>
                )}
                {insight.why_it_works && (
                  <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
                    <span style={{ color: "#cbd5e1", fontWeight: 600 }}>Why it works: </span>{insight.why_it_works}
                  </p>
                )}
                {insight.who_does_it_best && (
                  <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
                    <span style={{ color: "#cbd5e1", fontWeight: 600 }}>Who does it best: </span>{insight.who_does_it_best}
                  </p>
                )}
                {insight.opportunity && (
                  <p style={{ fontSize: 11, color: "#818cf8", lineHeight: 1.6, margin: 0, borderLeft: "2px solid rgba(129,140,248,0.4)", paddingLeft: 8, fontStyle: "italic" }}>{insight.opportunity}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Biggest Opportunity Missed */}
      {biggestOpp && (
        <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 12, padding: "12px 16px" }} className="flex gap-3 items-start">
          <span style={{ fontSize: 18, flexShrink: 0 }}>🎯</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24", marginBottom: 4 }}>Biggest Opportunity Missed</div>
            <p style={{ fontSize: 12, color: "#fde68a", lineHeight: 1.6, margin: 0 }}>{biggestOpp}</p>
          </div>
        </div>
      )}

      {/* top_tactics format (run 14+) */}
      {isTopTacticsFormat && (
        <div>
          {/* Brands analysed mini-header */}
          {analysisMeta?.brands_analyzed?.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {analysisMeta.brands_analyzed.map((b: any) => (
                <span key={b.name} style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "rgba(99,102,241,0.12)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.25)" }}>
                  {b.name} · {b.ai_query_appearances ?? b.total_ai_appearances} appearances
                </span>
              ))}
            </div>
          )}
          <div style={{ padding: "10px 16px", borderRadius: 10, background: "linear-gradient(90deg, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.04) 100%)", border: "1px solid rgba(99,102,241,0.22)", marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", lineHeight: 1.3 }}>What matters in this category?</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>Learnings from the top appearances · {topTacticsList.length} tactics</div>
          </div>
          <div className="space-y-3">
            {topTacticsList.map((t: any, i: number) => (
              <div key={i} style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 16px" }} className="space-y-2">
                <div className="flex items-start gap-2">
                  <span style={{ color: "#f97316", fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>#{t.rank ?? i + 1}</span>
                  <span style={{ color: "#f1f5f9", fontSize: 13, fontWeight: 600, lineHeight: 1.4, flex: 1 }}>{t.tactic_title ?? t.title}</span>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    {t.data_source && <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)" }}>{t.data_source}</span>}
                    {t.total_citations && <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: "rgba(16,185,129,0.12)", color: "#34d399", border: "1px solid rgba(16,185,129,0.25)" }}>{t.total_citations} citations</span>}
                  </div>
                </div>
                {t.why_it_works && (
                  <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
                    <span style={{ color: "#cbd5e1", fontWeight: 600 }}>Why it works: </span>{t.why_it_works}
                  </p>
                )}
                {t.brand_performance?.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                    {t.brand_performance.map((bp: any) => (
                      <div key={bp.brand} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 12px", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 8, padding: "3px 10px" }}>
                            <span style={{ color: "#c7d2fe", fontSize: 12, fontWeight: 700 }}>{bp.brand}</span>
                          </span>
                          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: bp.performance_rating === "Strong" ? "rgba(16,185,129,0.18)" : "rgba(251,191,36,0.14)", color: bp.performance_rating === "Strong" ? "#34d399" : "#fbbf24", fontWeight: 700, border: `1px solid ${bp.performance_rating === "Strong" ? "rgba(16,185,129,0.3)" : "rgba(251,191,36,0.25)"}` }}>{bp.performance_rating}</span>
                          {(bp.citation_count_for_tactic ?? bp.tactic_citations) && <span style={{ fontSize: 10, color: "#475569", marginLeft: "auto", fontWeight: 600 }}>{bp.citation_count_for_tactic ?? bp.tactic_citations} cit.</span>}
                        </div>
                        {(bp.details ?? bp.description) && <p style={{ fontSize: 11, color: "#64748b", lineHeight: 1.55, margin: 0 }}>{bp.details ?? bp.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {t.top_examples?.length > 0 && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8, marginTop: 4 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", letterSpacing: 1, marginBottom: 5, textTransform: "uppercase" }}>Third-party sources</div>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {t.top_examples.map((ex: any, j: number) => (
                        <span key={j} style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 12, background: "rgba(99,102,241,0.13)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.28)" }}>
                          <strong style={{ color: "#c7d2fe" }}>{ex.source ?? ex.url}</strong>{ex.citation_count ? ` · ${ex.citation_count}` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
          <div style={{ padding: "10px 16px", borderRadius: 10, background: "linear-gradient(90deg, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.04) 100%)", border: "1px solid rgba(99,102,241,0.22)", marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", lineHeight: 1.3 }}>What matters in this category?</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>Learnings from the top appearances · {data.tactics.length} tactics ranked by citation evidence</div>
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
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, '<code style="background:#f0f0ff;color:#6366f1;padding:1px 5px;border-radius:3px;font-size:11px">$1</code>');
}

// ── Format-A aware markdown renderer ─────────────────────────────────────────

interface MdSection { level: number; heading: string; body: string; }

function parseMdSections(text: string): { title: MdSection | null; sections: MdSection[] } {
  const lines = text.split("\n");
  const all: MdSection[] = [];
  let cur: { level: number; heading: string; body: string[] } | null = null;

  for (const line of lines) {
    const h3 = line.match(/^###\s+(.+)/);
    const h2 = line.match(/^##\s+(.+)/);
    const h1 = line.match(/^#\s+(.+)/);
    if (h1 || h2 || h3) {
      if (cur) all.push({ level: cur.level, heading: cur.heading, body: cur.body.join("\n").trim() });
      const level = h1 ? 1 : h2 ? 2 : 3;
      const heading = (h1?.[1] ?? h2?.[1] ?? h3?.[1] ?? "").trim();
      cur = { level, heading, body: [] };
    } else if (cur && line !== "---") {
      cur.body.push(line);
    }
  }
  if (cur) all.push({ level: cur.level, heading: cur.heading, body: cur.body.join("\n").trim() });

  const title = all.find(s => s.level === 1) ?? null;
  const sections = all.filter(s => s.level !== 1);
  return { title, sections };
}

function MdBodyBlocks({ body }: { body: string }) {
  const blocks = body.split(/\n\n+/).filter(b => b.trim());
  return (
    <div className="space-y-2">
      {blocks.map((block, j) => {
        const blockLines = block.trim().split("\n");
        const isList = blockLines.length > 1 && blockLines.every(
          l => l.match(/^[-*]\s/) || l.match(/^\d+\.\s/)
        );
        if (isList) return (
          <ul key={j} className="space-y-1">
            {blockLines.map((item, k) => {
              const content = item.replace(/^[-*]\s|^\d+\.\s/, "");
              return (
                <li key={k} className="flex gap-1.5 text-xs text-muted-foreground">
                  <span className="text-primary/60 shrink-0 mt-0.5">•</span>
                  <span dangerouslySetInnerHTML={{ __html: renderInline(content) }} />
                </li>
              );
            })}
          </ul>
        );
        return (
          <p key={j} className="text-xs text-muted-foreground leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderInline(block.trim()) }} />
        );
      })}
    </div>
  );
}

const MD_IMPACT_META: { color: string; bg: string; border: string; label: string }[] = [
  { color: "#ef4444", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)",   label: "HIGHEST"   },
  { color: "#f97316", bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.3)",  label: "VERY HIGH" },
  { color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.3)",  label: "HIGH"      },
  { color: "#8b5cf6", bg: "rgba(139,92,246,0.12)",  border: "rgba(139,92,246,0.3)",  label: "MEDIUM"    },
  { color: "#64748b", bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.3)", label: "LOW"       },
];

function CollapsibleMdCard({ section, rank }: { section: MdSection; rank: number }) {
  const [open, setOpen] = useState(false);
  const meta = MD_IMPACT_META[Math.min(rank - 1, MD_IMPACT_META.length - 1)];

  const titleMatch = section.heading.match(/^(\d+)\.\s*(.+)/);
  const rawTitle = (titleMatch ? titleMatch[2] : section.heading)
    .replace(/\*\*/g, "")
    .replace(/\|.*$/, "")
    .replace(/impact\s*rank.*/i, "")
    .trim();

  const cleanBody = section.body
    .replace(/^\s*impact\s*rank.*\n?/im, "")
    .replace(/^\s*confidence.*\n?/im, "")
    .trim();

  return (
    <div style={{ border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 12, overflow: "hidden", marginBottom: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", background: open ? "#0f172a" : "#111827",
          border: "none", padding: "12px 16px", textAlign: "left", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 12, transition: "background 0.15s",
        }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: meta.bg, border: `1px solid ${meta.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ color: meta.color, fontSize: 11, fontWeight: 700 }}>#{rank}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#f1f5f9", fontSize: 13, fontWeight: 600, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rawTitle}</div>
          <span style={{
            display: "inline-block", marginTop: 3,
            background: meta.bg, border: `1px solid ${meta.border}`,
            color: meta.color, fontSize: 9, fontWeight: 700,
            padding: "1px 6px", borderRadius: 4, letterSpacing: 0.5,
          }}>{meta.label}</span>
        </div>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} style={{ color: "#334155" }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div style={{ background: "#0a0f1e", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "14px 16px" }}>
              <MdBodyBlocks body={cleanBody} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MarkdownReport({ text }: { text: string }) {
  const { title, sections } = parseMdSections(text);

  const isSummary = (s: MdSection) => /executive summary|key finding|overview/i.test(s.heading);
  const isTacticsHeader = (s: MdSection) => /tactic|doing differently|high.impact|what.*brand/i.test(s.heading);
  const isSource = (s: MdSection) => /source|shaping|recommendation/i.test(s.heading);
  const isTacticItem = (s: MdSection) => s.level === 3 || /^\d+\./.test(s.heading);

  const summarySection = sections.find(isSummary);
  const tacticsHeader = sections.find(isTacticsHeader);
  const tacticItems = sections.filter(isTacticItem);
  const sourceSection = sections.find(isSource);
  const otherSections = sections.filter(s =>
    s !== summarySection && s !== tacticsHeader && !isTacticItem(s) && s !== sourceSection
  );

  return (
    <div className="space-y-5">
      {/* Dark navy header */}
      <div className="rounded-xl overflow-hidden border border-border/40" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)" }}>
        <div className="px-5 py-4">
          <div className="text-[10px] text-slate-400 tracking-widest mb-1 uppercase">Citation Intelligence Report</div>
          <div className="text-white text-lg font-bold leading-tight">{title?.heading ?? "GEO Citation Analysis"}</div>
          {title?.body && (
            <p className="text-slate-400 text-xs mt-2 leading-relaxed line-clamp-2">{title.body.replace(/\*\*/g, "")}</p>
          )}
        </div>
      </div>

      {/* Executive summary → amber key finding */}
      {summarySection && (
        <div className="flex gap-3 items-start rounded-xl px-4 py-3" style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)" }}>
          <span className="text-lg shrink-0">⚡</span>
          <div>
            <div className="mb-1" style={{ color: "#fbbf24", fontSize: 11, fontWeight: 700 }}>Key Finding</div>
            <div style={{ color: "#fde68a", fontSize: 12, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: renderInline(summarySection.body.split("\n\n")[0] ?? summarySection.body) }} />
          </div>
        </div>
      )}

      {/* What top brands do differently */}
      {(tacticItems.length > 0) && (
        <div>
          <div style={{ padding: "10px 16px", borderRadius: 10, background: "linear-gradient(90deg, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.04) 100%)", border: "1px solid rgba(99,102,241,0.22)", marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", lineHeight: 1.3 }}>What matters in this category?</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>Learnings from the top appearances · {tacticItems.length} tactics</div>
          </div>
          {tacticItems.map((s, i) => (
            <CollapsibleMdCard key={i} section={s} rank={i + 1} />
          ))}
        </div>
      )}

      {/* Sources */}
      {sourceSection && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(180deg, #10b981, #3b82f6)" }} />
            <span className="text-sm font-bold text-foreground">{sourceSection.heading}</span>
          </div>
          <div className="rounded-xl border border-border/50 bg-background p-4">
            <MdBodyBlocks body={sourceSection.body} />
          </div>
        </div>
      )}

      {/* Remaining sections */}
      {otherSections.map((s, i) => (
        <div key={i}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(180deg, #8b5cf6, #6366f1)" }} />
            <span className="text-sm font-bold text-foreground">{s.heading}</span>
          </div>
          <div className="rounded-xl border border-border/50 bg-secondary/10 px-4 py-3">
            <MdBodyBlocks body={s.body} />
          </div>
        </div>
      ))}
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

  const _saved = loadCISettings();
  const [selectedModel, setSelectedModel] = useState<string>(_saved?.model ?? "claude-sonnet-4-5");
  const [customPrompt, setCustomPrompt] = useState<string>(_saved?.prompt ?? DEFAULT_PROMPT_PREFIX);
  const [customOutputSchema, setCustomOutputSchema] = useState<string>(_saved?.schema ?? DEFAULT_OUTPUT_SCHEMA);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [showOutputEditor, setShowOutputEditor] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState<boolean>(_saved?.webSearch ?? false);
  const [selectedInsightId, setSelectedInsightId] = useState<number | null>(null);

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
  const displayedInsight = selectedInsightId
    ? (pastInsights.find(i => i.id === selectedInsightId) ?? latestInsight)
    : latestInsight;
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

  // Auto-run insights mutation (hardcoded claude-sonnet-4-5, used by the auto-run chain)
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

  // Manual insights mutation (uses selectedModel + customPrompt from UI state)
  const manualInsightsMutation = useMutation({
    mutationFn: async () => {
      saveCISettings({ model: selectedModel, prompt: customPrompt, schema: customOutputSchema, webSearch: webSearchEnabled });
      const res = await apiRequest(
        "POST",
        `/api/multi-segment-sessions/${sessionId}/citation-insights`,
        { model: selectedModel, promptOverride: customPrompt, outputSchemaOverride: customOutputSchema, webSearch: webSearchEnabled }
      );
      return res.json();
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries({
        queryKey: ["/api/multi-segment-sessions", sessionId, "citation-insights"],
      });
      if (data?.id) setSelectedInsightId(data.id);
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

      {/* ── No data yet: loading / empty / crawl trigger ──────────────── */}
      {!hasData && (
        <>
          {crawlMutation.isPending ? (
            <MissionControlLoader sessionId={sessionId} crawlPending={true} insightsPending={false} />
          ) : insightsLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking citation data…
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/60 bg-secondary/10 px-6 py-10 text-center space-y-3">
              <Globe className="w-8 h-8 mx-auto text-muted-foreground/40" />
              <div>
                <p className="text-sm font-medium text-foreground">No citation data yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Analyse &amp; Crawl will scrape citation URLs and classify them with AI.
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
                <RefreshCw className="w-3.5 h-3.5" />
                Analyse &amp; Crawl
              </Button>
            </div>
          )}
        </>
      )}

      {/* ── Data exists ───────────────────────────────────────────────── */}
      {hasData && (
        <>
          {/* Claude loading state (auto-run chain, before first result) */}
          {insightsMutation.isPending && autoRun && !latestInsight && (
            <MissionControlLoader sessionId={sessionId} crawlPending={false} insightsPending={true} />
          )}

          {/* Generate button — when no insight exists yet */}
          {!latestInsight && (!insightsMutation.isPending || !autoRun) && (
            <div className="rounded-xl border border-dashed border-border/60 bg-secondary/10 px-5 py-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Citation Intelligence Report</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Send {rowCount.toLocaleString()} citation rows to an AI model to extract ranked GEO tactics and source patterns.
                </p>
                {(insightsMutation.isError || manualInsightsMutation.isError) && (
                  <div className="flex items-center gap-1.5 text-xs text-destructive mt-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Generation failed — try again.
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {MODEL_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedModel(opt.value)}
                    title={opt.desc}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-all ${
                      selectedModel === opt.value
                        ? "bg-foreground text-background border-foreground"
                        : "bg-transparent text-muted-foreground border-border/50 hover:border-foreground/40 hover:text-foreground"
                    }`}
                    data-testid={`model-select-init-${opt.value}`}
                  >
                    {opt.label}
                  </button>
                ))}
                <Button
                  size="sm"
                  onClick={() => manualInsightsMutation.mutate()}
                  disabled={insightsMutation.isPending || manualInsightsMutation.isPending}
                  data-testid="button-generate-insights"
                  className="gap-2 ml-auto"
                >
                  {(insightsMutation.isPending || manualInsightsMutation.isPending)
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Sparkles className="w-3.5 h-3.5" />}
                  {(insightsMutation.isPending || manualInsightsMutation.isPending) ? "Analysing…" : "Generate Intelligence Report"}
                </Button>
              </div>
            </div>
          )}

          {/* ── Format A: Intelligence Report — rendered directly ─────── */}
          {displayedInsight && (
            <>
              {/* Controls panel */}
              <div className="rounded-xl border border-border/50 bg-secondary/10 px-4 py-3 space-y-3 mb-3">
                {/* Row 1: metadata + model selector + run button */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {displayedInsight.row_count?.toLocaleString() ?? rowCount.toLocaleString()} rows
                    {displayedInsight.input_tokens && (
                      <> · {displayedInsight.input_tokens.toLocaleString()} / {displayedInsight.output_tokens?.toLocaleString() ?? "—"} tk</>
                    )}
                  </span>
                  <div className="flex items-center gap-1 flex-wrap ml-auto">
                    {MODEL_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setSelectedModel(opt.value)}
                        title={opt.desc}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-all ${
                          selectedModel === opt.value
                            ? "bg-foreground text-background border-foreground"
                            : "bg-transparent text-muted-foreground border-border/50 hover:border-foreground/40 hover:text-foreground"
                        }`}
                        data-testid={`model-select-${opt.value}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                    <button
                      onClick={() => manualInsightsMutation.mutate()}
                      disabled={manualInsightsMutation.isPending || insightsMutation.isPending}
                      className="flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 ml-1"
                      data-testid="button-rerun-insights"
                    >
                      {manualInsightsMutation.isPending
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <RefreshCw className="w-3 h-3" />}
                      {manualInsightsMutation.isPending ? "Analysing…" : "Re-run"}
                    </button>
                  </div>
                </div>

                {/* Row 2: prompt editor + output schema editor + web search toggle */}
                <div className="space-y-2">
                  {/* Web search toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setWebSearchEnabled(v => !v)}
                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium border transition-all ${
                        webSearchEnabled
                          ? "bg-blue-500/15 text-blue-400 border-blue-500/40"
                          : "bg-transparent text-muted-foreground border-border/50 hover:border-foreground/40 hover:text-foreground"
                      }`}
                      data-testid="button-toggle-web-search"
                      title={selectedModel.startsWith("claude") ? "Enable Anthropic web search tool" : "Web search only available for Claude models"}
                    >
                      <Globe className="w-3 h-3" />
                      Web Search
                      {webSearchEnabled && !selectedModel.startsWith("claude") && (
                        <span className="text-orange-400 ml-0.5">· Claude only</span>
                      )}
                    </button>
                    <span className="text-[10px] text-muted-foreground/50">Claude uses live search; other models use training data</span>
                  </div>

                  {/* Prompt editor toggle */}
                  <div>
                    <button
                      onClick={() => setShowPromptEditor(v => !v)}
                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="button-toggle-prompt-editor"
                    >
                      {showPromptEditor ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      Edit prompt instructions
                    </button>
                    {showPromptEditor && (
                      <div className="mt-2 space-y-1.5">
                        <textarea
                          value={customPrompt}
                          onChange={e => setCustomPrompt(e.target.value)}
                          className="w-full h-44 text-[10px] font-mono leading-relaxed bg-background border border-border/60 rounded-lg px-3 py-2 text-foreground resize-y outline-none focus:border-primary/50"
                          data-testid="textarea-custom-prompt"
                          spellCheck={false}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCustomPrompt(DEFAULT_PROMPT_PREFIX)}
                            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                          >
                            Reset to default
                          </button>
                          <span className="text-[10px] text-muted-foreground/40">· [BRAND A/B/C] are auto-filled · output schema + CSV appended automatically</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Output schema editor toggle */}
                  <div>
                    <button
                      onClick={() => setShowOutputEditor(v => !v)}
                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="button-toggle-output-editor"
                    >
                      {showOutputEditor ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      Edit output structure
                    </button>
                    {showOutputEditor && (
                      <div className="mt-2 space-y-1.5">
                        <textarea
                          value={customOutputSchema}
                          onChange={e => setCustomOutputSchema(e.target.value)}
                          className="w-full h-64 text-[10px] font-mono leading-relaxed bg-background border border-border/60 rounded-lg px-3 py-2 text-foreground resize-y outline-none focus:border-primary/50"
                          data-testid="textarea-output-schema"
                          spellCheck={false}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCustomOutputSchema(DEFAULT_OUTPUT_SCHEMA)}
                            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                          >
                            Reset to default
                          </button>
                          <span className="text-[10px] text-muted-foreground/40">· Defines the JSON structure returned by the AI</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 3: history (only when multiple runs exist) */}
                {pastInsights.length > 1 && (
                  <div className="border-t border-border/30 pt-2.5 space-y-1">
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                      Run History ({pastInsights.length})
                    </span>
                    <div className="space-y-0.5 mt-1">
                      {pastInsights.map(run => {
                        const isSelected = (selectedInsightId ?? latestInsight?.id) === run.id;
                        const modelLabel = MODEL_OPTIONS.find(m => m.value === run.model)?.label ?? run.model;
                        return (
                          <button
                            key={run.id}
                            onClick={() => setSelectedInsightId(run.id)}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                              isSelected ? "bg-primary/10 text-foreground" : "hover:bg-secondary/30 text-muted-foreground"
                            }`}
                            data-testid={`history-run-${run.id}`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? "bg-primary" : "bg-border"}`} />
                            <span className="text-[10px] font-medium flex-1 truncate">{modelLabel}</span>
                            <span className="text-[10px] opacity-60">{formatTimeAgo(run.created_at)}</span>
                            {run.input_tokens && (
                              <span className="text-[10px] opacity-50">
                                {run.input_tokens.toLocaleString()} / {run.output_tokens?.toLocaleString() ?? "—"} tk
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Report body */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={displayedInsight.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {(() => {
                    try {
                      const raw = displayedInsight.result_text.trim()
                        .replace(/^```json\n?/i, "").replace(/^```\n?/i, "").replace(/\n?```\s*$/, "");
                      const parsed: StructuredReportData = JSON.parse(raw);
                      if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && Object.keys(parsed).length > 0) return <StructuredReport data={parsed} sessionId={sessionId} />;
                    } catch { /* fall through */ }
                    return <MarkdownReport text={displayedInsight.result_text} />;
                  })()}
                </motion.div>
              </AnimatePresence>
            </>
          )}

          {/* ── Domain Intelligence Tabs (secondary, below report) ───── */}
          <div className="rounded-xl border border-border/50 overflow-hidden">
            {/* Tab bar */}
            <div className="flex gap-1 bg-secondary/20 p-1 border-b border-border/40">
              <button
                onClick={() => setActiveTab("authority")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
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
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
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

            {/* Domain list */}
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
                    authoritySources.length === 0
                      ? <p className="text-xs text-muted-foreground text-center py-6">No authority sources found yet.</p>
                      : authoritySources.map((d, i) => (
                          <DomainRow key={d.domain} {...d} rank={i + 1} sessionId={sessionId} maxAppearances={authorityMax} />
                        ))
                  )}
                  {activeTab === "brand" && (
                    brandMentions.length === 0
                      ? <p className="text-xs text-muted-foreground text-center py-6">No competitor brand domains found.</p>
                      : brandMentions.map((d, i) => (
                          <DomainRow key={d.domain} {...d} rank={i + 1} sessionId={sessionId} maxAppearances={brandMax} />
                        ))
                  )}
                </motion.div>
              </AnimatePresence>
            )}

            {/* Footer: row count + re-run */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-border/30 bg-secondary/5">
              <span className="text-[10px] text-muted-foreground">
                {rowCount.toLocaleString()} citation rows indexed
              </span>
              <button
                onClick={() => crawlMutation.mutate()}
                disabled={crawlMutation.isPending}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                data-testid="button-rerun-crawl"
              >
                <RefreshCw className="w-3 h-3" />
                Re-run Crawl
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

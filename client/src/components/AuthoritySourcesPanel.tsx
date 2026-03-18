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

const DEFAULT_PROMPT_PREFIX = `INSTRUCTION
You are a GEO (Generative Engine Optimization) analyst. The CSV below contains every URL cited by ChatGPT and Gemini in a specific market with these columns: engine, url_category, llm_pagetype_classification, domain, brand, URL, page title, citation_count, mentioned_brands, brand_context.

Column definitions:

brand — the publishing domain of the page, not the target brand name. Never use this column for brand attribution
mentioned_brands — brands already confirmed present on this page via pre-scan. Use this as your primary source for brand attribution before attempting web search
brand_context — verbatim text already extracted from the page around each brand mention. Use this as your primary source for how_they_appear before visiting the page yourself

The three brands to analyse are: [BRAND A], [BRAND B], [BRAND C]

Brand identification rules — follow this priority order for every URL:

Check mentioned_brands column first — if it confirms a brand is present, the attribution is done
For brand-owned pages also match brand name in URL or domain as secondary confirmation
Only use web search where mentioned_brands is empty or inconclusive
If none of the above confirms attribution write UNATTRIBUTED — never guess from memory

How they appear rules — follow this priority order for every brand entry:

Read brand_context column first — use verbatim text already extracted
Only use web search where brand_context is empty or too short to be useful
If neither confirms language write UNATTRIBUTED

Before writing any output complete these three steps silently:

Step 1 — Read the entire CSV. For each URL check mentioned_brands to confirm which of the three target brands appear. Group URLs by brand and by tactic category. Extract citation counts per brand per category broken down by engine.

Step 2 — For each confirmed brand-URL pair read brand_context and extract verbatim language describing that brand. Note this for the how_they_appear field. Use web search only to fill gaps where brand_context is empty.

Step 3 — Only after completing Steps 1 and 2 write the JSON output. If a field cannot be filled from CSV data or web search write NOT FOUND. Never estimate or fill from memory.`;

const DEFAULT_OUTPUT_SCHEMA = `OUTPUT
Return ONLY a valid raw JSON object. No markdown fences. No text before or after. Just the JSON.

{
  "summary": {
    "total_citations": 0,
    "domains_analysed": 0,
    "cross_engine_brands": 0,
    "key_finding": "single most important insight grounded in citation data — one specific sentence"
  },

  "tactics": [
    {
      "rank": 1,
      "title": "Action verb phrase describing what winning brands DO — e.g. Dominate MENA VC comparison listicles — never a category label like Comparison Articles",
      "impact": "HIGHEST | VERY HIGH | HIGH | MEDIUM | LOW",
      "citations": 0,
      "confidence": "HIGH | MEDIUM | LOW",
      "mechanism": "one sentence on why AI engines respond to this specific signal",
      "examples": [
        { "url": "exact URL from CSV", "brand": "publishing domain", "count": 0, "description": "one sentence on what this page contains and why it earns citations" },
        { "url": "exact URL from CSV", "brand": "publishing domain", "count": 0, "description": "one sentence" },
        { "url": "exact URL from CSV", "brand": "publishing domain", "count": 0, "description": "one sentence" },
        { "url": "exact URL from CSV", "brand": "publishing domain", "count": 0, "description": "one sentence" },
        { "url": "exact URL from CSV", "brand": "publishing domain", "count": 0, "description": "one sentence" }
      ],
      "why_it_works": [
        "specific signal 1",
        "specific signal 2",
        "specific signal 3"
      ],
      "brand_performance": [
        {
          "brand": "BRAND A name",
          "citation_count": 0,
          "performance_rating": "Strong | Partial | Weak",
          "what_they_do": "one sentence on how this brand specifically executes this tactic with a URL or page type reference",
          "how_they_appear": "verbatim language from brand_context column or web search — copy exact words including any data points such as ticket size, deal count, fund size, ranking position. Write UNATTRIBUTED if neither brand_context nor web search confirms presence. Write NOT FOUND and explain gap if brand has zero citations for this tactic.",
          "evidence_urls": [
            { "url": "exact URL from CSV", "count": 0 },
            { "url": "exact URL from CSV", "count": 0 },
            { "url": "exact URL from CSV", "count": 0 }
          ]
        },
        {
          "brand": "BRAND B name",
          "citation_count": 0,
          "performance_rating": "Strong | Partial | Weak",
          "what_they_do": "one sentence",
          "how_they_appear": "verbatim language from brand_context or web search",
          "evidence_urls": [
            { "url": "exact URL from CSV", "count": 0 },
            { "url": "exact URL from CSV", "count": 0 },
            { "url": "exact URL from CSV", "count": 0 }
          ]
        },
        {
          "brand": "BRAND C name",
          "citation_count": 0,
          "performance_rating": "Strong | Partial | Weak",
          "what_they_do": "one sentence",
          "how_they_appear": "verbatim language from brand_context or web search",
          "evidence_urls": [
            { "url": "exact URL from CSV", "count": 0 },
            { "url": "exact URL from CSV", "count": 0 },
            { "url": "exact URL from CSV", "count": 0 }
          ]
        }
      ]
    }
  ],

  "sources": [
    {
      "domain": "domain",
      "type": "Government | Directory | Community | News | Review Platform | Brand | Aggregator | Other",
      "importance": "High | Medium | Low",
      "appearances": 0
    }
  ],

  "unusual_findings": [
    {
      "title": "short title",
      "finding": "explanation of what is unusual and why it matters for these three brands"
    }
  ],

  "actions": [
    {
      "brand": "BRAND A name",
      "weakest_tactic": "tactic title where this brand scored lowest",
      "weakest_tactic_citations": 0,
      "strongest_brand_on_tactic": "brand name that scored highest on same tactic",
      "strongest_brand_citations": 0,
      "action": "one specific action that replicates what the stronger brand does — name the tactic, the citation gap, and the exact step"
    },
    {
      "brand": "BRAND B name",
      "weakest_tactic": "tactic title",
      "weakest_tactic_citations": 0,
      "strongest_brand_on_tactic": "brand name",
      "strongest_brand_citations": 0,
      "action": "one specific action"
    },
    {
      "brand": "BRAND C name",
      "weakest_tactic": "tactic title",
      "weakest_tactic_citations": 0,
      "strongest_brand_on_tactic": "brand name",
      "strongest_brand_citations": 0,
      "action": "one specific action"
    }
  ],

  "quick_win": "one sentence naming a specific URL or platform from the CSV with its exact citation count and the single most actionable step any brand can take this week"
}

OUTPUT RULES

- tactics must contain exactly 5 entries ranked by total citation count highest to lowest
- examples inside each tactic must contain minimum 5 real URLs from the CSV with real counts — no invented URLs
- brand_performance inside each tactic must contain all three brands — if a brand has zero citations for that tactic explain the gap in what_they_do and write NOT FOUND in how_they_appear
- how_they_appear priority: brand_context column first, web search second, UNATTRIBUTED if neither confirms presence
- title must be an action verb phrase — never a category label. Write what brands DO not what the content type is
- performance_rating: Strong = multiple cited URLs with specific brand attribution and data points, Partial = present but surface level, Weak = minimal citations or no direct brand attribution
- actions must contain exactly one entry per brand — this field is mandatory, do not end output without it
- quick_win must reference a real domain and real citation count from the CSV
- If web search finds language contradicting brand_context write CONFLICT at the start of how_they_appear and show both versions
- sources should include 8 to 15 domains that shape AI knowledge in this market

EXAMPLE — match this precision for every brand_performance entry

{
  "brand": "Shorooq Partners",
  "citation_count": 51,
  "performance_rating": "Strong",
  "what_they_do": "Appear consistently across top-tier MENA VC listicles in both UAE-specific and pan-regional rankings, capturing two geographic audiences simultaneously.",
  "how_they_appear": "Described verbatim as 'one of the most active venture capital firms across the Middle East and North Africa, backed by the world's leading sovereign wealth funds' — this exact phrase is echoed across comparison sites creating citation loops where brand language transfers from their own site to aggregators to AI citations.",
  "evidence_urls": [
    { "url": "https://www.sadu.vc/top-10-venture-capital-firms-in-mena-2026", "count": 33 },
    { "url": "https://www.basetemplates.com/investors/top-9-vc-investors-in-the-united-arab-emirates", "count": 10 },
    { "url": "https://www.forbesmiddleeast.com/lists/the-middle-easts-top-venture-capitalists-2024", "count": 4 }
  ]
}

[PASTE CSV BELOW THIS LINE]`;

const DEFAULT_PROMPT = DEFAULT_PROMPT_PREFIX;

// ── Factor Mode (parallel simpler schema) ─────────────────────────────────────

const FACTOR_PROMPT_PREFIX = `You are a GEO (Generative Engine Optimization) analyst. You have two sources of information: a CSV file showing every URL cited by AI engines in this market, and web search which you must use actively.

The market is: [CATEGORY]
The three brands to evaluate are: [BRAND A], [BRAND B], [BRAND C]

Do these four things in order before writing any output:

Step 1 — Read the CSV. Identify which domains, page types, and content formats are getting cited most. Note the top 10 most-cited URLs and their citation counts.

Step 2 — Use web search to research what factors drive AI citation visibility in this specific market category. Search for how brands in this space earn mentions in ChatGPT and Gemini responses.

Step 3 — Visit the top cited domains from the CSV using web search. Note what type of content they publish and why AI engines would cite them.

Step 4 — Research each of the three brands using web search. Find what they publish, where they appear, and how they are described across the web.

Then write the output below.`;

const FACTOR_OUTPUT_SCHEMA = `OUTPUT
Return ONLY a valid raw JSON object. No markdown fences. No text before or after. Just the JSON.

{
  "market": "category name",
  "total_citations_analysed": 0,
  "top_cited_domains": [
    { "domain": "exact domain from CSV", "citations": 0, "why_cited": "one sentence" },
    { "domain": "exact domain from CSV", "citations": 0, "why_cited": "one sentence" },
    { "domain": "exact domain from CSV", "citations": 0, "why_cited": "one sentence" },
    { "domain": "exact domain from CSV", "citations": 0, "why_cited": "one sentence" },
    { "domain": "exact domain from CSV", "citations": 0, "why_cited": "one sentence" }
  ],
  "factors": [
    {
      "rank": 1,
      "factor": "short name for this factor",
      "why_it_matters": "one sentence on why this specific factor drives AI citations in this market",
      "total_citations_supporting": 0,
      "brands": [
        {
          "brand": "BRAND A name",
          "rating": "Strong | Partial | Weak | Missing",
          "what_they_do": "one sentence on what this brand does well or badly on this factor",
          "example": "one specific URL or source with citation count if from CSV"
        },
        {
          "brand": "BRAND B name",
          "rating": "Strong | Partial | Weak | Missing",
          "what_they_do": "one sentence",
          "example": "one specific URL or source with citation count if from CSV"
        },
        {
          "brand": "BRAND C name",
          "rating": "Strong | Partial | Weak | Missing",
          "what_they_do": "one sentence",
          "example": "one specific URL or source with citation count if from CSV"
        }
      ]
    }
  ],
  "biggest_gap": {
    "brand": "brand with most to gain",
    "gap": "what they are missing compared to the strongest brand",
    "action": "single most impactful action they should take first"
  },
  "quick_win": "one action any brand can take this week grounded in the citation data with a specific domain or URL from the CSV"
}

OUTPUT RULES
- factors must contain exactly 5 entries ranked by how strongly the citation data supports each one
- total_citations_supporting must be a real number from the CSV — count the URLs in that factor category
- rating meanings: Strong = actively doing this with clear evidence, Partial = doing it inconsistently, Weak = minimal effort, Missing = not doing this at all
- example must be a specific URL or named source with citation count — never a vague reference
- top_cited_domains must use real domains and real citation counts from the CSV
- biggest_gap and quick_win are mandatory — do not end the output without them`;

const MODEL_OPTIONS = [
  { value: "claude-haiku-3-5", label: "Claude Haiku", desc: "Fast · low cost" },
  { value: "claude-sonnet-4-5", label: "Claude Sonnet", desc: "Best quality · default" },
  { value: "gpt-4o", label: "GPT-4o", desc: "OpenAI" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5", desc: "Google" },
] as const;

const CI_SETTINGS_KEY = "ci_last_settings_v4";
function loadCISettings() {
  try { const s = localStorage.getItem(CI_SETTINGS_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
}
function saveCISettings(s: { model: string; prompt: string; schema: string; webSearch: boolean; schemaMode?: string }) {
  try { localStorage.setItem(CI_SETTINGS_KEY, JSON.stringify(s)); } catch {}
}

// Score a run by completeness: award points for real how_they_appear text and non-empty what_they_do
function scoreInsightRun(run: InsightRun): number {
  try {
    const raw = run.result_text.trim()
      .replace(/^```json\n?/i, "").replace(/^```\n?/i, "").replace(/\n?```\s*$/, "");
    const parsed = JSON.parse(raw);
    if (!parsed?.tactics) return 0;
    let score = 0;
    const PLACEHOLDERS = ["unattributed", "unverified", "not found", "web search not available", "web verification incomplete"];
    for (const tactic of parsed.tactics) {
      const bp = tactic.brand_performance ?? tactic.brands ?? tactic.brand_results ?? [];
      for (const brand of bp) {
        const appear: string = (brand.how_they_appear ?? "").toLowerCase();
        const doStr: string = (brand.what_they_do ?? brand.details ?? "").toLowerCase();
        const isPlaceholder = PLACEHOLDERS.some(p => appear.includes(p));
        if (appear.length > 40 && !isPlaceholder) score += 3;
        if (doStr.length > 20) score += 1;
      }
      // Bonus for having actions
      if (tactic.actions) score += 2;
    }
    return score;
  } catch { return 0; }
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

const RANK_ACCENT: Record<number, { border: string; badge: string; badgeBg: string; badgeText: string }> = {
  1: { border: "#f59e0b", badge: "rgba(245,158,11,0.18)", badgeBg: "rgba(245,158,11,0.15)", badgeText: "#fbbf24" },
  2: { border: "#6366f1", badge: "rgba(99,102,241,0.18)", badgeBg: "rgba(99,102,241,0.15)", badgeText: "#818cf8" },
  3: { border: "#0d9488", badge: "rgba(13,148,136,0.18)", badgeBg: "rgba(13,148,136,0.15)", badgeText: "#2dd4bf" },
};
const DEFAULT_RANK_ACCENT = { border: "#475569", badge: "rgba(71,85,105,0.18)", badgeBg: "rgba(71,85,105,0.15)", badgeText: "#94a3b8" };

function TacticCard({ tactic }: { tactic: Tactic }) {
  const [open, setOpen] = useState(false);
  const anyT = tactic as any;

  // Normalise field names — Claude varies them across runs
  const rank = tactic.rank ?? anyT.tactic_number ?? anyT.number ?? 1;
  const title = tactic.title ?? anyT.tactic_name ?? anyT.tactic_title ?? "Tactic";
  const citations = tactic.citations ?? anyT.total_citations ?? anyT.citation_count ?? 0;
  const mechanism = tactic.mechanism ?? anyT.why_it_works_summary ?? "";
  const whyItWorks: string[] = Array.isArray(tactic.why_it_works)
    ? tactic.why_it_works
    : tactic.why_it_works
      ? [tactic.why_it_works as unknown as string]
      : [];
  const rawExamples: { url: string; count?: number; citation_count?: number; description?: string }[] =
    tactic.examples ?? anyT.top_sources ?? anyT.sources ?? [];
  const examples = rawExamples.map((ex: any) => ({
    url: ex.url ?? "",
    count: ex.count ?? ex.citation_count ?? 0,
    description: ex.description ?? "",
  }));
  const brandPerf: any[] = anyT.brand_performance ?? anyT.brands ?? anyT.brand_results ?? [];

  const accent = RANK_ACCENT[rank] ?? DEFAULT_RANK_ACCENT;

  return (
    <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid rgba(255,255,255,0.08)`, background: "#0b1120", borderLeft: `3px solid ${accent.border}` }}>
      {/* Header — always visible, clickable to collapse */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", textAlign: "left", background: "transparent", border: "none", cursor: "pointer" }}
      >
        <div style={{ width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, background: accent.badgeBg, color: accent.badgeText, border: `1px solid ${accent.border}40`, flexShrink: 0 }}>
          #{rank}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.3, marginBottom: 4 }}>{title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: accent.badgeText }}>{citations.toLocaleString()}</span>
            <span style={{ fontSize: 11, color: "#64748b" }}>citations</span>
            {tactic.impact && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: accent.badgeBg, color: accent.badgeText, border: `1px solid ${accent.border}40` }}>{tactic.impact}</span>}
            {tactic.confidence && <span style={{ fontSize: 10, color: "#475569" }}>· {tactic.confidence} confidence</span>}
          </div>
        </div>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: open ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.06)", border: `1px solid ${open ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.1)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
          <ChevronDown style={{ width: 18, height: 18, color: open ? "#818cf8" : "#94a3b8", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s, color 0.2s" }} />
        </div>
      </button>

      {/* Source domain pills — always visible below header */}
      {examples.length > 0 && (
        <div style={{ padding: "0 16px 12px", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {examples.map((ex, i) => {
            const domain = ex.url.replace(/^https?:\/\//, "").split("/")[0];
            return (
              <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)" }}>
                <strong style={{ color: "#e2e8f0" }}>{domain}</strong>
                <span style={{ color: "#475569", margin: "0 3px" }}>·</span>
                <span style={{ color: accent.badgeText, fontWeight: 700 }}>{ex.count}</span>
              </span>
            );
          })}
        </div>
      )}

      {/* Expandable body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "16px 16px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "#080e1c" }}>

              {/* Mechanism text */}
              {(mechanism || whyItWorks.length > 0) && (
                <div style={{ marginBottom: 18 }}>
                  {mechanism && <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.65, margin: "0 0 8px" }}>{mechanism}</p>}
                  {whyItWorks.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {whyItWorks.map((w, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <span style={{ fontSize: 12, color: accent.badgeText, flexShrink: 0, marginTop: 2 }}>✓</span>
                          <span style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Source pages with descriptions */}
              {examples.some(e => e.description) && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>What these sources look like</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {examples.filter(e => e.description).map((ex, i) => (
                      <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "8px 12px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{ color: accent.badgeText, fontWeight: 700, fontSize: 12, flexShrink: 0, minWidth: 28 }}>{ex.count}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <a href={ex.url.startsWith("http") ? ex.url : `https://${ex.url}`} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 11, color: "#818cf8", fontFamily: "monospace", display: "block", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {ex.url}
                          </a>
                          {ex.description && <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.5 }}>{ex.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Brand performance — the main section */}
              {brandPerf.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>Brand performance on this tactic</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {brandPerf.map((bp: any, bpIdx: number) => {
                      const bName = bp.brand ?? bp.brand_name ?? bp.name ?? "";
                      const rawCount = bp.citation_count ?? bp.tactic_citations ?? bp.citations ?? bp.appearances ?? 0;
                      const bCount = typeof rawCount === "number" ? rawCount : (parseInt(String(rawCount)) || 0);
                      const bRating = bp.performance_rating ?? bp.strength ?? bp.rating ?? "";
                      const bDo = bp.what_they_do ?? bp.details ?? bp.description ?? "";
                      const bAppear = bp.how_they_appear ?? "";
                      const rawEvidence: any[] = bp.evidence_urls ?? bp.evidence ?? [];
                      const bEvidence = rawEvidence.map((ev: any) => {
                        if (typeof ev === "string") {
                          const match = ev.match(/^(https?:\/\/[^\s]+)\s*[-–—]\s*(\d+)/);
                          return match ? { url: match[1], count: parseInt(match[2]) } : { url: ev, count: 0 };
                        }
                        return ev;
                      });
                      const isStrong = bRating === "Strong";
                      const isPartial = bRating === "Partial";
                      const ratingColor = isStrong ? "#10b981" : isPartial ? "#f59e0b" : "#ef4444";
                      const ratingBg = isStrong ? "rgba(16,185,129,0.12)" : isPartial ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)";
                      const ratingBorder = isStrong ? "rgba(16,185,129,0.3)" : isPartial ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.3)";
                      // Only suppress exact placeholder strings — never broad keyword match
                      const PURE_PLACEHOLDERS = [
                        "UNATTRIBUTED - web verification incomplete.",
                        "NOT FOUND - Web search not available",
                        "UNATTRIBUTED",
                        "unattributed",
                      ];
                      const isPlaceholder = PURE_PLACEHOLDERS.some(p => bAppear.trim() === p || bAppear.trim().toLowerCase() === p.toLowerCase());
                      // Partial: has real content but also a qualification note — show with amber indicator
                      const isPartiallyVerified = !isPlaceholder && bAppear.length > 0 && (
                        bAppear.toLowerCase().includes("incomplete verification") ||
                        bAppear.toLowerCase().includes("unavailable due to") ||
                        bAppear.toLowerCase().includes("could not be fully verified") ||
                        bAppear.toLowerCase().includes("unverified")
                      );
                      const bAppearClean = isPlaceholder ? "" : bAppear;
                      return (
                        <div key={bName || bpIdx} style={{ background: "rgba(99,102,241,0.06)", borderRadius: 12, border: "1px solid rgba(99,102,241,0.18)", overflow: "hidden" }}>
                          {/* Brand header row */}
                          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(99,102,241,0.1)", borderBottom: "1px solid rgba(99,102,241,0.15)" }}>
                            <Building2 style={{ width: 16, height: 16, color: "#818cf8", flexShrink: 0 }} />
                            <span style={{ fontSize: 15, fontWeight: 800, color: "#c7d2fe", flex: 1, letterSpacing: 0.1 }}>{bName}</span>
                            {bCount > 0 && (
                              <span style={{ fontSize: 12, fontWeight: 700, color: accent.badgeText, background: accent.badgeBg, padding: "3px 10px", borderRadius: 20, border: `1px solid ${accent.border}40` }}>
                                {bCount} citations
                              </span>
                            )}
                            {bRating && (
                              <span style={{ fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 20, background: ratingBg, color: ratingColor, border: `1px solid ${ratingBorder}` }}>
                                {bRating}
                              </span>
                            )}
                          </div>
                          {/* Brand body */}
                          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                            {bDo && (
                              <div>
                                <span style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 }}>What they do</span>
                                <p style={{ fontSize: 13, color: "#cbd5e1", margin: 0, lineHeight: 1.6 }}>{bDo}</p>
                              </div>
                            )}
                            {bAppearClean && (
                              <div style={{ background: isPartiallyVerified ? "rgba(245,158,11,0.08)" : "rgba(99,102,241,0.1)", borderRadius: 8, padding: "10px 14px", borderLeft: `3px solid ${isPartiallyVerified ? "#f59e0b" : "#6366f1"}` }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: isPartiallyVerified ? "#f59e0b" : "#6366f1", textTransform: "uppercase", letterSpacing: 1 }}>How they appear</span>
                                  {isPartiallyVerified && <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>PARTIALLY VERIFIED</span>}
                                </div>
                                <p style={{ fontSize: 13, color: isPartiallyVerified ? "#fcd34d" : "#a5b4fc", margin: 0, lineHeight: 1.65, fontStyle: "italic" }}>"{bAppearClean}"</p>
                              </div>
                            )}
                            {bEvidence.length > 0 && (
                              <div>
                                <span style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Evidence</span>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                  {bEvidence.map((ev: any, ei: number) => {
                                    const evUrl = ev.url ?? "";
                                    const evDomain = evUrl.replace(/^https?:\/\//, "").split("/")[0];
                                    const evCount = ev.citation_count ?? ev.count ?? 0;
                                    return (
                                      <a key={ei} href={evUrl.startsWith("http") ? evUrl : `https://${evUrl}`} target="_blank" rel="noopener noreferrer"
                                        style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: "rgba(255,255,255,0.05)", color: "#64748b", border: "1px solid rgba(255,255,255,0.1)", textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}>
                                        <strong style={{ color: "#94a3b8" }}>{evDomain}</strong>
                                        <span style={{ color: accent.badgeText, fontWeight: 700 }}>·{evCount}</span>
                                      </a>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions section — rendered when Claude returns tactic-level actions */}
              {(() => {
                const rawActions = anyT.actions ?? anyT.action ?? null;
                if (!rawActions) return null;
                const actionItems: { label: string; text: string }[] = [];
                if (typeof rawActions === "string") {
                  actionItems.push({ label: "Action", text: rawActions });
                } else if (Array.isArray(rawActions)) {
                  rawActions.forEach((a: any, i: number) => {
                    if (typeof a === "string") actionItems.push({ label: `Action ${i + 1}`, text: a });
                    else if (a?.action) actionItems.push({ label: a.priority ?? `Action ${i + 1}`, text: a.action });
                    else if (a?.text) actionItems.push({ label: a.label ?? `Action ${i + 1}`, text: a.text });
                  });
                } else if (typeof rawActions === "object") {
                  if (rawActions.primary) actionItems.push({ label: "Primary", text: rawActions.primary });
                  if (rawActions.secondary) actionItems.push({ label: "Secondary", text: rawActions.secondary });
                  if (rawActions.quick_win) actionItems.push({ label: "Quick win", text: rawActions.quick_win });
                  if (rawActions.for_beco_capital || rawActions.for_client) actionItems.push({ label: "For you", text: rawActions.for_beco_capital ?? rawActions.for_client });
                  // Generic key-value fallback
                  if (!actionItems.length) {
                    Object.entries(rawActions).forEach(([k, v]) => {
                      if (typeof v === "string" && k !== "difficulty" && k !== "effort") actionItems.push({ label: k.replace(/_/g, " "), text: v as string });
                    });
                  }
                }
                if (!actionItems.length) return null;
                return (
                  <div style={{ marginTop: 14, background: "rgba(16,185,129,0.07)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                      <span>↗</span> Actions for this tactic
                      {rawActions?.difficulty && <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", marginLeft: "auto" }}>{rawActions.difficulty}</span>}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {actionItems.map((a, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.25)", flexShrink: 0, marginTop: 1, textTransform: "uppercase", letterSpacing: 0.5 }}>{a.label}</span>
                          <p style={{ fontSize: 12, color: "#a7f3d0", margin: 0, lineHeight: 1.55, flex: 1 }}>{a.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
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

// ── FactorReport component (parallel simpler schema) ──────────────────────────

const RATING_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  Strong:  { bg: "rgba(34,197,94,0.12)",  color: "#22c55e", label: "Strong" },
  Partial: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", label: "Partial" },
  Weak:    { bg: "rgba(239,68,68,0.12)",  color: "#ef4444", label: "Weak" },
  Missing: { bg: "rgba(100,116,139,0.15)",color: "#64748b", label: "Missing" },
};
const FACTOR_RANK_COLORS = ["#f59e0b","#6366f1","#14b8a6","#64748b","#64748b"];

function FactorReport({ data }: { data: any }) {
  const factors: any[] = data.factors ?? [];
  const domains: any[] = data.top_cited_domains ?? [];
  const gap: any = data.biggest_gap;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl overflow-hidden border border-border/40" style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)" }}>
        <div className="px-5 py-4">
          <div className="text-[10px] text-slate-400 tracking-widest mb-1 uppercase">GEO Factor Analysis</div>
          <div className="text-white font-semibold text-sm mt-0.5">{data.market ?? "Market"}</div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <div className="text-white text-lg font-bold leading-tight">{(data.total_citations_analysed ?? 0).toLocaleString()}</div>
              <div className="text-slate-400 text-[10px] mt-0.5">Citations Analysed</div>
            </div>
            <div>
              <div className="text-white text-lg font-bold leading-tight">{factors.length}</div>
              <div className="text-slate-400 text-[10px] mt-0.5">GEO Factors Identified</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top cited domains */}
      {domains.length > 0 && (
        <div style={{ background: "#0a0f1e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>Top Cited Domains</div>
          <div className="space-y-2">
            {domains.map((d: any, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <span style={{ fontSize: 10, fontWeight: 700, color: "#475569", minWidth: 16, paddingTop: 1 }}>#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0" }}>{d.domain}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", background: "rgba(99,102,241,0.12)", borderRadius: 4, padding: "1px 6px" }}>{(d.citations ?? 0).toLocaleString()} citations</span>
                  </div>
                  <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0", lineHeight: 1.5 }}>{d.why_cited}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Factor cards */}
      {factors.map((f: any, fi: number) => {
        const rankColor = FACTOR_RANK_COLORS[fi] ?? "#64748b";
        const brands: any[] = f.brands ?? [];
        return (
          <div key={fi} style={{ background: "#0a0f1e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden" }}>
            {/* Factor header */}
            <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 flex-wrap">
                <span style={{ fontSize: 11, fontWeight: 800, color: rankColor, minWidth: 20 }}>#{f.rank ?? fi + 1}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{f.factor}</span>
                <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: "#64748b", background: "rgba(99,102,241,0.10)", borderRadius: 4, padding: "2px 7px", whiteSpace: "nowrap" }}>
                  {(f.total_citations_supporting ?? 0).toLocaleString()} citations
                </span>
              </div>
              {f.why_it_matters && (
                <p style={{ fontSize: 11, color: "#64748b", margin: "6px 0 0", lineHeight: 1.5 }}>{f.why_it_matters}</p>
              )}
            </div>
            {/* Brand rows */}
            <div style={{ padding: "10px 16px 14px" }} className="space-y-3">
              {brands.map((b: any, bi: number) => {
                const rs = RATING_STYLES[b.rating] ?? RATING_STYLES["Missing"];
                return (
                  <div key={bi}>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>{b.brand}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: rs.color, background: rs.bg, borderRadius: 4, padding: "2px 7px", textTransform: "uppercase", letterSpacing: 0.8 }}>{rs.label}</span>
                    </div>
                    {b.what_they_do && <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 2px", lineHeight: 1.5 }}>{b.what_they_do}</p>}
                    {b.example && <p style={{ fontSize: 10, color: "#475569", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>eg. {b.example}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Biggest gap */}
      {gap && (
        <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.22)", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>Biggest Gap</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#fcd34d", marginBottom: 4 }}>{gap.brand}</div>
          {gap.gap && <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 6px", lineHeight: 1.5 }}>{gap.gap}</p>}
          {gap.action && (
            <div style={{ background: "rgba(245,158,11,0.10)", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "#fcd34d", lineHeight: 1.5 }}>
              <span style={{ fontWeight: 700 }}>Action: </span>{gap.action}
            </div>
          )}
        </div>
      )}

      {/* Quick win */}
      {data.quick_win && (
        <div style={{ background: "rgba(20,184,166,0.07)", border: "1px solid rgba(20,184,166,0.22)", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#14b8a6", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 }}>Quick Win</div>
          <p style={{ fontSize: 12, color: "#99f6e4", margin: 0, lineHeight: 1.6 }}>{data.quick_win}</p>
        </div>
      )}
    </div>
  );
}

function KeyFindingCard({ text, brands }: { text: string; brands: string[] }) {
  const statRegex = /\b\d+[\s,]+(?:appearances?|citations?|mentions?|brands?|domains?|results?|listings?|pages?|times?|%)\b/gi;
  const statPhrases: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(statRegex.source, "gi");
  while ((m = re.exec(text)) !== null) statPhrases.push(m[0]);

  const uniqueBrands = Array.from(new Set(brands.filter(Boolean)));
  const allTerms = [...uniqueBrands, ...statPhrases].sort((a, b) => b.length - a.length);
  const splitRe = allTerms.length
    ? new RegExp(`(${allTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi")
    : null;
  const parts = splitRe ? text.split(splitRe) : [text];

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 0 40px rgba(245,158,11,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="px-5 py-2.5 flex items-center gap-2"
        style={{
          background: "linear-gradient(90deg, rgba(245,158,11,0.15) 0%, rgba(139,92,246,0.08) 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span style={{ fontSize: 14 }}>⚡</span>
        <span style={{ color: "#fcd34d", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Key Finding
        </span>
      </div>
      <div className="p-5">
        <p style={{ color: "#f1f5f9", fontSize: 13, lineHeight: 1.7, textAlign: "left", fontWeight: 400, margin: 0 }}>
          {parts.map((part, i) => {
            const isBrand = uniqueBrands.some((b) => b.toLowerCase() === part.toLowerCase());
            const isStat = statPhrases.some((s) => s.toLowerCase() === part.toLowerCase());
            if (isBrand) {
              return (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    padding: "1px 7px",
                    borderRadius: 5,
                    fontSize: 11,
                    fontWeight: 600,
                    marginInline: 2,
                    verticalAlign: "middle",
                    background: "rgba(245,158,11,0.18)",
                    color: "#fbbf24",
                    border: "1px solid rgba(245,158,11,0.35)",
                  }}
                >
                  {part}
                </span>
              );
            }
            if (isStat) {
              return (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    padding: "1px 7px",
                    borderRadius: 5,
                    fontSize: 11,
                    fontWeight: 600,
                    marginInline: 2,
                    verticalAlign: "middle",
                    background: "rgba(139,92,246,0.2)",
                    color: "#c4b5fd",
                    border: "1px solid rgba(139,92,246,0.4)",
                  }}
                >
                  {part}
                </span>
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </p>
        {(uniqueBrands.length > 0 || statPhrases.length > 0) && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {uniqueBrands.map((b) => (
              <span
                key={b}
                style={{
                  padding: "3px 10px",
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 600,
                  background: "rgba(245,158,11,0.12)",
                  color: "#fbbf24",
                  border: "1px solid rgba(245,158,11,0.3)",
                }}
              >
                {b}
              </span>
            ))}
            {statPhrases.map((s) => (
              <span
                key={s}
                style={{
                  padding: "3px 10px",
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 600,
                  background: "rgba(139,92,246,0.12)",
                  color: "#c4b5fd",
                  border: "1px solid rgba(139,92,246,0.3)",
                }}
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const ACTION_TYPE_COLOR: Record<string, string> = {
  Government: "#f59e0b",
  "Government & Regulatory": "#f59e0b",
  "News & Media": "#60a5fa",
  News: "#60a5fa",
  Brand: "#818cf8",
  "Brand / Competitor": "#818cf8",
  Community: "#34d399",
  "Review Platforms": "#a78bfa",
  "Review Platform": "#a78bfa",
  Directories: "#fb923c",
  "Social Media": "#38bdf8",
  "Comparison & Research": "#f472b6",
  "General Web": "#94a3b8",
};

function ActionCollapseItem({
  num, summary, detail, weakest, gap, accent = "indigo",
}: {
  num: number | string; summary: string; detail: string; weakest?: string; gap?: string; accent?: "indigo" | "amber" | "violet";
}) {
  const [open, setOpen] = useState(false);
  const ind = accent === "amber";
  const vio = accent === "violet";
  const borderCol = ind ? "rgba(251,191,36,0.3)" : vio ? "rgba(167,139,250,0.3)" : "rgba(99,102,241,0.3)";
  const bgCol = ind ? "rgba(251,191,36,0.12)" : vio ? "rgba(167,139,250,0.12)" : "rgba(99,102,241,0.12)";
  const textCol = ind ? "#fbbf24" : vio ? "#a78bfa" : "#818cf8";
  const chevBg = open ? bgCol : "rgba(255,255,255,0.05)";
  const chevBorder = open ? borderCol : "rgba(255,255,255,0.09)";

  return (
    <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${open ? borderCol : "rgba(255,255,255,0.07)"}`, background: ind ? "rgba(251,191,36,0.03)" : vio ? "rgba(167,139,250,0.03)" : "#0b1120", transition: "border-color 0.15s" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: bgCol, border: `1px solid ${borderCol}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: ind ? 16 : 13, fontWeight: 900, color: textCol }}>
          {num}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {ind && <div style={{ fontSize: 9, fontWeight: 700, color: textCol, letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 2 }}>Bonus · Quick Win</div>}
          <span style={{ fontSize: 13, fontWeight: 600, color: ind ? "#fde68a" : vio ? "#ddd6fe" : "#e2e8f0", lineHeight: 1.4 }}>{summary}</span>
        </div>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: chevBg, border: `1px solid ${chevBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
          <ChevronDown style={{ width: 15, height: 15, color: open ? textCol : "#64748b", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s, color 0.15s" }} />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "4px 16px 16px 58px", borderTop: `1px solid ${ind ? "rgba(251,191,36,0.1)" : vio ? "rgba(167,139,250,0.1)" : "rgba(255,255,255,0.05)"}`, background: ind ? "rgba(251,191,36,0.02)" : vio ? "rgba(167,139,250,0.02)" : "#080e1c" }}>
              <p style={{ fontSize: 13, color: ind ? "#fde68a" : vio ? "#c4b5fd" : "#94a3b8", lineHeight: 1.65, margin: "12px 0 10px", opacity: 0.95 }}>{detail}</p>
              {(weakest || gap) && (
                <div style={{ fontSize: 10, color: "#475569", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 8 }}>
                  {weakest && <span>Weakest tactic: <span style={{ color: "#64748b" }}>{weakest}</span></span>}
                  {gap && <span style={{ color: "#334155" }}> · {gap} citations</span>}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const AUDIT_TYPE_HEX: Record<string, { bg: string; text: string }> = {
  Government: { bg: "rgba(59,130,246,0.15)", text: "#60a5fa" },
  News: { bg: "rgba(34,197,94,0.15)", text: "#4ade80" },
  Brand: { bg: "rgba(236,72,153,0.15)", text: "#f472b6" },
  Directory: { bg: "rgba(99,102,241,0.15)", text: "#818cf8" },
  Community: { bg: "rgba(249,115,22,0.15)", text: "#fb923c" },
  "Review Platform": { bg: "rgba(167,139,250,0.15)", text: "#a78bfa" },
  Aggregator: { bg: "rgba(100,116,139,0.15)", text: "#94a3b8" },
  Other: { bg: "rgba(100,116,139,0.15)", text: "#94a3b8" },
};

function AuditDefaultItem({ topSources }: { topSources: SourceEntry[] }) {
  const [open, setOpen] = useState(false);
  const borderCol = "rgba(20,184,166,0.3)";
  const bgCol = "rgba(20,184,166,0.12)";
  const textCol = "#2dd4bf";
  const chevBg = open ? bgCol : "rgba(255,255,255,0.05)";
  const chevBorder = open ? borderCol : "rgba(255,255,255,0.09)";
  const top10 = topSources.slice(0, 10);
  const maxApps = Math.max(...top10.map(s => s.appearances), 1);

  return (
    <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${open ? borderCol : "rgba(255,255,255,0.07)"}`, background: "rgba(20,184,166,0.03)", transition: "border-color 0.15s" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: bgCol, border: `1px solid ${borderCol}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, fontWeight: 900, color: textCol }}>
          1
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: textCol, letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 2 }}>Standing Action · Always On</div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.4 }}>Audit the authority sources shaping your AI results — then enhance and monitor your presence across them continuously</span>
        </div>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: chevBg, border: `1px solid ${chevBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
          <ChevronDown style={{ width: 15, height: 15, color: open ? textCol : "#64748b", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s, color 0.15s" }} />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "4px 16px 16px 58px", borderTop: "1px solid rgba(20,184,166,0.1)", background: "rgba(20,184,166,0.02)" }}>
              <p style={{ fontSize: 12, color: "#5eead4", lineHeight: 1.6, margin: "12px 0 14px", opacity: 0.9 }}>
                These are the top authority sources currently shaping AI recommendations in your market. Audit your presence on each — contribute content, get cited, or build relationships with publishers — then track how your citation share shifts over time.
              </p>
              {top10.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 1, borderRadius: 10, overflow: "hidden", border: "1px solid rgba(20,184,166,0.12)" }}>
                  {top10.map((s, idx) => {
                    const typeStyle = AUDIT_TYPE_HEX[s.type] ?? AUDIT_TYPE_HEX.Other;
                    const pct = Math.round((s.appearances / maxApps) * 100);
                    return (
                      <div key={s.domain} style={{ display: "grid", gridTemplateColumns: "22px 1fr auto auto", alignItems: "center", gap: 10, padding: "9px 14px", background: idx % 2 === 0 ? "rgba(20,184,166,0.04)" : "rgba(0,0,0,0.15)", borderBottom: idx < top10.length - 1 ? "1px solid rgba(20,184,166,0.06)" : "none" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#475569", textAlign: "right" }}>{idx + 1}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.domain}</span>
                          <span style={{ fontSize: 9, fontWeight: 700, color: typeStyle.text, background: typeStyle.bg, padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}>{s.type}</span>
                        </div>
                        <div style={{ width: 50, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden", flexShrink: 0 }}>
                          <div style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: "rgba(20,184,166,0.55)" }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#2dd4bf", minWidth: 20, textAlign: "right" }}>{s.appearances}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "#475569", fontStyle: "italic" }}>No source data available for this session.</div>
              )}
              <div style={{ fontSize: 10, color: "#334155", marginTop: 10 }}>Sorted by citation frequency across all AI engines in this session</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PriorityActionsBlock({ actionsData, quickWin, topSources = [] }: { actionsData: any; quickWin?: string; topSources?: SourceEntry[] }) {
  let brandActions: any[] = [];
  if (Array.isArray(actionsData)) {
    brandActions = actionsData;
  } else if (actionsData?.brand_specific) {
    brandActions = Array.isArray(actionsData.brand_specific) ? actionsData.brand_specific : Object.values(actionsData.brand_specific);
  } else if (typeof actionsData === "object") {
    const vals = Object.values(actionsData).filter(v => typeof v === "object" && v !== null && !Array.isArray(v));
    if (vals.length > 0) brandActions = vals as any[];
  }

  const qw = quickWin ?? actionsData?.quick_win_any_brand ?? actionsData?.quick_win;

  return (
    <div>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(99,102,241,0.13)", border: "1px solid rgba(99,102,241,0.28)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>🎯</div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>Data-backed moves</div>
          <h4 style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9", lineHeight: 1.25, margin: 0 }}>Quick actions to leapfrog the competition</h4>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Always-on standing action */}
        <AuditDefaultItem topSources={topSources} />

        {brandActions.map((action: any, i: number) => {
          const fullText: string = action.action ?? action.specific_action ?? action.recommended_action ?? action.recommendation ?? "";
          const firstSentence = fullText.split(/(?<=[.!?])\s+/)[0] ?? fullText;
          const summary = firstSentence.length > 90 ? firstSentence.slice(0, 90).trimEnd() + "…" : firstSentence;
          const weakest: string | undefined = action.weakest_tactic ?? action.gap;
          const gap: string | number | undefined = action.weakest_tactic_citations ?? action.weakest_count;
          return (
            <ActionCollapseItem
              key={i}
              num={i + 2}
              summary={summary}
              detail={fullText}
              weakest={weakest}
              gap={gap !== undefined ? String(gap) : undefined}
            />
          );
        })}

        {qw && (
          <ActionCollapseItem
            num="⚡"
            summary={typeof qw === "string" ? (qw.split(/(?<=[.!?])\s+/)[0]?.slice(0, 90) ?? qw.slice(0, 90)) + (qw.length > 90 ? "…" : "") : "Quick win opportunity"}
            detail={typeof qw === "string" ? qw : qw?.recommendation ?? JSON.stringify(qw)}
            accent="amber"
          />
        )}
      </div>
    </div>
  );
}

function NewSourcesTable({ sources, sessionId, maxAppearances }: { sources: SourceEntry[]; sessionId: number; maxAppearances: number }) {
  if (!sources?.length) return null;
  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", background: "#0d1526" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 130px auto 40px 26px", padding: "7px 16px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {["Source", "Type", "Engines", "Apps.", ""].map(h => (
          <span key={h} style={{ fontSize: 9, fontWeight: 700, color: "#334155", letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</span>
        ))}
      </div>
      {sources.map((s) => (
        <ExpandableSourceRow key={s.domain} source={s} sessionId={sessionId} maxAppearances={maxAppearances} />
      ))}
      <div style={{ padding: "6px 16px", borderTop: "1px solid rgba(255,255,255,0.04)", background: "rgba(0,0,0,0.1)" }}>
        <span style={{ fontSize: 10, color: "#334155" }}>Click any source to expand its cited URLs</span>
      </div>
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
  const analysisNote: string | undefined = anyData.analysis_note ?? anyData.methodology_note ?? anyData.methodology_limitations ?? anyData.note;
  const isInsightsFormat = insightsList.length > 0 && !data.tactics && !data.summary;
  const isTopTacticsFormat = topTacticsList.length > 0 && !data.tactics && !data.summary;

  return (
    <div className="space-y-5">
      {/* Analysis note / methodology limitations — show when Claude adds a caveat */}
      {analysisNote && (
        <div style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>⚠</span>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4 }}>Analysis note</div>
            <p style={{ fontSize: 12, color: "#fcd34d", margin: 0, lineHeight: 1.6 }}>{analysisNote}</p>
          </div>
        </div>
      )}

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
                  <span style={{ color: "#f97316", fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>#{t.rank ?? t.number ?? i + 1}</span>
                  <span style={{ color: "#f1f5f9", fontSize: 13, fontWeight: 600, lineHeight: 1.4, flex: 1 }}>{t.tactic_title ?? t.title}</span>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    {t.data_source && <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)" }}>{t.data_source}</span>}
                    {(t.total_citations ?? t.citations) && <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: "rgba(16,185,129,0.12)", color: "#34d399", border: "1px solid rgba(16,185,129,0.25)" }}>{t.total_citations ?? t.citations} citations</span>}
                  </div>
                </div>
                {t.why_it_works && (
                  <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
                    <span style={{ color: "#cbd5e1", fontWeight: 600 }}>Why it works: </span>{Array.isArray(t.why_it_works) ? t.why_it_works.join(" ") : t.why_it_works}
                  </p>
                )}
                {(t.brand_performance ?? t.brands ?? []).length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                    {(t.brand_performance ?? t.brands ?? []).map((bp: any, bpi: number) => {
                      const cBrand = bp.brand ?? bp.brand_name ?? bp.name ?? "";
                      const cRating = bp.performance_rating ?? bp.strength ?? bp.rating ?? "";
                      const cCount = bp.citation_count_for_tactic ?? bp.tactic_citations ?? bp.appearances ?? "";
                      const cDesc = bp.what_they_do ?? bp.details ?? bp.description ?? "";
                      return (
                      <div key={cBrand || bpi} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 12px", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 8, padding: "3px 10px" }}>
                            <span style={{ color: "#c7d2fe", fontSize: 12, fontWeight: 700 }}>{cBrand}</span>
                          </span>
                          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: cRating === "Strong" ? "rgba(16,185,129,0.18)" : "rgba(251,191,36,0.14)", color: cRating === "Strong" ? "#34d399" : "#fbbf24", fontWeight: 700, border: `1px solid ${cRating === "Strong" ? "rgba(16,185,129,0.3)" : "rgba(251,191,36,0.25)"}` }}>{cRating}</span>
                          {cCount && <span style={{ fontSize: 10, color: "#475569", marginLeft: "auto", fontWeight: 600 }}>{cCount} cit.</span>}
                        </div>
                        {cDesc && <p style={{ fontSize: 11, color: "#64748b", lineHeight: 1.55, margin: 0 }}>{cDesc}</p>}
                      </div>
                      );
                    })}
                  </div>
                )}
                {(t.top_examples ?? t.sources ?? t.examples ?? []).length > 0 && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8, marginTop: 4 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", letterSpacing: 1, marginBottom: 5, textTransform: "uppercase" }}>Third-party sources</div>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {(t.top_examples ?? t.sources ?? t.examples ?? []).map((ex: any, j: number) => (
                        <span key={j} style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 12, background: "rgba(99,102,241,0.13)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.28)" }}>
                          <strong style={{ color: "#c7d2fe" }}>{ex.source ?? ex.url}</strong>{(ex.citation_count ?? ex.count) ? ` · ${ex.citation_count ?? ex.count}` : ""}
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
        <KeyFindingCard
          text={data.summary.key_finding}
          brands={Array.from(new Set([
            ...(data.cross_engine_champions?.map((c) => c.brand) ?? []),
            ...(data.tactics?.flatMap((t) => t.examples?.map((e) => e.brand) ?? []) ?? []),
          ]))}
        />
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
            {data.tactics.map((t, i) => <TacticCard key={t.rank ?? (t as any).tactic_number ?? (t as any).number ?? i} tactic={t} />)}
          </div>
        </div>
      )}

      {/* Priority Actions — collapsible numbered design; action 1 always present */}
      <PriorityActionsBlock
        actionsData={anyData.actions ?? anyData.gap_analysis ?? null}
        quickWin={anyData.quick_win}
        topSources={data.sources ?? []}
      />


      {/* Unusual findings — collapsible */}
      {data.unusual_findings?.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(167,139,250,0.13)", border: "1px solid rgba(167,139,250,0.28)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>🔬</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>Anomaly detection</div>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9", lineHeight: 1.25, margin: 0 }}>Patterns the data didn't expect</h4>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.unusual_findings.map((f, i) => (
              <ActionCollapseItem
                key={i}
                num={i + 1}
                summary={f.title}
                detail={f.finding}
                accent="violet"
              />
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
  const [schemaMode, setSchemaMode] = useState<"standard" | "factors">(_saved?.schemaMode ?? "standard");
  const [customPrompt, setCustomPrompt] = useState<string>(_saved?.prompt ?? DEFAULT_PROMPT_PREFIX);
  const [customOutputSchema, setCustomOutputSchema] = useState<string>(_saved?.schema ?? DEFAULT_OUTPUT_SCHEMA);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [showOutputEditor, setShowOutputEditor] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState<boolean>(_saved?.webSearch ?? false);
  const [selectedInsightId, setSelectedInsightId] = useState<number | null>(null);

  function switchSchemaMode(mode: "standard" | "factors") {
    setSchemaMode(mode);
    setCustomPrompt(mode === "factors" ? FACTOR_PROMPT_PREFIX : DEFAULT_PROMPT_PREFIX);
    setCustomOutputSchema(mode === "factors" ? FACTOR_OUTPUT_SCHEMA : DEFAULT_OUTPUT_SCHEMA);
  }

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

  // Auto-select the most complete run (highest completeness score) once on load
  // Only fires when the user hasn't manually chosen a run yet
  const autoSelectDone = useRef(false);
  useEffect(() => {
    if (autoSelectDone.current || !pastInsights.length || selectedInsightId !== null) return;
    autoSelectDone.current = true;
    if (pastInsights.length === 1) return; // Only one run — latestInsight is already shown
    const scored = pastInsights.map(run => ({ id: run.id, score: scoreInsightRun(run) }));
    scored.sort((a, b) => b.score - a.score);
    const bestId = scored[0].id;
    if (bestId !== latestInsight?.id) setSelectedInsightId(bestId);
  }, [pastInsights]);

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
      saveCISettings({ model: selectedModel, prompt: customPrompt, schema: customOutputSchema, webSearch: webSearchEnabled, schemaMode });
      const promptToSend = customPrompt.replace(/\[CATEGORY\]/g, brandName);
      const res = await apiRequest(
        "POST",
        `/api/multi-segment-sessions/${sessionId}/citation-insights`,
        { model: selectedModel, promptOverride: promptToSend, outputSchemaOverride: customOutputSchema, webSearch: webSearchEnabled }
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
              <div className="space-y-2">
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
                  {/* Schema mode selector */}
                  <div className="flex items-center rounded border border-border/50 overflow-hidden">
                    {(["standard", "factors"] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => switchSchemaMode(mode)}
                        className={`px-2 py-0.5 text-[10px] font-medium transition-all ${
                          schemaMode === mode
                            ? "bg-foreground text-background"
                            : "bg-transparent text-muted-foreground hover:text-foreground"
                        }`}
                        data-testid={`mode-init-${mode}`}
                      >
                        {mode === "standard" ? "Standard" : "Factors"}
                      </button>
                    ))}
                  </div>
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

                {/* Web search toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWebSearchEnabled(v => !v)}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium border transition-all ${
                      webSearchEnabled
                        ? "bg-blue-500/15 text-blue-400 border-blue-500/40"
                        : "bg-transparent text-muted-foreground border-border/50 hover:border-foreground/40 hover:text-foreground"
                    }`}
                    data-testid="button-toggle-web-search-init"
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
                    data-testid="button-toggle-prompt-editor-init"
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
                        data-testid="textarea-custom-prompt-init"
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
                    data-testid="button-toggle-output-editor-init"
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
                        data-testid="textarea-output-schema-init"
                        spellCheck={false}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCustomOutputSchema(DEFAULT_OUTPUT_SCHEMA)}
                          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                        >
                          Reset to default
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Format A: Intelligence Report — rendered directly ─────── */}
          {displayedInsight && (
            <>
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
                      const parsed = JSON.parse(raw);
                      if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && Object.keys(parsed).length > 0) {
                        if (parsed.factors) return <FactorReport data={parsed} />;
                        return <StructuredReport data={parsed as StructuredReportData} sessionId={sessionId} />;
                      }
                    } catch { /* fall through */ }
                    return <MarkdownReport text={displayedInsight.result_text} />;
                  })()}
                </motion.div>
              </AnimatePresence>
            </>
          )}

        </>
      )}
    </div>
  );
}

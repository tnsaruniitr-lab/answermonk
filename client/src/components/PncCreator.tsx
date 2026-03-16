import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { deduplicateStoredCompetitors } from "@/lib/competitor-merge";
import type { MultiSegmentSession } from "@shared/schema";
import { SegmentCitationAnalyzer } from "@/components/SegmentCitationAnalyzer";
import { Section1, Section2, CompetitorPlaybookSection, Section3, AppendixSection } from "@/components/ReportViewer";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Users, ChevronDown, ChevronRight, Loader2, Search, TrendingUp, FileText, Zap, Eye, BarChart3 } from "lucide-react";

const DEFAULT_QUALIFIERS = [
  "most trusted","most reliable","most affordable","highest rated",
  "most experienced","best reviewed","most recommended","top rated",
];

type Chip = { label: string; on: boolean };
type Blocks = { 1: Chip[]; 2: Chip[]; 3: Chip[]; 4: Chip[] };
type Competitor = { name: string; location: string; known_for: string };
type Prompt = { verb: string; text: string };
type V2ServiceGroup = { service: string; prompts: Prompt[] };
type V2CustomerGroup = { customer: string; prompts: Prompt[] };
type V2Result = {
  business_name: string;
  total_prompts: number;
  by_service: V2ServiceGroup[];
  by_customer: V2CustomerGroup[];
};
type CostEntry = {
  label: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
};
type GEOScore = {
  appearance_rate: number;
  primary_rate: number;
  avg_rank: number | null;
  engine_breakdown: Record<string, { appearance_rate: number; primary_rate: number; valid_runs: number; total_runs?: number; error_runs?: number }>;
  competitors: Array<{ name: string; share: number; appearances?: number }>;
};
type ScoringResponse = {
  job_id?: number;
  score: GEOScore;
  raw_runs?: any[];
  cost?: any;
};
type ScoringPrompt = { id: string; text: string };
type PncAnalysisSegment = {
  id: string;
  type: "service" | "customer";
  label: string;
  prompts: ScoringPrompt[];
  selected: boolean;
  isScoring: boolean;
  scoringResult: ScoringResponse | null;
};

const ENGINE_LABELS: Record<string, string> = { chatgpt: "ChatGPT", gemini: "Gemini", claude: "Claude" };
const ENGINE_COLORS: Record<string, string> = {
  chatgpt: "border-green-600/40 text-green-400",
  gemini: "border-blue-600/40 text-blue-400",
  claude: "border-orange-600/40 text-orange-400",
};

const makeDefaultBlocks = (): Blocks => ({
  1: [], 2: [], 3: [],
  4: DEFAULT_QUALIFIERS.map((v) => ({ label: v, on: true })),
});

function verbClass(verb: string) {
  if (verb === "Find") return "bg-blue-900/60 text-blue-300";
  if (verb === "List") return "bg-teal-900/60 text-teal-300";
  return "bg-amber-900/60 text-amber-300";
}

function blockColors(n: 1 | 2 | 3 | 4) {
  const map = {
    1: { num: "bg-blue-900/40 text-blue-300", chipOn: "bg-blue-400 border-transparent text-black", dot: "bg-blue-400" },
    2: { num: "bg-teal-900/40 text-teal-300", chipOn: "bg-teal-400 border-transparent text-black", dot: "bg-teal-400" },
    3: { num: "bg-pink-900/40 text-pink-300", chipOn: "bg-pink-400 border-transparent text-black", dot: "bg-pink-400" },
    4: { num: "bg-amber-900/40 text-amber-300", chipOn: "bg-amber-400 border-transparent text-black", dot: "bg-amber-400" },
  };
  return map[n];
}

function cpText(text: string, btn: EventTarget & HTMLButtonElement, resetLabel: string) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => { btn.textContent = resetLabel || orig || ""; }, 1600);
  });
}

function extractDomain(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function buildPromptId(prefix: string, i: number) {
  return `pnc_${prefix}_${i}`;
}

type PncV2Cache = { segments: PncAnalysisSegment[]; brandName: string; brandDomain: string; engines: string[]; timestamp: number };
type PncV1Cache = { segment: PncAnalysisSegment; brandName: string; brandDomain: string; engines: string[]; timestamp: number };

function pncCacheKey(mode: "v1" | "v2", domain: string) { return `pnc_${mode}_${domain}`; }
function savePncV2(domain: string, segments: PncAnalysisSegment[], brandName: string, brandDomain: string, engines: Set<string>) {
  if (!domain) return;
  try { localStorage.setItem(pncCacheKey("v2", domain), JSON.stringify({ segments, brandName, brandDomain, engines: Array.from(engines), timestamp: Date.now() })); } catch {}
}
function loadPncV2(domain: string): PncV2Cache | null {
  if (!domain) return null;
  try { const r = localStorage.getItem(pncCacheKey("v2", domain)); return r ? JSON.parse(r) : null; } catch { return null; }
}
function savePncV1(domain: string, segment: PncAnalysisSegment, brandName: string, brandDomain: string, engines: Set<string>) {
  if (!domain) return;
  try { localStorage.setItem(pncCacheKey("v1", domain), JSON.stringify({ segment, brandName, brandDomain, engines: Array.from(engines), timestamp: Date.now() })); } catch {}
}
function loadPncV1(domain: string): PncV1Cache | null {
  if (!domain) return null;
  try { const r = localStorage.getItem(pncCacheKey("v1", domain)); return r ? JSON.parse(r) : null; } catch { return null; }
}
function fmtCacheTs(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}


function SegmentScoreCard({ seg, brandName }: { seg: PncAnalysisSegment; brandName: string }) {
  const [showSources, setShowSources] = useState(false);

  const scoringResult = seg.scoringResult;
  const score = scoringResult?.score;
  if (!score) return null;

  const dedupedComps = deduplicateStoredCompetitors(
    (score.competitors || []).map((c) => ({ name: c.name, share: c.share, appearances: c.appearances ?? 0 }))
  );
  const allEntries = [
    { name: brandName || "Your Brand", share: score.appearance_rate, isBrand: true as const },
    ...dedupedComps.map((c) => ({ name: c.name, share: c.share, isBrand: false as const })),
  ].sort((a, b) => b.share - a.share);

  // Deduplicate citations from all raw_runs
  const seenUrls = new Set<string>();
  const citations: Array<{ url: string; title?: string; engine: string }> = [];
  for (const run of (scoringResult?.raw_runs || [])) {
    for (const c of (run.citations || [])) {
      const url = typeof c === "string" ? c : c.url;
      if (url && !seenUrls.has(url)) {
        seenUrls.add(url);
        citations.push({ url, title: typeof c === "object" ? c.title : undefined, engine: run.engine });
      }
    }
  }

  return (
    <div className="mt-3 space-y-3 border-t border-border/40 pt-3">
      {/* Score tiles */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted/30 rounded-md p-2.5 text-center">
          <div className="text-base font-bold tabular-nums">{Math.round(score.appearance_rate * 100)}%</div>
          <div className="text-[10px] text-muted-foreground">Appearance</div>
        </div>
        <div className="bg-muted/30 rounded-md p-2.5 text-center">
          <div className="text-base font-bold tabular-nums">{Math.round(score.primary_rate * 100)}%</div>
          <div className="text-[10px] text-muted-foreground">Top 3</div>
        </div>
        <div className="bg-muted/30 rounded-md p-2.5 text-center">
          <div className="text-base font-bold tabular-nums">{score.avg_rank !== null ? `#${score.avg_rank}` : "—"}</div>
          <div className="text-[10px] text-muted-foreground">Avg Rank</div>
        </div>
      </div>

      {/* Engine breakdown */}
      {Object.keys(score.engine_breakdown).length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(score.engine_breakdown).map(([engine, data]) => {
            const allFailed = data.valid_runs === 0 && (data.error_runs ?? 0) > 0;
            return (
              <div key={engine} className={`rounded-md p-2 border ${ENGINE_COLORS[engine] || "border-border"} bg-muted/10 space-y-0.5`}>
                <div className="text-[10px] font-mono text-muted-foreground">{ENGINE_LABELS[engine] || engine}</div>
                {allFailed ? (
                  <div className="text-[11px] text-red-400">Failed</div>
                ) : (
                  <>
                    <div className="text-sm font-semibold tabular-nums">{Math.round(data.appearance_rate * 100)}%</div>
                    <div className="text-[10px] text-muted-foreground">Top 3: {Math.round(data.primary_rate * 100)}%</div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Competitor rankings */}
      {allEntries.length > 0 && (
        <div>
          <div className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-1.5">Rankings</div>
          <div className="divide-y divide-border/30 border border-border/30 rounded-md overflow-hidden">
            {allEntries.slice(0, 8).map((entry) => (
              <div key={entry.name} className={`flex items-center gap-2.5 px-2.5 py-1.5 ${entry.isBrand ? "bg-lime-400/5" : ""}`}>
                <div className="flex-1 text-[12px] truncate font-medium">{entry.name}</div>
                <div className="text-[11px] font-mono tabular-nums text-muted-foreground">{Math.round(entry.share * 100)}%</div>
                <div className="w-20 bg-muted/20 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full rounded-full ${entry.isBrand ? "bg-lime-400" : "bg-muted-foreground/40"}`} style={{ width: `${Math.round(entry.share * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sources / Citations */}
      {citations.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowSources((v) => !v)}
            className="w-full flex items-center gap-2 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            <span className={`transition-transform ${showSources ? "rotate-90" : ""}`}>▶</span>
            <span>{citations.length} source{citations.length !== 1 ? "s" : ""} cited</span>
          </button>
          {showSources && (
            <div className="mt-2 border border-border/40 rounded-md overflow-hidden divide-y divide-border/30 max-h-56 overflow-y-auto">
              {citations.map((c) => (
                <a
                  key={c.url}
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 px-3 py-2 hover:bg-muted/20 transition-colors group"
                >
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0 ${ENGINE_COLORS[c.engine] || "border-border text-muted-foreground border"}`}>
                    {ENGINE_LABELS[c.engine] || c.engine}
                  </span>
                  <div className="flex-1 min-w-0">
                    {c.title && <div className="text-[11px] text-foreground truncate">{c.title}</div>}
                    <div className="text-[10px] text-muted-foreground/60 truncate group-hover:text-muted-foreground transition-colors">{c.url}</div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {scoringResult?.cost?.total_cost_usd > 0 && (
        <div className="text-[10px] font-mono text-muted-foreground/40">
          Cost: ${scoringResult.cost.total_cost_usd.toFixed(4)}
        </div>
      )}
    </div>
  );
}

function PncCompetitorLens({ segments, brandName, brandDomain, location, sessionId = 0 }: {
  segments: PncAnalysisSegment[];
  brandName: string;
  brandDomain: string;
  location: string;
  sessionId?: number;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [compList, setCompList] = useState<{ name: string; appearances: number; segments: string[] }[]>([]);
  const [selected, setSelected] = useState("");
  const [customName, setCustomName] = useState("");
  const [result, setResult] = useState<any>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [batchSelected, setBatchSelected] = useState<Set<string>>(new Set());
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ index: number; total: number; name: string; status: string } | null>(null);
  const [batchResults, setBatchResults] = useState<Array<{ name: string; slug: string; sessionId: number; success: boolean; error?: string }> | null>(null);

  const buildSegmentRunsMap = () => {
    const map: Record<string, any[]> = {};
    segments.forEach((seg) => {
      if (seg.scoringResult?.raw_runs?.length) {
        const label = `${seg.label}${location ? ` · ${location}` : ""}`;
        map[label] = seg.scoringResult.raw_runs;
      }
    });
    return map;
  };

  const getSegmentsPayload = () =>
    segments
      .filter((s) => s.scoringResult?.raw_runs?.length)
      .map((s) => ({
        persona: "pnc",
        seedType: s.type === "service" ? "providers" : "customers",
        serviceType: s.type === "service" ? s.label : undefined,
        customerType: s.type === "customer" ? s.label : "",
        location,
        prompts: s.prompts,
        scoringResult: s.scoringResult,
      }));

  const loadCompetitorList = async () => {
    const segMap = buildSegmentRunsMap();
    if (!Object.keys(segMap).length) return;
    try {
      const res = await apiRequest("POST", "/api/competitor-lens/list", { segments: segMap });
      setCompList(await res.json());
    } catch {
      toast({ title: "Failed to load competitors", variant: "destructive" });
    }
  };

  const runCompetitorLens = async (name: string) => {
    const segMap = buildSegmentRunsMap();
    if (!Object.keys(segMap).length) return;
    setLoading(true);
    setResult(null);
    setReportData(null);
    setReportOpen(false);
    try {
      const res = await apiRequest("POST", "/api/competitor-lens/analyse", {
        competitorName: name,
        segments: segMap,
        brandName,
      });
      setResult(await res.json());
    } catch {
      toast({ title: "Competitor analysis failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setReportLoading(true);
    try {
      const res = await apiRequest("POST", "/api/competitor-lens/report", {
        competitorName: selected,
        sessionId: sessionId || undefined,
        segments: getSegmentsPayload(),
        brandName,
        brandDomain: brandDomain || undefined,
      });
      const data = await res.json();
      setReportData(data.report);
      setReportOpen(true);
    } catch {
      toast({ title: "Report generation failed", variant: "destructive" });
    } finally {
      setReportLoading(false);
    }
  };

  const runBatchReports = async () => {
    if (!batchSelected.size) return;
    setBatchRunning(true);
    setBatchProgress(null);
    setBatchResults(null);
    try {
      const res = await fetch("/api/competitor-lens/batch-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitors: Array.from(batchSelected),
          sessionId: sessionId || undefined,
          segments: getSegmentsPayload(),
          brandName,
          brandDomain: brandDomain || undefined,
        }),
      });
      if (!res.ok) throw new Error("Batch generation failed");
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === "progress") {
                setBatchProgress({ index: event.index, total: event.total, name: event.name, status: event.status });
              } else if (event.type === "complete") {
                setBatchResults(event.results);
              }
            } catch {}
          }
        }
      }
    } catch {
      toast({ title: "Batch generation failed", variant: "destructive" });
    } finally {
      setBatchRunning(false);
    }
  };

  const avgBrandRate = segments.filter((s) => s.scoringResult).length > 0
    ? segments.reduce((s, seg) => s + (seg.scoringResult?.score?.appearance_rate || 0), 0) / Math.max(segments.filter((s) => s.scoringResult).length, 1)
    : 0;

  if (!segments.some((s) => s.scoringResult)) return null;

  return (
    <Card className="p-4 space-y-4 mt-4" data-testid="pnc-competitor-lens-section">
      <button
        className="flex items-center gap-2 w-full text-left"
        onClick={() => {
          const wasOpen = open;
          setOpen(!wasOpen);
          if (!wasOpen && !compList.length) loadCompetitorList();
        }}
        data-testid="toggle-pnc-competitor-lens"
      >
        <Users className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Competitor Lens</span>
        <span className="text-[10px] text-muted-foreground ml-1">View any competitor's full analysis — no extra API cost</span>
        {open ? <ChevronDown className="w-4 h-4 ml-auto text-muted-foreground" /> : <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />}
      </button>

      {open && (
        <div className="space-y-4 pt-2">
          {/* Competitor selector */}
          <div className="flex items-center gap-3 flex-wrap">
            <Select
              value={compList.some((c) => c.name === selected) ? selected : ""}
              onValueChange={(v) => { setSelected(v); setCustomName(""); runCompetitorLens(v); }}
            >
              <SelectTrigger className="w-64 bg-secondary/50" data-testid="select-pnc-competitor">
                <SelectValue placeholder="Select a competitor..." />
              </SelectTrigger>
              <SelectContent>
                {compList.map((c) => (
                  <SelectItem key={c.name} value={c.name}>
                    {c.name} ({c.appearances} mentions, {c.segments.length} seg{c.segments.length !== 1 ? "s" : ""})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex items-center gap-2">
              <Input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Type any business name..."
                className="w-56 h-9 bg-secondary/50 text-sm"
                data-testid="input-pnc-custom-competitor"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customName.trim()) {
                    setSelected(customName.trim());
                    runCompetitorLens(customName.trim());
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!customName.trim() || loading}
                onClick={() => { const n = customName.trim(); setSelected(n); runCompetitorLens(n); }}
                data-testid="button-pnc-check-custom-competitor"
                className="h-9 text-xs"
              >
                <Search className="w-3 h-3 mr-1" />
                Check
              </Button>
            </div>
          </div>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}

          {/* Batch generate */}
          {compList.length > 0 && (
            <div className="border rounded-lg p-4 space-y-3 bg-secondary/20">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Batch Generate Impact Summaries
                </h4>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => setBatchSelected(batchSelected.size === compList.length ? new Set() : new Set(compList.map((c) => c.name)))}
                >
                  {batchSelected.size === compList.length ? "Deselect All" : "Select All"}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {compList.map((c) => (
                  <label key={c.name} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-secondary/50 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={batchSelected.has(c.name)}
                      onChange={() => {
                        const next = new Set(batchSelected);
                        next.has(c.name) ? next.delete(c.name) : next.add(c.name);
                        setBatchSelected(next);
                      }}
                      disabled={batchRunning}
                      className="rounded border-gray-300"
                    />
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs text-muted-foreground">({c.appearances} mentions, {c.segments.length} seg{c.segments.length !== 1 ? "s" : ""})</span>
                  </label>
                ))}
              </div>
              {batchProgress && batchRunning && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>Generating {batchProgress.index + 1}/{batchProgress.total}: <strong>{batchProgress.name}</strong>...</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${((batchProgress.index + (batchProgress.status === "done" || batchProgress.status === "exists" ? 1 : 0.5)) / batchProgress.total) * 100}%` }} />
                  </div>
                </div>
              )}
              {batchResults && !batchRunning && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{batchResults.filter((r) => r.success).length}/{batchResults.length} reports generated</p>
                  <div className="space-y-1">
                    {batchResults.filter((r) => r.success).map((r) => (
                      <div key={r.name} className="flex items-center justify-between text-sm px-2 py-1.5 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-900">
                        <span className="font-medium">{r.name}</span>
                        <span className="text-xs text-green-600 dark:text-green-400">Done</span>
                      </div>
                    ))}
                    {batchResults.filter((r) => !r.success).map((r) => (
                      <div key={r.name} className="flex items-center justify-between text-sm px-2 py-1.5 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-900">
                        <span className="font-medium text-red-700 dark:text-red-400">{r.name}</span>
                        <span className="text-xs text-red-500">Failed</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Button
                onClick={runBatchReports}
                disabled={!batchSelected.size || batchRunning}
                className="w-full"
                data-testid="button-pnc-batch-generate"
              >
                {batchRunning ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating Reports...</>
                ) : (
                  <><Zap className="w-4 h-4 mr-2" />Generate {batchSelected.size} Impact Summar{batchSelected.size === 1 ? "y" : "ies"}</>
                )}
              </Button>
            </div>
          )}

          {/* Competitor result */}
          {result && !loading && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">{result.competitorName}</h3>
                <Badge variant="secondary" className="text-[10px]">
                  {result.overall.appearance_rate === 0 ? "Not Found" : "Competitor Analysis"}
                </Badge>
              </div>

              {result.overall.appearance_rate === 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-destructive">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm font-semibold">Zero AI Visibility</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    AI engines do not currently recommend <strong>{result.competitorName}</strong> for any of the {Object.keys(result.perSegment).length} segment{Object.keys(result.perSegment).length !== 1 ? "s" : ""} tested.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-secondary/50 rounded-md p-2.5 text-center">
                  <div className="text-lg font-bold">{Math.round(result.overall.appearance_rate * 100)}%</div>
                  <div className="text-[10px] text-muted-foreground">Appearance</div>
                </div>
                <div className="bg-secondary/50 rounded-md p-2.5 text-center">
                  <div className="text-lg font-bold">{Math.round(result.overall.primary_rate * 100)}%</div>
                  <div className="text-[10px] text-muted-foreground">Top 3</div>
                </div>
                <div className="bg-secondary/50 rounded-md p-2.5 text-center">
                  <div className="text-lg font-bold">{result.overall.avg_rank !== null ? `#${result.overall.avg_rank}` : "—"}</div>
                  <div className="text-[10px] text-muted-foreground">Avg Rank</div>
                </div>
              </div>

              {Object.keys(result.overall.engine_breakdown || {}).length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                    <BarChart3 className="w-3 h-3" />By Engine
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(result.overall.engine_breakdown).map(([engine, data]: [string, any]) => (
                      <div key={engine} className="bg-secondary/30 rounded-md p-2 text-center">
                        <div className="text-[10px] text-muted-foreground capitalize mb-1">{engine}</div>
                        <div className="text-sm font-semibold">{Math.round(data.appearance_rate * 100)}%</div>
                        <div className="text-[10px] text-muted-foreground">Top 3: {Math.round(data.primary_rate * 100)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Per-segment comparison */}
              {Object.keys(result.perSegment).length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                    <BarChart3 className="w-3 h-3" />You vs {result.competitorName}
                  </h4>
                  <div className="border rounded-md overflow-hidden text-xs">
                    <div className="grid grid-cols-[1fr_100px_100px] px-3 py-2 bg-secondary/30 text-[10px] font-medium text-muted-foreground">
                      <span>Segment</span>
                      <span className="text-center">You</span>
                      <span className="text-center">{result.competitorName}</span>
                    </div>
                    {Object.entries(result.perSegment).map(([label, segData]: [string, any]) => {
                      const brandSeg = segments.find((s) => s.label === label.split(" · ")[0]);
                      const myRate = brandSeg?.scoringResult?.score?.appearance_rate ?? null;
                      const theirRate = segData.appearance_rate ?? 0;
                      const iWin = myRate !== null && myRate > theirRate;
                      const theyWin = theirRate > (myRate ?? 0);
                      return (
                        <div key={label} className="grid grid-cols-[1fr_100px_100px] px-3 py-2 border-t items-center">
                          <span className="truncate">{label}</span>
                          <span className={`text-center font-medium ${iWin ? "text-green-600 dark:text-green-400" : ""}`}>
                            {myRate !== null ? `${Math.round(myRate * 100)}%` : "—"}
                          </span>
                          <span className={`text-center font-medium ${theyWin ? "text-green-600 dark:text-green-400" : ""}`}>
                            {theirRate === 0 ? <span className="text-muted-foreground/60">~0%</span> : `${Math.round(theirRate * 100)}%`}
                          </span>
                        </div>
                      );
                    })}
                    <div className="grid grid-cols-[1fr_100px_100px] px-3 py-2 border-t bg-secondary/20 text-xs font-semibold items-center">
                      <span>Overall</span>
                      <span className={`text-center ${avgBrandRate > result.overall.appearance_rate ? "text-green-600 dark:text-green-400" : ""}`}>
                        {Math.round(avgBrandRate * 100)}%
                      </span>
                      <span className={`text-center ${result.overall.appearance_rate > avgBrandRate ? "text-green-600 dark:text-green-400" : ""}`}>
                        {Math.round(result.overall.appearance_rate * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {result.strongestClusters?.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3" />Strongest Prompt Types
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.strongestClusters.filter((c: any) => c.rate > 0).slice(0, 6).map((c: any) => (
                      <Badge key={c.cluster} variant="secondary" className="text-[10px]">
                        {c.cluster}: {Math.round(c.rate * 100)}% ({c.appearances})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {result.verbatimQuotes?.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                    <FileText className="w-3 h-3" />What AI Engines Say About {result.competitorName}
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {result.verbatimQuotes.map((q: any, i: number) => (
                      <div key={i} className="bg-secondary/30 rounded-md p-2 text-xs">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Badge variant="outline" className="text-[9px] py-0">
                            {q.engine === "chatgpt" ? "ChatGPT" : q.engine === "claude" ? "Claude" : "Gemini"}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground italic">"{q.sentence}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generate full report */}
              <div className="pt-3 border-t mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { if (reportData) setReportOpen(!reportOpen); else generateReport(); }}
                  disabled={reportLoading}
                  data-testid="button-pnc-competitor-full-report"
                  className="w-full"
                >
                  {reportLoading ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Generating Report...</>
                  ) : reportData ? (
                    <><FileText className="w-3.5 h-3.5 mr-1.5" />{reportOpen ? "Hide Full Report" : "Show Full Report"}</>
                  ) : (
                    <><FileText className="w-3.5 h-3.5 mr-1.5" />Generate Full Report for {result.competitorName}</>
                  )}
                </Button>
              </div>

              {reportOpen && reportData && (
                <div className="mt-4 space-y-4" data-testid="pnc-competitor-full-report">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Full GEO Report — {reportData.meta?.brandName}
                    </h3>
                    <Badge variant="secondary" className="text-[10px]">
                      {reportData.meta?.segmentCount} segments · {reportData.meta?.totalRuns} runs
                    </Badge>
                  </div>
                  {reportData.meta?.zeroVisibility && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2 text-destructive">
                        <Eye className="w-4 h-4" />
                        <span className="text-sm font-semibold">0% AI Visibility</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        When potential customers ask AI about these services, <strong>{reportData.meta.brandName}</strong> doesn't come up.
                      </p>
                    </div>
                  )}
                  {reportData.section1 && <Section1 data={reportData.section1} />}
                  {reportData.section2 && <Section2 data={reportData.section2} brandName={reportData.meta?.brandName || selected} />}
                  {reportData.competitorPlaybook && <CompetitorPlaybookSection data={reportData.competitorPlaybook} brandName={reportData.meta?.brandName || selected} />}
                  {reportData.section3 && <Section3 data={reportData.section3} />}
                  {reportData.appendix && <AppendixSection data={reportData.appendix} />}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default function PncCreator() {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [tab, setTab] = useState<"v1" | "v2">("v1");
  const [err, setErr] = useState("");

  const [v1Loading, setV1Loading] = useState(false);
  const [v1LoaderMsg, setV1LoaderMsg] = useState("Fetching website\u2026");
  const [v1Loaded, setV1Loaded] = useState(false);
  const [blocks, setBlocks] = useState<Blocks>(makeDefaultBlocks());
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [locMode, setLocMode] = useState<"city" | "country" | "global">("city");
  const [locCity, setLocCity] = useState("");
  const [locCountry, setLocCountry] = useState("");
  const [custToggle, setCustToggle] = useState(false);
  const [addInputs, setAddInputs] = useState<Record<number, string>>({ 1: "", 2: "", 3: "", 4: "" });
  const [v1Generating, setV1Generating] = useState(false);
  const [v1GenMsg, setV1GenMsg] = useState("Curating best combinations\u2026");
  const [v1Prompts, setV1Prompts] = useState<Prompt[]>([]);

  const [v2LocMode, setV2LocMode] = useState<"city" | "country" | "global">("city");
  const [v2LocCity, setV2LocCity] = useState("");
  const [v2LocCountry, setV2LocCountry] = useState("");
  const [v2Loading, setV2Loading] = useState(false);
  const [v2LoaderMsg, setV2LoaderMsg] = useState("Reading website\u2026");
  const [v2Result, setV2Result] = useState<V2Result | null>(null);
  const [v2View, setV2View] = useState<"service" | "customer">("service");

  const [costs, setCosts] = useState<CostEntry[]>([]);

  const [pncBrandName, setPncBrandName] = useState("");
  const [pncBrandDomain, setPncBrandDomain] = useState("");
  const [pncEngines, setPncEngines] = useState<Set<string>>(new Set(["chatgpt", "gemini", "claude"]));
  const [pncSegments, setPncSegments] = useState<PncAnalysisSegment[]>([]);
  const [pncAnalysisErr, setPncAnalysisErr] = useState("");
  const [pncV2SessionId, setPncV2SessionId] = useState<number | null>(null);

  const [v1BrandName, setV1BrandName] = useState("");
  const [v1BrandDomain, setV1BrandDomain] = useState("");
  const [v1Engines, setV1Engines] = useState<Set<string>>(new Set(["chatgpt", "gemini", "claude"]));
  const [v1AnalysisSegment, setV1AnalysisSegment] = useState<PncAnalysisSegment | null>(null);
  const [v1AnalysisErr, setV1AnalysisErr] = useState("");
  const [pncV1SessionId, setPncV1SessionId] = useState<number | null>(null);

  const [v2CacheTs, setV2CacheTs] = useState<number | null>(null);
  const [v1CacheTs, setV1CacheTs] = useState<number | null>(null);

  type V3Chip = { label: string; rank: number; why: string; on: boolean };
  type V3Competitor = { name: string; location: string; known_for: string };
  const [v3Step, setV3Step] = useState<"classify" | "confirm" | "prompts">("classify");
  const [v3Loading, setV3Loading] = useState(false);
  const [v3Generating, setV3Generating] = useState(false);
  const [v3Err, setV3Err] = useState("");
  const [v3BizCard, setV3BizCard] = useState<{ name: string; category: string; description: string; model: string } | null>(null);
  const [v3Services, setV3Services] = useState<V3Chip[]>([]);
  const [v3Customers, setV3Customers] = useState<V3Chip[]>([]);
  const [v3Scope, setV3Scope] = useState<"city" | "country" | "region" | "global">("city");
  const [v3ScopeConf, setV3ScopeConf] = useState<"high" | "medium" | "low">("medium");
  const [v3ScopeReason, setV3ScopeReason] = useState("");
  const [v3ScopeSignals, setV3ScopeSignals] = useState<string[]>([]);
  const [v3LocCity, setV3LocCity] = useState("");
  const [v3LocCountry, setV3LocCountry] = useState("");
  const [v3LocRegion, setV3LocRegion] = useState("");
  const [v3Competitors, setV3Competitors] = useState<V3Competitor[]>([]);
  const [v3Result, setV3Result] = useState<V2Result | null>(null);
  const [v3Segments, setV3Segments] = useState<PncAnalysisSegment[]>([]);
  const [v3BrandName, setV3BrandName] = useState("");
  const [v3BrandDomain, setV3BrandDomain] = useState("");
  const [v3Engines, setV3Engines] = useState<Set<string>>(new Set(["chatgpt", "gemini", "claude"]));
  const [v3SessionId, setV3SessionId] = useState<number | null>(null);
  const [v3AnalysisErr, setV3AnalysisErr] = useState("");
  const [v3SvcAdd, setV3SvcAdd] = useState("");
  const [v3CustAdd, setV3CustAdd] = useState("");
  const [v3PanelView, setV3PanelView] = useState<"service" | "customer">("service");

  useEffect(() => {
    if (!v2Result) return;
    const serviceSegs: PncAnalysisSegment[] = v2Result.by_service.map((g, i) => ({
      id: `svc_${i}`,
      type: "service",
      label: g.service,
      prompts: g.prompts.map((p, pi) => ({ id: buildPromptId(`svc${i}`, pi), text: p.text })),
      selected: true,
      isScoring: false,
      scoringResult: null,
    }));
    const customerSegs: PncAnalysisSegment[] = v2Result.by_customer.map((g, i) => ({
      id: `cust_${i}`,
      type: "customer",
      label: g.customer,
      prompts: g.prompts.map((p, pi) => ({ id: buildPromptId(`cust${i}`, pi), text: p.text })),
      selected: false,
      isScoring: false,
      scoringResult: null,
    }));
    setPncSegments([...serviceSegs, ...customerSegs]);
    if (v2Result.business_name) setPncBrandName(v2Result.business_name);
    if (url) setPncBrandDomain(extractDomain(url));
  }, [v2Result]);

  useEffect(() => {
    if (url) {
      setV1BrandDomain(extractDomain(url));
      setPncBrandDomain(extractDomain(url));
    }
  }, [url]);

  useEffect(() => {
    const domain = pncBrandDomain.trim();
    const cached = loadPncV2(domain);
    setV2CacheTs(cached ? cached.timestamp : null);
  }, [pncBrandDomain]);

  useEffect(() => {
    const domain = v1BrandDomain.trim();
    const cached = loadPncV1(domain);
    setV1CacheTs(cached ? cached.timestamp : null);
  }, [v1BrandDomain]);

  function getLoc(mode: string, city: string, country: string) {
    if (mode === "global") return "globally";
    if (mode === "city") return city ? `in ${city}` : "in [city]";
    return country ? `in ${country}` : "in [country]";
  }
  const v1GetLoc = () => getLoc(locMode, locCity, locCountry);
  const v2GetLoc = () => getLoc(v2LocMode, v2LocCity, v2LocCountry);

  const toggleChip = (n: 1 | 2 | 3 | 4, i: number) => {
    setBlocks((prev) => ({ ...prev, [n]: prev[n].map((c, idx) => idx === i ? { ...c, on: !c.on } : c) }));
  };

  const toggleAll = (n: 1 | 2 | 3 | 4) => {
    setBlocks((prev) => {
      const allOn = prev[n].every((c) => c.on);
      return { ...prev, [n]: prev[n].map((c) => ({ ...c, on: !allOn })) };
    });
  };

  const addChip = (n: 1 | 2 | 3 | 4) => {
    const val = (addInputs[n] || "").trim();
    if (!val) return;
    setBlocks((prev) => ({ ...prev, [n]: [...prev[n], { label: val, on: true }] }));
    setAddInputs((prev) => ({ ...prev, [n]: "" }));
    if (v1Prompts.length) v1Generate();
  };

  const v1Extract = async () => {
    if (!url) { setErr("Please enter a URL first."); return; }
    if (!url.startsWith("http")) { setErr("URL must start with https://"); return; }
    setErr(""); setV1Loaded(false); setV1Loading(true);
    const steps = ["Fetching website\u2026", "Reading services\u2026", "Identifying customer types\u2026", "Building blocks\u2026"];
    let si = 0;
    setV1LoaderMsg(steps[0]);
    const iv = setInterval(() => { si = (si + 1) % steps.length; setV1LoaderMsg(steps[si]); }, 2000);
    try {
      const res = await fetch("/api/pnc/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      clearInterval(iv);
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || "API error " + res.status); }
      const data = await res.json();
      setBlocks({
        1: (data.business_type_variants || []).map((v: string) => ({ label: v, on: true })),
        2: (data.service_types || []).map((v: string) => ({ label: v, on: true })),
        3: (data.customer_types || []).map((v: string) => ({ label: v, on: true })),
        4: DEFAULT_QUALIFIERS.map((v) => ({ label: v, on: true })),
      });
      setCompetitors(data.competitors || []);
      setLocCity(data.city || "");
      setLocCountry(data.country || "");
      setV2LocCity(data.city || "");
      setV2LocCountry(data.country || "");
      if (data._cost) setCosts((prev) => [...prev, { label: "Extract blocks (web search)", ...data._cost }]);
      setV1Loading(false);
      setV1Loaded(true);
    } catch (e: any) {
      clearInterval(iv);
      setV1Loading(false);
      setErr("Error: " + (e.message || "Something went wrong."));
    }
  };

  const v1Generate = async () => {
    const b1 = blocks[1].filter((c) => c.on).map((c) => c.label);
    const b2 = blocks[2].filter((c) => c.on).map((c) => c.label);
    const b3 = blocks[3].filter((c) => c.on).map((c) => c.label);
    const b4 = blocks[4].filter((c) => c.on).map((c) => c.label);
    const loc = v1GetLoc();
    setErr(""); setV1Prompts([]); setV1Generating(true); setV1AnalysisSegment(null);
    const steps = ["Curating best combinations\u2026", "Applying qualifiers\u2026", "Writing prompts\u2026"];
    let si = 0;
    setV1GenMsg(steps[0]);
    const iv = setInterval(() => { si = (si + 1) % steps.length; setV1GenMsg(steps[si]); }, 1800);
    try {
      const res = await fetch("/api/pnc/v1-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ b1, b2, b3, b4, inclCust: custToggle, loc }),
      });
      clearInterval(iv);
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || "API error"); }
      const data = await res.json();
      setV1Prompts(data.prompts || []);
      if (data._cost) setCosts((prev) => [...prev, { label: "Generate prompts (Block Builder)", ...data._cost }]);
      setV1Generating(false);
    } catch (e: any) {
      clearInterval(iv);
      setV1Generating(false);
      setErr("Error: " + (e.message || "Please try again."));
    }
  };

  const v2Generate = async () => {
    if (!url) { setErr("Please enter a URL first."); return; }
    if (!url.startsWith("http")) { setErr("URL must start with https://"); return; }
    const loc = v2GetLoc();
    setErr(""); setV2Result(null); setV2Loading(true); setPncSegments([]);
    const steps = ["Reading website\u2026", "Identifying services & customers\u2026", "Writing grouped prompts\u2026", "Grouping by service & customer\u2026"];
    let si = 0;
    setV2LoaderMsg(steps[0]);
    const iv = setInterval(() => { si = (si + 1) % steps.length; setV2LoaderMsg(steps[si]); }, 2200);
    try {
      const res = await fetch("/api/pnc/v2-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, loc }),
      });
      clearInterval(iv);
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || "API error " + res.status); }
      const data = await res.json();
      if (data._cost) setCosts((prev) => [...prev, { label: "Auto Groups (web search)", ...data._cost }]);
      setV2Loading(false);
      setV2Result(data);
    } catch (e: any) {
      clearInterval(iv);
      setV2Loading(false);
      setErr("Error: " + (e.message || "Something went wrong."));
    }
  };

  const { data: allSessions } = useQuery<MultiSegmentSession[]>({
    queryKey: ["/api/multisegment/sessions"],
  });
  const pncSessions = (allSessions || []).filter(
    (s) => s.sessionType === "pnc_v2" || s.sessionType === "pnc_v1"
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const saveV2SessionToDB = async (segments: PncAnalysisSegment[], brandName: string, brandDomain: string, engines: Set<string>, currentSessionId: number | null): Promise<number | null> => {
    try {
      const segmentsPayload = segments.map((s) => ({
        id: s.id,
        type: s.type,
        label: s.label,
        persona: "pnc",
        seedType: s.type === "service" ? "providers" : "customers",
        serviceType: s.type === "service" ? s.label : "",
        customerType: s.type === "customer" ? s.label : "",
        prompts: s.prompts,
        scoringResult: s.scoringResult,
        selected: s.selected,
      }));
      if (currentSessionId) {
        await apiRequest("PATCH", `/api/multisegment/sessions/${currentSessionId}/segments`, { segments: segmentsPayload });
        queryClient.invalidateQueries({ queryKey: ["/api/multisegment/sessions"] });
        return currentSessionId;
      } else {
        const res = await apiRequest("POST", "/api/multisegment/sessions", {
          brandName: brandName || "PNC Analysis",
          brandDomain: brandDomain || null,
          promptsPerSegment: 3,
          segments: segmentsPayload,
          sessionType: "pnc_v2",
        });
        const created = await res.json();
        queryClient.invalidateQueries({ queryKey: ["/api/multisegment/sessions"] });
        return created.id;
      }
    } catch {
      return currentSessionId;
    }
  };

  const saveV1SessionToDB = async (segment: PncAnalysisSegment, brandName: string, brandDomain: string, currentSessionId: number | null): Promise<number | null> => {
    try {
      const segmentsPayload = [{
        id: segment.id,
        type: segment.type,
        label: segment.label,
        persona: "pnc",
        seedType: "providers",
        serviceType: "",
        customerType: "",
        prompts: segment.prompts,
        scoringResult: segment.scoringResult,
        selected: true,
      }];
      if (currentSessionId) {
        await apiRequest("PATCH", `/api/multisegment/sessions/${currentSessionId}/segments`, { segments: segmentsPayload });
        queryClient.invalidateQueries({ queryKey: ["/api/multisegment/sessions"] });
        return currentSessionId;
      } else {
        const res = await apiRequest("POST", "/api/multisegment/sessions", {
          brandName: brandName || "PNC Block Builder",
          brandDomain: brandDomain || null,
          promptsPerSegment: 3,
          segments: segmentsPayload,
          sessionType: "pnc_v1",
        });
        const created = await res.json();
        queryClient.invalidateQueries({ queryKey: ["/api/multisegment/sessions"] });
        return created.id;
      }
    } catch {
      return currentSessionId;
    }
  };

  const loadPncSession = (session: MultiSegmentSession) => {
    const rawSegs = Array.isArray(session.segments) ? session.segments as any[] : [];
    if (session.sessionType === "pnc_v1") {
      const seg = rawSegs[0];
      if (!seg) return;
      setTab("v1");
      setV1BrandName(session.brandName);
      setV1BrandDomain(session.brandDomain || "");
      setUrl(session.brandDomain || "");
      const restoredSeg: PncAnalysisSegment = {
        id: seg.id || "v1_all",
        type: seg.type || "service",
        label: seg.label || "Block Builder",
        prompts: seg.prompts || [],
        selected: true,
        isScoring: false,
        scoringResult: seg.scoringResult || null,
      };
      setV1AnalysisSegment(restoredSeg);
      setV1Loaded(true);
      setPncV1SessionId(session.id);
    } else {
      setTab("v2");
      setPncBrandName(session.brandName);
      setPncBrandDomain(session.brandDomain || "");
      setUrl(session.brandDomain || "");
      const segs: PncAnalysisSegment[] = rawSegs.map((s: any) => ({
        id: s.id || `seg-${Math.random().toString(36).slice(2, 8)}`,
        type: (s.type as "service" | "customer") || "service",
        label: s.label || "",
        prompts: s.prompts || [],
        selected: s.selected !== false,
        isScoring: false,
        scoringResult: s.scoringResult || null,
      }));
      setPncSegments(segs);
      setPncV2SessionId(session.id);
    }
  };

  const runPncSegment = async (segId: string) => {
    const seg = pncSegments.find((s) => s.id === segId);
    if (!seg) return;
    setPncSegments((prev) => prev.map((s) => s.id === segId ? { ...s, isScoring: true, scoringResult: null } : s));
    setPncAnalysisErr("");
    try {
      const res = await apiRequest("POST", "/api/scoring/run", {
        prompts: seg.prompts,
        brand_name: pncBrandName.trim(),
        brand_domain: pncBrandDomain.trim() || undefined,
        mode: "full",
        source: "pnc",
        engines: Array.from(pncEngines),
        profile: {
          persona: "pnc",
          seedType: "providers",
          services: seg.type === "service" ? [seg.label] : [],
          verticals: seg.type === "customer" ? [seg.label] : [],
          geo: v2LocCity || v2LocCountry || null,
        },
      });
      const data = await res.json() as ScoringResponse;
      setPncSegments((prev) => {
        const updated = prev.map((s) => s.id === segId ? { ...s, isScoring: false, scoringResult: data } : s);
        const domain = pncBrandDomain.trim();
        savePncV2(domain, updated, pncBrandName, domain, pncEngines);
        setV2CacheTs(Date.now());
        saveV2SessionToDB(updated, pncBrandName, domain, pncEngines, pncV2SessionId).then((newId) => {
          if (newId && newId !== pncV2SessionId) setPncV2SessionId(newId);
        });
        return updated;
      });
      if (data.cost?.total_cost_usd) {
        setCosts((prev) => [...prev, {
          label: `Analysis: ${seg.label}`,
          input_tokens: 0,
          output_tokens: 0,
          cost_usd: data.cost.total_cost_usd,
        }]);
      }
    } catch (e: any) {
      setPncSegments((prev) => prev.map((s) => s.id === segId ? { ...s, isScoring: false } : s));
      setPncAnalysisErr("Error: " + (e.message || "Scoring failed."));
    }
  };

  const runV1AnalysisSegment = async () => {
    if (!v1Prompts.length) return;
    const seg: PncAnalysisSegment = {
      id: "v1_all",
      type: "service",
      label: "Block Builder",
      prompts: v1Prompts.map((p, i) => ({ id: buildPromptId("v1", i), text: p.text })),
      selected: true,
      isScoring: true,
      scoringResult: null,
    };
    setV1AnalysisSegment({ ...seg, isScoring: true });
    setV1AnalysisErr("");
    try {
      const res = await apiRequest("POST", "/api/scoring/run", {
        prompts: seg.prompts,
        brand_name: v1BrandName.trim(),
        brand_domain: v1BrandDomain.trim() || undefined,
        mode: "full",
        source: "pnc",
        engines: Array.from(v1Engines),
        profile: {
          persona: "pnc",
          seedType: "providers",
          services: [],
          verticals: [],
          geo: locCity || locCountry || null,
        },
      });
      const data = await res.json() as ScoringResponse;
      const completedSeg = { ...seg, isScoring: false, scoringResult: data };
      setV1AnalysisSegment(completedSeg);
      const domain = v1BrandDomain.trim();
      savePncV1(domain, completedSeg, v1BrandName, domain, v1Engines);
      setV1CacheTs(Date.now());
      saveV1SessionToDB(completedSeg, v1BrandName, domain, pncV1SessionId).then((newId) => {
        if (newId && newId !== pncV1SessionId) setPncV1SessionId(newId);
      });
      if (data.cost?.total_cost_usd) {
        setCosts((prev) => [...prev, {
          label: "Analysis: Block Builder",
          input_tokens: 0,
          output_tokens: 0,
          cost_usd: data.cost.total_cost_usd,
        }]);
      }
    } catch (e: any) {
      setV1AnalysisSegment({ ...seg, isScoring: false });
      setV1AnalysisErr("Error: " + (e.message || "Scoring failed."));
    }
  };

  const v3GetLoc = () => {
    if (v3Scope === "global") return "globally";
    if (v3Scope === "city") return v3LocCity ? `in ${v3LocCity}` : "in [city]";
    if (v3Scope === "country") return v3LocCountry ? `in ${v3LocCountry}` : "in [country]";
    return v3LocRegion ? `in the ${v3LocRegion}` : "in [region]";
  };

  const parseV3Ranked = (arr: any[]): { label: string; rank: number; why: string; on: boolean }[] => {
    if (!arr?.length) return [];
    const items = arr.map((v) =>
      typeof v === "string" ? { label: v, rank: 99, why: "", on: true } : { label: v.label || v, rank: v.rank || 99, why: v.why || "", on: true }
    );
    items.sort((a, b) => a.rank - b.rank);
    items.forEach((item, i) => { item.on = i < 5; });
    return items;
  };

  const handleV3Classify = async () => {
    const u = url.trim();
    if (!u) { setV3Err("Enter a URL first."); return; }
    const target = /^https?:\/\//i.test(u) ? u : `https://${u}`;
    setV3Err(""); setV3Loading(true); setV3Step("classify");
    setV3BizCard(null); setV3Services([]); setV3Customers([]); setV3Competitors([]);
    setV3Result(null); setV3Segments([]); setV3SessionId(null);
    try {
      const res = await fetch("/api/pnc/classify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Classification failed");
      if (data._cost) setCosts((prev) => [...prev, { label: "Guided: Classify", input_tokens: 0, output_tokens: 0, cost_usd: data._cost.cost_usd }]);
      setV3BizCard({ name: data.business_name || "", category: data.business_category || "", description: data.business_description || "", model: data.business_model || "" });
      setV3Services(parseV3Ranked(data.service_types || []));
      setV3Customers(parseV3Ranked(data.customer_types || []));
      setV3Scope(data.scope || "city");
      setV3ScopeConf(data.scope_confidence || "medium");
      setV3ScopeReason(data.scope_reason || "");
      setV3ScopeSignals(data.scope_signals || []);
      setV3LocCity(data.city || ""); setV3LocCountry(data.country || ""); setV3LocRegion(data.region || "");
      setV3Competitors(data.competitors || []);
      setV3BrandName(data.business_name || "");
      setV3BrandDomain(extractDomain(target));
      setV3Step("confirm");
    } catch (e: any) {
      setV3Err("Error: " + (e.message || "Something went wrong."));
    } finally {
      setV3Loading(false);
    }
  };

  const handleV3Generate = async () => {
    const enabledSvcs = v3Services.filter((s) => s.on).map((s) => s.label);
    const enabledCusts = v3Customers.filter((c) => c.on).map((c) => c.label);
    if (!enabledSvcs.length && !enabledCusts.length) { setV3Err("Enable at least one service or customer type."); return; }
    setV3Err(""); setV3Generating(true);
    try {
      const loc = v3GetLoc();
      const res = await fetch("/api/pnc/classify-generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services: enabledSvcs, customers: enabledCusts, loc, url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Generation failed");
      if (data._cost) setCosts((prev) => [...prev, { label: "Guided: Generate", input_tokens: 0, output_tokens: 0, cost_usd: data._cost.cost_usd }]);
      setV3Result(data);
      const loc2 = v3GetLoc();
      const serviceSegs: PncAnalysisSegment[] = (data.by_service || []).map((g: any, i: number) => ({
        id: `v3svc_${i}`, type: "service" as const, label: g.service,
        prompts: g.prompts.map((p: any, pi: number) => ({ id: buildPromptId(`v3svc${i}`, pi), text: p.text })),
        selected: true, isScoring: false, scoringResult: null,
      }));
      const custSegs: PncAnalysisSegment[] = (data.by_customer || []).map((g: any, i: number) => ({
        id: `v3cust_${i}`, type: "customer" as const, label: g.customer,
        prompts: g.prompts.map((p: any, pi: number) => ({ id: buildPromptId(`v3cust${i}`, pi), text: p.text })),
        selected: true, isScoring: false, scoringResult: null,
      }));
      setV3Segments([...serviceSegs, ...custSegs]);
      setV3Step("prompts");
    } catch (e: any) {
      setV3Err("Error: " + (e.message || "Generation failed."));
    } finally {
      setV3Generating(false);
    }
  };

  const runV3Segment = async (segId: string) => {
    const seg = v3Segments.find((s) => s.id === segId);
    if (!seg) return;
    setV3Segments((prev) => prev.map((s) => s.id === segId ? { ...s, isScoring: true, scoringResult: null } : s));
    setV3AnalysisErr("");
    try {
      const res = await apiRequest("POST", "/api/scoring/run", {
        prompts: seg.prompts, brand_name: v3BrandName.trim(),
        brand_domain: v3BrandDomain.trim() || undefined,
        mode: "full", source: "pnc", engines: Array.from(v3Engines),
        profile: {
          persona: "pnc", seedType: seg.type === "service" ? "providers" : "customers",
          services: seg.type === "service" ? [seg.label] : [],
          verticals: seg.type === "customer" ? [seg.label] : [],
          geo: v3LocCity || v3LocCountry || null,
        },
      });
      const data = await res.json() as ScoringResponse;
      setV3Segments((prev) => {
        const updated = prev.map((s) => s.id === segId ? { ...s, isScoring: false, scoringResult: data } : s);
        saveV2SessionToDB(updated, v3BrandName, v3BrandDomain, v3Engines, v3SessionId).then((newId) => {
          if (newId && newId !== v3SessionId) setV3SessionId(newId);
        });
        return updated;
      });
      if (data.cost?.total_cost_usd) {
        setCosts((prev) => [...prev, { label: `Guided: ${seg.label}`, input_tokens: 0, output_tokens: 0, cost_usd: data.cost.total_cost_usd }]);
      }
    } catch (e: any) {
      setV3Segments((prev) => prev.map((s) => s.id === segId ? { ...s, isScoring: false } : s));
      setV3AnalysisErr("Error: " + (e.message || "Scoring failed."));
    }
  };

  const runAllV3 = async () => {
    for (const seg of v3Segments.filter((s) => s.selected)) {
      await runV3Segment(seg.id);
    }
  };

  const runAllSelectedPnc = async () => {
    const selected = pncSegments.filter((s) => s.selected);
    for (const seg of selected) {
      await runPncSegment(seg.id);
    }
  };

  const applyV2Cache = () => {
    const domain = pncBrandDomain.trim();
    const cached = loadPncV2(domain);
    if (!cached) return;
    setPncSegments(cached.segments.map((s) => ({ ...s, isScoring: false })));
    setPncBrandName(cached.brandName);
    setPncEngines(new Set(cached.engines));
    if (!pncV2SessionId) {
      const match = pncSessions.find(
        (s) => s.sessionType === "pnc_v2" && (
          s.brandDomain === domain ||
          s.brandName?.toLowerCase() === cached.brandName?.toLowerCase()
        )
      );
      if (match) setPncV2SessionId(match.id);
    }
  };

  const applyV1Cache = () => {
    const domain = v1BrandDomain.trim();
    const cached = loadPncV1(domain);
    if (!cached) return;
    setV1AnalysisSegment({ ...cached.segment, isScoring: false });
    setV1BrandName(cached.brandName);
    setV1Engines(new Set(cached.engines));
    if (!pncV1SessionId) {
      const match = pncSessions.find(
        (s) => s.sessionType === "pnc_v1" && (
          s.brandDomain === domain ||
          s.brandName?.toLowerCase() === cached.brandName?.toLowerCase()
        )
      );
      if (match) setPncV1SessionId(match.id);
    }
  };

  const toggleEngine = (engines: Set<string>, setEngines: (e: Set<string>) => void, engine: string) => {
    const next = new Set(engines);
    if (next.has(engine)) { if (next.size > 1) next.delete(engine); }
    else next.add(engine);
    setEngines(next);
  };

  const handleExtractClick = () => { if (tab === "v1") v1Extract(); else v2Generate(); };

  const blockMeta: Record<number, { title: string; sub: string; placeholder: string }> = {
    1: { title: "Business type variants", sub: "Different ways to describe what this business is.", placeholder: "Add variant\u2026" },
    2: { title: "Service type variants", sub: "Each service offered.", placeholder: "Add service\u2026" },
    3: { title: "Customer type variants", sub: "Who searches for this.", placeholder: "Add customer type\u2026" },
    4: { title: "Qualifiers", sub: "What makes this business stand out.", placeholder: "Add qualifier\u2026" },
  };

  const summary = () => {
    const b1 = blocks[1].filter((c) => c.on).length;
    const b2 = blocks[2].filter((c) => c.on).length;
    const b3 = blocks[3].filter((c) => c.on).length;
    const b4 = blocks[4].filter((c) => c.on).length;
    return { b1, b2, b3, b4, loc: v1GetLoc() };
  };

  const renderBlock = (n: 1 | 2 | 3 | 4) => {
    const colors = blockColors(n);
    const meta = blockMeta[n];
    const chips = blocks[n];
    const allOn = chips.length > 0 && chips.every((c) => c.on);
    return (
      <div key={n} className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2.5">
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono flex-shrink-0 ${colors.num}`}>{n}</span>
          <span className="text-xs font-semibold tracking-wide">{meta.title}</span>
          <button type="button" className="ml-auto text-[10px] px-2.5 py-0.5 border border-border rounded-full text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors whitespace-nowrap" onClick={() => toggleAll(n)}>
            {allOn ? "Deselect all" : "Select all"}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground mb-2.5 leading-relaxed">{meta.sub}</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {chips.map((c, i) => (
            <span
              key={i}
              onClick={() => toggleChip(n, i)}
              className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border cursor-pointer select-none transition-all ${c.on ? colors.chipOn : "border-border bg-card text-muted-foreground hover:border-muted-foreground hover:text-foreground"}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.dot}`} style={c.on ? { opacity: 0.5 } : {}} />
              {c.label}
            </span>
          ))}
        </div>
        {n === 3 && (
          <div className="flex items-center gap-2.5 mt-1 mb-2">
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input type="checkbox" className="sr-only" checked={custToggle} onChange={(e) => setCustToggle(e.target.checked)} />
              <div className={`w-8 h-4 rounded-full border transition-colors ${custToggle ? "bg-lime-400 border-lime-400" : "bg-card border-border"}`} />
              <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full transition-transform ${custToggle ? "translate-x-4 bg-black" : "bg-muted-foreground"}`} />
            </label>
            <span className="text-[11px] text-muted-foreground">Include customer type in prompts</span>
          </div>
        )}
        <div className="flex gap-1.5 mt-1">
          <input
            className="flex-1 bg-muted/30 border border-border rounded text-[11px] px-2.5 h-7 text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-muted-foreground transition-colors"
            placeholder={meta.placeholder}
            value={addInputs[n]}
            onChange={(e) => setAddInputs((prev) => ({ ...prev, [n]: e.target.value }))}
            onKeyDown={(e) => { if (e.key === "Enter") addChip(n); }}
          />
          <button type="button" className="h-7 px-3 bg-card border border-border rounded text-[11px] text-muted-foreground hover:border-muted-foreground hover:text-foreground transition-colors whitespace-nowrap" onClick={() => addChip(n)}>
            + Add
          </button>
        </div>
      </div>
    );
  };

  const renderLocationBlock = (
    mode: "city" | "country" | "global",
    setMode: (m: "city" | "country" | "global") => void,
    city: string, setCity: (v: string) => void,
    country: string, setCountry: (v: string) => void,
    onLocChange?: () => void
  ) => (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between flex-wrap gap-2.5 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono bg-orange-900/40 text-orange-300">Z</span>
            <span className="text-xs font-semibold tracking-wide">Location</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Toggle scope — prompts update automatically</p>
        </div>
        <div className="flex gap-1.5">
          {(["city", "country", "global"] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={`text-[12px] px-3.5 py-1 border rounded-full transition-all capitalize ${mode === m ? "bg-lime-400/10 border-lime-400 text-lime-400" : "border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground"}`}
              onClick={() => { setMode(m); if (onLocChange) onLocChange(); }}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {mode !== "global" && (
        <div className="flex gap-2 flex-wrap mt-2">
          <div>
            <div className="text-[10px] text-muted-foreground/50 font-mono mb-1">CITY</div>
            <input className="bg-muted/30 border border-border rounded text-[11px] px-2.5 h-7 w-36 text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-muted-foreground" placeholder="e.g. Dubai" value={city} onChange={(e) => setCity(e.target.value)} onBlur={onLocChange} />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground/50 font-mono mb-1">COUNTRY</div>
            <input className="bg-muted/30 border border-border rounded text-[11px] px-2.5 h-7 w-36 text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-muted-foreground" placeholder="e.g. UAE" value={country} onChange={(e) => setCountry(e.target.value)} onBlur={onLocChange} />
          </div>
        </div>
      )}
    </div>
  );

  const renderPromptRow = (p: Prompt, i: number) => {
    const cleanText = p.text.replace(/^(Find|List|Rank)\s+/i, "");
    const fullText = `Find, List and Rank 10 ${cleanText}`;
    return (
      <div key={i} className="flex items-start gap-2.5 bg-card border border-border rounded-xl px-3.5 py-2.5 hover:border-muted-foreground/50 transition-colors">
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0 bg-lime-400/10 text-lime-400 whitespace-nowrap">Find, List and Rank 10</span>
        <span className="flex-1 text-[13px] font-mono leading-relaxed">{cleanText}</span>
        <button type="button" className="text-[10px] px-2 py-0.5 border border-border rounded text-muted-foreground hover:border-lime-400 hover:text-lime-400 transition-colors flex-shrink-0 mt-0.5" onClick={(e) => cpText(fullText, e.currentTarget, "Copy")}>Copy</button>
      </div>
    );
  };

  const renderEngineToggles = (engines: Set<string>, setEngines: (e: Set<string>) => void) => (
    <div className="flex gap-2 flex-wrap">
      {["chatgpt", "gemini", "claude"].map((engine) => (
        <button
          key={engine}
          type="button"
          className={`text-[11px] px-3 py-1 border rounded-full transition-all ${engines.has(engine) ? `bg-lime-400/10 border-lime-400 text-lime-400` : "border-border text-muted-foreground hover:border-muted-foreground"}`}
          onClick={() => toggleEngine(engines, setEngines, engine)}
        >
          {ENGINE_LABELS[engine]}
        </button>
      ))}
    </div>
  );

  const renderAnalysisPanel = (
    brandName: string, setBrandName: (v: string) => void,
    brandDomain: string, setBrandDomain: (v: string) => void,
    engines: Set<string>, setEngines: (e: Set<string>) => void,
    segments: PncAnalysisSegment[], setSegments: (segs: PncAnalysisSegment[]) => void,
    onRunSegment: (segId: string) => void,
    onRunAll: () => void,
    analysisErr: string,
    title: string,
    cacheTs: number | null,
    onLoadCache: () => void,
  ) => {
    const anyScoring = segments.some((s) => s.isScoring);
    const selected = segments.filter((s) => s.selected);
    const scored = segments.filter((s) => s.scoringResult);

    return (
      <div className="mt-6 border-t border-border pt-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-lime-400 flex-shrink-0" />
          <span className="text-xs font-semibold tracking-wide">{title}</span>
          {cacheTs && scored.length === 0 && !anyScoring && (
            <button
              type="button"
              onClick={onLoadCache}
              className="ml-auto flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 border border-lime-400/30 text-lime-400 rounded-lg hover:bg-lime-400/10 transition-colors"
              data-testid="button-pnc-load-cache"
            >
              ↺ Load results from {fmtCacheTs(cacheTs)}
            </button>
          )}
          {scored.length > 0 && !cacheTs && (
            <span className="ml-auto text-[10px] font-mono text-muted-foreground/50">{scored.length} segment{scored.length !== 1 ? "s" : ""} scored</span>
          )}
          {scored.length > 0 && cacheTs && (
            <span className="ml-auto text-[10px] font-mono text-muted-foreground/50">{scored.length} scored · saved {fmtCacheTs(cacheTs)}</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[10px] font-mono text-muted-foreground/50 mb-1">BRAND NAME</div>
            <input
              className="w-full bg-muted/30 border border-border rounded-lg text-[12px] px-3 h-8 text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-lime-400 transition-colors"
              placeholder="e.g. Vaelo Health"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
            />
          </div>
          <div>
            <div className="text-[10px] font-mono text-muted-foreground/50 mb-1">DOMAIN</div>
            <input
              className="w-full bg-muted/30 border border-border rounded-lg text-[12px] px-3 h-8 text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-lime-400 transition-colors"
              placeholder="e.g. feelvaleo.com"
              value={brandDomain}
              onChange={(e) => setBrandDomain(e.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="text-[10px] font-mono text-muted-foreground/50 mb-1.5">ENGINES</div>
          {renderEngineToggles(engines, setEngines)}
        </div>

        {segments.length > 0 && (
          <div>
            <div className="text-[10px] font-mono text-muted-foreground/50 mb-2">SELECT SEGMENTS TO ANALYSE</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {segments.map((seg) => (
                <div
                  key={seg.id}
                  className={`rounded-xl border p-3 transition-all ${seg.selected ? "border-lime-400/40 bg-lime-400/5" : "border-border bg-card"}`}
                >
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${seg.selected ? "bg-lime-400 border-lime-400" : "border-border hover:border-muted-foreground"}`}
                      onClick={() => setSegments(segments.map((s) => s.id === seg.id ? { ...s, selected: !s.selected } : s))}
                    >
                      {seg.selected && <span className="text-black text-[9px] font-bold">✓</span>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium truncate">{seg.label}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${seg.type === "service" ? "bg-teal-900/40 text-teal-400" : "bg-pink-900/40 text-pink-400"}`}>
                          {seg.type}
                        </span>
                        <span className="text-[10px] text-muted-foreground/40">{seg.prompts.length} prompts</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-[10px] px-2.5 py-1 border border-border rounded-lg text-muted-foreground hover:border-lime-400 hover:text-lime-400 transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                      onClick={() => onRunSegment(seg.id)}
                      disabled={anyScoring || !brandName.trim()}
                    >
                      {seg.isScoring ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />
                          Running
                        </span>
                      ) : seg.scoringResult ? "Re-run" : "Run"}
                    </button>
                  </div>

                  {seg.isScoring && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="w-3 h-3 border border-border border-t-lime-400 rounded-full animate-spin flex-shrink-0" />
                      Running {engines.size} engine{engines.size !== 1 ? "s" : ""} · {seg.prompts.length} prompts
                    </div>
                  )}

                  {seg.scoringResult && !seg.isScoring && (
                    <SegmentScoreCard seg={seg} brandName={brandName} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {analysisErr && (
          <div className="bg-red-950 border border-red-900 rounded-md px-3 py-2 text-[12px] text-red-400">{analysisErr}</div>
        )}

        <button
          type="button"
          className="w-full h-10 bg-lime-400 hover:bg-lime-300 active:scale-[.98] text-black text-xs font-semibold rounded-xl transition-all disabled:bg-lime-900 disabled:text-lime-700 disabled:cursor-not-allowed"
          onClick={onRunAll}
          disabled={anyScoring || !brandName.trim() || selected.length === 0}
          data-testid="button-pnc-analyse-all"
        >
          {anyScoring
            ? `Running ${segments.filter((s) => s.isScoring).length} segment\u2026`
            : `Analyse ${selected.length} selected segment${selected.length !== 1 ? "s" : ""} \u2197`}
        </button>
      </div>
    );
  };

  const { b1, b2, b3, b4, loc } = summary();

  return (
    <div className="space-y-4 pb-16">

      {/* Session history dropdown */}
      {pncSessions.length > 0 && (
        <div className="flex items-center gap-2">
          <Select
            onValueChange={async (v) => {
              try {
                const res = await apiRequest("GET", `/api/multisegment/sessions/${v}`);
                const fullSession = await res.json();
                loadPncSession(fullSession);
              } catch {
                toast({ title: "Failed to load session", description: "Could not fetch session data.", variant: "destructive" });
              }
            }}
          >
            <SelectTrigger className="bg-secondary/50 h-9 text-xs" data-testid="select-pnc-session">
              <SelectValue placeholder="Load a previous PNC run…" />
            </SelectTrigger>
            <SelectContent>
              {pncSessions.map((s) => {
                const segCount = Array.isArray(s.segments) ? (s.segments as any[]).length : 0;
                const tab = s.sessionType === "pnc_v1" ? "Block Builder" : "Auto Groups";
                const dateStr = new Date(s.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
                return (
                  <SelectItem key={s.id} value={String(s.id)} data-testid={`pnc-session-option-${s.id}`}>
                    {s.brandName} — {tab} — {segCount} seg{segCount !== 1 ? "s" : ""} — {dateStr}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {(pncV2SessionId || pncV1SessionId) && (
            <span className="text-[10px] text-muted-foreground/50 whitespace-nowrap flex items-center gap-1">
              <FileText className="w-3 h-3" /> session #{pncV2SessionId || pncV1SessionId} — auto-saves
            </span>
          )}
        </div>
      )}

      {/* Shared URL row */}
      <div className="flex gap-2">
        <input
          className="flex-1 bg-card border border-border rounded-xl px-4 h-11 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-lime-400 transition-colors"
          placeholder="https://yourbusiness.com"
          value={url}
          autoComplete="off"
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleExtractClick(); }}
          data-testid="input-pnc-url"
        />
        <button
          type="button"
          className="h-11 px-5 bg-lime-400 hover:bg-lime-300 active:scale-[.98] text-black text-xs font-semibold rounded-xl transition-all disabled:bg-lime-900 disabled:text-lime-700 disabled:cursor-not-allowed whitespace-nowrap"
          onClick={tab === "v3" ? handleV3Classify : handleExtractClick}
          disabled={v1Loading || v2Loading || v3Loading}
          data-testid="button-pnc-extract"
        >
          {tab === "v1" ? "Extract blocks \u2197" : tab === "v3" ? "Classify \u2197" : "Analyze \u2197"}
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground/50">Works with any service business, agency, clinic, SaaS or local company</p>

      {/* Error */}
      {err && <div className="bg-red-950 border border-red-900 rounded-md px-3 py-2 text-[12px] text-red-400">{err}</div>}

      {/* Tab bar */}
      <div className="flex border-b border-border">
        {[
          { key: "v1", label: "Block Builder", desc: "Extract \u2192 curate chips \u2192 generate" },
          { key: "v2", label: "Auto Groups", desc: "URL \u2192 prompts grouped by service & customer" },
          { key: "v3", label: "Guided", desc: "Classify \u2192 confirm categories \u2192 generate" },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            className={`text-[12px] font-medium px-5 py-2.5 border-b-2 -mb-px transition-all text-left ${tab === t.key ? "text-lime-400 border-lime-400" : "text-muted-foreground border-transparent hover:text-foreground"}`}
            onClick={() => setTab(t.key as "v1" | "v2")}
            data-testid={`button-pnc-tab-${t.key}`}
          >
            {t.label}
            <span className="text-[10px] text-muted-foreground/40 font-mono block mt-0.5">{t.desc}</span>
          </button>
        ))}
      </div>

      {/* ══ TAB 1 — BLOCK BUILDER ══ */}
      {tab === "v1" && (
        <div>
          {v1Loading && (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-2 border-border border-t-lime-400 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-[11px] text-muted-foreground font-mono">{v1LoaderMsg}</p>
            </div>
          )}

          {v1Loaded && !v1Loading && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {renderBlock(1)}
                {renderBlock(2)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {renderBlock(3)}
                {renderBlock(4)}
              </div>

              {/* Competitors */}
              {competitors.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono bg-violet-900/40 text-violet-300">5</span>
                    <span className="text-xs font-semibold tracking-wide">Top competitors</span>
                    <span className="ml-auto text-[10px] text-muted-foreground/40 font-mono">display only — not used in prompts yet</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {competitors.map((c, i) => (
                      <div key={i} className="bg-muted/20 border border-border rounded-md p-2.5">
                        <div className="text-[13px] font-medium mb-0.5">{c.name}</div>
                        <div className="text-[10px] font-mono text-muted-foreground mb-1.5">{c.location}</div>
                        <div className="text-[11px] text-muted-foreground">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40 block mb-0.5">Known for</span>
                          {c.known_for}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Location */}
              {renderLocationBlock(
                locMode, setLocMode, locCity, setLocCity, locCountry, setLocCountry,
                () => { if (v1Prompts.length) v1Generate(); }
              )}

              {/* Generate bar */}
              <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between flex-wrap gap-2.5">
                <div className="text-[12px] text-muted-foreground">
                  <strong className="text-foreground font-medium">{b1}</strong> business ·{" "}
                  <strong className="text-foreground font-medium">{b2}</strong> services ·{" "}
                  <strong className="text-foreground font-medium">{b3}</strong> customers{" "}
                  <span className={custToggle ? "text-lime-400" : "text-muted-foreground/40"}>{custToggle ? "(on)" : "(off)"}</span>{" "}
                  · <strong className="text-foreground font-medium">{b4}</strong> qualifiers ·{" "}
                  <strong className="text-foreground font-medium">{loc}</strong>
                </div>
                <button
                  type="button"
                  className="h-9 px-5 bg-lime-400 hover:bg-lime-300 active:scale-[.98] text-black text-xs font-semibold rounded-xl transition-all disabled:bg-lime-900 disabled:text-lime-700 disabled:cursor-not-allowed"
                  onClick={v1Generate}
                  disabled={v1Generating}
                  data-testid="button-pnc-v1-generate"
                >
                  Generate prompts ↗
                </button>
              </div>

              {/* Gen loader */}
              {v1Generating && (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-border border-t-lime-400 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-[11px] text-muted-foreground font-mono">{v1GenMsg}</p>
                </div>
              )}

              {/* Prompts output */}
              {v1Prompts.length > 0 && !v1Generating && (
                <div>
                  <div className="flex items-center justify-between flex-wrap gap-2.5 mb-3">
                    <span className="font-mono text-[11px] text-muted-foreground">{v1Prompts.length} prompts generated</span>
                    <button type="button" className="text-[11px] px-3.5 py-1 border border-border rounded-full text-muted-foreground hover:border-lime-400 hover:text-lime-400 transition-colors" onClick={(e) => cpText(v1Prompts.map((p) => p.text).join("\n"), e.currentTarget, "Copy all prompts")}>
                      Copy all prompts
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {v1Prompts.map((p, i) => renderPromptRow(p, i))}
                  </div>

                  {/* Block Builder Analysis Panel */}
                  <div className="mt-6 border-t border-border pt-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-lime-400 flex-shrink-0" />
                      <span className="text-xs font-semibold tracking-wide">Run GEO Analysis</span>
                      {v1CacheTs && !v1AnalysisSegment?.scoringResult && !v1AnalysisSegment?.isScoring && (
                        <button
                          type="button"
                          onClick={applyV1Cache}
                          className="ml-auto flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 border border-lime-400/30 text-lime-400 rounded-lg hover:bg-lime-400/10 transition-colors"
                          data-testid="button-pnc-v1-load-cache"
                        >
                          ↺ Load results from {fmtCacheTs(v1CacheTs)}
                        </button>
                      )}
                      {v1AnalysisSegment?.scoringResult && v1CacheTs && (
                        <span className="ml-auto text-[10px] font-mono text-muted-foreground/50">saved {fmtCacheTs(v1CacheTs)}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-[10px] font-mono text-muted-foreground/50 mb-1">BRAND NAME</div>
                        <input
                          className="w-full bg-muted/30 border border-border rounded-lg text-[12px] px-3 h-8 text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-lime-400 transition-colors"
                          placeholder="e.g. Vaelo Health"
                          value={v1BrandName}
                          onChange={(e) => setV1BrandName(e.target.value)}
                        />
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-muted-foreground/50 mb-1">DOMAIN</div>
                        <input
                          className="w-full bg-muted/30 border border-border rounded-lg text-[12px] px-3 h-8 text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-lime-400 transition-colors"
                          placeholder="e.g. feelvaleo.com"
                          value={v1BrandDomain}
                          onChange={(e) => setV1BrandDomain(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-muted-foreground/50 mb-1.5">ENGINES</div>
                      {renderEngineToggles(v1Engines, setV1Engines)}
                    </div>

                    {v1AnalysisErr && (
                      <div className="bg-red-950 border border-red-900 rounded-md px-3 py-2 text-[12px] text-red-400">{v1AnalysisErr}</div>
                    )}

                    {v1AnalysisSegment?.isScoring && (
                      <div className="flex items-center gap-2 text-[12px] text-muted-foreground py-2">
                        <span className="w-4 h-4 border-2 border-border border-t-lime-400 rounded-full animate-spin flex-shrink-0" />
                        Running {v1Engines.size} engine{v1Engines.size !== 1 ? "s" : ""} across {v1Prompts.length} prompts…
                      </div>
                    )}

                    {v1AnalysisSegment?.scoringResult && !v1AnalysisSegment.isScoring && (
                      <SegmentScoreCard seg={v1AnalysisSegment} brandName={v1BrandName} />
                    )}

                    <button
                      type="button"
                      className="w-full h-10 bg-lime-400 hover:bg-lime-300 active:scale-[.98] text-black text-xs font-semibold rounded-xl transition-all disabled:bg-lime-900 disabled:text-lime-700 disabled:cursor-not-allowed"
                      onClick={runV1AnalysisSegment}
                      disabled={v1AnalysisSegment?.isScoring || !v1BrandName.trim()}
                      data-testid="button-pnc-v1-analyse"
                    >
                      {v1AnalysisSegment?.isScoring ? "Running analysis\u2026" : `Analyse ${v1Prompts.length} prompts \u2197`}
                    </button>
                  </div>
                </div>
              )}

              {/* Citation analysis — combined report for all scored V1 prompts */}
              {v1AnalysisSegment?.scoringResult && !v1AnalysisSegment.isScoring && (
                <SegmentCitationAnalyzer
                  brandName={v1BrandName}
                  segments={[{
                    id: v1AnalysisSegment.id,
                    persona: "pnc",
                    seedType: "providers",
                    customerType: "",
                    location: locCity || locCountry || "",
                    scoringResult: v1AnalysisSegment.scoringResult ? {
                      score: v1AnalysisSegment.scoringResult.score,
                      raw_runs: (v1AnalysisSegment.scoringResult.raw_runs || []).map((r: any) => ({
                        prompt: r.prompt_text || r.prompt_id || "",
                        engine: r.engine,
                        response: r.raw_text || "",
                        brands_found: (r.candidates || []).map((c: any) => typeof c === "string" ? c : c.name_raw || c.name || "").filter(Boolean),
                        rank: r.brand_rank ?? null,
                        citations: r.citations || [],
                        cluster: r.cluster,
                      })),
                    } : undefined,
                  }]}
                />
              )}

              {/* Competitor Lens for V1 */}
              {v1AnalysisSegment && (
                <PncCompetitorLens
                  segments={v1AnalysisSegment ? [v1AnalysisSegment] : []}
                  brandName={v1BrandName}
                  brandDomain={v1BrandDomain}
                  location={locCity || locCountry || ""}
                  sessionId={pncV1SessionId}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ TAB 2 — AUTO GROUPS ══ */}
      {tab === "v2" && (
        <div className="space-y-4">
          {renderLocationBlock(v2LocMode, setV2LocMode, v2LocCity, setV2LocCity, v2LocCountry, setV2LocCountry)}

          <div className="flex justify-end">
            <button
              type="button"
              className="h-9 px-5 bg-lime-400 hover:bg-lime-300 active:scale-[.98] text-black text-xs font-semibold rounded-xl transition-all disabled:bg-lime-900 disabled:text-lime-700 disabled:cursor-not-allowed"
              onClick={v2Generate}
              disabled={v2Loading}
              data-testid="button-pnc-v2-generate"
            >
              Generate grouped prompts ↗
            </button>
          </div>

          {v2Loading && (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-2 border-border border-t-lime-400 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-[11px] text-muted-foreground font-mono">{v2LoaderMsg}</p>
            </div>
          )}

          {v2Result && !v2Loading && (
            <div>
              <div className="flex items-center justify-between flex-wrap gap-2.5 mb-4">
                <span className="font-mono text-[11px] text-muted-foreground">
                  {v2Result.business_name} · {v2Result.by_service.reduce((a, g) => a + g.prompts.length, 0)} prompts across {v2Result.by_service.length} services & {v2Result.by_customer.length} customer types
                </span>
                <button
                  type="button"
                  className="text-[11px] px-3.5 py-1 border border-border rounded-full text-muted-foreground hover:border-lime-400 hover:text-lime-400 transition-colors"
                  onClick={(e) => {
                    const all = [...v2Result.by_service.flatMap((g) => g.prompts), ...v2Result.by_customer.flatMap((g) => g.prompts)];
                    cpText(all.map((p) => p.text).join("\n"), e.currentTarget, "Copy all");
                  }}
                >
                  Copy all
                </button>
              </div>

              {/* View switcher */}
              <div className="flex gap-1.5 mb-5">
                {[{ key: "service", label: "By service type" }, { key: "customer", label: "By customer type" }].map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    className={`text-[12px] px-4 py-1 border rounded-full transition-all ${v2View === v.key ? "bg-lime-400/10 border-lime-400 text-lime-400" : "border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground"}`}
                    onClick={() => setV2View(v.key as "service" | "customer")}
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              {/* Service panel */}
              {v2View === "service" && (
                <div className="space-y-6">
                  {v2Result.by_service.map((g, gi) => (
                    <div key={gi}>
                      <div className="flex items-center gap-2 mb-2 text-[11px] font-semibold tracking-widest uppercase font-mono text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                        {g.service}
                        <span className="flex-1 h-px bg-border ml-1" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {g.prompts.map((p, pi) => renderPromptRow(p, pi))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Customer panel */}
              {v2View === "customer" && (
                <div className="space-y-6">
                  {v2Result.by_customer.map((g, gi) => (
                    <div key={gi}>
                      <div className="flex items-center gap-2 mb-2 text-[11px] font-semibold tracking-widest uppercase font-mono text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400 flex-shrink-0" />
                        {g.customer}
                        <span className="flex-1 h-px bg-border ml-1" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {g.prompts.map((p, pi) => renderPromptRow(p, pi))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* Analysis panel — shows for newly-generated OR loaded-from-DB sessions */}
          {pncSegments.length > 0 && renderAnalysisPanel(
            pncBrandName, setPncBrandName,
            pncBrandDomain, setPncBrandDomain,
            pncEngines, setPncEngines,
            pncSegments, setPncSegments,
            runPncSegment,
            runAllSelectedPnc,
            pncAnalysisErr,
            "Run GEO Analysis",
            v2CacheTs,
            applyV2Cache,
          )}

          {/* Citation analysis — one combined report for all scored segments */}
          {pncSegments.some((s) => s.scoringResult) && (
            <SegmentCitationAnalyzer
              brandName={pncBrandName}
              segments={pncSegments.filter((s) => s.scoringResult).map((s) => ({
                id: s.id,
                persona: "pnc",
                seedType: s.type === "service" ? "providers" : "customers",
                customerType: s.type === "customer" ? s.label : "",
                location: v2LocCity || v2LocCountry || "",
                scoringResult: s.scoringResult ? {
                  score: s.scoringResult.score,
                  raw_runs: (s.scoringResult.raw_runs || []).map((r: any) => ({
                    prompt: r.prompt_text || r.prompt_id || "",
                    engine: r.engine,
                    response: r.raw_text || "",
                    brands_found: (r.candidates || []).map((c: any) => typeof c === "string" ? c : c.name_raw || c.name || "").filter(Boolean),
                    rank: r.brand_rank ?? null,
                    citations: r.citations || [],
                    cluster: r.cluster,
                  })),
                } : undefined,
              }))}
            />
          )}

          {/* Competitor Lens — full impact summaries per competitor */}
          {pncSegments.length > 0 && (
            <PncCompetitorLens
              segments={pncSegments}
              brandName={pncBrandName}
              brandDomain={pncBrandDomain}
              location={v2LocCity || v2LocCountry || ""}
              sessionId={pncV2SessionId}
            />
          )}
        </div>
      )}

      {/* ══ TAB 3 — GUIDED (V3) ══ */}
      {tab === "v3" && (
        <div className="space-y-4">
          {v3Err && <div className="bg-red-950 border border-red-900 rounded-md px-3 py-2 text-[12px] text-red-400">{v3Err}</div>}

          {/* Step indicator */}
          {(v3Step !== "classify" || v3Loading) && (
            <div className="flex items-center gap-2">
              {(["classify", "confirm", "prompts"] as const).map((s, i) => {
                const labels = ["Classify", "Confirm", "Prompts"];
                const idx = ["classify", "confirm", "prompts"].indexOf(v3Step);
                const done = i < idx;
                const active = i === idx;
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono font-semibold border transition-all ${done ? "bg-lime-400 border-lime-400 text-black" : active ? "border-lime-400 text-lime-400" : "border-border text-muted-foreground/40"}`}>{i + 1}</div>
                    <span className={`text-[10px] font-mono transition-all ${done ? "text-muted-foreground" : active ? "text-foreground" : "text-muted-foreground/30"}`}>{labels[i]}</span>
                    {i < 2 && <div className={`flex-1 h-px w-6 transition-all ${done ? "bg-lime-400" : "bg-border"}`} />}
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 1 — Classify loading or idle */}
          {v3Step === "classify" && (
            v3Loading ? (
              <div className="text-center py-16">
                <div className="w-8 h-8 border-2 border-border border-t-lime-400 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-[11px] text-muted-foreground font-mono">Classifying website…</p>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground/40 text-[12px]">
                Enter a URL above and click <strong className="text-muted-foreground/60">Classify ↗</strong> to begin
              </div>
            )
          )}

          {/* STEP 2 — Confirm */}
          {v3Step === "confirm" && !v3Loading && (
            <div className="space-y-4">
              {/* Business card */}
              {v3BizCard && (
                <div className="bg-card border border-border rounded-xl p-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-lime-400 to-blue-400" />
                  <div className="text-[9px] font-mono font-semibold tracking-widest uppercase text-lime-400 mb-1">{v3BizCard.category}</div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="text-sm font-semibold">{v3BizCard.name}</div>
                    {v3BizCard.model && <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-400 flex-shrink-0">{v3BizCard.model}</span>}
                  </div>
                  {v3BizCard.description && <p className="text-[11px] text-muted-foreground">{v3BizCard.description}</p>}
                </div>
              )}

              {/* Services + Customers chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Services */}
                <div className="bg-card border border-border rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-4 h-4 rounded-full bg-teal-950 text-teal-400 flex items-center justify-center text-[8px] font-mono font-semibold">S</span>
                    <span className="text-[11px] font-semibold">Services</span>
                    <span className="text-[9px] text-muted-foreground/40 font-mono ml-auto">click to exclude</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {v3Services.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        title={s.why || undefined}
                        onClick={() => setV3Services((prev) => prev.map((x, xi) => xi === i ? { ...x, on: !x.on } : x))}
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border transition-all cursor-pointer ${s.on ? "bg-teal-400 border-transparent text-teal-950 font-medium" : "border-border text-muted-foreground/40 bg-secondary/30"}`}
                        data-testid={`v3-svc-chip-${i}`}
                      >
                        {s.rank < 99 && <span className="text-[8px] opacity-60">#{s.rank}</span>}
                        {s.label}
                        <span className="text-[8px] opacity-60">×</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      className="flex-1 bg-secondary/50 border border-border rounded-md px-2 h-6 text-[10px] text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-lime-400"
                      placeholder="Add service…"
                      value={v3SvcAdd}
                      onChange={(e) => setV3SvcAdd(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && v3SvcAdd.trim()) { setV3Services((p) => [...p, { label: v3SvcAdd.trim(), rank: 99, why: "", on: true }]); setV3SvcAdd(""); } }}
                    />
                    <button type="button" onClick={() => { if (v3SvcAdd.trim()) { setV3Services((p) => [...p, { label: v3SvcAdd.trim(), rank: 99, why: "", on: true }]); setV3SvcAdd(""); } }} className="h-6 px-2 bg-secondary/50 border border-border rounded-md text-[10px] text-muted-foreground hover:text-foreground">+</button>
                  </div>
                </div>

                {/* Customer types */}
                <div className="bg-card border border-border rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-4 h-4 rounded-full bg-pink-950 text-pink-400 flex items-center justify-center text-[8px] font-mono font-semibold">C</span>
                    <span className="text-[11px] font-semibold">Customer types</span>
                    <span className="text-[9px] text-muted-foreground/40 font-mono ml-auto">click to exclude</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {v3Customers.map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        title={c.why || undefined}
                        onClick={() => setV3Customers((prev) => prev.map((x, xi) => xi === i ? { ...x, on: !x.on } : x))}
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border transition-all cursor-pointer ${c.on ? "bg-pink-400 border-transparent text-pink-950 font-medium" : "border-border text-muted-foreground/40 bg-secondary/30"}`}
                        data-testid={`v3-cust-chip-${i}`}
                      >
                        {c.rank < 99 && <span className="text-[8px] opacity-60">#{c.rank}</span>}
                        {c.label}
                        <span className="text-[8px] opacity-60">×</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      className="flex-1 bg-secondary/50 border border-border rounded-md px-2 h-6 text-[10px] text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-lime-400"
                      placeholder="Add customer type…"
                      value={v3CustAdd}
                      onChange={(e) => setV3CustAdd(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && v3CustAdd.trim()) { setV3Customers((p) => [...p, { label: v3CustAdd.trim(), rank: 99, why: "", on: true }]); setV3CustAdd(""); } }}
                    />
                    <button type="button" onClick={() => { if (v3CustAdd.trim()) { setV3Customers((p) => [...p, { label: v3CustAdd.trim(), rank: 99, why: "", on: true }]); setV3CustAdd(""); } }} className="h-6 px-2 bg-secondary/50 border border-border rounded-md text-[10px] text-muted-foreground hover:text-foreground">+</button>
                  </div>
                </div>
              </div>

              {/* Scope block */}
              <div className="bg-card border border-border rounded-xl p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-400 to-lime-400" />
                <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                  <span className="text-[11px] font-semibold">Search scope</span>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded ${v3ScopeConf === "high" ? "bg-lime-950 text-lime-400" : v3ScopeConf === "low" ? "bg-red-950 text-red-400" : "bg-amber-950 text-amber-400"}`}>{v3ScopeConf} confidence</span>
                </div>
                {v3ScopeReason && <p className="text-[10px] text-muted-foreground mb-2">{v3ScopeReason}</p>}
                {v3ScopeSignals.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {v3ScopeSignals.map((sig, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border before:content-['✓_'] before:text-teal-400">{sig}</span>
                    ))}
                  </div>
                )}
                <div className="flex gap-1.5 flex-wrap mb-3">
                  {(["city", "country", "region", "global"] as const).map((s) => (
                    <button key={s} type="button" onClick={() => setV3Scope(s)}
                      className={`text-[11px] px-3 py-1 rounded-full border transition-all ${v3Scope === s ? "bg-lime-950 border-lime-400 text-lime-400" : "border-border text-muted-foreground hover:border-muted-foreground"}`}
                    >{s.charAt(0).toUpperCase() + s.slice(1)}</button>
                  ))}
                </div>
                {v3Scope !== "global" && (
                  <div className="flex gap-3 flex-wrap">
                    {v3Scope === "city" && (
                      <div><div className="text-[9px] font-mono text-muted-foreground/50 mb-1">CITY</div>
                        <input className="bg-secondary/50 border border-border rounded-md px-2 h-7 text-[10px] text-foreground outline-none focus:border-lime-400 w-28" placeholder="e.g. Dubai" value={v3LocCity} onChange={(e) => setV3LocCity(e.target.value)} /></div>
                    )}
                    {v3Scope === "country" && (
                      <div><div className="text-[9px] font-mono text-muted-foreground/50 mb-1">COUNTRY</div>
                        <input className="bg-secondary/50 border border-border rounded-md px-2 h-7 text-[10px] text-foreground outline-none focus:border-lime-400 w-28" placeholder="e.g. UAE" value={v3LocCountry} onChange={(e) => setV3LocCountry(e.target.value)} /></div>
                    )}
                    {v3Scope === "region" && (
                      <div><div className="text-[9px] font-mono text-muted-foreground/50 mb-1">REGION</div>
                        <input className="bg-secondary/50 border border-border rounded-md px-2 h-7 text-[10px] text-foreground outline-none focus:border-lime-400 w-28" placeholder="e.g. GCC" value={v3LocRegion} onChange={(e) => setV3LocRegion(e.target.value)} /></div>
                    )}
                  </div>
                )}
              </div>

              {/* Competitors (display only) */}
              {v3Competitors.length > 0 && (
                <div>
                  <div className="text-[9px] font-mono font-semibold tracking-widest uppercase text-muted-foreground/40 mb-2">Top competitors detected</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {v3Competitors.map((c, i) => (
                      <div key={i} className="bg-card border border-border rounded-lg p-2.5">
                        <div className="text-[11px] font-medium mb-0.5">{c.name}</div>
                        <div className="text-[9px] font-mono text-muted-foreground/50 mb-1">{c.location}</div>
                        <div className="text-[10px] text-muted-foreground">{c.known_for}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action bar */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <span className="text-[10px] font-mono text-muted-foreground">
                  {v3Services.filter((s) => s.on).length} service{v3Services.filter((s) => s.on).length !== 1 ? "s" : ""} · {v3Customers.filter((c) => c.on).length} customer type{v3Customers.filter((c) => c.on).length !== 1 ? "s" : ""} selected
                </span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setV3Step("classify")} className="text-[11px] px-4 py-2 border border-border rounded-xl text-muted-foreground hover:text-foreground transition-colors">← Re-classify</button>
                  <button
                    type="button"
                    onClick={handleV3Generate}
                    disabled={v3Generating}
                    className="h-9 px-5 bg-lime-400 hover:bg-lime-300 active:scale-[.98] text-black text-xs font-semibold rounded-xl transition-all disabled:bg-lime-900 disabled:text-lime-700 disabled:cursor-not-allowed"
                    data-testid="button-v3-generate"
                  >
                    {v3Generating ? "Writing prompts…" : "Generate prompts ↗"}
                  </button>
                </div>
              </div>
              {v3Generating && (
                <div className="text-center py-6">
                  <div className="w-6 h-6 border-2 border-border border-t-lime-400 rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-[10px] text-muted-foreground font-mono">Writing prompts…</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 — Prompts + full post-pipeline */}
          {v3Step === "prompts" && v3Result && (
            <div className="space-y-4">
              {/* Prompt output header */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-mono text-[11px] text-muted-foreground">
                  {v3Result.business_name} · {[...v3Result.by_service, ...v3Result.by_customer].flatMap((g: any) => g.prompts || []).length} prompts · {v3Result.by_service.length} services · {v3Result.by_customer.length} customer types
                </span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setV3Step("confirm")} className="text-[11px] px-3 py-1 border border-border rounded-full text-muted-foreground hover:text-foreground transition-colors">← Edit</button>
                </div>
              </div>

              {/* View switcher */}
              <div className="flex gap-1.5 mb-4">
                <button type="button"
                  onClick={() => setV3PanelView("service")}
                  className={`text-[11px] px-3 py-1 rounded-full border transition-all ${v3PanelView === "service" ? "bg-lime-950 border-lime-400 text-lime-400" : "border-border text-muted-foreground hover:border-muted-foreground"}`}
                >By service</button>
                <button type="button"
                  onClick={() => setV3PanelView("customer")}
                  className={`text-[11px] px-3 py-1 rounded-full border transition-all ${v3PanelView === "customer" ? "bg-lime-950 border-lime-400 text-lime-400" : "border-border text-muted-foreground hover:border-muted-foreground"}`}
                >By customer</button>
              </div>

              {/* Service groups */}
              {v3PanelView === "service" && v3Result.by_service.map((g, gi) => (
                <div key={gi} className="mb-5">
                  <div className="flex items-center gap-2 mb-2 text-[11px] font-semibold tracking-widest uppercase font-mono text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />{g.service}
                    <span className="flex-1 h-px bg-border ml-1" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {g.prompts.map((p, pi) => renderPromptRow(p, pi))}
                  </div>
                </div>
              ))}

              {/* Customer groups */}
              {v3PanelView === "customer" && v3Result.by_customer.map((g, gi) => (
                <div key={gi} className="mb-5">
                  <div className="flex items-center gap-2 mb-2 text-[11px] font-semibold tracking-widest uppercase font-mono text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400 flex-shrink-0" />{g.customer}
                    <span className="flex-1 h-px bg-border ml-1" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {g.prompts.map((p, pi) => renderPromptRow(p, pi))}
                  </div>
                </div>
              ))}

              {/* GEO Analysis panel — same as V2 */}
              {renderAnalysisPanel(
                v3BrandName, setV3BrandName,
                v3BrandDomain, setV3BrandDomain,
                v3Engines, setV3Engines,
                v3Segments, setV3Segments,
                runV3Segment,
                runAllV3,
                v3AnalysisErr,
                "Run GEO Analysis",
                null,
                () => {},
              )}

              {/* Citation analysis */}
              {v3Segments.some((s) => s.scoringResult) && (
                <SegmentCitationAnalyzer
                  brandName={v3BrandName}
                  segments={v3Segments.filter((s) => s.scoringResult).map((s) => ({
                    id: s.id,
                    persona: "pnc",
                    seedType: s.type === "service" ? "providers" : "customers",
                    customerType: s.type === "customer" ? s.label : "",
                    location: v3LocCity || v3LocCountry || v3LocRegion || "",
                    scoringResult: s.scoringResult ? {
                      score: s.scoringResult.score,
                      raw_runs: (s.scoringResult.raw_runs || []).map((r: any) => ({
                        prompt: r.prompt_text || r.prompt_id || "",
                        engine: r.engine,
                        response: r.raw_text || "",
                        brands_found: (r.candidates || []).map((c: any) => typeof c === "string" ? c : c.name_raw || c.name || "").filter(Boolean),
                        rank: r.brand_rank ?? null,
                        citations: r.citations || [],
                        cluster: r.cluster,
                      })),
                    } : undefined,
                  }))}
                />
              )}

              {/* Competitor Lens */}
              {v3Segments.length > 0 && (
                <PncCompetitorLens
                  segments={v3Segments}
                  brandName={v3BrandName}
                  brandDomain={v3BrandDomain}
                  location={v3LocCity || v3LocCountry || v3LocRegion || ""}
                  sessionId={v3SessionId}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ COST TRACKER ══ */}
      {costs.length > 0 && (
        <div className="mt-6 border-t border-border pt-4">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <span className="text-[10px] font-mono font-semibold tracking-widest uppercase text-muted-foreground/50">Session cost — claude-sonnet-4-5</span>
            <button
              type="button"
              className="text-[10px] px-2.5 py-0.5 border border-border rounded-full text-muted-foreground/40 hover:border-red-900 hover:text-red-400 transition-colors"
              onClick={() => setCosts([])}
            >
              Clear
            </button>
          </div>
          <div className="space-y-1.5">
            {costs.map((c, i) => (
              <div key={i} className="flex items-center gap-3 text-[11px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 flex-shrink-0" />
                <span className="flex-1 text-muted-foreground truncate">{c.label}</span>
                {c.input_tokens > 0 && <span className="text-muted-foreground/50 tabular-nums">{c.input_tokens.toLocaleString()} in</span>}
                {c.output_tokens > 0 && <span className="text-muted-foreground/50 tabular-nums">{c.output_tokens.toLocaleString()} out</span>}
                <span className="text-foreground/70 tabular-nums w-20 text-right">${c.cost_usd.toFixed(4)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <span className="text-[11px] font-mono text-muted-foreground/50">
              {costs.length} {costs.length === 1 ? "call" : "calls"}
            </span>
            <span className="text-[13px] font-mono font-semibold text-foreground tabular-nums">
              ${costs.reduce((a, c) => a + c.cost_usd, 0).toFixed(4)} total
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

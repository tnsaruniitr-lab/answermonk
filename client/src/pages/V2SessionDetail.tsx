import { useState, useMemo } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useMultiSegmentSession, useV2GroupDetail } from "@/hooks/use-analysis";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowLeft,
  BarChart3,
  Globe,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Trophy,
  Eye,
  Target,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { SegmentCitationAnalyzer } from "@/components/SegmentCitationAnalyzer";
import { ReportViewer } from "@/components/ReportViewer";
import { CitationInsightsPanel } from "@/components/CitationInsightsPanel";
import { mergeCompetitors } from "@/lib/competitor-merge";

const ENGINE_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  claude: "Claude",
};

interface RawRun {
  prompt_id: string;
  prompt_text?: string;
  cluster: string;
  engine: string;
  raw_text: string;
  citations?: { url: string; title?: string }[];
  candidates: string[];
  brand_found: boolean;
  brand_rank: number | null;
  webSearchStatus?: "grounded" | "ungrounded" | "fallback" | "not_applicable";
  fallbackReason?: string;
}

interface SegmentData {
  persona: string;
  seedType: string;
  customerType: string;
  location: string;
  resultCount: number;
  prompts: any[] | null;
  scoringResult: {
    score: {
      appearance_rate: number;
      primary_rate: number;
      avg_rank: number | null;
      competitors: { name: string; share: number; appearances: number }[];
      engine_breakdown: Record<string, any>;
      cluster_breakdown: Record<string, any>;
      valid_runs: number;
      invalid_runs: number;
    };
    raw_runs?: RawRun[];
  } | null;
}

export default function V2SessionDetail() {
  const [, params] = useRoute("/v2/:id");
  const rawId = params?.id || null;
  const isGroupKey = rawId ? rawId.startsWith("v2auto-") : false;
  const numericId = rawId && !isGroupKey ? parseInt(rawId, 10) : null;
  const [, navigate] = useLocation();
  const [teaserLoading, setTeaserLoading] = useState(false);
  const [teaserCopied, setTeaserCopied] = useState(false);

  const { data: sessionData, isLoading: sessionLoading, error: sessionError } = useMultiSegmentSession(numericId);
  const { data: groupData, isLoading: groupLoading, error: groupError } = useV2GroupDetail(isGroupKey ? rawId : null);

  const session = isGroupKey ? groupData : sessionData;
  const isLoading = isGroupKey ? groupLoading : sessionLoading;
  const error = isGroupKey ? groupError : sessionError;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Nav />
        <main className="max-w-3xl mx-auto px-6 py-10 space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-md" />)}
          </div>
        </main>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-background">
        <Nav />
        <main className="max-w-3xl mx-auto px-6 py-20 text-center">
          <p className="text-muted-foreground">Session not found.</p>
        </main>
      </div>
    );
  }

  const segments: SegmentData[] = Array.isArray(session.segments) ? session.segments : [];
  const scored = segments.filter(s => s.scoringResult).length;
  const isCompetitorSession = (session as any).sessionType === "competitor";
  const parentBrand = (session as any).parentBrandName;
  const parentSessionId = (session as any).parentSessionId;

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="pb-6 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold tracking-tight" data-testid="text-v2-detail-heading">
              {isCompetitorSession ? "Competitor Report" : "Quick V2"} — {session.brandName}
            </h1>
            {isCompetitorSession ? (
              <Badge variant="outline" className="text-[10px] border-orange-300 text-orange-600 dark:text-orange-400">
                <Target className="w-2.5 h-2.5 mr-1" />
                vs {parentBrand}
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">
                <BarChart3 className="w-2.5 h-2.5 mr-1" />
                {segments.length} segment{segments.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {isCompetitorSession
              ? `Competitor analysis from ${parentBrand}'s session data`
              : `${session.promptsPerSegment} prompts per segment x 3 engines`}
            {session.createdAt && ` · ${format(new Date(session.createdAt), "MMM d, yyyy 'at' h:mm a")}`}
          </p>
          {isCompetitorSession && parentSessionId && (
            <Link href={`/v2/${parentSessionId}`}>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
                <ArrowLeft className="w-3 h-3" />
                Back to {parentBrand} session
              </Button>
            </Link>
          )}
        </div>

        <div className="space-y-2.5">
          {segments.map((seg, idx) => (
            <SegmentCard key={idx} seg={seg} idx={idx} brandName={session.brandName} />
          ))}
        </div>

        {scored > 0 && (
          <SegmentCitationAnalyzer
            brandName={session.brandName}
            sessionId={numericId}
            groupKey={isGroupKey ? rawId : null}
            segments={segments
              .filter(s => s.scoringResult)
              .map((s, i) => ({
                id: `hist-seg-${rawId}-${i}`,
                persona: s.persona,
                seedType: s.seedType,
                customerType: s.customerType,
                location: s.location,
                scoringResult: s.scoringResult,
              }))}
          />
        )}

        {/* Citation AI Insights — send full citation data to any model */}
        {numericId !== null && scored > 0 && (
          <CitationInsightsPanel sessionId={numericId} />
        )}

        {scored > 0 && (numericId !== null || isGroupKey) && (
          <div className="flex gap-3 items-center flex-wrap">
            <Link href={`/summary/${numericId !== null ? numericId : rawId}`}>
              <Button variant="outline" className="gap-2" data-testid="button-summary-report">
                <FileText className="w-4 h-4" />
                Impact Summary
              </Button>
            </Link>
            {numericId !== null && (
              <>
                <Button
                  variant="outline"
                  className="gap-2"
                  data-testid="button-prospect-teaser"
                  disabled={teaserLoading}
                  onClick={async () => {
                    setTeaserLoading(true);
                    try {
                      const res = await fetch(`/api/multi-segment-sessions/${numericId}/teaser`, { method: "POST" });
                      if (!res.ok) throw new Error("Failed to generate teaser");
                      navigate(`/teaser/${numericId}`);
                    } catch (err) {
                      console.error("Teaser generation failed:", err);
                    } finally {
                      setTeaserLoading(false);
                    }
                  }}
                >
                  {teaserLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Prospect Teaser
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  data-testid="button-copy-teaser-link"
                  onClick={() => {
                    const url = `${window.location.origin}/share/teaser/${numericId}`;
                    navigator.clipboard.writeText(url);
                    setTeaserCopied(true);
                    setTimeout(() => setTeaserCopied(false), 2000);
                  }}
                >
                  {teaserCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </>
            )}
          </div>
        )}

        {scored > 0 && (numericId !== null || isGroupKey) && (
          <ReportViewer
            sessionId={numericId}
            brandName={session.brandName}
            groupKey={isGroupKey ? rawId : null}
          />
        )}

        <div className="pb-16" />
      </main>
    </div>
  );
}

function Nav() {
  return (
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
  );
}

function SegmentCard({ seg, idx, brandName }: { seg: SegmentData; idx: number; brandName: string }) {
  const [expanded, setExpanded] = useState(true);
  const [showSources, setShowSources] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const score = seg.scoringResult?.score;
  const rawRuns = seg.scoringResult?.raw_runs || [];
  const PERSONA_CORE_LABELS: Record<string, string> = {
    marketing_agency: "marketing agency",
    seo_agency: "SEO agency",
    performance_marketing_agency: "performance marketing agency",
    content_marketing_agency: "content marketing agency",
    social_media_agency: "social media agency",
    web_design_agency: "web design agency",
    pr_agency: "PR agency",
    branding_agency: "branding agency",
    digital_marketing_agency: "digital marketing agency",
    automation_consultant: "automation",
    corporate_cards_provider: "corporate cards",
    expense_management_software: "expense management",
    accounting_automation: "accounting automation",
    invoice_management: "invoice management",
    restaurant: "restaurant",
    construction_management: "construction management software",
  };
  const formatSeedType = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const personaLabel = seg.persona ? (PERSONA_CORE_LABELS[seg.persona] || seg.persona.replace(/_/g, " ")) : "";
  const seedLabel = seg.seedType ? formatSeedType(seg.seedType) : "";
  const category = personaLabel
    ? `${personaLabel.charAt(0).toUpperCase() + personaLabel.slice(1)} ${seedLabel}`
    : seedLabel;
  const labelParts = [category];
  if (seg.serviceType) labelParts.push(`(${seg.serviceType})`);
  if (seg.customerType) labelParts.push(`for ${seg.customerType}`);
  const segLabel = labelParts.filter(Boolean).join(" ");

  return (
    <Card className="overflow-hidden" data-testid={`card-v2-segment-${idx}`}>
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors text-left">
          <div className="flex items-center gap-2 min-w-0">
            {expanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
            <div className="min-w-0">
              <div className="text-sm font-medium">
                <span className="text-muted-foreground text-xs mr-2">#{idx + 1}</span>
                {segLabel || `Segment ${idx + 1}`}
              </div>
              {seg.location && (
                <div className="text-[10px] text-muted-foreground mt-0.5">{seg.location}</div>
              )}
            </div>
          </div>
          {score && (
            <div className="flex items-center gap-2 shrink-0">
              {(() => {
                const brandShare = score.appearance_rate;
                const mergedComps = mergeCompetitors(seg.scoringResult?.raw_runs, score.competitors, score.valid_runs || 0);
                const compShares = mergedComps.map((c: any) => c.share);
                const rank = 1 + compShares.filter((s: number) => s > brandShare).length;
                const trophyColor = rank === 1 ? "text-amber-500" : rank === 2 ? "text-slate-400" : "text-orange-500";
                const badgeStyle = rank === 1
                  ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700"
                  : rank === 2
                  ? "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-600"
                  : "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/15 dark:text-orange-400 dark:border-orange-700";
                const posLabel = rank === 1 ? "1st" : rank === 2 ? "2nd" : rank === 3 ? "3rd" : `${rank}th`;
                return (
                  <>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="tabular-nums font-medium text-foreground">{Math.round(score.appearance_rate * 100)}%</span>
                      <span>vis</span>
                      <span className="text-border">·</span>
                      <span className="tabular-nums font-medium text-foreground">#{score.avg_rank ?? "—"}</span>
                      <span>rank</span>
                    </div>
                    <Badge className={`${badgeStyle} text-[10px] border gap-1 ml-1`}>
                      <Trophy className={`w-3 h-3 ${trophyColor}`} />
                      {posLabel}
                    </Badge>
                  </>
                );
              })()}
            </div>
          )}
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 border-t space-y-4 pt-3">
            {!score && (
              <div className="text-sm text-muted-foreground py-4 text-center">No scoring results for this segment.</div>
            )}

            {score && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <ScoreBox value={`${Math.round(score.appearance_rate * 100)}%`} label="Appearance" />
                  <ScoreBox value={`${Math.round(score.primary_rate * 100)}%`} label="Top 3" />
                  <ScoreBox value={score.avg_rank !== null ? `#${score.avg_rank}` : "—"} label="Avg Rank" />
                </div>

                {Object.keys(score.engine_breakdown).length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                      <BarChart3 className="w-3 h-3" />
                      By Engine
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(score.engine_breakdown).map(([engine, data]: [string, any]) => {
                        const allFailed = data.valid_runs === 0 && (data.error_runs ?? 0) > 0;
                        return (
                          <div key={engine} className={`bg-secondary/30 rounded-md p-2 space-y-0.5 ${allFailed ? "opacity-60" : ""}`}>
                            <span className="text-[10px] font-medium text-muted-foreground block">
                              {ENGINE_LABELS[engine] || engine}
                            </span>
                            {allFailed ? (
                              <div className="text-xs text-destructive font-medium">Failed</div>
                            ) : (
                              <>
                                <div className="text-sm font-semibold">{Math.round(data.appearance_rate * 100)}%</div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-muted-foreground">Top 3</span>
                                  <span className="text-[10px] font-medium">{Math.round(data.primary_rate * 100)}%</span>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {rawRuns.length > 0 && (() => {
                  const groundingSummary = new Map<string, { grounded: number; ungrounded: number; fallback: number; total: number }>();
                  for (const r of rawRuns) {
                    if (r.engine === "claude") continue;
                    const entry = groundingSummary.get(r.engine) || { grounded: 0, ungrounded: 0, fallback: 0, total: 0 };
                    entry.total++;
                    if (r.webSearchStatus === "grounded") entry.grounded++;
                    else if (r.webSearchStatus === "fallback") entry.fallback++;
                    else if (r.webSearchStatus === "ungrounded") entry.ungrounded++;
                    groundingSummary.set(r.engine, entry);
                  }
                  const hasIssues = [...groundingSummary.values()].some(e => e.ungrounded > 0 || e.fallback > 0);
                  if (!hasIssues) return null;
                  return (
                    <div className="bg-orange-50 dark:bg-orange-900/10 rounded-lg p-2.5 space-y-1" data-testid="grounding-summary">
                      <div className="text-[10px] uppercase tracking-wide text-orange-700 dark:text-orange-400 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Web Search Grounding
                      </div>
                      <div className="flex gap-3">
                        {[...groundingSummary.entries()].map(([engine, s]) => (
                          <div key={engine} className="text-[11px]">
                            <span className="font-medium">{ENGINE_LABELS[engine] || engine}: </span>
                            {s.grounded > 0 && <span className="text-green-700 dark:text-green-400">{s.grounded} grounded</span>}
                            {s.ungrounded > 0 && <span className="text-orange-700 dark:text-orange-400">{s.grounded > 0 ? ", " : ""}{s.ungrounded} ungrounded</span>}
                            {s.fallback > 0 && <span className="text-red-700 dark:text-red-400">{(s.grounded > 0 || s.ungrounded > 0) ? ", " : ""}{s.fallback} fallback</span>}
                            <span className="text-muted-foreground"> / {s.total}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {(() => {
                  const brandEntry = { name: brandName, share: score.appearance_rate, isBrand: true as const };
                  const mergedComps = mergeCompetitors(seg.scoringResult?.raw_runs, score.competitors, score.valid_runs || 0);
                  const brandLC = brandName.toLowerCase();
                  const allEntries = [brandEntry, ...mergedComps.filter(c => !c.name.toLowerCase().includes(brandLC) && !brandLC.includes(c.name.toLowerCase())).map(c => ({ ...c, isBrand: false as const }))]
                    .sort((a, b) => b.share - a.share);
                  return allEntries.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                        <Globe className="w-3 h-3" />
                        Rankings
                      </h4>
                      <div className="divide-y divide-border/50 border border-border/50 rounded-md overflow-hidden">
                        {allEntries.slice(0, 10).map((entry, i) => (
                          <div
                            key={entry.name}
                            className={`flex items-center justify-between gap-3 px-3 py-1.5 ${entry.isBrand ? "bg-primary/10" : ""}`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[10px] text-muted-foreground font-mono w-4 text-right shrink-0">{i + 1}</span>
                              <span className={`text-xs truncate ${entry.isBrand ? "font-semibold text-primary" : ""}`}>
                                {entry.name}
                                {entry.isBrand && <span className="ml-1 text-[9px] uppercase tracking-wider text-primary/70">You</span>}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="w-16 h-1 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${entry.isBrand ? "bg-primary" : "bg-foreground/40"}`}
                                  style={{ width: `${Math.round(entry.share * 100)}%` }}
                                />
                              </div>
                              <span className={`text-[10px] font-medium w-8 text-right ${entry.isBrand ? "text-primary" : ""}`}>
                                {Math.round(entry.share * 100)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {rawRuns.length > 0 && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowSources(!showSources)}
                      className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                      data-testid={`button-toggle-sources-${idx}`}
                    >
                      {showSources ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      <ExternalLink className="w-3 h-3" />
                      Sources ({rawRuns.reduce((acc, r) => acc + (r.citations?.length || 0), 0)})
                    </button>
                    {showSources && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                        <SourcesList runs={rawRuns} />
                      </motion.div>
                    )}
                  </div>
                )}

                {rawRuns.length > 0 && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowRaw(!showRaw)}
                      className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                      data-testid={`button-toggle-raw-${idx}`}
                    >
                      {showRaw ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      <FileText className="w-3 h-3" />
                      Raw Responses ({rawRuns.length})
                    </button>
                    {showRaw && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                          {rawRuns.map((r, i) => (
                            <Card key={i} className="p-3 text-xs space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[9px]">{ENGINE_LABELS[r.engine] || r.engine}</Badge>
                                {r.webSearchStatus && r.webSearchStatus !== "not_applicable" && (
                                  <Badge
                                    className={`text-[8px] px-1 py-0 ${
                                      r.webSearchStatus === "grounded"
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                        : r.webSearchStatus === "fallback"
                                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                          : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                    }`}
                                    data-testid={`badge-search-status-${i}`}
                                  >
                                    {r.webSearchStatus === "grounded" ? "Web Search" : r.webSearchStatus === "fallback" ? "Fallback" : "No Search"}
                                  </Badge>
                                )}
                                <span className="text-muted-foreground truncate">{r.prompt_text || r.prompt_id}</span>
                              </div>
                              {r.webSearchStatus === "fallback" && r.fallbackReason && (
                                <div className="text-[10px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 rounded px-2 py-0.5">
                                  Fallback reason: {r.fallbackReason}
                                </div>
                              )}
                              <pre className="whitespace-pre-wrap text-[11px] text-muted-foreground leading-relaxed max-h-[200px] overflow-y-auto">
                                {r.raw_text}
                              </pre>
                            </Card>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function ScoreBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-secondary/50 rounded-md p-2.5 text-center">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function SourcesList({ runs }: { runs: RawRun[] }) {
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

  if (allCitations.length === 0) {
    return <div className="text-xs text-muted-foreground py-2">No citations available.</div>;
  }

  return (
    <div className="divide-y divide-border/50 border border-border/50 rounded-md overflow-hidden max-h-[300px] overflow-y-auto">
      {allCitations.map((c, i) => {
        let hostname = c.url;
        try { hostname = new URL(c.url).hostname.replace(/^www\./, ""); } catch {}
        const isVertexRedirect = c.url?.includes("vertexaisearch.cloud.google.com");
        const displayUrl = isVertexRedirect ? null : c.url;
        return (
          <a
            key={i}
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-secondary/50 transition-colors group"
          >
            <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0 group-hover:text-blue-500" />
            <span className="text-xs text-blue-600 dark:text-blue-400 group-hover:underline truncate flex-1">
              {c.title || hostname}
              {displayUrl && (
                <span className="text-muted-foreground font-normal ml-1 group-hover:no-underline">
                  ({displayUrl})
                </span>
              )}
            </span>
            <span className="text-[9px] px-1 py-0.5 rounded bg-secondary text-muted-foreground shrink-0">
              {(ENGINE_LABELS[c.engine] || c.engine).slice(0, 3)}
            </span>
          </a>
        );
      })}
    </div>
  );
}

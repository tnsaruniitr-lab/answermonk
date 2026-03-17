import { useState } from "react";
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

// ── Markdown report renderer ─────────────────────────────────────────────────

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

export function AuthoritySourcesPanel({ sessionId, brandName, segments, groupKey }: Props) {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"authority" | "brand">("authority");
  const [crawlError, setCrawlError] = useState<string | null>(null);

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
            <div className="rounded-lg border border-dashed border-border/60 bg-secondary/10 px-6 py-8 text-center space-y-3">
              {insightsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
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
                  {crawlMutation.isPending && (
                    <p className="text-[11px] text-muted-foreground">
                      This may take 1–3 minutes. Crawling and classifying citation URLs…
                    </p>
                  )}
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
            {/* Generate / re-run button */}
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
                      <MarkdownReport text={latestInsight.result_text} />
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

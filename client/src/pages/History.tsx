import { useState } from "react";
import { useHistory, useScoringHistory, useMultiSegmentSessions, useV2SegmentGroups } from "@/hooks/use-analysis";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Calendar, Zap, Search, BarChart3, Users, Trash2, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function HistoryPage() {
  const { data: history, isLoading: historyLoading } = useHistory();
  const { data: scoringHistory, isLoading: scoringLoading } = useScoringHistory();
  const { data: v2Sessions, isLoading: v2Loading } = useMultiSegmentSessions();
  const { data: v2Groups, isLoading: v2GroupsLoading } = useV2SegmentGroups();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [generatingTeaserId, setGeneratingTeaserId] = useState<number | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleDeleteSession = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (deletingId) return;
    setDeletingId(id);
    try {
      await apiRequest("DELETE", `/api/multisegment/sessions/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/multisegment/sessions"] });
      toast({ title: "Session deleted" });
    } catch {
      toast({ title: "Failed to delete session", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleGenerateTeaser = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (generatingTeaserId) return;
    setGeneratingTeaserId(id);
    try {
      await apiRequest("POST", `/api/multi-segment-sessions/${id}/teaser`);
      navigate(`/teaser/${id}`);
    } catch {
      toast({ title: "Failed to generate teaser", variant: "destructive" });
    } finally {
      setGeneratingTeaserId(null);
    }
  };

  const isLoading = historyLoading || scoringLoading || v2Loading || v2GroupsLoading;

  type UnifiedItem =
    | { type: "analyzer"; data: NonNullable<typeof history>[number] }
    | { type: "scoring"; data: NonNullable<typeof scoringHistory>[number] }
    | { type: "v2session"; data: NonNullable<typeof v2Sessions>[number] }
    | { type: "v2group"; data: NonNullable<typeof v2Groups>[number] };

  const unified: UnifiedItem[] = [];
  if (history) {
    for (const h of history) {
      unified.push({ type: "analyzer", data: h });
    }
  }
  if (scoringHistory) {
    for (const s of scoringHistory) {
      unified.push({ type: "scoring", data: s });
    }
  }
  if (v2Sessions) {
    for (const v of v2Sessions) {
      unified.push({ type: "v2session", data: v });
    }
  }
  if (v2Groups) {
    for (const g of v2Groups) {
      unified.push({ type: "v2group", data: g });
    }
  }
  unified.sort((a, b) => {
    const dateA = new Date(a.data.createdAt ?? 0).getTime();
    const dateB = new Date(b.data.createdAt ?? 0).getTime();
    return dateB - dateA;
  });

  return (
    <div className="min-h-screen bg-background">
      <nav className="w-full border-b border-border sticky top-0 z-50 bg-background">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/">
            <span className="text-base font-semibold tracking-tight" data-testid="text-logo">BrandSense</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="gap-1.5 text-sm" data-testid="button-back">
              <ArrowLeft className="w-3.5 h-3.5" />
              Analyzer
            </Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight" data-testid="text-history-heading">History</h1>
          <p className="text-sm text-muted-foreground">All past analyses and scoring runs</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-md" />
            ))}
          </div>
        ) : unified.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-muted-foreground text-sm">No analyses yet.</p>
            <Link href="/">
              <Button variant="outline" data-testid="button-start">Run your first analysis</Button>
            </Link>
          </div>
        ) : (
          <div className="border border-border rounded-md divide-y divide-border">
            {unified.map((item) => {
              if (item.type === "analyzer") {
                const d = item.data;
                return (
                  <div
                    key={`a-${d.id}`}
                    className="px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap"
                    data-testid={`row-history-${d.id}`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-[10px]">
                          <Search className="w-2.5 h-2.5 mr-1" />
                          Single Query
                        </Badge>
                        <span className="font-medium text-sm">{d.brand}</span>
                        <span className="text-xs text-muted-foreground truncate">"{d.query}"</span>
                      </div>
                      {d.createdAt && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(d.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-5 shrink-0">
                      <div className="text-center">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Presence</div>
                        <div className="text-lg font-semibold tabular-nums" data-testid={`text-presence-${d.id}`}>{d.presenceScore}</div>
                      </div>
                      <div className="w-px h-8 bg-border" />
                      <div className="text-center">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Rank</div>
                        <div className="text-lg font-semibold tabular-nums" data-testid={`text-rank-${d.id}`}>{d.rankScore}</div>
                      </div>
                    </div>
                  </div>
                );
              } else if (item.type === "v2session") {
                const d = item.data;
                const segs = Array.isArray(d.segments) ? d.segments : [];
                const segCount = segs.length;
                const scored = segs.filter((s: any) => s.scoringResult).length;
                const isCompetitor = (d as any).sessionType === "competitor";
                const parentBrand = (d as any).parentBrandName;

                return (
                  <Link
                    key={`v2-${d.id}`}
                    href={`/v2/${d.id}`}
                    data-testid={`link-v2-${d.id}`}
                    className="block"
                  >
                  <div
                    className={`px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap cursor-pointer hover:bg-secondary/30 transition-colors ${isCompetitor ? "border-l-2 border-l-orange-400" : ""}`}
                    data-testid={`row-v2-${d.id}`}
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        {isCompetitor ? (
                          <Badge variant="outline" className="text-[10px] border-orange-300 text-orange-600 dark:text-orange-400">
                            <Users className="w-2.5 h-2.5 mr-1" />
                            Competitor Report
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            <BarChart3 className="w-2.5 h-2.5 mr-1" />
                            Quick V2
                          </Badge>
                        )}
                        <span className="font-medium text-sm">{d.brandName}</span>
                        {isCompetitor && parentBrand && (
                          <span className="text-xs text-muted-foreground">vs {parentBrand}</span>
                        )}
                        {!isCompetitor && (
                          <span className="text-xs text-muted-foreground">{segCount} segment{segCount !== 1 ? "s" : ""}</span>
                        )}
                      </div>
                      {d.createdAt && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(d.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        {segs.slice(0, 3).map((seg: any, i: number) => {
                          const PERSONA_LABELS: Record<string, string> = {
                            marketing_agency: "Marketing Agency",
                            automation_consultant: "Automation",
                            corporate_cards_provider: "Corporate Cards",
                            expense_management_software: "Expense Management",
                            accounting_automation: "Accounting Automation",
                            invoice_management: "Invoice Management",
                            restaurant: "Restaurant",
                          };
                          const pLabel = seg.persona ? (PERSONA_LABELS[seg.persona] || seg.persona.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())) : "";
                          const sLabel = seg.seedType ? seg.seedType.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "";
                          const label = pLabel ? `${pLabel} ${sLabel}` : sLabel;
                          return (
                            <span key={i} className="text-[10px] text-muted-foreground">
                              {label}{seg.customerType ? ` → ${seg.customerType}` : ""}
                            </span>
                          );
                        })}
                        {segs.length > 3 && <span className="text-[10px] text-muted-foreground">+{segs.length - 3} more</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-center">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Scored</div>
                        <div className="text-lg font-semibold tabular-nums">{scored}/{segCount}</div>
                      </div>
                      {!isCompetitor && scored > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={(e) => handleGenerateTeaser(d.id, e)}
                          disabled={generatingTeaserId === d.id}
                          data-testid={`button-teaser-v2-${d.id}`}
                        >
                          <Sparkles className={`w-3 h-3 ${generatingTeaserId === d.id ? "animate-spin" : ""}`} />
                          {generatingTeaserId === d.id ? "Generating..." : "Teaser"}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => handleDeleteSession(d.id, e)}
                        disabled={deletingId === d.id}
                        data-testid={`button-delete-v2-${d.id}`}
                      >
                        <Trash2 className={`w-3.5 h-3.5 ${deletingId === d.id ? "animate-pulse" : ""}`} />
                      </Button>
                    </div>
                  </div>
                  </Link>
                );
              } else if (item.type === "v2group") {
                const d = item.data;
                const segCount = d.segments.length;
                const completedCount = d.segments.filter((s: any) => s.status === "completed").length;
                const segmentLabels = d.segments.map((s: any) => {
                  const profile = s.rawData?.profile;
                  if (profile) {
                    const vertical = profile.verticals?.[0] || "";
                    const geo = profile.geo || "";
                    return [vertical, geo].filter(Boolean).join(", ") || profile.persona || "segment";
                  }
                  return "segment";
                });

                return (
                  <Link
                    key={`v2g-${d.groupKey}`}
                    href={`/v2/${d.groupKey}`}
                    data-testid={`link-v2group-${d.groupKey}`}
                    className="block"
                  >
                  <div
                    className="px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap cursor-pointer hover:bg-secondary/30 transition-colors"
                    data-testid={`row-v2group-${d.groupKey}`}
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-[10px]">
                          <BarChart3 className="w-2.5 h-2.5 mr-1" />
                          Quick V2
                        </Badge>
                        <span className="font-medium text-sm">{d.brandName}</span>
                        <span className="text-xs text-muted-foreground">{segCount} segment{segCount !== 1 ? "s" : ""}</span>
                      </div>
                      {d.createdAt && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(d.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        {segmentLabels.slice(0, 4).map((label: string, i: number) => (
                          <span key={i} className="text-[10px] text-muted-foreground">{label}</span>
                        ))}
                        {segmentLabels.length > 4 && <span className="text-[10px] text-muted-foreground">+{segmentLabels.length - 4} more</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-center">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Scored</div>
                        <div className="text-lg font-semibold tabular-nums">{completedCount}/{segCount}</div>
                      </div>
                    </div>
                  </div>
                  </Link>
                );
              } else {
                const d = item.data;
                const result = d.resultJson;
                const appRate = result?.appearance_rate != null ? Math.round(result.appearance_rate * 100) : null;
                const primaryRate = result?.primary_rate != null ? Math.round(result.primary_rate * 100) : null;
                const engineBreakdown = result?.engine_breakdown ?? {};

                return (
                  <Link
                    key={`s-${d.id}`}
                    href={`/scoring/${d.id}`}
                    data-testid={`link-scoring-${d.id}`}
                    className="block"
                  >
                  <div
                    className="px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap cursor-pointer hover:bg-secondary/30 transition-colors"
                    data-testid={`row-scoring-${d.id}`}
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-[10px]">
                          <Zap className="w-2.5 h-2.5 mr-1" />
                          GEO {d.mode === "quick" ? "Quick" : "Full"}
                        </Badge>
                        <span className="font-medium text-sm">{d.brandName}</span>
                        <span className="text-xs text-muted-foreground">{d.promptCount} prompts</span>
                      </div>
                      {d.createdAt && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(d.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                      )}
                      {Object.keys(engineBreakdown).length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {Object.entries(engineBreakdown).map(([engine, eData]: [string, any]) => (
                            <span key={engine} className="text-[10px] text-muted-foreground">
                              {engine}: {eData.error_runs > 0 && eData.valid_runs === 0 ? "failed" : `${Math.round((eData.appearance_rate ?? 0) * 100)}%`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-5 shrink-0">
                      {appRate !== null && (
                        <>
                          <div className="text-center">
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Appear</div>
                            <div className="text-lg font-semibold tabular-nums" data-testid={`text-appear-${d.id}`}>{appRate}%</div>
                          </div>
                          <div className="w-px h-8 bg-border" />
                        </>
                      )}
                      {primaryRate !== null && (
                        <div className="text-center">
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Top 3</div>
                          <div className="text-lg font-semibold tabular-nums" data-testid={`text-top3-${d.id}`}>{primaryRate}%</div>
                        </div>
                      )}
                      {d.status !== "completed" && (
                        <Badge variant="outline" className="text-xs">{d.status}</Badge>
                      )}
                    </div>
                  </div>
                  </Link>
                );
              }
            })}
          </div>
        )}
      </main>
    </div>
  );
}

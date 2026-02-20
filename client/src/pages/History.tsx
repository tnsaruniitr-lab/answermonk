import { useHistory, useScoringHistory, useMultiSegmentSessions } from "@/hooks/use-analysis";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Calendar, Zap, Search, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function HistoryPage() {
  const { data: history, isLoading: historyLoading } = useHistory();
  const { data: scoringHistory, isLoading: scoringLoading } = useScoringHistory();
  const { data: v2Sessions, isLoading: v2Loading } = useMultiSegmentSessions();

  const isLoading = historyLoading || scoringLoading || v2Loading;

  type UnifiedItem =
    | { type: "analyzer"; data: NonNullable<typeof history>[number] }
    | { type: "scoring"; data: NonNullable<typeof scoringHistory>[number] }
    | { type: "v2session"; data: NonNullable<typeof v2Sessions>[number] };

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

                return (
                  <Link
                    key={`v2-${d.id}`}
                    href={`/v2/${d.id}`}
                    data-testid={`link-v2-${d.id}`}
                    className="block"
                  >
                  <div
                    className="px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap cursor-pointer hover:bg-secondary/30 transition-colors"
                    data-testid={`row-v2-${d.id}`}
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
                        {segs.slice(0, 3).map((seg: any, i: number) => (
                          <span key={i} className="text-[10px] text-muted-foreground">
                            {seg.seedType}{seg.customerType ? ` → ${seg.customerType}` : ""}
                          </span>
                        ))}
                        {segs.length > 3 && <span className="text-[10px] text-muted-foreground">+{segs.length - 3} more</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-center">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Scored</div>
                        <div className="text-lg font-semibold tabular-nums">{scored}/{segCount}</div>
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

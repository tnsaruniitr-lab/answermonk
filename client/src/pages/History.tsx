import { useHistory } from "@/hooks/use-analysis";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function HistoryPage() {
  const { data: history, isLoading } = useHistory();

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
          <p className="text-sm text-muted-foreground">Past brand presence analyses</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-md" />
            ))}
          </div>
        ) : history?.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-muted-foreground text-sm">No analyses yet.</p>
            <Link href="/">
              <Button variant="outline" data-testid="button-start">Run your first analysis</Button>
            </Link>
          </div>
        ) : (
          <div className="border border-border rounded-md divide-y divide-border">
            {history?.map((item) => (
              <div
                key={item.id}
                className="px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap"
                data-testid={`row-history-${item.id}`}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-medium text-sm">{item.brand}</span>
                    <span className="text-xs text-muted-foreground truncate">"{item.query}"</span>
                  </div>
                  {item.createdAt && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(item.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-5 shrink-0">
                  <div className="text-center">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Presence</div>
                    <div className="text-lg font-semibold tabular-nums" data-testid={`text-presence-${item.id}`}>{item.presenceScore}</div>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="text-center">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Rank</div>
                    <div className="text-lg font-semibold tabular-nums" data-testid={`text-rank-${item.id}`}>{item.rankScore}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

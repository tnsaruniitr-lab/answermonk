import { useHistory } from "@/hooks/use-analysis";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Calendar, Search } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function HistoryPage() {
  const { data: history, isLoading } = useHistory();

  return (
    <div className="min-h-screen bg-background font-sans p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-serif font-bold text-primary">Analysis History</h1>
            <p className="text-muted-foreground">Past brand presence reports</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Analyzer
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : history?.length === 0 ? (
          <Card className="p-12 text-center space-y-4 bg-muted/20 border-dashed">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No history found</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              You haven't run any analyses yet. Try analyzing your brand to see results here.
            </p>
            <Link href="/">
              <Button>Start Analysis</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4">
            {history?.map((item) => (
              <Card key={item.id} className="p-6 hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">{item.brand}</span>
                    <span className="text-muted-foreground">in</span>
                    <span className="italic text-muted-foreground">"{item.query}"</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {item.createdAt && format(new Date(item.createdAt), "PPP p")}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Presence</div>
                    <div className="text-2xl font-serif font-bold text-primary">{item.presenceScore}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Rank</div>
                    <div className="text-2xl font-serif font-bold text-accent">{item.rankScore}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useRunAnalysis } from "@/hooks/use-analysis";
import { AnalysisResults } from "@/components/AnalysisResults";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowRight, History, Sparkles, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const ENGINE_LABELS = ["ChatGPT", "Claude", "Gemini", "DeepSeek"];

export default function Analyzer() {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("");
  const [webSearch, setWebSearch] = useState(false);
  const { mutate: analyze, isPending, data: result, reset } = useRunAnalysis();
  const { toast } = useToast();

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !brand.trim()) {
      toast({
        title: "Missing fields",
        description: "Please enter both a query and a brand name.",
        variant: "destructive",
      });
      return;
    }
    reset();
    analyze({ query, brand, webSearch }, {
      onError: (err) => {
        toast({
          title: "Analysis Failed",
          description: err.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <nav className="w-full border-b border-border sticky top-0 z-50 bg-background">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <span className="text-base font-semibold tracking-tight" data-testid="text-logo">BrandSense</span>
          <div className="flex items-center gap-4">
            <Link href="/prompts" className="text-sm text-muted-foreground flex items-center gap-1.5 transition-colors hover:text-foreground" data-testid="link-prompts">
              <Sparkles className="w-3.5 h-3.5" />
              Prompts
            </Link>
            <Link href="/history" className="text-sm text-muted-foreground flex items-center gap-1.5 transition-colors hover:text-foreground" data-testid="link-history">
              <History className="w-3.5 h-3.5" />
              History
            </Link>
            <Link href="/brand-intelligence" className="text-sm text-muted-foreground flex items-center gap-1.5 transition-colors hover:text-foreground" data-testid="link-brand-intelligence">
              <Brain className="w-3.5 h-3.5" />
              AI Memory
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-start px-6">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {!result && !isPending && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="pt-20 pb-10 space-y-3"
              >
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight" data-testid="text-heading">
                  Your customers ask AI, are you the answer?
                </h1>
                <p className="text-muted-foreground text-base leading-relaxed max-w-lg">
                  See how your brand ranks across ChatGPT, Claude, Gemini, and DeepSeek.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {(result || isPending) && (
            <div className="pt-8 pb-6">
              <span className="text-sm text-muted-foreground">
                Results for <span className="font-medium text-foreground">{brand || "..."}</span>
              </span>
            </div>
          )}

          <form onSubmit={handleAnalyze} className={`${result ? 'pb-8' : 'pb-16'}`}>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-1.5">
                <label htmlFor="query" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Query</label>
                <Input
                  id="query"
                  data-testid="input-query"
                  placeholder="Best CRM for small business"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={isPending}
                  autoFocus
                  className="bg-secondary/50 border-border"
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <label htmlFor="brand" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Brand</label>
                <Input
                  id="brand"
                  data-testid="input-brand"
                  placeholder="Salesforce"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  disabled={isPending}
                  className="bg-secondary/50 border-border"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={isPending}
                  size="icon"
                  data-testid="button-analyze"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Checkbox
                id="webSearch"
                data-testid="checkbox-web-search"
                checked={webSearch}
                onCheckedChange={(checked) => setWebSearch(checked === true)}
                disabled={isPending}
              />
              <label htmlFor="webSearch" className="text-xs text-muted-foreground cursor-pointer select-none">
                Enable web search for ChatGPT (uses real-time internet data)
              </label>
            </div>
          </form>

          {isPending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 space-y-6"
            >
              <div className="flex items-center justify-center gap-8">
                {ENGINE_LABELS.map((engine, i) => (
                  <motion.div
                    key={engine}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.15 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-2 h-2 rounded-full bg-foreground/20 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                    <span className="text-xs text-muted-foreground">{engine}</span>
                  </motion.div>
                ))}
              </div>
              <p className="text-center text-sm text-muted-foreground">Querying AI engines...</p>
            </motion.div>
          )}

          {result && <AnalysisResults data={result} />}
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border mt-auto">
        BrandSense
      </footer>
    </div>
  );
}

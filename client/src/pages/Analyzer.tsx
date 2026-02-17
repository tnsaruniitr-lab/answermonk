import { useState } from "react";
import { useRunAnalysis } from "@/hooks/use-analysis";
import { AnalysisResults } from "@/components/AnalysisResults";
import { InputMinimal } from "@/components/ui/input-minimal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Search, Sparkles, TrendingUp, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function Analyzer() {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("");
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
    
    // Clear previous results
    reset();
    
    analyze({ query, brand }, {
      onError: (err) => {
        toast({
          title: "Analysis Failed",
          description: err.message,
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/10">
      
      {/* Navigation */}
      <nav className="w-full border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-xl font-serif font-bold tracking-tight">Sherlok.ai</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/history" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </Link>
            <Button variant="ghost" className="text-sm font-medium">
              About
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-12 md:py-20 max-w-5xl">
        
        {/* Hero Section */}
        <AnimatePresence mode="wait">
          {!result && !isPending && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6 mb-16"
            >
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-primary tracking-tight">
                Does AI recommend you?
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Discover how your brand appears in AI-generated responses across ChatGPT, Claude, Gemini, and DeepSeek.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Form */}
        <div className={`transition-all duration-500 ease-in-out ${result ? 'mb-12' : 'mb-20'}`}>
          <Card className="p-8 md:p-10 shadow-xl shadow-primary/5 border-primary/10 bg-white/50 backdrop-blur-sm">
            <form onSubmit={handleAnalyze} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label htmlFor="query" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Target Search Query
                  </label>
                  <InputMinimal
                    id="query"
                    placeholder="e.g. Best CRM for small business"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={isPending}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground/60">What would your potential customers ask AI?</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="brand" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Your Brand Name
                  </label>
                  <InputMinimal
                    id="brand"
                    placeholder="e.g. Salesforce"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    disabled={isPending}
                  />
                  <p className="text-xs text-muted-foreground/60">The exact brand name you want to track.</p>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={isPending}
                  className="px-12 py-6 text-lg rounded-full font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing Engines...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-5 w-5" />
                      Analyze Presence
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Loading State Animation */}
        {isPending && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-8 py-12"
          >
            <div className="flex justify-center gap-4">
              {["ChatGPT", "Claude", "Gemini", "DeepSeek"].map((engine, i) => (
                <motion.div
                  key={engine}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.2 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 rounded-full bg-secondary animate-pulse flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{engine}</span>
                </motion.div>
              ))}
            </div>
            <p className="text-muted-foreground animate-pulse">Querying LLMs and aggregating results...</p>
          </motion.div>
        )}

        {/* Results Section */}
        {result && (
          <AnalysisResults data={result} />
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border/40 mt-auto">
        <p>© 2025 Sherlok.ai. Intelligent Brand Presence Analytics.</p>
      </footer>
    </div>
  );
}

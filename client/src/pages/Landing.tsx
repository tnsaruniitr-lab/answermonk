import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowRight, Sparkles, Globe, Activity, BarChart3, Code, Bot, Zap, Database, Loader2, AlertCircle } from "lucide-react";

function normalizeDomain(url: string): string {
  try {
    const withProtocol = url.startsWith("http") ? url : `https://${url}`;
    const parsed = new URL(withProtocol);
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return url.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "");
  }
}

export default function Landing() {
  const [, navigate] = useLocation();
  const [url, setUrl] = useState("");
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const submitMutation = useMutation({
    mutationFn: async (websiteUrl: string) => {
      const res = await apiRequest("POST", "/api/landing/submit", {
        websiteUrl,
        _hp: honeypotRef.current?.value ?? "",
      });
      return res.json();
    },
    onSuccess: (data) => {
      setSubmissionId(data.id);
      setError(null);
    },
    onError: (err: any) => {
      setError(err?.message || "Something went wrong. Please try again.");
    },
  });

  const { data: submission } = useQuery({
    queryKey: ["/api/landing/submission", submissionId],
    queryFn: async () => {
      const res = await fetch(`/api/landing/submission/${submissionId}`);
      return res.json();
    },
    enabled: submissionId !== null && submission?.status !== "complete",
    refetchInterval: (data) =>
      data?.state?.data?.status === "complete" || data?.state?.data?.status === "error" ? false : 2000,
  });

  const isProcessing = submitMutation.isPending || (submissionId !== null && submission?.status === "processing");
  const isComplete = submission?.status === "complete";
  const isError = submission?.status === "error";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = url.trim();
    if (!trimmed) return;
    submitMutation.mutate(trimmed);
  }

  const steps = [
    { title: "Website Ingestion", desc: "Deep crawl of domain architecture", icon: Globe },
    { title: "Signal Discovery", desc: "Entity & service extraction via PNC", icon: Activity },
    { title: "Prompt Execution", desc: "Cross-engine query runs", icon: Code },
    { title: "Insight Report", desc: "Visibility & gap analysis", icon: BarChart3 },
  ];

  return (
    <div
      className="min-h-screen bg-[#0A0F1E] text-slate-200 font-sans overflow-hidden relative"
      data-testid="landing-page"
    >
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.05)_0%,_transparent_60%)] pointer-events-none" />

      {/* Nav — logo only */}
      <nav className="relative z-10 flex items-center px-8 py-6 max-w-7xl mx-auto border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-white">
            Nexalytics <span className="text-blue-400 font-light">GEO</span>
          </span>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
          </span>
          Intelligence Engine v2.0 — Live
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
          Measure your brand's visibility in{" "}
          <span style={{background: "linear-gradient(to right, #60a5fa, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"}}>
            AI search results
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
          Nexalytics GEO analyzes how ChatGPT, Claude, Gemini, and Perplexity mention your
          brand. Enter your website to get a free Prompt Network analysis — no account required.
        </p>

        {/* Input area */}
        {!isComplete && !isError && (
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative group">
            {/* Honeypot — hidden from real users */}
            <input
              ref={honeypotRef}
              name="_hp"
              type="text"
              tabIndex={-1}
              aria-hidden="true"
              autoComplete="off"
              className="absolute opacity-0 pointer-events-none w-0 h-0"
            />
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-violet-500 rounded-2xl blur opacity-20 group-hover:opacity-35 transition duration-1000" />
            <div className="relative flex items-center bg-[#111827]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl">
              <div className="pl-4 flex-shrink-0">
                <Globe className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter your website URL (e.g., acme.com)"
                className="flex-1 bg-transparent border-none outline-none text-white px-4 py-4 text-lg placeholder:text-slate-500"
                disabled={isProcessing}
                data-testid="input-website-url"
              />
              <button
                type="submit"
                disabled={isProcessing || !url.trim()}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="bg-white text-black hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)] min-w-[120px] justify-center"
                data-testid="button-analyze"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing
                  </>
                ) : (
                  <>
                    Analyze
                    <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${isHovered ? "translate-x-1" : ""}`} />
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="mt-3 flex items-center gap-2 text-red-400 text-sm justify-center" data-testid="text-error">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
          </form>
        )}

        {/* Processing state */}
        {isProcessing && submissionId && (
          <div className="mt-8 max-w-md mx-auto" data-testid="status-processing">
            <div className="bg-[#111827]/60 border border-white/10 rounded-2xl p-6 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-3" />
              <p className="text-white font-medium">Analyzing {normalizeDomain(url)}</p>
              <p className="text-slate-400 text-sm mt-1">
                Extracting services, customer types, and business signals…
              </p>
            </div>
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="mt-8 max-w-md mx-auto" data-testid="status-error">
            <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <p className="text-white font-medium">Analysis failed</p>
              <p className="text-slate-400 text-sm mt-1">We couldn't analyze that URL. Please check it and try again.</p>
              <button
                onClick={() => { setSubmissionId(null); setError(null); }}
                className="mt-4 text-blue-400 text-sm underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Complete — show PNC results */}
        {isComplete && submission?.pncResult && (
          <div className="mt-8 max-w-2xl mx-auto" data-testid="status-complete">
            <div className="bg-[#111827]/60 border border-blue-500/20 rounded-2xl p-6 text-left">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-green-400 text-sm font-medium">Analysis complete for {normalizeDomain(url)}</span>
              </div>

              {submission.pncResult.serviceTypes?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Services Detected</p>
                  <div className="flex flex-wrap gap-2">
                    {submission.pncResult.serviceTypes.map((s: string) => (
                      <span key={s} className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm" data-testid={`badge-service-${s}`}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {submission.pncResult.customerTypes?.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Customer Types</p>
                  <div className="flex flex-wrap gap-2">
                    {submission.pncResult.customerTypes.map((c: string) => (
                      <span key={c} className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm" data-testid={`badge-customer-${c}`}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => navigate(`/v2/${submissionId}`)}
                className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                data-testid="button-run-analysis"
              >
                Run Full GEO Analysis
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Trust bar */}
        {!isComplete && (
          <div className="mt-14 pt-8 border-t border-white/5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-5">
              Analyzing signals across primary intelligence engines
            </p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-14 opacity-50 hover:opacity-80 transition-opacity duration-500">
              <div className="flex items-center gap-2 font-medium"><Bot className="w-5 h-5" /> ChatGPT</div>
              <div className="flex items-center gap-2 font-medium"><Zap className="w-5 h-5" /> Claude</div>
              <div className="flex items-center gap-2 font-medium"><Sparkles className="w-5 h-5" /> Gemini</div>
              <div className="flex items-center gap-2 font-medium"><Database className="w-5 h-5" /> Perplexity</div>
            </div>
          </div>
        )}
      </main>

      {/* Pipeline visualization */}
      <section className="relative z-10 py-16 bg-black/20 border-y border-white/5 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold text-white">The Intelligence Pipeline</h2>
            <p className="text-slate-400 mt-2">From raw domain to actionable GEO insights in minutes.</p>
          </div>
          <div className="relative">
            <div className="absolute top-8 left-0 w-full h-0.5 bg-slate-800 hidden md:block" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {steps.map((item, index) => (
                <div key={item.title} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border transition-all duration-500 ${
                      activeStep === index
                        ? "bg-blue-500/20 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.3)] text-blue-400"
                        : "bg-[#111827] border-white/10 text-slate-500"
                    }`}
                    data-testid={`step-${index}`}
                  >
                    <item.icon className="w-7 h-7" />
                  </div>
                  <h3 className={`font-semibold mb-1 transition-colors text-center ${activeStep === index ? "text-white" : "text-slate-300"}`}>
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-500 text-center">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="relative z-10 py-20 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              color: "blue",
              icon: <Code className="w-6 h-6 text-blue-400" />,
              title: "Prompt Network",
              desc: "Auto-generate 25–30 intent-based prompts mapped to your exact services and customer personas. Test across query variations at scale.",
            },
            {
              color: "violet",
              icon: <Activity className="w-6 h-6 text-violet-400" />,
              title: "Signal Intelligence",
              desc: "Identify exactly which third-party citations, reviews, and mentions are feeding AI models and shaping your brand's narrative.",
            },
            {
              color: "emerald",
              icon: <BarChart3 className="w-6 h-6 text-emerald-400" />,
              title: "Live Reporting",
              desc: "Beautiful dashboards showing share of voice, competitor matrices, and clear action items to improve your AI search presence.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="bg-gradient-to-b from-[#111827] to-[#0D1326] border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all group"
              data-testid={`card-feature-${card.title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className={`w-12 h-12 rounded-lg bg-${card.color}-500/10 border border-${card.color}-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                {card.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{card.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features definition list — semantic for LLM crawlers ── */}
      <section
        id="features"
        aria-labelledby="features-heading"
        className="relative z-10 max-w-4xl mx-auto px-6 pb-4"
      >
        {/* Visually hidden heading keeps semantic structure without affecting visual layout */}
        <h2 id="features-heading" className="sr-only">Key features of Nexalytics GEO Intelligence</h2>
        <dl className="sr-only">
          <div>
            <dt>Prompt Network Creator (PNC)</dt>
            <dd>
              Automatically generates service-specific and persona-specific search prompts from
              your website using AI analysis. Produces 25–30 intent-based queries per analysis
              run — no manual configuration required.
            </dd>
          </div>
          <div>
            <dt>Cross-engine scoring across ChatGPT, Claude, and Gemini</dt>
            <dd>
              Every prompt is run against all three major AI engines simultaneously. Results are
              weighted by engine market share: ChatGPT 35%, Gemini 35%, Claude 20%, Perplexity 10%.
            </dd>
          </div>
          <div>
            <dt>Competitor leaderboard</dt>
            <dd>
              Identifies which competitors appear most frequently in AI responses for your target
              prompts, with their presence score and rank position per engine.
            </dd>
          </div>
          <div>
            <dt>Citation source breakdown</dt>
            <dd>
              Crawls and classifies all URLs cited by AI engines — directories, review platforms,
              brand pages, media coverage — to show which third-party sites drive AI recommendations
              in your category.
            </dd>
          </div>
          <div>
            <dt>Signal Consistency analysis</dt>
            <dd>
              Checks whether AI models agree on the same facts about your brand — location,
              services, attributes — or produce conflicting information across engines.
            </dd>
          </div>
        </dl>
      </section>

      {/* ── FAQ — visible HTML and semantically structured for LLM extraction ── */}
      <section
        id="faq"
        aria-labelledby="faq-heading"
        className="relative z-10 max-w-3xl mx-auto px-6 py-16"
      >
        <h2
          id="faq-heading"
          className="text-2xl font-semibold text-white text-center mb-10"
        >
          Common questions about GEO and AI search
        </h2>

        <div className="space-y-6">
          {[
            {
              q: "What is GEO (Generative Engine Optimization)?",
              a: "GEO is the practice of optimizing a brand's presence in AI-generated search results from engines like ChatGPT, Claude, Gemini, and Perplexity. Unlike traditional SEO — which targets ranked URL lists — GEO focuses on how often and how prominently a brand is mentioned within the AI-generated answer text itself.",
            },
            {
              q: "How does the Prompt Network Creator (PNC) work?",
              a: "The PNC analyzes your website to extract service types and customer segments. It then auto-generates 25–30 natural-language search prompts that a real customer might ask an AI engine — for example: \"Find the 10 most trusted [service] providers in [city]\". These prompts run against multiple AI engines and results are scored for presence, rank position, and share of voice.",
            },
            {
              q: "What is a share-of-voice score in AI search?",
              a: "Share of voice in AI search measures how often your brand appears in AI engine responses relative to competitors, weighted by rank position and engine importance. A score of 100 means your brand is the top-cited answer across all tested prompts and engines. A score of 0 means your brand does not appear.",
            },
            {
              q: "What are citation sources in AI search results?",
              a: "AI engines cite external sources when generating answers. These may include review platforms (G2, Trustpilot), directories (Clutch, Yelp), industry publications, and brand websites. Nexalytics crawls and classifies these citation sources to show which third-party sites drive AI visibility for your brand and competitors.",
            },
            {
              q: "How long does a GEO analysis take?",
              a: "A full analysis — website extraction, prompt generation, cross-engine scoring, and report generation — typically completes in 3 to 8 minutes depending on the number of service segments and AI engine response times.",
            },
          ].map(({ q, a }) => (
            <article
              key={q}
              className="bg-[#111827]/50 border border-white/8 rounded-xl p-6 hover:border-white/15 transition-colors"
            >
              <h3 className="text-white font-medium mb-2">{q}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{a}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-sm text-slate-500">
        <p>© 2026 Nexalytics GEO. All rights reserved.</p>
      </footer>
    </div>
  );
}

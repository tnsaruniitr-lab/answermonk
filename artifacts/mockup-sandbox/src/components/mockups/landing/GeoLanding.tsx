import React, { useState, useEffect } from "react";
import { ArrowRight, Sparkles, Database, LayoutTemplate, Activity, ChevronRight, Globe, Lock, Code, BarChart3, Bot, Zap } from "lucide-react";

export function GeoLanding() {
  const [url, setUrl] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // Auto-advance the pipeline steps for visual effect
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-slate-200 font-sans selection:bg-blue-500/30 overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+CjxjaXJjbGUgY3g9IjEiIGN5PSIxIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIi8+Cjwvc3ZnPg==')] opacity-[0.15] pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-white">Nexalytics <span className="text-blue-400 font-light">GEO</span></span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <a href="#" className="hover:text-white transition-colors">Platform</a>
          <a href="#" className="hover:text-white transition-colors">Solutions</a>
          <a href="#" className="hover:text-white transition-colors">Pricing</a>
          <a href="#" className="text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-all border border-white/5">Sign In</a>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Intelligence Engine v2.0 Live
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
          Dominate <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">AI Search</span> Visibility.
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
          Map, analyze, and optimize how Generative AI engines perceive your brand. Discover where you rank in ChatGPT, Claude, and Perplexity before your competitors do.
        </p>

        {/* Input Area */}
        <div className="max-w-3xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-violet-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex items-center bg-[#111827]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl">
            <div className="pl-4 flex-shrink-0">
              <Globe className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter your website URL (e.g., example.com)"
              className="flex-1 bg-transparent border-none outline-none text-white px-4 py-4 text-lg placeholder:text-slate-500"
            />
            <button 
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="bg-white text-black hover:bg-slate-200 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              Analyze
              <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
            </button>
          </div>
        </div>

        {/* Trust Bar */}
        <div className="mt-16 pt-8 border-t border-white/5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-6">Analyzing signals across primary intelligence engines</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center gap-2 font-medium text-lg"><Bot className="w-5 h-5"/> ChatGPT</div>
            <div className="flex items-center gap-2 font-medium text-lg"><Zap className="w-5 h-5"/> Claude</div>
            <div className="flex items-center gap-2 font-medium text-lg"><Sparkles className="w-5 h-5"/> Gemini</div>
            <div className="flex items-center gap-2 font-medium text-lg"><Database className="w-5 h-5"/> Perplexity</div>
          </div>
        </div>
      </main>

      {/* Pipeline Visualization */}
      <section className="relative z-10 py-20 bg-black/20 border-y border-white/5 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold text-white">The Intelligence Pipeline</h2>
            <p className="text-slate-400 mt-2">From raw domain to actionable GEO insights in minutes.</p>
          </div>

          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -translate-y-1/2 hidden md:block"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { step: 1, title: "Website Ingestion", desc: "Deep crawl of domain architecture", icon: Globe },
                { step: 2, title: "Signal Discovery", desc: "Entity & service extraction", icon: Activity },
                { step: 3, title: "Prompt Execution", desc: "Cross-engine query runs", icon: Code },
                { step: 4, title: "Insight Report", desc: "Visibility & gap analysis", icon: BarChart3 },
              ].map((item, index) => (
                <div key={item.step} className="relative z-10 flex flex-col items-center">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border transition-all duration-500 ${
                    activeStep === index 
                      ? 'bg-blue-500/20 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.3)] text-blue-400' 
                      : 'bg-[#111827] border-white/10 text-slate-500'
                  }`}>
                    <item.icon className="w-7 h-7" />
                  </div>
                  <h3 className={`font-semibold mb-1 transition-colors ${activeStep === index ? 'text-white' : 'text-slate-300'}`}>
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-500 text-center">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="relative z-10 py-24 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-gradient-to-b from-[#111827] to-[#0D1326] border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all group">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-blue-500/20">
              <NetworkIcon className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Prompt Network</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Auto-generate hundreds of intent-based prompts mapping to your exact services and customer personas. Test across millions of query variations.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-gradient-to-b from-[#111827] to-[#0D1326] border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all group">
            <div className="w-12 h-12 rounded-lg bg-violet-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-violet-500/20">
              <Activity className="w-6 h-6 text-violet-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Signal Intelligence</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Identify exactly which third-party citations, reviews, and PR mentions are feeding the AI models and shaping your brand's narrative.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-gradient-to-b from-[#111827] to-[#0D1326] border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all group">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-emerald-500/20">
              <LayoutTemplate className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Live Reporting</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Beautiful, client-ready dashboards showing share of voice, competitor matrices, and clear action items for optimization.
            </p>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-sm text-slate-500">
        <p>© 2026 Nexalytics GEO. All rights reserved.</p>
      </footer>
    </div>
  );
}

// Custom icon for the feature card
function NetworkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="16" y="16" width="6" height="6" rx="1" />
      <rect x="2" y="16" width="6" height="6" rx="1" />
      <rect x="9" y="2" width="6" height="6" rx="1" />
      <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
      <path d="M12 12V8" />
    </svg>
  );
}

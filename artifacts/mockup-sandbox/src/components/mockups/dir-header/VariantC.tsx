import React from 'react';
import { ArrowRight, Activity, Zap, Cpu, Sparkles, Building2, TrendingUp, Trophy } from 'lucide-react';

const Tile = ({ 
  category, 
  query, 
  brand, 
  score, 
  accentColor,
  rivals,
  engines
}: { 
  category: string; 
  query: string; 
  brand: string; 
  score: number; 
  accentColor: string;
  rivals: string[];
  engines: string[];
}) => {
  return (
    <div className="group relative flex flex-col bg-[rgba(255,255,255,0.92)] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl border border-white overflow-hidden transition-all duration-300 hover:shadow-[0_20px_40px_rgba(139,92,246,0.08)] hover:-translate-y-1">
      {/* Accent Top Stripe */}
      <div 
        className="h-[3px] w-full" 
        style={{ backgroundColor: accentColor }}
      />
      
      {/* Inner Glow on Hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ 
          background: `radial-gradient(120% 150px at 50% 0%, ${accentColor}15 0%, transparent 100%)` 
        }}
      />
      
      <div className="p-6 flex flex-col flex-grow relative z-10">
        <div className="flex justify-between items-start mb-4">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100/80 text-gray-700 border border-gray-200/50 uppercase tracking-wider">
            {category}
          </span>
          <div className="flex gap-1.5">
            {engines.map((engine, i) => (
              <span key={i} className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white border border-gray-100 shadow-sm text-gray-500 text-[10px]" title={engine}>
                {engine === 'ChatGPT' && <Zap size={10} className="text-emerald-500" />}
                {engine === 'Claude' && <Cpu size={10} className="text-amber-500" />}
                {engine === 'Gemini' && <Sparkles size={10} className="text-blue-500" />}
              </span>
            ))}
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900 leading-snug mb-6 line-clamp-2 min-h-[3rem]">
          {query}
        </h3>

        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center border border-gray-100">
                <Building2 size={20} style={{ color: accentColor }} />
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Top Brand</div>
                <div className="text-base font-bold text-gray-900">{brand}</div>
              </div>
            </div>
            
            {/* Score Ring */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                <path
                  className="text-gray-100"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  style={{ stroke: accentColor }}
                  strokeWidth="3"
                  strokeDasharray={`${score}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-[13px] font-bold text-gray-900">{score}</span>
              </div>
            </div>
          </div>
          
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">Top Rivals</span>
            <div className="flex -space-x-2">
              {rivals.map((rival, i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[9px] font-medium text-gray-600 shadow-sm z-10 relative hover:z-20 hover:-translate-y-0.5 transition-transform" title={rival}>
                  {rival.charAt(0)}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto">
          <button className="w-full group/btn flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 rounded-lg py-2.5 px-4 text-sm font-semibold transition-colors">
            View full report
            <ArrowRight size={14} className="text-gray-400 group-hover/btn:text-gray-900 group-hover/btn:translate-x-0.5 transition-all" />
          </button>
        </div>
      </div>
    </div>
  );
};

export function VariantC() {
  const tiles = [
    {
      category: "Healthcare",
      query: "Best digital health platforms for women",
      brand: "Cleo",
      score: 87,
      accentColor: "#ec4899", // pink-500
      rivals: ["Maven", "Ovia", "Flo"],
      engines: ["ChatGPT", "Claude", "Gemini"]
    },
    {
      category: "Fintech",
      query: "Best AI expense management tools",
      brand: "Brex",
      score: 79,
      accentColor: "#3b82f6", // blue-500
      rivals: ["Ramp", "Ramp", "Expensify"],
      engines: ["ChatGPT", "Claude"]
    },
    {
      category: "SaaS",
      query: "Best CRM for startups",
      brand: "HubSpot",
      score: 91,
      accentColor: "#f97316", // orange-500
      rivals: ["Salesforce", "Pipedrive", "Zendesk"],
      engines: ["ChatGPT", "Claude", "Gemini"]
    }
  ];

  return (
    <div 
      className="relative w-full min-h-screen font-sans overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)',
        padding: '48px 60px'
      }}
    >
      {/* Container */}
      <div className="max-w-6xl mx-auto relative">
        
        {/* Header Section */}
        <div className="relative flex flex-col items-center justify-center text-center mb-16 pt-10">
          
          {/* Spotlight Glow Blob */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"
            style={{
              width: '600px',
              height: '200px',
              background: 'radial-gradient(ellipse, rgba(139,92,246,0.18) 0%, transparent 70%)',
              filter: 'blur(20px)'
            }}
          />

          <div className="relative z-10 flex flex-col items-center">
            {/* Live Intelligence Badge */}
            <div className="mb-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-white/80 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"></span>
              <span className="text-[10px] font-bold text-gray-800 tracking-[0.15em]">LIVE INTELLIGENCE</span>
            </div>

            {/* H2 Heading */}
            <h2 className="text-[38px] font-[800] text-[#1e1b4b] leading-tight max-w-2xl mb-6 tracking-tight">
              Recent reports on <span className="text-[#7c3aed]">most cited businesses</span>
            </h2>

            {/* Stat Chips */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-violet-100 shadow-[0_2px_10px_rgba(139,92,246,0.06)]">
                <TrendingUp size={12} className="text-violet-600" />
                <span className="text-xs font-semibold text-violet-900">42 Reports</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-blue-100 shadow-[0_2px_10px_rgba(59,130,246,0.06)]">
                <Activity size={12} className="text-blue-600" />
                <span className="text-xs font-semibold text-blue-900">3 AI Engines</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 max-w-5xl mx-auto">
          {tiles.map((tile, index) => (
            <Tile key={index} {...tile} />
          ))}
        </div>

        {/* Bottom fading element for aesthetic completion */}
        <div className="mt-16 flex justify-center z-10 relative">
          <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#1e1b4b] text-white font-medium text-sm hover:bg-[#312e81] shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
            Explore Directory
            <ArrowRight size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}

export default VariantC;
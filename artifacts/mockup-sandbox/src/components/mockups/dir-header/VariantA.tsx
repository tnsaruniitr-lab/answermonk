import React from 'react';

export function VariantA() {
  const tiles = [
    {
      category: "Healthcare",
      color: "#059669", // emerald-600
      query: "Best digital health platforms for women",
      topBrand: "Cleo",
      score: 87,
      rivals: ["Maven Clinic", "Peanut"],
      engines: ["CHA", "GEM", "CLA"]
    },
    {
      category: "Fintech",
      color: "#2563eb", // blue-600
      query: "Best AI expense management tools",
      topBrand: "Brex",
      score: 79,
      rivals: ["Ramp", "Navan"],
      engines: ["CHA", "CLA"]
    },
    {
      category: "SaaS",
      color: "#7c3aed", // violet-600
      query: "Best CRM for startups",
      topBrand: "HubSpot",
      score: 91,
      rivals: ["Salesforce", "Pipedrive"],
      engines: ["CHA", "GEM", "CLA"]
    }
  ];

  return (
    <div 
      className="min-h-screen w-full font-sans"
      style={{
        background: 'linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)',
        padding: '48px 60px'
      }}
    >
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-3xl">
            {/* Pill Badge */}
            <div 
              className="inline-flex items-center px-3 py-1 mb-4 rounded-full font-bold tracking-widest uppercase"
              style={{
                fontSize: '10px',
                background: 'rgba(255, 255, 255, 0.6)',
                border: '1px solid #7c3aed',
                color: '#7c3aed',
                backdropFilter: 'blur(8px)'
              }}
            >
              ✦ AI DIRECTORY
            </div>
            
            {/* Main Heading */}
            <h2 
              className="tracking-tight leading-tight mb-3"
              style={{
                fontSize: '40px',
                fontWeight: 900,
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6366f1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Recent reports on most cited businesses
            </h2>
            
            {/* Subline */}
            <p 
              style={{ 
                color: '#9ca3af', 
                fontSize: '13px',
                fontWeight: 500
              }}
            >
              Updated continuously · 42 analyses indexed
            </p>
          </div>
          
          {/* Action Button */}
          <button 
            className="whitespace-nowrap px-5 py-2.5 rounded-lg font-semibold transition-transform hover:scale-105"
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              border: '1px solid #7c3aed',
              color: '#7c3aed',
              fontSize: '14px',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 6px rgba(124, 58, 237, 0.05)'
            }}
          >
            View all 42 →
          </button>
        </div>

        {/* Tiles Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiles.map((tile, idx) => (
            <div 
              key={idx}
              className="relative overflow-hidden flex flex-col transition-shadow hover:shadow-lg"
              style={{
                background: 'rgba(255,255,255,0.92)',
                borderRadius: '14px',
                border: '1px solid rgba(0,0,0,0.08)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.03)'
              }}
            >
              {/* Top Accent Stripe */}
              <div 
                className="absolute top-0 left-0 right-0 h-[3px]"
                style={{ backgroundColor: tile.color }}
              />
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <span 
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: tile.color }}
                  >
                    {tile.category}
                  </span>
                  
                  {/* Engine Pills */}
                  <div className="flex gap-1">
                    {tile.engines.map((eng) => (
                      <span 
                        key={eng} 
                        className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-slate-100 text-slate-500 border border-slate-200"
                      >
                        {eng}
                      </span>
                    ))}
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 mb-6 leading-snug">
                  "{tile.query}"
                </h3>
                
                <div className="mt-auto bg-slate-50 rounded-xl p-4 border border-slate-100 mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Top Recommended</div>
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">
                          {tile.topBrand.charAt(0)}
                        </div>
                        {tile.topBrand}
                      </div>
                    </div>
                    
                    {/* Score Ring */}
                    <div className="relative w-12 h-12 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90 absolute top-0 left-0" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#e2e8f0"
                          strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={tile.color}
                          strokeWidth="3"
                          strokeDasharray={`${tile.score}, 100`}
                        />
                      </svg>
                      <span className="text-[13px] font-black text-slate-700 relative z-10">{tile.score}</span>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">Top Rivals</div>
                    <div className="text-sm font-medium text-slate-600">
                      {tile.rivals.join(" • ")}
                    </div>
                  </div>
                </div>
                
                <button 
                  className="w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors hover:bg-slate-100"
                  style={{
                    color: tile.color,
                    border: `1px solid ${tile.color}30`,
                    background: `${tile.color}08`
                  }}
                >
                  View full analysis <span className="text-lg leading-none">→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
        
      </div>
    </div>
  );
}

export default VariantA;

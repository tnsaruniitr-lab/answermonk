import React from 'react';
import { ArrowRight, Activity, Search, Shield, Cpu, ChevronRight } from 'lucide-react';

const MOCK_REPORTS = [
  {
    id: 1,
    category: "Healthcare",
    query: "Best digital health platforms for women",
    topBrand: "Cleo",
    score: 87,
    rivals: ["Maven Clinic", "Flo Health", "Ovia"],
    engines: ["ChatGPT", "Claude", "Gemini"],
    borderColor: "border-l-rose-500",
    categoryColor: "text-rose-600 bg-rose-50"
  },
  {
    id: 2,
    category: "Fintech",
    query: "Best AI expense management tools",
    topBrand: "Brex",
    score: 79,
    rivals: ["Ramp", "Navan", "Expensify"],
    engines: ["ChatGPT", "Claude"],
    borderColor: "border-l-blue-500",
    categoryColor: "text-blue-600 bg-blue-50"
  },
  {
    id: 3,
    category: "SaaS",
    query: "Best CRM for startups",
    topBrand: "HubSpot",
    score: 91,
    rivals: ["Salesforce", "Pipedrive", "Attio"],
    engines: ["ChatGPT", "Claude", "Gemini"],
    borderColor: "border-l-emerald-500",
    categoryColor: "text-emerald-600 bg-emerald-50"
  }
];

export function VariantB() {
  return (
    <div 
      className="min-h-screen w-full font-sans"
      style={{
        background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)",
        padding: "48px 60px"
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          {/* Left: Editorial Overline + H2 */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-[2px] bg-indigo-500" />
              <span 
                className="font-bold uppercase tracking-[0.25em]"
                style={{ fontSize: "11px", color: "#7c3aed" }}
              >
                AI DIRECTORY
              </span>
            </div>
            
            <h2 
              className="font-extrabold tracking-tight"
              style={{ 
                fontSize: "36px", 
                color: "#111827", 
                lineHeight: 1.2, 
                maxWidth: "600px" 
              }}
            >
              Recent reports on most cited businesses
            </h2>
          </div>
          
          {/* Right: Stat Cluster & CTA */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-1">
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
              <span>42 analyses</span>
              <span>&middot;</span>
              <span>3 AI engines</span>
              <span>&middot;</span>
              <span>18 categories</span>
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-full text-indigo-700 font-semibold text-sm hover:bg-indigo-50 transition-colors duration-200">
              View all
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thin Divider */}
        <div 
          className="w-full h-px mb-12"
          style={{ backgroundColor: "rgba(0,0,0,0.08)" }}
        />

        {/* Grid of Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MOCK_REPORTS.map((report) => (
            <div 
              key={report.id}
              className={`bg-white rounded-xl shadow-sm border-y border-r border-gray-100 p-6 flex flex-col h-full border-l-4 ${report.borderColor} hover:shadow-md transition-shadow duration-300 relative group cursor-pointer`}
            >
              {/* Category */}
              <div className="mb-4">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${report.categoryColor}`}>
                  {report.category}
                </span>
              </div>
              
              {/* Query Headline */}
              <h3 className="text-[17px] font-bold text-gray-900 leading-snug mb-5">
                "{report.query}"
              </h3>
              
              <div className="flex-1" />
              
              <div className="space-y-5">
                {/* Top Brand & Score */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Top Brand</div>
                    <div className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      {report.topBrand}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Vis Score</div>
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-emerald-500" />
                      <span className="text-xl font-black text-gray-900">{report.score}</span>
                    </div>
                  </div>
                </div>
                
                <div className="h-px w-full bg-gray-100" />
                
                {/* Rivals */}
                <div>
                  <div className="text-[11px] text-gray-400 font-medium mb-2 uppercase tracking-wider">Analyzed alongside</div>
                  <div className="flex flex-wrap gap-2">
                    {report.rivals.map((rival, idx) => (
                      <span key={idx} className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                        {rival}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Engine Pills */}
                <div className="flex items-center gap-2 pt-2">
                  <Cpu className="w-3.5 h-3.5 text-gray-400" />
                  <div className="flex gap-1.5">
                    {report.engines.map((engine, idx) => (
                      <div 
                        key={idx} 
                        className="w-5 h-5 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600"
                        title={engine}
                      >
                        {engine[0]}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hover CTA */}
              <div className="absolute inset-0 bg-indigo-900/[0.02] opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center backdrop-blur-[1px] pointer-events-none">
                <div className="bg-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold text-indigo-600 flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  Read Report
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

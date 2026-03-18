const CHAMPIONS = [
  { brand: "Microsoft", total: 15, chatgpt: 9, gemini: 6 },
  { brand: "ServiceNow", total: 10, chatgpt: 7, gemini: 3 },
  { brand: "UiPath", total: 10, chatgpt: 7, gemini: 3 },
  { brand: "SAP", total: 8, chatgpt: 5, gemini: 3 },
];
const TACTICS = [
  { rank: 1, title: "Structured data markup on pricing and feature pages", evidence: "34 citations" },
  { rank: 2, title: "Third-party directory presence on G2, Capterra, and Gartner", evidence: "28 citations" },
  { rank: 3, title: "Customer case studies with named industry verticals", evidence: "21 citations" },
];
const maxTotal = 15;

export function VariantA() {
  return (
    <div className="min-h-screen bg-[#060c18] p-5 space-y-4 font-sans">
      <p className="text-[10px] font-mono tracking-widest uppercase text-slate-600 mb-1">Variant A — Clean Hierarchy</p>

      {/* Page Type Distribution — no haze, sharp dark card */}
      <div
        className="rounded-xl p-4"
        style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[11px] font-bold text-white tracking-widest uppercase">Page Type Distribution</span>
          </div>
          <span className="text-[10px] text-slate-500">Brand Blog / Article leads · 297 citations</span>
        </div>
        <p className="text-[13px] text-slate-300 leading-relaxed">
          Brand-hosted content (blogs, articles, service pages) accounts for <strong className="text-white">72%</strong> of all citations (783/1087), with Brand Blog/Article (297) and Brand Service Page (227) dominating. Third-party directories (78 citations) and comparison articles (46 citations) provide crucial cross-brand validation.
        </p>
      </div>

      {/* Cross-Engine Champions — stark white names, visible badges */}
      <div className="rounded-xl p-4 space-y-3" style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(180deg,#60a5fa,#818cf8)" }} />
            <span className="text-[15px] font-bold text-white">Cross-Engine Champions</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Appear in ChatGPT + Gemini</span>
        </div>
        <div className="space-y-2.5">
          {CHAMPIONS.map((c) => (
            <div key={c.brand} className="flex items-center gap-3">
              <span className="text-[13px] font-semibold text-white w-24 shrink-0">{c.brand}</span>
              <div className="flex-1 flex gap-0.5 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 rounded-l-full" style={{ width: `${(c.chatgpt / maxTotal) * 65}%` }} />
                <div className="bg-indigo-400 rounded-r-full" style={{ width: `${(c.gemini / maxTotal) * 65}%` }} />
              </div>
              <span className="text-[11px] text-slate-400 w-14 text-right tabular-nums shrink-0">{c.total} total</span>
              <div className="flex gap-1 shrink-0">
                <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ background: "rgba(59,130,246,0.2)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.3)" }}>GPT {c.chatgpt}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }}>Gem {c.gemini}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What matters in this category — dominant, full-width section break */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(99,102,241,0.3)" }}>
        <div className="px-5 py-4" style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.22) 0%,rgba(139,92,246,0.12) 100%)" }}>
          <p className="text-[10px] font-mono tracking-widest uppercase text-indigo-400 mb-1">GEO Intelligence</p>
          <h3 className="text-[20px] font-bold text-white leading-tight">What matters in this category?</h3>
          <p className="text-[12px] text-slate-400 mt-1">Learnings from top appearances · {TACTICS.length} tactics ranked by citation evidence</p>
        </div>
        <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          {TACTICS.map((t) => (
            <div key={t.rank} className="flex items-start gap-4 px-5 py-3.5">
              <span className="text-[13px] font-bold text-indigo-400 w-5 shrink-0 mt-0.5">#{t.rank}</span>
              <span className="text-[13px] text-slate-200 leading-snug flex-1">{t.title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0 font-semibold mt-0.5" style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.25)" }}>{t.evidence}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
const PAGE_TYPES = [
  { label: "Brand Blog / Article", pct: 27, color: "#818cf8" },
  { label: "Brand Service Page", pct: 21, color: "#60a5fa" },
  { label: "Third-party Directory", pct: 7, color: "#34d399" },
  { label: "Comparison Article", pct: 4, color: "#fbbf24" },
  { label: "Other", pct: 13, color: "#475569" },
];

export function VariantB() {
  return (
    <div className="min-h-screen bg-[#060c18] p-5 space-y-4 font-sans">
      <p className="text-[10px] font-mono tracking-widest uppercase text-slate-600 mb-1">Variant B — Data-Forward</p>

      {/* Page Type Distribution — stacked proportion bar, no haze */}
      <div className="rounded-xl p-4 space-y-3" style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold text-white tracking-widest uppercase">Page Type Distribution</span>
          <span className="ml-auto text-[10px] text-slate-500">1,087 total citations</span>
        </div>
        {/* Stacked bar */}
        <div className="h-3 rounded-full overflow-hidden flex gap-0.5">
          {PAGE_TYPES.map((pt) => (
            <div key={pt.label} style={{ width: `${pt.pct}%`, background: pt.color, minWidth: 4 }} className="h-full rounded-sm first:rounded-l-full last:rounded-r-full" />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-1">
          {PAGE_TYPES.map((pt) => (
            <div key={pt.label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm" style={{ background: pt.color }} />
              <span className="text-[11px] text-slate-400">{pt.label}</span>
              <span className="text-[11px] font-semibold text-white">{pt.pct}%</span>
            </div>
          ))}
        </div>
        <p className="text-[12px] text-slate-400 leading-relaxed border-t pt-3" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          Brand-hosted content accounts for <span className="text-white font-semibold">72%</span> of all citations. Third-party directories (78 citations) and comparison articles (46) provide crucial cross-brand validation.
        </p>
      </div>

      {/* Cross-Engine Champions — card chips, high contrast */}
      <div className="rounded-xl p-4" style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex flex-col gap-0.5">
            <div className="h-1 w-6 rounded-full bg-blue-500" />
            <div className="h-1 w-4 rounded-full bg-indigo-400" />
          </div>
          <div>
            <span className="text-[16px] font-bold text-white block leading-tight">Cross-Engine Champions</span>
            <span className="text-[11px] text-slate-500">Brands appearing in both ChatGPT + Gemini</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {CHAMPIONS.map((c, i) => (
            <div key={c.brand} className="rounded-lg p-3" style={{ background: i === 0 ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${i === 0 ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.07)"}` }}>
              <div className="flex items-start justify-between mb-2">
                <span className="text-[13px] font-bold text-white">{c.brand}</span>
                <span className="text-[11px] font-bold text-slate-300 tabular-nums">{c.total}</span>
              </div>
              <div className="flex gap-1.5">
                <span className="text-[11px] px-2 py-0.5 rounded font-semibold flex items-center gap-1" style={{ background: "rgba(59,130,246,0.2)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.3)" }}>
                  <span className="text-[9px] opacity-70">GPT</span> {c.chatgpt}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded font-semibold flex items-center gap-1" style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }}>
                  <span className="text-[9px] opacity-70">Gem</span> {c.gemini}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What matters in this category — dominant banner, large heading */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(99,102,241,0.35)" }}>
        <div
          className="px-5 py-5 flex items-center gap-4"
          style={{ background: "linear-gradient(135deg,#1e1b4b 0%,#0f0c2e 100%)" }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl" style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.35)" }}>
            🎯
          </div>
          <div>
            <p className="text-[10px] font-mono tracking-widest uppercase text-indigo-400 mb-0.5">Ranked by citation evidence</p>
            <h3 className="text-[22px] font-extrabold text-white leading-tight tracking-tight">What matters in this category?</h3>
            <p className="text-[12px] text-indigo-300/70 mt-0.5">{TACTICS.length} proven tactics from top-appearing brands</p>
          </div>
        </div>
        <div className="divide-y" style={{ borderColor: "rgba(99,102,241,0.12)", background: "#09071f" }}>
          {TACTICS.map((t) => (
            <div key={t.rank} className="flex items-center gap-4 px-5 py-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0" style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)" }}>
                {t.rank}
              </div>
              <span className="text-[13px] text-white font-medium leading-snug flex-1">{t.title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0 font-semibold" style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}>{t.evidence}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

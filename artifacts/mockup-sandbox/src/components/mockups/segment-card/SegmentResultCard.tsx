const SAMPLE_RANKINGS = [
  { name: "Emirates NBD", share: 0.88, isBrand: false },
  { name: "Mashreq", share: 0.71, isBrand: false },
  { name: "ADCB", share: 0.54, isBrand: false },
  { name: "Alaan", share: 0.50, isBrand: false },
  { name: "Pemo", share: 0.46, isBrand: true },
  { name: "RAKBANK", share: 0.38, isBrand: false },
  { name: "VISA", share: 0.33, isBrand: false },
];

const ENGINES = [
  { name: "Claude", appearance: 0, top3: 0 },
  { name: "Gemini", appearance: 0.50, top3: 0.38 },
  { name: "ChatGPT", appearance: 0.88, top3: 0.50 },
];

export function SegmentResultCard() {
  const appearance = 46;
  const primary = 29;
  const avgRank = "#3.6";
  const citations = 149;

  const maxShare = SAMPLE_RANKINGS[0]?.share || 1;

  return (
    <div className="min-h-screen bg-[#060c18] flex items-start justify-center p-6 pt-8">
      <div className="w-[400px] bg-[#111827]/80 border border-white/10 rounded-2xl overflow-hidden shadow-xl shadow-black/40">

        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-white/5">
          <div className="w-6 h-6 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-green-400 leading-none" style={{ fontSize: "10px" }}>✓</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">Corporate cards (physical &amp; virtual)</p>
            <p className="text-slate-500 text-xs">service · 8 prompts</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold text-white">{appearance}%</p>
            <p className="text-slate-500 text-xs">Appearance</p>
          </div>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/5">
          <div className="p-3 text-center">
            <p className="text-lg font-bold text-white">{primary}%</p>
            <p className="text-slate-500 text-xs">Top 3</p>
          </div>
          <div className="p-3 text-center">
            <p className="text-lg font-bold text-white">{avgRank}</p>
            <p className="text-slate-500 text-xs">Avg Rank</p>
          </div>
          <div className="p-3 text-center">
            <p className="text-lg font-bold text-white">{citations}</p>
            <p className="text-slate-500 text-xs">Citations</p>
          </div>
        </div>

        {/* Engine breakdown */}
        <div className="divide-y divide-white/5 border-b border-white/5">
          {ENGINES.map(({ name, appearance: a, top3 }) => {
            const pct = Math.round(a * 100);
            const top3pct = Math.round(top3 * 100);
            return (
              <div key={name} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-xs text-slate-400 w-16">{name}</span>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-24 text-right tabular-nums">
                  {pct}% · Top3: {top3pct}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Rankings */}
        <div className="p-4">
          <p className="text-xs text-slate-500 mb-3 font-mono uppercase tracking-wider">Rankings</p>
          <div className="space-y-2.5">
            {SAMPLE_RANKINGS.map((c, idx) => {
              const pct = Math.round(c.share * 100);
              const barWidth = Math.round((c.share / maxShare) * 100);
              return (
                <div key={c.name} className="flex items-center gap-2.5">
                  <span
                    className={`text-[10px] font-mono w-4 text-right flex-shrink-0 ${
                      c.isBrand ? "text-blue-400 font-bold" : "text-slate-600"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span
                    className={`text-xs w-32 truncate flex-shrink-0 ${
                      c.isBrand ? "text-blue-300 font-semibold" : "text-slate-400"
                    }`}
                  >
                    {c.name}
                    {c.isBrand && (
                      <span className="ml-1 text-[9px] text-blue-500 font-mono uppercase">you</span>
                    )}
                  </span>
                  <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        c.isBrand
                          ? "bg-gradient-to-r from-blue-500 to-violet-500"
                          : "bg-slate-600"
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span
                    className={`text-xs w-8 text-right flex-shrink-0 tabular-nums ${
                      c.isBrand ? "text-blue-300 font-semibold" : "text-slate-500"
                    }`}
                  >
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

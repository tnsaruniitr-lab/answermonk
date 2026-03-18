const keyText = "Binance dominates with 61 appearances by securing dual regulatory approvals and embedding itself into comparison listicles as the liquidity benchmark, while BitOasis and Rain compete primarily through VARA/ADGM compliance narratives rather than functional differentiation.";

const terms: { label: string; type: "brand" | "metric" | "concept" }[] = [
  { label: "Binance", type: "brand" },
  { label: "61 appearances", type: "metric" },
  { label: "BitOasis", type: "brand" },
  { label: "Rain", type: "brand" },
  { label: "VARA/ADGM", type: "concept" },
  { label: "comparison listicles", type: "concept" },
  { label: "liquidity benchmark", type: "concept" },
  { label: "compliance narratives", type: "concept" },
  { label: "dual regulatory approvals", type: "concept" },
];

function highlight(text: string) {
  const termLabels = terms.map((t) => t.label).sort((a, b) => b.length - a.length);
  const regex = new RegExp(`(${termLabels.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) => {
    const match = terms.find((t) => t.label.toLowerCase() === part.toLowerCase());
    if (match) {
      const colors =
        match.type === "brand"
          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
          : match.type === "metric"
          ? "bg-violet-500/20 text-violet-300 border border-violet-500/40"
          : "bg-sky-500/15 text-sky-300 border border-sky-500/30";
      return (
        <span key={i} className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium mx-0.5 align-middle ${colors}`}>
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function DarkIntel() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: "#0a0e1a" }}>
      <div className="w-full max-w-xl">
        <div
          className="rounded-xl p-5"
          style={{
            background: "rgba(255,180,0,0.04)",
            border: "1px solid rgba(255,180,0,0.18)",
            borderLeft: "4px solid #f59e0b",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-amber-400 text-base">⚡</span>
            <span className="text-amber-400 text-sm font-bold tracking-wide uppercase">Key Finding</span>
          </div>
          <p className="text-slate-200 text-sm leading-relaxed text-left font-medium">{highlight(keyText)}</p>
          <div className="flex flex-wrap gap-1.5 mt-4 pt-3" style={{ borderTop: "1px solid rgba(255,180,0,0.1)" }}>
            {terms.map((t) => {
              const colors =
                t.type === "brand"
                  ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                  : t.type === "metric"
                  ? "bg-violet-500/15 text-violet-300 border-violet-500/30"
                  : "bg-sky-500/10 text-sky-300 border-sky-500/25";
              return (
                <span key={t.label} className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${colors}`}>
                  {t.label}
                </span>
              );
            })}
          </div>
        </div>
        <div className="flex gap-4 mt-3 text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500/40 inline-block" /> Brand</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-violet-500/40 inline-block" /> Metric</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-sky-500/30 inline-block" /> Concept</span>
        </div>
      </div>
    </div>
  );
}

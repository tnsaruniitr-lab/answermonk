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

export function Glassmorphic() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-8"
      style={{
        background: "linear-gradient(135deg, #0a0e1a 0%, #0f1a2e 50%, #0a0e1a 100%)",
      }}
    >
      <div className="w-full max-w-xl">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 0 40px rgba(245,158,11,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <div
            className="px-5 py-3 flex items-center gap-2"
            style={{
              background: "linear-gradient(90deg, rgba(245,158,11,0.15) 0%, rgba(139,92,246,0.08) 100%)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <span style={{ fontSize: 15 }}>⚡</span>
            <span className="text-amber-300 text-sm font-bold tracking-widest uppercase">Key Finding</span>
          </div>
          <div className="p-5">
            <p className="text-slate-100 text-sm leading-relaxed text-left" style={{ fontWeight: 450 }}>
              {keyText.split(/(\bBinance\b|61 appearances|dual regulatory approvals|comparison listicles|liquidity benchmark|\bBitOasis\b|\bRain\b|VARA\/ADGM|compliance narratives)/g).map((part, i) => {
                const brandTerms = ["Binance", "BitOasis", "Rain"];
                const metricTerms = ["61 appearances"];
                if (brandTerms.includes(part)) {
                  return <span key={i} className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold mx-0.5 align-middle" style={{ background: "rgba(245,158,11,0.18)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.35)" }}>{part}</span>;
                }
                if (metricTerms.includes(part)) {
                  return <span key={i} className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold mx-0.5 align-middle" style={{ background: "rgba(139,92,246,0.2)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.4)" }}>{part}</span>;
                }
                if (["VARA/ADGM", "comparison listicles", "liquidity benchmark", "compliance narratives", "dual regulatory approvals"].includes(part)) {
                  return <span key={i} className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold mx-0.5 align-middle" style={{ background: "rgba(34,211,238,0.12)", color: "#67e8f9", border: "1px solid rgba(34,211,238,0.25)" }}>{part}</span>;
                }
                return <span key={i}>{part}</span>;
              })}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-4">
              {terms.map((t) => {
                const style =
                  t.type === "brand"
                    ? { background: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.3)" }
                    : t.type === "metric"
                    ? { background: "rgba(139,92,246,0.12)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.3)" }
                    : { background: "rgba(34,211,238,0.08)", color: "#67e8f9", border: "1px solid rgba(34,211,238,0.2)" };
                return (
                  <span key={t.label} className="px-2.5 py-1 rounded-full text-[11px] font-medium" style={style}>
                    {t.label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

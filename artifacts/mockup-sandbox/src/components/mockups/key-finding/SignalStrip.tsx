const keyText = "Binance dominates with 61 appearances by securing dual regulatory approvals and embedding itself into comparison listicles as the liquidity benchmark, while BitOasis and Rain compete primarily through VARA/ADGM compliance narratives rather than functional differentiation.";

const brands = ["Binance", "BitOasis", "Rain"];
const metrics = ["61 appearances"];
const concepts = ["dual regulatory approvals", "comparison listicles", "liquidity benchmark", "VARA/ADGM", "compliance narratives"];

export function SignalStrip() {
  const allTerms = [...brands, ...metrics, ...concepts];
  const parts = keyText.split(new RegExp(`(${allTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g"));

  return (
    <div
      className="min-h-screen flex items-center justify-center p-8"
      style={{ background: "#0a0e1a" }}
    >
      <div className="w-full max-w-xl">
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.07)", background: "#0f1629" }}
        >
          <div
            className="px-4 py-2.5 flex items-center gap-2.5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div
              className="flex items-center justify-center w-6 h-6 rounded-md"
              style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}
            >
              <span style={{ fontSize: 12 }}>⚡</span>
            </div>
            <span className="font-bold text-sm" style={{ color: "#f59e0b" }}>Key Finding</span>
          </div>

          <div className="px-4 pt-4 pb-3">
            <p className="text-sm leading-relaxed text-left" style={{ color: "#cbd5e1", fontWeight: 400 }}>
              {parts.map((part, i) => {
                if (brands.includes(part)) {
                  return (
                    <span key={i} className="inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold mx-0.5 align-middle" style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }}>
                      {part}
                    </span>
                  );
                }
                if (metrics.includes(part)) {
                  return (
                    <span key={i} className="inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold mx-0.5 align-middle" style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" }}>
                      {part}
                    </span>
                  );
                }
                if (concepts.includes(part)) {
                  return (
                    <span key={i} className="inline-block px-1.5 py-0.5 rounded text-[11px] font-medium mx-0.5 align-middle" style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}>
                      {part}
                    </span>
                  );
                }
                return <span key={i}>{part}</span>;
              })}
            </p>
          </div>

          <div
            className="px-4 py-3 flex flex-wrap gap-1.5"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.15)" }}
          >
            {brands.map((b) => (
              <span key={b} className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" }}>
                {b}
              </span>
            ))}
            {metrics.map((m) => (
              <span key={m} className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.2)" }}>
                {m}
              </span>
            ))}
            {concepts.map((c) => (
              <span key={c} className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "rgba(99,102,241,0.08)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.15)" }}>
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

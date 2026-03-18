const sources = [
  { rank: 1, domain: "adgm.com", gpt: true, gem: true, count: 68 },
  { rank: 2, domain: "vara.ae", gpt: true, gem: true, count: 52 },
  { rank: 3, domain: "sc.com", gpt: true, gem: true, count: 32 },
  { rank: 4, domain: "en.wikipedia.org", gpt: true, gem: true, count: 32 },
  { rank: 5, domain: "difccourts.ae", gpt: true, gem: true, count: 24 },
  { rank: 6, domain: "reddit.com", gpt: true, gem: true, count: 20 },
  { rank: 7, domain: "trustpilot.com", gpt: true, gem: true, count: 18 },
  { rank: 8, domain: "xaigate.com", gpt: false, gem: true, count: 16 },
  { rank: 9, domain: "aquanow.com", gpt: true, gem: true, count: 14 },
  { rank: 10, domain: "coindesk.com", gpt: true, gem: false, count: 14 },
];

const max = 68;

export function SourceSignal() {
  return (
    <div className="min-h-screen flex items-start justify-center p-6" style={{ background: "#080c18" }}>
      <div className="w-full max-w-xl">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 0 60px rgba(99,102,241,0.06)",
          }}
        >
          {/* Header */}
          <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#6366f1" }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    LLM Source Intelligence
                  </span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.3, margin: 0 }}>
                  Which sources do AI models cite<br />for category winners?
                </h3>
              </div>
              <div className="flex gap-2 shrink-0 mt-1">
                <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 4, background: "rgba(74,222,128,0.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.25)" }}>GPT</span>
                <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 4, background: "rgba(96,165,250,0.12)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.25)" }}>Gem</span>
              </div>
            </div>
          </div>

          {/* Rows */}
          <div>
            {sources.map((s, i) => (
              <div
                key={s.domain}
                className="flex items-center gap-3 px-5 py-2.5"
                style={{
                  borderBottom: i < sources.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  background: i === 0 ? "rgba(99,102,241,0.04)" : "transparent",
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 600, color: i < 3 ? "#6366f1" : "#475569", width: 18, textAlign: "right", flexShrink: 0 }}>
                  {s.rank}
                </span>
                <span style={{ fontSize: 12, fontWeight: 500, color: "#e2e8f0", flex: 1, minWidth: 0 }} className="truncate">
                  {s.domain}
                </span>
                <div className="flex gap-1 shrink-0">
                  <span style={{ fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: s.gpt ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.04)", color: s.gpt ? "#4ade80" : "#2d3748", border: `1px solid ${s.gpt ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.05)"}` }}>GPT</span>
                  <span style={{ fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: s.gem ? "rgba(96,165,250,0.15)" : "rgba(255,255,255,0.04)", color: s.gem ? "#60a5fa" : "#2d3748", border: `1px solid ${s.gem ? "rgba(96,165,250,0.3)" : "rgba(255,255,255,0.05)"}` }}>Gem</span>
                </div>
                <div className="shrink-0" style={{ width: 64, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(s.count / max) * 100}%`, background: s.gpt && s.gem ? "linear-gradient(90deg, #4ade80, #60a5fa)" : s.gpt ? "#4ade80" : "#60a5fa", borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", width: 22, textAlign: "right", flexShrink: 0 }}>
                  {s.count}
                </span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.15)" }}>
            <span style={{ fontSize: 10, color: "#475569" }}>25 sources · 1,222 citations indexed</span>
            <span style={{ fontSize: 10, color: "#475569" }}>Pure SQL · instant</span>
          </div>
        </div>
      </div>
    </div>
  );
}

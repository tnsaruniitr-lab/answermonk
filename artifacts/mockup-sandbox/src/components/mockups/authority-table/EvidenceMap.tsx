const sources = [
  { rank: 1, domain: "adgm.com", label: "Abu Dhabi Global Market", gpt: true, gem: true, count: 68 },
  { rank: 2, domain: "vara.ae", label: "Virtual Assets Reg. Auth.", gpt: true, gem: true, count: 52 },
  { rank: 3, domain: "sc.com", label: "Standard Chartered", gpt: true, gem: true, count: 32 },
  { rank: 4, domain: "en.wikipedia.org", label: "Wikipedia", gpt: true, gem: true, count: 32 },
  { rank: 5, domain: "difccourts.ae", label: "DIFC Courts", gpt: true, gem: true, count: 24 },
  { rank: 6, domain: "reddit.com", label: "Reddit", gpt: true, gem: true, count: 20 },
  { rank: 7, domain: "trustpilot.com", label: "Trustpilot", gpt: true, gem: true, count: 18 },
  { rank: 8, domain: "xaigate.com", label: "XAI Gate", gpt: false, gem: true, count: 16 },
  { rank: 9, domain: "coindesk.com", label: "CoinDesk", gpt: true, gem: false, count: 14 },
  { rank: 10, domain: "aquanow.com", label: "Aquanow", gpt: true, gem: true, count: 14 },
];

const max = 68;

export function EvidenceMap() {
  return (
    <div className="min-h-screen flex items-start justify-center p-6" style={{ background: "#080c18" }}>
      <div className="w-full max-w-xl">
        {/* Header — large, editorial */}
        <div className="mb-4">
          <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
            ◆ Citation Evidence Map
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f8fafc", lineHeight: 1.2, margin: 0 }}>
            Where do LLMs get their<br />answers about this category?
          </h2>
          <p style={{ fontSize: 12, color: "#64748b", marginTop: 6, lineHeight: 1.5 }}>
            Sources AI engines cited most when ranking brands in this space
          </p>
        </div>

        {/* Bar chart */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {sources.map((s, i) => {
            const gptW = s.gpt ? (s.count / max) * 100 * 0.6 : 0;
            const gemW = s.gem ? (s.count / max) * 100 * 0.6 : 0;
            return (
              <div
                key={s.domain}
                className="flex items-center gap-3 px-4 py-2.5"
                style={{ borderBottom: i < sources.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
              >
                <span style={{ fontSize: 10, color: "#334155", width: 16, textAlign: "right", flexShrink: 0, fontWeight: 600 }}>{s.rank}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", lineHeight: 1 }}>{s.domain}</div>
                </div>
                {/* Stacked bar */}
                <div style={{ width: 90, height: 6, background: "rgba(255,255,255,0.04)", borderRadius: 3, overflow: "hidden", flexShrink: 0, display: "flex" }}>
                  {s.gpt && (
                    <div style={{ height: "100%", width: `${gptW}%`, background: "#4ade80", borderRadius: s.gem ? "3px 0 0 3px" : 3 }} />
                  )}
                  {s.gem && (
                    <div style={{ height: "100%", width: `${gemW}%`, background: "#60a5fa", borderRadius: s.gpt ? "0 3px 3px 0" : 3 }} />
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  {s.gpt && <span style={{ fontSize: 8, fontWeight: 700, color: "#4ade80" }}>G</span>}
                  {s.gem && <span style={{ fontSize: 8, fontWeight: 700, color: "#60a5fa" }}>M</span>}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", width: 24, textAlign: "right", flexShrink: 0 }}>{s.count}</span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 px-1">
          <span style={{ fontSize: 10, color: "#4ade80", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 3, background: "#4ade80", borderRadius: 2, display: "inline-block" }} />
            ChatGPT citations
          </span>
          <span style={{ fontSize: 10, color: "#60a5fa", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 3, background: "#60a5fa", borderRadius: 2, display: "inline-block" }} />
            Gemini citations
          </span>
          <span style={{ fontSize: 10, color: "#475569", marginLeft: "auto" }}>1,222 rows · 25 sources</span>
        </div>
      </div>
    </div>
  );
}

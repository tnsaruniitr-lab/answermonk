const sources = [
  { rank: 1, domain: "adgm.com", gpt: true, gem: true, count: 68 },
  { rank: 2, domain: "vara.ae", gpt: true, gem: true, count: 52 },
  { rank: 3, domain: "sc.com", gpt: true, gem: true, count: 32 },
  { rank: 4, domain: "en.wikipedia.org", gpt: true, gem: true, count: 32 },
  { rank: 5, domain: "difccourts.ae", gpt: true, gem: true, count: 24 },
  { rank: 6, domain: "reddit.com", gpt: true, gem: true, count: 20 },
  { rank: 7, domain: "trustpilot.com", gpt: true, gem: true, count: 18 },
  { rank: 8, domain: "xaigate.com", gpt: false, gem: true, count: 16 },
  { rank: 9, domain: "coindesk.com", gpt: true, gem: false, count: 14 },
  { rank: 10, domain: "aquanow.com", gpt: true, gem: true, count: 14 },
];

const top3 = sources.slice(0, 3);
const rest = sources.slice(3);
const max = 68;

const podiumColors = ["#f59e0b", "#94a3b8", "#cd7c2f"];
const podiumBg = [
  "rgba(245,158,11,0.08)",
  "rgba(148,163,184,0.05)",
  "rgba(205,124,47,0.06)",
];
const podiumBorder = [
  "rgba(245,158,11,0.22)",
  "rgba(148,163,184,0.12)",
  "rgba(205,124,47,0.15)",
];

export function EvidenceMap() {
  return (
    <div className="min-h-screen flex items-start justify-center p-6" style={{ background: "#080c18" }}>
      <div className="w-full max-w-xl">

        {/* Header */}
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

        {/* Top 3 podium boxes */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {top3.map((s, i) => (
            <div
              key={s.domain}
              className="rounded-xl p-3 text-center"
              style={{ background: podiumBg[i], border: `1px solid ${podiumBorder[i]}` }}
            >
              <div style={{ fontSize: 17, fontWeight: 900, color: podiumColors[i], lineHeight: 1 }}>#{i + 1}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0", marginTop: 4, lineHeight: 1.2 }}>{s.domain}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: podiumColors[i], marginTop: 5 }}>{s.count}</div>
              <div style={{ fontSize: 9, color: "#64748b", marginTop: 1 }}>citations</div>
              <div className="flex justify-center gap-1 mt-2">
                {s.gpt && (
                  <span style={{ fontSize: 7, fontWeight: 700, padding: "1px 4px", borderRadius: 2, background: "rgba(74,222,128,0.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}>GPT</span>
                )}
                {s.gem && (
                  <span style={{ fontSize: 7, fontWeight: 700, padding: "1px 4px", borderRadius: 2, background: "rgba(96,165,250,0.12)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.2)" }}>Gem</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bar chart — remaining sources */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {rest.map((s, i) => {
            const gptW = s.gpt ? (s.count / max) * 100 * 0.6 : 0;
            const gemW = s.gem ? (s.count / max) * 100 * 0.6 : 0;
            return (
              <div
                key={s.domain}
                className="flex items-center gap-3 px-4 py-2.5"
                style={{ borderBottom: i < rest.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
              >
                <span style={{ fontSize: 10, color: "#334155", width: 16, textAlign: "right", flexShrink: 0, fontWeight: 600 }}>{s.rank}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", lineHeight: 1 }}>{s.domain}</div>
                </div>
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

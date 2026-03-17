const TILES = [
  {
    id: 1,
    query: "Best fintech in UAE",
    cat: "Fintech · UAE",
    accent: "#3b82f6",
    ago: "2 min ago",
    leaders: [
      { rank: 1, brand: "pemo.io",       score: 78, engines: [true,  true,  true]  },
      { rank: 2, brand: "brex.com",      score: 61, engines: [true,  false, true]  },
      { rank: 3, brand: "ramp.com",      score: 44, engines: [false, true,  true]  },
    ],
  },
  {
    id: 2,
    query: "Best expense management MENA",
    cat: "SaaS · MENA",
    accent: "#6366f1",
    ago: "14 min ago",
    leaders: [
      { rank: 1, brand: "spendesk.com",  score: 83, engines: [true,  true,  true]  },
      { rank: 2, brand: "brex.com",      score: 65, engines: [true,  true,  false] },
      { rank: 3, brand: "pemo.io",       score: 52, engines: [false, true,  true]  },
    ],
  },
  {
    id: 3,
    query: "Best VC funding Abu Dhabi",
    cat: "Venture · Abu Dhabi",
    accent: "#10b981",
    ago: "31 min ago",
    leaders: [
      { rank: 1, brand: "beco.vc",       score: 71, engines: [true,  true,  true]  },
      { rank: 2, brand: "wio.io",        score: 59, engines: [true,  false, true]  },
      { rank: 3, brand: "mamo.io",       score: 41, engines: [false, true,  false] },
    ],
  },
  {
    id: 4,
    query: "Best payroll software Dubai",
    cat: "HR Tech · Dubai",
    accent: "#f59e0b",
    ago: "1 hour ago",
    leaders: [
      { rank: 1, brand: "mamo.io",       score: 58, engines: [true,  true,  false] },
      { rank: 2, brand: "spendesk.com",  score: 49, engines: [true,  false, true]  },
      { rank: 3, brand: "pemo.io",       score: 37, engines: [false, true,  true]  },
    ],
  },
];

const ENGINE_COLORS = ["#10b981", "#3b82f6", "#f59e0b"];
const ENGINE_LABELS = ["G", "G", "C"];

export function DetailCards() {
  return (
    <div style={{ background: "#030b14", minHeight: "100vh", fontFamily: "system-ui, sans-serif", padding: "40px 0" }}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 24px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h2 style={{ color: "#e2e8f0", fontSize: 18, fontWeight: 700, margin: 0 }}>Recent Analyses</h2>
            <p style={{ color: "#475569", fontSize: 12, margin: "4px 0 0" }}>Full AI rankings — click any to view the full report</p>
          </div>
          <button style={{
            color: "#475569", fontSize: 12, background: "none",
            border: "1px solid #1e3a5f", borderRadius: 7,
            padding: "5px 14px", cursor: "pointer",
          }}>
            View all →
          </button>
        </div>

        {/* 2-column grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {TILES.map(t => (
            <div
              key={t.id}
              style={{
                background: "#060f1e",
                border: "1px solid #1e3a5f",
                borderRadius: 14,
                overflow: "hidden",
                cursor: "pointer",
              }}
            >
              {/* Glowing left accent bar */}
              <div style={{ display: "flex" }}>
                <div style={{ width: 3, background: `linear-gradient(180deg, ${t.accent}, ${t.accent}22)`, flexShrink: 0 }} />
                <div style={{ flex: 1, padding: "16px 18px" }}>

                  {/* Top row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: 1,
                      color: t.accent, background: `${t.accent}15`,
                      padding: "2px 8px", borderRadius: 4,
                    }}>
                      {t.cat.toUpperCase()}
                    </span>
                    <span style={{ color: "#1e3a5f", fontSize: 9, marginLeft: "auto" }}>{t.ago}</span>
                  </div>

                  {/* Query */}
                  <p style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 700, margin: "0 0 16px", lineHeight: 1.3 }}>{t.query}</p>

                  {/* Leaderboard */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {t.leaders.map(l => (
                      <div key={l.brand} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {/* Rank */}
                        <div style={{
                          width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                          background: l.rank === 1 ? `${t.accent}22` : "#0a1628",
                          border: `1px solid ${l.rank === 1 ? t.accent + "55" : "#1e3a5f"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 9, color: l.rank === 1 ? t.accent : "#334155", fontWeight: 700,
                        }}>
                          {l.rank}
                        </div>

                        {/* Brand */}
                        <span style={{
                          flex: 1, color: l.rank === 1 ? "#e2e8f0" : "#475569",
                          fontSize: 11, fontFamily: "monospace",
                          fontWeight: l.rank === 1 ? 600 : 400,
                        }}>
                          {l.brand}
                        </span>

                        {/* Engine dots */}
                        <div style={{ display: "flex", gap: 3 }}>
                          {ENGINE_COLORS.map((c, i) => (
                            <div key={i} style={{
                              width: 12, height: 12, borderRadius: 3,
                              background: l.engines[i] ? `${c}25` : "#0a1628",
                              border: `1px solid ${l.engines[i] ? c + "60" : "#0f1f35"}`,
                            }} />
                          ))}
                        </div>

                        {/* Score */}
                        <span style={{
                          color: l.rank === 1 ? t.accent : "#334155",
                          fontSize: 11, fontWeight: 700, minWidth: 32, textAlign: "right",
                        }}>
                          {l.score}%
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #0a1628", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {ENGINE_COLORS.map((c, i) => (
                        <span key={i} style={{
                          fontSize: 9, color: c, background: `${c}15`,
                          border: `1px solid ${c}33`,
                          padding: "2px 6px", borderRadius: 4,
                        }}>
                          {["ChatGPT", "Gemini", "Claude"][i]}
                        </span>
                      ))}
                    </div>
                    <span style={{ color: "#3b82f6", fontSize: 11 }}>View report →</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Expand */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button style={{
            background: "#070f1d",
            border: "1px solid #1e3a5f",
            color: "#475569", fontSize: 12,
            padding: "10px 32px", borderRadius: 10, cursor: "pointer",
          }}>
            Show 46 more analyses ↓
          </button>
        </div>
      </div>
    </div>
  );
}

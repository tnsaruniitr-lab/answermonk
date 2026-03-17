const TILES = [
  { id: 1, query: "Best fintech in UAE", brand: "pemo.io", score: 78, accent: "#3b82f6", cat: "Fintech", ago: "2m ago", rivals: ["brex.com", "ramp.com"] },
  { id: 2, query: "Best expense management MENA", brand: "brex.com", score: 65, accent: "#6366f1", cat: "SaaS", ago: "14m ago", rivals: ["pemo.io", "spendesk.com"] },
  { id: 3, query: "Best VC funding Abu Dhabi", brand: "beco.vc", score: 71, accent: "#10b981", cat: "Venture", ago: "31m ago", rivals: ["mamo.io", "wio.io"] },
  { id: 4, query: "Best payroll software Dubai", brand: "mamo.io", score: 58, accent: "#f59e0b", cat: "HR Tech", ago: "1h ago", rivals: ["spendesk.com", "pemo.io"] },
  { id: 5, query: "Best B2B SaaS Saudi Arabia", brand: "spendesk.com", score: 83, accent: "#8b5cf6", cat: "SaaS", ago: "2h ago", rivals: ["brex.com", "ramp.com"] },
  { id: 6, query: "Best lending platform MENA", brand: "ziina.com", score: 62, accent: "#ec4899", cat: "Fintech", ago: "3h ago", rivals: ["tamara.co", "tabby.ai"] },
];

const ENGINES = [
  { key: "ChatGPT", color: "#10b981" },
  { key: "Gemini",  color: "#3b82f6" },
  { key: "Claude",  color: "#f59e0b" },
];

export function GridCards() {
  return (
    <div style={{ background: "#030b14", minHeight: "100vh", fontFamily: "system-ui, sans-serif", padding: "40px 0" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px" }}>

        {/* Section header */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h2 style={{ color: "#e2e8f0", fontSize: 18, fontWeight: 700, margin: 0 }}>Recent Analyses</h2>
            <p style={{ color: "#475569", fontSize: 12, margin: "4px 0 0" }}>Live rankings across every category — updated as analyses complete</p>
          </div>
          <button style={{
            color: "#3b82f6", fontSize: 12, background: "none",
            border: "1px solid #1e3a5f", borderRadius: 7,
            padding: "5px 12px", cursor: "pointer",
          }}>
            View all 50
          </button>
        </div>

        {/* 3-column grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          {TILES.map(t => (
            <div
              key={t.id}
              style={{
                background: "#060f1e",
                border: "1px solid #1e3a5f",
                borderRadius: 14,
                overflow: "hidden",
                cursor: "pointer",
                position: "relative",
              }}
            >
              {/* Accent glow top bar */}
              <div style={{ height: 3, background: `linear-gradient(90deg, ${t.accent}, ${t.accent}44)` }} />

              <div style={{ padding: "16px 18px" }}>
                {/* Header row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: 1,
                    color: t.accent, background: `${t.accent}15`,
                    padding: "2px 8px", borderRadius: 4,
                  }}>
                    {t.cat.toUpperCase()}
                  </span>
                  <span style={{ color: "#1e3a5f", fontSize: 9 }}>{t.ago}</span>
                </div>

                {/* Query headline */}
                <p style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 700, margin: "0 0 14px", lineHeight: 1.35 }}>{t.query}</p>

                {/* Score ring + brand */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
                    <svg viewBox="0 0 48 48" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
                      <circle cx="24" cy="24" r="20" fill="none" stroke="#0a1628" strokeWidth="4" />
                      <circle
                        cx="24" cy="24" r="20" fill="none"
                        stroke={t.accent} strokeWidth="4"
                        strokeDasharray={`${2 * Math.PI * 20}`}
                        strokeDashoffset={`${2 * Math.PI * 20 * (1 - t.score / 100)}`}
                        strokeLinecap="round"
                        style={{ filter: `drop-shadow(0 0 4px ${t.accent})` }}
                      />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: t.accent, fontSize: 11, fontWeight: 800 }}>{t.score}</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}>{t.brand}</div>
                    <div style={{ color: "#334155", fontSize: 10, marginTop: 2 }}>Top ranked</div>
                  </div>
                </div>

                {/* Rivals */}
                <div style={{ display: "flex", gap: 5, marginBottom: 14, flexWrap: "wrap" }}>
                  {t.rivals.map((r, i) => (
                    <span key={r} style={{
                      fontSize: 9, color: "#475569",
                      background: "#0a1628", border: "1px solid #1e3a5f",
                      borderRadius: 4, padding: "2px 7px", fontFamily: "monospace",
                    }}>
                      #{i + 2} {r}
                    </span>
                  ))}
                </div>

                {/* Engine presence row */}
                <div style={{ display: "flex", gap: 6 }}>
                  {ENGINES.map(e => (
                    <div key={e.key} style={{
                      flex: 1, height: 24, borderRadius: 5,
                      background: `${e.color}15`,
                      border: `1px solid ${e.color}33`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ color: e.color, fontSize: 8, fontWeight: 600 }}>{e.key.slice(0, 3).toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Expand row */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button style={{
            background: "linear-gradient(135deg, #0f172a, #1e293b)",
            border: "1px solid #334155",
            color: "#64748b", fontSize: 12,
            padding: "10px 32px", borderRadius: 10, cursor: "pointer",
          }}>
            Show 44 more analyses ↓
          </button>
        </div>
      </div>
    </div>
  );
}

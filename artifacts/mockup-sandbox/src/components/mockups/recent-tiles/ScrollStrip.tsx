const TILES = [
  { id: 1, query: "Best fintech in UAE", brand: "pemo.io", score: 78, accent: "#3b82f6", cat: "Fintech", ago: "2m ago" },
  { id: 2, query: "Best expense mgmt MENA", brand: "brex.com", score: 65, accent: "#6366f1", cat: "SaaS", ago: "14m ago" },
  { id: 3, query: "Best VC in Abu Dhabi", brand: "beco.vc", score: 71, accent: "#10b981", cat: "Venture", ago: "31m ago" },
  { id: 4, query: "Best payroll in Dubai", brand: "mamo.io", score: 58, accent: "#f59e0b", cat: "HR Tech", ago: "1h ago" },
  { id: 5, query: "Best B2B SaaS in KSA", brand: "spendesk.com", score: 83, accent: "#8b5cf6", cat: "SaaS", ago: "2h ago" },
  { id: 6, query: "Best lending in MENA", brand: "ziina.com", score: 62, accent: "#ec4899", cat: "Fintech", ago: "3h ago" },
  { id: 7, query: "Best legal tech UAE", brand: "tamara.co", score: 55, accent: "#14b8a6", cat: "LegalTech", ago: "5h ago" },
  { id: 8, query: "Best logistics KSA", brand: "fetchr.us", score: 47, accent: "#f97316", cat: "Logistics", ago: "7h ago" },
];

const ENGINE_DOTS = [
  { label: "G", color: "#10b981" },
  { label: "G", color: "#3b82f6" },
  { label: "C", color: "#f59e0b" },
];

export function ScrollStrip() {
  return (
    <div style={{ background: "#030b14", minHeight: "100vh", fontFamily: "system-ui, sans-serif", padding: "40px 0" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 32px" }}>

        {/* Section header */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ color: "#e2e8f0", fontSize: 18, fontWeight: 700, margin: 0 }}>Recent Analyses</h2>
            <p style={{ color: "#475569", fontSize: 12, margin: "4px 0 0" }}>See who's winning in each category right now</p>
          </div>
          <button style={{ color: "#3b82f6", fontSize: 12, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            View all 50 →
          </button>
        </div>

        {/* Scroll strip */}
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 12, scrollbarWidth: "none" }}>
          {TILES.map(t => (
            <div
              key={t.id}
              style={{
                flexShrink: 0,
                width: 200,
                background: "#070f1d",
                border: "1px solid #1e3a5f",
                borderTop: `3px solid ${t.accent}`,
                borderRadius: 12,
                padding: "14px 16px",
                cursor: "pointer",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
            >
              {/* Category chip */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: 1,
                  color: t.accent,
                  background: `${t.accent}18`,
                  padding: "2px 7px",
                  borderRadius: 4,
                }}>
                  {t.cat.toUpperCase()}
                </span>
                <span style={{ color: "#334155", fontSize: 9 }}>{t.ago}</span>
              </div>

              {/* Query */}
              <p style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 600, margin: "0 0 10px", lineHeight: 1.4 }}>{t.query}</p>

              {/* Top brand row */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: `${t.accent}22`,
                  border: `1px solid ${t.accent}44`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, color: t.accent, fontWeight: 700,
                }}>
                  #1
                </div>
                <span style={{ color: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}>{t.brand}</span>
              </div>

              {/* Score + engines */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <span style={{ color: t.accent, fontSize: 18, fontWeight: 800 }}>{t.score}</span>
                  <span style={{ color: "#475569", fontSize: 10 }}>%</span>
                </div>
                <div style={{ display: "flex", gap: 3 }}>
                  {ENGINE_DOTS.map((e, i) => (
                    <div key={i} style={{ width: 16, height: 16, borderRadius: 4, background: `${e.color}22`, border: `1px solid ${e.color}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: e.color, fontSize: 7, fontWeight: 700 }}>{e.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Ghost fade hint */}
          <div style={{ flexShrink: 0, width: 40, background: "linear-gradient(90deg, transparent, #030b14)" }} />
        </div>

        {/* View more row */}
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button style={{
            background: "#070f1d",
            border: "1px solid #1e3a5f",
            color: "#475569",
            fontSize: 12,
            padding: "8px 24px",
            borderRadius: 8,
            cursor: "pointer",
          }}>
            View more analyses
          </button>
        </div>
      </div>
    </div>
  );
}

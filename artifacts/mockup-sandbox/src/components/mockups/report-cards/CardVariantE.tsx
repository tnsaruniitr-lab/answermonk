const MOCK_TILES = [
  { id: 1, category: "AT-HOME BLOOD TESTS", query: "At-home blood tests in Dubai", score: 0, topBrand: "Vesta Care", rivals: [{ name: "HealthHub", share: 0 }, { name: "Medcare", share: 0 }], ago: "2d ago", accent: "#6366f1" },
  { id: 2, category: "DIGITAL ASSETS", query: "Digital assets as a service in UAE", score: 21, topBrand: "BitOasis", rivals: [{ name: "Binance", share: 47 }, { name: "Crypto.com", share: 33 }], ago: "2d ago", accent: "#10b981" },
  { id: 3, category: "SUPPLY CHAIN", query: "Supply Chain Management in UAE", score: 0, topBrand: "Aramex", rivals: [{ name: "DP World", share: 38 }, { name: "Blue Yonder", share: 22 }], ago: "2d ago", accent: "#f59e0b" },
  { id: 4, category: "OTC CRYPTO DESK", query: "OTC crypto desk in UAE", score: 13, topBrand: "Kraken", rivals: [{ name: "Binance", share: 61 }, { name: "BitOasis", share: 44 }], ago: "2d ago", accent: "#3b82f6" },
  { id: 5, category: "SEED FUNDING", query: "Seed funding in MENA", score: 75, topBrand: "Flat6Labs", rivals: [{ name: "Wamda", share: 58 }, { name: "Shorooq", share: 41 }], ago: "3d ago", accent: "#8b5cf6" },
  { id: 6, category: "CRYPTO API", query: "Crypto API infrastructure in UAE", score: 4, topBrand: "Alchemy", rivals: [{ name: "Binance", share: 72 }, { name: "BitOasis", share: 55 }], ago: "2d ago", accent: "#ec4899" },
];

function ScoreRing({ score, accent }: { score: number; accent: string }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const label = score === 0 ? "—" : `${score}`;
  return (
    <div style={{ position: "relative", width: 46, height: 46, flexShrink: 0 }}>
      <svg viewBox="0 0 46 46" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx="23" cy="23" r={r} fill="none" stroke={`${accent}20`} strokeWidth="3.5" />
        {score > 0 && (
          <circle
            cx="23" cy="23" r={r} fill="none"
            stroke={accent} strokeWidth="3.5"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - score / 100)}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${accent}80)`, transition: "stroke-dashoffset 0.6s ease" }}
          />
        )}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: score > 0 ? accent : "#c4c9d4", fontSize: score > 0 ? 12 : 16, fontWeight: 900, lineHeight: 1 }}>{label}</span>
        {score > 0 && <span style={{ color: `${accent}88`, fontSize: 6.5, fontWeight: 700, marginTop: 1 }}>/ 100</span>}
      </div>
    </div>
  );
}

export default function CardVariantE() {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)", padding: "28px 20px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", color: "#ec4899", textTransform: "uppercase", marginBottom: 4 }}>Option E — Score Ring + Left-Border</div>
          <h2 style={{ color: "#1e1b4b", fontSize: 15, fontWeight: 700, margin: 0 }}>Recent reports on most cited businesses</h2>
        </div>
        <button style={{ color: "#6366f1", fontSize: 11, fontWeight: 600, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)", borderRadius: 7, padding: "4px 12px", cursor: "pointer" }}>View all 41</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {MOCK_TILES.map(tile => (
          <div key={tile.id} style={{
            background: "rgba(255,255,255,0.82)",
            border: "1px solid rgba(0,0,0,0.07)",
            borderRadius: 14,
            overflow: "hidden",
            cursor: "pointer",
            boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
            display: "flex",
            transition: "box-shadow 0.18s, transform 0.15s",
          }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.boxShadow = `0 6px 24px ${tile.accent}22, 0 1px 6px rgba(0,0,0,0.07)`;
              el.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.boxShadow = "0 1px 8px rgba(0,0,0,0.05)";
              el.style.transform = "translateY(0)";
            }}
          >
            {/* Left accent bar */}
            <div style={{ width: 4, flexShrink: 0, background: `linear-gradient(180deg, ${tile.accent}, ${tile.accent}44)` }} />

            <div style={{ padding: "12px 13px", flex: 1, minWidth: 0 }}>
              {/* Category + time */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: tile.accent, flexShrink: 0 }} />
                <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.07em", color: tile.accent, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {tile.category}
                </span>
                <span style={{ color: "#9ca3af", fontSize: 9.5, marginLeft: "auto", flexShrink: 0 }}>{tile.ago}</span>
              </div>

              {/* Query — left aligned */}
              <p style={{ color: "#111827", fontSize: 13.5, fontWeight: 700, margin: "0 0 10px", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textAlign: "left" } as any}>
                {tile.query.replace(/^best\s+/i, "")}
              </p>

              {/* All rankings — unified row format */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 10 }}>
                {[{ rank: 1, name: tile.topBrand, share: tile.score, solid: true }, ...tile.rivals.slice(0, 2).map((r, i) => ({ rank: i + 2, name: r.name, share: r.share, solid: false }))].map((row, i) => (
                  <div key={row.rank} style={{ borderTop: i > 0 ? "1px solid rgba(0,0,0,0.05)" : "none", paddingTop: i > 0 ? 6 : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: row.share > 0 ? 4 : 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: row.solid ? "#fff" : "#6b7280", background: row.solid ? tile.accent : "#f3f4f6", border: row.solid ? "none" : "1px solid #e5e7eb", borderRadius: 4, padding: "2px 6px", flexShrink: 0 }}>
                        #{row.rank}
                      </span>
                      <span style={{ color: "#111827", fontSize: 12.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
                        {row.name}
                      </span>
                      {row.share > 0 && (
                        <span style={{ fontSize: 10.5, fontWeight: 800, flexShrink: 0, color: tile.accent, background: `${tile.accent}15`, border: `1px solid ${tile.accent}30`, borderRadius: 20, padding: "2px 7px" }}>
                          {row.share}%
                        </span>
                      )}
                    </div>
                    {row.share > 0 && (
                      <div style={{ height: 3, borderRadius: 99, background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 99, width: `${row.share}%`, background: `linear-gradient(90deg, ${tile.accent}88, ${tile.accent})` }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button style={{
                width: "100%", padding: "7px 0", borderRadius: 8,
                border: `1.5px solid ${tile.accent}33`,
                background: `${tile.accent}08`,
                color: tile.accent, fontSize: 11, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 5,
              }}>
                View full analysis <span style={{ fontSize: 13 }}>→</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: 18 }}>
        <button style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(99,102,241,0.18)", color: "#6b7280", fontSize: 12, padding: "8px 26px", borderRadius: 9, cursor: "pointer" }}>
          Show 35 more ↓
        </button>
      </div>
    </div>
  );
}

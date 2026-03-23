const MOCK_TILES = [
  { id: 1, category: "AT-HOME BLOOD TESTS", query: "At-home blood tests in Dubai", score: 0, topBrand: "Vesta Care", rivals: [{ name: "HealthHub", share: 0 }, { name: "Medcare", share: 0 }], ago: "2d ago", accent: "#6366f1", g1: "#ede9fe", g2: "#dbeafe" },
  { id: 2, category: "DIGITAL ASSETS", query: "Digital assets as a service in UAE", score: 21, topBrand: "BitOasis", rivals: [{ name: "Binance", share: 47 }, { name: "Crypto.com", share: 33 }], ago: "2d ago", accent: "#10b981", g1: "#d1fae5", g2: "#ecfdf5" },
  { id: 3, category: "SUPPLY CHAIN", query: "Supply Chain Management in UAE", score: 0, topBrand: "Aramex", rivals: [{ name: "DP World", share: 38 }, { name: "Blue Yonder", share: 22 }], ago: "2d ago", accent: "#f59e0b", g1: "#fef9c3", g2: "#fef3c7" },
  { id: 4, category: "OTC CRYPTO DESK", query: "OTC crypto desk in UAE", score: 13, topBrand: "Kraken", rivals: [{ name: "Binance", share: 61 }, { name: "BitOasis", share: 44 }], ago: "2d ago", accent: "#3b82f6", g1: "#dbeafe", g2: "#ede9fe" },
  { id: 5, category: "SEED FUNDING", query: "Seed funding in MENA", score: 75, topBrand: "Flat6Labs", rivals: [{ name: "Wamda", share: 58 }, { name: "Shorooq", share: 41 }], ago: "3d ago", accent: "#8b5cf6", g1: "#ede9fe", g2: "#fce7f3" },
  { id: 6, category: "CRYPTO API", query: "Crypto API infrastructure in UAE", score: 4, topBrand: "Alchemy", rivals: [{ name: "Binance", share: 72 }, { name: "BitOasis", share: 55 }], ago: "2d ago", accent: "#ec4899", g1: "#fce7f3", g2: "#ede9fe" },
];

export default function CardVariantF() {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)", padding: "28px 20px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", color: "#ec4899", textTransform: "uppercase", marginBottom: 4 }}>Option F — Gradient Bubbles</div>
          <h2 style={{ color: "#1e1b4b", fontSize: 15, fontWeight: 700, margin: 0 }}>Recent reports on most cited businesses</h2>
        </div>
        <button style={{ color: "#6366f1", fontSize: 11, fontWeight: 600, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)", borderRadius: 7, padding: "4px 12px", cursor: "pointer" }}>View all 41</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {MOCK_TILES.map(tile => (
          <div key={tile.id} style={{
            background: `linear-gradient(160deg, #ffffff 0%, ${tile.g1}55 100%)`,
            border: `1px solid ${tile.accent}18`,
            borderRadius: 14,
            overflow: "hidden",
            cursor: "pointer",
            boxShadow: `0 1px 8px ${tile.accent}14, 0 0 0 0px ${tile.accent}08`,
            display: "flex",
            transition: "box-shadow 0.18s, transform 0.15s",
          }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.boxShadow = `0 6px 28px ${tile.accent}28, 0 1px 6px ${tile.accent}12`;
              el.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.boxShadow = `0 1px 8px ${tile.accent}14`;
              el.style.transform = "translateY(0)";
            }}
          >
            {/* Left accent bar — gradient */}
            <div style={{ width: 4, flexShrink: 0, background: `linear-gradient(180deg, ${tile.accent} 0%, ${tile.accent}33 100%)` }} />

            <div style={{ padding: "12px 13px", flex: 1, minWidth: 0 }}>
              {/* Category + time */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: tile.accent, flexShrink: 0 }} />
                <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.07em", color: tile.accent, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {tile.category}
                </span>
                <span style={{ color: "#9ca3af", fontSize: 9.5, marginLeft: "auto", flexShrink: 0 }}>{tile.ago}</span>
              </div>

              {/* Query */}
              <p style={{ color: "#111827", fontSize: 13.5, fontWeight: 700, margin: "0 0 10px", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textAlign: "left" } as any}>
                {tile.query.replace(/^best\s+/i, "")}
              </p>

              {/* Rankings */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 10 }}>
                {[{ rank: 1, name: tile.topBrand, share: tile.score, solid: true }, ...tile.rivals.slice(0, 2).map((r, i) => ({ rank: i + 2, name: r.name, share: r.share, solid: false }))].map((row, i) => (
                  row.solid ? (
                    /* Winner gradient bubble */
                    <div key={row.rank} style={{ position: "relative", marginBottom: 10 }}>
                      <div style={{
                        background: `linear-gradient(135deg, ${tile.accent}20 0%, ${tile.g1}cc 60%, ${tile.g2}88 100%)`,
                        border: `1.5px solid ${tile.accent}35`,
                        borderRadius: 9, padding: "7px 9px",
                        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.6), 0 2px 6px ${tile.accent}12`,
                      }}>
                        {/* AI Leader label */}
                        <div style={{ display: "flex", alignItems: "center", marginBottom: 5 }}>
                          <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: "0.08em", color: tile.accent, textTransform: "uppercase" as const }}>
                            ★ AI Leader
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: row.share > 0 ? 5 : 0 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: `linear-gradient(135deg, ${tile.accent}, ${tile.accent}cc)`, borderRadius: 4, padding: "2px 6px", flexShrink: 0, boxShadow: `0 1px 4px ${tile.accent}50` }}>
                            #1
                          </span>
                          <span style={{ color: "#111827", fontSize: 12.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
                            {row.name}
                          </span>
                          {row.share > 0 && (
                            <span style={{ fontSize: 10.5, fontWeight: 800, flexShrink: 0, color: tile.accent, background: "rgba(255,255,255,0.7)", border: `1px solid ${tile.accent}35`, borderRadius: 20, padding: "2px 7px", backdropFilter: "blur(4px)" }}>
                              {row.share}%
                            </span>
                          )}
                        </div>
                        {row.share > 0 && (
                          <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.4)", overflow: "hidden" }}>
                            <div style={{ height: "100%", borderRadius: 99, width: `${row.share}%`, background: `linear-gradient(90deg, ${tile.accent}80, ${tile.accent})`, boxShadow: `0 0 6px ${tile.accent}60` }} />
                          </div>
                        )}
                      </div>
                      {/* Bubble pointer */}
                      <div style={{ position: "absolute", bottom: -7, left: 18, width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderTop: `7px solid ${tile.accent}35` }} />
                      <div style={{ position: "absolute", bottom: -5, left: 19, width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: `6px solid ${tile.g1}` }} />
                    </div>
                  ) : (
                    /* #2 / #3 — subtle gradient row */
                    <div key={row.rank} style={{ borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: row.share > 0 ? 4 : 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: "#6b7280", background: `linear-gradient(135deg, #f3f4f6, ${tile.g1}66)`, border: "1px solid #e5e7eb", borderRadius: 4, padding: "2px 6px", flexShrink: 0 }}>
                          #{row.rank}
                        </span>
                        <span style={{ color: "#374151", fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
                          {row.name}
                        </span>
                        {row.share > 0 && (
                          <span style={{ fontSize: 10.5, fontWeight: 800, flexShrink: 0, color: tile.accent, background: `linear-gradient(135deg, ${tile.accent}12, ${tile.g1}80)`, border: `1px solid ${tile.accent}25`, borderRadius: 20, padding: "2px 7px" }}>
                            {row.share}%
                          </span>
                        )}
                      </div>
                      {row.share > 0 && (
                        <div style={{ height: 3, borderRadius: 99, background: `linear-gradient(90deg, rgba(0,0,0,0.04), ${tile.g1}88)`, overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 99, width: `${row.share}%`, background: `linear-gradient(90deg, ${tile.accent}70, ${tile.accent}cc)` }} />
                        </div>
                      )}
                    </div>
                  )
                ))}
              </div>

              {/* CTA — gradient */}
              <button style={{
                width: "100%", padding: "7px 0", borderRadius: 8,
                border: `1.5px solid ${tile.accent}30`,
                background: `linear-gradient(135deg, ${tile.accent}10, ${tile.g1}66)`,
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

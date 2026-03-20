const MOCK_TILES = [
  { id: 1, category: "AT-HOME BLOOD TESTS", query: "At-home blood tests in Dubai", score: 0, topBrand: "Vesta Care", rivals: ["HealthHub", "Medcare"], engines: { chatgpt: true, gemini: true, claude: true }, ago: "2d ago", accent: "#6366f1" },
  { id: 2, category: "DIGITAL ASSETS AS A SERVICE", query: "Digital assets as a service in UAE", score: 21, topBrand: "BitOasis", rivals: ["Binance", "Crypto.com"], engines: { chatgpt: true, gemini: true, claude: true }, ago: "2d ago", accent: "#10b981" },
  { id: 3, category: "SUPPLY CHAIN MANAGEMENT", query: "Supply Chain Management in UAE", score: 0, topBrand: "Aramex", rivals: ["DP World", "Blue Yonder"], engines: { chatgpt: true, gemini: true, claude: false }, ago: "2d ago", accent: "#f59e0b" },
  { id: 4, category: "OTC CRYPTO DESK", query: "OTC crypto desk in UAE", score: 13, topBrand: "Kraken", rivals: ["Binance", "BitOasis"], engines: { chatgpt: true, gemini: true, claude: true }, ago: "2d ago", accent: "#3b82f6" },
  { id: 5, category: "SEED FUNDING", query: "Seed funding in MENA", score: 75, topBrand: "Flat6Labs", rivals: ["Wamda", "Shorooq Partners"], engines: { chatgpt: true, gemini: true, claude: true }, ago: "3d ago", accent: "#8b5cf6" },
  { id: 6, category: "CRYPTO API INFRASTRUCTURE", query: "Crypto API infrastructure in UAE", score: 4, topBrand: "Alchemy", rivals: ["Binance", "BitOasis"], engines: { chatgpt: true, gemini: false, claude: true }, ago: "2d ago", accent: "#ec4899" },
];

const ENGINES = [
  { key: "chatgpt" as const, short: "CHA" },
  { key: "gemini"  as const, short: "GEM" },
  { key: "claude"  as const, short: "CLA" },
];

export default function CardVariantB() {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)", padding: "32px 24px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "#8b5cf6", textTransform: "uppercase", marginBottom: 4 }}>Option B — Tinted Cards</div>
          <h2 style={{ color: "#1e1b4b", fontSize: 16, fontWeight: 700, margin: 0 }}>Recent reports on most cited businesses</h2>
        </div>
        <button style={{ color: "#8b5cf6", fontSize: 12, background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 8, padding: "5px 14px", cursor: "pointer", fontWeight: 600 }}>
          View all 41
        </button>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {MOCK_TILES.map(tile => (
          <div key={tile.id} style={{
            background: `linear-gradient(145deg, ${tile.accent}08 0%, rgba(255,255,255,0.9) 60%)`,
            border: `1px solid ${tile.accent}22`,
            borderRadius: 16,
            overflow: "hidden",
            cursor: "pointer",
            boxShadow: `0 4px 20px ${tile.accent}0d`,
          }}>
            <div style={{ padding: "14px 16px" }}>
              {/* Category badge */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: tile.accent, boxShadow: `0 0 6px ${tile.accent}` }} />
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, color: tile.accent, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {tile.category}
                  </span>
                </div>
                <span style={{ color: "#9ca3af", fontSize: 9 }}>{tile.ago}</span>
              </div>

              {/* Query */}
              <p style={{ color: "#1e1b4b", fontSize: 13, fontWeight: 600, margin: "0 0 14px", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as any}>
                {tile.query}
              </p>

              {/* Top brand bar */}
              <div style={{ background: `${tile.accent}10`, border: `1px solid ${tile.accent}20`, borderRadius: 10, padding: "8px 12px", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ color: "#374151", fontSize: 12, fontWeight: 700 }}>{tile.topBrand}</div>
                    <div style={{ color: "#9ca3af", fontSize: 9, marginTop: 1 }}>Top ranked · {tile.rivals.map((r, i) => `#${i + 2} ${r}`).join("  ")}</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: tile.score > 0 ? tile.accent : "#d1d5db" }}>{tile.score}</div>
                </div>
              </div>

              {/* Engine pills */}
              <div style={{ display: "flex", gap: 5 }}>
                {ENGINES.map(e => (
                  <div key={e.key} style={{
                    flex: 1, height: 22, borderRadius: 5,
                    background: tile.engines[e.key] ? `${tile.accent}14` : "rgba(0,0,0,0.03)",
                    border: `1px solid ${tile.engines[e.key] ? tile.accent + "30" : "rgba(0,0,0,0.06)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    opacity: tile.engines[e.key] ? 1 : 0.35,
                  }}>
                    <span style={{ color: tile.engines[e.key] ? tile.accent : "#9ca3af", fontSize: 8, fontWeight: 700 }}>{e.short}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: 20 }}>
        <button style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(139,92,246,0.2)", color: "#8b5cf6", fontSize: 12, padding: "9px 28px", borderRadius: 10, cursor: "pointer", fontWeight: 600 }}>
          Show 35 more analyses ↓
        </button>
      </div>
    </div>
  );
}

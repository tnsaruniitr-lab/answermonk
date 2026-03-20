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

export default function CardVariantC() {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)", padding: "32px 24px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "#374151", textTransform: "uppercase", marginBottom: 4 }}>Option C — Minimal Border-Left</div>
          <h2 style={{ color: "#1e1b4b", fontSize: 16, fontWeight: 700, margin: 0 }}>Recent reports on most cited businesses</h2>
        </div>
        <button style={{ color: "#374151", fontSize: 12, background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 8, padding: "5px 14px", cursor: "pointer", fontWeight: 600 }}>
          View all 41
        </button>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {MOCK_TILES.map(tile => (
          <div key={tile.id} style={{
            background: "rgba(255,255,255,0.82)",
            borderRadius: 14,
            overflow: "hidden",
            cursor: "pointer",
            boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
            display: "flex",
          }}>
            {/* Colored left border */}
            <div style={{ width: 4, flexShrink: 0, background: `linear-gradient(180deg, ${tile.accent} 0%, ${tile.accent}44 100%)` }} />

            <div style={{ padding: "14px 14px", flex: 1, minWidth: 0 }}>
              {/* Category + time */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.7, color: tile.accent, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>
                  {tile.category}
                </span>
                <span style={{ color: "#9ca3af", fontSize: 9, flexShrink: 0, marginLeft: 6 }}>{tile.ago}</span>
              </div>

              {/* Query */}
              <p style={{ color: "#111827", fontSize: 13, fontWeight: 600, margin: "0 0 10px", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as any}>
                {tile.query}
              </p>

              {/* Top brand + score inline */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <span style={{ color: "#111827", fontSize: 12, fontWeight: 700 }}>{tile.topBrand}</span>
                  <span style={{ color: "#9ca3af", fontSize: 10, marginLeft: 6 }}>top ranked</span>
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: tile.score > 0 ? tile.accent : "#d1d5db", lineHeight: 1 }}>{tile.score}</div>
              </div>

              {/* Rivals row */}
              {tile.rivals.length > 0 && (
                <div style={{ color: "#6b7280", fontSize: 10, marginBottom: 8 }}>
                  {tile.rivals.map((r, i) => `#${i + 2} ${r}`).join("  ·  ")}
                </div>
              )}

              {/* Engine dots */}
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {ENGINES.map(e => (
                  <div key={e.key} style={{ display: "flex", alignItems: "center", gap: 3, opacity: tile.engines[e.key] ? 1 : 0.3 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: tile.engines[e.key] ? tile.accent : "#d1d5db" }} />
                    <span style={{ fontSize: 8, color: tile.engines[e.key] ? tile.accent : "#9ca3af", fontWeight: 600 }}>{e.short}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: 20 }}>
        <button style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(0,0,0,0.1)", color: "#6b7280", fontSize: 12, padding: "9px 28px", borderRadius: 10, cursor: "pointer" }}>
          Show 35 more analyses ↓
        </button>
      </div>
    </div>
  );
}

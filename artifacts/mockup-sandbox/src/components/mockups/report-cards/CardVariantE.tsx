const MOCK_TILES = [
  { id: 1, category: "AT-HOME BLOOD TESTS", query: "At-home blood tests in Dubai", score: 0, topBrand: "Vesta Care", rivals: ["HealthHub", "Medcare"], engines: { chatgpt: false, gemini: false, claude: false }, ago: "2d ago", accent: "#6366f1" },
  { id: 2, category: "DIGITAL ASSETS", query: "Digital assets as a service in UAE", score: 21, topBrand: "BitOasis", rivals: ["Binance", "Crypto.com"], engines: { chatgpt: true, gemini: true, claude: true }, ago: "2d ago", accent: "#10b981" },
  { id: 3, category: "SUPPLY CHAIN", query: "Supply Chain Management in UAE", score: 0, topBrand: "Aramex", rivals: ["DP World", "Blue Yonder"], engines: { chatgpt: true, gemini: true, claude: false }, ago: "2d ago", accent: "#f59e0b" },
  { id: 4, category: "OTC CRYPTO DESK", query: "OTC crypto desk in UAE", score: 13, topBrand: "Kraken", rivals: ["Binance", "BitOasis"], engines: { chatgpt: true, gemini: false, claude: true }, ago: "2d ago", accent: "#3b82f6" },
  { id: 5, category: "SEED FUNDING", query: "Seed funding in MENA", score: 75, topBrand: "Flat6Labs", rivals: ["Wamda", "Shorooq"], engines: { chatgpt: true, gemini: true, claude: true }, ago: "3d ago", accent: "#8b5cf6" },
  { id: 6, category: "CRYPTO API", query: "Crypto API infrastructure in UAE", score: 4, topBrand: "Alchemy", rivals: ["Binance", "BitOasis"], engines: { chatgpt: false, gemini: false, claude: true }, ago: "2d ago", accent: "#ec4899" },
];

const ENG = [
  { key: "chatgpt" as const, short: "CHA", color: "#10b981" },
  { key: "gemini"  as const, short: "GEM", color: "#3b82f6" },
  { key: "claude"  as const, short: "CLA", color: "#f59e0b" },
];

function ScoreBadge({ score, accent }: { score: number; accent: string }) {
  const label = score === 0 ? "—" : `${score}`;
  return (
    <div style={{
      width: 44, height: 44, flexShrink: 0, borderRadius: 10,
      background: score > 0 ? `${accent}14` : "#f9fafb",
      border: `1.5px solid ${score > 0 ? accent + "44" : "#e5e7eb"}`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      <span style={{ color: score > 0 ? accent : "#9ca3af", fontSize: score > 0 ? 16 : 20, fontWeight: 900, lineHeight: 1 }}>{label}</span>
      {score > 0 && <span style={{ color: `${accent}99`, fontSize: 7, fontWeight: 700, marginTop: 1 }}>/ 100</span>}
    </div>
  );
}

export default function CardVariantE() {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)", padding: "28px 20px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", color: "#ec4899", textTransform: "uppercase", marginBottom: 4 }}>Option E — Score Badge + Horizontal Info</div>
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
          }}>
            {/* Left accent bar */}
            <div style={{ width: 4, flexShrink: 0, background: `linear-gradient(180deg, ${tile.accent}, ${tile.accent}44)` }} />

            <div style={{ padding: "12px 13px", flex: 1, minWidth: 0 }}>
              {/* Category */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: tile.accent, flexShrink: 0 }} />
                <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.07em", color: tile.accent, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {tile.category}
                </span>
                <span style={{ color: "#9ca3af", fontSize: 9.5, marginLeft: "auto", flexShrink: 0 }}>{tile.ago}</span>
              </div>

              {/* Query */}
              <p style={{ color: "#111827", fontSize: 13.5, fontWeight: 700, margin: "0 0 10px", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as any}>
                {tile.query.replace(/^best\s+/i, "")}
              </p>

              {/* Score badge + brand info */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <ScoreBadge score={tile.score} accent={tile.accent} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ color: "#111827", fontSize: 13.5, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {tile.topBrand}
                  </div>
                  <div style={{ color: "#6b7280", fontSize: 10.5, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {tile.rivals.length > 0
                      ? tile.rivals.map((r, i) => `#${i + 2} ${r}`).join(" · ")
                      : "No competitors tracked"}
                  </div>
                </div>
              </div>

              {/* Engine row — pill style, always visible */}
              <div style={{ display: "flex", gap: 4 }}>
                {ENG.map(e => {
                  const on = tile.engines[e.key];
                  return (
                    <div key={e.key} style={{
                      flex: 1, height: 24, borderRadius: 5,
                      background: on ? `${e.color}12` : "#f3f4f6",
                      border: `1px solid ${on ? e.color + "44" : "#e5e7eb"}`,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
                    }}>
                      {on
                        ? <span style={{ color: e.color, fontSize: 9, fontWeight: 800, letterSpacing: "0.05em" }}>✓ {e.short}</span>
                        : <span style={{ color: "#c4c9d4", fontSize: 9, fontWeight: 600, letterSpacing: "0.05em" }}>{e.short}</span>
                      }
                    </div>
                  );
                })}
              </div>
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

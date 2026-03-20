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

function Ring({ score, accent }: { score: number; accent: string }) {
  const r = 20; const circ = 2 * Math.PI * r;
  const label = score === 0 ? "—" : `${score}`;
  return (
    <div style={{ position: "relative", width: 50, height: 50, flexShrink: 0 }}>
      <svg viewBox="0 0 50 50" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx="25" cy="25" r={r} fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
        {score > 0 && (
          <circle cx="25" cy="25" r={r} fill="none" stroke={accent} strokeWidth="3.5"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${accent}99)` }} />
        )}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: score > 0 ? accent : "#9ca3af", fontSize: score > 0 ? 13 : 17, fontWeight: 900, lineHeight: 1 }}>{label}</span>
        {score > 0 && <span style={{ color: "#9ca3af", fontSize: 7, fontWeight: 600, marginTop: 1 }}>/ 100</span>}
      </div>
    </div>
  );
}

export default function CardVariantD() {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)", padding: "28px 20px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", color: "#8b5cf6", textTransform: "uppercase", marginBottom: 4 }}>AI Directory</div>
          <h2 style={{ color: "#1e1b4b", fontSize: 15, fontWeight: 700, margin: 0 }}>Recent reports on most cited businesses</h2>
        </div>
        <button style={{ color: "#6366f1", fontSize: 11, fontWeight: 600, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)", borderRadius: 7, padding: "4px 12px", cursor: "pointer" }}>View all 41</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {MOCK_TILES.map(tile => (
          <div key={tile.id} style={{
            background: "rgba(255,255,255,0.88)",
            border: "1px solid rgba(0,0,0,0.07)",
            backdropFilter: "blur(12px)",
            borderRadius: 14,
            overflow: "hidden",
            cursor: "pointer",
            boxShadow: "0 2px 12px rgba(99,102,241,0.06), 0 1px 3px rgba(0,0,0,0.04)",
            display: "flex",
            flexDirection: "column",
          }}>
            {/* Top accent stripe */}
            <div style={{ height: 3, background: `linear-gradient(90deg, ${tile.accent}, ${tile.accent}44)`, flexShrink: 0 }} />

            <div style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column" }}>

              {/* Category + time */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em", color: tile.accent, background: `${tile.accent}14`, padding: "2px 8px", borderRadius: 4, maxWidth: 135, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {tile.category}
                </span>
                <span style={{ color: "#9ca3af", fontSize: 10, flexShrink: 0 }}>{tile.ago}</span>
              </div>

              {/* Query */}
              <p style={{ color: "#111827", fontSize: 13.5, fontWeight: 700, margin: "0 0 10px", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as any}>
                {tile.query}
              </p>

              {/* Rankings block */}
              <div style={{ background: "rgba(0,0,0,0.025)", borderRadius: 10, padding: "9px 10px", marginBottom: 10, flex: 1 }}>

                {/* #1 */}
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: tile.rivals.length > 0 ? 8 : 0 }}>
                  <Ring score={tile.score} accent={tile.accent} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 1 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: tile.accent, borderRadius: 3, padding: "1px 5px", flexShrink: 0 }}>#1</span>
                      <span style={{ color: "#111827", fontSize: 13.5, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {tile.topBrand}
                      </span>
                    </div>
                    <span style={{ color: "#9ca3af", fontSize: 10 }}>Most cited in AI responses</span>
                  </div>
                </div>

                {/* #2 and #3 */}
                {tile.rivals.length > 0 && (
                  <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 7, display: "flex", flexDirection: "column", gap: 5 }}>
                    {tile.rivals.slice(0, 2).map((rival, i) => (
                      <div key={rival} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: "#6b7280", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 3, padding: "1px 5px", flexShrink: 0 }}>
                          #{i + 2}
                        </span>
                        <span style={{ color: "#374151", fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {rival}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Engine badges */}
              <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
                {ENG.map(e => {
                  const on = tile.engines[e.key];
                  return (
                    <div key={e.key} style={{
                      flex: 1, height: 24, borderRadius: 6,
                      background: on ? `${e.color}12` : "#f3f4f6",
                      border: `1.5px solid ${on ? e.color + "50" : "#e5e7eb"}`,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                    }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: on ? e.color : "#d1d5db" }} />
                      <span style={{ color: on ? e.color : "#9ca3af", fontSize: 9, fontWeight: 700, letterSpacing: "0.04em" }}>{e.short}</span>
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              <button style={{
                width: "100%", padding: "7px 0", borderRadius: 8, border: `1.5px solid ${tile.accent}33`,
                background: `${tile.accent}08`, color: tile.accent, fontSize: 11, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                letterSpacing: "0.01em",
              }}>
                View full analysis
                <span style={{ fontSize: 13, lineHeight: 1 }}>→</span>
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

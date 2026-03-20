const MOCK_TILES = [
  { id: 1, category: "AT-HOME BLOOD TESTS", query: "At-home blood tests in Dubai", score: 0, topBrand: "Vesta Care", rivals: ["HealthHub", "Medcare"], engines: { chatgpt: false, gemini: false, claude: false }, ago: "2d ago", accent: "#6366f1" },
  { id: 2, category: "DIGITAL ASSETS", query: "Digital assets as a service in UAE", score: 21, topBrand: "BitOasis", rivals: ["Binance", "Crypto.com"], engines: { chatgpt: true, gemini: true, claude: true }, ago: "2d ago", accent: "#10b981" },
  { id: 3, category: "SUPPLY CHAIN", query: "Supply Chain Management in UAE", score: 0, topBrand: "Aramex", rivals: ["DP World", "Blue Yonder"], engines: { chatgpt: true, gemini: true, claude: false }, ago: "2d ago", accent: "#f59e0b" },
  { id: 4, category: "OTC CRYPTO DESK", query: "OTC crypto desk in UAE", score: 13, topBrand: "Kraken", rivals: ["Binance", "BitOasis"], engines: { chatgpt: true, gemini: false, claude: true }, ago: "2d ago", accent: "#3b82f6" },
  { id: 5, category: "SEED FUNDING", query: "Seed funding in MENA", score: 75, topBrand: "Flat6Labs", rivals: ["Wamda", "Shorooq"], engines: { chatgpt: true, gemini: true, claude: true }, ago: "3d ago", accent: "#8b5cf6" },
  { id: 6, category: "CRYPTO API", query: "Crypto API infrastructure in UAE", score: 4, topBrand: "Alchemy", rivals: ["Binance", "BitOasis"], engines: { chatgpt: false, gemini: false, claude: true }, ago: "2d ago", accent: "#ec4899" },
];

const ENG = [
  { key: "chatgpt" as const, label: "ChatGPT", short: "CHA", color: "#10b981" },
  { key: "gemini"  as const, label: "Gemini",  short: "GEM", color: "#3b82f6" },
  { key: "claude"  as const, label: "Claude",  short: "CLA", color: "#f59e0b" },
];

function Ring({ score, accent }: { score: number; accent: string }) {
  const r = 22; const circ = 2 * Math.PI * r;
  const label = score === 0 ? "—" : `${score}`;
  return (
    <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
      <svg viewBox="0 0 56 56" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx="28" cy="28" r={r} fill="none" stroke="#f1f5f9" strokeWidth="4" />
        {score > 0 && <circle cx="28" cy="28" r={r} fill="none" stroke={accent} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${accent}99)` }} />}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: score > 0 ? accent : "#9ca3af", fontSize: score > 0 ? 14 : 18, fontWeight: 900, lineHeight: 1 }}>{label}</span>
        {score > 0 && <span style={{ color: "#9ca3af", fontSize: 7, fontWeight: 600, marginTop: 1 }}>score</span>}
      </div>
    </div>
  );
}

export default function CardVariantD() {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)", padding: "28px 20px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", color: "#8b5cf6", textTransform: "uppercase", marginBottom: 4 }}>Option D — Dense + Always-Visible Engines</div>
          <h2 style={{ color: "#1e1b4b", fontSize: 15, fontWeight: 700, margin: 0 }}>Recent reports on most cited businesses</h2>
        </div>
        <button style={{ color: "#6366f1", fontSize: 11, fontWeight: 600, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)", borderRadius: 7, padding: "4px 12px", cursor: "pointer" }}>View all 41</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {MOCK_TILES.map(tile => (
          <div key={tile.id} style={{
            background: "rgba(255,255,255,0.82)",
            border: "1px solid rgba(255,255,255,0.95)",
            backdropFilter: "blur(12px)",
            borderRadius: 14,
            overflow: "hidden",
            cursor: "pointer",
            boxShadow: "0 2px 12px rgba(99,102,241,0.06), 0 1px 3px rgba(0,0,0,0.04)",
          }}>
            <div style={{ height: 3, background: `linear-gradient(90deg, ${tile.accent}, ${tile.accent}55)` }} />
            <div style={{ padding: "12px 14px" }}>

              {/* Row 1: Category + time */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em", color: tile.accent, background: `${tile.accent}14`, padding: "2px 8px", borderRadius: 4, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {tile.category}
                </span>
                <span style={{ color: "#9ca3af", fontSize: 10 }}>{tile.ago}</span>
              </div>

              {/* Row 2: Query */}
              <p style={{ color: "#111827", fontSize: 14, fontWeight: 700, margin: "0 0 10px", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as any}>
                {tile.query.replace(/^best\s+/i, "")}
              </p>

              {/* Row 3: Score + Brand side by side */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, background: "rgba(0,0,0,0.025)", borderRadius: 10, padding: "8px 10px" }}>
                <Ring score={tile.score} accent={tile.accent} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ color: "#111827", fontSize: 14, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {tile.topBrand}
                  </div>
                  <div style={{ color: "#6b7280", fontSize: 10.5, marginTop: 2 }}>
                    {tile.rivals.length > 0 ? `vs ${tile.rivals.join(", ")}` : "Top ranked"}
                  </div>
                </div>
              </div>

              {/* Row 4: Engine badges — always visible, on/off distinct */}
              <div style={{ display: "flex", gap: 5 }}>
                {ENG.map(e => {
                  const on = tile.engines[e.key];
                  return (
                    <div key={e.key} style={{
                      flex: 1, height: 26, borderRadius: 6,
                      background: on ? `${e.color}14` : "#f3f4f6",
                      border: `1.5px solid ${on ? e.color + "55" : "#e5e7eb"}`,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                    }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: on ? e.color : "#d1d5db" }} />
                      <span style={{ color: on ? e.color : "#9ca3af", fontSize: 9, fontWeight: 700, letterSpacing: "0.05em" }}>{e.short}</span>
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

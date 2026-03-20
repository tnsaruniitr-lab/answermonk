const MOCK_TILES = [
  { id: 1, category: "AT-HOME BLOOD TESTS", query: "At-home blood tests in Dubai", score: 0, topBrand: "Vesta Care", rivals: ["HealthHub", "Medcare"], engines: { chatgpt: true, gemini: true, claude: true }, ago: "2d ago", accent: "#6366f1" },
  { id: 2, category: "DIGITAL ASSETS AS A SERVICE", query: "Digital assets as a service in UAE", score: 21, topBrand: "BitOasis", rivals: ["Binance", "Crypto.com"], engines: { chatgpt: true, gemini: true, claude: true }, ago: "2d ago", accent: "#10b981" },
  { id: 3, category: "SUPPLY CHAIN MANAGEMENT", query: "Supply Chain Management in UAE", score: 0, topBrand: "Aramex", rivals: ["DP World", "Blue Yonder"], engines: { chatgpt: true, gemini: true, claude: false }, ago: "2d ago", accent: "#f59e0b" },
  { id: 4, category: "OTC CRYPTO DESK", query: "OTC crypto desk in UAE", score: 13, topBrand: "Kraken", rivals: ["Binance", "BitOasis"], engines: { chatgpt: true, gemini: true, claude: true }, ago: "2d ago", accent: "#3b82f6" },
  { id: 5, category: "SEED FUNDING", query: "Seed funding in MENA", score: 75, topBrand: "Flat6Labs", rivals: ["Wamda", "Shorooq Partners"], engines: { chatgpt: true, gemini: true, claude: true }, ago: "3d ago", accent: "#8b5cf6" },
  { id: 6, category: "CRYPTO API INFRASTRUCTURE", query: "Crypto API infrastructure in UAE", score: 4, topBrand: "Alchemy", rivals: ["Binance", "BitOasis"], engines: { chatgpt: true, gemini: false, claude: true }, ago: "2d ago", accent: "#ec4899" },
];

const ENGINES = [
  { key: "chatgpt" as const, label: "ChatGPT", short: "CHA" },
  { key: "gemini"  as const, label: "Gemini",  short: "GEM" },
  { key: "claude"  as const, label: "Claude",  short: "CLA" },
];

function ScoreRing({ score, accent }: { score: number; accent: string }) {
  const r = 18; const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
      <svg viewBox="0 0 44 44" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="3.5" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={accent} strokeWidth="3.5"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 3px ${accent}66)` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: accent, fontSize: 11, fontWeight: 800, lineHeight: 1 }}>{score}</span>
      </div>
    </div>
  );
}

export default function CardVariantA() {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)", padding: "32px 24px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "#6366f1", textTransform: "uppercase", marginBottom: 4 }}>Option A — Glass Cards</div>
          <h2 style={{ color: "#1e1b4b", fontSize: 16, fontWeight: 700, margin: 0 }}>Recent reports on most cited businesses</h2>
        </div>
        <button style={{ color: "#6366f1", fontSize: 12, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, padding: "5px 14px", cursor: "pointer", fontWeight: 600 }}>
          View all 41
        </button>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {MOCK_TILES.map(tile => (
          <div key={tile.id} style={{
            background: "rgba(255,255,255,0.75)",
            border: "1px solid rgba(255,255,255,0.9)",
            backdropFilter: "blur(12px)",
            borderRadius: 16,
            overflow: "hidden",
            cursor: "pointer",
            boxShadow: "0 2px 16px rgba(99,102,241,0.07), 0 1px 3px rgba(0,0,0,0.04)",
            transition: "box-shadow 0.2s",
          }}>
            <div style={{ height: 3, background: `linear-gradient(90deg, ${tile.accent}, ${tile.accent}44)` }} />
            <div style={{ padding: "14px 16px" }}>
              {/* Category + time */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, color: tile.accent, background: `${tile.accent}12`, padding: "2px 7px", borderRadius: 4, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {tile.category}
                </span>
                <span style={{ color: "#9ca3af", fontSize: 9, flexShrink: 0, marginLeft: 6 }}>{tile.ago}</span>
              </div>

              {/* Query */}
              <p style={{ color: "#1e1b4b", fontSize: 13, fontWeight: 600, margin: "0 0 12px", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as any}>
                {tile.query}
              </p>

              {/* Score + top brand */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <ScoreRing score={tile.score} accent={tile.accent} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: "#374151", fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tile.topBrand}</div>
                  <div style={{ color: "#9ca3af", fontSize: 10, marginTop: 1 }}>Top ranked</div>
                </div>
              </div>

              {/* Rivals */}
              <div style={{ display: "flex", gap: 5, marginBottom: 10, flexWrap: "wrap" as const }}>
                {tile.rivals.map((r, i) => (
                  <span key={r} style={{ fontSize: 9, color: "#6b7280", background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 4, padding: "2px 7px" }}>
                    #{i + 2} {r}
                  </span>
                ))}
              </div>

              {/* Engine pills */}
              <div style={{ display: "flex", gap: 5 }}>
                {ENGINES.map(e => (
                  <div key={e.key} style={{
                    flex: 1, height: 22, borderRadius: 5,
                    background: tile.engines[e.key] ? `${tile.accent}12` : "rgba(0,0,0,0.03)",
                    border: `1px solid ${tile.engines[e.key] ? tile.accent + "33" : "rgba(0,0,0,0.06)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    opacity: tile.engines[e.key] ? 1 : 0.4,
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
        <button style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(99,102,241,0.2)", color: "#6b7280", fontSize: 12, padding: "9px 28px", borderRadius: 10, cursor: "pointer" }}>
          Show 35 more analyses ↓
        </button>
      </div>
    </div>
  );
}

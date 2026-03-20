const ENGINES = [
  { name: "ChatGPT", icon: "⬡", color: "#10b981", score: 74, citations: 52, top3: 41 },
  { name: "Gemini", icon: "✦", color: "#3b82f6", score: 61, citations: 38, top3: 24 },
  { name: "Claude", icon: "◈", color: "#f59e0b", score: 58, citations: 31, top3: 19 },
];

const SEGMENTS = [
  { label: "Prescription Eyewear", score: 82, delta: "+14", rank: 2 },
  { label: "Sunglasses", score: 71, delta: "+7", rank: 3 },
  { label: "Eye Exams", score: 58, delta: "-3", rank: 5 },
  { label: "Contact Lenses", score: 44, delta: "+2", rank: 7 },
  { label: "Blue Light Glasses", score: 31, delta: "-9", rank: 11 },
];

const SOURCES = [
  { domain: "reddit.com", category: "Community", count: 28, pct: 91 },
  { domain: "verywell health", category: "Editorial", count: 22, pct: 71 },
  { domain: "warbyparker.com", category: "Brand", count: 18, pct: 58, isBrand: true },
  { domain: "wirecutter.com", category: "Review", count: 14, pct: 45 },
  { domain: "allaboutvision.com", category: "Editorial", count: 9, pct: 29 },
];

const FINDINGS = [
  { type: "win", text: "Cited in 82% of prescription eyewear prompts across all three engines" },
  { type: "gap", text: "Blue light segment losing ground — Zenni now outranks in 67% of Claude responses" },
  { type: "tip", text: "Add structured FAQ schema to /contact-lenses to improve Gemini RAG extraction" },
];

export function ResultsOverview() {
  const geoScore = 67;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #0d0f1a 0%, #0a0c14 60%, #080b12 100%)",
        fontFamily: "Inter, sans-serif",
        color: "#fff",
        padding: "28px 32px",
      }}
    >
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6366f1", marginBottom: 4 }}>
            GEO Intelligence Report
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: 8,
                padding: "3px 10px",
                fontSize: 13,
                fontWeight: 600,
                color: "#a5b4fc",
              }}
            >
              warbyparker.com
            </div>
            <span style={{ color: "#4b5563", fontSize: 12 }}>·</span>
            <span style={{ color: "#6b7280", fontSize: 12 }}>75 prompts · 3 engines · 5 segments</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "#4b5563", marginBottom: 2 }}>Completed</div>
          <div style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>Mar 20, 2026 · 2:14 AM</div>
        </div>
      </div>

      {/* Score hero + engines row */}
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16, marginBottom: 16 }}>
        {/* GEO Score */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            padding: "24px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b7280", marginBottom: 12 }}>
            GEO Score
          </div>
          {/* Ring */}
          <svg width="110" height="110" viewBox="0 0 110 110" style={{ marginBottom: 10 }}>
            <circle cx="55" cy="55" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle
              cx="55" cy="55" r="44"
              fill="none"
              stroke="url(#geo-grad)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 44}
              strokeDashoffset={2 * Math.PI * 44 * (1 - geoScore / 100)}
              transform="rotate(-90 55 55)"
            />
            <defs>
              <linearGradient id="geo-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <text x="55" y="50" textAnchor="middle" fontSize="26" fontWeight="800" fill="#fff" fontFamily="Inter, sans-serif">
              {geoScore}
            </text>
            <text x="55" y="68" textAnchor="middle" fontSize="11" fill="#6b7280" fontFamily="Inter, sans-serif">
              / 100
            </text>
          </svg>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#f59e0b",
              background: "rgba(245,158,11,0.12)",
              border: "1px solid rgba(245,158,11,0.2)",
              borderRadius: 20,
              padding: "2px 10px",
            }}
          >
            Moderate Visibility
          </div>
        </div>

        {/* Engine cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ENGINES.map((eng) => (
            <div
              key={eng.name}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${eng.color}20`,
                borderRadius: 12,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                flex: 1,
              }}
            >
              <div style={{ fontSize: 18, color: eng.color, width: 24, textAlign: "center" }}>{eng.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#e5e7eb" }}>{eng.name}</span>
                  <div
                    style={{
                      background: `${eng.color}18`,
                      border: `1px solid ${eng.color}30`,
                      borderRadius: 6,
                      padding: "1px 7px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: eng.color,
                    }}
                  >
                    {eng.score}%
                  </div>
                </div>
                <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${eng.score}%`, background: `linear-gradient(90deg, ${eng.color}99, ${eng.color})`, borderRadius: 99 }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#e5e7eb" }}>{eng.citations}</div>
                  <div style={{ fontSize: 10, color: "#6b7280" }}>citations</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: eng.color }}>{eng.top3}%</div>
                  <div style={{ fontSize: 10, color: "#6b7280" }}>top-3</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Segments + Sources row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Segments */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            padding: "18px 20px",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b7280", marginBottom: 14 }}>
            Segment Ranking
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SEGMENTS.map((seg) => (
              <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, color: "#4b5563", fontFamily: "monospace", width: 14, flexShrink: 0 }}>
                  #{seg.rank}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: "#d1d5db", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "70%" }}>
                      {seg.label}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: seg.delta.startsWith("+") ? "#10b981" : "#ef4444", flexShrink: 0 }}>
                      {seg.delta}
                    </span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${seg.score}%`,
                        background: seg.score >= 70 ? "linear-gradient(90deg,#6366f1,#8b5cf6)" : seg.score >= 50 ? "linear-gradient(90deg,#f59e0b80,#f59e0b)" : "rgba(239,68,68,0.6)",
                        borderRadius: 99,
                      }}
                    />
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", width: 30, textAlign: "right", flexShrink: 0 }}>
                  {seg.score}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Citation sources */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            padding: "18px 20px",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b7280", marginBottom: 14 }}>
            Top Citation Sources
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {SOURCES.map((src) => (
              <div key={src.domain} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 28, height: 28, borderRadius: 6,
                    background: src.isBrand ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
                    border: src.isBrand ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700,
                    color: src.isBrand ? "#a5b4fc" : "#6b7280",
                    flexShrink: 0,
                  }}
                >
                  {src.domain.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: src.isBrand ? "#a5b4fc" : "#d1d5db", fontWeight: src.isBrand ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "75%" }}>
                      {src.domain}
                      {src.isBrand && <span style={{ marginLeft: 5, fontSize: 9, color: "#6366f1", fontWeight: 700, textTransform: "uppercase" }}>you</span>}
                    </span>
                    <span style={{ fontSize: 11, color: "#6b7280", flexShrink: 0 }}>{src.count}×</span>
                  </div>
                  <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${src.pct}%`, background: src.isBrand ? "linear-gradient(90deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.2)", borderRadius: 99 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key findings */}
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: 16,
          padding: "16px 20px",
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b7280", marginBottom: 12 }}>
          Key Findings
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {FINDINGS.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div
                style={{
                  width: 20, height: 20, borderRadius: 6,
                  background: f.type === "win" ? "rgba(16,185,129,0.15)" : f.type === "gap" ? "rgba(239,68,68,0.15)" : "rgba(99,102,241,0.15)",
                  border: `1px solid ${f.type === "win" ? "rgba(16,185,129,0.3)" : f.type === "gap" ? "rgba(239,68,68,0.3)" : "rgba(99,102,241,0.3)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, flexShrink: 0, marginTop: 1,
                }}
              >
                {f.type === "win" ? "✓" : f.type === "gap" ? "↓" : "→"}
              </div>
              <span style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.5 }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

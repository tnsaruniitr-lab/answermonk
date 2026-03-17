// Variant A — Score Hero
// Full-width hero card: large score ring + brand identity + engine breakdown

const ENGINES = [
  { label: "ChatGPT", pct: 52, top3: 35, color: "#10b981", responses: 48 },
  { label: "Gemini",  pct: 62, top3: 32, color: "#3b82f6", responses: 47 },
  { label: "Claude",  pct: 65, top3: 50, color: "#f59e0b", responses: 48 },
];

function ScoreRing({ score, size = 100 }: { score: number; size?: number }) {
  const r = size * 0.42;
  const circ = 2 * Math.PI * r;
  const cx = size / 2, cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e3a5f" strokeWidth="7" />
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="#60a5fa" strokeWidth="7"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - score / 100)}
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 8px #60a5fa)", transition: "stroke-dashoffset 0.8s ease" }}
      />
    </svg>
  );
}

export function ScoreHero() {
  return (
    <div style={{ background: "#0A0F1E", minHeight: "100vh", padding: "40px 24px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>

        {/* Main hero card */}
        <div style={{
          background: "linear-gradient(135deg, #0f1a35 0%, #111827 60%, #0f172a 100%)",
          border: "1px solid rgba(99,102,241,0.25)",
          borderRadius: 20,
          padding: "28px 28px 24px",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 20px 60px rgba(0,0,0,0.5)",
          marginBottom: 14,
        }}>
          {/* Brand identity row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 16px rgba(99,102,241,0.4)",
            }}>
              <span style={{ color: "white", fontSize: 16, fontWeight: 800 }}>B</span>
            </div>
            <div>
              <div style={{ color: "white", fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>Beco Capital</div>
              <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>VC in MENA · 6 segments · 143 responses</div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <span style={{
                background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)",
                color: "#818cf8", fontSize: 11, fontWeight: 700,
                padding: "4px 10px", borderRadius: 20,
              }}>
                #1 of 7 brands
              </span>
            </div>
          </div>

          {/* Score + engine row */}
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            {/* Score ring */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <ScoreRing score={59} size={110} />
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{ color: "white", fontSize: 28, fontWeight: 800, lineHeight: 1, fontFamily: "monospace" }}>59%</div>
                <div style={{ color: "#60a5fa", fontSize: 9, letterSpacing: 1.5, marginTop: 4, fontFamily: "monospace" }}>VISIBILITY</div>
              </div>
            </div>

            {/* Stats + engine bars */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Top stats */}
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                {[
                  { label: "Top 3 Rate", value: "39%" },
                  { label: "Avg Rank", value: "#3.5" },
                  { label: "Rating", value: "Moderate" },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 700 }}>{s.value}</div>
                    <div style={{ color: "#334155", fontSize: 10, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Engine bars */}
              <div style={{ space: 8 }}>
                {ENGINES.map(e => (
                  <div key={e.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span style={{ color: "#64748b", fontSize: 11, width: 60, flexShrink: 0 }}>{e.label}</span>
                    <div style={{ flex: 1, height: 5, background: "#1e293b", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ width: `${e.pct}%`, height: "100%", background: `linear-gradient(90deg, ${e.color}, ${e.color}88)`, borderRadius: 99, transition: "width 0.8s ease" }} />
                    </div>
                    <span style={{ color: "#94a3b8", fontSize: 11, fontFamily: "monospace", width: 32, textAlign: "right" }}>{e.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Label */}
        <div style={{ textAlign: "center", color: "#1e3a5f", fontSize: 11, fontFamily: "monospace" }}>VARIANT A — SCORE HERO</div>
      </div>
    </div>
  );
}

// Variant C — Twin Panel
// Two cards side by side: identity+score left, engine breakdown right

function MiniScoreRing({ score, color }: { score: number; color: string }) {
  const r = 22, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 52, height: 52, flexShrink: 0 }}>
      <svg viewBox="0 0 52 52" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx="26" cy="26" r={r} fill="none" stroke="#1e3a5f" strokeWidth="5" />
        <circle cx="26" cy="26" r={r} fill="none"
          stroke={color} strokeWidth="5"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - score / 100)}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 5px ${color})` }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color, fontSize: 11, fontWeight: 800, fontFamily: "monospace" }}>{score}</span>
      </div>
    </div>
  );
}

export function TwinPanel() {
  return (
    <div style={{ background: "#0A0F1E", minHeight: "100vh", padding: "40px 24px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>

        {/* Two-panel layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>

          {/* LEFT: Identity + score */}
          <div style={{
            background: "linear-gradient(160deg, #0f1a35 0%, #0f172a 100%)",
            border: "1px solid rgba(96,165,250,0.2)",
            borderRadius: 16, padding: "20px 20px",
          }}>
            {/* Brand */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ color: "white", fontSize: 12, fontWeight: 800 }}>B</span>
                </div>
                <div>
                  <div style={{ color: "white", fontSize: 13, fontWeight: 700 }}>Beco Capital</div>
                  <div style={{ color: "#334155", fontSize: 10 }}>VC · MENA</div>
                </div>
              </div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: 20, padding: "2px 9px",
              }}>
                <span style={{ color: "#818cf8", fontSize: 10, fontWeight: 700 }}>🏆 #1 of 7 brands</span>
              </div>
            </div>

            {/* Big score */}
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{ color: "#60a5fa", fontSize: 48, fontWeight: 900, fontFamily: "monospace", lineHeight: 1 }}>59<span style={{ fontSize: 22, color: "#1e3a5f" }}>%</span></div>
              <div style={{ color: "#1e3a5f", fontSize: 9, letterSpacing: 2, fontFamily: "monospace", marginTop: 4 }}>OVERALL AI VISIBILITY</div>
              <div style={{ color: "#475569", fontSize: 12, marginTop: 8 }}>Moderate</div>
            </div>

            {/* Mini stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
              {[
                { label: "Top 3 Rate", value: "39%" },
                { label: "Avg Rank", value: "#3.5" },
              ].map(s => (
                <div key={s.label} style={{ background: "#0a1628", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 700 }}>{s.value}</div>
                  <div style={{ color: "#334155", fontSize: 9, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Engine breakdown */}
          <div style={{
            background: "#060f1e",
            border: "1px solid #1e3a5f",
            borderRadius: 16, padding: "20px 20px",
          }}>
            <div style={{ color: "#334155", fontSize: 9, fontFamily: "monospace", letterSpacing: 1.5, marginBottom: 16 }}>ENGINE BREAKDOWN</div>

            {[
              { label: "ChatGPT", pct: 52, top3: 35, color: "#10b981", responses: 48 },
              { label: "Gemini",  pct: 62, top3: 32, color: "#3b82f6", responses: 47 },
              { label: "Claude",  pct: 65, top3: 50, color: "#f59e0b", responses: 48 },
            ].map(e => (
              <div key={e.label} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <MiniScoreRing score={e.pct} color={e.color} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{e.label}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={{ color: "#475569", fontSize: 10 }}>Top 3: <span style={{ color: "#64748b", fontWeight: 600 }}>{e.top3}%</span></span>
                      <span style={{ color: "#1e3a5f", fontSize: 10 }}>{e.responses} resp.</span>
                    </div>
                  </div>
                </div>
                <div style={{ height: 4, background: "#0a1628", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${e.pct}%`, height: "100%", background: `linear-gradient(90deg, ${e.color}, ${e.color}66)`, borderRadius: 99 }} />
                </div>
              </div>
            ))}

            <div style={{ borderTop: "1px solid #1e3a5f", paddingTop: 12, marginTop: 4 }}>
              <div style={{ color: "#334155", fontSize: 10 }}>6 segments · 143 total responses</div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", color: "#1e3a5f", fontSize: 11, fontFamily: "monospace" }}>VARIANT C — TWIN PANEL</div>
      </div>
    </div>
  );
}

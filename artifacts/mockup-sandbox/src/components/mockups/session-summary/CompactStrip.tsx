// Variant B — Compact Strip
// Single slim horizontal bar — brand left, score center, engines right

export function CompactStrip() {
  return (
    <div style={{ background: "#0A0F1E", minHeight: "100vh", padding: "40px 24px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>

        {/* Compact strip */}
        <div style={{
          background: "#060f1e",
          border: "1px solid #1e3a5f",
          borderRadius: 14,
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: 0,
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
          marginBottom: 14,
        }}>
          {/* Brand */}
          <div style={{ minWidth: 0, flex: "0 0 auto", paddingRight: 20, borderRight: "1px solid #1e3a5f" }}>
            <div style={{ color: "white", fontSize: 13, fontWeight: 700 }}>Beco Capital</div>
            <div style={{ color: "#334155", fontSize: 10, marginTop: 1 }}>VC in MENA</div>
          </div>

          {/* Score */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "0 20px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#60a5fa", fontSize: 26, fontWeight: 800, fontFamily: "monospace", lineHeight: 1 }}>59%</div>
              <div style={{ color: "#1e3a5f", fontSize: 9, letterSpacing: 1, marginTop: 2, fontFamily: "monospace" }}>AI VISIBILITY</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                { label: "Top 3", value: "39%" },
                { label: "Avg Rank", value: "#3.5" },
              ].map(s => (
                <div key={s.label} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ color: "#334155", fontSize: 9, fontFamily: "monospace", width: 44 }}>{s.label}</span>
                  <span style={{ color: "#64748b", fontSize: 11, fontWeight: 600 }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Engines + rank */}
          <div style={{ flex: "0 0 auto", paddingLeft: 20, borderLeft: "1px solid #1e3a5f", display: "flex", flexDirection: "column", gap: 5 }}>
            {[
              { label: "GPT", pct: 52, color: "#10b981" },
              { label: "Gem", pct: 62, color: "#3b82f6" },
              { label: "Cld", pct: 65, color: "#f59e0b" },
            ].map(e => (
              <div key={e.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ color: e.color, fontSize: 9, fontWeight: 700, fontFamily: "monospace", width: 22 }}>{e.label}</span>
                <div style={{ width: 56, height: 3, background: "#1e293b", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${e.pct}%`, height: "100%", background: e.color, borderRadius: 99 }} />
                </div>
                <span style={{ color: "#475569", fontSize: 10, fontFamily: "monospace", width: 28, textAlign: "right" }}>{e.pct}%</span>
              </div>
            ))}
          </div>

          {/* Rank badge */}
          <div style={{ flex: "0 0 auto", paddingLeft: 16, marginLeft: 4 }}>
            <div style={{
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.25)",
              borderRadius: 10, padding: "6px 10px", textAlign: "center",
            }}>
              <div style={{ color: "#818cf8", fontSize: 16, fontWeight: 800, lineHeight: 1 }}>#1</div>
              <div style={{ color: "#334155", fontSize: 8, fontFamily: "monospace", marginTop: 2 }}>of 7</div>
            </div>
          </div>
        </div>

        {/* Simulated segment cards below */}
        {[1, 2].map(i => (
          <div key={i} style={{
            background: "#111827", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, padding: "14px 18px", marginBottom: 10,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
            <div style={{ flex: 1 }}>
              <div style={{ color: "#94a3b8", height: 10, width: i === 1 ? "60%" : "45%", background: "#1e293b", borderRadius: 4 }} />
            </div>
            <div style={{ color: "#64748b", fontSize: 20, fontWeight: 700 }}>{i === 1 ? "75%" : "35%"}</div>
          </div>
        ))}

        <div style={{ textAlign: "center", color: "#1e3a5f", fontSize: 11, fontFamily: "monospace", marginTop: 12 }}>VARIANT B — COMPACT STRIP</div>
      </div>
    </div>
  );
}

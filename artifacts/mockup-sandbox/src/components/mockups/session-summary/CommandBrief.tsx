const ENGINES = [
  { label: "ChatGPT", pct: 6, color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  { label: "Gemini",  pct: 2, color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  { label: "Claude",  pct: 1, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
];

export function CommandBrief() {
  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 32, fontFamily: "'Georgia', serif" }}>
      <div style={{ width: 440, borderRadius: 16, overflow: "hidden", background: "#111827", border: "1px solid rgba(99,102,241,0.2)", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>

        {/* Report masthead */}
        <div style={{ background: "linear-gradient(110deg,#1e1b4b,#1e293b)", padding: "14px 20px 12px", borderBottom: "1px solid rgba(99,102,241,0.2)" }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6, fontFamily: "system-ui,sans-serif" }}>
            AI VISIBILITY INTELLIGENCE BRIEF
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#818cf8", flexShrink: 0, fontFamily: "system-ui,sans-serif" }}>
              F
            </div>
            <div>
              <div style={{ fontSize: 19, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.02em", lineHeight: 1 }}>FRH Consulting</div>
              <div style={{ fontSize: 10.5, color: "#64748b", fontFamily: "system-ui,sans-serif", marginTop: 2 }}>frh-consulting.com · 4 market segments</div>
            </div>
          </div>
        </div>

        {/* Headline finding */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6, fontFamily: "system-ui,sans-serif" }}>
                Appearance Rate
              </p>
              <p style={{ fontSize: 15, color: "#cbd5e1", lineHeight: 1.55, fontStyle: "italic" }}>
                "FRH Consulting appears in <span style={{ color: "#f87171", fontWeight: 700, fontStyle: "normal" }}>3%</span> of AI-generated responses when potential customers search for services in your category."
              </p>
            </div>
            <div style={{ flexShrink: 0, textAlign: "right" }}>
              <div style={{ fontSize: 42, fontWeight: 900, color: "#f87171", letterSpacing: "-0.04em", lineHeight: 1, fontFamily: "system-ui,sans-serif" }}>3%</div>
              <div style={{ display: "inline-block", fontSize: 10, fontWeight: 700, color: "#fca5a5", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: 20, padding: "3px 8px", fontFamily: "system-ui,sans-serif" }}>
                ⚠ Very Low
              </div>
            </div>
          </div>
        </div>

        {/* Key metrics */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontFamily: "system-ui,sans-serif" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px" }}>
            {[
              { label: "Top-3 Placement Rate", value: "1%", note: "appearing in top results" },
              { label: "Average Rank Position", value: "#7", note: "across all engines" },
              { label: "Segments Analysed", value: "4 of 4", note: "complete coverage" },
              { label: "AI Responses Sampled", value: "120", note: "per segment" },
            ].map(m => (
              <div key={m.label} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#e2e8f0", letterSpacing: "-0.02em" }}>{m.value}</div>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: "#64748b" }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Engine column */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontFamily: "system-ui,sans-serif" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Engine Analysis</p>
          <div style={{ display: "flex", gap: 8 }}>
            {ENGINES.map(e => (
              <div key={e.label} style={{ flex: 1, background: e.bg, border: `1px solid ${e.color}33`, borderRadius: 10, padding: "9px 10px" }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: e.color, letterSpacing: "-0.03em", lineHeight: 1 }}>{e.pct}%</div>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: "#94a3b8", marginTop: 3 }}>{e.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: 10, fontFamily: "system-ui,sans-serif" }}>
          <input
            readOnly
            value=""
            placeholder="your@email.com"
            style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#94a3b8", outline: "none" }}
          />
          <button style={{ background: "linear-gradient(110deg,#4f46e5,#7c3aed)", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}>
            Email Report →
          </button>
        </div>
      </div>
    </div>
  );
}

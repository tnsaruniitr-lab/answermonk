const ENGINES = [
  { label: "ChatGPT", pct: 6, color: "#10b981" },
  { label: "Gemini",  pct: 2, color: "#60a5fa" },
  { label: "Claude",  pct: 1, color: "#fbbf24" },
];

const STATS = [
  { label: "Top 3 Rate", value: "1%" },
  { label: "Avg Rank",   value: "#7" },
  { label: "Segments",   value: "4/4" },
  { label: "Responses",  value: "120" },
];

function AlarmBadge() {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.5)",
      color: "#f87171", borderRadius: 20, padding: "4px 11px", fontSize: 11, fontWeight: 700,
      letterSpacing: "0.04em",
    }}>
      ⚠ CRITICAL
    </span>
  );
}

export function AlarmFirst() {
  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 32, fontFamily: "system-ui,sans-serif" }}>
      <div style={{ width: 440, borderRadius: 20, overflow: "hidden", border: "1px solid rgba(239,68,68,0.3)", boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 24px 60px rgba(0,0,0,0.6)" }}>

        {/* Brand header */}
        <div style={{ background: "#0f172a", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "#fff", flexShrink: 0 }}>
            F
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.025em" }}>FRH Consulting</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>frh-consulting.com · GEO Intelligence Scan</div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 10, color: "#64748b", background: "#1e293b", border: "1px solid #334155", borderRadius: 6, padding: "3px 8px", fontWeight: 600 }}>
            #4 of 6 brands
          </div>
        </div>

        {/* Critical alarm */}
        <div style={{ background: "linear-gradient(110deg,#450a0a,#7f1d1d)", padding: "18px 20px", borderBottom: "1px solid rgba(239,68,68,0.3)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(252,165,165,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Appearance Rate</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span style={{ fontSize: 52, fontWeight: 900, color: "#fca5a5", letterSpacing: "-0.04em", lineHeight: 1 }}>3%</span>
                <AlarmBadge />
              </div>
            </div>
          </div>
          <p style={{ fontSize: 12, color: "rgba(252,165,165,0.6)", lineHeight: 1.5 }}>
            You appear in <strong style={{ color: "#fca5a5" }}>3% of AI searches</strong> when customers look for your services. Your competitors are capturing the rest.
          </p>
        </div>

        {/* Stats grid */}
        <div style={{ background: "#0f172a", padding: "14px 20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          {STATS.map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#e2e8f0", fontFamily: "monospace" }}>{s.value}</div>
              <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Engine breakdown */}
        <div style={{ background: "#0f172a", padding: "14px 20px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>By Engine</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ENGINES.map(e => (
              <div key={e.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", width: 52, flexShrink: 0 }}>{e.label}</span>
                <div style={{ flex: 1, height: 5, background: "#1e293b", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(e.pct / 20) * 100}%`, background: e.color, borderRadius: 99 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", fontFamily: "monospace", width: 28, textAlign: "right", flexShrink: 0 }}>{e.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ background: "#0f172a", padding: "14px 20px" }}>
          <button style={{
            width: "100%", background: "linear-gradient(110deg,#dc2626,#b91c1c)", border: "none", borderRadius: 10,
            padding: "11px 0", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer",
            letterSpacing: "-0.01em",
          }}>
            Get Full Report Emailed — Fix This Now →
          </button>
          <p style={{ fontSize: 10.5, color: "#475569", textAlign: "center", marginTop: 8 }}>
            Your authority sources scan is running · Full analysis in ~4 min
          </p>
        </div>
      </div>
    </div>
  );
}

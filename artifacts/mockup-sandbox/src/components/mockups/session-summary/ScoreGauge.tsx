const ENGINES = [
  { label: "ChatGPT", pct: 6, color: "#10b981" },
  { label: "Gemini",  pct: 2, color: "#60a5fa" },
  { label: "Claude",  pct: 1, color: "#fbbf24" },
];

function Arc({ pct, size = 120, stroke = 10 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ * 0.75;
  const offset = circ * 0.125;
  return (
    <svg width={size} height={size * 0.75} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#1e293b" strokeWidth={stroke} strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} strokeDashoffset={-offset} strokeLinecap="round" transform={`rotate(0 ${cx} ${cx})`} />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={pct < 10 ? "#ef4444" : pct < 30 ? "#f59e0b" : "#6366f1"} strokeWidth={stroke} strokeDasharray={`${filled} ${circ}`} strokeDashoffset={-offset} strokeLinecap="round" transform={`rotate(0 ${cx} ${cx})`} style={{ transition: "stroke-dasharray 1s ease" }} />
    </svg>
  );
}

export function ScoreGauge() {
  const pct = 3;
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#ede9fe,#fff,#ecfdf5)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 32, fontFamily: "system-ui,sans-serif" }}>
      <div style={{ width: 440, borderRadius: 20, overflow: "hidden", background: "#fff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 20px 60px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.9)" }}>

        {/* Brand header - dark stripe */}
        <div style={{ background: "linear-gradient(110deg,#1e1b4b,#312e81)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 900, color: "#fff", flexShrink: 0 }}>
            F
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: "-0.025em" }}>FRH Consulting</div>
            <div style={{ fontSize: 11, color: "rgba(196,181,253,0.7)" }}>GEO Visibility Report · 4 segments analysed</div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 10, color: "#c4b5fd", background: "rgba(255,255,255,0.1)", borderRadius: 6, padding: "3px 8px", fontWeight: 600 }}>
            #4 of 6
          </div>
        </div>

        {/* Score gauge section */}
        <div style={{ padding: "24px 20px 16px", display: "flex", alignItems: "flex-start", gap: 20 }}>
          {/* Gauge */}
          <div style={{ flexShrink: 0, position: "relative" }}>
            <Arc pct={pct} size={120} stroke={10} />
            <div style={{ position: "absolute", top: "38%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#ef4444", letterSpacing: "-0.04em", lineHeight: 1 }}>{pct}%</div>
            </div>
          </div>
          {/* Right info */}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Appearance Rate</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", lineHeight: 1.4, marginBottom: 8 }}>
              You appear in <span style={{ color: "#ef4444" }}>3%</span> of AI searches across your category.
            </p>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
              ⚠ Very Low
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#f1f5f9", margin: "0 20px" }} />

        {/* Stats */}
        <div style={{ padding: "12px 20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
          {[
            { label: "Top 3 Rate", value: "1%" },
            { label: "Avg Rank",   value: "#7" },
            { label: "Segments",   value: "4 / 4" },
            { label: "Responses",  value: "120" },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>{s.value}</div>
              <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#f1f5f9", margin: "0 20px" }} />

        {/* Engine bars */}
        <div style={{ padding: "12px 20px 16px" }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Engine Breakdown</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ENGINES.map(e => (
              <div key={e.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#475569", width: 52, flexShrink: 0 }}>{e.label}</span>
                <div style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(e.pct / 20) * 100}%`, background: e.color, borderRadius: 99 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#334155", fontFamily: "monospace", width: 28, textAlign: "right", flexShrink: 0 }}>{e.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ padding: "0 20px 20px" }}>
          <button style={{ width: "100%", background: "linear-gradient(110deg,#4f46e5,#7c3aed)", border: "none", borderRadius: 10, padding: "11px 0", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer" }}>
            Email me the full intelligence report →
          </button>
        </div>
      </div>
    </div>
  );
}

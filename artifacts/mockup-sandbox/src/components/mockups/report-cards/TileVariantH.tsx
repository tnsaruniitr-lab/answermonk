const SAMPLE = {
  category: "AT-HOME BLOOD TESTS",
  query: "at-home blood tests in Dubai",
  topBrand: "Nightingale Health Services",
  topScore: 68,
  rivals: ["Aster Labs", "King's College Hospital London"],
  accent: "#6366f1",
};

function ScoreArc({ score, accent }: { score: number; accent: string }) {
  const r = 24;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 60, height: 60, flexShrink: 0 }}>
      <svg viewBox="0 0 60 60" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx="30" cy="30" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4.5" />
        <circle
          cx="30" cy="30" r={r} fill="none"
          stroke={accent} strokeWidth="4.5"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - score / 100)}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${accent}aa)` }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#ffffff", fontSize: 15, fontWeight: 900, lineHeight: 1 }}>{score}</span>
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 8, marginTop: 1 }}>/100</span>
      </div>
    </div>
  );
}

export default function TileVariantH() {
  const t = SAMPLE;
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#ede9fe 0%,#fff 50%,#ecfdf5 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: 300 }}>
        <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 8, textAlign: "center" }}>Option C — Bold Header</div>

        <div
          style={{
            background: "#0d1526",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 18,
            overflow: "hidden",
            cursor: "pointer",
            boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
            transition: "box-shadow 0.2s, transform 0.15s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 48px rgba(99,102,241,0.2), 0 0 0 1px rgba(99,102,241,0.25)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 40px rgba(0,0,0,0.4)";
          }}
        >
          {/* Bold gradient header with query */}
          <div style={{
            background: "linear-gradient(135deg,#312e81 0%,#4f46e5 50%,#7c3aed 100%)",
            padding: "18px 18px 16px",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* decorative circle */}
            <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
            <div style={{ position: "absolute", bottom: -30, right: 30, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />

            <div style={{ position: "relative" }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.5)", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                {t.category}
              </span>
              <p style={{ fontSize: 16, fontWeight: 900, color: "#ffffff", margin: 0, lineHeight: 1.25, letterSpacing: "-0.015em", textAlign: "left" }}>
                {t.query}
              </p>
            </div>
          </div>

          <div style={{ padding: "14px 16px" }}>
            {/* Score ring + #1 */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <ScoreArc score={t.topScore} accent={t.accent} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", background: t.accent, borderRadius: 4, padding: "2px 6px", flexShrink: 0 }}>#1</span>
                  <span style={{ color: "#f1f5f9", fontSize: 13, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.topBrand}</span>
                </div>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>Most cited in AI responses</span>
              </div>
            </div>

            {/* Rivals */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
              {t.rivals.map((r, i) => (
                <div key={r} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3, padding: "1px 5px", flexShrink: 0 }}>#{i + 2}</span>
                  <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "9px 14px" }}>
              <span style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 700 }}>View full analysis</span>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: "linear-gradient(135deg,#4338ca,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontSize: 14, lineHeight: 1 }}>→</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

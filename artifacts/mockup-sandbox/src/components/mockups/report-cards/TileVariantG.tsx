const SAMPLE = {
  category: "AT-HOME BLOOD TESTS",
  query: "at-home blood tests in Dubai",
  topBrand: "Nightingale Health Services",
  topScore: 68,
  rivals: ["Aster Labs", "King's College Hospital London"],
  accent: "#6366f1",
};

function ScoreRing({ score, accent }: { score: number; accent: string }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 50, height: 50, flexShrink: 0 }}>
      <svg viewBox="0 0 50 50" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx="25" cy="25" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.5" />
        <circle
          cx="25" cy="25" r={r} fill="none"
          stroke={accent} strokeWidth="3.5"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - score / 100)}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 5px ${accent}90)` }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#ffffff", fontSize: 13, fontWeight: 900, lineHeight: 1 }}>{score}</span>
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 7, marginTop: 1 }}>/100</span>
      </div>
    </div>
  );
}

export default function TileVariantG() {
  const t = SAMPLE;
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#ede9fe 0%,#fff 50%,#ecfdf5 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: 300 }}>
        <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 8, textAlign: "center" }}>Option B — Glass + Glow</div>

        <div
          style={{
            background: "rgba(13,21,38,0.85)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(99,102,241,0.25)",
            borderRadius: 20,
            overflow: "hidden",
            cursor: "pointer",
            boxShadow: "0 0 0 1px rgba(99,102,241,0.1), 0 20px 60px rgba(99,102,241,0.15)",
            transition: "box-shadow 0.2s, transform 0.15s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 1px rgba(99,102,241,0.4), 0 24px 64px rgba(99,102,241,0.3)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 1px rgba(99,102,241,0.1), 0 20px 60px rgba(99,102,241,0.15)";
          }}
        >
          {/* Top glow stripe */}
          <div style={{ height: 2, background: "linear-gradient(90deg,#6366f1,#8b5cf6,#6366f100)" }} />

          <div style={{ padding: "16px 18px" }}>
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: "#818cf8", letterSpacing: "0.12em", textTransform: "uppercase", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 5, padding: "3px 8px" }}>
                {t.category}
              </span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>1h ago</span>
            </div>

            {/* Query left-aligned */}
            <p style={{ fontSize: 16, fontWeight: 800, color: "#ffffff", margin: "0 0 16px", lineHeight: 1.25, letterSpacing: "-0.01em", textAlign: "left" }}>
              {t.query}
            </p>

            {/* Divider */}
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 14 }} />

            {/* Score + #1 brand row */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <ScoreRing score={t.topScore} accent={t.accent} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", background: "linear-gradient(90deg,#4338ca,#6366f1)", borderRadius: 4, padding: "2px 7px" }}>#1</span>
                  <span style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.topBrand}</span>
                </div>
                <span style={{ color: "rgba(255,255,255,0.28)", fontSize: 10 }}>Most cited in AI responses</span>
              </div>
            </div>

            {/* Rivals */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 16 }}>
              {t.rivals.map((r, i) => (
                <div key={r} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3, padding: "1px 5px", flexShrink: 0 }}>#{i + 2}</span>
                  <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div style={{ border: "1px solid rgba(99,102,241,0.35)", borderRadius: 10, padding: "9px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(99,102,241,0.08)" }}>
              <span style={{ color: "#a5b4fc", fontSize: 12, fontWeight: 700 }}>View full analysis</span>
              <span style={{ color: "#6366f1", fontSize: 16 }}>→</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

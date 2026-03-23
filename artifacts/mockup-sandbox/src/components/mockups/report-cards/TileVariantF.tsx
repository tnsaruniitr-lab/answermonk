const SAMPLE = {
  category: "AT-HOME BLOOD TESTS",
  query: "at-home blood tests in Dubai",
  topBrand: "Nightingale Health Services",
  topScore: 68,
  rivals: ["Aster Labs", "King's College Hospital London"],
  createdAt: new Date(Date.now() - 3600000).toISOString(),
  accent: "#6366f1",
};

function ScoreRing({ score, accent }: { score: number; accent: string }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
      <svg viewBox="0 0 56 56" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
        <circle
          cx="28" cy="28" r={r} fill="none"
          stroke={accent} strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - score / 100)}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${accent}90)` }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: accent, fontSize: 14, fontWeight: 900, lineHeight: 1 }}>{score}</span>
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 7, fontWeight: 600, marginTop: 1 }}>/100</span>
      </div>
    </div>
  );
}

export default function TileVariantF() {
  const t = SAMPLE;
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#ede9fe 0%,#fff 50%,#ecfdf5 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: 300 }}>
        <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 8, textAlign: "center" }}>Option A — Dark Intelligence</div>

        <div
          style={{
            background: "#0d1526",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 18,
            overflow: "hidden",
            cursor: "pointer",
            boxShadow: "0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04)",
            transition: "box-shadow 0.2s, transform 0.15s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
            (e.currentTarget as HTMLDivElement).style.boxShadow = `0 16px 48px rgba(99,102,241,0.25), 0 0 0 1px rgba(99,102,241,0.3)`;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04)";
          }}
        >
          {/* Gradient top band */}
          <div style={{ background: "linear-gradient(100deg,#4338ca 0%,#6d28d9 100%)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {t.category}
            </span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>1h ago</span>
          </div>

          <div style={{ padding: "14px 16px" }}>
            {/* Query — left aligned */}
            <p style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9", margin: "0 0 14px", lineHeight: 1.3, textAlign: "left" }}>
              {t.query}
            </p>

            {/* Score + #1 brand */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "10px 12px", marginBottom: 10, border: "1px solid rgba(255,255,255,0.07)" }}>
              <ScoreRing score={t.topScore} accent={t.accent} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", background: t.accent, borderRadius: 4, padding: "2px 6px" }}>#1</span>
                  <span style={{ color: "#f1f5f9", fontSize: 13, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.topBrand}
                  </span>
                </div>
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>Most cited in AI responses</span>
              </div>
            </div>

            {/* Rivals */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
              {t.rivals.map((r, i) => (
                <div key={r} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3, padding: "1px 5px" }}>#{i + 2}</span>
                  <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div style={{ background: "linear-gradient(100deg,#4338ca,#6366f1)", borderRadius: 10, padding: "9px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>View full analysis</span>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 16 }}>→</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

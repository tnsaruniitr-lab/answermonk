// Variant A — Soft Lavender: uses exact landing page card tokens, all-indigo accent (no per-card colors)

type CardData = {
  category: string;
  location: string;
  timeAgo: string;
  winner: { name: string; score: number };
  challengers: { name: string; score: number }[];
};

const CARDS: CardData[] = [
  {
    category: "At-home blood tests",
    location: "Dubai",
    timeAgo: "1d ago",
    winner: { name: "Vesta Care", score: 50 },
    challengers: [
      { name: "Royal Clinic", score: 50 },
      { name: "The Good Doctor", score: 44 },
    ],
  },
  {
    category: "Weight loss programs",
    location: "Dubai",
    timeAgo: "1d ago",
    winner: { name: "Dubai London Hospital", score: 56 },
    challengers: [
      { name: "DNA Health & Wellness", score: 44 },
      { name: "Endocare Clinic", score: 38 },
    ],
  },
  {
    category: "Home nursing care",
    location: "Berlin",
    timeAgo: "1d ago",
    winner: { name: "Pflegehilfe für Senioren", score: 38 },
    challengers: [
      { name: "Home Instead", score: 38 },
      { name: "aroCare ambulante", score: 38 },
    ],
  },
];

// Exact LP tokens
const ACCENT = "#4f46e5";
const ACCENT_LIGHT = "#ede9fe";
const ACCENT_MID = "#c7d2fe";
const CARD_BG = "linear-gradient(160deg, #ffffff 0%, #ede9fe22 100%)";
const CARD_BORDER = "1px solid rgba(99,102,241,0.12)";
const LEFT_BAR = "linear-gradient(180deg, #4f46e5 0%, rgba(99,102,241,0.18) 100%)";

function Card({ card }: { card: CardData }) {
  return (
    <div
      style={{
        display: "flex",
        background: CARD_BG,
        border: CARD_BORDER,
        borderRadius: 14,
        overflow: "hidden",
        width: 265,
        boxShadow: "0 1px 8px rgba(99,102,241,0.08)",
        transition: "box-shadow 0.18s, transform 0.15s",
      }}
    >
      {/* Left accent bar — exact LP token */}
      <div style={{ width: 4, flexShrink: 0, background: LEFT_BAR }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "12px 14px 12px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: ACCENT, flexShrink: 0, display: "inline-block" }} />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: ACCENT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {card.category}
              </span>
            </div>
            <div style={{ fontSize: 10, color: "#9ca3af", marginLeft: 12 }}>{card.location}</div>
          </div>
          <span style={{ fontSize: 9.5, color: "#9ca3af", flexShrink: 0, marginTop: 1 }}>{card.timeAgo}</span>
        </div>

        {/* Winner bubble — exact LP style */}
        <div
          style={{
            background: `linear-gradient(135deg, rgba(99,102,241,0.12) 0%, #ede9fecc 60%, #dbeafe88 100%)`,
            border: `1.5px solid rgba(99,102,241,0.22)`,
            borderRadius: 9,
            padding: "8px 10px",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6), 0 2px 6px rgba(99,102,241,0.08)",
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 10, fontWeight: 800, color: "#fff",
                background: ACCENT,
                borderRadius: 4, padding: "2px 6px", flexShrink: 0,
              }}
            >
              #1
            </span>
            <span style={{ color: "#111827", fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
              {card.winner.name}
            </span>
            <span
              style={{
                fontSize: 13, fontWeight: 800,
                background: "rgba(255,255,255,0.75)", border: `1px solid rgba(99,102,241,0.25)`,
                borderRadius: 20, padding: "1px 8px",
                color: ACCENT, flexShrink: 0,
              }}
            >
              {card.winner.score}%
            </span>
          </div>
          <div style={{ height: 3, background: ACCENT_MID, borderRadius: 2, marginTop: 8 }}>
            <div style={{ height: "100%", width: `${card.winner.score}%`, background: ACCENT, borderRadius: 2 }} />
          </div>
        </div>

        {/* Challengers */}
        <div style={{ flex: 1 }}>
          {card.challengers.map((c, i) => (
            <div
              key={c.name}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "5px 0",
                borderBottom: i < card.challengers.length - 1 ? "1px solid rgba(99,102,241,0.06)" : "none",
              }}
            >
              <span style={{ fontSize: 9.5, fontWeight: 600, color: "#d1d5db", width: 16, flexShrink: 0 }}>#{i + 2}</span>
              <span style={{ flex: 1, fontSize: 12, color: "#374151", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.name}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", flexShrink: 0 }}>{c.score}%</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          style={{
            marginTop: 10, textAlign: "center", fontSize: 12, fontWeight: 600,
            color: ACCENT,
            background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.18)",
            borderRadius: 8, padding: "7px 0", cursor: "pointer",
          }}
        >
          View full analysis →
        </div>
      </div>
    </div>
  );
}

export function LpMatchA() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)",
        padding: "28px 24px",
        fontFamily: "Inter, system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Aurora orbs matching landing page */}
      <div style={{ position: "absolute", top: "-8vh", left: "-5vw", width: "35vw", height: "35vw", background: "#fbcfe8", borderRadius: "50%", filter: "blur(80px)", opacity: 0.3, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "5vh", right: "-8vw", width: "40vw", height: "40vw", background: "#c4b5fd", borderRadius: "50%", filter: "blur(100px)", opacity: 0.3, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "5vh", left: "20vw", width: "35vw", height: "35vw", background: "#a7f3d0", borderRadius: "50%", filter: "blur(80px)", opacity: 0.28, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: ACCENT, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)", borderRadius: 99, padding: "5px 12px" }}>
            44 audits completed
          </span>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>Variant A — soft lavender · uniform indigo</span>
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {CARDS.map((c) => <Card key={c.category} card={c} />)}
        </div>
      </div>
    </div>
  );
}

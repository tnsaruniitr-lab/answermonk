// Variant C — Deep Indigo Header Band: strong category header using LP gradient, white card body

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

function Card({ card }: { card: CardData }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid rgba(99,102,241,0.12)",
        borderRadius: 14,
        overflow: "hidden",
        width: 265,
        boxShadow: "0 2px 16px rgba(55,48,163,0.1)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header band — LP gradient */}
      <div
        style={{
          background: "linear-gradient(110deg, #3730a3 0%, #4f46e5 50%, #6d28d9 100%)",
          padding: "11px 14px 10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
              {card.category}
            </div>
            <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>{card.location}</div>
          </div>
          <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.5)", flexShrink: 0, marginTop: 1 }}>{card.timeAgo}</span>
        </div>
      </div>

      {/* Winner */}
      <div style={{ padding: "10px 14px 6px" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%)",
            border: "1px solid rgba(99,102,241,0.18)",
            borderRadius: 9,
            padding: "8px 10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span
              style={{
                fontSize: 9, fontWeight: 800, color: "#fff",
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                borderRadius: 4, padding: "2px 6px", flexShrink: 0,
              }}
            >
              #1
            </span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#1e1b4b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {card.winner.name}
            </span>
            <span
              style={{
                fontSize: 13, fontWeight: 800,
                color: "#4f46e5",
                background: "rgba(255,255,255,0.85)", border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: 20, padding: "1px 8px", flexShrink: 0,
              }}
            >
              {card.winner.score}%
            </span>
          </div>
          <div style={{ height: 3, background: "rgba(99,102,241,0.15)", borderRadius: 2, marginTop: 8 }}>
            <div style={{ height: "100%", width: `${card.winner.score}%`, background: "linear-gradient(90deg, #4f46e5, #6d28d9)", borderRadius: 2 }} />
          </div>
        </div>
      </div>

      {/* Challengers */}
      <div style={{ padding: "4px 14px 10px", flex: 1 }}>
        {card.challengers.map((c, i) => (
          <div
            key={c.name}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 0",
              borderBottom: i < card.challengers.length - 1 ? "1px solid rgba(99,102,241,0.07)" : "none",
            }}
          >
            <span style={{ fontSize: 9, fontWeight: 600, color: "#d1d5db", width: 16, flexShrink: 0 }}>#{i + 2}</span>
            <span style={{ flex: 1, fontSize: 12, color: "#374151", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {c.name}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", flexShrink: 0 }}>{c.score}%</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ padding: "0 14px 12px" }}>
        <div
          style={{
            textAlign: "center", fontSize: 12, fontWeight: 600,
            color: "#4f46e5",
            background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.16)",
            borderRadius: 8, padding: "7px 0", cursor: "pointer",
          }}
        >
          View full analysis →
        </div>
      </div>
    </div>
  );
}

export function LpMatchC() {
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
      <div style={{ position: "absolute", top: "-8vh", left: "-5vw", width: "36vw", height: "36vw", background: "#fbcfe8", borderRadius: "50%", filter: "blur(80px)", opacity: 0.3, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "5vh", right: "-8vw", width: "42vw", height: "42vw", background: "#c4b5fd", borderRadius: "50%", filter: "blur(100px)", opacity: 0.3, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "5vh", left: "18vw", width: "36vw", height: "36vw", background: "#a7f3d0", borderRadius: "50%", filter: "blur(80px)", opacity: 0.26, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#4f46e5", background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.18)", borderRadius: 99, padding: "5px 12px" }}>
            44 audits completed
          </span>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>Variant C — indigo header band · white body</span>
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {CARDS.map((c) => <Card key={c.category} card={c} />)}
        </div>
      </div>
    </div>
  );
}

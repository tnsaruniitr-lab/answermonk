// Variant B — Aurora Glass: cards float as frosted glass on the landing page aurora gradient

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
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.65)",
        borderRadius: 16,
        overflow: "hidden",
        width: 265,
        boxShadow: "0 4px 24px rgba(99,102,241,0.1), 0 1px 0 rgba(255,255,255,0.8) inset",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Category header */}
      <div style={{ padding: "12px 14px 8px", borderBottom: "1px solid rgba(99,102,241,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#4f46e5", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {card.category}
          </span>
          <span style={{ fontSize: 9.5, color: "#a0aec0", flexShrink: 0 }}>{card.timeAgo}</span>
        </div>
        <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{card.location}</div>
      </div>

      {/* Winner */}
      <div
        style={{
          margin: "10px 12px 4px",
          background: "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(196,181,253,0.15) 100%)",
          border: "1px solid rgba(99,102,241,0.18)",
          borderRadius: 10,
          padding: "8px 10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", background: "#4f46e5", borderRadius: 4, padding: "2px 5px", flexShrink: 0 }}>
            #1
          </span>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#1e1b4b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {card.winner.name}
          </span>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#4f46e5", flexShrink: 0 }}>
            {card.winner.score}%
          </span>
        </div>
        <div style={{ height: 3, background: "rgba(99,102,241,0.15)", borderRadius: 2, marginTop: 8 }}>
          <div style={{ height: "100%", width: `${card.winner.score}%`, background: "linear-gradient(90deg,#4f46e5,#7c3aed)", borderRadius: 2 }} />
        </div>
      </div>

      {/* Challengers */}
      <div style={{ padding: "6px 14px 10px", flex: 1 }}>
        {card.challengers.map((c, i) => (
          <div
            key={c.name}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 0",
              borderBottom: i < card.challengers.length - 1 ? "1px solid rgba(99,102,241,0.06)" : "none",
            }}
          >
            <span style={{ fontSize: 9, fontWeight: 600, color: "#d1d5db", width: 16, flexShrink: 0 }}>#{i + 2}</span>
            <span style={{ flex: 1, fontSize: 12, color: "#4b5563", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {c.name}
            </span>
            <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, flexShrink: 0 }}>{c.score}%</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ padding: "0 12px 12px" }}>
        <div
          style={{
            textAlign: "center", fontSize: 12, fontWeight: 600,
            color: "#4f46e5",
            background: "rgba(255,255,255,0.6)", border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: 8, padding: "7px 0", cursor: "pointer",
          }}
        >
          View full analysis →
        </div>
      </div>
    </div>
  );
}

export function LpMatchB() {
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
      <div style={{ position: "absolute", top: "-8vh", left: "-5vw", width: "38vw", height: "38vw", background: "#fbcfe8", borderRadius: "50%", filter: "blur(90px)", opacity: 0.35, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "5vh", right: "-8vw", width: "44vw", height: "44vw", background: "#c4b5fd", borderRadius: "50%", filter: "blur(110px)", opacity: 0.32, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "5vh", left: "18vw", width: "38vw", height: "38vw", background: "#a7f3d0", borderRadius: "50%", filter: "blur(90px)", opacity: 0.28, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#4f46e5", background: "rgba(255,255,255,0.7)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 99, padding: "5px 12px", backdropFilter: "blur(8px)" }}>
            44 audits completed
          </span>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>Variant B — aurora glass · frosted white</span>
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {CARDS.map((c) => <Card key={c.category} card={c} />)}
        </div>
      </div>
    </div>
  );
}

const DOMAIN = "4181a65d-20bf-45c4-820f-773df3ae98f9-00-pvyw1f1maghm.riker.replit.dev";

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

function PodiumCardSingle({ card }: { card: CardData }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e8e4f3",
        borderRadius: "14px",
        overflow: "hidden",
        width: "280px",
        boxShadow: "0 2px 12px rgba(79,70,229,0.07)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Category header */}
      <div
        style={{
          padding: "12px 16px 10px",
          borderBottom: "1px solid #f0ecfa",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#4f46e5",
              lineHeight: 1.3,
            }}
          >
            {card.category}
          </span>
          <span style={{ fontSize: "11px", color: "#a0a0b0", whiteSpace: "nowrap", flexShrink: 0 }}>
            {card.timeAgo}
          </span>
        </div>
        <div style={{ fontSize: "11px", color: "#8b8b9a", marginTop: "2px" }}>{card.location}</div>
      </div>

      {/* Winner hero zone */}
      <div
        style={{
          background: "linear-gradient(135deg, #eef0fd 0%, #f3f0ff 100%)",
          padding: "16px 16px 14px",
          borderBottom: "1px solid #e8e4f3",
        }}
      >
        <div style={{ fontSize: "10px", fontWeight: 700, color: "#6366f1", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
          #1 · Leading brand
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "17px", fontWeight: 700, color: "#1e1b4b", letterSpacing: "-0.3px" }}>
            {card.winner.name}
          </span>
          <span
            style={{
              fontSize: "16px",
              fontWeight: 800,
              color: "#4f46e5",
              background: "#fff",
              border: "2px solid #c7d2fe",
              borderRadius: "10px",
              padding: "2px 10px",
              letterSpacing: "-0.5px",
            }}
          >
            {card.winner.score}%
          </span>
        </div>
        {/* Mini bar for winner */}
        <div style={{ height: 4, background: "#c7d2fe", borderRadius: 2, marginTop: 10 }}>
          <div
            style={{
              height: "100%",
              width: `${card.winner.score}%`,
              background: "linear-gradient(90deg, #4f46e5, #7c3aed)",
              borderRadius: 2,
            }}
          />
        </div>
      </div>

      {/* Challengers */}
      <div style={{ padding: "12px 16px 4px", flex: 1 }}>
        {card.challengers.map((c, i) => (
          <div
            key={c.name}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "7px 0",
              borderBottom: i < card.challengers.length - 1 ? "1px solid #f4f2fb" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "#9ca3af",
                  width: "18px",
                }}
              >
                #{i + 2}
              </span>
              <span style={{ fontSize: "13px", color: "#374151", fontWeight: 500 }}>
                {c.name.length > 22 ? c.name.slice(0, 21) + "…" : c.name}
              </span>
            </div>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#6b7280",
                background: "#f3f4f6",
                borderRadius: "6px",
                padding: "1px 7px",
              }}
            >
              {c.score}%
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ padding: "10px 16px 14px" }}>
        <a
          style={{
            display: "block",
            textAlign: "center",
            fontSize: "13px",
            fontWeight: 600,
            color: "#4f46e5",
            background: "#f0f0ff",
            border: "1px solid #c7d2fe",
            borderRadius: "8px",
            padding: "8px 0",
            textDecoration: "none",
          }}
        >
          View full analysis →
        </a>
      </div>
    </div>
  );
}

export function PodiumCard() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f7fb",
        padding: "32px 28px",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: "12px", fontWeight: 600, color: "#4f46e5", background: "#eef0fd", borderRadius: 6, padding: "4px 10px" }}>
          44 audits completed
        </span>
        <span style={{ fontSize: "12px", color: "#9ca3af" }}>Podium variant — winner hero zone</span>
      </div>
      <div style={{ display: "flex", gap: "18px", flexWrap: "wrap" }}>
        {CARDS.map((card) => (
          <PodiumCardSingle key={card.category} card={card} />
        ))}
      </div>
    </div>
  );
}

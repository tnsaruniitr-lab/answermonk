type CardData = {
  category: string;
  location: string;
  timeAgo: string;
  insight: string;
  brands: { name: string; score: number; isWinner?: boolean }[];
};

const CARDS: CardData[] = [
  {
    category: "At-home blood tests",
    location: "Dubai",
    timeAgo: "1d ago",
    insight: "Fragmented — 6 brands within 20 pts",
    brands: [
      { name: "Vesta Care", score: 50, isWinner: true },
      { name: "Royal Clinic", score: 50 },
      { name: "The Good Doctor", score: 44 },
      { name: "Call Doctor", score: 38 },
    ],
  },
  {
    category: "Weight loss programs",
    location: "Dubai",
    timeAgo: "1d ago",
    insight: "Dubai London Hospital leads by 12 pts",
    brands: [
      { name: "Dubai London Hospital", score: 56, isWinner: true },
      { name: "DNA Health & Wellness", score: 44 },
      { name: "Endocare Clinic", score: 38 },
      { name: "Kcal", score: 31 },
    ],
  },
  {
    category: "Home nursing care",
    location: "Berlin",
    timeAgo: "1d ago",
    insight: "Three-way tie at top — no clear leader",
    brands: [
      { name: "Pflegehilfe für Senioren", score: 38, isWinner: true },
      { name: "Home Instead", score: 38 },
      { name: "aroCare ambulante", score: 38 },
      { name: "Unique Care", score: 31 },
    ],
  },
];

function Bar({ score, max, isWinner }: { score: number; max: number; isWinner?: boolean }) {
  const pct = Math.round((score / max) * 100);
  return (
    <div style={{ flex: 1, height: 6, background: "#f0ecfa", borderRadius: 3, overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: isWinner
            ? "linear-gradient(90deg, #4f46e5, #7c3aed)"
            : "#cbd5e1",
          borderRadius: 3,
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );
}

function ScorecardSingle({ card }: { card: CardData }) {
  const maxScore = Math.max(...card.brands.map((b) => b.score));

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e8e4f3",
        borderRadius: "14px",
        overflow: "hidden",
        width: "290px",
        boxShadow: "0 2px 12px rgba(79,70,229,0.07)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{ padding: "14px 16px 10px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e1b4b", lineHeight: 1.3 }}>
              {card.category}
            </div>
            <div style={{ fontSize: "11px", color: "#8b8b9a", marginTop: "2px" }}>{card.location}</div>
          </div>
          <span style={{ fontSize: "11px", color: "#a0a0b0", whiteSpace: "nowrap", flexShrink: 0, marginTop: 2 }}>
            {card.timeAgo}
          </span>
        </div>
        {/* Insight chip */}
        <div
          style={{
            marginTop: 10,
            display: "inline-block",
            fontSize: "11px",
            color: "#5b5bd6",
            background: "#eef0fd",
            borderRadius: "6px",
            padding: "3px 8px",
            fontWeight: 500,
          }}
        >
          ⚡ {card.insight}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#f0ecfa", margin: "0 16px" }} />

      {/* Competitive bars */}
      <div style={{ padding: "12px 16px", flex: 1 }}>
        {card.brands.map((brand, i) => (
          <div
            key={brand.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: i < card.brands.length - 1 ? 9 : 0,
            }}
          >
            <span
              style={{
                fontSize: "12px",
                color: brand.isWinner ? "#4f46e5" : "#6b7280",
                fontWeight: brand.isWinner ? 700 : 500,
                width: "130px",
                flexShrink: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {brand.name}
            </span>
            <Bar score={brand.score} max={maxScore} isWinner={brand.isWinner} />
            <span
              style={{
                fontSize: "11px",
                fontWeight: brand.isWinner ? 700 : 500,
                color: brand.isWinner ? "#4f46e5" : "#9ca3af",
                width: "34px",
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              {brand.score}%
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ padding: "10px 16px 14px" }}>
        <a
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            fontSize: "13px",
            fontWeight: 600,
            color: "#4f46e5",
            background: "#f0f0ff",
            border: "1px solid #c7d2fe",
            borderRadius: "8px",
            padding: "8px 0",
            textDecoration: "none",
            cursor: "pointer",
          }}
        >
          View full analysis →
        </a>
      </div>
    </div>
  );
}

export function ScorecardCard() {
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
        <span style={{ fontSize: "12px", color: "#9ca3af" }}>Scorecard variant — bar chart + insight line</span>
      </div>
      <div style={{ display: "flex", gap: "18px", flexWrap: "wrap" }}>
        {CARDS.map((card) => (
          <ScorecardSingle key={card.category} card={card} />
        ))}
      </div>
    </div>
  );
}

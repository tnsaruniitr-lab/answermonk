// AnswerMonk brand wordmark — "Answer M[bot-body]nk"
// The "o" in Monk is a clean bot-body icon (rounded rect, antenna dot, side arms)

function BotO({ size = 24 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      style={{ display: "inline-block", verticalAlign: "middle", position: "relative", top: -1 }}
    >
      <defs>
        <linearGradient id="bot-bg" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      {/* Antenna dot */}
      <circle cx="16" cy="3" r="2.2" fill="#818cf8" />
      {/* Side arms */}
      <rect x="1" y="14" width="4" height="7" rx="2" fill="#818cf8" />
      <rect x="27" y="14" width="4" height="7" rx="2" fill="#818cf8" />
      {/* Bot body — rounded rect */}
      <rect x="6" y="7" width="20" height="22" rx="7" fill="url(#bot-bg)" />
    </svg>
  );
}

export function MonkWordmark({
  size = "md",
}: {
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const config = {
    sm: { fontSize: 14, iconSize: 14 },
    md: { fontSize: 20, iconSize: 20 },
    lg: { fontSize: 26, iconSize: 26 },
    xl: { fontSize: 38, iconSize: 38 },
  }[size];

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      fontWeight: 900,
      letterSpacing: "-0.04em",
      lineHeight: 1,
      fontSize: config.fontSize,
      userSelect: "none",
    }}>
      <span style={{ color: "#1e1b4b" }}>Answer</span>
      <span style={{ color: "#6366f1" }}>M</span>
      <BotO size={config.iconSize} />
      <span style={{ color: "#6366f1" }}>nk</span>
    </span>
  );
}

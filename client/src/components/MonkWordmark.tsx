// AnswerMonk brand wordmark — "Answer M[monk-face]nk"
// The "o" in Monk is a clean monk head icon; "M" matches "onk" in indigo

function MonkFaceO({ size = 24 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      style={{ display: "inline-block", verticalAlign: "middle", position: "relative", top: -1 }}
    >
      <defs>
        <linearGradient id="mfo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      {/* Face circle */}
      <circle cx="16" cy="17" r="13" fill="url(#mfo-bg)" />
      {/* Ushnisha / topknot */}
      <ellipse cx="16" cy="5.5" rx="7" ry="4.5" fill="#4f46e5" />
      {/* Elongated earlobes */}
      <ellipse cx="3" cy="18" rx="1.8" ry="3" fill="#4f46e5" stroke="#a5b4fc" strokeWidth="0.6" />
      <ellipse cx="29" cy="18" rx="1.8" ry="3" fill="#4f46e5" stroke="#a5b4fc" strokeWidth="0.6" />
      {/* Closed eyes — peaceful downward arcs */}
      <path d="M8 16 Q11 12 14 16" stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M18 16 Q21 12 24 16" stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      {/* Serene smile */}
      <path d="M10 22 Q16 26 22 22" stroke="white" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.9" />
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
      <MonkFaceO size={config.iconSize} />
      <span style={{ color: "#6366f1" }}>nk</span>
    </span>
  );
}

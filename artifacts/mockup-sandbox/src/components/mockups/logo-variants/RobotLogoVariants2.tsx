// Batch 2 — Monochrome robot "o" variants, indigo palette only

function BotE({ size = 32 }: { size?: number }) {
  // E — Minimal square eyes, no extras. Most icon-like.
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none"
      style={{ display: "inline-block", verticalAlign: "middle", position: "relative", top: -1 }}>
      <defs>
        <linearGradient id="bg-e" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4338ca" />
          <stop offset="100%" stopColor="#3730a3" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill="url(#bg-e)" />
      {/* Left eye — inset square */}
      <rect x="7.5" y="12" width="6" height="6" rx="1.5" fill="#3730a3" />
      <rect x="8.5" y="13" width="4" height="4" rx="1" fill="#818cf8" />
      {/* Right eye */}
      <rect x="18.5" y="12" width="6" height="6" rx="1.5" fill="#3730a3" />
      <rect x="19.5" y="13" width="4" height="4" rx="1" fill="#818cf8" />
      {/* Thin mouth line */}
      <rect x="10" y="22" width="12" height="1.5" rx="0.75" fill="#6366f1" />
    </svg>
  );
}

function BotF({ size = 32 }: { size?: number }) {
  // F — Cylon visor, single slit eye spanning full face
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none"
      style={{ display: "inline-block", verticalAlign: "middle", position: "relative", top: -1 }}>
      <defs>
        <linearGradient id="bg-f" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4338ca" />
          <stop offset="100%" stopColor="#3730a3" />
        </linearGradient>
        <linearGradient id="visor-f" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3730a3" />
          <stop offset="30%" stopColor="#818cf8" />
          <stop offset="70%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#3730a3" />
        </linearGradient>
      </defs>
      {/* Notch antenna */}
      <rect x="14.5" y="1" width="3" height="4" rx="1" fill="#4338ca" />
      <circle cx="16" cy="1.5" r="1.2" fill="#6366f1" />
      {/* Face */}
      <circle cx="16" cy="17" r="13" fill="url(#bg-f)" />
      {/* Visor slit */}
      <rect x="5.5" y="14" width="21" height="5" rx="2.5" fill="#2e1065" />
      <rect x="5.5" y="14.75" width="21" height="3.5" rx="1.75" fill="url(#visor-f)" opacity="0.85" />
      {/* Bottom chin detail */}
      <rect x="11" y="25" width="10" height="1.5" rx="0.75" fill="#4f46e5" opacity="0.6" />
    </svg>
  );
}

function BotG({ size = 32 }: { size?: number }) {
  // G — Circuit etching. Hexagonal dot eyes, trace lines.
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none"
      style={{ display: "inline-block", verticalAlign: "middle", position: "relative", top: -1 }}>
      <defs>
        <linearGradient id="bg-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4338ca" />
          <stop offset="100%" stopColor="#3730a3" />
        </linearGradient>
      </defs>
      {/* Antenna line */}
      <line x1="16" y1="2" x2="16" y2="6" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="1.5" r="1.2" fill="#6366f1" />
      {/* Face */}
      <circle cx="16" cy="17" r="13" fill="url(#bg-g)" />
      {/* Circuit traces — subtle */}
      <path d="M6 17 L9 17 L9 13 L12 13" stroke="#4f46e5" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      <path d="M26 17 L23 17 L23 13 L20 13" stroke="#4f46e5" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      <path d="M10 24 L12 24 L12 26" stroke="#4f46e5" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      <path d="M22 24 L20 24 L20 26" stroke="#4f46e5" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      {/* Eyes — hex dot style */}
      <circle cx="11.5" cy="16.5" r="3.5" fill="#2e1065" />
      <circle cx="11.5" cy="16.5" r="2.2" fill="#6366f1" />
      <circle cx="11.5" cy="16.5" r="1" fill="#a5b4fc" />
      <circle cx="20.5" cy="16.5" r="3.5" fill="#2e1065" />
      <circle cx="20.5" cy="16.5" r="2.2" fill="#6366f1" />
      <circle cx="20.5" cy="16.5" r="1" fill="#a5b4fc" />
      {/* Chin grid */}
      <circle cx="13" cy="23.5" r="0.8" fill="#4f46e5" />
      <circle cx="16" cy="23.5" r="0.8" fill="#4f46e5" />
      <circle cx="19" cy="23.5" r="0.8" fill="#4f46e5" />
    </svg>
  );
}

function BotH({ size = 32 }: { size?: number }) {
  // H — Hard-cornered square helmet. Most "machine" feeling.
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none"
      style={{ display: "inline-block", verticalAlign: "middle", position: "relative", top: -1 }}>
      <defs>
        <linearGradient id="bg-h" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4338ca" />
          <stop offset="100%" stopColor="#3730a3" />
        </linearGradient>
      </defs>
      {/* Antenna */}
      <rect x="15" y="1" width="2" height="5" rx="1" fill="#6366f1" />
      {/* Square helmet */}
      <rect x="4" y="7" width="24" height="22" rx="4" fill="url(#bg-h)" />
      {/* Forehead ridge */}
      <rect x="4" y="7" width="24" height="4" rx="4" fill="#3730a3" />
      <rect x="4" y="9" width="24" height="2" fill="#3730a3" />
      {/* Eye panels — rectangular insets */}
      <rect x="7" y="14" width="7" height="5" rx="1.5" fill="#2e1065" />
      <rect x="8" y="15" width="5" height="3" rx="1" fill="#818cf8" opacity="0.9" />
      <rect x="18" y="14" width="7" height="5" rx="1.5" fill="#2e1065" />
      <rect x="19" y="15" width="5" height="3" rx="1" fill="#818cf8" opacity="0.9" />
      {/* Grill mouth */}
      <rect x="9" y="23.5" width="3.5" height="2" rx="1" fill="#4f46e5" />
      <rect x="14.5" y="23.5" width="3" height="2" rx="1" fill="#4f46e5" />
      <rect x="19.5" y="23.5" width="3.5" height="2" rx="1" fill="#4f46e5" />
    </svg>
  );
}

function BotI({ size = 32 }: { size?: number }) {
  // I — Ultra minimal. Just the circle + two lines (eye slits). Pure abstraction.
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none"
      style={{ display: "inline-block", verticalAlign: "middle", position: "relative", top: -1 }}>
      <defs>
        <linearGradient id="bg-i" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4338ca" />
          <stop offset="100%" stopColor="#3730a3" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill="url(#bg-i)" />
      {/* Eye slits — just two thin horizontal lines */}
      <rect x="8" y="13.5" width="5.5" height="2" rx="1" fill="#a5b4fc" />
      <rect x="18.5" y="13.5" width="5.5" height="2" rx="1" fill="#a5b4fc" />
      {/* Single chin mark */}
      <rect x="13" y="21" width="6" height="1.5" rx="0.75" fill="#6366f1" />
    </svg>
  );
}

function Wordmark({ label, Bot }: { label: string; Bot: React.ComponentType<{ size?: number }> }) {
  const fs = 28;
  const iconSize = 28;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div style={{
        display: "inline-flex", alignItems: "center",
        fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1,
        fontSize: fs, userSelect: "none",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        <span style={{ color: "#1e1b4b" }}>Answer</span>
        <span style={{ color: "#6366f1" }}>M</span>
        <Bot size={iconSize} />
        <span style={{ color: "#6366f1" }}>nk</span>
      </div>
      <div style={{
        fontSize: 11, fontWeight: 600, color: "#4f46e5",
        background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.18)",
        borderRadius: 6, padding: "3px 10px", letterSpacing: "0.05em",
      }}>
        {label}
      </div>
    </div>
  );
}

export function RobotLogoVariants2() {
  return (
    <div style={{
      background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 60%, #ecfdf5 100%)",
      padding: "32px 36px",
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 48, flexWrap: "wrap",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      minHeight: 180,
    }}>
      <Wordmark label="E — Square Eyes" Bot={BotE} />
      <Wordmark label="F — Cylon Visor" Bot={BotF} />
      <Wordmark label="G — Circuit Dots" Bot={BotG} />
      <Wordmark label="H — Helm Square" Bot={BotH} />
      <Wordmark label="I — Ultra Minimal" Bot={BotI} />
    </div>
  );
}

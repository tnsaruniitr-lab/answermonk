// Four robot-face "o" replacements for the AnswerMonk wordmark
// Each keeps the same indigo gradient circle but looks mechanical, not cute

function BotA({ size = 32 }: { size?: number }) {
  // Variant A — LED Strip Eyes + Antenna
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none"
      style={{ display: "inline-block", verticalAlign: "middle", position: "relative", top: -1 }}>
      <defs>
        <linearGradient id="bg-a" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <filter id="glow-a">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Antenna */}
      <line x1="16" y1="4" x2="16" y2="9" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="3.5" r="1.8" fill="#a5b4fc" />
      {/* Face */}
      <circle cx="16" cy="18" r="12" fill="url(#bg-a)" />
      {/* LED strip eyes — rectangular, glowing */}
      <rect x="7.5" y="14" width="6" height="2.5" rx="1.2" fill="white" filter="url(#glow-a)" opacity="0.95" />
      <rect x="18.5" y="14" width="6" height="2.5" rx="1.2" fill="white" filter="url(#glow-a)" opacity="0.95" />
      {/* Flat mouth line */}
      <line x1="11" y1="22" x2="21" y2="22" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
      {/* Side sensors */}
      <rect x="3.5" y="17" width="1.5" height="3" rx="0.75" fill="#818cf8" />
      <rect x="27" y="17" width="1.5" height="3" rx="0.75" fill="#818cf8" />
    </svg>
  );
}

function BotB({ size = 32 }: { size?: number }) {
  // Variant B — Visor Scanner (single wide eye strip)
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none"
      style={{ display: "inline-block", verticalAlign: "middle", position: "relative", top: -1 }}>
      <defs>
        <linearGradient id="bg-b" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="visor" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="20%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="50%" stopColor="rgba(165,212,255,1)" />
          <stop offset="80%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      {/* Antenna */}
      <line x1="16" y1="4" x2="16" y2="8" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="13" y="2.5" width="6" height="2" rx="1" fill="#818cf8" />
      {/* Face */}
      <circle cx="16" cy="18" r="12" fill="url(#bg-b)" />
      {/* Wide visor strip */}
      <rect x="6.5" y="13.5" width="19" height="5" rx="2.5" fill="rgba(0,0,0,0.3)" />
      <rect x="6.5" y="13.5" width="19" height="5" rx="2.5" fill="url(#visor)" opacity="0.85" />
      {/* Scanning line inside visor */}
      <line x1="9" y1="16" x2="23" y2="16" stroke="rgba(147,197,253,0.6)" strokeWidth="0.8" />
      {/* Chin detail */}
      <rect x="12" y="23" width="8" height="1.5" rx="0.75" fill="rgba(255,255,255,0.3)" />
    </svg>
  );
}

function BotC({ size = 32 }: { size?: number }) {
  // Variant C — Glowing Dot Eyes, clean minimal robot
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none"
      style={{ display: "inline-block", verticalAlign: "middle", position: "relative", top: -1 }}>
      <defs>
        <linearGradient id="bg-c" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <radialGradient id="eye-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#bfdbfe" />
          <stop offset="60%" stopColor="#93c5fd" />
          <stop offset="100%" stopColor="rgba(147,197,253,0)" />
        </radialGradient>
        <filter id="glow-c">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Flat-top antenna pair */}
      <line x1="12" y1="5.5" x2="12" y2="9" stroke="#818cf8" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="12" cy="4.5" r="1.5" fill="#a5b4fc" />
      <line x1="20" y1="5.5" x2="20" y2="9" stroke="#818cf8" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="20" cy="4.5" r="1.5" fill="#a5b4fc" />
      {/* Face */}
      <circle cx="16" cy="18" r="12" fill="url(#bg-c)" />
      {/* Glowing dot eyes */}
      <circle cx="11.5" cy="16.5" r="3.5" fill="url(#eye-glow)" opacity="0.4" />
      <circle cx="20.5" cy="16.5" r="3.5" fill="url(#eye-glow)" opacity="0.4" />
      <circle cx="11.5" cy="16.5" r="2" fill="white" filter="url(#glow-c)" />
      <circle cx="20.5" cy="16.5" r="2" fill="white" filter="url(#glow-c)" />
      <circle cx="11.5" cy="16.5" r="0.9" fill="#bfdbfe" />
      <circle cx="20.5" cy="16.5" r="0.9" fill="#bfdbfe" />
      {/* Grid mouth — 3 dots */}
      <circle cx="12.5" cy="22.5" r="0.9" fill="rgba(255,255,255,0.4)" />
      <circle cx="16" cy="22.5" r="0.9" fill="rgba(255,255,255,0.4)" />
      <circle cx="19.5" cy="22.5" r="0.9" fill="rgba(255,255,255,0.4)" />
    </svg>
  );
}

function BotD({ size = 32 }: { size?: number }) {
  // Variant D — Square helmet, hard angles, most robotic
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none"
      style={{ display: "inline-block", verticalAlign: "middle", position: "relative", top: -1 }}>
      <defs>
        <linearGradient id="bg-d" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <filter id="glow-d">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Antenna */}
      <line x1="16" y1="3" x2="16" y2="8" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="14" y="2" width="4" height="2.5" rx="1" fill="#a5b4fc" />
      {/* Rounded square helmet face */}
      <rect x="5" y="9" width="22" height="20" rx="5" fill="url(#bg-d)" />
      {/* Eye slots — rectangular LEDs */}
      <rect x="8" y="14.5" width="6.5" height="3.5" rx="1.5" fill="rgba(0,0,0,0.3)" />
      <rect x="8.5" y="15" width="5.5" height="2.5" rx="1" fill="white" filter="url(#glow-d)" opacity="0.9" />
      <rect x="17.5" y="14.5" width="6.5" height="3.5" rx="1.5" fill="rgba(0,0,0,0.3)" />
      <rect x="18" y="15" width="5.5" height="2.5" rx="1" fill="white" filter="url(#glow-d)" opacity="0.9" />
      {/* Speaker grill mouth */}
      <rect x="10" y="22" width="2.5" height="1.5" rx="0.75" fill="rgba(255,255,255,0.35)" />
      <rect x="14" y="22" width="2.5" height="1.5" rx="0.75" fill="rgba(255,255,255,0.35)" />
      <rect x="18" y="22" width="2.5" height="1.5" rx="0.75" fill="rgba(255,255,255,0.35)" />
      {/* Cheek bolts */}
      <circle cx="6.5" cy="19" r="1" fill="#4f46e5" stroke="#818cf8" strokeWidth="0.5" />
      <circle cx="25.5" cy="19" r="1" fill="#4f46e5" stroke="#818cf8" strokeWidth="0.5" />
    </svg>
  );
}

function Wordmark({ label, Bot }: { label: string; Bot: React.ComponentType<{ size?: number }> }) {
  const fs = 28;
  const iconSize = 28;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
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
        fontSize: 11, fontWeight: 600, color: "#7c3aed",
        background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)",
        borderRadius: 6, padding: "3px 10px", letterSpacing: "0.05em",
      }}>
        {label}
      </div>
    </div>
  );
}

export function RobotLogoVariants() {
  return (
    <div style={{
      background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 60%, #ecfdf5 100%)",
      padding: "32px 40px",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 56,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      minHeight: 180,
    }}>
      <Wordmark label="A — LED Strip" Bot={BotA} />
      <Wordmark label="B — Visor Scanner" Bot={BotB} />
      <Wordmark label="C — Glow Dots" Bot={BotC} />
      <Wordmark label="D — Helm Bot" Bot={BotD} />
    </div>
  );
}

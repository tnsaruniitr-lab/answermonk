// Batch 3 — Inspired by bot-body icon: rounded rect, gradient, antenna dot, side arms

function BotJ({ size = 32 }: { size?: number }) {
  // J — Pure bot body. Rounded rect + dot antenna + side arms. No face.
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none"
      style={{ display: "inline-block", verticalAlign: "middle", position: "relative", top: -1 }}>
      <defs>
        <linearGradient id="bg-j" x1="20%" y1="0%" x2="80%" y2="100%">
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
      <rect x="6" y="7" width="20" height="22" rx="7" fill="url(#bg-j)" />
    </svg>
  );
}

function BotK({ size = 32 }: { size?: number }) {
  // K — Bot body + two dot eyes
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none"
      style={{ display: "inline-block", verticalAlign: "middle", position: "relative", top: -1 }}>
      <defs>
        <linearGradient id="bg-k" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      {/* Antenna dot */}
      <circle cx="16" cy="3" r="2.2" fill="#818cf8" />
      {/* Side arms */}
      <rect x="1" y="14" width="4" height="7" rx="2" fill="#818cf8" />
      <rect x="27" y="14" width="4" height="7" rx="2" fill="#818cf8" />
      {/* Bot body */}
      <rect x="6" y="7" width="20" height="22" rx="7" fill="url(#bg-k)" />
      {/* Eyes */}
      <circle cx="12" cy="16" r="2.5" fill="rgba(255,255,255,0.25)" />
      <circle cx="12" cy="16" r="1.4" fill="white" opacity="0.9" />
      <circle cx="20" cy="16" r="2.5" fill="rgba(255,255,255,0.25)" />
      <circle cx="20" cy="16" r="1.4" fill="white" opacity="0.9" />
      {/* Mouth */}
      <rect x="11" y="22" width="10" height="1.8" rx="0.9" fill="rgba(255,255,255,0.3)" />
    </svg>
  );
}

function BotL({ size = 32 }: { size?: number }) {
  // L — Bot body + visor strip eye
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none"
      style={{ display: "inline-block", verticalAlign: "middle", position: "relative", top: -1 }}>
      <defs>
        <linearGradient id="bg-l" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="visor-l" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
          <stop offset="40%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="60%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
        </linearGradient>
      </defs>
      {/* Antenna dot */}
      <circle cx="16" cy="3" r="2.2" fill="#818cf8" />
      {/* Side arms */}
      <rect x="1" y="14" width="4" height="7" rx="2" fill="#818cf8" />
      <rect x="27" y="14" width="4" height="7" rx="2" fill="#818cf8" />
      {/* Bot body */}
      <rect x="6" y="7" width="20" height="22" rx="7" fill="url(#bg-l)" />
      {/* Visor */}
      <rect x="9" y="14" width="14" height="5" rx="2.5" fill="rgba(0,0,0,0.2)" />
      <rect x="9" y="14.5" width="14" height="4" rx="2" fill="url(#visor-l)" opacity="0.85" />
    </svg>
  );
}

function BotM({ size = 32 }: { size?: number }) {
  // M — Bot body, LED square eyes, speaker grill, inspired but more detail
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none"
      style={{ display: "inline-block", verticalAlign: "middle", position: "relative", top: -1 }}>
      <defs>
        <linearGradient id="bg-m" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      {/* Antenna dot */}
      <circle cx="16" cy="3" r="2.2" fill="#a5b4fc" />
      {/* Side arms — slightly bigger */}
      <rect x="0.5" y="13" width="5" height="8" rx="2.5" fill="#a5b4fc" />
      <rect x="26.5" y="13" width="5" height="8" rx="2.5" fill="#a5b4fc" />
      {/* Bot body */}
      <rect x="6" y="7" width="20" height="22" rx="7" fill="url(#bg-m)" />
      {/* Square LED eyes */}
      <rect x="9.5" y="13.5" width="5" height="4" rx="1.5" fill="rgba(0,0,0,0.25)" />
      <rect x="10" y="14" width="4" height="3" rx="1" fill="white" opacity="0.88" />
      <rect x="17.5" y="13.5" width="5" height="4" rx="1.5" fill="rgba(0,0,0,0.25)" />
      <rect x="18" y="14" width="4" height="3" rx="1" fill="white" opacity="0.88" />
      {/* Speaker grill */}
      <rect x="10" y="22.5" width="3" height="1.5" rx="0.75" fill="rgba(255,255,255,0.35)" />
      <rect x="14.5" y="22.5" width="3" height="1.5" rx="0.75" fill="rgba(255,255,255,0.35)" />
      <rect x="19" y="22.5" width="3" height="1.5" rx="0.75" fill="rgba(255,255,255,0.35)" />
    </svg>
  );
}

function BotN({ size = 32 }: { size?: number }) {
  // N — Cleaner, bigger antenna, no mouth, very app-icon feel
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none"
      style={{ display: "inline-block", verticalAlign: "middle", position: "relative", top: -1 }}>
      <defs>
        <linearGradient id="bg-n" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <radialGradient id="eye-n" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="white" stopOpacity="0.95" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.5)" />
        </radialGradient>
      </defs>
      {/* Antenna stem + ball */}
      <line x1="16" y1="5" x2="16" y2="8" stroke="#a5b4fc" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="3.5" r="2.5" fill="#a5b4fc" />
      {/* Side arms */}
      <rect x="1" y="15" width="4.5" height="6" rx="2.25" fill="#a5b4fc" />
      <rect x="26.5" y="15" width="4.5" height="6" rx="2.25" fill="#a5b4fc" />
      {/* Body */}
      <rect x="6" y="8" width="20" height="21" rx="7" fill="url(#bg-n)" />
      {/* Eyes */}
      <circle cx="12" cy="16.5" r="3" fill="rgba(0,0,0,0.18)" />
      <circle cx="12" cy="16.5" r="2" fill="url(#eye-n)" />
      <circle cx="20" cy="16.5" r="3" fill="rgba(0,0,0,0.18)" />
      <circle cx="20" cy="16.5" r="2" fill="url(#eye-n)" />
    </svg>
  );
}

function Wordmark({ label, Bot }: { label: string; Bot: React.ComponentType<{ size?: number }> }) {
  const fs = 28;
  const iconSize = 30;
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

export function RobotLogoVariants3() {
  return (
    <div style={{
      background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 60%, #ecfdf5 100%)",
      padding: "32px 36px",
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 52, flexWrap: "wrap",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      minHeight: 180,
    }}>
      <Wordmark label="J — Bot Body" Bot={BotJ} />
      <Wordmark label="K — Body + Dots" Bot={BotK} />
      <Wordmark label="L — Body + Visor" Bot={BotL} />
      <Wordmark label="M — LED Eyes" Bot={BotM} />
      <Wordmark label="N — Round Eyes" Bot={BotN} />
    </div>
  );
}

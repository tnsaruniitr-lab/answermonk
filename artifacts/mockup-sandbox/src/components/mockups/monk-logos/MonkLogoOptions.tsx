// Monk Logo Options — 4 style directions

// ─── Style A: Kawaii Round ───────────────────────────────────────────────────
function KawaiiAuditmonk() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" fill="none">
      <circle cx="40" cy="42" r="30" fill="#fde68a" />
      <ellipse cx="40" cy="18" rx="20" ry="12" fill="#78350f" />
      <ellipse cx="40" cy="20" rx="16" ry="8" fill="#92400e" />
      <ellipse cx="16" cy="43" rx="5" ry="7" fill="#fcd34d" />
      <ellipse cx="64" cy="43" rx="5" ry="7" fill="#fcd34d" />
      {/* Closed eyes — big cute curved arcs with lashes */}
      <path d="M25 39 Q32 31 39 39" stroke="#78350f" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M41 39 Q48 31 55 39" stroke="#78350f" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Lash dots */}
      <circle cx="27" cy="37" r="1.2" fill="#78350f" />
      <circle cx="32" cy="34" r="1.2" fill="#78350f" />
      <circle cx="37" cy="37" r="1.2" fill="#78350f" />
      <circle cx="43" cy="37" r="1.2" fill="#78350f" />
      <circle cx="48" cy="34" r="1.2" fill="#78350f" />
      <circle cx="53" cy="37" r="1.2" fill="#78350f" />
      {/* Blush */}
      <ellipse cx="26" cy="48" rx="6" ry="3.5" fill="#fca5a5" opacity="0.5" />
      <ellipse cx="54" cy="48" rx="6" ry="3.5" fill="#fca5a5" opacity="0.5" />
      {/* Smile */}
      <path d="M32 53 Q40 60 48 53" stroke="#92400e" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="40" cy="48" r="2.5" fill="#d97706" opacity="0.4" />
    </svg>
  );
}

function KawaiiListenmonk() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" fill="none">
      <circle cx="40" cy="42" r="30" fill="#fde68a" />
      <ellipse cx="40" cy="18" rx="20" ry="12" fill="#78350f" />
      <ellipse cx="40" cy="20" rx="16" ry="8" fill="#92400e" />
      {/* Big round hands covering ears */}
      <ellipse cx="12" cy="43" rx="10" ry="12" fill="#fde68a" stroke="#f59e0b" strokeWidth="1.5" />
      <path d="M8 37 Q12 34 16 37" stroke="#d97706" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
      <path d="M8 41 Q12 38 16 41" stroke="#d97706" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <ellipse cx="68" cy="43" rx="10" ry="12" fill="#fde68a" stroke="#f59e0b" strokeWidth="1.5" />
      <path d="M64 37 Q68 34 72 37" stroke="#d97706" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
      <path d="M64 41 Q68 38 72 41" stroke="#d97706" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      {/* Eyes — open, curious */}
      <ellipse cx="31" cy="39" rx="5" ry="5.5" fill="white" />
      <circle cx="31" cy="39" r="3.2" fill="#78350f" />
      <circle cx="32.4" cy="37.5" r="1" fill="white" />
      <ellipse cx="49" cy="39" rx="5" ry="5.5" fill="white" />
      <circle cx="49" cy="39" r="3.2" fill="#78350f" />
      <circle cx="50.4" cy="37.5" r="1" fill="white" />
      {/* Blush */}
      <ellipse cx="24" cy="47" rx="5" ry="3" fill="#fca5a5" opacity="0.5" />
      <ellipse cx="56" cy="47" rx="5" ry="3" fill="#fca5a5" opacity="0.5" />
      <path d="M32 53 Q40 60 48 53" stroke="#92400e" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="40" cy="48" r="2.5" fill="#0891b2" opacity="0.3" />
    </svg>
  );
}

function KawaiiFixmonk() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" fill="none">
      <circle cx="40" cy="42" r="30" fill="#fde68a" />
      <ellipse cx="40" cy="18" rx="20" ry="12" fill="#78350f" />
      <ellipse cx="40" cy="20" rx="16" ry="8" fill="#92400e" />
      <ellipse cx="16" cy="43" rx="5" ry="7" fill="#fcd34d" />
      <ellipse cx="64" cy="43" rx="5" ry="7" fill="#fcd34d" />
      {/* Eyes open */}
      <ellipse cx="31" cy="37" rx="5" ry="5.5" fill="white" />
      <circle cx="31" cy="37" r="3.2" fill="#78350f" />
      <circle cx="32.4" cy="35.5" r="1" fill="white" />
      <ellipse cx="49" cy="37" rx="5" ry="5.5" fill="white" />
      <circle cx="49" cy="37" r="3.2" fill="#78350f" />
      <circle cx="50.4" cy="35.5" r="1" fill="white" />
      {/* Blush */}
      <ellipse cx="24" cy="47" rx="5" ry="3" fill="#fca5a5" opacity="0.5" />
      <ellipse cx="56" cy="47" rx="5" ry="3" fill="#fca5a5" opacity="0.5" />
      {/* Stitched sealed mouth */}
      <path d="M28 53 Q40 49 52 53" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M28 53 Q40 57 52 53" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4" />
      {[31, 36, 40, 44, 49].map(x => (
        <line key={x} x1={x} y1="50.5" x2={x} y2="55.5" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" />
      ))}
      <circle cx="40" cy="48" r="2.5" fill="#7c3aed" opacity="0.25" />
    </svg>
  );
}

// ─── Style B: Modern Flat Icon ───────────────────────────────────────────────
function FlatAuditmonk({ accent = "#d97706" }: { accent?: string }) {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" fill="none">
      <rect width="80" height="80" rx="20" fill={`${accent}18`} />
      {/* Monk silhouette */}
      <ellipse cx="40" cy="48" rx="22" ry="22" fill={`${accent}22`} />
      <ellipse cx="40" cy="48" rx="16" ry="16" fill={accent} opacity="0.15" />
      {/* Head */}
      <circle cx="40" cy="36" r="18" fill="white" />
      <ellipse cx="40" cy="21" rx="13" ry="8" fill={accent} />
      {/* Closed eyes */}
      <path d="M28 36 Q33 30 38 36" stroke={accent} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M42 36 Q47 30 52 36" stroke={accent} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Simple mouth line */}
      <path d="M33 43 Q40 47 47 43" stroke={accent} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
    </svg>
  );
}

function FlatListenmonk({ accent = "#0891b2" }: { accent?: string }) {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" fill="none">
      <rect width="80" height="80" rx="20" fill={`${accent}18`} />
      <ellipse cx="40" cy="48" rx="22" ry="22" fill={`${accent}22`} />
      <circle cx="40" cy="36" r="18" fill="white" />
      <ellipse cx="40" cy="21" rx="13" ry="8" fill={accent} />
      {/* Eyes open */}
      <circle cx="33" cy="36" r="4" fill={accent} opacity="0.8" />
      <circle cx="47" cy="36" r="4" fill={accent} opacity="0.8" />
      <circle cx="34.2" cy="34.8" r="1.4" fill="white" />
      <circle cx="48.2" cy="34.8" r="1.4" fill="white" />
      {/* Hands blocking ears */}
      <rect x="15" y="31" width="10" height="14" rx="5" fill={accent} opacity="0.7" />
      <rect x="55" y="31" width="10" height="14" rx="5" fill={accent} opacity="0.7" />
      {/* Smile */}
      <path d="M33 43 Q40 47 47 43" stroke={accent} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
    </svg>
  );
}

function FlatFixmonk({ accent = "#7c3aed" }: { accent?: string }) {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" fill="none">
      <rect width="80" height="80" rx="20" fill={`${accent}18`} />
      <ellipse cx="40" cy="48" rx="22" ry="22" fill={`${accent}22`} />
      <circle cx="40" cy="36" r="18" fill="white" />
      <ellipse cx="40" cy="21" rx="13" ry="8" fill={accent} />
      {/* Eyes open */}
      <circle cx="33" cy="35" r="4" fill={accent} opacity="0.8" />
      <circle cx="47" cy="35" r="4" fill={accent} opacity="0.8" />
      <circle cx="34.2" cy="33.8" r="1.4" fill="white" />
      <circle cx="48.2" cy="33.8" r="1.4" fill="white" />
      {/* Zipper mouth */}
      <rect x="27" y="42" width="26" height="6" rx="3" fill={accent} opacity="0.15" stroke={accent} strokeWidth="1.5" />
      {[30, 35, 40, 45, 50].map(x => (
        <circle key={x} cx={x} cy="45" r="1.4" fill={accent} opacity="0.7" />
      ))}
    </svg>
  );
}

// ─── Style C: Zen Line Art ───────────────────────────────────────────────────
function ZenAuditmonk({ accent = "#d97706" }: { accent?: string }) {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" fill="none">
      <circle cx="40" cy="42" r="36" fill="none" stroke={`${accent}20`} strokeWidth="1" />
      {/* Head outline */}
      <circle cx="40" cy="40" r="24" fill="none" stroke={accent} strokeWidth="1.8" />
      {/* Hair cap */}
      <path d="M18 38 Q20 16 40 14 Q60 16 62 38" fill={`${accent}18`} stroke={accent} strokeWidth="1.8" />
      {/* Ears */}
      <path d="M16 40 Q13 44 16 48" stroke={accent} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M64 40 Q67 44 64 48" stroke={accent} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Closed eyes — single clean arcs */}
      <path d="M27 39 Q33 33 39 39" stroke={accent} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M41 39 Q47 33 53 39" stroke={accent} strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Gentle smile */}
      <path d="M32 50 Q40 55 48 50" stroke={accent} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Nose */}
      <path d="M38 44 Q40 47 42 44" stroke={accent} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  );
}

function ZenListenmonk({ accent = "#0891b2" }: { accent?: string }) {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" fill="none">
      <circle cx="40" cy="42" r="36" fill="none" stroke={`${accent}20`} strokeWidth="1" />
      <circle cx="40" cy="40" r="24" fill="none" stroke={accent} strokeWidth="1.8" />
      <path d="M18 38 Q20 16 40 14 Q60 16 62 38" fill={`${accent}18`} stroke={accent} strokeWidth="1.8" />
      {/* Hand/palm over left ear */}
      <ellipse cx="14" cy="42" rx="8" ry="10" fill="none" stroke={accent} strokeWidth="1.8" />
      <path d="M10 37 Q14 35 18 37" stroke={accent} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      <path d="M10 41 Q14 39 18 41" stroke={accent} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <path d="M10 45 Q14 43 18 45" stroke={accent} strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
      {/* Hand over right ear */}
      <ellipse cx="66" cy="42" rx="8" ry="10" fill="none" stroke={accent} strokeWidth="1.8" />
      <path d="M62 37 Q66 35 70 37" stroke={accent} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      <path d="M62 41 Q66 39 70 41" stroke={accent} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <path d="M62 45 Q66 43 70 45" stroke={accent} strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
      {/* Open eyes */}
      <circle cx="32" cy="39" r="4" fill="none" stroke={accent} strokeWidth="1.8" />
      <circle cx="32" cy="39" r="1.8" fill={accent} />
      <circle cx="48" cy="39" r="4" fill="none" stroke={accent} strokeWidth="1.8" />
      <circle cx="48" cy="39" r="1.8" fill={accent} />
      <path d="M32 50 Q40 55 48 50" stroke={accent} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M38 44 Q40 47 42 44" stroke={accent} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  );
}

function ZenFixmonk({ accent = "#7c3aed" }: { accent?: string }) {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" fill="none">
      <circle cx="40" cy="42" r="36" fill="none" stroke={`${accent}20`} strokeWidth="1" />
      <circle cx="40" cy="40" r="24" fill="none" stroke={accent} strokeWidth="1.8" />
      <path d="M18 38 Q20 16 40 14 Q60 16 62 38" fill={`${accent}18`} stroke={accent} strokeWidth="1.8" />
      <path d="M16 40 Q13 44 16 48" stroke={accent} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M64 40 Q67 44 64 48" stroke={accent} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Open eyes */}
      <circle cx="32" cy="38" r="4" fill="none" stroke={accent} strokeWidth="1.8" />
      <circle cx="32" cy="38" r="1.8" fill={accent} />
      <circle cx="48" cy="38" r="4" fill="none" stroke={accent} strokeWidth="1.8" />
      <circle cx="48" cy="38" r="1.8" fill={accent} />
      <path d="M38 43 Q40 46 42 43" stroke={accent} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.5" />
      {/* Sealed mouth — single strong line with cross marks */}
      <path d="M28 51 L52 51" stroke={accent} strokeWidth="2.2" strokeLinecap="round" />
      {[31, 36, 40, 44, 49].map(x => (
        <line key={x} x1={x} y1="49" x2={x} y2="53" stroke={accent} strokeWidth="1.4" strokeLinecap="round" />
      ))}
    </svg>
  );
}

// ─── Style D: Gradient Glow ──────────────────────────────────────────────────
function GlowAuditmonk() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" fill="none">
      <defs>
        <radialGradient id="ga-face" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
        <radialGradient id="ga-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
        <filter id="ga-shadow">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#d97706" floodOpacity="0.3" />
        </filter>
      </defs>
      <circle cx="40" cy="40" r="38" fill="url(#ga-glow)" />
      <circle cx="40" cy="42" r="28" fill="url(#ga-face)" filter="url(#ga-shadow)" />
      <ellipse cx="40" cy="19" rx="18" ry="10" fill="#78350f" opacity="0.9" />
      <ellipse cx="40" cy="21" rx="13" ry="7" fill="#92400e" />
      <ellipse cx="14" cy="43" rx="5" ry="7" fill="#fcd34d" />
      <ellipse cx="66" cy="43" rx="5" ry="7" fill="#fcd34d" />
      {/* Glowing closed eye arcs */}
      <path d="M26 39 Q33 32 40 39" stroke="#78350f" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M40 39 Q47 32 54 39" stroke="#78350f" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M26 39 Q33 32 40 39" stroke="#fbbf24" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />
      <path d="M40 39 Q47 32 54 39" stroke="#fbbf24" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />
      {/* Rosy cheeks */}
      <ellipse cx="26" cy="50" rx="7" ry="4" fill="#fca5a5" opacity="0.45" />
      <ellipse cx="54" cy="50" rx="7" ry="4" fill="#fca5a5" opacity="0.45" />
      <path d="M32 55 Q40 61 48 55" stroke="#92400e" strokeWidth="2" strokeLinecap="round" fill="none" />
      <ellipse cx="40" cy="47" rx="2" ry="2.5" fill="#d97706" opacity="0.35" />
    </svg>
  );
}

function GlowListenmonk() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" fill="none">
      <defs>
        <radialGradient id="gl-face" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="100%" stopColor="#38bdf8" />
        </radialGradient>
        <radialGradient id="gl-hand" cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#fcd34d" />
        </radialGradient>
        <filter id="gl-shadow">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0891b2" floodOpacity="0.25" />
        </filter>
      </defs>
      <circle cx="40" cy="42" r="28" fill="url(#gl-face)" filter="url(#gl-shadow)" />
      <ellipse cx="40" cy="19" rx="18" ry="10" fill="#164e63" opacity="0.9" />
      <ellipse cx="40" cy="21" rx="13" ry="7" fill="#0e7490" />
      {/* Glowing hands */}
      <ellipse cx="11" cy="43" rx="10" ry="13" fill="url(#gl-hand)" stroke="#f59e0b" strokeWidth="1" />
      <ellipse cx="69" cy="43" rx="10" ry="13" fill="url(#gl-hand)" stroke="#f59e0b" strokeWidth="1" />
      <path d="M6 37 Q11 34 16 37" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      <path d="M64 37 Q69 34 74 37" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      {/* Eyes */}
      <circle cx="32" cy="40" r="5" fill="white" opacity="0.9" />
      <circle cx="32" cy="40" r="3" fill="#0c4a6e" />
      <circle cx="33.4" cy="38.6" r="1" fill="white" />
      <circle cx="48" cy="40" r="5" fill="white" opacity="0.9" />
      <circle cx="48" cy="40" r="3" fill="#0c4a6e" />
      <circle cx="49.4" cy="38.6" r="1" fill="white" />
      <ellipse cx="26" cy="50" rx="6" ry="3.5" fill="#7dd3fc" opacity="0.4" />
      <ellipse cx="54" cy="50" rx="6" ry="3.5" fill="#7dd3fc" opacity="0.4" />
      <path d="M32 55 Q40 61 48 55" stroke="#0e7490" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function GlowFixmonk() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" fill="none">
      <defs>
        <radialGradient id="gf-face" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#ede9fe" />
          <stop offset="100%" stopColor="#a78bfa" />
        </radialGradient>
        <filter id="gf-shadow">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#7c3aed" floodOpacity="0.25" />
        </filter>
      </defs>
      <circle cx="40" cy="42" r="28" fill="url(#gf-face)" filter="url(#gf-shadow)" />
      <ellipse cx="40" cy="19" rx="18" ry="10" fill="#3b0764" opacity="0.9" />
      <ellipse cx="40" cy="21" rx="13" ry="7" fill="#4c1d95" />
      <ellipse cx="14" cy="43" rx="5" ry="7" fill="#ddd6fe" />
      <ellipse cx="66" cy="43" rx="5" ry="7" fill="#ddd6fe" />
      {/* Eyes */}
      <circle cx="32" cy="38" r="5" fill="white" opacity="0.9" />
      <circle cx="32" cy="38" r="3" fill="#3b0764" />
      <circle cx="33.4" cy="36.6" r="1" fill="white" />
      <circle cx="48" cy="38" r="5" fill="white" opacity="0.9" />
      <circle cx="48" cy="38" r="3" fill="#3b0764" />
      <circle cx="49.4" cy="36.6" r="1" fill="white" />
      <ellipse cx="26" cy="49" rx="6" ry="3.5" fill="#c4b5fd" opacity="0.5" />
      <ellipse cx="54" cy="49" rx="6" ry="3.5" fill="#c4b5fd" opacity="0.5" />
      {/* Glowing zip mouth */}
      <rect x="26" y="51" width="28" height="7" rx="3.5" fill="#7c3aed" opacity="0.12" stroke="#7c3aed" strokeWidth="1.5" />
      {[29, 33.5, 38, 42.5, 47].map(x => (
        <circle key={x} cx={x} cy="54.5" r="1.8" fill="#7c3aed" opacity="0.65" />
      ))}
      {/* Glint */}
      <path d="M26 54.5 L52 54.5" stroke="#a78bfa" strokeWidth="0.8" opacity="0.5" />
    </svg>
  );
}

// ─── Main comparison page ────────────────────────────────────────────────────
const styles = [
  {
    label: "A — Kawaii",
    sub: "Cute, mascot-style. Warm & expressive.",
    monks: [
      { name: "Auditmonk", Icon: KawaiiAuditmonk, accent: "#d97706" },
      { name: "Listenmonk", Icon: KawaiiListenmonk, accent: "#0891b2" },
      { name: "Fixmonk", Icon: KawaiiFixmonk, accent: "#7c3aed" },
    ],
    bg: "linear-gradient(135deg, #fffbeb, #fef9c3)",
    border: "#fde68a",
  },
  {
    label: "B — Modern Flat",
    sub: "Clean icon-style. SaaS & product-feel.",
    monks: [
      { name: "Auditmonk", Icon: () => <FlatAuditmonk />, accent: "#d97706" },
      { name: "Listenmonk", Icon: () => <FlatListenmonk />, accent: "#0891b2" },
      { name: "Fixmonk", Icon: () => <FlatFixmonk />, accent: "#7c3aed" },
    ],
    bg: "linear-gradient(135deg, #f0fdf4, #ecfdf5)",
    border: "#bbf7d0",
  },
  {
    label: "C — Zen Line Art",
    sub: "Minimal strokes. Calm & premium.",
    monks: [
      { name: "Auditmonk", Icon: () => <ZenAuditmonk />, accent: "#d97706" },
      { name: "Listenmonk", Icon: () => <ZenListenmonk />, accent: "#0891b2" },
      { name: "Fixmonk", Icon: () => <ZenFixmonk />, accent: "#7c3aed" },
    ],
    bg: "linear-gradient(135deg, #fafafa, #f5f5f5)",
    border: "#e5e5e5",
  },
  {
    label: "D — Gradient Glow",
    sub: "Rich gradients & depth. Polished & premium.",
    monks: [
      { name: "Auditmonk", Icon: GlowAuditmonk, accent: "#d97706" },
      { name: "Listenmonk", Icon: GlowListenmonk, accent: "#0891b2" },
      { name: "Fixmonk", Icon: GlowFixmonk, accent: "#7c3aed" },
    ],
    bg: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
    border: "#ddd6fe",
  },
];

export default function MonkLogoOptions() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)",
      fontFamily: "'Inter', sans-serif",
      padding: "32px 28px",
    }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", letterSpacing: "-0.03em", margin: 0 }}>
            Monk Logo Styles
          </h1>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
            4 directions — Auditmonk (eyes closed) · Listenmonk (ears closed) · Fixmonk (mouth closed)
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {styles.map((style) => (
            <div key={style.label} style={{
              borderRadius: 20,
              border: `1.5px solid ${style.border}`,
              background: style.bg,
              padding: "20px 24px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
            }}>
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>
                  {style.label}
                </span>
                <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 10 }}>{style.sub}</span>
              </div>
              <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                {style.monks.map(({ name, Icon, accent }) => (
                  <div key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 96, height: 96, borderRadius: 22,
                      background: "rgba(255,255,255,0.7)",
                      border: "1.5px solid rgba(0,0,0,0.06)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}>
                      <Icon />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: "0.02em" }}>
                      {name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 24 }}>
          Each set: Auditmonk (eyes closed) · Listenmonk (ears covered) · Fixmonk (mouth sealed)
        </p>
      </div>
    </div>
  );
}

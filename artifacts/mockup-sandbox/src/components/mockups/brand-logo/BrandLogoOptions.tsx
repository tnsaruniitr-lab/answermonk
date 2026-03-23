// AnswerMonk Brand Logo Options — clearly monk × clearly AI

// ─── Option A: Meditating Circuit Monk ──────────────────────────────────────
// Full seated monk in lotus pose; robe filled with PCB circuit traces
function LogoA({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} fill="none">
      <defs>
        <linearGradient id="a-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <clipPath id="a-robe">
          <ellipse cx="40" cy="60" rx="30" ry="22" />
        </clipPath>
        <clipPath id="a-head">
          <circle cx="40" cy="28" r="16" />
        </clipPath>
      </defs>

      {/* Robe shape */}
      <ellipse cx="40" cy="60" rx="30" ry="22" fill="#4f46e5" />
      {/* Circuit traces inside robe */}
      <g clipPath="url(#a-robe)" stroke="#818cf8" strokeWidth="0.9" opacity="0.55">
        <line x1="15" y1="53" x2="65" y2="53" />
        <line x1="15" y1="60" x2="65" y2="60" />
        <line x1="15" y1="67" x2="65" y2="67" />
        <line x1="25" y1="45" x2="25" y2="75" />
        <line x1="35" y1="45" x2="35" y2="75" />
        <line x1="45" y1="45" x2="45" y2="75" />
        <line x1="55" y1="45" x2="55" y2="75" />
        {/* nodes at intersections */}
        {[25,35,45,55].map(x => [53,60,67].map(y => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill="#a5b4fc" stroke="none" />
        )))}
      </g>
      {/* Robe outline */}
      <ellipse cx="40" cy="60" rx="30" ry="22" stroke="#818cf8" strokeWidth="1.2" />

      {/* Hands / mudra at base of robe */}
      <ellipse cx="29" cy="72" rx="8" ry="4" fill="#3730a3" stroke="#818cf8" strokeWidth="0.8" />
      <ellipse cx="51" cy="72" rx="8" ry="4" fill="#3730a3" stroke="#818cf8" strokeWidth="0.8" />
      {/* Data pulse from fingertips */}
      <path d="M21 72 Q17 68 13 72" stroke="#a5b4fc" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.7" />
      <path d="M59 72 Q63 68 67 72" stroke="#a5b4fc" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.7" />

      {/* Neck */}
      <rect x="36" y="41" width="8" height="6" rx="3" fill="#4f46e5" />

      {/* Head */}
      <circle cx="40" cy="28" r="16" fill="#6366f1" />
      {/* Head shine */}
      <ellipse cx="35" cy="21" rx="5" ry="3" fill="white" opacity="0.12" />
      {/* Elongated earlobes (Buddha style) */}
      <ellipse cx="24" cy="30" rx="2.5" ry="4.5" fill="#4f46e5" stroke="#818cf8" strokeWidth="0.8" />
      <ellipse cx="56" cy="30" rx="2.5" ry="4.5" fill="#4f46e5" stroke="#818cf8" strokeWidth="0.8" />
      {/* Eyes — both closed, downward arcs */}
      <path d="M31 28 Q35 23 39 28" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M41 28 Q45 23 49 28" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Serene smile */}
      <path d="M33 34 Q40 39 47 34" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.8" />
      {/* Ushnisha / topknot bump */}
      <ellipse cx="40" cy="14" rx="7" ry="4.5" fill="#4338ca" />
    </svg>
  );
}

// ─── Option B: Third Eye Scanner ─────────────────────────────────────────────
// Classic monk face — both eyes closed, prominent AI scanning iris as third eye
function LogoB({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} fill="none">
      <defs>
        <radialGradient id="b-iris" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="60%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </radialGradient>
        <linearGradient id="b-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#312e81" />
        </linearGradient>
      </defs>
      <circle cx="40" cy="40" r="40" fill="url(#b-bg)" />

      {/* Robe triangle at bottom */}
      <path d="M10 78 Q10 55 40 50 Q70 55 70 78 Z" fill="#312e81" stroke="#6366f1" strokeWidth="0.8" />

      {/* Head */}
      <circle cx="40" cy="34" r="20" fill="#4338ca" />
      {/* Head shine */}
      <ellipse cx="34" cy="21" rx="7" ry="4" fill="white" opacity="0.1" />
      {/* Ushnisha */}
      <ellipse cx="40" cy="16" rx="9" ry="5" fill="#312e81" />
      {/* Elongated earlobes */}
      <ellipse cx="20" cy="36" rx="3" ry="5.5" fill="#312e81" stroke="#6366f1" strokeWidth="0.8" />
      <ellipse cx="60" cy="36" rx="3" ry="5.5" fill="#312e81" stroke="#6366f1" strokeWidth="0.8" />

      {/* Closed eyes — both down */}
      <path d="M26 34 Q31 28 36 34" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M44 34 Q49 28 54 34" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Smile */}
      <path d="M30 42 Q40 48 50 42" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7" />

      {/* ── Third eye scanner (forehead center) ── */}
      <circle cx="40" cy="25" r="7" fill="#1e1b4b" />
      <circle cx="40" cy="25" r="6" stroke="#f59e0b" strokeWidth="0.8" fill="none" />
      <circle cx="40" cy="25" r="4.5" stroke="#fbbf24" strokeWidth="0.6" fill="none" opacity="0.6" />
      <circle cx="40" cy="25" r="3" fill="url(#b-iris)" />
      <circle cx="40" cy="25" r="1.5" fill="white" opacity="0.9" />
      {/* Scan cross-hairs */}
      <line x1="33" y1="25" x2="37" y2="25" stroke="#fbbf24" strokeWidth="0.8" opacity="0.7" />
      <line x1="43" y1="25" x2="47" y2="25" stroke="#fbbf24" strokeWidth="0.8" opacity="0.7" />
      <line x1="40" y1="18" x2="40" y2="22" stroke="#fbbf24" strokeWidth="0.8" opacity="0.7" />
      <line x1="40" y1="28" x2="40" y2="32" stroke="#fbbf24" strokeWidth="0.8" opacity="0.7" />
      {/* Glow dots */}
      <circle cx="40" cy="19" r="1" fill="#fbbf24" opacity="0.5" />
    </svg>
  );
}

// ─── Option C: Chip Robe Silhouette ──────────────────────────────────────────
// The monk's robed silhouette IS the shape; interior is a processor chip grid
function LogoC({ size = 80 }: { size?: number }) {
  // Monk silhouette: round head + wide robe bell shape
  const robePath = "M40 14 L40 22 Q40 23 38 23.5 Q20 27 14 55 Q10 70 10 78 L70 78 Q70 70 66 55 Q60 27 42 23.5 Q40 23 40 22 Z";
  const headPath = "M40 14 A14 14 0 1 0 40 14.01 Z";

  return (
    <svg viewBox="0 0 80 80" width={size} height={size} fill="none">
      <defs>
        <linearGradient id="c-fill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#047857" />
          <stop offset="100%" stopColor="#065f46" />
        </linearGradient>
        <clipPath id="c-monk">
          <circle cx="40" cy="12" r="13" />
          <ellipse cx="40" cy="56" rx="28" ry="26" />
        </clipPath>
      </defs>

      {/* ── Head (bald, smooth) ── */}
      <circle cx="40" cy="12" r="13" fill="#047857" />
      <ellipse cx="36" cy="7" rx="4" ry="2.5" fill="white" opacity="0.12" />
      {/* Elongated ears */}
      <ellipse cx="27" cy="14" rx="2" ry="4" fill="#065f46" stroke="#34d399" strokeWidth="0.7" />
      <ellipse cx="53" cy="14" rx="2" ry="4" fill="#065f46" stroke="#34d399" strokeWidth="0.7" />
      {/* Monk face */}
      <path d="M33 12 Q36 9 39 12" stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M41 12 Q44 9 47 12" stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M35 17 Q40 20 45 17" stroke="white" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.7" />

      {/* ── Robe / body ── */}
      <ellipse cx="40" cy="56" rx="28" ry="26" fill="#047857" />

      {/* Chip grid inside robe */}
      <g clipPath="url(c-chip)">
        <ellipse cx="40" cy="56" rx="28" ry="26" fill="#065f46" />
      </g>
      {/* Processor chip */}
      <rect x="24" y="38" width="32" height="32" rx="4" fill="#065f46" stroke="#34d399" strokeWidth="1.2" />
      {/* Chip core */}
      <rect x="31" y="45" width="18" height="18" rx="2" fill="#047857" stroke="#6ee7b7" strokeWidth="0.9" />
      {/* Chip grid lines */}
      <line x1="31" y1="51" x2="49" y2="51" stroke="#34d399" strokeWidth="0.6" opacity="0.7" />
      <line x1="31" y1="57" x2="49" y2="57" stroke="#34d399" strokeWidth="0.6" opacity="0.7" />
      <line x1="37" y1="45" x2="37" y2="63" stroke="#34d399" strokeWidth="0.6" opacity="0.7" />
      <line x1="43" y1="45" x2="43" y2="63" stroke="#34d399" strokeWidth="0.6" opacity="0.7" />
      {/* Chip node dots */}
      {[37,40,43].map(x => [51,54,57].map(y => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.2" fill="#6ee7b7" opacity="0.8" />
      )))}
      {/* Chip pins — left side */}
      {[42,47,52,57,62].map(y => (
        <line key={`l${y}`} x1="20" y1={y} x2="24" y2={y} stroke="#34d399" strokeWidth="1.2" strokeLinecap="round" />
      ))}
      {/* Chip pins — right side */}
      {[42,47,52,57,62].map(y => (
        <line key={`r${y}`} x1="56" y1={y} x2="60" y2={y} stroke="#34d399" strokeWidth="1.2" strokeLinecap="round" />
      ))}
      {/* Chip pins — top */}
      {[30,35,40,45,50].map(x => (
        <line key={`t${x}`} x1={x} y1="34" x2={x} y2="38" stroke="#34d399" strokeWidth="1.2" strokeLinecap="round" />
      ))}
    </svg>
  );
}

// ─── Option D: Neural Halo Monk ───────────────────────────────────────────────
// Clean monk silhouette with a glowing neural-network ring as the halo
function LogoD({ size = 80 }: { size?: number }) {
  const nodes = [
    { angle: 0 }, { angle: 40 }, { angle: 80 }, { angle: 130 },
    { angle: 170 }, { angle: 210 }, { angle: 260 }, { angle: 310 },
  ].map(n => ({
    ...n,
    x: 40 + 35 * Math.cos((n.angle * Math.PI) / 180),
    y: 40 + 35 * Math.sin((n.angle * Math.PI) / 180),
  }));
  const connections = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0],[0,3],[2,5],[1,6]];

  return (
    <svg viewBox="0 0 80 80" width={size} height={size} fill="none">
      <defs>
        <linearGradient id="d-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>
        <linearGradient id="d-monk" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <circle cx="40" cy="40" r="40" fill="url(#d-bg)" />

      {/* Neural network halo — connections first */}
      {connections.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].x} y1={nodes[a].y}
          x2={nodes[b].x} y2={nodes[b].y}
          stroke="#7c3aed" strokeWidth="0.8" opacity="0.4"
        />
      ))}
      {/* Orbit track */}
      <circle cx="40" cy="40" r="35" stroke="#7c3aed" strokeWidth="0.6" strokeDasharray="3 5" opacity="0.3" />
      {/* Node dots */}
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r="2.5" fill="#a78bfa" opacity="0.8" />
      ))}

      {/* Robe */}
      <path d="M22 78 Q20 58 40 54 Q60 58 58 78 Z" fill="#7c3aed" opacity="0.9" />
      <path d="M18 78 Q17 62 40 56 Q63 62 62 78 Z" fill="url(#d-monk)" opacity="0.25" />

      {/* Neck */}
      <rect x="36" y="46" width="8" height="7" rx="3" fill="#7c3aed" />

      {/* Head */}
      <circle cx="40" cy="36" r="17" fill="url(#d-monk)" />
      <ellipse cx="35" cy="23" rx="6" ry="3.5" fill="white" opacity="0.1" />
      {/* Ushnisha */}
      <ellipse cx="40" cy="20" rx="9" ry="5" fill="#7c3aed" />
      {/* Ears */}
      <ellipse cx="23" cy="38" rx="2.5" ry="4.5" fill="#6d28d9" stroke="#a78bfa" strokeWidth="0.7" />
      <ellipse cx="57" cy="38" rx="2.5" ry="4.5" fill="#6d28d9" stroke="#a78bfa" strokeWidth="0.7" />
      {/* Eyes closed */}
      <path d="M28 36 Q33 30 38 36" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M42 36 Q47 30 52 36" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Smile */}
      <path d="M31 42 Q40 48 49 42" stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.8" />
    </svg>
  );
}

// ─── Option E: Monk Bot ───────────────────────────────────────────────────────
// Monk head + face on top of a clearly robotic/circuit torso — explicit fusion
function LogoE({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} fill="none">
      <defs>
        <linearGradient id="e-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0891b2" />
          <stop offset="100%" stopColor="#0e7490" />
        </linearGradient>
        <linearGradient id="e-head" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
      </defs>

      {/* Robot body / chassis */}
      <rect x="18" y="50" width="44" height="28" rx="8" fill="url(#e-body)" />
      {/* Body panel lines */}
      <line x1="18" y1="61" x2="62" y2="61" stroke="#7dd3fc" strokeWidth="0.8" opacity="0.4" />
      <line x1="18" y1="70" x2="62" y2="70" stroke="#7dd3fc" strokeWidth="0.8" opacity="0.4" />
      <line x1="32" y1="50" x2="32" y2="78" stroke="#7dd3fc" strokeWidth="0.8" opacity="0.4" />
      <line x1="48" y1="50" x2="48" y2="78" stroke="#7dd3fc" strokeWidth="0.8" opacity="0.4" />
      {/* Status indicator dots */}
      <circle cx="27" cy="56" r="2.5" fill="#34d399" />
      <circle cx="34" cy="56" r="2.5" fill="#fbbf24" />
      <circle cx="41" cy="56" r="2.5" fill="#818cf8" />
      {/* Central processor block */}
      <rect x="35" y="63" width="10" height="10" rx="2" fill="#0e7490" stroke="#7dd3fc" strokeWidth="0.8" />
      <circle cx="40" cy="68" r="2.5" fill="#38bdf8" opacity="0.8" />
      {/* Shoulder ports */}
      <rect x="10" y="55" width="8" height="14" rx="4" fill="#0891b2" stroke="#7dd3fc" strokeWidth="0.8" />
      <rect x="62" y="55" width="8" height="14" rx="4" fill="#0891b2" stroke="#7dd3fc" strokeWidth="0.8" />
      {/* Port lines */}
      <line x1="10" y1="60" x2="18" y2="60" stroke="#7dd3fc" strokeWidth="1" strokeLinecap="round" />
      <line x1="62" y1="60" x2="70" y2="60" stroke="#7dd3fc" strokeWidth="1" strokeLinecap="round" />

      {/* Monk neck / robe collar */}
      <path d="M29 50 Q40 44 51 50" fill="#0891b2" />
      <path d="M27 50 Q40 43 53 50 Q53 46 40 42 Q27 46 27 50Z" fill="#0e7490" opacity="0.6" />

      {/* ── Monk head ── */}
      <circle cx="40" cy="28" r="18" fill="url(#e-head)" />
      {/* Bald dome shine */}
      <ellipse cx="34" cy="16" rx="7" ry="4" fill="white" opacity="0.15" />
      {/* Ushnisha */}
      <ellipse cx="40" cy="12" rx="10" ry="6" fill="#0891b2" />
      {/* Elongated Buddhist earlobes */}
      <ellipse cx="22" cy="30" rx="3" ry="5.5" fill="#0e7490" stroke="#7dd3fc" strokeWidth="0.8" />
      <ellipse cx="58" cy="30" rx="3" ry="5.5" fill="#0e7490" stroke="#7dd3fc" strokeWidth="0.8" />
      {/* Closed eyes — serene monk */}
      <path d="M27 28 Q32 22 37 28" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M43 28 Q48 22 53 28" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* Serene smile */}
      <path d="M31 35 Q40 41 49 35" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.85" />
    </svg>
  );
}

// ─── Option F: Data Stream Robe ───────────────────────────────────────────────
// Monk silhouette with robe made of cascading data streams / binary light
function LogoF({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} fill="none">
      <defs>
        <linearGradient id="f-bg" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#14532d" />
          <stop offset="100%" stopColor="#166534" />
        </linearGradient>
        <linearGradient id="f-stream" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" stopOpacity="0" />
          <stop offset="40%" stopColor="#22c55e" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#4ade80" stopOpacity="0.3" />
        </linearGradient>
        <clipPath id="f-robe-clip">
          <path d="M14 80 Q12 58 40 50 Q68 58 66 80 Z" />
        </clipPath>
      </defs>
      <rect width="80" height="80" rx="18" fill="url(#f-bg)" />

      {/* Robe shape */}
      <path d="M14 80 Q12 58 40 50 Q68 58 66 80 Z" fill="#15803d" />

      {/* Data streams falling through robe */}
      <g clipPath="url(#f-robe-clip)">
        {[18, 24, 30, 36, 40, 44, 50, 56, 62].map((x, i) => (
          <g key={x}>
            <line x1={x} y1={50 + (i % 3) * 4} x2={x} y2={82} stroke="url(#f-stream)" strokeWidth="1.2" />
            {/* Data characters */}
            {[0,8,16,24].map(dy => (
              <text
                key={dy} x={x} y={55 + dy + (i % 3) * 4}
                fontSize="4.5" fill="#4ade80" textAnchor="middle"
                fontFamily="monospace" opacity={0.7 - dy * 0.015}
              >
                {["1","0","A","F","7","E","3","B","9"][( i + dy) % 9]}
              </text>
            ))}
          </g>
        ))}
      </g>
      {/* Robe outline */}
      <path d="M14 80 Q12 58 40 50 Q68 58 66 80 Z" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.4" />

      {/* Neck */}
      <rect x="36" y="44" width="8" height="7" rx="3.5" fill="#15803d" />

      {/* Head */}
      <circle cx="40" cy="30" r="18" fill="#16a34a" />
      <ellipse cx="34" cy="17" rx="7" ry="4" fill="white" opacity="0.12" />
      {/* Ushnisha */}
      <ellipse cx="40" cy="13" rx="10" ry="6" fill="#15803d" />
      {/* Ears */}
      <ellipse cx="22" cy="32" rx="3" ry="5" fill="#15803d" stroke="#4ade80" strokeWidth="0.8" />
      <ellipse cx="58" cy="32" rx="3" ry="5" fill="#15803d" stroke="#4ade80" strokeWidth="0.8" />
      {/* Closed eyes */}
      <path d="M27 30 Q32 24 37 30" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M43 30 Q48 24 53 30" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* Smile */}
      <path d="M31 37 Q40 43 49 37" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.85" />

      {/* Data glow on face edges */}
      <circle cx="22" cy="32" r="1.5" fill="#4ade80" opacity="0.6" />
      <circle cx="58" cy="32" r="1.5" fill="#4ade80" opacity="0.6" />
    </svg>
  );
}

// ─── Wordmark ─────────────────────────────────────────────────────────────────
function Wordmark({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.04em", color: "#111827", lineHeight: 1 }}>
        Answer<span style={{ color }}>Monk</span>
      </div>
      <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, letterSpacing: "0.04em", marginTop: 2 }}>
        answermonk.ai
      </div>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function LogoCard({
  label, desc, accent, bg, border, IconComp,
}: {
  label: string; desc: string; accent: string; bg: string; border: string;
  IconComp: React.ComponentType<{ size?: number }>;
}) {
  return (
    <div style={{
      borderRadius: 18,
      border: `1.5px solid ${border}`,
      background: bg,
      padding: "18px 22px",
      boxShadow: "0 2px 14px rgba(0,0,0,0.07)",
    }}>
      <div style={{ marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>{label}</span>
        <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 8 }}>{desc}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" as const }}>
        {/* Large icon */}
        <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 5 }}>
          <IconComp size={80} />
          <span style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" as const }}>
            App icon
          </span>
        </div>
        {/* Light lockup */}
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <IconComp size={40} />
            <Wordmark color={accent} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <IconComp size={24} />
            <span style={{ fontSize: 15, fontWeight: 900, letterSpacing: "-0.04em", color: "#111827" }}>
              Answer<span style={{ color: accent }}>Monk</span>
            </span>
          </div>
        </div>
        {/* Dark background lockup */}
        <div style={{
          background: "#0f172a", borderRadius: 12,
          padding: "14px 18px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <IconComp size={38} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.04em", color: "white", lineHeight: 1 }}>
              Answer<span style={{ color: accent }}>Monk</span>
            </div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>answermonk.ai</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BrandLogoOptions() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f1f5f9 0%, #ffffff 60%, #f0f9ff 100%)",
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: "28px 24px",
    }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: 0, letterSpacing: "-0.03em" }}>
            AnswerMonk — Brand Logo
          </h1>
          <p style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>
            6 directions · each clearly monk + AI agent · light + dark previews
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <LogoCard label="A — Meditating Circuit Monk" desc="Lotus pose, robe filled with PCB circuit traces, data mudra hands." accent="#6366f1" bg="linear-gradient(135deg,#eef2ff,#f5f3ff88)" border="#c7d2fe" IconComp={LogoA} />
          <LogoCard label="B — Third Eye Scanner" desc="Serene closed eyes + AI scanning iris as the Buddhist third eye." accent="#f59e0b" bg="linear-gradient(135deg,#fffbeb,#fef3c788)" border="#fde68a" IconComp={LogoB} />
          <LogoCard label="C — Chip-Robe Monk" desc="Monk silhouette; interior is a processor chip with exposed pins." accent="#10b981" bg="linear-gradient(135deg,#ecfdf5,#d1fae588)" border="#a7f3d0" IconComp={LogoC} />
          <LogoCard label="D — Neural Halo" desc="Classic monk figure; halo is a glowing neural network of connected nodes." accent="#a78bfa" bg="linear-gradient(135deg,#f5f3ff,#ede9fe88)" border="#ddd6fe" IconComp={LogoD} />
          <LogoCard label="E — Monk Bot" desc="Monk face + expression on top of an explicit robot/circuit chassis." accent="#38bdf8" bg="linear-gradient(135deg,#f0f9ff,#e0f2fe88)" border="#bae6fd" IconComp={LogoE} />
          <LogoCard label="F — Data Stream Robe" desc="Monk silhouette; robe is cascading green data / matrix code streams." accent="#22c55e" bg="linear-gradient(135deg,#f0fdf4,#dcfce788)" border="#bbf7d0" IconComp={LogoF} />
        </div>
        <p style={{ fontSize: 10, color: "#9ca3af", textAlign: "center", marginTop: 20 }}>
          All SVG · scalable to any size · consistent monk features: bald dome, elongated earlobes, closed eyes, ushnisha
        </p>
      </div>
    </div>
  );
}

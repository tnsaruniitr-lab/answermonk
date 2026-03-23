// AnswerMonk Brand Logo Options — Monk × AI blend in Modern Flat style

// ─── Option A: Circuit Halo ──────────────────────────────────────────────────
// Flat monk face surrounded by a neural-network orbit ring
function LogoA({ size = 72 }: { size?: number }) {
  const s = size / 72;
  return (
    <svg viewBox="0 0 72 72" width={size} height={size} fill="none">
      <defs>
        <linearGradient id="la-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      {/* Background circle */}
      <circle cx="36" cy="36" r="36" fill="url(#la-bg)" />
      {/* Orbit ring with nodes */}
      <circle cx="36" cy="36" r="28" stroke="white" strokeWidth="0.8" strokeOpacity="0.25" strokeDasharray="2 4" />
      {/* Orbit nodes */}
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x = 36 + 28 * Math.cos(rad);
        const y = 36 + 28 * Math.sin(rad);
        return <circle key={deg} cx={x} cy={y} r="2.2" fill="white" opacity="0.5" />;
      })}
      {/* Connecting lines between nodes (selective) */}
      {[[0, 60], [120, 180], [240, 300]].map(([a, b], i) => {
        const ax = 36 + 28 * Math.cos((a * Math.PI) / 180);
        const ay = 36 + 28 * Math.sin((a * Math.PI) / 180);
        const bx = 36 + 28 * Math.cos((b * Math.PI) / 180);
        const by = 36 + 28 * Math.sin((b * Math.PI) / 180);
        return <line key={i} x1={ax} y1={ay} x2={bx} y2={by} stroke="white" strokeWidth="0.6" opacity="0.2" />;
      })}
      {/* Monk face */}
      <circle cx="36" cy="37" r="16" fill="white" opacity="0.95" />
      {/* Hair cap */}
      <ellipse cx="36" cy="24" rx="11" ry="6.5" fill="#7c3aed" />
      {/* Closed eyes */}
      <path d="M24 36 Q28 31 32 36" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M40 36 Q44 31 48 36" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Smile */}
      <path d="M28 42 Q36 47 44 42" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.7" />
    </svg>
  );
}

// ─── Option B: Signal Arc Monk ───────────────────────────────────────────────
// Monk silhouette inside a "signal / AI listening" arc shape
function LogoB({ size = 72 }: { size?: number }) {
  return (
    <svg viewBox="0 0 72 72" width={size} height={size} fill="none">
      <defs>
        <linearGradient id="lb-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0891b2" />
          <stop offset="100%" stopColor="#0e7490" />
        </linearGradient>
      </defs>
      <rect width="72" height="72" rx="18" fill="url(#lb-bg)" />
      {/* Signal arcs — concentric, centered low-right */}
      <path d="M56 52 A28 28 0 0 0 16 52" stroke="white" strokeWidth="1.2" fill="none" opacity="0.2" />
      <path d="M50 52 A22 22 0 0 0 22 52" stroke="white" strokeWidth="1.2" fill="none" opacity="0.3" />
      <path d="M44 52 A16 16 0 0 0 28 52" stroke="white" strokeWidth="1.2" fill="none" opacity="0.4" />
      {/* Monk body/robe — simple silhouette */}
      <ellipse cx="36" cy="55" rx="14" ry="8" fill="white" opacity="0.2" />
      <rect x="26" y="44" width="20" height="16" rx="4" fill="white" opacity="0.25" />
      {/* Head */}
      <circle cx="36" cy="34" r="15" fill="white" opacity="0.95" />
      {/* Hair cap */}
      <ellipse cx="36" cy="22" rx="10.5" ry="6" fill="#0891b2" />
      {/* Closed eyes */}
      <path d="M24 33 Q28 28 32 33" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M40 33 Q44 28 48 33" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Smile */}
      <path d="M28 39 Q36 44 44 39" stroke="#0891b2" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.7" />
    </svg>
  );
}

// ─── Option C: AI Eye Monk ───────────────────────────────────────────────────
// One eye is a closed-monk arc; the other is an AI scanning iris
function LogoC({ size = 72 }: { size?: number }) {
  return (
    <svg viewBox="0 0 72 72" width={size} height={size} fill="none">
      <defs>
        <linearGradient id="lc-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="lc-iris" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <circle cx="36" cy="36" r="36" fill="url(#lc-bg)" />
      {/* Monk face */}
      <circle cx="36" cy="37" r="17" fill="white" opacity="0.95" />
      {/* Hair cap */}
      <ellipse cx="36" cy="23" rx="12" ry="7" fill="#d97706" />
      {/* Left eye — monk closed arc */}
      <path d="M22 36 Q26 31 30 36" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* Right eye — AI iris (scanning rings) */}
      <circle cx="43" cy="36" r="6.5" fill="#d97706" opacity="0.12" />
      <circle cx="43" cy="36" r="5" stroke="#d97706" strokeWidth="1.2" fill="none" />
      <circle cx="43" cy="36" r="3" fill="url(#lc-iris)" />
      <circle cx="43" cy="36" r="1.4" fill="white" opacity="0.9" />
      {/* Scan line crossing the iris */}
      <line x1="37" y1="36" x2="49" y2="36" stroke="#d97706" strokeWidth="0.8" opacity="0.5" />
      {/* Smile */}
      <path d="M27 43 Q36 48 45 43" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.7" />
    </svg>
  );
}

// ─── Option D: Hexagon Monk ──────────────────────────────────────────────────
// Monk face inscribed in a hex gem shape (like a gemstone/data crystal)
function LogoD({ size = 72 }: { size?: number }) {
  const hex = Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 - 30) * (Math.PI / 180);
    return `${36 + 33 * Math.cos(a)},${36 + 33 * Math.sin(a)}`;
  }).join(" ");
  const innerHex = Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 - 30) * (Math.PI / 180);
    return `${36 + 26 * Math.cos(a)},${36 + 26 * Math.sin(a)}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 72 72" width={size} height={size} fill="none">
      <defs>
        <linearGradient id="ld-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6d28d9" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <clipPath id="ld-clip">
          <polygon points={hex} />
        </clipPath>
      </defs>
      <polygon points={hex} fill="url(#ld-bg)" />
      {/* Facet lines */}
      <polygon points={innerHex} fill="none" stroke="white" strokeWidth="0.6" opacity="0.2" />
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i * 60 - 30) * (Math.PI / 180);
        const x = 36 + 33 * Math.cos(a);
        const y = 36 + 33 * Math.sin(a);
        return <line key={i} x1="36" y1="36" x2={x} y2={y} stroke="white" strokeWidth="0.5" opacity="0.12" />;
      })}
      {/* Monk face */}
      <circle cx="36" cy="37" r="16" fill="white" opacity="0.95" />
      <ellipse cx="36" cy="24" rx="11" ry="6.5" fill="#6d28d9" />
      {/* Closed eyes */}
      <path d="M23 36 Q27 31 31 36" stroke="#6d28d9" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M41 36 Q45 31 49 36" stroke="#6d28d9" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Smile */}
      <path d="M28 42 Q36 47 44 42" stroke="#6d28d9" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.7" />
    </svg>
  );
}

// ─── Option E: Minimal Rune Monk ─────────────────────────────────────────────
// Ultra-minimal: monk silhouette as a single clean shape, data dots as the aura
function LogoE({ size = 72 }: { size?: number }) {
  return (
    <svg viewBox="0 0 72 72" width={size} height={size} fill="none">
      <defs>
        <linearGradient id="le-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#111827" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>
        <linearGradient id="le-face" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      <rect width="72" height="72" rx="18" fill="url(#le-bg)" />
      {/* Data dot grid — subtle background */}
      {[16, 24, 32, 40, 48, 56].map(x =>
        [16, 24, 32, 40, 48, 56].map(y => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="0.8" fill="white" opacity="0.08" />
        ))
      )}
      {/* Monk robe shape */}
      <path d="M20 68 Q20 50 36 48 Q52 50 52 68" fill="#a78bfa" opacity="0.3" />
      {/* Head */}
      <circle cx="36" cy="34" r="15" fill="url(#le-face)" />
      {/* Hair cap */}
      <ellipse cx="36" cy="22" rx="10" ry="6" fill="white" opacity="0.25" />
      {/* Closed eyes — white arcs on gradient face */}
      <path d="M24 33 Q28 28 32 33" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M40 33 Q44 28 48 33" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Smile */}
      <path d="M28 39 Q36 44 44 39" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.7" />
      {/* Highlight dot cluster — AI aura */}
      <circle cx="14" cy="28" r="2.5" fill="#a78bfa" opacity="0.6" />
      <circle cx="10" cy="36" r="1.8" fill="#818cf8" opacity="0.4" />
      <circle cx="58" cy="28" r="2.5" fill="#a78bfa" opacity="0.6" />
      <circle cx="62" cy="36" r="1.8" fill="#818cf8" opacity="0.4" />
      <circle cx="36" cy="10" r="2" fill="#a78bfa" opacity="0.5" />
    </svg>
  );
}

// ─── Wordmark component ───────────────────────────────────────────────────────
function Wordmark({ name, sub, color }: { name: string; sub?: string; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <span style={{
        fontSize: 22, fontWeight: 900, letterSpacing: "-0.04em",
        color: "#111827", lineHeight: 1,
      }}>{name}</span>
      {sub && (
        <span style={{ fontSize: 11, color, fontWeight: 600, letterSpacing: "0.04em", marginTop: 2 }}>
          {sub}
        </span>
      )}
    </div>
  );
}

// ─── Logo option card ─────────────────────────────────────────────────────────
function LogoCard({
  label, desc, accent, bg, border, IconComp, wordmarkColor,
}: {
  label: string; desc: string; accent: string; bg: string; border: string;
  IconComp: React.ComponentType<{ size?: number }>;
  wordmarkColor: string;
}) {
  return (
    <div style={{
      borderRadius: 18,
      border: `1.5px solid ${border}`,
      background: bg,
      padding: "20px 24px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    }}>
      <div style={{ marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>{label}</span>
        <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 8 }}>{desc}</span>
      </div>

      {/* Icon-only row */}
      <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
        {/* Large icon */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        }}>
          <IconComp size={72} />
          <span style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            App icon
          </span>
        </div>

        {/* Medium icon + wordmark */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <IconComp size={40} />
            <Wordmark name="AnswerMonk" color={wordmarkColor} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <IconComp size={28} />
            <Wordmark name="AnswerMonk" sub="answermonk.ai" color={wordmarkColor} />
          </div>
        </div>

        {/* On dark bg */}
        <div style={{
          background: "#0f172a",
          borderRadius: 12,
          padding: "16px 20px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <IconComp size={36} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.04em", color: "white", lineHeight: 1 }}>
              AnswerMonk
            </div>
            <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500, marginTop: 2 }}>
              answermonk.ai
            </div>
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
      background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)",
      fontFamily: "'Inter', sans-serif",
      padding: "32px 28px",
    }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", letterSpacing: "-0.03em", margin: 0 }}>
            AnswerMonk — Brand Logo Options
          </h1>
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
            Modern flat style · Monk × AI agent blend · Each shown at 3 sizes + dark background
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <LogoCard
            label="A — Circuit Halo"
            desc="Monk face in a neural-network orbit ring. Purple gradient circle."
            accent="#7c3aed"
            bg="linear-gradient(135deg, #f5f3ff, #ede9fe88)"
            border="#ddd6fe"
            wordmarkColor="#7c3aed"
            IconComp={LogoA}
          />
          <LogoCard
            label="B — Signal Monk"
            desc="Monk in a rounded square with AI signal arcs radiating outward."
            accent="#0891b2"
            bg="linear-gradient(135deg, #f0f9ff, #e0f2fe88)"
            border="#bae6fd"
            wordmarkColor="#0891b2"
            IconComp={LogoB}
          />
          <LogoCard
            label="C — AI Eye"
            desc="One eye meditating closed, one eye scanning — monk meets machine."
            accent="#d97706"
            bg="linear-gradient(135deg, #fffbeb, #fef3c788)"
            border="#fde68a"
            wordmarkColor="#d97706"
            IconComp={LogoC}
          />
          <LogoCard
            label="D — Hex Crystal"
            desc="Monk face inside a hexagon gem with facet lines. Purple → amber gradient."
            accent="#6d28d9"
            bg="linear-gradient(135deg, #faf5ff, #f5f3ff88)"
            border="#e9d5ff"
            wordmarkColor="#6d28d9"
            IconComp={LogoD}
          />
          <LogoCard
            label="E — Dark Rune"
            desc="Minimal monk on a dark grid — premium, bold, data-native."
            accent="#818cf8"
            bg="linear-gradient(135deg, #1e1b4b18, #0f172a0a)"
            border="#c7d2fe"
            wordmarkColor="#6366f1"
            IconComp={LogoE}
          />
        </div>

        <p style={{ fontSize: 10, color: "#9ca3af", textAlign: "center", marginTop: 24 }}>
          All icons: SVG · scalable · light + dark backgrounds tested
        </p>
      </div>
    </div>
  );
}

// Logo Treatment Variants — based on Option A (Circuit Monk)
// All shown in homepage/navbar context matching the site's color theme

// ─── Shared: Full circuit monk (Option A) ───────────────────────────────────
function CircuitMonkFull({ size = 64 }: { size?: number }) {
  const sc = size / 80;
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} fill="none">
      <defs>
        <linearGradient id="cm-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <clipPath id="cm-robe">
          <ellipse cx="40" cy="60" rx="30" ry="22" />
        </clipPath>
      </defs>
      {/* Robe */}
      <ellipse cx="40" cy="60" rx="30" ry="22" fill="#6366f1" />
      {/* Circuit traces inside robe */}
      <g clipPath="url(#cm-robe)" stroke="#a5b4fc" strokeWidth="0.9" opacity="0.5">
        <line x1="14" y1="52" x2="66" y2="52" />
        <line x1="14" y1="59" x2="66" y2="59" />
        <line x1="14" y1="66" x2="66" y2="66" />
        <line x1="24" y1="44" x2="24" y2="78" />
        <line x1="33" y1="44" x2="33" y2="78" />
        <line x1="40" y1="44" x2="40" y2="78" />
        <line x1="47" y1="44" x2="47" y2="78" />
        <line x1="56" y1="44" x2="56" y2="78" />
        {[24,33,40,47,56].map(x => [52,59,66].map(y => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill="#c7d2fe" stroke="none" />
        )))}
      </g>
      <ellipse cx="40" cy="60" rx="30" ry="22" stroke="#818cf8" strokeWidth="1" />
      {/* Mudra hands */}
      <ellipse cx="27" cy="72" rx="9" ry="4" fill="#4f46e5" stroke="#818cf8" strokeWidth="0.8" />
      <ellipse cx="53" cy="72" rx="9" ry="4" fill="#4f46e5" stroke="#818cf8" strokeWidth="0.8" />
      {/* Data pulse from hands */}
      <path d="M18 72 Q14 68 10 72" stroke="#a5b4fc" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.6" />
      <path d="M62 72 Q66 68 70 72" stroke="#a5b4fc" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.6" />
      {/* Neck */}
      <rect x="36" y="41" width="8" height="7" rx="3" fill="#6366f1" />
      {/* Head */}
      <circle cx="40" cy="28" r="17" fill="url(#cm-bg)" />
      <ellipse cx="35" cy="18" rx="6" ry="3.5" fill="white" opacity="0.12" />
      {/* Ushnisha / topknot */}
      <ellipse cx="40" cy="13" rx="8" ry="5" fill="#4f46e5" />
      {/* Earlobes */}
      <ellipse cx="23" cy="30" rx="2.5" ry="4.5" fill="#4f46e5" stroke="#818cf8" strokeWidth="0.8" />
      <ellipse cx="57" cy="30" rx="2.5" ry="4.5" fill="#4f46e5" stroke="#818cf8" strokeWidth="0.8" />
      {/* Closed eyes */}
      <path d="M29 28 Q33 23 37 28" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M43 28 Q47 23 51 28" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Serene smile */}
      <path d="M31 34 Q40 40 49 34" stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.85" />
    </svg>
  );
}

// ─── Shared: Head-only monk ───────────────────────────────────────────────────
function CircuitMonkHead({ size = 40 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} fill="none">
      <defs>
        <linearGradient id="mh-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <clipPath id="mh-clip">
          <circle cx="24" cy="26" r="18" />
        </clipPath>
      </defs>
      {/* Head circle */}
      <circle cx="24" cy="26" r="18" fill="url(#mh-bg)" />
      {/* Circuit pattern inside head */}
      <g clipPath="url(#mh-clip)" stroke="#a5b4fc" strokeWidth="0.8" opacity="0.35">
        <line x1="6" y1="22" x2="42" y2="22" />
        <line x1="6" y1="30" x2="42" y2="30" />
        <line x1="16" y1="10" x2="16" y2="44" />
        <line x1="24" y1="10" x2="24" y2="44" />
        <line x1="32" y1="10" x2="32" y2="44" />
        {[16,24,32].map(x => [22,30].map(y => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" fill="#c7d2fe" stroke="none" />
        )))}
      </g>
      {/* Head highlight */}
      <ellipse cx="20" cy="14" rx="5" ry="3" fill="white" opacity="0.12" />
      {/* Ushnisha */}
      <ellipse cx="24" cy="10" rx="7.5" ry="5" fill="#4f46e5" />
      {/* Earlobes */}
      <ellipse cx="6" cy="27" rx="2" ry="3.5" fill="#4f46e5" stroke="#818cf8" strokeWidth="0.7" />
      <ellipse cx="42" cy="27" rx="2" ry="3.5" fill="#4f46e5" stroke="#818cf8" strokeWidth="0.7" />
      {/* Closed eyes */}
      <path d="M14 25 Q18 20 22 25" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M26 25 Q30 20 34 25" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Smile */}
      <path d="M17 32 Q24 37 31 32" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.85" />
    </svg>
  );
}

// ─── Shared: Inline head for "o" replacement ─────────────────────────────────
function MonkO({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none" style={{ display: "inline-block", verticalAlign: "middle", marginBottom: 2 }}>
      <defs>
        <linearGradient id="mo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <clipPath id="mo-clip">
          <circle cx="16" cy="16" r="14" />
        </clipPath>
      </defs>
      <circle cx="16" cy="16" r="14" fill="url(#mo-bg)" />
      {/* Subtle circuit inside */}
      <g clipPath="url(#mo-clip)" stroke="#a5b4fc" strokeWidth="0.7" opacity="0.3">
        <line x1="2" y1="14" x2="30" y2="14" />
        <line x1="2" y1="20" x2="30" y2="20" />
        <line x1="11" y1="4" x2="11" y2="28" />
        <line x1="16" y1="4" x2="16" y2="28" />
        <line x1="21" y1="4" x2="21" y2="28" />
      </g>
      {/* Ushnisha */}
      <ellipse cx="16" cy="4" rx="6" ry="3.5" fill="#4f46e5" />
      {/* Ears */}
      <ellipse cx="3" cy="17" rx="1.5" ry="2.5" fill="#4f46e5" stroke="#818cf8" strokeWidth="0.6" />
      <ellipse cx="29" cy="17" rx="1.5" ry="2.5" fill="#4f46e5" stroke="#818cf8" strokeWidth="0.6" />
      {/* Closed eyes */}
      <path d="M8 15 Q11 12 14 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M18 15 Q21 12 24 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Smile */}
      <path d="M10 20 Q16 24 22 20" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.8" />
    </svg>
  );
}

// ─── Simulated Navbar ─────────────────────────────────────────────────────────
function Navbar({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.85)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(99,102,241,0.1)",
      padding: "0 28px",
      height: 60,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      borderRadius: "12px 12px 0 0",
    }}>
      {/* Logo slot */}
      {children}
      {/* Nav items (decorative) */}
      <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
        {["Reports", "Directory", "Pricing"].map(item => (
          <span key={item} style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>{item}</span>
        ))}
        <div style={{
          padding: "7px 18px", borderRadius: 8,
          background: "linear-gradient(135deg, #6366f1, #7c3aed)",
          color: "white", fontSize: 12, fontWeight: 700,
        }}>
          Run audit
        </div>
      </div>
    </div>
  );
}

function PageBody() {
  return (
    <div style={{
      background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)",
      padding: "48px 28px 40px",
      borderRadius: "0 0 12px 12px",
    }}>
      <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
        <div style={{
          display: "inline-block", padding: "4px 14px", borderRadius: 20,
          background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
          fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: "0.06em",
          marginBottom: 18,
        }}>
          GEO INTELLIGENCE PLATFORM
        </div>
        <h1 style={{
          fontSize: 32, fontWeight: 900, letterSpacing: "-0.04em",
          background: "linear-gradient(135deg, #1e1b4b, #7c3aed)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          margin: "0 0 12px",
        }}>
          Why does ChatGPT rank<br />your rivals first?
        </h1>
        <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.7, margin: "0 0 24px" }}>
          AnswerMonk scans every major AI engine to show exactly<br />where you rank, who's beating you, and why.
        </p>
        <div style={{
          display: "flex", gap: 10, justifyContent: "center",
        }}>
          <div style={{
            padding: "10px 22px", borderRadius: 10,
            background: "linear-gradient(135deg, #6366f1, #7c3aed)",
            color: "white", fontSize: 13, fontWeight: 700,
          }}>
            Run free audit →
          </div>
          <div style={{
            padding: "10px 22px", borderRadius: 10,
            border: "1.5px solid rgba(99,102,241,0.25)",
            color: "#6366f1", fontSize: 13, fontWeight: 600,
          }}>
            See sample report
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Treatment containers ─────────────────────────────────────────────────────
function Treatment({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div style={{
      borderRadius: 14,
      border: "1.5px solid rgba(99,102,241,0.15)",
      background: "white",
      overflow: "hidden",
      boxShadow: "0 4px 24px rgba(99,102,241,0.08)",
    }}>
      <div style={{
        padding: "14px 20px 10px",
        borderBottom: "1px solid rgba(99,102,241,0.08)",
        background: "linear-gradient(135deg, #faf9ff, #f5f3ff)",
      }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#4f46e5" }}>{label}</span>
        <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 10 }}>{desc}</span>
      </div>
      <div style={{ overflow: "hidden" }}>
        {children}
      </div>
      {/* Size row */}
      <div style={{
        padding: "12px 20px",
        borderTop: "1px solid rgba(99,102,241,0.08)",
        display: "flex", gap: 18, alignItems: "center",
      }}>
        <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Sizes:
        </span>
        {children}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LogoTreatments() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#f1f5f9",
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: "28px 24px",
    }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ fontSize: 17, fontWeight: 800, color: "#111827", margin: 0, letterSpacing: "-0.03em" }}>
            Logo Treatment Options — based on A (Circuit Monk)
          </h1>
          <p style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>
            Shown in homepage navbar context · same site color theme
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

          {/* ── Treatment 1: Full body in nav ── */}
          <div>
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#4f46e5" }}>1 — Full monk beside wordmark</span>
              <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 10 }}>The complete seated circuit monk as the logo mark</span>
            </div>
            <div style={{ borderRadius: 14, overflow: "hidden", boxShadow: "0 4px 24px rgba(99,102,241,0.1)", border: "1.5px solid rgba(99,102,241,0.12)" }}>
              <Navbar>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <CircuitMonkFull size={44} />
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.04em", color: "#1e1b4b", lineHeight: 1 }}>
                      Answer<span style={{ color: "#6366f1" }}>Monk</span>
                    </div>
                    <div style={{ fontSize: 9.5, color: "#6366f1", fontWeight: 600, letterSpacing: "0.08em" }}>
                      answermonk.ai
                    </div>
                  </div>
                </div>
              </Navbar>
              <PageBody />
            </div>
            {/* Size strip */}
            <div style={{ marginTop: 10, display: "flex", gap: 20, alignItems: "flex-end", paddingLeft: 8 }}>
              {[20, 28, 36, 44, 56].map(s => (
                <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <CircuitMonkFull size={s} />
                  <span style={{ fontSize: 9, color: "#9ca3af" }}>{s}px</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Treatment 2: Head only ── */}
          <div>
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#4f46e5" }}>2 — Head-only mark beside wordmark</span>
              <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 10 }}>Compact logo — head with circuit pattern inside, earlobes, ushnisha</span>
            </div>
            <div style={{ borderRadius: 14, overflow: "hidden", boxShadow: "0 4px 24px rgba(99,102,241,0.1)", border: "1.5px solid rgba(99,102,241,0.12)" }}>
              <Navbar>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <CircuitMonkHead size={38} />
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.04em", color: "#1e1b4b", lineHeight: 1 }}>
                      Answer<span style={{ color: "#6366f1" }}>Monk</span>
                    </div>
                    <div style={{ fontSize: 9.5, color: "#6366f1", fontWeight: 600, letterSpacing: "0.08em" }}>
                      answermonk.ai
                    </div>
                  </div>
                </div>
              </Navbar>
              <PageBody />
            </div>
            {/* Size strip */}
            <div style={{ marginTop: 10, display: "flex", gap: 20, alignItems: "flex-end", paddingLeft: 8 }}>
              {[16, 24, 32, 40, 52].map(s => (
                <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <CircuitMonkHead size={s} />
                  <span style={{ fontSize: 9, color: "#9ca3af" }}>{s}px</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Treatment 3: "o" in Monk replaced by head ── */}
          <div>
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#4f46e5" }}>3 — "o" in Monk replaced by monk head</span>
              <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 10 }}>Typographic wordmark: Answer M[○]nk — no separate icon needed</span>
            </div>
            <div style={{ borderRadius: 14, overflow: "hidden", boxShadow: "0 4px 24px rgba(99,102,241,0.1)", border: "1.5px solid rgba(99,102,241,0.12)" }}>
              <Navbar>
                {/* Wordmark with inline head */}
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{
                    fontSize: 22, fontWeight: 900, letterSpacing: "-0.04em",
                    color: "#1e1b4b", lineHeight: 1,
                  }}>
                    Answer&nbsp;M
                  </span>
                  <MonkO size={22} />
                  <span style={{
                    fontSize: 22, fontWeight: 900, letterSpacing: "-0.04em",
                    color: "#6366f1", lineHeight: 1,
                  }}>
                    nk
                  </span>
                </div>
              </Navbar>
              <PageBody />
            </div>
            {/* Size variants */}
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10, paddingLeft: 8 }}>
              {[
                { fontSize: 14, iconSize: 14, label: "Small (nav compact)" },
                { fontSize: 20, iconSize: 20, label: "Medium (standard nav)" },
                { fontSize: 28, iconSize: 28, label: "Large (hero / hero heading)" },
                { fontSize: 40, iconSize: 40, label: "XL (splash / marketing)" },
              ].map(({ fontSize, iconSize, label }) => (
                <div key={fontSize} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ fontSize, fontWeight: 900, letterSpacing: "-0.04em", color: "#1e1b4b", lineHeight: 1 }}>
                      Answer&nbsp;M
                    </span>
                    <MonkO size={iconSize} />
                    <span style={{ fontSize, fontWeight: 900, letterSpacing: "-0.04em", color: "#6366f1", lineHeight: 1 }}>
                      nk
                    </span>
                  </div>
                  <span style={{ fontSize: 10, color: "#9ca3af" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        <p style={{ fontSize: 10, color: "#9ca3af", textAlign: "center", marginTop: 28 }}>
          All use the site's indigo/violet gradient theme · "Answer" dark · "Monk" / accent in #6366f1
        </p>
      </div>
    </div>
  );
}

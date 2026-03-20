export default function LogoB() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8f7ff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 48, fontFamily: "system-ui, -apple-system, sans-serif", padding: 40 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#94a3b8", textTransform: "uppercase", fontWeight: 500 }}>Option B — Signal Arc</div>

      {/* Light version */}
      <div style={{ background: "white", borderRadius: 20, padding: "40px 56px", boxShadow: "0 4px 40px rgba(99,102,241,0.1)", display: "flex", alignItems: "center", gap: 14 }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="b-grad-l" x1="5" y1="38" x2="35" y2="5" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          {/* Base circle dot */}
          <circle cx="20" cy="33" r="3.5" fill="url(#b-grad-l)" />
          {/* Inner arc */}
          <path d="M12 27 Q12 17 20 17 Q28 17 28 27" stroke="url(#b-grad-l)" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Middle arc */}
          <path d="M7 30 Q7 10 20 10 Q33 10 33 30" stroke="url(#b-grad-l)" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6" />
          {/* Outer arc */}
          <path d="M2 33 Q2 4 20 4 Q38 4 38 33" stroke="url(#b-grad-l)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.3" />
        </svg>
        <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: "#1e1b4b" }}>
          Answer<span style={{ color: "#6366f1" }}>Monk</span>
        </span>
      </div>

      {/* Dark version */}
      <div style={{ background: "#0d0f1a", borderRadius: 20, padding: "40px 56px", display: "flex", alignItems: "center", gap: 14 }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="b-grad-d" x1="5" y1="38" x2="35" y2="5" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <circle cx="20" cy="33" r="3.5" fill="url(#b-grad-d)" />
          <path d="M12 27 Q12 17 20 17 Q28 17 28 27" stroke="url(#b-grad-d)" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M7 30 Q7 10 20 10 Q33 10 33 30" stroke="url(#b-grad-d)" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6" />
          <path d="M2 33 Q2 4 20 4 Q38 4 38 33" stroke="url(#b-grad-d)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.3" />
        </svg>
        <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: "white" }}>
          Answer<span style={{ color: "#818cf8" }}>Monk</span>
        </span>
      </div>
    </div>
  );
}

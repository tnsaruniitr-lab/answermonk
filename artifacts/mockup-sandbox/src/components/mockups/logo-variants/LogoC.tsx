export default function LogoC() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8f7ff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 48, fontFamily: "system-ui, -apple-system, sans-serif", padding: 40 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#94a3b8", textTransform: "uppercase", fontWeight: 500 }}>Option C — Gem Monogram</div>

      {/* Light version */}
      <div style={{ background: "white", borderRadius: 20, padding: "40px 56px", boxShadow: "0 4px 40px rgba(99,102,241,0.1)", display: "flex", alignItems: "center", gap: 14 }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="c-top" x1="20" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id="c-bot" x1="20" y1="20" x2="20" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
          </defs>
          {/* Diamond facets */}
          <polygon points="20,1 38,15 20,20" fill="url(#c-top)" />
          <polygon points="20,1 2,15 20,20" fill="url(#c-top)" opacity="0.7" />
          <polygon points="20,20 38,15 20,39" fill="url(#c-bot)" />
          <polygon points="20,20 2,15 20,39" fill="url(#c-bot)" opacity="0.8" />
          {/* A letterform */}
          <text x="20" y="24" textAnchor="middle" fill="white" fontSize="13" fontWeight="800" fontFamily="system-ui" letterSpacing="-0.5">A</text>
        </svg>
        <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: "#1e1b4b" }}>
          Answer<span style={{ color: "#6366f1" }}>Monk</span>
        </span>
      </div>

      {/* Dark version */}
      <div style={{ background: "#0d0f1a", borderRadius: 20, padding: "40px 56px", display: "flex", alignItems: "center", gap: 14 }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="c-top-d" x1="20" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#a5b4fc" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
            <linearGradient id="c-bot-d" x1="20" y1="20" x2="20" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
          <polygon points="20,1 38,15 20,20" fill="url(#c-top-d)" />
          <polygon points="20,1 2,15 20,20" fill="url(#c-top-d)" opacity="0.7" />
          <polygon points="20,20 38,15 20,39" fill="url(#c-bot-d)" />
          <polygon points="20,20 2,15 20,39" fill="url(#c-bot-d)" opacity="0.8" />
          <text x="20" y="24" textAnchor="middle" fill="#0d0f1a" fontSize="13" fontWeight="800" fontFamily="system-ui" letterSpacing="-0.5">A</text>
        </svg>
        <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: "white" }}>
          Answer<span style={{ color: "#a5b4fc" }}>Monk</span>
        </span>
      </div>
    </div>
  );
}

export default function LogoA() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8f7ff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 48, fontFamily: "system-ui, -apple-system, sans-serif", padding: 40 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#94a3b8", textTransform: "uppercase", fontWeight: 500 }}>Option A — Chat Bubble</div>

      {/* Light version */}
      <div style={{ background: "white", borderRadius: 20, padding: "40px 56px", boxShadow: "0 4px 40px rgba(99,102,241,0.1)", display: "flex", alignItems: "center", gap: 14 }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="a-grad-l" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <rect x="1" y="1" width="32" height="25" rx="8" fill="url(#a-grad-l)" />
          <path d="M8 26 L5 35 L16 26Z" fill="url(#a-grad-l)" />
          <circle cx="10.5" cy="13.5" r="2.8" fill="white" fillOpacity="0.95" />
          <circle cx="17" cy="13.5" r="2.8" fill="white" fillOpacity="0.95" />
          <circle cx="23.5" cy="13.5" r="2.8" fill="white" fillOpacity="0.95" />
        </svg>
        <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: "#1e1b4b" }}>
          Answer<span style={{ color: "#6366f1" }}>Monk</span>
        </span>
      </div>

      {/* Dark version */}
      <div style={{ background: "#0d0f1a", borderRadius: 20, padding: "40px 56px", display: "flex", alignItems: "center", gap: 14 }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="a-grad-d" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
          <rect x="1" y="1" width="32" height="25" rx="8" fill="url(#a-grad-d)" />
          <path d="M8 26 L5 35 L16 26Z" fill="url(#a-grad-d)" />
          <circle cx="10.5" cy="13.5" r="2.8" fill="#0d0f1a" fillOpacity="0.9" />
          <circle cx="17" cy="13.5" r="2.8" fill="#0d0f1a" fillOpacity="0.9" />
          <circle cx="23.5" cy="13.5" r="2.8" fill="#0d0f1a" fillOpacity="0.9" />
        </svg>
        <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: "white" }}>
          Answer<span style={{ color: "#a78bfa" }}>Monk</span>
        </span>
      </div>
    </div>
  );
}

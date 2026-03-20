export default function LogoD() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8f7ff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 48, fontFamily: "system-ui, -apple-system, sans-serif", padding: 40 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#94a3b8", textTransform: "uppercase", fontWeight: 500 }}>Option D — Monk Silhouette</div>

      {/* Light version */}
      <div style={{ background: "white", borderRadius: 20, padding: "40px 56px", boxShadow: "0 4px 40px rgba(99,102,241,0.1)", display: "flex", alignItems: "center", gap: 14 }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="d-grad-l" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          {/* Rounded square background */}
          <rect width="40" height="40" rx="10" fill="url(#d-grad-l)" />
          {/* Head */}
          <circle cx="20" cy="13" r="5.5" fill="white" fillOpacity="0.95" />
          {/* Robe / body — simple trapezoid */}
          <path d="M11 38 Q11 24 20 24 Q29 24 29 38Z" fill="white" fillOpacity="0.95" />
          {/* Small speech bubble to right */}
          <rect x="25" y="7" width="11" height="8" rx="2.5" fill="white" fillOpacity="0.5" />
          <path d="M26 15 L24 18 L29 15Z" fill="white" fillOpacity="0.5" />
          <circle cx="28" cy="11" r="1" fill="url(#d-grad-l)" />
          <circle cx="31" cy="11" r="1" fill="url(#d-grad-l)" />
          <circle cx="34" cy="11" r="1" fill="url(#d-grad-l)" />
        </svg>
        <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: "#1e1b4b" }}>
          Answer<span style={{ color: "#6366f1" }}>Monk</span>
        </span>
      </div>

      {/* Dark version */}
      <div style={{ background: "#0d0f1a", borderRadius: 20, padding: "40px 56px", display: "flex", alignItems: "center", gap: 14 }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="d-grad-d" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
          <rect width="40" height="40" rx="10" fill="url(#d-grad-d)" />
          <circle cx="20" cy="13" r="5.5" fill="#0d0f1a" fillOpacity="0.9" />
          <path d="M11 38 Q11 24 20 24 Q29 24 29 38Z" fill="#0d0f1a" fillOpacity="0.9" />
          <rect x="25" y="7" width="11" height="8" rx="2.5" fill="#0d0f1a" fillOpacity="0.4" />
          <path d="M26 15 L24 18 L29 15Z" fill="#0d0f1a" fillOpacity="0.4" />
          <circle cx="28" cy="11" r="1" fill="url(#d-grad-d)" />
          <circle cx="31" cy="11" r="1" fill="url(#d-grad-d)" />
          <circle cx="34" cy="11" r="1" fill="url(#d-grad-d)" />
        </svg>
        <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: "white" }}>
          Answer<span style={{ color: "#a78bfa" }}>Monk</span>
        </span>
      </div>
    </div>
  );
}

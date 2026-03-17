import { useState } from "react";

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export function AnalyseButton() {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{
      background: "#0A0F1E", minHeight: "100vh",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "system-ui, sans-serif", gap: 48,
    }}>

      {/* Button in context — on dark bg */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <p style={{ color: "#334155", fontSize: 11, letterSpacing: 2, fontFamily: "monospace" }}>LIVE PREVIEW</p>
        <button
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "12px 24px", borderRadius: 12,
            background: hovered ? "#f1f5f9" : "#ffffff",
            color: "#000000",
            border: "none", cursor: "pointer",
            fontWeight: 600, fontSize: 14,
            boxShadow: "0 0 20px rgba(255,255,255,0.3)",
            transition: "all 0.3s",
          }}
        >
          Analyse Citation Intelligence
          <span style={{ transform: hovered ? "translateX(3px)" : "translateX(0)", transition: "transform 0.3s", display: "flex" }}>
            <ArrowRight />
          </span>
        </button>
        <p style={{ color: "#1e3a5f", fontSize: 10, fontFamily: "monospace" }}>hover to see transition</p>
      </div>

      {/* Code block */}
      <div style={{
        background: "#060f1e", border: "1px solid #1e3a5f",
        borderRadius: 12, padding: "20px 24px", maxWidth: 460,
        fontFamily: "monospace", fontSize: 12, lineHeight: 1.8,
        color: "#64748b",
      }}>
        <p style={{ color: "#334155", fontSize: 10, letterSpacing: 2, marginBottom: 12 }}>TAILWIND CLASSES</p>
        <code style={{ color: "#94a3b8", display: "block" }}>
          <span style={{ color: "#60a5fa" }}>className</span>=<span style={{ color: "#fde68a" }}>"</span>
          <span style={{ color: "#86efac" }}>inline-flex items-center gap-2</span>
          <br />
          <span style={{ color: "#86efac" }}> px-6 py-3 rounded-xl font-semibold</span>
          <br />
          <span style={{ color: "#f9a8d4" }}> bg-white text-black</span>
          <br />
          <span style={{ color: "#c4b5fd" }}> hover:bg-slate-100</span>
          <br />
          <span style={{ color: "#86efac" }}> transition-all duration-300</span>
          <br />
          <span style={{ color: "#fbbf24" }}> shadow-[0_0_20px_rgba(255,255,255,0.3)]</span>
          <span style={{ color: "#fde68a" }}>"</span>
        </code>
      </div>
    </div>
  );
}

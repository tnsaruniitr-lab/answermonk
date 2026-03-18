export function AuroraOrbs() {
  return (
    <div style={{ width: "100%", height: "100%", minHeight: "100vh", position: "relative", background: "#020817", overflow: "hidden" }}>
      <style>{`
        @keyframes orb1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(60px,-80px) scale(1.15); }
          66% { transform: translate(-40px,60px) scale(0.88); }
        }
        @keyframes orb2 {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(-70px,50px) scale(1.1); }
          66% { transform: translate(50px,-40px) scale(0.92); }
        }
        @keyframes orb3 {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(30px,70px) scale(1.2); }
        }
        @keyframes orb4 {
          0%,100% { transform: translate(0,0) scale(1); }
          40% { transform: translate(-50px,-60px) scale(0.85); }
          80% { transform: translate(40px,30px) scale(1.1); }
        }
        .orb { position: absolute; border-radius: 50%; filter: blur(80px); mix-blend-mode: screen; }
      `}</style>

      <div className="orb" style={{ width: 520, height: 520, background: "radial-gradient(circle, rgba(99,102,241,0.55) 0%, transparent 70%)", top: "-80px", left: "10%", animation: "orb1 12s ease-in-out infinite" }} />
      <div className="orb" style={{ width: 480, height: 480, background: "radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)", top: "20%", right: "5%", animation: "orb2 15s ease-in-out infinite" }} />
      <div className="orb" style={{ width: 400, height: 400, background: "radial-gradient(circle, rgba(20,184,166,0.45) 0%, transparent 70%)", bottom: "10%", left: "20%", animation: "orb3 10s ease-in-out infinite" }} />
      <div className="orb" style={{ width: 360, height: 360, background: "radial-gradient(circle, rgba(56,189,248,0.4) 0%, transparent 70%)", bottom: "20%", right: "15%", animation: "orb4 13s ease-in-out infinite" }} />
      <div className="orb" style={{ width: 300, height: 300, background: "radial-gradient(circle, rgba(167,139,250,0.35) 0%, transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", animation: "orb1 18s ease-in-out infinite reverse" }} />

      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 60%, rgba(2,8,23,0.8) 100%)" }} />

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", padding: "0 40px", textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: "#a78bfa", textTransform: "uppercase", marginBottom: 16, padding: "5px 14px", border: "1px solid rgba(167,139,250,0.4)", borderRadius: 20, background: "rgba(167,139,250,0.08)", display: "inline-block" }}>GEO Intelligence Platform</div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 800, color: "#f1f5f9", lineHeight: 1.15, margin: "0 0 20px", maxWidth: 640 }}>
          Dominate <span style={{ color: "#c4b5fd" }}>AI Search</span> Rankings Before Your Competitors Do
        </h1>
        <p style={{ fontSize: 16, color: "#64748b", maxWidth: 480, lineHeight: 1.6, margin: "0 0 36px" }}>
          See exactly why top brands appear in ChatGPT, Gemini & Claude — then outrank them.
        </p>
        <button style={{ padding: "14px 32px", borderRadius: 12, background: "#fff", color: "#020817", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", boxShadow: "0 0 30px rgba(255,255,255,0.2)" }}>
          Start Free Analysis →
        </button>
      </div>
    </div>
  );
}

export function LavenderBand() {
  const stages = [
    { label: "Profile Generated", done: true, active: false },
    { label: "LLM Rankings", done: true, active: false },
    { label: "Authority Domains", done: false, active: true },
    { label: "Action Report", done: false, active: false },
  ];

  return (
    <div
      style={{
        minHeight: "160px",
        background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)",
        display: "flex",
        alignItems: "flex-start",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          background: "linear-gradient(110deg, rgba(237,233,254,0.97) 0%, rgba(238,242,255,0.95) 60%, rgba(236,253,245,0.93) 100%)",
          borderBottom: "1px solid rgba(99,102,241,0.18)",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          gap: 0,
          height: 56,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: 2.5,
            width: "50%",
            background: "linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)",
            borderRadius: "0 2px 0 0",
          }}
        />
        {stages.map((stage, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            {i > 0 && (
              <svg width="20" height="16" viewBox="0 0 20 16" fill="none" style={{ margin: "0 2px" }}>
                <path d="M0 8h16M10 2l8 6-8 6" stroke={stage.done ? "#4f46e5" : "rgba(148,163,184,0.4)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 10px",
                borderRadius: 8,
                cursor: "default",
                ...(stage.active
                  ? { background: "rgba(79,70,229,0.1)", border: "1px solid rgba(79,70,229,0.25)" }
                  : {}),
              }}
            >
              {stage.done ? (
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              ) : stage.active ? (
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #4f46e5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4f46e5", animation: "lavPulse 1.4s ease-in-out infinite" }} />
                </div>
              ) : (
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: "1.5px solid rgba(148,163,184,0.5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(148,163,184,0.4)" }} />
                </div>
              )}
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: stage.active ? 700 : stage.done ? 500 : 400,
                  color: stage.active ? "#4338ca" : stage.done ? "#334155" : "#94a3b8",
                  whiteSpace: "nowrap",
                }}
              >
                {stage.label}
              </span>
            </div>
          </div>
        ))}
        <div style={{ marginLeft: "auto", paddingLeft: 16, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10.5, color: "#6d28d9", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" }}>
            3 of 4 done
          </span>
          <div style={{ width: 48, height: 5, borderRadius: 3, background: "rgba(99,102,241,0.15)", overflow: "hidden" }}>
            <div style={{ width: "75%", height: "100%", background: "linear-gradient(90deg, #4f46e5, #7c3aed)", borderRadius: 3 }} />
          </div>
        </div>
        <style>{`@keyframes lavPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }`}</style>
      </div>
    </div>
  );
}

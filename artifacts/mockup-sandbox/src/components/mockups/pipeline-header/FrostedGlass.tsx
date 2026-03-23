export function FrostedGlass() {
  const stages = [
    { label: "Profile", done: true, active: false },
    { label: "LLM Rank", done: true, active: false },
    { label: "Authority", done: false, active: true },
    { label: "Report", done: false, active: false },
  ];

  return (
    <div
      style={{
        minHeight: "160px",
        background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "20px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(99,102,241,0.22)",
          borderRadius: 14,
          padding: "10px 16px",
          boxShadow: "0 2px 20px rgba(99,102,241,0.13), 0 1px 4px rgba(0,0,0,0.05)",
        }}
      >
        {stages.map((stage, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {i > 0 && (
              <div style={{ width: 24, height: 1, background: stage.done ? "#4f46e5" : "rgba(99,102,241,0.25)" }} />
            )}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 11px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                transition: "all 0.2s",
                ...(stage.done
                  ? { background: "rgba(99,102,241,0.1)", color: "#4f46e5", border: "1px solid rgba(99,102,241,0.2)" }
                  : stage.active
                  ? { background: "#4f46e5", color: "#fff", border: "1px solid #4f46e5", boxShadow: "0 2px 8px rgba(79,70,229,0.35)" }
                  : { background: "transparent", color: "#94a3b8", border: "1px solid rgba(148,163,184,0.3)" }),
              }}
            >
              {stage.done ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="6" fill="#4f46e5" fillOpacity="0.18" />
                  <path d="M3.5 6l1.8 1.8 3.2-3.6" stroke="#4f46e5" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : stage.active ? (
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff", opacity: 0.9, display: "inline-block", animation: "pulse 1.5s infinite" }} />
              ) : (
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(148,163,184,0.5)", display: "inline-block" }} />
              )}
              {stage.label}
              {stage.active && (
                <span style={{ fontSize: 10, opacity: 0.8, fontWeight: 400 }}>…</span>
              )}
            </div>
          </div>
        ))}
        <style>{`@keyframes pulse { 0%,100%{opacity:.9} 50%{opacity:.4} }`}</style>
      </div>
    </div>
  );
}

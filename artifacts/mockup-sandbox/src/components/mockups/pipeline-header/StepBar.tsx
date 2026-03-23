export function StepBar() {
  const stages = [
    { num: 1, label: "Profile", sub: "Brand detected", done: true, active: false },
    { num: 2, label: "LLM Rank", sub: "Rankings done", done: true, active: false },
    { num: 3, label: "Authority", sub: "Scanning citations…", done: false, active: true },
    { num: 4, label: "Report", sub: "Generating", done: false, active: false },
  ];

  return (
    <div
      style={{
        minHeight: "160px",
        background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "24px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0,
          background: "#ffffff",
          border: "1px solid rgba(226,232,240,0.9)",
          borderRadius: 12,
          padding: "12px 20px",
          boxShadow: "0 1px 12px rgba(0,0,0,0.07)",
        }}
      >
        {stages.map((stage, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            {i > 0 && (
              <div
                style={{
                  width: 36,
                  height: 2,
                  background: stage.done
                    ? "linear-gradient(90deg, #4f46e5, #7c3aed)"
                    : stage.active
                    ? "linear-gradient(90deg, #7c3aed, rgba(203,213,225,0.4))"
                    : "rgba(203,213,225,0.5)",
                  margin: "0 4px",
                }}
              />
            )}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    ...(stage.done
                      ? { background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "#fff" }
                      : stage.active
                      ? { background: "#fff", border: "2px solid #4f46e5", color: "#4f46e5" }
                      : { background: "rgba(226,232,240,0.7)", border: "2px solid rgba(203,213,225,0.8)", color: "#94a3b8" }),
                  }}
                >
                  {stage.done ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : stage.active ? (
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4f46e5", animation: "blink 1.2s infinite" }} />
                  ) : (
                    stage.num
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: stage.done ? "#1e293b" : stage.active ? "#4f46e5" : "#94a3b8", lineHeight: 1 }}>
                    {stage.label}
                  </div>
                  <div style={{ fontSize: 10, color: stage.active ? "#7c3aed" : "#94a3b8", marginTop: 2, lineHeight: 1 }}>
                    {stage.sub}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
      </div>
    </div>
  );
}

const STAGES = [
  { id: 1, fullLabel: "Build Brand Profile" },
  { id: 2, fullLabel: "Score LLM Rankings" },
  { id: 3, fullLabel: "Scan Authority Sources" },
  { id: 4, fullLabel: "Draft Action Report" },
];

export function MobileBefore() {
  const activeStage = 2;

  return (
    <div style={{
      width: 375,
      background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)",
      minHeight: 160,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        padding: "10px 16px",
        display: "flex",
        justifyContent: "center",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "92%",
          background: "#ffffff",
          border: "1px solid rgba(226,232,240,0.95)",
          borderRadius: 12,
          padding: "10px 24px",
          boxShadow: "0 1px 16px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}>
          {STAGES.map((s, i) => {
            const done = s.id < activeStage;
            const active = s.id === activeStage;
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center" }}>
                {i > 0 && (
                  <div style={{
                    width: 32, height: 2, margin: "0 6px", borderRadius: 1,
                    background: done
                      ? "linear-gradient(90deg, #4f46e5, #7c3aed)"
                      : active
                      ? "linear-gradient(90deg, #7c3aed, rgba(203,213,225,0.35))"
                      : "rgba(203,213,225,0.5)",
                  }} />
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                    ...(done
                      ? { background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "#fff" }
                      : active
                      ? { background: "#fff", border: "2px solid #4f46e5", color: "#4f46e5" }
                      : { background: "rgba(226,232,240,0.7)", border: "2px solid rgba(203,213,225,0.8)", color: "#94a3b8" }),
                  }}>
                    {done ? (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : active ? (
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4f46e5", display: "block" }} />
                    ) : s.id}
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 600, lineHeight: 1,
                    color: done ? "#1e293b" : active ? "#4f46e5" : "#94a3b8",
                    whiteSpace: "nowrap",
                  }}>
                    {s.fullLabel}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{
        position: "absolute",
        bottom: 12, left: 0, right: 0, textAlign: "center",
        fontSize: 11, color: "#dc2626", fontWeight: 600,
        letterSpacing: "0.04em",
      }}>
        ↑ Labels overflow — "Scan Authority Sources" &amp; "Draft Action Report" cut off
      </div>
    </div>
  );
}

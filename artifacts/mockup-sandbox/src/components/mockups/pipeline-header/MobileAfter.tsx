const STAGES = [
  { id: 1, shortLabel: "Profile",   fullLabel: "Build Brand Profile" },
  { id: 2, shortLabel: "LLM Score", fullLabel: "Score LLM Rankings" },
  { id: 3, shortLabel: "Authority", fullLabel: "Scan Authority Sources" },
  { id: 4, shortLabel: "Report",    fullLabel: "Draft Action Report" },
];

export function MobileAfter() {
  const activeStage = 2;

  return (
    <div style={{
      width: 375,
      background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)",
      minHeight: 160,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      position: "relative",
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
          padding: "10px 16px",
          boxShadow: "0 1px 16px rgba(0,0,0,0.08)",
        }}>
          {STAGES.map((s, i) => {
            const done = s.id < activeStage;
            const active = s.id === activeStage;
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center" }}>
                {i > 0 && (
                  <div style={{
                    width: 20, height: 2, margin: "0 5px", borderRadius: 1,
                    background: done
                      ? "linear-gradient(90deg, #4f46e5, #7c3aed)"
                      : active
                      ? "linear-gradient(90deg, #7c3aed, rgba(203,213,225,0.35))"
                      : "rgba(203,213,225,0.5)",
                  }} />
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700, flexShrink: 0,
                    ...(done
                      ? { background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "#fff" }
                      : active
                      ? { background: "#fff", border: "2px solid #4f46e5", color: "#4f46e5" }
                      : { background: "rgba(226,232,240,0.7)", border: "2px solid rgba(203,213,225,0.8)", color: "#94a3b8" }),
                  }}>
                    {done ? (
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : active ? (
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4f46e5", display: "block" }} />
                    ) : s.id}
                  </div>
                  <div style={{
                    fontSize: 11.5, fontWeight: 600, lineHeight: 1,
                    color: done ? "#1e293b" : active ? "#4f46e5" : "#94a3b8",
                    whiteSpace: "nowrap",
                  }}>
                    {s.shortLabel}
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
        fontSize: 11, color: "#16a34a", fontWeight: 600,
        letterSpacing: "0.04em",
      }}>
        ✓ All 4 steps visible · fits 375px with room to spare
      </div>
    </div>
  );
}

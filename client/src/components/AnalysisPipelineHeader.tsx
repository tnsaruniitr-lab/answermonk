
const STAGES = [
  { id: 1, shortLabel: "Profile", fullLabel: "Build Brand Profile" },
  { id: 2, shortLabel: "LLM Score", fullLabel: "Score LLM Rankings" },
  { id: 3, shortLabel: "Authority", fullLabel: "Scan Authority Sources" },
  { id: 4, shortLabel: "Report", fullLabel: "Draft Action Report" },
];

interface AnalysisPipelineHeaderProps {
  allSegmentsDone: boolean;
  crawlDone: boolean;
  reportDone: boolean;
  profileActive?: boolean;
}

export function AnalysisPipelineHeader({
  allSegmentsDone,
  crawlDone,
  reportDone,
  profileActive = false,
}: AnalysisPipelineHeaderProps) {
  const activeStage = profileActive
    ? 1
    : !allSegmentsDone
    ? 2
    : !crawlDone
    ? 3
    : !reportDone
    ? 4
    : 5;

  const allDone = activeStage > 4;

  const statusText = (stageId: number) => {
    if (stageId < activeStage) return "Complete";
    if (stageId === activeStage) {
      return profileActive ? "Confirm signals" : "Running…";
    }
    return "Waiting";
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: "10px 16px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "transparent",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "min(820px, 92vw)",
          background: "#ffffff",
          border: "1px solid rgba(226,232,240,0.95)",
          borderRadius: 12,
          padding: "10px 24px",
          boxShadow: "0 1px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(226,232,240,0.5)",
          pointerEvents: "auto",
        }}
      >
        {STAGES.map((s, i) => {
          const done = s.id < activeStage;
          const active = s.id === activeStage;

          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && (
                <div
                  style={{
                    width: 32,
                    height: 2,
                    margin: "0 6px",
                    borderRadius: 1,
                    background: done
                      ? "linear-gradient(90deg, #4f46e5, #7c3aed)"
                      : active
                      ? "linear-gradient(90deg, #7c3aed, rgba(203,213,225,0.35))"
                      : "rgba(203,213,225,0.5)",
                    transition: "background 0.5s",
                  }}
                />
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
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
                    flexShrink: 0,
                    transition: "all 0.4s",
                    ...(done
                      ? { background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "#fff" }
                      : active
                      ? { background: "#fff", border: "2px solid #4f46e5", color: "#4f46e5" }
                      : { background: "rgba(226,232,240,0.7)", border: "2px solid rgba(203,213,225,0.8)", color: "#94a3b8" }),
                  }}
                >
                  {done ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : active ? (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#4f46e5",
                        display: "block",
                        animation: "am-blink 1.2s ease-in-out infinite",
                      }}
                    />
                  ) : (
                    s.id
                  )}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      lineHeight: 1,
                      color: done ? "#1e293b" : active ? "#4f46e5" : "#94a3b8",
                      transition: "color 0.4s",
                    }}
                  >
                    {s.shortLabel}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      marginTop: 2,
                      lineHeight: 1,
                      color: active ? "#7c3aed" : "#94a3b8",
                      transition: "color 0.4s",
                    }}
                  >
                    {statusText(s.id)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {allDone && (
          <div
            style={{
              marginLeft: 14,
              paddingLeft: 14,
              borderLeft: "1px solid rgba(226,232,240,0.9)",
              fontSize: 10.5,
              fontWeight: 700,
              color: "#10b981",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            ✓ Complete
          </div>
        )}
      </div>
      <style>{`@keyframes am-blink { 0%,100%{opacity:1} 50%{opacity:0.25} }`}</style>
    </div>
  );
}

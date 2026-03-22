import { useState, useEffect } from "react";

const STAGES = [
  { id: 1, shortLabel: "Profile", fullLabel: "Profile Generated" },
  { id: 2, shortLabel: "LLM Rank", fullLabel: "Calculating LLM Rank" },
  { id: 3, shortLabel: "Authority", fullLabel: "Fetching Authority Domains" },
  { id: 4, shortLabel: "Report", fullLabel: "Generating Action Report" },
];

interface AnalysisPipelineHeaderProps {
  allSegmentsDone: boolean;
  crawlDone: boolean;
  reportDone: boolean;
}

export function AnalysisPipelineHeader({
  allSegmentsDone,
  crawlDone,
  reportDone,
}: AnalysisPipelineHeaderProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((k) => k + 1), 600);
    return () => clearInterval(t);
  }, []);

  const activeStage = !allSegmentsDone
    ? 2
    : !crawlDone
    ? 3
    : !reportDone
    ? 4
    : 5;

  const allDone = activeStage > 4;
  const pulse = tick % 2 === 0;

  const statusText = (stageId: number) => {
    if (stageId < activeStage) return "Complete";
    if (stageId === activeStage) {
      const cycle = tick % 3;
      return cycle === 0 ? "Running…" : cycle === 1 ? "Working…" : "Processing…";
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
        padding: "8px 12px",
        background: "transparent",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          background: "linear-gradient(180deg, #0d1526 0%, #080e1d 100%)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 14,
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          height: 60,
          gap: 8,
          boxShadow: "0 4px 24px rgba(0,0,0,0.65), 0 1px 0 rgba(255,255,255,0.04) inset",
          backdropFilter: "blur(12px)",
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: allDone ? "#10b981" : "#6366f1",
            marginRight: 8,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            flexShrink: 0,
            transition: "color 0.6s",
          }}
        >
          ◈ AM
        </div>

        <div style={{ display: "flex", alignItems: "center", flex: 1, gap: 6 }}>
          {STAGES.map((s, i) => {
            const done = s.id < activeStage;
            const active = s.id === activeStage;

            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <div
                  style={{
                    flex: 1,
                    background: done
                      ? "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.07) 100%)"
                      : active
                      ? `linear-gradient(135deg, rgba(79,70,229,${pulse ? 0.22 : 0.16}) 0%, rgba(109,40,217,0.12) 100%)`
                      : "rgba(255,255,255,0.03)",
                    border: done
                      ? "1px solid rgba(16,185,129,0.3)"
                      : active
                      ? `1px solid rgba(99,102,241,${pulse ? 0.5 : 0.3})`
                      : "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 8,
                    padding: "7px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "border-color 0.4s, background 0.4s",
                    boxShadow: active
                      ? `0 0 12px rgba(99,102,241,${pulse ? 0.18 : 0.08})`
                      : "none",
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      background: done
                        ? "rgba(16,185,129,0.2)"
                        : active
                        ? "rgba(79,70,229,0.3)"
                        : "rgba(255,255,255,0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      color: done ? "#10b981" : active ? "#818cf8" : "#374151",
                      flexShrink: 0,
                    }}
                  >
                    {done ? "✓" : s.id}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 10.5,
                        fontWeight: done ? 500 : active ? 600 : 400,
                        color: done ? "#34d399" : active ? "#e2e8f0" : "#374151",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {s.shortLabel}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        color: done ? "#10b981" : active ? "#6366f1" : "#1f2937",
                        marginTop: 1,
                      }}
                    >
                      {statusText(s.id)}
                    </div>
                  </div>
                </div>
                {i < STAGES.length - 1 && (
                  <div
                    style={{
                      width: 10,
                      height: 1,
                      flexShrink: 0,
                      background: done
                        ? "rgba(16,185,129,0.4)"
                        : "rgba(255,255,255,0.07)",
                      transition: "background 0.6s",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {allDone && (
          <div
            style={{
              marginLeft: 12,
              fontSize: 10,
              color: "#10b981",
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.25)",
              borderRadius: 5,
              padding: "3px 9px",
              fontWeight: 600,
              flexShrink: 0,
              letterSpacing: "0.05em",
            }}
          >
            COMPLETE
          </div>
        )}
      </div>
    </div>
  );
}

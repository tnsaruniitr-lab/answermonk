import { useState, useEffect } from "react";

const stages = [
  { id: 1, label: "Profile Generated", shortLabel: "Profile", icon: "⬡" },
  { id: 2, label: "Calculating LLM Rank", shortLabel: "LLM Rank", icon: "◎" },
  { id: 3, label: "Fetching Authority Domains", shortLabel: "Authority", icon: "◉" },
  { id: 4, label: "Generating Action Report", shortLabel: "Report", icon: "◆" },
];

function ChipHeader({ activeStage }: { activeStage: number }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(k => k + 1), 600);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      background: "linear-gradient(180deg, #0a1020 0%, #070d1a 100%)",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      padding: "0 20px",
      display: "flex",
      alignItems: "center",
      height: 64,
      gap: 8,
    }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: "#6366f1", marginRight: 8, letterSpacing: "0.15em", textTransform: "uppercase", flexShrink: 0 }}>
        ◈ AM
      </div>

      <div style={{ display: "flex", alignItems: "center", flex: 1, gap: 6 }}>
        {stages.map((s, i) => {
          const done = s.id < activeStage;
          const active = s.id === activeStage;
          const pending = s.id > activeStage;
          const pulse = tick % 2 === 0;

          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{
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
                boxShadow: active ? `0 0 12px rgba(99,102,241,${pulse ? 0.18 : 0.08})` : "none",
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 4,
                  background: done ? "rgba(16,185,129,0.2)" : active ? "rgba(79,70,229,0.3)" : "rgba(255,255,255,0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, color: done ? "#10b981" : active ? "#818cf8" : "#374151",
                  flexShrink: 0,
                }}>
                  {done ? "✓" : s.id}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 10.5, fontWeight: done ? 500 : active ? 600 : 400,
                    color: done ? "#34d399" : active ? "#e2e8f0" : "#374151",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {s.shortLabel}
                  </div>
                  <div style={{ fontSize: 9, color: done ? "#10b981" : active ? "#6366f1" : "#1f2937", marginTop: 1 }}>
                    {done ? "Complete" : active ? (tick % 3 === 0 ? "Running…" : tick % 3 === 1 ? "Working…" : "Processing…") : "Waiting"}
                  </div>
                </div>
              </div>
              {i < stages.length - 1 && (
                <div style={{
                  width: 10, height: 1, flexShrink: 0,
                  background: done ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.07)",
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HeaderB() {
  const [active, setActive] = useState(3);
  return (
    <div style={{ background: "#060f1e", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <ChipHeader activeStage={active} />
      <div style={{ padding: "20px 20px", display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[1, 2, 3, 4].map(n => (
          <button key={n} onClick={() => setActive(n)} style={{
            padding: "5px 14px", borderRadius: 6, fontSize: 11, fontWeight: 600,
            background: active === n ? "#4f46e5" : "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", cursor: "pointer",
          }}>Stage {n}</button>
        ))}
        <span style={{ fontSize: 11, color: "#475569", alignSelf: "center", marginLeft: 8 }}>← click to preview stages</span>
      </div>
      <div style={{ padding: "4px 20px 16px", fontSize: 11, color: "#374151" }}>
        Status chips · gradient fill per state · 64px tall · more visual presence
      </div>
    </div>
  );
}

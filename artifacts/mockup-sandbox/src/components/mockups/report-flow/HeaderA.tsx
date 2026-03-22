import { useState, useEffect } from "react";

const stages = [
  { id: 1, label: "Profile Generated", icon: "◈" },
  { id: 2, label: "LLM Rank", icon: "◎" },
  { id: 3, label: "Authority Domains", icon: "◉" },
  { id: 4, label: "Action Report", icon: "◆" },
];

function PipelineHeader({ activeStage }: { activeStage: number }) {
  const [pulse, setPulse] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 900);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      background: "#070d1a",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      padding: "0 28px",
      display: "flex",
      alignItems: "center",
      height: 54,
      gap: 0,
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: "#6366f1", marginRight: 28, letterSpacing: "0.12em", textTransform: "uppercase", flexShrink: 0, fontFamily: "monospace" }}>
        AM /
      </div>

      <div style={{ display: "flex", alignItems: "center", flex: 1, gap: 0 }}>
        {stages.map((s, i) => {
          const done = s.id < activeStage;
          const active = s.id === activeStage;
          const pending = s.id > activeStage;
          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center", flex: i < stages.length - 1 ? 1 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: done ? "#10b981" : active ? "#4f46e5" : "rgba(255,255,255,0.04)",
                  border: pending ? "1px solid rgba(255,255,255,0.12)" : done ? "2px solid #10b981" : `2px solid ${pulse ? "#6366f1" : "#4f46e5"}`,
                  boxShadow: active ? `0 0 ${pulse ? 10 : 6}px rgba(99,102,241,${pulse ? 0.7 : 0.4})` : "none",
                  fontSize: done ? 11 : 10, fontWeight: 700, color: "#fff",
                  transition: "box-shadow 0.4s, border-color 0.4s",
                }}>
                  {done ? "✓" : s.id}
                </div>
                <div style={{
                  fontSize: 11.5,
                  fontWeight: active ? 600 : done ? 500 : 400,
                  color: done ? "#10b981" : active ? "#e2e8f0" : "#374151",
                  whiteSpace: "nowrap",
                  letterSpacing: active ? "0.01em" : 0,
                }}>
                  {s.label}
                  {active && (
                    <span style={{ marginLeft: 5, fontSize: 9, color: "#6366f1", animation: "none", opacity: pulse ? 1 : 0.4, transition: "opacity 0.4s" }}>●</span>
                  )}
                </div>
              </div>
              {i < stages.length - 1 && (
                <div style={{
                  flex: 1, height: 1, margin: "0 14px",
                  background: done
                    ? "linear-gradient(90deg, #10b981, #10b98160)"
                    : "rgba(255,255,255,0.07)",
                  minWidth: 24,
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HeaderA() {
  const [active, setActive] = useState(3);
  return (
    <div style={{ background: "#060f1e", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <PipelineHeader activeStage={active} />
      <div style={{ padding: "20px 28px", display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[1, 2, 3, 4].map(n => (
          <button key={n} onClick={() => setActive(n)} style={{
            padding: "5px 14px", borderRadius: 6, fontSize: 11, fontWeight: 600,
            background: active === n ? "#4f46e5" : "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", cursor: "pointer",
          }}>Stage {n}</button>
        ))}
        <span style={{ fontSize: 11, color: "#475569", alignSelf: "center", marginLeft: 8 }}>← click to preview stages</span>
      </div>
      <div style={{ padding: "4px 28px 16px", fontSize: 11, color: "#374151" }}>
        Minimal pipeline · dot + connecting line · 54px tall · blends into header
      </div>
    </div>
  );
}

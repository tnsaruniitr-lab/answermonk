import { useEffect, useState } from "react";

const STAGES = [
  { id: 1, label: "Profile Generated" },
  { id: 2, label: "LLM Rank" },
  { id: 3, label: "Authority Domains" },
  { id: 4, label: "Action Report" },
];

function PipelineBar({ active }: { active: number }) {
  const [pulse, setPulse] = useState(true);
  useEffect(() => { const t = setInterval(() => setPulse(p => !p), 900); return () => clearInterval(t); }, []);
  return (
    <div style={{ background: "#070d1a", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 18px", display: "flex", alignItems: "center", height: 50, gap: 0, flexShrink: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: "#6366f1", marginRight: 18, letterSpacing: "0.12em", fontFamily: "monospace", flexShrink: 0 }}>AM /</div>
      <div style={{ display: "flex", alignItems: "center", flex: 1, gap: 0 }}>
        {STAGES.map((s, i) => {
          const done = s.id < active, isActive = s.id === active, pending = s.id > active;
          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center", flex: i < 3 ? 1 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                <div style={{ width: 19, height: 19, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: done ? "#10b981" : isActive ? "#4f46e5" : "rgba(255,255,255,0.04)", border: pending ? "1px solid rgba(255,255,255,0.1)" : "none", boxShadow: isActive ? `0 0 ${pulse ? 9 : 5}px rgba(99,102,241,0.6)` : "none", fontSize: 9, fontWeight: 700, color: "#fff", transition: "box-shadow 0.4s" }}>
                  {done ? "✓" : s.id}
                </div>
                <div style={{ fontSize: 10.5, fontWeight: isActive ? 600 : done ? 500 : 400, color: done ? "#10b981" : isActive ? "#e2e8f0" : "#2d3748", whiteSpace: "nowrap" }}>
                  {s.label}{isActive && <span style={{ marginLeft: 4, opacity: pulse ? 1 : 0.3, transition: "opacity 0.4s", color: "#6366f1" }}>●</span>}
                </div>
              </div>
              {i < 3 && <div style={{ flex: 1, height: 1, margin: "0 10px", background: done ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.07)", minWidth: 12 }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AgentCard({ action, label, color }: { action: string; label: string; color: string }) {
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(k => k + 1), 1200); return () => clearInterval(t); }, []);
  const dots = ".".repeat((tick % 3) + 1);
  return (
    <div style={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.06)", borderLeft: `2px solid ${color}`, borderRadius: 8, padding: "10px 14px", marginBottom: 8 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 3 }}>{action}</div>
      <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{label}{dots}</div>
    </div>
  );
}

export function Stage1() {
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(k => k + 1), 700); return () => clearInterval(t); }, []);

  return (
    <div style={{ background: "#060f1e", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "system-ui, sans-serif" }}>
      <PipelineBar active={2} />

      <div style={{ padding: "20px 18px", flex: 1 }}>
        <div style={{ background: "#0d1526", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 14, padding: "18px 16px", boxShadow: "0 0 30px rgba(99,102,241,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", boxShadow: "0 0 8px #6366f1", animation: "none", opacity: tick % 2 === 0 ? 1 : 0.5, transition: "opacity 0.35s" }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", letterSpacing: "0.14em", textTransform: "uppercase" }}>Calculating your LLM Rank</div>
          </div>

          <div style={{ fontSize: 12, color: "#475569", marginBottom: 14, lineHeight: 1.5 }}>
            Running GEO segment analysis · querying ChatGPT, Gemini &amp; Claude
          </div>

          <AgentCard action="ANALYSING" label="AGENT 1 · building source profile" color="#6366f1" />
          <AgentCard action="SCORING" label="AGENT 2 · cross-checking engines" color="#8b5cf6" />
          <AgentCard action="READING" label="AGENT 3 · finalising rank score" color="#a78bfa" />

          <div style={{ marginTop: 14, background: "#060f1e", borderRadius: 8, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 10, color: "#475569" }}>SEGMENTS</div>
              <div style={{ fontSize: 10, color: "#6366f1" }}>4 queued</div>
            </div>
            {["Home nursing services Dubai", "Medical care at home UAE", "Home healthcare provider", "Private nursing Dubai"].map((seg, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: i === 0 ? "#6366f1" : i === 1 ? "#374151" : "#1f2937", flexShrink: 0, boxShadow: i === 0 ? "0 0 6px #6366f1" : "none" }} />
                <div style={{ fontSize: 11, color: i === 0 ? "#94a3b8" : "#2d3748", flex: 1 }}>{seg}</div>
                <div style={{ fontSize: 10, color: i === 0 ? "#6366f1" : "#1f2937" }}>{i === 0 ? "scoring…" : "queued"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

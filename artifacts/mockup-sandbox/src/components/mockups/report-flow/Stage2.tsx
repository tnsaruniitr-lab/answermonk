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

function CollapsedSection({ icon, title, meta, retryable = false }: { icon: string; title: string; meta: string; retryable?: boolean }) {
  return (
    <div style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, marginBottom: 10, cursor: "pointer" }}>
      <div style={{ fontSize: 16, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#e2e8f0" }}>{title}</div>
        <div style={{ fontSize: 10.5, color: "#475569", marginTop: 2 }}>{meta}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 9.5, color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 4, padding: "2px 7px", fontWeight: 600, letterSpacing: "0.05em" }}>DONE</span>
        <span style={{ color: "#4f46e5", fontSize: 14, fontWeight: 300 }}>›</span>
      </div>
    </div>
  );
}

function AgentCard({ action, label, color }: { action: string; label: string; color: string }) {
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(k => k + 1), 1200); return () => clearInterval(t); }, []);
  return (
    <div style={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.06)", borderLeft: `2px solid ${color}`, borderRadius: 8, padding: "10px 14px", marginBottom: 8 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 3 }}>{action}</div>
      <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{label}{".".repeat((tick % 3) + 1)}</div>
    </div>
  );
}

export function Stage2() {
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(k => k + 1), 700); return () => clearInterval(t); }, []);

  return (
    <div style={{ background: "#060f1e", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "system-ui, sans-serif" }}>
      <PipelineBar active={3} />

      <div style={{ padding: "16px 18px", flex: 1 }}>
        <CollapsedSection
          icon="📊"
          title="Rankings · 4 segments analysed"
          meta="Call Doctor 67% · Eureka 31% · Nightingale 24% · Dubai Physio 18%"
        />

        <div style={{ background: "#0d1526", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 14, padding: "16px 16px", boxShadow: "0 0 24px rgba(99,102,241,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#6366f1", boxShadow: "0 0 8px #6366f1", opacity: tick % 2 === 0 ? 1 : 0.4, transition: "opacity 0.35s" }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", letterSpacing: "0.14em", textTransform: "uppercase" }}>Fetching High Authority Domains</div>
          </div>

          <div style={{ fontSize: 11.5, color: "#475569", marginBottom: 14, lineHeight: 1.5 }}>Crawling citation URLs · mapping domain authority profiles</div>

          <AgentCard action="CRAWLING" label="AGENT 1 · mapping authority sources" color="#6366f1" />
          <AgentCard action="INDEXING" label="AGENT 2 · classifying citation patterns" color="#8b5cf6" />
          <AgentCard action="SCORING" label="AGENT 3 · building domain authority graph" color="#a78bfa" />

          <div style={{ marginTop: 12, background: "#060f1e", borderRadius: 8, padding: "9px 12px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 20 }}>
            <div><div style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0" }}>{Math.min(tick * 11, 529)}</div><div style={{ fontSize: 9, color: "#475569" }}>URLS CRAWLED</div></div>
            <div><div style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0" }}>529</div><div style={{ fontSize: 9, color: "#475569" }}>TOTAL URLS</div></div>
            <div><div style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0" }}>{Math.min(Math.floor(tick * 1.4), 187)}</div><div style={{ fontSize: 9, color: "#475569" }}>DOMAINS FOUND</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

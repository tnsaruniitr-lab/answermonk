import { useEffect, useState } from "react";

const PHASES = [
  { label: "CRAWL",    sub: "Domain topology",      color: "#6366f1" },
  { label: "INTEL",    sub: "Web intelligence",      color: "#8b5cf6" },
  { label: "SEGMENT",  sub: "Persona mapping",       color: "#3b82f6" },
  { label: "GEO",      sub: "Footprint scan",        color: "#06b6d4" },
  { label: "SCOUT",    sub: "Competitor rank",       color: "#10b981" },
  { label: "COMPILE",  sub: "Intel brief",           color: "#f59e0b" },
];

const ENGINES = [
  { name: "ChatGPT", color: "#10b981", short: "GPT" },
  { name: "Gemini",  color: "#3b82f6", short: "GEM" },
  { name: "Claude",  color: "#f59e0b", short: "CLU" },
];

const SIGNALS = [
  "WHO IS TRUSTED FOR AT-HOME CARE IN UAE?",
  "TOP BLOOD TEST PROVIDERS DUBAI…",
  "BEST PHYSIOTHERAPY HOME SERVICE ABU DHABI",
  "WHO LEADS POST-SURGERY HOME NURSING?",
  "TRUSTED IV DRIP DELIVERY NEAR ME DUBAI",
];

export function NeuralIntercept() {
  const [activePhase, setActivePhase] = useState(0);
  const [pulseTick, setPulseTick] = useState(0);
  const [engineActive, setEngineActive] = useState(0);
  const [signalIdx, setSignalIdx] = useState(0);
  const [intercepts, setIntercepts] = useState(0);

  useEffect(() => {
    const t1 = setInterval(() => setActivePhase(p => Math.min(p + 1, PHASES.length - 1)), 1400);
    const t2 = setInterval(() => setPulseTick(t => t + 1), 300);
    const t3 = setInterval(() => setEngineActive(e => (e + 1) % 3), 700);
    const t4 = setInterval(() => setSignalIdx(s => (s + 1) % SIGNALS.length), 2200);
    const t5 = setInterval(() => setIntercepts(n => n + Math.floor(Math.random() * 3) + 1), 900);
    return () => { clearInterval(t1); clearInterval(t2); clearInterval(t3); clearInterval(t4); clearInterval(t5); };
  }, []);

  const rings = [72, 56, 40];
  const donePct = Math.round(((activePhase + 1) / PHASES.length) * 100);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050b16",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
    }}>
      <style>{`
        @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes spin-rev  { from{transform:rotate(360deg)} to{transform:rotate(0deg)} }
        @keyframes float-signal { 0%,100%{opacity:0;transform:translateY(0)} 10%,85%{opacity:1} 100%{opacity:0;transform:translateY(-8px)} }
        @keyframes intercept-flash { 0%{opacity:1} 100%{opacity:0} }
        @keyframes pulse-ring { 0%,100%{transform:scale(1);opacity:0.5} 50%{transform:scale(1.08);opacity:1} }
        .ring-a { animation: spin-slow 12s linear infinite; }
        .ring-b { animation: spin-rev 8s linear infinite; }
        .ring-pulse { animation: pulse-ring 2s ease-in-out infinite; }
        .signal-text { animation: float-signal 2.2s ease-in-out infinite; }
      `}</style>

      <div style={{
        width: 580,
        background: "linear-gradient(160deg, #090f1d 0%, #050b16 100%)",
        border: "1px solid rgba(99,102,241,0.2)",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 0 80px rgba(99,102,241,0.12), 0 0 0 1px rgba(255,255,255,0.03), 0 32px 64px rgba(0,0,0,0.7)",
      }}>

        {/* Header */}
        <div style={{
          padding: "14px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(99,102,241,0.04)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              boxShadow: "0 0 20px rgba(99,102,241,0.5)",
            }}>⚡</div>
            <div>
              <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 700, letterSpacing: -0.3 }}>GEO Agent <span style={{ color: "#6366f1" }}>·</span> Active</div>
              <div style={{ color: "#475569", fontSize: 11 }}>analysing feelvaleo.com</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#6366f1", fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{donePct}%</div>
            <div style={{ color: "#334155", fontSize: 9, letterSpacing: 1, marginTop: 2 }}>COMPLETE</div>
          </div>
        </div>

        {/* Central radar */}
        <div style={{ padding: "20px 20px 14px", display: "flex", gap: 20, alignItems: "center" }}>
          <div style={{ position: "relative", width: 160, height: 160, flexShrink: 0 }}>
            {/* Rings */}
            {rings.map((r, i) => (
              <div key={r} className={i === 1 ? "ring-a" : i === 2 ? "ring-b" : "ring-pulse"} style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: r * 2,
                height: r * 2,
                borderRadius: "50%",
                border: `1px solid rgba(99,102,241,${0.15 + i * 0.1})`,
                marginLeft: -r,
                marginTop: -r,
              }}>
                {i === 1 && (
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    width: 5,
                    height: 5,
                    background: "#6366f1",
                    borderRadius: "50%",
                    marginLeft: -2.5,
                    marginTop: -2.5,
                    boxShadow: "0 0 8px #6366f1",
                  }} />
                )}
              </div>
            ))}
            {/* Centre dot */}
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              transform: "translate(-50%,-50%)",
              boxShadow: "0 0 20px rgba(99,102,241,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
            }}>⚡</div>
            {/* Intercepts counter */}
            <div style={{
              position: "absolute",
              bottom: 8,
              left: "50%",
              transform: "translateX(-50%)",
              textAlign: "center",
            }}>
              <div style={{ color: "#6366f1", fontSize: 14, fontWeight: 800 }}>{intercepts}</div>
              <div style={{ color: "#334155", fontSize: 8, letterSpacing: 1 }}>SIGNALS</div>
            </div>
          </div>

          {/* Right: signal + engines */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Live signal */}
            <div style={{
              background: "rgba(99,102,241,0.05)",
              border: "1px solid rgba(99,102,241,0.15)",
              borderRadius: 8,
              padding: "8px 12px",
              marginBottom: 12,
              minHeight: 52,
            }}>
              <div style={{ color: "#334155", fontSize: 8, letterSpacing: 1, marginBottom: 5 }}>INTERCEPTING SIGNAL</div>
              <div className="signal-text" style={{
                color: "#94a3b8",
                fontSize: 10,
                fontFamily: "'JetBrains Mono','Courier New',monospace",
                lineHeight: 1.4,
              }}>
                "{SIGNALS[signalIdx]}"
              </div>
            </div>

            {/* Engine status */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {ENGINES.map((e, i) => (
                <div key={e.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: engineActive === i ? e.color : "rgba(255,255,255,0.08)",
                    boxShadow: engineActive === i ? `0 0 8px ${e.color}` : "none",
                    flexShrink: 0,
                    transition: "all 0.3s",
                  }} />
                  <div style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.04)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: engineActive === i ? "100%" : "0%",
                      background: e.color,
                      borderRadius: 2,
                      transition: "width 0.4s ease",
                      boxShadow: `0 0 6px ${e.color}`,
                    }} />
                  </div>
                  <span style={{ color: engineActive === i ? e.color : "#1e3a5f", fontSize: 9, fontFamily: "monospace", minWidth: 48 }}>
                    {e.name}
                  </span>
                  <span style={{ color: engineActive === i ? e.color : "#1e2d45", fontSize: 8, letterSpacing: 0.5 }}>
                    {engineActive === i ? "QUERYING" : "STANDBY"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phase pipeline */}
        <div style={{ padding: "0 20px 20px" }}>
          <div style={{ color: "#1e3a5f", fontSize: 9, letterSpacing: 1, marginBottom: 10 }}>ANALYSIS PIPELINE</div>
          <div style={{ display: "flex", gap: 0, position: "relative" }}>
            {/* Connector line */}
            <div style={{
              position: "absolute",
              top: 14,
              left: 14,
              right: 14,
              height: 1,
              background: "rgba(255,255,255,0.04)",
              zIndex: 0,
            }}>
              <div style={{
                height: "100%",
                width: `${(activePhase / (PHASES.length - 1)) * 100}%`,
                background: "linear-gradient(90deg, #6366f1, #10b981)",
                transition: "width 1s ease",
              }} />
            </div>

            {PHASES.map((phase, i) => {
              const done = i < activePhase;
              const active = i === activePhase;
              return (
                <div key={phase.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1 }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: done ? "rgba(16,185,129,0.15)" : active ? "rgba(99,102,241,0.2)" : "#070d18",
                    border: `1px solid ${done ? "#10b981" : active ? "#6366f1" : "#1e2d45"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 5,
                    boxShadow: active ? `0 0 14px rgba(99,102,241,0.5)` : "none",
                    transition: "all 0.5s",
                  }}>
                    {done
                      ? <span style={{ color: "#10b981", fontSize: 10 }}>✓</span>
                      : active
                        ? <span style={{ color: "#6366f1", fontSize: 8 }}>▶</span>
                        : <span style={{ color: "#1e2d45", fontSize: 8 }}>·</span>}
                  </div>
                  <div style={{
                    color: done ? "#334155" : active ? "#a5b4fc" : "#1e2d45",
                    fontSize: 8,
                    letterSpacing: 0.5,
                    textAlign: "center",
                    fontWeight: 600,
                    transition: "color 0.5s",
                  }}>{phase.label}</div>
                  <div style={{ color: "#1e2d45", fontSize: 7, textAlign: "center", marginTop: 2 }}>{phase.sub}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

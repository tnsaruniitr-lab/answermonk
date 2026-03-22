import { useEffect, useState, useRef } from "react";

const STEPS = [
  { id: "crawl",    icon: "⬡", label: "Crawling domain structure",     cmd: "crawl --depth=3 --concurrency=20" },
  { id: "intel",    icon: "⬡", label: "Running web intelligence sweep", cmd: "intel.sweep --engines=3" },
  { id: "segments", icon: "⬡", label: "Mapping customer segments",      cmd: "segment.map --persona-mode" },
  { id: "geo",      icon: "⬡", label: "Geographic footprint analysis",  cmd: "geo.footprint --region=UAE" },
  { id: "scout",    icon: "⬡", label: "Scouting competitor landscape",  cmd: "scout.rank --top=10" },
  { id: "compile",  icon: "⬡", label: "Compiling GEO intelligence",     cmd: "compile --format=report" },
];

const ENGINES = [
  { name: "ChatGPT", color: "#10b981" },
  { name: "Gemini",  color: "#3b82f6" },
  { name: "Claude",  color: "#f59e0b" },
];

function useAnimatedSteps() {
  const [progress, setProgress] = useState(0);
  const [activeEngine, setActiveEngine] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t1 = setInterval(() => {
      setProgress(p => {
        if (p >= STEPS.length - 1) return p;
        return p + 1;
      });
    }, 1400);
    const t2 = setInterval(() => setActiveEngine(e => (e + 1) % 3), 600);
    const t3 = setInterval(() => setTick(t => t + 1), 400);
    return () => { clearInterval(t1); clearInterval(t2); clearInterval(t3); };
  }, []);

  return { progress, activeEngine, tick };
}

export function OperatorConsole() {
  const { progress, activeEngine, tick } = useAnimatedSteps();
  const logRef = useRef<HTMLDivElement>(null);
  const [logs, setLogs] = useState<string[]>([
    "$ GEO-AGENT v2.1 initialised",
    "$ connecting to engine cluster…",
    "$ auth: OK · session started",
  ]);

  useEffect(() => {
    const entries = [
      `> [${ENGINES[0].name}] dispatching probe to segment #1`,
      `> [${ENGINES[1].name}] dispatching probe to segment #2`,
      `< [${ENGINES[0].name}] 1.2s · Aster · Mediclinic · Vesta Care`,
      `> [${ENGINES[2].name}] dispatching probe to segment #3`,
      `< [${ENGINES[1].name}] 0.9s · HealthHub · Call Doctor · Eureka`,
      `> [${ENGINES[0].name}] dispatching probe to segment #4`,
      `< [${ENGINES[2].name}] 1.6s · ServiceMarket · Aster · Genex Lab`,
      `> [${ENGINES[1].name}] dispatching probe to segment #5`,
      `< [${ENGINES[0].name}] 2.1s · Nightingale · Medcare · Vesta`,
      `> [${ENGINES[2].name}] dispatching probe to segment #6`,
    ];
    let i = 0;
    const id = setInterval(() => {
      if (i < entries.length) {
        setLogs(prev => [...prev.slice(-12), entries[i]]);
        i++;
      }
    }, 700);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const donePct = Math.round(((progress + 1) / STEPS.length) * 100);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080c14",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    }}>
      <style>{`
        @keyframes blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(400%)} }
        @keyframes glow-pulse { 0%,100%{box-shadow:0 0 8px rgba(99,102,241,0.4)} 50%{box-shadow:0 0 20px rgba(99,102,241,0.8)} }
        .cursor { animation: blink 1s step-end infinite; }
        .active-row { animation: glow-pulse 1.6s ease-in-out infinite; }
      `}</style>

      <div style={{
        width: 580,
        background: "#060a12",
        border: "1px solid #1e2d45",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 0 60px rgba(99,102,241,0.1), 0 24px 48px rgba(0,0,0,0.6)",
      }}>

        {/* Title bar */}
        <div style={{
          background: "#0b1320",
          borderBottom: "1px solid #1e2d45",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <div style={{ display: "flex", gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f56" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#27c93f" }} />
          </div>
          <span style={{ color: "#3b5278", fontSize: 11, marginLeft: 6 }}>geo-agent · operator-console</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
            <span style={{ color: "#10b981", fontSize: 9, letterSpacing: 1.5 }}>LIVE</span>
          </div>
        </div>

        {/* Domain + progress header */}
        <div style={{ padding: "14px 18px 10px", borderBottom: "1px solid #0f1c2e" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <span style={{ color: "#6366f1", fontSize: 10, letterSpacing: 1 }}>GEO AGENT</span>
              <span style={{ color: "#1e3a5f", fontSize: 10, margin: "0 6px" }}>·</span>
              <span style={{ color: "#94a3b8", fontSize: 10 }}>feelvaleo.com</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {ENGINES.map((e, i) => (
                <div key={e.name} style={{
                  display: "flex", alignItems: "center", gap: 4,
                  opacity: activeEngine === i ? 1 : 0.3,
                  transition: "opacity 0.3s",
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: e.color, boxShadow: activeEngine === i ? `0 0 6px ${e.color}` : "none" }} />
                  <span style={{ color: e.color, fontSize: 9, letterSpacing: 0.5 }}>{e.name.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ background: "#0d1929", borderRadius: 3, height: 3, overflow: "hidden", marginBottom: 6 }}>
            <div style={{
              height: "100%",
              width: `${donePct}%`,
              background: "linear-gradient(90deg, #6366f1, #10b981)",
              borderRadius: 3,
              transition: "width 0.8s ease",
              boxShadow: "0 0 10px rgba(99,102,241,0.6)",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#334155", fontSize: 9, letterSpacing: 1 }}>EXECUTION PROGRESS</span>
            <span style={{ color: "#6366f1", fontSize: 9, fontWeight: 700 }}>{donePct}%</span>
          </div>
        </div>

        {/* Steps */}
        <div style={{ padding: "10px 18px" }}>
          {STEPS.map((step, i) => {
            const done = i < progress;
            const active = i === progress;
            return (
              <div
                key={step.id}
                className={active ? "active-row" : ""}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "6px 8px",
                  borderRadius: 6,
                  marginBottom: 2,
                  background: active ? "rgba(99,102,241,0.06)" : "transparent",
                  border: active ? "1px solid rgba(99,102,241,0.2)" : "1px solid transparent",
                  transition: "all 0.3s",
                }}
              >
                <div style={{ marginTop: 1, flexShrink: 0 }}>
                  {done ? (
                    <span style={{ color: "#10b981", fontSize: 12 }}>✓</span>
                  ) : active ? (
                    <span style={{ color: "#6366f1", fontSize: 12 }}>▶</span>
                  ) : (
                    <span style={{ color: "#1e2d45", fontSize: 12 }}>○</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: done ? "#334155" : active ? "#e2e8f0" : "#1e3a5f", fontSize: 11, marginBottom: 1 }}>
                    {step.label}
                    {active && <span className="cursor" style={{ color: "#6366f1", marginLeft: 2 }}>_</span>}
                  </div>
                  <div style={{ color: done ? "#1e2d45" : active ? "#3b5278" : "#0f1c2e", fontSize: 9, fontFamily: "inherit" }}>
                    $ {step.cmd}
                  </div>
                </div>
                {done && (
                  <span style={{ color: "#10b981", fontSize: 9, letterSpacing: 0.5, flexShrink: 0 }}>DONE</span>
                )}
                {active && (
                  <span style={{ color: "#f59e0b", fontSize: 9, letterSpacing: 0.5, flexShrink: 0 }}>EXEC</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Live log */}
        <div style={{ margin: "0 14px 14px", background: "#040810", border: "1px solid #0f1c2e", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "5px 12px", borderBottom: "1px solid #0f1c2e", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#1e3a5f", fontSize: 9, letterSpacing: 1 }}>DISPATCH LOG</span>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 5px #10b981" }} />
          </div>
          <div ref={logRef} style={{ height: 80, overflowY: "auto", scrollbarWidth: "none", padding: "6px 12px" }}>
            {logs.filter(Boolean).map((l, i) => (
              <div key={i} style={{
                fontSize: 9,
                lineHeight: "16px",
                color: l.startsWith("<") ? "#10b981" : l.startsWith(">") ? "#6366f1" : "#334155",
              }}>
                {l}{i === logs.length - 1 && <span className="cursor" style={{ color: "#6366f1" }}>█</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

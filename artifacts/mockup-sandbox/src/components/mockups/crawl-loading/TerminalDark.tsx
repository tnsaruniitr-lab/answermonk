import { useEffect, useState, useRef } from "react";

const DOMAINS = [
  "alaan.com", "pemo.io", "getplutus.com", "spendesk.com", "ramp.com",
  "brex.com", "mercury.com", "divvy.co", "airbase.com", "emburse.com",
  "expensify.com", "concur.com", "navan.com", "paylocity.com", "carta.com",
  "rippling.com", "deel.com", "remote.com", "papaya-global.com", "hibob.com",
];

const CLASSIFS = [
  "Brand Service Page", "Brand Blog / Article", "Directory Listing",
  "Review / Comparison", "Government / Regulatory", "News Article",
  "Third-party Review", "Brand Home Page", "Forum / Community",
];

const PHASES = [
  { id: "discover", label: "Discovering Citations", icon: "◎", color: "#60a5fa" },
  { id: "crawl",   label: "Crawling & Verifying",  icon: "⬡", color: "#a78bfa" },
  { id: "classify", label: "AI Classifying Pages", icon: "✦", color: "#f59e0b" },
  { id: "build",   label: "Building Intelligence", icon: "▲", color: "#34d399" },
];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function useTicker() {
  const [crawled, setCrawled] = useState(120);
  const [ok, setOk]           = useState(98);
  const [failed, setFailed]   = useState(22);
  const [classified, setClassified] = useState(60);
  const [pct, setPct]         = useState(19);
  const [phase, setPhase]     = useState(1);
  const [log, setLog]         = useState<{ domain: string; cls: string; ts: number }[]>([]);
  const tick = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      tick.current += 1;
      const t = tick.current;

      if (t < 80) {
        const add = rand(3, 7);
        setCrawled(c => Math.min(631, c + add));
        setOk(o => Math.min(500, o + rand(2, 5)));
        setFailed(f => f + (t % 9 === 0 ? 1 : 0));
        setClassified(cl => cl + rand(1, 4));
        setPct(p => Math.min(99, p + rand(1, 2)));
        if (t % 4 === 0) {
          const domain = DOMAINS[rand(0, DOMAINS.length - 1)];
          const cls = CLASSIFS[rand(0, CLASSIFS.length - 1)];
          setLog(l => [{ domain, cls, ts: Date.now() }, ...l].slice(0, 6));
        }
        if (t === 40) setPhase(2);
        if (t === 65) setPhase(3);
      }
    }, 200);
    return () => clearInterval(id);
  }, []);

  return { crawled, ok, failed, classified, pct, phase, log };
}

export function TerminalDark() {
  const { crawled, ok, failed, classified, pct, phase, log } = useTicker();
  const current = PHASES[phase] ?? PHASES[1];

  return (
    <div style={{ background: "#080d16", minHeight: "100vh", padding: 0, fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 600, background: "#0b1220", border: "1px solid #1e2d45", borderRadius: 16, overflow: "hidden", boxShadow: "0 0 60px rgba(99,102,241,0.12)" }}>

        {/* Header bar */}
        <div style={{ background: "#0f1929", borderBottom: "1px solid #1e2d45", padding: "14px 20px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f56" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#27c93f" }} />
          </div>
          <span style={{ color: "#475569", fontSize: 12, fontFamily: "monospace", marginLeft: 8 }}>nexalytics — citation-agent</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px #34d399", animation: "pulse 1.4s infinite" }} />
            <span style={{ color: "#34d399", fontSize: 11, fontFamily: "monospace" }}>LIVE</span>
          </div>
        </div>

        <div style={{ padding: "24px 24px 20px" }}>

          {/* Phase indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${current.color}18`, border: `1px solid ${current.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: current.color }}>
              <span style={{ animation: "spin 2s linear infinite", display: "inline-block" }}>{current.icon}</span>
            </div>
            <div>
              <div style={{ color: current.color, fontSize: 13, fontWeight: 600, letterSpacing: 0.5 }}>{current.label}</div>
              <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>
                Phase {phase + 1} of {PHASES.length} · {pct}% complete
              </div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
              {PHASES.map((p, i) => (
                <div key={p.id} style={{ width: 8, height: 8, borderRadius: "50%", background: i <= phase ? p.color : "#1e2d45", transition: "background 0.5s" }} />
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ height: 6, background: "#1e2d45", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${pct}%`,
                background: "linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)",
                borderRadius: 99,
                transition: "width 0.4s ease",
                boxShadow: "0 0 12px #8b5cf670",
                position: "relative",
              }}>
                <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 20, background: "linear-gradient(90deg, transparent, #c4b5fd50)", borderRadius: 99 }} />
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 22 }}>
            {[
              { label: "Crawled", value: crawled, total: 631, color: "#60a5fa" },
              { label: "Accessible", value: ok, color: "#34d399" },
              { label: "Failed", value: failed, color: "#f87171" },
              { label: "Classified", value: classified, color: "#a78bfa" },
            ].map(s => (
              <div key={s.label} style={{ background: "#0f1929", border: "1px solid #1e2d45", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ color: s.color, fontSize: 20, fontWeight: 700, fontFamily: "monospace", lineHeight: 1 }}>
                  {s.value.toLocaleString()}
                  {s.total ? <span style={{ color: "#334155", fontSize: 12 }}>/{s.total}</span> : null}
                </div>
                <div style={{ color: "#475569", fontSize: 11, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Live domain feed */}
          <div style={{ background: "#070c14", border: "1px solid #1a2535", borderRadius: 10, padding: "4px 0", marginBottom: 18 }}>
            <div style={{ padding: "8px 14px 6px", borderBottom: "1px solid #1a2535", display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#6366f1", boxShadow: "0 0 6px #6366f1" }} />
              <span style={{ color: "#475569", fontSize: 11, fontFamily: "monospace" }}>live activity stream</span>
            </div>
            <div style={{ padding: "6px 0" }}>
              {log.length === 0 && (
                <div style={{ padding: "10px 14px", color: "#334155", fontSize: 12, fontFamily: "monospace" }}>Initialising crawler...</div>
              )}
              {log.map((entry, i) => (
                <div key={entry.ts} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "5px 14px",
                  opacity: 1 - i * 0.15,
                  borderBottom: i < log.length - 1 ? "1px solid #0d1726" : "none",
                }}>
                  <span style={{ color: "#334155", fontSize: 10, fontFamily: "monospace", width: 16 }}>›</span>
                  <span style={{ color: "#6366f1", fontSize: 12, fontFamily: "monospace", minWidth: 160 }}>{entry.domain}</span>
                  <span style={{ color: "#374151", fontSize: 11, flex: 1 }}>→</span>
                  <span style={{ color: "#64748b", fontSize: 11 }}>{entry.cls}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Engine badges */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ color: "#334155", fontSize: 11 }}>Scanning engines:</span>
            {[
              { name: "ChatGPT", color: "#10b981" },
              { name: "Gemini", color: "#3b82f6" },
              { name: "Claude",  color: "#f59e0b" },
            ].map(e => (
              <div key={e.name} style={{ display: "flex", alignItems: "center", gap: 5, background: `${e.color}12`, border: `1px solid ${e.color}30`, borderRadius: 6, padding: "3px 10px" }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: e.color, boxShadow: `0 0 5px ${e.color}`, animation: "pulse 1.5s infinite" }} />
                <span style={{ color: e.color, fontSize: 11, fontWeight: 500 }}>{e.name}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

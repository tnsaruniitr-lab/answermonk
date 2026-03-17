import { useEffect, useState, useRef } from "react";

const STREAMS = [
  ["firstresponsehealthcare.com", "cxodx.com", "manzilhealth.com", "aimshealthcare.ae"],
  ["practo.com", "bookimed.com", "healthfinder.ae", "trusteddoctors.ae"],
  ["gulfnews.com", "propertyfinder.ae", "dha.gov.ae", "ridc.ae"],
];

const STATUSES = ["CRAWLING", "RESOLVING", "CLASSIFYING", "INDEXED"];

function rand(a: number, b: number) { return Math.floor(Math.random() * (b - a + 1)) + a; }

function useSimulation() {
  const [pct, setPct] = useState(18);
  const [crawled, setCrawled] = useState(113);
  const [ok, setOk] = useState(91);
  const [classified, setClassified] = useState(55);
  const [activeStreams, setActiveStreams] = useState([0, 1, 2]);
  const [streamDomains, setStreamDomains] = useState(STREAMS.map(s => s[0]));
  const [streamStatus, setStreamStatus] = useState([0, 1, 2]);
  const [phaseLabel, setPhaseLabel] = useState("CRAWLING");
  const tick = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      tick.current++;
      const t = tick.current;
      setPct(p => Math.min(97, p + rand(0, 2)));
      setCrawled(c => Math.min(631, c + rand(3, 6)));
      setOk(o => Math.min(500, o + rand(2, 4)));
      setClassified(cl => cl + rand(1, 3));

      if (t % 5 === 0) {
        setStreamDomains(prev => prev.map((_, i) => {
          const pool = STREAMS[i];
          return pool[rand(0, pool.length - 1)];
        }));
        setStreamStatus(prev => prev.map(() => rand(0, 3)));
      }

      if (t === 30) setPhaseLabel("CLASSIFYING");
      if (t === 55) setPhaseLabel("INDEXING");
    }, 250);
    return () => clearInterval(id);
  }, []);

  return { pct, crawled, ok, classified, streamDomains, streamStatus, phaseLabel };
}

export function MissionControl() {
  const { pct, crawled, ok, classified, streamDomains, streamStatus, phaseLabel } = useSimulation();

  return (
    <div style={{ background: "#040912", minHeight: "100vh", fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 600 }}>

        {/* Top status bar */}
        <div style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: "12px 12px 0 0", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#3b82f6", fontSize: 10, fontFamily: "monospace", letterSpacing: 2 }}>NEXALYTICS GEO</span>
            <span style={{ color: "#1e3a5f", fontSize: 10 }}>·</span>
            <span style={{ color: "#64748b", fontSize: 10, fontFamily: "monospace" }}>CITATION INTELLIGENCE</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#ef4444", animation: "blink 0.8s infinite" }} />
            <span style={{ color: "#ef4444", fontSize: 10, fontFamily: "monospace", letterSpacing: 1 }}>{phaseLabel}</span>
          </div>
        </div>

        {/* Main panel */}
        <div style={{ background: "#060f1e", border: "1px solid #1e3a5f", borderTop: "none", borderRadius: "0 0 12px 12px", padding: 24 }}>

          {/* Central circle + big % */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <div style={{ position: "relative", width: 140, height: 140 }}>
              {/* Outer ring */}
              <svg viewBox="0 0 140 140" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
                <circle cx="70" cy="70" r="62" fill="none" stroke="#1e3a5f" strokeWidth="4" />
                <circle cx="70" cy="70" r="62" fill="none" stroke="#3b82f6" strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 62}`}
                  strokeDashoffset={`${2 * Math.PI * 62 * (1 - pct / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.5s ease", filter: "drop-shadow(0 0 8px #3b82f6)" }}
                />
              </svg>
              {/* Inner ring */}
              <svg viewBox="0 0 140 140" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
                <circle cx="70" cy="70" r="48" fill="none" stroke="#0a1e3a" strokeWidth="2" />
                <circle cx="70" cy="70" r="48" fill="none" stroke="#6366f1" strokeWidth="2"
                  strokeDasharray={`${2 * Math.PI * 48}`}
                  strokeDashoffset={`${2 * Math.PI * 48 * (1 - (classified / 500))}`}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.5s ease", filter: "drop-shadow(0 0 5px #6366f1)" }}
                />
              </svg>
              {/* Center text */}
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ color: "#e2e8f0", fontSize: 28, fontWeight: 700, lineHeight: 1, fontFamily: "monospace" }}>{pct}%</div>
                <div style={{ color: "#3b82f6", fontSize: 10, letterSpacing: 1, marginTop: 4, fontFamily: "monospace" }}>CRAWLED</div>
              </div>
            </div>
          </div>

          {/* 3 stream monitors */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ color: "#334155", fontSize: 10, fontFamily: "monospace", marginBottom: 6, letterSpacing: 1 }}>STREAM {i + 1}</div>
                <div style={{ color: ["#3b82f6", "#6366f1", "#10b981"][i], fontSize: 11, fontFamily: "monospace", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {streamDomains[i]}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: ["#3b82f6","#6366f1","#10b981"][streamStatus[i] % 3], animation: "pulse 1.2s infinite" }} />
                  <span style={{ color: "#475569", fontSize: 10, fontFamily: "monospace" }}>{STATUSES[streamStatus[i]]}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[
              { label: "PAGES FOUND", value: crawled, max: 631, color: "#3b82f6" },
              { label: "ACCESSIBLE", value: ok, max: null, color: "#10b981" },
              { label: "CLASSIFIED", value: classified, max: null, color: "#6366f1" },
            ].map(s => (
              <div key={s.label} style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                <div style={{ color: s.color, fontFamily: "monospace", fontSize: 22, fontWeight: 700, letterSpacing: -1 }}>
                  {s.value}{s.max ? <span style={{ color: "#1e3a5f", fontSize: 14 }}>/{s.max}</span> : null}
                </div>
                <div style={{ color: "#334155", fontSize: 10, fontFamily: "monospace", letterSpacing: 1, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Engine monitor */}
          <div style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, padding: "12px 16px" }}>
            <div style={{ color: "#334155", fontSize: 10, fontFamily: "monospace", letterSpacing: 1, marginBottom: 10 }}>ENGINE COVERAGE</div>
            <div style={{ display: "flex", gap: 16 }}>
              {[
                { name: "ChatGPT", pct: 71, color: "#10b981" },
                { name: "Gemini", pct: 84, color: "#3b82f6" },
                { name: "Claude", pct: 43, color: "#f59e0b" },
              ].map(e => (
                <div key={e.name} style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ color: e.color, fontSize: 11, fontFamily: "monospace" }}>{e.name}</span>
                    <span style={{ color: "#475569", fontSize: 11, fontFamily: "monospace" }}>{e.pct}%</span>
                  </div>
                  <div style={{ height: 3, background: "#1e3a5f", borderRadius: 99 }}>
                    <div style={{ height: "100%", width: `${e.pct}%`, background: e.color, borderRadius: 99, boxShadow: `0 0 6px ${e.color}`, transition: "width 0.4s" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}

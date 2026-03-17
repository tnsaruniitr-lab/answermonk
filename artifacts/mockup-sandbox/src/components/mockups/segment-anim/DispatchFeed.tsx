import { useEffect, useState, useRef } from "react";

const BRAND = "becopital.com";
const SEGMENTS = [
  "seed funding rounds",
  "series A investment",
  "early-stage capital",
  "startup fundraising",
  "venture capital UAE",
  "fintech investment",
];
const ENGINES = ["ChatGPT", "Gemini", "Claude"];
const BRANDS_POOL = ["pemo.io", "spendesk.com", "ramp.com", "airbase.com", "brex.com", "beco.vc", "mamo.io", "ziina.com"];

function ts() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`;
}
function rand(a: number, b: number) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function pick<T>(arr: T[]): T { return arr[rand(0, arr.length - 1)]; }

type LogLine =
  | { kind: "dispatch"; time: string; engine: string; prompt: string; id: number }
  | { kind: "result";   time: string; engine: string; latency: number; brands: string[]; id: number };

const ENGINE_COLORS: Record<string, string> = {
  ChatGPT: "#10b981",
  Gemini: "#3b82f6",
  Claude:  "#f59e0b",
};

export function DispatchFeed() {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [totalDispatched, setTotalDispatched] = useState(0);
  const [totalComplete, setTotalComplete] = useState(0);
  const [totalMentions, setTotalMentions] = useState(0);
  const idRef = useRef(0);
  const pendingRef = useRef<Map<number, LogLine & { kind: "dispatch" }>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dispatchOne = () => {
      const id = ++idRef.current;
      const engine = pick(ENGINES);
      const prompt = `Who are the top platforms for ${pick(SEGMENTS)} in UAE?`;
      const line: LogLine = { kind: "dispatch", time: ts(), engine, prompt, id };
      pendingRef.current.set(id, line as any);
      setLines(prev => [...prev.slice(-30), line]);
      setTotalDispatched(p => p + 1);

      // Simulate response after 1-3s
      const delay = rand(800, 2800);
      setTimeout(() => {
        const brands = Array.from({ length: rand(2, 4) }, () => pick(BRANDS_POOL))
          .filter((v, i, a) => a.indexOf(v) === i);
        const result: LogLine = {
          kind: "result",
          time: ts(),
          engine,
          latency: parseFloat((delay / 1000).toFixed(1)),
          brands,
          id,
        };
        setLines(prev => [...prev.slice(-30), result]);
        setTotalComplete(p => p + 1);
        setTotalMentions(p => p + brands.length);
        pendingRef.current.delete(id);
      }, delay);
    };

    // Fire dispatches at intervals
    const id = setInterval(dispatchOne, 700);
    dispatchOne();
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div style={{ background: "#030b14", minHeight: "100vh", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: 620 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 14 }}>⚡</span>
            </div>
            <div>
              <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>GEO Agent · Prompt Dispatch</div>
              <div style={{ color: "#475569", fontSize: 11 }}>{BRAND} · live engine feed</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i === 0 ? "#10b981" : "#1e3a5f", animation: i === 0 ? "dp-pulse 1s infinite" : undefined }} />
            ))}
          </div>
        </div>

        {/* Counters */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[
            { label: "DISPATCHED", value: totalDispatched, color: "#6366f1" },
            { label: "COMPLETE",   value: totalComplete,   color: "#10b981" },
            { label: "IN FLIGHT",  value: pendingRef.current.size, color: "#f59e0b" },
            { label: "MENTIONS",   value: totalMentions,   color: "#3b82f6" },
          ].map(s => (
            <div key={s.label} style={{ background: "#070f1d", border: "1px solid #1e3a5f", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
              <div style={{ color: s.color, fontSize: 20, fontWeight: 700 }}>{s.value}</div>
              <div style={{ color: "#334155", fontSize: 9, letterSpacing: 1, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Log feed */}
        <div ref={containerRef} style={{ background: "#050d1a", border: "1px solid #1e3a5f", borderRadius: 10, height: 320, overflow: "hidden", position: "relative" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #1e3a5f", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#334155", fontSize: 10, letterSpacing: 1 }}>LIVE DISPATCH LOG</span>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", animation: "dp-pulse 0.8s infinite", marginLeft: "auto" }} />
          </div>
          <div style={{ height: 278, overflowY: "auto", scrollbarWidth: "none" }}>
            {lines.map((line, i) => (
              <div key={`${line.id}-${line.kind}`} style={{ display: "flex", gap: 10, padding: "5px 14px", borderBottom: "1px solid #0a1628", animation: i === lines.length - 1 ? "dp-slide 0.15s ease" : undefined }}>
                <span style={{ color: "#1e3a5f", fontSize: 10, shrink: 0, userSelect: "none", minWidth: 62 }}>{line.time}</span>
                {line.kind === "dispatch" ? (
                  <>
                    <span style={{ color: "#334155", fontSize: 10, minWidth: 4 }}>→</span>
                    <span style={{ color: ENGINE_COLORS[line.engine], fontSize: 10, minWidth: 58 }}>[{line.engine}]</span>
                    <span style={{ color: "#64748b", fontSize: 10, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>"{line.prompt}"</span>
                  </>
                ) : (
                  <>
                    <span style={{ color: "#334155", fontSize: 10, minWidth: 4 }}>←</span>
                    <span style={{ color: ENGINE_COLORS[line.engine], fontSize: 10, minWidth: 58 }}>[{line.engine}]</span>
                    <span style={{ color: "#475569", fontSize: 10 }}>{line.latency}s · </span>
                    <span style={{ color: "#94a3b8", fontSize: 10, flex: 1 }}>{line.brands.join(" · ")}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom segments */}
        <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {SEGMENTS.map((seg, i) => {
            const pct = Math.min(100, Math.round((totalComplete / Math.max(1, totalDispatched)) * 100));
            const done = i < Math.floor(totalComplete / 3);
            return (
              <div key={seg} style={{ display: "flex", alignItems: "center", gap: 6, background: "#070f1d", border: `1px solid ${done ? "#1a4a2e" : "#1e3a5f"}`, borderRadius: 6, padding: "5px 10px" }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: done ? "#10b981" : i === Math.floor(totalComplete / 3) ? "#f59e0b" : "#1e3a5f", animation: i === Math.floor(totalComplete / 3) ? "dp-pulse 1s infinite" : undefined }} />
                <span style={{ color: done ? "#475569" : i === Math.floor(totalComplete / 3) ? "#94a3b8" : "#334155", fontSize: 10 }}>{seg}</span>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes dp-pulse { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes dp-slide { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

import { useEffect, useState } from "react";

const SEGMENTS = [
  { label: "seed funding rounds", prompts: 8 },
  { label: "series A investment", prompts: 8 },
  { label: "early-stage capital", prompts: 8 },
  { label: "startup fundraising", prompts: 6 },
  { label: "venture capital UAE", prompts: 6 },
  { label: "fintech investment",  prompts: 6 },
];

const ENGINES = [
  { name: "ChatGPT",  color: "#10b981", glow: "#10b98130", icon: "🟢" },
  { name: "Gemini",   color: "#3b82f6", glow: "#3b82f630", icon: "🔵" },
  { name: "Claude",   color: "#f59e0b", glow: "#f59e0b30", icon: "🟡" },
];

const TOP_BRANDS = [
  ["pemo.io", "brex.com", "ramp.com", "spendesk.com"],
  ["beco.vc",  "mamo.io",  "ziina.com","airbase.com"],
  ["brex.com", "pemo.io",  "ramp.com", "mamo.io"],
];

function rand(a: number, b: number) { return Math.floor(Math.random() * (b - a + 1)) + a; }

interface EngineState {
  segmentIdx: number;
  promptsDone: number;
  brands: string[];
  latency: number;
}

export function EngineRace() {
  const [engines, setEngines] = useState<EngineState[]>([
    { segmentIdx: 0, promptsDone: 0, brands: [], latency: 0 },
    { segmentIdx: 0, promptsDone: 0, brands: [], latency: 0 },
    { segmentIdx: 0, promptsDone: 0, brands: [], latency: 0 },
  ]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTick(t => t + 1);
      setEngines(prev => prev.map((e, ei) => {
        const seg = SEGMENTS[e.segmentIdx];
        if (!seg) return e;
        const advance = rand(0, 1) === 1;
        if (!advance) return { ...e, latency: e.latency + rand(50, 150) };
        const newDone = e.promptsDone + 1;
        const brand = TOP_BRANDS[ei][rand(0, 3)];
        const newBrands = e.brands.includes(brand) ? e.brands : [...e.brands.slice(-3), brand];
        if (newDone >= seg.prompts) {
          const nextSeg = Math.min(e.segmentIdx + 1, SEGMENTS.length - 1);
          return { segmentIdx: nextSeg, promptsDone: 0, brands: newBrands, latency: rand(600, 1800) };
        }
        return { ...e, promptsDone: newDone, brands: newBrands, latency: e.latency + rand(100, 300) };
      }));
    }, 500);
    return () => clearInterval(id);
  }, []);

  const overallDone = Math.min(...engines.map(e => e.segmentIdx));

  return (
    <div style={{ background: "#030b14", minHeight: "100vh", fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: 640 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#3b82f6,#6366f1)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 14 }}>🏎</span>
            </div>
            <div>
              <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>GEO Agent · Engine Race</div>
              <div style={{ color: "#475569", fontSize: 11 }}>Segment {overallDone + 1} of {SEGMENTS.length} · 3 engines in parallel</div>
            </div>
          </div>
          <div style={{ color: "#334155", fontSize: 10, fontFamily: "monospace" }}>
            {Math.round((overallDone / SEGMENTS.length) * 100)}% complete
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: "#0a1628", borderRadius: 99, marginBottom: 18, overflow: "hidden" }}>
          <div style={{ height: "100%", background: "linear-gradient(90deg,#3b82f6,#6366f1)", borderRadius: 99, width: `${Math.round((overallDone / SEGMENTS.length) * 100)}%`, transition: "width 0.5s ease" }} />
        </div>

        {/* Engine columns */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {ENGINES.map((eng, ei) => {
            const e = engines[ei];
            const seg = SEGMENTS[e.segmentIdx] ?? SEGMENTS[SEGMENTS.length - 1];
            const pct = seg ? Math.round((e.promptsDone / seg.prompts) * 100) : 100;
            const isDone = e.segmentIdx >= SEGMENTS.length - 1 && e.promptsDone >= seg.prompts;

            return (
              <div key={eng.name} style={{ background: "#060f1e", border: `1px solid ${eng.glow.replace("30", "50")}`, borderRadius: 12, overflow: "hidden", boxShadow: `0 0 20px ${eng.glow}` }}>
                {/* Engine header */}
                <div style={{ padding: "10px 14px", borderBottom: `1px solid ${eng.glow.replace("30", "30")}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ color: eng.color, fontSize: 11, fontWeight: 700 }}>{eng.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: isDone ? eng.color : eng.color, animation: isDone ? undefined : "er-pulse 0.9s infinite" }} />
                  </div>
                </div>

                {/* Current segment */}
                <div style={{ padding: "10px 14px" }}>
                  <div style={{ color: "#334155", fontSize: 9, letterSpacing: 1, marginBottom: 6 }}>ACTIVE SEGMENT</div>
                  <div style={{ color: "#94a3b8", fontSize: 10, marginBottom: 10, lineHeight: 1.4 }}>{seg.label}</div>

                  {/* Prompt progress */}
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "#334155", fontSize: 9 }}>prompts</span>
                    <span style={{ color: eng.color, fontSize: 9 }}>{e.promptsDone}/{seg.prompts}</span>
                  </div>
                  <div style={{ height: 2, background: "#0a1628", borderRadius: 99, marginBottom: 12, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: eng.color, borderRadius: 99, width: `${pct}%`, transition: "width 0.4s ease", boxShadow: `0 0 6px ${eng.color}` }} />
                  </div>

                  {/* Latency */}
                  <div style={{ color: "#1e3a5f", fontSize: 9, marginBottom: 10 }}>{(e.latency / 1000).toFixed(1)}s elapsed</div>

                  {/* Brands found */}
                  <div style={{ color: "#334155", fontSize: 9, letterSpacing: 1, marginBottom: 6 }}>BRANDS FOUND</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {e.brands.length === 0 ? (
                      <div style={{ color: "#1e3a5f", fontSize: 10 }}>scanning…</div>
                    ) : e.brands.map((b, bi) => (
                      <div key={b + bi} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 3, height: 3, borderRadius: "50%", background: eng.color, flexShrink: 0 }} />
                        <span style={{ color: bi === 0 ? "#e2e8f0" : "#475569", fontSize: 10 }}>{b}</span>
                        {bi === 0 && <span style={{ color: eng.color, fontSize: 9, marginLeft: "auto" }}>#1</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Segment queue */}
                <div style={{ borderTop: "1px solid #0a1628", padding: "8px 14px" }}>
                  <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                    {SEGMENTS.map((_, si) => (
                      <div key={si} style={{
                        width: 8, height: 8, borderRadius: 2,
                        background: si < e.segmentIdx ? eng.color :
                                    si === e.segmentIdx ? eng.color :
                                    "#0a1628",
                        opacity: si < e.segmentIdx ? 0.7 : 1,
                        border: `1px solid ${si <= e.segmentIdx ? eng.color : "#1e3a5f"}`,
                        animation: si === e.segmentIdx ? "er-pulse 1s infinite" : undefined,
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Segments list */}
        <div style={{ marginTop: 14, background: "#060f1e", border: "1px solid #1e3a5f", borderRadius: 10, overflow: "hidden" }}>
          {SEGMENTS.map((seg, si) => {
            const allDone = engines.every(e => e.segmentIdx > si);
            const anyActive = engines.some(e => e.segmentIdx === si);
            return (
              <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 14px", borderBottom: si < SEGMENTS.length - 1 ? "1px solid #0a1628" : undefined }}>
                <div style={{
                  width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                  background: allDone ? "#10b981" : anyActive ? "#f59e0b" : "#1e3a5f",
                  animation: anyActive ? "er-pulse 0.8s infinite" : undefined,
                }} />
                <span style={{ color: allDone ? "#475569" : anyActive ? "#e2e8f0" : "#334155", fontSize: 11, flex: 1 }}>{seg.label}</span>
                {anyActive && (
                  <div style={{ display: "flex", gap: 4 }}>
                    {engines.map((eng, ei) => engines[ei].segmentIdx === si ? (
                      <span key={eng.name} style={{ color: eng.color, fontSize: 9, background: eng.glow.replace("30","20"), padding: "2px 6px", borderRadius: 4 }}>
                        {eng.name.slice(0,3).toUpperCase()}
                      </span>
                    ) : null)}
                  </div>
                )}
                {allDone && <span style={{ color: "#10b981", fontSize: 11 }}>✓</span>}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes er-pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
      `}</style>
    </div>
  );
}

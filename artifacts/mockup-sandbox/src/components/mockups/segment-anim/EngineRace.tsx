import { useEffect, useState } from "react";

const SEGMENTS = [
  { label: "seed funding rounds", prompts: 8 },
  { label: "series A investment", prompts: 8 },
  { label: "early-stage capital", prompts: 8 },
  { label: "startup fundraising", prompts: 6 },
  { label: "venture capital UAE", prompts: 6 },
  { label: "fintech investment", prompts: 6 },
];

const ENGINES = [
  { name: "ChatGPT", color: "#10b981", dim: "#10b98122", border: "#10b98144" },
  { name: "Gemini",  color: "#3b82f6", dim: "#3b82f622", border: "#3b82f644" },
  { name: "Claude",  color: "#f59e0b", dim: "#f59e0b22", border: "#f59e0b44" },
];

const BRAND_POOLS = [
  ["pemo.io", "brex.com", "ramp.com", "spendesk.com"],
  ["beco.vc",  "mamo.io",  "ziina.com", "airbase.com"],
  ["brex.com", "pemo.io",  "ramp.com",  "mamo.io"],
];

function rand(a: number, b: number) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

interface EngineState {
  segmentIdx: number;
  promptsDone: number;
  brands: string[];
  ms: number;
}

function SegmentDots({ total, active, done, color }: { total: number; active: number; done: number; color: string }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {Array.from({ length: total }, (_, i) => {
        const isActive = i === active;
        const isDone = i < done;
        return (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: isDone ? color : isActive ? color : "#0a1628",
              opacity: isDone ? 0.5 : 1,
              border: `1px solid ${isDone || isActive ? color : "#1e3a5f"}`,
            }}
          />
        );
      })}
    </div>
  );
}

export function EngineRace() {
  const [engines, setEngines] = useState<EngineState[]>([
    { segmentIdx: 0, promptsDone: 0, brands: [], ms: 0 },
    { segmentIdx: 0, promptsDone: 0, brands: [], ms: 0 },
    { segmentIdx: 0, promptsDone: 0, brands: [], ms: 0 },
  ]);

  useEffect(() => {
    const id = setInterval(() => {
      setEngines(prev =>
        prev.map((e, ei) => {
          const maxSeg = SEGMENTS.length - 1;
          const seg = SEGMENTS[Math.min(e.segmentIdx, maxSeg)];
          const shouldAdvance = rand(0, 1) === 1;

          if (!shouldAdvance) {
            return { ...e, ms: e.ms + rand(50, 200) };
          }

          const newDone = e.promptsDone + 1;
          const brandName = BRAND_POOLS[ei][rand(0, BRAND_POOLS[ei].length - 1)];
          const newBrands = e.brands.includes(brandName)
            ? e.brands
            : [...e.brands.slice(-3), brandName];

          if (newDone >= seg.prompts) {
            const nextIdx = Math.min(e.segmentIdx + 1, maxSeg);
            return { segmentIdx: nextIdx, promptsDone: 0, brands: newBrands, ms: rand(400, 1200) };
          }

          return { ...e, promptsDone: newDone, brands: newBrands, ms: e.ms + rand(100, 350) };
        })
      );
    }, 480);
    return () => clearInterval(id);
  }, []);

  const slowestSeg = Math.min(...engines.map(e => e.segmentIdx));
  const overallPct = Math.round((slowestSeg / SEGMENTS.length) * 100);

  return (
    <div
      style={{
        background: "#030b14",
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ width: 640 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                background: "linear-gradient(135deg,#3b82f6,#6366f1)",
                borderRadius: 9,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
              }}
            >
              🏎
            </div>
            <div>
              <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>GEO Agent · Engine Race</div>
              <div style={{ color: "#475569", fontSize: 11 }}>
                Segment {slowestSeg + 1} of {SEGMENTS.length} · 3 engines in parallel
              </div>
            </div>
          </div>
          <div style={{ color: "#334155", fontSize: 10, fontFamily: "monospace" }}>{overallPct}% complete</div>
        </div>

        {/* Overall progress bar */}
        <div style={{ height: 3, background: "#0a1628", borderRadius: 99, marginBottom: 16, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              background: "linear-gradient(90deg,#3b82f6,#6366f1)",
              borderRadius: 99,
              width: `${overallPct}%`,
              transition: "width 0.6s ease",
            }}
          />
        </div>

        {/* Engine columns */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
          {ENGINES.map((eng, ei) => {
            const e = engines[ei];
            const segIdx = Math.min(e.segmentIdx, SEGMENTS.length - 1);
            const seg = SEGMENTS[segIdx];
            const pct = seg.prompts > 0 ? Math.round((e.promptsDone / seg.prompts) * 100) : 100;

            return (
              <div
                key={eng.name}
                style={{
                  background: "#060f1e",
                  border: `1px solid ${eng.border}`,
                  borderRadius: 12,
                  overflow: "hidden",
                  boxShadow: `0 0 18px ${eng.dim}`,
                }}
              >
                {/* Engine header */}
                <div
                  style={{
                    padding: "10px 14px",
                    borderBottom: `1px solid ${eng.dim}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ color: eng.color, fontSize: 11, fontWeight: 700 }}>{eng.name}</span>
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: eng.color,
                      boxShadow: `0 0 6px ${eng.color}`,
                    }}
                  />
                </div>

                {/* Body */}
                <div style={{ padding: "10px 14px" }}>
                  <div style={{ color: "#334155", fontSize: 9, letterSpacing: 1, marginBottom: 5 }}>ACTIVE SEGMENT</div>
                  <div style={{ color: "#94a3b8", fontSize: 10, marginBottom: 10, lineHeight: 1.4 }}>{seg.label}</div>

                  {/* Prompt progress */}
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "#334155", fontSize: 9 }}>prompts</span>
                    <span style={{ color: eng.color, fontSize: 9 }}>{e.promptsDone}/{seg.prompts}</span>
                  </div>
                  <div style={{ height: 2, background: "#0a1628", borderRadius: 99, marginBottom: 10, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        background: eng.color,
                        borderRadius: 99,
                        width: `${pct}%`,
                        transition: "width 0.4s ease",
                        boxShadow: `0 0 6px ${eng.color}`,
                      }}
                    />
                  </div>

                  <div style={{ color: "#1e3a5f", fontSize: 9, marginBottom: 10 }}>
                    {(e.ms / 1000).toFixed(1)}s elapsed
                  </div>

                  {/* Brands */}
                  <div style={{ color: "#334155", fontSize: 9, letterSpacing: 1, marginBottom: 6 }}>BRANDS FOUND</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {e.brands.length === 0 ? (
                      <div style={{ color: "#1e3a5f", fontSize: 10 }}>scanning…</div>
                    ) : (
                      e.brands.map((b, bi) => (
                        <div key={`${b}-${bi}`} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div
                            style={{ width: 3, height: 3, borderRadius: "50%", background: eng.color, flexShrink: 0 }}
                          />
                          <span style={{ color: bi === 0 ? "#e2e8f0" : "#475569", fontSize: 10 }}>{b}</span>
                          {bi === 0 && (
                            <span style={{ color: eng.color, fontSize: 9, marginLeft: "auto" }}>#1</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Segment dots */}
                <div style={{ borderTop: "1px solid #0a1628", padding: "8px 14px" }}>
                  <SegmentDots
                    total={SEGMENTS.length}
                    active={e.segmentIdx}
                    done={e.segmentIdx}
                    color={eng.color}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Segment list */}
        <div style={{ background: "#060f1e", border: "1px solid #1e3a5f", borderRadius: 10, overflow: "hidden" }}>
          {SEGMENTS.map((seg, si) => {
            const allDone = engines.every(e => e.segmentIdx > si);
            const anyActive = engines.some(e => e.segmentIdx === si);
            const activeEngines = ENGINES.filter((_, ei) => engines[ei].segmentIdx === si);

            return (
              <div
                key={seg.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 14px",
                  borderBottom: si < SEGMENTS.length - 1 ? "1px solid #0a1628" : "none",
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: allDone ? "#10b981" : anyActive ? "#f59e0b" : "#1e3a5f",
                  }}
                />
                <span
                  style={{
                    color: allDone ? "#475569" : anyActive ? "#e2e8f0" : "#334155",
                    fontSize: 11,
                    flex: 1,
                  }}
                >
                  {seg.label}
                </span>
                {anyActive && (
                  <div style={{ display: "flex", gap: 4 }}>
                    {activeEngines.map(eng => (
                      <span
                        key={eng.name}
                        style={{
                          color: eng.color,
                          fontSize: 9,
                          background: eng.dim,
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        {eng.name.slice(0, 3).toUpperCase()}
                      </span>
                    ))}
                  </div>
                )}
                {allDone && <span style={{ color: "#10b981", fontSize: 11 }}>✓</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

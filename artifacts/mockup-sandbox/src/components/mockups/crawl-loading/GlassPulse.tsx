import { useEffect, useState, useRef } from "react";

const DOMAINS_POOL = [
  { d: "alaan.com", t: "Brand", c: "#818cf8" },
  { d: "practo.com", t: "Directory", c: "#34d399" },
  { d: "gulfnews.com", t: "News", c: "#fb923c" },
  { d: "dha.gov.ae", t: "Gov", c: "#38bdf8" },
  { d: "getplutus.com", t: "Brand", c: "#818cf8" },
  { d: "healthfinder.ae", t: "Review", c: "#f472b6" },
  { d: "trusteddoctors.ae", t: "Directory", c: "#34d399" },
  { d: "manzilhealth.com", t: "Brand", c: "#818cf8" },
  { d: "bookimed.com", t: "Review", c: "#f472b6" },
  { d: "nmc.ae", t: "Brand", c: "#818cf8" },
];

function rand(a: number, b: number) { return Math.floor(Math.random() * (b - a + 1)) + a; }

function useSim() {
  const [pct, setPct] = useState(22);
  const [crawled, setCrawled] = useState(140);
  const [ok, setOk] = useState(112);
  const [phase, setPhase] = useState(0);
  const [bubbles, setBubbles] = useState(DOMAINS_POOL.slice(0, 5));
  const tick = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      tick.current++;
      const t = tick.current;
      setPct(p => Math.min(97, p + rand(0, 2)));
      setCrawled(c => Math.min(631, c + rand(3, 7)));
      setOk(o => Math.min(500, o + rand(2, 4)));
      if (t % 6 === 0) {
        const next = [...DOMAINS_POOL].sort(() => 0.5 - Math.random()).slice(0, 5);
        setBubbles(next);
      }
      if (t === 35) setPhase(1);
      if (t === 60) setPhase(2);
    }, 220);
    return () => clearInterval(id);
  }, []);

  return { pct, crawled, ok, phase, bubbles };
}

const PHASE_INFO = [
  { label: "Crawling Citation Sources", sub: "Verifying URLs across all scoring runs", color: "#818cf8" },
  { label: "AI Page Classification", sub: "Claude is reading & categorising each domain", color: "#f472b6" },
  { label: "Building Domain Graph", sub: "Ranking authority sources by citation weight", color: "#34d399" },
];

export function GlassPulse() {
  const { pct, crawled, ok, phase, bubbles } = useSim();
  const info = PHASE_INFO[phase];

  return (
    <div style={{
      background: "linear-gradient(135deg, #0f0a2e 0%, #0a0f2e 40%, #080d1e 100%)",
      minHeight: "100vh",
      fontFamily: "system-ui, sans-serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* Background glows */}
      <div style={{ position: "absolute", top: "15%", left: "20%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, #6366f140 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "15%", width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, #8b5cf640 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ width: 580, position: "relative", zIndex: 1 }}>

        {/* Frosted glass main card */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: 28,
          boxShadow: "0 8px 80px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}>

          {/* Top row: phase */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            {/* Pulsing ring icon */}
            <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${info.color}60`, animation: "ringPulse 1.8s infinite" }} />
              <div style={{ position: "absolute", inset: 6, borderRadius: "50%", background: `${info.color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: info.color, boxShadow: `0 0 10px ${info.color}` }} />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 600, marginBottom: 2, transition: "all 0.4s" }}>{info.label}</div>
              <div style={{ color: "#64748b", fontSize: 12 }}>{info.sub}</div>
            </div>
            <div style={{ background: `${info.color}18`, border: `1px solid ${info.color}40`, borderRadius: 20, padding: "4px 12px" }}>
              <span style={{ color: info.color, fontSize: 12, fontWeight: 600 }}>Phase {phase + 1}/3</span>
            </div>
          </div>

          {/* Gradient progress bar */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#64748b", fontSize: 12 }}>{crawled} of 631 URLs processed</span>
              <span style={{ color: info.color, fontSize: 12, fontWeight: 600 }}>{pct}%</span>
            </div>
            <div style={{ height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{
                height: "100%",
                width: `${pct}%`,
                background: `linear-gradient(90deg, #6366f1, ${info.color})`,
                borderRadius: 99,
                transition: "width 0.5s ease",
                boxShadow: `0 0 16px ${info.color}60`,
                position: "relative",
              }}>
                {/* shimmer */}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", borderRadius: 99 }} />
              </div>
            </div>
          </div>

          {/* Two stat pills */}
          <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
            {[
              { label: "Pages Reached", value: ok, icon: "✓", color: "#34d399" },
              { label: "Crawl Efficiency", value: `${Math.round(ok / Math.max(crawled, 1) * 100)}%`, icon: "⚡", color: "#f59e0b" },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
                <div style={{ color: s.color, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{s.icon} {s.value}</div>
                <div style={{ color: "#475569", fontSize: 11 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Bubble domain tags */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: "#334155", fontSize: 11, marginBottom: 10 }}>Recently classified</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {bubbles.map((b, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: `${b.c}10`, border: `1px solid ${b.c}30`,
                  borderRadius: 20, padding: "4px 12px",
                  animation: "fadeIn 0.4s ease",
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: b.c }} />
                  <span style={{ color: "#94a3b8", fontSize: 12 }}>{b.d}</span>
                  <span style={{ color: b.c, fontSize: 10, opacity: 0.8 }}>{b.t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ color: "#334155", fontSize: 12 }}>Claude Sonnet 4.5 on deck</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["ChatGPT", "Gemini", "Claude"].map((e, i) => (
                <div key={e} style={{
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 6, padding: "3px 10px",
                  animation: `pulse ${1.2 + i * 0.3}s infinite`,
                }}>
                  <span style={{ color: "#475569", fontSize: 11 }}>{e}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes ringPulse {
          0% { transform: scale(1); opacity: 1 }
          70% { transform: scale(1.5); opacity: 0 }
          100% { transform: scale(1.5); opacity: 0 }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0 }
          100% { background-position: 200% 0 }
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

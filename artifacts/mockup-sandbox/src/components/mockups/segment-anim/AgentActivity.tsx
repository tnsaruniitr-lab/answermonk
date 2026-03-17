import { useEffect, useState, useRef } from "react";

const BRAND = "becopital.com";
const SERVICES = ["Seed Funding", "Series A", "Early-Stage Capital", "Fintech Investment", "VC Syndication"];
const COMPETITORS = ["pemo.io", "brex.com", "ramp.com", "spendesk.com", "mamo.io"];

type Step = {
  id: number;
  icon: string;
  title: string;
  detail: string;
  state: "done" | "running" | "queued";
  sub?: string[];
};

const STEP_SCRIPTS: Array<{ icon: string; title: string; detail: (brand: string) => string; subs?: string[] }> = [
  { icon: "🔍", title: "Reading website", detail: () => `Extracting content from ${BRAND}…`, subs: ["Found 14 pages", "Identified product copy", "Located pricing signals"] },
  { icon: "🧠", title: "AI reasoning on service model", detail: () => "Classifying business type with LLM reasoning…", subs: ["B2B SaaS · Fintech · UAE", `${SERVICES.length} service categories found`] },
  { icon: "✏️", title: "Writing prompt network", detail: (b) => `Generating search prompts for ${b}…`, subs: ["48 prompts drafted", "3 engines × 16 prompts each", "Targeting 6 buyer segments"] },
  { icon: "🚀", title: "Dispatching to ChatGPT · Gemini · Claude", detail: () => "Running prompts in parallel across all engines…", subs: ["ChatGPT: 16 prompts sent", "Gemini: 16 prompts sent", "Claude: 16 prompts sent"] },
  { icon: "📊", title: "Scoring brand visibility", detail: () => "Aggregating mentions, rank positions, and share of voice…", subs: [`${BRAND}: 23% share of voice`, `Top competitor: ${COMPETITORS[0]}`, "Ranked #2 in 5 of 6 segments"] },
  { icon: "🏆", title: "Benchmarking competitors", detail: () => "Comparing against detected competitor landscape…", subs: [`${COMPETITORS.slice(0,3).join(" · ")} detected`, "Gap analysis complete", "Citation patterns mapped"] },
  { icon: "📋", title: "Compiling GEO Intelligence Report", detail: () => "Building structured report with recommendations…", subs: [] },
];

function TypedText({ text, speed = 18 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      setDisplayed(text.slice(0, ++i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text]);
  return <>{displayed}</>;
}

export function AgentActivity() {
  const [steps, setSteps] = useState<Step[]>(
    STEP_SCRIPTS.map((s, i) => ({
      id: i,
      icon: s.icon,
      title: s.title,
      detail: s.detail(BRAND),
      state: i === 0 ? "running" : "queued",
      sub: [],
    }))
  );
  const [subReveal, setSubReveal] = useState<Record<number, number>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);

  useEffect(() => {
    const advance = () => {
      const idx = activeRef.current;
      const script = STEP_SCRIPTS[idx];
      const subs = script.subs ?? [];
      const subCount = subReveal[idx] ?? 0;

      if (subCount < subs.length) {
        // Reveal next sub-line
        setTimeout(() => {
          setSubReveal(prev => ({ ...prev, [idx]: subCount + 1 }));
          advance();
        }, 600 + subCount * 300);
      } else {
        // Move to next step
        const nextIdx = idx + 1;
        if (nextIdx < STEP_SCRIPTS.length) {
          setTimeout(() => {
            activeRef.current = nextIdx;
            setSteps(prev => prev.map((s, i) => ({
              ...s,
              state: i < nextIdx ? "done" : i === nextIdx ? "running" : "queued",
            })));
            advance();
          }, 900);
        }
      }
    };
    advance();
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [steps, subReveal]);

  const runningStep = steps.find(s => s.state === "running");

  return (
    <div style={{ background: "#080c14", minHeight: "100vh", fontFamily: "system-ui,-apple-system,sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: 560 }}>
        {/* Agent card */}
        <div style={{ background: "#0e1623", border: "1px solid #1e2d44", borderRadius: 16, overflow: "hidden", boxShadow: "0 0 40px #6366f115" }}>
          {/* Header */}
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #1e2d44", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <span style={{ fontSize: 18 }}>✦</span>
              <div style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: "50%", background: "#10b981", border: "2px solid #0e1623", animation: "aa-pulse 1s infinite" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>GEO Agent · Computing Report</div>
              <div style={{ color: "#6366f1", fontSize: 11 }}>building prompt network for {BRAND}</div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "#1e3a5f" }} />)}
            </div>
          </div>

          {/* Steps feed */}
          <div ref={containerRef} style={{ padding: "14px 18px", maxHeight: 380, overflowY: "auto", scrollbarWidth: "none" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {steps.map((step) => {
                const isDone = step.state === "done";
                const isRunning = step.state === "running";
                const isQueued = step.state === "queued";
                const revealed = subReveal[step.id] ?? 0;
                const subs = STEP_SCRIPTS[step.id].subs ?? [];

                return (
                  <div key={step.id} style={{ opacity: isQueued ? 0.4 : 1, transition: "opacity 0.3s" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
                      {/* Status indicator */}
                      <div style={{ width: 20, height: 20, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {isDone ? (
                          <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#1a3a28", border: "1px solid #10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ color: "#10b981", fontSize: 9, lineHeight: 1 }}>✓</span>
                          </div>
                        ) : isRunning ? (
                          <div style={{ width: 14, height: 14, border: "2px solid #6366f1", borderTopColor: "transparent", borderRadius: "50%", animation: "aa-spin 0.7s linear infinite" }} />
                        ) : (
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#1e3a5f" }} />
                        )}
                      </div>

                      {/* Icon */}
                      <span style={{ fontSize: 13 }}>{step.icon}</span>

                      {/* Text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {isDone ? (
                          <span style={{ color: "#64748b", fontSize: 12 }}>{step.title}</span>
                        ) : isRunning ? (
                          <span style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 500 }}>
                            <TypedText text={step.detail} speed={22} />
                          </span>
                        ) : (
                          <span style={{ color: "#334155", fontSize: 12 }}>{step.title}</span>
                        )}
                      </div>
                    </div>

                    {/* Sub-lines for active/done steps */}
                    {(isDone || isRunning) && subs.length > 0 && (
                      <div style={{ marginLeft: 30, marginBottom: 4 }}>
                        {subs.slice(0, isDone ? subs.length : revealed).map((sub, si) => (
                          <div key={si} style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0" }}>
                            <div style={{ width: 3, height: 3, borderRadius: "50%", background: isDone ? "#1e4a30" : "#6366f160", flexShrink: 0 }} />
                            <span style={{ color: isDone ? "#334155" : "#6366f1", fontSize: 11 }}>
                              {!isDone && si === revealed - 1 ? <TypedText text={sub} speed={25} /> : sub}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: "10px 18px", borderTop: "1px solid #1e2d44", background: "#0a1220" }}>
            <p style={{ color: "#334155", fontSize: 10, textAlign: "center", fontFamily: "monospace" }}>
              {runningStep ? `${steps.filter(s => s.state === "done").length} of ${steps.length} steps complete · scoring fires in background` : "Scoring complete · building your report…"}
            </p>
          </div>
        </div>

        {/* Context chips */}
        <div style={{ marginTop: 12, display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
          {SERVICES.map(s => (
            <span key={s} style={{ background: "#0e1623", border: "1px solid #1e2d44", color: "#475569", fontSize: 10, padding: "4px 10px", borderRadius: 99 }}>{s}</span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes aa-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes aa-spin  { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

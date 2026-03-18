import { useState } from "react";

const SEGMENTS = [
  {
    id: "svc-0",
    label: "Expense Management",
    type: "service",
    promptContext: "Expense Management in Dubai",
    promptCount: 8,
    appearance: 62,
    top3: 38,
    avgRank: "#3.2",
    engines: [
      { name: "Claude", color: "#f59e0b", pct: 50, top3: 25 },
      { name: "Gemini", color: "#3b82f6", pct: 75, top3: 50 },
      { name: "ChatGPT", color: "#22c55e", pct: 62, top3: 38 },
    ],
    rankings: [
      { name: "Spendesk", pct: 88, isBrand: false },
      { name: "Payhawk", pct: 75, isBrand: false },
      { name: "Pemo", pct: 62, isBrand: true },
      { name: "Airbase", pct: 50, isBrand: false },
      { name: "Brex", pct: 42, isBrand: false },
    ],
  },
  {
    id: "svc-1",
    label: "Automate GRC & Compliance",
    type: "service",
    promptContext: "Automate GRC & Compliance in Dubai",
    promptCount: 8,
    appearance: 0,
    top3: 0,
    avgRank: "—",
    engines: [
      { name: "Claude", color: "#f59e0b", pct: 0, top3: 0 },
      { name: "Gemini", color: "#3b82f6", pct: 0, top3: 0 },
      { name: "ChatGPT", color: "#22c55e", pct: 0, top3: 0 },
    ],
    rankings: [
      { name: "ServiceNow", pct: 58, isBrand: false },
      { name: "MetricStream", pct: 46, isBrand: false },
      { name: "Vanta", pct: 38, isBrand: false },
      { name: "Hyperproof", pct: 29, isBrand: false },
    ],
  },
  {
    id: "cust-0",
    label: "Financial Services Organizations",
    type: "customer",
    promptContext: "options for Financial Services Organizations in Dubai",
    promptCount: 8,
    appearance: 44,
    top3: 19,
    avgRank: "#5.1",
    engines: [
      { name: "Claude", color: "#f59e0b", pct: 38, top3: 12 },
      { name: "Gemini", color: "#3b82f6", pct: 50, top3: 25 },
      { name: "ChatGPT", color: "#22c55e", pct: 44, top3: 19 },
    ],
    rankings: [
      { name: "Spendesk", pct: 71, isBrand: false },
      { name: "Payhawk", pct: 58, isBrand: false },
      { name: "Pemo", pct: 46, isBrand: true },
      { name: "Brex", pct: 33, isBrand: false },
    ],
  },
];

export function SegmentSelectPanel() {
  const [selected, setSelected] = useState<Set<string>>(new Set(["svc-0", "svc-1", "cust-0"]));

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selCount = selected.size;
  const total = SEGMENTS.length;

  return (
    <div className="min-h-screen bg-[#060c18] p-6 pt-8">
      <p className="text-[10px] font-mono font-semibold tracking-widest uppercase text-slate-500 mb-3 px-1">
        Select Segments to Analyse
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {SEGMENTS.map((seg) => {
          const isSelected = selected.has(seg.id);
          return (
            <div
              key={seg.id}
              onClick={() => toggle(seg.id)}
              className="rounded-2xl border overflow-hidden cursor-pointer transition-all duration-200"
              style={{
                borderColor: isSelected ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.06)",
                background: isSelected
                  ? "linear-gradient(135deg,rgba(17,24,39,0.95) 0%,rgba(20,40,20,0.3) 100%)"
                  : "rgba(17,24,39,0.5)",
                boxShadow: isSelected ? "0 0 0 1px rgba(34,197,94,0.15) inset" : "none",
                opacity: isSelected ? 1 : 0.55,
              }}
            >
              {/* Card header */}
              <div className="flex items-start gap-3 p-4 pb-3">
                {/* Checkbox */}
                <div
                  className="mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all duration-200"
                  style={{
                    background: isSelected ? "#22c55e" : "transparent",
                    border: isSelected ? "2px solid #22c55e" : "2px solid rgba(255,255,255,0.2)",
                  }}
                >
                  {isSelected && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>

                {/* Label + prompt context */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold leading-snug">{seg.label}</p>
                  <p
                    className="text-[11px] mt-0.5 truncate font-medium px-1.5 py-0.5 rounded-full inline-block"
                    style={{
                      background: seg.type === "service"
                        ? "rgba(236,72,153,0.18)"
                        : "rgba(139,92,246,0.18)",
                      color: seg.type === "service" ? "#f472b6" : "#a78bfa",
                      maxWidth: "100%",
                    }}
                  >
                    {seg.promptContext}
                  </p>
                </div>

                {/* Prompt count + Re-run */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="text-[11px] px-2.5 py-1 rounded-lg border transition-colors"
                    style={{
                      borderColor: "rgba(255,255,255,0.12)",
                      color: "rgba(255,255,255,0.5)",
                      background: "rgba(255,255,255,0.04)",
                    }}
                  >
                    Re-run
                  </button>
                  <span className="text-[10px] text-slate-500">{seg.promptCount} prompts</span>
                </div>
              </div>

              {/* Metrics row */}
              <div
                className="grid grid-cols-3 border-t border-b"
                style={{ borderColor: "rgba(255,255,255,0.05)" }}
              >
                {[
                  { label: "Appearance", value: `${seg.appearance}%` },
                  { label: "Top 3", value: `${seg.top3}%` },
                  { label: "Avg Rank", value: seg.avgRank },
                ].map(({ label, value }, i) => (
                  <div
                    key={label}
                    className="p-3 text-center"
                    style={{
                      borderRight: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    }}
                  >
                    <p className="text-base font-bold text-white">{value}</p>
                    <p className="text-[10px] text-slate-500">{label}</p>
                  </div>
                ))}
              </div>

              {/* Engine boxes */}
              <div className="p-3 grid grid-cols-3 gap-2">
                {seg.engines.map(({ name, color, pct, top3 }) => (
                  <div
                    key={name}
                    className="rounded-lg p-2.5"
                    style={{
                      border: `1px solid ${color}30`,
                      background: `${color}08`,
                    }}
                  >
                    <p className="text-[10px] text-slate-400 mb-0.5">{name}</p>
                    <p className="text-base font-bold" style={{ color }}>{pct}%</p>
                    <p className="text-[9px] text-slate-500">Top 3: {top3}%</p>
                  </div>
                ))}
              </div>

              {/* Rankings */}
              <div className="px-3 pb-3">
                <p
                  className="text-[9px] font-mono tracking-widest uppercase mb-2"
                  style={{ color: "rgba(255,255,255,0.2)" }}
                >
                  Rankings
                </p>
                <div className="space-y-1.5">
                  {seg.rankings.map((r, idx) => (
                    <div key={r.name} className="flex items-center gap-2">
                      <span
                        className="text-[9px] font-mono w-3 text-right flex-shrink-0"
                        style={{ color: r.isBrand ? "#818cf8" : "rgba(255,255,255,0.2)" }}
                      >
                        {idx + 1}
                      </span>
                      <span
                        className="text-[11px] flex-1 truncate"
                        style={{ color: r.isBrand ? "#a5b4fc" : "rgba(255,255,255,0.45)" }}
                      >
                        {r.name}
                        {r.isBrand && (
                          <span className="ml-1 text-[8px] font-mono uppercase" style={{ color: "#6366f1" }}>
                            you
                          </span>
                        )}
                      </span>
                      <div
                        className="w-16 h-1 rounded-full overflow-hidden flex-shrink-0"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${r.pct}%`,
                            background: r.isBrand
                              ? "linear-gradient(90deg,#6366f1,#8b5cf6)"
                              : "rgba(255,255,255,0.15)",
                          }}
                        />
                      </div>
                      <span
                        className="text-[10px] w-7 text-right tabular-nums flex-shrink-0"
                        style={{ color: r.isBrand ? "#a5b4fc" : "rgba(255,255,255,0.3)" }}
                      >
                        {r.pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {/* Analyse CTA — spans full width in second row slot */}
      </div>

      {/* CTA */}
      <button
        className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
        style={{
          background: selCount > 0
            ? "linear-gradient(135deg,#22c55e,#16a34a)"
            : "rgba(255,255,255,0.06)",
          color: selCount > 0 ? "#fff" : "rgba(255,255,255,0.3)",
          boxShadow: selCount > 0 ? "0 0 24px rgba(34,197,94,0.25)" : "none",
          cursor: selCount > 0 ? "pointer" : "not-allowed",
        }}
        disabled={selCount === 0}
      >
        {selCount > 0 ? (
          <>
            <span>✦</span>
            Analyse Citation Intelligence · {selCount} of {total} Segment{selCount !== 1 ? "s" : ""}
          </>
        ) : (
          "Select at least one segment to continue"
        )}
      </button>

      <p className="text-center text-[10px] text-slate-600 mt-2">
        Click a card to toggle · Deselected segments are excluded from citation analysis
      </p>
    </div>
  );
}

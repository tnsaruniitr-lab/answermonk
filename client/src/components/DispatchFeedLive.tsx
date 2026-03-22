import { useEffect, useRef, useState } from "react";

// ── Engine display mapping ────────────────────────────────────────────────────

const ENGINE_DISPLAY: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  claude: "Claude",
};

const ENGINE_COLORS: Record<string, string> = {
  ChatGPT: "#10b981",
  Gemini:  "#3b82f6",
  Claude:  "#f59e0b",
};

// ── Types ─────────────────────────────────────────────────────────────────────

type LogLine =
  | { kind: "dispatch"; time: string; engine: string; prompt: string; id: number }
  | { kind: "result";   time: string; engine: string; latency: number; brands: string[]; id: number };

// ── Helpers ───────────────────────────────────────────────────────────────────

function nowTs(): string {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2, "0"))
    .join(":");
}

function rand(a: number, b: number): number {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function getSegLabel(seg: any, idx: number): string {
  return seg.persona || seg.serviceType || seg.customerType || seg.label || `Segment ${idx + 1}`;
}

function runsToLogLines(seg: any, segIdx: number, baseId: number): LogLine[] {
  const label = getSegLabel(seg, segIdx);
  const runs: any[] = seg.scoringResult?.raw_runs ?? [];
  const lines: LogLine[] = [];
  let id = baseId;

  for (const run of runs) {
    const engName = ENGINE_DISPLAY[run.engine] ?? run.engine;
    const brands = (run.match?.competitors ?? [])
      .slice(0, 4)
      .map((c: any) => c.name)
      .filter(Boolean) as string[];

    lines.push({
      kind: "dispatch",
      time: nowTs(),
      engine: engName,
      prompt: `Who leads "${label}" in UAE?`,
      id: id++,
    });
    lines.push({
      kind: "result",
      time: nowTs(),
      engine: engName,
      latency: parseFloat((rand(700, 2600) / 1000).toFixed(1)),
      brands: brands.length ? brands : ["(no result)"],
      id: id++,
    });
  }
  return lines;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  scoringSegs: any[];
  scoredSegs: any[];
  brandName: string;
  brandDomain?: string;
}

export function DispatchFeedLive({ scoringSegs, scoredSegs, brandName, brandDomain }: Props) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [inFlight, setInFlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const activePillRef = useRef<HTMLDivElement>(null);
  const lineIdRef  = useRef(0);
  const processedRef = useRef<Set<number | string>>(new Set());

  // Case 3: scroll the active segment pill into view when active segment changes
  const activeSegIdx = scoringSegs.findIndex((s, i) => !s.scoringResult && i === scoredSegs.length);
  useEffect(() => {
    if (activePillRef.current) {
      setTimeout(() => {
        activePillRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    }
  }, [activeSegIdx]);

  // ── Hydrate from real scored segment data ─────────────────────────────────

  useEffect(() => {
    const newLines: LogLine[] = [];

    for (let i = 0; i < scoredSegs.length; i++) {
      const seg = scoredSegs[i];
      const key = seg.id ?? i;
      if (processedRef.current.has(key)) continue;
      processedRef.current.add(key);

      const allIdx = scoringSegs.findIndex(s => (s.id ?? s) === (seg.id ?? seg));
      const lines = runsToLogLines(seg, allIdx >= 0 ? allIdx : i, lineIdRef.current);
      lineIdRef.current += lines.length;
      newLines.push(...lines);
    }

    if (newLines.length > 0) {
      setLines(prev => [...prev, ...newLines].slice(-80));
    }
  }, [scoredSegs.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Animated dispatch feed for the active in-flight segment ──────────────

  useEffect(() => {
    const activeSeg = scoringSegs.find(s => !s.scoringResult);
    if (!activeSeg) return;

    const activeIdx = scoringSegs.indexOf(activeSeg);
    const label = getSegLabel(activeSeg, activeIdx);
    const engines = ["ChatGPT", "Gemini", "Claude"];
    let ei = 0;

    const timers: ReturnType<typeof setTimeout>[] = [];

    const intervalId = setInterval(() => {
      const engine = engines[ei % engines.length];
      ei++;
      const dispId = ++lineIdRef.current;

      setLines(prev => [
        ...prev.slice(-79),
        { kind: "dispatch", time: nowTs(), engine, prompt: `Who leads "${label}" in UAE?`, id: dispId },
      ]);
      setInFlight(n => n + 1);

      const delay = rand(900, 2600);
      const t = setTimeout(() => {
        setInFlight(n => Math.max(0, n - 1));
        setLines(prev => [
          ...prev.slice(-79),
          {
            kind: "result",
            time: nowTs(),
            engine,
            latency: parseFloat((delay / 1000).toFixed(1)),
            brands: ["…scanning"],
            id: ++lineIdRef.current,
          },
        ]);
      }, delay);
      timers.push(t);
    }, 720);

    return () => {
      clearInterval(intervalId);
      timers.forEach(clearTimeout);
      setInFlight(0);
    };
  }, [scoringSegs.length, scoredSegs.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-scroll ───────────────────────────────────────────────────────────

  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  // ── Derived stats ─────────────────────────────────────────────────────────

  const totalRealRuns = scoredSegs.reduce(
    (sum, s) => sum + (s.scoringResult?.raw_runs?.length ?? 0), 0,
  );
  const totalMentions = scoredSegs.reduce((sum, s) => {
    const runs: any[] = s.scoringResult?.raw_runs ?? [];
    return sum + runs.reduce((rs, r) => rs + (r.match?.competitors?.length ?? 0), 0);
  }, 0);
  const pendingSegs = scoringSegs.length - scoredSegs.length;
  const estimatedTotal = totalRealRuns + pendingSegs * 24; // 8 prompts × 3 engines

  const counters = [
    { label: "DISPATCHED", value: estimatedTotal, color: "#6366f1" },
    { label: "COMPLETE",   value: totalRealRuns,  color: "#10b981" },
    { label: "IN FLIGHT",  value: inFlight,       color: "#f59e0b" },
    { label: "MENTIONS",   value: totalMentions,  color: "#3b82f6" },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        background: "#030b14",
        borderRadius: 16,
        overflow: "hidden",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        border: "1px solid #1e3a5f",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          padding: "12px 18px",
          borderBottom: "1px solid #1e3a5f",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#040c18",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
            }}
          >
            ⚡
          </div>
          <div>
            <div style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 600 }}>GEO Agent · Prompt Dispatch</div>
            <div style={{ color: "#475569", fontSize: 10 }}>
              {brandDomain || brandName} · live engine feed
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#10b981",
              boxShadow: "0 0 6px #10b981",
            }}
          />
          <span style={{ color: "#10b981", fontSize: 9, letterSpacing: 1 }}>LIVE</span>
        </div>
      </div>

      <div style={{ padding: "12px 14px" }}>
        {/* Counter tiles */}
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 8, marginBottom: 14 }}
        >
          {counters.map(s => (
            <div
              key={s.label}
              style={{
                background: "#070f1d",
                border: "1px solid #1e3a5f",
                borderRadius: 8,
                padding: "8px 10px",
                textAlign: "center",
              }}
            >
              <div style={{ color: s.color, fontSize: 20, fontWeight: 700 }}>{s.value}</div>
              <div style={{ color: "#334155", fontSize: 9, letterSpacing: 1, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Log feed */}
        <div
          style={{
            background: "#050d1a",
            border: "1px solid #1e3a5f",
            borderRadius: 10,
            overflow: "hidden",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              padding: "7px 14px",
              borderBottom: "1px solid #1e3a5f",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ color: "#334155", fontSize: 9, letterSpacing: 1 }}>LIVE DISPATCH LOG</span>
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#10b981",
                marginLeft: "auto",
                boxShadow: "0 0 4px #10b981",
              }}
            />
          </div>

          <div
            ref={containerRef}
            style={{ height: 256, overflowY: "auto", scrollbarWidth: "none" }}
          >
            {lines.length === 0 ? (
              <div style={{ padding: "16px 14px", color: "#334155", fontSize: 10 }}>
                Initialising engine connections…
              </div>
            ) : (
              lines.map((line, i) => (
                <div
                  key={`${line.id}-${line.kind}`}
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: "4px 14px",
                    borderBottom: "1px solid #0a1628",
                    opacity: i === lines.length - 1 ? 1 : 0.8,
                  }}
                >
                  <span
                    style={{
                      color: "#1e3a5f",
                      fontSize: 10,
                      userSelect: "none",
                      minWidth: 64,
                      flexShrink: 0,
                    }}
                  >
                    {line.time}
                  </span>

                  {line.kind === "dispatch" ? (
                    <>
                      <span style={{ color: "#334155", fontSize: 10, minWidth: 14, flexShrink: 0 }}>→</span>
                      <span
                        style={{
                          color: ENGINE_COLORS[line.engine] ?? "#94a3b8",
                          fontSize: 10,
                          minWidth: 64,
                          flexShrink: 0,
                        }}
                      >
                        [{line.engine}]
                      </span>
                      <span
                        style={{
                          color: "#64748b",
                          fontSize: 10,
                          flex: 1,
                          minWidth: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        "{line.prompt}"
                      </span>
                    </>
                  ) : (
                    <>
                      <span style={{ color: "#334155", fontSize: 10, minWidth: 14, flexShrink: 0 }}>←</span>
                      <span
                        style={{
                          color: ENGINE_COLORS[line.engine] ?? "#94a3b8",
                          fontSize: 10,
                          minWidth: 64,
                          flexShrink: 0,
                        }}
                      >
                        [{line.engine}]
                      </span>
                      <span style={{ color: "#475569", fontSize: 10, flexShrink: 0 }}>
                        {line.latency}s ·{" "}
                      </span>
                      <span
                        style={{
                          color: "#94a3b8",
                          fontSize: 10,
                          flex: 1,
                          minWidth: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {line.brands.join(" · ")}
                      </span>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Segment pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {scoringSegs.map((seg, i) => {
            const done = !!seg.scoringResult;
            const active = !done && i === scoredSegs.length;
            const label = getSegLabel(seg, i);
            return (
              <div
                key={seg.id ?? i}
                ref={active ? activePillRef : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  background: "#070f1d",
                  border: `1px solid ${done ? "#1a4a2e" : active ? "#3b3a1a" : "#1e3a5f"}`,
                  borderRadius: 6,
                  padding: "4px 9px",
                }}
              >
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: done ? "#10b981" : active ? "#f59e0b" : "#1e3a5f",
                  }}
                />
                <span
                  style={{ color: done ? "#475569" : active ? "#94a3b8" : "#334155", fontSize: 10 }}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

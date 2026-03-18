import { useEffect, useState, useRef } from "react";

const QUIPS = [
  "In my skin, these wounds they will not heal...",
  "Crawling through URLs so you don't have to",
  "I've become so numb... wait, that's a different Linkin Park song",
  "There's something inside me that PULLS these redirects apart",
  "Status 429: even the internet needs a moment",
  "Crawling back to you... and to this VertexAI redirect URL",
  "When progress says 23% and it's been 4 minutes: totally normal",
  "The walls are closing in — also the rate limits",
  "Minor setback: website requires cookie consent in 11 languages",
  "Sending GET requests like a robot fully possessed",
  "I am so afraid of... timeouts. Many timeouts.",
  "Finding your 404s so you look busy doing something important",
];

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#";
const STATUSES = ["CRAWLING", "RESOLVING", "CLASSIFYING", "INDEXED"];

function scramble(target: string, progress: number): string {
  return target.split("").map((ch, i) => {
    if (i < progress) return ch;
    if (ch === " ") return " ";
    return CHARS[Math.floor(Math.random() * CHARS.length)];
  }).join("");
}

function rand(a: number, b: number) { return Math.floor(Math.random() * (b - a + 1)) + a; }

const STREAM_POOLS = [
  ["gpt-crawl-01.nexalytics.io", "resolver-a.internal", "openai-grounding.io"],
  ["vertex-redirect.googleapis.com", "gemini-src-01.io", "grounding-api.gcp"],
  ["claude-cite-01.anthropic.com", "bedrock-ref.aws", "haiku-grounding.io"],
];

function useQuips() {
  const [quipIdx, setQuipIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<"decode" | "hold" | "fade">("decode");
  const [decodeProgress, setDecodeProgress] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const target = QUIPS[quipIdx];
    if (phase === "decode") {
      const t = setInterval(() => {
        setDecodeProgress(p => {
          const next = p + 2;
          setDisplayed(scramble(target, next));
          if (next >= target.length) { setPhase("hold"); return target.length; }
          return next;
        });
      }, 28);
      return () => clearInterval(t);
    }
    if (phase === "hold") {
      setDisplayed(target);
      const t = setTimeout(() => setPhase("fade"), 2800);
      return () => clearTimeout(t);
    }
    if (phase === "fade") {
      let op = 1;
      const t = setInterval(() => {
        op -= 0.08;
        setOpacity(Math.max(op, 0));
        if (op <= 0) {
          clearInterval(t);
          setQuipIdx(i => (i + 1) % QUIPS.length);
          setDecodeProgress(0);
          setOpacity(1);
          setPhase("decode");
        }
      }, 30);
      return () => clearInterval(t);
    }
  }, [phase, quipIdx]);

  return { displayed, opacity, quipIdx };
}

interface CrawlProgress {
  step: string;
  detail: string;
  pct: number;
  crawlDone?: number;
  crawlTotal?: number;
  crawlSuccess?: number;
  crawlFailed?: number;
}

interface Props {
  progress: CrawlProgress | null;
}

export function CrawlMissionControl({ progress }: Props) {
  const { displayed, opacity, quipIdx } = useQuips();
  const [streamDomains, setStreamDomains] = useState(STREAM_POOLS.map(p => p[0]));
  const [streamStatus, setStreamStatus] = useState([0, 1, 2]);
  const tick = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      tick.current++;
      if (tick.current % 6 === 0) {
        setStreamDomains(prev => prev.map((_, i) => {
          const pool = STREAM_POOLS[i];
          return pool[rand(0, pool.length - 1)];
        }));
        setStreamStatus(prev => prev.map(() => rand(0, 3)));
      }
    }, 400);
    return () => clearInterval(id);
  }, []);

  const pct = progress?.pct ?? 0;
  const crawlDone = progress?.crawlDone ?? 0;
  const crawlTotal = progress?.crawlTotal ?? 0;
  const crawlSuccess = progress?.crawlSuccess ?? 0;
  const crawlFailed = progress?.crawlFailed ?? 0;
  const successRingPct = crawlDone > 0 ? crawlSuccess / crawlDone : 0;

  const outerCirc = 2 * Math.PI * 62;
  const innerCirc = 2 * Math.PI * 48;

  return (
    <div style={{
      background: "#040912",
      borderRadius: 16,
      padding: "28px 24px",
      display: "flex",
      justifyContent: "center",
      marginTop: 16,
    }}>
      <div style={{ width: "100%", maxWidth: 560 }}>

        {/* Status bar */}
        <div style={{
          background: "#0a1628",
          border: "1px solid #1e3a5f",
          borderRadius: "12px 12px 0 0",
          padding: "9px 18px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "#ef4444", flexShrink: 0,
            animation: "cmcBlink 0.8s infinite",
          }} />
          <span style={{ color: "#ef4444", fontSize: 10, fontFamily: "monospace", letterSpacing: 2 }}>CRAWLING</span>
        </div>

        {/* Main panel */}
        <div style={{
          background: "#060f1e",
          border: "1px solid #1e3a5f",
          borderTop: "none",
          borderRadius: "0 0 12px 12px",
          padding: 22,
        }}>

          {/* Quips strip */}
          <div style={{
            marginBottom: 20,
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(30,58,95,0.8)",
            borderRadius: 8,
            padding: "9px 14px",
            minHeight: 40,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#22d3ee", boxShadow: "0 0 8px #22d3ee",
              flexShrink: 0,
              animation: "cmcPulse 1.2s ease-in-out infinite",
            }} />
            <p style={{
              margin: 0, fontSize: 12,
              color: "rgba(148,163,184,0.9)",
              opacity,
              fontFamily: "monospace",
              letterSpacing: "0.01em",
              lineHeight: 1.5,
              fontStyle: QUIPS[quipIdx]?.startsWith("In my skin") ? "italic" : "normal",
            }}>
              {displayed}
            </p>
          </div>

          {/* Progress rings */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
            <div style={{ position: "relative", width: 140, height: 140 }}>
              <svg viewBox="0 0 140 140" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
                <circle cx="70" cy="70" r="62" fill="none" stroke="#1e3a5f" strokeWidth="4" />
                <circle cx="70" cy="70" r="62" fill="none" stroke="#3b82f6" strokeWidth="4"
                  strokeDasharray={outerCirc}
                  strokeDashoffset={outerCirc * (1 - pct / 100)}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.8s ease", filter: "drop-shadow(0 0 8px #3b82f6)" }}
                />
              </svg>
              <svg viewBox="0 0 140 140" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
                <circle cx="70" cy="70" r="48" fill="none" stroke="#0a1e3a" strokeWidth="2" />
                <circle cx="70" cy="70" r="48" fill="none" stroke="#6366f1" strokeWidth="2"
                  strokeDasharray={innerCirc}
                  strokeDashoffset={innerCirc * (1 - successRingPct)}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.8s ease", filter: "drop-shadow(0 0 5px #6366f1)" }}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ color: "#e2e8f0", fontSize: 28, fontWeight: 700, lineHeight: 1, fontFamily: "monospace" }}>{pct}%</div>
                <div style={{ color: "#3b82f6", fontSize: 10, letterSpacing: 1, marginTop: 4, fontFamily: "monospace" }}>CRAWLED</div>
              </div>
            </div>
          </div>

          {/* Streams */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, padding: "9px 11px" }}>
                <div style={{ color: "#334155", fontSize: 9, fontFamily: "monospace", marginBottom: 5, letterSpacing: 1 }}>STREAM {i + 1}</div>
                <div style={{ color: ["#3b82f6", "#6366f1", "#10b981"][i], fontSize: 10, fontFamily: "monospace", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {streamDomains[i]}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: ["#3b82f6", "#6366f1", "#10b981"][streamStatus[i] % 3], animation: "cmcPulse 1.2s infinite" }} />
                  <span style={{ color: "#475569", fontSize: 9, fontFamily: "monospace" }}>{STATUSES[streamStatus[i]]}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
            {[
              { label: "PAGES FOUND", value: crawlTotal || crawlDone, color: "#3b82f6" },
              { label: "ACCESSIBLE", value: crawlSuccess, color: "#10b981" },
              { label: "FAILED", value: crawlFailed, color: crawlFailed > 0 ? "#f59e0b" : "#334155" },
            ].map(s => (
              <div key={s.label} style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, padding: "11px 13px", textAlign: "center" }}>
                <div style={{ color: s.color, fontFamily: "monospace", fontSize: 20, fontWeight: 700, letterSpacing: -1 }} data-testid={`stat-${s.label.toLowerCase().replace(" ", "-")}`}>
                  {s.value}
                </div>
                <div style={{ color: "#334155", fontSize: 9, fontFamily: "monospace", letterSpacing: 1, marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Engine coverage */}
          <div style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, padding: "11px 15px" }}>
            <div style={{ color: "#334155", fontSize: 9, fontFamily: "monospace", letterSpacing: 1, marginBottom: 10 }}>ENGINE COVERAGE</div>
            <div style={{ display: "flex", gap: 14 }}>
              {[
                { name: "ChatGPT", color: "#10b981" },
                { name: "Gemini", color: "#3b82f6" },
                { name: "Claude", color: "#f59e0b" },
              ].map((e, ei) => {
                const enginePct = crawlDone > 0
                  ? Math.min(99, Math.round(pct * [0.85, 0.92, 0.78][ei]))
                  : [0, 0, 0][ei];
                return (
                  <div key={e.name} style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ color: e.color, fontSize: 10, fontFamily: "monospace" }}>{e.name}</span>
                      <span style={{ color: "#475569", fontSize: 10, fontFamily: "monospace" }}>{enginePct}%</span>
                    </div>
                    <div style={{ height: 3, background: "#1e3a5f", borderRadius: 99 }}>
                      <div style={{ height: "100%", width: `${enginePct}%`, background: e.color, borderRadius: 99, boxShadow: `0 0 6px ${e.color}`, transition: "width 0.8s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes cmcPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes cmcBlink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}

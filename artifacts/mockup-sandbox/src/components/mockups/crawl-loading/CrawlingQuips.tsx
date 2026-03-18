import { useState, useEffect } from "react";

const QUIPS = [
  "In my skin, these wounds they will not heal...",
  "Crawling through 47,329 URLs so you don't have to",
  "I've become so numb... wait, that's a different Linkin Park song",
  "Crawling in the dark, collecting your citations one by one",
  "There's something inside me that PULLS these redirects apart",
  "Status 429: even the internet needs a moment",
  "Finding your 404s so you look busy doing something important",
  "Crawling back to you... and to this VertexAI redirect URL",
  "When progress says 23% and it's been 4 minutes: totally normal",
  "Sending GET requests like a robot fully possessed",
  "The walls are closing in — also the rate limits",
  "I am so afraid of... timeouts. Many timeouts.",
  "Crawling has always been with me — since the first npm install",
  "Every URL we touch is a URL we trust (until it 403s us)",
  "Minor setback: website requires cookie consent in 11 languages",
];

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";

function scramble(target: string, progress: number): string {
  return target
    .split("")
    .map((ch, i) => {
      if (i < progress) return ch;
      if (ch === " ") return " ";
      return CHARS[Math.floor(Math.random() * CHARS.length)];
    })
    .join("");
}

export default function CrawlingQuips() {
  const [quipIdx, setQuipIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<"decode" | "hold" | "fade">("decode");
  const [decodeProgress, setDecodeProgress] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const [dots, setDots] = useState(".");
  const [urlCount, setUrlCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setUrlCount(n => n + Math.floor(Math.random() * 7 + 1));
    }, 120);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const target = QUIPS[quipIdx];

    if (phase === "decode") {
      const step = () => {
        setDecodeProgress(p => {
          const next = p + 2;
          setDisplayed(scramble(target, next));
          if (next >= target.length) {
            setPhase("hold");
            return target.length;
          }
          return next;
        });
      };
      const t = setInterval(step, 28);
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
        op -= 0.07;
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

  return (
    <div style={{
      background: "#0a0a0f",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
      padding: 40,
    }}>
      <div style={{ width: "100%", maxWidth: 680, textAlign: "center" }}>

        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}>
          <div style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#22d3ee",
            boxShadow: "0 0 12px #22d3ee",
            animation: "pulse 1.2s ease-in-out infinite",
          }} />
          <span style={{
            fontSize: 11,
            letterSpacing: "0.25em",
            color: "#22d3ee",
            textTransform: "uppercase",
            fontWeight: 700,
          }}>
            CRAWLING{dots}
          </span>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(34,211,238,0.15)",
          borderRadius: 12,
          padding: "28px 32px",
          backdropFilter: "blur(12px)",
          marginBottom: 20,
          minHeight: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <p style={{
            fontSize: 15,
            color: "#e2e8f0",
            opacity,
            margin: 0,
            lineHeight: 1.6,
            letterSpacing: "0.02em",
            transition: "none",
            fontStyle: QUIPS[quipIdx].startsWith("In my skin") || QUIPS[quipIdx].startsWith("Crawling in") ? "italic" : "normal",
          }}>
            {displayed}
          </p>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          justifyContent: "center",
          marginBottom: 24,
        }}>
          <div style={{
            flex: 1,
            height: 2,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 1,
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: "38%",
              background: "linear-gradient(90deg, #6366f1, #22d3ee)",
              borderRadius: 1,
              boxShadow: "0 0 8px rgba(99,102,241,0.6)",
              animation: "crawlbar 3s ease-in-out infinite",
            }} />
          </div>
          <span style={{ fontSize: 10, color: "#64748b", letterSpacing: "0.1em" }}>38%</span>
        </div>

        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: 24,
        }}>
          {[
            { label: "URLs crawled", value: urlCount.toLocaleString() },
            { label: "Citations found", value: Math.floor(urlCount * 0.11).toString() },
            { label: "Rate limits hit", value: Math.floor(urlCount * 0.003).toString() },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
                {value}
              </div>
              <div style={{ fontSize: 9, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
          @keyframes crawlbar {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(200%); }
            100% { transform: translateX(-100%); }
          }
        `}</style>
      </div>
    </div>
  );
}

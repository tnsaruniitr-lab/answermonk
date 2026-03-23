import { useEffect, useState } from "react";

const ENGINES = [
  { name: "ChatGPT",    color: "#10a37f", bg: "#d1fae5" },
  { name: "Gemini",     color: "#4285f4", bg: "#dbeafe" },
  { name: "Claude",     color: "#d97706", bg: "#fef3c7" },
  { name: "Perplexity", color: "#6366f1", bg: "#ede9fe" },
];

export function FlipperStrip() {
  const [idx, setIdx] = useState(0);
  const [animDir, setAnimDir] = useState<"in" | "out">("in");

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimDir("out");
      setTimeout(() => {
        setIdx(i => (i + 1) % ENGINES.length);
        setAnimDir("in");
      }, 260);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const engine = ENGINES[idx];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: "40px 32px",
    }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(14px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(0);    opacity: 1; }
          to   { transform: translateY(-14px); opacity: 0; }
        }
        .chip-in  { animation: slideUp   0.24s cubic-bezier(.22,.68,0,1.2) forwards; }
        .chip-out { animation: slideDown 0.22s ease-in forwards; }
      `}</style>

      <div style={{ textAlign: "center", maxWidth: 540 }}>
        <p style={{
          fontSize: 18,
          fontWeight: 400,
          lineHeight: 1.6,
          color: "#374151",
          margin: "0 0 20px",
          letterSpacing: "-0.01em",
        }}>
          AnswerMonk makes AI recommend you.
        </p>

        {/* Flipper chip */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          overflow: "hidden",
          height: 38,
        }}>
          <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 500 }}>Currently scoring on</span>
          <div
            key={engine.name}
            className={animDir === "in" ? "chip-in" : "chip-out"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: engine.bg,
              color: engine.color,
              borderRadius: 20,
              padding: "6px 14px",
              fontSize: 13,
              fontWeight: 700,
              border: `1.5px solid ${engine.color}30`,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: engine.color,
              display: "inline-block",
              flexShrink: 0,
            }} />
            {engine.name}
          </div>
        </div>

        {/* Static engine dots underneath */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: 6,
          marginTop: 14,
        }}>
          {ENGINES.map((e, i) => (
            <div key={e.name} style={{
              width: 6, height: 6, borderRadius: "50%",
              background: i === idx ? e.color : "#d1d5db",
              transition: "background 0.3s",
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

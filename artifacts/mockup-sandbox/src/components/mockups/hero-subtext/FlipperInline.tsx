import { useEffect, useState } from "react";

const ENGINES = ["ChatGPT", "Gemini", "Claude", "Perplexity"];
const COLORS: Record<string, string> = {
  ChatGPT: "#10a37f",
  Gemini: "#4285f4",
  Claude: "#d97706",
  Perplexity: "#6366f1",
};

export function FlipperInline() {
  const [idx, setIdx] = useState(0);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFlipping(true);
      setTimeout(() => {
        setIdx(i => (i + 1) % ENGINES.length);
        setFlipping(false);
      }, 220);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const engine = ENGINES[idx];
  const color = COLORS[engine];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: "40px 32px",
    }}>
      <style>{`
        @keyframes flipIn {
          0%   { transform: rotateX(90deg); opacity: 0; }
          100% { transform: rotateX(0deg);  opacity: 1; }
        }
        @keyframes flipOut {
          0%   { transform: rotateX(0deg);  opacity: 1; }
          100% { transform: rotateX(-90deg); opacity: 0; }
        }
        .engine-flip {
          display: inline-block;
          perspective: 400px;
          transform-style: preserve-3d;
        }
        .engine-flip span {
          display: inline-block;
          transition: none;
        }
        .engine-flip.flipping span {
          animation: flipOut 0.18s ease-in forwards;
        }
        .engine-flip:not(.flipping) span {
          animation: flipIn 0.22s ease-out forwards;
        }
      `}</style>

      <div style={{ textAlign: "center", maxWidth: 540 }}>
        <p style={{
          fontSize: 18,
          fontWeight: 400,
          lineHeight: 1.6,
          color: "#374151",
          margin: 0,
          letterSpacing: "-0.01em",
        }}>
          Measure and improve how you rank on{" "}
          <span
            className={`engine-flip${flipping ? " flipping" : ""}`}
            style={{
              display: "inline-block",
              minWidth: 110,
              textAlign: "left",
            }}
          >
            <span style={{
              color,
              fontWeight: 700,
              borderBottom: `2px solid ${color}55`,
              paddingBottom: 1,
            }}>
              {engine}
            </span>
          </span>
        </p>
      </div>
    </div>
  );
}

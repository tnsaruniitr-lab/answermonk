import { useEffect, useRef } from "react";

const WORDS = [
  "chatgpt","gemini","claude","perplexity","#1","#2","#3","vara.ae","adgm.com","binance",
  "cited","authority","gpt","llm","rank","index","source","trust","citation","AI",
  "search","agent","monitor","audit","domain","signal","detect","score","analyse",
  "reddit","wikipedia","gov","news","brand","query","result","top","insight","data",
];

interface Column { x: number; chars: string[]; y: number; speed: number; opacity: number; }

export function DataStream() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf: number;

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);

    const COLS = 18;
    const COL_W = () => canvas.width / COLS;
    const LINE_H = 22;

    const columns: Column[] = Array.from({ length: COLS }, (_, i) => ({
      x: i,
      chars: Array.from({ length: Math.ceil(canvas.height / LINE_H) + 2 }, () => WORDS[Math.floor(Math.random() * WORDS.length)]),
      y: -Math.random() * canvas.height,
      speed: 0.3 + Math.random() * 0.5,
      opacity: 0.025 + Math.random() * 0.04,
    }));

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#020812";
      ctx.fillRect(0, 0, W, H);

      for (const col of columns) {
        const cw = COL_W();
        const cx = col.x * cw + cw / 2;
        ctx.font = `500 11px 'JetBrains Mono', 'Courier New', monospace`;
        ctx.textAlign = "center";

        for (let i = 0; i < col.chars.length; i++) {
          const charY = col.y + i * LINE_H;
          if (charY < -20 || charY > H + 20) continue;
          const distFromTop = charY / H;
          const fade = Math.sin(distFromTop * Math.PI) * col.opacity;
          const isHighlight = col.chars[i].startsWith("#");
          if (isHighlight) {
            ctx.fillStyle = `rgba(251,191,36,${fade * 3})`;
          } else if (col.chars[i] === col.chars[0]) {
            ctx.fillStyle = `rgba(20,184,166,${fade * 2.5})`;
          } else {
            ctx.fillStyle = `rgba(148,163,184,${fade})`;
          }
          ctx.fillText(col.chars[i], cx, charY);
        }

        col.y += col.speed;
        if (col.y > H) {
          col.y = -col.chars.length * LINE_H;
          col.chars = col.chars.map(() => WORDS[Math.floor(Math.random() * WORDS.length)]);
        }
      }

      const overlay = ctx.createLinearGradient(0, 0, 0, H);
      overlay.addColorStop(0, "rgba(2,8,18,0.6)");
      overlay.addColorStop(0.3, "rgba(2,8,18,0)");
      overlay.addColorStop(0.7, "rgba(2,8,18,0)");
      overlay.addColorStop(1, "rgba(2,8,18,0.7)");
      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, W, H);

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", minHeight: "100vh", position: "relative", background: "#020812", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", padding: "0 40px", textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: "#5eead4", textTransform: "uppercase", marginBottom: 16, padding: "5px 14px", border: "1px solid rgba(20,184,166,0.35)", borderRadius: 20, background: "rgba(20,184,166,0.06)", display: "inline-block" }}>GEO Intelligence Platform</div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 800, color: "#f1f5f9", lineHeight: 1.15, margin: "0 0 20px", maxWidth: 640 }}>
          Dominate <span style={{ color: "#5eead4" }}>AI Search</span> Rankings Before Your Competitors Do
        </h1>
        <p style={{ fontSize: 16, color: "#64748b", maxWidth: 480, lineHeight: 1.6, margin: "0 0 36px" }}>
          See exactly why top brands appear in ChatGPT, Gemini & Claude — then outrank them.
        </p>
        <button style={{ padding: "14px 32px", borderRadius: 12, background: "#fff", color: "#020812", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", boxShadow: "0 0 24px rgba(255,255,255,0.18)" }}>
          Start Free Analysis →
        </button>
      </div>
    </div>
  );
}

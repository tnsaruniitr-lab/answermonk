import { useEffect, useRef } from "react";

export function TopologyLines() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf: number;

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);

    let t = 0;

    const height = (x: number, y: number, t: number) => {
      const W = canvas.width, H = canvas.height;
      const nx = x / W, ny = y / H;
      return (
        Math.sin(nx * 5 + t * 0.4) * 0.25 +
        Math.cos(ny * 4 - t * 0.3) * 0.25 +
        Math.sin((nx + ny) * 3.5 + t * 0.25) * 0.2 +
        Math.cos((nx - ny) * 2.8 + t * 0.18) * 0.15 +
        Math.sin(nx * 2 + ny * 6 + t * 0.1) * 0.15
      );
    };

    const LEVELS = 20;
    const STEP = 6;

    const drawContour = (level: number) => {
      const W = canvas.width, H = canvas.height;
      const threshold = -1 + (level / LEVELS) * 2;
      const alpha = 0.06 + (level / LEVELS) * 0.13;
      const hue = level / LEVELS;
      const r = Math.round(20 + hue * 80);
      const g = Math.round(184 - hue * 60);
      const b = Math.round(166 + hue * 60);

      ctx.beginPath();
      let started = false;

      for (let x = 0; x <= W; x += STEP) {
        const h1 = height(x, 0, t);
        const pct = (h1 - threshold + 0.5) / 2;
        const py = H * (0.1 + pct * 0.8);
        const wx = x + Math.sin(py * 0.05 + t) * 8;

        if (!started) { ctx.moveTo(wx, py); started = true; }
        else ctx.lineTo(wx, py);
      }

      ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      ctx.fillStyle = "#020a18";
      ctx.fillRect(0, 0, W, H);

      const grad = ctx.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.4, W * 0.6);
      grad.addColorStop(0, "rgba(20,184,166,0.04)");
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      const ROWS = 32;
      for (let row = 0; row < ROWS; row++) {
        const level = row;
        const threshold = -1 + (row / ROWS) * 2;
        const baseY = H * (row / ROWS);
        const alpha = 0.05 + (0.5 - Math.abs(row / ROWS - 0.5)) * 0.22;

        const hue = row / ROWS;
        const r = Math.round(20 + hue * 100);
        const g = Math.round(184 - hue * 80);
        const b = Math.round(200 + hue * 55);

        ctx.beginPath();
        let first = true;
        const pts: [number, number][] = [];

        for (let x = -20; x <= canvas.width + 20; x += STEP) {
          const h = height(x, baseY, t);
          const oy = h * 40;
          const py = baseY + oy;
          pts.push([x, py]);
        }

        if (pts.length > 1) {
          ctx.moveTo(pts[0][0], pts[0][1]);
          for (let i = 1; i < pts.length - 1; i++) {
            const cx = (pts[i][0] + pts[i + 1][0]) / 2;
            const cy = (pts[i][1] + pts[i + 1][1]) / 2;
            ctx.quadraticCurveTo(pts[i][0], pts[i][1], cx, cy);
          }
          ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
        }

        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }

      t += 0.006;
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", minHeight: "100vh", position: "relative", background: "#020a18", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 50% 60% at 50% 45%, rgba(20,184,166,0.06) 0%, transparent 70%)" }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", padding: "0 40px", textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: "#2dd4bf", textTransform: "uppercase", marginBottom: 16, padding: "5px 14px", border: "1px solid rgba(20,184,166,0.35)", borderRadius: 20, background: "rgba(20,184,166,0.07)", backdropFilter: "blur(8px)", display: "inline-block" }}>GEO Intelligence Platform</div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 800, color: "#f1f5f9", lineHeight: 1.15, margin: "0 0 20px", maxWidth: 640, textShadow: "0 0 60px rgba(20,184,166,0.3)" }}>
          Dominate <span style={{ color: "#2dd4bf" }}>AI Search</span> Rankings Before Your Competitors Do
        </h1>
        <p style={{ fontSize: 16, color: "#64748b", maxWidth: 480, lineHeight: 1.6, margin: "0 0 36px" }}>
          See exactly why top brands appear in ChatGPT, Gemini & Claude — then outrank them.
        </p>
        <button style={{ padding: "14px 32px", borderRadius: 12, background: "#fff", color: "#020a18", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", boxShadow: "0 0 28px rgba(255,255,255,0.2)" }}>
          Start Free Analysis →
        </button>
      </div>
    </div>
  );
}

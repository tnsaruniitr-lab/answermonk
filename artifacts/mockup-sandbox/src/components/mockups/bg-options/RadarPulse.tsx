import { useEffect, useRef } from "react";

interface Dot { gx: number; gy: number; x: number; y: number; alpha: number; rank?: number; }

export function RadarPulse() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf: number;

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);

    let angle = 0;
    const dots: Dot[] = [];
    const GRID = 55;

    const getGrid = () => {
      const W = canvas.width, H = canvas.height;
      const cols = Math.ceil(W / GRID) + 1;
      const rows = Math.ceil(H / GRID) + 1;
      return { cols, rows, W, H };
    };

    const draw = () => {
      const { W, H } = getGrid();
      ctx.clearRect(0, 0, W, H);

      ctx.fillStyle = "#020c1b";
      ctx.fillRect(0, 0, W, H);

      const vanishX = W * 0.5;
      const vanishY = H * 0.3;
      const perspective = H * 1.2;

      const cols = 20, rows = 18;
      const gridW = W * 2.5;
      const gridH = H * 1.6;

      ctx.strokeStyle = "rgba(20,184,166,0.12)";
      ctx.lineWidth = 0.8;

      for (let c = 0; c <= cols; c++) {
        const rx = (c / cols) * gridW - gridW / 2;
        const topX = vanishX + (rx / perspective) * vanishY;
        const botX = vanishX + (rx / perspective) * (vanishY + gridH);
        ctx.beginPath(); ctx.moveTo(topX, vanishY); ctx.lineTo(botX, vanishY + gridH); ctx.stroke();
      }
      for (let r = 0; r <= rows; r++) {
        const t = r / rows;
        const y = vanishY + t * gridH;
        const spread = (t * gridW) / perspective * 0.5;
        ctx.beginPath(); ctx.moveTo(vanishX - t * gridW / 2, y); ctx.lineTo(vanishX + t * gridW / 2, y); ctx.stroke();
      }

      const sweepX = vanishX + Math.cos(angle) * W * 0.6;
      const sweepY = vanishY + Math.abs(Math.sin(angle)) * gridH * 0.9;

      const grad = ctx.createConicalGradient
        ? null
        : ctx.createLinearGradient(vanishX, vanishY, sweepX, sweepY);

      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          const t = r / rows;
          const y = vanishY + t * gridH;
          const xOff = ((c / cols) - 0.5) * t * gridW;
          const x = vanishX + xOff;
          const dx = x - vanishX, dy = y - vanishY;
          const dotAngle = Math.atan2(dy, Math.sqrt(dx * dx + dy * dy)) + angle * 0.3;
          const sweepDiff = Math.abs(((angle % (Math.PI * 2)) - Math.atan2(dy, dx) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
          if (sweepDiff < 0.25) {
            const existing = dots.find(d => d.gx === c && d.gy === r);
            if (!existing) {
              dots.push({ gx: c, gy: r, x, y, alpha: 1, rank: Math.random() < 0.08 ? Math.ceil(Math.random() * 3) : undefined });
            } else {
              existing.alpha = 1;
            }
          }
        }
      }

      for (const d of dots) {
        if (d.alpha <= 0) continue;
        const rankColors = ["#fbbf24", "#818cf8", "#2dd4bf"];
        const col = d.rank ? rankColors[d.rank - 1] : `rgba(20,184,166,${d.alpha * 0.7})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.rank ? 4 : 2, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
        if (d.rank) {
          ctx.fillStyle = col;
          ctx.font = "bold 10px monospace";
          ctx.fillText(`#${d.rank}`, d.x + 7, d.y + 4);
        }
        d.alpha -= 0.004;
      }

      const sweepGrad = ctx.createRadialGradient(vanishX, vanishY, 0, vanishX, vanishY, W * 0.7);
      sweepGrad.addColorStop(0, "rgba(20,184,166,0.0)");
      sweepGrad.addColorStop(0.7, "rgba(20,184,166,0.06)");
      sweepGrad.addColorStop(1, "rgba(20,184,166,0)");

      ctx.save();
      ctx.translate(vanishX, vanishY);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, W, -0.35, 0);
      ctx.closePath();
      ctx.fillStyle = "rgba(20,184,166,0.07)";
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(0) * W * 0.9, Math.sin(0) * H * 0.5);
      ctx.strokeStyle = "rgba(20,184,166,0.5)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      angle += 0.008;
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", minHeight: "100vh", position: "relative", background: "#020c1b", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", padding: "0 40px", textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: "#2dd4bf", textTransform: "uppercase", marginBottom: 16, padding: "5px 14px", border: "1px solid rgba(20,184,166,0.4)", borderRadius: 20, background: "rgba(20,184,166,0.08)", display: "inline-block" }}>GEO Intelligence Platform</div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 800, color: "#f1f5f9", lineHeight: 1.15, margin: "0 0 20px", maxWidth: 640 }}>
          Dominate <span style={{ color: "#2dd4bf" }}>AI Search</span> Rankings Before Your Competitors Do
        </h1>
        <p style={{ fontSize: 16, color: "#64748b", maxWidth: 480, lineHeight: 1.6, margin: "0 0 36px" }}>
          See exactly why top brands appear in ChatGPT, Gemini & Claude — then outrank them.
        </p>
        <button style={{ padding: "14px 32px", borderRadius: 12, background: "#fff", color: "#020c1b", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", boxShadow: "0 0 24px rgba(255,255,255,0.2)" }}>
          Start Free Analysis →
        </button>
      </div>
    </div>
  );
}

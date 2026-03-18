import { useEffect, useRef } from "react";

interface Node {
  x: number; y: number; vx: number; vy: number;
  radius: number; pulsePhase: number; pulseSpeed: number;
  color: string;
}

const COLORS = ["#6366f1", "#2dd4bf", "#818cf8", "#5eead4", "#a78bfa", "#38bdf8"];

export function NeuralConstellation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf: number;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const COUNT = 55;
    const nodes: Node[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.random() * 2.5 + 1,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.02 + 0.008,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    const MAX_DIST = 140;

    const draw = (t: number) => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, W, H);

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            const alpha = (1 - dist / MAX_DIST) * 0.4;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(99,102,241,${alpha})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      for (const node of nodes) {
        node.pulsePhase += node.pulseSpeed;
        const pulse = 0.5 + 0.5 * Math.sin(node.pulsePhase);
        const r = node.radius + pulse * 1.5;

        const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 3);
        grad.addColorStop(0, node.color + "cc");
        grad.addColorStop(1, node.color + "00");
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 3, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();

        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > W) node.vx *= -1;
        if (node.y < 0 || node.y > H) node.vy *= -1;
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", minHeight: "100vh", position: "relative", background: "#030712", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", padding: "0 40px", textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: "#6366f1", textTransform: "uppercase", marginBottom: 16, padding: "5px 14px", border: "1px solid rgba(99,102,241,0.4)", borderRadius: 20, background: "rgba(99,102,241,0.08)", display: "inline-block" }}>GEO Intelligence Platform</div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 800, color: "#f1f5f9", lineHeight: 1.15, margin: "0 0 20px", maxWidth: 640 }}>
          Dominate <span style={{ color: "#818cf8" }}>AI Search</span> Rankings Before Your Competitors Do
        </h1>
        <p style={{ fontSize: 16, color: "#64748b", maxWidth: 480, lineHeight: 1.6, margin: "0 0 36px" }}>
          See exactly why top brands appear in ChatGPT, Gemini & Claude — then outrank them.
        </p>
        <button style={{ padding: "14px 32px", borderRadius: 12, background: "#fff", color: "#030712", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", boxShadow: "0 0 24px rgba(255,255,255,0.25)" }}>
          Start Free Analysis →
        </button>
      </div>
    </div>
  );
}

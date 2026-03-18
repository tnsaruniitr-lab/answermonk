import { useEffect, useRef } from "react";

export function ParticleFlow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf: number;

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);

    const COLORS = [
      [99, 102, 241],   // indigo
      [139, 92, 246],   // violet
      [20, 184, 166],   // teal
      [56, 189, 248],   // sky
      [167, 139, 250],  // purple
    ];

    const N = 380;
    const particles = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: 0.6 + Math.random() * 0.8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      age: Math.random() * 200,
    }));

    const field = (x: number, y: number, t: number) => {
      const scale = 0.003;
      const angle =
        Math.sin(x * scale + t * 0.3) * Math.PI +
        Math.cos(y * scale * 1.2 + t * 0.2) * Math.PI * 0.8 +
        Math.sin((x + y) * scale * 0.6 + t * 0.15) * Math.PI * 0.5;
      return angle;
    };

    let t = 0;

    const draw = () => {
      const W = canvas.width, H = canvas.height;

      ctx.fillStyle = "rgba(3, 7, 18, 0.06)";
      ctx.fillRect(0, 0, W, H);

      for (const p of particles) {
        const angle = field(p.x, p.y, t);
        const dx = Math.cos(angle) * p.speed;
        const dy = Math.sin(angle) * p.speed;

        const [r, g, b] = p.color;
        const alpha = Math.min(p.age / 40, 1) * 0.75;

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        p.x += dx;
        p.y += dy;
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.lineWidth = 1.1;
        ctx.stroke();

        p.age++;

        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H || p.age > 280 + Math.random() * 120) {
          p.x = Math.random() * W;
          p.y = Math.random() * H;
          p.age = 0;
          p.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        }
      }

      t += 0.004;
      raf = requestAnimationFrame(draw);
    };

    ctx.fillStyle = "#030712";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    raf = requestAnimationFrame(draw);

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", minHeight: "100vh", position: "relative", background: "#030712", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 50% 50%, transparent 40%, rgba(3,7,18,0.7) 100%)" }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", padding: "0 40px", textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: "#818cf8", textTransform: "uppercase", marginBottom: 16, padding: "5px 14px", border: "1px solid rgba(99,102,241,0.4)", borderRadius: 20, background: "rgba(99,102,241,0.08)", backdropFilter: "blur(8px)", display: "inline-block" }}>GEO Intelligence Platform</div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 800, color: "#f1f5f9", lineHeight: 1.15, margin: "0 0 20px", maxWidth: 640, textShadow: "0 0 60px rgba(99,102,241,0.4)" }}>
          Dominate <span style={{ color: "#a78bfa" }}>AI Search</span> Rankings Before Your Competitors Do
        </h1>
        <p style={{ fontSize: 16, color: "#64748b", maxWidth: 480, lineHeight: 1.6, margin: "0 0 36px" }}>
          See exactly why top brands appear in ChatGPT, Gemini & Claude — then outrank them.
        </p>
        <button style={{ padding: "14px 32px", borderRadius: 12, background: "#fff", color: "#030712", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", boxShadow: "0 0 30px rgba(255,255,255,0.22)" }}>
          Start Free Analysis →
        </button>
      </div>
    </div>
  );
}

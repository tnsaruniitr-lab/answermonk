import { useEffect, useRef, useState } from "react";

export function ScanlineGlitch() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf: number;

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);

    let t = 0;
    let glitchTimer = 0;
    let glitchActive = false;
    let glitchDuration = 0;
    let glitchStrips: { y: number; h: number; dx: number; alpha: number }[] = [];
    const NEXT_GLITCH = () => 200 + Math.random() * 350;
    let nextGlitch = NEXT_GLITCH();

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const base = ctx.createLinearGradient(0, 0, W, H);
      base.addColorStop(0, "#040d1e");
      base.addColorStop(0.5, "#060f24");
      base.addColorStop(1, "#030a18");
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, W, H);

      const centerGlow = ctx.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.42, W * 0.55);
      centerGlow.addColorStop(0, "rgba(99,102,241,0.07)");
      centerGlow.addColorStop(0.6, "rgba(20,184,166,0.03)");
      centerGlow.addColorStop(1, "transparent");
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, W, H);

      for (let y = 0; y < H; y += 3) {
        ctx.fillStyle = "rgba(0,0,0,0.18)";
        ctx.fillRect(0, y + 1, W, 1);
      }

      const lineY = (t * 0.4) % H;
      const lineGrad = ctx.createLinearGradient(0, lineY - 30, 0, lineY + 2);
      lineGrad.addColorStop(0, "transparent");
      lineGrad.addColorStop(1, "rgba(99,102,241,0.18)");
      ctx.fillStyle = lineGrad;
      ctx.fillRect(0, lineY - 30, W, 32);

      const vign = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.85);
      vign.addColorStop(0, "transparent");
      vign.addColorStop(1, "rgba(0,0,0,0.65)");
      ctx.fillStyle = vign;
      ctx.fillRect(0, 0, W, H);

      glitchTimer++;
      if (glitchTimer >= nextGlitch && !glitchActive) {
        glitchActive = true;
        glitchDuration = 8 + Math.floor(Math.random() * 12);
        glitchStrips = Array.from({ length: 4 + Math.floor(Math.random() * 5) }, () => ({
          y: Math.random() * H,
          h: 2 + Math.random() * 18,
          dx: (Math.random() - 0.5) * 30,
          alpha: 0.4 + Math.random() * 0.5,
        }));
        glitchTimer = 0;
        nextGlitch = NEXT_GLITCH();
      }

      if (glitchActive) {
        for (const strip of glitchStrips) {
          const imgData = ctx.getImageData(0, strip.y, W, strip.h);
          ctx.globalAlpha = strip.alpha;
          ctx.putImageData(imgData, strip.dx, strip.y);

          ctx.fillStyle = `rgba(99,102,241,${strip.alpha * 0.15})`;
          ctx.fillRect(0, strip.y, W, strip.h);
          ctx.globalAlpha = 1;
        }

        glitchDuration--;
        if (glitchDuration <= 0) {
          glitchActive = false;
          glitchStrips = [];
        }
      }

      t++;
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", minHeight: "100vh", position: "relative", background: "#040d1e", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", padding: "0 40px", textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", color: "#6366f1", textTransform: "uppercase", marginBottom: 16, padding: "5px 14px", border: "1px solid rgba(99,102,241,0.5)", borderRadius: 4, background: "rgba(99,102,241,0.06)", display: "inline-block", fontFamily: "monospace" }}>[ GEO Intelligence Platform ]</div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 800, color: "#e2e8f0", lineHeight: 1.15, margin: "0 0 20px", maxWidth: 640, textShadow: "0 0 40px rgba(99,102,241,0.6), 2px 0 rgba(20,184,166,0.4), -2px 0 rgba(251,191,36,0.2)" }}>
          Dominate <span style={{ color: "#818cf8", textShadow: "0 0 20px rgba(129,140,248,0.8)" }}>AI Search</span> Rankings Before Your Competitors Do
        </h1>
        <p style={{ fontSize: 16, color: "#475569", maxWidth: 480, lineHeight: 1.6, margin: "0 0 36px", fontFamily: "monospace", letterSpacing: "0.01em" }}>
          See exactly why top brands appear in ChatGPT, Gemini & Claude — then outrank them.
        </p>
        <button style={{ padding: "14px 32px", borderRadius: 4, background: "transparent", color: "#818cf8", fontWeight: 700, fontSize: 14, border: "1px solid rgba(99,102,241,0.6)", cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.05em", boxShadow: "0 0 20px rgba(99,102,241,0.2), inset 0 0 20px rgba(99,102,241,0.05)" }}>
          &gt; START ANALYSIS_
        </button>
      </div>
    </div>
  );
}

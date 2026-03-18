import { useEffect, useRef } from "react";

interface Orb { angle: number; speed: number; color: string; glow: string; size: number; }
interface Ring { rx: number; ry: number; tilt: number; rotate: number; rotateSpeed: number; orbs: Orb[]; alpha: number; }

export function OrbitalRings() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf: number;

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);

    const rings: Ring[] = [
      { rx: 0, ry: 0, tilt: 0.35, rotate: 0, rotateSpeed: 0.003, alpha: 0.5,
        orbs: [{ angle: 0, speed: 0.012, color: "#818cf8", glow: "rgba(99,102,241,0.8)", size: 4 },
               { angle: Math.PI, speed: 0.012, color: "#6366f1", glow: "rgba(99,102,241,0.5)", size: 2.5 }] },
      { rx: 0, ry: 0, tilt: -0.5, rotate: 1.1, rotateSpeed: -0.002, alpha: 0.4,
        orbs: [{ angle: 0, speed: 0.018, color: "#2dd4bf", glow: "rgba(20,184,166,0.8)", size: 3.5 },
               { angle: 2.1, speed: 0.018, color: "#0d9488", glow: "rgba(13,148,136,0.5)", size: 2 }] },
      { rx: 0, ry: 0, tilt: 0.15, rotate: 0.6, rotateSpeed: 0.005, alpha: 0.3,
        orbs: [{ angle: 1.0, speed: 0.025, color: "#a78bfa", glow: "rgba(167,139,250,0.8)", size: 3 }] },
      { rx: 0, ry: 0, tilt: -0.25, rotate: 2.0, rotateSpeed: -0.004, alpha: 0.25,
        orbs: [{ angle: 0.5, speed: 0.008, color: "#38bdf8", glow: "rgba(56,189,248,0.8)", size: 2.5 },
               { angle: 3.5, speed: 0.008, color: "#0ea5e9", glow: "rgba(14,165,233,0.5)", size: 2 }] },
    ];

    let t = 0;

    const drawEllipse = (cx: number, cy: number, rx: number, ry: number, tilt: number, rotate: number, alpha: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotate);
      ctx.scale(1, Math.cos(tilt));
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(148,163,184,${alpha * 0.25})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();
    };

    const drawOrb = (cx: number, cy: number, rx: number, ry: number, tilt: number, rotate: number, orb: Orb) => {
      const x3d = Math.cos(orb.angle) * rx;
      const y3d = Math.sin(orb.angle) * ry * Math.cos(tilt);
      const cosR = Math.cos(rotate), sinR = Math.sin(rotate);
      const px = cx + x3d * cosR - y3d * sinR;
      const py = cy + x3d * sinR + y3d * cosR;

      const depth = Math.sin(orb.angle) * Math.cos(tilt);
      const scale = 0.7 + depth * 0.3;

      const g = ctx.createRadialGradient(px, py, 0, px, py, orb.size * 6 * scale);
      g.addColorStop(0, orb.glow);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, orb.size * 6 * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(px, py, orb.size * scale, 0, Math.PI * 2);
      ctx.fillStyle = orb.color;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(px - orb.size * 0.25 * scale, py - orb.size * 0.25 * scale, orb.size * 0.35 * scale, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fill();
    };

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      ctx.fillStyle = "#030918";
      ctx.fillRect(0, 0, W, H);

      const cx = W * 0.5, cy = H * 0.45;

      const coreG = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
      coreG.addColorStop(0, "rgba(255,255,255,0.9)");
      coreG.addColorStop(0.15, "rgba(200,210,255,0.7)");
      coreG.addColorStop(0.5, "rgba(99,102,241,0.2)");
      coreG.addColorStop(1, "transparent");
      ctx.fillStyle = coreG;
      ctx.beginPath();
      ctx.arc(cx, cy, 60, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();

      const BASE_RX = Math.min(W, H) * 0.32;
      const ringScales = [1.0, 0.68, 1.28, 0.48];

      for (let i = 0; i < rings.length; i++) {
        const ring = rings[i];
        const rx = BASE_RX * ringScales[i];
        const ry = rx * 0.55;

        ring.rotate += ring.rotateSpeed;
        for (const orb of ring.orbs) {
          orb.angle += orb.speed;
        }

        drawEllipse(cx, cy, rx, ry, ring.tilt, ring.rotate, ring.alpha);

        for (const orb of ring.orbs) {
          drawOrb(cx, cy, rx, ry, ring.tilt, ring.rotate, orb);
        }
      }

      const vignette = ctx.createRadialGradient(cx, cy, H * 0.3, cx, cy, H * 0.9);
      vignette.addColorStop(0, "transparent");
      vignette.addColorStop(1, "rgba(3,9,24,0.85)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);

      t += 0.01;
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", minHeight: "100vh", position: "relative", background: "#030918", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", padding: "0 40px", textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: "#818cf8", textTransform: "uppercase", marginBottom: 16, padding: "5px 14px", border: "1px solid rgba(99,102,241,0.4)", borderRadius: 20, background: "rgba(99,102,241,0.08)", backdropFilter: "blur(8px)", display: "inline-block" }}>GEO Intelligence Platform</div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 800, color: "#f1f5f9", lineHeight: 1.15, margin: "0 0 20px", maxWidth: 640, textShadow: "0 0 80px rgba(99,102,241,0.5)" }}>
          Dominate <span style={{ color: "#c4b5fd" }}>AI Search</span> Rankings Before Your Competitors Do
        </h1>
        <p style={{ fontSize: 16, color: "#64748b", maxWidth: 480, lineHeight: 1.6, margin: "0 0 36px" }}>
          See exactly why top brands appear in ChatGPT, Gemini & Claude — then outrank them.
        </p>
        <button style={{ padding: "14px 32px", borderRadius: 12, background: "#fff", color: "#030918", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", boxShadow: "0 0 30px rgba(255,255,255,0.25)" }}>
          Start Free Analysis →
        </button>
      </div>
    </div>
  );
}

import { useEffect } from "react";

export default function Tryps() {
  useEffect(() => {
    document.title = "TRYPS — AI Visibility";
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#fff8f8", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 32px", borderBottom: "1px solid rgba(220,38,38,0.08)",
        background: "#fff",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: "#dc2626", borderRadius: 7,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 16, letterSpacing: "-0.04em" }}>T</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em", color: "#111" }}>TRYPS</span>
        </div>
        <a
          href="https://trypsagent.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 13, fontWeight: 600, color: "#dc2626",
            textDecoration: "none", padding: "7px 18px",
            border: "1.5px solid #dc2626", borderRadius: 8,
          }}
        >
          Visit Tryps →
        </a>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "80px 24px 60px", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.18)",
          borderRadius: 20, padding: "5px 14px", marginBottom: 28,
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#dc2626" }}>Tryps · Group Travel App</span>
        </div>

        <h1 style={{
          fontSize: 42, fontWeight: 900, color: "#111", lineHeight: 1.12,
          letterSpacing: "-0.03em", marginBottom: 18,
        }}>
          How does TRYPS show up<br />
          <span style={{ color: "#dc2626" }}>in AI search?</span>
        </h1>

        <p style={{
          fontSize: 17, color: "#555", lineHeight: 1.65, marginBottom: 40, maxWidth: 480, margin: "0 auto 40px",
        }}>
          ChatGPT, Gemini, and Perplexity are becoming the new discovery layer for travel apps.
          See exactly how TRYPS appears — and where the gaps are.
        </p>

        <a
          href="/?brand=tryps&domain=trypsagent.com"
          style={{
            display: "inline-block",
            background: "#dc2626", color: "#fff",
            fontWeight: 700, fontSize: 16,
            padding: "14px 36px", borderRadius: 10,
            textDecoration: "none", letterSpacing: "-0.01em",
            boxShadow: "0 4px 18px rgba(220,38,38,0.28)",
          }}
        >
          Run AI Visibility Audit
        </a>

        <p style={{ marginTop: 14, fontSize: 12, color: "#aaa" }}>Free · Takes ~2 minutes</p>
      </div>

      {/* 3 signals */}
      <div style={{
        maxWidth: 820, margin: "0 auto 80px", padding: "0 24px",
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20,
      }}>
        {[
          { icon: "💬", label: "ChatGPT", desc: "Does TRYPS appear when users ask about group travel apps and trip planning?" },
          { icon: "🔮", label: "Gemini", desc: "How does Google's AI describe TRYPS in group travel and itinerary queries?" },
          { icon: "🔍", label: "Perplexity", desc: "What sources does Perplexity cite when recommending group travel tools?" },
        ].map(item => (
          <div key={item.label} style={{
            background: "#fff", border: "1px solid rgba(220,38,38,0.1)",
            borderRadius: 14, padding: "24px 22px",
            boxShadow: "0 2px 12px rgba(220,38,38,0.05)",
          }}>
            <div style={{ fontSize: 26, marginBottom: 10 }}>{item.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111", marginBottom: 8 }}>{item.label}</div>
            <p style={{ fontSize: 13, color: "#777", lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: "1px solid rgba(220,38,38,0.08)", padding: "20px 32px",
        textAlign: "center", fontSize: 12, color: "#bbb", background: "#fff",
      }}>
        Powered by <a href="https://answermonk.ai" style={{ color: "#dc2626", textDecoration: "none", fontWeight: 600 }}>AnswerMonk</a>
        &nbsp;·&nbsp;
        <a href="https://trypsagent.com" target="_blank" rel="noopener noreferrer" style={{ color: "#bbb", textDecoration: "none" }}>trypsagent.com</a>
      </div>

    </div>
  );
}

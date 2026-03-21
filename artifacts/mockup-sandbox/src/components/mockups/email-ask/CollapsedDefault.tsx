import { useState } from "react";

export function CollapsedDefault() {
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    if (email) setSaved(true);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', sans-serif",
        padding: "32px 16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", gap: "0" }}>

        <div style={{ marginBottom: "8px" }}>
          <span style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#6366f1",
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.18)",
            borderRadius: "20px",
            padding: "4px 12px",
            display: "inline-block",
          }}>
            AI Visibility Engine — Live
          </span>
        </div>

        <h1 style={{
          fontSize: "28px",
          fontWeight: 700,
          color: "#0f172a",
          lineHeight: 1.25,
          margin: "0 0 6px",
        }}>
          When customers ask AI —<br />
          <span style={{ color: "#6366f1" }}>are you the answer?</span>
        </h1>

        <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "20px" }}>
          AnswerMonk makes AI recommend you.
        </p>

        <div style={{
          display: "flex",
          gap: "8px",
          background: "white",
          border: "1.5px solid rgba(99,102,241,0.18)",
          borderRadius: "12px",
          padding: "6px 6px 6px 14px",
          boxShadow: "0 2px 16px rgba(99,102,241,0.08)",
          marginBottom: "10px",
        }}>
          <input
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "13px",
              color: "#0f172a",
              background: "transparent",
            }}
            placeholder="Enter your website to see AI search analysis..."
            defaultValue="valeo.com"
          />
          <button style={{
            background: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "9px 18px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}>
            Audit now →
          </button>
        </div>

        {!expanded && !saved && (
          <button
            onClick={() => setExpanded(true)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "12px",
              color: "#94a3b8",
              textAlign: "left",
              padding: "0",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              lineHeight: 1.4,
              transition: "color 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#6366f1")}
            onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}
          >
            <span style={{ fontSize: "10px" }}>+</span>
            <span>Get results by email <span style={{ opacity: 0.7 }}>(optional)</span></span>
          </button>
        )}

        {expanded && !saved && (
          <div style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            animation: "slideDown 0.2s ease",
          }}>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                flex: 1,
                border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "12px",
                color: "#0f172a",
                outline: "none",
                background: "rgba(255,255,255,0.8)",
              }}
              placeholder="your@email.com"
              autoFocus
            />
            <button
              onClick={handleSave}
              style={{
                background: "#6366f1",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "8px 14px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Save
            </button>
            <button
              onClick={() => setExpanded(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#94a3b8",
                fontSize: "16px",
                lineHeight: 1,
                padding: "0",
              }}
            >
              ×
            </button>
          </div>
        )}

        {saved && (
          <p style={{ fontSize: "12px", color: "#10b981", margin: 0 }}>
            ✓ Got it — we'll send your results to {email}
          </p>
        )}

        <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }`}</style>
      </div>
    </div>
  );
}

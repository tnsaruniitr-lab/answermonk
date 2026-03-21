import { useState } from "react";

export function FailureRecovery() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit() {
    if (email) setSent(true);
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
          marginBottom: "16px",
          opacity: 0.5,
          pointerEvents: "none",
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
            defaultValue="valeo.com"
            readOnly
          />
          <button style={{
            background: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "9px 18px",
            fontSize: "13px",
            fontWeight: 600,
          }}>
            Audit now →
          </button>
        </div>

        {!sent ? (
          <div style={{
            background: "rgba(255,255,255,0.72)",
            border: "1px solid rgba(239,68,68,0.15)",
            borderLeft: "3px solid #f87171",
            borderRadius: "10px",
            padding: "16px",
            backdropFilter: "blur(8px)",
          }}>
            <p style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#0f172a",
              margin: "0 0 4px",
            }}>
              Something interrupted your audit
            </p>
            <p style={{
              fontSize: "12px",
              color: "#64748b",
              margin: "0 0 14px",
              lineHeight: 1.5,
            }}>
              We're on it. Leave your email and we'll send you the complete results as soon as it's done.
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  flex: 1,
                  border: "1px solid rgba(99,102,241,0.25)",
                  borderRadius: "8px",
                  padding: "9px 12px",
                  fontSize: "12px",
                  color: "#0f172a",
                  outline: "none",
                  background: "rgba(255,255,255,0.9)",
                }}
                placeholder="your@email.com"
                autoFocus
              />
              <button
                onClick={handleSubmit}
                style={{
                  background: "#6366f1",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "9px 16px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Notify me
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            background: "rgba(255,255,255,0.72)",
            border: "1px solid rgba(16,185,129,0.2)",
            borderLeft: "3px solid #10b981",
            borderRadius: "10px",
            padding: "16px",
          }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", margin: "0 0 4px" }}>
              ✓ You're on the list
            </p>
            <p style={{ fontSize: "12px", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
              We'll send your full audit to <strong>{email}</strong> once it's complete. Usually within a few minutes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

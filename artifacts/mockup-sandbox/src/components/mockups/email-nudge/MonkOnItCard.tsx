import { useState } from "react";

export function MonkOnItCard() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)",
      fontFamily: "'Inter', sans-serif",
      padding: "28px 20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>
      <div style={{ width: "100%", maxWidth: "520px", display: "flex", flexDirection: "column", gap: "10px" }}>

        {/* Chips — greyed context */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", opacity: 0.45 }}>
          {["Digital assets as a service", "Stablecoin orchestration", "Crypto OTC", "Fiat on-ramp"].map(chip => (
            <span key={chip} style={{
              fontSize: "11px", padding: "3px 10px", borderRadius: "20px",
              background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)",
              color: "#6366f1", fontWeight: 500,
            }}>{chip}</span>
          ))}
        </div>

        {/* ── EMAIL NUDGE ── */}
        {!dismissed && (
          <div style={{
            background: "rgba(255,255,255,0.82)",
            border: "1px solid rgba(99,102,241,0.14)",
            borderLeft: "3px solid #6366f1",
            borderRadius: "10px",
            padding: "12px 14px",
            backdropFilter: "blur(8px)",
            boxShadow: "0 2px 12px rgba(99,102,241,0.07)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                🧘 In a hurry? <span style={{ fontWeight: 400, color: "#64748b" }}>Leave your email and we'll send it to you.</span>
              </p>
              {!sent && (
                <button onClick={() => setDismissed(true)} style={{
                  background: "none", border: "none", color: "#94a3b8",
                  fontSize: "15px", cursor: "pointer", lineHeight: 1, padding: "0 0 0 10px", flexShrink: 0,
                }}>×</button>
              )}
            </div>
            {!sent ? (
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{
                    flex: 1, border: "1px solid rgba(99,102,241,0.22)", borderRadius: "7px",
                    padding: "8px 11px", fontSize: "12px", color: "#0f172a", outline: "none",
                    background: "rgba(255,255,255,0.9)",
                  }}
                />
                <button
                  onClick={() => { if (email.includes("@")) setSent(true); }}
                  style={{
                    background: "#6366f1", color: "white", border: "none", borderRadius: "7px",
                    padding: "8px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Send report →
                </button>
              </div>
            ) : (
              <p style={{ fontSize: "12px", color: "#10b981", fontWeight: 600, margin: 0 }}>
                ✓ We'll send to <strong>{email}</strong> when done.
              </p>
            )}
          </div>
        )}

        {/* Dark dispatch panel — context */}
        <div style={{
          background: "#0d1526", borderRadius: "14px", padding: "16px",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: 28, height: 28, borderRadius: "7px", background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>⚡</div>
              <div>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "#f8fafc", margin: 0 }}>GEO Agent · Prompt Dispatch</p>
                <p style={{ fontSize: "10px", color: "#64748b", margin: 0 }}>fuze.finance · live engine feed</p>
              </div>
            </div>
            <span style={{ fontSize: "10px", color: "#10b981", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
              LIVE
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "6px", marginBottom: "10px" }}>
            {[["144", "DISPATCHED", "#6366f1"], ["72", "COMPLETE", "#10b981"], ["2", "IN FLIGHT", "#f59e0b"], ["0", "MENTIONS", "#94a3b8"]].map(([val, label, col]) => (
              <div key={label} style={{ background: "#060f1e", borderRadius: "7px", padding: "8px", textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p style={{ fontSize: "17px", fontWeight: 700, color: col as string, margin: "0 0 1px" }}>{val}</p>
                <p style={{ fontSize: "8px", letterSpacing: "0.07em", color: "#64748b", margin: 0 }}>{label}</p>
              </div>
            ))}
          </div>
          <div style={{ background: "#060f1e", borderRadius: "7px", padding: "9px 11px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <p style={{ fontSize: "8px", letterSpacing: "0.08em", color: "#475569", margin: "0 0 6px" }}>LIVE DISPATCH LOG</p>
            {[
              ["22:15:09", "→", "[Claude]", `"Who leads "Fiat on-ramp" in UAE?"`, "#a78bfa"],
              ["22:15:10", "←", "[Gemini]", "1.8s · …scanning", "#34d399"],
              ["22:15:11", "→", "[ChatGPT]", `"Who leads "Stablecoin orchestration"?"`, "#60a5fa"],
              ["22:15:12", "←", "[Claude]", "1.4s · …scanning", "#34d399"],
            ].map(([time, dir, engine, msg, col], i) => (
              <div key={i} style={{ display: "flex", gap: "6px", fontSize: "9px", fontFamily: "monospace", color: "#94a3b8", marginBottom: "3px" }}>
                <span style={{ color: "#475569", minWidth: 48 }}>{time}</span>
                <span>{dir}</span>
                <span style={{ color: col as string, minWidth: 52 }}>{engine}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

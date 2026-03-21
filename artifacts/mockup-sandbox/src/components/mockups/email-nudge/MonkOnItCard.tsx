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
      padding: "32px 20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>
      <div style={{ width: "100%", maxWidth: "560px", display: "flex", flexDirection: "column", gap: "12px" }}>

        {/* Context label */}
        <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8", margin: 0 }}>
          Segment selection complete
        </p>

        {/* Chips row — greyed out context */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", opacity: 0.5 }}>
          {["Digital assets as a service", "Stablecoin orchestration", "Crypto OTC", "Fiat on-ramp"].map(chip => (
            <span key={chip} style={{
              fontSize: "11px", padding: "4px 10px", borderRadius: "20px",
              background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)",
              color: "#6366f1", fontWeight: 500,
            }}>{chip}</span>
          ))}
        </div>

        {/* ── EMAIL NUDGE CARD ── */}
        {!dismissed && (
          <div style={{
            background: "rgba(255,255,255,0.82)",
            border: "1px solid rgba(99,102,241,0.14)",
            borderLeft: "3px solid #6366f1",
            borderRadius: "12px",
            padding: "16px 18px",
            backdropFilter: "blur(8px)",
            boxShadow: "0 2px 16px rgba(99,102,241,0.07)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span style={{ fontSize: "18px" }}>🧘</span>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                  The Monk is on it
                </p>
              </div>
              {!sent && (
                <button onClick={() => setDismissed(true)} style={{
                  background: "none", border: "none", color: "#94a3b8",
                  fontSize: "16px", cursor: "pointer", lineHeight: 1, padding: "0 0 0 8px",
                }}>×</button>
              )}
            </div>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 14px", lineHeight: 1.6 }}>
              Deep analysis across ChatGPT, Claude, Gemini and Perplexity takes <strong style={{ color: "#475569" }}>4–6 minutes</strong>. Drop your email and we'll send the full report the moment it's ready — no need to stay on the page.
            </p>

            {!sent ? (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{
                    flex: 1, border: "1px solid rgba(99,102,241,0.22)", borderRadius: "8px",
                    padding: "9px 12px", fontSize: "12px", color: "#0f172a", outline: "none",
                    background: "rgba(255,255,255,0.9)",
                  }}
                />
                <button
                  onClick={() => { if (email.includes("@")) setSent(true); }}
                  style={{
                    background: "#6366f1", color: "white", border: "none", borderRadius: "8px",
                    padding: "9px 16px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Send me the report →
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "14px" }}>✓</span>
                <p style={{ fontSize: "12px", color: "#10b981", fontWeight: 600, margin: 0 }}>
                  Got it — we'll send to <strong>{email}</strong> when the Monk surfaces.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Dark dispatch panel below — context */}
        <div style={{
          background: "#0d1526",
          borderRadius: "16px",
          padding: "18px",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: 32, height: 32, borderRadius: "8px", background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>⚡</div>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc", margin: 0 }}>GEO Agent · Prompt Dispatch</p>
                <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>fuze.finance · live engine feed</p>
              </div>
            </div>
            <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
              LIVE
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px", marginBottom: "12px" }}>
            {[["144", "DISPATCHED", "#6366f1"], ["72", "COMPLETE", "#10b981"], ["2", "IN FLIGHT", "#f59e0b"], ["0", "MENTIONS", "#94a3b8"]].map(([val, label, col]) => (
              <div key={label} style={{ background: "#060f1e", borderRadius: "8px", padding: "10px", textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p style={{ fontSize: "20px", fontWeight: 700, color: col as string, margin: "0 0 2px" }}>{val}</p>
                <p style={{ fontSize: "9px", letterSpacing: "0.08em", color: "#64748b", margin: 0 }}>{label}</p>
              </div>
            ))}
          </div>
          <div style={{ background: "#060f1e", borderRadius: "8px", padding: "10px 12px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <p style={{ fontSize: "9px", letterSpacing: "0.08em", color: "#64748b", margin: "0 0 8px" }}>LIVE DISPATCH LOG</p>
            {[
              ["22:15:09", "→", "[Claude]", `"Who leads "Fiat on-ramp" in UAE?"`, "#a78bfa"],
              ["22:15:10", "←", "[Gemini]", "1.8s · …scanning", "#34d399"],
              ["22:15:11", "→", "[ChatGPT]", `"Who leads "Stablecoin orchestration"?"`, "#60a5fa"],
              ["22:15:12", "←", "[Claude]", "1.4s · …scanning", "#34d399"],
            ].map(([time, dir, engine, msg, col], i) => (
              <div key={i} style={{ display: "flex", gap: "8px", fontSize: "10px", fontFamily: "monospace", color: "#94a3b8", marginBottom: "4px" }}>
                <span style={{ color: "#475569", minWidth: 52 }}>{time}</span>
                <span>{dir}</span>
                <span style={{ color: col as string, minWidth: 56 }}>{engine}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

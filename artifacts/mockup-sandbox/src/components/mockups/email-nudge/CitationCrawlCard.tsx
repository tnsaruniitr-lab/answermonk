import { useState } from "react";

export function CitationCrawlCard() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d1526",
      fontFamily: "'Inter', sans-serif",
      padding: "28px 20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>
      <div style={{ width: "100%", maxWidth: "520px", display: "flex", flexDirection: "column", gap: "10px" }}>

        {/* Scored segments — greyed context */}
        <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#475569", margin: 0 }}>
          Scoring complete · 6 segments
        </p>
        <div style={{ display: "flex", gap: "6px", opacity: 0.4 }}>
          {[["Digital assets", "74%"], ["Stablecoin", "61%"], ["Crypto OTC", "82%"]].map(([s, pct]) => (
            <div key={s} style={{ flex: 1, background: "#060f1e", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "8px 10px" }}>
              <p style={{ fontSize: "9px", color: "#64748b", margin: "0 0 3px" }}>{s}</p>
              <p style={{ fontSize: "16px", fontWeight: 700, color: "#6366f1", margin: 0 }}>{pct}</p>
            </div>
          ))}
        </div>

        {/* ── EMAIL NUDGE — citation phase ── */}
        {!sent ? (
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderLeft: "3px solid #f59e0b",
            borderRadius: "10px",
            padding: "12px 14px",
          }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#f8fafc", margin: "0 0 8px" }}>
              🔍 Citation crawl running — <span style={{ fontWeight: 400, color: "#94a3b8" }}>~2 min. Email yourself the report link.</span>
            </p>
            <div style={{ display: "flex", gap: "6px" }}>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{
                  flex: 1, border: "1px solid rgba(245,158,11,0.25)", borderRadius: "7px",
                  padding: "8px 11px", fontSize: "12px", color: "#f1f5f9", outline: "none",
                  background: "rgba(255,255,255,0.05)",
                }}
              />
              <button
                onClick={() => { if (email.includes("@")) setSent(true); }}
                style={{
                  background: "#f59e0b", color: "#0f172a", border: "none", borderRadius: "7px",
                  padding: "8px 14px", fontSize: "12px", fontWeight: 700, cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Email link →
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            background: "rgba(16,185,129,0.06)",
            border: "1px solid rgba(16,185,129,0.18)",
            borderLeft: "3px solid #10b981",
            borderRadius: "10px",
            padding: "10px 14px",
          }}>
            <p style={{ fontSize: "12px", color: "#6ee7b7", fontWeight: 600, margin: 0 }}>
              ✓ Link will land in <strong>{email}</strong> once citation analysis wraps up.
            </p>
          </div>
        )}

        {/* Crawl progress */}
        <div style={{
          background: "rgba(255,255,255,0.03)", borderRadius: "10px",
          padding: "12px 14px", border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
              <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>Crawling citation sources</p>
            </div>
            <p style={{ fontSize: "11px", color: "#f59e0b", fontWeight: 600, margin: 0 }}>247 / 631</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "4px", height: "3px", overflow: "hidden", marginBottom: "8px" }}>
            <div style={{ width: "39%", height: "100%", background: "linear-gradient(90deg, #f59e0b, #fbbf24)", borderRadius: "4px" }} />
          </div>
          <p style={{ fontSize: "9px", color: "#475569", margin: 0, fontFamily: "monospace" }}>
            → collectonline.eu · accessible · classified: directory
          </p>
        </div>

      </div>
    </div>
  );
}

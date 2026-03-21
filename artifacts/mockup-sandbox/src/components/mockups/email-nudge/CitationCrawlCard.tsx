import { useState } from "react";

export function CitationCrawlCard() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [crawling, setCrawling] = useState(true);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d1526",
      fontFamily: "'Inter', sans-serif",
      padding: "32px 20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>
      <div style={{ width: "100%", maxWidth: "560px", display: "flex", flexDirection: "column", gap: "12px" }}>

        {/* Context — segment cards above */}
        <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#475569", margin: 0 }}>
          Scoring complete · 6 segments
        </p>
        <div style={{ display: "flex", gap: "8px", opacity: 0.45 }}>
          {["Digital assets", "Stablecoin", "Crypto OTC"].map(s => (
            <div key={s} style={{ flex: 1, background: "#060f1e", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "10px 12px" }}>
              <p style={{ fontSize: "10px", color: "#64748b", margin: "0 0 4px" }}>{s}</p>
              <p style={{ fontSize: "18px", fontWeight: 700, color: "#6366f1", margin: 0 }}>74%</p>
            </div>
          ))}
        </div>

        {/* Citation panel header */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc", margin: 0 }}>Citation Intelligence</p>
            {crawling && (
              <span style={{ fontSize: "11px", color: "#f59e0b", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", display: "inline-block", animation: "pulse 1s infinite" }} />
                Crawling
              </span>
            )}
          </div>

          {/* ── EMAIL NUDGE CARD — citation phase ── */}
          {!sent ? (
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(245,158,11,0.2)",
              borderLeft: "3px solid #f59e0b",
              borderRadius: "12px",
              padding: "16px 18px",
              marginBottom: "10px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span style={{ fontSize: "16px" }}>🔍</span>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
                  Citation crawl is running
                </p>
              </div>
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 14px", lineHeight: 1.6 }}>
                We're scraping and classifying every URL your competitors are cited from — Trustpilot, Clutch, directories, brand sites. Takes another <strong style={{ color: "#cbd5e1" }}>1–2 minutes</strong>. We'll email you a link to come back to the full report.
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{
                    flex: 1, border: "1px solid rgba(245,158,11,0.25)", borderRadius: "8px",
                    padding: "9px 12px", fontSize: "12px", color: "#f1f5f9", outline: "none",
                    background: "rgba(255,255,255,0.05)",
                  }}
                />
                <button
                  onClick={() => { if (email.includes("@")) setSent(true); }}
                  style={{
                    background: "#f59e0b", color: "#0f172a", border: "none", borderRadius: "8px",
                    padding: "9px 16px", fontSize: "12px", fontWeight: 700, cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Email me the link →
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              background: "rgba(16,185,129,0.06)",
              border: "1px solid rgba(16,185,129,0.2)",
              borderLeft: "3px solid #10b981",
              borderRadius: "12px",
              padding: "14px 18px",
              marginBottom: "10px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}>
              <span style={{ fontSize: "18px" }}>✓</span>
              <p style={{ fontSize: "12px", color: "#6ee7b7", fontWeight: 600, margin: 0 }}>
                Report link will land in <strong>{email}</strong> once citation analysis wraps up.
              </p>
            </div>
          )}

          {/* Crawl progress bar */}
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>Crawling citation sources</p>
              <p style={{ fontSize: "11px", color: "#f59e0b", fontWeight: 600, margin: 0 }}>247 / 631 URLs</p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "4px", height: "4px", overflow: "hidden" }}>
              <div style={{ width: "39%", height: "100%", background: "linear-gradient(90deg, #f59e0b, #fbbf24)", borderRadius: "4px" }} />
            </div>
            <p style={{ fontSize: "10px", color: "#475569", margin: "8px 0 0", fontFamily: "monospace" }}>
              → collectonline.eu · accessible · classified: directory
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";

const COMPETING_BRANDS = ["nikerunning.com", "allbirds.com", "asics.com"];
const SEGMENTS_FOUND = ["Prescription Eyewear", "Sunglasses", "Eye Exams", "Contact Lenses", "Blue Light Glasses"];
const WEBSITE = "warbyparker.com";

function PulsingDot({ delay = 0, active = true }: { delay?: number; active?: boolean }) {
  return (
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: active ? "#6366f1" : "rgba(255,255,255,0.1)",
        boxShadow: active ? "0 0 8px #6366f1" : "none",
        animation: active ? `pulse 1.8s ease-in-out ${delay}s infinite` : "none",
      }}
    />
  );
}

function AgentSlot({ label, domain, progress, color }: { label: string; domain: string; progress: number; color: string }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 12,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: `${color}18`,
          border: `1px solid ${color}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        ⬡
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
          <span style={{ fontSize: 12, color: "#e5e7eb", fontWeight: 500 }}>{domain}</span>
          <span style={{ fontSize: 10, color: color, fontWeight: 700 }}>{progress}%</span>
        </div>
        <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${color}80, ${color})`,
              borderRadius: 99,
              transition: "width 0.4s ease",
            }}
          />
        </div>
        <div style={{ fontSize: 10, color: "#4b5563", marginTop: 3 }}>{label}</div>
      </div>
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#10b981",
          boxShadow: "0 0 6px #10b981",
          flexShrink: 0,
          animation: "pulse 2s ease-in-out infinite",
        }}
      />
    </div>
  );
}

export function QueueScreen() {
  const [view, setView] = useState<"queued" | "confirmed">("queued");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState([67, 44, 81]);

  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => p.map((v) => Math.min(99, v + Math.floor(Math.random() * 3))));
    }, 1800);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = () => {
    if (!email.includes("@")) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setView("confirmed");
    }, 900);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #0d0f1a 0%, #0a0c14 60%, #080b12 100%)",
        fontFamily: "Inter, sans-serif",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {view === "queued" ? (
        <div style={{ width: "100%", maxWidth: 480, animation: "fadeUp 0.4s ease" }}>

          {/* Status badge */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.25)",
                borderRadius: 20,
                padding: "5px 14px",
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", animation: "pulse 1.5s ease-in-out infinite" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#fbbf24" }}>Intelligence Engine at Capacity</span>
            </div>
          </div>

          {/* Headline */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 10px", lineHeight: 1.3 }}>
              Your audit is queued
            </h1>
            <p style={{ fontSize: 14, color: "#9ca3af", margin: 0, lineHeight: 1.6 }}>
              3 audits are running right now. We found your segments
              and competitors — your full analysis will start the moment a slot opens.
            </p>
          </div>

          {/* Website + preview strip */}
          <div
            style={{
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: 14,
              padding: "14px 16px",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div
                style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: "rgba(99,102,241,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: "#a5b4fc",
                }}
              >
                W
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#a5b4fc" }}>{WEBSITE}</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>Step 1 complete · waiting for slot</div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 11, color: "#6b7280" }}>Position</span>
                <span
                  style={{
                    fontSize: 13, fontWeight: 800, color: "#f59e0b",
                    background: "rgba(245,158,11,0.12)",
                    border: "1px solid rgba(245,158,11,0.2)",
                    borderRadius: 6, padding: "1px 7px",
                  }}
                >
                  #1
                </span>
              </div>
            </div>

            {/* Segments found */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4b5563", marginBottom: 6 }}>
                5 segments ready to analyse
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {SEGMENTS_FOUND.map((s) => (
                  <span
                    key={s}
                    style={{
                      fontSize: 11, color: "#d1d5db", fontWeight: 500,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 6, padding: "2px 8px",
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Live agent slots */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4b5563", marginBottom: 8 }}>
              3 / 3 agent slots occupied
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <AgentSlot label="Scoring citation intelligence" domain="nikerunning.com" progress={progress[0]} color="#10b981" />
              <AgentSlot label="Mapping authority sources" domain="allbirds.com" progress={progress[1]} color="#3b82f6" />
              <AgentSlot label="Running segment analysis" domain="asics.com" progress={progress[2]} color="#8b5cf6" />
            </div>
          </div>

          {/* Email capture */}
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              padding: "16px",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: "#e5e7eb", marginBottom: 4 }}>
              Notify me when it's done
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
              We'll email you the moment your GEO Intelligence Report is ready.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#fff",
                  outline: "none",
                  fontFamily: "Inter, sans-serif",
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  background: submitting ? "rgba(99,102,241,0.5)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 18px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: submitting ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                  fontFamily: "Inter, sans-serif",
                  boxShadow: "0 0 20px rgba(99,102,241,0.3)",
                  transition: "all 0.2s",
                }}
              >
                {submitting ? "..." : "Notify me →"}
              </button>
            </div>
          </div>

          <p style={{ textAlign: "center", fontSize: 11, color: "#374151", marginTop: 14 }}>
            No account needed · Your report will be emailed directly to you
          </p>
        </div>
      ) : (
        /* Confirmed state */
        <div style={{ width: "100%", maxWidth: 420, textAlign: "center", animation: "fadeUp 0.4s ease" }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "rgba(16,185,129,0.15)",
              border: "2px solid rgba(16,185,129,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, margin: "0 auto 24px",
            }}
          >
            ✓
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 10px", color: "#fff" }}>
            You're in the queue
          </h1>
          <p style={{ fontSize: 14, color: "#9ca3af", lineHeight: 1.7, margin: "0 0 28px" }}>
            We've saved your spot for <span style={{ color: "#a5b4fc", fontWeight: 600 }}>{WEBSITE}</span>.
            The moment a slot opens, your audit runs automatically and we'll send the report to your inbox.
          </p>

          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14,
              padding: "16px 20px",
              textAlign: "left",
              marginBottom: 20,
            }}
          >
            {[
              { icon: "⬡", label: "Segments ready", value: "5 detected" },
              { icon: "✦", label: "Queue position", value: "#1 — next up" },
              { icon: "◈", label: "Est. wait time", value: "~12 minutes" },
            ].map(({ icon, label, value }) => (
              <div
                key={label}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#9ca3af" }}>
                  <span style={{ color: "#6366f1" }}>{icon}</span> {label}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#e5e7eb" }}>{value}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setView("queued")}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              padding: "10px 20px",
              fontSize: 13,
              color: "#6b7280",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
            }}
          >
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";

const agents = [
  {
    id: "auditr",
    name: "Auditr",
    emoji: "🔍",
    accent: "#f59e0b",
    accentDim: "rgba(245,158,11,0.12)",
    accentBorder: "rgba(245,158,11,0.3)",
    tagline: "Audits your AI visibility",
    description:
      "Scans ChatGPT, Claude and Gemini to show exactly where you rank, how often you're cited, and which competitors are eating your share of AI real estate.",
    status: "Active",
    statusColor: "#22c55e",
    pills: ["Citation scoring", "Engine comparison", "Gap analysis"],
  },
  {
    id: "listnr",
    name: "Listnr",
    emoji: "📡",
    accent: "#06b6d4",
    accentDim: "rgba(6,182,212,0.12)",
    accentBorder: "rgba(6,182,212,0.3)",
    tagline: "Monitors you and your competitors across authority domains",
    description:
      "Continuously watches where your brand and rivals appear across high-authority sources — Reddit, G2, industry blogs, and the domains AI engines trust most.",
    status: "Beta",
    statusColor: "#a78bfa",
    pills: ["Real-time alerts", "Competitor tracking", "Authority domain feed"],
  },
  {
    id: "fixr",
    name: "Fixr",
    emoji: "✍️",
    accent: "#8b5cf6",
    accentDim: "rgba(139,92,246,0.12)",
    accentBorder: "rgba(139,92,246,0.3)",
    tagline: "Creates content that works — with human in the loop",
    description:
      "Generates AI-optimised content, citations and outpost articles tailored to the gaps Auditr found. Every piece goes through a human review step before it goes live.",
    status: "Coming soon",
    statusColor: "#64748b",
    pills: ["Content generation", "Human review loop", "Outpost publishing"],
  },
];

export function HireAgents() {
  const [open, setOpen] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0f1a 0%, #0d1526 50%, #0a0f1a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "48px 24px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Header label */}
      <p style={{ color: "#475569", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 32, fontWeight: 600 }}>
        openclaw — AI Agent Platform
      </p>

      {/* Nav strip */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14,
          padding: "6px",
          backdropFilter: "blur(12px)",
          marginBottom: open ? 0 : 32,
        }}
      >
        {["AI Directory", "Hire Agents"].map((tab) => {
          const active = tab === "Hire Agents";
          return (
            <button
              key={tab}
              onClick={() => setOpen(tab === "Hire Agents" ? !open : false)}
              style={{
                padding: "10px 22px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.01em",
                transition: "all 0.2s",
                background: active
                  ? "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)"
                  : "transparent",
                color: active ? "#e0f2fe" : "#64748b",
                boxShadow: active ? "0 0 20px rgba(59,130,246,0.25), inset 0 1px 0 rgba(255,255,255,0.1)" : "none",
                position: "relative",
              }}
            >
              {tab}
              {active && (
                <span
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#22c55e",
                    boxShadow: "0 0 6px #22c55e",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Dropdown panel */}
      {open && (
        <div
          style={{
            marginTop: 8,
            width: "100%",
            maxWidth: 860,
            background: "rgba(15,23,42,0.85)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            backdropFilter: "blur(24px)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
            overflow: "hidden",
          }}
        >
          {/* Panel header */}
          <div
            style={{
              padding: "20px 28px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <p style={{ color: "#94a3b8", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 2 }}>
                Specialist AI Agents
              </p>
              <p style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 500 }}>
                Hire an agent to run autonomously on your brand
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" }} />
              <span style={{ color: "#22c55e", fontSize: 11, fontWeight: 600 }}>2 running</span>
            </div>
          </div>

          {/* Agent rows */}
          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            {agents.map((agent) => {
              const isHovered = hovered === agent.id;
              return (
                <div
                  key={agent.id}
                  onMouseEnter={() => setHovered(agent.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 16,
                    padding: "18px 20px",
                    borderRadius: 14,
                    border: `1px solid ${isHovered ? agent.accentBorder : "rgba(255,255,255,0.06)"}`,
                    background: isHovered ? agent.accentDim : "rgba(255,255,255,0.02)",
                    transition: "all 0.2s",
                    cursor: "pointer",
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: agent.accentDim,
                      border: `1px solid ${agent.accentBorder}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      flexShrink: 0,
                      boxShadow: isHovered ? `0 0 20px ${agent.accentDim}` : "none",
                      transition: "box-shadow 0.2s",
                    }}
                  >
                    {agent.emoji}
                  </div>

                  {/* Body */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{ color: "#f1f5f9", fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>
                        {agent.name}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: agent.statusColor,
                          background: `${agent.statusColor}18`,
                          border: `1px solid ${agent.statusColor}40`,
                          borderRadius: 6,
                          padding: "2px 8px",
                        }}
                      >
                        {agent.status}
                      </span>
                    </div>
                    <p style={{ color: "#94a3b8", fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
                      {agent.tagline}
                    </p>
                    <p style={{ color: "#64748b", fontSize: 12, lineHeight: 1.6, marginBottom: 10 }}>
                      {agent.description}
                    </p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {agent.pills.map((pill) => (
                        <span
                          key={pill}
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: agent.accent,
                            background: agent.accentDim,
                            border: `1px solid ${agent.accentBorder}`,
                            borderRadius: 6,
                            padding: "3px 10px",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {pill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <div style={{ flexShrink: 0, paddingTop: 2 }}>
                    {agent.status === "Coming soon" ? (
                      <button
                        style={{
                          padding: "8px 18px",
                          borderRadius: 9,
                          border: "1px solid rgba(255,255,255,0.1)",
                          background: "transparent",
                          color: "#475569",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "default",
                        }}
                      >
                        Notify me
                      </button>
                    ) : (
                      <button
                        style={{
                          padding: "8px 18px",
                          borderRadius: 9,
                          border: `1px solid ${agent.accentBorder}`,
                          background: isHovered ? agent.accent : agent.accentDim,
                          color: isHovered ? "#0a0f1a" : agent.accent,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.2s",
                          boxShadow: isHovered ? `0 0 20px ${agent.accentDim}` : "none",
                        }}
                      >
                        Activate
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "14px 28px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  background: "linear-gradient(135deg, #1e3a8a, #7c3aed)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 9, fontWeight: 900, color: "#e0f2fe" }}>OC</span>
              </div>
              <span style={{ color: "#334155", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em" }}>
                OPENCLAW
              </span>
            </div>
            <span style={{ color: "#1e3a8a", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              View all agents →
            </span>
          </div>
        </div>
      )}

      {/* Below — context explainer */}
      <div style={{ marginTop: 40, maxWidth: 540, textAlign: "center" }}>
        <p style={{ color: "#1e3a8a", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
          How it works
        </p>
        <p style={{ color: "#334155", fontSize: 13, lineHeight: 1.7 }}>
          Each openclaw agent runs on your brand 24/7. Auditr surfaces where you stand. Listnr watches the authority domains AI trusts. Fixr fixes the gaps.
        </p>
      </div>
    </div>
  );
}

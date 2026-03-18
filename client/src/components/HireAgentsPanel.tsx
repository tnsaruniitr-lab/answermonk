import { useState } from "react";

const agents = [
  {
    id: "auditr",
    name: "Auditr",
    emoji: "🔍",
    accent: "#f59e0b",
    accentDim: "rgba(245,158,11,0.1)",
    accentBorder: "rgba(245,158,11,0.25)",
    tagline: "Audits your AI visibility",
    description:
      "Scans ChatGPT, Claude and Gemini to show exactly where you rank, how often you're cited, and which competitors are eating your share of AI real estate.",
    status: "Active" as const,
    statusColor: "#22c55e",
    pills: ["Citation scoring", "Engine comparison", "Gap analysis"],
  },
  {
    id: "listnr",
    name: "Listnr",
    emoji: "📡",
    accent: "#06b6d4",
    accentDim: "rgba(6,182,212,0.1)",
    accentBorder: "rgba(6,182,212,0.25)",
    tagline: "Monitors you and your competitors across authority domains",
    description:
      "Continuously watches where your brand and rivals appear across high-authority sources — Reddit, G2, industry blogs, and the domains AI engines trust most.",
    status: "Beta" as const,
    statusColor: "#a78bfa",
    pills: ["Real-time alerts", "Competitor tracking", "Authority domain feed"],
  },
  {
    id: "fixr",
    name: "Fixr",
    emoji: "✍️",
    accent: "#8b5cf6",
    accentDim: "rgba(139,92,246,0.1)",
    accentBorder: "rgba(139,92,246,0.25)",
    tagline: "Creates content that works — with human in the loop",
    description:
      "Generates AI-optimised content, citations and outpost articles tailored to the gaps Auditr found. Every piece goes through a human review step before it goes live.",
    status: "Soon" as const,
    statusColor: "#475569",
    pills: ["Content generation", "Human review loop", "Outpost publishing"],
  },
];

const STATUS_LABEL: Record<string, string> = {
  Active: "Active",
  Beta: "Beta",
  Soon: "Coming soon",
};

export function HireAgentsPanel() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="mt-8 max-w-3xl mx-auto" data-testid="hire-agents-panel">
      {/* Header */}
      <div className="mb-6 text-center">
        <p className="text-xs font-semibold tracking-[0.15em] uppercase mb-1" style={{ color: "#334155" }}>
          openclaw — AI Agent Platform
        </p>
        <h2 className="text-2xl font-bold text-white mb-1">Hire an Agent</h2>
        <p style={{ color: "#64748b" }} className="text-sm">
          Specialist agents that run autonomously on your brand — 24/7.
        </p>
      </div>

      {/* Agent cards */}
      <div className="flex flex-col gap-3">
        {agents.map((agent) => {
          const isHovered = hovered === agent.id;
          return (
            <div
              key={agent.id}
              onMouseEnter={() => setHovered(agent.id)}
              onMouseLeave={() => setHovered(null)}
              data-testid={`card-agent-${agent.id}`}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 16,
                padding: "18px 20px",
                borderRadius: 16,
                border: `1px solid ${isHovered ? agent.accentBorder : "rgba(255,255,255,0.07)"}`,
                background: isHovered ? agent.accentDim : "rgba(17,24,39,0.6)",
                transition: "all 0.2s",
                cursor: "pointer",
                backdropFilter: "blur(12px)",
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: agent.accentDim,
                  border: `1px solid ${agent.accentBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  flexShrink: 0,
                  boxShadow: isHovered ? `0 0 24px ${agent.accentDim}` : "none",
                  transition: "box-shadow 0.2s",
                }}
              >
                {agent.emoji}
              </div>

              {/* Body */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
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
                    {STATUS_LABEL[agent.status]}
                  </span>
                </div>
                <p style={{ color: "#94a3b8", fontSize: 12, fontWeight: 500, marginBottom: 6 }}>
                  {agent.tagline}
                </p>
                <p style={{ color: "#475569", fontSize: 12, lineHeight: 1.6, marginBottom: 10 }}>
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
              <div style={{ flexShrink: 0, paddingTop: 4 }}>
                {agent.status === "Soon" ? (
                  <button
                    data-testid={`button-notify-${agent.id}`}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "transparent",
                      color: "#334155",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "default",
                    }}
                  >
                    Notify me
                  </button>
                ) : (
                  <button
                    data-testid={`button-activate-${agent.id}`}
                    style={{
                      padding: "8px 18px",
                      borderRadius: 10,
                      border: `1px solid ${agent.accentBorder}`,
                      background: isHovered ? agent.accent : "transparent",
                      color: isHovered ? "#0a0f1a" : agent.accent,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.2s",
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

      {/* Footer note */}
      <div className="mt-8 text-center">
        <p style={{ color: "#1e3a8a", fontSize: 12 }}>
          Run an analysis above first — agents use your report data to get started.
        </p>
      </div>
    </div>
  );
}

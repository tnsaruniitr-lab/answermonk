import { useState, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";

const agents = [
  {
    id: "auditr",
    name: "Auditr",
    emoji: "🔍",
    accent: "#d97706",
    accentDim: "rgba(245,158,11,0.07)",
    accentBorder: "rgba(245,158,11,0.2)",
    tagline: "Audits your AI visibility",
    description:
      "Scans ChatGPT, Claude and Gemini to show exactly where you rank, how often you're cited, and which competitors are eating your share of AI real estate.",
    status: "Active" as const,
    statusColor: "#059669",
    statusBg: "rgba(5,150,105,0.08)",
    statusBorder: "rgba(5,150,105,0.2)",
    pills: ["Citation scoring", "Engine comparison", "Gap analysis"],
  },
  {
    id: "listnr",
    name: "Listnr",
    emoji: "📡",
    accent: "#0891b2",
    accentDim: "rgba(8,145,178,0.07)",
    accentBorder: "rgba(8,145,178,0.2)",
    tagline: "Monitors you and your competitors across authority domains",
    description:
      "Continuously watches where your brand and rivals appear across high-authority sources — Reddit, G2, industry blogs, and the domains AI engines trust most.",
    status: "Beta" as const,
    statusColor: "#7c3aed",
    statusBg: "rgba(124,58,237,0.08)",
    statusBorder: "rgba(124,58,237,0.2)",
    pills: ["Real-time alerts", "Competitor tracking", "Authority domain feed"],
  },
  {
    id: "fixr",
    name: "Fixr",
    emoji: "✍️",
    accent: "#7c3aed",
    accentDim: "rgba(124,58,237,0.07)",
    accentBorder: "rgba(124,58,237,0.2)",
    tagline: "Creates content that works — with human in the loop",
    description:
      "Generates AI-optimised content, citations and outpost articles tailored to the gaps Auditr found. Every piece goes through a human review step before it goes live.",
    status: "Soon" as const,
    statusColor: "#6b7280",
    statusBg: "rgba(107,114,128,0.08)",
    statusBorder: "rgba(107,114,128,0.2)",
    pills: ["Content generation", "Human review loop", "Outpost publishing"],
  },
];

const STATUS_LABEL: Record<string, string> = {
  Active: "Active",
  Beta: "Beta",
  Soon: "Coming soon",
};

type CaptureState = "idle" | "capturing" | "submitting" | "submitted";

export function HireAgentsPanel() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [captureState, setCaptureState] = useState<Record<string, CaptureState>>({});
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [emailErrors, setEmailErrors] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const getCapture = (id: string): CaptureState => captureState[id] ?? "idle";
  const getEmail = (id: string) => emails[id] ?? "";

  function openCapture(agentId: string) {
    setCaptureState((prev) => ({ ...prev, [agentId]: "capturing" }));
    setEmailErrors((prev) => ({ ...prev, [agentId]: "" }));
    setTimeout(() => inputRefs.current[agentId]?.focus(), 60);
  }

  async function submitInterest(agent: (typeof agents)[0]) {
    const email = getEmail(agent.id).trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailErrors((prev) => ({ ...prev, [agent.id]: "Please enter a valid email." }));
      return;
    }
    setCaptureState((prev) => ({ ...prev, [agent.id]: "submitting" }));
    try {
      await apiRequest("POST", "/api/agents/interest", {
        email,
        agentId: agent.id,
        agentName: agent.name,
      });
      setCaptureState((prev) => ({ ...prev, [agent.id]: "submitted" }));
    } catch {
      setCaptureState((prev) => ({ ...prev, [agent.id]: "capturing" }));
      setEmailErrors((prev) => ({ ...prev, [agent.id]: "Something went wrong — please try again." }));
    }
  }

  return (
    <div className="mt-8 max-w-3xl mx-auto" data-testid="hire-agents-panel">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold mb-1" style={{ color: "#111827" }}>Hire agents to fix your brand's AI search visibility</h2>
      </div>

      <div className="flex flex-col gap-3">
        {agents.map((agent) => {
          const isHovered = hovered === agent.id;
          const capture = getCapture(agent.id);

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
                border: `1px solid ${isHovered ? agent.accentBorder : "rgba(0,0,0,0.08)"}`,
                background: isHovered ? agent.accentDim : "rgba(255,255,255,0.92)",
                boxShadow: isHovered
                  ? `0 4px 20px ${agent.accentDim}`
                  : "0 1px 6px rgba(0,0,0,0.04)",
                transition: "all 0.2s",
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
                  transition: "box-shadow 0.2s",
                }}
              >
                {agent.emoji}
              </div>

              {/* Body */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                  <span style={{ color: "#111827", fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>
                    {agent.name}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: agent.statusColor,
                      background: agent.statusBg,
                      border: `1px solid ${agent.statusBorder}`,
                      borderRadius: 6,
                      padding: "2px 8px",
                    }}
                  >
                    {STATUS_LABEL[agent.status]}
                  </span>
                </div>
                <p style={{ color: "#374151", fontSize: 12, fontWeight: 500, marginBottom: 6 }}>
                  {agent.tagline}
                </p>
                <p style={{ color: "#6b7280", fontSize: 12, lineHeight: 1.6, marginBottom: 10 }}>
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

                {/* Email capture inline */}
                {capture === "capturing" || capture === "submitting" ? (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        ref={(el) => { inputRefs.current[agent.id] = el; }}
                        type="email"
                        value={getEmail(agent.id)}
                        onChange={(e) => {
                          setEmails((prev) => ({ ...prev, [agent.id]: e.target.value }));
                          setEmailErrors((prev) => ({ ...prev, [agent.id]: "" }));
                        }}
                        onKeyDown={(e) => { if (e.key === "Enter") submitInterest(agent); }}
                        placeholder="your@email.com"
                        data-testid={`input-email-${agent.id}`}
                        disabled={capture === "submitting"}
                        style={{
                          flex: 1,
                          background: "rgba(255,255,255,0.9)",
                          border: `1px solid ${emailErrors[agent.id] ? "#ef4444" : agent.accentBorder}`,
                          borderRadius: 8,
                          padding: "7px 12px",
                          color: "#111827",
                          fontSize: 12,
                          outline: "none",
                        }}
                      />
                      <button
                        data-testid={`button-submit-email-${agent.id}`}
                        onClick={() => submitInterest(agent)}
                        disabled={capture === "submitting"}
                        style={{
                          padding: "7px 16px",
                          borderRadius: 8,
                          border: `1px solid ${agent.accentBorder}`,
                          background: agent.accent,
                          color: "#ffffff",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: capture === "submitting" ? "not-allowed" : "pointer",
                          opacity: capture === "submitting" ? 0.6 : 1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {capture === "submitting" ? "Sending…" : "Notify me"}
                      </button>
                    </div>
                    {emailErrors[agent.id] && (
                      <p style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{emailErrors[agent.id]}</p>
                    )}
                  </div>
                ) : capture === "submitted" ? (
                  <div
                    data-testid={`text-confirmation-${agent.id}`}
                    style={{
                      marginTop: 14,
                      padding: "8px 14px",
                      borderRadius: 8,
                      background: "rgba(5,150,105,0.06)",
                      border: "1px solid rgba(5,150,105,0.2)",
                      color: "#059669",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    We'll contact you with further steps.
                  </div>
                ) : null}
              </div>

              {/* CTA — hidden once email capture is open or submitted */}
              {capture === "idle" && (
                <div style={{ flexShrink: 0, paddingTop: 4 }}>
                  <button
                    data-testid={`button-cta-${agent.id}`}
                    onClick={() => openCapture(agent.id)}
                    style={{
                      padding: "8px 18px",
                      borderRadius: 10,
                      border: `1px solid ${agent.accentBorder}`,
                      background: isHovered ? agent.accent : "rgba(255,255,255,0.9)",
                      color: isHovered ? "#ffffff" : agent.accent,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {agent.status === "Soon" ? "Notify me" : "Activate"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <p style={{ color: "#9ca3af", fontSize: 12 }}>
          Run an analysis above first — agents use your report data to get started.
        </p>
      </div>
    </div>
  );
}

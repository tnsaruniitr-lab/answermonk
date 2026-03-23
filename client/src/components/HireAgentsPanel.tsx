import { useState, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";

// ── Modern Flat monk icons ────────────────────────────────────────────────────

function AuditmonkIcon() {
  const accent = "#d97706";
  return (
    <svg viewBox="0 0 56 56" width="40" height="40" fill="none">
      <rect width="56" height="56" rx="14" fill="#fef3c744" />
      {/* Robe base */}
      <ellipse cx="28" cy="50" rx="16" ry="10" fill={accent} opacity="0.18" />
      {/* Head */}
      <circle cx="28" cy="28" r="16" fill="white" />
      {/* Hair cap */}
      <ellipse cx="28" cy="15" rx="12" ry="7" fill={accent} />
      {/* Ear bumps */}
      <ellipse cx="12" cy="29" rx="3" ry="4.5" fill="#fde68a" />
      <ellipse cx="44" cy="29" rx="3" ry="4.5" fill="#fde68a" />
      {/* Closed eyes — downward arcs */}
      <path d="M18 27 Q22 22 26 27" stroke={accent} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M30 27 Q34 22 38 27" stroke={accent} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* Gentle smile */}
      <path d="M22 34 Q28 38 34 34" stroke={accent} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function ListenmonkIcon() {
  const accent = "#0891b2";
  return (
    <svg viewBox="0 0 56 56" width="40" height="40" fill="none">
      <rect width="56" height="56" rx="14" fill="#e0f2fe44" />
      <ellipse cx="28" cy="50" rx="16" ry="10" fill={accent} opacity="0.18" />
      <circle cx="28" cy="28" r="16" fill="white" />
      <ellipse cx="28" cy="15" rx="12" ry="7" fill={accent} />
      {/* Hands covering ears — rounded rectangles */}
      <rect x="8" y="22" width="9" height="14" rx="4.5" fill={accent} opacity="0.75" />
      <rect x="39" y="22" width="9" height="14" rx="4.5" fill={accent} opacity="0.75" />
      {/* Open eyes */}
      <circle cx="22" cy="28" r="4" fill={accent} opacity="0.85" />
      <circle cx="34" cy="28" r="4" fill={accent} opacity="0.85" />
      <circle cx="23.2" cy="26.8" r="1.4" fill="white" />
      <circle cx="35.2" cy="26.8" r="1.4" fill="white" />
      {/* Smile */}
      <path d="M22 34 Q28 38 34 34" stroke={accent} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function FixmonkIcon() {
  const accent = "#7c3aed";
  return (
    <svg viewBox="0 0 56 56" width="40" height="40" fill="none">
      <rect width="56" height="56" rx="14" fill="#ede9fe44" />
      <ellipse cx="28" cy="50" rx="16" ry="10" fill={accent} opacity="0.18" />
      <circle cx="28" cy="28" r="16" fill="white" />
      <ellipse cx="28" cy="15" rx="12" ry="7" fill={accent} />
      <ellipse cx="12" cy="29" rx="3" ry="4.5" fill="#ddd6fe" />
      <ellipse cx="44" cy="29" rx="3" ry="4.5" fill="#ddd6fe" />
      {/* Open eyes */}
      <circle cx="22" cy="26" r="4" fill={accent} opacity="0.85" />
      <circle cx="34" cy="26" r="4" fill={accent} opacity="0.85" />
      <circle cx="23.2" cy="24.8" r="1.4" fill="white" />
      <circle cx="35.2" cy="24.8" r="1.4" fill="white" />
      {/* Sealed / zipped mouth pill */}
      <rect x="18" y="33" width="20" height="6" rx="3" fill={accent} opacity="0.12" stroke={accent} strokeWidth="1.5" />
      {[21, 25, 28, 31, 35].map(x => (
        <circle key={x} cx={x} cy="36" r="1.3" fill={accent} opacity="0.7" />
      ))}
    </svg>
  );
}

// ── Agent data ─────────────────────────────────────────────────────────────────

const agents = [
  {
    id: "auditmonk",
    name: "Auditmonk",
    MonkIcon: AuditmonkIcon,
    accent: "#d97706",
    g1: "#fef3c7",
    accentDim: "rgba(217,119,6,0.07)",
    accentBorder: "rgba(217,119,6,0.2)",
    tagline: "Audits your AI visibility",
    description:
      "Scans ChatGPT, Claude and Gemini to show exactly where you rank, how often you're cited, and which competitors are eating your share of AI real estate.",
    status: "Active" as const,
    statusColor: "#059669",
    statusBg: "rgba(5,150,105,0.1)",
    statusBorder: "rgba(5,150,105,0.25)",
    pills: ["Citation scoring", "Engine comparison", "Gap analysis"],
  },
  {
    id: "listenmonk",
    name: "Listenmonk",
    MonkIcon: ListenmonkIcon,
    accent: "#0891b2",
    g1: "#e0f2fe",
    accentDim: "rgba(8,145,178,0.07)",
    accentBorder: "rgba(8,145,178,0.2)",
    tagline: "Monitors you and your competitors across authority domains",
    description:
      "Continuously watches where your brand and rivals appear across high-authority sources — Reddit, G2, industry blogs, and the domains AI engines trust most.",
    status: "Beta" as const,
    statusColor: "#7c3aed",
    statusBg: "rgba(124,58,237,0.08)",
    statusBorder: "rgba(124,58,237,0.25)",
    pills: ["Real-time alerts", "Competitor tracking", "Authority domain feed"],
  },
  {
    id: "fixmonk",
    name: "Fixmonk",
    MonkIcon: FixmonkIcon,
    accent: "#7c3aed",
    g1: "#ede9fe",
    accentDim: "rgba(124,58,237,0.07)",
    accentBorder: "rgba(124,58,237,0.2)",
    tagline: "Creates content that works — with human in the loop",
    description:
      "Generates AI-optimised content, citations and outpost articles tailored to the gaps Auditmonk found. Every piece goes through a human review step before it goes live.",
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
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "8px 0 32px" }} data-testid="hire-agents-panel">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {agents.map((agent) => {
          const isHovered = hovered === agent.id;
          const capture = getCapture(agent.id);
          const { MonkIcon } = agent;

          return (
            <div
              key={agent.id}
              onMouseEnter={() => setHovered(agent.id)}
              onMouseLeave={() => setHovered(null)}
              data-testid={`card-agent-${agent.id}`}
              style={{
                display: "flex",
                borderRadius: 16,
                overflow: "hidden",
                border: `1px solid ${isHovered ? agent.accentBorder : "rgba(0,0,0,0.08)"}`,
                background: `linear-gradient(160deg, #ffffff 0%, ${agent.g1}44 100%)`,
                boxShadow: isHovered
                  ? `0 8px 32px ${agent.accentDim}, 0 1px 6px rgba(0,0,0,0.04)`
                  : "0 1px 6px rgba(0,0,0,0.05)",
                transition: "box-shadow 0.2s, border-color 0.2s, transform 0.15s",
                transform: isHovered ? "translateY(-2px)" : "translateY(0)",
              }}
            >
              {/* Left accent bar */}
              <div style={{
                width: 4, flexShrink: 0,
                background: `linear-gradient(180deg, ${agent.accent} 0%, ${agent.accent}44 100%)`,
              }} />

              {/* Monk avatar */}
              <div style={{
                width: 76, flexShrink: 0,
                display: "flex", alignItems: "flex-start", justifyContent: "center",
                paddingTop: 18,
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: `linear-gradient(135deg, ${agent.g1}, #ffffff)`,
                  border: `1.5px solid ${agent.accentBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 2px 8px ${agent.accentDim}`,
                }}>
                  <MonkIcon />
                </div>
              </div>

              {/* Body */}
              <div style={{ flex: 1, minWidth: 0, padding: "18px 16px 18px 4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                  <span style={{ color: "#111827", fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em" }}>
                    {agent.name}
                  </span>
                  <span style={{
                    fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em",
                    textTransform: "uppercase" as const,
                    color: agent.statusColor,
                    background: agent.statusBg,
                    border: `1px solid ${agent.statusBorder}`,
                    borderRadius: 6, padding: "2px 8px",
                  }}>
                    {STATUS_LABEL[agent.status]}
                  </span>
                </div>

                <p style={{ color: "#111827", fontSize: 13, fontWeight: 700, margin: "0 0 6px", lineHeight: 1.4 }}>
                  {agent.tagline}
                </p>

                <p style={{ color: "#6b7280", fontSize: 12, lineHeight: 1.65, margin: "0 0 12px" }}>
                  {agent.description}
                </p>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, marginBottom: capture !== "idle" ? 12 : 0 }}>
                  {agent.pills.map((pill) => (
                    <span key={pill} style={{
                      fontSize: 10, fontWeight: 600,
                      color: agent.accent,
                      background: `linear-gradient(135deg, ${agent.accentDim}, ${agent.g1}88)`,
                      border: `1px solid ${agent.accentBorder}`,
                      borderRadius: 6, padding: "3px 10px",
                      letterSpacing: "0.03em",
                    }}>
                      {pill}
                    </span>
                  ))}
                </div>

                {(capture === "capturing" || capture === "submitting") && (
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
                          flex: 1, background: "rgba(255,255,255,0.95)",
                          border: `1px solid ${emailErrors[agent.id] ? "#ef4444" : agent.accentBorder}`,
                          borderRadius: 8, padding: "7px 12px",
                          color: "#111827", fontSize: 12, outline: "none",
                        }}
                      />
                      <button
                        data-testid={`button-submit-email-${agent.id}`}
                        onClick={() => submitInterest(agent)}
                        disabled={capture === "submitting"}
                        style={{
                          padding: "7px 16px", borderRadius: 8, border: "none",
                          background: `linear-gradient(135deg, ${agent.accent}, ${agent.accent}cc)`,
                          color: "#ffffff", fontSize: 12, fontWeight: 700,
                          cursor: capture === "submitting" ? "not-allowed" : "pointer",
                          opacity: capture === "submitting" ? 0.6 : 1,
                          whiteSpace: "nowrap" as const,
                          boxShadow: `0 2px 8px ${agent.accentDim}`,
                        }}
                      >
                        {capture === "submitting" ? "Sending…" : "Notify me"}
                      </button>
                    </div>
                    {emailErrors[agent.id] && (
                      <p style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{emailErrors[agent.id]}</p>
                    )}
                  </div>
                )}

                {capture === "submitted" && (
                  <div
                    data-testid={`text-confirmation-${agent.id}`}
                    style={{
                      marginTop: 14, padding: "8px 14px", borderRadius: 8,
                      background: "rgba(5,150,105,0.06)",
                      border: "1px solid rgba(5,150,105,0.2)",
                      color: "#059669", fontSize: 12, fontWeight: 500,
                    }}
                  >
                    We'll contact you with further steps.
                  </div>
                )}
              </div>

              {capture === "idle" && (
                <div style={{ flexShrink: 0, padding: "18px 20px 18px 0", display: "flex", alignItems: "flex-start" }}>
                  <button
                    data-testid={`button-cta-${agent.id}`}
                    onClick={() => openCapture(agent.id)}
                    style={{
                      padding: "8px 18px", borderRadius: 10,
                      border: `1.5px solid ${agent.accentBorder}`,
                      background: isHovered
                        ? `linear-gradient(135deg, ${agent.accent}, ${agent.accent}dd)`
                        : "rgba(255,255,255,0.95)",
                      color: isHovered ? "#ffffff" : agent.accent,
                      fontSize: 12, fontWeight: 700,
                      cursor: "pointer", transition: "all 0.2s",
                      boxShadow: isHovered ? `0 4px 14px ${agent.accentDim}` : "none",
                      whiteSpace: "nowrap" as const,
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

      <div style={{ marginTop: 28, textAlign: "center" }}>
        <p style={{ color: "#9ca3af", fontSize: 12 }}>
          Run an analysis above first — monks use your report data to get started.
        </p>
      </div>
    </div>
  );
}

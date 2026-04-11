import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, X, ArrowRight, User } from "lucide-react";
import { MonkWordmark } from "@/components/MonkWordmark";

interface PeopleSession {
  id: number;
  name: string;
  headline: string | null;
  current_role: string | null;
  current_company: string | null;
  past_companies: string[];
  roles: string[];
  education: string[];
  location: string | null;
  status: string;
}

interface AnchorChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
}

function AnchorChip({ label, selected, onToggle }: AnchorChipProps) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "7px 14px",
        borderRadius: 100,
        border: selected ? "1.5px solid #6366f1" : "1.5px solid #e5e7eb",
        background: selected ? "#eef2ff" : "#fff",
        color: selected ? "#4f46e5" : "#6b7280",
        fontSize: 13, fontWeight: 600, cursor: "pointer",
        transition: "all 0.15s", fontFamily: "inherit",
      }}
      data-testid={`chip-anchor-${label.replace(/\s+/g, "-").toLowerCase()}`}
    >
      {label}
      {selected && <X size={12} />}
    </button>
  );
}

export default function PeopleAnchors({ sessionId }: { sessionId: number }) {
  const [, navigate] = useLocation();

  const { data: session, isLoading } = useQuery<PeopleSession>({
    queryKey: ["/api/people/session", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/people/session/${sessionId}`);
      return res.json();
    },
  });

  const [selectedWorkplaces, setSelectedWorkplaces] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedEducation, setSelectedEducation] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  if (session && !initialized) {
    const workplaces = [session.current_company, ...(session.past_companies ?? [])].filter(Boolean) as string[];
    const roles = [session.current_role, ...(session.roles ?? [])].filter(Boolean) as string[];
    const education = [...(session.education ?? [])];
    setSelectedWorkplaces(workplaces);
    setSelectedRoles(roles);
    setSelectedEducation(education);
    setInitialized(true);
  }

  const runMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/people/run/${sessionId}`, {
        anchors: {
          workplaces: selectedWorkplaces,
          roles: selectedRoles,
          education: selectedEducation,
        },
      });
      return res.json();
    },
    onSuccess: () => {
      navigate(`/people/analysis/${sessionId}`);
    },
  });

  if (isLoading || !session) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f7ff" }}>
        <Loader2 size={32} color="#6366f1" className="animate-spin" />
      </div>
    );
  }

  const workplaces = [session.current_company, ...(session.past_companies ?? [])].filter(Boolean) as string[];
  const roles = [session.current_role, ...(session.roles ?? [])].filter(Boolean) as string[];
  const education = [...(session.education ?? [])];

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
  }

  const hasAnchors = selectedWorkplaces.length + selectedRoles.length + selectedEducation.length > 0;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8f7ff 0%, #eef2ff 50%, #f0f9ff 100%)", fontFamily: "Inter, system-ui, sans-serif" }}>
      <nav style={{ padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(99,102,241,0.1)" }}>
        <a href="/" style={{ textDecoration: "none" }}><MonkWordmark /></a>
        <a href="/reports" style={{ fontSize: 14, color: "#6366f1", fontWeight: 500, textDecoration: "none" }}>Reports</a>
      </nav>

      <main style={{ maxWidth: 600, margin: "0 auto", padding: "60px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "linear-gradient(135deg, #eef2ff, #e0e7ff)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <User size={24} color="#6366f1" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f0a2e", marginBottom: 8 }}>
            Here's what we found about you
          </h1>
          {session.name && (
            <p style={{ fontSize: 18, color: "#4f46e5", fontWeight: 700, marginBottom: 4 }}>{session.name}</p>
          )}
          {session.headline && (
            <p style={{ fontSize: 14, color: "#6b7280" }}>{session.headline}</p>
          )}
          <p style={{ fontSize: 14, color: "#9ca3af", marginTop: 12 }}>
            Deselect any anchors you don't want included in your identity audit
          </p>
        </div>

        <div style={{
          background: "#fff", borderRadius: 16,
          boxShadow: "0 4px 24px rgba(99,102,241,0.08), 0 1px 4px rgba(0,0,0,0.04)",
          padding: 32, marginBottom: 24,
        }}>
          {workplaces.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                Workplaces
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {workplaces.map(w => (
                  <AnchorChip
                    key={w} label={w}
                    selected={selectedWorkplaces.includes(w)}
                    onToggle={() => toggle(selectedWorkplaces, setSelectedWorkplaces, w)}
                  />
                ))}
              </div>
            </div>
          )}

          {roles.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                Roles
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {roles.map(r => (
                  <AnchorChip
                    key={r} label={r}
                    selected={selectedRoles.includes(r)}
                    onToggle={() => toggle(selectedRoles, setSelectedRoles, r)}
                  />
                ))}
              </div>
            </div>
          )}

          {education.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                Education
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {education.map(e => (
                  <AnchorChip
                    key={e} label={e}
                    selected={selectedEducation.includes(e)}
                    onToggle={() => toggle(selectedEducation, setSelectedEducation, e)}
                  />
                ))}
              </div>
            </div>
          )}

          {workplaces.length === 0 && roles.length === 0 && education.length === 0 && (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#9ca3af", fontSize: 14 }}>
              No profile data could be extracted from LinkedIn. The audit will run using your name only.
            </div>
          )}
        </div>

        <button
          onClick={() => runMutation.mutate()}
          disabled={runMutation.isPending}
          data-testid="button-run-audit"
          style={{
            width: "100%",
            background: runMutation.isPending ? "#c7d2fe" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff", border: "none", borderRadius: 12,
            padding: "16px 24px", fontSize: 16, fontWeight: 700,
            cursor: runMutation.isPending ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            fontFamily: "inherit", transition: "all 0.2s",
          }}
        >
          {runMutation.isPending ? (
            <><Loader2 size={18} className="animate-spin" /> Starting audit...</>
          ) : (
            <>Run my AI Identity Audit <ArrowRight size={18} /></>
          )}
        </button>

        <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginTop: 16 }}>
          Analysis takes 2–4 minutes across ChatGPT, Gemini, and Claude
        </p>
      </main>
    </div>
  );
}

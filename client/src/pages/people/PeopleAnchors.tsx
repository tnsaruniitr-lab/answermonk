import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, X, ArrowRight, User, Plus } from "lucide-react";
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

function AnchorChip({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "7px 14px", borderRadius: 100,
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

function TagInput({
  label,
  placeholder,
  values,
  onChange,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const trimmed = draft.trim();
    if (!trimmed || values.includes(trimmed)) { setDraft(""); return; }
    onChange([...values, trimmed]);
    setDraft("");
  }

  function remove(v: string) {
    onChange(values.filter(x => x !== v));
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); add(); }
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
        {label}
      </div>

      {values.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          {values.map(v => (
            <span key={v} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 100,
              background: "#eef2ff", border: "1.5px solid #6366f1",
              color: "#4f46e5", fontSize: 13, fontWeight: 600,
            }}>
              {v}
              <button onClick={() => remove(v)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: "#6366f1" }}>
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={onKey}
          placeholder={placeholder}
          data-testid={`input-anchor-${label.toLowerCase().replace(/\s+/g, "-")}`}
          style={{
            flex: 1, border: "1.5px solid #e5e7eb", borderRadius: 8,
            padding: "9px 14px", fontSize: 14, color: "#1f2937",
            fontFamily: "inherit", outline: "none",
            transition: "border-color 0.15s",
          }}
          onFocus={e => (e.currentTarget.style.borderColor = "#6366f1")}
          onBlur={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
        />
        <button
          onClick={add}
          disabled={!draft.trim()}
          data-testid={`button-add-${label.toLowerCase().replace(/\s+/g, "-")}`}
          style={{
            background: draft.trim() ? "#6366f1" : "#e5e7eb",
            color: "#fff", border: "none", borderRadius: 8,
            padding: "9px 14px", cursor: draft.trim() ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600,
            fontFamily: "inherit",
          }}
        >
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
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

  const crawledWorkplaces = [session.current_company, ...(session.past_companies ?? [])].filter(Boolean) as string[];
  const crawledRoles = [session.current_role, ...(session.roles ?? [])].filter(Boolean) as string[];
  const crawledEducation = [...(session.education ?? [])];
  const hasCrawledData = crawledWorkplaces.length > 0 || crawledRoles.length > 0 || crawledEducation.length > 0;

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
  }

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

          {hasCrawledData ? (
            <>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f0a2e", marginBottom: 8 }}>
                Here's what we found
              </h1>
              {session.name && (
                <p style={{ fontSize: 18, color: "#4f46e5", fontWeight: 700, marginBottom: 4 }}>{session.name}</p>
              )}
              {session.headline && (
                <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 0 }}>{session.headline}</p>
              )}
              <p style={{ fontSize: 14, color: "#9ca3af", marginTop: 12 }}>
                Deselect any anchors you don't want used in your identity audit.
              </p>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f0a2e", marginBottom: 8 }}>
                Tell us about yourself
              </h1>
              {session.name && (
                <p style={{ fontSize: 18, color: "#4f46e5", fontWeight: 700, marginBottom: 4 }}>{session.name}</p>
              )}
              <p style={{ fontSize: 14, color: "#6b7280", marginTop: 8, lineHeight: 1.5 }}>
                LinkedIn didn't share profile data with us. Add your company, role, and education below — these become your identity anchors and help AI engines find the right you.
              </p>
            </>
          )}
        </div>

        <div style={{
          background: "#fff", borderRadius: 16,
          boxShadow: "0 4px 24px rgba(99,102,241,0.08), 0 1px 4px rgba(0,0,0,0.04)",
          padding: 32, marginBottom: 24,
        }}>
          {hasCrawledData ? (
            <>
              {crawledWorkplaces.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                    Workplaces
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {crawledWorkplaces.map(w => (
                      <AnchorChip key={w} label={w}
                        selected={selectedWorkplaces.includes(w)}
                        onToggle={() => toggle(selectedWorkplaces, setSelectedWorkplaces, w)}
                      />
                    ))}
                  </div>
                </div>
              )}
              {crawledRoles.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                    Roles
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {crawledRoles.map(r => (
                      <AnchorChip key={r} label={r}
                        selected={selectedRoles.includes(r)}
                        onToggle={() => toggle(selectedRoles, setSelectedRoles, r)}
                      />
                    ))}
                  </div>
                </div>
              )}
              {crawledEducation.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                    Education
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {crawledEducation.map(e => (
                      <AnchorChip key={e} label={e}
                        selected={selectedEducation.includes(e)}
                        onToggle={() => toggle(selectedEducation, setSelectedEducation, e)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <TagInput
                label="Current company"
                placeholder="e.g. Google, Stripe, your startup name..."
                values={selectedWorkplaces}
                onChange={setSelectedWorkplaces}
              />
              <TagInput
                label="Job title / role"
                placeholder="e.g. CEO, Head of Marketing, Venture Partner..."
                values={selectedRoles}
                onChange={setSelectedRoles}
              />
              <TagInput
                label="Education (optional)"
                placeholder="e.g. Harvard Business School, Stanford..."
                values={selectedEducation}
                onChange={setSelectedEducation}
              />

              {selectedWorkplaces.length === 0 && selectedRoles.length === 0 && (
                <p style={{ fontSize: 12, color: "#d97706", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", marginTop: 8 }}>
                  Add at least your company or role for a more accurate audit. You can skip this and run with name only.
                </p>
              )}
            </>
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

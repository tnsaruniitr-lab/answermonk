import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Loader2, ArrowLeft, CheckCircle2, Download, ChevronDown, ChevronUp,
  Sparkles, AlertCircle, Pencil, Save, X
} from "lucide-react";
import { MonkWordmark } from "@/components/MonkWordmark";
import type { BrandSection } from "@shared/schema";

function getSessionId(): string {
  let sid = localStorage.getItem("brandsmith_session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem("brandsmith_session_id", sid);
  }
  return sid;
}

function getApiBase(): string {
  return import.meta.env.VITE_BRANDSMITH_API_URL || "";
}

const SECTION_ICONS: Record<string, string> = {
  identity: "🏷️",
  product: "📦",
  audience: "🎯",
  competitive_landscape: "⚔️",
  voice_and_tone: "🎙️",
  digital_presence: "🌐",
  seo_content_strategy: "📈",
};

function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? "#059669" : pct >= 60 ? "#d97706" : "#dc2626";
  return (
    <span style={{
      fontSize: "11px", fontWeight: 600, color, backgroundColor: `${color}18`,
      border: `1px solid ${color}30`, borderRadius: "4px", padding: "2px 7px",
    }}>
      {pct}% confidence
    </span>
  );
}

function FieldValue({ val }: { val: unknown }) {
  if (Array.isArray(val)) {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {val.map((item: unknown, i) => (
          <span key={i} style={{
            fontSize: "12px", backgroundColor: "#1f2937", color: "#9ca3af",
            border: "1px solid #374151", borderRadius: "4px", padding: "3px 8px",
          }}>
            {typeof item === "object" ? JSON.stringify(item) : String(item)}
          </span>
        ))}
      </div>
    );
  }
  if (typeof val === "object" && val !== null) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {Object.entries(val).map(([k, v]) => (
          <div key={k} style={{ display: "flex", gap: "8px", fontSize: "13px" }}>
            <span style={{ color: "#4b5563", minWidth: "100px" }}>{k}</span>
            <span style={{ color: "#9ca3af" }}>{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
          </div>
        ))}
      </div>
    );
  }
  return <span style={{ fontSize: "14px", color: "#d1d5db", lineHeight: 1.6 }}>{String(val ?? "—")}</span>;
}

function FieldEditor({
  fieldKey, value, onChange,
}: {
  fieldKey: string;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const strVal = Array.isArray(value)
    ? (value as unknown[]).map(x => (typeof x === "object" ? JSON.stringify(x) : String(x))).join(", ")
    : typeof value === "object" && value !== null
    ? JSON.stringify(value, null, 2)
    : String(value ?? "");

  const isLong = strVal.length > 80;

  return isLong ? (
    <textarea
      value={strVal}
      onChange={e => onChange(e.target.value)}
      rows={4}
      style={{
        width: "100%", backgroundColor: "#0d1117", border: "1px solid #374151",
        borderRadius: "6px", color: "#f9fafb", fontSize: "13px", padding: "10px",
        resize: "vertical", fontFamily: "inherit", outline: "none", boxSizing: "border-box",
      }}
    />
  ) : (
    <input
      type="text"
      value={strVal}
      onChange={e => onChange(e.target.value)}
      style={{
        width: "100%", backgroundColor: "#0d1117", border: "1px solid #374151",
        borderRadius: "6px", color: "#f9fafb", fontSize: "13px", padding: "9px 12px",
        outline: "none", boxSizing: "border-box",
      }}
    />
  );
}

function SectionCard({
  section, editing, onToggleEdit, onSaveEdit,
}: {
  section: BrandSection;
  editing: boolean;
  onToggleEdit: () => void;
  onSaveEdit: (updated: BrandSection) => void;
}) {
  const [open, setOpen] = useState(true);
  const [localData, setLocalData] = useState<Record<string, unknown>>({ ...section.data });

  function handleFieldChange(key: string, val: unknown) {
    setLocalData(prev => ({ ...prev, [key]: val }));
  }

  function handleSave() {
    onSaveEdit({ ...section, data: localData, user_edited: true });
  }

  function handleCancel() {
    setLocalData({ ...section.data });
    onToggleEdit();
  }

  return (
    <div style={{
      backgroundColor: "#111827", border: "1px solid #1f2937",
      borderRadius: "12px", overflow: "hidden",
      boxShadow: section.user_edited ? "0 0 0 1px #6366f130" : "none",
    }}>
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", cursor: "pointer",
        }}
        onClick={() => setOpen(o => !o)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "18px" }}>{SECTION_ICONS[section.section] ?? "📄"}</span>
          <div>
            <span style={{ fontSize: "15px", fontWeight: 600, color: "#f9fafb" }}>{section.title}</span>
            {section.user_edited && (
              <span style={{ marginLeft: "8px", fontSize: "11px", color: "#6366f1" }}>edited</span>
            )}
          </div>
          <ConfidenceBadge score={section.ai_confidence} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {open && (
            <button
              data-testid={`button-edit-${section.section}`}
              onClick={e => { e.stopPropagation(); onToggleEdit(); }}
              style={{
                display: "flex", alignItems: "center", gap: "4px",
                padding: "5px 10px", backgroundColor: "transparent",
                border: "1px solid #374151", borderRadius: "6px",
                color: "#6b7280", fontSize: "12px", cursor: "pointer",
              }}
            >
              <Pencil size={11} /> {editing ? "Cancel" : "Edit"}
            </button>
          )}
          {open ? <ChevronUp size={16} color="#4b5563" /> : <ChevronDown size={16} color="#4b5563" />}
        </div>
      </div>

      {open && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid #1f2937" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", paddingTop: "16px" }}>
            {Object.entries(editing ? localData : section.data).map(([key, val]) => (
              <div key={key}>
                <p style={{ fontSize: "11px", color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
                  {key.replace(/_/g, " ")}
                </p>
                {editing
                  ? <FieldEditor fieldKey={key} value={localData[key]} onChange={v => handleFieldChange(key, v)} />
                  : <FieldValue val={val} />
                }
              </div>
            ))}
          </div>

          {editing && (
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button
                data-testid={`button-save-${section.section}`}
                onClick={handleSave}
                style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  padding: "8px 16px", backgroundColor: "#6366f1", color: "#fff",
                  border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                }}
              >
                <Save size={13} /> Save changes
              </button>
              <button
                onClick={handleCancel}
                style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  padding: "8px 14px", backgroundColor: "transparent", color: "#6b7280",
                  border: "1px solid #374151", borderRadius: "6px", fontSize: "13px", cursor: "pointer",
                }}
              >
                <X size={13} /> Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProgressBar({ pct, message, step }: { pct: number; message: string; step: string }) {
  const stepColors: Record<string, string> = {
    crawling: "#3b82f6",
    researching: "#8b5cf6",
    synthesizing: "#6366f1",
  };
  const color = stepColors[step] ?? "#6366f1";
  return (
    <div style={{ maxWidth: "480px", width: "100%", textAlign: "center" }}>
      <div style={{ marginBottom: "8px", fontSize: "14px", color: "#9ca3af" }}>{message}</div>
      <div style={{ height: "6px", backgroundColor: "#1f2937", borderRadius: "4px", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, backgroundColor: color,
          borderRadius: "4px", transition: "width 0.6s ease",
        }} />
      </div>
      <div style={{ marginTop: "6px", fontSize: "12px", color: "#4b5563" }}>{pct}%</div>
    </div>
  );
}

interface Props {
  params: { jobId: string };
}

export default function BrandSmithResults({ params }: Props) {
  const { jobId } = params;
  const [, navigate] = useLocation();
  const sessionId = getSessionId();
  const apiBase = getApiBase();
  const qc = useQueryClient();

  const [progress, setProgress] = useState<{ step: string; message: string; pct: number } | null>(null);
  const [sections, setSections] = useState<BrandSection[] | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const sseRef = useRef<EventSource | null>(null);

  const { data: savedJob, isLoading: jobLoading } = useQuery({
    queryKey: ["/api/brandsmith/jobs", jobId],
    queryFn: async () => {
      const r = await fetch(`/api/brandsmith/jobs/${jobId}`);
      if (r.status === 404) return null;
      if (!r.ok) return null;
      return r.json();
    },
    retry: false,
  });

  const saveJobMutation = useMutation({
    mutationFn: async (secs: BrandSection[]) => {
      const r = await apiRequest("POST", "/api/brandsmith/jobs", {
        jobId, sessionId,
        websiteUrl: savedJob?.websiteUrl ?? "unknown",
        sections: secs,
      });
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/brandsmith/jobs", sessionId] }),
  });

  const updateCardsMutation = useMutation({
    mutationFn: async (secs: BrandSection[]) => {
      const r = await apiRequest("PUT", `/api/brandsmith/jobs/${jobId}/cards`, { sections: secs });
      return r.json();
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", `/api/brandsmith/jobs/${jobId}/confirm`, {});
      return r.json();
    },
    onSuccess: () => setConfirmed(true),
  });

  useEffect(() => {
    if (savedJob?.sections && savedJob.sections.length > 0) {
      setSections(savedJob.sections);
      if (savedJob.confirmedAt) setConfirmed(true);
      return;
    }

    if (!jobLoading && !savedJob?.sections) {
      const streamUrl = apiBase
        ? `${apiBase}/api/brands/research/${jobId}/stream`
        : `/api/brandsmith/mock/research/${jobId}/stream`;

      const sse = new EventSource(streamUrl);
      sseRef.current = sse;

      sse.addEventListener("status", (e: MessageEvent) => {
        try { setProgress(JSON.parse(e.data)); } catch {}
      });

      sse.addEventListener("complete", async (e: MessageEvent) => {
        sse.close();
        try {
          const payload = JSON.parse(e.data);
          const secs: BrandSection[] = payload.sections ?? [];
          setSections(secs);
          setProgress(null);
          await saveJobMutation.mutateAsync(secs);
        } catch (err) {
          setStreamError("Failed to process results. Please try again.");
        }
      });

      sse.addEventListener("error", (e: MessageEvent) => {
        sse.close();
        try {
          const payload = JSON.parse(e.data);
          setStreamError(payload.message ?? "Analysis failed. Please try again.");
        } catch {
          setStreamError("Connection lost. Please try again.");
        }
      });

      sse.onerror = () => {
        if (sse.readyState === EventSource.CLOSED) {
          setStreamError("Connection closed unexpectedly. Please try again.");
        }
      };

      return () => { sse.close(); };
    }
  }, [jobLoading, savedJob]);

  function handleSaveEdit(updated: BrandSection) {
    if (!sections) return;
    const next = sections.map(s => s.section === updated.section ? updated : s);
    setSections(next);
    setEditingSection(null);
    updateCardsMutation.mutate(next);
  }

  function handleExport() {
    if (!sections) return;
    const blob = new Blob([JSON.stringify({ job_id: jobId, sections }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brandsmith-${jobId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const websiteUrl = savedJob?.websiteUrl ?? "";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0a0a" }}>
      <header style={{ padding: "20px 32px", borderBottom: "1px solid #1f1f1f", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            data-testid="button-back"
            onClick={() => navigate("/agents/brandsmith")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#4b5563", display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <span style={{ color: "#1f2937" }}>|</span>
          <MonkWordmark />
          <span style={{ color: "#4b5563", fontSize: "14px" }}>/</span>
          <span style={{ color: "#e5e7eb", fontSize: "14px", fontWeight: 600 }}>BrandSmith</span>
          {websiteUrl && (
            <>
              <span style={{ color: "#4b5563", fontSize: "14px" }}>/</span>
              <span style={{ color: "#6b7280", fontSize: "13px" }}>{websiteUrl.replace(/^https?:\/\//, "")}</span>
            </>
          )}
        </div>
        {sections && (
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              data-testid="button-export"
              onClick={handleExport}
              style={{
                display: "flex", alignItems: "center", gap: "5px",
                padding: "8px 14px", backgroundColor: "transparent",
                border: "1px solid #374151", borderRadius: "8px",
                color: "#9ca3af", fontSize: "13px", cursor: "pointer",
              }}
            >
              <Download size={13} /> Export JSON
            </button>
            <button
              data-testid="button-confirm"
              onClick={() => confirmMutation.mutate()}
              disabled={confirmed || confirmMutation.isPending}
              style={{
                display: "flex", alignItems: "center", gap: "5px",
                padding: "8px 16px",
                backgroundColor: confirmed ? "#065f46" : "#6366f1",
                border: "none", borderRadius: "8px",
                color: "#fff", fontSize: "13px", fontWeight: 600,
                cursor: confirmed ? "default" : "pointer",
                opacity: confirmMutation.isPending ? 0.7 : 1,
              }}
            >
              {confirmed
                ? <><CheckCircle2 size={13} /> Confirmed</>
                : confirmMutation.isPending
                ? <><Loader2 size={13} className="animate-spin" /> Confirming…</>
                : <><CheckCircle2 size={13} /> Confirm profile</>
              }
            </button>
          </div>
        )}
      </header>

      <main style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 24px" }}>
        {jobLoading && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
            <Loader2 size={24} color="#6366f1" className="animate-spin" />
          </div>
        )}

        {!jobLoading && !sections && progress && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "32px", minHeight: "300px", justifyContent: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <Sparkles size={18} color="#6366f1" className="animate-pulse" />
                <span style={{ fontSize: "16px", color: "#e5e7eb", fontWeight: 600 }}>Analysing brand…</span>
              </div>
              <ProgressBar pct={progress.pct} message={progress.message} step={progress.step} />
            </div>
          </div>
        )}

        {!jobLoading && !sections && !progress && !streamError && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
            <div style={{ textAlign: "center" }}>
              <Loader2 size={24} color="#6366f1" className="animate-spin" style={{ margin: "0 auto 12px" }} />
              <p style={{ color: "#4b5563", fontSize: "14px" }}>Connecting to analysis stream…</p>
            </div>
          </div>
        )}

        {streamError && (
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            backgroundColor: "#1f0808", border: "1px solid #7f1d1d",
            borderRadius: "10px", padding: "16px 20px", marginBottom: "24px",
          }}>
            <AlertCircle size={16} color="#f87171" />
            <span style={{ fontSize: "14px", color: "#fca5a5" }}>{streamError}</span>
            <button
              onClick={() => navigate("/agents/brandsmith")}
              style={{ marginLeft: "auto", fontSize: "13px", color: "#6366f1", background: "none", border: "none", cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        )}

        {sections && (
          <>
            <div style={{ marginBottom: "32px" }}>
              <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#f9fafb", letterSpacing: "-0.02em", marginBottom: "6px" }}>
                Brand profile
              </h1>
              <p style={{ fontSize: "14px", color: "#4b5563" }}>
                {sections.length} sections · {sections.filter(s => s.user_edited).length} edited
                {confirmed && <span style={{ marginLeft: "8px", color: "#059669" }}>· ✓ Profile confirmed</span>}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {sections
                .slice()
                .sort((a, b) => a.card_order - b.card_order)
                .map(section => (
                  <SectionCard
                    key={section.section}
                    section={section}
                    editing={editingSection === section.section}
                    onToggleEdit={() => setEditingSection(prev => prev === section.section ? null : section.section)}
                    onSaveEdit={handleSaveEdit}
                  />
                ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

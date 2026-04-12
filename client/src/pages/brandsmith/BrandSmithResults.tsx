import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Loader2, ArrowLeft, CheckCircle2, Download, ChevronDown, ChevronUp,
  AlertCircle, Pencil, Save, X
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
  const bg = pct >= 80 ? "#ecfdf5" : pct >= 60 ? "#fffbeb" : "#fef2f2";
  const border = pct >= 80 ? "#a7f3d0" : pct >= 60 ? "#fde68a" : "#fecaca";
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, color,
      background: bg, border: `1px solid ${border}`,
      borderRadius: 4, padding: "2px 7px",
    }}>
      {pct}% confidence
    </span>
  );
}

function FieldValue({ val }: { val: unknown }) {
  if (Array.isArray(val)) {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {val.map((item: unknown, i) => (
          <span key={i} style={{
            fontSize: 12, background: "#f3f4f6", color: "#4b5563",
            border: "1px solid #e5e7eb", borderRadius: 4, padding: "3px 8px",
          }}>
            {typeof item === "object" ? JSON.stringify(item) : String(item)}
          </span>
        ))}
      </div>
    );
  }
  if (typeof val === "object" && val !== null) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {Object.entries(val).map(([k, v]) => (
          <div key={k} style={{ display: "flex", gap: 8, fontSize: 13 }}>
            <span style={{ color: "#9ca3af", minWidth: 100 }}>{k}</span>
            <span style={{ color: "#374151" }}>{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
          </div>
        ))}
      </div>
    );
  }
  return <span style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{String(val ?? "—")}</span>;
}

function FieldEditor({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  const strVal = Array.isArray(value)
    ? (value as unknown[]).map(x => (typeof x === "object" ? JSON.stringify(x) : String(x))).join(", ")
    : typeof value === "object" && value !== null
    ? JSON.stringify(value, null, 2)
    : String(value ?? "");

  const isLong = strVal.length > 80;
  const base: React.CSSProperties = {
    width: "100%", background: "#f9fafb", border: "1px solid #e5e7eb",
    borderRadius: 6, color: "#1f2937", fontSize: 13, padding: "9px 12px",
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  };

  return isLong ? (
    <textarea value={strVal} onChange={e => onChange(e.target.value)} rows={4} style={{ ...base, resize: "vertical" }} />
  ) : (
    <input type="text" value={strVal} onChange={e => onChange(e.target.value)} style={base} />
  );
}

function SectionCard({ section, editing, onToggleEdit, onSaveEdit }: {
  section: BrandSection;
  editing: boolean;
  onToggleEdit: () => void;
  onSaveEdit: (updated: BrandSection) => void;
}) {
  const [open, setOpen] = useState(true);
  const [localData, setLocalData] = useState<Record<string, unknown>>({ ...section.data });

  function handleSave() {
    onSaveEdit({ ...section, data: localData, user_edited: true });
  }

  function handleCancel() {
    setLocalData({ ...section.data });
    onToggleEdit();
  }

  return (
    <div style={{
      background: "#fff",
      border: section.user_edited ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(99,102,241,0.08)",
      borderRadius: 12,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      overflow: "hidden",
    }}>
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", cursor: "pointer" }}
        onClick={() => setOpen(o => !o)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>{SECTION_ICONS[section.section] ?? "📄"}</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#0f0a2e" }}>{section.title}</span>
          {section.user_edited && (
            <span style={{ fontSize: 11, color: "#6366f1", fontWeight: 600 }}>edited</span>
          )}
          <ConfidenceBadge score={section.ai_confidence} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {open && (
            <button
              data-testid={`button-edit-${section.section}`}
              onClick={e => { e.stopPropagation(); onToggleEdit(); }}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "5px 10px", background: "transparent",
                border: "1px solid #e5e7eb", borderRadius: 6,
                color: "#6b7280", fontSize: 12, cursor: "pointer",
              }}
            >
              <Pencil size={11} /> {editing ? "Cancel" : "Edit"}
            </button>
          )}
          {open ? <ChevronUp size={16} color="#9ca3af" /> : <ChevronDown size={16} color="#9ca3af" />}
        </div>
      </div>

      {open && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid rgba(99,102,241,0.06)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 16 }}>
            {Object.entries(editing ? localData : section.data).map(([key, val]) => (
              <div key={key}>
                <p style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, fontWeight: 600 }}>
                  {key.replace(/_/g, " ")}
                </p>
                {editing
                  ? <FieldEditor value={localData[key]} onChange={v => setLocalData(prev => ({ ...prev, [key]: v }))} />
                  : <FieldValue val={val} />
                }
              </div>
            ))}
          </div>

          {editing && (
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                data-testid={`button-save-${section.section}`}
                onClick={handleSave}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "8px 16px",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "#fff", border: "none", borderRadius: 6,
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                <Save size={13} /> Save changes
              </button>
              <button
                onClick={handleCancel}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "8px 14px", background: "transparent", color: "#6b7280",
                  border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, cursor: "pointer",
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
    <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
      <div style={{ marginBottom: 8, fontSize: 14, color: "#6b7280" }}>{message}</div>
      <div style={{ height: 6, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.6s ease" }} />
      </div>
      <div style={{ marginTop: 6, fontSize: 12, color: "#9ca3af" }}>{pct}%</div>
    </div>
  );
}

interface Props { params: { jobId: string } }

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
    mutationFn: async ({ secs, url }: { secs: BrandSection[]; url: string }) => {
      const r = await apiRequest("POST", "/api/brandsmith/jobs", {
        jobId, sessionId, websiteUrl: url, sections: secs,
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
    if (!jobLoading) {
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
          const websiteUrl = savedJob?.websiteUrl ?? payload.website_url ?? "unknown";
          await saveJobMutation.mutateAsync({ secs, url: websiteUrl });
        } catch {
          setStreamError("Failed to process results. Please try again.");
        }
      });

      sse.addEventListener("error", (e: MessageEvent) => {
        sse.close();
        try {
          const payload = JSON.parse(e.data);
          setStreamError(payload.message ?? "Analysis failed.");
        } catch {
          setStreamError("Connection lost. Please try again.");
        }
      });

      sse.onerror = () => {
        if (sse.readyState === EventSource.CLOSED) return;
        setStreamError("Connection closed unexpectedly.");
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
    a.download = `brandsmith-${jobId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const websiteDisplay = savedJob?.websiteUrl?.replace(/^https?:\/\//, "") ?? "";

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8f7ff 0%, #eef2ff 50%, #f0f9ff 100%)", fontFamily: "Inter, system-ui, sans-serif" }}>
      <nav style={{ padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(99,102,241,0.1)", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            data-testid="button-back"
            onClick={() => navigate("/agents/brandsmith")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontFamily: "inherit" }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <span style={{ color: "#e5e7eb" }}>|</span>
          <a href="/" style={{ textDecoration: "none" }}><MonkWordmark /></a>
          <span style={{ color: "#9ca3af", fontSize: 14 }}>/</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#6366f1" }}>BrandSmith</span>
          {websiteDisplay && (
            <>
              <span style={{ color: "#9ca3af", fontSize: 14 }}>/</span>
              <span style={{ fontSize: 13, color: "#6b7280" }}>{websiteDisplay}</span>
            </>
          )}
        </div>

        {sections && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              data-testid="button-export"
              onClick={handleExport}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "8px 14px", background: "#fff",
                border: "1px solid #e5e7eb", borderRadius: 8,
                color: "#6b7280", fontSize: 13, cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <Download size={13} /> Export JSON
            </button>
            <button
              data-testid="button-confirm"
              onClick={() => confirmMutation.mutate()}
              disabled={confirmed || confirmMutation.isPending}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "8px 16px",
                background: confirmed ? "#059669" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                border: "none", borderRadius: 8,
                color: "#fff", fontSize: 13, fontWeight: 700,
                cursor: confirmed ? "default" : "pointer",
                opacity: confirmMutation.isPending ? 0.7 : 1,
                boxShadow: "0 1px 3px rgba(99,102,241,0.3)",
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
      </nav>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px" }}>
        {jobLoading && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
            <Loader2 size={24} color="#6366f1" className="animate-spin" />
          </div>
        )}

        {!jobLoading && !sections && progress && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32, minHeight: 300, justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: 100, padding: "6px 14px", marginBottom: 24,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", animation: "pulse 2s infinite" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#6366f1" }}>Analysing brand…</span>
              </div>
              <ProgressBar pct={progress.pct} message={progress.message} step={progress.step} />
            </div>
          </div>
        )}

        {!jobLoading && !sections && !progress && !streamError && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300, flexDirection: "column", gap: 12 }}>
            <Loader2 size={24} color="#6366f1" className="animate-spin" />
            <p style={{ color: "#9ca3af", fontSize: 14 }}>Connecting to analysis stream…</p>
          </div>
        )}

        {streamError && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: 10, padding: "16px 20px", marginBottom: 24,
          }}>
            <AlertCircle size={16} color="#dc2626" />
            <span style={{ fontSize: 14, color: "#b91c1c" }}>{streamError}</span>
            <button
              onClick={() => navigate("/agents/brandsmith")}
              style={{ marginLeft: "auto", fontSize: 13, color: "#6366f1", background: "none", border: "none", cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        )}

        {sections && (
          <>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f0a2e", letterSpacing: "-0.02em", marginBottom: 6 }}>
                Brand profile
              </h1>
              <p style={{ fontSize: 14, color: "#9ca3af" }}>
                {sections.length} sections · {sections.filter(s => s.user_edited).length} edited
                {confirmed && <span style={{ marginLeft: 8, color: "#059669", fontWeight: 600 }}>· ✓ Profile confirmed</span>}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}

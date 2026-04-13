import { useState, useEffect } from "react";
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

const SECTION_ICONS: Record<string, string> = {
  identity: "🏷️",
  product: "📦",
  audience: "🎯",
  competitive_landscape: "⚔️",
  voice_and_tone: "🎙️",
  digital_presence: "🌐",
  seo_content_strategy: "📈",
  business_operations: "⚙️",
};

const BUSINESS_OPS_FIELDS: { key: string; label: string; placeholder: string }[] = [
  { key: "stage", label: "Stage", placeholder: "e.g. Pre-seed, Seed, Series A, Growth" },
  { key: "monthly_budget", label: "Monthly Budget", placeholder: "e.g. $5,000 / mo" },
  { key: "current_channels", label: "Current Channels", placeholder: "e.g. Paid social, Email, SEO" },
  { key: "key_metric_mrr", label: "MRR", placeholder: "e.g. $12,000 / mo" },
  { key: "key_metric_retention", label: "Retention", placeholder: "e.g. 85%" },
  { key: "key_metric_trial_to_paid", label: "Trial → Paid", placeholder: "e.g. 22%" },
];

const DEFAULT_BUSINESS_OPS_SECTION: BrandSection = {
  section: "business_operations",
  title: "Business Operations",
  card_order: 8,
  ai_confidence: 0,
  user_edited: false,
  data: {
    stage: null,
    monthly_budget: null,
    current_channels: null,
    key_metric_mrr: null,
    key_metric_retention: null,
    key_metric_trial_to_paid: null,
  },
};

function withBusinessOps(secs: BrandSection[]): BrandSection[] {
  if (secs.some(s => s.section === "business_operations")) return secs;
  return [...secs, DEFAULT_BUSINESS_OPS_SECTION];
}

function isEmpty(val: unknown): boolean {
  if (val === null || val === undefined || val === "") return true;
  if (Array.isArray(val) && val.length === 0) return true;
  if (typeof val === "object" && !Array.isArray(val) && Object.keys(val as Record<string, unknown>).length === 0) return true;
  return false;
}

const OBJ_TITLE_KEYS = ["name", "title", "feature", "query", "theme", "pillar", "claim", "label", "person"];

function ObjectMiniCard({ obj }: { obj: Record<string, unknown> }) {
  const titleKey = OBJ_TITLE_KEYS.find(k => k in obj && typeof obj[k] === "string" && (obj[k] as string).length > 0);
  const title = titleKey ? String(obj[titleKey as string]) : null;
  return (
    <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px" }}>
      {title && <div style={{ fontSize: 13, fontWeight: 600, color: "#1f2937", marginBottom: 5 }}>{title}</div>}
      {Object.entries(obj)
        .filter(([k, v]) => k !== titleKey && !isEmpty(v))
        .map(([k, v]) => (
          <div key={k} style={{ display: "flex", gap: 8, fontSize: 12, marginBottom: 5, alignItems: "flex-start" }}>
            <span style={{ color: "#9ca3af", minWidth: 90, flexShrink: 0, paddingTop: 3 }}>{k.replace(/_/g, " ")}</span>
            <span style={{ color: "#4b5563", wordBreak: "break-word", flex: 1 }}>
              {Array.isArray(v)
                ? <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 1 }}>
                    {(v as unknown[]).map((x, xi) => (
                      <span key={xi} style={{ fontSize: 11, background: "#e5e7eb", color: "#374151", borderRadius: 3, padding: "2px 6px" }}>
                        {typeof x === "object" ? JSON.stringify(x) : String(x)}
                      </span>
                    ))}
                  </div>
                : String(v)}
            </span>
          </div>
        ))}
    </div>
  );
}

function SocialLinks({ obj }: { obj: Record<string, unknown> }) {
  const PLATFORM_LABEL: Record<string, string> = { linkedin: "LinkedIn", twitter: "X (Twitter)", instagram: "Instagram", facebook: "Facebook", youtube: "YouTube" };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {Object.entries(obj).map(([platform, url]) => {
        if (!url || typeof url !== "string" || !url.startsWith("http")) return null;
        return (
          <a key={platform} href={url} target="_blank" rel="noreferrer" style={{
            display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12,
            color: "#6366f1", background: "rgba(99,102,241,0.06)",
            border: "1px solid rgba(99,102,241,0.15)", borderRadius: 6,
            padding: "4px 10px", textDecoration: "none", fontWeight: 500,
          }}>
            {PLATFORM_LABEL[platform] ?? platform}
          </a>
        );
      })}
    </div>
  );
}

function NavLinkList({ items }: { items: Array<Record<string, unknown>> }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {items.map((item, i) => {
        const label = String(item.label ?? item.name ?? "Link");
        const href = String(item.href ?? item.url ?? "#");
        return (
          <a key={i} href={href} target="_blank" rel="noreferrer" style={{
            fontSize: 12, color: "#374151", background: "#f3f4f6",
            border: "1px solid #e5e7eb", borderRadius: 4, padding: "3px 8px", textDecoration: "none",
          }}>
            {label}
          </a>
        );
      })}
    </div>
  );
}

function FieldValue({ val, fieldKey }: { val: unknown; fieldKey?: string }) {
  if (isEmpty(val)) return null;

  if (fieldKey === "social_profiles" && typeof val === "object" && !Array.isArray(val)) {
    return <SocialLinks obj={val as Record<string, unknown>} />;
  }

  if (Array.isArray(val)) {
    if (val.length === 0) return null;
    const isObjArray = typeof val[0] === "object" && val[0] !== null;
    if (isObjArray) {
      const isNavArray = (val as Record<string, unknown>[]).every(item => "href" in item || "url" in item);
      if (isNavArray) return <NavLinkList items={val as Record<string, unknown>[]} />;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(val as Record<string, unknown>[]).map((item, i) => <ObjectMiniCard key={i} obj={item} />)}
        </div>
      );
    }
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {(val as unknown[]).map((item, i) => (
          <span key={i} style={{ fontSize: 12, background: "#f3f4f6", color: "#4b5563", border: "1px solid #e5e7eb", borderRadius: 4, padding: "3px 8px" }}>
            {String(item)}
          </span>
        ))}
      </div>
    );
  }

  if (typeof val === "object" && val !== null) {
    const entries = Object.entries(val as Record<string, unknown>).filter(([, v]) => !isEmpty(v));
    if (entries.length === 0) return null;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {entries.map(([k, v]) => (
          <div key={k} style={{ display: "flex", gap: 8, fontSize: 13 }}>
            <span style={{ color: "#9ca3af", minWidth: 100, flexShrink: 0 }}>{k.replace(/_/g, " ")}</span>
            <span style={{ color: "#374151", wordBreak: "break-word" }}>
              {Array.isArray(v) ? (v as unknown[]).map(String).join(", ") : String(v)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (typeof val === "string" && val.startsWith("http")) {
    return <a href={val} target="_blank" rel="noreferrer" style={{ fontSize: 14, color: "#6366f1" }}>{val}</a>;
  }

  return <span style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{String(val)}</span>;
}

function ConfidenceBadge({ score }: { score: number }) {
  if (score >= 0.75) return null;
  const pct = Math.round(score * 100);
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: "#d97706", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 4, padding: "2px 7px" }}>
      {pct}% — needs review
    </span>
  );
}

function FieldEditor({ value, onChange, placeholder }: { value: unknown; onChange: (v: unknown) => void; placeholder?: string }) {
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
    <textarea value={strVal} onChange={e => onChange(e.target.value)} rows={4} placeholder={placeholder} style={{ ...base, resize: "vertical" }} />
  ) : (
    <input type="text" value={strVal} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} />
  );
}

function SectionCard({ section, initialOpen = false, editing, onToggleEdit, onSaveEdit }: {
  section: BrandSection;
  initialOpen?: boolean;
  editing: boolean;
  onToggleEdit: () => void;
  onSaveEdit: (updated: BrandSection) => void;
}) {
  const [open, setOpen] = useState(initialOpen);
  const [localData, setLocalData] = useState<Record<string, unknown>>({ ...section.data });

  const isBusinessOps = section.section === "business_operations";
  const visibleEntries = Object.entries(section.data).filter(([, val]) => !isEmpty(val));
  const filledCount = isBusinessOps ? BUSINESS_OPS_FIELDS.filter(f => !isEmpty(section.data[f.key])).length : 0;
  const summary = isBusinessOps
    ? `${filledCount} of ${BUSINESS_OPS_FIELDS.length} filled`
    : `${visibleEntries.length} field${visibleEntries.length !== 1 ? "s" : ""}`;

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
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#0f0a2e" }}>{section.title}</span>
              {section.user_edited && <span style={{ fontSize: 11, color: "#6366f1", fontWeight: 600 }}>edited</span>}
              {isBusinessOps
                ? <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 4, padding: "2px 7px" }}>you fill this in</span>
                : <ConfidenceBadge score={section.ai_confidence} />
              }
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{summary}</div>
          </div>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 16 }}>
            {isBusinessOps ? (
              <>
                {!editing && (
                  <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, lineHeight: 1.5 }}>
                    These are private metrics Claude can't find online. Fill them in to give your brand profile full context when calling Claude skills.
                  </p>
                )}
                {BUSINESS_OPS_FIELDS.map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <p style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, fontWeight: 600 }}>
                      {label}
                    </p>
                    {editing
                      ? <FieldEditor value={localData[key]} onChange={v => setLocalData(prev => ({ ...prev, [key]: v }))} placeholder={placeholder} />
                      : isEmpty(section.data[key])
                        ? <span style={{ fontSize: 13, color: "#d1d5db", fontStyle: "italic" }}>{placeholder}</span>
                        : <FieldValue val={section.data[key]} fieldKey={key} />
                    }
                  </div>
                ))}
              </>
            ) : (
              (editing ? Object.entries(localData) : visibleEntries).map(([key, val]) => (
                <div key={key}>
                  <p style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, fontWeight: 600 }}>
                    {key.replace(/_/g, " ")}
                  </p>
                  {editing
                    ? <FieldEditor value={localData[key]} onChange={v => setLocalData(prev => ({ ...prev, [key]: v }))} />
                    : <FieldValue val={val} fieldKey={key} />
                  }
                </div>
              ))
            )}
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
  const qc = useQueryClient();
  const urlFromNav = new URLSearchParams(window.location.search).get("url") ?? "";

  const [progress, setProgress] = useState<{ step: string; message: string; pct: number } | null>(null);
  const [sections, setSections] = useState<BrandSection[] | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [hasEditsAfterConfirm, setHasEditsAfterConfirm] = useState(false);

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
      if (sections) {
        const urlFromSections = sections?.find(s => s.section === "digital_presence")?.data?.website_url as string | undefined;
        const rawUrl = urlFromNav || (savedJob?.websiteUrl !== "unknown" ? savedJob?.websiteUrl : "") || urlFromSections || "";
        const websiteUrl = rawUrl && !rawUrl.startsWith("http") ? `https://${rawUrl}` : rawUrl;
        if (!websiteUrl) {
          console.warn("[brandsmith] confirm skipped — no website_url available. Re-submit from landing page.");
        } else {
          const payload = { website_url: websiteUrl, job_id: jobId, sections };
          console.log("[brandsmith] confirm →", "/api/brandsmith/confirm", { website_url: websiteUrl, sections: sections.length });
          const confirmRes = await fetch("/api/brandsmith/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const confirmBody = confirmRes.ok ? await confirmRes.json() : await confirmRes.text();
          console.log("[brandsmith] confirm ←", confirmRes.status, confirmBody);
        }
      }
      const r = await apiRequest("POST", `/api/brandsmith/jobs/${jobId}/confirm`, {});
      return r.json();
    },
    onSuccess: () => {
      setConfirmed(true);
      setHasEditsAfterConfirm(false);
    },
  });

  useEffect(() => {
    if (savedJob?.sections && savedJob.sections.length > 0) {
      setSections(withBusinessOps(savedJob.sections));
      if (savedJob.confirmedAt) setConfirmed(true);
      return;
    }
    if (jobLoading) return;

    const streamUrl = `/api/brandsmith/research/${jobId}/stream`;

    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(streamUrl, { signal: controller.signal });
        if (!res.ok || !res.body) {
          setStreamError("Failed to connect to analysis stream.");
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          for (const eventStr of events) {
            if (!eventStr.trim()) continue;
            const lines = eventStr.split("\n");
            let eventType = "message";
            let data = "";
            for (const line of lines) {
              if (line.startsWith("event:")) eventType = line.slice(6).trim();
              if (line.startsWith("data:")) data = line.slice(5).trim();
            }

            if (eventType === "status") {
              try { setProgress(JSON.parse(data)); } catch {}
            } else if (eventType === "complete") {
              try {
                const payload = JSON.parse(data);
                const secs: BrandSection[] = withBusinessOps(payload.sections ?? []);
                setSections(secs);
                setProgress(null);
                const websiteUrl = urlFromNav || savedJob?.websiteUrl || payload.website_url || "unknown";
                await saveJobMutation.mutateAsync({ secs, url: websiteUrl });
              } catch {
                setStreamError("Failed to process results. Please try again.");
              }
            } else if (eventType === "error") {
              try {
                const payload = JSON.parse(data);
                setStreamError(payload.message ?? "Analysis failed.");
              } catch {
                setStreamError("Connection lost. Please try again.");
              }
            }
          }
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setStreamError("Connection closed unexpectedly.");
      }
    })();

    return () => { controller.abort(); };
  }, [jobLoading, savedJob]);

  function handleSaveEdit(updated: BrandSection) {
    if (!sections) return;
    const next = sections.map(s => s.section === updated.section ? updated : s);
    setSections(next);
    setEditingSection(null);
    updateCardsMutation.mutate(next);
    if (confirmed) setHasEditsAfterConfirm(true);
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

  useEffect(() => {
    document.documentElement.style.background = "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)";
    document.body.style.background = "transparent";
    return () => {
      document.documentElement.style.background = "";
      document.body.style.background = "";
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-x-clip flex flex-col font-sans" style={{ background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)" }}>
      <nav style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, borderBottom: "1px solid rgba(99,102,241,0.1)", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)" }}>
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
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
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
            {confirmed && !hasEditsAfterConfirm && !confirmMutation.isPending ? (
              <span style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "8px 14px", background: "#ecfdf5",
                border: "1px solid #a7f3d0", borderRadius: 8,
                color: "#059669", fontSize: 13, fontWeight: 700,
              }}>
                <CheckCircle2 size={13} /> Confirmed
              </span>
            ) : (
              <button
                data-testid="button-confirm"
                onClick={() => confirmMutation.mutate()}
                disabled={confirmMutation.isPending}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "8px 16px",
                  background: hasEditsAfterConfirm
                    ? "linear-gradient(135deg, #f59e0b, #d97706)"
                    : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  border: "none", borderRadius: 8,
                  color: "#fff", fontSize: 13, fontWeight: 700,
                  cursor: confirmMutation.isPending ? "default" : "pointer",
                  opacity: confirmMutation.isPending ? 0.7 : 1,
                  boxShadow: "0 1px 3px rgba(99,102,241,0.3)",
                }}
              >
                {confirmMutation.isPending
                  ? <><Loader2 size={13} className="animate-spin" /> Confirming…</>
                  : hasEditsAfterConfirm
                  ? <><CheckCircle2 size={13} /> Re-confirm</>
                  : <><CheckCircle2 size={13} /> Confirm profile</>
                }
              </button>
            )}
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
                .map((section, idx) => (
                  <SectionCard
                    key={section.section}
                    section={section}
                    initialOpen={idx === 0}
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

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, ChevronDown, ChevronRight, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

const DARK = "#0f172a";
const PANEL = "#1e293b";
const BORDER = "rgba(255,255,255,0.07)";
const LABEL: React.CSSProperties = { color: "#94a3b8", fontSize: 13, fontFamily: "system-ui, sans-serif" };
const SECTION: React.CSSProperties = { color: "#3b82f6", fontSize: 10, fontFamily: "monospace", letterSpacing: 2, marginBottom: 4, marginTop: 24 };
const INPUT_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 6, color: "#f1f5f9", fontSize: 13, padding: "7px 12px",
  fontFamily: "system-ui, sans-serif", outline: "none", width: "100%",
};
const ROW: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "12px 0", borderBottom: `1px solid ${BORDER}`,
};

const MODELS_CHATGPT = [
  "gpt-4o", "gpt-4o-mini",
  "gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano",
  "o3", "o3-mini", "o4-mini",
];
const MODELS_GEMINI = [
  "gemini-2.5-flash", "gemini-2.5-pro",
  "gemini-2.0-flash", "gemini-2.0-flash-lite",
  "gemini-1.5-pro", "gemini-1.5-flash",
];
const MODELS_CLAUDE = [
  "claude-opus-4-5", "claude-sonnet-4-5", "claude-haiku-4-5",
  "claude-opus-4", "claude-sonnet-4", "claude-haiku-4",
  "claude-3-7-sonnet-latest", "claude-3-5-haiku-latest",
];

const PLACEHOLDERS = ["{{name}}", "{{role}}", "{{company}}", "{{past_company}}", "{{education}}", "{{industry}}", "{{identity_string}}"];
const SAMPLE_VARS = {
  name: "Jake Stein", role: "CEO", company: "Replit", past_company: "Stripe",
  education: "Harvard Business School", industry: "technology",
  identity_string: "Jake Stein, CEO at Replit, previously Stripe, Harvard Business School",
};

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!on)}
      style={{
        width: 40, height: 22, borderRadius: 11,
        background: on ? "#3b82f6" : "rgba(255,255,255,0.08)",
        border: "none", cursor: disabled ? "not-allowed" : "pointer",
        position: "relative", transition: "background 0.2s", opacity: disabled ? 0.4 : 1, flexShrink: 0,
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: "50%", background: "#fff",
        position: "absolute", top: 3, left: on ? 21 : 3, transition: "left 0.2s",
      }} />
    </button>
  );
}

function Select({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...INPUT_STYLE, width: "auto", minWidth: 180, cursor: "pointer" }}
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function fillPreview(template: string): string {
  let result = template;
  Object.entries(SAMPLE_VARS).forEach(([k, v]) => {
    result = result.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v);
  });
  return result;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: any }> = {
    complete: { color: "#22c55e", icon: CheckCircle },
    analyzing: { color: "#3b82f6", icon: Loader2 },
    queued: { color: "#f59e0b", icon: Clock },
    error: { color: "#ef4444", icon: XCircle },
    selecting: { color: "#94a3b8", icon: Clock },
  };
  const { color, icon: Icon } = map[status] ?? { color: "#94a3b8", icon: AlertCircle };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color, fontSize: 12, fontWeight: 600 }}>
      <Icon size={12} className={status === "analyzing" ? "animate-spin" : ""} /> {status}
    </span>
  );
}

function ScoreCell({ score, grade }: { score: number | null; grade: string | null }) {
  if (score === null) return <span style={{ color: "#475569", fontSize: 12 }}>—</span>;
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";
  return <span style={{ color, fontSize: 13, fontWeight: 700 }}>{score}<span style={{ color: "#64748b", fontSize: 11, marginLeft: 3 }}>{grade}</span></span>;
}

function ConfigTab({ config, onSave }: { config: any; onSave: (c: any) => void }) {
  const [draft, setDraft] = useState<any>(config);
  const [saved, setSaved] = useState(false);

  function update(key: string, val: any) {
    setDraft((d: any) => ({ ...d, [key]: val }));
    setSaved(false);
  }
  function updateWebSearch(engine: string, val: boolean) {
    setDraft((d: any) => ({ ...d, webSearch: { ...d.webSearch, [engine]: val } }));
    setSaved(false);
  }

  function handleSave() {
    onSave(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <p style={SECTION}>MODELS</p>
      <div style={ROW}>
        <div><div style={LABEL}>ChatGPT model</div></div>
        <Select value={draft.chatgptModel} options={MODELS_CHATGPT} onChange={(v) => update("chatgptModel", v)} />
      </div>
      <div style={ROW}>
        <div><div style={LABEL}>Gemini model</div></div>
        <Select value={draft.geminiModel} options={MODELS_GEMINI} onChange={(v) => update("geminiModel", v)} />
      </div>
      <div style={ROW}>
        <div><div style={LABEL}>Claude model</div></div>
        <Select value={draft.claudeModel} options={MODELS_CLAUDE} onChange={(v) => update("claudeModel", v)} />
      </div>

      <p style={SECTION}>WEB SEARCH</p>
      <div style={ROW}>
        <div><div style={LABEL}>ChatGPT web search</div></div>
        <Toggle on={draft.webSearch?.chatgpt ?? true} onChange={(v) => updateWebSearch("chatgpt", v)} />
      </div>
      <div style={ROW}>
        <div><div style={LABEL}>Gemini web search (Google grounding)</div></div>
        <Toggle on={draft.webSearch?.gemini ?? true} onChange={(v) => updateWebSearch("gemini", v)} />
      </div>
      <div style={ROW}>
        <div>
          <div style={LABEL}>Claude web search</div>
          <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>Not available — Claude standard API has no web access</div>
        </div>
        <Toggle on={false} onChange={() => {}} disabled />
      </div>

      <p style={SECTION}>SAMPLING &amp; LIMITS</p>
      <div style={ROW}>
        <div>
          <div style={LABEL}>Query rounds per audit</div>
          <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>Each prompt runs this many times per engine. Results are majority-voted.</div>
        </div>
        <input
          type="number" min={1} max={5} value={draft.queryRounds ?? 3}
          onChange={(e) => update("queryRounds", parseInt(e.target.value) || 3)}
          style={{ ...INPUT_STYLE, width: 70, textAlign: "center" }}
          data-testid="input-query-rounds"
        />
      </div>
      <div style={ROW}>
        <div>
          <div style={LABEL}>Max concurrent audits</div>
          <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>Audits above this limit are queued.</div>
        </div>
        <input
          type="number" min={1} max={10} value={draft.maxConcurrentAudits ?? 3}
          onChange={(e) => update("maxConcurrentAudits", parseInt(e.target.value) || 3)}
          style={{ ...INPUT_STYLE, width: 70, textAlign: "center" }}
          data-testid="input-max-concurrent"
        />
      </div>
      <div style={ROW}>
        <div>
          <div style={LABEL}>Budget cap per audit (USD)</div>
          <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>Logged for visibility. Hard abort coming in a future update.</div>
        </div>
        <input
          type="number" min={0.5} max={50} step={0.5} value={draft.budgetCapUsd ?? 5}
          onChange={(e) => update("budgetCapUsd", parseFloat(e.target.value) || 5)}
          style={{ ...INPUT_STYLE, width: 90, textAlign: "center" }}
          data-testid="input-budget-cap"
        />
      </div>

      <div style={{ marginTop: 28 }}>
        <button
          onClick={handleSave}
          data-testid="button-save-config"
          style={{
            background: saved ? "#22c55e" : "#3b82f6", color: "#fff", border: "none",
            borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: "system-ui, sans-serif", transition: "background 0.2s",
          }}
        >
          {saved ? "✓ Saved" : "Save config"}
        </button>
      </div>
    </div>
  );
}

function PromptsTab({ templates, onSave }: { templates: any[]; onSave: (t: any[]) => void }) {
  const [draft, setDraft] = useState<any[]>(templates);
  const [saved, setSaved] = useState(false);
  const [previewing, setPreviewing] = useState<number | null>(null);

  function updateTemplate(idx: number, field: string, val: string) {
    setDraft((d) => d.map((t, i) => i === idx ? { ...t, [field]: val } : t));
    setSaved(false);
  }

  function handleSave() {
    onSave(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <p style={{ color: "#64748b", fontSize: 12, marginBottom: 20, lineHeight: 1.6 }}>
        Templates use placeholders that are filled in at runtime with the person's profile data.
        Available: <span style={{ color: "#94a3b8", fontFamily: "monospace" }}>{PLACEHOLDERS.join("  ")}</span>
      </p>

      {draft.map((t, idx) => (
        <div key={idx} style={{
          background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`,
          borderRadius: 10, padding: 16, marginBottom: 14,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{
              background: t.track === "A" ? "rgba(99,102,241,0.15)" : "rgba(6,182,212,0.15)",
              color: t.track === "A" ? "#818cf8" : "#22d3ee",
              border: `1px solid ${t.track === "A" ? "rgba(99,102,241,0.3)" : "rgba(6,182,212,0.3)"}`,
              borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700, fontFamily: "monospace",
            }}>Track {t.track}</span>
            <input
              value={t.angle}
              onChange={(e) => updateTemplate(idx, "angle", e.target.value)}
              placeholder="Angle name"
              style={{ ...INPUT_STYLE, width: "auto", flex: 1, fontSize: 12 }}
            />
            <button
              onClick={() => setPreviewing(previewing === idx ? null : idx)}
              style={{
                background: "none", border: "none", color: "#64748b", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontFamily: "system-ui, sans-serif",
              }}
            >
              {previewing === idx ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Preview
            </button>
          </div>

          <textarea
            value={t.template}
            onChange={(e) => updateTemplate(idx, "template", e.target.value)}
            rows={3}
            style={{
              ...INPUT_STYLE, resize: "vertical", lineHeight: 1.5,
              fontFamily: "system-ui, sans-serif", fontSize: 13,
            }}
            data-testid={`textarea-template-${idx}`}
          />

          {previewing === idx && (
            <div style={{
              marginTop: 8, padding: "10px 12px", background: "rgba(59,130,246,0.06)",
              border: "1px solid rgba(59,130,246,0.15)", borderRadius: 6,
              color: "#93c5fd", fontSize: 12, lineHeight: 1.5, fontStyle: "italic",
            }}>
              <span style={{ color: "#3b82f6", fontStyle: "normal", fontWeight: 700, fontSize: 10, fontFamily: "monospace", marginRight: 8 }}>PREVIEW</span>
              {fillPreview(t.template)}
            </div>
          )}
        </div>
      ))}

      <div style={{ marginTop: 20 }}>
        <button
          onClick={handleSave}
          data-testid="button-save-prompts"
          style={{
            background: saved ? "#22c55e" : "#3b82f6", color: "#fff", border: "none",
            borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: "system-ui, sans-serif", transition: "background 0.2s",
          }}
        >
          {saved ? "✓ Saved" : "Save templates"}
        </button>
      </div>
    </div>
  );
}

function AuditsTab() {
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const limit = 20;

  const { data, isLoading } = useQuery<{ sessions: any[]; total: number }>({
    queryKey: ["/api/people/sessions", page],
    queryFn: async () => {
      const res = await fetch(`/api/people/sessions?limit=${limit}&offset=${page * limit}`);
      return res.json();
    },
  });

  const { data: detail, isLoading: detailLoading } = useQuery<any>({
    queryKey: ["/api/people/sessions", selected, "detail"],
    queryFn: async () => {
      const res = await fetch(`/api/people/sessions/${selected}/detail`);
      return res.json();
    },
    enabled: selected !== null,
  });

  if (selected !== null) {
    return (
      <div>
        <button
          onClick={() => setSelected(null)}
          style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: 13, marginBottom: 20, fontFamily: "system-ui, sans-serif" }}
        >
          ← Back to list
        </button>
        {detailLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <Loader2 size={24} color="#3b82f6" className="animate-spin" />
          </div>
        ) : detail ? (
          <AuditDetail detail={detail} />
        ) : null}
      </div>
    );
  }

  return (
    <div>
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Loader2 size={24} color="#3b82f6" className="animate-spin" />
        </div>
      ) : !data?.sessions?.length ? (
        <div style={{ color: "#475569", fontSize: 14, textAlign: "center", padding: 40 }}>No people audits yet.</div>
      ) : (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Name", "Date", "Status", "Recognition", "Proof", ""].map((h) => (
                  <th key={h} style={{ color: "#64748b", fontSize: 11, fontWeight: 600, letterSpacing: 1, textAlign: "left", padding: "8px 12px", borderBottom: `1px solid ${BORDER}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.sessions.map((s: any) => (
                <tr key={s.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td style={{ padding: "10px 12px", color: "#e2e8f0", fontWeight: 600 }}>{s.name}</td>
                  <td style={{ padding: "10px 12px", color: "#64748b" }}>{new Date(s.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: "10px 12px" }}><StatusBadge status={s.status} /></td>
                  <td style={{ padding: "10px 12px" }}><ScoreCell score={s.recognition_score} grade={s.recognition_grade} /></td>
                  <td style={{ padding: "10px 12px" }}><ScoreCell score={s.proof_score} grade={s.proof_grade} /></td>
                  <td style={{ padding: "10px 12px" }}>
                    <button
                      onClick={() => setSelected(s.id)}
                      data-testid={`button-audit-detail-${s.id}`}
                      style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#93c5fd", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "system-ui, sans-serif" }}
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data.total > limit && (
            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: "#94a3b8", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontFamily: "system-ui, sans-serif" }}>
                Prev
              </button>
              <span style={{ color: "#64748b", fontSize: 12, lineHeight: "32px" }}>
                {page * limit + 1}–{Math.min((page + 1) * limit, data.total)} of {data.total}
              </span>
              <button onClick={() => setPage((p) => p + 1)} disabled={(page + 1) * limit >= data.total}
                style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: "#94a3b8", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontFamily: "system-ui, sans-serif" }}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AuditDetail({ detail }: { detail: any }) {
  const [expandedResult, setExpandedResult] = useState<number | null>(null);
  const { session, scores, results } = detail;

  const groupedResults = (results ?? []).reduce((acc: any, r: any) => {
    const key = `${r.track}-${r.query_index}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ color: "#e2e8f0", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{session.name}</h2>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <span style={{ color: "#64748b", fontSize: 12 }}>{session.linkedin_url}</span>
          <StatusBadge status={session.status} />
          {scores && (
            <>
              <span style={{ color: "#94a3b8", fontSize: 12 }}>Recognition: <b style={{ color: "#e2e8f0" }}>{scores.recognition_score} {scores.recognition_grade}</b></span>
              <span style={{ color: "#94a3b8", fontSize: 12 }}>Proof: <b style={{ color: "#e2e8f0" }}>{scores.proof_score} {scores.proof_grade}</b></span>
            </>
          )}
        </div>
      </div>

      {Object.entries(groupedResults).map(([key, rows]: [string, any]) => {
        const first = rows[0];
        const isExpanded = expandedResult === parseInt(key.replace("-", ""));
        return (
          <div key={key} style={{ border: `1px solid ${BORDER}`, borderRadius: 8, marginBottom: 10 }}>
            <button
              onClick={() => setExpandedResult(isExpanded ? null : parseInt(key.replace("-", "")))}
              style={{
                width: "100%", background: "none", border: "none", cursor: "pointer",
                padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{
                  background: first.track === "A" ? "rgba(99,102,241,0.15)" : "rgba(6,182,212,0.15)",
                  color: first.track === "A" ? "#818cf8" : "#22d3ee",
                  borderRadius: 4, padding: "1px 6px", fontSize: 10, fontWeight: 700, fontFamily: "monospace",
                }}>Track {first.track}-{first.query_index}</span>
                <span style={{ color: "#94a3b8", fontSize: 12, textAlign: "left" }}>{first.query_text?.slice(0, 80)}…</span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ color: "#64748b", fontSize: 11 }}>{rows.length} results</span>
                {isExpanded ? <ChevronDown size={14} color="#64748b" /> : <ChevronRight size={14} color="#64748b" />}
              </div>
            </button>

            {isExpanded && (
              <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${BORDER}` }}>
                <div style={{ color: "#64748b", fontSize: 12, padding: "10px 0 14px", fontStyle: "italic" }}>
                  {first.query_text}
                </div>
                {rows.map((r: any, i: number) => (
                  <div key={i} style={{ marginBottom: 14, padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: 6 }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                      <span style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700 }}>{r.engine}</span>
                      <span style={{ color: "#64748b", fontSize: 11 }}>round {r.round}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                        background: r.identity_match === "confirmed" ? "rgba(34,197,94,0.15)" : r.identity_match === "partial" ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.1)",
                        color: r.identity_match === "confirmed" ? "#22c55e" : r.identity_match === "partial" ? "#f59e0b" : "#f87171",
                      }}>{r.identity_match}</span>
                      {r.target_rank && <span style={{ color: "#64748b", fontSize: 11 }}>rank #{r.target_rank}</span>}
                    </div>
                    {r.raw_response && (
                      <div style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.5, maxHeight: 120, overflow: "hidden", position: "relative" }}>
                        {r.raw_response.slice(0, 300)}…
                      </div>
                    )}
                    {r.cited_urls?.length > 0 && (
                      <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {r.cited_urls.slice(0, 5).map((url: string, ui: number) => {
                          let domain = url;
                          try { domain = new URL(url).hostname.replace(/^www\./, ""); } catch {}
                          return (
                            <a key={ui} href={url} target="_blank" rel="noreferrer"
                              style={{ fontSize: 10, color: "#3b82f6", background: "rgba(59,130,246,0.1)", padding: "2px 6px", borderRadius: 4, textDecoration: "none" }}>
                              {domain}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

type Tab = "config" | "prompts" | "audits";

export default function AdminPeople() {
  const [tab, setTab] = useState<Tab>("config");
  const qc = useQueryClient();

  const { data: config, isLoading } = useQuery<any>({
    queryKey: ["/api/people/config"],
    queryFn: async () => {
      const res = await fetch("/api/people/config");
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (updates: any) => {
      const res = await apiRequest("POST", "/api/people/config", updates);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/people/config"] });
    },
  });

  const tabs: { id: Tab; label: string }[] = [
    { id: "config", label: "Config" },
    { id: "prompts", label: "Prompt Templates" },
    { id: "audits", label: "Audits" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: DARK, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ color: "#3b82f6", fontSize: 10, fontFamily: "monospace", letterSpacing: 2, marginBottom: 6 }}>ADMIN</div>
          <h1 style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 700, margin: 0 }}>People AI Identity Audit</h1>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>Configure models, query rounds, prompt templates, and view audit history.</p>
        </div>

        <div style={{ display: "flex", gap: 2, marginBottom: 28, borderBottom: `1px solid ${BORDER}` }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              data-testid={`tab-${t.id}`}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "10px 18px", fontSize: 13, fontWeight: 600,
                color: tab === t.id ? "#f1f5f9" : "#64748b",
                borderBottom: tab === t.id ? "2px solid #3b82f6" : "2px solid transparent",
                marginBottom: -1, fontFamily: "system-ui, sans-serif", transition: "color 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ background: PANEL, borderRadius: 12, padding: 28, border: `1px solid ${BORDER}` }}>
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <Loader2 size={24} color="#3b82f6" className="animate-spin" />
            </div>
          ) : (
            <>
              {tab === "config" && config && (
                <ConfigTab
                  config={config}
                  onSave={(updates) => saveMutation.mutate(updates)}
                />
              )}
              {tab === "prompts" && config && (
                <PromptsTab
                  templates={config.promptTemplates ?? []}
                  onSave={(templates) => saveMutation.mutate({ promptTemplates: templates })}
                />
              )}
              {tab === "audits" && <AuditsTab />}
            </>
          )}
        </div>

        <div style={{ marginTop: 20, textAlign: "right" }}>
          <a href="/admin" style={{ color: "#3b82f6", fontSize: 12, textDecoration: "none" }}>← Back to admin</a>
        </div>
      </div>
    </div>
  );
}

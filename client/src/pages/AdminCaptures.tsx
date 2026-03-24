import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Globe, Mail, ExternalLink, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import type { LandingSubmission, AuditWaitlistEntry } from "@shared/schema";

function timeAgo(date: string | Date | null) {
  if (!date) return "—";
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string; icon: JSX.Element }> = {
    complete: { label: "Complete", color: "#059669", bg: "#d1fae5", icon: <CheckCircle size={11} /> },
    done:     { label: "Complete", color: "#059669", bg: "#d1fae5", icon: <CheckCircle size={11} /> },
    processing: { label: "Processing", color: "#d97706", bg: "#fef3c7", icon: <Loader2 size={11} className="animate-spin" /> },
    running:  { label: "Running", color: "#d97706", bg: "#fef3c7", icon: <Loader2 size={11} className="animate-spin" /> },
    pending:  { label: "Pending", color: "#6366f1", bg: "#ede9fe", icon: <Clock size={11} /> },
    error:    { label: "Error", color: "#dc2626", bg: "#fee2e2", icon: <XCircle size={11} /> },
  };
  const s = map[status] ?? { label: status, color: "#6b7280", bg: "#f3f4f6", icon: <Clock size={11} /> };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
      color: s.color, background: s.bg,
      borderRadius: 6, padding: "2px 8px",
    }}>
      {s.icon}{s.label}
    </span>
  );
}

export default function AdminCaptures() {
  const [tab, setTab] = useState<"websites" | "emails">("websites");

  const { data: submissions = [], isLoading: loadingSubs } = useQuery<LandingSubmission[]>({
    queryKey: ["/api/landing/submissions"],
  });

  const { data: waitlist = [], isLoading: loadingWait } = useQuery<AuditWaitlistEntry[]>({
    queryKey: ["/api/waitlist"],
  });

  const tabStyle = (active: boolean) => ({
    padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer",
    fontSize: 13, fontWeight: 700,
    background: active ? "#4f46e5" : "transparent",
    color: active ? "#ffffff" : "#6b7280",
    transition: "all 0.15s",
  });

  const rowStyle: React.CSSProperties = {
    display: "grid", alignItems: "center",
    borderBottom: "1px solid #f3f4f6",
    padding: "12px 16px",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <Link href="/admin">
            <a style={{ display: "flex", alignItems: "center", gap: 6, color: "#6b7280", fontSize: 13, textDecoration: "none" }}>
              <ArrowLeft size={14} /> Admin
            </a>
          </Link>
          <span style={{ color: "#d1d5db" }}>/</span>
          <span style={{ fontSize: 13, color: "#111827", fontWeight: 700 }}>Captures</span>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: "0 0 4px", letterSpacing: "-0.03em" }}>
          Lead Captures
        </h1>
        <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 24px" }}>
          Websites submitted · Emails entered during analysis
        </p>

        <div style={{ display: "flex", gap: 4, background: "#f3f4f6", borderRadius: 10, padding: 4, width: "fit-content", marginBottom: 20 }}>
          <button style={tabStyle(tab === "websites")} onClick={() => setTab("websites")}>
            <Globe size={12} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
            Websites ({submissions.length})
          </button>
          <button style={tabStyle(tab === "emails")} onClick={() => setTab("emails")}>
            <Mail size={12} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
            Emails ({waitlist.length})
          </button>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          {tab === "websites" && (
            <>
              <div style={{ ...rowStyle, gridTemplateColumns: "1fr 110px 100px 90px", background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase" }}>Domain</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase" }}>Status</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase" }}>Submitted</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase" }}>Session</span>
              </div>
              {loadingSubs ? (
                <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
                  <Loader2 size={20} className="animate-spin" style={{ display: "inline" }} />
                </div>
              ) : submissions.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>No submissions yet</div>
              ) : submissions.map((s) => (
                <div key={s.id} style={{ ...rowStyle, gridTemplateColumns: "1fr 110px 100px 90px" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{s.normalizedDomain}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{s.websiteUrl}</div>
                  </div>
                  <StatusBadge status={s.status} />
                  <span style={{ fontSize: 12, color: "#6b7280" }}>{timeAgo(s.createdAt)}</span>
                  <span>
                    {s.sessionId ? (
                      <a
                        href={`/v2/${s.sessionId}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "#4f46e5", textDecoration: "none", fontWeight: 600 }}
                      >
                        #{s.sessionId} <ExternalLink size={10} />
                      </a>
                    ) : (
                      <span style={{ fontSize: 11, color: "#d1d5db" }}>—</span>
                    )}
                  </span>
                </div>
              ))}
            </>
          )}

          {tab === "emails" && (
            <>
              <div style={{ ...rowStyle, gridTemplateColumns: "1fr 1fr 100px", background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase" }}>Email</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase" }}>Website</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase" }}>Captured</span>
              </div>
              {loadingWait ? (
                <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
                  <Loader2 size={20} className="animate-spin" style={{ display: "inline" }} />
                </div>
              ) : waitlist.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>No emails captured yet</div>
              ) : waitlist.map((w) => (
                <div key={w.id} style={{ ...rowStyle, gridTemplateColumns: "1fr 1fr 100px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Mail size={13} color="#7c3aed" />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{w.email}</span>
                  </div>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>{w.website}</span>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>{timeAgo(w.createdAt)}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

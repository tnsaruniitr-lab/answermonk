import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2, Globe, ArrowRight, Sparkles, Clock } from "lucide-react";
import { MonkWordmark } from "@/components/MonkWordmark";
import { useQuery } from "@tanstack/react-query";

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

function isValidUrl(val: string): boolean {
  try {
    const u = new URL(val.startsWith("http") ? val : `https://${val}`);
    return u.hostname.includes(".");
  } catch {
    return false;
  }
}

function normalizeUrl(val: string): string {
  const trimmed = val.trim();
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
}

export default function BrandSmithLanding() {
  const [, navigate] = useLocation();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const sessionId = getSessionId();
  const apiBase = getApiBase();

  const { data: recentJobs } = useQuery<any[]>({
    queryKey: ["/api/brandsmith/jobs", sessionId],
    queryFn: async () => {
      const r = await fetch(`/api/brandsmith/jobs?sessionId=${sessionId}`);
      if (!r.ok) return [];
      return r.json();
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const url = normalizeUrl(input);
    if (!isValidUrl(url)) {
      setError("Please enter a valid website URL, e.g. acme.com");
      return;
    }
    setLoading(true);
    try {
      const endpoint = apiBase
        ? `${apiBase}/api/brands/research`
        : "/api/brandsmith/mock/research";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website_url: url, session_id: sessionId }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      navigate(`/agents/brandsmith/${data.job_id}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0a0a", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "20px 32px", borderBottom: "1px solid #1f1f1f", display: "flex", alignItems: "center", gap: "12px" }}>
        <MonkWordmark />
        <span style={{ color: "#4b5563", fontSize: "14px", marginLeft: "4px" }}>/</span>
        <span style={{ color: "#e5e7eb", fontSize: "14px", fontWeight: 600, letterSpacing: "-0.01em" }}>BrandSmith</span>
      </header>

      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px" }}>
        <div style={{ maxWidth: "620px", width: "100%", textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            backgroundColor: "#111827", border: "1px solid #1f2937",
            borderRadius: "20px", padding: "5px 14px", marginBottom: "28px",
          }}>
            <Sparkles size={13} color="#6366f1" />
            <span style={{ fontSize: "12px", color: "#9ca3af", letterSpacing: "0.03em" }}>AI-powered brand intelligence</span>
          </div>

          <h1 style={{
            fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 700,
            color: "#f9fafb", lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: "16px",
          }}>
            Build your brand map<br />
            <span style={{ color: "#6366f1" }}>from any website</span>
          </h1>

          <p style={{ fontSize: "17px", color: "#9ca3af", lineHeight: 1.6, marginBottom: "44px", maxWidth: "480px", margin: "0 auto 44px" }}>
            Enter a website URL. BrandSmith crawls the site, researches the market, and returns a complete 7-section brand profile — ready to edit and export.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px", maxWidth: "520px", margin: "0 auto" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Globe size={16} color="#6b7280" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input
                data-testid="input-website-url"
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="acme.com"
                disabled={loading}
                style={{
                  width: "100%", padding: "13px 14px 13px 40px",
                  backgroundColor: "#111827", border: "1px solid #1f2937",
                  borderRadius: "10px", color: "#f9fafb", fontSize: "15px",
                  outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={e => (e.target.style.borderColor = "#6366f1")}
                onBlur={e => (e.target.style.borderColor = "#1f2937")}
              />
            </div>
            <button
              data-testid="button-analyse"
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "13px 22px", backgroundColor: loading || !input.trim() ? "#312e81" : "#6366f1",
                color: "#fff", border: "none", borderRadius: "10px",
                fontSize: "15px", fontWeight: 600, cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                opacity: !input.trim() ? 0.5 : 1, whiteSpace: "nowrap",
                transition: "background-color 0.15s",
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <><span>Analyse</span><ArrowRight size={15} /></>}
            </button>
          </form>

          {error && (
            <p data-testid="text-error" style={{ marginTop: "12px", color: "#f87171", fontSize: "13px" }}>
              {error}
            </p>
          )}

          <div style={{ marginTop: "16px", display: "flex", justifyContent: "center", gap: "24px" }}>
            {["Crawls homepage + inner pages", "Claude AI synthesis", "7 editable brand cards"].map(item => (
              <span key={item} style={{ fontSize: "12px", color: "#4b5563", display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ color: "#6366f1" }}>✓</span> {item}
              </span>
            ))}
          </div>
        </div>

        {recentJobs && recentJobs.length > 0 && (
          <div style={{ marginTop: "64px", maxWidth: "620px", width: "100%" }}>
            <p style={{ fontSize: "12px", color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Clock size={12} /> Recent analyses
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {recentJobs.slice().reverse().slice(0, 5).map((job: any) => (
                <button
                  key={job.jobId}
                  data-testid={`button-recent-job-${job.jobId}`}
                  onClick={() => navigate(`/agents/brandsmith/${job.jobId}`)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 16px", backgroundColor: "#111827",
                    border: "1px solid #1f2937", borderRadius: "8px",
                    cursor: "pointer", width: "100%", textAlign: "left",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.borderColor = "#374151")}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.borderColor = "#1f2937")}
                >
                  <span style={{ fontSize: "14px", color: "#e5e7eb" }}>{job.websiteUrl}</span>
                  <span style={{ fontSize: "12px", color: "#4b5563" }}>
                    {new Date(job.createdAt).toLocaleDateString()}
                    {job.confirmedAt && <span style={{ marginLeft: "8px", color: "#6366f1" }}>✓ confirmed</span>}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2, Globe, ArrowRight, Layers, Users, Mic, Search } from "lucide-react";
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
      <nav style={{ padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(99,102,241,0.1)" }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <MonkWordmark />
        </a>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#6366f1", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 100, padding: "4px 12px" }}>
          BrandSmith
        </span>
      </nav>

      <main style={{ maxWidth: 680, margin: "0 auto", padding: "80px 24px 60px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: 100, padding: "6px 14px", marginBottom: 24,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#6366f1" }}>AI Brand Intelligence</span>
          </div>

          <h1 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 800, color: "#0f0a2e", lineHeight: 1.15, marginBottom: 16, letterSpacing: "-0.02em" }}>
            Build your complete brand map<br />from any website
          </h1>
          <p style={{ fontSize: 18, color: "#6b7280", lineHeight: 1.6, maxWidth: 500, margin: "0 auto" }}>
            Enter a website URL. BrandSmith crawls the site, researches the market with Claude AI, and returns a 7-section brand profile — ready to edit and export.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 4px 24px rgba(99,102,241,0.12), 0 1px 4px rgba(0,0,0,0.06)",
            padding: 8,
            display: "flex",
            gap: 8,
            marginBottom: error ? 8 : 24,
          }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, padding: "0 16px" }}>
              <Globe size={20} color="#6366f1" strokeWidth={1.5} />
              <input
                data-testid="input-website-url"
                type="text"
                value={input}
                onChange={e => { setInput(e.target.value); setError(""); }}
                placeholder="acme.com"
                disabled={loading}
                style={{
                  flex: 1, border: "none", outline: "none",
                  fontSize: 16, color: "#1f2937", background: "transparent",
                  fontFamily: "inherit",
                }}
                autoComplete="off"
              />
            </div>
            <button
              data-testid="button-analyse"
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                background: loading || !input.trim() ? "#c7d2fe" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "14px 24px",
                fontSize: 15,
                fontWeight: 700,
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                whiteSpace: "nowrap",
                transition: "all 0.2s",
              }}
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Connecting…</>
                : <>Analyse brand <ArrowRight size={16} /></>
              }
            </button>
          </div>

          {error && (
            <p data-testid="text-error" style={{ color: "#ef4444", fontSize: 13, marginBottom: 16, paddingLeft: 4 }}>{error}</p>
          )}
        </form>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 48 }}>
          {[
            { icon: <Search size={20} color="#6366f1" />, title: "Identity & positioning", desc: "Brand name, tagline, mission, founding story, and how the company presents itself." },
            { icon: <Users size={20} color="#8b5cf6" />, title: "Audience & competitors", desc: "Ideal customer profiles, buyer personas, competitor map, and market positioning." },
            { icon: <Mic size={20} color="#06b6d4" />, title: "Voice & SEO strategy", desc: "Tone guidelines, content pillars, primary keywords, and target search queries." },
          ].map((item, i) => (
            <div key={i} style={{
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              border: "1px solid rgba(99,102,241,0.08)",
            }}>
              <div style={{ marginBottom: 10 }}>{item.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", marginBottom: 6 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>

        {recentJobs && recentJobs.length > 0 && (
          <div style={{ marginTop: 56 }}>
            <p style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
              Recent analyses
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentJobs.slice().reverse().slice(0, 5).map((job: any) => (
                <button
                  key={job.jobId}
                  data-testid={`button-recent-job-${job.jobId}`}
                  onClick={() => navigate(`/agents/brandsmith/${job.jobId}`)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 16px",
                    background: "#fff",
                    border: "1px solid rgba(99,102,241,0.12)",
                    borderRadius: 10,
                    cursor: "pointer", width: "100%", textAlign: "left",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                    transition: "box-shadow 0.15s",
                  }}
                >
                  <span style={{ fontSize: 14, color: "#1f2937", fontWeight: 500 }}>{job.websiteUrl.replace(/^https?:\/\//, "")}</span>
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>
                    {new Date(job.createdAt).toLocaleDateString()}
                    {job.confirmedAt && <span style={{ marginLeft: 8, color: "#6366f1", fontWeight: 600 }}>✓ confirmed</span>}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginTop: 32 }}>
          Powered by Claude AI · No account required
        </p>
      </main>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}

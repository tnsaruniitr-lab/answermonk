import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Linkedin, Search, ArrowRight, Brain, Shield, BarChart3 } from "lucide-react";
import { MonkWordmark } from "@/components/MonkWordmark";

function normalizeLinkedInUrl(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith("http")) return trimmed;
  if (trimmed.startsWith("linkedin.com")) return `https://${trimmed}`;
  if (trimmed.includes("/in/")) return `https://linkedin.com${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
  return `https://linkedin.com/in/${trimmed}`;
}

function isValidLinkedInUrl(url: string): boolean {
  return url.includes("linkedin.com/in/");
}

export default function PeopleLanding() {
  const [, navigate] = useLocation();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const crawlMutation = useMutation({
    mutationFn: async (linkedinUrl: string) => {
      const res = await apiRequest("POST", "/api/people/crawl", { linkedinUrl });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.sessionId) {
        navigate(`/people/anchors/${data.sessionId}`);
      }
    },
    onError: (err: any) => {
      setError("Something went wrong. Please try again.");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const normalized = normalizeLinkedInUrl(input);
    if (!isValidLinkedInUrl(normalized)) {
      setError("Please enter a valid LinkedIn profile URL (linkedin.com/in/your-name)");
      return;
    }
    crawlMutation.mutate(normalized);
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8f7ff 0%, #eef2ff 50%, #f0f9ff 100%)", fontFamily: "Inter, system-ui, sans-serif" }}>
      <nav style={{ padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(99,102,241,0.1)" }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <MonkWordmark />
        </a>
        <a href="/reports" style={{ fontSize: 14, color: "#6366f1", fontWeight: 500, textDecoration: "none" }}>
          Reports
        </a>
      </nav>

      <main style={{ maxWidth: 680, margin: "0 auto", padding: "80px 24px 60px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: 100, padding: "6px 14px", marginBottom: 24,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#6366f1" }}>AI Identity Audit — Live</span>
          </div>

          <h1 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 800, color: "#0f0a2e", lineHeight: 1.15, marginBottom: 16, letterSpacing: "-0.02em" }}>
            Find out what AI thinks of you
          </h1>
          <p style={{ fontSize: 18, color: "#6b7280", lineHeight: 1.6, maxWidth: 500, margin: "0 auto" }}>
            Enter your LinkedIn URL — we run your identity across ChatGPT, Gemini, and Claude to show you where you stand and what they really know.
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
              <Linkedin size={20} color="#0a66c2" strokeWidth={1.5} />
              <input
                type="text"
                value={input}
                onChange={e => { setInput(e.target.value); setError(""); }}
                placeholder="linkedin.com/in/your-name"
                style={{
                  flex: 1, border: "none", outline: "none",
                  fontSize: 16, color: "#1f2937", background: "transparent",
                  fontFamily: "inherit",
                }}
                data-testid="input-linkedin-url"
                autoComplete="off"
                disabled={crawlMutation.isPending}
              />
            </div>
            <button
              type="submit"
              disabled={crawlMutation.isPending || !input.trim()}
              data-testid="button-audit-submit"
              style={{
                background: crawlMutation.isPending || !input.trim() ? "#c7d2fe" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "14px 24px",
                fontSize: 15,
                fontWeight: 700,
                cursor: crawlMutation.isPending || !input.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                whiteSpace: "nowrap",
                transition: "all 0.2s",
              }}
            >
              {crawlMutation.isPending ? (
                <><Loader2 size={16} className="animate-spin" /> Reading profile...</>
              ) : (
                <>Audit my AI identity <ArrowRight size={16} /></>
              )}
            </button>
          </div>

          {error && (
            <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 16, paddingLeft: 4 }}>{error}</p>
          )}
        </form>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 48 }}>
          {[
            { icon: <Search size={20} color="#6366f1" />, title: "Name recognition", desc: "Does AI know who you are unprompted? Which version of your name does it default to?" },
            { icon: <Brain size={20} color="#8b5cf6" />, title: "Identity accuracy", desc: "What does AI actually say about you? Are the facts correct and well-sourced?" },
            { icon: <BarChart3 size={20} color="#06b6d4" />, title: "Name rank", desc: "Among all people with your name, where do you rank across ChatGPT, Gemini, and Claude?" },
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

        <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginTop: 32 }}>
          We only read your public LinkedIn profile. No login required.
        </p>
      </main>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}

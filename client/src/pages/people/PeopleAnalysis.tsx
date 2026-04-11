import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, CheckCircle2 } from "lucide-react";
import { MonkWordmark } from "@/components/MonkWordmark";

const TRACK_A_STEPS = [
  "Building your identity query from selected anchors...",
  "Running across ChatGPT with web search...",
  "Running across Gemini with Google Search...",
  "Running across Claude...",
  "Parsing AI responses for identity signals...",
  "Mapping claims to source URLs...",
  "Resolving identity confidence...",
];

const TRACK_B_STEPS = [
  "Running name disambiguation query...",
  "Extracting name landscape across all engines...",
  "Identifying top-cited people with your name...",
  "Crawling cited source URLs...",
  "Building authority domain map...",
];

function useStepAnimation(steps: string[], running: boolean, intervalMs = 2800) {
  const [stepIndex, setStepIndex] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setStepIndex(i => Math.min(i + 1, steps.length - 1)), intervalMs);
    return () => clearInterval(t);
  }, [running, steps.length, intervalMs]);
  return stepIndex;
}

export default function PeopleAnalysis({ sessionId }: { sessionId: number }) {
  const [, navigate] = useLocation();

  const { data: session } = useQuery({
    queryKey: ["/api/people/session", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/people/session/${sessionId}`);
      return res.json();
    },
    refetchInterval: (data: any) => {
      if (data?.status === "complete" || data?.status === "error") return false;
      return 4000;
    },
  });

  const isRunning = !session || (session.status !== "complete" && session.status !== "error");
  const trackAStep = useStepAnimation(TRACK_A_STEPS, isRunning, 3200);
  const trackBStep = useStepAnimation(TRACK_B_STEPS, isRunning, 2600);

  useEffect(() => {
    if (session?.status === "complete" && session?.slug) {
      setTimeout(() => navigate(`/people/reports/${session.slug}`), 800);
    }
  }, [session?.status, session?.slug, navigate]);

  const trackBDone = session?.status === "complete";
  const trackBFraction = trackBDone ? 1 : Math.min(0.95, (trackBStep + 1) / TRACK_B_STEPS.length);
  const trackAFraction = trackBDone ? 1 : Math.min(0.95, (trackAStep + 1) / TRACK_A_STEPS.length);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8f7ff 0%, #eef2ff 50%, #f0f9ff 100%)", fontFamily: "Inter, system-ui, sans-serif" }}>
      <nav style={{ padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(99,102,241,0.1)" }}>
        <a href="/" style={{ textDecoration: "none" }}><MonkWordmark /></a>
      </nav>

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f0a2e", marginBottom: 8 }}>
            Auditing your AI identity
          </h1>
          <p style={{ fontSize: 15, color: "#6b7280" }}>
            {session?.name ? `Running identity analysis for ${session.name}` : "Running identity analysis..."}
          </p>
        </div>

        <div style={{
          background: "#fff", borderRadius: 16,
          boxShadow: "0 4px 24px rgba(99,102,241,0.08)",
          padding: 32, display: "flex", flexDirection: "column", gap: 28,
        }}>
          <TrackProgress
            label="Track A — Identity analysis"
            description={trackBDone ? "Complete" : TRACK_A_STEPS[trackAStep]}
            fraction={trackAFraction}
            done={trackBDone}
            color="#6366f1"
          />
          <div style={{ height: 1, background: "#f3f4f6" }} />
          <TrackProgress
            label="Track B — Name landscape"
            description={trackBDone ? `Complete` : TRACK_B_STEPS[trackBStep]}
            fraction={trackBFraction}
            done={trackBDone}
            color="#8b5cf6"
            teaser={trackBStep >= 2 && !trackBDone ? "Identifying people with your name across AI engines..." : undefined}
          />
        </div>

        <p style={{ textAlign: "center", fontSize: 13, color: "#9ca3af", marginTop: 24 }}>
          {trackBDone ? "Complete — loading your report..." : "Estimated time: 2–4 minutes"}
        </p>

        {session?.status === "error" && (
          <div style={{
            marginTop: 24, background: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: 12, padding: 16, textAlign: "center",
          }}>
            <p style={{ color: "#dc2626", fontSize: 14, fontWeight: 600 }}>Analysis encountered an error</p>
            <p style={{ color: "#ef4444", fontSize: 13, marginTop: 4 }}>{(session as any).error_message ?? "Please try again."}</p>
          </div>
        )}
      </main>
    </div>
  );
}

function TrackProgress({
  label, description, fraction, done, color, teaser,
}: {
  label: string; description: string; fraction: number;
  done: boolean; color: string; teaser?: string;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#1f2937" }}>{label}</span>
        {done ? (
          <CheckCircle2 size={18} color="#10b981" />
        ) : (
          <Loader2 size={16} color={color} className="animate-spin" />
        )}
      </div>
      <div style={{ height: 6, background: "#f3f4f6", borderRadius: 100, overflow: "hidden", marginBottom: 8 }}>
        <div style={{
          height: "100%", borderRadius: 100,
          background: done ? "#10b981" : color,
          width: `${Math.round(fraction * 100)}%`,
          transition: "width 1.2s ease",
        }} />
      </div>
      <p style={{ fontSize: 12, color: "#9ca3af", minHeight: 16 }}>
        {done ? "✓ Done" : description}
      </p>
      {teaser && !done && (
        <p style={{ fontSize: 12, color: "#6366f1", fontWeight: 600, marginTop: 4 }}>{teaser}</p>
      )}
    </div>
  );
}

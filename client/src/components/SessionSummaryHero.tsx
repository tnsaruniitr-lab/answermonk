import { useMemo } from "react";

interface Seg {
  scoringResult?: {
    score?: {
      appearance_rate?: number;
      primary_rate?: number;
      avg_rank?: number;
      engine_breakdown?: Record<string, { appearance_rate?: number; primary_rate?: number; responses?: number }>;
      competitors?: { name: string; share: number }[];
    };
    raw_runs?: { citations?: any[] }[];
  };
  location?: string;
}

interface Props {
  brandName: string;
  brandDomain?: string;
  scoredSegs: Seg[];
  totalSegs: number;
}

const ENGINE_META: Record<string, { label: string; color: string; key: string }> = {
  chatgpt:  { label: "ChatGPT", color: "#10b981", key: "chatgpt"  },
  gemini:   { label: "Gemini",  color: "#60a5fa", key: "gemini"   },
  claude:   { label: "Claude",  color: "#fbbf24", key: "claude"   },
};

function avg(vals: number[]) {
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function alarmLevel(pct: number): { label: string; color: string; bg: string } | null {
  if (pct >= 60) return null;
  if (pct >= 30) return { label: "Below Average", color: "#fbbf24", bg: "rgba(251,191,36,0.12)" };
  if (pct >= 10) return { label: "Very Low", color: "#f87171", bg: "rgba(248,113,113,0.12)" };
  return { label: "Critical", color: "#ef4444", bg: "rgba(239,68,68,0.15)" };
}

export function SessionSummaryHero({ brandName, scoredSegs, totalSegs }: Props) {
  const stats = useMemo(() => {
    const appearance  = Math.round(avg(scoredSegs.map(s => (s.scoringResult?.score?.appearance_rate ?? 0) * 100)));
    const top3        = Math.round(avg(scoredSegs.map(s => (s.scoringResult?.score?.primary_rate    ?? 0) * 100)));
    const rawAvgRank  = avg(scoredSegs.filter(s => s.scoringResult?.score?.avg_rank != null).map(s => s.scoringResult!.score!.avg_rank!));
    const avgRank     = rawAvgRank > 0 ? `#${rawAvgRank % 1 === 0 ? rawAvgRank : rawAvgRank.toFixed(1)}` : "—";
    const totalResponses = scoredSegs.reduce((sum, s) => sum + (s.scoringResult?.raw_runs?.length ?? 0), 0);
    const location    = scoredSegs[0]?.location || "";

    const engineKeys = ["chatgpt", "gemini", "claude"];
    const engines = engineKeys.map(key => {
      const vals = scoredSegs
        .map(s => s.scoringResult?.score?.engine_breakdown?.[key]?.appearance_rate)
        .filter((v): v is number => v != null);
      const top3Vals = scoredSegs
        .map(s => s.scoringResult?.score?.engine_breakdown?.[key]?.primary_rate)
        .filter((v): v is number => v != null);
      const respVals = scoredSegs
        .map(s => s.scoringResult?.score?.engine_breakdown?.[key]?.responses)
        .filter((v): v is number => v != null);
      return {
        ...ENGINE_META[key],
        pct:      Math.round(avg(vals) * 100),
        top3:     Math.round(avg(top3Vals) * 100),
        responses: respVals.length ? Math.round(avg(respVals)) * scoredSegs.length : null,
      };
    }).filter(e => e.pct > 0 || scoredSegs.length > 0);

    const compMap: Record<string, number[]> = {};
    scoredSegs.forEach(s => {
      (s.scoringResult?.score?.competitors || []).forEach((c: { name: string; share: number }) => {
        const key = c.name.toLowerCase();
        compMap[key] = [...(compMap[key] || []), c.share];
      });
    });
    const brandKey = brandName.toLowerCase();
    const brandShare = avg(scoredSegs.map(s => s.scoringResult?.score?.appearance_rate ?? 0));
    compMap[brandKey] = [brandShare];

    const sorted = Object.entries(compMap)
      .map(([name, shares]) => ({ name, share: avg(shares) }))
      .sort((a, b) => b.share - a.share);
    const brandRank = sorted.findIndex(c => c.name === brandKey) + 1;
    const totalBrands = sorted.length;

    return { appearance, top3, avgRank, totalResponses, location, engines, brandRank, totalBrands };
  }, [scoredSegs, brandName]);

  const initial = brandName.trim().charAt(0).toUpperCase() || "?";
  const alarm   = alarmLevel(stats.appearance);

  return (
    <div
      className="rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500"
      style={{
        background: "linear-gradient(135deg, #0f1a35 0%, #111827 60%, #0f172a 100%)",
        border: "1px solid rgba(99,102,241,0.25)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 20px 60px rgba(0,0,0,0.5)",
      }}
    >
      {/* ── Brand + Appearance Rate banner ── */}
      <div
        style={{
          background: "linear-gradient(100deg, #3730a3 0%, #4f46e5 45%, #6d28d9 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.10)",
          padding: "16px 22px",
        }}
      >
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div
            style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, fontWeight: 800, color: "#fff",
            }}
          >
            {initial}
          </div>
          <span style={{ fontSize: 17, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em", lineHeight: 1 }}>
            {brandName}
          </span>
          {stats.brandRank > 0 && (
            <span style={{
              marginLeft: "auto", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)",
              background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 20, padding: "3px 10px", flexShrink: 0,
            }}>
              #{stats.brandRank} of {stats.totalBrands} brands
            </span>
          )}
        </div>

        {/* Appearance rate row */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
            Appearance Rate
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 42, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.03em", lineHeight: 1 }}>
              {stats.appearance}%
            </span>
            {alarm && (
              <span style={{
                fontSize: 11, fontWeight: 700, color: alarm.color,
                background: alarm.bg, border: `1px solid ${alarm.color}44`,
                borderRadius: 20, padding: "4px 10px", flexShrink: 0,
              }}>
                ⚠ {alarm.label}
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>
            You appear in {stats.appearance}% of AI searches when customers look for your services
          </p>
        </div>
      </div>

      {/* ── Stats + engine breakdown ── */}
      <div style={{ padding: "16px 22px" }}>
        {/* Stats row */}
        <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
          {[
            { label: "Top 3 Rate", value: `${stats.top3}%` },
            { label: "Avg Rank",   value: stats.avgRank    },
            { label: "Segments",   value: `${scoredSegs.length}/${totalSegs}` },
            { label: "Responses",  value: stats.totalResponses },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "left" }}>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9", marginBottom: 2 }}>{s.value}</p>
              <p style={{ fontSize: 11, color: "#94a3b8" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Engine bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {stats.engines.map(e => (
            <div key={e.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", width: 56, flexShrink: 0 }}>{e.label}</span>
              <div style={{ flex: 1, height: 6, borderRadius: 99, overflow: "hidden", background: "#1e293b" }}>
                <div
                  style={{
                    height: "100%", borderRadius: 99,
                    width: `${e.pct}%`,
                    background: `linear-gradient(90deg, ${e.color}, ${e.color}88)`,
                    transition: "width 0.7s ease",
                  }}
                />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", width: 34, textAlign: "right", flexShrink: 0, fontFamily: "monospace" }}>
                {e.pct}%
              </span>
            </div>
          ))}
        </div>

        {/* Location / meta */}
        {stats.location && (
          <p style={{ fontSize: 11, color: "#475569", marginTop: 12 }}>
            {stats.location}
          </p>
        )}
      </div>
    </div>
  );
}

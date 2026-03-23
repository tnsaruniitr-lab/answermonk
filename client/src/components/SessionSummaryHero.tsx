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

const ENGINE_META = [
  { key: "chatgpt", label: "ChatGPT", color: "#10b981" },
  { key: "gemini",  label: "Gemini",  color: "#60a5fa" },
  { key: "claude",  label: "Claude",  color: "#fbbf24" },
];

function avg(vals: number[]) {
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

type AlarmLevel = {
  label: string;
  color: string;
  textColor: string;
  panelBg: string;
  borderColor: string;
  percentColor: string;
  descColor: string;
};

function getAlarmLevel(pct: number): AlarmLevel {
  if (pct < 10) return {
    label: "⚠ Critical",
    color: "#ef4444",
    textColor: "#fca5a5",
    panelBg: "linear-gradient(110deg,#450a0a,#7f1d1d)",
    borderColor: "rgba(239,68,68,0.3)",
    percentColor: "#fca5a5",
    descColor: "rgba(252,165,165,0.6)",
  };
  if (pct < 30) return {
    label: "⚠ Very Low",
    color: "#f59e0b",
    textColor: "#fcd34d",
    panelBg: "linear-gradient(110deg,#451a03,#78350f)",
    borderColor: "rgba(245,158,11,0.3)",
    percentColor: "#fcd34d",
    descColor: "rgba(252,211,77,0.6)",
  };
  if (pct < 60) return {
    label: "Below Average",
    color: "#818cf8",
    textColor: "#c7d2fe",
    panelBg: "linear-gradient(110deg,#1e1b4b,#312e81)",
    borderColor: "rgba(99,102,241,0.3)",
    percentColor: "#c7d2fe",
    descColor: "rgba(199,210,254,0.6)",
  };
  return {
    label: "Good",
    color: "#10b981",
    textColor: "#6ee7b7",
    panelBg: "linear-gradient(110deg,#052e16,#064e3b)",
    borderColor: "rgba(16,185,129,0.3)",
    percentColor: "#6ee7b7",
    descColor: "rgba(110,231,183,0.6)",
  };
}

export function SessionSummaryHero({ brandName, brandDomain, scoredSegs, totalSegs }: Props) {
  const stats = useMemo(() => {
    const appearance  = Math.round(avg(scoredSegs.map(s => (s.scoringResult?.score?.appearance_rate ?? 0) * 100)));
    const top3        = Math.round(avg(scoredSegs.map(s => (s.scoringResult?.score?.primary_rate    ?? 0) * 100)));
    const rawAvgRank  = avg(scoredSegs.filter(s => s.scoringResult?.score?.avg_rank != null).map(s => s.scoringResult!.score!.avg_rank!));
    const avgRank     = rawAvgRank > 0 ? `#${rawAvgRank % 1 === 0 ? rawAvgRank : rawAvgRank.toFixed(1)}` : "—";
    const totalResponses = scoredSegs.reduce((sum, s) => sum + (s.scoringResult?.raw_runs?.length ?? 0), 0);

    const engines = ENGINE_META.map(e => {
      const vals = scoredSegs
        .map(s => s.scoringResult?.score?.engine_breakdown?.[e.key]?.appearance_rate)
        .filter((v): v is number => v != null);
      return { ...e, pct: Math.round(avg(vals) * 100) };
    });

    const compMap: Record<string, number[]> = {};
    scoredSegs.forEach(s => {
      (s.scoringResult?.score?.competitors || []).forEach((c: { name: string; share: number }) => {
        const k = c.name.toLowerCase();
        compMap[k] = [...(compMap[k] || []), c.share];
      });
    });
    const brandKey = brandName.toLowerCase();
    compMap[brandKey] = [avg(scoredSegs.map(s => s.scoringResult?.score?.appearance_rate ?? 0))];
    const sorted = Object.entries(compMap).map(([name, shares]) => ({ name, share: avg(shares) })).sort((a, b) => b.share - a.share);
    const brandRank   = sorted.findIndex(c => c.name === brandKey) + 1;
    const totalBrands = sorted.length;

    return { appearance, top3, avgRank, totalResponses, engines, brandRank, totalBrands };
  }, [scoredSegs, brandName]);

  const initial       = brandName.trim().charAt(0).toUpperCase() || "?";
  const alarm         = getAlarmLevel(stats.appearance);
  const maxEnginePct  = Math.max(...stats.engines.map(e => e.pct), 20);

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-2 duration-500"
      style={{
        borderRadius: 20,
        overflow: "hidden",
        border: `1px solid ${alarm.borderColor}`,
        boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 24px 60px rgba(0,0,0,0.6)",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ── Brand header ── */}
      <div style={{ background: "#0f172a", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
          background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, fontWeight: 900, color: "#fff",
        }}>
          {initial}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.025em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {brandName}
          </div>
          {brandDomain && (
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {brandDomain} · GEO Intelligence Scan
            </div>
          )}
        </div>
        {stats.brandRank > 0 && (
          <div style={{ marginLeft: "auto", fontSize: 10, color: "#64748b", background: "#1e293b", border: "1px solid #334155", borderRadius: 6, padding: "3px 8px", fontWeight: 600, flexShrink: 0, whiteSpace: "nowrap" }}>
            #{stats.brandRank} of {stats.totalBrands} brands
          </div>
        )}
      </div>

      {/* ── Alarm panel ── */}
      <div style={{ background: alarm.panelBg, padding: "12px 20px 14px", borderBottom: `1px solid ${alarm.borderColor}` }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
          <span style={{ fontSize: 44, fontWeight: 900, color: alarm.percentColor, letterSpacing: "-0.04em", lineHeight: 1 }}>
            {stats.appearance}%
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: `${alarm.textColor}80`, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Appearance Rate
          </span>
          <span style={{
            display: "inline-flex", alignItems: "center",
            background: `${alarm.color}26`, border: `1px solid ${alarm.color}80`,
            color: alarm.color, borderRadius: 20, padding: "3px 10px",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.03em",
          }}>
            {alarm.label}
          </span>
        </div>
        <p style={{ fontSize: 11.5, color: alarm.descColor, lineHeight: 1.4 }}>
          You appear in <strong style={{ color: alarm.textColor }}>{stats.appearance}% of AI searches</strong> when customers look for your services.
        </p>
      </div>

      {/* ── Stats row ── */}
      <div style={{
        background: "#0f172a", padding: "11px 20px",
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8,
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        {[
          { label: "Top 3 Rate", value: `${stats.top3}%` },
          { label: "Avg Rank",   value: stats.avgRank },
          { label: "Segments",   value: `${scoredSegs.length}/${totalSegs}` },
          { label: "Responses",  value: String(stats.totalResponses || "—") },
        ].map(s => (
          <div key={s.label}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#e2e8f0", fontFamily: "monospace" }}>{s.value}</div>
            <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Engine breakdown ── */}
      <div style={{ background: "#0f172a", padding: "11px 20px 15px" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
          By Engine
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {stats.engines.map(e => (
            <div key={e.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", width: 52, flexShrink: 0 }}>{e.label}</span>
              <div style={{ flex: 1, height: 5, background: "#1e293b", borderRadius: 99, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${maxEnginePct > 0 ? (e.pct / maxEnginePct) * 100 : 0}%`,
                  background: e.color, borderRadius: 99,
                  transition: "width 0.7s ease",
                }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", fontFamily: "monospace", width: 28, textAlign: "right", flexShrink: 0 }}>
                {e.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

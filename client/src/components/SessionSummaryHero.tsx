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
  gemini:   { label: "Gemini",  color: "#3b82f6", key: "gemini"   },
  claude:   { label: "Claude",  color: "#f59e0b", key: "claude"   },
};

function ScoreRing({ score }: { score: number }) {
  const size = 110;
  const r = size * 0.42;
  const circ = 2 * Math.PI * r;
  const cx = size / 2, cy = size / 2;
  const ringColor = score >= 60 ? "#10b981" : score >= 35 ? "#60a5fa" : "#f59e0b";
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e3a5f" strokeWidth="7" />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={ringColor} strokeWidth="7"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - score / 100)}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${ringColor})`, transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-white font-bold font-mono leading-none" style={{ fontSize: 26 }}>{score}%</span>
        <span className="font-mono tracking-widest" style={{ fontSize: 8, color: ringColor, marginTop: 5 }}>VISIBILITY</span>
      </div>
    </div>
  );
}

function avg(vals: number[]) {
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function visibilityLabel(pct: number) {
  if (pct >= 60) return "High";
  if (pct >= 30) return "Moderate";
  return "Low";
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

    // Competitor rank: aggregate share across all segs, rank the brand
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
  const label   = visibilityLabel(stats.appearance);

  return (
    <div
      className="rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500"
      style={{
        background: "linear-gradient(135deg, #0f1a35 0%, #111827 60%, #0f172a 100%)",
        border: "1px solid rgba(99,102,241,0.25)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 20px 60px rgba(0,0,0,0.5)",
      }}
    >
      {/* ── Brand identity row ── */}
      <div className="flex items-center gap-3 px-6 pt-6 pb-5 border-b border-white/5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-extrabold text-white"
          style={{
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            boxShadow: "0 0 16px rgba(99,102,241,0.4)",
            fontSize: 16,
          }}
        >
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-tight truncate">{brandName}</p>
          <p className="text-slate-500 text-xs mt-0.5 truncate">
            {stats.location ? `${stats.location} · ` : ""}{scoredSegs.length}/{totalSegs} segments · {stats.totalResponses} responses
          </p>
        </div>
        {stats.brandRank > 0 && (
          <span
            className="flex-shrink-0 text-xs font-bold px-3 py-1 rounded-full"
            style={{
              background: "rgba(99,102,241,0.12)",
              border: "1px solid rgba(99,102,241,0.3)",
              color: "#818cf8",
            }}
          >
            #{stats.brandRank} of {stats.totalBrands} brands
          </span>
        )}
      </div>

      {/* ── Score ring + stats + engine bars ── */}
      <div className="flex gap-6 items-center px-6 py-5">
        <ScoreRing score={stats.appearance} />

        <div className="flex-1 min-w-0">
          {/* Stats row */}
          <div className="flex gap-5 mb-4">
            {[
              { label: "Top 3 Rate", value: `${stats.top3}%` },
              { label: "Avg Rank",   value: stats.avgRank    },
              { label: "Rating",     value: label            },
            ].map(s => (
              <div key={s.label}>
                <p className="text-white text-sm font-bold">{s.value}</p>
                <p className="text-slate-600 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Engine bars */}
          <div className="space-y-2">
            {stats.engines.map(e => (
              <div key={e.key} className="flex items-center gap-3">
                <span className="text-slate-500 text-xs w-14 flex-shrink-0">{e.label}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#1e293b" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${e.pct}%`,
                      background: `linear-gradient(90deg, ${e.color}, ${e.color}88)`,
                    }}
                  />
                </div>
                <span className="text-slate-400 text-xs font-mono w-8 text-right flex-shrink-0">{e.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

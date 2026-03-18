import { useQuery } from "@tanstack/react-query";

interface CitationSource {
  domain: string;
  appearances: number;
  inChatgpt: boolean;
  inGemini: boolean;
  inClaude: boolean;
  authorityScore: number;
  category: string;
}

interface Props {
  sessionId: number;
}

const PODIUM_COLOR = ["#f59e0b", "#94a3b8", "#cd7c2f"];
const PODIUM_BG = ["rgba(245,158,11,0.08)", "rgba(148,163,184,0.05)", "rgba(205,124,47,0.06)"];
const PODIUM_BORDER = ["rgba(245,158,11,0.22)", "rgba(148,163,184,0.12)", "rgba(205,124,47,0.15)"];

export function CitationSourcesPreview({ sessionId }: Props) {
  const { data, isLoading } = useQuery<{ authoritySources: CitationSource[] }>({
    queryKey: ["/api/multi-segment-sessions", sessionId, "citation-sources"],
    queryFn: async () => {
      const res = await fetch(`/api/multi-segment-sessions/${sessionId}/citation-sources`);
      if (!res.ok) throw new Error("Failed to load citation sources");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div style={{ padding: "32px 0", textAlign: "center" }}>
        <div style={{ display: "inline-block", width: 20, height: 20, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const sources = (data?.authoritySources ?? [])
    .slice()
    .sort((a, b) => b.appearances - a.appearances)
    .slice(0, 13);

  if (sources.length === 0) return null;

  const top3 = sources.slice(0, 3);
  const rest = sources.slice(3);
  const max = top3[0]?.appearances ?? 1;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 0 40px rgba(99,102,241,0.05)",
      }}
    >
      {/* Header */}
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
          ◆ Citation Evidence Map
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: "#f8fafc", lineHeight: 1.25, margin: 0 }}>
          Where do LLMs get their answers about this category?
        </h3>
        <p style={{ fontSize: 12, color: "#64748b", marginTop: 5, lineHeight: 1.5, marginBottom: 0 }}>
          Sources AI engines cited most when ranking brands in this space
        </p>
      </div>

      <div style={{ padding: "16px 24px 20px" }}>
        {/* Top 3 podium */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
          {top3.map((s, i) => (
            <div
              key={s.domain}
              style={{
                background: PODIUM_BG[i],
                border: `1px solid ${PODIUM_BORDER[i]}`,
                borderRadius: 14,
                padding: "12px 10px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 900, color: PODIUM_COLOR[i], lineHeight: 1 }}>#{i + 1}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0", marginTop: 5, lineHeight: 1.3, wordBreak: "break-all" }}>{s.domain}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: PODIUM_COLOR[i], marginTop: 6 }}>{s.appearances}</div>
              <div style={{ fontSize: 9, color: "#64748b", marginTop: 1 }}>citations</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 8 }}>
                {s.inChatgpt && (
                  <span style={{ fontSize: 7, fontWeight: 700, padding: "1px 4px", borderRadius: 3, background: "rgba(74,222,128,0.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}>GPT</span>
                )}
                {s.inGemini && (
                  <span style={{ fontSize: 7, fontWeight: 700, padding: "1px 4px", borderRadius: 3, background: "rgba(96,165,250,0.12)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.2)" }}>Gem</span>
                )}
                {s.inClaude && (
                  <span style={{ fontSize: 7, fontWeight: 700, padding: "1px 4px", borderRadius: 3, background: "rgba(168,85,247,0.12)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.2)" }}>Cla</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bar chart rows */}
        {rest.length > 0 && (
          <div style={{ background: "#0d1526", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
            {rest.map((s, i) => {
              const gptW = s.inChatgpt ? (s.appearances / max) * 100 * 0.6 : 0;
              const gemW = s.inGemini ? (s.appearances / max) * 100 * 0.6 : 0;
              return (
                <div
                  key={s.domain}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "9px 16px",
                    borderBottom: i < rest.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 600, color: "#334155", width: 18, textAlign: "right", flexShrink: 0 }}>{i + 4}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#e2e8f0", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.domain}
                  </span>
                  <div style={{ width: 90, height: 5, background: "rgba(255,255,255,0.04)", borderRadius: 3, overflow: "hidden", flexShrink: 0, display: "flex" }}>
                    {s.inChatgpt && (
                      <div style={{ height: "100%", width: `${gptW}%`, background: "#4ade80", borderRadius: s.inGemini ? "3px 0 0 3px" : 3 }} />
                    )}
                    {s.inGemini && (
                      <div style={{ height: "100%", width: `${gemW}%`, background: "#60a5fa", borderRadius: s.inChatgpt ? "0 3px 3px 0" : 3 }} />
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                    {s.inChatgpt && <span style={{ fontSize: 8, fontWeight: 700, color: "#4ade80" }}>G</span>}
                    {s.inGemini && <span style={{ fontSize: 8, fontWeight: 700, color: "#60a5fa" }}>M</span>}
                    {s.inClaude && <span style={{ fontSize: 8, fontWeight: 700, color: "#a855f7" }}>C</span>}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", width: 26, textAlign: "right", flexShrink: 0 }}>{s.appearances}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
          <span style={{ fontSize: 10, color: "#4ade80", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 3, background: "#4ade80", borderRadius: 2, display: "inline-block" }} />
            ChatGPT
          </span>
          <span style={{ fontSize: 10, color: "#60a5fa", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 3, background: "#60a5fa", borderRadius: 2, display: "inline-block" }} />
            Gemini
          </span>
          <span style={{ fontSize: 10, color: "#a855f7", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 3, background: "#a855f7", borderRadius: 2, display: "inline-block" }} />
            Claude
          </span>
          <span style={{ fontSize: 10, color: "#334155", marginLeft: "auto" }}>
            {data?.authoritySources?.length ?? 0} sources indexed
          </span>
        </div>
      </div>
    </div>
  );
}

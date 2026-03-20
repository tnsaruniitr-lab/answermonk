import { useQuery } from "@tanstack/react-query";
import { useState, useCallback } from "react";

interface CitationSource {
  domain: string;
  appearances: number;
  inChatgpt: boolean;
  inGemini: boolean;
  inClaude: boolean;
  authorityScore: number;
  category: string;
}

interface CitationUrl {
  url: string;
  title: string;
  citation_count: number;
  in_chatgpt: boolean;
  in_gemini: boolean;
  in_claude: boolean;
  llm_pagetype_classification: string;
}

interface Props {
  sessionId: number;
}

const PODIUM_COLOR = ["#f59e0b", "#94a3b8", "#cd7c2f"];
const PODIUM_BG = ["rgba(245,158,11,0.08)", "rgba(148,163,184,0.07)", "rgba(205,124,47,0.08)"];
const PODIUM_BORDER = ["rgba(245,158,11,0.3)", "rgba(148,163,184,0.2)", "rgba(205,124,47,0.25)"];

function EngineBadges({ gpt, gem, claude, size = "sm" }: { gpt: boolean; gem: boolean; claude: boolean; size?: "xs" | "sm" }) {
  const pad = size === "xs" ? "1px 4px" : "1px 5px";
  const fs = 7;
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {gpt && <span style={{ fontSize: fs, fontWeight: 700, padding: pad, borderRadius: 3, background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>GPT</span>}
      {gem && <span style={{ fontSize: fs, fontWeight: 700, padding: pad, borderRadius: 3, background: "rgba(59,130,246,0.12)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.3)" }}>Gem</span>}
      {claude && <span style={{ fontSize: fs, fontWeight: 700, padding: pad, borderRadius: 3, background: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.3)" }}>Cla</span>}
    </div>
  );
}

function UrlList({ urls, loading }: { urls: CitationUrl[]; loading: boolean }) {
  if (loading) {
    return (
      <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.08)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "csp-spin 0.7s linear infinite", flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: "#475569" }}>Loading URLs…</span>
      </div>
    );
  }
  if (urls.length === 0) {
    return <div style={{ padding: "10px 16px", fontSize: 11, color: "#475569" }}>No URLs found</div>;
  }
  return (
    <div>
      {urls.map((u, i) => (
        <div
          key={u.url}
          style={{
            padding: "7px 16px 7px 24px",
            borderTop: "1px solid rgba(255,255,255,0.04)",
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <a
              href={u.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 11, color: "#818cf8", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              title={u.url}
            >
              {u.title || u.url}
            </a>
            <span style={{ fontSize: 10, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", marginTop: 1 }}>
              {u.url}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <EngineBadges gpt={Boolean(u.in_chatgpt)} gem={Boolean(u.in_gemini)} claude={Boolean(u.in_claude)} size="xs" />
            <span style={{ fontSize: 10, fontWeight: 600, color: "#64748b", minWidth: 20, textAlign: "right" }}>{u.citation_count}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CitationSourcesPreview({ sessionId }: Props) {
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const [urlCache, setUrlCache] = useState<Record<string, CitationUrl[]>>({});
  const [loadingDomain, setLoadingDomain] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ authoritySources: CitationSource[] }>({
    queryKey: ["/api/multi-segment-sessions", sessionId, "citation-sources"],
    queryFn: async () => {
      const res = await fetch(`/api/multi-segment-sessions/${sessionId}/citation-sources`);
      if (!res.ok) throw new Error("Failed to load citation sources");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const toggleDomain = useCallback(async (domain: string) => {
    if (expandedDomain === domain) {
      setExpandedDomain(null);
      return;
    }
    setExpandedDomain(domain);
    if (urlCache[domain]) return;
    setLoadingDomain(domain);
    try {
      const res = await fetch(`/api/citation-urls/list?sessionId=${sessionId}&domain=${encodeURIComponent(domain)}`);
      if (res.ok) {
        const json = await res.json();
        setUrlCache(prev => ({ ...prev, [domain]: json.rows ?? [] }));
      }
    } finally {
      setLoadingDomain(null);
    }
  }, [expandedDomain, urlCache, sessionId]);

  if (isLoading) {
    return (
      <div style={{ padding: "32px 0", textAlign: "center" }}>
        <style>{`@keyframes csp-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ display: "inline-block", width: 20, height: 20, border: "2px solid rgba(255,255,255,0.08)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "csp-spin 0.8s linear infinite" }} />
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
    <div style={{ background: "#060f1e", border: "1px solid #1e3a5f", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}>
      <style>{`@keyframes csp-spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #1e3a5f" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>◆ Citation Evidence Map</div>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: "#e2e8f0", lineHeight: 1.25, margin: 0 }}>
          Where do LLMs get their answers about this category?
        </h3>
        <p style={{ fontSize: 12, color: "#475569", marginTop: 5, lineHeight: 1.5, marginBottom: 0 }}>
          Click any domain to expand its cited URLs
        </p>
      </div>

      <div style={{ padding: "16px 24px 20px" }}>

        {/* Top 3 podium cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
          {top3.map((s, i) => {
            const isExpanded = expandedDomain === s.domain;
            const isLoadingThis = loadingDomain === s.domain;
            return (
              <div key={s.domain}>
                <button
                  onClick={() => toggleDomain(s.domain)}
                  style={{
                    width: "100%",
                    position: "relative",
                    background: isExpanded
                      ? PODIUM_BG[i].replace("0.08", "0.15").replace("0.07", "0.14")
                      : PODIUM_BG[i],
                    border: `1px solid ${isExpanded ? PODIUM_COLOR[i] : PODIUM_BORDER[i]}`,
                    borderRadius: 14,
                    padding: "12px 10px 10px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{
                    position: "absolute", top: 8, right: 10,
                    fontSize: 14, color: isExpanded ? PODIUM_COLOR[i] : "rgba(255,255,255,0.2)",
                    lineHeight: 1, transition: "transform 0.15s, color 0.15s",
                    transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                  }}>›</div>

                  <div style={{ fontSize: 16, fontWeight: 900, color: PODIUM_COLOR[i], lineHeight: 1 }}>#{i + 1}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", marginTop: 5, lineHeight: 1.3, wordBreak: "break-all" }}>{s.domain}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: PODIUM_COLOR[i], marginTop: 6 }}>{s.appearances}</div>
                  <div style={{ fontSize: 9, color: "#475569", marginTop: 1 }}>citations</div>
                  <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
                    <EngineBadges gpt={s.inChatgpt} gem={s.inGemini} claude={s.inClaude} />
                  </div>
                  <div style={{
                    marginTop: 10, padding: "4px 8px", borderRadius: 6,
                    background: isExpanded ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    fontSize: 10, fontWeight: 600,
                    color: isExpanded ? "#94a3b8" : "#475569",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                  }}>
                    <span style={{ fontSize: 11 }}>{isExpanded ? "▾" : "▸"}</span>
                    {isLoadingThis ? "loading…" : isExpanded ? "hide URLs" : "show URLs"}
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Expanded URL panel for top 3 */}
        {top3.map((s) =>
          expandedDomain === s.domain ? (
            <div
              key={`urls-${s.domain}`}
              style={{
                marginBottom: 14,
                background: "#0a1628",
                border: "1px solid #1e3a5f",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "8px 16px", borderBottom: "1px solid #1e3a5f", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>{s.domain}</span>
                <span style={{ fontSize: 10, color: "#475569" }}>— all cited URLs</span>
              </div>
              <UrlList
                urls={urlCache[s.domain] ?? []}
                loading={loadingDomain === s.domain}
              />
            </div>
          ) : null
        )}

        {/* Ranks 4+ bar chart rows */}
        {rest.length > 0 && (
          <div style={{ background: "#0a1628", borderRadius: 12, overflow: "hidden", border: "1px solid #1e3a5f" }}>
            {rest.map((s, i) => {
              const gptW = s.inChatgpt ? (s.appearances / max) * 100 * 0.6 : 0;
              const gemW = s.inGemini ? (s.appearances / max) * 100 * 0.6 : 0;
              const isExpanded = expandedDomain === s.domain;
              const isLoadingThis = loadingDomain === s.domain;
              return (
                <div key={s.domain} style={{ borderBottom: i < rest.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <button
                    onClick={() => toggleDomain(s.domain)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "9px 16px",
                      background: isExpanded ? "rgba(99,102,241,0.08)" : "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.12s",
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#334155", width: 18, textAlign: "right", flexShrink: 0 }}>{i + 4}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: isExpanded ? "#e2e8f0" : "#94a3b8", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.domain}
                    </span>
                    <div style={{ width: 90, height: 5, background: "#1e3a5f", borderRadius: 3, overflow: "hidden", flexShrink: 0, display: "flex" }}>
                      {s.inChatgpt && <div style={{ height: "100%", width: `${gptW}%`, background: "#10b981", borderRadius: s.inGemini ? "3px 0 0 3px" : 3 }} />}
                      {s.inGemini && <div style={{ height: "100%", width: `${gemW}%`, background: "#3b82f6", borderRadius: s.inChatgpt ? "0 3px 3px 0" : 3 }} />}
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      <EngineBadges gpt={s.inChatgpt} gem={s.inGemini} claude={s.inClaude} size="xs" />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#475569", width: 26, textAlign: "right", flexShrink: 0 }}>{s.appearances}</span>
                    <span style={{
                      flexShrink: 0, fontSize: 10, fontWeight: 600,
                      color: isExpanded ? "#818cf8" : "#475569",
                      background: isExpanded ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${isExpanded ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.1)"}`,
                      borderRadius: 5, padding: "2px 6px", whiteSpace: "nowrap", transition: "all 0.12s",
                    }}>
                      {isLoadingThis ? "…" : isExpanded ? "hide ▴" : "URLs ▾"}
                    </span>
                  </button>
                  {isExpanded && (
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "#060f1e" }}>
                      <UrlList
                        urls={urlCache[s.domain] ?? []}
                        loading={loadingDomain === s.domain}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
          <span style={{ fontSize: 10, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 3, background: "#10b981", borderRadius: 2, display: "inline-block" }} />ChatGPT
          </span>
          <span style={{ fontSize: 10, color: "#60a5fa", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 3, background: "#3b82f6", borderRadius: 2, display: "inline-block" }} />Gemini
          </span>
          <span style={{ fontSize: 10, color: "#fbbf24", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 3, background: "#f59e0b", borderRadius: 2, display: "inline-block" }} />Claude
          </span>
          <span style={{ fontSize: 10, color: "#334155", marginLeft: "auto" }}>
            {data?.authoritySources?.length ?? 0} sources indexed
          </span>
        </div>
      </div>
    </div>
  );
}

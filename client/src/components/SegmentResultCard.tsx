import { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";

function stripPromptPrefix(text: string): string {
  return text
    .replace(/^find,?\s*list\s*and\s*rank\s*\d+\s*/i, "")
    .replace(/^(most|best|top|highest|well-reviewed)\s+/i, "")
    .replace(/^(trusted|reliable|affordable|rated|experienced|reviewed|recommended)\s+/i, "")
    .trim();
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return url; }
}

function isVertexAiUrl(url: string): boolean {
  try { return new URL(url).hostname.includes("vertexaisearch.cloud.google.com"); }
  catch { return false; }
}

interface SegmentResultCardProps {
  seg: any;
  brandName: string;
  detectedService?: string;
  selected?: boolean;
  onToggle?: () => void;
}

export function SegmentResultCard({ seg, brandName, detectedService, selected, onToggle }: SegmentResultCardProps) {
  const sr = seg.scoringResult;
  const score = sr?.score || {};
  const appearance = Math.round((score.appearance_rate ?? 0) * 100);
  const primary = Math.round((score.primary_rate ?? 0) * 100);
  const avgRank = score.avg_rank != null ? `#${score.avg_rank.toFixed(1)}` : "—";
  const enginesBreakdown = score.engine_breakdown || {};
  const rawRuns = sr?.raw_runs || [];
  const citationCount = rawRuns.reduce((s: number, r: any) => s + (r.citations?.length || 0), 0);
  const label = seg.persona || seg.serviceType || seg.customerType || seg.label || "Segment";
  const isCustomer = !!seg.customerType || seg.customerTypeEnabled === true;

  const firstPromptText = rawRuns[0]?.prompt_text || (seg.prompts?.[0]?.text ?? "");
  const promptContext = firstPromptText ? stripPromptPrefix(firstPromptText) : "";
  const totalResponses = rawRuns.length;

  const [showCitations, setShowCitations] = useState(false);

  const aggregatedCitations = useMemo(() => {
    const map = new Map<string, { url: string; title: string; domain: string; engines: Set<string> }>();
    for (const run of rawRuns) {
      const engine = run.engine || "";
      for (const cit of (run.citations || [])) {
        if (!cit.url) continue;
        if (!map.has(cit.url)) {
          map.set(cit.url, { url: cit.url, title: cit.title || "", domain: getDomain(cit.url), engines: new Set() });
        }
        if (engine) map.get(cit.url)!.engines.add(engine);
      }
    }
    return Array.from(map.values());
  }, [rawRuns]);

  const isSelectable = onToggle !== undefined;
  const isSelected = isSelectable ? (selected ?? true) : true;

  const rawCompetitors: { name: string; share: number; isBrand?: boolean }[] = (score.competitors || []).slice(0, 8);
  const brandAlreadyIn = rawCompetitors.some((c) => c.name?.toLowerCase() === brandName?.toLowerCase());
  const allRankings = [
    ...rawCompetitors,
    ...(!brandAlreadyIn && brandName ? [{ name: brandName, share: score.appearance_rate ?? 0, isBrand: true }] : []),
  ]
    .sort((a, b) => b.share - a.share)
    .slice(0, 8)
    .map((c) => ({ ...c, isBrand: c.isBrand || c.name?.toLowerCase() === brandName?.toLowerCase() }));

  const engineList = (["chatgpt", "gemini", "claude"] as const).filter((e) => enginesBreakdown[e]);
  const engMeta = {
    chatgpt: { label: "ChatGPT", color: "#22c55e" },
    gemini: { label: "Gemini", color: "#3b82f6" },
    claude: { label: "Claude", color: "#a78bfa" },
  };

  return (
    <div
      onClick={isSelectable ? onToggle : undefined}
      className="animate-in fade-in slide-in-from-bottom-4 duration-500"
      style={{
        backgroundColor: "#0d1526",
        border: `1px solid ${isSelectable ? (isSelected ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.07)") : "rgba(255,255,255,0.08)"}`,
        borderRadius: 16,
        overflow: "hidden",
        opacity: isSelectable && !isSelected ? 0.55 : 1,
        cursor: isSelectable ? "pointer" : "default",
        boxShadow: isSelected && isSelectable ? "0 0 0 1px rgba(34,197,94,0.1) inset, 0 4px 28px rgba(0,0,0,0.5)" : "0 4px 20px rgba(0,0,0,0.4)",
        transition: "opacity 0.2s, border-color 0.2s",
      }}
    >
      <div style={{
        background: "linear-gradient(100deg, #3730a3 0%, #4f46e5 45%, #6d28d9 100%)",
        padding: "14px clamp(14px, 4vw, 24px)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        borderBottom: "1px solid rgba(255,255,255,0.12)",
      }}>
        <div style={{ fontSize: 48, fontWeight: 900, color: "#ffffff", lineHeight: 1, letterSpacing: "-0.02em", flexShrink: 0, textShadow: "0 0 20px rgba(255,255,255,0.3)" }}>
          {appearance}%
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", lineHeight: 1.6, fontWeight: 500 }}>
            {isCustomer ? (
              <>
                Who shows up when{" "}
                <span style={{ display: "inline-block", background: "rgba(167,139,250,0.35)", border: "1px solid rgba(167,139,250,0.5)", color: "#f5f3ff", fontWeight: 700, borderRadius: 6, padding: "0px 7px", lineHeight: 1.7 }}>{seg.customerType}</span>
                {" "}search for{" "}
                {detectedService && <span style={{ display: "inline-block", background: "rgba(167,139,250,0.35)", border: "1px solid rgba(167,139,250,0.5)", color: "#f5f3ff", fontWeight: 700, borderRadius: 6, padding: "0px 7px", lineHeight: 1.7 }}>{detectedService}</span>}
                {seg.location ? <> in <span style={{ display: "inline-block", background: "rgba(99,102,241,0.35)", border: "1px solid rgba(99,102,241,0.5)", color: "#e0e7ff", fontWeight: 700, borderRadius: 6, padding: "0px 7px", lineHeight: 1.7 }}>{seg.location}</span></> : ""}{" "}
                — you appear in{" "}
                <span style={{ display: "inline-block", background: "rgba(255,255,255,0.22)", border: "1px solid rgba(255,255,255,0.3)", color: "#ffffff", fontWeight: 800, borderRadius: 6, padding: "0px 7px", lineHeight: 1.7 }}>{appearance}% of searches</span>
              </>
            ) : (
              <>
                Who shows up when customers search for{" "}
                <span style={{ display: "inline-block", background: "rgba(167,139,250,0.35)", border: "1px solid rgba(167,139,250,0.5)", color: "#f5f3ff", fontWeight: 700, borderRadius: 6, padding: "0px 7px", lineHeight: 1.7 }}>
                  {seg.serviceType || seg.persona || label}
                </span>
                {seg.location ? <> in <span style={{ display: "inline-block", background: "rgba(99,102,241,0.35)", border: "1px solid rgba(99,102,241,0.5)", color: "#e0e7ff", fontWeight: 700, borderRadius: 6, padding: "0px 7px", lineHeight: 1.7 }}>{seg.location}</span></> : ""}{" "}
                — you appear in{" "}
                <span style={{ display: "inline-block", background: "rgba(255,255,255,0.22)", border: "1px solid rgba(255,255,255,0.3)", color: "#ffffff", fontWeight: 800, borderRadius: 6, padding: "0px 7px", lineHeight: 1.7 }}>{appearance}% of searches</span>
              </>
            )}
          </div>
        </div>
        {isSelectable && (
          <div style={{ marginLeft: "auto", flexShrink: 0, width: 20, height: 20, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", background: isSelected ? "#22c55e" : "rgba(255,255,255,0.12)", border: isSelected ? "2px solid #22c55e" : "2px solid rgba(255,255,255,0.2)", transition: "all 0.2s" }}>
            {isSelected && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: "14px clamp(14px, 4vw, 24px)", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "inline-block", backgroundColor: isCustomer ? "rgba(139,92,246,0.15)" : "rgba(59,130,246,0.15)", color: isCustomer ? "#c4b5fd" : "#93c5fd", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6, border: isCustomer ? "1px solid rgba(139,92,246,0.25)" : "1px solid rgba(59,130,246,0.25)" }}>
            {isCustomer ? "Customer" : "Service"}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#ffffff", lineHeight: 1.25, textTransform: "capitalize" }}>{label}</div>
          {promptContext && (
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>"{promptContext}"</div>
          )}
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#64748b", textAlign: "center", flexShrink: 0, marginLeft: 8 }}>
          <div><div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>{primary}%</div><div>Top 3</div></div>
          <div><div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>{avgRank}</div><div>Avg Rank</div></div>
          <div><div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>{citationCount}</div><div>Citations</div></div>
        </div>
      </div>

      {engineList.length > 0 && (
        <div style={{ padding: "12px clamp(14px, 4vw, 24px)", display: "flex", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          {engineList.map((eng) => {
            const data = enginesBreakdown[eng];
            const pct = Math.round((data?.appearance_rate ?? 0) * 100);
            const meta = engMeta[eng];
            return (
              <div key={eng} style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  <span style={{ color: "#ffffff" }}>{meta.label}</span>
                  <span style={{ color: "#ffffff", fontWeight: 800 }}>{pct}%</span>
                </div>
                <div style={{ height: 5, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", backgroundColor: meta.color, borderRadius: 3 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {allRankings.length > 0 && (
        <div style={{ padding: "16px clamp(14px, 4vw, 24px)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
            AI Search Rankings
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {allRankings.map((c, idx) => {
              const pct = Math.round((c.share ?? 0) * 100);
              const maxPct = Math.round((allRankings[0]?.share ?? 1) * 100) || 1;
              const barWidth = Math.round((pct / maxPct) * 100);
              return (
                <div key={c.name} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  ...(c.isBrand ? { backgroundColor: "rgba(67,56,202,0.14)", padding: "8px 10px", margin: "0 -10px", borderRadius: 8, border: "1px solid rgba(67,56,202,0.3)" } : {}),
                }}>
                  <div style={{ width: 20, fontSize: 12, fontWeight: 700, color: c.isBrand ? "#a5b4fc" : "#64748b", textAlign: "right", flexShrink: 0 }}>{idx + 1}</div>
                  <div style={{ width: "clamp(80px, 38%, 148px)", fontSize: 13, fontWeight: 700, color: c.isBrand ? "#ffffff" : "#f1f5f9", flexShrink: 0, display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                    {c.isBrand && <span style={{ backgroundColor: "#4338ca", color: "white", fontSize: 9, padding: "2px 6px", borderRadius: 100, fontWeight: "bold", flexShrink: 0 }}>YOU</span>}
                  </div>
                  <div style={{ flex: 1, height: 6, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${barWidth}%`, height: "100%", background: c.isBrand ? "linear-gradient(90deg,#4338ca,#818cf8)" : "linear-gradient(90deg,#3b82f6,#6366f1)", borderRadius: 3, boxShadow: c.isBrand ? "0 0 8px rgba(67,56,202,0.4)" : "0 0 6px rgba(59,130,246,0.3)", transition: "width 0.7s ease" }} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: c.isBrand ? "#c7d2fe" : "#94a3b8", width: 36, textAlign: "right", flexShrink: 0 }}>{pct}%</div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: 11, color: "#475569", textAlign: "center" }}>
            Analysis across {totalResponses} responses · ChatGPT, Gemini, Claude
          </div>
        </div>
      )}

      {aggregatedCitations.length > 0 && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowCitations(v => !v); }}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px clamp(14px, 4vw, 24px)", background: "transparent", border: "none", cursor: "pointer" }}
          >
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "rgba(255,255,255,0.9)", letterSpacing: "0.01em" }}>
              Citations · {aggregatedCitations.length} sources
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,0.75)" }}>
              {showCitations ? "Hide" : "View all URLs referred to by LLMs"}
              <ChevronDown size={12} style={{ color: "rgba(255,255,255,0.35)", transform: showCitations ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
            </span>
          </button>
          {showCitations && (
            <div onClick={(e) => e.stopPropagation()} style={{ borderTop: "1px solid rgba(255,255,255,0.05)", maxHeight: 320, overflowY: "auto" }}>
              {aggregatedCitations.map((cit, i) => (
                <div key={cit.url} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px clamp(14px, 4vw, 24px)", borderBottom: i < aggregatedCitations.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                  <span style={{ fontSize: 9, fontFamily: "monospace", width: 20, textAlign: "right", flexShrink: 0, marginTop: 2, color: "rgba(255,255,255,0.25)" }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <a href={cit.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 500, color: "#60a5fa", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={cit.url}>
                      {isVertexAiUrl(cit.url) ? (cit.title || getDomain(cit.url)) : cit.url}
                    </a>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    {Array.from(cit.engines).map(eng => (
                      <span key={eng} style={{ fontSize: 8, padding: "2px 4px", borderRadius: 3, fontWeight: 500, background: eng === "gemini" ? "rgba(59,130,246,0.2)" : eng === "chatgpt" ? "rgba(34,197,94,0.2)" : "rgba(167,139,250,0.2)", color: eng === "gemini" ? "#93c5fd" : eng === "chatgpt" ? "#86efac" : "#c4b5fd" }}>
                        {eng === "chatgpt" ? "GPT" : eng === "gemini" ? "Gem" : "Cla"}
                      </span>
                    ))}
                    <a href={cit.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 4, color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>
                      <span style={{ fontSize: 11 }}>↗</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

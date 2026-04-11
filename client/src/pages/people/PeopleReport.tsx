import { useState, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ExternalLink, CheckCircle2, AlertCircle, XCircle, MinusCircle, ChevronDown, ChevronRight } from "lucide-react";
import { MonkWordmark } from "@/components/MonkWordmark";

const ENGINE_COLORS: Record<string, string> = {
  chatgpt: "#10a37f",
  gemini: "#4285f4",
  claude: "#d97706",
};

const ENGINE_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  claude: "Claude",
};

const ENGINE_SHORT: Record<string, string> = {
  chatgpt: "GPT",
  gemini: "Gem",
  claude: "Cla",
};

const ALL_ENGINES = ["chatgpt", "gemini", "claude"];

function getDomainType(domain: string): { label: string; color: string; bg: string } {
  if (/linkedin|twitter\.com|x\.com|instagram|facebook|tiktok|youtube/.test(domain)) return { label: "Social", color: "#0284c7", bg: "#e0f2fe" };
  if (/wikipedia/.test(domain)) return { label: "Wikipedia", color: "#b45309", bg: "#fef3c7" };
  if (/techcrunch|forbes|bloomberg|reuters|wsj\.com|ft\.com|nytimes|guardian|bbc|inc\.com|wired|entrepreneur|businessinsider|cnbc|theverge|fastcompany/.test(domain)) return { label: "Press", color: "#dc2626", bg: "#fee2e2" };
  if (/crunchbase|angellist|f6s|apollo\.io|zoominfo|clearbit|pitchbook|owler|tracxn/.test(domain)) return { label: "Directory", color: "#059669", bg: "#dcfce7" };
  if (/glassdoor|indeed|builtin|wellfound/.test(domain)) return { label: "Jobs", color: "#7c3aed", bg: "#ede9fe" };
  if (/medium|substack|dev\.to|hashnode/.test(domain)) return { label: "Content", color: "#0891b2", bg: "#cffafe" };
  if (/reddit/.test(domain)) return { label: "Forum", color: "#ea580c", bg: "#ffedd5" };
  return { label: "Web", color: "#6b7280", bg: "#f3f4f6" };
}

function IdentityBadge({ match }: { match: string }) {
  const configs: Record<string, { icon: React.ReactNode; label: string; bg: string; color: string }> = {
    confirmed: { icon: <CheckCircle2 size={13} />, label: "Confirmed you", bg: "#ecfdf5", color: "#059669" },
    partial: { icon: <AlertCircle size={13} />, label: "Partial match", bg: "#fffbeb", color: "#d97706" },
    wrong: { icon: <XCircle size={13} />, label: "Wrong person", bg: "#fef2f2", color: "#dc2626" },
    absent: { icon: <MinusCircle size={13} />, label: "Not found", bg: "#f9fafb", color: "#9ca3af" },
  };
  const cfg = configs[match] ?? configs.absent;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: cfg.bg, color: cfg.color,
      borderRadius: 100, padding: "3px 10px", fontSize: 12, fontWeight: 600,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function AppearanceTable({ perEngineAppearance }: { perEngineAppearance: Record<string, any> }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: 28,
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6", marginBottom: 16,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 20 }}>
        AI Appearance Rate — per engine
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>
        {ALL_ENGINES.map((engine, i) => {
          const stat = perEngineAppearance?.[engine] ?? { appearanceRate: 0, foundCount: 0, totalQueries: 0, avgRank: null };
          const totalRuns = stat.totalQueries ?? 0;
          const color = ENGINE_COLORS[engine];
          const isLast = i === ALL_ENGINES.length - 1;
          return (
            <div key={engine} style={{
              padding: "0 24px 0 0",
              marginRight: isLast ? 0 : 24,
              borderRight: isLast ? "none" : "1px solid #f3f4f6",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                <span style={{ fontSize: 13, fontWeight: 700, color }}>{ENGINE_LABELS[engine]}</span>
              </div>
              <div style={{ fontSize: 44, fontWeight: 900, color: stat.appearanceRate === 0 ? "#d1d5db" : "#0f0a2e", lineHeight: 1, marginBottom: 4 }}>
                {stat.appearanceRate}%
              </div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>
                {stat.foundCount} of {totalRuns} landscape runs
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: stat.avgRank != null ? "#6366f1" : "#d1d5db" }}>
                {stat.avgRank != null ? `Avg rank #${stat.avgRank}` : "—"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AIIdentityCard({ perEngineQueryResults, perEngineAppearance }: { perEngineQueryResults: any[]; perEngineAppearance: Record<string, any> }) {
  const [expandedEngines, setExpandedEngines] = useState<Set<string>>(new Set());

  const toggleExpand = (engine: string) => setExpandedEngines(prev => {
    const next = new Set(prev);
    if (next.has(engine)) next.delete(engine); else next.add(engine);
    return next;
  });

  const overallPct = ALL_ENGINES.length > 0
    ? Math.round(ALL_ENGINES.reduce((sum, e) => sum + (perEngineAppearance[e]?.appearanceRate ?? 0), 0) / ALL_ENGINES.length)
    : 0;

  const overallColor = overallPct >= 67 ? "#059669" : overallPct >= 33 ? "#d97706" : "#dc2626";

  const verdictSummary: Record<string, string> = {};
  for (const engine of ALL_ENGINES) {
    const eData = perEngineQueryResults.find((p: any) => p.engine === engine);
    // Use Track A identity match (identity proof prompt) as the verdict
    const trackAItem = eData?.trackA?.[0];
    verdictSummary[engine] = trackAItem?.identityMatch ?? "absent";
  }
  const confirmedCount = Object.values(verdictSummary).filter(v => v === "confirmed").length;
  const partialCount = Object.values(verdictSummary).filter(v => v === "partial").length;

  const summaryText = confirmedCount === 3
    ? "All three AI engines confirmed your identity"
    : confirmedCount > 0
      ? `${confirmedCount} engine${confirmedCount > 1 ? "s" : ""} confirmed your identity, ${partialCount} partial`
      : partialCount > 0
        ? `No engine fully confirmed you — ${partialCount} returned a partial match`
        : "No AI engine recognised you in direct queries";

  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: 28,
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6", marginBottom: 16,
    }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            How AI knows you
          </div>
          <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5, margin: 0, maxWidth: 520 }}>{summaryText}</p>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 24 }}>
          <div style={{ fontSize: 44, fontWeight: 900, color: overallColor, lineHeight: 1 }}>{overallPct}%</div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>avg confirmed</div>
        </div>
      </div>

      {/* Per-engine panels */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {ALL_ENGINES.map(engine => {
          const eData = perEngineQueryResults.find((p: any) => p.engine === engine);
          // Use Track A identity proof prompt data for the verdict panel
          const trackAItem = eData?.trackA?.[0];
          const identityMatch: string = trackAItem?.identityMatch ?? "absent";
          const rawQuote: string = trackAItem?.bestResponse ?? "";
          const foundCount: number = trackAItem?.foundCount ?? 0;
          const totalRounds: number = trackAItem?.totalRounds ?? 0;
          const citedUrls: string[] = trackAItem?.citedUrls ?? [];
          const engineColor = ENGINE_COLORS[engine];
          const isExpanded = expandedEngines.has(engine);
          const QUOTE_LIMIT = 220;
          const shortQuote = rawQuote.length > QUOTE_LIMIT ? rawQuote.slice(0, QUOTE_LIMIT).trimEnd() + "…" : rawQuote;
          const displayQuote = isExpanded ? rawQuote : shortQuote;
          const hasMore = rawQuote.length > QUOTE_LIMIT;

          const panelBg: Record<string, string> = {
            confirmed: "#f0fdf4",
            partial: "#fffbeb",
            wrong: "#fef2f2",
            absent: "#f9fafb",
          };
          const panelBorder: Record<string, string> = {
            confirmed: "#bbf7d0",
            partial: "#fde68a",
            wrong: "#fecaca",
            absent: "#f3f4f6",
          };

          return (
            <div key={engine} style={{
              borderRadius: 12, border: `1px solid ${panelBorder[identityMatch] ?? "#f3f4f6"}`,
              background: panelBg[identityMatch] ?? "#f9fafb",
              padding: "16px 20px",
            }}>
              {/* Engine header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: rawQuote ? 14 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: engineColor }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: engineColor }}>{ENGINE_LABELS[engine]}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {totalRounds > 0 && (
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>
                      {foundCount}/{totalRounds} queries confirmed
                    </span>
                  )}
                  <IdentityBadge match={identityMatch} />
                </div>
              </div>

              {/* Quote */}
              {rawQuote ? (
                <div>
                  <div style={{
                    fontSize: 13, color: "#374151", lineHeight: 1.65,
                    fontStyle: "italic", borderLeft: `3px solid ${engineColor}`,
                    paddingLeft: 14, margin: "0 0 8px 0",
                  }}>
                    "{displayQuote}"
                  </div>
                  {hasMore && (
                    <button
                      onClick={() => toggleExpand(engine)}
                      style={{ fontSize: 12, fontWeight: 600, color: engineColor, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
                    >
                      {isExpanded ? "Show less" : "Read full response"}
                    </button>
                  )}
                  {citedUrls.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                      {citedUrls.slice(0, 3).map((url: string, i: number) => {
                        let domain = url;
                        try { domain = new URL(url).hostname.replace(/^www\./, ""); } catch {}
                        const dt = getDomainType(domain);
                        return (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                            style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6b7280", textDecoration: "none", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: "2px 8px" }}
                          >
                            <span style={{ fontWeight: 700, color: dt.color }}>{dt.label}</span>
                            {domain}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>No response returned for this engine</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PeopleReport({ slug }: { slug: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/people/report", slug],
    queryFn: async () => {
      const res = await fetch(`/api/people/report/${slug}`);
      return res.json();
    },
  });

  if (isLoading || !data) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f7ff" }}>
        <Loader2 size={32} color="#6366f1" className="animate-spin" />
      </div>
    );
  }

  const { session, scores, reportData } = data;
  const rd = reportData ?? {};
  const perEngineAppearance = scores?.perEngineAppearance ?? rd.perEngineAppearance ?? {};

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7ff", fontFamily: "Inter, system-ui, sans-serif" }}>
      <nav style={{ padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(99,102,241,0.1)", background: "#fff" }}>
        <a href="/" style={{ textDecoration: "none" }}><MonkWordmark /></a>
        <a href="/people" style={{ fontSize: 13, color: "#6366f1", fontWeight: 600, textDecoration: "none", padding: "8px 16px", background: "#eef2ff", borderRadius: 8 }}>
          New audit
        </a>
      </nav>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 6 }}>AI Identity Report</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f0a2e", marginBottom: 4 }}>{session?.name}</h1>
          {session?.headline && <p style={{ fontSize: 15, color: "#6b7280" }}>{session.headline}</p>}
        </div>

        {/* Section 3: Name landscape */}
        {(rd.nameLandscape ?? []).length > 0 && (
          <LandscapeSection
            nameLandscape={rd.nameLandscape}
            perEngineLandscape={rd.perEngineLandscape ?? {}}
            perEngineQueryResults={rd.perEngineQueryResults}
            sessionName={session?.name}
          />
        )}

        {/* Section 4: Citation sources */}
        {(rd.sourceGraph ?? []).length > 0 && (
          <CitationSection sourceGraph={rd.sourceGraph} />
        )}

        {/* Section 5: Per-engine query results */}
        {(rd.perEngineQueryResults ?? []).length > 0 && (
          <Section title="Query results — Every engine, every prompt">
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
              Results for each engine across all prompts and rounds. Appearance rate = rounds where you were found ÷ total rounds run.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {(rd.perEngineQueryResults ?? []).map((engineData: any) => (
                <EngineQueryCard key={engineData.engine} engineData={engineData} />
              ))}
            </div>
          </Section>
        )}

        {/* Section 6: Recommendations */}
        <Section title="Recommendations">
          <Recommendations scores={scores} sourceGraph={rd.sourceGraph} nameLandscape={rd.nameLandscape} claimFacts={rd.claimFacts} sessionName={session?.name} perEngineAppearance={perEngineAppearance} />
        </Section>

        {/* Section 7: How AI knows you (collapsed) */}
        <CollapsibleSection title="How AI knows you">
          <AppearanceTable perEngineAppearance={perEngineAppearance} />
          <AIIdentityCard
            perEngineQueryResults={rd.perEngineQueryResults ?? []}
            perEngineAppearance={perEngineAppearance}
          />
          {scores?.diagnosticText && (
            <div style={{
              background: "#fff", borderRadius: 12, padding: "16px 20px",
              border: "1px solid rgba(99,102,241,0.15)", marginBottom: 16,
              borderLeft: "4px solid #6366f1",
            }}>
              <p style={{ fontSize: 14, color: "#1f2937", lineHeight: 1.6, margin: 0 }}>
                <strong>Diagnosis:</strong> {scores.diagnosticText}
              </p>
            </div>
          )}
        </CollapsibleSection>

        {/* Section 8: How AI sees you (collapsed) */}
        <CollapsibleSection title="How AI sees you right now">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {(rd.engineCards ?? []).map((card: any) => (
              <EngineCard key={card.engine} card={card} />
            ))}
          </div>
        </CollapsibleSection>

        {/* AI Profile section (collapsed) — per-engine breakdown */}
        {(rd.engineCards ?? []).length > 0 && (
          <CollapsibleSection title="AI profile — what AI says about you">
            <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5, marginBottom: 16 }}>
              How each AI engine independently defines this person — their one-sentence definition, key achievements, and professional signals.
            </p>
            <AiProfileCard engineCards={rd.engineCards ?? []} />
          </CollapsibleSection>
        )}
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f0a2e", marginBottom: 20, paddingBottom: 12, borderBottom: "1px solid #e5e7eb" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 24 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "none", border: "none", borderBottom: "1px solid #e5e7eb",
          paddingBottom: 12, marginBottom: open ? 20 : 0, cursor: "pointer", textAlign: "left",
        }}
      >
        <span style={{ fontSize: 20, fontWeight: 800, color: "#0f0a2e" }}>{title}</span>
        <span style={{ fontSize: 18, color: "#9ca3af", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
      </button>
      {open && children}
    </div>
  );
}

function EngineCard({ card }: { card: any }) {
  const [expanded, setExpanded] = useState(false);
  const color = ENGINE_COLORS[card.engine] ?? "#6366f1";
  const label = ENGINE_LABELS[card.engine] ?? card.engine;
  const firstSentence = card.description ? card.description.split(/[.!?]\s/)[0] + "." : "";
  const facts: any[] = card.statedFacts ?? [];
  const hasMore = card.description && card.description.length > 150;
  return (
    <div style={{
      background: "#fff", borderRadius: 12, padding: 18,
      border: "1px solid #f3f4f6",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{label}</span>
        <IdentityBadge match={card.identityMatch ?? "absent"} />
      </div>
      {card.description ? (
        <>
          <p style={{ fontSize: 12, color: "#1f2937", fontWeight: 600, lineHeight: 1.5, margin: 0 }}>
            {firstSentence}
          </p>
          {expanded && (
            <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
              {card.description}
            </p>
          )}
          {hasMore && (
            <button onClick={() => setExpanded(e => !e)} style={{ fontSize: 11, color: "#6366f1", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit", fontWeight: 600, textAlign: "left" }}>
              {expanded ? "Show less ↑" : "Show full response ↓"}
            </button>
          )}
        </>
      ) : (
        <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>No response from this engine</p>
      )}
      {facts.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 5 }}>Facts cited</div>
          <ul style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: 3 }}>
            {facts.slice(0, 4).map((f: any, i: number) => (
              <li key={i} style={{ fontSize: 11, color: "#4b5563", lineHeight: 1.5 }}>{f.fact ?? f}</li>
            ))}
          </ul>
        </div>
      )}
      {(card.citedUrls ?? []).length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Sources</div>
          {(card.citedUrls ?? []).slice(0, 3).map((url: string, i: number) => {
            let domain = url;
            try { domain = new URL(url).hostname.replace(/^www\./, ""); } catch {}
            const dt = getDomainType(domain);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 4px", borderRadius: 3, background: dt.bg, color: dt.color }}>{dt.label}</span>
                <a href={url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: "#4b5563", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                  {domain}
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ConsistencyBadge({ score, label }: { score: number; label: string }) {
  const cfg =
    label === "high"   ? { bg: "#ecfdf5", color: "#059669", border: "#bbf7d0" } :
    label === "medium" ? { bg: "#fffbeb", color: "#d97706", border: "#fde68a" } :
                         { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`,
      borderRadius: 100, padding: "2px 9px", fontSize: 11, fontWeight: 700,
      whiteSpace: "nowrap",
    }}>
      {score}% consistent
    </span>
  );
}

function AiProfileCard({ engineCards }: { engineCards: any[] }) {
  const ALL = ["chatgpt", "gemini", "claude"] as const;

  function getFact(facts: any[], name: string): string {
    return (facts ?? []).find((f: any) => f.fact === name)?.value ?? "";
  }
  function getList(facts: any[], name: string): string[] {
    const raw = getFact(facts, name);
    if (!raw) return [];
    return raw.split(" | ").map((s: string) => s.trim()).filter(Boolean);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
      {ALL.map((engine) => {
        const card = engineCards.find((c: any) => c.engine === engine);
        const color = ENGINE_COLORS[engine] ?? "#6366f1";
        const label = ENGINE_LABELS[engine] ?? engine;
        const facts: any[] = card?.statedFacts ?? [];

        // Prefer synthesis (intersection of all rounds); fall back to single-round statedFacts
        const syn = card?.synthesis;
        const oneLiner     = syn?.oneLiner     || getFact(facts, "one_liner");
        const achievements = syn?.keyAchievements?.length ? syn.keyAchievements : getList(facts, "key_achievements");
        const greenFlags   = syn?.greenFlags?.length      ? syn.greenFlags      : getList(facts, "green_flags");
        const redFlags     = syn?.redFlags?.length        ? syn.redFlags        : getList(facts, "red_flags");
        const hasContent   = oneLiner || achievements.length > 0 || greenFlags.length > 0 || redFlags.length > 0;

        return (
          <div key={engine} style={{
            background: "#fff", borderRadius: 12, border: "1px solid #f3f4f6",
            overflow: "hidden", display: "flex", flexDirection: "column",
          }}>
            {/* Engine header */}
            <div style={{
              padding: "12px 16px", borderBottom: "1px solid #f3f4f6",
              borderTop: `3px solid ${color}`,
              display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color }}>{label}</span>
              {card?.identityMatch && <IdentityBadge match={card.identityMatch} />}
              {syn && (
                <span style={{ marginLeft: "auto" }}>
                  <ConsistencyBadge score={syn.consistencyScore} label={syn.consistencyLabel} />
                </span>
              )}
            </div>

            {!hasContent ? (
              <div style={{ padding: 16, color: "#9ca3af", fontSize: 12 }}>
                No structured profile data extracted for this engine.
              </div>
            ) : (
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
                {/* One-liner */}
                {oneLiner && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>AI definition</div>
                    <p style={{ fontSize: 12, color: "#1f2937", lineHeight: 1.65, margin: 0, fontStyle: "italic" }}>"{oneLiner}"</p>
                    {syn?.notes && (
                      <p style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.5, margin: "6px 0 0 0", fontStyle: "normal" }}>{syn.notes}</p>
                    )}
                  </div>
                )}

                {/* Key achievements */}
                {achievements.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>Key achievements</div>
                    <ul style={{ margin: 0, padding: "0 0 0 14px", display: "flex", flexDirection: "column", gap: 5 }}>
                      {achievements.slice(0, 5).map((a: string, i: number) => (
                        <li key={i} style={{ fontSize: 11, color: "#374151", lineHeight: 1.5 }}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Green flags */}
                {greenFlags.length > 0 && (
                  <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>Green flags</div>
                    <ul style={{ margin: 0, padding: "0 0 0 14px", display: "flex", flexDirection: "column", gap: 5 }}>
                      {greenFlags.slice(0, 4).map((f: string, i: number) => (
                        <li key={i} style={{ fontSize: 11, color: "#065f46", lineHeight: 1.5 }}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Red flags */}
                {redFlags.length > 0 && (
                  <div style={{ background: "#fef2f2", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>Red flags</div>
                    <ul style={{ margin: 0, padding: "0 0 0 14px", display: "flex", flexDirection: "column", gap: 5 }}>
                      {redFlags.slice(0, 4).map((f: string, i: number) => (
                        <li key={i} style={{ fontSize: 11, color: "#7f1d1d", lineHeight: 1.5 }}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LandscapeSection({ nameLandscape, perEngineLandscape, perEngineQueryResults, sessionName }: { nameLandscape: any[]; perEngineLandscape?: Record<string, any[]>; perEngineQueryResults?: any[]; sessionName?: string }) {
  const [selectedEngine, setSelectedEngine] = useState<string>("combined");
  const [openRows, setOpenRows] = useState<Set<string>>(new Set());
  const [showSources, setShowSources] = useState(false);

  const toggleRow = (key: string) => setOpenRows(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  // Collect landscape URLs from perEngineQueryResults
  const allLandscapeUrls: { engine: string; url: string }[] = [];
  for (const engineData of (perEngineQueryResults ?? [])) {
    const landscape = engineData.trackBLandscape;
    if (landscape) {
      for (const url of (landscape.citedUrls ?? [])) {
        allLandscapeUrls.push({ engine: engineData.engine, url });
      }
    }
  }
  const urlsByEngine: Record<string, string[]> = {};
  for (const { engine, url } of allLandscapeUrls) {
    if (!urlsByEngine[engine]) urlsByEngine[engine] = [];
    if (!urlsByEngine[engine].includes(url)) urlsByEngine[engine].push(url);
  }
  const hasSourceData = allLandscapeUrls.length > 0;
  const lastName = sessionName?.split(" ").pop() ?? "people";
  // Target entry: from combined list for combined view, from that engine's list otherwise
  const targetEntry = selectedEngine === "combined"
    ? (nameLandscape.find((p: any) => p.isTarget === true) ?? null)
    : ((perEngineLandscape?.[selectedEngine] ?? []).find((p: any) => p.isTarget === true) ?? null);

  // Combined tab: merged cross-engine list sorted by appearance count.
  // Engine tabs: each engine's own independent ranked list, in that engine's order.
  const displayList: any[] = selectedEngine === "combined"
    ? nameLandscape
    : (perEngineLandscape?.[selectedEngine] ?? []);

  const engineTabs = [
    { key: "combined", label: "Combined" },
    ...ALL_ENGINES.map(e => ({ key: e, label: ENGINE_LABELS[e] ?? e })),
  ];

  return (
    <Section title={`Name landscape — Who else is "${lastName}" in AI's mind`}>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
        All people sharing your name surfaced by AI, ranked by prominence. Switch engines to see each AI's own ordering.
      </p>

      {targetEntry && (
        <div style={{ background: "#eef2ff", borderRadius: 12, padding: "16px 20px", marginBottom: 16, border: "1px solid #c7d2fe" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Your position in this name space</div>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#4f46e5", lineHeight: 1 }}>#{targetEntry.rank}</div>
              <div style={{ fontSize: 11, color: "#6366f1", marginTop: 2 }}>Overall rank</div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#4f46e5", lineHeight: 1 }}>{targetEntry.appearancePct ?? Math.round((targetEntry.engineCount / 3) * 100)}%</div>
              <div style={{ fontSize: 11, color: "#6366f1", marginTop: 2 }}>{targetEntry.engineCount}/3 engines</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", marginBottom: 6 }}>Rank per engine</div>
              <div style={{ display: "flex", gap: 8 }}>
                {ALL_ENGINES.map(eng => {
                  const rank = targetEntry.engineRanks?.[eng];
                  return (
                    <div key={eng} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: ENGINE_COLORS[eng], marginBottom: 2 }}>{ENGINE_SHORT[eng]}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: rank != null ? "#1f2937" : "#d1d5db" }}>
                        {rank != null ? `#${rank}` : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Engine tab switcher */}
      <div style={{ display: "flex", gap: 4, marginBottom: 12, background: "#f3f4f6", borderRadius: 10, padding: 4 }}>
        {engineTabs.map(tab => {
          const isActive = selectedEngine === tab.key;
          const color = tab.key !== "combined" ? (ENGINE_COLORS[tab.key] ?? "#6366f1") : "#6366f1";
          return (
            <button
              key={tab.key}
              onClick={() => { setSelectedEngine(tab.key); setOpenRows(new Set()); }}
              style={{
                flex: 1, fontSize: 12, fontWeight: isActive ? 700 : 500,
                padding: "6px 10px", borderRadius: 7, border: "none", cursor: "pointer",
                background: isActive ? "#fff" : "transparent",
                color: isActive ? color : "#6b7280",
                boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s",
                fontFamily: "inherit",
              }}
            >
              {tab.label}
              {tab.key !== "combined" && (
                <span style={{ marginLeft: 5, fontSize: 10, fontWeight: 600 }}>
                  ({(perEngineLandscape?.[tab.key] ?? []).length})
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", border: "1px solid #f3f4f6" }}>
        {displayList.length === 0 ? (
          <div style={{ padding: "24px 20px", textAlign: "center", fontSize: 13, color: "#9ca3af" }}>
            No results for this engine
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Name &amp; identity</th>
                {selectedEngine === "combined" && <th style={thStyle}>Engines</th>}
                <th style={thStyle}>{selectedEngine === "combined" ? "Appear %" : "Rank"}</th>
                {selectedEngine === "combined" && <th style={thStyle}>Avg rank</th>}
                <th style={{ ...thStyle, width: 32 }}></th>
              </tr>
            </thead>
            <tbody>
              {displayList.map((person: any, i: number) => {
                const rowKey = `${selectedEngine}-${person.name}-${i}`;
                const isOpen = openRows.has(rowKey);
                const isTarget = person.isTarget === true;
                // Combined: use cross-engine rank. Per-engine: use that engine's own rank (1–10).
                const displayRank = person.rank;
                const shortDesc = person.description
                  ? (person.description.length > 90 ? person.description.slice(0, 88) + "…" : person.description)
                  : null;
                return (
                  <Fragment key={rowKey}>
                    <tr
                      onClick={() => toggleRow(rowKey)}
                      style={{
                        borderBottom: "1px solid #f3f4f6", cursor: "pointer",
                        background: isTarget ? "#faf5ff" : "transparent",
                      }}
                    >
                      <td style={{ ...tdStyle, fontWeight: 700, color: "#9ca3af", width: 36 }}>{displayRank ?? i + 1}</td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: shortDesc ? 2 : 0 }}>
                          <span style={{ fontWeight: 600, color: "#1f2937" }}>{person.name}</span>
                          {isTarget && (
                            <span style={{ fontSize: 10, fontWeight: 800, background: "#6366f1", color: "#fff", padding: "2px 7px", borderRadius: 100, letterSpacing: "0.04em" }}>YOU</span>
                          )}
                        </div>
                        {shortDesc && (
                          <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.4, maxWidth: 340 }}>{shortDesc}</div>
                        )}
                      </td>
                      {selectedEngine === "combined" && (
                        <td style={tdStyle}>
                          <div style={{ display: "flex", gap: 4 }}>
                            {ALL_ENGINES.map(eng => {
                              const inEngine = (person.engines ?? []).includes(eng);
                              return (
                                <span key={eng} style={{
                                  fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 4,
                                  background: inEngine ? ENGINE_COLORS[eng] : "#f3f4f6",
                                  color: inEngine ? "#fff" : "#d1d5db",
                                }}>
                                  {ENGINE_SHORT[eng]}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                      )}
                      <td style={{ ...tdStyle, fontWeight: 600, color: selectedEngine === "combined" ? "#6366f1" : "#1f2937" }}>
                        {selectedEngine === "combined"
                          ? `${person.appearancePct ?? Math.round((person.engineCount / 3) * 100)}%`
                          : `#${displayRank ?? "—"}`
                        }
                      </td>
                      {selectedEngine === "combined" && (
                        <td style={{ ...tdStyle, fontWeight: 600, color: "#1f2937" }}>
                          #{Math.round(person.avgRank ?? 99)}
                        </td>
                      )}
                      <td style={{ ...tdStyle, color: "#9ca3af" }}>
                        {person.description && (
                          <ChevronDown size={14} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                        )}
                      </td>
                    </tr>
                    {isOpen && person.description && (
                      <tr style={{ background: isTarget ? "#faf5ff" : "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                        <td colSpan={selectedEngine === "combined" ? 6 : 4} style={{ padding: "10px 16px 14px 54px" }}>
                          <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.7, fontStyle: "italic", borderLeft: "2px solid #e5e7eb", paddingLeft: 10 }}>
                            {person.description}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {hasSourceData && (
        <div style={{ marginTop: 10 }}>
          <button
            onClick={() => setShowSources(s => !s)}
            style={{ fontSize: 12, fontWeight: 600, color: "#6366f1", background: "none", border: "none", cursor: "pointer", padding: "4px 0", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}
          >
            <ChevronDown size={13} style={{ transform: showSources ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
            {showSources ? "Hide" : "Show"} sources AI cited when generating this list ({allLandscapeUrls.length} URLs)
          </button>
          {showSources && (
            <div style={{ marginTop: 8, background: "#fff", borderRadius: 10, border: "1px solid #f3f4f6", overflow: "hidden" }}>
              {Object.entries(urlsByEngine).map(([engine, urls]) => (
                <div key={engine} style={{ padding: "10px 16px", borderBottom: "1px solid #f9fafb" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: ENGINE_COLORS[engine] ?? "#6b7280", marginBottom: 6 }}>
                    {ENGINE_LABELS[engine] ?? engine} — {urls.length} URL{urls.length !== 1 ? "s" : ""}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {(urls as string[]).map((url: string, j: number) => (
                      <a key={j} href={url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 11, color: "#4b5563", textDecoration: "none", display: "flex", alignItems: "flex-start", gap: 5, wordBreak: "break-all", lineHeight: 1.5 }}
                        onMouseEnter={ev => (ev.currentTarget.style.color = "#4f46e5")}
                        onMouseLeave={ev => (ev.currentTarget.style.color = "#4b5563")}
                      >
                        <ExternalLink size={10} style={{ flexShrink: 0, marginTop: 2, color: "#9ca3af" }} />
                        {url}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Section>
  );
}

// Per-engine query results components

function StatPill({ value, color, bg }: { value: string; color: string; bg: string }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 100, background: bg, color, flexShrink: 0 }}>
      {value}
    </span>
  );
}

function PromptRow({ item, sectionColor }: { item: any; sectionColor: string }) {
  const [open, setOpen] = useState(false);
  const hasContent = item.bestResponse && item.bestResponse.length > 0;
  const foundRate = item.appearanceRate ?? 0;
  const rateColor = foundRate >= 67 ? "#059669" : foundRate >= 33 ? "#d97706" : "#9ca3af";
  const rateBg = foundRate >= 67 ? "#dcfce7" : foundRate >= 33 ? "#fef9c3" : "#f3f4f6";

  return (
    <div style={{ borderBottom: "1px solid #f3f4f6", lastChild: { borderBottom: "none" } }}>
      <div
        onClick={() => hasContent && setOpen(o => !o)}
        style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, cursor: hasContent ? "pointer" : "default" }}
      >
        <ChevronRight size={12} color="#d1d5db" style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: "#4b5563", flex: 1, lineHeight: 1.4 }}>
          {item.promptText ? `"${item.promptText.slice(0, 80)}${item.promptText.length > 80 ? "…" : ""}"` : `Prompt ${item.promptIndex}`}
        </span>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
          <StatPill value={`${item.foundCount}/${item.totalRounds}`} color="#6b7280" bg="#f3f4f6" />
          <StatPill value={`${foundRate}%`} color={rateColor} bg={rateBg} />
          {item.avgRank != null && <StatPill value={`#${item.avgRank}`} color="#6366f1" bg="#eef2ff" />}
          {item.identityMatch && <IdentityBadge match={item.identityMatch} />}
        </div>
      </div>
      {open && hasContent && (
        <div style={{ padding: "0 16px 12px 38px", display: "flex", flexDirection: "column", gap: 10 }}>
          {item.promptText && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Prompt</div>
              <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5, margin: 0, fontStyle: "italic", background: "#f9fafb", borderRadius: 6, padding: "6px 10px", borderLeft: `2px solid ${sectionColor}` }}>
                {item.promptText}
              </p>
            </div>
          )}
          <BestResponseExpand text={item.bestResponse} />
          {(item.statedFacts ?? []).length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Facts cited</div>
              <ul style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: 2 }}>
                {(item.statedFacts ?? []).slice(0, 5).map((f: any, i: number) => (
                  <li key={i} style={{ fontSize: 11, color: "#4b5563", lineHeight: 1.5 }}>{f.fact ?? f}</li>
                ))}
              </ul>
            </div>
          )}
          {(item.citedUrls ?? []).length > 0 && <UrlList urls={item.citedUrls} />}
        </div>
      )}
    </div>
  );
}

function BestResponseExpand({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  const short = text.slice(0, 500);
  const hasMore = text.length > 500;
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Best response</div>
      <p style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.6, margin: 0, background: "#f9fafb", borderRadius: 6, padding: "8px 10px", whiteSpace: "pre-wrap" }}>
        {expanded ? text : short}
      </p>
      {hasMore && (
        <button onClick={() => setExpanded(e => !e)} style={{ marginTop: 4, fontSize: 11, color: "#6366f1", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit", fontWeight: 600 }}>
          {expanded ? "Show less ↑" : "Show full response ↓"}
        </button>
      )}
    </div>
  );
}

function UrlList({ urls }: { urls: string[] }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Cited URLs</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {urls.map((url: string, i: number) => {
          let domain = url;
          try { domain = new URL(url).hostname.replace(/^www\./, ""); } catch {}
          const dt = getDomainType(domain);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 4px", borderRadius: 3, background: dt.bg, color: dt.color }}>{dt.label}</span>
              <a href={url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: "#4b5563", textDecoration: "none", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                onMouseEnter={ev => (ev.currentTarget.style.color = "#4f46e5")}
                onMouseLeave={ev => (ev.currentTarget.style.color = "#4b5563")}
              >
                {domain}
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrackSection({ title, color, items, isLandscape }: { title: string; color: string; items: any[]; isLandscape?: boolean }) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  const totalFound = items.reduce((s, it) => s + (it.foundCount ?? 0), 0);
  const totalRounds = items.reduce((s, it) => s + (it.totalRounds ?? 0), 0);
  const overallRate = totalRounds > 0 ? Math.round((totalFound / totalRounds) * 100) : 0;
  const rateColor = overallRate >= 67 ? "#059669" : overallRate >= 33 ? "#d97706" : "#9ca3af";
  const rateBg = overallRate >= 67 ? "#dcfce7" : overallRate >= 33 ? "#fef9c3" : "#f3f4f6";

  return (
    <div style={{ borderBottom: "1px solid #f3f4f6" }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", background: open ? "#f9fafb" : "transparent" }}
      >
        <ChevronDown size={13} color="#9ca3af" style={{ transform: open ? "none" : "rotate(-90deg)", transition: "transform 0.15s", flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: color + "22", color, flexShrink: 0 }}>
          {title}
        </span>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>{items.length} prompt{items.length !== 1 ? "s" : ""}</span>
        <div style={{ flex: 1 }} />
        <StatPill value={`${overallRate}% found`} color={rateColor} bg={rateBg} />
      </div>
      {open && (
        <div style={{ borderTop: "1px solid #f3f4f6" }}>
          {items.map((item: any, i: number) => (
            <PromptRow key={i} item={item} sectionColor={color} />
          ))}
        </div>
      )}
    </div>
  );
}

function EngineQueryCard({ engineData }: { engineData: any }) {
  const [open, setOpen] = useState(false);
  const engine = engineData.engine;
  const color = ENGINE_COLORS[engine] ?? "#6366f1";
  const label = ENGINE_LABELS[engine] ?? engine;

  const trackA: any[] = engineData.trackA ?? [];
  const trackBLand = engineData.trackBLandscape;

  // Summary stats across Track A + Track B landscape
  const allItems = [...trackA, ...(trackBLand ? [trackBLand] : [])];
  const totalFound = allItems.reduce((s, it) => s + (it.foundCount ?? 0), 0);
  const totalRounds = allItems.reduce((s, it) => s + (it.totalRounds ?? 0), 0);
  const overallRate = totalRounds > 0 ? Math.round((totalFound / totalRounds) * 100) : 0;

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #f3f4f6", overflow: "hidden" }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", borderLeft: `4px solid ${color}` }}
      >
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
        <span style={{ fontSize: 14, fontWeight: 700, color }}>{label}</span>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>
          {trackA.length} identity proof · {trackBLand ? "1 landscape" : "no landscape"}
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: overallRate >= 50 ? "#059669" : overallRate > 0 ? "#d97706" : "#9ca3af" }}>
          {overallRate}% overall found
        </span>
        <ChevronDown size={14} color="#9ca3af" style={{ transform: open ? "none" : "rotate(-90deg)", transition: "transform 0.2s", flexShrink: 0 }} />
      </div>
      {open && (
        <div style={{ borderTop: "1px solid #f3f4f6" }}>
          <TrackSection title="Track A — Identity Proof" color="#6366f1" items={trackA} />
          {trackBLand && (
            <TrackSection title="Track B — Name Landscape" color="#7c3aed" items={[{
              ...trackBLand,
              promptIndex: 1,
              identityMatch: null,
              statedFacts: [],
            }]} />
          )}
        </div>
      )}
    </div>
  );
}

const CATEGORY_ORDER = ["Wikipedia", "Press", "Directory", "Content", "Social", "Jobs", "Forum", "Web"];

const CATEGORY_META: Record<string, { color: string; bg: string; border: string; description: string }> = {
  Wikipedia:  { color: "#b45309", bg: "#fef3c7", border: "#fde68a", description: "Highest-authority source — AI engines cite Wikipedia for factual identity claims" },
  Press:      { color: "#dc2626", bg: "#fee2e2", border: "#fecaca", description: "Editorial coverage — strong trust signal for personal identity" },
  Directory:  { color: "#059669", bg: "#dcfce7", border: "#bbf7d0", description: "Structured professional data — Crunchbase, AngelList, Pitchbook" },
  Content:    { color: "#0891b2", bg: "#cffafe", border: "#a5f3fc", description: "Published content — Medium, Substack, podcasts, blogs" },
  Social:     { color: "#0284c7", bg: "#e0f2fe", border: "#bae6fd", description: "Social profiles — LinkedIn, Twitter/X, Instagram" },
  Jobs:       { color: "#7c3aed", bg: "#ede9fe", border: "#ddd6fe", description: "Jobs and hiring platforms — Glassdoor, Indeed, Wellfound" },
  Forum:      { color: "#ea580c", bg: "#ffedd5", border: "#fed7aa", description: "Community discussions — Reddit and similar forums" },
  Web:        { color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb", description: "General web sources" },
};

function CitationDomainRow({ src }: { src: any }) {
  const [open, setOpen] = useState(false);
  const urls: string[] = src.urls ?? [];
  const hasUrls = urls.length > 0;

  return (
    <div style={{ borderBottom: "1px solid #f3f4f6" }}>
      <div
        onClick={() => hasUrls && setOpen(o => !o)}
        style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, cursor: hasUrls ? "pointer" : "default" }}
      >
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
          <a
            href={`https://${src.domain}`} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ fontSize: 13, fontWeight: 600, color: "#4f46e5", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}
          >
            {src.domain} <ExternalLink size={11} />
          </a>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>
            {src.citationCount} citation{src.citationCount !== 1 ? "s" : ""}
            {urls.length > 0 ? ` · ${urls.length} URL${urls.length !== 1 ? "s" : ""}` : ""}
          </span>
        </div>
        {hasUrls && (
          <ChevronDown size={13} color="#9ca3af" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }} />
        )}
      </div>

      {open && hasUrls && (
        <div style={{ padding: "0 16px 12px 32px", display: "flex", flexDirection: "column", gap: 5 }}>
          {urls.map((url, i) => {
            let path = url;
            try { const u = new URL(url); path = u.pathname + (u.search || ""); if (path === "/") path = url; } catch {}
            return (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, color: "#4b5563", textDecoration: "none", display: "flex", alignItems: "flex-start", gap: 6, lineHeight: 1.5 }}
                onMouseEnter={e => (e.currentTarget.style.color = "#4f46e5")}
                onMouseLeave={e => (e.currentTarget.style.color = "#4b5563")}
              >
                <ExternalLink size={10} style={{ flexShrink: 0, marginTop: 3, color: "#9ca3af" }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{path}</span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CitationSection({ sourceGraph }: { sourceGraph: any[] }) {
  // Group domains by category
  const grouped: Record<string, any[]> = {};
  for (const src of sourceGraph) {
    const cat = getDomainType(src.domain).label;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(src);
  }

  // Sort domains within each category by citation count descending
  for (const cat of Object.keys(grouped)) {
    grouped[cat].sort((a, b) => b.citationCount - a.citationCount);
  }

  const orderedCats = CATEGORY_ORDER.filter(cat => grouped[cat]?.length > 0);
  const totalDomains = sourceGraph.length;
  const totalCitations = sourceGraph.reduce((s, src) => s + src.citationCount, 0);

  return (
    <Section title="Citation sources — Ranked by quality">
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
        {totalDomains} domain{totalDomains !== 1 ? "s" : ""} · {totalCitations} total citation{totalCitations !== 1 ? "s" : ""} — grouped by source type, highest quality first
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {orderedCats.map(cat => {
          const meta = CATEGORY_META[cat] ?? CATEGORY_META.Web;
          const domains = grouped[cat];
          const catCitations = domains.reduce((s: number, d: any) => s + d.citationCount, 0);
          const catUrls = domains.reduce((s: number, d: any) => s + (d.urls?.length ?? 0), 0);
          return (
            <div key={cat} style={{ borderRadius: 12, border: `1px solid ${meta.border}`, overflow: "hidden" }}>
              {/* Category header */}
              <div style={{ background: meta.bg, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: meta.color }}>{cat}</span>
                <span style={{ fontSize: 12, color: meta.color, opacity: 0.8 }}>
                  {domains.length} source{domains.length !== 1 ? "s" : ""} · {catCitations} citation{catCitations !== 1 ? "s" : ""}
                  {catUrls > 0 ? ` · ${catUrls} URL${catUrls !== 1 ? "s" : ""}` : ""}
                </span>
                <span style={{ fontSize: 11, color: meta.color, opacity: 0.6, flex: 1, textAlign: "right", fontStyle: "italic" }}>
                  {meta.description}
                </span>
              </div>
              {/* Domain rows */}
              <div style={{ background: "#fff" }}>
                {domains.map((src: any, i: number) => (
                  <CitationDomainRow key={i} src={src} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function Recommendations({ scores, sourceGraph, nameLandscape, claimFacts, sessionName, perEngineAppearance }: any) {
  const recs: { priority: number; title: string; text: string; urgent?: boolean }[] = [];

  const domains: string[] = (sourceGraph ?? []).map((s: any) => s.domain as string);
  const proofScore: number = scores?.proofScore ?? 0;
  const myEntry = (nameLandscape ?? []).find((p: any) => p.isTarget === true) ?? null;
  const nameCount: number = (nameLandscape ?? []).length;

  // Per-engine appearance data for recommendations
  const appearanceEntries = Object.entries(perEngineAppearance ?? {}) as [string, any][];
  const avgAppearanceRate = appearanceEntries.length > 0
    ? Math.round(appearanceEntries.reduce((s, [, v]) => s + v.appearanceRate, 0) / appearanceEntries.length)
    : 0;
  const zeroEngines = appearanceEntries.filter(([, v]) => v.appearanceRate === 0).map(([k]) => ENGINE_LABELS[k] ?? k);

  const hasWikipedia = domains.some(d => /wikipedia/.test(d));
  const hasPress = domains.some(d => /techcrunch|forbes|bloomberg|reuters|wsj\.com|ft\.com|nytimes|guardian|bbc|inc\.com|wired|entrepreneur|businessinsider|cnbc/.test(d));
  const hasDirectory = domains.some(d => /crunchbase|angellist|f6s|pitchbook|tracxn/.test(d));
  const onlySocial = domains.length > 0 && domains.every(d => /linkedin|twitter|instagram|facebook/.test(d));

  if (zeroEngines.length > 0) {
    recs.push({ priority: 1, urgent: true, title: `${zeroEngines.join(", ")} never surfaced you`, text: `${zeroEngines.join(" and ")} returned zero matches across all recognition queries. These engines need specific content anchors — press mentions, Wikipedia, and directory profiles that explicitly name you.` });
  }

  if (!myEntry && nameCount > 0) {
    recs.push({ priority: 1, urgent: true, title: "You are invisible in the name landscape", text: `AI surfaced ${nameCount} other people named "${sessionName}" but did not include you. You need uniquely attributed content that only references your specific role, company, and context — not just your name alone.` });
  } else if (myEntry && myEntry.rank > 3 && nameCount > 3) {
    recs.push({ priority: 1, urgent: true, title: `Name disambiguation challenge — you're #${myEntry.rank} of ${nameCount}`, text: `${nameCount - 1} other people share your name in AI's knowledge base. To rise in rank, create content that links your name with unique identifiers: your company, role, city, and specific achievements that others named "${sessionName}" don't share.` });
  }

  if (!hasWikipedia) {
    recs.push({ priority: 2, urgent: avgAppearanceRate < 40, title: "No Wikipedia article detected", text: "Wikipedia is the #1 cited source for personal identity across all three AI engines. A stub article (50–100 words) linking your name to your company, role, and one notable fact is often enough to become the default identity anchor." });
  }

  if (!hasPress) {
    recs.push({ priority: 3, title: "No press coverage in your source graph", text: "AI engines heavily weight authoritative publications like TechCrunch, Forbes, and Bloomberg when resolving personal identity. One feature article, quoted comment, or named mention in an indexed outlet creates a citable, high-authority anchor for your name." });
  }

  if (onlySocial) {
    recs.push({ priority: 4, urgent: true, title: "Source graph is 100% social media — highly fragile", text: "AI citing only LinkedIn or social profiles for your identity means one platform change could erase your presence. Podcast transcripts, speaker bio pages, Crunchbase profiles, and company blog posts each add a distinct, independent citation point." });
  }

  if (!hasDirectory) {
    recs.push({ priority: 5, title: "No professional directory presence detected", text: "Crunchbase, AngelList, F6S, and Tracxn are heavily indexed by AI engines for professional identity. A complete profile (name, title, company, bio, photo) on 2–3 of these directories creates a persistent, structured identity anchor." });
  }

  const confirmedFacts = (claimFacts ?? []).filter((f: any) => f.count >= 2);
  if (confirmedFacts.length > 0 && proofScore < 60) {
    recs.push({ priority: 6, title: "AI is citing you but with low confidence", text: `AI mentions facts about you (e.g. "${confirmedFacts[0]?.fact?.slice(0, 80)}...") but your proof score is ${proofScore}/100. This means the sourcing is weak — publish a structured About page or press kit that explicitly states these facts so AI can cite them with confidence.` });
  }

  if (proofScore < 40 && (claimFacts ?? []).length === 0) {
    recs.push({ priority: 6, title: "AI cannot verify any facts about you", text: "No confirmed facts surfaced in identity queries. Publish structured content (a personal About page, Crunchbase profile, or company team page) that explicitly lists: your full name, current title, company, years of experience, and one specific achievement." });
  }

  if (recs.length === 0) {
    recs.push({ priority: 1, title: "Strong AI identity footprint", text: "You have a well-established presence across AI engines with multiple source types. Maintain it by publishing regularly under your name, refreshing your profiles quarterly, and pursuing press opportunities to keep your citation graph growing." });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {recs.sort((a, b) => a.priority - b.priority).map((rec, i) => (
        <div key={i} style={{
          background: rec.urgent ? "#fff7ed" : "#fff", borderRadius: 12, padding: "16px 20px",
          border: `1px solid ${rec.urgent ? "#fed7aa" : "#f3f4f6"}`,
          display: "flex", gap: 16, alignItems: "flex-start",
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: "50%",
            background: i === 0 ? (rec.urgent ? "#ea580c" : "#6366f1") : (rec.urgent ? "#ffedd5" : "#e0e7ff"),
            color: i === 0 ? "#fff" : (rec.urgent ? "#ea580c" : "#6366f1"),
            fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginTop: 1,
          }}>
            {i + 1}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: rec.urgent ? "#9a3412" : "#1f2937", marginBottom: 4 }}>{rec.title}</div>
            <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.6, margin: 0 }}>{rec.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase",
  letterSpacing: "0.06em", padding: "10px 16px", textAlign: "left",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 16px", fontSize: 14, verticalAlign: "top",
};

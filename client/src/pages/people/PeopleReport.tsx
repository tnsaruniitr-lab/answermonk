import { useState, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ExternalLink, CheckCircle2, AlertCircle, XCircle, MinusCircle, ChevronDown } from "lucide-react";
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

function normForMatch(s: string): string {
  return (s ?? "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/\s*[-–—].*$/, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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

function ScoreCard({ score, grade, label, description, color }: {
  score: number; grade: string; label: string; description: string; color: string;
}) {
  const gradeColors: Record<string, string> = { A: "#059669", B: "#0891b2", C: "#d97706", D: "#ea580c", F: "#dc2626" };
  const gradeColor = gradeColors[grade] ?? "#dc2626";
  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: 28,
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6",
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
        <span style={{ fontSize: 52, fontWeight: 900, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 28, fontWeight: 800, color: gradeColor, lineHeight: 1, marginBottom: 4 }}>{grade}</span>
      </div>
      <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>{description}</p>
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

        {/* Two-score dashboard */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <ScoreCard
            score={scores?.recognitionScore ?? 0}
            grade={scores?.recognitionGrade ?? "F"}
            label="AI Recognition Score"
            description="How well AI surfaces you by name alone, without context"
            color="#6366f1"
          />
          <ScoreCard
            score={scores?.proofScore ?? 0}
            grade={scores?.proofGrade ?? "F"}
            label="Identity Proof Score"
            description="How accurately and well-sourced AI describes you when it finds you"
            color="#8b5cf6"
          />
        </div>

        {scores?.diagnosticText && (
          <div style={{
            background: "#fff", borderRadius: 12, padding: "16px 20px",
            border: "1px solid rgba(99,102,241,0.15)", marginBottom: 40,
            borderLeft: "4px solid #6366f1",
          }}>
            <p style={{ fontSize: 14, color: "#1f2937", lineHeight: 1.6, margin: 0 }}>
              <strong>Diagnosis:</strong> {scores.diagnosticText}
            </p>
          </div>
        )}

        {/* Section 1: How AI sees you */}
        <Section title="How AI sees you right now">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {(rd.engineCards ?? []).map((card: any) => (
              <EngineCard key={card.engine} card={card} />
            ))}
          </div>
        </Section>

        {/* Section 2: Default recognition */}
        <Section title="Default recognition — Who is you?">
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
            What each AI engine says when asked "Who is {session?.name}?" with zero context.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {(rd.defaultRecognition ?? []).map((item: any) => (
              <DefaultCard key={item.engine} item={item} />
            ))}
          </div>
        </Section>

        {/* Section 3: Name landscape */}
        {(rd.nameLandscape ?? []).length > 0 && (
          <LandscapeSection
            nameLandscape={rd.nameLandscape}
            queryResults={rd.queryResults}
            sessionName={session?.name}
          />
        )}

        {/* Section 4: Source graph */}
        {(rd.sourceGraph ?? []).length > 0 && (
          <Section title="Source graph — Where AI gets its knowledge of you">
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
              Domains cited by AI engines when answering questions about you.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(rd.sourceGraph ?? []).map((src: any, i: number) => (
                <SourceRow key={i} src={src} max={(rd.sourceGraph[0]?.citationCount ?? 1)} />
              ))}
            </div>
          </Section>
        )}

        {/* Section 5: Query results per prompt */}
        {(rd.queryResults ?? []).length > 0 && (
          <Section title="Query results — Every prompt, every engine">
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
              Results for each prompt run across all engines. Click any row to see the response and cited URLs.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(rd.queryResults ?? []).map((qr: any) => (
                <QueryResultRow key={`${qr.track}-${qr.promptIndex}`} qr={qr} />
              ))}
            </div>
          </Section>
        )}

        {/* Section 6: Recommendations */}
        <Section title="Recommendations">
          <Recommendations scores={scores} sourceGraph={rd.sourceGraph} nameLandscape={rd.nameLandscape} claimFacts={rd.claimFacts} sessionName={session?.name} />
        </Section>
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

function DefaultCard({ item }: { item: any }) {
  const color = ENGINE_COLORS[item.engine] ?? "#6366f1";
  const label = ENGINE_LABELS[item.engine] ?? item.engine;
  return (
    <div style={{
      background: "#fff", borderRadius: 12, padding: 20,
      border: "1px solid #f3f4f6", display: "flex", gap: 16, alignItems: "flex-start",
    }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, marginTop: 5, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1f2937" }}>{label}</span>
          <IdentityBadge match={item.identityMatch ?? "absent"} />
        </div>
        <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.6, margin: 0 }}>
          {item.response ? `"${item.response.slice(0, 300)}..."` : "No response returned"}
        </p>
      </div>
    </div>
  );
}

function LandscapeSection({ nameLandscape, queryResults, sessionName }: { nameLandscape: any[]; queryResults?: any[]; sessionName?: string }) {
  const [openRows, setOpenRows] = useState<Set<number>>(new Set());
  const [showSources, setShowSources] = useState(false);

  const toggleRow = (i: number) => setOpenRows(prev => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i); else next.add(i);
    return next;
  });

  const landscapePrompts = (queryResults ?? []).filter((qr: any) => qr.track === "B" && qr.promptIndex === 2);
  const allLandscapeUrls: { engine: string; url: string }[] = [];
  for (const qr of landscapePrompts) {
    for (const e of (qr.engines ?? [])) {
      for (const url of (e.citedUrls ?? [])) {
        allLandscapeUrls.push({ engine: e.engine, url });
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

  // isTarget is flagged server-side using target_rank cross-reference — don't use name matching
  const targetEntry = nameLandscape.find((p: any) => p.isTarget === true) ?? null;

  return (
    <Section title={`Name landscape — Who else is "${lastName}" in AI's mind`}>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
        All people sharing your name that AI surfaces, ranked by prominence. More engines + lower rank number = most prominent. Click any row to see the full AI description.
      </p>

      {/* Your position callout — only shown when server has confirmed which entry is the user */}
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

      <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", border: "1px solid #f3f4f6" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              <th style={thStyle}>Rank</th>
              <th style={thStyle}>Person</th>
              <th style={thStyle}>Known for</th>
              <th style={thStyle}>Appears in</th>
              <th style={thStyle}>Rank per engine</th>
              <th style={{ ...thStyle, width: 20 }}></th>
            </tr>
          </thead>
          <tbody>
            {nameLandscape.map((person: any, i: number) => {
              const isTarget = person.isTarget === true;
              const isOpen = openRows.has(i);
              const hasMore = person.description && person.description.length > 80;
              const pct = person.appearancePct ?? Math.round(((person.engines ?? []).length / 3) * 100);
              return (
                <Fragment key={i}>
                  <tr
                    onClick={() => hasMore && toggleRow(i)}
                    style={{ background: isTarget ? "#eef2ff" : "transparent", borderTop: "1px solid #f3f4f6", cursor: hasMore ? "pointer" : "default" }}
                    onMouseEnter={ev => { if (hasMore) (ev.currentTarget as HTMLElement).style.background = isTarget ? "#e0e7ff" : "#fafafa"; }}
                    onMouseLeave={ev => { (ev.currentTarget as HTMLElement).style.background = isTarget ? "#eef2ff" : "transparent"; }}
                  >
                    <td style={{ ...tdStyle, fontWeight: 700, color: isTarget ? "#6366f1" : "#9ca3af", width: 48 }}>
                      #{person.rank ?? i + 1}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: isTarget ? "#4f46e5" : "#1f2937", maxWidth: 200 }}>
                      {person.name}
                      {isTarget && <span style={{ display: "block", fontSize: 10, fontWeight: 700, background: "#c7d2fe", color: "#4f46e5", borderRadius: 4, padding: "1px 6px", marginTop: 3, width: "fit-content" }}>YOU</span>}
                    </td>
                    <td style={{ ...tdStyle, color: "#6b7280", fontSize: 12, maxWidth: 260 }}>
                      {person.description?.slice(0, 90)}{hasMore && !isOpen ? "…" : ""}
                    </td>
                    <td style={{ ...tdStyle, fontSize: 12, whiteSpace: "nowrap" }}>
                      <span style={{ fontWeight: 700, color: isTarget ? "#4f46e5" : "#1f2937" }}>{pct}%</span>
                      <span style={{ color: "#9ca3af", fontSize: 11, marginLeft: 4 }}>({(person.engines ?? []).length}/3)</span>
                    </td>
                    <td style={{ ...tdStyle, fontSize: 12 }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {ALL_ENGINES.map(eng => {
                          const rank = person.engineRanks?.[eng];
                          return (
                            <span key={eng} style={{ fontSize: 11, padding: "1px 6px", borderRadius: 4, background: rank != null ? "#f3f4f6" : "transparent", color: rank != null ? (ENGINE_COLORS[eng] ?? "#6b7280") : "#e5e7eb", fontWeight: 600, whiteSpace: "nowrap" }}>
                              {ENGINE_SHORT[eng]}{rank != null ? ` #${rank}` : " —"}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, width: 20, textAlign: "center", color: "#d1d5db" }}>
                      {hasMore && <ChevronDown size={13} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr style={{ background: isTarget ? "#f0f4ff" : "#fafafa" }}>
                      <td colSpan={6} style={{ padding: "10px 16px 14px 64px" }}>
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
                    {urls.map((url: string, j: number) => (
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

const TRACK_LABELS: Record<string, string> = { A: "Identity Proof", B: "Recognition" };

function QueryResultRow({ qr }: { qr: any }) {
  const [open, setOpen] = useState(false);
  const [expandedEngine, setExpandedEngine] = useState<string | null>(null);
  const totalUrls = (qr.engines ?? []).reduce((s: number, e: any) => s + (e.citedUrls?.length ?? 0), 0);
  const trackColor = qr.track === "A" ? "#6366f1" : "#0891b2";

  return (
    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #f3f4f6", overflow: "hidden" }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: qr.track === "A" ? "#eef2ff" : "#e0f2fe", color: trackColor, flexShrink: 0 }}>
          Track {qr.track} · Prompt {qr.promptIndex}
        </span>
        <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>{TRACK_LABELS[qr.track] ?? ""}</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {(qr.engines ?? []).map((e: any) => (
            <span key={e.engine} style={{ fontSize: 11, padding: "1px 6px", borderRadius: 4, background: "#f3f4f6", color: ENGINE_COLORS[e.engine] ?? "#6b7280", fontWeight: 600 }}>
              {e.engine}
            </span>
          ))}
          {totalUrls > 0 && (
            <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 4 }}>{totalUrls} URL{totalUrls !== 1 ? "s" : ""}</span>
          )}
          <ChevronDown size={13} color="#9ca3af" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
        </div>
      </div>

      {open && (
        <div style={{ borderTop: "1px solid #f3f4f6" }}>
          {(qr.engines ?? []).map((e: any) => {
            const isExpanded = expandedEngine === e.engine;
            const hasMore = e.fullResponse && e.fullResponse.length > 600;
            return (
              <div key={e.engine} style={{ padding: "12px 16px", borderBottom: "1px solid #f9fafb" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: ENGINE_COLORS[e.engine] ?? "#6b7280" }}>
                    {ENGINE_LABELS[e.engine] ?? e.engine}
                  </span>
                  {e.identityMatch && (
                    <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 4, background: e.identityMatch === "confirmed" ? "#dcfce7" : e.identityMatch === "partial" ? "#fef9c3" : "#fee2e2", color: e.identityMatch === "confirmed" ? "#166534" : e.identityMatch === "partial" ? "#854d0e" : "#991b1b" }}>
                      {e.identityMatch}
                    </span>
                  )}
                  {e.targetFound === true && <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 4, background: "#dcfce7", color: "#166534" }}>found</span>}
                  {e.targetFound === false && qr.track === "B" && <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 4, background: "#fee2e2", color: "#991b1b" }}>not found</span>}
                  {e.targetRank != null && <span style={{ fontSize: 11, color: "#9ca3af" }}>rank #{e.targetRank}</span>}
                </div>

                {e.promptText && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Prompt sent</div>
                    <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5, margin: 0, fontStyle: "italic", background: "#f9fafb", borderRadius: 6, padding: "6px 10px", borderLeft: "2px solid #e5e7eb" }}>
                      {e.promptText}
                    </p>
                  </div>
                )}

                {(e.fullResponse || e.response) && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Response</div>
                    <p style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.6, margin: 0, background: "#f9fafb", borderRadius: 6, padding: "8px 10px", whiteSpace: "pre-wrap" }}>
                      {isExpanded ? e.fullResponse : e.response}
                    </p>
                    {hasMore && (
                      <button
                        onClick={() => setExpandedEngine(isExpanded ? null : e.engine)}
                        style={{ marginTop: 4, fontSize: 11, color: "#6366f1", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit", fontWeight: 600 }}
                      >
                        {isExpanded ? "Show less ↑" : "Show full response ↓"}
                      </button>
                    )}
                  </div>
                )}

                {(e.citedUrls ?? []).length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Cited URLs</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {e.citedUrls.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer"
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
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SourceRow({ src, max }: { src: any; max: number }) {
  const [open, setOpen] = useState(false);
  const pct = Math.round((src.citationCount / max) * 100);
  const urls: string[] = src.urls ?? [];
  const hasUrls = urls.length > 0;
  const domainType = getDomainType(src.domain);

  return (
    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #f3f4f6", overflow: "hidden" }}>
      <div
        onClick={() => hasUrls && setOpen(o => !o)}
        style={{
          padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
          cursor: hasUrls ? "pointer" : "default",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <a
                href={`https://${src.domain}`} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{ fontSize: 13, fontWeight: 600, color: "#4f46e5", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}
              >
                {src.domain} <ExternalLink size={11} />
              </a>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: domainType.bg, color: domainType.color, letterSpacing: "0.03em" }}>
                {domainType.label}
              </span>
              {hasUrls && (
                <ChevronDown size={13} color="#9ca3af" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
              )}
            </div>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>{src.citationCount} citation{src.citationCount !== 1 ? "s" : ""} · {urls.length} URL{urls.length !== 1 ? "s" : ""}</span>
          </div>
          <div style={{ height: 4, background: "#f3f4f6", borderRadius: 100 }}>
            <div style={{ height: "100%", background: "#6366f1", borderRadius: 100, width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {open && hasUrls && (
        <div style={{ borderTop: "1px solid #f3f4f6", padding: "8px 16px 12px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
            Cited URLs
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {urls.map((url, i) => (
              <a
                key={i}
                href={url} target="_blank" rel="noopener noreferrer"
                style={{
                  fontSize: 12, color: "#4b5563", textDecoration: "none",
                  display: "flex", alignItems: "flex-start", gap: 6,
                  wordBreak: "break-all", lineHeight: 1.5,
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "#4f46e5")}
                onMouseLeave={e => (e.currentTarget.style.color = "#4b5563")}
              >
                <ExternalLink size={11} style={{ flexShrink: 0, marginTop: 2, color: "#9ca3af" }} />
                {url}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Recommendations({ scores, sourceGraph, nameLandscape, claimFacts, sessionName }: any) {
  const recs: { priority: number; title: string; text: string; urgent?: boolean }[] = [];

  const domains: string[] = (sourceGraph ?? []).map((s: any) => s.domain as string);
  const recognitionScore: number = scores?.recognitionScore ?? 0;
  const proofScore: number = scores?.proofScore ?? 0;
  const myEntry = (nameLandscape ?? []).find((p: any) => p.isTarget === true) ?? null;
  const nameCount: number = (nameLandscape ?? []).length;

  const hasWikipedia = domains.some(d => /wikipedia/.test(d));
  const hasPress = domains.some(d => /techcrunch|forbes|bloomberg|reuters|wsj\.com|ft\.com|nytimes|guardian|bbc|inc\.com|wired|entrepreneur|businessinsider|cnbc/.test(d));
  const hasDirectory = domains.some(d => /crunchbase|angellist|f6s|pitchbook|tracxn/.test(d));
  const onlySocial = domains.length > 0 && domains.every(d => /linkedin|twitter|instagram|facebook/.test(d));

  if (!myEntry && nameCount > 0) {
    recs.push({ priority: 1, urgent: true, title: "You are invisible in the name landscape", text: `AI surfaced ${nameCount} other people named "${sessionName}" but did not include you. You need uniquely attributed content that only references your specific role, company, and context — not just your name alone.` });
  } else if (myEntry && myEntry.rank > 3 && nameCount > 3) {
    recs.push({ priority: 1, urgent: true, title: `Name disambiguation challenge — you're #${myEntry.rank} of ${nameCount}`, text: `${nameCount - 1} other people share your name in AI's knowledge base. To rise in rank, create content that links your name with unique identifiers: your company, role, city, and specific achievements that others named "${sessionName}" don't share.` });
  }

  if (!hasWikipedia) {
    recs.push({ priority: 2, urgent: !hasWikipedia && recognitionScore < 40, title: "No Wikipedia article detected", text: "Wikipedia is the #1 cited source for personal identity across all three AI engines. A stub article (50–100 words) linking your name to your company, role, and one notable fact is often enough to become the default identity anchor." });
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

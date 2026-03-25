import { useQuery } from "@tanstack/react-query";

interface CostBreakdown {
  chatgpt_usd: number;
  gemini_usd: number;
  claude_usd: number;
  extraction_usd: number;
  classification_usd: number | null;
  total_usd: number;
  engines: string[];
  chatgpt_model: string;
  search_context_size: string;
  segments_count: number;
}

interface RunRow {
  id: number;
  brandName: string;
  brandDomain: string | null;
  sessionType: string;
  promptsPerSegment: number;
  costBreakdown: CostBreakdown | null;
  createdAt: string;
}

function fmt(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return "—";
  return `$${v.toFixed(4)}`;
}

function totalColor(total: number): string {
  if (total < 0.5) return "#22c55e";
  if (total < 1.5) return "#f59e0b";
  return "#ef4444";
}

function CostPill({ total }: { total: number }) {
  const color = totalColor(total);
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 10,
      background: `${color}18`,
      border: `1px solid ${color}40`,
      color,
      fontSize: 12,
      fontFamily: "monospace",
      fontWeight: 600,
    }}>
      {fmt(total)}
    </span>
  );
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", marginTop: 4, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 2, transition: "width 0.4s" }} />
    </div>
  );
}

function SummaryStats({ rows }: { rows: RunRow[] }) {
  const withCost = rows.filter(r => r.costBreakdown && r.costBreakdown.total_usd > 0);
  if (withCost.length === 0) return null;

  const totals = withCost.map(r => r.costBreakdown!.total_usd);
  const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
  const total = totals.reduce((a, b) => a + b, 0);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisWeek = withCost
    .filter(r => new Date(r.createdAt) >= weekAgo)
    .reduce((s, r) => s + r.costBreakdown!.total_usd, 0);

  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
      {[
        { label: "TOTAL SPEND", value: fmt(total), sub: `${withCost.length} runs tracked` },
        { label: "AVG / RUN", value: fmt(avg), sub: "scoring + extraction" },
        { label: "THIS WEEK", value: fmt(thisWeek), sub: "last 7 days" },
      ].map(({ label, value, sub }) => (
        <div key={label} style={{ flex: 1, minWidth: 140, background: "#0a1628", borderRadius: 10, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ color: "#3b82f6", fontSize: 10, fontFamily: "monospace", letterSpacing: 2, marginBottom: 6 }}>{label}</div>
          <div style={{ color: "#e2e8f0", fontSize: 22, fontWeight: 700, fontFamily: "monospace" }}>{value}</div>
          <div style={{ color: "#475569", fontSize: 11, marginTop: 2, fontFamily: "system-ui" }}>{sub}</div>
        </div>
      ))}
    </div>
  );
}

export default function AdminCosts() {
  const { data: rows = [], isLoading } = useQuery<RunRow[]>({
    queryKey: ["/api/admin/run-costs"],
  });

  const withCost = rows.filter(r => r.costBreakdown && r.costBreakdown.total_usd > 0);
  const maxTotal = Math.max(...withCost.map(r => r.costBreakdown!.total_usd), 0.01);

  return (
    <div style={{ minHeight: "100vh", background: "#040912", padding: "40px 24px" }}>
      <div style={{ maxWidth: 780, margin: "0 auto" }}>

        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ color: "#3b82f6", fontSize: 11, fontFamily: "monospace", letterSpacing: 2 }}>ANSWERMONK</span>
            <span style={{ color: "#1e3a5f", fontSize: 11 }}>·</span>
            <span style={{ color: "#334155", fontSize: 11, fontFamily: "monospace", letterSpacing: 2 }}>RUN COSTS</span>
          </div>
          <h1 style={{ color: "#e2e8f0", fontSize: 22, fontWeight: 600, margin: 0, fontFamily: "system-ui" }}>
            Cost Dashboard
          </h1>
          <p style={{ color: "#475569", fontSize: 12, marginTop: 6, fontFamily: "system-ui" }}>
            Per-run cost breakdown across all analysis sessions. Costs are tracked from the next run onward — historical runs show no data.
          </p>
        </div>

        {isLoading ? (
          <div style={{ color: "#475569", fontSize: 13, fontFamily: "monospace", textAlign: "center", padding: "40px 0" }}>
            Loading...
          </div>
        ) : (
          <>
            <SummaryStats rows={rows} />

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {rows.map((row) => {
                const c = row.costBreakdown;
                const date = new Date(row.createdAt);
                const dateStr = date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });
                const timeStr = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

                return (
                  <div
                    key={row.id}
                    style={{
                      background: "#0a1628",
                      borderRadius: 10,
                      padding: "16px",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: c ? 12 : 0 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 600, fontFamily: "system-ui" }}>
                            {row.brandName}
                          </span>
                          {row.brandDomain && (
                            <span style={{ color: "#475569", fontSize: 11, fontFamily: "monospace" }}>
                              {row.brandDomain}
                            </span>
                          )}
                          <span style={{ color: "#334155", fontSize: 10, fontFamily: "monospace", letterSpacing: 1, background: "rgba(255,255,255,0.04)", padding: "1px 6px", borderRadius: 4 }}>
                            {row.sessionType}
                          </span>
                        </div>
                        <div style={{ color: "#334155", fontSize: 11, marginTop: 3, fontFamily: "monospace" }}>
                          {dateStr} · {timeStr} · session #{row.id}
                          {c && ` · ${c.segments_count} segments · ${c.engines?.join("+") ?? "—"}`}
                        </div>
                      </div>
                      <div style={{ marginLeft: 12, flexShrink: 0 }}>
                        {c ? (
                          <CostPill total={c.total_usd} />
                        ) : (
                          <span style={{ color: "#334155", fontSize: 11, fontFamily: "monospace" }}>no cost data</span>
                        )}
                      </div>
                    </div>

                    {c && (
                      <>
                        <div style={{ height: 1, background: "rgba(255,255,255,0.04)", margin: "0 0 12px 0" }} />
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12 }}>
                          {[
                            { label: "ChatGPT", value: c.chatgpt_usd, color: "#6366f1", sub: c.chatgpt_model },
                            { label: "Gemini", value: c.gemini_usd, color: "#22c55e", sub: "gemini-2.5-flash" },
                            { label: "Claude", value: c.claude_usd, color: "#f59e0b", sub: "extraction" },
                            { label: "Extraction", value: c.extraction_usd, color: "#64748b", sub: "URL parsing" },
                            { label: "Classification", value: c.classification_usd, color: "#0ea5e9", sub: "batch URL classify" },
                          ].map(({ label, value, color, sub }) => (
                            <div key={label}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                <span style={{ color: "#64748b", fontSize: 10, fontFamily: "monospace", letterSpacing: 1 }}>{label}</span>
                                <span style={{ color: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}>{fmt(value ?? 0)}</span>
                              </div>
                              <Bar pct={((value ?? 0) / maxTotal) * 100} color={color} />
                              <div style={{ color: "#334155", fontSize: 10, fontFamily: "monospace", marginTop: 2 }}>{sub}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop: 10, display: "flex", gap: 16, flexWrap: "wrap" }}>
                          <span style={{ color: "#334155", fontSize: 10, fontFamily: "monospace" }}>
                            context: <span style={{ color: "#475569" }}>{c.search_context_size ?? "medium"}</span>
                          </span>
                          <span style={{ color: "#334155", fontSize: 10, fontFamily: "monospace" }}>
                            model: <span style={{ color: "#475569" }}>{c.chatgpt_model}</span>
                          </span>
                          <span style={{ color: "#334155", fontSize: 10, fontFamily: "monospace" }}>
                            total: <span style={{ color: totalColor(c.total_usd), fontWeight: 600 }}>{fmt(c.total_usd)}</span>
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

              {rows.length === 0 && (
                <div style={{ color: "#334155", fontSize: 13, fontFamily: "monospace", textAlign: "center", padding: "40px 0" }}>
                  No sessions found.
                </div>
              )}
            </div>
          </>
        )}

        <div style={{ marginTop: 24, textAlign: "center", display: "flex", justifyContent: "center", gap: 20 }}>
          <a href="/admin/settings" style={{ color: "#334155", fontSize: 11, fontFamily: "monospace", letterSpacing: 1 }}>← SETTINGS</a>
          <a href="/admin" style={{ color: "#334155", fontSize: 11, fontFamily: "monospace", letterSpacing: 1 }}>← ADMIN</a>
        </div>
      </div>
    </div>
  );
}

import { ChevronDown } from "lucide-react";

const TACTICS = [
  {
    rank: 1,
    title: "Optimize home healthcare service pages with health-focused keyword targeting",
    citations: 68,
    priority: "HIGHEST",
    confidence: "HIGH",
    domains: [
      { name: "www.nightingaledubai.com", count: 8 },
      { name: "health2home.ae", count: 5 },
      { name: "alphamedilab.ae", count: 4 },
    ],
  },
  {
    rank: 2,
    title: "Secure placement in lifestyle and wellness media listicles",
    citations: 32,
    priority: "VERY HIGH",
    confidence: "HIGH",
    domains: [
      { name: "graziamagazine.com", count: 6 },
      { name: "www.timeoutdubai.com", count: 3 },
      { name: "whatson.ae", count: 2 },
    ],
  },
  {
    rank: 3,
    title: "Establish authority through brand blog content on wellness and nutrition topics",
    citations: 19,
    priority: "HIGH",
    confidence: "HIGH",
    domains: [
      { name: "kcallife.com", count: 6 },
      { name: "www.letsorganic.com", count: 5 },
      { name: "gymnation.com", count: 4 },
    ],
  },
  {
    rank: 4,
    title: "Build comprehensive directory and aggregator presence across health and wellness platforms",
    citations: 8,
    priority: "HIGH",
    confidence: "MEDIUM",
    domains: [
      { name: "www.justlife.com", count: 3 },
      { name: "servicemarket.com", count: 1 },
      { name: "m.edarabia.com", count: 1 },
    ],
  },
];

const ANOMALIES = [
  { num: 1, title: "Zero cross-engine citations — complete Gemini-only dominance" },
  { num: 2, title: "Brand homepages massively outperform third-party coverage" },
];

const PRIORITY_META: Record<string, { color: string; bg: string; accent: string }> = {
  HIGHEST: { color: "#fbbf24", bg: "rgba(251,191,36,0.12)", accent: "#f59e0b" },
  "VERY HIGH": { color: "#a78bfa", bg: "rgba(167,139,250,0.12)", accent: "#7c3aed" },
  HIGH: { color: "#818cf8", bg: "rgba(129,140,248,0.12)", accent: "#4f46e5" },
  MEDIUM: { color: "#64748b", bg: "rgba(100,116,139,0.08)", accent: "#334155" },
};

export function IntelligencePanelRedesign() {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#ede9fe 0%,#ffffff 50%,#ecfdf5 100%)", padding: "24px 20px", fontFamily: "system-ui,-apple-system,sans-serif" }}>

      {/* ── Dark container wrapping the whole panel ── */}
      <div style={{
        background: "#0d1526",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 24px 60px rgba(0,0,0,0.45)",
        overflow: "hidden",
      }}>

        {/* ── Section header ── */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {/* Label pill — same style as existing uppercase labels */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🎯</div>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Ranked by Citation Evidence
            </span>
          </div>
          {/* White heading — full contrast */}
          <div style={{ fontSize: 18, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.025em", lineHeight: 1.2 }}>
            What matters in this space
          </div>
          <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 4 }}>
            12 proven tactics from top-appearing brands
          </div>
        </div>

        {/* ── Tactic cards ── */}
        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {TACTICS.map((t) => {
            const meta = PRIORITY_META[t.priority] || PRIORITY_META.HIGH;
            return (
              <div key={t.rank} style={{
                background: "#0f172a",
                border: "1px solid rgba(255,255,255,0.06)",
                borderLeft: `3px solid ${meta.accent}`,
                borderRadius: 12,
                padding: "13px 14px 11px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  {/* Rank badge */}
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: meta.bg, border: `1px solid ${meta.accent}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11.5, fontWeight: 800, color: meta.color,
                    marginTop: 1,
                  }}>
                    #{t.rank}
                  </div>
                  {/* Title + meta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", lineHeight: 1.4, marginBottom: 6 }}>
                      {t.title}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>
                        {t.citations} <span style={{ fontWeight: 400, color: "#475569" }}>citations</span>
                      </span>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: meta.color, background: meta.bg, border: `1px solid ${meta.accent}50`, borderRadius: 6, padding: "2px 7px" }}>
                        {t.priority}
                      </span>
                      <span style={{ fontSize: 10.5, color: "#475569" }}>· {t.confidence} confidence</span>
                    </div>
                  </div>
                  {/* Expand button */}
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <ChevronDown style={{ width: 13, height: 13, color: "#475569" }} />
                  </div>
                </div>
                {/* Domain pills */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10, paddingLeft: 40 }}>
                  {t.domains.map((d) => (
                    <span key={d.name} style={{ fontSize: 10.5, color: "#94a3b8", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, padding: "3px 8px" }}>
                      {d.name} <span style={{ color: "#6366f1", fontWeight: 700 }}>{d.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 16px" }} />

        {/* ── Anomaly Detection section ── */}
        <div style={{ padding: "16px 16px 6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🔬</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Anomaly Detection</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>Patterns the data didn't expect</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 16 }}>
            {ANOMALIES.map((a) => (
              <div key={a.num} style={{
                background: "#0f172a",
                border: "1px solid rgba(255,255,255,0.06)",
                borderLeft: "3px solid #6366f1",
                borderRadius: 12,
                padding: "12px 14px",
                display: "flex", alignItems: "center", gap: 12,
                boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
              }}>
                <div style={{ width: 24, height: 24, borderRadius: 7, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#818cf8", flexShrink: 0 }}>
                  {a.num}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1", flex: 1 }}>{a.title}</div>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ChevronDown style={{ width: 13, height: 13, color: "#475569" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

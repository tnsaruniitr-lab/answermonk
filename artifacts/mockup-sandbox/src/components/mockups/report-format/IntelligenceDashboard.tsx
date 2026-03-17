import { useState } from "react";

const BRANDS = [
  { name: "Pemo", chatgpt: 7, gemini: 17, total: 24, primary: "Expense Management", color: "#6366f1" },
  { name: "Alaan", chatgpt: 3, gemini: 23, total: 26, primary: "Corporate Cards", color: "#8b5cf6" },
  { name: "Getpluto", chatgpt: 4, gemini: 20, total: 24, primary: "Spend Management", color: "#a78bfa" },
  { name: "Zimyo", chatgpt: 4, gemini: 19, total: 23, primary: "HRMS / Expense", color: "#7c3aed" },
  { name: "Qashio", chatgpt: 2, gemini: 7, total: 9, primary: "Corporate Cards", color: "#4f46e5" },
  { name: "Emirates NBD", chatgpt: 3, gemini: 4, total: 7, primary: "Banking", color: "#2563eb" },
];

const TACTICS = [
  {
    id: "geo-urls", label: "Geo + Product URLs", icon: "📍",
    badges: ["Local geo signals (.ae)", "UAE/Middle East in slug", "Compound semantic structure"],
    confidence: "HIGH", color: "#ef4444", citations: 180,
  },
  {
    id: "best-listicles", label: '"Best Of" Listicles', icon: "📋",
    badges: ["Brand cited as category authority", "Competitor mentions add signal", "blog/best-[product]-[location] URL"],
    confidence: "HIGH", color: "#f97316", citations: 78,
  },
  {
    id: "regulatory", label: "Regulatory Trust (DHA)", icon: "🏛",
    badges: ["DHA registration pages", "Government E-E-A-T weight", "Cluster with service-specific pages"],
    confidence: "MEDIUM", color: "#3b82f6", citations: 34,
  },
  {
    id: "urgency", label: "24/7 Urgency Signals", icon: "⚡",
    badges: ["On-call / home-visit pages win", "24/7 in meta descriptions", "High-intent query trigger"],
    confidence: "MEDIUM", color: "#a78bfa", citations: 28,
  },
  {
    id: "community", label: "Community Validation", icon: "💬",
    badges: ["Reddit r/dubai clusters", "Expat forum recommendations", "Peer trust amplification"],
    confidence: "LOW–MED", color: "#10b981", citations: 14,
  },
];

const SOURCES = [
  { source: "dha.gov.ae", type: "Government", importance: "High", color: "#3b82f6", imp: 3 },
  { source: "moh.gov.ae", type: "Government", importance: "High", color: "#3b82f6", imp: 3 },
  { source: "practo.com", type: "Directory", importance: "Medium", color: "#6366f1", imp: 2 },
  { source: "bookimed.com", type: "Directory", importance: "Medium", color: "#6366f1", imp: 2 },
  { source: "reddit.com/r/dubai", type: "Community", importance: "Medium", color: "#f97316", imp: 2 },
  { source: "gulfnews.com", type: "News", importance: "Medium", color: "#10b981", imp: 2 },
  { source: "capterra.ae", type: "Review", importance: "Low–Med", color: "#a78bfa", imp: 1 },
  { source: "propertyfinder.ae", type: "Aggregator", importance: "Low", color: "#64748b", imp: 1 },
];

function TacticPill({ t }: { t: typeof TACTICS[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{ border: `1px solid ${open ? t.color + "50" : "#e2e8f0"}`, borderRadius: 10, overflow: "hidden", background: open ? `${t.color}05` : "white", transition: "all 0.2s", cursor: "pointer" }}
      onClick={() => setOpen(o => !o)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>{t.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#0f172a", fontSize: 13, fontWeight: 600 }}>{t.label}</div>
          <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 1 }}>{t.citations} citations</div>
        </div>
        <span style={{ background: `${t.color}15`, color: t.color, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{t.confidence}</span>
        <span style={{ color: "#cbd5e1", fontSize: 14, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", marginLeft: 4 }}>▾</span>
      </div>
      {open && (
        <div style={{ padding: "10px 14px 14px", borderTop: `1px solid ${t.color}20` }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {t.badges.map(b => (
              <span key={b} style={{ background: `${t.color}10`, border: `1px solid ${t.color}25`, color: "#475569", fontSize: 12, padding: "4px 10px", borderRadius: 20 }}>
                ✓ {b}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function IntelligenceDashboard() {
  const maxCitations = Math.max(...BRANDS.map(b => b.total));

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", fontFamily: "system-ui, sans-serif", padding: "28px 20px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1" }} />
            <span style={{ color: "#6366f1", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>CITATION INTELLIGENCE</span>
          </div>
          <h1 style={{ color: "#0f172a", fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Corporate Cards & Expense Management — UAE</h1>
          <div style={{ color: "#64748b", fontSize: 13 }}>304 domains · ChatGPT + Gemini · Analysed by Claude Sonnet 4.5</div>
        </div>

        {/* Stat cards row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 22 }}>
          {[
            { label: "Brand + Blog citations", value: "247 / ~400", sub: "62% first-party dominance", color: "#6366f1", icon: "📊" },
            { label: "Cross-engine champions", value: "7 brands", sub: "Appear in both ChatGPT + Gemini", color: "#10b981", icon: "🏆" },
            { label: "Top single page", value: "23 citations", sub: "alaan.com/blog/best-corporate-cards-uae", color: "#f97316", icon: "⭐" },
          ].map(s => (
            <div key={s.label} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ color: "#0f172a", fontSize: 20, fontWeight: 800, marginBottom: 2 }}>{s.value}</div>
              <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 6 }}>{s.sub}</div>
              <div style={{ height: 2, background: "#f1f5f9", borderRadius: 99 }}>
                <div style={{ width: "70%", height: "100%", background: s.color, borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>

          {/* Section 2: Brand comparison */}
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px", gridColumn: "1 / 2" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 3, height: 16, background: "linear-gradient(#6366f1,#8b5cf6)", borderRadius: 2 }} />
              <span style={{ color: "#0f172a", fontSize: 14, fontWeight: 700 }}>Cross-Engine Champions</span>
            </div>
            {BRANDS.map(b => (
              <div key={b.name} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <div>
                    <span style={{ color: "#0f172a", fontSize: 13, fontWeight: 600 }}>{b.name}</span>
                    <span style={{ color: "#94a3b8", fontSize: 11, marginLeft: 6 }}>{b.primary}</span>
                  </div>
                  <span style={{ color: b.color, fontSize: 13, fontWeight: 700 }}>{b.total}</span>
                </div>
                <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                  <div style={{ flex: b.chatgpt, height: 6, background: "#3b82f6", borderRadius: "4px 0 0 4px", minWidth: 2 }} title={`ChatGPT: ${b.chatgpt}`} />
                  <div style={{ flex: b.gemini, height: 6, background: b.color, borderRadius: "0 4px 4px 0", minWidth: 2 }} title={`Gemini: ${b.gemini}`} />
                  <div style={{ flex: maxCitations - b.total, height: 6, background: "#f1f5f9", borderRadius: 4, minWidth: 2 }} />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 3 }}>
                  <span style={{ color: "#94a3b8", fontSize: 10 }}>GPT: {b.chatgpt}</span>
                  <span style={{ color: "#94a3b8", fontSize: 10 }}>Gemini: {b.gemini}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Section 3: Sources table */}
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px", gridColumn: "2 / 3" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 3, height: 16, background: "linear-gradient(#10b981,#3b82f6)", borderRadius: 2 }} />
              <span style={{ color: "#0f172a", fontSize: 14, fontWeight: 700 }}>Sources Shaping AI</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ color: "#94a3b8", fontSize: 10, fontWeight: 600, letterSpacing: 0.5, padding: "0 0 8px", textAlign: "left" }}>SOURCE</th>
                  <th style={{ color: "#94a3b8", fontSize: 10, fontWeight: 600, letterSpacing: 0.5, padding: "0 0 8px", textAlign: "left" }}>TYPE</th>
                  <th style={{ color: "#94a3b8", fontSize: 10, fontWeight: 600, letterSpacing: 0.5, padding: "0 0 8px", textAlign: "center" }}>WEIGHT</th>
                </tr>
              </thead>
              <tbody>
                {SOURCES.map((s, i) => (
                  <tr key={s.source} style={{ borderTop: i > 0 ? "1px solid #f8fafc" : "none" }}>
                    <td style={{ padding: "8px 0", color: "#0f172a", fontSize: 12 }}>{s.source}</td>
                    <td style={{ padding: "8px 4px" }}>
                      <span style={{ background: `${s.color}12`, color: s.color, fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4 }}>{s.type}</span>
                    </td>
                    <td style={{ padding: "8px 0", textAlign: "center" }}>
                      {Array.from({ length: 3 }).map((_, j) => (
                        <span key={j} style={{ color: j < s.imp ? s.color : "#e2e8f0", fontSize: 12 }}>●</span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Tactic cards */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 3, height: 16, background: "linear-gradient(#f97316,#ef4444)", borderRadius: 2 }} />
            <span style={{ color: "#0f172a", fontSize: 14, fontWeight: 700 }}>What Top Brands Do Differently</span>
            <span style={{ background: "#f1f5f9", color: "#64748b", fontSize: 11, padding: "2px 8px", borderRadius: 4, marginLeft: 4 }}>Ranked by citation evidence · click to expand</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {TACTICS.map(t => <TacticPill key={t.id} t={t} />)}
          </div>
        </div>

      </div>
    </div>
  );
}

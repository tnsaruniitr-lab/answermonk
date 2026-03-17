import { useState } from "react";

const TACTICS = [
  {
    rank: 1,
    title: "Geographic + Product Compound URL Slugs",
    impact: "HIGHEST",
    impactColor: "#ef4444",
    citations: 180,
    confidence: "HIGH",
    summary: "URLs encode location (UAE/Middle East) + category + brand in a single string. AI models parse URLs as entity signals.",
    examples: [
      { url: "pemo.io/expense-management", count: 17 },
      { url: "getpluto.com/spend-management/expense-management-software", count: 20 },
      { url: "zimyo.com/middle-east/insights/expense-management-app-in-uae/", count: 19 },
    ],
    factors: ["Local geo signals (.ae + UAE/Middle East)", "Semantic URL density matches query intent", "No keyword stuffing required"],
  },
  {
    rank: 2,
    title: '"Best [Category]" Listicles Hosted on Own Domain',
    impact: "VERY HIGH",
    impactColor: "#f97316",
    citations: 78,
    confidence: "HIGH",
    summary: "Brands cite their own competitors in 'best of' content. Creates training data where the brand appears authoritative.",
    examples: [
      { url: "alaan.com/blog/best-corporate-cards-uae", count: 23 },
      { url: "zimyo.com/middle-east/insights/expense-management-app-in-uae/", count: 19 },
      { url: "qashio.com/blog/best-business-credit-card-for-new-uae-businesses", count: 7 },
    ],
    factors: ["Brand associated with category, not just product", "Competitor mentions add authority signal", "URL structure signals relevance (blog/best-[product]-[location])"],
  },
  {
    rank: 3,
    title: "Regulatory Trust Signals (DHA / Government)",
    impact: "HIGH",
    impactColor: "#3b82f6",
    citations: 34,
    confidence: "MEDIUM",
    summary: "Government and regulatory pages (DHA, UAE Ministry) act as high-authority anchor nodes in the citation graph.",
    examples: [
      { url: "dha.gov.ae/en/digital-platforms", count: 8 },
      { url: "services.dha.gov.ae/sheryan/professional-registration", count: 6 },
      { url: "moh.gov.ae", count: 5 },
    ],
    factors: ["Government domains carry highest E-E-A-T weight", "DHA registration pages validate healthcare claims", "Regulatory citations cluster with service-specific pages"],
  },
  {
    rank: 4,
    title: "24/7 Urgency + Availability Signals",
    impact: "MEDIUM",
    impactColor: "#a78bfa",
    citations: 28,
    confidence: "MEDIUM",
    summary: "Pages with explicit 24/7 availability, on-call, or emergency language score high for time-sensitive queries.",
    examples: [
      { url: "gracehousecall.ae/on-call-doctor/", count: 6 },
      { url: "firstresponsehealthcare.com/ae/dubai/teleconsultation", count: 5 },
      { url: "manzilhealth.com", count: 4 },
    ],
    factors: ["Urgency keywords trigger AI recommendations for high-intent queries", "On-call / home-visit pages outperform clinic directory pages", "24/7 availability appears in meta descriptions, not just body"],
  },
];

const SOURCES = [
  { source: "dha.gov.ae", type: "Government", importance: "High", color: "#3b82f6", appearances: 34 },
  { source: "bookimed.com", type: "Directory", importance: "Medium", color: "#6366f1", appearances: 18 },
  { source: "reddit.com/r/dubai", type: "Community", importance: "Medium", color: "#f97316", appearances: 14 },
  { source: "practo.com", type: "Directory", importance: "Medium", color: "#6366f1", appearances: 22 },
  { source: "gulfnews.com", type: "News / Media", importance: "Medium", color: "#10b981", appearances: 11 },
  { source: "capterra.ae", type: "Review Platform", importance: "Low–Medium", color: "#a78bfa", appearances: 9 },
  { source: "propertyfinder.ae", type: "Aggregator", importance: "Low", color: "#64748b", appearances: 7 },
  { source: "moh.gov.ae", type: "Government", importance: "High", color: "#3b82f6", appearances: 6 },
];

const TYPE_COLORS: Record<string, string> = {
  "Government": "#3b82f6", "Directory": "#6366f1", "Community": "#f97316",
  "News / Media": "#10b981", "Review Platform": "#a78bfa", "Aggregator": "#64748b",
};

function CollapsibleCard({ tactic }: { tactic: typeof TACTICS[0] }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", marginBottom: 10 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", background: open ? "#f8faff" : "white", border: "none", padding: "14px 18px", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
      >
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${tactic.impactColor}15`, border: `1px solid ${tactic.impactColor}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: tactic.impactColor, fontSize: 12, fontWeight: 700 }}>#{tactic.rank}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#0f172a", fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{tactic.title}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ background: `${tactic.impactColor}15`, color: tactic.impactColor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, letterSpacing: 0.5 }}>{tactic.impact}</span>
            <span style={{ color: "#94a3b8", fontSize: 12 }}>{tactic.citations} citations</span>
          </div>
        </div>
        <div style={{ color: "#cbd5e1", fontSize: 18, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</div>
      </button>

      {open && (
        <div style={{ background: "#f8faff", borderTop: "1px solid #e2e8f0", padding: "16px 18px" }}>
          <p style={{ color: "#475569", fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>{tactic.summary}</p>

          <div style={{ marginBottom: 14 }}>
            <div style={{ color: "#0f172a", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Top performing URLs</div>
            {tactic.examples.map(ex => (
              <div key={ex.url} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <code style={{ color: "#6366f1", fontSize: 11, background: "#f0f0ff", padding: "2px 8px", borderRadius: 4, flex: 1 }}>{ex.url}</code>
                <span style={{ color: "#64748b", fontSize: 11, flexShrink: 0 }}>{ex.count} cit.</span>
              </div>
            ))}
          </div>

          <div>
            <div style={{ color: "#0f172a", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Why it works</div>
            {tactic.factors.map(f => (
              <div key={f} style={{ display: "flex", gap: 8, marginBottom: 5, alignItems: "flex-start" }}>
                <span style={{ color: tactic.impactColor, fontSize: 12, flexShrink: 0, marginTop: 1 }}>✓</span>
                <span style={{ color: "#64748b", fontSize: 13 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function StructuredSections() {
  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", fontFamily: "system-ui, sans-serif", padding: "32px 24px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Report header */}
        <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)", borderRadius: 16, padding: "24px 28px", marginBottom: 24, color: "white" }}>
          <div style={{ fontSize: 11, color: "#94a3b8", letterSpacing: 1, marginBottom: 6 }}>CITATION INTELLIGENCE REPORT · CORPORATE CARDS & EXPENSE MANAGEMENT UAE</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>GEO Citation Analysis</div>
          <div style={{ display: "flex", gap: 20 }}>
            {[
              { label: "Total Citations", value: "~400" },
              { label: "Domains Analysed", value: "304" },
              { label: "Cross-engine Brands", value: "7" },
              { label: "AI Engines", value: "ChatGPT · Gemini" },
            ].map(s => (
              <div key={s.label}>
                <div style={{ color: "#e2e8f0", fontSize: 18, fontWeight: 700 }}>{s.value}</div>
                <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Key finding callout */}
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "14px 18px", marginBottom: 24, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚡</span>
          <div>
            <div style={{ color: "#92400e", fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Key Finding</div>
            <div style={{ color: "#78350f", fontSize: 13, lineHeight: 1.6 }}>
              Brand Service Pages + Blog content accounts for <strong>247 of ~400 total citations (62%)</strong>. AI models heavily favour <strong>first-party content from solution providers</strong> over third-party review/directory sites.
            </div>
          </div>
        </div>

        {/* Section 2: What top brands do differently */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 4, height: 20, background: "linear-gradient(180deg, #6366f1, #8b5cf6)", borderRadius: 2 }} />
            <h2 style={{ color: "#0f172a", fontSize: 16, fontWeight: 700, margin: 0 }}>What Top Brands Are Doing Differently</h2>
            <span style={{ background: "#f1f5f9", color: "#64748b", fontSize: 11, padding: "2px 8px", borderRadius: 4 }}>Factor Analysis · 4 tactics</span>
          </div>
          {TACTICS.map(t => <CollapsibleCard key={t.rank} tactic={t} />)}
        </div>

        {/* Section 3: Sources shaping AI recommendations */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 4, height: 20, background: "linear-gradient(180deg, #10b981, #3b82f6)", borderRadius: 2 }} />
            <h2 style={{ color: "#0f172a", fontSize: 16, fontWeight: 700, margin: 0 }}>Sources Shaping AI Recommendations</h2>
          </div>
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "10px 18px", textAlign: "left", color: "#64748b", fontSize: 11, fontWeight: 600, letterSpacing: 0.5 }}>SOURCE</th>
                  <th style={{ padding: "10px 18px", textAlign: "left", color: "#64748b", fontSize: 11, fontWeight: 600, letterSpacing: 0.5 }}>TYPE</th>
                  <th style={{ padding: "10px 18px", textAlign: "left", color: "#64748b", fontSize: 11, fontWeight: 600, letterSpacing: 0.5 }}>IMPORTANCE</th>
                  <th style={{ padding: "10px 18px", textAlign: "right", color: "#64748b", fontSize: 11, fontWeight: 600, letterSpacing: 0.5 }}>APPEARANCES</th>
                </tr>
              </thead>
              <tbody>
                {SOURCES.map((s, i) => (
                  <tr key={s.source} style={{ borderBottom: i < SOURCES.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                    <td style={{ padding: "11px 18px" }}>
                      <span style={{ color: "#0f172a", fontSize: 13, fontWeight: 500 }}>{s.source}</span>
                    </td>
                    <td style={{ padding: "11px 18px" }}>
                      <span style={{ background: `${TYPE_COLORS[s.type] ?? "#64748b"}15`, color: TYPE_COLORS[s.type] ?? "#64748b", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 5 }}>{s.type}</span>
                    </td>
                    <td style={{ padding: "11px 18px" }}>
                      <span style={{ color: s.importance === "High" ? "#16a34a" : s.importance.startsWith("Low") ? "#94a3b8" : "#b45309", fontSize: 12, fontWeight: 600 }}>
                        {s.importance === "High" ? "● " : s.importance.startsWith("Low") ? "○ " : "◐ "}{s.importance}
                      </span>
                    </td>
                    <td style={{ padding: "11px 18px", textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                        <div style={{ width: 60, height: 4, background: "#f1f5f9", borderRadius: 99 }}>
                          <div style={{ width: `${Math.min(100, (s.appearances / 34) * 100)}%`, height: "100%", background: s.color, borderRadius: 99 }} />
                        </div>
                        <span style={{ color: "#0f172a", fontSize: 13, fontWeight: 600, minWidth: 24, textAlign: "right" }}>{s.appearances}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 10, color: "#94a3b8", fontSize: 11, padding: "0 4px" }}>
            Appearance count = total citation instances across ChatGPT + Gemini scoring runs
          </div>
        </div>

      </div>
    </div>
  );
}

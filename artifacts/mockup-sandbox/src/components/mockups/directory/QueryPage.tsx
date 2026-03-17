import { ExternalLink, ChevronRight, Clock, Database, Shield, ArrowRight, Sparkles } from "lucide-react";

const BRANDS = [
  { rank: 1, name: "Vestacare", domain: "vestacare.ae", score: 83, evidence: ["DHA-licensed provider with verified facility listing on dha.gov.ae", "Appears across 15 of 18 prompts consistently"], sources: ["dha.gov.ae", "care24.ae"] },
  { rank: 2, name: "Valeo Health", domain: "valeohealth.com", score: 71, evidence: ["Strong entity consistency across HAAD and DHA sources", "Featured in 13 of 18 prompts on ChatGPT and Gemini"], sources: ["haad.ae", "abudhabi.ae"] },
  { rank: 3, name: "First Response Healthcare", domain: "firstresponse.ae", score: 64, evidence: ["Cited by Reddit threads and health aggregators in Dubai", "Prominent in Perplexity and Claude responses"], sources: ["reddit.com", "healthpoint.ae"] },
  { rank: 4, name: "Nightingale Home Healthcare", domain: "nightingale.ae", score: 51, evidence: ["Appears in Gemini responses related to specialist nursing", "Limited ChatGPT visibility due to thin entity structure"], sources: ["g2.com"] },
];

const RELATED = [
  { slug: "best-physiotherapy-dubai", title: "Best Physiotherapy in Dubai" },
  { slug: "best-home-nursing-dubai", title: "Best Home Nursing in Dubai" },
  { slug: "best-homecare-abu-dhabi", title: "Best Home Care in Abu Dhabi" },
];

const scoreColor = (s: number) => s >= 75 ? "#22c55e" : s >= 55 ? "#f59e0b" : "#ef4444";
const scoreLabel = (s: number) => s >= 75 ? "High Visibility" : s >= 55 ? "Moderate" : "Low Visibility";

export function QueryPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#070d1a", fontFamily: "Inter, system-ui, sans-serif", color: "#e2e8f0" }}>
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 28px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#3b82f6,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Sparkles size={14} color="#fff" />
        </div>
        <span style={{ fontWeight: 600, fontSize: 14, color: "#fff" }}>Nexalytics <span style={{ color: "#60a5fa", fontWeight: 300 }}>GEO</span></span>
      </nav>

      {/* Breadcrumb */}
      <div style={{ padding: "12px 28px", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151" }}>
        <a href="#" style={{ color: "#475569", textDecoration: "none" }}>Directory</a>
        <ChevronRight size={12} />
        <a href="#" style={{ color: "#475569", textDecoration: "none" }}>Dubai</a>
        <ChevronRight size={12} />
        <a href="#" style={{ color: "#475569", textDecoration: "none" }}>Home Healthcare</a>
        <ChevronRight size={12} />
        <span style={{ color: "#94a3b8" }}>Best Home Healthcare in Dubai</span>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "20px 28px 60px" }}>

        {/* Freshness badge */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, padding: "3px 10px", borderRadius: 99, background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)", fontWeight: 500 }}>
            <Clock size={10} /> Last updated: 17 March 2026
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, padding: "3px 10px", borderRadius: 99, background: "rgba(99,102,241,0.1)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.2)", fontWeight: 500 }}>
            <Database size={10} /> Data version v3 · 18 prompts
          </span>
        </div>

        {/* H1 */}
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 8, lineHeight: 1.3, color: "#f8fafc" }}>
          Best Home Healthcare in Dubai
          <span style={{ display: "block", fontSize: 15, fontWeight: 400, color: "#475569", marginTop: 4, letterSpacing: 0 }}>2026 AI Search Analysis</span>
        </h1>

        {/* Direct answer block — citation gold */}
        <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderLeft: "3px solid #6366f1", borderRadius: 10, padding: "16px 20px", marginBottom: 28, marginTop: 20 }}>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: "#cbd5e1" }}>
            <strong style={{ color: "#fff" }}>Vestacare, Valeo Health, and First Response Healthcare</strong> are the most frequently cited home healthcare providers in Dubai across ChatGPT, Claude, Gemini and Perplexity, based on Nexalytics GEO analysis of <strong style={{ color: "#a5b4fc" }}>18 prompts</strong> run in March 2026.
          </p>
        </div>

        {/* Ranked list */}
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", fontSize: 11, marginBottom: 14 }}>AI Visibility Rankings</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
          {BRANDS.map(b => (
            <div key={b.rank} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${b.rank === 1 ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                {/* Rank */}
                <div style={{ width: 32, height: 32, borderRadius: 8, background: b.rank === 1 ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, fontWeight: 700, color: b.rank === 1 ? "#4ade80" : "#475569" }}>
                  {b.rank}
                </div>
                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: "#f1f5f9", marginBottom: 2 }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: "#374151", fontFamily: "monospace" }}>{b.domain}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: scoreColor(b.score) }}>{b.score}%</div>
                      <div style={{ fontSize: 10, color: scoreColor(b.score), opacity: 0.7 }}>{scoreLabel(b.score)}</div>
                    </div>
                  </div>
                  {/* Score bar */}
                  <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99, marginBottom: 10, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${b.score}%`, background: scoreColor(b.score), borderRadius: 99, transition: "width 0.6s ease" }} />
                  </div>
                  {/* Evidence */}
                  {b.evidence.map((e, i) => (
                    <p key={i} style={{ margin: "0 0 4px", fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
                      <span style={{ color: "#334155", marginRight: 6 }}>›</span>{e}
                    </p>
                  ))}
                  {/* Sources */}
                  <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                    {b.sources.map(s => (
                      <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "rgba(255,255,255,0.04)", color: "#475569", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <ExternalLink size={9} />{s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Authority sources */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "16px 20px", marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            <Shield size={11} style={{ display: "inline", marginRight: 5 }} />Authority Sources Driving Rankings
          </h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["dha.gov.ae", "haad.ae", "care24.ae", "healthpoint.ae", "reddit.com", "abudhabi.ae"].map(s => (
              <span key={s} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 7, background: "rgba(99,102,241,0.08)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.15)" }}>{s}</span>
            ))}
          </div>
        </div>

        {/* Versioning block */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "14px 20px", marginBottom: 28, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px 24px", fontSize: 12 }}>
          {[["Analysis window", "February – March 2026"], ["Engines analysed", "ChatGPT · Claude · Gemini · Perplexity"], ["Prompts run", "18 intent-based queries"], ["Data version", "v3 · Cohort 03-2026"]].map(([k, v]) => (
            <div key={k}><span style={{ color: "#374151" }}>{k}: </span><span style={{ color: "#94a3b8", fontWeight: 500 }}>{v}</span></div>
          ))}
        </div>

        {/* Related queries */}
        <h3 style={{ fontSize: 12, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Related Queries</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
          {RELATED.map(r => (
            <a key={r.slug} href="#" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9, textDecoration: "none", color: "#94a3b8", fontSize: 13, transition: "all 0.2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(99,102,241,0.25)"; (e.currentTarget as HTMLAnchorElement).style.color = "#a5b4fc"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLAnchorElement).style.color = "#94a3b8"; }}>
              {r.title}
              <ArrowRight size={13} />
            </a>
          ))}
        </div>

        {/* Methodology */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 20, display: "flex", gap: 16, flexWrap: "wrap" }}>
          {["/methodology", "/about-the-data", "/how-rankings-work"].map(link => (
            <a key={link} href="#" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#374151", textDecoration: "none" }}>
              {link} <ExternalLink size={10} />
            </a>
          ))}
          <span style={{ fontSize: 11, color: "#1e293b", marginLeft: "auto" }}>
            &lt;script type="application/ld+json"&gt; @graph embedded ✓
          </span>
        </div>
      </div>
    </div>
  );
}

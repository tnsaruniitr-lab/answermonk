import { useState } from "react";
import { Search, Globe, MapPin, Tag, ChevronDown, ArrowRight, Clock, Sparkles, ExternalLink, BarChart2, Zap } from "lucide-react";

const QUERIES = [
  { slug: "best-home-healthcare-dubai", title: "Best Home Healthcare in Dubai", location: "Dubai", category: "Home Healthcare", topBrands: ["Vestacare", "Valeo Health", "First Response"], score: 83, engines: { chatgpt: true, gemini: true, claude: true }, updated: "Mar 17, 2026", version: "v3" },
  { slug: "best-physiotherapy-dubai", title: "Best Physiotherapy in Dubai", location: "Dubai", category: "Physiotherapy", topBrands: ["PhysioPlus", "NMC Health", "Aster Clinics"], score: 71, engines: { chatgpt: true, gemini: true, claude: false }, updated: "Mar 15, 2026", version: "v2" },
  { slug: "best-debt-collection-software-netherlands", title: "Best Debt Collection Software in Netherlands", location: "Netherlands", category: "Debt Collection", topBrands: ["CollectMax", "Lowell", "Intrum"], score: 67, engines: { chatgpt: true, gemini: false, claude: true }, updated: "Mar 14, 2026", version: "v1" },
  { slug: "best-corporate-cards-uae", title: "Best Corporate Cards in UAE", location: "UAE", category: "Corporate Finance", topBrands: ["Wio Bank", "Mashreq Neo", "Emirates NBD"], score: 58, engines: { chatgpt: true, gemini: true, claude: true }, updated: "Mar 13, 2026", version: "v1" },
  { slug: "best-hr-software-uae", title: "Best HR Software in UAE", location: "UAE", category: "HR Technology", topBrands: ["Bayzat", "Qiwa", "Darwinbox"], score: 62, engines: { chatgpt: false, gemini: true, claude: true }, updated: "Mar 12, 2026", version: "v2" },
  { slug: "best-home-nursing-dubai", title: "Best Home Nursing in Dubai", location: "Dubai", category: "Home Healthcare", topBrands: ["Nightingale", "Manzil", "Home Medics"], score: 75, engines: { chatgpt: true, gemini: true, claude: false }, updated: "Mar 11, 2026", version: "v1" },
];

const HUBS = [
  { location: "Dubai", categories: ["Home Healthcare", "Physiotherapy", "Home Nursing"], pageCount: 14, topBrand: "Vestacare" },
  { location: "UAE", categories: ["Corporate Finance", "HR Technology", "EdTech"], pageCount: 9, topBrand: "Wio Bank" },
  { location: "Netherlands", categories: ["Debt Collection", "FinTech", "Legal Tech"], pageCount: 6, topBrand: "CollectMax" },
];

const scoreColor = (s: number) => s >= 75 ? "#22c55e" : s >= 55 ? "#f59e0b" : "#ef4444";

function EngineChip({ label, active }: { label: string; active: boolean }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
      padding: "2px 7px", borderRadius: 99,
      background: active ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.04)",
      color: active ? "#a5b4fc" : "#4b5563",
      border: `1px solid ${active ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.06)"}`,
    }}>{label}</span>
  );
}

export function DirectoryListing() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("All Locations");
  const [activeTab, setActiveTab] = useState<"queries" | "hubs">("queries");

  const filtered = QUERIES.filter(q =>
    (location === "All Locations" || q.location === location) &&
    (q.title.toLowerCase().includes(search.toLowerCase()) || q.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ minHeight: "100vh", background: "#060f1e", fontFamily: "Inter, system-ui, sans-serif", color: "#fff" }}>
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "16px 32px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#3b82f6,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Sparkles size={16} color="#fff" />
        </div>
        <span style={{ fontWeight: 600, fontSize: 15, color: "#fff" }}>Nexalytics <span style={{ color: "#60a5fa", fontWeight: 300 }}>GEO</span></span>
        <span style={{ color: "rgba(255,255,255,0.2)", margin: "0 4px" }}>/</span>
        <span style={{ color: "#a5b4fc", fontWeight: 500, fontSize: 14 }}>AI Directory</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <a href="#" style={{ fontSize: 13, color: "#64748b", textDecoration: "none" }}>Methodology</a>
          <a href="#" style={{ fontSize: 13, color: "#64748b", textDecoration: "none", marginLeft: 16 }}>About the Data</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ padding: "40px 32px 28px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 99, padding: "4px 12px", fontSize: 12, color: "#a5b4fc", fontWeight: 500, marginBottom: 16 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
          127 query pages · 64 brand profiles · 12 category hubs
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, letterSpacing: "-0.02em" }}>AI Search Directory</h1>
        <p style={{ color: "#64748b", fontSize: 15, maxWidth: 600 }}>Real-time rankings of which brands AI engines cite across ChatGPT, Claude, Gemini and Perplexity — by query, location and category.</p>
      </div>

      {/* Search + filters */}
      <div style={{ padding: "0 32px 28px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 260, display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 14px" }}>
            <Search size={15} color="#475569" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search queries, brands, categories…" style={{ background: "none", border: "none", outline: "none", color: "#fff", fontSize: 14, flex: 1 }} />
          </div>
          {["All Locations", "Dubai", "UAE", "Netherlands"].map(loc => (
            <button key={loc} onClick={() => setLocation(loc)} style={{ padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer", border: "1px solid", borderColor: location === loc ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)", background: location === loc ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.03)", color: location === loc ? "#a5b4fc" : "#64748b", transition: "all 0.2s" }}>{loc}</button>
          ))}
          <button style={{ padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
            Newest first <ChevronDown size={13} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: "0 32px", maxWidth: 1200, margin: "0 auto", display: "flex", gap: 4, borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 0 }}>
        {(["queries", "hubs"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "10px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer", border: "none", background: "none", color: activeTab === tab ? "#a5b4fc" : "#475569", borderBottom: `2px solid ${activeTab === tab ? "#6366f1" : "transparent"}`, transition: "all 0.2s" }}>
            {tab === "queries" ? `Query Pages (${filtered.length})` : `Category Hubs (${HUBS.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "24px 32px 40px", maxWidth: 1200, margin: "0 auto" }}>
        {activeTab === "queries" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {filtered.map(q => (
              <div key={q.slug} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20, cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(99,102,241,0.3)"; (e.currentTarget as HTMLDivElement).style.background = "rgba(99,102,241,0.04)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)"; }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 99, background: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.2)" }}>
                        <MapPin size={9} style={{ display: "inline", marginRight: 3 }} />{q.location}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 99, background: "rgba(139,92,246,0.1)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)" }}>
                        <Tag size={9} style={{ display: "inline", marginRight: 3 }} />{q.category}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, margin: 0, color: "#f1f5f9" }}>{q.title}</h3>
                  </div>
                  <div style={{ marginLeft: 12, textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: scoreColor(q.score), lineHeight: 1 }}>{q.score}%</div>
                    <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>top brand</div>
                  </div>
                </div>

                {/* Top brands */}
                <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                  {q.topBrands.map((b, i) => (
                    <span key={b} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: i === 0 ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)", color: i === 0 ? "#4ade80" : "#94a3b8", border: `1px solid ${i === 0 ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.06)"}`, fontWeight: i === 0 ? 600 : 400 }}>
                      {i + 1}. {b}
                    </span>
                  ))}
                </div>

                {/* Engines + meta */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    <EngineChip label="ChatGPT" active={q.engines.chatgpt} />
                    <EngineChip label="Gemini" active={q.engines.gemini} />
                    <EngineChip label="Claude" active={q.engines.claude} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#374151", fontSize: 11 }}>
                    <Clock size={10} />
                    {q.updated}
                  </div>
                </div>

                {/* Link */}
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "#334155", fontFamily: "monospace" }}>/{q.slug}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#6366f1", fontWeight: 500 }}>View page <ArrowRight size={12} /></span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "hubs" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {HUBS.map(h => (
              <div key={h.location} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}><Globe size={10} style={{ display: "inline", marginRight: 4 }} />Location Hub</div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{h.location}</h3>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#6366f1" }}>{h.pageCount}</div>
                    <div style={{ fontSize: 10, color: "#475569" }}>query pages</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                  {h.categories.map(c => (
                    <span key={c} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.08)" }}>{c}</span>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: "#475569" }}>Top cited brand: <span style={{ color: "#4ade80", fontWeight: 600 }}>{h.topBrand}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "16px 32px", display: "flex", gap: 16, justifyContent: "center" }}>
        {["/methodology", "/about-the-data", "/how-rankings-work"].map(link => (
          <a key={link} href="#" style={{ fontSize: 12, color: "#374151", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
            {link} <ExternalLink size={10} />
          </a>
        ))}
      </div>
    </div>
  );
}

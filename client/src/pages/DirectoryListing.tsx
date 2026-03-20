import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ExternalLink, Filter, SortDesc, SortAsc, Search, LayoutGrid } from "lucide-react";

interface DirectoryPage {
  slug: string;
  canonicalQuery: string;
  serviceType: string;
  location: string;
  vertical: string;
  brandNames: string[];
  dataVersion: string | null;
  lastUpdated: string | null;
  firstPublished: string | null;
  evidenceScore: number;
  brandCount: number;
}

const VERTICAL_LABELS: Record<string, string> = {
  "healthcare":       "Healthcare",
  "b2b-saas":         "B2B SaaS",
  "venture-capital":  "Venture Capital",
  "marketing":        "Marketing",
  "other":            "Other",
};

// Aliases: terms a user might type that map to a vertical key
const VERTICAL_ALIASES: { pattern: string; vertical: string }[] = [
  { pattern: "vc",         vertical: "venture-capital" },
  { pattern: "venture",    vertical: "venture-capital" },
  { pattern: "invest",     vertical: "venture-capital" },
  { pattern: "funding",    vertical: "venture-capital" },
  { pattern: "startup",    vertical: "venture-capital" },
  { pattern: "b2b",        vertical: "b2b-saas" },
  { pattern: "saas",       vertical: "b2b-saas" },
  { pattern: "software",   vertical: "b2b-saas" },
  { pattern: "fintech",    vertical: "b2b-saas" },
  { pattern: "expense",    vertical: "b2b-saas" },
  { pattern: "payment",    vertical: "b2b-saas" },
  { pattern: "health",     vertical: "healthcare" },
  { pattern: "medical",    vertical: "healthcare" },
  { pattern: "doctor",     vertical: "healthcare" },
  { pattern: "clinic",     vertical: "healthcare" },
];

function matchesSearch(page: DirectoryPage, raw: string): boolean {
  if (!raw.trim()) return true;
  const q = raw.toLowerCase().trim();

  // Direct field matches
  if (page.slug.includes(q))            return true;
  if (page.canonicalQuery.toLowerCase().includes(q)) return true;
  if (page.serviceType.toLowerCase().includes(q))    return true;
  if (page.location.toLowerCase().includes(q))       return true;
  if ((VERTICAL_LABELS[page.vertical] ?? "").toLowerCase().includes(q)) return true;

  // Brand name search
  if (page.brandNames.some((b) => b.toLowerCase().includes(q))) return true;

  // Alias → vertical check
  const matchedVertical = VERTICAL_ALIASES.find((a) => q.includes(a.pattern) || a.pattern.includes(q));
  if (matchedVertical && page.vertical === matchedVertical.vertical) return true;

  return false;
}

interface DirectoryResponse {
  pages: DirectoryPage[];
  filters: {
    locations: string[];
    categories: string[];
  };
}

function toTitleCase(str: string) {
  return str.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function scoreColor(score: number) {
  if (score >= 4) return "#22c55e";
  if (score >= 3) return "#f59e0b";
  return "#ef4444";
}

export default function DirectoryListing() {
  const [location, setLocation]   = useState("");
  const [category, setCategory]   = useState("");
  const [sort, setSort]           = useState<"newest" | "oldest">("newest");
  const [search, setSearch]       = useState("");

  const params = new URLSearchParams();
  if (location) params.set("location", location);
  if (category) params.set("category", category);
  params.set("sort", sort);

  const { data, isLoading, isError } = useQuery<DirectoryResponse>({
    queryKey: ["/api/directory", location, category, sort],
    queryFn: () => fetch(`/api/directory?${params}`).then((r) => r.json()),
  });

  const pages = (data?.pages ?? []).filter((p) => matchesSearch(p, search));

  const locations  = data?.filters.locations  ?? [];
  const categories = data?.filters.categories ?? [];

  return (
    <div style={{ background: "#070d1a", minHeight: "100vh", color: "#e2e8f0", fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* Nav */}
      <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#3b82f6,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 14 }}>✦</span>
          </div>
          <span style={{ fontWeight: 600, fontSize: 14, color: "#fff" }}>
            AnswerMonk
          </span>
        </div>
        <a href="/start" style={{ fontSize: 13, color: "#475569", textDecoration: "none" }}>← Back to home</a>
      </nav>

      {/* Header */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 28px 0" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, padding: "3px 10px", borderRadius: 99, fontWeight: 500, background: "rgba(99,102,241,0.1)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.2)", marginBottom: 14 }}>
          <LayoutGrid size={11} /> AI Search Directory
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", color: "#f8fafc", marginBottom: 6 }}>
          AI Visibility Rankings
        </h1>
        <p style={{ fontSize: 14, color: "#475569", marginBottom: 28 }}>
          Published query pages — each backed by prompt-level AI analysis across ChatGPT, Claude, Gemini &amp; Perplexity.
        </p>

        {/* Controls */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24, alignItems: "center" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 200px" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#374151" }} />
            <input
              data-testid="input-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pages…"
              style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 10px 8px 30px", fontSize: 13, color: "#e2e8f0", outline: "none" }}
            />
          </div>

          {/* Location filter */}
          <div style={{ position: "relative" }}>
            <Filter size={12} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#374151" }} />
            <select
              data-testid="select-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{ appearance: "none", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 28px 8px 28px", fontSize: 13, color: location ? "#e2e8f0" : "#475569", cursor: "pointer" }}
            >
              <option value="">All locations</option>
              {locations.map((l) => (
                <option key={l} value={l}>{toTitleCase(l)}</option>
              ))}
            </select>
          </div>

          {/* Category (vertical) filter */}
          <div style={{ position: "relative" }}>
            <Filter size={12} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#374151" }} />
            <select
              data-testid="select-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ appearance: "none", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 28px 8px 28px", fontSize: 13, color: category ? "#e2e8f0" : "#475569", cursor: "pointer" }}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{VERTICAL_LABELS[c] ?? toTitleCase(c)}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <button
            data-testid="button-sort"
            onClick={() => setSort((s) => s === "newest" ? "oldest" : "newest")}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 14px", fontSize: 13, color: "#94a3b8", cursor: "pointer" }}
          >
            {sort === "newest" ? <SortDesc size={13} /> : <SortAsc size={13} />}
            {sort === "newest" ? "Newest first" : "Oldest first"}
          </button>
        </div>

        {/* Count line */}
        <div style={{ fontSize: 12, color: "#374151", marginBottom: 16 }} data-testid="text-page-count">
          {isLoading ? "Loading…" : isError ? "Error loading data" : `${pages.length} page${pages.length !== 1 ? "s" : ""} published`}
        </div>
      </div>

      {/* Page list */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 28px 80px" }}>

        {isLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: 18, height: 72, animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        )}

        {!isLoading && !isError && pages.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#374151", fontSize: 14 }}>
            No pages match the selected filters.
          </div>
        )}

        {!isLoading && !isError && pages.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pages.map((page) => (
              <a
                key={page.slug}
                href={`/${page.slug}`}
                data-testid={`card-page-${page.slug}`}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 18px", textDecoration: "none", transition: "border-color 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#f1f5f9", marginBottom: 4 }}>
                    Best {toTitleCase(page.serviceType)} in {toTitleCase(page.location)}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: "#374151", fontFamily: "monospace" }}>/{page.slug}</span>
                    {page.location && (
                      <span style={{ fontSize: 11, padding: "1px 7px", borderRadius: 99, background: "rgba(59,130,246,0.08)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.15)" }}>
                        {toTitleCase(page.location)}
                      </span>
                    )}
                    {page.vertical && page.vertical !== "other" && (
                      <span style={{ fontSize: 11, padding: "1px 7px", borderRadius: 99, background: "rgba(99,102,241,0.08)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.15)" }}>
                        {VERTICAL_LABELS[page.vertical] ?? page.vertical}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: "#334155" }}>
                      {page.brandCount} brand{page.brandCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0, marginLeft: 16 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Evidence</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: scoreColor(page.evidenceScore) }}>{page.evidenceScore}/5</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Updated</div>
                    <div style={{ fontSize: 11, color: "#475569" }}>{formatDate(page.lastUpdated)}</div>
                  </div>
                  <ExternalLink size={14} style={{ color: "#334155" }} />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity:0.4 } 50% { opacity:0.7 } }
        select option { background: #0f172a; color: #e2e8f0; }
      `}</style>
    </div>
  );
}

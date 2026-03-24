import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface SearchIndexEntry {
  id: number;
  slug: string | null;
  category: string;
  query: string;
  ownBrand: string;
  domain: string;
  domainRoot: string;
  topBrands: string[];
}

function toReportHref(entry: SearchIndexEntry): string {
  if (entry.slug) return `/reports/${entry.slug}`;
  const base = (entry.query || entry.ownBrand || String(entry.id))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `/reports/${base}-${entry.id}`;
}

const CATEGORY_COLORS: Record<string, string> = {
  botox: "#6366f1",
  clinic: "#8b5cf6",
  dental: "#3b82f6",
  law: "#0ea5e9",
  hotel: "#10b981",
  restaurant: "#f59e0b",
  agency: "#ec4899",
  saas: "#14b8a6",
  finance: "#f97316",
};

function categoryColor(category: string): string {
  const key = category.toLowerCase();
  for (const [k, color] of Object.entries(CATEGORY_COLORS)) {
    if (key.includes(k)) return color;
  }
  const hash = [...category].reduce((a, c) => a + c.charCodeAt(0), 0);
  const palette = ["#6366f1", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#f59e0b", "#14b8a6", "#f97316"];
  return palette[hash % palette.length];
}

function ReportCard({ entry }: { entry: SearchIndexEntry }) {
  const [, navigate] = useLocation();
  const color = categoryColor(entry.category);
  const href = toReportHref(entry);

  return (
    <a
      href={href}
      onClick={(e) => { e.preventDefault(); navigate(href); }}
      data-testid={`report-card-${entry.id}`}
      style={{
        display: "block",
        background: "#ffffff",
        border: `1px solid #e5e7eb`,
        borderRadius: "12px",
        padding: "20px",
        textDecoration: "none",
        transition: "box-shadow 0.15s, transform 0.15s",
        cursor: "pointer",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.10)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
        (e.currentTarget as HTMLElement).style.transform = "none";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <span style={{
          display: "inline-block",
          background: color + "18",
          color,
          fontSize: "11px",
          fontWeight: 600,
          padding: "3px 8px",
          borderRadius: "20px",
          letterSpacing: "0.02em",
          textTransform: "uppercase",
        }}>
          {entry.category || "General"}
        </span>
      </div>

      <div style={{ fontWeight: 700, fontSize: "15px", color: "#111827", marginBottom: "4px", lineHeight: 1.3 }}>
        {entry.ownBrand}
      </div>

      <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "12px" }}>
        {entry.query || entry.domain || ""}
      </div>

      {entry.topBrands?.length > 0 && (
        <div style={{ fontSize: "12px", color: "#9ca3af" }}>
          vs {entry.topBrands.slice(0, 2).join(", ")}
          {entry.topBrands.length > 2 ? ` +${entry.topBrands.length - 2} more` : ""}
        </div>
      )}

      <div style={{
        marginTop: "14px",
        fontSize: "12px",
        fontWeight: 600,
        color,
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}>
        View report →
      </div>
    </a>
  );
}

export default function ReportsIndex() {
  const { data: entries = [], isLoading } = useQuery<SearchIndexEntry[]>({
    queryKey: ["/api/directory/search-index"],
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <header style={{
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        padding: "0 24px",
      }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontWeight: 800, fontSize: "18px", color: "#4f46e5" }}>AnswerMonk</span>
          </a>
          <a href="/" style={{ fontSize: "13px", color: "#6b7280", textDecoration: "none", fontWeight: 500 }}>
            Run your own audit →
          </a>
        </div>
      </header>

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#111827", marginBottom: "10px" }}>
            AI Visibility Reports
          </h1>
          <p style={{ fontSize: "16px", color: "#6b7280", maxWidth: "560px", lineHeight: 1.6 }}>
            Browse AI search visibility audits for brands across categories and markets.
            Each report shows share-of-voice, competitor rankings, and citation sources
            across ChatGPT, Claude, and Gemini.
          </p>
        </div>

        {isLoading ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px",
          }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{
                background: "#f3f4f6",
                borderRadius: "12px",
                height: "140px",
                animation: "pulse 1.5s ease-in-out infinite",
              }} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: "center", color: "#9ca3af", paddingTop: "60px" }}>
            No reports available yet.
          </div>
        ) : (
          <>
            <div style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "20px" }}>
              {entries.length} report{entries.length !== 1 ? "s" : ""} published
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "16px",
            }}>
              {entries.map(entry => (
                <ReportCard key={entry.id} entry={entry} />
              ))}
            </div>
          </>
        )}
      </main>

      <footer style={{
        borderTop: "1px solid #e5e7eb",
        padding: "24px",
        textAlign: "center",
        fontSize: "13px",
        color: "#9ca3af",
        marginTop: "60px",
        background: "#ffffff",
      }}>
        <a href="https://answermonk.ai" style={{ color: "#6366f1", textDecoration: "none", fontWeight: 600 }}>AnswerMonk</a>
        {" "}— AI Search Visibility Intelligence
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

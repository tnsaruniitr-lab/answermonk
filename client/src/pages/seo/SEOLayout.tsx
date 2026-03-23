import { useEffect } from "react";
import { Link } from "wouter";
import { MonkWordmark } from "@/components/MonkWordmark";

interface SEOLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  canonical?: string;
}

export function SEOLayout({ title, description, children, canonical }: SEOLayoutProps) {
  useEffect(() => {
    const prev = document.title;
    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute("content") || "";
    if (metaDesc) metaDesc.setAttribute("content", description);
    return () => {
      document.title = prev;
      if (metaDesc) metaDesc.setAttribute("content", prevDesc);
    };
  }, [title, description]);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/start">
            <span style={{ cursor: "pointer", display: "inline-flex", alignItems: "center" }}>
              <MonkWordmark size="sm" />
            </span>
          </Link>
          <nav style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <Link href="/methodology"><span style={{ fontSize: 13, color: "#4f46e5", cursor: "pointer", textDecoration: "none", fontWeight: 500 }}>Methodology</span></Link>
            <Link href="/ai-search-audit"><span style={{ fontSize: 13, color: "#4f46e5", cursor: "pointer", fontWeight: 500 }}>Audit</span></Link>
            <Link href="/use-cases/brands"><span style={{ fontSize: 13, color: "#4f46e5", cursor: "pointer", fontWeight: 500 }}>Use Cases</span></Link>
            <Link href="/start">
              <span style={{
                fontSize: 13, fontWeight: 600,
                background: "linear-gradient(135deg, #6366f1, #7c3aed)",
                color: "#fff", padding: "7px 16px", borderRadius: 99, cursor: "pointer",
                display: "inline-block",
              }}>
                Run free audit →
              </span>
            </Link>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "60px 24px 80px" }}>
        {children}
      </main>

      <footer style={{ borderTop: "1px solid rgba(0,0,0,0.07)", background: "rgba(255,255,255,0.6)", padding: "40px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 32, marginBottom: 32 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Product</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Link href="/ai-search-audit"><span style={{ fontSize: 13, color: "#4f46e5", cursor: "pointer" }}>AI Search Audit</span></Link>
                <Link href="/methodology"><span style={{ fontSize: 13, color: "#4f46e5", cursor: "pointer" }}>Methodology</span></Link>
                <Link href="/sample-report"><span style={{ fontSize: 13, color: "#4f46e5", cursor: "pointer" }}>Sample Report</span></Link>
                <Link href="/chatgpt-visibility-audit"><span style={{ fontSize: 13, color: "#4f46e5", cursor: "pointer" }}>ChatGPT Audit</span></Link>
                <Link href="/llm-seo-audit"><span style={{ fontSize: 13, color: "#4f46e5", cursor: "pointer" }}>LLM SEO Audit</span></Link>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Use Cases</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Link href="/use-cases/brands"><span style={{ fontSize: 13, color: "#4f46e5", cursor: "pointer" }}>For Brands</span></Link>
                <Link href="/use-cases/agencies"><span style={{ fontSize: 13, color: "#4f46e5", cursor: "pointer" }}>For Agencies</span></Link>
                <Link href="/use-cases/b2b-saas"><span style={{ fontSize: 13, color: "#4f46e5", cursor: "pointer" }}>B2B SaaS</span></Link>
                <Link href="/use-cases/ecommerce"><span style={{ fontSize: 13, color: "#4f46e5", cursor: "pointer" }}>Ecommerce</span></Link>
                <Link href="/use-cases/local-business"><span style={{ fontSize: 13, color: "#4f46e5", cursor: "pointer" }}>Local Business</span></Link>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Learn</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Link href="/how-ai-search-works"><span style={{ fontSize: 13, color: "#4f46e5", cursor: "pointer" }}>How AI Search Works</span></Link>
                <Link href="/how-to-improve-ai-citations"><span style={{ fontSize: 13, color: "#4f46e5", cursor: "pointer" }}>Improve AI Citations</span></Link>
                <Link href="/glossary/generative-engine-optimization"><span style={{ fontSize: 13, color: "#4f46e5", cursor: "pointer" }}>What is GEO?</span></Link>
                <Link href="/glossary/ai-visibility-score"><span style={{ fontSize: 13, color: "#4f46e5", cursor: "pointer" }}>AI Visibility Score</span></Link>
                <Link href="/glossary/ai-search-visibility"><span style={{ fontSize: 13, color: "#4f46e5", cursor: "pointer" }}>AI Search Visibility</span></Link>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Compare</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Link href="/compare/answermonk-vs-profound"><span style={{ fontSize: 13, color: "#4f46e5", cursor: "pointer" }}>vs Profound</span></Link>
                <Link href="/compare/answermonk-vs-ahrefs-brand-radar"><span style={{ fontSize: 13, color: "#4f46e5", cursor: "pointer" }}>vs Ahrefs Brand Radar</span></Link>
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>© 2026 AnswerMonk. AI search visibility audits for brands and agencies.</span>
            <Link href="/start"><span style={{ fontSize: 12, color: "#4f46e5", cursor: "pointer" }}>Run a free audit →</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function PageHero({ eyebrow, headline, sub }: { eyebrow: string; headline: string; sub: string }) {
  return (
    <div style={{ marginBottom: 56 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7c3aed", marginBottom: 10 }}>{eyebrow}</div>
      <h1 style={{ fontSize: 36, fontWeight: 800, color: "#0f172a", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 16 }}>{headline}</h1>
      <p style={{ fontSize: 17, color: "#475569", lineHeight: 1.65, maxWidth: 640 }}>{sub}</p>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 16, letterSpacing: "-0.01em" }}>{title}</h2>
      {children}
    </section>
  );
}

export function ProseP({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.75, marginBottom: 14 }}>{children}</p>;
}

export function ProseList({ items }: { items: string[] }) {
  return (
    <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: 15, color: "#374151", lineHeight: 1.7, marginBottom: 6 }}>{item}</li>
      ))}
    </ul>
  );
}

export function CTABox() {
  return (
    <div style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", borderRadius: 16, padding: "36px 40px", marginTop: 48, textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 10 }}>See where your brand ranks in AI search</div>
      <div style={{ fontSize: 15, color: "rgba(255,255,255,0.8)", marginBottom: 24 }}>Enter your domain and get a free AI visibility audit across ChatGPT, Gemini, Claude, and Perplexity.</div>
      <Link href="/start">
        <span style={{ display: "inline-block", background: "#fff", color: "#4f46e5", fontWeight: 700, fontSize: 15, padding: "12px 28px", borderRadius: 10, cursor: "pointer" }}>
          Run free audit →
        </span>
      </Link>
    </div>
  );
}

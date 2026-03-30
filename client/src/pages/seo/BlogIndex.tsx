import { useEffect } from "react";
import { Link } from "wouter";
import { SEOLayout } from "./SEOLayout";

const POSTS = [
  {
    href: "/blog/geo-vs-seo",
    eyebrow: "Strategy",
    title: "GEO vs SEO: what's the difference and why both matter",
    desc: "Search engine optimization gets you into Google's list. Generative engine optimization gets you into ChatGPT's answer. They share overlap — but they're not the same thing.",
    mins: "7 min read",
  },
  {
    href: "/blog/how-to-get-traffic-from-chatgpt",
    eyebrow: "Traffic",
    title: "How to get traffic from ChatGPT",
    desc: "ChatGPT is becoming a buying channel. Brands it recommends receive referral clicks from high-intent users already pre-qualified by the conversation.",
    mins: "6 min read",
  },
  {
    href: "/blog/increase-organic-traffic-from-llms",
    eyebrow: "Growth",
    title: "How to increase organic traffic from LLMs",
    desc: "ChatGPT, Claude, Gemini, and Perplexity now send referral traffic to brands they recommend. Here's how to earn that traffic — and how to measure it.",
    mins: "8 min read",
  },
];

export default function BlogIndex() {
  useEffect(() => {
    const prev = document.title;
    document.title = "Blog | AnswerMonk — AI Search Visibility";
    return () => { document.title = prev; };
  }, []);

  return (
    <SEOLayout
      title="Blog | AnswerMonk — AI Search Visibility"
      description="Guides and strategies for brands and agencies looking to improve visibility in ChatGPT, Gemini, Claude, and Perplexity."
    >
      <div style={{ marginBottom: 56 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7c3aed", marginBottom: 10 }}>Blog</div>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: "#0f172a", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 16 }}>
          AI visibility guides for brands and agencies
        </h1>
        <p style={{ fontSize: 17, color: "#475569", lineHeight: 1.65, maxWidth: 580 }}>
          Practical strategies for measuring and improving how ChatGPT, Gemini, Claude, and Perplexity recommend your brand.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {POSTS.map(post => (
          <Link key={post.href} href={post.href}>
            <div style={{
              background: "#fff",
              border: "1px solid rgba(99,102,241,0.12)",
              borderRadius: 14,
              padding: "28px 32px",
              cursor: "pointer",
              boxShadow: "0 1px 8px rgba(99,102,241,0.07)",
              transition: "box-shadow 0.18s, transform 0.15s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 28px rgba(55,48,163,0.14)";
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 8px rgba(99,102,241,0.07)";
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
            }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                  color: "#4f46e5", background: "rgba(99,102,241,0.08)",
                  border: "1px solid rgba(99,102,241,0.18)", borderRadius: 20, padding: "3px 10px",
                }}>
                  {post.eyebrow}
                </span>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>{post.mins}</span>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", lineHeight: 1.3, marginBottom: 10, letterSpacing: "-0.01em" }}>
                {post.title}
              </h2>
              <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, marginBottom: 14 }}>{post.desc}</p>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#4f46e5" }}>Read article →</span>
            </div>
          </Link>
        ))}
      </div>
    </SEOLayout>
  );
}

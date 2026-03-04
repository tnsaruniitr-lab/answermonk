import { useEffect, useRef, useCallback, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface TeaserData {
  meta: {
    brandName: string;
    date: string;
    totalQueries: number;
    queriesPerEngine: number;
  };
  overallScore: {
    appearanceRate: number;
    avgRank: number | null;
    primaryRate: number;
    marketRank: number;
    competitorCount: number;
    leaderName: string;
    leaderRate: number;
  };
  engineSplit: Array<{
    engine: string;
    label: string;
    appearanceRate: number;
    primaryRate: number;
    color: "green" | "gold" | "red";
    note: string;
  }>;
  competitiveRanking: Array<{
    rank: number;
    name: string;
    share: number;
    isBrand: boolean;
  }>;
  proximityNote: string;
  segmentBreakdown: Array<{
    label: string;
    brandRank: number;
    brandVisibility: number;
    leaderName: string;
    leaderScore: number;
    gapPoints: number;
    opportunity: "high" | "closeable" | "stretch";
  }>;
  quoteContrast: {
    competitors: Array<{
      rank: number;
      name: string;
      sentence: string;
      engines: string[];
    }>;
    brand: {
      sentence: string | null;
      hasSentence: boolean;
    };
  };
  authorityGap: {
    domains: Array<{
      domain: string;
      tier: string;
      description: string;
      presence: Record<string, boolean>;
    }>;
    brandAbsentCount: number;
    totalT1Count: number;
  };
  brandVoice: Array<{
    engine: string;
    engineLabel: string;
    prompt: string;
    quote: string;
    problem: string;
    isStrong: boolean;
  }>;
  samplePrompts: Array<{
    promptText: string;
    brandRank: number | null;
    brandFound: boolean;
    winnerName: string;
    winnerRank: number;
  }>;
  socialThreads: Array<{
    platform: string;
    title: string;
    competitorsMentioned: string[];
    brandMentioned: boolean;
    engines: string[];
  }>;
  citationFootprint: {
    brandSources: number;
    leaderSources: number;
    leaderName: string;
    thirdPartyDomains: number;
    socialMentions: number;
  };
  topPlayerInsights: Array<{
    title: string;
    detail: string;
    sources?: string[];
  }>;
  keyActions: Array<{
    title: string;
    detail: string;
    priority: "critical" | "high" | "medium";
  }>;
  engineSegmentHeatmap: Array<{
    segmentLabel: string;
    engines: Record<string, number>;
  }>;
  citationScale: {
    totalCitationsCrawled: number;
    totalCitationPages: number;
    totalRuns: number;
    totalEngines: number;
  };
  promptShowdown: Array<{
    promptText: string;
    results: Array<{ engine: string; engineLabel: string; brandRank: number | null; brandFound: boolean; topResult: string }>;
    dateLabel: string;
  }>;
}

const ENGINE_LABELS_MAP: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  claude: "Claude",
};

const V = {
  bg: "#07090f",
  surface: "#0d1119",
  surface2: "#111620",
  border: "rgba(255,255,255,0.06)",
  borderMd: "rgba(255,255,255,0.10)",
  gold: "#c9a84c",
  goldLight: "#e8c878",
  goldDim: "rgba(201,168,76,0.12)",
  red: "#d95f5f",
  redDim: "rgba(217,95,95,0.08)",
  green: "#4caf82",
  greenDim: "rgba(76,175,130,0.08)",
  blue: "#5b8dee",
  text: "#c8ccd8",
  textBright: "#e8eaf0",
  muted: "#4a5060",
  mutedMd: "#6a7080",
};

const colorMap: Record<string, string> = { green: V.green, gold: V.gold, red: V.red };

const noiseUrl = "data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E";

function useScrollReveal() {
  const refs = useRef<Set<HTMLElement>>(new Set());
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
            const staggerChildren = el.querySelectorAll("[data-stagger]");
            staggerChildren.forEach((child, i) => {
              const c = child as HTMLElement;
              setTimeout(() => {
                c.style.opacity = "1";
                c.style.transform = "translateY(0)";
              }, 90 * (i + 1));
            });
            observer.current?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    refs.current.forEach((el) => observer.current?.observe(el));
    return () => observer.current?.disconnect();
  }, []);

  const registerRef = useCallback((el: HTMLElement | null) => {
    if (el && !refs.current.has(el)) {
      refs.current.add(el);
      el.style.opacity = "0";
      el.style.transform = "translateY(24px)";
      el.style.transition = "opacity 0.7s ease, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)";
      observer.current?.observe(el);
    }
  }, []);

  return registerRef;
}

function useAnimatedBars() {
  const refs = useRef<Set<HTMLElement>>(new Set());
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            const w = target.getAttribute("data-width") || "0%";
            target.style.width = w;
            observer.current?.unobserve(target);
          }
        });
      },
      { threshold: 0.1 }
    );
    refs.current.forEach((el) => observer.current?.observe(el));
    return () => observer.current?.disconnect();
  }, []);

  const registerBar = useCallback((el: HTMLElement | null) => {
    if (el && !refs.current.has(el)) {
      refs.current.add(el);
      el.style.width = "0";
      el.style.transition = "width 1.4s cubic-bezier(0.16, 1, 0.3, 1)";
      observer.current?.observe(el);
    }
  }, []);

  return registerBar;
}

function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLElement | null>(null);
  const triggered = useRef(false);
  const rafId = useRef(0);

  useEffect(() => {
    if (!ref.current) return;
    triggered.current = false;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) rafId.current = requestAnimationFrame(tick);
          };
          rafId.current = requestAnimationFrame(tick);
          obs.unobserve(entry.target);
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(ref.current);
    return () => { obs.disconnect(); cancelAnimationFrame(rafId.current); };
  }, [target, duration]);

  return { value, ref };
}

function useCountUpDecimal(target: number, duration = 1400) {
  const [value, setValue] = useState("0.0");
  const ref = useRef<HTMLElement | null>(null);
  const triggered = useRef(false);
  const rafId = useRef(0);

  useEffect(() => {
    if (!ref.current) return;
    triggered.current = false;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue((eased * target).toFixed(1));
            if (progress < 1) rafId.current = requestAnimationFrame(tick);
          };
          rafId.current = requestAnimationFrame(tick);
          obs.unobserve(entry.target);
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(ref.current);
    return () => { obs.disconnect(); cancelAnimationFrame(rafId.current); };
  }, [target, duration]);

  return { value, ref };
}

const TEASER_KEYFRAMES = `
@keyframes teaser-spin { to { transform: rotate(360deg); } }
@keyframes teaser-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
@keyframes teaser-glow-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}
@keyframes teaser-score-enter {
  0% { transform: scale(1.4); filter: blur(8px); opacity: 0; }
  60% { transform: scale(1.02); filter: blur(0); opacity: 1; }
  100% { transform: scale(1); filter: blur(0); opacity: 1; }
}
@keyframes teaser-fade-in-up {
  0% { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes teaser-border-glow {
  0%, 100% { border-color: rgba(201,168,76,0.08); }
  50% { border-color: rgba(201,168,76,0.22); }
}
.teaser-locked-hover:hover {
  transform: scale(1.008);
  border-color: rgba(201,168,76,0.18) !important;
}
.teaser-locked-hover {
  transition: transform 0.3s ease, border-color 0.3s ease;
}
[data-stagger] {
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
`;

const S = {
  wrapper: {
    maxWidth: 800,
    margin: "0 auto",
    padding: "64px 32px 120px",
    position: "relative" as const,
    zIndex: 1,
  },
  eyebrow: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.22em",
    textTransform: "uppercase" as const,
    marginBottom: 18,
  },
  divider: {
    height: 1,
    background: V.border,
    margin: "80px 0",
  },
  tag: {
    display: "inline-block",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    padding: "3px 8px",
    borderRadius: 2,
    border: "1px solid",
  },
};

function SectionNumber({ num }: { num: string }) {
  return (
    <div
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        color: "rgba(255,255,255,0.06)",
        letterSpacing: "0.15em",
        marginBottom: 14,
        userSelect: "none",
      }}
      data-testid={`section-num-${num || "cta"}`}
    >
      {num}
    </div>
  );
}

function LockedOverlay({ count, label }: { count: number; label: string }) {
  return (
    <div
      className="teaser-locked-hover"
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(ellipse at center, rgba(7,9,15,0.50) 0%, rgba(7,9,15,0.95) 60%)",
        zIndex: 2,
        cursor: "default",
        overflow: "hidden",
      }}
      data-testid={`locked-overlay-${label.replace(/\s+/g, "-").substring(0, 30)}`}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.03) 50%, transparent 100%)",
          animation: "teaser-shimmer 4s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          fontSize: 22,
          opacity: 0.25,
          marginBottom: 14,
          fontFamily: "'JetBrains Mono', monospace",
          animation: "teaser-glow-pulse 3s ease-in-out infinite",
        }}
      >
        &#9670;
      </div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: V.mutedMd,
          letterSpacing: "0.12em",
          textAlign: "center",
          maxWidth: 320,
          lineHeight: 1.7,
        }}
        data-testid={`text-locked-count-${count}`}
      >
        {count} more {label} included in the full audit
      </div>
    </div>
  );
}

export default function ProspectTeaser({ slug: propSlug }: { slug?: string } = {}) {
  const params = useParams<{ id: string; slug: string }>();
  const [location] = useLocation();

  const resolvedSlug = propSlug || params.slug;
  const sessionId = params.id;
  const isSlugMode = !!resolvedSlug && !sessionId;

  const apiUrl = isSlugMode
    ? `/api/share/teaser/by-slug/${resolvedSlug}`
    : `/api/share/teaser/${sessionId}`;

  const queryKey = isSlugMode
    ? ["/api/share/teaser/by-slug", resolvedSlug]
    : ["/api/share/teaser", sessionId];

  const { data, isLoading, error } = useQuery<{ teaser: TeaserData; sessionId?: number }>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error("Failed to load teaser");
      return res.json();
    },
    staleTime: Infinity,
  });

  const resolvedSessionId = data?.sessionId || (sessionId ? parseInt(sessionId, 10) : 0);

  useEffect(() => {
    if (!document.querySelector('link[href*="Playfair+Display"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=JetBrains+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600&display=swap";
      document.head.appendChild(link);
    }
    if (!document.querySelector('style[data-teaser-keyframes]')) {
      const style = document.createElement("style");
      style.setAttribute("data-teaser-keyframes", "1");
      style.textContent = TEASER_KEYFRAMES;
      document.head.appendChild(style);
    }
  }, []);

  const reveal = useScrollReveal();
  const animBar = useAnimatedBars();

  const [showSurvey, setShowSurvey] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [surveyComments, setSurveyComments] = useState("");
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const [surveySubmitting, setSurveySubmitting] = useState(false);

  const toggleInterest = (val: string) => {
    setSelectedInterests(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };

  const submitSurvey = async () => {
    if (selectedInterests.length === 0) return;
    setSurveySubmitting(true);
    try {
      const res = await fetch(`/api/share/teaser/${resolvedSessionId}/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests: selectedInterests, comments: surveyComments || null }),
      });
      if (res.ok) setSurveySubmitted(true);
    } catch {}
    setSurveySubmitting(false);
  };

  const scoreTarget = data?.teaser?.overallScore?.appearanceRate ?? 0;
  const rankTarget = data?.teaser?.overallScore?.marketRank ?? 0;
  const avgRankTarget = data?.teaser?.overallScore?.avgRank ?? 0;
  const primaryTarget = data?.teaser?.overallScore?.primaryRate ?? 0;

  const scoreCount = useCountUp(scoreTarget, 1600);
  const rankCount = useCountUp(rankTarget, 1200);
  const avgRankCount = useCountUpDecimal(avgRankTarget, 1200);
  const primaryCount = useCountUp(primaryTarget, 1400);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: V.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
        }}
        data-testid="loading-screen"
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: `3px solid ${V.border}`,
            borderTop: `3px solid ${V.gold}`,
            borderRadius: "50%",
            animation: "teaser-spin 0.8s linear infinite",
          }}
        />
        <style>{TEASER_KEYFRAMES}</style>
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: V.muted,
            letterSpacing: "0.1em",
          }}
        >
          Loading teaser report...
        </p>
      </div>
    );
  }

  if (error || !data?.teaser) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: V.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 12,
        }}
        data-testid="error-screen"
      >
        <p style={{ color: V.red, fontFamily: "'DM Sans', sans-serif", fontSize: 16 }}>
          Failed to load teaser report.
        </p>
      </div>
    );
  }

  const t = data.teaser;
  const brandName = t.meta.brandName;
  const topCompNames = t.competitiveRanking
    .filter((c) => !c.isBrand)
    .slice(0, 3)
    .map((c) => c.name);
  const authColumnNames = [...topCompNames, brandName];

  const verdictText = t.overallScore.appearanceRate >= 70
    ? `Strong visibility. ${brandName} appears in most relevant AI responses.`
    : t.overallScore.appearanceRate >= 30
    ? `Moderate visibility. ${brandName} appears in roughly 1 in 2 relevant AI responses — but rank position and consistency vary dramatically by engine and segment.`
    : `Low visibility. ${brandName} appears in fewer than 1 in 3 AI responses — significant gaps across engines and segments.`;

  const oppBadgeStyle = (opp: string) => {
    if (opp === "high")
      return { background: "rgba(76,175,130,0.15)", color: V.green, border: `1px solid rgba(76,175,130,0.25)` };
    if (opp === "closeable")
      return { background: V.goldDim, color: V.gold, border: `1px solid rgba(201,168,76,0.22)` };
    return { background: "rgba(255,255,255,0.04)", color: V.muted, border: `1px solid ${V.border}` };
  };

  const oppLabel = (opp: string) => (opp === "high" ? "opportunity" : opp === "closeable" ? "closeable" : "stretch");

  const segColor = (vis: number) => (vis >= 50 ? V.green : vis >= 30 ? V.gold : V.red);

  const priorityStyle = (p: string) => {
    if (p === "critical") return { color: V.red, bg: V.redDim, border: "rgba(217,95,95,0.3)" };
    if (p === "high") return { color: V.gold, bg: V.goldDim, border: "rgba(201,168,76,0.3)" };
    return { color: V.mutedMd, bg: "rgba(255,255,255,0.04)", border: V.borderMd };
  };

  const visibleInsights = (t.topPlayerInsights || []).slice(0, 2);
  const lockedInsights = (t.topPlayerInsights || []).slice(2);
  const visibleActions = (t.keyActions || []).slice(0, 1);
  const lockedActions = (t.keyActions || []).slice(1);

  const visibleQuoteComps = t.quoteContrast.competitors.slice(0, 1);
  const lockedQuoteComps = t.quoteContrast.competitors.slice(1);

  const visibleVoice = t.brandVoice.slice(0, 1);
  const lockedVoice = t.brandVoice.slice(1);

  const visibleSegments = t.segmentBreakdown.slice(0, 4);
  const lockedSegments = t.segmentBreakdown.slice(4);

  const visibleAuthDomains = t.authorityGap.domains.slice(0, 1);
  const lockedAuthDomains = t.authorityGap.domains.slice(1);

  const visiblePrompts = t.samplePrompts.slice(0, 1);
  const lockedPrompts = t.samplePrompts.slice(1);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: V.bg,
        color: V.text,
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 300,
        lineHeight: 1.6,
        position: "relative",
      }}
      data-testid="teaser-page"
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `url("${noiseUrl}")`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={S.wrapper}>
        {/* 01 · Header */}
        <div
          ref={reveal}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 72,
            paddingBottom: 20,
            borderBottom: `1px solid ${V.border}`,
          }}
          data-testid="section-header"
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: V.muted,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            AI Search Visibility Audit ·{" "}
            <span style={{
              color: V.gold,
              background: "rgba(201,168,76,0.10)",
              padding: "2px 7px",
              borderRadius: 3,
              border: "1px solid rgba(201,168,76,0.18)",
            }}>{brandName}</span>
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: V.muted,
              textAlign: "right",
              lineHeight: 1.7,
            }}
            data-testid="text-date"
          >
            {t.meta.date}
            <br />
            Confidential · Preview
          </div>
        </div>

        {/* 02 · Hook */}
        <div ref={reveal} style={{ marginBottom: 100 }} data-testid="section-hook">
          <SectionNumber num="01" />
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(22px, 3.5vw, 32px)",
            fontWeight: 700,
            color: V.text,
            lineHeight: 1.3,
            marginBottom: 10,
          }}>
            AI Search Visibility Audit
          </div>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0,
            marginBottom: 32,
          }}>
            <span style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(28px, 4.5vw, 44px)",
              fontWeight: 900,
              color: V.gold,
              background: "rgba(201,168,76,0.08)",
              padding: "4px 16px 6px",
              borderRadius: 4,
              border: "1px solid rgba(201,168,76,0.20)",
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
              display: "inline-block",
            }} data-testid="text-brand-highlight">
              {brandName}
            </span>
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(34px, 5.5vw, 56px)",
              fontWeight: 900,
              lineHeight: 1.08,
              color: "#fff",
              marginBottom: 28,
              letterSpacing: "-0.01em",
            }}
          >
            When your prospects
            <br />
            ask AI who to hire —
            <br />
            <em style={{ fontStyle: "italic", color: V.gold }}>this is what happens.</em>
          </h1>
          <p
            style={{
              fontSize: 15,
              color: V.mutedMd,
              maxWidth: 540,
              lineHeight: 1.75,
            }}
            data-testid="text-hook-sub"
          >
            We ran {t.meta.totalQueries} queries across ChatGPT, Gemini, and Claude — every
            search your ideal customer makes. {brandName} appeared in{" "}
            {t.overallScore.appearanceRate < 50 ? "less than half" : `${t.overallScore.appearanceRate}% of them`}. Here's
            the exact breakdown, why it's happening, and what your top competitor is doing that
            you're not.
          </p>
        </div>

        {/* 03 · Score Card */}
        <div
          ref={reveal}
          style={{
            background: V.surface,
            border: `1px solid ${V.border}`,
            borderRadius: 3,
            padding: "48px 48px",
            marginBottom: 100,
            position: "relative",
            overflow: "hidden",
          }}
          data-testid="section-score-card"
        >
          <SectionNumber num="02" />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: `linear-gradient(90deg, ${V.gold} 0%, transparent 65%)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -80,
              right: -80,
              width: 260,
              height: 260,
              background: "radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div style={{ ...S.eyebrow, color: V.muted }}>Overall AI Visibility Score</div>
          <div style={{ position: "relative", display: "inline-block" }}>
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(201,168,76,0.10) 0%, rgba(201,168,76,0.03) 50%, transparent 70%)",
              pointerEvents: "none",
            }} />
            <div
              ref={scoreCount.ref as any}
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 96,
                fontWeight: 700,
                color: V.goldLight,
                lineHeight: 1,
                marginBottom: 6,
                position: "relative",
                animation: "teaser-score-enter 1.2s cubic-bezier(0.16, 1, 0.3, 1) both",
              }}
              data-testid="text-score-num"
            >
              {scoreCount.value}
              <sup style={{ fontSize: 42, verticalAlign: "super" }}>%</sup>
            </div>
          </div>
          <div
            style={{ fontSize: 13, color: V.mutedMd, marginBottom: 36 }}
          >
            <strong style={{ color: V.gold, fontWeight: 500 }}>
              {t.overallScore.appearanceRate >= 70
                ? "Strong visibility."
                : t.overallScore.appearanceRate >= 30
                ? "Moderate visibility."
                : "Low visibility."}
            </strong>{" "}
            {verdictText.split(". ").slice(1).join(". ")}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 0,
              borderTop: `1px solid ${V.border}`,
              paddingTop: 28,
            }}
          >
            <div style={{ paddingRight: 24 }} data-stagger>
              <div
                ref={rankCount.ref as any}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 24,
                  fontWeight: 500,
                  color: V.textBright,
                  marginBottom: 5,
                }}
                data-testid="text-market-rank"
              >
                #{rankCount.value}
              </div>
              <div style={{ fontSize: 13, color: V.mutedMd, lineHeight: 1.5 }}>
                Overall market rank
                <br />
                out of {t.overallScore.competitorCount} competitors
              </div>
            </div>
            <div style={{ paddingRight: 24 }} data-stagger>
              <div
                ref={avgRankCount.ref as any}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 24,
                  fontWeight: 500,
                  color: V.textBright,
                  marginBottom: 5,
                }}
                data-testid="text-avg-rank"
              >
                #{t.overallScore.avgRank != null ? avgRankCount.value : "N/A"}
              </div>
              <div style={{ fontSize: 13, color: V.mutedMd, lineHeight: 1.5 }}>
                Avg rank when mentioned
                <br />
                across all engines
              </div>
            </div>
            <div data-stagger>
              <div
                ref={primaryCount.ref as any}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 24,
                  fontWeight: 500,
                  color: V.textBright,
                  marginBottom: 5,
                }}
                data-testid="text-primary-rate"
              >
                {primaryCount.value}%
              </div>
              <div style={{ fontSize: 13, color: V.mutedMd, lineHeight: 1.5 }}>
                Top-3 recommendation rate
                <br />
                leader is at {t.overallScore.leaderRate}%
              </div>
            </div>
          </div>
        </div>

        {/* 04 · Engine Split */}
        <div ref={reveal} style={{ marginBottom: 100 }} data-testid="section-engine-split">
          <SectionNumber num="03" />
          <div style={{ ...S.eyebrow, color: V.muted }}>
            Visibility by AI Engine · {t.meta.queriesPerEngine} queries each
          </div>
          {t.engineSplit.map((eng) => {
            const pct = Math.round(eng.appearanceRate * 100);
            const c = colorMap[eng.color] || V.gold;
            return (
              <div
                key={eng.engine}
                data-stagger
                style={{ padding: "20px 0", borderBottom: `1px solid ${V.border}` }}
                data-testid={`engine-row-${eng.engine}`}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "100px 1fr 56px",
                    gap: 16,
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 14,
                      color: V.textBright,
                      letterSpacing: "0.04em",
                      fontWeight: 500,
                    }}
                  >
                    {eng.label}
                  </div>
                  <div
                    style={{
                      height: 7,
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      ref={animBar}
                      data-width={`${pct}%`}
                      style={{
                        height: "100%",
                        borderRadius: 4,
                        background: c,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 16,
                      fontWeight: 600,
                      textAlign: "right",
                      color: c,
                    }}
                  >
                    {pct}%
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: eng.color === "red" ? V.red : V.mutedMd,
                    lineHeight: 1.6,
                    paddingLeft: 116,
                  }}
                  dangerouslySetInnerHTML={{
                    __html: eng.note.replace(
                      /<strong>/g,
                      `<strong style="color:${V.text};font-weight:500;">`
                    ),
                  }}
                />
              </div>
            );
          })}
        </div>

        <div style={{ ...S.divider, height: 2, background: `linear-gradient(90deg, ${V.borderMd} 0%, transparent 80%)` }} />

        {/* 04 · Engine × Segment Heatmap */}
        {t.engineSegmentHeatmap && t.engineSegmentHeatmap.length > 0 && (
          <div ref={reveal} style={{ marginBottom: 100 }} data-testid="section-heatmap">
            <SectionNumber num="04" />
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 26,
                fontWeight: 700,
                color: "#fff",
                marginBottom: 12,
                lineHeight: 1.2,
              }}
              data-testid="heading-heatmap"
            >
              Visibility Heatmap
            </h2>
            <p style={{ fontSize: 14, color: V.mutedMd, marginBottom: 28, maxWidth: 560, lineHeight: 1.75 }}>
              {brandName}'s appearance rate by engine and search context. Green = strong. Red = invisible.
            </p>
            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: 500 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `180px repeat(${Object.keys(t.engineSegmentHeatmap[0]?.engines || {}).length}, 1fr)`,
                    gap: 0,
                  }}
                >
                  <div style={{ padding: "10px 12px" }} />
                  {Object.keys(t.engineSegmentHeatmap[0]?.engines || {}).map(eng => (
                    <div
                      key={eng}
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 10,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: V.mutedMd,
                        textAlign: "center",
                        padding: "10px 8px",
                      }}
                    >
                      {ENGINE_LABELS_MAP[eng] || eng}
                    </div>
                  ))}
                  {t.engineSegmentHeatmap.map((row, ri) => {
                    const engines = Object.entries(row.engines);
                    return engines.map(([eng, pct], ci) => (
                      ci === 0 ? (
                        <div key={`row-${ri}`} style={{ display: "contents" }}>
                          <div
                            style={{
                              fontSize: 11,
                              color: V.text,
                              padding: "10px 12px",
                              borderTop: `1px solid ${V.border}`,
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {row.segmentLabel.length > 28 ? row.segmentLabel.slice(0, 28) + "..." : row.segmentLabel}
                          </div>
                          {engines.map(([e, p]) => {
                            const heatColor = p >= 70 ? V.green : p >= 30 ? V.gold : p > 0 ? V.red : "rgba(255,255,255,0.06)";
                            const textColor = p >= 70 ? "#fff" : p >= 30 ? "#fff" : p > 0 ? "#fff" : V.muted;
                            return (
                              <div
                                key={e}
                                style={{
                                  textAlign: "center",
                                  padding: "10px 8px",
                                  borderTop: `1px solid ${V.border}`,
                                  background: `${heatColor}18`,
                                }}
                              >
                                <span
                                  style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: heatColor,
                                  }}
                                >
                                  {p}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : null
                    ));
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ ...S.divider, height: 2, background: `linear-gradient(90deg, transparent 10%, ${V.borderMd} 50%, transparent 90%)` }} />

        {/* 05 · How AI Describes You vs Competitors (moved up) */}
        <div ref={reveal} style={{ marginBottom: 100 }} data-testid="section-quote-contrast">
          <SectionNumber num="05" />
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 26,
              fontWeight: 700,
              color: "#fff",
              marginBottom: 12,
              lineHeight: 1.2,
            }}
            data-testid="heading-quote-contrast"
          >
            How AI Describes You vs. Competitors
          </h2>
          <p style={{ fontSize: 14, color: V.mutedMd, marginBottom: 32, maxWidth: 560, lineHeight: 1.75 }}>
            AI engines build a "defining sentence" for every brand they recommend.
            This is the narrative that shapes whether a prospect picks you or someone else.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {visibleQuoteComps.map((comp, i) => (
              <div
                key={i}
                data-stagger
                style={{
                  background: V.surface,
                  border: `1px solid ${V.border}`,
                  borderRadius: 3,
                  padding: "28px 32px",
                }}
                data-testid={`quote-comp-${i}`}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: V.gold, letterSpacing: "0.12em" }}>
                    #{comp.rank} COMPETITOR
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: V.textBright }}>{comp.name}</span>
                </div>
                <div style={{ fontSize: 14, color: V.text, lineHeight: 1.7, fontStyle: "italic", borderLeft: `2px solid ${V.gold}`, paddingLeft: 16, marginBottom: 8 }}>
                  {comp.sentence}
                </div>
                {comp.engines.length > 0 && (
                  <div style={{ fontSize: 11, color: V.muted, fontFamily: "'JetBrains Mono', monospace" }}>
                    Cited by: {comp.engines.join(", ")}
                  </div>
                )}
              </div>
            ))}

            {t.quoteContrast.brand.hasSentence && (
              <div
                data-stagger
                style={{
                  background: "rgba(201,168,76,0.04)",
                  border: `1px solid rgba(201,168,76,0.18)`,
                  borderRadius: 3,
                  padding: "28px 32px",
                }}
                data-testid="quote-brand"
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ ...S.tag, color: V.gold, borderColor: "rgba(201,168,76,0.3)", background: V.goldDim }}>YOUR BRAND</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: V.gold }}>{brandName}</span>
                </div>
                <div style={{ fontSize: 14, color: V.text, lineHeight: 1.7, fontStyle: "italic", borderLeft: `2px solid ${V.borderMd}`, paddingLeft: 16 }}>
                  {t.quoteContrast.brand.sentence}
                </div>
              </div>
            )}
          </div>

          {lockedQuoteComps.length > 0 && (
            <div style={{ position: "relative", marginTop: 10 }}>
              <div style={{ filter: "blur(8px)", pointerEvents: "none", userSelect: "none", opacity: 0.2 }}>
                {lockedQuoteComps.map((comp, i) => (
                  <div key={i} style={{ background: V.surface, border: `1px solid ${V.border}`, borderRadius: 3, padding: "28px 32px", marginBottom: 10 }}>
                    <div style={{ fontSize: 14, color: V.textBright }}>{"\u2588".repeat(10)}</div>
                    <div style={{ fontSize: 13, color: V.mutedMd, marginTop: 8 }}>{"\u2588".repeat(28)}</div>
                  </div>
                ))}
              </div>
              <LockedOverlay count={lockedQuoteComps.length} label="more competitor narratives" />
            </div>
          )}
        </div>

        <div style={{ ...S.divider, height: 2, background: `linear-gradient(90deg, transparent 10%, ${V.borderMd} 50%, transparent 90%)` }} />

        {/* 06 · Prompt Showdown */}
        {t.promptShowdown && t.promptShowdown.length > 0 && (
          <div ref={reveal} style={{ marginBottom: 100 }} data-testid="section-prompt-showdown">
            <SectionNumber num="06" />
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 26,
                fontWeight: 700,
                color: "#fff",
                marginBottom: 12,
                lineHeight: 1.2,
              }}
              data-testid="heading-prompt-showdown"
            >
              Prompt Showdown
            </h2>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: "0.08em",
              color: V.gold,
              marginBottom: 14,
              padding: "8px 14px",
              background: V.goldDim,
              border: `1px solid rgba(201,168,76,0.18)`,
              borderRadius: 3,
              display: "inline-block",
              fontWeight: 600,
            }} data-testid="text-total-prompts">
              {t.meta.totalQueries} PROMPTS TESTED ACROSS {t.engineSplit.length} ENGINES
            </div>
            <p style={{ fontSize: 14, color: V.mutedMd, marginBottom: 32, maxWidth: 560, lineHeight: 1.75 }}>
              We tested {t.meta.totalQueries} real prompts across {t.engineSplit.length} AI engines.
              Here are {t.promptShowdown.length} samples from different search contexts — who wins each one.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {t.promptShowdown.slice(0, 3).map((prompt, pi) => (
                <div
                  key={pi}
                  data-stagger
                  style={{
                    background: V.surface,
                    border: `1px solid ${V.border}`,
                    borderRadius: 3,
                    padding: "24px 28px",
                  }}
                  data-testid={`showdown-${pi}`}
                >
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    color: V.goldLight,
                    marginBottom: 16,
                    lineHeight: 1.5,
                    borderLeft: `2px solid ${V.gold}`,
                    paddingLeft: 14,
                  }}>
                    "{prompt.promptText}"
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {prompt.results.map((r, ri) => (
                      <div
                        key={ri}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "90px 1fr 120px",
                          gap: 12,
                          alignItems: "center",
                          padding: "8px 12px",
                          borderRadius: 2,
                          background: r.brandFound ? "rgba(201,168,76,0.04)" : "rgba(217,95,95,0.04)",
                          border: `1px solid ${r.brandFound ? "rgba(201,168,76,0.12)" : "rgba(217,95,95,0.12)"}`,
                        }}
                      >
                        <div style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 11,
                          color: V.mutedMd,
                          letterSpacing: "0.06em",
                        }}>
                          {r.engineLabel}
                        </div>
                        <div style={{ fontSize: 12, color: V.text }}>
                          Top result: <span style={{ color: V.textBright, fontWeight: 500 }}>{r.topResult}</span>
                        </div>
                        <div style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 11,
                          textAlign: "right",
                          color: r.brandFound ? V.gold : V.red,
                          fontWeight: 500,
                        }}>
                          {r.brandFound
                            ? `${brandName} #${r.brandRank}`
                            : `Not found`}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{
                    marginTop: 14,
                    fontSize: 11,
                    color: V.muted,
                    fontFamily: "'JetBrains Mono', monospace",
                    borderTop: `1px solid ${V.border}`,
                    paddingTop: 12,
                  }} data-testid={`repro-${pi}`}>
                    Try it yourself: paste this exact prompt into ChatGPT, Gemini, or Claude.
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 12,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: V.muted,
              letterSpacing: "0.08em",
            }}>
              {t.promptShowdown.length} of {t.meta.totalQueries} prompts shown &middot; full audit includes all {t.meta.totalQueries} with rankings
            </div>
          </div>
        )}

        <div style={{ ...S.divider, height: 2, background: `linear-gradient(90deg, transparent 10%, ${V.borderMd} 50%, transparent 90%)` }} />

        {/* 07 · Citation Scale + Authority Sources */}
        <div ref={reveal} style={{ marginBottom: 100 }} data-testid="section-citation-authority">
          <SectionNumber num="07" />
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 26,
              fontWeight: 700,
              color: "#fff",
              marginBottom: 12,
              lineHeight: 1.2,
            }}
            data-testid="heading-citations"
          >
            Citation & Authority Analysis
          </h2>
          <p style={{ fontSize: 14, color: V.mutedMd, marginBottom: 28, maxWidth: 560, lineHeight: 1.75 }}>
            We crawled {t.citationScale?.totalCitationsCrawled || 0} cited pages referenced by AI answers across {t.citationScale?.totalRuns || 0} runs.
            Here's where {brandName} shows up — and where it doesn't.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 32 }}>
            {[
              { num: t.citationScale?.totalCitationsCrawled || 0, label: "citations crawled" },
              { num: t.citationScale?.totalCitationPages || 0, label: "unique domains" },
              { num: t.authorityGap.domains.length, label: "authority sources tracked" },
            ].map((stat, i) => (
              <div
                key={i}
                data-stagger
                style={{
                  background: V.surface,
                  border: `1px solid ${V.border}`,
                  borderRadius: 3,
                  padding: "22px 20px",
                  textAlign: "center",
                }}
              >
                <div style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 28,
                  fontWeight: 700,
                  color: V.goldLight,
                  marginBottom: 4,
                }}>
                  {stat.num.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: V.mutedMd, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.06em" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {t.authorityGap.domains.length > 0 && (
            <>
              <div style={{ ...S.eyebrow, color: V.muted, marginBottom: 14 }}>
                Top authority sources · {brandName} present on {t.authorityGap.domains.length - t.authorityGap.brandAbsentCount} of {t.authorityGap.domains.length}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `160px repeat(${authColumnNames.length}, 1fr)`,
                    gap: 8,
                    padding: "10px 14px",
                    borderBottom: `1px solid ${V.border}`,
                    marginBottom: 4,
                  }}
                >
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: V.muted }}>
                    Source
                  </div>
                  {authColumnNames.map((name) => (
                    <div key={name} style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase",
                      color: name === brandName ? V.gold : V.muted, textAlign: "center",
                    }}>
                      {name.length > 10 ? name.slice(0, 10) + ".." : name}
                    </div>
                  ))}
                </div>
                {visibleAuthDomains.map((domain, i) => (
                  <div
                    key={i}
                    data-stagger
                    style={{
                      display: "grid",
                      gridTemplateColumns: `160px repeat(${authColumnNames.length}, 1fr)`,
                      gap: 8, padding: "12px 14px",
                      borderBottom: `1px solid ${V.border}`,
                      background: "rgba(201,168,76,0.03)",
                    }}
                    data-testid={`auth-row-${i}`}
                  >
                    <div>
                      <div style={{ fontSize: 12, color: V.textBright, fontWeight: 500, marginBottom: 2 }}>{domain.domain}</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: V.muted }}>{domain.tier}</div>
                    </div>
                    {authColumnNames.map((name) => {
                      const present = domain.presence[name];
                      return (
                        <div key={name} style={{ textAlign: "center" }}>
                          <span style={{ fontSize: 14, color: present ? V.green : V.red, opacity: present ? 1 : 0.5 }}>
                            {present ? "\u2713" : "\u2717"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              {lockedAuthDomains.length > 0 && (
                <div style={{ position: "relative", marginTop: 4 }}>
                  <div style={{ filter: "blur(8px)", pointerEvents: "none", userSelect: "none", opacity: 0.2 }}>
                    {lockedAuthDomains.slice(0, 3).map((domain, i) => (
                      <div key={i} style={{
                        display: "grid",
                        gridTemplateColumns: `160px repeat(${authColumnNames.length}, 1fr)`,
                        gap: 8, padding: "12px 14px",
                        borderBottom: `1px solid ${V.border}`,
                      }}>
                        <div style={{ fontSize: 12, color: V.textBright }}>{i === 0 ? domain.domain : "\u2588".repeat(8)}</div>
                        {authColumnNames.map((name, j) => (
                          <div key={j} style={{ textAlign: "center", color: V.muted, fontSize: 14 }}>{"\u2588"}</div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <LockedOverlay count={lockedAuthDomains.length} label="more authority sources with coverage mapping" />
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ ...S.divider, height: 2, background: `linear-gradient(90deg, transparent 20%, ${V.borderMd} 50%, transparent 80%)` }} />

        <div ref={reveal} style={{ marginBottom: 100 }} data-testid="section-competitive-ranking">
          <SectionNumber num="08" />
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 26,
              fontWeight: 700,
              color: "#fff",
              marginBottom: 12,
              lineHeight: 1.2,
            }}
            data-testid="heading-competitive-ranking"
          >
            Competitive Ranking
          </h2>
          <div style={{ ...S.eyebrow, color: V.muted, marginBottom: 24 }}>
            Top {t.competitiveRanking.length} brands by AI share of voice
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {t.competitiveRanking.map((entry, i) => {
              const isBrand = entry.isBrand;
              const isTop5 = entry.rank <= 5;
              const showName = isBrand || isTop5;
              const showProximity = isBrand && t.proximityNote;

              return (
                <div
                  key={i}
                  data-stagger
                  style={{
                    display: "grid",
                    gridTemplateColumns: "32px 1fr 1fr 56px",
                    gap: 14,
                    alignItems: "center",
                    padding: isBrand ? "18px 18px" : "14px 18px",
                    borderBottom: `1px solid ${V.border}`,
                    background: isBrand ? "rgba(201,168,76,0.06)" : "transparent",
                    borderLeft: isBrand ? `3px solid ${V.gold}` : "3px solid transparent",
                    boxShadow: isBrand ? "inset 0 0 30px rgba(201,168,76,0.04)" : "none",
                  }}
                  data-testid={`ranking-row-${i}`}
                >
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      color: isBrand ? V.gold : V.muted,
                      textAlign: "center",
                    }}
                  >
                    #{entry.rank}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: isBrand ? 600 : 400,
                        color: isBrand ? V.gold : showName ? V.textBright : V.muted,
                      }}
                    >
                      {showName ? entry.name : "\u2588".repeat(6 + (i % 3))}
                      {isBrand && (
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 8,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            marginLeft: 8,
                            padding: "2px 6px",
                            borderRadius: 2,
                            background: V.goldDim,
                            color: V.gold,
                            border: `1px solid rgba(201,168,76,0.2)`,
                          }}
                        >
                          You
                        </span>
                      )}
                    </div>
                    {showProximity && (
                      <div
                        style={{
                          fontSize: 10,
                          color: V.mutedMd,
                          fontFamily: "'JetBrains Mono', monospace",
                          marginTop: 3,
                        }}
                      >
                        {t.proximityNote}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        flex: 1,
                        height: 5,
                        background: "rgba(255,255,255,0.05)",
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        ref={animBar}
                        data-width={`${entry.share}%`}
                        style={{
                          height: "100%",
                          borderRadius: 3,
                          background: isBrand ? V.gold : V.borderMd,
                        }}
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 13,
                      fontWeight: 500,
                      textAlign: "right",
                      color: isBrand ? V.gold : showName ? V.text : V.muted,
                    }}
                  >
                    {showName ? `${entry.share}%` : "\u2588\u2588%"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>


        <div style={{ ...S.divider, height: 2, background: `linear-gradient(90deg, transparent 10%, ${V.borderMd} 50%, transparent 90%)` }} />

        {/* 10 · Segments */}
        <div ref={reveal} style={{ marginBottom: 100 }} data-testid="section-segments">
          <SectionNumber num="09" />
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 26,
              fontWeight: 700,
              color: "#fff",
              marginBottom: 12,
              lineHeight: 1.2,
            }}
            data-testid="heading-customer-type"
          >
            Visibility by Search Context
          </h2>
          <div style={{ ...S.eyebrow, color: V.muted, marginBottom: 24 }}>
            How AI ranks you across different queries
          </div>
          <p
            style={{
              fontSize: 14,
              color: V.mutedMd,
              marginBottom: 28,
              maxWidth: 580,
              lineHeight: 1.75,
            }}
          >
            Overall rank is a blunt instrument. Here's how {brandName} performs when AI is asked
            about different service types and customer personas — SEO agency, performance marketing,
            enterprise clients, ecommerce, financial services, and more. Who beats you, by how much,
            and where you're closest to breaking through.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "190px 48px 1fr 100px 130px",
                gap: 14,
                alignItems: "center",
                padding: "13px 18px",
                borderBottom: `1px solid ${V.border}`,
                paddingBottom: 10,
                marginBottom: 4,
              }}
            >
              {["Search Context", "Rank", "Visibility", "Score", "Gap to #1"].map((h, i) => (
                <div
                  key={h}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: V.muted,
                    textAlign: i >= 3 ? "right" : i === 1 ? "center" : "left",
                  }}
                >
                  {h}
                </div>
              ))}
            </div>

            {visibleSegments.map((seg, i) => {
              const c = segColor(seg.brandVisibility);
              return (
                <div
                  key={i}
                  data-stagger
                  style={{
                    display: "grid",
                    gridTemplateColumns: "190px 48px 1fr 100px 130px",
                    gap: 14,
                    alignItems: "center",
                    padding: "15px 18px",
                    borderRadius: 2,
                    border: "1px solid rgba(201,168,76,0.15)",
                    background: "rgba(201,168,76,0.05)",
                    marginBottom: 3,
                  }}
                  data-testid={`segment-row-${i}`}
                >
                  <div style={{ fontSize: 12.5, color: V.gold, fontWeight: 500 }}>
                    {seg.label}
                    <span
                      style={{
                        display: "inline-block",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 8,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        padding: "2px 6px",
                        borderRadius: 2,
                        marginLeft: 6,
                        verticalAlign: "middle",
                        ...oppBadgeStyle(seg.opportunity),
                      }}
                    >
                      {oppLabel(seg.opportunity)}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 13,
                      fontWeight: 500,
                      textAlign: "center",
                      color: c,
                    }}
                  >
                    #{seg.brandRank}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        flex: 1,
                        height: 3,
                        background: "rgba(255,255,255,0.05)",
                        borderRadius: 2,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        ref={animBar}
                        data-width={`${seg.brandVisibility}%`}
                        style={{
                          height: "100%",
                          borderRadius: 2,
                          background: c,
                        }}
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12,
                      color: V.mutedMd,
                      whiteSpace: "nowrap",
                      textAlign: "right",
                    }}
                  >
                    {seg.brandVisibility}%
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontFamily: "'JetBrains Mono', monospace",
                        whiteSpace: "nowrap",
                        color: seg.gapPoints <= 15 ? V.gold : V.mutedMd,
                      }}
                    >
                      -{seg.gapPoints}pts
                    </div>
                    <div
                      style={{ fontSize: 10, color: V.muted, marginTop: 2, whiteSpace: "nowrap" }}
                    >
                      {seg.leaderName} {seg.leaderScore}%
                    </div>
                  </div>
                </div>
              );
            })}

            {lockedSegments.length > 0 && (
              <div style={{ position: "relative", marginTop: 3 }}>
                <div
                  style={{
                    filter: "blur(8px)",
                    pointerEvents: "none",
                    userSelect: "none",
                    opacity: 0.2,
                  }}
                >
                  {lockedSegments.slice(0, 3).map((seg, i) => (
                    <div
                      key={i}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "190px 48px 1fr 100px 130px",
                        gap: 14,
                        alignItems: "center",
                        padding: "15px 18px",
                        borderRadius: 2,
                        border: "1px solid rgba(201,168,76,0.15)",
                        background: "rgba(201,168,76,0.05)",
                        marginBottom: 3,
                      }}
                    >
                      <div style={{ fontSize: 12.5, color: V.gold, fontWeight: 500 }}>
                        {i === 0 ? seg.label : "\u2588".repeat(8)}
                      </div>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 13,
                          fontWeight: 500,
                          textAlign: "center",
                          color: V.gold,
                        }}
                      >
                        #{i === 0 ? seg.brandRank : "\u2588"}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            flex: 1,
                            height: 3,
                            background: "rgba(255,255,255,0.05)",
                            borderRadius: 2,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${i === 0 ? seg.brandVisibility : 30 - i * 5}%`,
                              height: "100%",
                              background: V.muted,
                              borderRadius: 2,
                            }}
                          />
                        </div>
                      </div>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 12,
                          color: V.mutedMd,
                        }}
                      >
                        {i === 0 ? `${seg.brandVisibility}%` : "\u2588\u2588%"}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
                          {i === 0 ? `-${seg.gapPoints}pts` : `-\u2588\u2588pts`}
                        </div>
                        <div style={{ fontSize: 10, color: V.muted, marginTop: 2 }}>
                          {i === 0 ? `${seg.leaderName} ${seg.leaderScore}%` : `\u2588\u2588\u2588\u2588\u2588 \u2588\u2588%`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <LockedOverlay count={lockedSegments.length} label="more search contexts · ranks, scores & gap analysis" />
              </div>
            )}
          </div>
        </div>


        {/* CTA — See full analysis (blocks the rest of the report) */}
        <div
          ref={reveal}
          style={{
            textAlign: "center",
            padding: "80px 48px",
            border: `1px solid rgba(201,168,76,0.15)`,
            borderTop: `2px solid ${V.gold}`,
            borderRadius: 3,
            background: V.surface,
            position: "relative",
            overflow: "hidden",
            marginTop: 60,
            boxShadow: "0 0 60px rgba(201,168,76,0.04)",
          }}
          data-testid="section-cta"
        >
          <div
            style={{
              position: "absolute",
              bottom: -80,
              left: "50%",
              transform: "translateX(-50%)",
              width: 400,
              height: 400,
              background:
                "radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 65%)",
              pointerEvents: "none",
            }}
          />

          {!showSurvey && !surveySubmitted && (
            <>
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 30,
                  fontWeight: 700,
                  color: "#fff",
                  lineHeight: 1.25,
                  marginBottom: 18,
                }}
              >
                Win AI recommendations
              </h2>
              <p
                style={{
                  fontSize: 15,
                  color: V.text,
                  maxWidth: 480,
                  margin: "0 auto 40px",
                  lineHeight: 1.75,
                }}
              >
                This preview is a snapshot. The full audit includes the full prompt set, engine-by-engine
                transcripts, segment breakdowns, competitor narrative analysis, an authority roadmap,
                and a prioritized fix plan to improve what AI says about {brandName}.
              </p>
              <button
                onClick={() => setShowSurvey(true)}
                style={{
                  display: "inline-block",
                  background: `linear-gradient(135deg, ${V.gold} 0%, ${V.goldLight} 100%)`,
                  color: V.bg,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  padding: "18px 52px",
                  borderRadius: 3,
                  cursor: "pointer",
                  border: "none",
                  boxShadow: "0 4px 20px rgba(201,168,76,0.25)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 28px rgba(201,168,76,0.35)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(201,168,76,0.25)"; }}
                data-testid="button-cta"
              >
                Request the Full Audit
              </button>
            </>
          )}

          {showSurvey && !surveySubmitted && (
            <div style={{ textAlign: "left", maxWidth: 520, margin: "0 auto" }} data-testid="section-survey">
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 26,
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: 8,
                  lineHeight: 1.2,
                }}
                data-testid="heading-survey"
              >
                Anything else I can help with?
              </h2>
              <p
                style={{
                  fontSize: 13,
                  color: V.mutedMd,
                  marginBottom: 32,
                  maxWidth: 480,
                  lineHeight: 1.7,
                }}
              >
                Select any that apply — we'll follow up with relevant information.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                {[
                  { val: "regular_report", label: "I want this report regularly" },
                  { val: "improve_visibility", label: "I want to improve my AI visibility" },
                  { val: "other_automations", label: "I want help with other automations" },
                  { val: "analysis_for_others", label: "I want to do this analysis for others" },
                ].map((opt) => {
                  const selected = selectedInterests.includes(opt.val);
                  return (
                    <div
                      key={opt.val}
                      onClick={() => toggleInterest(opt.val)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: "16px 20px",
                        borderRadius: 3,
                        border: `1px solid ${selected ? "rgba(201,168,76,0.35)" : V.border}`,
                        background: selected ? "rgba(201,168,76,0.06)" : "transparent",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      data-testid={`survey-option-${opt.val}`}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 3,
                          border: `1.5px solid ${selected ? V.gold : V.borderMd}`,
                          background: selected ? V.gold : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transition: "all 0.2s ease",
                        }}
                      >
                        {selected && (
                          <span style={{ color: V.bg, fontSize: 12, fontWeight: 700, lineHeight: 1 }}>&#10003;</span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 14,
                          color: selected ? V.goldLight : V.text,
                          fontWeight: selected ? 500 : 300,
                        }}
                      >
                        {opt.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginBottom: 28 }}>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: V.muted,
                    marginBottom: 10,
                  }}
                >
                  Comments (optional)
                </div>
                <textarea
                  value={surveyComments}
                  onChange={(e) => setSurveyComments(e.target.value)}
                  placeholder="Anything specific you'd like us to know..."
                  rows={3}
                  style={{
                    width: "100%",
                    background: V.bg,
                    border: `1px solid ${V.border}`,
                    borderRadius: 3,
                    padding: "14px 16px",
                    color: V.text,
                    fontSize: 13,
                    fontFamily: "'DM Sans', sans-serif",
                    lineHeight: 1.6,
                    resize: "vertical",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  data-testid="input-survey-comments"
                />
              </div>

              <button
                onClick={submitSurvey}
                disabled={selectedInterests.length === 0 || surveySubmitting}
                style={{
                  display: "inline-block",
                  background: selectedInterests.length > 0 ? V.gold : V.borderMd,
                  color: selectedInterests.length > 0 ? V.bg : V.muted,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  padding: "14px 36px",
                  borderRadius: 2,
                  cursor: selectedInterests.length > 0 ? "pointer" : "default",
                  border: "none",
                  opacity: surveySubmitting ? 0.6 : 1,
                  transition: "all 0.2s ease",
                }}
                data-testid="button-survey-submit"
              >
                {surveySubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          )}

          {surveySubmitted && (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
              }}
              data-testid="survey-success"
            >
              <div style={{ fontSize: 28, marginBottom: 12 }}>&#10003;</div>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: 8,
                }}
              >
                Thank you!
              </div>
              <div style={{ fontSize: 13, color: V.mutedMd }}>
                We'll be in touch shortly.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

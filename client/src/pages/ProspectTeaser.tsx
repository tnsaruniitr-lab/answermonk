import { useEffect, useRef, useCallback } from "react";
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
}

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
            (entry.target as HTMLElement).style.opacity = "1";
            (entry.target as HTMLElement).style.transform = "translateY(0)";
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
      el.style.transform = "translateY(18px)";
      el.style.transition = "opacity 0.65s ease, transform 0.65s ease";
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
    margin: "64px 0",
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

export default function ProspectTeaser() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id;
  const [location] = useLocation();
  const isShare = location.includes("/share/teaser/");

  const apiUrl = `/api/share/teaser/${sessionId}`;

  const { data, isLoading, error } = useQuery<{ teaser: TeaserData }>({
    queryKey: ["/api/share/teaser", sessionId],
    queryFn: async () => {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error("Failed to load teaser");
      return res.json();
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!document.querySelector('link[href*="Playfair+Display"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=JetBrains+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  const reveal = useScrollReveal();
  const animBar = useAnimatedBars();

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
        <style>{`@keyframes teaser-spin { to { transform: rotate(360deg); } }`}</style>
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

  const visibleSegments = t.segmentBreakdown.slice(0, 3);
  const lockedSegments = t.segmentBreakdown.slice(3);

  const visibleAuthDomains = t.authorityGap.domains.slice(0, 4);
  const lockedAuthDomains = t.authorityGap.domains.slice(4);

  const visiblePrompts = t.samplePrompts.slice(0, 4);
  const lockedPrompts = t.samplePrompts.slice(4);

  const visibleThreads = t.socialThreads.slice(0, 2);
  const lockedThreads = t.socialThreads.slice(2);

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
        {/* Header */}
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
            AI Search Visibility ·{" "}
            <span style={{ color: V.gold }}>{brandName}</span>
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

        {/* Hook */}
        <div ref={reveal} style={{ marginBottom: 80 }} data-testid="section-hook">
          <div style={{ ...S.eyebrow, color: V.gold }}>AI Search Visibility Audit</div>
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

        {/* Score Card */}
        <div
          ref={reveal}
          style={{
            background: V.surface,
            border: `1px solid ${V.border}`,
            borderRadius: 3,
            padding: "44px 48px",
            marginBottom: 80,
            position: "relative",
            overflow: "hidden",
          }}
          data-testid="section-score-card"
        >
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
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 88,
              fontWeight: 700,
              color: V.goldLight,
              lineHeight: 1,
              marginBottom: 6,
            }}
            data-testid="text-score-num"
          >
            {t.overallScore.appearanceRate}
            <sup style={{ fontSize: 40, verticalAlign: "super" }}>%</sup>
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
            <div style={{ paddingRight: 24 }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 24,
                  fontWeight: 500,
                  color: V.textBright,
                  marginBottom: 5,
                }}
                data-testid="text-market-rank"
              >
                #{t.overallScore.marketRank}
              </div>
              <div style={{ fontSize: 11, color: V.muted, lineHeight: 1.4 }}>
                Overall market rank
                <br />
                out of {t.overallScore.competitorCount} competitors
              </div>
            </div>
            <div style={{ paddingRight: 24 }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 24,
                  fontWeight: 500,
                  color: V.textBright,
                  marginBottom: 5,
                }}
                data-testid="text-avg-rank"
              >
                #{t.overallScore.avgRank != null ? t.overallScore.avgRank : "N/A"}
              </div>
              <div style={{ fontSize: 11, color: V.muted, lineHeight: 1.4 }}>
                Avg rank when mentioned
                <br />
                across all engines
              </div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 24,
                  fontWeight: 500,
                  color: V.textBright,
                  marginBottom: 5,
                }}
                data-testid="text-primary-rate"
              >
                {t.overallScore.primaryRate}%
              </div>
              <div style={{ fontSize: 11, color: V.muted, lineHeight: 1.4 }}>
                Top-3 recommendation rate
                <br />
                leader is at {t.overallScore.leaderRate}%
              </div>
            </div>
          </div>
        </div>

        {/* Engine Split */}
        <div ref={reveal} style={{ marginBottom: 80 }} data-testid="section-engine-split">
          <div style={{ ...S.eyebrow, color: V.muted }}>
            Visibility by AI Engine · {t.meta.queriesPerEngine} queries each
          </div>
          {t.engineSplit.map((eng) => {
            const pct = Math.round(eng.appearanceRate * 100);
            const c = colorMap[eng.color] || V.gold;
            return (
              <div
                key={eng.engine}
                style={{ padding: "18px 0", borderBottom: `1px solid ${V.border}` }}
                data-testid={`engine-row-${eng.engine}`}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "88px 1fr 48px",
                    gap: 16,
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12,
                      color: V.text,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {eng.label}
                  </div>
                  <div
                    style={{
                      height: 3,
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      ref={animBar}
                      data-width={`${pct}%`}
                      style={{
                        height: "100%",
                        borderRadius: 2,
                        background: c,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 14,
                      fontWeight: 500,
                      textAlign: "right",
                      color: c,
                    }}
                  >
                    {pct}%
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: eng.color === "red" ? V.red : V.muted,
                    lineHeight: 1.5,
                    paddingLeft: 104,
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

        <div style={S.divider} />

        {/* AI Quote Contrast */}
        <div ref={reveal} style={{ marginBottom: 80 }} data-testid="section-quote-contrast">
          <div style={{ ...S.eyebrow, color: V.muted }}>
            The Sentence That Wins Recommendations
          </div>
          <p
            style={{
              fontSize: 14,
              color: V.mutedMd,
              marginBottom: 28,
              maxWidth: 560,
              lineHeight: 1.75,
            }}
          >
            Every brand that consistently ranks in AI answers has one thing in common: a single
            sentence AI repeats about them, unprompted, across every engine. It becomes the
            shorthand that drives selection. Here's what exists today.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            {t.quoteContrast.competitors.map((comp) => (
              <div
                key={comp.name}
                style={{
                  background: V.surface,
                  border: `1px solid ${V.border}`,
                  borderRadius: 3,
                  padding: "28px 30px",
                  position: "relative",
                }}
                data-testid={`quote-card-${comp.name}`}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: V.borderMd,
                  }}
                />
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    color: V.muted,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    marginBottom: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      ...S.tag,
                      color: V.mutedMd,
                      borderColor: V.borderMd,
                    }}
                  >
                    #{comp.rank}
                  </span>
                  {comp.name}
                </div>
                <div
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 14,
                    fontStyle: "italic",
                    color: V.textBright,
                    lineHeight: 1.65,
                    marginBottom: 14,
                  }}
                >
                  {comp.sentence}
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    color: V.muted,
                    letterSpacing: "0.1em",
                  }}
                >
                  {comp.engines.join(" · ")} —{" "}
                  {comp.engines.length >= 3
                    ? "consistent across all 3 engines"
                    : `consistent narrative, ${comp.engines.length} engines`}
                </div>
              </div>
            ))}

            {/* Brand quote card */}
            <div
              style={{
                background: V.surface,
                border: `1px solid ${V.border}`,
                borderRadius: 3,
                padding: "28px 30px",
                position: "relative",
              }}
              data-testid="quote-card-brand"
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: V.red,
                  opacity: 0.6,
                }}
              />
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: V.muted,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  marginBottom: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    ...S.tag,
                    color: V.red,
                    borderColor: "rgba(217,95,95,0.3)",
                    background: V.redDim,
                  }}
                >
                  You
                </span>
                {brandName}
              </div>
              {t.quoteContrast.brand.hasSentence ? (
                <div
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 14,
                    fontStyle: "italic",
                    color: V.textBright,
                    lineHeight: 1.65,
                    marginBottom: 14,
                  }}
                >
                  {t.quoteContrast.brand.sentence}
                </div>
              ) : (
                <>
                  <div
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 14,
                      fontStyle: "italic",
                      color: V.muted,
                      lineHeight: 1.65,
                      marginBottom: 14,
                      borderBottom: "1px dashed rgba(255,255,255,0.1)",
                      paddingBottom: 12,
                      minHeight: 60,
                      display: "flex",
                      alignItems: "flex-end",
                    }}
                  >
                    No consistent AI-assigned identity detected across any engine.
                  </div>
                  <div style={{ fontSize: 11, color: V.red, opacity: 0.7 }}>
                    This line doesn't exist yet. The full report defines exactly what it should say
                    — and how to make AI repeat it.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Competitive Ranking */}
        <div ref={reveal} style={{ marginBottom: 80 }} data-testid="section-competitive-ranking">
          <div style={{ ...S.eyebrow, color: V.muted }}>
            Competitive Ranking · Overall Visibility
          </div>
          {t.competitiveRanking.map((entry, i) => {
            const isBrand = entry.isBrand;
            const brandIdx = t.competitiveRanking.findIndex((e) => e.isBrand);
            const showProximity = isBrand && t.proximityNote;

            return (
              <div key={entry.name}>
                {isBrand && i > 0 && <div style={{ height: 8 }} />}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "32px 1fr 60px",
                    gap: 16,
                    alignItems: "center",
                    padding: "14px 18px",
                    borderRadius: 2,
                    marginBottom: 3,
                    ...(isBrand
                      ? {
                          background: "rgba(201,168,76,0.06)",
                          border: "1px solid rgba(201,168,76,0.18)",
                        }
                      : {}),
                  }}
                  data-testid={`rank-row-${i}`}
                >
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      color: isBrand ? V.gold : i < brandIdx ? V.textBright : V.muted,
                    }}
                  >
                    {String(entry.rank).padStart(2, "0")}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: isBrand ? V.gold : i === 0 ? V.textBright : i < brandIdx ? V.text : V.muted,
                      fontWeight: isBrand ? 500 : 400,
                    }}
                  >
                    {entry.name}
                    {isBrand && (
                      <span style={{ fontSize: 11, fontWeight: 300, opacity: 0.7, marginLeft: 8 }}>
                        &larr; you are here
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 13,
                      textAlign: "right",
                      color: isBrand ? V.gold : i === 0 ? V.text : i < brandIdx ? V.text : V.muted,
                    }}
                  >
                    {entry.share}%
                  </div>
                </div>
                {showProximity && (
                  <div
                    style={{
                      margin: "2px 0 8px 48px",
                      fontSize: 11,
                      color: V.muted,
                      fontStyle: "italic",
                    }}
                    data-testid="text-proximity-note"
                  >
                    {t.proximityNote}
                  </div>
                )}
                {isBrand && <div style={{ height: 8 }} />}
              </div>
            );
          })}
        </div>

        <div style={S.divider} />

        {/* Segment Heatmap */}
        <div ref={reveal} style={{ marginBottom: 80 }} data-testid="section-segments">
          <div style={{ ...S.eyebrow, color: V.muted }}>Your Rank · Segment by Segment</div>
          <p
            style={{
              fontSize: 14,
              color: V.mutedMd,
              marginBottom: 28,
              maxWidth: 580,
              lineHeight: 1.75,
            }}
          >
            Overall rank is a blunt instrument. Here's where {brandName} actually stands inside
            each customer segment — who's beating you, by how much, and which segments are closest
            to a top-3 position.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Header */}
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
              {["Segment", "Rank", "Visibility", "Score", "Gap to #1"].map((h, i) => (
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
                  style={{
                    display: "grid",
                    gridTemplateColumns: "190px 48px 1fr 100px 130px",
                    gap: 14,
                    alignItems: "center",
                    padding: "13px 18px",
                    borderRadius: 2,
                    border: "1px solid rgba(201,168,76,0.15)",
                    background: "rgba(201,168,76,0.05)",
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

            {/* Locked segments */}
            {lockedSegments.length > 0 && (
              <div style={{ position: "relative", marginTop: 3 }}>
                <div
                  style={{
                    filter: "blur(4px)",
                    pointerEvents: "none",
                    userSelect: "none",
                    opacity: 0.3,
                  }}
                >
                  {lockedSegments.map((seg, i) => (
                    <div
                      key={i}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "190px 48px 1fr 100px 130px",
                        gap: 14,
                        alignItems: "center",
                        padding: "13px 18px",
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
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    background:
                      "radial-gradient(ellipse at center, rgba(7,9,15,0.45) 0%, rgba(7,9,15,0.88) 70%)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 14,
                      opacity: 0.3,
                    }}
                  >
                    &#9670;
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      color: V.mutedMd,
                      letterSpacing: "0.12em",
                    }}
                  >
                    {lockedSegments.length} more segments · ranks, scores & gap analysis in the full
                    report
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={S.divider} />

        {/* Authority Source Gap */}
        <div ref={reveal} style={{ marginBottom: 80 }} data-testid="section-authority-gap">
          <div style={{ ...S.eyebrow, color: V.muted }}>
            Authority Source Gap · Where AI retrieves from
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
            AI engines don't pick brands randomly — they retrieve from specific high-authority
            domains and cite whoever appears there. The T1 sources below are the ones that carry
            the most weight in AI recommendations across all 3 engines.
          </p>
          <table
            style={{ width: "100%", borderCollapse: "collapse" }}
            data-testid="table-authority"
          >
            <thead>
              <tr>
                <th
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: V.muted,
                    padding: "0 16px 14px",
                    textAlign: "left",
                    borderBottom: `1px solid ${V.border}`,
                    fontWeight: 400,
                    paddingLeft: 0,
                  }}
                >
                  Domain
                </th>
                {authColumnNames.map((name) => (
                  <th
                    key={name}
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: V.muted,
                      padding: "0 16px 14px",
                      textAlign: "left",
                      borderBottom: `1px solid ${V.border}`,
                      fontWeight: 400,
                    }}
                  >
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleAuthDomains.map((d, i) => (
                <tr key={i}>
                  <td
                    style={{
                      padding: "15px 16px",
                      borderBottom: `1px solid ${V.border}`,
                      fontSize: 12.5,
                      verticalAlign: "middle",
                      paddingLeft: 0,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 12,
                        color: V.textBright,
                      }}
                    >
                      {d.domain}
                    </div>
                    <div style={{ fontSize: 11, color: V.mutedMd, marginTop: 3 }}>
                      {d.description}
                    </div>
                  </td>
                  {authColumnNames.map((name) => (
                    <td
                      key={name}
                      style={{
                        padding: "15px 16px",
                        borderBottom: `1px solid ${V.border}`,
                        fontSize: 12.5,
                        verticalAlign: "middle",
                      }}
                    >
                      {d.presence[name] ? (
                        <span style={{ color: V.green, fontSize: 14 }}>&#10003;</span>
                      ) : (
                        <span
                          style={{
                            color: V.red,
                            fontSize: 13,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          —
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {lockedAuthDomains.map((d, i) => (
                <tr
                  key={`locked-${i}`}
                  style={{
                    filter: "blur(4px)",
                    pointerEvents: "none",
                    userSelect: "none",
                    opacity: 0.3,
                  }}
                >
                  <td
                    style={{
                      padding: "15px 16px",
                      borderBottom: `1px solid ${V.border}`,
                      paddingLeft: 0,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 12,
                        color: V.textBright,
                      }}
                    >
                      {d.domain}
                    </div>
                    <div style={{ fontSize: 11, color: V.mutedMd, marginTop: 3 }}>
                      {d.tier} · {"\u2588".repeat(24)}
                    </div>
                  </td>
                  {authColumnNames.map((name) => (
                    <td
                      key={name}
                      style={{
                        padding: "15px 16px",
                        borderBottom: `1px solid ${V.border}`,
                      }}
                    >
                      {d.presence[name] ? (
                        <span style={{ color: V.green, fontSize: 14 }}>&#10003;</span>
                      ) : (
                        <span style={{ color: V.red, fontSize: 13 }}>—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p
            style={{
              marginTop: 18,
              fontSize: 11,
              color: V.muted,
              fontStyle: "italic",
            }}
          >
            {brandName} is absent from {t.authorityGap.brandAbsentCount} of{" "}
            {t.authorityGap.totalT1Count > 0 ? t.authorityGap.totalT1Count : t.authorityGap.domains.length}{" "}
            T1 authority sources. Appearing on all is the single highest-leverage action available.
            Full acquisition roadmap in the complete report.
          </p>
        </div>

        {/* What AI Says About You */}
        {t.brandVoice.length > 0 && (
          <div ref={reveal} style={{ marginBottom: 80 }} data-testid="section-brand-voice">
            <div style={{ ...S.eyebrow, color: V.muted }}>
              What AI Says About {brandName} · When it does recommend you
            </div>
            <p
              style={{
                fontSize: 14,
                color: V.mutedMd,
                marginBottom: 24,
                maxWidth: 580,
                lineHeight: 1.75,
              }}
            >
              Being mentioned is one thing. What AI <em>says</em> about you when it does mention
              you determines whether a prospect clicks through or skips. Here's the language being
              used — and what's missing from it.
            </p>
            {t.brandVoice.map((voice) => (
              <div
                key={voice.engine}
                style={{
                  background: voice.isStrong ? "rgba(76,175,130,0.03)" : V.surface,
                  border: `1px solid ${voice.isStrong ? "rgba(76,175,130,0.2)" : V.border}`,
                  borderRadius: 3,
                  padding: "26px 30px",
                  marginBottom: 10,
                  position: "relative",
                }}
                data-testid={`voice-card-${voice.engine}`}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: V.muted,
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      ...S.tag,
                      ...(voice.isStrong
                        ? {
                            color: V.green,
                            borderColor: "rgba(76,175,130,0.3)",
                            background: V.greenDim,
                          }
                        : {
                            color: V.mutedMd,
                            borderColor: V.borderMd,
                          }),
                    }}
                  >
                    {voice.engineLabel}
                  </span>
                  Prompt: {voice.prompt}
                </div>
                <div
                  style={{
                    fontSize: 13.5,
                    color: V.text,
                    lineHeight: 1.7,
                    fontStyle: "italic",
                    marginBottom: 14,
                    borderLeft: `2px solid ${V.borderMd}`,
                    paddingLeft: 14,
                  }}
                >
                  {voice.quote}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: V.mutedMd,
                    lineHeight: 1.55,
                    padding: "10px 14px",
                    background: voice.isStrong
                      ? "rgba(76,175,130,0.06)"
                      : "rgba(217,95,95,0.06)",
                    borderRadius: 2,
                    borderLeft: voice.isStrong
                      ? "2px solid rgba(76,175,130,0.3)"
                      : "2px solid rgba(217,95,95,0.35)",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: voice.problem
                      .replace(
                        /<strong>/g,
                        `<strong style="color:${V.red};font-weight:400;">`
                      )
                      .replace(
                        /color: var\(--green\)/g,
                        `color:${V.green}`
                      )
                      .replace(
                        /color: var\(--red\)/g,
                        `color:${V.red}`
                      ),
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Actual Prompts */}
        {t.samplePrompts.length > 0 && (
          <div ref={reveal} style={{ marginBottom: 80 }} data-testid="section-prompts">
            <div style={{ ...S.eyebrow, color: V.muted }}>
              The Actual Queries · What your prospects are typing
            </div>
            <p
              style={{
                fontSize: 14,
                color: V.mutedMd,
                marginBottom: 24,
                maxWidth: 580,
                lineHeight: 1.75,
              }}
            >
              These are verbatim prompts used in this audit — the searches your ideal customers are
              running right now. Each one has a winner. Here's where {brandName} lands.
            </p>
            {visiblePrompts.map((p, i) => (
              <div
                key={i}
                style={{
                  background: V.surface,
                  border: `1px solid ${V.border}`,
                  borderRadius: 3,
                  padding: "22px 28px",
                  marginBottom: 8,
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 20,
                  alignItems: "start",
                }}
                data-testid={`prompt-card-${i}`}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    color: V.textBright,
                    lineHeight: 1.55,
                  }}
                >
                  <span style={{ color: V.muted }}>&gt; </span>
                  {p.promptText}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 5,
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      whiteSpace: "nowrap",
                      color: p.brandFound ? (p.brandRank && p.brandRank <= 3 ? V.green : V.gold) : V.red,
                    }}
                  >
                    {brandName}: {p.brandFound ? `#${p.brandRank}` : "Not found"}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: V.muted,
                      whiteSpace: "nowrap",
                      textAlign: "right",
                    }}
                  >
                    Winner: {p.winnerName}
                  </div>
                </div>
              </div>
            ))}

            {lockedPrompts.length > 0 && (
              <div style={{ position: "relative", marginTop: 8 }}>
                <div
                  style={{
                    filter: "blur(5px)",
                    pointerEvents: "none",
                    userSelect: "none",
                    opacity: 0.3,
                  }}
                >
                  {lockedPrompts.map((p, i) => (
                    <div
                      key={i}
                      style={{
                        background: V.surface,
                        border: `1px solid ${V.border}`,
                        borderRadius: 3,
                        padding: "22px 28px",
                        marginBottom: 8,
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        gap: 20,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 12,
                          color: V.textBright,
                        }}
                      >
                        {p.promptText}
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: V.muted }}>
                        ████
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    background:
                      "radial-gradient(ellipse at center, rgba(7,9,15,0.5) 0%, rgba(7,9,15,0.88) 70%)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 14,
                      opacity: 0.3,
                    }}
                  >
                    &#9670;
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      color: V.mutedMd,
                      letterSpacing: "0.12em",
                    }}
                  >
                    {lockedPrompts.length} more prompts in the full report
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={S.divider} />

        {/* Social Threads */}
        {t.socialThreads.length > 0 && (
          <div ref={reveal} style={{ marginBottom: 80 }} data-testid="section-social-threads">
            <div style={{ ...S.eyebrow, color: V.muted }}>
              Social Threads · Where competitors appear organically
            </div>
            {visibleThreads.map((thread, i) => (
              <div
                key={i}
                style={{
                  background: V.surface,
                  border: `1px solid ${V.border}`,
                  borderRadius: 3,
                  marginBottom: 12,
                  overflow: "hidden",
                }}
                data-testid={`thread-card-${i}`}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "14px 20px",
                    borderBottom: `1px solid ${V.border}`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: V.muted,
                    }}
                  >
                    {thread.platform}
                  </span>
                  <span
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: V.borderMd,
                    }}
                  />
                  <span style={{ fontSize: 12, color: V.text, flex: 1 }}>{thread.title}</span>
                </div>
                <div style={{ padding: "18px 20px" }}>
                  <div style={{ fontSize: 13, color: V.mutedMd, lineHeight: 1.65, marginBottom: 14 }}>
                    Competitors mentioned:{" "}
                    <span style={{ color: V.textBright, fontWeight: 500 }}>
                      {thread.competitorsMentioned.join(", ")}
                    </span>
                    {!thread.brandMentioned && (
                      <span
                        style={{
                          color: V.red,
                          fontSize: 11,
                          display: "block",
                          marginTop: 8,
                          fontStyle: "italic",
                        }}
                      >
                        {brandName} is not mentioned in this thread.
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9,
                      color: V.muted,
                      letterSpacing: "0.08em",
                    }}
                  >
                    {thread.engines.map((e) => (
                      <span key={e}>{e}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {lockedThreads.length > 0 && (
              <div style={{ position: "relative", marginTop: 12 }}>
                <div
                  style={{
                    filter: "blur(6px)",
                    pointerEvents: "none",
                    userSelect: "none",
                    opacity: 0.35,
                  }}
                >
                  {lockedThreads.slice(0, 2).map((thread, i) => (
                    <div
                      key={i}
                      style={{
                        background: V.surface,
                        border: `1px solid ${V.border}`,
                        borderRadius: 3,
                        marginBottom: 8,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "14px 20px",
                          borderBottom: `1px solid ${V.border}`,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 9,
                            color: V.muted,
                          }}
                        >
                          {thread.platform}
                        </span>
                        <span style={{ fontSize: 12, color: V.text }}>{thread.title}</span>
                      </div>
                      <div style={{ padding: "18px 20px" }}>
                        <div style={{ fontSize: 13, color: V.mutedMd }}>
                          {"\u2588".repeat(40)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      "radial-gradient(ellipse at center, rgba(7,9,15,0.6) 0%, rgba(7,9,15,0.92) 70%)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 20,
                      opacity: 0.4,
                      marginBottom: 12,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    &#9670;
                  </div>
                  <div
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 16,
                      color: "#fff",
                      marginBottom: 6,
                      textAlign: "center",
                    }}
                  >
                    Full analysis available
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: V.mutedMd,
                      textAlign: "center",
                      maxWidth: 280,
                      lineHeight: 1.6,
                    }}
                  >
                    {lockedThreads.length} more social threads with competitive mentions in the
                    complete report.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Web Citation Footprint */}
        <div
          ref={reveal}
          style={{
            background: V.surface,
            border: `1px solid ${V.border}`,
            borderRadius: 3,
            padding: "32px 40px",
            marginBottom: 80,
          }}
          data-testid="section-citation-footprint"
        >
          <div style={{ ...S.eyebrow, color: V.muted }}>Web Citation Footprint</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr",
              gap: 24,
              paddingBottom: 28,
              borderBottom: `1px solid ${V.border}`,
              marginBottom: 28,
            }}
          >
            {[
              { v: t.citationFootprint.brandSources, l: `${brandName}\nsources citing` },
              {
                v: t.citationFootprint.leaderSources,
                l: `${t.citationFootprint.leaderName}\nsources citing`,
              },
              { v: t.citationFootprint.thirdPartyDomains, l: "Third-party\ndomains" },
              { v: t.citationFootprint.socialMentions, l: "Social\nmentions" },
            ].map((stat, i) => (
              <div key={i}>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 28,
                    fontWeight: 500,
                    color: V.textBright,
                    marginBottom: 4,
                  }}
                  data-testid={`text-citation-stat-${i}`}
                >
                  {stat.v}
                </div>
                <div style={{ fontSize: 11, color: V.muted, lineHeight: 1.4, whiteSpace: "pre-line" }}>
                  {stat.l}
                </div>
              </div>
            ))}
          </div>
          <p
            style={{
              fontSize: 11.5,
              color: V.muted,
              lineHeight: 1.6,
              fontStyle: "italic",
            }}
          >
            {brandName} is cited by{" "}
            <strong style={{ color: V.red, fontStyle: "normal", fontWeight: 400 }}>
              {t.citationFootprint.brandSources}
            </strong>{" "}
            unique sources vs{" "}
            <strong style={{ color: V.textBright, fontStyle: "normal", fontWeight: 400 }}>
              {t.citationFootprint.leaderSources}
            </strong>{" "}
            for {t.citationFootprint.leaderName}. Full source list and acquisition plan in the
            complete report.
          </p>
        </div>

        {/* CTA Block */}
        <div
          ref={reveal}
          style={{
            textAlign: "center",
            padding: "64px 48px",
            border: `1px solid ${V.border}`,
            borderRadius: 3,
            background: V.surface,
            position: "relative",
            overflow: "hidden",
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
            See the full analysis.
          </h2>
          <p
            style={{
              fontSize: 14,
              color: V.mutedMd,
              maxWidth: 420,
              margin: "0 auto 40px",
              lineHeight: 1.75,
            }}
          >
            This preview covers the surface. The full report includes every segment, every prompt,
            competitor playbook, authority acquisition roadmap, and the exact narrative strategy to
            fix what AI says about {brandName}.
          </p>
          <a
            href="#"
            style={{
              display: "inline-block",
              background: V.gold,
              color: V.bg,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "15px 40px",
              borderRadius: 2,
              cursor: "pointer",
              border: "none",
              textDecoration: "none",
            }}
            data-testid="button-cta"
          >
            Request Full Report
          </a>
          <p
            style={{
              marginTop: 18,
              fontSize: 11,
              color: V.muted,
              fontStyle: "italic",
            }}
          >
            Includes actionable roadmap · Delivered within 48 hours
          </p>
        </div>
      </div>
    </div>
  );
}

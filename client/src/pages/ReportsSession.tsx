import { Suspense, lazy, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MonkWordmark } from "@/components/MonkWordmark";
import { SegmentResultCard } from "@/components/SegmentResultCard";
import { ChevronDown } from "lucide-react";

const SessionSummaryHero = lazy(() =>
  import("@/components/SessionSummaryHero").then(m => ({ default: m.SessionSummaryHero }))
);

const AuthoritySourcesPanel = lazy(() =>
  import("@/components/AuthoritySourcesPanel").then(m => ({ default: m.AuthoritySourcesPanel }))
);

const CitationSourcesPreview = lazy(() =>
  import("@/components/CitationSourcesPreview").then(m => ({ default: m.CitationSourcesPreview }))
);

const GENERIC = ["service", "customer", "providers", "provider"];

function deriveContext(session: any) {
  const segs: any[] = Array.isArray(session?.segments) ? session.segments : [];
  let category = "";
  let query = "";
  for (const seg of segs) {
    const sr = seg?.scoringResult ?? {};
    if (!sr.score) continue;
    const rawSeed = (seg?.seedType || "").trim();
    const seedType = GENERIC.includes(rawSeed.toLowerCase())
      ? (seg?.serviceType || seg?.customerType || seg?.persona || rawSeed).trim()
      : (rawSeed || seg?.serviceType || seg?.customerType || seg?.persona || "").trim();
    const location = (seg?.location || "").trim();
    category = seedType || (seg?.persona || "").trim();
    query = seedType && location ? `${seedType} in ${location}` : seedType || location;
    break;
  }
  const firstScored = segs.find(s => s.scoringResult?.score);
  const competitors: { name: string; share: number }[] = firstScored?.scoringResult?.score?.competitors ?? [];
  const topBrands = competitors.slice(0, 3).map(c => c.name).filter(Boolean);
  return { category, query, topBrands };
}

export default function ReportsSession() {
  const [, params] = useRoute("/reports/:slug");
  const [, navigate] = useLocation();
  const slug = params?.slug ?? "";
  const trailingId = slug.match(/-(\d+)$/)?.[1];
  const numericOnly = /^\d+$/.test(slug);
  const useSlugLookup = !trailingId && !numericOnly;
  const id = trailingId ? parseInt(trailingId, 10) : numericOnly ? parseInt(slug, 10) : null;
  const [rankingsExpanded, setRankingsExpanded] = useState(true);
  const [citationsExpanded, setCitationsExpanded] = useState(true);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistDone, setWaitlistDone] = useState(false);

  const { data: session, isLoading } = useQuery<any>({
    queryKey: useSlugLookup ? ["/api/multisegment/by-slug", slug] : ["/api/multisegment/sessions", id],
    queryFn: async () => {
      const url = useSlugLookup
        ? `/api/multisegment/by-slug/${encodeURIComponent(slug)}`
        : `/api/multisegment/sessions/${id}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: useSlugLookup ? !!slug : (id !== null && !isNaN(id as number)),
    staleTime: 5 * 60_000,
  });

  // Check for existing citation insights — must be before any early return (React hooks rule)
  const resolvedId: number | null = session?.id ?? null;
  const { data: citationCheck } = useQuery<{ rowCount: number; insights: any[] }>({
    queryKey: ["/api/multi-segment-sessions", resolvedId, "citation-insights"],
    queryFn: async () => {
      const res = await fetch(`/api/multi-segment-sessions/${resolvedId}/citation-insights`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 60_000,
    enabled: !!resolvedId,
  });

  async function handleEmailSubmit() {
    if (!waitlistEmail.includes("@") || waitlistSubmitting) return;
    setWaitlistSubmitting(true);
    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: waitlistEmail, source: "reports-session" }),
      });
      setWaitlistDone(true);
    } catch { /* silent */ }
    setWaitlistSubmitting(false);
  }

  const pageBg = { background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)", minHeight: "100vh" };

  if (isLoading || !session) {
    return (
      <div style={pageBg}>
        <Nav onBack={() => navigate("/")} />
        <main style={{ maxWidth: 680, margin: "0 auto", padding: "40px 20px" }}>
          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: 120, borderRadius: 14, background: "rgba(0,0,0,0.06)", animation: "pulse 1.5s ease-in-out infinite" }} />
              ))}
            </div>
          ) : (
            <p style={{ textAlign: "center", color: "#6b7280" }}>Report not found.</p>
          )}
        </main>
      </div>
    );
  }

  const segs: any[] = Array.isArray(session.segments) ? session.segments : [];
  const scoredSegs = segs.filter(s => s.scoringResult !== null);
  const detectedService: string = segs.find((s: any) => s.serviceType && !s.customerType)?.serviceType || "";
  const { category, query, topBrands } = deriveContext(session);
  const displayQuery = query || category || session.brandName || "";

  const hasCitationInsights = (citationCheck?.insights?.length ?? 0) > 0;

  return (
    <div style={pageBg}>
      <Nav onBack={() => navigate("/")} />
      <main style={{ maxWidth: 680, margin: "0 auto", padding: "16px 20px 60px" }}>

        {/* Email CTA bar */}
        {!waitlistDone && (
          <div style={{
            position: "sticky", top: 60, zIndex: 60,
            background: "linear-gradient(110deg, #3730a3 0%, #4f46e5 50%, #6d28d9 100%)",
            borderRadius: 14, padding: "10px 14px", marginBottom: 10,
            boxShadow: "0 4px 20px rgba(79,70,229,0.3)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 12, color: "#fff", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>
              Want to see how you rank? Get your free scan emailed
            </span>
            <input
              value={waitlistEmail}
              onChange={e => setWaitlistEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleEmailSubmit()}
              placeholder="you@email.com"
              style={{
                background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 7, padding: "3px 8px", fontSize: 11, color: "#fff",
                outline: "none", width: 110, flexShrink: 0, marginLeft: "auto",
              }}
            />
            <button
              onClick={handleEmailSubmit}
              disabled={waitlistSubmitting || !waitlistEmail.includes("@")}
              style={{
                display: "inline-flex", alignItems: "center",
                background: waitlistEmail.includes("@") ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.15)",
                color: waitlistEmail.includes("@") ? "#3730a3" : "rgba(255,255,255,0.4)",
                border: "none", borderRadius: 7, padding: "3px 10px",
                fontSize: 12, fontWeight: 800, cursor: waitlistEmail.includes("@") ? "pointer" : "not-allowed",
                whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              {waitlistSubmitting ? "…" : "→"}
            </button>
          </div>
        )}

        {/* Context banner */}
        {scoredSegs.length > 0 && (
          <div style={{
            background: "linear-gradient(110deg, #3730a3 0%, #4f46e5 50%, #6d28d9 100%)",
            borderRadius: 14, padding: "14px 16px", marginBottom: 8,
            boxShadow: "0 4px 20px rgba(79,70,229,0.3)",
          }}>
            {displayQuery && (
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
                AI Search Rankings for
              </div>
            )}
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: topBrands.length ? 10 : 0, lineHeight: 1.2 }}>
              {displayQuery}
            </div>
            {topBrands.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                {topBrands.map((brand, i) => (
                  <span key={brand} style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    background: i === 0 ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.10)",
                    border: `1px solid ${i === 0 ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.18)"}`,
                    borderRadius: 20, padding: "3px 10px",
                    fontSize: 11, fontWeight: i === 0 ? 700 : 500, color: "#fff",
                  }}>
                    {i === 0 && <span style={{ fontSize: 9 }}>🏆</span>}
                    {brand}
                  </span>
                ))}
              </div>
            )}
            {session.brandName && (
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 8, marginTop: 2,
                fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)",
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                Scan run for {session.brandName}
                {session.brandDomain && (
                  <span style={{ color: "rgba(255,255,255,0.45)", fontWeight: 400 }}>· {session.brandDomain}</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Brand hero */}
        {scoredSegs.length > 0 && (
          <Suspense fallback={null}>
            <SessionSummaryHero
              brandName={session.brandName || ""}
              brandDomain={session.brandDomain || undefined}
              scoredSegs={scoredSegs}
              totalSegs={segs.length}
            />
          </Suspense>
        )}

        {/* Rankings toggle bar */}
        {scoredSegs.length > 0 && (
          <div
            style={{
              borderRadius: rankingsExpanded ? "14px 14px 0 0" : 14,
              background: "linear-gradient(110deg, #3730a3 0%, #4f46e5 50%, #6d28d9 100%)",
              padding: "10px 14px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 10,
              boxShadow: "0 4px 20px rgba(79,70,229,0.3)",
              minHeight: 42, marginTop: 8,
            }}
            onClick={() => setRankingsExpanded(v => !v)}
          >
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13.5, color: "#ffffff", fontWeight: 800, letterSpacing: "-0.02em" }}>
                Competitor rankings
              </span>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "4px 11px", fontSize: 11.5, fontWeight: 700, color: "#fff" }}>
              {rankingsExpanded ? (
                <><ChevronDown style={{ width: 12, height: 12, transform: "rotate(180deg)", display: "inline" }} /> Collapse</>
              ) : (
                <>View all rankings →</>
              )}
            </div>
          </div>
        )}

        {/* Segment cards */}
        {rankingsExpanded && scoredSegs.map((seg, i) => (
          <SegmentResultCard
            key={seg.id || i}
            seg={seg}
            brandName={session.brandName || ""}
            detectedService={detectedService}
          />
        ))}

        {/* Authority domains bar — shows when citation URL data exists */}
        {(citationCheck?.rowCount ?? 0) > 0 && scoredSegs.length > 0 && (
          <>
            <div
              style={{
                borderRadius: citationsExpanded ? "14px 14px 0 0" : 14,
                background: "linear-gradient(110deg, #3730a3 0%, #4f46e5 50%, #6d28d9 100%)",
                padding: "10px 14px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 10,
                boxShadow: "0 4px 20px rgba(79,70,229,0.3)",
                marginTop: 8, minHeight: 42,
              }}
              onClick={() => setCitationsExpanded(v => !v)}
            >
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap", minWidth: 0, overflow: "hidden" }}>
                <span style={{ fontSize: 13.5, color: "#ffffff", fontWeight: 800, letterSpacing: "-0.02em", flexShrink: 0 }}>See authority domains which LLMs refer to</span>
                <span style={{ width: 1, height: 10, background: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
                <span style={{ fontSize: 10.5, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 20, padding: "2px 8px", color: "#c7d2fe", fontWeight: 500, flexShrink: 0 }}>LLMs cites</span>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "4px 11px", fontSize: 11.5, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                {citationsExpanded ? (
                  <><ChevronDown style={{ width: 12, height: 12, transform: "rotate(180deg)", display: "inline" }} /> Collapse</>
                ) : (
                  <>All sources →</>
                )}
              </div>
            </div>
            {citationsExpanded && (
              <Suspense fallback={null}>
                <CitationSourcesPreview sessionId={session.id} />
              </Suspense>
            )}
          </>
        )}

        {/* Citation report — authority sources & top cited URLs */}
        {hasCitationInsights && scoredSegs.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Suspense fallback={null}>
              <AuthoritySourcesPanel
                sessionId={session.id}
                brandName={session.brandName || ""}
                segments={scoredSegs.map((s: any, i: number) => ({
                  id: s.id || `seg-${i}`,
                  persona: s.persona || s.serviceType || s.label || `Segment ${i + 1}`,
                  seedType: s.seedType || "",
                  customerType: s.customerType || "",
                  location: s.location || "",
                  scoringResult: s.scoringResult,
                }))}
              />
            </Suspense>
          </div>
        )}
      </main>
    </div>
  );
}

function Nav({ onBack }: { onBack: () => void }) {
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(0,0,0,0.06)",
      padding: "0 20px", height: 56,
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <button
        onClick={onBack}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#6366f1", fontSize: 13, fontWeight: 600 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Back
      </button>
      <MonkWordmark size="sm" />
    </nav>
  );
}

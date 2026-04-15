import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Globe, X, ChevronDown, ChevronRight, Zap, BarChart2, FileText, AlertTriangle, ExternalLink, Loader2, Calendar, Tag, Clock } from "lucide-react";
import { MonkWordmark } from "@/components/MonkWordmark";
import { apiRequest } from "@/lib/queryClient";
import type { Brand, ShortformPlan } from "@shared/schema";

// ─── helpers ─────────────────────────────────────────────────────────────────

function domain(url: string) {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function fmtDate(iso: string | Date) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function extractContentPillars(rawSections: any[] | null): string[] {
  if (!rawSections) return [];
  const voice = rawSections.find(s => s.section === "voice_and_tone" || s.section === "brand_voice");
  if (!voice?.data) return [];
  const d = voice.data;
  const raw = (Array.isArray(d.content_pillars) && d.content_pillars.length > 0)
    ? d.content_pillars
    : (Array.isArray(d.contentPillars) && d.contentPillars.length > 0)
    ? d.contentPillars
    : [];
  return raw.map((p: any) => {
    if (typeof p === "string") return p;
    if (p && typeof p === "object") return p.pillar ?? p.name ?? p.title ?? JSON.stringify(p);
    return String(p);
  });
}

function extractNoGoTopics(rawSections: any[] | null): string[] {
  if (!rawSections) return [];
  const voice = rawSections.find(s => s.section === "voice_and_tone" || s.section === "brand_voice");
  const d = voice?.data ?? {};
  return Array.isArray(d.banned_phrases) ? d.banned_phrases : [];
}

function extractTargetUser(rawSections: any[] | null): Record<string, string> {
  if (!rawSections) return {};
  const aud = rawSections.find(s => s.section === "audience" || s.section === "target_audience");
  if (!aud?.data) return {};
  const d = aud.data;
  return {
    demographic: d.icp ?? d.buyer_personas?.[0] ?? "",
    painPoint: Array.isArray(d.pain_points) ? d.pain_points[0] : d.pain_points ?? "",
    psychographic: d.target_industries?.join(", ") ?? "",
  };
}

function buildPayload(brand: Brand, keywords: string[], language: string, mode: "quick" | "full") {
  const brandName = brand.brandName || domain(brand.websiteUrl);
  const targetUser = extractTargetUser(brand.rawSections as any[] | null);
  return {
    requestId: crypto.randomUUID(),
    brandId: brand.id,
    brand: {
      id: slugify(brandName),
      name: brandName,
      tagline: brand.tagline || `${brandName} — explore what's possible`,
      whatItIs: brand.description || brand.positioningStatement || `${brandName} is a brand in the ${keywords[0] ?? "travel"} space.`,
      targetUser: {
        demographic: targetUser.demographic || `Customers interested in ${keywords[0] ?? "travel"}`,
        painPoint: targetUser.painPoint || `Finding the best ${keywords[0] ?? "travel"} solutions`,
        psychographic: targetUser.psychographic || "Curious, growth-oriented individuals",
        context: `Looking for content about ${keywords.slice(0, 3).join(", ")}`,
      },
      positioning: brand.positioningStatement || brand.description || `${brandName} helps people with ${keywords[0] ?? "travel"}.`,
      tone: brand.voiceArchetype || "Friendly, clear, helpful",
      contentPillars: extractContentPillars(brand.rawSections as any[] | null).length > 0
        ? extractContentPillars(brand.rawSections as any[] | null)
        : keywords.slice(0, 3),
      voiceRules: [],
      noGoTopics: extractNoGoTopics(brand.rawSections as any[] | null),
      draftLanguage: language,
    },
    keywords: { seeds: keywords, excludeWords: [] },
    modes: {
      nano: true,
      mid: mode === "full",
      trendingInNiche: true,
      trendingCrossNiche: true,
    },
  };
}

// ─── loading stages ───────────────────────────────────────────────────────────

const STAGES = [
  "Searching YouTube trends…",
  "Filtering by engagement rate…",
  "Fetching transcripts…",
  "Analysing hook patterns…",
  "Scoring content relevance…",
  "Mapping narrative arcs…",
  "Generating draft scripts…",
  "Compiling your plan…",
];

// ─── result helpers ───────────────────────────────────────────────────────────

function getVideos(result: any) {
  return Array.from(
    new Map(
      Object.values(result?.modes ?? {})
        .flatMap((m: any) => m.videos ?? [])
        .map((v: any) => [v.videoId, v])
    ).values()
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────

function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  function add() {
    const val = input.trim();
    if (val && !tags.includes(val) && tags.length < 8) {
      onChange([...tags, val]);
      setInput("");
    }
  }

  return (
    <div
      onClick={() => ref.current?.focus()}
      style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "10px 12px", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, cursor: "text", minHeight: 48 }}
    >
      {tags.map(tag => (
        <span key={tag} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(99,102,241,0.1)", color: "#4f46e5", borderRadius: 6, padding: "3px 8px", fontSize: 13, fontWeight: 600 }}>
          {tag}
          <button data-testid={`tag-remove-${tag}`} onClick={e => { e.stopPropagation(); onChange(tags.filter(t => t !== tag)); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", display: "flex", alignItems: "center", padding: 0, lineHeight: 1 }}>
            <X size={12} />
          </button>
        </span>
      ))}
      {tags.length < 8 && (
        <input
          ref={ref}
          data-testid="input-keyword"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } if (e.key === "Backspace" && !input && tags.length > 0) { onChange(tags.slice(0, -1)); } }}
          placeholder={tags.length === 0 ? "Type keyword, press Enter…" : ""}
          style={{ border: "none", outline: "none", fontSize: 13, color: "#111827", background: "transparent", minWidth: 140, flex: 1 }}
        />
      )}
      <span style={{ fontSize: 11, color: tags.length >= 8 ? "#ef4444" : "#9ca3af", alignSelf: "center", marginLeft: "auto", whiteSpace: "nowrap" }}>
        {tags.length}/8
      </span>
    </div>
  );
}

function VideoCard({ video }: { video: any }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <a href={video.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, fontSize: 13, color: "#111827", textDecoration: "none", flex: 1, lineHeight: 1.4 }}>
          {video.title} <ExternalLink size={10} style={{ display: "inline", marginLeft: 3, color: "#9ca3af" }} />
        </a>
        <span style={{ fontSize: 18, fontWeight: 800, color: video.relevance.score >= 8 ? "#059669" : video.relevance.score >= 6 ? "#d97706" : "#6b7280", flexShrink: 0 }}>
          {video.relevance.score}/10
        </span>
      </div>
      <div style={{ fontSize: 12, color: "#6b7280" }}>{video.channel.title} · {video.channel.subscriberCount?.toLocaleString()} subs</div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[
          { label: "Views", val: (video.metrics.viewCount / 1000).toFixed(0) + "K" },
          { label: "Engagement", val: (video.metrics.engagementRate * 100).toFixed(1) + "%" },
          { label: "Overperf", val: video.metrics.overperfRatio + "×" },
        ].map(m => (
          <span key={m.label} style={{ fontSize: 11, color: "#374151", background: "#f9fafb", borderRadius: 6, padding: "3px 8px", border: "1px solid #f3f4f6" }}>
            {m.label}: <strong>{m.val}</strong>
          </span>
        ))}
      </div>
      <p style={{ fontSize: 12, color: "#6b7280", margin: 0, fontStyle: "italic" }}>{video.relevance.reason}</p>
      <span style={{ fontSize: 11, color: "#6366f1", background: "rgba(99,102,241,0.08)", borderRadius: 100, padding: "2px 8px", alignSelf: "flex-start" }}>
        seed: {video.seedKeyword}
      </span>
    </div>
  );
}

function HookCard({ hook }: { hook: any }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: "#4f46e5", background: "rgba(99,102,241,0.06)", borderRadius: 8, padding: "8px 12px" }}>
        {hook.template}
      </div>
      <p style={{ fontSize: 13, color: "#374151", margin: 0 }}><strong>Example:</strong> {hook.example}</p>
      <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>{hook.whyItWorks}</p>
      {hook.variations?.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
          {hook.variations.map((v: string, i: number) => (
            <span key={i} style={{ fontSize: 12, color: "#6b7280", paddingLeft: 10, borderLeft: "2px solid #e5e7eb" }}>{v}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function DraftCard({ draft }: { draft: any }) {
  const priorityColor = draft.priority === "high" ? "#059669" : draft.priority === "medium" ? "#d97706" : "#6b7280";
  const difficultyColor = draft.difficulty === "easy" ? "#059669" : draft.difficulty === "medium" ? "#d97706" : "#dc2626";
  return (
    <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Draft #{draft.number}</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#111827", lineHeight: 1.3 }}>{draft.title}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: draft.rationaleScore >= 8 ? "#059669" : "#d97706" }}>{draft.rationaleScore}/10</span>
          <div style={{ display: "flex", gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: priorityColor, background: `${priorityColor}15`, borderRadius: 100, padding: "2px 7px", textTransform: "uppercase" }}>{draft.priority}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: difficultyColor, background: `${difficultyColor}15`, borderRadius: 100, padding: "2px 7px", textTransform: "uppercase" }}>{draft.difficulty}</span>
          </div>
        </div>
      </div>
      <div style={{ background: "rgba(99,102,241,0.06)", borderRadius: 10, padding: "12px 14px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Hook</div>
        <p style={{ fontSize: 13, color: "#111827", margin: 0, fontStyle: "italic", lineHeight: 1.5 }}>"{draft.hookSpoken}"</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { label: "Setup", val: draft.arc?.setup },
          { label: "Payoff", val: draft.arc?.payoff },
          { label: "CTA", val: draft.arc?.cta },
        ].map(({ label, val }) => (
          <div key={label} style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
            <p style={{ fontSize: 12, color: "#374151", margin: 0, lineHeight: 1.4 }}>{val}</p>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: "#6b7280", margin: 0, lineHeight: 1.5, borderTop: "1px solid #f3f4f6", paddingTop: 10 }}>
        <strong style={{ color: "#374151" }}>Why it'll work: </strong>{draft.whyItllWork}
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {draft.addresses?.brandPillar && <span style={{ fontSize: 11, color: "#6366f1", background: "rgba(99,102,241,0.08)", borderRadius: 100, padding: "2px 8px" }}>pillar: {draft.addresses.brandPillar}</span>}
        {draft.durationSec && <span style={{ fontSize: 11, color: "#6b7280", background: "#f3f4f6", borderRadius: 100, padding: "2px 8px" }}>{draft.durationSec}s</span>}
        {draft.vibe && <span style={{ fontSize: 11, color: "#6b7280", background: "#f3f4f6", borderRadius: 100, padding: "2px 8px" }}>{draft.vibe}</span>}
      </div>
    </div>
  );
}

// ─── PlanResults (shared between saved bar + live) ────────────────────────────

type ResultTab = "drafts" | "patterns" | "videos";

function PlanResults({ result }: { result: any }) {
  const [tab, setTab] = useState<ResultTab>("drafts");
  const allVideos = getVideos(result);
  const patterns = result?.analysis?.patternBrief ?? null;
  const drafts = result?.analysis?.drafts ?? [];

  return (
    <div>
      {result._mock && (
        <div style={{ marginBottom: 12, padding: "8px 12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, fontSize: 12, color: "#92400e", fontWeight: 600 }}>
          ⚠ Sample data — live API pending
        </div>
      )}
      {result.warnings?.length > 0 && (
        <div style={{ marginBottom: 12, padding: "10px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8 }}>
          {result.warnings.map((w: string, i: number) => (
            <div key={i} style={{ fontSize: 12, color: "#92400e" }}>⚠ {w}</div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, background: "#f3f4f6", borderRadius: 10, padding: 4, marginBottom: 20 }}>
        {([
          { key: "drafts", icon: FileText, label: `Drafts (${drafts.length})` },
          { key: "patterns", icon: BarChart2, label: "Patterns" },
          { key: "videos", icon: Globe, label: `Videos (${allVideos.length})` },
        ] as { key: ResultTab; icon: any; label: string }[]).map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            data-testid={`tab-${key}`}
            onClick={() => setTab(key)}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit", transition: "all 0.15s", background: tab === key ? "#fff" : "transparent", color: tab === key ? "#6366f1" : "#6b7280", boxShadow: tab === key ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}
          >
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {tab === "drafts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {drafts.length === 0 ? <p style={{ color: "#9ca3af", textAlign: "center" }}>No drafts returned.</p> : drafts.map((d: any) => <DraftCard key={d.number} draft={d} />)}
        </div>
      )}

      {tab === "videos" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {allVideos.length === 0 ? <p style={{ color: "#9ca3af", textAlign: "center" }}>No videos returned.</p> : (allVideos as any[]).map((v: any) => <VideoCard key={v.videoId} video={v} />)}
        </div>
      )}

      {tab === "patterns" && patterns && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <section>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "#111827", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Hook Formulas</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(patterns.hookFormulas ?? []).map((h: any, i: number) => <HookCard key={i} hook={h} />)}
            </div>
          </section>

          {patterns.topCTAs?.length > 0 && (
            <section>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#111827", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Top CTAs</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {patterns.topCTAs.map((c: any, i: number) => (
                  <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 4 }}>{c.type}</div>
                    <p style={{ fontSize: 13, color: "#6b7280", margin: 0, fontStyle: "italic" }}>"{c.example}"</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {patterns.contentGapsForBrand?.length > 0 && (
            <section>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#111827", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Content Gaps</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {patterns.contentGapsForBrand.map((g: any, i: number) => (
                  <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: g.priority === "high" ? "#059669" : "#d97706", background: g.priority === "high" ? "#ecfdf5" : "#fffbeb", borderRadius: 100, padding: "2px 8px", flexShrink: 0 }}>{g.priority}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 4 }}>{g.gap}</div>
                        <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 4px" }}>{g.evidence}</p>
                        <p style={{ fontSize: 12, color: "#6366f1", margin: 0, fontWeight: 600 }}>{g.brandFit}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SavedPlanBar ─────────────────────────────────────────────────────────────

function SavedPlanBar({ plan, brandId, isNew }: { plan: any; brandId: number; isNew?: boolean }) {
  const [open, setOpen] = useState(isNew ?? false);
  const [fullResult, setFullResult] = useState<any>(plan.result ?? null);
  const [loading, setLoading] = useState(false);

  async function expand() {
    if (!open && !fullResult) {
      setLoading(true);
      try {
        const res = await fetch(`/api/shortform/plans/${brandId}/${plan.id}`);
        const data = await res.json();
        setFullResult(data.result);
      } catch { }
      setLoading(false);
    }
    setOpen(o => !o);
  }

  const keywords: string[] = plan.keywords_used ?? [];
  const drafts = fullResult?.analysis?.drafts ?? [];
  const videos = getVideos(fullResult ?? {});
  const elapsedSec = (plan.run_metadata as any)?.elapsedSec ?? null;

  return (
    <div style={{
      border: isNew ? "1.5px solid #6366f1" : "1px solid #e5e7eb",
      borderRadius: 12,
      background: isNew ? "rgba(99,102,241,0.03)" : "#fff",
      overflow: "hidden",
      boxShadow: isNew ? "0 0 0 3px rgba(99,102,241,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
      transition: "box-shadow 0.2s",
    }}>
      {/* Collapsed bar / header */}
      <button
        onClick={expand}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <div style={{ color: open ? "#6366f1" : "#9ca3af", transition: "transform 0.2s", transform: open ? "rotate(90deg)" : "rotate(0deg)", flexShrink: 0 }}>
          <ChevronRight size={16} />
        </div>

        {isNew && (
          <span style={{ fontSize: 10, fontWeight: 800, color: "#6366f1", background: "rgba(99,102,241,0.1)", borderRadius: 100, padding: "2px 8px", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>New</span>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <Calendar size={12} color="#9ca3af" />
          <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>{fmtDate(plan.created_at)}</span>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
          {keywords.slice(0, 5).map((k: string) => (
            <span key={k} style={{ fontSize: 11, color: "#4f46e5", background: "rgba(99,102,241,0.08)", borderRadius: 100, padding: "2px 7px", display: "inline-flex", alignItems: "center", gap: 3 }}>
              <Tag size={9} />{k}
            </span>
          ))}
          {keywords.length > 5 && <span style={{ fontSize: 11, color: "#9ca3af" }}>+{keywords.length - 5}</span>}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
          {drafts.length > 0 && <span style={{ fontSize: 11, color: "#374151" }}><strong>{drafts.length}</strong> drafts</span>}
          {videos.length > 0 && <span style={{ fontSize: 11, color: "#374151" }}><strong>{videos.length}</strong> videos</span>}
          {elapsedSec && (
            <span style={{ fontSize: 11, color: "#9ca3af", display: "flex", alignItems: "center", gap: 3 }}>
              <Clock size={10} />{elapsedSec}s
            </span>
          )}
          <span style={{ fontSize: 11, color: plan.mode === "full" ? "#7c3aed" : "#6b7280", background: plan.mode === "full" ? "rgba(124,58,237,0.08)" : "#f3f4f6", borderRadius: 100, padding: "2px 7px", textTransform: "capitalize" }}>
            {plan.mode}
          </span>
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div style={{ padding: "4px 16px 20px", borderTop: "1px solid #f3f4f6" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#9ca3af", fontSize: 13, padding: "16px 0" }}>
              <Loader2 size={14} className="animate-spin" /> Loading plan…
            </div>
          ) : fullResult ? (
            <div style={{ marginTop: 16 }}>
              <PlanResults result={fullResult} />
            </div>
          ) : (
            <p style={{ color: "#9ca3af", fontSize: 13 }}>Could not load plan data.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

type Phase = "idle" | "loading" | "error";

export default function Socials() {
  const qc = useQueryClient();
  const { data: brandList = [], isLoading: brandsLoading } = useQuery<Brand[]>({ queryKey: ["/api/brands"] });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [language, setLanguage] = useState("en");
  const [mode, setMode] = useState<"quick" | "full">("quick");
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [stageIdx, setStageIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [localPlans, setLocalPlans] = useState<any[]>([]);
  const elapsedRef = useRef<NodeJS.Timeout | null>(null);

  const selectedBrand = brandList.find(b => b.id === selectedId) ?? null;

  const { data: savedPlansData, isLoading: plansLoading } = useQuery<{ plans: any[] }>({
    queryKey: ["/api/shortform/plans", selectedId],
    queryFn: () => fetch(`/api/shortform/plans/${selectedId}`).then(r => r.json()),
    enabled: selectedId !== null,
  });

  // Sync server plans into local state on brand change
  useEffect(() => {
    if (savedPlansData?.plans) {
      setLocalPlans(savedPlansData.plans.map(p => ({ ...p })));
    }
  }, [savedPlansData]);

  useEffect(() => {
    if (selectedBrand) {
      setKeywords(selectedBrand.primaryKeywords?.slice(0, 6) ?? []);
      setPhase("idle");
      setErrorMsg("");
    }
  }, [selectedId]);

  useEffect(() => {
    if (phase === "loading") {
      setStageIdx(0);
      setElapsed(0);
      elapsedRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
      const rotator = setInterval(() => setStageIdx(i => (i + 1) % STAGES.length), 12000);
      return () => { clearInterval(elapsedRef.current!); clearInterval(rotator); };
    } else {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    }
  }, [phase]);

  const planMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBrand) throw new Error("No brand selected");
      const payload = buildPayload(selectedBrand, keywords, language, mode);
      const res = await apiRequest("POST", "/api/shortform/plan", payload);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const code = res.status;
        if (code === 401) throw new Error("AUTH:Authentication failed — contact admin");
        if (code === 429) throw new Error("QUOTA:Daily YouTube quota exhausted. Try again tomorrow or reduce seeds.");
        if (code === 504) throw new Error("TIMEOUT:Request timed out. Try Quick mode or fewer keywords.");
        throw new Error(`ERROR:${body.error || "Something went wrong. Retry in a moment."}`);
      }
      return res.json();
    },
    onMutate: () => { setPhase("loading"); setErrorMsg(""); },
    onSuccess: (data) => {
      // Prepend the new plan to the local list immediately
      const newPlan = {
        id: data._planId ?? Date.now(),
        brand_id: selectedId,
        keywords_used: keywords,
        language,
        mode,
        created_at: new Date().toISOString(),
        run_metadata: data.runMetadata,
        draft_count: data.analysis?.drafts?.length ?? 0,
        result: data,
        _isNew: true,
      };
      setLocalPlans(prev => [newPlan, ...prev]);
      setPhase("idle");
      // Invalidate so next brand switch refreshes from server
      qc.invalidateQueries({ queryKey: ["/api/shortform/plans", selectedId] });
    },
    onError: (err: any) => {
      const msg = err.message.includes(":") ? err.message.split(":").slice(1).join(":") : err.message;
      setErrorMsg(msg);
      setPhase("error");
    },
  });

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #ede9fe 0%, #ffffff 50%, #ecfdf5 100%)", fontFamily: "inherit" }}>
      <nav style={{ padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(99,102,241,0.1)", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)" }}>
        <a href="/" style={{ textDecoration: "none" }}><MonkWordmark /></a>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#6366f1", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 100, padding: "4px 12px" }}>
          Shortform Planner
        </span>
      </nav>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 100, padding: "6px 14px", marginBottom: 16 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#6366f1", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.06em" }}>AI Content Intelligence</span>
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: "#111827", margin: "0 0 8px" }}>Shortform Content Planner</h1>
          <p style={{ fontSize: 15, color: "#6b7280", margin: 0 }}>
            Mine trending YouTube content, extract what works, generate scripts in your brand voice.
          </p>
        </div>

        {/* Brand selector */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>Select brand</label>
          {brandsLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#9ca3af", fontSize: 13 }}><Loader2 size={14} className="animate-spin" /> Loading brands…</div>
          ) : brandList.length === 0 ? (
            <div style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 10, padding: "16px 18px", fontSize: 13, color: "#6b7280" }}>
              No confirmed brands yet. <a href="/agents/brandsmith" style={{ color: "#6366f1", fontWeight: 600 }}>Create one with BrandSmith →</a>
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              <select
                data-testid="select-brand"
                value={selectedId ?? ""}
                onChange={e => setSelectedId(e.target.value ? Number(e.target.value) : null)}
                style={{ width: "100%", padding: "12px 40px 12px 14px", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, color: "#111827", appearance: "none", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
              >
                <option value="">— Choose a brand —</option>
                {brandList.map(b => (
                  <option key={b.id} value={b.id}>{b.brandName || domain(b.websiteUrl)} · {domain(b.websiteUrl)}</option>
                ))}
              </select>
              <ChevronDown size={16} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
            </div>
          )}
        </div>

        {selectedBrand && (
          <>
            {/* Brand preview */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "16px 18px", marginBottom: 24, display: "flex", gap: 14, alignItems: "flex-start", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Globe size={18} color="#fff" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#111827" }}>{selectedBrand.brandName}</div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6 }}>{domain(selectedBrand.websiteUrl)}</div>
                {selectedBrand.tagline && <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 6px", fontStyle: "italic" }}>"{selectedBrand.tagline}"</p>}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {selectedBrand.voiceArchetype && <span style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", background: "rgba(124,58,237,0.08)", borderRadius: 100, padding: "2px 8px" }}>{selectedBrand.voiceArchetype}</span>}
                  {extractContentPillars(selectedBrand.rawSections as any[] | null).slice(0, 3).map((p, i) => (
                    <span key={i} style={{ fontSize: 11, color: "#6b7280", background: "#f3f4f6", borderRadius: 100, padding: "2px 8px" }}>{p}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Past plans ── */}
            {(plansLoading || localPlans.length > 0) && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Past plans</span>
                  {plansLoading && <Loader2 size={12} color="#9ca3af" className="animate-spin" />}
                  {!plansLoading && localPlans.length > 0 && (
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>{localPlans.length} saved</span>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {localPlans.map((plan, idx) => (
                    <SavedPlanBar
                      key={plan.id}
                      plan={plan}
                      brandId={selectedId!}
                      isNew={idx === 0 && (plan._isNew === true)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Divider + New plan creator ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                {localPlans.length > 0 ? "Create new plan" : "Create your first plan"}
              </span>
              <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
            </div>

            {/* Keywords */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Keywords <span style={{ color: "#6366f1" }}>*</span></label>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>3–8 seeds · drives YouTube discovery</span>
              </div>
              <TagInput tags={keywords} onChange={setKeywords} />
              {keywords.length < 3 && keywords.length > 0 && (
                <p style={{ fontSize: 12, color: "#d97706", margin: "6px 0 0" }}>Add at least 3 keywords for best results</p>
              )}
            </div>

            {/* Options */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Draft language</label>
                <div style={{ position: "relative" }}>
                  <select
                    data-testid="select-language"
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    style={{ width: "100%", padding: "10px 36px 10px 12px", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13, color: "#111827", appearance: "none", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="en-hi-mixed">English + Hindi mixed</option>
                    <option value="ta">Tamil</option>
                    <option value="te">Telugu</option>
                  </select>
                  <ChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Scan depth</label>
                <div style={{ display: "flex", gap: 0, background: "#f3f4f6", borderRadius: 8, padding: 3 }}>
                  {(["quick", "full"] as const).map(m => (
                    <button
                      key={m}
                      data-testid={`mode-${m}`}
                      onClick={() => setMode(m)}
                      style={{ flex: 1, padding: "8px 0", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit", transition: "all 0.15s", background: mode === m ? "#fff" : "transparent", color: mode === m ? "#6366f1" : "#6b7280", boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}
                    >
                      {m === "quick" ? "Quick ~40s" : "Full ~90s"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Loading state */}
            {phase === "loading" && (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1", animation: "spin 0.9s linear infinite", margin: "0 auto 20px" }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 6 }}>{STAGES[stageIdx]}</div>
                <div style={{ fontSize: 13, color: "#9ca3af" }}>Elapsed: {elapsed}s · {mode === "quick" ? "Quick scan (~40s)" : "Full scan (~90s)"}</div>
              </div>
            )}

            {/* CTA */}
            {phase !== "loading" && (
              <button
                data-testid="button-create-plan"
                onClick={() => planMutation.mutate()}
                disabled={keywords.length < 1}
                style={{
                  width: "100%", padding: "14px 24px", border: "none", borderRadius: 12, cursor: keywords.length < 1 ? "not-allowed" : "pointer",
                  background: keywords.length < 1 ? "#e5e7eb" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: keywords.length < 1 ? "#9ca3af" : "#fff", fontSize: 15, fontWeight: 800, fontFamily: "inherit",
                  boxShadow: keywords.length < 1 ? "none" : "0 4px 14px rgba(99,102,241,0.35)", transition: "opacity 0.15s",
                }}
              >
                <Zap size={15} style={{ display: "inline", marginRight: 6 }} />
                Create Shortform Plan
              </button>
            )}

            {/* Error */}
            {phase === "error" && (
              <div style={{ marginTop: 16, display: "flex", alignItems: "flex-start", gap: 10, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 14px" }}>
                <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", marginBottom: 2 }}>Plan failed</div>
                  <div style={{ fontSize: 13, color: "#7f1d1d" }}>{errorMsg}</div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}

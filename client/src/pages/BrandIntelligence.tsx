import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Brain, Loader2, CheckCircle, XCircle, Clock, ChevronRight,
  ExternalLink, Package, Zap, ChevronDown, ChevronUp, BarChart2, AlertTriangle, ShieldCheck, RefreshCw,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const ATTRIBUTE_LABELS: Record<string, string> = {
  primary_credential: "Primary Credential",
  years_in_market: "Years in Market",
  staff_qualification: "Staff Qualification",
  geographic_coverage: "Geographic Coverage",
  response_time: "Response / Delivery Time",
  service_model: "Service Model",
  service_list: "Core Services",
  target_customer: "Target Customer",
  proof_numbers: "Proof Numbers",
  price_tier: "Price Tier",
  brand_wedge: "Brand Wedge",
  closest_competitor: "Closest Competitor",
  known_gap: "Known Gap vs Leader",
  identity_summary: "Identity Summary",
};

const ATTRIBUTE_KEYS = Object.keys(ATTRIBUTE_LABELS);

const ATTRIBUTE_GUIDE: Record<string, string> = {
  primary_credential: "Most important specific accreditation or certification this brand holds",
  years_in_market: "Founding year or specific number of years operating",
  staff_qualification: "Specific qualification level of staff/team",
  geographic_coverage: "Specific locations, cities, or regions served",
  response_time: "Any stated delivery or response time commitment",
  service_model: "How they deliver — subscription, on-demand, retainer, in-person, etc.",
  service_list: "Specific named services or products this brand offers",
  target_customer: "Most specific customer type who benefits most from this brand",
  proof_numbers: "Specific proof points — review count, satisfaction %, award names",
  price_tier: "'budget', 'mid-market', or 'premium' with one-line reason",
  brand_wedge: "The ONE thing this brand is distinctively known for — not generic to category",
  closest_competitor: "Which other brand in this market is most similar to this one",
  known_gap: "The most important thing this brand lacks vs. the category leader",
  identity_summary: "One sentence: 'Brand X is known for [specific thing]' OR 'No clear distinctive identity found'",
};

const EVIDENCE_COLORS: Record<string, string> = {
  EXPLICIT: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  INFERRED: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  ABSENT: "bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-400/30",
  GENERIC: "bg-muted text-muted-foreground border-border",
};

const GAP_TYPE_CONFIG: Record<string, { label: string; color: string; bar: string }> = {
  aligned:      { label: "Aligned",      color: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" },
  inconsistent: { label: "Inconsistent", color: "text-amber-600 dark:text-amber-400",   bar: "bg-amber-500" },
  misaligned:   { label: "Misaligned",   color: "text-orange-600 dark:text-orange-400", bar: "bg-orange-500" },
  absent:       { label: "Absent",       color: "text-red-600 dark:text-red-400",       bar: "bg-red-400" },
};

const BENCHMARK_GAP_CONFIG: Record<string, { label: string; color: string; bar: string }> = {
  exceeds:        { label: "Exceeds",        color: "text-sky-600 dark:text-sky-400",        bar: "bg-sky-500" },
  aligned:        { label: "Aligned",        color: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" },
  underspecified: { label: "Underspecified", color: "text-amber-600 dark:text-amber-400",    bar: "bg-amber-500" },
  outside:        { label: "Outside",        color: "text-red-600 dark:text-red-400",        bar: "bg-red-400" },
};

const TIER_CONFIG: Record<string, { label: string; className: string }> = {
  floor:          { label: "Floor",    className: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300/50 dark:border-slate-600/50" },
  signal:         { label: "Signal",   className: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/50" },
  differentiator: { label: "Differ.",  className: "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200/50 dark:border-purple-800/50" },
  unknown:        { label: "—",        className: "bg-muted text-muted-foreground border-border" },
};

const CONCEPT_STATUS_CONFIG: Record<string, { icon: string; color: string }> = {
  present: { icon: "✓", color: "text-emerald-600 dark:text-emerald-400" },
  partial:  { icon: "~", color: "text-amber-600 dark:text-amber-400" },
  absent:   { icon: "✗", color: "text-red-500 dark:text-red-400" },
};

const CONFIDENCE_BAR = (pct: number) => {
  if (pct >= 70) return "bg-emerald-500";
  if (pct >= 30) return "bg-amber-500";
  return "bg-red-400";
};

const ROOT_CAUSE_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  STRONG: {
    label: "Strong AI Identity",
    color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    description: "Clear, consistent, and distinctive representation in AI memory.",
  },
  WEAK_SIGNAL: {
    label: "Weak Signal",
    color: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    description: "The AI knows this brand exists but has limited or inconsistent specific knowledge.",
  },
  CATEGORY_BLUR: {
    label: "Category Blur",
    color: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30",
    description: "The AI associates this brand with generic category descriptors rather than distinctive attributes.",
  },
  ABSENCE: {
    label: "Absent from AI Memory",
    color: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
    description: "Minimal or no meaningful representation in AI training knowledge.",
  },
};

const ENGINE_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  claude: "Claude",
};

const BENCHMARK_CATEGORIES: { value: string; label: string }[] = [
  { value: "healthcare_uae", label: "Home Healthcare — UAE" },
];

interface PacketDefinition {
  idealIdentity: string;
  template?: string;
  attributes: Partial<Record<string, string>>;
}

interface AttributePacketMatch {
  idealValue: string;
  matchScore: number;
  gapType: "aligned" | "inconsistent" | "misaligned" | "absent";
}

interface ConceptCoverage {
  concept: string;
  status: "present" | "partial" | "absent";
  evidence: string | null;
}

interface PacketAnalysis {
  idealIdentity: string;
  recognizedIdentity: string;
  identityMatchScore: number;
  identityConcepts: ConceptCoverage[];
  attributeMatches: Partial<Record<string, AttributePacketMatch>>;
  overallPacketFit: number;
}

interface BenchmarkAttributeResult {
  gapClassification: "exceeds" | "aligned" | "underspecified" | "outside";
  score: number;
  note: string;
  categoryTier: "floor" | "signal" | "differentiator" | "unknown";
  categoryValue: string | null;
}

interface BenchmarkAnalysis {
  categoryName: string;
  categoryPresenceScore: number;
  identityCoherenceScore: number;
  brandIdentitySummary: string;
  wedgeCollision: {
    detected: boolean;
    collidingWinner?: string;
    note: string;
  };
  attributeResults: Partial<Record<string, BenchmarkAttributeResult>>;
}

interface Job {
  id: number;
  brandName: string;
  brandUrl: string | null;
  engine: string;
  runCount: number;
  webSearch: boolean;
  packetMode: boolean;
  benchmarkMode: boolean;
  benchmarkCategory: string | null;
  status: string;
  progress: number;
  createdAt: string;
  categoryPresenceScore?: number | null;
  identityCoherenceScore?: number | null;
}

interface AttributeResult {
  confidence_pct: number;
  mode_value: string | null;
  mode_evidence: string;
  value_counts: Record<string, number>;
  evidence_counts: Record<string, number>;
  sources: string[];
  coherence_pct?: number;
  per_run_values?: Array<string | null>;
}

interface JobDetail extends Job {
  packetDefinition: PacketDefinition | null;
  results: {
    attributes: Record<string, AttributeResult>;
    diagnosis: {
      root_cause: string;
      avg_confidence: number;
      avg_coherence?: number;
      strong_attributes: string[];
      weak_attributes: string[];
      absent_attributes: string[];
      identity_summary: string | null;
    };
    packetAnalysis?: PacketAnalysis;
    benchmarkAnalysis?: BenchmarkAnalysis;
  } | null;
  error: string | null;
}

const HEALTHCARE_UAE_TEMPLATE: PacketDefinition = {
  template: "Healthcare — UAE",
  idealIdentity:
    "A DHA-licensed home healthcare provider delivering nursing care, physiotherapy, doctor home visits, post-surgical and palliative care across Dubai and the UAE, with 24/7 on-call licensed medical professionals.",
  attributes: {
    primary_credential: "DHA-licensed (Dubai Health Authority)",
    years_in_market: "10+ years, established before 2015",
    staff_qualification:
      "DHA-licensed nurses, physiotherapists, and visiting physicians with continuous training",
    geographic_coverage: "Dubai and UAE-wide coverage",
    response_time: "24/7 on-call, same-day service",
    service_model: "On-demand home visits, no clinic required",
    service_list:
      "Nursing care, physiotherapy, doctor home visits, post-surgical care, palliative care, elderly care, wound management, IV therapy, chronic disease management",
    target_customer:
      "Elderly, post-surgical patients, maternity and newborn, pediatric, chronic illness",
    proof_numbers: "Thousands of patients served, 100+ licensed healthcare professionals",
    price_tier: "Premium, insurance-compatible (Daman, Thiqa, ADNIC)",
    brand_wedge:
      "Internationally accredited, clinically specialized home healthcare with licensed medical professionals",
    closest_competitor: "Emirates Home Nursing, First Response Healthcare",
    known_gap: "Palliative care and mental health home services",
    identity_summary:
      "A DHA-licensed home healthcare provider delivering nursing care, physiotherapy, and doctor home visits across Dubai and the UAE with licensed medical professionals available same-day",
  },
};

function StatusIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle className="w-4 h-4 text-emerald-500" />;
  if (status === "failed") return <XCircle className="w-4 h-4 text-red-500" />;
  if (status === "running") return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
  return <Clock className="w-4 h-4 text-muted-foreground" />;
}

function SourceLink({ url }: { url: string }) {
  let label = url;
  try {
    const u = new URL(url);
    label = u.hostname.replace(/^www\./, "");
  } catch {}
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 dark:text-blue-400 hover:underline max-w-[160px]"
      title={url}
      data-testid={`source-link-${label}`}
    >
      <span className="truncate">{label}</span>
      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
    </a>
  );
}

function CoherenceDot({ pct }: { pct?: number }) {
  if (pct === undefined) return null;
  const color = pct >= 80 ? "bg-emerald-400" : pct >= 50 ? "bg-amber-400" : "bg-red-400";
  const title = pct >= 80 ? `Stable identity (${pct}% coherence)` : pct >= 50 ? `Some variation (${pct}% coherence)` : `High variation (${pct}% coherence) — identity instability risk`;
  return <span className={`w-1.5 h-1.5 rounded-full inline-block shrink-0 ${color}`} title={title} />;
}

function AttributeRow({
  attrKey,
  result,
  packetMatch,
  benchmarkResult,
}: {
  attrKey: string;
  result: AttributeResult;
  packetMatch?: AttributePacketMatch;
  benchmarkResult?: BenchmarkAttributeResult;
}) {
  const [expanded, setExpanded] = useState(false);
  const label = ATTRIBUTE_LABELS[attrKey] || attrKey;
  const { confidence_pct, mode_value, mode_evidence, sources = [], coherence_pct, per_run_values } = result;
  const isIdentity = attrKey === "identity_summary";
  const gapCfg = packetMatch ? GAP_TYPE_CONFIG[packetMatch.gapType] : null;
  const benchGapCfg = benchmarkResult ? BENCHMARK_GAP_CONFIG[benchmarkResult.gapClassification] : null;
  const tierCfg = benchmarkResult ? TIER_CONFIG[benchmarkResult.categoryTier] ?? TIER_CONFIG.unknown : null;
  const hasRunValues = per_run_values && per_run_values.length > 0;
  const nonNullRuns = per_run_values?.filter((v) => v !== null).length ?? 0;

  return (
    <div
      className={`py-3 border-b border-border/50 last:border-0 ${isIdentity ? "pt-4 mt-1" : ""}`}
      data-testid={`attr-row-${attrKey}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-40 shrink-0 pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <CoherenceDot pct={coherence_pct} />
          </div>
          {ATTRIBUTE_GUIDE[attrKey] && (
            <p className="text-[10px] text-muted-foreground/45 leading-tight mt-0.5">
              {ATTRIBUTE_GUIDE[attrKey]}
            </p>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-0.5">
          {benchmarkResult && benchmarkResult.categoryValue && (
            <p className="text-[10px] text-muted-foreground/70 leading-tight line-clamp-1" title={benchmarkResult.categoryValue}>
              <span className="font-medium">Category norm:</span> {benchmarkResult.categoryValue}
            </p>
          )}
          {packetMatch && (
            <p className="text-[10px] text-muted-foreground/70 leading-tight line-clamp-1" title={packetMatch.idealValue}>
              <span className="font-medium">Ideal:</span> {packetMatch.idealValue}
            </p>
          )}
          {mode_value ? (
            <p className="text-sm text-foreground leading-snug">{mode_value}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">Not recognized</p>
          )}
          {benchmarkResult?.note && (
            <p className="text-[10px] text-muted-foreground/80 leading-tight mt-0.5">{benchmarkResult.note}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {benchmarkResult ? (
            <div className="flex items-center gap-2">
              {tierCfg && (
                <Badge variant="outline" className={`text-[9px] px-1 py-0 h-4 ${tierCfg.className}`}>
                  {tierCfg.label}
                </Badge>
              )}
              <div className="w-16">
                <div className="flex items-center gap-1">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${benchGapCfg?.bar}`}
                      style={{ width: `${benchmarkResult.score}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-6 text-right">{benchmarkResult.score}%</span>
                </div>
              </div>
              <span className={`text-[10px] font-medium ${benchGapCfg?.color}`} data-testid={`bench-gap-${attrKey}`}>
                {benchGapCfg?.label}
              </span>
            </div>
          ) : packetMatch ? (
            <div className="flex items-center gap-2">
              <div className="w-16">
                <div className="flex items-center gap-1">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${gapCfg?.bar}`}
                      style={{ width: `${packetMatch.matchScore}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-6 text-right">{packetMatch.matchScore}%</span>
                </div>
              </div>
              <span className={`text-[10px] font-medium ${gapCfg?.color}`} data-testid={`gap-type-${attrKey}`}>
                {gapCfg?.label}
              </span>
            </div>
          ) : (
            <div className="w-20">
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${CONFIDENCE_BAR(confidence_pct)}`}
                    style={{ width: `${confidence_pct}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-7 text-right">{confidence_pct}%</span>
              </div>
            </div>
          )}

          {!packetMatch && !benchmarkResult && (
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 h-5 ${EVIDENCE_COLORS[mode_evidence] || EVIDENCE_COLORS.GENERIC}`}
            >
              {mode_evidence || "GENERIC"}
            </Badge>
          )}

          {hasRunValues && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors shrink-0"
              title={`${nonNullRuns} of ${per_run_values!.length} runs produced values`}
              data-testid={`btn-expand-runs-${attrKey}`}
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {sources.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1.5 pl-36">
          {sources.map((url, i) => (
            <SourceLink key={i} url={url} />
          ))}
        </div>
      )}

      {expanded && per_run_values && (
        <div className="mt-2 pl-36">
          <p className="text-[10px] text-muted-foreground mb-1.5">
            Per-run values ({nonNullRuns}/{per_run_values.length} recognized):
          </p>
          <div className="flex flex-wrap gap-1.5">
            {per_run_values.map((val, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1 text-[10px] rounded px-1.5 py-0.5 border max-w-[220px] ${
                  val === null
                    ? "bg-muted/40 text-muted-foreground/50 border-border/40 italic"
                    : "bg-muted/70 text-foreground border-border/60"
                }`}
                title={val ?? "not recognized"}
              >
                <span className="text-[9px] text-muted-foreground/50 shrink-0">#{i + 1}</span>
                <span className="truncate">{val === null ? "—" : val}</span>
              </span>
            ))}
          </div>
          {coherence_pct !== undefined && (
            <p className="text-[10px] text-muted-foreground/60 mt-1.5">
              Coherence: <span className="font-medium">{coherence_pct}%</span>
              {coherence_pct < 50
                ? " — multiple distinct answers, identity instability risk"
                : coherence_pct < 80
                ? " — some variation"
                : " — stable, consistent recognition"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function BenchmarkResultCard({ ba }: { ba: BenchmarkAnalysis }) {
  const presenceColor =
    ba.categoryPresenceScore >= 70
      ? "text-emerald-600 dark:text-emerald-400"
      : ba.categoryPresenceScore >= 40
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-500 dark:text-red-400";

  const coherenceColor =
    ba.identityCoherenceScore >= 70
      ? "text-emerald-600 dark:text-emerald-400"
      : ba.identityCoherenceScore >= 40
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-500 dark:text-red-400";

  const counts = {
    exceeds: 0,
    aligned: 0,
    underspecified: 0,
    outside: 0,
  };
  for (const r of Object.values(ba.attributeResults)) {
    if (r && r.gapClassification in counts) {
      counts[r.gapClassification as keyof typeof counts]++;
    }
  }

  return (
    <div className="rounded-xl border border-border p-5 space-y-5" data-testid="benchmark-result-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-muted-foreground" />
          Benchmark vs. {ba.categoryName}
        </h3>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Category Presence</p>
            <p className={`text-lg font-bold leading-none ${presenceColor}`} data-testid="text-category-presence">
              {ba.categoryPresenceScore}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Identity Coherence</p>
            <p className={`text-lg font-bold leading-none ${coherenceColor}`} data-testid="text-identity-coherence">
              {ba.identityCoherenceScore}%
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-muted/40 border border-border/50 p-4 space-y-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">How the AI currently understands this brand</p>
        <p className="text-sm leading-relaxed text-foreground italic" data-testid="text-brand-identity-summary">
          "{ba.brandIdentitySummary}"
        </p>
      </div>

      <div className={`rounded-lg border p-3 flex items-start gap-3 ${
        ba.wedgeCollision.detected
          ? "border-orange-300/50 dark:border-orange-700/50 bg-orange-50/50 dark:bg-orange-950/20"
          : "border-emerald-300/50 dark:border-emerald-700/50 bg-emerald-50/50 dark:bg-emerald-950/20"
      }`} data-testid="wedge-collision-status">
        {ba.wedgeCollision.detected ? (
          <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
        ) : (
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        )}
        <div>
          <p className={`text-xs font-medium ${ba.wedgeCollision.detected ? "text-orange-700 dark:text-orange-400" : "text-emerald-700 dark:text-emerald-400"}`}>
            {ba.wedgeCollision.detected
              ? `Wedge Collision${ba.wedgeCollision.collidingWinner ? ` — ${ba.wedgeCollision.collidingWinner}` : ""}`
              : "No Wedge Collision"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{ba.wedgeCollision.note}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        {(Object.entries(BENCHMARK_GAP_CONFIG) as [string, { label: string; color: string }][]).map(([type, cfg]) => (
          <div key={type} className="space-y-0.5">
            <p className={`text-lg font-bold ${cfg.color}`}>{counts[type as keyof typeof counts]}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{cfg.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function IdentityComparisonCard({ pa }: { pa: PacketAnalysis }) {
  const fitColor =
    pa.overallPacketFit >= 70
      ? "text-emerald-600 dark:text-emerald-400"
      : pa.overallPacketFit >= 40
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-500 dark:text-red-400";

  const identityColor =
    pa.identityMatchScore >= 70
      ? "text-emerald-600 dark:text-emerald-400"
      : pa.identityMatchScore >= 40
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-500 dark:text-red-400";

  return (
    <div className="rounded-xl border border-border p-5 space-y-5" data-testid="identity-comparison-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Package className="w-4 h-4 text-muted-foreground" />
          Packet Comparison
        </h3>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Overall Fit</p>
            <p className={`text-lg font-bold leading-none ${fitColor}`} data-testid="text-packet-fit">
              {pa.overallPacketFit}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Identity Match</p>
            <p className={`text-lg font-bold leading-none ${identityColor}`} data-testid="text-identity-match">
              {pa.identityMatchScore}%
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-muted/40 border border-border/50 p-4 space-y-1.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Ideal Identity</p>
          <p className="text-sm leading-relaxed text-foreground" data-testid="text-ideal-identity">
            {pa.idealIdentity}
          </p>
        </div>
        <div className="rounded-lg bg-muted/40 border border-border/50 p-4 space-y-1.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Recognized Identity</p>
          <p className="text-sm leading-relaxed text-foreground" data-testid="text-recognized-identity">
            {pa.recognizedIdentity}
          </p>
        </div>
      </div>

      {pa.identityConcepts.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Concept Coverage</p>
          <div className="space-y-1">
            {pa.identityConcepts.map((c, i) => {
              const cfg = CONCEPT_STATUS_CONFIG[c.status] || CONCEPT_STATUS_CONFIG.absent;
              return (
                <div key={i} className="flex items-start gap-2.5 py-1 border-b border-border/30 last:border-0" data-testid={`concept-row-${i}`}>
                  <span className={`text-sm font-bold shrink-0 w-4 ${cfg.color}`}>{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-foreground">{c.concept}</span>
                    {c.evidence && (
                      <span className="text-xs text-muted-foreground ml-2">— {c.evidence}</span>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[9px] px-1 py-0 h-4 capitalize ${
                      c.status === "present"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                        : c.status === "partial"
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                        : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
                    }`}
                  >
                    {c.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PacketDefinitionPanel({
  packet,
  onChange,
  disabled,
}: {
  packet: PacketDefinition;
  onChange: (p: PacketDefinition) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(true);

  const setAttr = (key: string, value: string) => {
    onChange({ ...packet, attributes: { ...packet.attributes, [key]: value } });
  };

  const setIdeal = (v: string) => onChange({ ...packet, idealIdentity: v });

  const applyTemplate = () => {
    onChange({ ...HEALTHCARE_UAE_TEMPLATE });
  };

  const textAreaKeys: string[] = ["service_list", "target_customer", "brand_wedge", "identity_summary"];

  return (
    <div className="rounded-xl border border-border/80 bg-muted/20">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left"
        data-testid="button-toggle-packet-panel"
      >
        <span className="text-sm font-medium flex items-center gap-2">
          <Package className="w-4 h-4 text-muted-foreground" />
          Packet Definition
          {packet.template && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 ml-1">
              {packet.template}
            </Badge>
          )}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-border/50">
          <div className="flex items-center gap-3 pt-4">
            <p className="text-xs text-muted-foreground flex-1">Load a pre-built template to populate all ideal attribute values:</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={applyTemplate}
              disabled={disabled}
              className="text-xs shrink-0"
              data-testid="button-apply-template"
            >
              Healthcare — UAE
            </Button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ideal Identity Statement</label>
            <Textarea
              data-testid="input-ideal-identity"
              placeholder="A DHA-licensed home healthcare provider delivering..."
              value={packet.idealIdentity}
              onChange={(e) => setIdeal(e.target.value)}
              disabled={disabled}
              rows={2}
              className="text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {ATTRIBUTE_KEYS.filter((k) => !textAreaKeys.includes(k) && k !== "identity_summary").map((k) => (
              <div key={k} className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">{ATTRIBUTE_LABELS[k]}</label>
                <Input
                  data-testid={`input-ideal-${k}`}
                  value={packet.attributes[k] ?? ""}
                  onChange={(e) => setAttr(k, e.target.value)}
                  disabled={disabled}
                  placeholder="Ideal value..."
                  className="text-xs h-8"
                />
              </div>
            ))}
          </div>

          {textAreaKeys.filter((k) => k !== "identity_summary").map((k) => (
            <div key={k} className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">{ATTRIBUTE_LABELS[k]}</label>
              <Textarea
                data-testid={`input-ideal-${k}`}
                value={packet.attributes[k] ?? ""}
                onChange={(e) => setAttr(k, e.target.value)}
                disabled={disabled}
                placeholder="Ideal value..."
                rows={2}
                className="text-xs resize-none"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BenchmarkCategoryPanel({
  category,
  onChange,
  disabled,
}: {
  category: string;
  onChange: (c: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-muted/20 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <BarChart2 className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Benchmark Category</span>
      </div>
      <div className="space-y-1.5">
        <Select value={category} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger data-testid="select-benchmark-category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BENCHMARK_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Your brand's recognized attributes will be semantically compared against the 6 category leaders in this market. No manual input required.
        </p>
      </div>
      <div className="rounded-lg bg-muted/40 border border-border/40 p-3">
        <p className="text-[10px] font-medium text-muted-foreground mb-1">Winner set: Home Healthcare — UAE</p>
        <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
          Manzil Health · Emirates Home Nursing · First Response Healthcare · Vesta Care · Nightingale Health Services · Call Doctor UAE
        </p>
      </div>
    </div>
  );
}

function JobResults({ jobId }: { jobId: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: job, isLoading } = useQuery<JobDetail>({
    queryKey: ["/api/brand-intelligence", jobId],
    refetchInterval: (query) => {
      const d = query.state.data as JobDetail | undefined;
      if (!d) return 2000;
      return d.status === "running" || d.status === "pending" ? 2000 : false;
    },
  });

  const resolveMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/brand-intelligence/${jobId}/resolve-sources`),
    onSuccess: async (data: any) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/brand-intelligence", jobId] });
      toast({ title: "Sources resolved", description: `${data.resolved ?? 0} URLs resolved to real domains.` });
    },
    onError: () => {
      toast({ title: "Resolution failed", description: "Could not resolve source URLs.", variant: "destructive" });
    },
  });

  if (isLoading || !job) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (job.status === "failed") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 p-5 text-sm text-red-700 dark:text-red-400">
        Analysis failed: {job.error || "Unknown error"}
      </div>
    );
  }

  if (job.status === "pending" || job.status === "running") {
    const pct = job.runCount > 0 ? Math.round((job.progress / job.runCount) * 100) : 0;
    const isPacketMode = job.packetMode;
    const isBenchmarkMode = job.benchmarkMode;
    return (
      <div className="space-y-4 py-8">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Running {ENGINE_LABELS[job.engine] || job.engine} — {job.progress} of {job.runCount} queries complete
            {job.progress === job.runCount && isPacketMode && " · running packet analysis…"}
            {job.progress === job.runCount && isBenchmarkMode && " · running benchmark analysis…"}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-foreground/80 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  if (!job.results) {
    return <p className="text-sm text-muted-foreground py-8">No results available.</p>;
  }

  const { attributes, diagnosis, packetAnalysis, benchmarkAnalysis } = job.results;
  const rootCause = ROOT_CAUSE_CONFIG[diagnosis.root_cause] || ROOT_CAUSE_CONFIG.WEAK_SIGNAL;
  const isPacketMode = job.packetMode && !!packetAnalysis;
  const isBenchmarkMode = job.benchmarkMode && !!benchmarkAnalysis;

  const hasUnresolvedSources = job.webSearch && Object.values(attributes).some((attr: any) =>
    attr?.sources?.some((url: string) => url.includes("vertexaisearch.cloud.google.com") || url.includes("grounding-api-redirect"))
  );

  return (
    <div className="space-y-6">
      {hasUnresolvedSources && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3">
          <p className="text-xs text-amber-700 dark:text-amber-400">Source URLs are still showing as grounding redirects — click to resolve to actual domains.</p>
          <Button
            size="sm"
            variant="outline"
            className="ml-4 shrink-0 text-amber-700 border-amber-300 hover:bg-amber-100 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/30"
            onClick={() => resolveMutation.mutate()}
            disabled={resolveMutation.isPending}
            data-testid="button-resolve-sources"
          >
            {resolveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
            Resolve sources
          </Button>
        </div>
      )}
      {isBenchmarkMode && benchmarkAnalysis ? (
        <BenchmarkResultCard ba={benchmarkAnalysis} />
      ) : isPacketMode && packetAnalysis ? (
        <IdentityComparisonCard pa={packetAnalysis} />
      ) : (
        <div className="rounded-xl border border-border p-5 space-y-3">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className={`text-xs px-2 py-0.5 ${rootCause.color}`}>
              {rootCause.label}
            </Badge>
            <span className="text-xs text-muted-foreground mt-0.5">Avg. confidence: {diagnosis.avg_confidence}%</span>
            {diagnosis.avg_coherence !== undefined && (
              <span className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <CoherenceDot pct={diagnosis.avg_coherence} />
                Coherence: {diagnosis.avg_coherence}%
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{rootCause.description}</p>

          {diagnosis.identity_summary && (
            <p className="text-sm font-medium text-foreground pt-1 border-t border-border/50">
              "{diagnosis.identity_summary}"
            </p>
          )}

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-1">
                Strong ({diagnosis.strong_attributes.length})
              </p>
              <div className="space-y-0.5">
                {diagnosis.strong_attributes.length === 0 ? (
                  <p className="text-xs text-muted-foreground">None</p>
                ) : (
                  diagnosis.strong_attributes.map((k) => (
                    <p key={k} className="text-xs text-foreground">{ATTRIBUTE_LABELS[k] || k}</p>
                  ))
                )}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400 mb-1">
                Weak ({diagnosis.weak_attributes.length})
              </p>
              <div className="space-y-0.5">
                {diagnosis.weak_attributes.length === 0 ? (
                  <p className="text-xs text-muted-foreground">None</p>
                ) : (
                  diagnosis.weak_attributes.map((k) => (
                    <p key={k} className="text-xs text-foreground">{ATTRIBUTE_LABELS[k] || k}</p>
                  ))
                )}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-red-600 dark:text-red-400 mb-1">
                Absent ({diagnosis.absent_attributes.length})
              </p>
              <div className="space-y-0.5">
                {diagnosis.absent_attributes.length === 0 ? (
                  <p className="text-xs text-muted-foreground">None</p>
                ) : (
                  diagnosis.absent_attributes.map((k) => (
                    <p key={k} className="text-xs text-foreground">{ATTRIBUTE_LABELS[k] || k}</p>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isPacketMode && packetAnalysis && (
        <div className="rounded-xl border border-border p-4">
          <div className="grid grid-cols-4 gap-2 text-center">
            {Object.entries(GAP_TYPE_CONFIG).map(([type, cfg]) => {
              const count = Object.values(packetAnalysis.attributeMatches).filter(
                (m) => m?.gapType === type
              ).length;
              return (
                <div key={type} className="space-y-0.5">
                  <p className={`text-lg font-bold ${cfg.color}`}>{count}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{cfg.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Attribute Table</h3>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            {isBenchmarkMode ? (
              Object.entries(BENCHMARK_GAP_CONFIG).map(([type, cfg]) => (
                <span key={type} className={`flex items-center gap-1 ${cfg.color}`}>
                  <span className={`w-2 h-2 rounded-sm ${cfg.bar} inline-block`} />
                  {cfg.label}
                </span>
              ))
            ) : isPacketMode ? (
              Object.entries(GAP_TYPE_CONFIG).map(([type, cfg]) => (
                <span key={type} className={`flex items-center gap-1 ${cfg.color}`}>
                  <span className={`w-2 h-2 rounded-sm ${cfg.bar} inline-block`} />
                  {cfg.label}
                </span>
              ))
            ) : (
              <>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" /> ≥70%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500 inline-block" /> 30–70%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-400 inline-block" /> &lt;30%</span>
              </>
            )}
          </div>
        </div>
        <div>
          {ATTRIBUTE_KEYS.filter((k) => k !== "identity_summary").map((k) => {
            const result = attributes[k];
            if (!result) return null;
            const pm = isPacketMode ? packetAnalysis?.attributeMatches[k] : undefined;
            const br = isBenchmarkMode ? benchmarkAnalysis?.attributeResults[k] : undefined;
            return <AttributeRow key={k} attrKey={k} result={result} packetMatch={pm} benchmarkResult={br} />;
          })}
          {attributes["identity_summary"] && (
            <AttributeRow
              key="identity_summary"
              attrKey="identity_summary"
              result={attributes["identity_summary"]}
              packetMatch={isPacketMode ? packetAnalysis?.attributeMatches["identity_summary"] : undefined}
              benchmarkResult={isBenchmarkMode ? benchmarkAnalysis?.attributeResults["identity_summary"] : undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
}

const DEFAULT_PACKET: PacketDefinition = {
  idealIdentity: "",
  attributes: {},
};

export default function BrandIntelligence() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [brandName, setBrandName] = useState("");
  const [brandUrl, setBrandUrl] = useState("");
  const [engine, setEngine] = useState("gemini");
  const [runCount, setRunCount] = useState("10");
  const [webSearch, setWebSearch] = useState(true);
  const [mode, setMode] = useState<"recall" | "packet" | "benchmark">("recall");
  const [packet, setPacket] = useState<PacketDefinition>({ ...DEFAULT_PACKET });
  const [benchmarkCategory, setBenchmarkCategory] = useState("healthcare_uae");
  const [activeJobId, setActiveJobId] = useState<number | null>(null);

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/brand-intelligence"],
    refetchInterval: (query) => {
      const list = query.state.data as Job[] | undefined;
      if (!list) return false;
      const hasRunning = list.some((j) => j.status === "running" || j.status === "pending");
      return hasRunning ? 3000 : false;
    },
  });

  const startMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/brand-intelligence", {
        brandName: brandName.trim(),
        brandUrl: brandUrl.trim() || undefined,
        engine,
        runCount: parseInt(runCount),
        webSearch: engine !== "claude" && webSearch,
        packetMode: mode === "packet",
        packetDefinition:
          mode === "packet" && packet.idealIdentity.trim()
            ? { ...packet, template: packet.template || undefined }
            : undefined,
        benchmarkMode: mode === "benchmark",
        benchmarkCategory: mode === "benchmark" ? benchmarkCategory : undefined,
      }),
    onSuccess: async (res) => {
      const data = await res.json();
      setActiveJobId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/brand-intelligence"] });
    },
    onError: (err) => {
      toast({ title: "Failed to start", description: String(err), variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      toast({ title: "Brand name required", variant: "destructive" });
      return;
    }
    if (mode === "packet" && !packet.idealIdentity.trim()) {
      toast({ title: "Ideal identity required", description: "Fill the Ideal Identity Statement or apply a template.", variant: "destructive" });
      return;
    }
    startMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <nav className="w-full border-b border-border sticky top-0 z-50 bg-background">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="link-back-home"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            BrandSense
          </Link>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Brand AI Memory</span>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10 space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-heading">
            Brand AI Memory Diagnosis
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
            Measure what the AI reliably knows about a brand — and benchmark it against category leaders to reveal precise gaps.
          </p>
        </div>

        <div className="flex gap-1 p-1 rounded-lg border border-border bg-muted/30 w-fit" data-testid="mode-toggle">
          {(["recall", "packet", "benchmark"] as const).map((m) => {
            const icon = m === "recall" ? <Zap className="w-3.5 h-3.5" /> : m === "packet" ? <Package className="w-3.5 h-3.5" /> : <BarChart2 className="w-3.5 h-3.5" />;
            const label = m === "recall" ? "Recall" : m === "packet" ? "Packet" : "Benchmark";
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mode === m
                    ? "bg-background shadow-sm text-foreground border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`button-mode-${m}`}
              >
                {icon}
                {label}
              </button>
            );
          })}
        </div>

        {mode === "packet" && (
          <PacketDefinitionPanel
            packet={packet}
            onChange={setPacket}
            disabled={startMutation.isPending}
          />
        )}

        {mode === "benchmark" && (
          <BenchmarkCategoryPanel
            category={benchmarkCategory}
            onChange={setBenchmarkCategory}
            disabled={startMutation.isPending}
          />
        )}

        <form onSubmit={handleSubmit} className="rounded-xl border border-border p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Brand Name</label>
              <Input
                data-testid="input-brand-name"
                placeholder="e.g. Vesta Care"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                disabled={startMutation.isPending}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Website URL <span className="normal-case font-normal">(optional)</span>
              </label>
              <Input
                data-testid="input-brand-url"
                placeholder="https://vestacare.ae"
                value={brandUrl}
                onChange={(e) => setBrandUrl(e.target.value)}
                disabled={startMutation.isPending}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">AI Engine</label>
              <Select
                value={engine}
                onValueChange={(v) => {
                  setEngine(v);
                  if (v === "claude") setWebSearch(false);
                }}
                disabled={startMutation.isPending}
              >
                <SelectTrigger data-testid="select-engine">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Gemini</SelectItem>
                  <SelectItem value="chatgpt">ChatGPT</SelectItem>
                  <SelectItem value="claude">Claude</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Run Count <span className="normal-case font-normal">(sampling depth)</span>
              </label>
              <Select value={runCount} onValueChange={setRunCount} disabled={startMutation.isPending}>
                <SelectTrigger data-testid="select-run-count">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 runs — quick</SelectItem>
                  <SelectItem value="10">10 runs — standard</SelectItem>
                  <SelectItem value="15">15 runs — thorough</SelectItem>
                  <SelectItem value="20">20 runs — deep</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="webSearch"
              data-testid="checkbox-web-search"
              checked={webSearch}
              onCheckedChange={(v) => setWebSearch(v === true)}
              disabled={startMutation.isPending || engine === "claude"}
            />
            <label
              htmlFor="webSearch"
              className={`text-xs cursor-pointer select-none ${
                engine === "claude" ? "text-muted-foreground/50" : "text-muted-foreground"
              }`}
            >
              Enable web search — sources will be cited per attribute
              {engine === "claude" && <span className="ml-1 italic">(not available for Claude)</span>}
            </label>
          </div>

          <div className="pt-1">
            <Button type="submit" disabled={startMutation.isPending} data-testid="button-run-diagnosis">
              {startMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting…
                </>
              ) : mode === "benchmark" ? (
                "Run Benchmark Analysis"
              ) : mode === "packet" ? (
                "Run Packet Analysis"
              ) : (
                "Run Diagnosis"
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              {mode === "benchmark"
                ? `After ${runCount} sampling runs, attributes will be semantically compared against 6 UAE home healthcare market leaders.`
                : mode === "packet"
                ? "After sampling, each attribute will be semantically matched against your ideal packet values."
                : `Each run uses a different query framing — describe, compare, recommend — distributed across ${runCount} calls.`}
            </p>
          </div>
        </form>

        {activeJobId && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold" data-testid="text-active-results-heading">
                Results
              </h2>
              <button
                onClick={() => setActiveJobId(null)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            </div>
            <JobResults jobId={activeJobId} />
          </div>
        )}

        {jobs.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Previous Diagnoses
            </h2>
            <div className="rounded-xl border border-border divide-y divide-border/50">
              {jobs.map((job) => (
                <button
                  key={job.id}
                  data-testid={`job-row-${job.id}`}
                  onClick={() => setActiveJobId(job.id)}
                  className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
                >
                  <StatusIcon status={job.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{job.brandName}</p>
                    <p className="text-xs text-muted-foreground">
                      {ENGINE_LABELS[job.engine] || job.engine}
                      {job.webSearch && <span className="ml-1 text-blue-500">· web search</span>}
                      {job.packetMode && <span className="ml-1 text-purple-500">· packet</span>}
                      {job.benchmarkMode && (
                        <span className="ml-1 text-sky-500">
                          · benchmark{job.benchmarkCategory ? ` (${BENCHMARK_CATEGORIES.find(c => c.value === job.benchmarkCategory)?.label ?? job.benchmarkCategory})` : ""}
                        </span>
                      )}
                      {" "}· {job.runCount} runs ·{" "}
                      {job.status === "running"
                        ? `${job.progress}/${job.runCount} complete`
                        : job.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {job.categoryPresenceScore != null && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 tabular-nums">
                        {job.categoryPresenceScore}%
                      </span>
                    )}
                    {job.identityCoherenceScore != null && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 tabular-nums">
                        <CoherenceDot pct={job.identityCoherenceScore} />
                        {job.identityCoherenceScore}%
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

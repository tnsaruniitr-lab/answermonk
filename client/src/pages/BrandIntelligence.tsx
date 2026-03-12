import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Brain, Loader2, CheckCircle, XCircle, Clock, ChevronRight, ExternalLink, Package, Zap, ChevronDown, ChevronUp } from "lucide-react";
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

interface Job {
  id: number;
  brandName: string;
  brandUrl: string | null;
  engine: string;
  runCount: number;
  webSearch: boolean;
  packetMode: boolean;
  status: string;
  progress: number;
  createdAt: string;
}

interface AttributeResult {
  confidence_pct: number;
  mode_value: string | null;
  mode_evidence: string;
  value_counts: Record<string, number>;
  evidence_counts: Record<string, number>;
  sources: string[];
}

interface JobDetail extends Job {
  packetDefinition: PacketDefinition | null;
  results: {
    attributes: Record<string, AttributeResult>;
    diagnosis: {
      root_cause: string;
      avg_confidence: number;
      strong_attributes: string[];
      weak_attributes: string[];
      absent_attributes: string[];
      identity_summary: string | null;
    };
    packetAnalysis?: PacketAnalysis;
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
      className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 dark:text-blue-400 hover:underline max-w-[140px] truncate"
      title={url}
      data-testid={`source-link-${label}`}
    >
      {label}
      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
    </a>
  );
}

function AttributeRow({
  attrKey,
  result,
  packetMatch,
}: {
  attrKey: string;
  result: AttributeResult;
  packetMatch?: AttributePacketMatch;
}) {
  const label = ATTRIBUTE_LABELS[attrKey] || attrKey;
  const { confidence_pct, mode_value, mode_evidence, sources = [] } = result;
  const isIdentity = attrKey === "identity_summary";
  const gapCfg = packetMatch ? GAP_TYPE_CONFIG[packetMatch.gapType] : null;

  return (
    <div
      className={`py-3 border-b border-border/50 last:border-0 ${isIdentity ? "pt-4 mt-1" : ""}`}
      data-testid={`attr-row-${attrKey}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-36 shrink-0">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        </div>

        <div className="flex-1 min-w-0 space-y-0.5">
          {packetMatch && (
            <p className="text-[10px] text-muted-foreground/70 leading-tight line-clamp-1" title={packetMatch.idealValue}>
              <span className="font-medium">Ideal:</span> {packetMatch.idealValue}
            </p>
          )}
          {mode_value ? (
            <p className="text-sm text-foreground leading-snug">{mode_value}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">Not known</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {packetMatch ? (
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

          {!packetMatch && (
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 h-5 ${EVIDENCE_COLORS[mode_evidence] || EVIDENCE_COLORS.GENERIC}`}
            >
              {mode_evidence || "GENERIC"}
            </Badge>
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

  const textAreaKeys: (keyof typeof ATTRIBUTE_LABELS)[] = [
    "service_list",
    "target_customer",
    "brand_wedge",
    "identity_summary",
  ];

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
            <p className="text-[11px] text-muted-foreground">The prose benchmark identity the AI should ideally recognize for top brands in this category.</p>
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

function JobResults({ jobId }: { jobId: number }) {
  const { data: job, isLoading } = useQuery<JobDetail>({
    queryKey: ["/api/brand-intelligence", jobId],
    refetchInterval: (query) => {
      const d = query.state.data as JobDetail | undefined;
      if (!d) return 2000;
      return d.status === "running" || d.status === "pending" ? 2000 : false;
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
    return (
      <div className="space-y-4 py-8">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Running {ENGINE_LABELS[job.engine] || job.engine} — {job.progress} of {job.runCount} queries complete
            {job.progress === job.runCount && isPacketMode && " · running packet analysis…"}
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

  const { attributes, diagnosis, packetAnalysis } = job.results;
  const rootCause = ROOT_CAUSE_CONFIG[diagnosis.root_cause] || ROOT_CAUSE_CONFIG.WEAK_SIGNAL;
  const isPacketMode = job.packetMode && !!packetAnalysis;

  return (
    <div className="space-y-6">
      {isPacketMode && packetAnalysis ? (
        <IdentityComparisonCard pa={packetAnalysis} />
      ) : (
        <div className="rounded-xl border border-border p-5 space-y-3">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className={`text-xs px-2 py-0.5 ${rootCause.color}`}>
              {rootCause.label}
            </Badge>
            <span className="text-xs text-muted-foreground mt-0.5">Avg. confidence: {diagnosis.avg_confidence}%</span>
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
          {isPacketMode ? (
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              {Object.entries(GAP_TYPE_CONFIG).map(([type, cfg]) => (
                <span key={type} className={`flex items-center gap-1 ${cfg.color}`}>
                  <span className={`w-2 h-2 rounded-sm ${cfg.bar} inline-block`} />
                  {cfg.label}
                </span>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" /> ≥70%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500 inline-block" /> 30–70%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-400 inline-block" /> &lt;30%</span>
            </div>
          )}
        </div>
        <div>
          {ATTRIBUTE_KEYS.filter((k) => k !== "identity_summary").map((k) => {
            const result = attributes[k];
            if (!result) return null;
            const pm = isPacketMode ? packetAnalysis?.attributeMatches[k] : undefined;
            return <AttributeRow key={k} attrKey={k} result={result} packetMatch={pm} />;
          })}
          {attributes["identity_summary"] && (
            <AttributeRow
              key="identity_summary"
              attrKey="identity_summary"
              result={attributes["identity_summary"]}
              packetMatch={isPacketMode ? packetAnalysis?.attributeMatches["identity_summary"] : undefined}
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
  const [webSearch, setWebSearch] = useState(false);
  const [mode, setMode] = useState<"recall" | "packet">("recall");
  const [packet, setPacket] = useState<PacketDefinition>({ ...DEFAULT_PACKET });
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
            Run repeated sampling queries to measure what the AI reliably knows about a brand — and optionally compare it against an ideal category packet.
          </p>
        </div>

        <div className="flex gap-2 p-1 rounded-lg border border-border bg-muted/30 w-fit" data-testid="mode-toggle">
          <button
            type="button"
            onClick={() => setMode("recall")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === "recall"
                ? "bg-background shadow-sm text-foreground border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="button-mode-recall"
          >
            <Zap className="w-3.5 h-3.5" />
            Recall Mode
          </button>
          <button
            type="button"
            onClick={() => setMode("packet")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === "packet"
                ? "bg-background shadow-sm text-foreground border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="button-mode-packet"
          >
            <Package className="w-3.5 h-3.5" />
            Packet Mode
          </button>
        </div>

        {mode === "packet" && (
          <PacketDefinitionPanel
            packet={packet}
            onChange={setPacket}
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
              ) : mode === "packet" ? (
                "Run Packet Analysis"
              ) : (
                "Run Diagnosis"
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              {mode === "packet"
                ? "After sampling, each attribute will be semantically matched against your ideal packet values."
                : "Each run uses a different query framing — describe, compare, recommend — distributed across " + runCount + " calls."}
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
                      {" "}· {job.runCount} runs ·{" "}
                      {job.status === "running"
                        ? `${job.progress}/${job.runCount} complete`
                        : job.status}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

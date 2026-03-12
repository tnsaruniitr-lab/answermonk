import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Brain, Loader2, CheckCircle, XCircle, Clock, ChevronRight } from "lucide-react";
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

const CONFIDENCE_BAR = (pct: number) => {
  if (pct >= 70) return "bg-emerald-500";
  if (pct >= 30) return "bg-amber-500";
  return "bg-red-400";
};

const ROOT_CAUSE_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  STRONG: {
    label: "Strong AI Identity",
    color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    description: "This brand has clear, consistent, and distinctive representation in AI memory.",
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
    description: "This brand has minimal or no meaningful representation in AI training knowledge.",
  },
};

const ENGINE_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  claude: "Claude",
};

interface Job {
  id: number;
  brandName: string;
  brandUrl: string | null;
  engine: string;
  runCount: number;
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
}

interface JobDetail extends Job {
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
  } | null;
  error: string | null;
}

function StatusIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle className="w-4 h-4 text-emerald-500" />;
  if (status === "failed") return <XCircle className="w-4 h-4 text-red-500" />;
  if (status === "running") return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
  return <Clock className="w-4 h-4 text-muted-foreground" />;
}

function AttributeRow({ attrKey, result }: { attrKey: string; result: AttributeResult }) {
  const label = ATTRIBUTE_LABELS[attrKey] || attrKey;
  const { confidence_pct, mode_value, mode_evidence } = result;
  const isIdentity = attrKey === "identity_summary";

  return (
    <div className={`flex items-start gap-4 py-3 border-b border-border/50 last:border-0 ${isIdentity ? "pt-4 mt-1" : ""}`} data-testid={`attr-row-${attrKey}`}>
      <div className="w-44 shrink-0">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="flex-1 min-w-0">
        {mode_value ? (
          <p className="text-sm text-foreground leading-snug truncate" title={mode_value}>{mode_value}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">Not known</p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
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
        {mode_evidence && mode_evidence !== "GENERIC" ? (
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${EVIDENCE_COLORS[mode_evidence] || EVIDENCE_COLORS.GENERIC}`}>
            {mode_evidence}
          </Badge>
        ) : (
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${EVIDENCE_COLORS.GENERIC}`}>
            GENERIC
          </Badge>
        )}
      </div>
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
    return (
      <div className="space-y-4 py-8">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Running {ENGINE_LABELS[job.engine] || job.engine} — {job.progress} of {job.runCount} queries complete
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

  const { attributes, diagnosis } = job.results;
  const rootCause = ROOT_CAUSE_CONFIG[diagnosis.root_cause] || ROOT_CAUSE_CONFIG.WEAK_SIGNAL;

  return (
    <div className="space-y-6">
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

      <div className="rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Attribute Table</h3>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" /> ≥70% explicit</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500 inline-block" /> 30–70%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-400 inline-block" /> &lt;30%</span>
          </div>
        </div>
        <div>
          {ATTRIBUTE_KEYS.filter((k) => k !== "identity_summary").map((k) => {
            const result = attributes[k];
            if (!result) return null;
            return <AttributeRow key={k} attrKey={k} result={result} />;
          })}
          {attributes["identity_summary"] && (
            <AttributeRow key="identity_summary" attrKey="identity_summary" result={attributes["identity_summary"]} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function BrandIntelligence() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [brandName, setBrandName] = useState("");
  const [brandUrl, setBrandUrl] = useState("");
  const [engine, setEngine] = useState("gemini");
  const [runCount, setRunCount] = useState("10");
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
    startMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <nav className="w-full border-b border-border sticky top-0 z-50 bg-background">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-back-home">
            <ArrowLeft className="w-3.5 h-3.5" />
            BrandSense
          </Link>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Brand AI Memory</span>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10 space-y-10">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-heading">Brand AI Memory Diagnosis</h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
            Run repeated sampling queries against a single AI engine to measure what it reliably knows about a brand — and what's missing, blurred, or absent from its memory.
          </p>
        </div>

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
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Website URL <span className="normal-case font-normal">(optional)</span></label>
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
              <Select value={engine} onValueChange={setEngine} disabled={startMutation.isPending}>
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
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Run Count <span className="normal-case font-normal">(sampling depth)</span></label>
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

          <div className="pt-1">
            <Button type="submit" disabled={startMutation.isPending} data-testid="button-run-diagnosis">
              {startMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting…</>
              ) : (
                "Run Diagnosis"
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Each run uses a different query framing — describe, compare, recommend — distributed across {runCount} calls.
            </p>
          </div>
        </form>

        {activeJobId && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold" data-testid="text-active-results-heading">Results</h2>
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
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Previous Diagnoses</h2>
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
                      {ENGINE_LABELS[job.engine] || job.engine} · {job.runCount} runs ·{" "}
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

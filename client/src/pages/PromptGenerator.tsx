import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  ArrowLeft,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  X,
  Sparkles,
  Zap,
  Globe,
  BarChart3,
  Trophy,
  Target,
  Eye,
  TrendingUp,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface Prompt {
  id: string;
  cluster: string;
  shape: string;
  text: string;
  slots_used: Record<string, string>;
  tags: string[];
  modifier_included: boolean;
  geo_included: boolean;
}

interface PromptSet {
  prompt_set_id: string;
  version: string;
  seed_used: number;
  counts: {
    by_cluster: Record<string, number>;
    by_shape: Record<string, number>;
    modifier_prompts: number;
    geo_prompts: number;
  };
  prompts: Prompt[];
  unverified_items: { key: string; display: string }[];
}

interface SavedProfile {
  id: number;
  brandName: string;
  brandDomain: string | null;
  persona: string;
  verticals: string[];
  services: string[];
  modifiers: string[];
  geo: string | null;
  budgetTier: string;
}

interface Presets {
  [persona: string]: {
    verticals: string[];
    services: string[];
    modifiers: string[];
  };
}

interface ClusterBreakdown {
  appearance_rate: number;
  primary_rate: number;
  valid_runs: number;
}

interface CompetitorScore {
  name: string;
  share: number;
  appearances: number;
}

interface GEOScore {
  valid_runs: number;
  total_runs: number;
  invalid_runs: number;
  appearance_rate: number;
  primary_rate: number;
  avg_rank: number | null;
  competitors: CompetitorScore[];
  cluster_breakdown: Record<string, ClusterBreakdown>;
  engine_breakdown: Record<string, { appearance_rate: number; primary_rate: number; valid_runs: number }>;
}

interface RawRun {
  prompt_id: string;
  prompt_text: string;
  cluster: string;
  engine: string;
  raw_text: string;
  candidates: string[];
  brand_found: boolean;
  brand_rank: number | null;
}

interface ScoringResponse {
  job_id: number;
  score: GEOScore;
  prompts_used: number;
  mode: string;
  raw_runs?: RawRun[];
}

const WAITING_MESSAGES = [
  "Searching the web for your brand...",
  "Asking ChatGPT what it thinks...",
  "Checking if Gemini knows your name...",
  "Claude is thinking it over...",
  "Scanning competitor landscapes...",
  "Mapping your AI presence...",
  "Crunching the numbers...",
  "Analyzing recommendation patterns...",
  "Cross-referencing across engines...",
  "Building your competitive profile...",
  "Almost there, final checks...",
  "Putting it all together...",
];

function TagInput({
  values,
  onChange,
  placeholder,
  suggestions,
  maxItems,
  testIdPrefix,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  suggestions?: string[];
  maxItems?: number;
  testIdPrefix: string;
}) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filtered = useMemo(() => {
    if (!suggestions) return [];
    const available = suggestions.filter(
      (s) => !values.some((v) => v.toLowerCase() === s.toLowerCase()),
    );
    if (!input.trim()) return available.slice(0, 12);
    const lower = input.toLowerCase();
    return available
      .filter((s) => s.toLowerCase().includes(lower))
      .slice(0, 12);
  }, [suggestions, input, values]);

  const addValue = (val: string) => {
    const trimmed = val.trim();
    if (
      !trimmed ||
      values.some((v) => v.toLowerCase() === trimmed.toLowerCase())
    )
      return;
    if (maxItems && values.length >= maxItems) return;
    onChange([...values, trimmed]);
    setInput("");
    setShowSuggestions(false);
  };

  const removeValue = (idx: number) => {
    onChange(values.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filtered.length > 0) {
        addValue(filtered[0]);
      } else if (input.trim()) {
        addValue(input);
      }
    }
    if (e.key === "Backspace" && !input && values.length > 0) {
      removeValue(values.length - 1);
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 p-2 border border-border rounded-md bg-secondary/50 min-h-[2.5rem]">
        {values.map((v, i) => (
          <Badge
            key={i}
            variant="secondary"
            className="text-xs gap-1"
            data-testid={`${testIdPrefix}-tag-${i}`}
          >
            {v}
            <button
              type="button"
              onClick={() => removeValue(i)}
              className="ml-0.5"
              data-testid={`${testIdPrefix}-remove-${i}`}
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={values.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
          data-testid={`${testIdPrefix}-input`}
        />
      </div>
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 border border-border rounded-md bg-popover shadow-md max-h-48 overflow-y-auto">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addValue(s)}
              className="w-full text-left px-3 py-1.5 text-sm hover-elevate"
              data-testid={`${testIdPrefix}-suggestion-${s}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      {maxItems && (
        <span className="text-xs text-muted-foreground mt-1 block">
          {values.length}/{maxItems}
        </span>
      )}
    </div>
  );
}

function CopyButton({ text, promptId }: { text: string; promptId: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      data-testid={`button-copy-${promptId}`}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </Button>
  );
}

const CLUSTER_LABELS: Record<string, string> = {
  direct: "Direct",
  persona: "Persona",
  budget: "Budget",
  task: "Task",
};
const SHAPE_LABELS: Record<string, string> = {
  open: "Open",
  top3: "Top 3",
  top5: "Top 5",
  best: "Best",
};

const CLUSTER_DESCRIPTIONS: Record<string, string> = {
  direct: "Do they know your name?",
  persona: "Right audience fit?",
  task: "Linked to your services?",
  budget: "Right price positioning?",
};

const ENGINE_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  claude: "Claude",
};

function WaitingScreen() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % WAITING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      key="scoring"
      className="pt-32 pb-16 flex flex-col items-center gap-6"
    >
      <div className="relative">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={msgIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="text-sm text-muted-foreground text-center"
          data-testid="text-waiting-message"
        >
          {WAITING_MESSAGES[msgIndex]}
        </motion.p>
      </AnimatePresence>
      <p className="text-xs text-muted-foreground/60">
        This can take 30-60 seconds
      </p>
    </motion.div>
  );
}

function ScoreCard({ label, value, suffix, icon: Icon, description }: {
  label: string;
  value: string;
  suffix?: string;
  icon: any;
  description: string;
}) {
  return (
    <Card className="p-4 space-y-2" data-testid={`score-card-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-semibold">{value}</span>
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </Card>
  );
}

function RawRunsSection({ runs }: { runs: RawRun[] }) {
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [engineFilter, setEngineFilter] = useState<string>("all");
  const [clusterFilter, setClusterFilter] = useState<string>("all");

  const grouped = useMemo(() => {
    let filtered = runs;
    if (engineFilter !== "all") filtered = filtered.filter((r) => r.engine === engineFilter);
    if (clusterFilter !== "all") filtered = filtered.filter((r) => r.cluster === clusterFilter);

    const byPrompt: Record<string, RawRun[]> = {};
    for (const run of filtered) {
      if (!byPrompt[run.prompt_id]) byPrompt[run.prompt_id] = [];
      byPrompt[run.prompt_id].push(run);
    }
    return byPrompt;
  }, [runs, engineFilter, clusterFilter]);

  const engines = [...new Set(runs.map((r) => r.engine))];
  const clusters = [...new Set(runs.map((r) => r.cluster))];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          Raw LLM Responses
        </h3>
        <div className="flex items-center gap-2">
          <Select value={engineFilter} onValueChange={setEngineFilter}>
            <SelectTrigger className="h-7 text-xs w-28" data-testid="select-raw-engine-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Engines</SelectItem>
              {engines.map((e) => (
                <SelectItem key={e} value={e}>{ENGINE_LABELS[e] || e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={clusterFilter} onValueChange={setClusterFilter}>
            <SelectTrigger className="h-7 text-xs w-28" data-testid="select-raw-cluster-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {clusters.map((c) => (
                <SelectItem key={c} value={c}>{CLUSTER_LABELS[c] || c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="border border-border rounded-md divide-y divide-border" data-testid="section-raw-runs">
        {Object.entries(grouped).map(([promptId, promptRuns]) => {
          const first = promptRuns[0];
          const isExpanded = expandedRun === promptId;
          return (
            <div key={promptId}>
              <button
                type="button"
                onClick={() => setExpandedRun(isExpanded ? null : promptId)}
                className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer"
                data-testid={`button-expand-run-${promptId}`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {isExpanded
                    ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                    : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                  }
                  <span className="text-xs text-muted-foreground shrink-0 capitalize">{first.cluster}</span>
                  <span className="text-sm truncate">{first.prompt_text}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {promptRuns.map((r) => (
                    <span
                      key={r.engine}
                      className={`text-[10px] px-1.5 py-0.5 rounded ${r.brand_found ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-secondary text-muted-foreground'}`}
                    >
                      {(ENGINE_LABELS[r.engine] || r.engine).slice(0, 3)}
                    </span>
                  ))}
                </div>
              </button>
              {isExpanded && (
                <div className="px-4 pb-3 space-y-3">
                  {promptRuns.map((r) => (
                    <div key={r.engine} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium">{ENGINE_LABELS[r.engine] || r.engine}</span>
                        <div className="flex items-center gap-2">
                          {r.brand_found && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                              Found {r.brand_rank !== null ? `#${r.brand_rank}` : ""}
                            </span>
                          )}
                          {r.candidates.length > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              {r.candidates.length} brands extracted
                            </span>
                          )}
                        </div>
                      </div>
                      <pre className="text-xs text-muted-foreground bg-secondary/50 rounded-md p-3 whitespace-pre-wrap font-[inherit] leading-relaxed max-h-48 overflow-y-auto" data-testid={`text-raw-run-${r.prompt_id}-${r.engine}`}>
                        {r.raw_text}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {Object.keys(grouped).length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No results match the current filters.</p>
        )}
      </div>
    </div>
  );
}

function ResultsDashboard({ score, brandName, mode, promptsUsed, rawRuns, onNewAnalysis }: {
  score: GEOScore;
  brandName: string;
  mode: string;
  promptsUsed: number;
  rawRuns?: RawRun[];
  onNewAnalysis: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      key="results-dashboard"
    >
      <div className="pt-8 pb-6 space-y-2">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold tracking-tight" data-testid="text-score-heading">
              GEO Score for {brandName}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {promptsUsed} prompts x 3 engines = {score.valid_runs} valid runs
              {score.invalid_runs > 0 && ` (${score.invalid_runs} invalid)`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewAnalysis}
            data-testid="button-new-analysis"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            New Analysis
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <ScoreCard
          label="Appearance Rate"
          value={`${Math.round(score.appearance_rate * 100)}%`}
          icon={Eye}
          description="How often AI mentions you"
        />
        <ScoreCard
          label="Top 3 Rate"
          value={`${Math.round(score.primary_rate * 100)}%`}
          icon={Trophy}
          description="How often you're a top pick"
        />
        <ScoreCard
          label="Avg Rank"
          value={score.avg_rank !== null ? `#${score.avg_rank}` : "N/A"}
          icon={TrendingUp}
          description={score.avg_rank !== null ? "Your typical position when found" : "Not found in any responses"}
        />
      </div>

      {Object.keys(score.engine_breakdown).length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            By Engine
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(score.engine_breakdown).map(([engine, data]) => (
              <Card key={engine} className="p-3 space-y-1.5" data-testid={`engine-card-${engine}`}>
                <span className="text-xs font-medium text-muted-foreground">
                  {ENGINE_LABELS[engine] || engine}
                </span>
                <div className="text-lg font-semibold">
                  {Math.round(data.appearance_rate * 100)}%
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Top 3</span>
                  <span className="text-xs font-medium">{Math.round(data.primary_rate * 100)}%</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {Object.keys(score.cluster_breakdown).length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            By Query Type
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(score.cluster_breakdown).map(([cluster, data]) => (
              <Card key={cluster} className="p-3 space-y-1.5" data-testid={`cluster-card-${cluster}`}>
                <span className="text-xs font-medium text-muted-foreground capitalize">
                  {CLUSTER_LABELS[cluster] || cluster}
                </span>
                <div className="text-lg font-semibold">
                  {Math.round(data.appearance_rate * 100)}%
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {CLUSTER_DESCRIPTIONS[cluster] || ""}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Top 3</span>
                  <span className="text-xs font-medium">{Math.round(data.primary_rate * 100)}%</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {(() => {
        const brandEntry = {
          name: brandName,
          share: score.appearance_rate,
          appearances: 0,
          isBrand: true as const,
        };
        const allEntries = [brandEntry, ...score.competitors.map(c => ({ ...c, isBrand: false as const }))]
          .sort((a, b) => b.share - a.share);
        return allEntries.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              Brand & Competitor Rankings
            </h3>
            <Card>
              <div className="divide-y divide-border">
                {allEntries.map((entry, i) => (
                  <div
                    key={entry.name}
                    className={`flex items-center justify-between gap-4 px-4 py-2.5 ${entry.isBrand ? "bg-primary/10" : ""}`}
                    data-testid={entry.isBrand ? "brand-row" : `competitor-row-${i}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs text-muted-foreground font-mono w-5 text-right shrink-0">
                        {i + 1}
                      </span>
                      <span className={`text-sm truncate ${entry.isBrand ? "font-semibold text-primary" : ""}`}>
                        {entry.name}
                        {entry.isBrand && (
                          <span className="ml-1.5 text-[10px] uppercase tracking-wider font-medium text-primary/70">
                            You
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${entry.isBrand ? "bg-primary" : "bg-foreground/40"}`}
                          style={{ width: `${Math.round(entry.share * 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium w-10 text-right ${entry.isBrand ? "text-primary" : ""}`}>
                        {Math.round(entry.share * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        );
      })()}

      {rawRuns && rawRuns.length > 0 && (
        <div className="mb-8">
          <RawRunsSection runs={rawRuns} />
        </div>
      )}

      <div className="pb-16" />
    </motion.div>
  );
}

function generateSimplePrompts(persona: string, verticals: string[], services: string[], geo: string): Prompt[] {
  const personaLabel = persona === "marketing_agency" ? "marketing agency" : persona.replace(/_/g, " ");
  const location = geo.trim();
  const suffix = location ? ` in ${location}` : "";
  const prompts: Prompt[] = [];
  let idx = 1;

  const addPrompt = (text: string, cluster: string) => {
    prompts.push({
      id: `simple_${idx}`,
      cluster,
      shape: "open",
      text,
      slots_used: {},
      tags: [cluster, "simple_mode"],
      modifier_included: false,
      geo_included: !!location,
    });
    idx++;
  };

  addPrompt(`Find me best ${personaLabel}${suffix}`, "direct");

  for (const v of verticals) {
    addPrompt(`Find me best ${personaLabel} for ${v}${suffix}`, "direct");
  }

  for (const s of services) {
    addPrompt(`Find me best ${personaLabel} for ${s}${suffix}`, "task");
  }

  for (const v of verticals) {
    for (const s of services) {
      addPrompt(`Find me best ${personaLabel} for ${v} for ${s}${suffix}`, "task");
    }
  }

  return prompts;
}

export default function PromptGenerator() {
  const [simpleMode, setSimpleMode] = useState(true);
  const [persona, setPersona] = useState<string>("marketing_agency");
  const [verticals, setVerticals] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [modifiers, setModifiers] = useState<string[]>([]);
  const [geo, setGeo] = useState("");
  const [budgetTier, setBudgetTier] = useState("mid");
  const [brandName, setBrandName] = useState("");
  const [brandDomain, setBrandDomain] = useState("");
  const [scoringMode, setScoringMode] = useState<"micro" | "quick" | "full">("quick");
  const [filterCluster, setFilterCluster] = useState<string>("all");
  const [filterShape, setFilterShape] = useState<string>("all");
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(
    new Set(),
  );
  const [scoringResult, setScoringResult] = useState<ScoringResponse | null>(null);
  const [simpleResult, setSimpleResult] = useState<PromptSet | null>(null);
  const { toast } = useToast();

  const { data: presets } = useQuery<Presets>({
    queryKey: ["/api/promptgen/presets"],
  });

  const { data: savedProfiles } = useQuery<SavedProfile[]>({
    queryKey: ["/api/profiles"],
  });

  const { mutate: saveProfile } = useMutation({
    mutationFn: async (profile: Omit<SavedProfile, "id">) => {
      const res = await apiRequest("POST", "/api/profiles", profile);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
    },
  });

  const loadProfile = (profile: SavedProfile) => {
    setBrandName(profile.brandName);
    setBrandDomain(profile.brandDomain || "");
    setPersona(profile.persona);
    setVerticals(profile.verticals || []);
    setServices(profile.services || []);
    setModifiers(profile.modifiers || []);
    setGeo(profile.geo || "");
    setBudgetTier(profile.budgetTier || "mid");
  };

  const {
    mutate: generate,
    isPending: isGenerating,
    data: advancedResult,
    reset: resetAdvanced,
  } = useMutation<PromptSet, Error, unknown>({
    mutationFn: async (body) => {
      const res = await apiRequest("POST", "/api/promptsets", body);
      return res.json();
    },
  });

  const result = simpleResult || advancedResult;
  const resetPrompts = () => {
    setSimpleResult(null);
    resetAdvanced();
  };

  const {
    mutate: runScoring,
    isPending: isScoring,
  } = useMutation<ScoringResponse, Error, { prompts: Prompt[]; brand_name: string; brand_domain?: string; mode: "micro" | "quick" | "full" }>({
    mutationFn: async (body) => {
      const res = await apiRequest("POST", "/api/scoring/run", body);
      return res.json();
    },
    onSuccess: (data) => {
      setScoringResult(data);
    },
    onError: (err) => {
      toast({
        title: "Scoring failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const currentPresets = presets?.[persona];

  const PERSONA_CATEGORY: Record<string, string> = {
    marketing_agency: "marketing agency",
    automation_consultant: "automation consultant",
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      toast({
        title: "Brand name required",
        description: "Enter your brand name to run analysis.",
        variant: "destructive",
      });
      return;
    }

    if (simpleMode) {
      if (verticals.length < 1 || verticals.length > 2) {
        toast({
          title: "Select 1-2 verticals",
          description: "Simple mode supports up to 2 target verticals.",
          variant: "destructive",
        });
        return;
      }
      if (services.length < 1 || services.length > 2) {
        toast({
          title: "Select 1-2 services",
          description: "Simple mode supports up to 2 services.",
          variant: "destructive",
        });
        return;
      }

      saveProfile({
        brandName: brandName.trim(),
        brandDomain: brandDomain.trim() || null,
        persona,
        verticals,
        services,
        modifiers: [],
        geo: geo.trim() || null,
        budgetTier: "mid",
      } as any);

      const simplePrompts = generateSimplePrompts(persona, verticals, services, geo);
      const clusterCounts: Record<string, number> = {};
      const shapeCounts: Record<string, number> = {};
      simplePrompts.forEach((p) => {
        clusterCounts[p.cluster] = (clusterCounts[p.cluster] || 0) + 1;
        shapeCounts[p.shape] = (shapeCounts[p.shape] || 0) + 1;
      });
      setSimpleResult({
        prompt_set_id: `simple-${Date.now()}`,
        version: "pg_v1",
        seed_used: 0,
        counts: {
          by_cluster: clusterCounts,
          by_shape: shapeCounts,
          modifier_prompts: 0,
          geo_prompts: simplePrompts.filter((p) => p.geo_included).length,
        },
        slot_bank: { verticals: [], services: [], modifiers: [], geo_terms: [] },
        prompts: simplePrompts,
        unverified_items: [],
      });
      return;
    }

    if (verticals.length < 2) {
      toast({
        title: "Need more verticals",
        description: "Add at least 2 target verticals.",
        variant: "destructive",
      });
      return;
    }
    if (services.length < 3) {
      toast({
        title: "Need more services",
        description: "Add at least 3 services.",
        variant: "destructive",
      });
      return;
    }

    saveProfile({
      brandName: brandName.trim(),
      brandDomain: brandDomain.trim() || null,
      persona,
      verticals,
      services,
      modifiers,
      geo: geo.trim() || null,
      budgetTier,
    } as any);

    generate({
      persona_type: persona,
      category: PERSONA_CATEGORY[persona] || persona.replace(/_/g, " "),
      verticals,
      services,
      modifiers,
      geo: geo.trim() || undefined,
      budget_tier: budgetTier,
    });
  };

  const handleRunScoring = () => {
    if (!result) return;
    runScoring({
      prompts: result.prompts,
      brand_name: brandName.trim(),
      brand_domain: brandDomain.trim() || undefined,
      mode: simpleMode ? "full" : scoringMode,
    });
  };

  const handleStartOver = () => {
    resetPrompts();
    setScoringResult(null);
    setFilterCluster("all");
    setFilterShape("all");
    setExpandedPrompts(new Set());
  };

  const filteredPrompts = useMemo(() => {
    if (!result) return [];
    return result.prompts.filter((p) => {
      if (filterCluster !== "all" && p.cluster !== filterCluster) return false;
      if (filterShape !== "all" && p.shape !== filterShape) return false;
      return true;
    });
  }, [result, filterCluster, filterShape]);

  const toggleExpanded = (id: string) => {
    setExpandedPrompts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const showForm = !result && !isGenerating && !isScoring && !scoringResult;
  const showPrompts = result && !isGenerating && !isScoring && !scoringResult;
  const showScoring = isScoring;
  const showResults = scoringResult && !isScoring;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <nav className="w-full border-b border-border sticky top-0 z-50 bg-background">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-base font-semibold tracking-tight"
            data-testid="link-home"
          >
            BrandSense
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-muted-foreground flex items-center gap-1.5 transition-colors hover:text-foreground" data-testid="link-analyzer">
              <ArrowLeft className="w-3.5 h-3.5" />
              Analyzer
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-start px-6">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {showForm && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                key="form"
              >
                <div className="pt-16 pb-8 space-y-4">
                  <h1
                    className="text-3xl md:text-4xl font-semibold tracking-tight"
                    data-testid="text-heading"
                  >
                    Tell us a bit about you?
                  </h1>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="simple-mode"
                      checked={simpleMode}
                      onCheckedChange={setSimpleMode}
                      data-testid="switch-simple-mode"
                    />
                    <label htmlFor="simple-mode" className="text-sm cursor-pointer select-none">
                      {simpleMode ? (
                        <span><span className="font-medium">Simple Mode</span> <span className="text-muted-foreground">— 9 focused prompts, fast results</span></span>
                      ) : (
                        <span><span className="font-medium">Advanced Mode</span> <span className="text-muted-foreground">— 4-40 prompts, full template engine</span></span>
                      )}
                    </label>
                  </div>
                </div>

                {savedProfiles && savedProfiles.length > 0 && (
                  <div className="pb-6">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
                      Load a saved profile
                    </label>
                    <Select
                      onValueChange={(v) => {
                        const profile = savedProfiles.find((p) => String(p.id) === v);
                        if (profile) loadProfile(profile);
                      }}
                    >
                      <SelectTrigger className="bg-secondary/50" data-testid="select-saved-profile">
                        <SelectValue placeholder="Choose a profile..." />
                      </SelectTrigger>
                      <SelectContent>
                        {savedProfiles.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)} data-testid={`profile-option-${p.id}`}>
                            {p.brandName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <form onSubmit={handleGenerate} className="space-y-6 pb-16">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Brand Name
                      </label>
                      <Input
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder="e.g. Deep Singh"
                        className="bg-secondary/50 border-border"
                        data-testid="input-brand-name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Website
                        <span className="text-muted-foreground/60 normal-case ml-1">(recommended)</span>
                      </label>
                      <Input
                        value={brandDomain}
                        onChange={(e) => setBrandDomain(e.target.value)}
                        placeholder="e.g. deep.co"
                        className="bg-secondary/50 border-border"
                        data-testid="input-brand-domain"
                      />
                    </div>
                  </div>

                  <div className={simpleMode ? "" : "grid grid-cols-1 sm:grid-cols-2 gap-4"}>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Persona
                      </label>
                      <Select
                        value={persona}
                        onValueChange={(v) => {
                          setPersona(v);
                          setVerticals([]);
                          setServices([]);
                          setModifiers([]);
                        }}
                      >
                        <SelectTrigger
                          className="bg-secondary/50"
                          data-testid="select-persona"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="marketing_agency">
                            Marketing Agency
                          </SelectItem>
                          <SelectItem value="automation_consultant">
                            Automation Consultant
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {!simpleMode && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Budget Tier
                        </label>
                        <Select value={budgetTier} onValueChange={setBudgetTier}>
                          <SelectTrigger
                            className="bg-secondary/50"
                            data-testid="select-budget"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="budget">Budget</SelectItem>
                            <SelectItem value="mid">Mid-range</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Target Verticals ({simpleMode ? "pick 1-2" : "min 2"})
                    </label>
                    <TagInput
                      values={verticals}
                      onChange={(vals) => simpleMode ? setVerticals(vals.slice(0, 2)) : setVerticals(vals)}
                      placeholder="Type or pick verticals..."
                      suggestions={currentPresets?.verticals}
                      maxItems={simpleMode ? 2 : undefined}
                      testIdPrefix="verticals"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Services ({simpleMode ? "pick 1-2" : "min 3"})
                    </label>
                    <TagInput
                      values={services}
                      onChange={(vals) => simpleMode ? setServices(vals.slice(0, 2)) : setServices(vals)}
                      placeholder="Type or pick services..."
                      suggestions={currentPresets?.services}
                      maxItems={simpleMode ? 2 : undefined}
                      testIdPrefix="services"
                    />
                  </div>

                  {!simpleMode && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Tool / Platform Modifiers (optional, max 6)
                      </label>
                      <TagInput
                        values={modifiers}
                        onChange={setModifiers}
                        placeholder="e.g. HubSpot, Clay, Zapier..."
                        suggestions={currentPresets?.modifiers}
                        maxItems={6}
                        testIdPrefix="modifiers"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Geographic Focus {simpleMode ? "" : "(optional)"}
                    </label>
                    <Input
                      value={geo}
                      onChange={(e) => setGeo(e.target.value)}
                      placeholder="e.g. Dubai, UAE"
                      className="bg-secondary/50 border-border"
                      data-testid="input-geo"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isGenerating || isScoring}
                    className="w-full"
                    data-testid="button-generate"
                  >
                    {(isGenerating || (simpleMode && isScoring)) ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    {simpleMode ? `Run Analysis (${1 + verticals.length + services.length + verticals.length * services.length} prompts x 3 engines)` : "Generate Prompts"}
                  </Button>
                </form>
              </motion.div>
            )}

            {isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key="loading"
                className="pt-32 pb-16 flex flex-col items-center gap-4"
              >
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Building your prompt set...
                </p>
              </motion.div>
            )}

            {showPrompts && result && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                key="prompts"
              >
                <div className="pt-12 pb-6 space-y-6">
                  <div className="space-y-1">
                    <h2
                      className="text-2xl md:text-3xl font-semibold tracking-tight"
                      data-testid="text-results-heading"
                    >
                      This is how your customers look for you...
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {result.prompts.length} prompts generated
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {!simpleMode && (
                      <Tabs value={scoringMode} onValueChange={(v) => setScoringMode(v as "micro" | "quick" | "full")}>
                        <TabsList className="h-8">
                          <TabsTrigger
                            value="micro"
                            className="text-xs px-3"
                            data-testid="toggle-mode-micro"
                          >
                            Micro (4)
                          </TabsTrigger>
                          <TabsTrigger
                            value="quick"
                            className="text-xs px-3"
                            data-testid="toggle-mode-quick"
                          >
                            Quick (10)
                          </TabsTrigger>
                          <TabsTrigger
                            value="full"
                            className="text-xs px-3"
                            data-testid="toggle-mode-full"
                          >
                            Full (40)
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    )}
                    <Button
                      onClick={handleRunScoring}
                      className="flex-1"
                      data-testid="button-run-scoring"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      {simpleMode
                        ? `Run Analysis (${result?.prompts.length ?? 0} prompts x 3 engines)`
                        : `Run Analysis (${scoringMode === "micro" ? "4" : scoringMode === "quick" ? "10" : "40"} prompts x 3 engines)`}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleStartOver}
                      data-testid="button-start-over"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                      Start Over
                    </Button>
                  </div>

                  {result.unverified_items.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Note:</span>{" "}
                      {result.unverified_items.map((u) => u.display).join(", ")}{" "}
                      may not match known tools/platforms.
                    </p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <Tabs
                      value={filterCluster}
                      onValueChange={setFilterCluster}
                    >
                      <TabsList className="h-7">
                        <TabsTrigger
                          value="all"
                          className="text-xs px-2 h-6"
                          data-testid="filter-cluster-all"
                        >
                          All
                        </TabsTrigger>
                        {Object.keys(CLUSTER_LABELS).map((c) => (
                          <TabsTrigger
                            key={c}
                            value={c}
                            className="text-xs px-2 h-6"
                            data-testid={`filter-cluster-${c}`}
                          >
                            {CLUSTER_LABELS[c]}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                    <Tabs value={filterShape} onValueChange={setFilterShape}>
                      <TabsList className="h-7">
                        <TabsTrigger
                          value="all"
                          className="text-xs px-2 h-6"
                          data-testid="filter-shape-all"
                        >
                          All
                        </TabsTrigger>
                        {Object.keys(SHAPE_LABELS).map((s) => (
                          <TabsTrigger
                            key={s}
                            value={s}
                            className="text-xs px-2 h-6"
                            data-testid={`filter-shape-${s}`}
                          >
                            {SHAPE_LABELS[s]}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  </div>
                </div>

                <div className="space-y-2 pb-16">
                  {filteredPrompts.map((prompt, idx) => (
                    <Collapsible
                      key={prompt.id}
                      open={expandedPrompts.has(prompt.id)}
                      onOpenChange={() => toggleExpanded(prompt.id)}
                    >
                      <Card
                        data-testid={`prompt-card-${prompt.id}`}
                      >
                        <div className="flex items-start gap-3 p-3">
                          <span className="text-xs text-muted-foreground font-mono mt-0.5 shrink-0 w-6 text-right">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm leading-relaxed"
                              data-testid={`text-prompt-${prompt.id}`}
                            >
                              {prompt.text}
                            </p>
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              <Badge
                                variant="outline"
                                className="text-[10px] capitalize"
                              >
                                {CLUSTER_LABELS[prompt.cluster] ||
                                  prompt.cluster}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-[10px]"
                              >
                                {SHAPE_LABELS[prompt.shape] || prompt.shape}
                              </Badge>
                              {prompt.modifier_included && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  modifier
                                </Badge>
                              )}
                              {prompt.geo_included && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  geo
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <CopyButton text={prompt.text} promptId={prompt.id} />
                            <CollapsibleTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                data-testid={`button-expand-${prompt.id}`}
                              >
                                {expandedPrompts.has(prompt.id) ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </div>
                        <CollapsibleContent>
                          <div className="px-3 pb-3 pt-0 ml-9">
                            <div className="text-xs text-muted-foreground space-y-1 border-t border-border pt-2">
                              <p>
                                <span className="font-medium text-foreground">
                                  Slots:
                                </span>{" "}
                                {Object.entries(prompt.slots_used)
                                  .map(([k, v]) => `${k}="${v}"`)
                                  .join(", ")}
                              </p>
                              <p>
                                <span className="font-medium text-foreground">
                                  Tags:
                                </span>{" "}
                                {prompt.tags.join(", ")}
                              </p>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  ))}

                  {filteredPrompts.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No prompts match the current filters.
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {showScoring && <WaitingScreen />}

            {showResults && scoringResult && (
              <ResultsDashboard
                score={scoringResult.score}
                brandName={brandName}
                mode={scoringResult.mode}
                promptsUsed={scoringResult.prompts_used}
                rawRuns={scoringResult.raw_runs}
                onNewAnalysis={handleStartOver}
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border mt-auto">
        BrandSense
      </footer>
    </div>
  );
}

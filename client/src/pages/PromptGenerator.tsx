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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
  MapPin,
  Pencil,
  Search,
  Shield,
  Tag,
  Code,
  ExternalLink,
  Plus,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { SegmentCitationAnalyzer } from "@/components/SegmentCitationAnalyzer";

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

interface MultiSegmentSession {
  id: number;
  brandName: string;
  brandDomain: string | null;
  promptsPerSegment: number;
  segments: any;
  createdAt: string;
}

interface SavedV2Config {
  id: number;
  name: string;
  brandName: string;
  brandDomain: string | null;
  promptsPerSegment: number;
  segments: any;
  createdAt: string;
}

interface Presets {
  [persona: string]: {
    verticals: string[];
    services: string[];
    decision_makers?: string[];
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
  engine_breakdown: Record<string, { appearance_rate: number; primary_rate: number; valid_runs: number; total_runs?: number; error_runs?: number }>;
}

interface RawRunCitation {
  url: string;
  title?: string;
}

interface RawRun {
  prompt_id: string;
  prompt_text: string;
  cluster: string;
  engine: string;
  raw_text: string;
  citations?: RawRunCitation[];
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
                      {r.citations && r.citations.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="text-[10px] text-muted-foreground font-medium">Sources:</span>
                          {r.citations.map((c, idx) => {
                            let displayUrl = c.title || c.url;
                            try {
                              const parsed = new URL(c.url);
                              displayUrl = c.title || parsed.hostname.replace(/^www\./, '');
                            } catch {}
                            return (
                              <a
                                key={idx}
                                href={c.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0.5 rounded"
                                data-testid={`link-citation-${r.prompt_id}-${r.engine}-${idx}`}
                              >
                                <Globe className="w-2.5 h-2.5 flex-shrink-0" />
                                <span className="truncate max-w-[160px]">{displayUrl}</span>
                              </a>
                            );
                          })}
                        </div>
                      )}
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

function AllSourcesSection({ runs }: { runs: RawRun[] }) {
  const [copied, setCopied] = useState(false);

  const allCitations = useMemo(() => {
    const seen = new Set<string>();
    const result: { url: string; title?: string; engine: string }[] = [];
    for (const r of runs) {
      if (r.citations) {
        for (const c of r.citations) {
          if (c.url && !seen.has(c.url)) {
            seen.add(c.url);
            result.push({ url: c.url, title: c.title, engine: r.engine });
          }
        }
      }
    }
    return result;
  }, [runs]);

  if (allCitations.length === 0) return null;

  const handleCopy = () => {
    const text = allCitations.map(c => c.url).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Globe className="w-4 h-4 text-muted-foreground" />
          All Sources ({allCitations.length})
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 text-xs gap-1.5"
          data-testid="button-copy-all-sources"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied!" : "Copy All URLs"}
        </Button>
      </div>
      <Card className="divide-y divide-border">
        {allCitations.map((c, idx) => {
          let hostname = c.url;
          try {
            hostname = new URL(c.url).hostname.replace(/^www\./, "");
          } catch {}
          return (
            <a
              key={idx}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/50 transition-colors group"
              data-testid={`link-all-source-${idx}`}
            >
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0 group-hover:text-blue-500" />
              <div className="min-w-0 flex-1">
                <span className="text-sm text-blue-600 dark:text-blue-400 group-hover:underline truncate block">
                  {c.title || hostname}
                </span>
                <span className="text-[10px] text-muted-foreground truncate block">
                  {c.url}
                </span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground shrink-0">
                {(ENGINE_LABELS[c.engine] || c.engine).slice(0, 3)}
              </span>
            </a>
          );
        })}
      </Card>
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
            {Object.entries(score.engine_breakdown).map(([engine, data]) => {
              const hasErrors = (data.error_runs ?? 0) > 0;
              const allFailed = data.valid_runs === 0 && hasErrors;
              return (
                <Card key={engine} className={`p-3 space-y-1.5 ${allFailed ? "opacity-60" : ""}`} data-testid={`engine-card-${engine}`}>
                  <span className="text-xs font-medium text-muted-foreground">
                    {ENGINE_LABELS[engine] || engine}
                  </span>
                  {allFailed ? (
                    <div className="text-sm text-destructive font-medium" data-testid={`engine-error-${engine}`}>
                      All {data.total_runs ?? 0} calls failed
                    </div>
                  ) : (
                    <>
                      <div className="text-lg font-semibold">
                        {Math.round(data.appearance_rate * 100)}%
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">Top 3</span>
                        <span className="text-xs font-medium">{Math.round(data.primary_rate * 100)}%</span>
                      </div>
                      {hasErrors && (
                        <div className="text-xs text-destructive" data-testid={`engine-partial-error-${engine}`}>
                          {data.error_runs} of {data.total_runs} calls failed
                        </div>
                      )}
                    </>
                  )}
                </Card>
              );
            })}
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
        <AllSourcesSection runs={rawRuns} />
      )}

      {rawRuns && rawRuns.length > 0 && (
        <div className="mb-8">
          <RawRunsSection runs={rawRuns} />
        </div>
      )}

      <div className="pb-16" />
    </motion.div>
  );
}

function SegmentResultsDashboard({ score, brandName, rawRuns, segmentLabel }: {
  score: GEOScore;
  brandName: string;
  rawRuns?: RawRun[];
  segmentLabel: string;
}) {
  const [showSources, setShowSources] = useState(false);
  const [showRawRuns, setShowRawRuns] = useState(false);

  return (
    <div className="space-y-4" data-testid={`segment-results-${segmentLabel}`}>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-secondary/50 rounded-md p-2.5 text-center">
          <div className="text-lg font-bold">{Math.round(score.appearance_rate * 100)}%</div>
          <div className="text-[10px] text-muted-foreground">Appearance</div>
        </div>
        <div className="bg-secondary/50 rounded-md p-2.5 text-center">
          <div className="text-lg font-bold">{Math.round(score.primary_rate * 100)}%</div>
          <div className="text-[10px] text-muted-foreground">Top 3</div>
        </div>
        <div className="bg-secondary/50 rounded-md p-2.5 text-center">
          <div className="text-lg font-bold">{score.avg_rank !== null ? `#${score.avg_rank}` : "—"}</div>
          <div className="text-[10px] text-muted-foreground">Avg Rank</div>
        </div>
      </div>

      {Object.keys(score.engine_breakdown).length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <BarChart3 className="w-3 h-3" />
            By Engine
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(score.engine_breakdown).map(([engine, data]) => {
              const hasErrors = (data.error_runs ?? 0) > 0;
              const allFailed = data.valid_runs === 0 && hasErrors;
              return (
                <div key={engine} className={`bg-secondary/30 rounded-md p-2 space-y-0.5 ${allFailed ? "opacity-60" : ""}`}>
                  <span className="text-[10px] font-medium text-muted-foreground block">
                    {ENGINE_LABELS[engine] || engine}
                  </span>
                  {allFailed ? (
                    <div className="text-xs text-destructive font-medium">Failed</div>
                  ) : (
                    <>
                      <div className="text-sm font-semibold">{Math.round(data.appearance_rate * 100)}%</div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">Top 3</span>
                        <span className="text-[10px] font-medium">{Math.round(data.primary_rate * 100)}%</span>
                      </div>
                      {hasErrors && (
                        <div className="text-[10px] text-destructive">{data.error_runs}/{data.total_runs} failed</div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
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
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <Globe className="w-3 h-3" />
              Rankings
            </h4>
            <div className="divide-y divide-border/50 border border-border/50 rounded-md overflow-hidden">
              {allEntries.slice(0, 10).map((entry, i) => (
                <div
                  key={entry.name}
                  className={`flex items-center justify-between gap-3 px-3 py-1.5 ${entry.isBrand ? "bg-primary/10" : ""}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] text-muted-foreground font-mono w-4 text-right shrink-0">{i + 1}</span>
                    <span className={`text-xs truncate ${entry.isBrand ? "font-semibold text-primary" : ""}`}>
                      {entry.name}
                      {entry.isBrand && <span className="ml-1 text-[9px] uppercase tracking-wider text-primary/70">You</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-16 h-1 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${entry.isBrand ? "bg-primary" : "bg-foreground/40"}`}
                        style={{ width: `${Math.round(entry.share * 100)}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-medium w-8 text-right ${entry.isBrand ? "text-primary" : ""}`}>
                      {Math.round(entry.share * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {rawRuns && rawRuns.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowSources(!showSources)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {showSources ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <ExternalLink className="w-3 h-3" />
            Sources & Citations ({rawRuns.reduce((acc, r) => acc + (r.citations?.length || 0), 0)})
          </button>
          {showSources && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
              <AllSourcesSection runs={rawRuns} />
            </motion.div>
          )}
        </div>
      )}

      {rawRuns && rawRuns.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowRawRuns(!showRawRuns)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {showRawRuns ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <FileText className="w-3 h-3" />
            Raw AI Responses ({rawRuns.length})
          </button>
          {showRawRuns && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
              <RawRunsSection runs={rawRuns} />
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

const PROMPT_STYLE_PREFIXES: Record<string, string> = {
  find_best: "Find me best",
  top5: "Find, list and rank 5 top",
  top3: "Find, list and rank 3 top",
};

const QUICK_QUALIFIERS = [
  "top",
  "best",
  "most used",
  "most popular",
  "most recommended",
  "leading",
  "highest rated",
  "most trusted",
  "top rated",
  "most reliable",
];

function generateQuickPrompts(
  persona: string,
  seedType: string,
  customerType: string,
  count: number,
  location: string,
  promptCount: number = 10,
): Prompt[] {
  const PERSONA_CORE_LABELS: Record<string, string> = {
    marketing_agency: "marketing agency",
    automation_consultant: "automation",
    corporate_cards_provider: "corporate cards",
    expense_management_software: "expense management",
    accounting_automation: "accounting automation",
    invoice_management: "invoice management",
    restaurant: "restaurant",
  };
  const personaLabel = PERSONA_CORE_LABELS[persona] || persona.replace(/_/g, " ");
  const prompts: Prompt[] = [];
  const isRestaurant = persona === "restaurant";
  const customerSuffix = customerType ? ` for ${customerType}` : "";

  const numPrompts = Math.min(promptCount, QUICK_QUALIFIERS.length);
  for (let i = 0; i < numPrompts; i++) {
    const qualifier = QUICK_QUALIFIERS[i];
    let text: string;
    if (isRestaurant) {
      const cuisinePhrase = customerType ? `${customerType} ` : "";
      text = `Recommend the ${qualifier} ${count} ${cuisinePhrase}${seedType} in ${location}. Focus on local favorites, quality, and atmosphere.`;
    } else {
      text = `Find, list and rank ${qualifier} ${count} ${personaLabel} ${seedType}${customerSuffix} based in the ${location} or GCC region. Exclude US, European, or other non-regional providers; focus on providers headquartered or primarily operating in the Middle East / GCC.`;
    }
    prompts.push({
      id: `quick_${i + 1}`,
      cluster: "direct",
      shape: "open",
      text,
      slots_used: {},
      tags: ["direct", "quick_mode", "has_geo"],
      modifier_included: false,
      geo_included: true,
    });
  }

  return prompts;
}

function generateSimplePrompts(persona: string, verticals: string[], services: string[], geo: string, style: string = "find_best"): Prompt[] {
  const personaLabel = persona === "marketing_agency" ? "marketing agency" : persona.replace(/_/g, " ");
  const location = geo.trim();
  const suffix = location ? ` in ${location}` : "";
  const prefix = PROMPT_STYLE_PREFIXES[style] || PROMPT_STYLE_PREFIXES.find_best;
  const prompts: Prompt[] = [];
  let idx = 1;

  const addPrompt = (text: string, cluster: string) => {
    prompts.push({
      id: `simple_${idx}`,
      cluster,
      shape: style === "top5" ? "top5" : style === "top3" ? "top3" : "open",
      text,
      slots_used: {},
      tags: [cluster, "simple_mode"],
      modifier_included: false,
      geo_included: !!location,
    });
    idx++;
  };

  addPrompt(`${prefix} ${personaLabel}${suffix}`, "direct");

  for (const v of verticals) {
    addPrompt(`${prefix} ${personaLabel} for ${v}${suffix}`, "direct");
  }

  for (const s of services) {
    addPrompt(`${prefix} ${personaLabel} for ${s}${suffix}`, "task");
  }

  for (const v of verticals) {
    for (const s of services) {
      addPrompt(`${prefix} ${personaLabel} for ${v} for ${s}${suffix}`, "task");
    }
  }

  return prompts;
}

interface PanelPrompt {
  id: string;
  territory_id: string;
  territory_label: string;
  query_type: string;
  text: string;
  cluster: string;
}

interface PanelAnalysisResult {
  brand_name: string;
  website_url: string;
  city: string;
  industry: string;
  service_keywords: string[];
  territories: Array<{
    territory_id: string;
    label: string;
    score: number;
    matched_keywords: string[];
  }>;
  aliases: Array<{ original: string; tokens: string; compact: string }>;
  prompts: PanelPrompt[];
  raw_extraction?: {
    primary_services: string[];
    secondary_services: string[];
    industries_served: string[];
    client_size_indicators: string[];
    positioning_terms: string[];
    geo_mentions: string[];
    brand_name_variants: string[];
  };
  all_territory_scores?: Array<{
    territory_id: string;
    label: string;
    score: number;
    matched_keywords: string[];
  }>;
}

type GeneratorMode = "simple" | "advanced" | "quick" | "quickv2" | "panel";

export default function PromptGenerator() {
  const [mode, setMode] = useState<GeneratorMode>("simple");
  const simpleMode = mode === "simple";
  const [promptStyle, setPromptStyle] = useState<"find_best" | "top5" | "top3">("find_best");
  const [persona, setPersona] = useState<string>("marketing_agency");
  const [verticals, setVerticals] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [modifiers, setModifiers] = useState<string[]>([]);
  const [geo, setGeo] = useState("");
  const [budgetTier, setBudgetTier] = useState("mid");
  const [brandName, setBrandName] = useState("");
  const [brandDomain, setBrandDomain] = useState("");
  const [decisionMakers, setDecisionMakers] = useState<string[]>([]);
  const [resultCount, setResultCount] = useState<number>(10);
  const [scoringMode, setScoringMode] = useState<"micro" | "quick" | "full">("quick");
  const [filterCluster, setFilterCluster] = useState<string>("all");
  const [filterShape, setFilterShape] = useState<string>("all");
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(
    new Set(),
  );
  const [scoringResult, setScoringResult] = useState<ScoringResponse | null>(null);
  const [simpleResult, setSimpleResult] = useState<PromptSet | null>(null);
  const [disabledPrompts, setDisabledPrompts] = useState<Set<string>>(new Set());
  const [geoDisabled, setGeoDisabled] = useState<Set<string>>(new Set());
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [editDrafts, setEditDrafts] = useState<Record<string, string>>({});
  const [editedTexts, setEditedTexts] = useState<Record<string, string>>({});

  const [panelUrl, setPanelUrl] = useState("");
  const [panelBrand, setPanelBrand] = useState("");
  const [panelCity, setPanelCity] = useState("");
  const [panelSeededServices, setPanelSeededServices] = useState("");
  const [showRawData, setShowRawData] = useState(false);
  const [panelAnalysis, setPanelAnalysis] = useState<PanelAnalysisResult | null>(null);
  const [panelScoringResult, setPanelScoringResult] = useState<ScoringResponse | null>(null);
  const [panelRawRuns, setPanelRawRuns] = useState<any[] | null>(null);

  const [quickSeedType, setQuickSeedType] = useState("providers");
  const [quickCustomerType, setQuickCustomerType] = useState("");
  const [quickCount, setQuickCount] = useState(5);
  const [quickLocation, setQuickLocation] = useState("");
  const [quickResult, setQuickResult] = useState<PromptSet | null>(null);
  const [quickScoringResult, setQuickScoringResult] = useState<ScoringResponse | null>(null);

  interface V2Segment {
    id: string;
    persona: string;
    seedType: string;
    customerType: string;
    location: string;
    resultCount: number;
    prompts: Prompt[] | null;
    scoringResult: ScoringResponse | null;
    isScoring: boolean;
  }

  const makeSegment = (): V2Segment => ({
    id: `seg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    persona: "marketing_agency",
    seedType: "providers",
    customerType: "",
    location: "",
    resultCount: 5,
    prompts: null,
    scoringResult: null,
    isScoring: false,
  });

  const [v2Segments, setV2Segments] = useState<V2Segment[]>([makeSegment()]);
  const [v2PromptsPerSegment, setV2PromptsPerSegment] = useState(3);
  const [v2IsAnalysing, setV2IsAnalysing] = useState(false);

  const updateSegment = (id: string, patch: Partial<V2Segment>) => {
    setV2Segments((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const addSegment = () => {
    setV2Segments((prev) => [...prev, makeSegment()]);
  };

  const removeSegment = (id: string) => {
    setV2Segments((prev) => prev.filter((s) => s.id !== id));
  };

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

  const { data: v2Sessions } = useQuery<MultiSegmentSession[]>({
    queryKey: ["/api/multisegment/sessions"],
  });

  const { mutate: saveV2Session } = useMutation({
    mutationFn: async (session: { brandName: string; brandDomain: string | null; promptsPerSegment: number; segments: any }) => {
      const res = await apiRequest("POST", "/api/multisegment/sessions", session);
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/multisegment/sessions"] });
      toast({ title: "Session saved", description: `Multi-segment analysis saved for ${variables.brandName}.` });
    },
    onError: (err: any) => {
      console.error("Failed to save V2 session:", err);
      toast({ title: "Save failed", description: "Results are visible but couldn't be saved to history. Try again.", variant: "destructive" });
    },
  });

  const { data: v2Configs } = useQuery<SavedV2Config[]>({
    queryKey: ["/api/v2configs"],
  });

  const { mutate: saveV2Config } = useMutation({
    mutationFn: async (config: { name: string; brandName: string; brandDomain: string | null; promptsPerSegment: number; segments: any }) => {
      const res = await apiRequest("POST", "/api/v2configs", config);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v2configs"] });
      toast({ title: "Config saved", description: "You can reload this segment setup anytime." });
    },
  });

  const { mutate: deleteV2Config } = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/v2configs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v2configs"] });
    },
  });

  const loadV2Config = (config: SavedV2Config) => {
    setBrandName(config.brandName);
    setBrandDomain(config.brandDomain || "");
    setV2PromptsPerSegment(config.promptsPerSegment || 3);
    const rawSegments = Array.isArray(config.segments) ? config.segments : [];
    if (rawSegments.length === 0) {
      setV2Segments([makeSegment()]);
      return;
    }
    const segs = rawSegments.map((s: any) => ({
      id: `seg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      persona: s.persona || "marketing_agency",
      seedType: s.seedType || "providers",
      customerType: s.customerType || "",
      location: s.location || "",
      resultCount: s.resultCount || 5,
      prompts: null,
      scoringResult: null,
      isScoring: false,
    }));
    setV2Segments(segs);
    toast({ title: "Config loaded", description: `Loaded "${config.name}" — ${segs.length} segment${segs.length !== 1 ? "s" : ""}.` });
  };

  const [showSaveConfigDialog, setShowSaveConfigDialog] = useState(false);
  const [configName, setConfigName] = useState("");

  const loadV2Session = (session: MultiSegmentSession) => {
    setBrandName(session.brandName);
    setBrandDomain(session.brandDomain || "");
    setV2PromptsPerSegment(session.promptsPerSegment || 3);
    const rawSegments = Array.isArray(session.segments) ? session.segments : [];
    if (rawSegments.length === 0) {
      setV2Segments([makeSegment()]);
      return;
    }
    const segs = rawSegments.map((s: any) => ({
      id: `seg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      persona: s.persona || "marketing_agency",
      seedType: s.seedType || "providers",
      customerType: s.customerType || "",
      location: s.location || "",
      resultCount: s.resultCount || 5,
      prompts: s.prompts || null,
      scoringResult: s.scoringResult || null,
      isScoring: false,
    }));
    setV2Segments(segs);
  };

  const loadProfile = (profile: SavedProfile) => {
    setBrandName(profile.brandName);
    setBrandDomain(profile.brandDomain || "");
    setPersona(profile.persona);
    setVerticals(profile.verticals || []);
    setServices(profile.services || []);
    setModifiers(profile.modifiers || []);
    setGeo(profile.geo || "");
    setBudgetTier(profile.budgetTier || "mid");
    setDecisionMakers((profile as any).decisionMakers || []);
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
  } = useMutation<ScoringResponse, Error, { prompts: Prompt[]; brand_name: string; brand_domain?: string; mode: "micro" | "quick" | "full"; profile?: { persona: string; services: string[]; verticals: string[]; geo: string | null } }>({
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

  const {
    mutate: runQuickScoring,
    isPending: isQuickScoring,
  } = useMutation<ScoringResponse, Error, { prompts: Prompt[]; brand_name: string; brand_domain?: string; mode: "micro" | "quick" | "full"; profile?: { persona: string; services: string[]; verticals: string[]; geo: string | null } }>({
    mutationFn: async (body) => {
      const res = await apiRequest("POST", "/api/scoring/run", body);
      return res.json();
    },
    onSuccess: (data) => {
      setQuickScoringResult(data);
    },
    onError: (err) => {
      toast({
        title: "Scoring failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const {
    mutate: analyzePanel,
    isPending: isPanelAnalyzing,
  } = useMutation<PanelAnalysisResult, Error, { brand_name: string; website_url: string; city: string; seeded_services?: string[] }>({
    mutationFn: async (body) => {
      const res = await apiRequest("POST", "/api/panel/analyze", body);
      return res.json();
    },
    onSuccess: (data) => {
      setPanelAnalysis(data);
    },
    onError: (err) => {
      toast({
        title: "Website analysis failed",
        description: err.message || "Could not analyze website. Check the URL and try again.",
        variant: "destructive",
      });
    },
  });

  const {
    mutate: runPanelScoring,
    isPending: isPanelScoring,
  } = useMutation<any, Error, any>({
    mutationFn: async (body) => {
      const res = await apiRequest("POST", "/api/panel/score", body);
      return res.json();
    },
    onSuccess: (data) => {
      setPanelScoringResult(data.score);
      setPanelRawRuns(data.raw_runs || []);
    },
    onError: (err) => {
      toast({
        title: "Panel scoring failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePanelAnalyze = () => {
    if (!panelBrand.trim() || !panelUrl.trim() || !panelCity.trim()) {
      toast({
        title: "All fields required",
        description: "Enter your brand name, website URL, and city.",
        variant: "destructive",
      });
      return;
    }
    setPanelAnalysis(null);
    setPanelScoringResult(null);
    setPanelRawRuns(null);
    const seeded = panelSeededServices
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    analyzePanel({
      brand_name: panelBrand.trim(),
      website_url: panelUrl.trim(),
      city: panelCity.trim(),
      seeded_services: seeded.length > 0 ? seeded : undefined,
    });
  };

  const handlePanelScore = () => {
    if (!panelAnalysis) return;
    const domainMatch = panelUrl.match(/https?:\/\/(?:www\.)?([^/]+)/);
    runPanelScoring({
      brand_name: panelBrand.trim(),
      brand_domain: domainMatch?.[1] || undefined,
      city: panelCity.trim(),
      prompts: panelAnalysis.prompts,
      aliases: panelAnalysis.aliases,
      panel_context: {
        industry: panelAnalysis.industry,
        service_keywords: panelAnalysis.service_keywords,
        territories: panelAnalysis.territories,
      },
    });
  };

  const currentPresets = presets?.[persona];

  const PERSONA_CATEGORY: Record<string, string> = {
    marketing_agency: "marketing agency",
    automation_consultant: "automation consultant",
    corporate_cards_provider: "corporate cards provider",
    expense_management_software: "expense management software",
    accounting_automation: "accounting automation",
    invoice_management: "invoice management",
    restaurant: "restaurant",
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
        decisionMakers,
      } as any);

      const simplePrompts = generateSimplePrompts(persona, verticals, services, geo, promptStyle);
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

    if (verticals.length < 1) {
      toast({
        title: "Need verticals",
        description: "Add at least 1 target vertical.",
        variant: "destructive",
      });
      return;
    }
    if (services.length < 2) {
      toast({
        title: "Need more services",
        description: "Add at least 2 services.",
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
      decisionMakers,
    } as any);

    generate({
      profile: {
        persona_type: persona,
        category: PERSONA_CATEGORY[persona] || persona.replace(/_/g, " "),
        verticals,
        services,
        modifiers,
        geo: geo.trim() || undefined,
        budget_tier: budgetTier,
      },
      result_count: resultCount,
    });
  };

  const handleRunScoring = () => {
    if (!result) return;
    const enabledPrompts = result.prompts
      .filter((p) => !disabledPrompts.has(p.id))
      .map((p) => ({
        ...p,
        text: getPromptDisplayText(p),
        geo_included: p.geo_included && !geoDisabled.has(p.id),
      }));
    if (enabledPrompts.length === 0) {
      toast({
        title: "No prompts selected",
        description: "Enable at least one prompt to run the analysis.",
        variant: "destructive",
      });
      return;
    }
    runScoring({
      prompts: enabledPrompts,
      brand_name: brandName.trim(),
      brand_domain: brandDomain.trim() || undefined,
      mode: simpleMode ? "full" : scoringMode,
      profile: {
        persona,
        services,
        verticals,
        geo: geo || null,
      },
    });
  };

  const handleStartOver = () => {
    resetPrompts();
    setScoringResult(null);
    setFilterCluster("all");
    setFilterShape("all");
    setExpandedPrompts(new Set());
    setDisabledPrompts(new Set());
    setGeoDisabled(new Set());
    setEditingPromptId(null);
    setEditDrafts({});
    setEditedTexts({});
  };

  const getPromptDisplayText = (prompt: Prompt) => {
    const base = editedTexts[prompt.id] ?? prompt.text;
    if (geoDisabled.has(prompt.id) && prompt.geo_included && geo.trim()) {
      const geoStr = geo.trim();
      const lower = base.toLowerCase();
      const geoLower = geoStr.toLowerCase();
      const patterns = [
        ` in ${geoLower}`,
        ` near ${geoLower}`,
        ` around ${geoLower}`,
        ` for ${geoLower}`,
      ];
      for (const pat of patterns) {
        const idx = lower.lastIndexOf(pat);
        if (idx !== -1 && idx + pat.length >= lower.trimEnd().length) {
          return base.substring(0, idx).trimEnd();
        }
      }
    }
    return base;
  };

  const togglePromptEnabled = (id: string) => {
    setDisabledPrompts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGeo = (id: string) => {
    setGeoDisabled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startEditing = (prompt: Prompt) => {
    setEditingPromptId(prompt.id);
    setEditDrafts((prev) => ({ ...prev, [prompt.id]: editedTexts[prompt.id] ?? prompt.text }));
  };

  const saveEdit = (id: string) => {
    setEditedTexts((prev) => ({ ...prev, [id]: editDrafts[id] }));
    setEditingPromptId(null);
  };

  const cancelEdit = () => {
    setEditingPromptId(null);
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

  const showForm = mode === "panel" || mode === "quick" || mode === "quickv2" || (!result && !isGenerating && !isScoring && !scoringResult);
  const showPrompts = mode !== "panel" && mode !== "quick" && mode !== "quickv2" && result && !isGenerating && !isScoring && !scoringResult;
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
                  <div className="flex flex-wrap items-center gap-2">
                    {([
                      { key: "simple" as GeneratorMode, label: "Simple", desc: "9 focused prompts", icon: Zap },
                      { key: "advanced" as GeneratorMode, label: "Advanced", desc: "4-40 prompts", icon: Sparkles },
                      { key: "quick" as GeneratorMode, label: "Quick", desc: "10 ranked prompts", icon: Target },
                      { key: "quickv2" as GeneratorMode, label: "Quick V2", desc: "Multi-segment analysis", icon: BarChart3 },
                      { key: "panel" as GeneratorMode, label: "Panel", desc: "Website recall test", icon: Shield },
                    ]).map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => {
                          setMode(m.key);
                          setScoringResult(null);
                          setQuickResult(null);
                          setQuickScoringResult(null);
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors border ${
                          mode === m.key
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border hover-elevate"
                        }`}
                        data-testid={`button-mode-${m.key}`}
                      >
                        <m.icon className="w-3.5 h-3.5" />
                        <span>{m.label}</span>
                        <span className="text-muted-foreground text-xs hidden sm:inline">— {m.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {mode !== "panel" && savedProfiles && savedProfiles.length > 0 && (
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

                {mode === "panel" && (
                  <div className="space-y-6 pb-16">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Brand Name
                        </label>
                        <Input
                          value={panelBrand}
                          onChange={(e) => setPanelBrand(e.target.value)}
                          placeholder="e.g. Deep Agency"
                          className="bg-secondary/50 border-border"
                          data-testid="input-panel-brand"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Website URL
                        </label>
                        <Input
                          value={panelUrl}
                          onChange={(e) => setPanelUrl(e.target.value)}
                          placeholder="e.g. https://deep.co"
                          className="bg-secondary/50 border-border"
                          data-testid="input-panel-url"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          City
                        </label>
                        <Input
                          value={panelCity}
                          onChange={(e) => setPanelCity(e.target.value)}
                          placeholder="e.g. Dubai"
                          className="bg-secondary/50 border-border"
                          data-testid="input-panel-city"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Seed Services (optional)
                        </label>
                        <Input
                          value={panelSeededServices}
                          onChange={(e) => setPanelSeededServices(e.target.value)}
                          placeholder="e.g. Performance Marketing, Branding"
                          className="bg-secondary/50 border-border"
                          data-testid="input-panel-seeded-services"
                        />
                        <p className="text-xs text-muted-foreground">
                          Comma-separated services to include alongside website-extracted ones
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={handlePanelAnalyze}
                      disabled={isPanelAnalyzing || !panelBrand.trim() || !panelUrl.trim() || !panelCity.trim()}
                      data-testid="button-panel-analyze"
                    >
                      {isPanelAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing website...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Analyze Website
                        </>
                      )}
                    </Button>

                    {panelAnalysis && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        <Card className="p-4 space-y-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Tag className="w-4 h-4 text-primary" />
                            <span className="font-medium text-sm">Detected Profile</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Industry:</span>{" "}
                              <span className="font-medium">{panelAnalysis.industry}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">City:</span>{" "}
                              <span className="font-medium">{panelAnalysis.city}</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-sm">Service Keywords:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {panelAnalysis.service_keywords.map((kw) => (
                                <Badge key={kw} variant="secondary" className="text-xs">
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {panelAnalysis.aliases.length > 0 && (
                            <div>
                              <span className="text-muted-foreground text-sm">Brand Aliases:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {panelAnalysis.aliases.map((a) => (
                                  <Badge key={a.original} variant="outline" className="text-xs">
                                    {a.original}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="pt-2 border-t">
                            <button
                              type="button"
                              onClick={() => setShowRawData(!showRawData)}
                              className="flex items-center gap-1.5 text-xs text-muted-foreground hover-elevate rounded-md px-2 py-1"
                              data-testid="button-toggle-raw-data"
                            >
                              <Code className="w-3 h-3" />
                              {showRawData ? "Hide" : "Show"} Raw Dataset
                              {showRawData ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            </button>
                            {showRawData && (
                              <pre
                                className="mt-2 p-3 bg-muted rounded-md text-xs font-mono overflow-x-auto max-h-96 overflow-y-auto"
                                data-testid="text-raw-dataset"
                              >{JSON.stringify({
                                  step1_gpt_extraction: panelAnalysis.raw_extraction || null,
                                  step2_prompt_dataset: {
                                    territories: panelAnalysis.territories,
                                    industry_primary: panelAnalysis.industry,
                                    city: panelAnalysis.city,
                                  },
                                  all_territory_scores: panelAnalysis.all_territory_scores || [],
                                  aliases: panelAnalysis.aliases,
                                }, null, 2)}</pre>
                            )}
                          </div>
                        </Card>

                        <Card className="p-4 space-y-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-primary" />
                            <span className="font-medium text-sm">Matched Territories ({panelAnalysis.territories.length})</span>
                          </div>
                          <div className="space-y-2">
                            {panelAnalysis.territories.map((t) => (
                              <div key={t.territory_id} className="flex items-start gap-2 text-sm">
                                <div className="flex-1">
                                  <span className="font-medium">{t.label}</span>
                                  <span className="text-muted-foreground ml-2 text-xs">score {t.score.toFixed(1)}</span>
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {t.matched_keywords.slice(0, 5).map((kw) => (
                                      <span key={kw} className="text-xs text-muted-foreground">{kw}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card>

                        <Card className="p-4 space-y-3">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-primary" />
                              <span className="font-medium text-sm">Generated Prompts ({panelAnalysis.prompts.length})</span>
                            </div>
                          </div>
                          <div className="space-y-1.5 max-h-64 overflow-y-auto">
                            {panelAnalysis.prompts.map((p, i) => (
                              <div key={p.id} className="flex items-start gap-2 text-sm py-1 border-b last:border-b-0">
                                <span className="text-muted-foreground text-xs font-mono w-5 shrink-0 pt-0.5">{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                  <span className="break-words">{p.text}</span>
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    <Badge variant="outline" className="text-[10px] py-0">{p.territory_label}</Badge>
                                    <Badge variant="outline" className="text-[10px] py-0">{p.query_type}</Badge>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card>

                        <Button
                          type="button"
                          onClick={handlePanelScore}
                          disabled={isPanelScoring}
                          className="w-full"
                          data-testid="button-panel-score"
                        >
                          {isPanelScoring ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Running across 3 AI engines...
                            </>
                          ) : (
                            <>
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Run GEO Scoring ({panelAnalysis.prompts.length} prompts x 3 engines)
                            </>
                          )}
                        </Button>

                        {panelScoringResult && (
                          <ResultsDashboard
                            score={panelScoringResult.score}
                            brandName={panelBrand}
                            mode={panelScoringResult.mode}
                            promptsUsed={panelScoringResult.prompts_used}
                            rawRuns={panelScoringResult.raw_runs || panelRawRuns || []}
                            onNewAnalysis={() => {
                              setPanelAnalysis(null);
                              setPanelScoringResult(null);
                              setPanelRawRuns(null);
                            }}
                          />
                        )}
                      </motion.div>
                    )}
                  </div>
                )}

                {mode === "quick" && (
                  <div className="space-y-6 pb-16">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Brand Name
                        </label>
                        <Input
                          value={brandName}
                          onChange={(e) => setBrandName(e.target.value)}
                          placeholder="e.g. Pemo"
                          className="bg-secondary/50 border-border"
                          data-testid="input-quick-brand-name"
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
                          placeholder="e.g. pemo.io"
                          className="bg-secondary/50 border-border"
                          data-testid="input-quick-brand-domain"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Persona
                        </label>
                        <Select
                          value={persona}
                          onValueChange={(v) => {
                            setPersona(v);
                            setQuickCustomerType("");
                            setQuickSeedType(v === "restaurant" ? "restaurants" : "providers");
                          }}
                        >
                          <SelectTrigger className="bg-secondary/50" data-testid="select-quick-persona">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="marketing_agency">Marketing Agency</SelectItem>
                            <SelectItem value="automation_consultant">Automation Consultant</SelectItem>
                            <SelectItem value="corporate_cards_provider">Corporate Cards Provider</SelectItem>
                            <SelectItem value="expense_management_software">Expense Management Software</SelectItem>
                            <SelectItem value="restaurant">Restaurant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Seed Type
                        </label>
                        <Select value={quickSeedType} onValueChange={setQuickSeedType}>
                          <SelectTrigger className="bg-secondary/50" data-testid="select-quick-seed-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {persona === "restaurant" ? (
                              <>
                                <SelectItem value="restaurants">Restaurants</SelectItem>
                                <SelectItem value="places">Places</SelectItem>
                                <SelectItem value="spots">Spots</SelectItem>
                                <SelectItem value="eateries">Eateries</SelectItem>
                                <SelectItem value="dining options">Dining Options</SelectItem>
                                <SelectItem value="cafes">Cafes</SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="software">Software</SelectItem>
                                <SelectItem value="providers">Providers</SelectItem>
                                <SelectItem value="vendors">Vendors</SelectItem>
                                <SelectItem value="platforms">Platforms</SelectItem>
                                <SelectItem value="tools">Tools</SelectItem>
                                <SelectItem value="solutions">Solutions</SelectItem>
                                <SelectItem value="companies">Companies</SelectItem>
                                <SelectItem value="agencies">Agencies</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {persona === "restaurant" ? "Cuisine / Style" : "Customer Type"} <span className="text-muted-foreground/60 normal-case">(optional)</span>
                        </label>
                        <Select value={quickCustomerType} onValueChange={setQuickCustomerType}>
                          <SelectTrigger className="bg-secondary/50" data-testid="select-quick-customer-type">
                            <SelectValue placeholder={persona === "restaurant" ? "Any cuisine..." : "Any customer type..."} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">
                              <span className="text-muted-foreground italic">{persona === "restaurant" ? "Any cuisine" : "Any customer type"}</span>
                            </SelectItem>
                            {(currentPresets?.verticals || []).map((v) => (
                              <SelectItem key={v} value={v}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Result Count
                        </label>
                        <Select value={String(quickCount)} onValueChange={(v) => setQuickCount(Number(v))}>
                          <SelectTrigger className="bg-secondary/50" data-testid="select-quick-count">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="15">15</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Location (city or country)
                      </label>
                      <Input
                        value={quickLocation}
                        onChange={(e) => setQuickLocation(e.target.value)}
                        placeholder="e.g. UAE, Dubai, Singapore"
                        className="bg-secondary/50 border-border"
                        data-testid="input-quick-location"
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={() => {
                        if (!brandName.trim()) {
                          toast({ title: "Brand name required", description: "Enter your brand name.", variant: "destructive" });
                          return;
                        }
                        if (!quickLocation.trim()) {
                          toast({ title: "Location required", description: "Enter a city or country.", variant: "destructive" });
                          return;
                        }
                        setQuickScoringResult(null);
                        setScoringResult(null);
                        const effectiveCustomerType = quickCustomerType === "__none__" ? "" : quickCustomerType;
                        const quickPrompts = generateQuickPrompts(persona, quickSeedType, effectiveCustomerType, quickCount, quickLocation.trim());
                        setQuickResult({
                          prompt_set_id: `quick-${Date.now()}`,
                          version: "pg_v1",
                          seed_used: 0,
                          counts: {
                            by_cluster: { direct: 10 },
                            by_shape: { open: 10 },
                            modifier_prompts: 0,
                            geo_prompts: 10,
                          },
                          prompts: quickPrompts,
                          unverified_items: [],
                        });
                      }}
                      data-testid="button-quick-generate"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate 10 Prompts
                    </Button>

                    {quickResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <Card className="p-4 space-y-3">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-primary" />
                              <span className="font-medium text-sm">Generated Prompts ({quickResult.prompts.length})</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setQuickResult(null);
                                setQuickScoringResult(null);
                              }}
                              data-testid="button-quick-reset"
                            >
                              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                              Reset
                            </Button>
                          </div>
                          <div className="space-y-1.5 max-h-80 overflow-y-auto">
                            {quickResult.prompts.map((p, i) => (
                              <div key={p.id} className="flex items-start gap-2 text-sm py-1.5 border-b last:border-b-0">
                                <span className="text-muted-foreground text-xs font-mono w-5 shrink-0 pt-0.5">{i + 1}</span>
                                <span className="break-words flex-1">{p.text}</span>
                              </div>
                            ))}
                          </div>
                        </Card>

                        <div className="space-y-3">
                          <Button
                            type="button"
                            onClick={() => {
                              runQuickScoring({
                                prompts: quickResult.prompts,
                                brand_name: brandName.trim(),
                                brand_domain: brandDomain.trim() || undefined,
                                mode: "full",
                                profile: {
                                  persona,
                                  services,
                                  verticals,
                                  geo: geo || null,
                                },
                              });
                            }}
                            disabled={isQuickScoring}
                            className="w-full"
                            data-testid="button-quick-score"
                          >
                            {isQuickScoring ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Running across 3 AI engines...
                              </>
                            ) : (
                              <>
                                <BarChart3 className="w-4 h-4 mr-2" />
                                Run GEO Scoring (10 prompts x 3 engines)
                              </>
                            )}
                          </Button>
                        </div>

                        {quickScoringResult && (
                          <ResultsDashboard
                            score={quickScoringResult.score}
                            brandName={brandName}
                            mode={quickScoringResult.mode}
                            promptsUsed={quickScoringResult.prompts_used}
                            rawRuns={quickScoringResult.raw_runs || []}
                            onNewAnalysis={() => {
                              setQuickResult(null);
                              setQuickScoringResult(null);
                            }}
                          />
                        )}
                      </motion.div>
                    )}
                  </div>
                )}

                {mode === "quickv2" && (
                  <div className="space-y-6 pb-16">
                    {((v2Configs && v2Configs.length > 0) || (v2Sessions && v2Sessions.length > 0)) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {v2Configs && v2Configs.length > 0 && (
                          <div>
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
                              Saved Configs
                            </label>
                            <div className="space-y-1">
                              {v2Configs.map((cfg) => {
                                const segCount = Array.isArray(cfg.segments) ? cfg.segments.length : 0;
                                return (
                                  <div key={cfg.id} className="flex items-center gap-2 group" data-testid={`v2-config-${cfg.id}`}>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="flex-1 justify-start text-left h-auto py-1.5 px-2 text-xs"
                                      onClick={() => loadV2Config(cfg)}
                                      data-testid={`button-load-config-${cfg.id}`}
                                    >
                                      <Tag className="w-3 h-3 mr-1.5 shrink-0 text-muted-foreground" />
                                      <span className="truncate font-medium">{cfg.name}</span>
                                      <Badge variant="secondary" className="ml-auto text-[9px] shrink-0">
                                        {segCount} seg{segCount !== 1 ? "s" : ""}
                                      </Badge>
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                      onClick={() => deleteV2Config(cfg.id)}
                                      data-testid={`button-delete-config-${cfg.id}`}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {v2Sessions && v2Sessions.length > 0 && (
                          <div>
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
                              Past Results
                            </label>
                            <Select
                              onValueChange={(v) => {
                                const session = v2Sessions.find((s) => String(s.id) === v);
                                if (session) loadV2Session(session);
                              }}
                            >
                              <SelectTrigger className="bg-secondary/50" data-testid="select-v2-session">
                                <SelectValue placeholder="Load a previous analysis..." />
                              </SelectTrigger>
                              <SelectContent>
                                {v2Sessions.map((s) => {
                                  const segCount = Array.isArray(s.segments) ? s.segments.length : 0;
                                  const dateStr = new Date(s.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
                                  return (
                                    <SelectItem key={s.id} value={String(s.id)} data-testid={`v2-session-option-${s.id}`}>
                                      {s.brandName} — {segCount} seg{segCount !== 1 ? "s" : ""} — {dateStr}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Brand Name
                        </label>
                        <Input
                          value={brandName}
                          onChange={(e) => setBrandName(e.target.value)}
                          placeholder="e.g. Pemo"
                          className="bg-secondary/50 border-border"
                          data-testid="input-v2-brand-name"
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
                          placeholder="e.g. pemo.io"
                          className="bg-secondary/50 border-border"
                          data-testid="input-v2-brand-domain"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Prompts per Segment
                        </label>
                        <Select value={String(v2PromptsPerSegment)} onValueChange={(v) => setV2PromptsPerSegment(Number(v))}>
                          <SelectTrigger className="bg-secondary/50" data-testid="select-v2-prompts-per-segment">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-4">
                      {v2Segments.map((seg, idx) => {
                        const segPresets = presets?.[seg.persona];
                        return (
                          <Card key={seg.id} className="p-4 space-y-4 relative" data-testid={`v2-segment-${idx}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs font-mono">Segment {idx + 1}</Badge>
                              </div>
                              {v2Segments.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSegment(seg.id)}
                                  className="text-muted-foreground hover:text-destructive h-7 w-7 p-0"
                                  data-testid={`button-v2-remove-segment-${idx}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  Persona
                                </label>
                                <Select
                                  value={seg.persona}
                                  onValueChange={(v) => {
                                    updateSegment(seg.id, {
                                      persona: v,
                                      customerType: "",
                                      seedType: v === "restaurant" ? "restaurants" : "providers",
                                      prompts: null,
                                    });
                                  }}
                                >
                                  <SelectTrigger className="bg-secondary/50" data-testid={`select-v2-persona-${idx}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="marketing_agency">Marketing Agency</SelectItem>
                                    <SelectItem value="automation_consultant">Automation Consultant</SelectItem>
                                    <SelectItem value="corporate_cards_provider">Corporate Cards Provider</SelectItem>
                                    <SelectItem value="expense_management_software">Expense Management Software</SelectItem>
                                    <SelectItem value="accounting_automation">Accounting Automation</SelectItem>
                                    <SelectItem value="invoice_management">Invoice Management</SelectItem>
                                    <SelectItem value="restaurant">Restaurant</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  Seed Type
                                </label>
                                <Select value={seg.seedType} onValueChange={(v) => updateSegment(seg.id, { seedType: v, prompts: null })}>
                                  <SelectTrigger className="bg-secondary/50" data-testid={`select-v2-seed-type-${idx}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {seg.persona === "restaurant" ? (
                                      <>
                                        <SelectItem value="restaurants">Restaurants</SelectItem>
                                        <SelectItem value="places">Places</SelectItem>
                                        <SelectItem value="spots">Spots</SelectItem>
                                        <SelectItem value="eateries">Eateries</SelectItem>
                                        <SelectItem value="dining options">Dining Options</SelectItem>
                                        <SelectItem value="cafes">Cafes</SelectItem>
                                      </>
                                    ) : (
                                      <>
                                        <SelectItem value="software">Software</SelectItem>
                                        <SelectItem value="providers">Providers</SelectItem>
                                        <SelectItem value="vendors">Vendors</SelectItem>
                                        <SelectItem value="platforms">Platforms</SelectItem>
                                        <SelectItem value="tools">Tools</SelectItem>
                                        <SelectItem value="solutions">Solutions</SelectItem>
                                        <SelectItem value="companies">Companies</SelectItem>
                                        <SelectItem value="agencies">Agencies</SelectItem>
                                      </>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  {seg.persona === "restaurant" ? "Cuisine / Style" : "Customer Type"} <span className="text-muted-foreground/60 normal-case">(optional)</span>
                                </label>
                                <Select value={seg.customerType || "__none__"} onValueChange={(v) => updateSegment(seg.id, { customerType: v === "__none__" ? "" : v, prompts: null })}>
                                  <SelectTrigger className="bg-secondary/50" data-testid={`select-v2-customer-type-${idx}`}>
                                    <SelectValue placeholder={seg.persona === "restaurant" ? "Any cuisine..." : "Any customer type..."} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__none__">
                                      <span className="text-muted-foreground italic">{seg.persona === "restaurant" ? "Any cuisine" : "Any customer type"}</span>
                                    </SelectItem>
                                    {(segPresets?.verticals || []).map((v) => (
                                      <SelectItem key={v} value={v}>{v}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  Location (city or country)
                                </label>
                                <Input
                                  value={seg.location}
                                  onChange={(e) => updateSegment(seg.id, { location: e.target.value })}
                                  placeholder="e.g. UAE, Dubai, Singapore"
                                  className="bg-secondary/50 border-border"
                                  data-testid={`input-v2-location-${idx}`}
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Result Count (find top N)
                              </label>
                              <Select value={String(seg.resultCount)} onValueChange={(v) => updateSegment(seg.id, { resultCount: Number(v), prompts: null })}>
                                <SelectTrigger className="bg-secondary/50 w-24" data-testid={`select-v2-result-count-${idx}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="3">3</SelectItem>
                                  <SelectItem value="5">5</SelectItem>
                                  <SelectItem value="10">10</SelectItem>
                                  <SelectItem value="15">15</SelectItem>
                                  <SelectItem value="20">20</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {seg.prompts && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="border-t pt-3"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <FileText className="w-3.5 h-3.5 text-primary" />
                                  <span className="text-xs font-medium text-muted-foreground">
                                    {seg.prompts.length} prompts generated
                                  </span>
                                </div>
                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                  {seg.prompts.map((p, pi) => (
                                    <div key={p.id} className="flex items-start gap-2 text-xs py-1 border-b last:border-b-0 border-border/50">
                                      <span className="text-muted-foreground font-mono w-4 shrink-0 pt-0.5">{pi + 1}</span>
                                      <span className="break-words flex-1">{p.text}</span>
                                    </div>
                                  ))}
                                </div>

                                {seg.isScoring && (
                                  <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                                    <span>Scoring across 3 AI engines...</span>
                                  </div>
                                )}

                                {seg.scoringResult && (
                                  <div className="pt-3 border-t">
                                    <SegmentResultsDashboard
                                      score={seg.scoringResult.score}
                                      brandName={brandName}
                                      rawRuns={seg.scoringResult.raw_runs || []}
                                      segmentLabel={`${idx + 1}`}
                                    />
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </Card>
                        );
                      })}

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addSegment}
                          className="flex-1 border-dashed"
                          data-testid="button-v2-add-segment"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Segment
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (!brandName.trim()) {
                              toast({ title: "Brand name required", description: "Enter your brand name first.", variant: "destructive" });
                              return;
                            }
                            if (v2Segments.length === 0) {
                              toast({ title: "No segments", description: "Add at least one segment.", variant: "destructive" });
                              return;
                            }
                            setConfigName(`${brandName.trim()} — ${v2Segments.length} seg`);
                            setShowSaveConfigDialog(true);
                          }}
                          data-testid="button-v2-save-config"
                        >
                          <Tag className="w-4 h-4 mr-2" />
                          Save Config
                        </Button>
                      </div>

                      {showSaveConfigDialog && (
                        <Card className="p-3 flex items-end gap-2">
                          <div className="flex-1 space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Config Name</label>
                            <Input
                              value={configName}
                              onChange={(e) => setConfigName(e.target.value)}
                              placeholder="e.g. Pemo — UAE segments"
                              className="h-8 text-sm"
                              autoFocus
                              data-testid="input-config-name"
                            />
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            className="h-8"
                            disabled={!configName.trim()}
                            onClick={() => {
                              saveV2Config({
                                name: configName.trim(),
                                brandName: brandName.trim(),
                                brandDomain: brandDomain.trim() || null,
                                promptsPerSegment: v2PromptsPerSegment,
                                segments: v2Segments.map((seg) => ({
                                  persona: seg.persona,
                                  seedType: seg.seedType,
                                  customerType: seg.customerType,
                                  location: seg.location,
                                  resultCount: seg.resultCount,
                                })),
                              });
                              setShowSaveConfigDialog(false);
                              setConfigName("");
                            }}
                            data-testid="button-confirm-save-config"
                          >
                            Save
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            onClick={() => { setShowSaveConfigDialog(false); setConfigName(""); }}
                            data-testid="button-cancel-save-config"
                          >
                            Cancel
                          </Button>
                        </Card>
                      )}
                    </div>

                    <div className="flex gap-3">
                      {!v2Segments.every((s) => s.prompts) ? (
                        <Button
                          type="button"
                          onClick={() => {
                            if (!brandName.trim()) {
                              toast({ title: "Brand name required", description: "Enter your brand name.", variant: "destructive" });
                              return;
                            }
                            const emptyLocation = v2Segments.find((s) => !s.location.trim());
                            if (emptyLocation) {
                              const idx = v2Segments.indexOf(emptyLocation) + 1;
                              toast({ title: `Segment ${idx} missing location`, description: "Enter a location for each segment.", variant: "destructive" });
                              return;
                            }
                            setV2Segments((prev) =>
                              prev.map((seg) => {
                                const effectiveCustomerType = seg.customerType === "__none__" ? "" : seg.customerType;
                                const prompts = generateQuickPrompts(seg.persona, seg.seedType, effectiveCustomerType, seg.resultCount, seg.location.trim(), v2PromptsPerSegment);
                                return { ...seg, prompts, scoringResult: null, isScoring: false };
                              })
                            );
                          }}
                          className="flex-1"
                          data-testid="button-v2-generate-all"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Prompts ({v2Segments.length} segment{v2Segments.length > 1 ? "s" : ""} x {v2PromptsPerSegment} prompts)
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={async () => {
                            if (!brandName.trim()) return;
                            setV2IsAnalysing(true);
                            const segSnapshot = v2Segments.map((seg) => ({
                              id: seg.id,
                              persona: seg.persona,
                              seedType: seg.seedType,
                              customerType: seg.customerType,
                              location: seg.location,
                              resultCount: seg.resultCount,
                              prompts: seg.prompts,
                              scoringResult: null as ScoringResponse | null,
                            }));
                            for (let i = 0; i < segSnapshot.length; i++) {
                              const seg = segSnapshot[i];
                              if (!seg.prompts) continue;
                              setV2Segments((prev) => prev.map((s) => s.id === seg.id ? { ...s, isScoring: true } : s));
                              try {
                                const res = await apiRequest("POST", "/api/scoring/run", {
                                  prompts: seg.prompts,
                                  brand_name: brandName.trim(),
                                  brand_domain: brandDomain.trim() || undefined,
                                  mode: "full",
                                  source: "v2segment",
                                  profile: {
                                    persona: seg.persona,
                                    services: [],
                                    verticals: [seg.customerType].filter(Boolean),
                                    geo: seg.location.trim() || null,
                                  },
                                });
                                const data = await res.json() as ScoringResponse;
                                segSnapshot[i].scoringResult = data;
                                setV2Segments((prev) => prev.map((s) => s.id === seg.id ? { ...s, scoringResult: data, isScoring: false } : s));
                              } catch (err: any) {
                                toast({ title: `Segment ${i + 1} scoring failed`, description: err.message || "Something went wrong.", variant: "destructive" });
                                setV2Segments((prev) => prev.map((s) => s.id === seg.id ? { ...s, isScoring: false } : s));
                              }
                            }
                            setV2IsAnalysing(false);
                            const hasResults = segSnapshot.some((s) => s.scoringResult !== null);
                            if (hasResults) {
                              const segmentsToSave = segSnapshot.map((seg) => ({
                                persona: seg.persona,
                                seedType: seg.seedType,
                                customerType: seg.customerType,
                                location: seg.location,
                                resultCount: seg.resultCount,
                                prompts: seg.prompts,
                                scoringResult: seg.scoringResult,
                              }));
                              saveV2Session({
                                brandName: brandName.trim(),
                                brandDomain: brandDomain.trim() || null,
                                promptsPerSegment: v2PromptsPerSegment,
                                segments: segmentsToSave,
                              });
                            }
                          }}
                          disabled={v2IsAnalysing}
                          className="flex-1"
                          data-testid="button-v2-analyse-all"
                        >
                          {v2IsAnalysing ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Analysing {v2Segments.length} segment{v2Segments.length > 1 ? "s" : ""} across 3 AI engines...
                            </>
                          ) : (
                            <>
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Analyse ({v2Segments.length} segment{v2Segments.length > 1 ? "s" : ""} x {v2PromptsPerSegment} prompts x 3 engines)
                            </>
                          )}
                        </Button>
                      )}
                      {v2Segments.some((s) => s.prompts) && (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={v2IsAnalysing}
                          onClick={() => {
                            setV2Segments((prev) => prev.map((s) => ({ ...s, prompts: null, scoringResult: null, isScoring: false })));
                          }}
                          data-testid="button-v2-clear-all"
                        >
                          <ArrowLeft className="w-4 h-4 mr-1" />
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {mode === "quickv2" && v2Segments.some((s) => s.scoringResult) && !v2IsAnalysing && (
                  <SegmentCitationAnalyzer
                    brandName={brandName}
                    segments={v2Segments.filter(s => s.scoringResult).map(s => ({
                      id: s.id,
                      seedType: s.seedType,
                      customerType: s.customerType,
                      location: s.location,
                      scoringResult: s.scoringResult,
                    }))}
                  />
                )}

                {mode !== "panel" && mode !== "quick" && mode !== "quickv2" && (<form onSubmit={handleGenerate} className="space-y-6 pb-16">
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
                          <SelectItem value="corporate_cards_provider">
                            Corporate Cards Provider
                          </SelectItem>
                          <SelectItem value="expense_management_software">
                            Expense Management Software
                          </SelectItem>
                          <SelectItem value="restaurant">
                            Restaurant
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {!simpleMode && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Results per prompt
                        </label>
                        <Select value={String(resultCount)} onValueChange={(v) => setResultCount(Number(v))}>
                          <SelectTrigger
                            className="bg-secondary/50"
                            data-testid="select-result-count"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="15">15</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {simpleMode && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Prompt Style
                        </label>
                        <Select value={promptStyle} onValueChange={(v) => setPromptStyle(v as "find_best" | "top5" | "top3")}>
                          <SelectTrigger
                            className="bg-secondary/50"
                            data-testid="select-prompt-style"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="find_best">Find me best</SelectItem>
                            <SelectItem value="top5">Find, list and rank 5 top</SelectItem>
                            <SelectItem value="top3">Find, list and rank 3 top</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
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

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Decision Maker
                      <span className="text-muted-foreground/60 normal-case ml-1">(optional)</span>
                    </label>
                    <TagInput
                      values={decisionMakers}
                      onChange={setDecisionMakers}
                      placeholder="Type or pick roles..."
                      suggestions={currentPresets?.decision_makers}
                      testIdPrefix="decision-makers"
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
                </form>)}
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
                      {result.prompts.length} prompts generated{disabledPrompts.size > 0 ? ` (${result.prompts.length - disabledPrompts.size} enabled)` : ""}
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
                      {(() => {
                        const enabled = result ? result.prompts.length - disabledPrompts.size : 0;
                        if (simpleMode) return `Run Analysis (${enabled} prompts x 3 engines)`;
                        return `Run Analysis (${scoringMode === "micro" ? "4" : scoringMode === "quick" ? "10" : enabled} prompts x 3 engines)`;
                      })()}
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
                  {filteredPrompts.map((prompt, idx) => {
                    const isDisabled = disabledPrompts.has(prompt.id);
                    const isGeoOff = geoDisabled.has(prompt.id);
                    const isEditing = editingPromptId === prompt.id;
                    const displayText = getPromptDisplayText(prompt);

                    return (
                      <Collapsible
                        key={prompt.id}
                        open={expandedPrompts.has(prompt.id)}
                        onOpenChange={() => toggleExpanded(prompt.id)}
                      >
                        <Card
                          className={isDisabled ? "opacity-50" : ""}
                          data-testid={`prompt-card-${prompt.id}`}
                        >
                          <div className="flex items-start gap-3 p-3">
                            <div className="flex items-center mt-0.5 shrink-0">
                              <Checkbox
                                checked={!isDisabled}
                                onCheckedChange={() => togglePromptEnabled(prompt.id)}
                                data-testid={`checkbox-prompt-${prompt.id}`}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground font-mono mt-0.5 shrink-0 w-6 text-right">
                              {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <Textarea
                                    value={editDrafts[prompt.id] ?? ""}
                                    onChange={(e) => setEditDrafts((prev) => ({ ...prev, [prompt.id]: e.target.value }))}
                                    className="text-sm min-h-[60px]"
                                    data-testid={`textarea-edit-${prompt.id}`}
                                  />
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => saveEdit(prompt.id)}
                                      data-testid={`button-save-edit-${prompt.id}`}
                                    >
                                      <Check className="w-3 h-3 mr-1" />
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={cancelEdit}
                                      data-testid={`button-cancel-edit-${prompt.id}`}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p
                                  className={`text-sm leading-relaxed ${editedTexts[prompt.id] ? "text-primary" : ""}`}
                                  data-testid={`text-prompt-${prompt.id}`}
                                >
                                  {displayText}
                                </p>
                              )}
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
                                {prompt.geo_included && !isGeoOff && (
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
                              {prompt.geo_included && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => toggleGeo(prompt.id)}
                                  className={isGeoOff ? "text-muted-foreground" : "text-primary"}
                                  title={isGeoOff ? "Location removed" : "Click to remove location"}
                                  data-testid={`button-geo-${prompt.id}`}
                                >
                                  <MapPin className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => startEditing(prompt)}
                                title="Edit prompt"
                                data-testid={`button-edit-${prompt.id}`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <CopyButton text={displayText} promptId={prompt.id} />
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
                    );
                  })}

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

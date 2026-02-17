import { useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
import {
  Loader2,
  ArrowLeft,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  X,
  Sparkles,
  Download,
  Filter,
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

interface Presets {
  [persona: string]: {
    verticals: string[];
    services: string[];
    modifiers: string[];
  };
}

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

export default function PromptGenerator() {
  const [persona, setPersona] = useState<string>("marketing_agency");
  const [verticals, setVerticals] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [modifiers, setModifiers] = useState<string[]>([]);
  const [geo, setGeo] = useState("");
  const [budgetTier, setBudgetTier] = useState("mid");
  const [filterCluster, setFilterCluster] = useState<string>("all");
  const [filterShape, setFilterShape] = useState<string>("all");
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(
    new Set(),
  );
  const { toast } = useToast();

  const { data: presets } = useQuery<Presets>({
    queryKey: ["/api/promptgen/presets"],
  });

  const {
    mutate: generate,
    isPending,
    data: result,
    reset,
  } = useMutation<PromptSet, Error, unknown>({
    mutationFn: async (body) => {
      const res = await apiRequest("POST", "/api/promptsets", body);
      return res.json();
    },
  });

  const currentPresets = presets?.[persona];

  const PERSONA_CATEGORY: Record<string, string> = {
    marketing_agency: "marketing agency",
    automation_consultant: "automation consultant",
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleStartOver = () => {
    reset();
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

  const copyAllPrompts = () => {
    const allText = filteredPrompts.map((p) => p.text).join("\n\n");
    navigator.clipboard.writeText(allText);
    toast({ title: "Copied", description: `${filteredPrompts.length} prompts copied to clipboard.` });
  };

  const exportCsv = () => {
    if (!result) return;
    const header = "id,cluster,shape,modifier,geo,text";
    const rows = result.prompts.map(
      (p) =>
        `${p.id},${p.cluster},${p.shape},${p.modifier_included},${p.geo_included},"${p.text.replace(/"/g, '""')}"`,
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prompts_${result.seed_used}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <nav className="w-full border-b border-border sticky top-0 z-50 bg-background">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-base font-semibold tracking-tight"
            data-testid="link-home"
          >
            sherlok.ai
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
            {!result && !isPending && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                key="form"
              >
                <div className="pt-16 pb-8 space-y-2">
                  <h1
                    className="text-3xl md:text-4xl font-semibold tracking-tight"
                    data-testid="text-heading"
                  >
                    How do your customers look for you?
                  </h1>
                </div>

                <form onSubmit={handleGenerate} className="space-y-6 pb-16">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Target Verticals (min 2)
                    </label>
                    <TagInput
                      values={verticals}
                      onChange={setVerticals}
                      placeholder="Type or pick verticals..."
                      suggestions={currentPresets?.verticals}
                      testIdPrefix="verticals"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Services (min 3)
                    </label>
                    <TagInput
                      values={services}
                      onChange={setServices}
                      placeholder="Type or pick services..."
                      suggestions={currentPresets?.services}
                      testIdPrefix="services"
                    />
                  </div>

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

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Geographic Focus (optional)
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
                    disabled={isPending}
                    className="w-full"
                    data-testid="button-generate"
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Generate 40 Prompts
                  </Button>
                </form>
              </motion.div>
            )}

            {isPending && (
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

            {result && !isPending && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                key="results"
              >
                <div className="pt-8 pb-6 space-y-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h2
                        className="text-xl font-semibold tracking-tight"
                        data-testid="text-results-heading"
                      >
                        {result.prompts.length} prompts generated
                      </h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Seed: {result.seed_used}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyAllPrompts}
                        data-testid="button-copy-all"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                        Copy All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportCsv}
                        data-testid="button-export-csv"
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        CSV
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleStartOver}
                        data-testid="button-start-over"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                        New Set
                      </Button>
                    </div>
                  </div>

                  {result.unverified_items.length > 0 && (
                    <div className="text-xs text-muted-foreground border border-border rounded-md p-3">
                      <span className="font-medium text-foreground">
                        Unverified:
                      </span>{" "}
                      {result.unverified_items.map((u) => u.display).join(", ")}
                      . These terms were used but may not match known
                      tools/platforms.
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(result.counts.by_cluster).map(
                      ([cluster, count]) => (
                        <div
                          key={cluster}
                          className="text-center py-2 border border-border rounded-md"
                          data-testid={`stat-cluster-${cluster}`}
                        >
                          <div className="text-lg font-semibold">{count}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {CLUSTER_LABELS[cluster] || cluster}
                          </div>
                        </div>
                      ),
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Filter:
                      </span>
                    </div>
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
          </AnimatePresence>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border mt-auto">
        sherlok.ai
      </footer>
    </div>
  );
}

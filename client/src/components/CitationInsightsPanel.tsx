import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Clock,
  DollarSign,
  FileText,
} from "lucide-react";
import { format } from "date-fns";

// ── Model catalogue ───────────────────────────────────────────────────────────
const MODELS = [
  {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    provider: "Gemini",
    inputPerMTok: 0.075,
    outputPerMTok: 0.30,
    contextK: 1000,
    note: "1M token context · cheapest",
    color: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    id: "claude-haiku-3-5",
    label: "Claude Haiku 3.5",
    provider: "Anthropic",
    inputPerMTok: 0.80,
    outputPerMTok: 4.00,
    contextK: 200,
    note: "200K context · fast",
    color: "text-orange-600 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
    bg: "bg-orange-50 dark:bg-orange-950/30",
  },
  {
    id: "gpt-4o",
    label: "GPT-4o",
    provider: "OpenAI",
    inputPerMTok: 2.50,
    outputPerMTok: 10.00,
    contextK: 128,
    note: "128K context",
    color: "text-green-600 dark:text-green-400",
    border: "border-green-200 dark:border-green-800",
    bg: "bg-green-50 dark:bg-green-950/30",
  },
  {
    id: "claude-sonnet-4-5",
    label: "Claude Sonnet 4.5",
    provider: "Anthropic",
    inputPerMTok: 3.00,
    outputPerMTok: 15.00,
    contextK: 200,
    note: "200K context · highest quality",
    color: "text-orange-700 dark:text-orange-300",
    border: "border-orange-300 dark:border-orange-700",
    bg: "bg-orange-50 dark:bg-orange-950/30",
  },
  {
    id: "gpt-5.2",
    label: "GPT-5.2",
    provider: "OpenAI",
    inputPerMTok: 10.00,
    outputPerMTok: 40.00,
    contextK: 128,
    note: "128K context · may hit limit on large sessions",
    color: "text-green-700 dark:text-green-300",
    border: "border-green-300 dark:border-green-700",
    bg: "bg-green-50 dark:bg-green-950/30",
  },
];

// Rough cost estimate: CSV ~250 chars/row → ~62 tokens/row; output ~3K tokens
function estimateCost(model: typeof MODELS[0], rowCount: number) {
  const inputTok = rowCount * 62 + 800; // data + prompt overhead
  const outputTok = 3000;
  const inputCost = (inputTok / 1_000_000) * model.inputPerMTok;
  const outputCost = (outputTok / 1_000_000) * model.outputPerMTok;
  const total = inputCost + outputCost;
  if (total < 0.01) return `~$${(total * 100).toFixed(2)}¢`;
  return `~$${total.toFixed(3)}`;
}

function fitsInContext(model: typeof MODELS[0], rowCount: number) {
  const inputTok = rowCount * 62 + 800;
  return inputTok < model.contextK * 1000 * 0.85; // 85% headroom
}

// ── Past insight result card ─────────────────────────────────────────────────
function InsightCard({ insight }: { insight: any }) {
  const [open, setOpen] = useState(false);
  const model = MODELS.find(m => m.id === insight.model);
  const costUsd = insight.input_tokens && insight.output_tokens
    ? ((insight.input_tokens / 1_000_000) * (model?.inputPerMTok ?? 3) +
       (insight.output_tokens / 1_000_000) * (model?.outputPerMTok ?? 15))
    : null;

  return (
    <div className="rounded-lg border bg-card">
      <button
        className="w-full text-left px-4 py-3 flex items-center gap-3"
        onClick={() => setOpen(o => !o)}
        data-testid={`citation-insight-card-${insight.id}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold ${model?.color ?? "text-foreground"}`}>
              {model?.label ?? insight.model}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(insight.created_at), "MMM d, yyyy 'at' h:mm a")}
            </span>
            {insight.row_count && (
              <Badge variant="outline" className="text-[10px]">
                {insight.row_count.toLocaleString()} rows
              </Badge>
            )}
            {costUsd !== null && (
              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                <DollarSign className="w-3 h-3" />
                ${costUsd.toFixed(3)} actual
              </span>
            )}
          </div>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </button>

      {open && (
        <div className="border-t px-4 py-4">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-xs leading-relaxed font-sans text-foreground bg-transparent p-0 border-0">
              {insight.result_text}
            </pre>
          </div>
          {(insight.input_tokens || insight.output_tokens) && (
            <p className="text-[10px] text-muted-foreground mt-3 pt-3 border-t">
              Tokens used: {insight.input_tokens?.toLocaleString() ?? "—"} input / {insight.output_tokens?.toLocaleString() ?? "—"} output
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export function CitationInsightsPanel({ sessionId }: { sessionId: number }) {
  const qc = useQueryClient();
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");

  const { data, isLoading: dataLoading } = useQuery<{ rowCount: number; insights: any[] }>({
    queryKey: ["/api/multi-segment-sessions", sessionId, "citation-insights"],
    queryFn: async () => {
      const res = await fetch(`/api/multi-segment-sessions/${sessionId}/citation-insights`);
      if (!res.ok) throw new Error("Failed to load insights");
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/multi-segment-sessions/${sessionId}/citation-insights`, {
        model: selectedModel,
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["/api/multi-segment-sessions", sessionId, "citation-insights"],
      });
    },
  });

  const rowCount = data?.rowCount ?? 0;
  const insights = data?.insights ?? [];
  const chosenModel = MODELS.find(m => m.id === selectedModel)!;
  const fits = fitsInContext(chosenModel, rowCount);

  return (
    <Card className="mt-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="w-4 h-4" />
          Citation AI Insights
          {rowCount > 0 && (
            <Badge variant="secondary" className="text-[10px] font-normal ml-1">
              <FileText className="w-3 h-3 mr-1" />
              {rowCount.toLocaleString()} citation rows
            </Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Send the full citation dataset to any model to discover what top-cited brands are doing right — ranked factors with exact examples.
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Model selector */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Select model</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {MODELS.map(m => {
              const active = selectedModel === m.id;
              const ok = fitsInContext(m, rowCount);
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedModel(m.id)}
                  disabled={mutation.isPending}
                  data-testid={`model-select-${m.id}`}
                  className={`text-left rounded-lg border px-3 py-2.5 transition-all ${
                    active
                      ? `${m.border} ${m.bg} ring-1 ring-current`
                      : "border-border hover:border-muted-foreground/40 bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div>
                      <p className={`text-xs font-semibold ${active ? m.color : ""}`}>{m.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{m.note}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs font-semibold ${active ? m.color : "text-muted-foreground"}`}>
                        {rowCount ? estimateCost(m, rowCount) : "—"}
                      </p>
                      {!ok && rowCount > 0 && (
                        <p className="text-[10px] text-destructive/80 mt-0.5">may hit limit</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cost callout */}
        {rowCount > 0 && (
          <div className={`rounded-lg border px-3 py-2.5 flex items-center gap-3 text-xs ${
            fits
              ? "border-muted bg-muted/30"
              : "border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20"
          }`}>
            <DollarSign className={`w-4 h-4 flex-shrink-0 ${fits ? "text-muted-foreground" : "text-orange-500"}`} />
            <div>
              <span className="font-medium">
                Estimated cost: {estimateCost(chosenModel, rowCount)}
              </span>
              <span className="text-muted-foreground ml-2">
                · {rowCount.toLocaleString()} rows · ~{(rowCount * 62 / 1000).toFixed(0)}K input tokens
              </span>
              {!fits && (
                <p className="text-orange-600 dark:text-orange-400 mt-0.5">
                  This session may exceed {chosenModel.label}'s {chosenModel.contextK}K context limit. Consider using Gemini or Claude instead.
                </p>
              )}
            </div>
          </div>
        )}

        {rowCount === 0 && !dataLoading && (
          <p className="text-xs text-muted-foreground text-center py-2">
            No citation data found for this session.
          </p>
        )}

        {/* Run button */}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || rowCount === 0 || dataLoading}
            data-testid="button-run-citation-insight"
            className="gap-2"
          >
            {mutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" />Analysing… (may take 30–90s)</>
              : <><Sparkles className="w-4 h-4" />Analyse with {chosenModel.label}</>}
          </Button>
          {insights.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {insights.length} previous run{insights.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {mutation.isError && (
          <p className="text-sm text-destructive flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            {(mutation.error as Error)?.message ?? "Analysis failed"}
          </p>
        )}

        {/* Live result (just ran) */}
        {mutation.isSuccess && mutation.data && (
          <div className="rounded-lg border border-primary/20 bg-primary/[0.02]">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-primary/10">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">
                {MODELS.find(m => m.id === mutation.data.model)?.label ?? mutation.data.model}
              </span>
              <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                <Clock className="w-3 h-3" />just now
              </span>
            </div>
            <pre className="px-4 py-4 whitespace-pre-wrap text-xs leading-relaxed font-sans text-foreground">
              {mutation.data.resultText}
            </pre>
          </div>
        )}

        {/* Past runs */}
        {insights.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Previous runs
              </p>
              {insights.map((insight: any) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

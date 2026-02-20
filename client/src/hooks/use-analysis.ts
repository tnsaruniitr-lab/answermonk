import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type AggregateRequest, type AggregateResponse, type EvalRequest, type EvalResponse, type Engine, type AnalysisResult } from "@shared/schema";

const ENGINES: Engine[] = ["chatgpt", "claude", "gemini", "deepseek"];

async function callEvalEngine(req: EvalRequest): Promise<EvalResponse> {
  const res = await fetch(api.eval.run.path, {
    method: api.eval.run.method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Engine call failed" }));
    throw new Error(err.message || "Engine call failed");
  }
  return res.json();
}

export function useRunAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ query, brand, webSearch = false }: { query: string; brand: string; webSearch?: boolean }) => {
      const enginePromises = ENGINES.map((engine) =>
        callEvalEngine({ query, brand, engine, topN: 10, webSearch: (engine === "chatgpt" || engine === "gemini") ? webSearch : false })
      );

      const engineResults = await Promise.all(enginePromises);

      const aggregateReq: AggregateRequest = {
        query,
        brand,
        weights: { chatgpt: 35, gemini: 35, claude: 20, deepseek: 10 },
        rankDecayP: 1.2,
        engineOutputs: engineResults.map((res) => ({
          engine: res.engine,
          presenceState: res.found_state as 0 | 1 | 2,
          position: res.pos,
          topBrands: res.top10_brands,
          rawAnswerText: res.raw_answer_text,
        })),
      };

      const aggRes = await fetch(api.aggregate.run.path, {
        method: api.aggregate.run.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aggregateReq),
      });

      if (!aggRes.ok) throw new Error("Failed to aggregate results");

      return api.aggregate.run.responses[200].parse(await aggRes.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.history.list.path] });
    },
  });
}

export function useHistory() {
  return useQuery({
    queryKey: [api.history.list.path],
    queryFn: async () => {
      const res = await fetch(api.history.list.path);
      if (!res.ok) throw new Error("Failed to fetch history");
      return api.history.list.responses[200].parse(await res.json());
    },
  });
}

export interface ScoringHistoryItem {
  id: number;
  brandName: string;
  brandDomain: string | null;
  mode: string;
  status: string;
  promptCount: number;
  engineCount: number;
  resultJson: any;
  createdAt: string;
}

export function useScoringHistory() {
  return useQuery<ScoringHistoryItem[]>({
    queryKey: ["/api/scoring/history"],
    queryFn: async () => {
      const res = await fetch("/api/scoring/history");
      if (!res.ok) throw new Error("Failed to fetch scoring history");
      return res.json();
    },
  });
}

export interface ScoringJobDetail {
  id: number;
  brandName: string;
  brandDomain: string | null;
  mode: string;
  status: string;
  promptCount: number;
  engineCount: number;
  resultJson: any;
  rawData: any;
  createdAt: string;
}

export function useScoringResult(id: number | null) {
  return useQuery<ScoringJobDetail>({
    queryKey: ["/api/scoring/results", id],
    queryFn: async () => {
      const res = await fetch(`/api/scoring/results/${id}`);
      if (!res.ok) throw new Error("Failed to fetch scoring result");
      return res.json();
    },
    enabled: id !== null,
  });
}

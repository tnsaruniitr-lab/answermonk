import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type AggregateRequest, type AggregateResponse, type EvalRequest, type EvalResponse, type Engine, type AnalysisResult } from "@shared/schema";

// MOCK DATA GENERATOR for MVP simulation
// In a real app, the backend handles this. We are simulating the "process" here
// before sending the aggregated result to the backend to "store" or "calculate final score".

const MOCK_ENGINES: Engine[] = ["chatgpt", "gemini", "claude", "deepseek"];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simulate calling an engine
async function mockEvalEngine(req: EvalRequest): Promise<EvalResponse> {
  await delay(1500 + Math.random() * 2000); // Random delay 1.5s - 3.5s

  const isFound = Math.random() > 0.3; // 70% chance to be found
  const position = isFound ? Math.floor(Math.random() * 10) + 1 : null;
  const presenceState = isFound ? (position && position <= 3 ? 2 : 1) : 0;

  // Generate some realistic-looking competitor names based on query
  const competitors = [
    "HubSpot", "Salesforce", "Zoho", "Pipedrive", "Monday.com", 
    "ClickUp", "Zendesk", "Freshworks", "Oracle", "SAP"
  ].sort(() => 0.5 - Math.random()).slice(0, 5);

  if (isFound && !competitors.includes(req.brand)) {
    competitors[Math.floor(Math.random() * competitors.length)] = req.brand;
  }

  return {
    engine: req.engine,
    query: req.query,
    brand: req.brand,
    found_state: presenceState,
    pos: position,
    top10_brands: competitors,
    raw_answer_text: `Based on your request for "${req.query}", here are the top recommendations...`,
    ts: new Date().toISOString()
  };
}

export function useRunAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ query, brand }: { query: string; brand: string }) => {
      // 1. Run simulation for all engines in parallel
      const enginePromises = MOCK_ENGINES.map(engine => 
        mockEvalEngine({ query, brand, engine, topN: 10 })
      );
      
      const engineResults = await Promise.all(enginePromises);

      // 2. Map to Aggregate Request format
      const aggregateReq: AggregateRequest = {
        query,
        brand,
        weights: { chatgpt: 35, gemini: 35, claude: 20, deepseek: 10 },
        rankDecayP: 1.2,
        engineOutputs: engineResults.map(res => ({
          engine: res.engine,
          presenceState: res.found_state as 0 | 1 | 2,
          position: res.pos,
          topBrands: res.top10_brands,
          rawAnswerText: res.raw_answer_text
        }))
      };

      // 3. Call backend aggregation endpoint
      const res = await fetch(api.aggregate.run.path, {
        method: api.aggregate.run.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aggregateReq),
      });

      if (!res.ok) throw new Error("Failed to aggregate results");
      
      // The backend response is validated by Zod schema
      return api.aggregate.run.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      // Invalidate history query to show new item
      queryClient.invalidateQueries({ queryKey: [api.history.list.path] });
    }
  });
}

export function useHistory() {
  return useQuery({
    queryKey: [api.history.list.path],
    queryFn: async () => {
      const res = await fetch(api.history.list.path);
      if (!res.ok) throw new Error("Failed to fetch history");
      return api.history.list.responses[200].parse(await res.json());
    }
  });
}

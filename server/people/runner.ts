import { pool } from "../db";
import { buildTrackAQueries, buildTrackBQueries } from "./queries";
import { queryPeopleEngine, PEOPLE_ENGINES } from "./engines";
import { parseTrackAResponse, parseTrackBResponse } from "./parser";
import { resolveIdentity } from "./resolver";
import { buildScores } from "./scorer";
import { resolveGroundingUrls } from "../report/grounding-resolver";
import type { PeopleConfig } from "./config";
import { DEFAULT_PEOPLE_CONFIG } from "./config";

interface RunnerProfile {
  id: number;
  name: string;
  current_role: string | null;
  current_company: string | null;
  past_companies: string[];
  roles: string[];
  education: string[];
  location: string | null;
  industry: string | null;
  selected_anchors: any;
}

async function updateStatus(sessionId: number, status: string, error?: string) {
  await pool.query(
    `UPDATE people_sessions SET status = $1, error_message = $2 WHERE id = $3`,
    [status, error ?? null, sessionId]
  );
}

async function saveQueryResult(result: {
  sessionId: number;
  track: string;
  queryIndex: number;
  round: number;
  queryText: string;
  engine: string;
  rawResponse: string;
  identityMatch: string;
  statedFacts: any;
  citedUrls: string[];
  targetRank: number | null;
  targetFound: boolean;
  nameLandscape: any;
  error?: string;
}) {
  await pool.query(
    `INSERT INTO people_query_results
      (session_id, track, query_index, round, query_text, engine, raw_response, identity_match,
       stated_facts, cited_urls, target_rank, target_found, name_landscape, error)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [
      result.sessionId, result.track, result.queryIndex, result.round,
      result.queryText, result.engine, result.rawResponse, result.identityMatch,
      JSON.stringify(result.statedFacts), result.citedUrls,
      result.targetRank, result.targetFound, JSON.stringify(result.nameLandscape),
      result.error ?? null,
    ]
  );
}

async function logCost(sessionId: number, engine: string, model: string, inputTokens: number, outputTokens: number) {
  try {
    const costPerInputM: Record<string, number> = {
      "gpt-4o": 2.5, "gpt-4o-mini": 0.15,
      "gpt-4.1": 2.0, "gpt-4.1-mini": 0.4, "gpt-4.1-nano": 0.1,
      "o3": 10.0, "o3-mini": 1.1, "o4-mini": 1.1,
      "gemini-2.5-flash": 0.075, "gemini-2.5-pro": 1.25,
      "gemini-2.0-flash": 0.1, "gemini-2.0-flash-lite": 0.075,
      "gemini-1.5-pro": 1.25, "gemini-1.5-flash": 0.075,
      "claude-opus-4-5": 15.0, "claude-sonnet-4-5": 3.0, "claude-haiku-4-5": 0.8,
      "claude-opus-4": 15.0, "claude-sonnet-4": 3.0, "claude-haiku-4": 0.8,
      "claude-3-7-sonnet-latest": 3.0, "claude-3-5-haiku-latest": 0.8,
    };
    const costPerOutputM: Record<string, number> = {
      "gpt-4o": 10.0, "gpt-4o-mini": 0.6,
      "gpt-4.1": 8.0, "gpt-4.1-mini": 1.6, "gpt-4.1-nano": 0.4,
      "o3": 40.0, "o3-mini": 4.4, "o4-mini": 4.4,
      "gemini-2.5-flash": 0.3, "gemini-2.5-pro": 10.0,
      "gemini-2.0-flash": 0.4, "gemini-2.0-flash-lite": 0.3,
      "gemini-1.5-pro": 5.0, "gemini-1.5-flash": 0.3,
      "claude-opus-4-5": 75.0, "claude-sonnet-4-5": 15.0, "claude-haiku-4-5": 4.0,
      "claude-opus-4": 75.0, "claude-sonnet-4": 15.0, "claude-haiku-4": 4.0,
      "claude-3-7-sonnet-latest": 15.0, "claude-3-5-haiku-latest": 4.0,
    };
    const inputCost = ((costPerInputM[model] ?? 2.5) * inputTokens) / 1_000_000;
    const outputCost = ((costPerOutputM[model] ?? 10.0) * outputTokens) / 1_000_000;
    const totalCost = inputCost + outputCost;

    await pool.query(
      `INSERT INTO people_query_costs (session_id, engine, model, input_tokens, output_tokens, cost_usd, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT DO NOTHING`,
      [sessionId, engine, model, inputTokens, outputTokens, totalCost]
    ).catch(() => {});
  } catch {}
}

function majorityVote(votes: string[]): string {
  const counts: Record<string, number> = {};
  for (const v of votes) counts[v] = (counts[v] ?? 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "absent";
}

export async function runPeopleAudit(
  sessionId: number,
  config: PeopleConfig = DEFAULT_PEOPLE_CONFIG
): Promise<void> {
  try {
    await updateStatus(sessionId, "analyzing");

    const { rows } = await pool.query<RunnerProfile>(
      `SELECT id, name, "current_role", current_company, past_companies, roles, education,
              location, industry, selected_anchors
       FROM people_sessions WHERE id = $1`,
      [sessionId]
    );

    if (rows.length === 0) throw new Error("Session not found");
    const session = rows[0];

    const anchors = session.selected_anchors ?? {
      workplaces: [session.current_company].filter(Boolean),
      roles: [session.current_role].filter(Boolean),
      education: session.education ?? [],
    };

    const profile = {
      name: session.name,
      currentRole: session.current_role,
      currentCompany: session.current_company,
      pastCompanies: session.past_companies ?? [],
      education: session.education ?? [],
      location: session.location,
      industry: session.industry,
    };

    const queryRounds = config.queryRounds ?? 3;
    const trackAQueries = buildTrackAQueries(session.name, anchors, session.industry, config.promptTemplates);
    const trackBQueries = buildTrackBQueries(session.name, session.industry, config.promptTemplates);

    const modelForEngine = (engine: string) => {
      if (engine === "chatgpt") return config.chatgptModel;
      if (engine === "gemini") return config.geminiModel;
      return config.claudeModel;
    };

    const allPromises: Promise<void>[] = [];

    for (let round = 1; round <= queryRounds; round++) {
      for (const q of trackAQueries) {
        for (const engine of PEOPLE_ENGINES) {
          allPromises.push(
            (async () => {
              try {
                const result = await queryPeopleEngine(engine, q.text, config);
                const parsed = await parseTrackAResponse(result.rawText, session.name, profile);
                const identityMatch = resolveIdentity(result.rawText, profile, parsed.targetFound);

                await saveQueryResult({
                  sessionId, track: "A", queryIndex: q.index, round,
                  queryText: q.text, engine,
                  rawResponse: result.rawText,
                  identityMatch,
                  statedFacts: parsed.statedFacts,
                  citedUrls: result.citedUrls,
                  targetRank: null,
                  targetFound: parsed.targetFound,
                  nameLandscape: [],
                  error: result.error,
                });

                await logCost(sessionId, engine, modelForEngine(engine), result.inputTokens, result.outputTokens);
              } catch (err) {
                console.error(`[people/runner] Track A q${q.index} r${round} ${engine}:`, err);
                await saveQueryResult({
                  sessionId, track: "A", queryIndex: q.index, round,
                  queryText: q.text, engine,
                  rawResponse: "", identityMatch: "absent", statedFacts: [],
                  citedUrls: [], targetRank: null, targetFound: false,
                  nameLandscape: [], error: String(err),
                });
              }
            })()
          );
        }
      }

      for (const q of trackBQueries) {
        for (const engine of PEOPLE_ENGINES) {
          allPromises.push(
            (async () => {
              try {
                const result = await queryPeopleEngine(engine, q.text, config);
                const parsed = await parseTrackBResponse(result.rawText, session.name, q.type);
                const identityMatch = resolveIdentity(result.rawText, profile, parsed.targetFound);

                await saveQueryResult({
                  sessionId, track: "B", queryIndex: q.index, round,
                  queryText: q.text, engine,
                  rawResponse: result.rawText,
                  identityMatch,
                  statedFacts: [],
                  citedUrls: result.citedUrls,
                  targetRank: parsed.targetRank,
                  targetFound: parsed.targetFound,
                  nameLandscape: parsed.nameLandscape,
                  error: result.error,
                });

                await logCost(sessionId, engine, modelForEngine(engine), result.inputTokens, result.outputTokens);
              } catch (err) {
                console.error(`[people/runner] Track B q${q.index} r${round} ${engine}:`, err);
                await saveQueryResult({
                  sessionId, track: "B", queryIndex: q.index, round,
                  queryText: q.text, engine,
                  rawResponse: "", identityMatch: "absent", statedFacts: [],
                  citedUrls: [], targetRank: null, targetFound: false,
                  nameLandscape: [], error: String(err),
                });
              }
            })()
          );
        }
      }
    }

    await Promise.all(allPromises);

    const { rows: resultRows } = await pool.query(
      `SELECT * FROM people_query_results WHERE session_id = $1`,
      [sessionId]
    );

    const allCitedUrls = resultRows.flatMap((r: any) => (r.cited_urls as string[]) ?? []);
    const vertexResolved = await resolveGroundingUrls(allCitedUrls, 20);

    const trackAResults = resultRows.filter((r: any) => r.track === "A");
    const trackBResults = resultRows.filter((r: any) => r.track === "B");

    const scores = buildScores(trackAResults as any, trackBResults as any);
    const reportData = buildReportData(session.name, trackAResults, trackBResults, scores, vertexResolved);

    await pool.query(
      `INSERT INTO people_scores
        (session_id, recognition_score, recognition_grade, proof_score, proof_grade, diagnostic_text, report_data)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (session_id) DO UPDATE SET
        recognition_score=$2, recognition_grade=$3, proof_score=$4, proof_grade=$5,
        diagnostic_text=$6, report_data=$7`,
      [sessionId, scores.recognitionScore, scores.recognitionGrade,
       scores.proofScore, scores.proofGrade, scores.diagnosticText, JSON.stringify(reportData)]
    );

    await updateStatus(sessionId, "complete");
  } catch (err) {
    console.error("[people/runner] Fatal error:", err);
    await updateStatus(sessionId, "error", String(err)).catch(() => {});
  }
}

function buildReportData(
  name: string,
  trackAResults: any[],
  trackBResults: any[],
  scores: any,
  vertexResolved: Map<string, any>
): Record<string, any> {
  function resolveUrl(raw: string): string {
    const r = vertexResolved.get(raw);
    return r?.resolvedUrl ?? raw;
  }

  const SKIP_DOMAINS = new Set(["vertexaisearch.cloud.google.com", "google.com"]);

  const engineCards = PEOPLE_ENGINES.map((engine) => {
    const engineTrackA = trackAResults.filter((r) => r.engine === engine);
    const bestMatch =
      engineTrackA.find((r) => r.identity_match === "confirmed") ||
      engineTrackA.find((r) => r.identity_match === "partial") ||
      engineTrackA[0];
    const matchVotes = engineTrackA.map((r) => r.identity_match).filter(Boolean);
    const consensusMatch = majorityVote(matchVotes);
    return {
      engine,
      description: bestMatch?.raw_response?.slice(0, 500) ?? "",
      identityMatch: consensusMatch,
      statedFacts: bestMatch?.stated_facts ?? [],
      citedUrls: (bestMatch?.cited_urls ?? []).map(resolveUrl),
    };
  });

  const defaultRecognition = PEOPLE_ENGINES.map((engine) => {
    const rounds = trackBResults.filter((r) => r.engine === engine && r.query_index === 1);
    const bestRound = rounds.find((r) => r.target_found) ?? rounds[0];
    const foundVotes = rounds.map((r) => r.target_found);
    const foundConsensus = foundVotes.filter(Boolean).length > foundVotes.length / 2;
    return {
      engine,
      response: bestRound?.raw_response?.slice(0, 400) ?? "",
      identityMatch: majorityVote(rounds.map((r) => r.identity_match).filter(Boolean)),
      targetFound: foundConsensus,
    };
  });

  // Name landscape: normalize names, merge across engines, rank by prominence
  const personMap = new Map<string, { name: string; description: string; engines: string[]; ranks: number[] }>();
  const landscapeResults = trackBResults.filter((r) => r.query_index === 2);
  for (const r of landscapeResults) {
    const landscape = (r.name_landscape as any[]) ?? [];
    for (const person of landscape) {
      const normKey = (person.name ?? "")
        .toLowerCase()
        .replace(/\([^)]*\)/g, "")  // strip parentheticals
        .replace(/[^a-z0-9 ]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (!normKey) continue;
      if (!personMap.has(normKey)) {
        personMap.set(normKey, { name: person.name, description: person.description ?? "", engines: [r.engine], ranks: [person.rank ?? 99] });
      } else {
        const entry = personMap.get(normKey)!;
        if (!entry.engines.includes(r.engine)) entry.engines.push(r.engine);
        entry.ranks.push(person.rank ?? 99);
      }
    }
  }
  const nameLandscape = Array.from(personMap.values())
    .map((p) => {
      const avgRank = p.ranks.reduce((s, r) => s + r, 0) / p.ranks.length;
      const score = p.engines.length * 100 - avgRank;
      return { name: p.name, description: p.description, engines: p.engines, avgRank, score, engineCount: p.engines.length };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 15)
    .map((p, i) => ({ ...p, rank: i + 1 }));

  // Source graph: resolved URLs, skip tracker domains, more entries
  const allCitedUrls = [...trackAResults, ...trackBResults].flatMap(
    (r) => (r.cited_urls as string[]) ?? []
  );
  const domainCount: Record<string, { count: number; urls: string[] }> = {};
  for (const url of allCitedUrls) {
    try {
      const finalUrl = resolveUrl(url);
      const domain = new URL(finalUrl).hostname.replace(/^www\./, "");
      if (SKIP_DOMAINS.has(domain)) continue;
      if (!domainCount[domain]) domainCount[domain] = { count: 0, urls: [] };
      domainCount[domain].count++;
      if (!domainCount[domain].urls.includes(finalUrl)) {
        domainCount[domain].urls.push(finalUrl);
      }
    } catch {}
  }
  const sourceGraph = Object.entries(domainCount)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 25)
    .map(([domain, data]) => ({
      domain,
      citationCount: data.count,
      url: `https://${domain}`,
      urls: data.urls.slice(0, 10),
    }));

  // Per-query results: one entry per (track, promptIndex, engine) with resolved cited URLs
  const allResults = [...trackAResults, ...trackBResults];
  const promptKeys = Array.from(new Set(allResults.map((r) => `${r.track}-${r.query_index}`)));
  const queryResults = promptKeys
    .sort()
    .map((key) => {
      const [track, idxStr] = key.split("-");
      const promptIndex = parseInt(idxStr);
      const engines = PEOPLE_ENGINES.map((engine) => {
        const rounds = allResults.filter((r) => r.track === track && r.query_index === promptIndex && r.engine === engine);
        if (rounds.length === 0) return null;
        const best =
          rounds.find((r) => r.identity_match === "confirmed" || r.target_found) ||
          rounds.find((r) => r.identity_match === "partial") ||
          rounds[0];
        const resolvedUrls = ((best.cited_urls as string[]) ?? [])
          .map(resolveUrl)
          .filter((u) => {
            try { const d = new URL(u).hostname.replace(/^www\./, ""); return !SKIP_DOMAINS.has(d); } catch { return false; }
          });
        return {
          engine,
          response: best.raw_response?.slice(0, 600) ?? "",
          identityMatch: best.identity_match ?? null,
          targetFound: best.target_found ?? false,
          targetRank: best.target_rank ?? null,
          citedUrls: resolvedUrls,
        };
      }).filter(Boolean);
      return { track, promptIndex, engines };
    });

  const claimFacts = trackAResults
    .filter((r) => r.identity_match === "confirmed" || r.identity_match === "partial")
    .flatMap((r) => (r.stated_facts as any[]) ?? [])
    .reduce<Record<string, any>>((acc, fact) => {
      if (!acc[fact.fact]) acc[fact.fact] = { ...fact, count: 1 };
      else acc[fact.fact].count++;
      return acc;
    }, {});

  return {
    name,
    scores,
    engineCards,
    defaultRecognition,
    nameLandscape,
    sourceGraph,
    queryResults,
    claimFacts: Object.values(claimFacts),
  };
}

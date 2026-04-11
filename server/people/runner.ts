import { pool } from "../db";
import { buildTrackAQueries, buildTrackBQueries } from "./queries";
import { queryPeopleEngine, PEOPLE_ENGINES } from "./engines";
import { parseTrackAResponse, parseTrackBResponse } from "./parser";
import { resolveIdentity } from "./resolver";
import { buildScores } from "./scorer";

interface RunnerProfile {
  id: number;
  name: string;
  currentRole: string | null;
  currentCompany: string | null;
  pastCompanies: string[];
  roles: string[];
  education: string[];
  location: string | null;
  industry: string | null;
  selectedAnchors: { workplaces: string[]; roles: string[]; education: string[] } | null;
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
      (session_id, track, query_index, query_text, engine, raw_response, identity_match,
       stated_facts, cited_urls, target_rank, target_found, name_landscape, error)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [
      result.sessionId, result.track, result.queryIndex, result.queryText,
      result.engine, result.rawResponse, result.identityMatch,
      JSON.stringify(result.statedFacts), result.citedUrls,
      result.targetRank, result.targetFound, JSON.stringify(result.nameLandscape),
      result.error ?? null,
    ]
  );
}

export async function runPeopleAudit(sessionId: number): Promise<void> {
  try {
    await updateStatus(sessionId, "analyzing");

    const { rows } = await pool.query<RunnerProfile & { selected_anchors: any }>(
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

    const trackAQueries = buildTrackAQueries(session.name, anchors, session.industry);
    const trackBQueries = buildTrackBQueries(session.name, session.industry);

    const trackAPromises = trackAQueries.flatMap(q =>
      PEOPLE_ENGINES.map(async engine => {
        try {
          const result = await queryPeopleEngine(engine, q.text);
          const parsed = await parseTrackAResponse(result.rawText, session.name, profile);
          const identityMatch = resolveIdentity(result.rawText, profile, parsed.targetFound);

          await saveQueryResult({
            sessionId,
            track: "A",
            queryIndex: q.index,
            queryText: q.text,
            engine,
            rawResponse: result.rawText,
            identityMatch,
            statedFacts: parsed.statedFacts,
            citedUrls: result.citedUrls,
            targetRank: null,
            targetFound: parsed.targetFound,
            nameLandscape: [],
            error: result.error,
          });
        } catch (err) {
          console.error(`[people/runner] Track A q${q.index} ${engine} failed:`, err);
          await saveQueryResult({
            sessionId, track: "A", queryIndex: q.index, queryText: q.text, engine,
            rawResponse: "", identityMatch: "absent", statedFacts: [], citedUrls: [],
            targetRank: null, targetFound: false, nameLandscape: [], error: String(err),
          });
        }
      })
    );

    const trackBPromises = trackBQueries.flatMap(q =>
      PEOPLE_ENGINES.map(async engine => {
        try {
          const result = await queryPeopleEngine(engine, q.text);
          const parsed = await parseTrackBResponse(result.rawText, session.name, q.type);
          const identityMatch = resolveIdentity(result.rawText, profile, parsed.targetFound);

          await saveQueryResult({
            sessionId,
            track: "B",
            queryIndex: q.index,
            queryText: q.text,
            engine,
            rawResponse: result.rawText,
            identityMatch,
            statedFacts: [],
            citedUrls: result.citedUrls,
            targetRank: parsed.targetRank,
            targetFound: parsed.targetFound,
            nameLandscape: parsed.nameLandscape,
            error: result.error,
          });
        } catch (err) {
          console.error(`[people/runner] Track B q${q.index} ${engine} failed:`, err);
          await saveQueryResult({
            sessionId, track: "B", queryIndex: q.index, queryText: q.text, engine,
            rawResponse: "", identityMatch: "absent", statedFacts: [], citedUrls: [],
            targetRank: null, targetFound: false, nameLandscape: [], error: String(err),
          });
        }
      })
    );

    await Promise.all([...trackAPromises, ...trackBPromises]);

    const { rows: resultRows } = await pool.query(
      `SELECT * FROM people_query_results WHERE session_id = $1`,
      [sessionId]
    );

    const trackAResults = resultRows.filter((r: any) => r.track === "A");
    const trackBResults = resultRows.filter((r: any) => r.track === "B");

    const scores = buildScores(trackAResults as any, trackBResults as any);

    const reportData = buildReportData(session.name, trackAResults, trackBResults, scores);

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
    await updateStatus(sessionId, "error", String(err));
  }
}

function buildReportData(
  name: string,
  trackAResults: any[],
  trackBResults: any[],
  scores: any
): Record<string, any> {
  const engineCards = PEOPLE_ENGINES.map(engine => {
    const engineTrackA = trackAResults.filter(r => r.engine === engine);
    const bestMatch = engineTrackA.find(r => r.identity_match === "confirmed")
      || engineTrackA.find(r => r.identity_match === "partial")
      || engineTrackA[0];

    return {
      engine,
      description: bestMatch?.raw_response?.slice(0, 500) ?? "",
      identityMatch: bestMatch?.identity_match ?? "absent",
      statedFacts: bestMatch?.stated_facts ?? [],
      citedUrls: bestMatch?.cited_urls ?? [],
    };
  });

  const defaultRecognition = PEOPLE_ENGINES.map(engine => {
    const r = trackBResults.find(r => r.engine === engine && r.query_index === 1);
    return {
      engine,
      response: r?.raw_response?.slice(0, 400) ?? "",
      identityMatch: r?.identity_match ?? "absent",
      targetFound: r?.target_found ?? false,
    };
  });

  const allLandscapes: Map<string, any> = new Map();
  const landscapeResults = trackBResults.filter(r => r.query_index === 2);
  for (const r of landscapeResults) {
    const landscape = (r.name_landscape as any[]) ?? [];
    for (const person of landscape) {
      const key = person.name?.toLowerCase() ?? "";
      if (!allLandscapes.has(key)) {
        allLandscapes.set(key, { ...person, engines: [r.engine], targetRank: r.target_rank });
      } else {
        allLandscapes.get(key).engines.push(r.engine);
      }
    }
  }
  const nameLandscape = Array.from(allLandscapes.values())
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
    .slice(0, 10);

  const allCitedUrls = [...trackAResults, ...trackBResults]
    .flatMap(r => (r.cited_urls as string[]) ?? []);
  const domainCount: Record<string, number> = {};
  for (const url of allCitedUrls) {
    try {
      const domain = new URL(url).hostname.replace(/^www\./, "");
      domainCount[domain] = (domainCount[domain] ?? 0) + 1;
    } catch {}
  }
  const sourceGraph = Object.entries(domainCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([domain, count]) => ({ domain, citationCount: count, url: `https://${domain}` }));

  const claimFacts = trackAResults
    .filter(r => r.identity_match === "confirmed" || r.identity_match === "partial")
    .flatMap(r => (r.stated_facts as any[]) ?? [])
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
    claimFacts: Object.values(claimFacts),
  };
}

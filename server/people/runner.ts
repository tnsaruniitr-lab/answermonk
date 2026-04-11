import { pool } from "../db";
import { buildTrackAQueries, buildTrackBQueries } from "./queries";
import { queryPeopleEngine, PEOPLE_ENGINES } from "./engines";
import { parseTrackAResponse, parseTrackBResponse, synthesiseTrackAResponses } from "./parser";
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
      "gpt-5.2": 2.0,
      "gpt-4o": 2.5, "gpt-4o-mini": 0.15,
      "gpt-4.1": 2.0, "gpt-4.1-mini": 0.4, "gpt-4.1-nano": 0.1,
      "o3": 10.0, "o3-mini": 1.1, "o4-mini": 1.1,
      "gemini-3-flash-preview": 0.075,
      "gemini-2.5-flash": 0.075, "gemini-2.5-pro": 1.25,
      "gemini-2.0-flash": 0.1, "gemini-2.0-flash-lite": 0.075,
      "gemini-1.5-pro": 1.25, "gemini-1.5-flash": 0.075,
      "claude-opus-4-5": 15.0, "claude-sonnet-4-5": 3.0, "claude-haiku-4-5": 0.8,
      "claude-opus-4": 15.0, "claude-sonnet-4": 3.0, "claude-haiku-4": 0.8,
      "claude-3-7-sonnet-latest": 3.0, "claude-3-5-haiku-latest": 0.8,
    };
    const costPerOutputM: Record<string, number> = {
      "gpt-5.2": 8.0,
      "gpt-4o": 10.0, "gpt-4o-mini": 0.6,
      "gpt-4.1": 8.0, "gpt-4.1-mini": 1.6, "gpt-4.1-nano": 0.4,
      "o3": 40.0, "o3-mini": 4.4, "o4-mini": 4.4,
      "gemini-3-flash-preview": 0.3,
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

    // Clear any previous query results so re-runs don't accumulate duplicate rows
    await pool.query(`DELETE FROM people_query_results WHERE session_id = $1`, [sessionId]);

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

    // Merge crawled profile with user-selected anchors so resolveIdentity
    // has signals even when the crawl failed or returned no data
    const profile = {
      name: session.name,
      currentRole: session.current_role ?? (anchors.roles as string[])?.[0] ?? null,
      currentCompany: session.current_company ?? (anchors.workplaces as string[])?.[0] ?? null,
      pastCompanies: (session.past_companies ?? []).length > 0
        ? session.past_companies
        : ((anchors.workplaces as string[]) ?? []).slice(1),
      education: (session.education ?? []).length > 0
        ? session.education
        : (anchors.education as string[]) ?? [],
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
                const identityMatch = resolveIdentity(result.rawText, profile, parsed.targetFound, q.text, parsed.wrongPerson);

                // Append new profile fields as extra fact entries so they're stored
                // in the existing stated_facts column without a schema change.
                const extendedFacts = [
                  ...parsed.statedFacts,
                  ...(parsed.oneLiner ? [{ fact: "one_liner", value: parsed.oneLiner, sourceUrl: null, status: "stated" }] : []),
                  ...(parsed.keyAchievements.length ? [{ fact: "key_achievements", value: parsed.keyAchievements.join(" | "), sourceUrl: null, status: "stated" }] : []),
                  ...(parsed.greenFlags.length ? [{ fact: "green_flags", value: parsed.greenFlags.join(" | "), sourceUrl: null, status: "stated" }] : []),
                  ...(parsed.redFlags.length ? [{ fact: "red_flags", value: parsed.redFlags.join(" | "), sourceUrl: null, status: "stated" }] : []),
                ];
                await saveQueryResult({
                  sessionId, track: "A", queryIndex: q.index, round,
                  queryText: q.text, engine,
                  rawResponse: result.rawText,
                  identityMatch,
                  statedFacts: extendedFacts,
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
                const identityMatch = resolveIdentity(result.rawText, profile, parsed.targetFound, q.text);

                // For landscape queries: scan extracted entries for the target person using
                // anchor keywords. target_rank = their position in the list, null if absent.
                let targetRank = parsed.targetRank;
                let targetFound = parsed.targetFound;
                if (q.type === "landscape" && parsed.nameLandscape.length > 0) {
                  // Extract only "brand" words from anchors — specific proper nouns / uncommon terms.
                  // Generic words (senior, company, business, analyst, group...) are excluded to
                  // prevent false matches across unrelated descriptions.
                  const GENERIC_WORDS = new Set([
                    "senior", "junior", "associate", "business", "analyst", "company", "group",
                    "manager", "director", "officer", "executive", "president", "partner",
                    "general", "global", "chief", "head", "lead", "principal", "staff",
                    "international", "national", "services", "solutions", "consulting",
                    "technology", "technologies", "management", "professional", "university",
                    "school", "college", "institute", "bachelor", "master", "degree",
                    "finance", "economics", "accounting", "marketing", "operations",
                  ]);
                  const brandWords = [
                    profile.currentCompany,
                    ...(profile.pastCompanies ?? []),
                    ...(profile.education ?? []),
                  ]
                    .filter((s): s is string => Boolean(s) && s.length > 3)
                    .flatMap(s =>
                      s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
                        .filter(w => w.length > 3 && !GENERIC_WORDS.has(w))
                    );
                  // Also include full multi-word role as a phrase (not individual words)
                  const rolePhrase = profile.currentRole
                    ? profile.currentRole.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim()
                    : null;

                  const matchedEntry = parsed.nameLandscape.find((entry) => {
                    const entryText = `${entry.name} ${entry.description}`.toLowerCase();
                    // Match on specific brand words (company/education brand names)
                    const brandMatch = brandWords.some(w => entryText.includes(w));
                    // Or match on full role phrase (requires full phrase, not individual words)
                    const roleMatch = rolePhrase && rolePhrase.length > 8 && entryText.includes(rolePhrase);
                    return brandMatch || Boolean(roleMatch);
                  });

                  targetRank = matchedEntry?.rank ?? null;
                  targetFound = targetRank != null;
                }

                await saveQueryResult({
                  sessionId, track: "B", queryIndex: q.index, round,
                  queryText: q.text, engine,
                  rawResponse: result.rawText,
                  identityMatch,
                  statedFacts: [],
                  citedUrls: result.citedUrls,
                  targetRank,
                  targetFound,
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

    // Synthesis: one LLM call per engine across all Track A rounds in parallel.
    // Finds the intersection of consistent claims and computes a consistency score.
    const engineSynthesis: Record<string, any> = {};
    await Promise.all(
      PEOPLE_ENGINES.map(async (engine) => {
        const rawTexts = (trackAResults as any[])
          .filter((r) => r.engine === engine)
          .map((r) => r.raw_response as string)
          .filter(Boolean);
        if (rawTexts.length > 0) {
          try {
            engineSynthesis[engine] = await synthesiseTrackAResponses(rawTexts, session.name);
          } catch (e) {
            console.error(`[runner] synthesis failed for ${engine}:`, e);
          }
        }
      })
    );

    const scores = buildScores(trackAResults as any, trackBResults as any);
    const reportData = buildReportData(session.name, trackAResults, trackBResults, scores, vertexResolved, {
      currentCompany: profile.currentCompany ?? "",
      currentRole: profile.currentRole ?? "",
    }, engineSynthesis);

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

export async function recomputeScores(sessionId: number): Promise<void> {
  const { rows: sessionRows } = await pool.query<RunnerProfile>(
    `SELECT id, name, "current_role", current_company, past_companies, roles, education,
            location, industry, selected_anchors
     FROM people_sessions WHERE id = $1`,
    [sessionId]
  );
  if (sessionRows.length === 0) throw new Error("Session not found");
  const session = sessionRows[0];

  const { rows: resultRows } = await pool.query(
    `SELECT * FROM people_query_results WHERE session_id = $1`,
    [sessionId]
  );

  // Re-parse landscape raw responses so that any parser improvements (e.g. name
  // validation filtering Claude's sentence-fragment caveats) are applied without
  // needing to re-run the expensive AI queries.
  const { parseTrackBResponse, parseTrackAResponse } = await import("./parser");
  const { resolveIdentity: reResolve } = await import("./resolver");

  const anchorsForResolve = session.selected_anchors ?? {
    workplaces: [session.current_company].filter(Boolean),
    roles: [session.current_role].filter(Boolean),
    education: session.education ?? [],
  };
  const profileForResolve = {
    name: session.name,
    currentRole: session.current_role ?? (anchorsForResolve.roles as string[])?.[0] ?? null,
    currentCompany: session.current_company ?? (anchorsForResolve.workplaces as string[])?.[0] ?? null,
    pastCompanies: (session.past_companies ?? []).length > 0
      ? session.past_companies
      : ((anchorsForResolve.workplaces as string[]) ?? []).slice(1),
    education: (session.education ?? []).length > 0
      ? session.education
      : (anchorsForResolve.education as string[]) ?? [],
    location: session.location,
    industry: session.industry,
  };

  // Detect landscape index: old sessions use Track B index 2, new sessions use index 1.
  const recomputeLandscapeIdx = resultRows.some((r: any) => r.track === "B" && r.query_index === 2) ? 2 : 1;

  for (const row of resultRows) {
    if (row.track === "B" && row.query_index === recomputeLandscapeIdx && row.raw_response) {
      // Re-parse landscape rows
      const parsed = await parseTrackBResponse(row.raw_response, session.name, "landscape");
      row.name_landscape = parsed.nameLandscape;
      await pool.query(
        `UPDATE people_query_results SET name_landscape = $1 WHERE id = $2`,
        [JSON.stringify(parsed.nameLandscape), row.id]
      );
    } else if (row.track === "A" && row.raw_response) {
      // Re-parse Track A: refresh identity match AND update stated_facts with new profile fields
      // (one_liner, key_achievements, green_flags, red_flags) which may not exist in older rows.
      const parsedA = await parseTrackAResponse(row.raw_response, session.name, profileForResolve);
      const freshMatch = reResolve(row.raw_response, profileForResolve, parsedA.targetFound, row.query_text, parsedA.wrongPerson);
      row.identity_match = freshMatch;

      const extendedFacts = [
        ...parsedA.statedFacts,
        ...(parsedA.oneLiner ? [{ fact: "one_liner", value: parsedA.oneLiner, sourceUrl: null, status: "stated" }] : []),
        ...(parsedA.keyAchievements.length ? [{ fact: "key_achievements", value: parsedA.keyAchievements.join(" | "), sourceUrl: null, status: "stated" }] : []),
        ...(parsedA.greenFlags.length ? [{ fact: "green_flags", value: parsedA.greenFlags.join(" | "), sourceUrl: null, status: "stated" }] : []),
        ...(parsedA.redFlags.length ? [{ fact: "red_flags", value: parsedA.redFlags.join(" | "), sourceUrl: null, status: "stated" }] : []),
      ];
      row.stated_facts = extendedFacts;

      await pool.query(
        `UPDATE people_query_results SET identity_match = $1, stated_facts = $2 WHERE id = $3`,
        [freshMatch, JSON.stringify(extendedFacts), row.id]
      );
    }
  }

  const allCitedUrls = resultRows.flatMap((r: any) => (r.cited_urls as string[]) ?? []);
  const vertexResolved = await resolveGroundingUrls(allCitedUrls, 20);

  const trackAResults = resultRows.filter((r: any) => r.track === "A");
  const trackBResults = resultRows.filter((r: any) => r.track === "B");

  // Re-synthesise: regenerate intersection-based profiles with updated stated_facts
  const engineSynthesis: Record<string, any> = {};
  await Promise.all(
    PEOPLE_ENGINES.map(async (engine) => {
      const rawTexts = (trackAResults as any[])
        .filter((r) => r.engine === engine)
        .map((r) => r.raw_response as string)
        .filter(Boolean);
      if (rawTexts.length > 0) {
        try {
          engineSynthesis[engine] = await synthesiseTrackAResponses(rawTexts, session.name);
        } catch (e) {
          console.error(`[runner] recompute synthesis failed for ${engine}:`, e);
        }
      }
    })
  );

  const anchors = session.selected_anchors ?? {
    workplaces: [session.current_company].filter(Boolean),
    roles: [session.current_role].filter(Boolean),
    education: session.education ?? [],
  };
  const profile = {
    currentRole: session.current_role ?? (anchors.roles as string[])?.[0] ?? null,
    currentCompany: session.current_company ?? (anchors.workplaces as string[])?.[0] ?? null,
  };

  const scores = buildScores(trackAResults as any, trackBResults as any);
  const reportData = buildReportData(session.name, trackAResults, trackBResults, scores, vertexResolved, {
    currentCompany: profile.currentCompany ?? "",
    currentRole: profile.currentRole ?? "",
  }, engineSynthesis);

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
}

function buildReportData(
  name: string,
  trackAResults: any[],
  trackBResults: any[],
  scores: any,
  vertexResolved: Map<string, any>,
  identityAnchors: { currentCompany: string; currentRole: string } = { currentCompany: "", currentRole: "" },
  engineSynthesis: Record<string, any> = {}
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

    // Merge stated_facts from ALL rounds — for each fact key, pick the longest/richest value.
    // This ensures profile fields (one_liner, key_achievements, green_flags, red_flags)
    // are populated even if they came from a different round than the "best" identity match.
    const allFacts: any[] = engineTrackA.flatMap((r) => (r.stated_facts as any[]) ?? []);
    const factMap = new Map<string, any>();
    for (const fact of allFacts) {
      if (!fact?.fact) continue;
      const key = fact.fact as string;
      const existing = factMap.get(key);
      // Keep the entry with the longest value (most detail) across all rounds
      if (!existing || (fact.value ?? "").length > (existing.value ?? "").length) {
        factMap.set(key, fact);
      }
    }
    const mergedFacts = Array.from(factMap.values());

    // All cited URLs across every round for this engine (de-duped)
    const allRoundUrls = [...new Set(
      engineTrackA.flatMap((r) => (r.cited_urls as string[]) ?? [])
    )].map(resolveUrl).filter(Boolean);

    // Per-round raw data so the report can show prompts + responses verbatim
    const rounds = engineTrackA
      .sort((a, b) => (a.round ?? 0) - (b.round ?? 0))
      .map((r) => ({
        round: r.round ?? 0,
        promptText: r.query_text ?? "",
        rawResponse: r.raw_response ?? "",
        identityMatch: r.identity_match ?? "absent",
      }));

    return {
      engine,
      description: bestMatch?.raw_response?.slice(0, 500) ?? "",
      identityMatch: consensusMatch,
      statedFacts: mergedFacts,
      citedUrls: allRoundUrls,
      synthesis: engineSynthesis[engine] ?? null,
      rounds,
    };
  });

  // defaultRecognition removed — Track B is now landscape-only; kept as empty array for
  // backward compat with any existing report_data consumers.
  const defaultRecognition: any[] = [];

  // Keyword sets used to disambiguate people with identical base names.
  // ORDER MATTERS — more specific categories must come before broader ones.
  const PERSON_DISAMBIGUATORS: { key: string; words: string[] }[] = [
    // Named individuals (catch before generic categories)
    { key: "politics",   words: ["jill stein", "green party", "presidential candidate", "senator", "politician"] },
    // Sports — check athlete-specific subtypes first
    { key: "nhl",        words: ["nhl", "hockey", "fan research", "sports analytics"] },
    { key: "sports",     words: ["wrestler", "wrestling", "gettysburg", "collegiate", "ncaa", "division iii", "college athlete"] },
    { key: "athlete",    words: ["footballer", "decathlete", "football", "afl", "gws", "track and field", "olympic", "commonwealth games", "world athletics", "decathlon", "octathlon", "rugby", "cricket", "swimming", "player profile"] },
    // Tech — catch before generic "media" matches
    { key: "tech",       words: ["entrepreneur", "founder", "startup", "ceo", "software", "stitch", "rjmetrics", "common paper", "commonpaper", "venture", "saas", "b2b"] },
    // Media — separate gaming from film/photo so "video game producer" ≠ "film producer"
    { key: "gaming",     words: ["video game", "game producer", "game designer", "game studio", "gaming", "metacritic game"] },
    { key: "film",       words: ["film", "filmmaker", "movie", "imdb", "director", "documentary", "television", "photographer", "cinematographer", "metacritic"] },
    // Academia
    { key: "academic",   words: ["oxford", "phd", "msc student", "internet institute", "professor", "academic", "university researcher", "human-centred ai"] },
    // Medicine / law / finance / real-estate
    { key: "legal",      words: ["lawyer", "attorney", "judge", "watergate", "counsel", "litigator", "d.c. bar"] },
    { key: "medicine",   words: ["oncologist", "physician", "medical", "clinical", "hospital", "lineberger", "mph"] },
    { key: "finance",    words: ["investor", "investment", "private equity", "hedge fund", "capital", "thrive"] },
    { key: "realestate", words: ["real estate", "property", "commercial real", "residential"] },
    // Catch-all for historical / genealogical / social-media entries
    { key: "historical", words: ["born 1901", "ukraine", "genealog", "ancestry", "historical record", "family tree"] },
    { key: "social",     words: ["instagram", "hoax", "persona", "fictional", "prank", "fake student", "student hoax"] },
  ];

  function getPersonKey(personName: string, description: string): string {
    const base = personName
      .toLowerCase()
      .replace(/\([^)]*\)/g, "")   // strip parentheticals from name
      .replace(/[^a-z0-9 ]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      // Strip honorific prefixes so "Dr. Jake Stein" == "Jake Stein"
      .replace(/^(dr|prof|mr|ms|mrs|sir|rev|hon)\s+/, "")
      // Strip single-letter middle initials like "Jacob A Stein" → "Jacob Stein"
      // so "Jacob A. Stein" and "Jacob Stein" merge correctly
      .replace(/\b([a-z])\s+(?=[a-z]{2})/g, "")
      .replace(/\s+/g, " ")
      .trim();
    // Search both the parenthetical content and the description for discriminators
    const parenContent = (personName.match(/\(([^)]+)\)/g) ?? []).join(" ");
    const searchText = (parenContent + " " + description).toLowerCase();
    for (const { key, words } of PERSON_DISAMBIGUATORS) {
      if (words.some(w => searchText.includes(w))) return `${base}__${key}`;
    }
    // No category matched — use the first 3 significant words of the parenthetical as the
    // key so that genuinely distinct uncategorized people don't collapse into one entry.
    const parenWords = parenContent
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 3)
      .join("-");
    if (parenWords) return `${base}__${parenWords}`;
    return base;
  }

  // Detect whether this is an old session (landscape at Track B index 2) or
  // new session (landscape at Track B index 1 — only one Track B prompt).
  const landscapeIdx = trackBResults.some((r: any) => r.query_index === 2) ? 2 : 1;

  // Name landscape: normalize names, merge across engines, rank by prominence
  const personMap = new Map<string, { name: string; description: string; engines: string[]; ranks: number[]; engineRanks: Record<string, number>; isTargetCount: number }>();
  const landscapeResults = trackBResults.filter((r) => r.query_index === landscapeIdx);
  for (const r of landscapeResults) {
    const landscape = (r.name_landscape as any[]) ?? [];
    for (const person of landscape) {
      const normKey = getPersonKey(person.name ?? "", person.description ?? "");
      if (!normKey) continue;
      // Flag as the audited person if: (a) engine's target_rank matches rank (precise),
      // or (b) description mentions their company/role as a heuristic fallback
      const descLower = (person.description ?? "").toLowerCase();
      const { currentCompany, currentRole } = identityAnchors;
      const companyMatch = currentCompany.length > 3 && descLower.includes(currentCompany.toLowerCase());
      const roleMatch = currentRole.length > 3 && descLower.includes(currentRole.toLowerCase());
      const isThisPersonTarget =
        (r.target_rank != null && r.target_rank === (person.rank ?? null)) ||
        Boolean(companyMatch) || Boolean(roleMatch);
      if (!personMap.has(normKey)) {
        personMap.set(normKey, {
          name: person.name,
          description: person.description ?? "",
          engines: [r.engine],
          ranks: [person.rank ?? 99],
          engineRanks: { [r.engine]: person.rank ?? 99 },
          isTargetCount: isThisPersonTarget ? 1 : 0,
        });
      } else {
        const entry = personMap.get(normKey)!;
        if (!entry.engines.includes(r.engine)) entry.engines.push(r.engine);
        entry.ranks.push(person.rank ?? 99);
        entry.engineRanks[r.engine] = person.rank ?? 99;
        if (isThisPersonTarget) entry.isTargetCount++;
      }
    }
  }
  const TOTAL_ENGINES = 3;
  const nameLandscape = Array.from(personMap.values())
    .map((p) => {
      const avgRank = p.ranks.reduce((s, r) => s + r, 0) / p.ranks.length;
      const score = p.engines.length * 100 - avgRank;
      const appearancePct = Math.round((p.engines.length / TOTAL_ENGINES) * 100);
      const isTarget = p.isTargetCount > 0;
      return { name: p.name, description: p.description, engines: p.engines, avgRank, score, engineCount: p.engines.length, appearancePct, engineRanks: p.engineRanks, isTarget };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((p, i) => ({ ...p, rank: i + 1 }));

  // Per-engine landscape: each engine's own independent ranked list, sorted by that
  // engine's own average rank across rounds. Independent of the combined list.
  const perEngineLandscape: Record<string, any[]> = {};
  for (const engine of PEOPLE_ENGINES) {
    const engineRows = landscapeResults.filter((r) => r.engine === engine);
    const engMap = new Map<string, { name: string; description: string; ranks: number[]; isTargetCount: number }>();
    for (const r of engineRows) {
      const landscape = (r.name_landscape as any[]) ?? [];
      for (const person of landscape) {
        const normKey = getPersonKey(person.name ?? "", person.description ?? "");
        if (!normKey) continue;
        const descLower = (person.description ?? "").toLowerCase();
        const { currentCompany, currentRole } = identityAnchors;
        const companyMatch = currentCompany.length > 3 && descLower.includes(currentCompany.toLowerCase());
        const roleMatch = currentRole.length > 3 && descLower.includes(currentRole.toLowerCase());
        const isThisPersonTarget =
          (r.target_rank != null && r.target_rank === (person.rank ?? null)) ||
          Boolean(companyMatch) || Boolean(roleMatch);
        if (!engMap.has(normKey)) {
          engMap.set(normKey, { name: person.name, description: person.description ?? "", ranks: [person.rank ?? 99], isTargetCount: isThisPersonTarget ? 1 : 0 });
        } else {
          const entry = engMap.get(normKey)!;
          entry.ranks.push(person.rank ?? 99);
          if (isThisPersonTarget) entry.isTargetCount++;
        }
      }
    }
    perEngineLandscape[engine] = Array.from(engMap.values())
      .map((p) => ({
        name: p.name,
        description: p.description,
        avgRank: p.ranks.reduce((s, r) => s + r, 0) / p.ranks.length,
        isTarget: p.isTargetCount > 0,
      }))
      .sort((a, b) => a.avgRank - b.avgRank)
      .slice(0, 10)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  }

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

  // Per-engine query results: 3 sections per engine (Track A, Track B recognition, Track B landscape)
  function resolveAndFilter(urls: string[]): string[] {
    return urls.map(resolveUrl).filter((u) => {
      try { const d = new URL(u).hostname.replace(/^www\./, ""); return !SKIP_DOMAINS.has(d); } catch { return false; }
    });
  }

  const perEngineQueryResults = PEOPLE_ENGINES.map((engine) => {
    // Track A: all prompt indices
    const trackAIndices = Array.from(new Set(trackAResults.map((r: any) => r.query_index as number))).sort((a, b) => a - b);
    const trackA = trackAIndices.map((qi) => {
      const rounds = trackAResults.filter((r: any) => r.engine === engine && r.query_index === qi);
      if (rounds.length === 0) return null;
      const foundCount = rounds.filter((r: any) => r.identity_match === "confirmed" || r.identity_match === "partial").length;
      const best = rounds.find((r: any) => r.identity_match === "confirmed") || rounds.find((r: any) => r.identity_match === "partial") || rounds[0];
      // Aggregate URLs across ALL rounds for this prompt+engine (not just best round)
      const allRoundUrls = [...new Set(rounds.flatMap((r: any) => (r.cited_urls as string[]) ?? []))];
      return {
        promptIndex: qi,
        promptText: best?.query_text ?? "",
        totalRounds: rounds.length,
        foundCount,
        appearanceRate: rounds.length > 0 ? Math.round((foundCount / rounds.length) * 100) : 0,
        identityMatch: majorityVote(rounds.map((r: any) => r.identity_match).filter(Boolean)),
        bestResponse: best?.raw_response ?? "",
        statedFacts: (best?.stated_facts as any[]) ?? [],
        citedUrls: resolveAndFilter(allRoundUrls),
      };
    }).filter(Boolean);

    // Track B landscape: detect index for old (2) vs new (1) sessions
    const landscapeRounds = trackBResults.filter((r: any) => r.engine === engine && r.query_index === landscapeIdx);
    const trackBLandscape = landscapeRounds.length > 0 ? (() => {
      const foundCount = landscapeRounds.filter((r: any) => r.target_found).length;
      const ranks = landscapeRounds.filter((r: any) => r.target_rank != null && r.target_rank > 0).map((r: any) => r.target_rank as number);
      const best = landscapeRounds.find((r: any) => r.target_found) || landscapeRounds[0];
      const allRoundUrls = [...new Set(landscapeRounds.flatMap((r: any) => (r.cited_urls as string[]) ?? []))];
      return {
        promptText: best?.query_text ?? "",
        totalRounds: landscapeRounds.length,
        foundCount,
        appearanceRate: Math.round((foundCount / landscapeRounds.length) * 100),
        avgRank: ranks.length > 0 ? Math.round(ranks.reduce((a: number, b: number) => a + b, 0) / ranks.length) : null,
        bestResponse: best?.raw_response ?? "",
        citedUrls: resolveAndFilter(allRoundUrls),
      };
    })() : null;

    return { engine, trackA, trackBLandscape };
  });

  const claimFacts = trackAResults
    .filter((r) => r.identity_match === "confirmed" || r.identity_match === "partial")
    .flatMap((r) => (r.stated_facts as any[]) ?? [])
    .reduce<Record<string, any>>((acc, fact) => {
      if (!acc[fact.fact]) acc[fact.fact] = { ...fact, count: 1 };
      else acc[fact.fact].count++;
      return acc;
    }, {});

  // Aggregate AI profile fields from confirmed/partial Track A responses.
  // These are stored as extra entries in stated_facts (see runner Track A save logic).
  const confirmedTrackA = trackAResults.filter((r) =>
    r.identity_match === "confirmed" || r.identity_match === "partial"
  );
  function pickBestFactValue(factName: string): string {
    const vals = confirmedTrackA
      .flatMap((r) => (r.stated_facts as any[]) ?? [])
      .filter((f) => f.fact === factName && f.value && f.status === "stated")
      .map((f) => f.value as string);
    // Return the longest value (most detailed) from confirmed responses
    return vals.sort((a, b) => b.length - a.length)[0] ?? "";
  }
  function collectFactValues(factName: string): string[] {
    const raw = pickBestFactValue(factName);
    if (!raw) return [];
    return raw.split(" | ").map((s) => s.trim()).filter(Boolean);
  }
  const aiProfile = {
    oneLiner: pickBestFactValue("one_liner"),
    keyAchievements: collectFactValues("key_achievements"),
    greenFlags: collectFactValues("green_flags"),
    redFlags: collectFactValues("red_flags"),
  };

  return {
    name,
    scores,
    perEngineAppearance: scores.perEngineAppearance,
    engineCards,
    defaultRecognition,
    nameLandscape,
    perEngineLandscape,
    sourceGraph,
    perEngineQueryResults,
    claimFacts: Object.values(claimFacts),
    aiProfile,
  };
}

export type IdentityMatch = "confirmed" | "partial" | "wrong" | "absent";

interface ProfileSignals {
  name: string;
  currentRole?: string | null;
  currentCompany?: string | null;
  pastCompanies?: string[];
  education?: string[];
  location?: string | null;
  industry?: string | null;
}

function normalizeText(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}

// Requires ALL significant words (length > 2) to appear in the haystack.
// This prevents "Senior Business Analyst" from matching a response that mentions
// "Finance Transformation Analyst" simply because the word "analyst" appears.
function textContains(haystack: string, needle: string): boolean {
  if (!needle || needle.length < 2) return false;
  const h = normalizeText(haystack);
  const needleWords = normalizeText(needle).split(/\s+/).filter(w => w.length > 2);
  if (needleWords.length === 0) return false;
  return needleWords.every(w => h.includes(w));
}

export function resolveIdentity(
  rawResponse: string,
  profile: ProfileSignals,
  targetFound: boolean,
  queryText?: string          // the prompt we sent — signals found here don't count (echo protection)
): IdentityMatch {
  if (!targetFound || !rawResponse) return "absent";

  const text = rawResponse.toLowerCase();
  const query = (queryText ?? "").toLowerCase();

  // A signal only counts if it appears in the RESPONSE but was NOT already in our prompt.
  // This prevents Claude echoing "McKinsey & Company" from our own question from being
  // counted as independent confirmation.
  function freshSignal(value: string): boolean {
    if (!value || value.length < 2) return false;
    const inResponse = textContains(text, value);
    const inQuery = textContains(query, value);
    return inResponse && !inQuery;   // only credit if the AI introduced it independently
  }

  // "Corroborating" signals: things we would NOT have put in the prompt (past companies,
  // education, location) are always valid even if they appear in the query text, because
  // Track A prompts typically do NOT include them — so if they appear in the response the
  // AI independently supplied them.
  function corroboratingSignal(value: string): boolean {
    return textContains(text, value);
  }

  const signals: boolean[] = [];

  if (profile.currentCompany) signals.push(freshSignal(profile.currentCompany));
  if (profile.currentRole)    signals.push(freshSignal(profile.currentRole));

  // Past companies and education are harder to echo — count them without echo-protection
  if (profile.location)   signals.push(corroboratingSignal(profile.location));
  if (profile.education && profile.education.length > 0)
    signals.push(profile.education.some(e => corroboratingSignal(e)));
  if (profile.pastCompanies && profile.pastCompanies.length > 0)
    signals.push(profile.pastCompanies.some(c => corroboratingSignal(c)));

  // Count identity signals first — citations only amplify, they never bootstrap a match.
  // (ChatGPT with web search always returns URLs, so citations alone would create false
  // positives for any common name regardless of whether the right person was found.)
  const identitySignalCount = signals.filter(Boolean).length;

  // Citations boost confidence only when at least one real identity signal already matched.
  const hasCitations = /https?:\/\//.test(rawResponse);
  if (hasCitations && identitySignalCount > 0) signals.push(true);

  if (signals.length === 0) {
    return targetFound ? "partial" : "absent";
  }

  const matchCount = signals.filter(Boolean).length;
  const matchRatio = matchCount / signals.length;

  if (matchRatio >= 0.5 && matchCount >= 2) return "confirmed";
  if (matchRatio >= 0.25 || matchCount >= 1) return "partial";

  const nameWords = profile.name.toLowerCase().split(/\s+/);
  const allNamePartsPresent = nameWords.every(w => w.length > 1 && text.includes(w));
  if (allNamePartsPresent && matchCount === 0) return "wrong";

  return "partial";
}

export function scoreIdentityMatch(match: IdentityMatch): number {
  switch (match) {
    case "confirmed": return 1.0;
    case "partial": return 0.4;
    case "wrong": return 0.0;
    case "absent": return 0.0;
  }
}

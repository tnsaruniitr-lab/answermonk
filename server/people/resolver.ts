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
  queryText?: string,         // the prompt we sent — signals found here don't count (echo protection)
  wrongPerson?: boolean       // parser already determined this is a name-sharer
): IdentityMatch {
  if (!rawResponse) return "absent";

  // Parser already determined this response is about a DIFFERENT person with the same name.
  if (wrongPerson) return "wrong";

  // Parser determined the specific target was not found at all.
  if (!targetFound) return "absent";

  const text = rawResponse.toLowerCase();
  const query = (queryText ?? "").toLowerCase();

  // A signal only counts if it appears in the RESPONSE but was NOT already in our prompt.
  // This prevents echoing back identity_block content from our own prompt.
  function freshSignal(value: string): boolean {
    if (!value || value.length < 2) return false;
    const inResponse = textContains(text, value);
    const inQuery = textContains(query, value);
    return inResponse && !inQuery;   // only credit if the AI introduced it independently
  }

  // Corroborating signals use echo protection too now that ALL anchors are included
  // in the prompt identity_block. An AI that echoes the prompt should not get credit.
  function freshOrInResponse(value: string): boolean {
    if (!value || value.length < 2) return false;
    // If the value was in the prompt, only count it as a signal if the response also
    // provides it — the echo guard is relaxed for shorter values that are harder to fake.
    const inResponse = textContains(text, value);
    const inQuery = textContains(query, value);
    // For location (never in prompt), always count; for others use fresh rule.
    return inResponse && !inQuery;
  }

  const signals: boolean[] = [];

  if (profile.currentCompany) signals.push(freshSignal(profile.currentCompany));
  if (profile.currentRole)    signals.push(freshSignal(profile.currentRole));
  if (profile.location)       signals.push(textContains(text, profile.location)); // location never in prompt
  if (profile.education?.length)
    signals.push(profile.education.some(e => freshOrInResponse(e)));
  if (profile.pastCompanies?.length)
    signals.push(profile.pastCompanies.some(c => freshOrInResponse(c)));

  // Count identity signals first — citations only amplify, they never bootstrap a match.
  const identitySignalCount = signals.filter(Boolean).length;

  // Citations boost confidence only when at least one real identity signal already matched.
  const hasCitations = /https?:\/\//.test(rawResponse);
  if (hasCitations && identitySignalCount > 0) signals.push(true);

  // No anchors to verify against: we know targetFound=true (name appeared and parser
  // said it's the right person), but we have zero signals to corroborate. Give "partial"
  // only when the parser LLM explicitly said targetFound=true (it checked anchors itself).
  // This is a step up from the old "partial for any name mention" behaviour.
  if (signals.length === 0) {
    // If targetFound came from the anchor-aware parser, trust it — give "partial".
    // This only fires when no profile anchors exist at all (name-only audit).
    return "partial";
  }

  const matchCount = signals.filter(Boolean).length;
  const matchRatio = matchCount / signals.length;

  if (matchRatio >= 0.5 && matchCount >= 2) return "confirmed";
  if (matchRatio >= 0.25 || matchCount >= 1) return "partial";

  // Signals existed but NONE matched — the right name appears but no anchor lines up.
  // This is a name-sharer, not the target person.
  return "wrong";
}

export function scoreIdentityMatch(match: IdentityMatch): number {
  switch (match) {
    case "confirmed": return 1.0;
    case "partial": return 0.4;
    case "wrong": return 0.0;
    case "absent": return 0.0;
  }
}

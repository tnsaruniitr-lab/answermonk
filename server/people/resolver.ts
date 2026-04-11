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

function textContains(haystack: string, needle: string): boolean {
  if (!needle || needle.length < 2) return false;
  const h = normalizeText(haystack);
  const needleWords = normalizeText(needle).split(/\s+/).filter(w => w.length > 2);
  return needleWords.some(w => h.includes(w));
}

export function resolveIdentity(
  rawResponse: string,
  profile: ProfileSignals,
  targetFound: boolean
): IdentityMatch {
  if (!targetFound || !rawResponse) return "absent";

  const text = rawResponse.toLowerCase();

  const signals: boolean[] = [];

  if (profile.currentCompany) {
    signals.push(textContains(text, profile.currentCompany));
  }
  if (profile.currentRole) {
    signals.push(textContains(text, profile.currentRole));
  }
  if (profile.location) {
    signals.push(textContains(text, profile.location));
  }
  if (profile.education && profile.education.length > 0) {
    signals.push(profile.education.some(e => textContains(text, e)));
  }
  if (profile.pastCompanies && profile.pastCompanies.length > 0) {
    signals.push(profile.pastCompanies.some(c => textContains(text, c)));
  }

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

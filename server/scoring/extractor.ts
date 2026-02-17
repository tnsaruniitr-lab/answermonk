export interface ExtractedCandidate {
  name_raw: string;
  name_norm: string;
  domain: string | null;
  rank: number;
}

export interface ExtractionResult {
  candidates: ExtractedCandidate[];
  valid: boolean;
}

const LEGAL_SUFFIXES = /\b(inc|llc|ltd|gmbh|co|company|corp|corporation|plc|sa|ag|bv|nv|pty|pte)\.?\s*$/i;

const DOMAIN_PATTERN = /\b([a-z0-9][-a-z0-9]*\.(?:com|io|ai|co|org|net|dev|app|xyz|me|us|uk|ca|de|fr|in|ae|sg))\b/i;

const LIST_PATTERNS = [
  /^\s*(\d+)[\.\)]\s*\*{1,2}([^*]+)\*{1,2}/,
  /^\s*(\d+)[\.\)]\s*\[([^\]]+)\]/,
  /^\s*(\d+)[\.\)]\s*([A-Z][A-Za-z0-9\s\.&'\/]+?)(?:\s*[-–—:]\s|$)/,
  /^\s*[-•]\s*\*{1,2}([^*]+)\*{1,2}/,
  /^\s*[-•]\s*([A-Z][A-Za-z0-9\s\.&'\/]+?)(?:\s*[-–—:]\s|$)/,
  /^\s*(\d+)[\.\)]\s+([A-Z][A-Za-z0-9\s\.&'\/]+?)(?:\s*[-–—:(\[]|$)/,
];

const SEPARATOR_PATTERN = /\s*[-–—:|(\[]/;

export function extractCandidates(rawText: string): ExtractionResult {
  const lines = rawText.split("\n");
  const candidates: ExtractedCandidate[] = [];
  let rank = 0;

  for (const line of lines) {
    if (candidates.length >= 10) break;

    const trimmed = line.trim();
    if (!trimmed) continue;

    let nameRaw: string | null = null;

    for (const pattern of LIST_PATTERNS) {
      const match = trimmed.match(pattern);
      if (match) {
        const groups = match.slice(1);
        nameRaw = groups.length > 1 ? groups[groups.length - 1] : groups[0];
        break;
      }
    }

    if (!nameRaw) continue;

    nameRaw = cleanCandidateName(nameRaw);

    if (!nameRaw || nameRaw.length < 2 || nameRaw.length > 80) continue;

    if (isGenericPhrase(nameRaw)) continue;

    rank++;

    const domain = extractDomain(nameRaw) || extractDomain(line);
    const nameNorm = normalizeName(nameRaw);

    candidates.push({
      name_raw: nameRaw,
      name_norm: nameNorm,
      domain,
      rank,
    });
  }

  return {
    candidates,
    valid: candidates.length >= 2,
  };
}

function cleanCandidateName(raw: string): string {
  let name = raw.trim();

  name = name.replace(/\*+/g, "");
  name = name.replace(/^\[|\]$/g, "");
  name = name.replace(/#/g, "");

  const sepMatch = name.match(SEPARATOR_PATTERN);
  if (sepMatch && sepMatch.index && sepMatch.index > 1) {
    name = name.substring(0, sepMatch.index);
  }

  name = name.replace(/\(.*?\)/g, "").trim();

  name = name.replace(/\s+/g, " ").trim();

  if (name.endsWith(",") || name.endsWith(".") || name.endsWith(":")) {
    name = name.slice(0, -1).trim();
  }

  return name;
}

export function normalizeName(raw: string): string {
  let norm = raw.toLowerCase().trim();
  norm = norm.replace(/[^\w\s.]/g, "");
  norm = norm.replace(LEGAL_SUFFIXES, "").trim();
  norm = norm.replace(/\s+/g, " ");
  return norm;
}

function extractDomain(text: string): string | null {
  const match = text.match(DOMAIN_PATTERN);
  if (!match) return null;
  return match[1].toLowerCase();
}

export function getDomainRoot(domain: string): string {
  return domain.split(".")[0].toLowerCase();
}

function isGenericPhrase(name: string): boolean {
  const lower = name.toLowerCase();
  const genericPhrases = [
    "here are", "the following", "top pick", "best option",
    "in conclusion", "summary", "note that", "keep in mind",
    "disclaimer", "overall", "honorable mention",
  ];
  return genericPhrases.some((phrase) => lower.startsWith(phrase));
}

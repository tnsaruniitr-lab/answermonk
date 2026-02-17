import { normalizeName, getDomainRoot, type ExtractedCandidate } from "./extractor";

export interface BrandIdentity {
  name: string;
  name_norm: string;
  name_tokens: string[];
  domain: string | null;
  domain_root: string | null;
}

export interface MatchResult {
  brand_found: boolean;
  brand_rank: number | null;
  match_tier: "exact" | "domain" | null;
}

export interface CompetitorEntry {
  name_raw: string;
  name_norm: string;
  rank: number;
}

export interface RunMatchResult {
  brand: MatchResult;
  competitors: CompetitorEntry[];
}

const COMMON_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "have", "been",
  "your", "more", "best", "top", "good", "great", "nice", "well",
  "all", "new", "free", "easy", "fast", "deep", "high", "low",
  "big", "pro", "max", "one", "two", "out", "get", "set", "run",
  "app", "web", "api", "data", "lead", "sales", "tool",
]);

export function buildBrandIdentity(brandName: string, brandDomain?: string | null): BrandIdentity {
  const nameNorm = normalizeName(brandName);
  const nameTokens = nameNorm.split(/\s+/).filter(Boolean);

  let domain: string | null = null;
  let domainRoot: string | null = null;

  if (brandDomain) {
    domain = brandDomain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "");
    domainRoot = getDomainRoot(domain);
  }

  return {
    name: brandName,
    name_norm: nameNorm,
    name_tokens: nameTokens,
    domain,
    domain_root: domainRoot,
  };
}

export function matchRun(
  candidates: ExtractedCandidate[],
  brand: BrandIdentity,
): RunMatchResult {
  let brandFound = false;
  let brandRank: number | null = null;
  let matchTier: "exact" | "domain" | null = null;
  const competitors: CompetitorEntry[] = [];

  for (const candidate of candidates) {
    const tier = matchCandidate(candidate, brand);

    if (tier && !brandFound) {
      brandFound = true;
      brandRank = candidate.rank;
      matchTier = tier;
    } else {
      competitors.push({
        name_raw: candidate.name_raw,
        name_norm: candidate.name_norm,
        rank: candidate.rank,
      });
    }
  }

  return {
    brand: {
      brand_found: brandFound,
      brand_rank: brandRank,
      match_tier: matchTier,
    },
    competitors,
  };
}

function matchCandidate(
  candidate: ExtractedCandidate,
  brand: BrandIdentity,
): "exact" | "domain" | null {
  if (candidate.name_norm === brand.name_norm) {
    return "exact";
  }

  if (brand.name_tokens.length >= 2) {
    const candidateTokens = candidate.name_norm.split(/\s+/);
    if (
      brand.name_tokens.every((token) => candidateTokens.includes(token)) &&
      candidateTokens.length <= brand.name_tokens.length + 2
    ) {
      return "exact";
    }

    if (candidate.name_norm.includes(brand.name_norm)) {
      return "exact";
    }
  }

  if (brand.name_tokens.length === 1) {
    const singleToken = brand.name_tokens[0];
    const candidateTokens = candidate.name_norm.split(/\s+/);

    if (candidateTokens.length === 1 && candidateTokens[0] === singleToken) {
      return "exact";
    }

    if (candidateTokens.length > 1) {
      return null;
    }
  }

  if (brand.domain_root && candidate.domain) {
    const candidateDomainRoot = getDomainRoot(candidate.domain);
    if (candidateDomainRoot === brand.domain_root) {
      return "domain";
    }
  }

  if (brand.domain_root && brand.domain_root.length >= 4) {
    const candidateTokens = candidate.name_norm.split(/\s+/);
    if (
      candidateTokens.length === 1 &&
      candidateTokens[0] === brand.domain_root &&
      !COMMON_WORDS.has(brand.domain_root)
    ) {
      return "domain";
    }
  }

  return null;
}

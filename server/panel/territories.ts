export interface WeightedKeyword {
  phrase: string;
  weight: 1 | 2 | 3;
}

export interface Territory {
  id: string;
  label: string;
  categoryPhrase: string;
  taskPhrases: [string, string];
  keywords: WeightedKeyword[];
}

export interface TerritoryScore {
  territory: Territory;
  score: number;
  matchedKeywords: { phrase: string; weight: number; count: number }[];
}

const SYNONYM_MAP: Record<string, string> = {
  "paid ads": "paid media",
  "paid advertising": "paid media",
  "google ads": "paid search",
  "meta ads": "paid social",
  "facebook ads": "paid social",
  "social media management": "social media",
  "website development": "web development",
  "online store": "ecommerce",
  "e-commerce": "ecommerce",
  "leadgen": "lead gen",
  "lead generation": "lead gen",
  "seo": "search engine optimization",
  "sem": "paid search",
  "smm": "social media",
  "web dev": "web development",
  "email marketing": "email flows",
  "marketing tech": "martech",
  "ad campaigns": "ads",
  "search marketing": "paid search",
  "display ads": "paid media",
  "programmatic": "paid media",
};

export const TERRITORIES: Territory[] = [
  {
    id: "acquisition",
    label: "Acquisition",
    categoryPhrase: "performance marketing agencies",
    taskPhrases: ["generate leads online", "run paid advertising campaigns"],
    keywords: [
      { phrase: "paid search", weight: 3 },
      { phrase: "paid media", weight: 3 },
      { phrase: "paid social", weight: 3 },
      { phrase: "demand gen", weight: 3 },
      { phrase: "lead gen", weight: 3 },
      { phrase: "search engine optimization", weight: 3 },
      { phrase: "ppc", weight: 2 },
      { phrase: "ads", weight: 2 },
      { phrase: "performance", weight: 2 },
      { phrase: "growth", weight: 1 },
    ],
  },
  {
    id: "outsourced_marketing",
    label: "Outsourced Marketing",
    categoryPhrase: "full-service marketing agencies",
    taskPhrases: ["act as an outsourced marketing team", "handle all marketing activities"],
    keywords: [
      { phrase: "full service", weight: 3 },
      { phrase: "marketing partner", weight: 3 },
      { phrase: "360", weight: 2 },
      { phrase: "retainer", weight: 2 },
      { phrase: "outsourced", weight: 2 },
      { phrase: "ongoing", weight: 1 },
      { phrase: "integrated", weight: 1 },
    ],
  },
  {
    id: "branding",
    label: "Branding",
    categoryPhrase: "branding agencies",
    taskPhrases: ["create brand identity", "develop brand positioning and visual identity"],
    keywords: [
      { phrase: "brand strategy", weight: 3 },
      { phrase: "visual identity", weight: 3 },
      { phrase: "brand design", weight: 3 },
      { phrase: "identity", weight: 2 },
      { phrase: "logo", weight: 2 },
      { phrase: "positioning", weight: 2 },
      { phrase: "creative", weight: 1 },
    ],
  },
  {
    id: "social_content",
    label: "Social / Content",
    categoryPhrase: "social media marketing agencies",
    taskPhrases: ["manage social media presence", "create content and social media strategy"],
    keywords: [
      { phrase: "content marketing", weight: 3 },
      { phrase: "social media", weight: 3 },
      { phrase: "influencer", weight: 2 },
      { phrase: "tiktok", weight: 2 },
      { phrase: "content", weight: 1 },
      { phrase: "video", weight: 1 },
      { phrase: "blog", weight: 1 },
      { phrase: "community", weight: 1 },
    ],
  },
  {
    id: "web_presence",
    label: "Web Presence",
    categoryPhrase: "web design and development agencies",
    taskPhrases: ["build website and online presence", "design and develop website"],
    keywords: [
      { phrase: "web development", weight: 3 },
      { phrase: "web design", weight: 3 },
      { phrase: "ecommerce", weight: 2 },
      { phrase: "shopify", weight: 2 },
      { phrase: "wordpress", weight: 2 },
      { phrase: "ui/ux", weight: 2 },
      { phrase: "website", weight: 1 },
      { phrase: "landing page", weight: 1 },
    ],
  },
  {
    id: "marketing_ops",
    label: "Marketing Ops",
    categoryPhrase: "marketing automation agencies/consultants",
    taskPhrases: ["implement marketing automation", "set up CRM and automated workflows"],
    keywords: [
      { phrase: "marketing automation", weight: 3 },
      { phrase: "crm", weight: 2 },
      { phrase: "martech", weight: 2 },
      { phrase: "chatbot", weight: 2 },
      { phrase: "automation", weight: 1 },
      { phrase: "email flows", weight: 1 },
    ],
  },
  {
    id: "pr_reputation",
    label: "PR / Reputation",
    categoryPhrase: "PR agencies",
    taskPhrases: ["manage public relations", "handle media and press outreach"],
    keywords: [
      { phrase: "public relations", weight: 3 },
      { phrase: "reputation", weight: 2 },
      { phrase: "earned media", weight: 2 },
      { phrase: "press", weight: 1 },
      { phrase: "media", weight: 1 },
      { phrase: "communications", weight: 1 },
    ],
  },
];

const CONTROL_TRIGGERS = ["agency", "full service", "digital marketing", "advertising", "creative agency"];
const STRONG_CONTROL_PHRASES = ["full service", "360"];

function applySynonyms(text: string): string {
  let result = text.toLowerCase();
  const sortedKeys = Object.keys(SYNONYM_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    const regex = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    result = result.replace(regex, SYNONYM_MAP[key]);
  }
  return result;
}

function normalizeForMatching(text: string): string {
  let result = text.toLowerCase();
  result = result.replace(/[^\w\s\/]/g, " ");
  result = result.replace(/\s+/g, " ").trim();
  return result;
}

export function scoreTerritoriesWeighted(
  services: string[],
  positioningTerms: string[],
): TerritoryScore[] {
  const combinedRaw = [...services, ...positioningTerms].join(" ");
  const normalized = normalizeForMatching(applySynonyms(combinedRaw));

  const scores: TerritoryScore[] = TERRITORIES.map((territory) => {
    let totalScore = 0;
    const matchedKeywords: { phrase: string; weight: number; count: number }[] = [];
    const matchedPositions = new Set<number>();

    const sortedKeywords = [...territory.keywords].sort(
      (a, b) => b.phrase.length - a.phrase.length,
    );

    for (const kw of sortedKeywords) {
      const kwNorm = normalizeForMatching(applySynonyms(kw.phrase));
      const regex = new RegExp(`\\b${kwNorm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
      let match: RegExpExecArray | null;
      let count = 0;

      while ((match = regex.exec(normalized)) !== null) {
        let alreadyCovered = false;
        for (let i = match.index; i < match.index + match[0].length; i++) {
          if (matchedPositions.has(i)) {
            alreadyCovered = true;
            break;
          }
        }
        if (!alreadyCovered) {
          count++;
          for (let i = match.index; i < match.index + match[0].length; i++) {
            matchedPositions.add(i);
          }
        }
      }

      if (count > 0) {
        totalScore += kw.weight * count;
        matchedKeywords.push({ phrase: kw.phrase, weight: kw.weight, count });
      }
    }

    return { territory, score: totalScore, matchedKeywords };
  });

  return scores.sort((a, b) => b.score - a.score);
}

export function selectTopTerritories(
  services: string[],
  positioningTerms: string[],
): { selected: TerritoryScore[]; allScores: TerritoryScore[] } {
  const allScores = scoreTerritoriesWeighted(services, positioningTerms);
  const top3 = allScores.filter((s) => s.score > 0).slice(0, 3);

  const outsourcedInTop3 = top3.some((t) => t.territory.id === "outsourced_marketing");
  if (!outsourcedInTop3) {
    const combinedText = [...services, ...positioningTerms].join(" ").toLowerCase();
    const triggerHits = CONTROL_TRIGGERS.filter((t) => combinedText.includes(t));
    const hasStrongPhrase = STRONG_CONTROL_PHRASES.some((p) => combinedText.includes(p));

    if (triggerHits.length >= 2 || hasStrongPhrase) {
      const outsourcedScore = allScores.find((s) => s.territory.id === "outsourced_marketing");
      if (outsourcedScore) {
        top3.push(outsourcedScore);
      }
    }
  }

  return { selected: top3.slice(0, 4), allScores };
}

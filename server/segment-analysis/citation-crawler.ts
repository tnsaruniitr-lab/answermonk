import { crawlUrls, type CrawledPage, type CrawlProgress } from "../crawler";

export interface RawRunInput {
  prompt: string;
  engine: string;
  response: string;
  brands_found: string[];
  rank: number | null;
  citations?: { url: string; title?: string }[];
  cluster?: string;
}

export interface SegmentInput {
  id: string;
  persona?: string;
  seedType: string;
  customerType: string;
  location?: string;
  scoringResult?: {
    score: {
      appearance_rate: number;
      primary_rate: number;
      avg_rank: number | null;
      competitors: { name: string; share: number; appearances: number }[];
      engine_breakdown: Record<string, any>;
      cluster_breakdown: Record<string, any>;
      valid_runs: number;
      invalid_runs: number;
    };
    raw_runs?: RawRunInput[];
  };
}

export function extractCitationUrls(segments: SegmentInput[]): string[] {
  const urls: string[] = [];
  for (const seg of segments) {
    const runs = seg.scoringResult?.raw_runs || [];
    for (const run of runs) {
      if (run.citations) {
        for (const cit of run.citations) {
          if (cit.url && cit.url.startsWith("http")) {
            urls.push(cit.url);
          }
        }
      }
    }
  }
  return urls;
}

export function extractCitationUrlsPerSegment(segments: SegmentInput[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const seg of segments) {
    const urls: string[] = [];
    const runs = seg.scoringResult?.raw_runs || [];
    for (const run of runs) {
      if (run.citations) {
        for (const cit of run.citations) {
          if (cit.url && cit.url.startsWith("http")) {
            urls.push(cit.url);
          }
        }
      }
    }
    map.set(seg.id, urls);
  }
  return map;
}

export async function crawlCitations(
  segments: SegmentInput[],
  onProgress?: (progress: CrawlProgress) => void,
): Promise<CrawledPage[]> {
  const allUrls = extractCitationUrls(segments);
  if (allUrls.length === 0) return [];
  return crawlUrls(allUrls, onProgress, { stripRawHtml: true });
}

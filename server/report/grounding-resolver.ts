import { isAIInfraDomain } from "./tier-classifier";

interface ResolvedUrl {
  originalUrl: string;
  resolvedUrl: string;
  resolvedDomain: string;
}

const resolveCache = new Map<string, ResolvedUrl>();

async function resolveOneUrl(url: string, timeoutMs: number = 8000, maxHops: number = 5): Promise<ResolvedUrl> {
  if (resolveCache.has(url)) return resolveCache.get(url)!;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let currentUrl = url;

    for (let hop = 0; hop < maxHops; hop++) {
      const res = await fetch(currentUrl, {
        method: "HEAD",
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; GEO-Analyzer/1.0)" },
      });

      const status = res.status;
      if (status >= 300 && status < 400) {
        const location = res.headers.get("location");
        if (!location) break;

        let nextUrl: string;
        try {
          nextUrl = new URL(location, currentUrl).href;
        } catch {
          break;
        }

        const nextDomain = new URL(nextUrl).hostname.replace(/^www\./, "");
        if (!isAIInfraDomain(nextDomain)) {
          const result: ResolvedUrl = { originalUrl: url, resolvedUrl: nextUrl, resolvedDomain: nextDomain };
          resolveCache.set(url, result);
          return result;
        }

        currentUrl = nextUrl;
      } else {
        try {
          const finalDomain = new URL(currentUrl).hostname.replace(/^www\./, "");
          if (!isAIInfraDomain(finalDomain)) {
            const result: ResolvedUrl = { originalUrl: url, resolvedUrl: currentUrl, resolvedDomain: finalDomain };
            resolveCache.set(url, result);
            return result;
          }
        } catch { /* ignore */ }
        break;
      }
    }

    try {
      const getRes = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; GEO-Analyzer/1.0)" },
      });

      const finalUrl = getRes.url;
      if (finalUrl && finalUrl !== url) {
        const finalDomain = new URL(finalUrl).hostname.replace(/^www\./, "");
        if (!isAIInfraDomain(finalDomain)) {
          const result: ResolvedUrl = { originalUrl: url, resolvedUrl: finalUrl, resolvedDomain: finalDomain };
          resolveCache.set(url, result);
          return result;
        }
      }
    } catch { /* fallback failed */ }
  } catch { /* timeout or network error */ } finally {
    clearTimeout(timer);
  }

  const fallback: ResolvedUrl = { originalUrl: url, resolvedUrl: url, resolvedDomain: "" };
  resolveCache.set(url, fallback);
  return fallback;
}

export async function resolveGroundingUrls(urls: string[], concurrency: number = 10): Promise<Map<string, ResolvedUrl>> {
  const groundingUrls = urls.filter(u => {
    try {
      const domain = new URL(u).hostname.replace(/^www\./, "");
      return isAIInfraDomain(domain);
    } catch {
      return false;
    }
  });

  const uniqueUrls = [...new Set(groundingUrls)];
  const results = new Map<string, ResolvedUrl>();

  for (let i = 0; i < uniqueUrls.length; i += concurrency) {
    const batch = uniqueUrls.slice(i, i + concurrency);
    const resolved = await Promise.allSettled(batch.map(u => resolveOneUrl(u)));
    for (let j = 0; j < batch.length; j++) {
      const r = resolved[j];
      if (r.status === "fulfilled") {
        results.set(batch[j], r.value);
      }
    }
  }

  const resolvedCount = Array.from(results.values()).filter(r => r.resolvedDomain).length;
  const failedCount = results.size - resolvedCount;
  if (failedCount > 0) {
    console.warn(`[grounding-resolver] ${failedCount}/${results.size} URLs could not be resolved`);
  }

  return results;
}

export function collectAllCitationUrls(segments: Array<{ scoringResult?: { raw_runs?: Array<{ citations?: Array<{ url?: string }> }> } }>): string[] {
  const urls: string[] = [];
  for (const seg of segments) {
    const runs = seg.scoringResult?.raw_runs || [];
    for (const run of runs) {
      if (!run.citations) continue;
      for (const cit of run.citations) {
        if (cit.url) urls.push(cit.url);
      }
    }
  }
  return urls;
}

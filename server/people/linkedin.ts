export interface LinkedInProfile {
  name: string;
  headline: string | null;
  currentRole: string | null;
  currentCompany: string | null;
  pastCompanies: string[];
  roles: string[];
  education: string[];
  location: string | null;
  industry: string | null;
  crawlSuccess: boolean;
}

function extractLinkedInSlug(url: string): string | null {
  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    const parsed = new URL(normalized);
    const match = parsed.pathname.match(/\/in\/([^/]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function parseProfileFromHtml(html: string): Partial<LinkedInProfile> {
  const result: Partial<LinkedInProfile> = {};

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    const title = titleMatch[1].replace(" | LinkedIn", "").replace(" - LinkedIn", "").trim();
    if (title && !title.toLowerCase().includes("linkedin")) {
      result.name = title;
    }
  }

  const ogTitleMatch = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)
    || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:title"/i);
  if (ogTitleMatch && !result.name) {
    result.name = ogTitleMatch[1].replace(" | LinkedIn", "").trim();
  }

  const descMatch = html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i)
    || html.match(/<meta[^>]+content="([^"]+)"[^>]+name="description"/i);
  if (descMatch) {
    const desc = descMatch[1];
    const parts = desc.split(" · ");
    if (parts.length >= 2) {
      result.headline = parts[1]?.trim() || null;
    }
    const locationMatch = desc.match(/(?:based in|located in|·\s*)([A-Za-z\s,]+(?:UAE|UK|US|India|Dubai|London|Singapore|NYC|New York)[A-Za-z\s,]*)/i);
    if (locationMatch) {
      result.location = locationMatch[1].trim();
    }
  }

  const ogDescMatch = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i)
    || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:description"/i);
  if (ogDescMatch && !result.headline) {
    result.headline = ogDescMatch[1].trim();
  }

  return result;
}

export async function crawlLinkedInProfile(linkedinUrl: string): Promise<LinkedInProfile> {
  const slug = extractLinkedInSlug(linkedinUrl);

  const defaultProfile: LinkedInProfile = {
    name: "",
    headline: null,
    currentRole: null,
    currentCompany: null,
    pastCompanies: [],
    roles: [],
    education: [],
    location: null,
    industry: null,
    crawlSuccess: false,
  };

  if (!slug) return defaultProfile;

  const fetchUrl = `https://www.linkedin.com/in/${slug}`;

  try {
    const response = await fetch(fetchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(8000),
    });

    const html = await response.text();
    const parsed = parseProfileFromHtml(html);

    if (parsed.name) {
      return {
        ...defaultProfile,
        ...parsed,
        crawlSuccess: true,
      };
    }
  } catch (err) {
    console.error("[LinkedIn crawler] fetch failed:", err);
  }

  return defaultProfile;
}

export function buildAnchorGroups(profile: LinkedInProfile): {
  workplaces: string[];
  roles: string[];
  education: string[];
} {
  const workplaces = [
    ...(profile.currentCompany ? [profile.currentCompany] : []),
    ...profile.pastCompanies,
  ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

  const roles = [
    ...(profile.currentRole ? [profile.currentRole] : []),
    ...profile.roles,
  ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

  const education = [...profile.education].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

  return { workplaces, roles, education };
}

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export const ENTITY_TYPE_SEED_MAP: Record<string, string> = {
  healthcare_provider: "providers",
  clinic: "clinics",
  hospital: "hospitals",
  pharmacy: "pharmacies",
  saas_platform: "software",
  software: "software",
  platform: "platforms",
  marketplace: "platforms",
  agency: "agencies",
  consultancy: "consultancies",
  law_firm: "firms",
  accounting_firm: "firms",
  school: "schools",
  university: "institutions",
  training_provider: "providers",
  retailer: "retailers",
  store: "stores",
  provider: "providers",
  service_provider: "providers",
};

export function entityTypeToSeedType(entityType: string): string {
  return ENTITY_TYPE_SEED_MAP[entityType?.toLowerCase()] || "providers";
}

async function fetchPageHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "identity",
        "Cache-Control": "no-cache",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain") && !contentType.includes("application/xhtml")) {
      throw new Error(`Page returned non-HTML content (${contentType})`);
    }

    const text = await res.text();
    return text.slice(0, 150000);
  } finally {
    clearTimeout(timer);
  }
}

function extractSignalsFromHtml(html: string): string {
  const parts: string[] = [];

  const get = (pattern: RegExp) => {
    const m = html.match(pattern);
    return m ? m[1].trim() : null;
  };

  const title = get(/<title[^>]*>([^<]{1,200})<\/title>/i);
  if (title) parts.push(`Title: ${title}`);

  const metaDesc =
    get(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,400})["']/i) ||
    get(/<meta[^>]+content=["']([^"']{1,400})["'][^>]+name=["']description["']/i);
  if (metaDesc) parts.push(`Meta description: ${metaDesc}`);

  const ogTitle = get(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']{1,200})["']/i);
  if (ogTitle && ogTitle !== title) parts.push(`OG title: ${ogTitle}`);

  const ogDesc = get(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{1,400})["']/i);
  if (ogDesc && ogDesc !== metaDesc) parts.push(`OG description: ${ogDesc}`);

  const headings = [...html.matchAll(/<h[12][^>]*>([^<]{1,200})<\/h[12]>/gi)]
    .map((m) => m[1].replace(/<[^>]+>/g, "").trim())
    .filter(Boolean)
    .slice(0, 8);
  if (headings.length) parts.push(`Headings: ${headings.join(" | ")}`);

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    const bodyText = bodyMatch[1]
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 2000);
    if (bodyText.length > 100) parts.push(`Page content: ${bodyText}`);
  }

  return parts.join("\n\n");
}

export interface UrlAnalysisResult {
  business_name: string;
  brand_domain: string;
  entity_type: string;
  seed_type: string;
  services: string[];
  customer_types: string[];
  primary_location: string;
  locations: string[];
}

export async function analyzeUrl(url: string): Promise<UrlAnalysisResult> {
  const parsedUrl = new URL(url);
  const domain = parsedUrl.hostname.replace(/^www\./, "");

  let pageSignals: string;
  try {
    const html = await fetchPageHtml(url);
    pageSignals = extractSignalsFromHtml(html);
  } catch (err: any) {
    throw new Error(`Could not fetch the page: ${err.message}`);
  }

  if (!pageSignals || pageSignals.length < 50) {
    throw new Error(
      "Page returned too little readable content. It may be JavaScript-rendered or blocked."
    );
  }

  const ENTITY_TYPES = Object.keys(ENTITY_TYPE_SEED_MAP).join(" | ");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    max_tokens: 700,
    messages: [
      {
        role: "system",
        content:
          "You are a business analyst. Extract structured business information from webpage content. Return ONLY valid JSON with no markdown or explanation.",
      },
      {
        role: "user",
        content: `Analyze this webpage and return structured JSON:

${pageSignals}

Return exactly this JSON structure:
{
  "business_name": "the company name",
  "entity_type": "one of: ${ENTITY_TYPES}",
  "services": ["specific services/products offered, max 8, be specific not generic"],
  "customer_types": ["customer segments they serve, max 4, be specific"],
  "primary_location": "main city or country (empty string if global/online-only)",
  "locations": ["all cities or countries mentioned, max 5"]
}

Rules:
- services must be specific (e.g. "At-Home Blood Testing" not "Health Services")
- customer_types must be specific (e.g. "SMEs in the UAE" not "businesses")
- entity_type must be exactly one of the listed values
- If services are unclear, infer from headings and description`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("LLM returned invalid JSON");
  }

  const entityType = parsed.entity_type || "service_provider";
  const seedType = entityTypeToSeedType(entityType);

  return {
    business_name: parsed.business_name || domain,
    brand_domain: domain,
    entity_type: entityType,
    seed_type: seedType,
    services: Array.isArray(parsed.services) ? parsed.services.filter(Boolean).slice(0, 8) : [],
    customer_types: Array.isArray(parsed.customer_types)
      ? parsed.customer_types.filter(Boolean).slice(0, 4)
      : [],
    primary_location: parsed.primary_location || "",
    locations: Array.isArray(parsed.locations) ? parsed.locations.filter(Boolean).slice(0, 5) : [],
  };
}

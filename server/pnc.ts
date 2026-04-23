import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const INPUT_COST_PER_TOKEN = 3 / 1_000_000;
const OUTPUT_COST_PER_TOKEN = 15 / 1_000_000;

function calcCost(usage: { input_tokens: number; output_tokens: number }) {
  return {
    input_tokens: usage.input_tokens,
    output_tokens: usage.output_tokens,
    cost_usd: +(
      usage.input_tokens * INPUT_COST_PER_TOKEN +
      usage.output_tokens * OUTPUT_COST_PER_TOKEN
    ).toFixed(6),
  };
}

function extractJSON(text: string, startChar: string): any {
  const open = startChar === "{" ? "{" : "[";
  const close = startChar === "{" ? "}" : "]";
  const start = text.indexOf(open);
  if (start === -1) throw new Error("No JSON found in response");
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === open) depth++;
    else if (text[i] === close) {
      depth--;
      if (depth === 0) return JSON.parse(text.slice(start, i + 1));
    }
  }
  throw new Error("Malformed JSON in response");
}

async function scrapeHomepage(domain: string): Promise<string> {
  const targets = [`https://${domain}`, `http://${domain}`];
  for (const target of targets) {
    try {
      const res = await fetch(target, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AnswerMonkBot/1.0)" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const html = await res.text();

      // Extract title
      const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1]?.trim() || "";

      // Extract meta tags (description, og:description, og:title, keywords)
      const metaValues: string[] = [];
      for (const m of html.matchAll(/<meta[^>]+>/gi)) {
        const tag = m[0];
        const name = (tag.match(/(?:name|property)=["']([^"']+)["']/i) || [])[1] || "";
        const content = (tag.match(/content=["']([^"']+)["']/i) || [])[1] || "";
        if (content && /^(description|og:description|og:title|twitter:description|keywords)$/i.test(name)) {
          metaValues.push(content);
        }
      }

      // Strip tags for body text (works for server-rendered pages)
      const bodyText = html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 3000);

      // Build context — meta tags are always reliable even for SPAs
      const parts: string[] = [];
      if (title) parts.push(`Page title: ${title}`);
      if (metaValues.length) parts.push(`Meta description: ${[...new Set(metaValues)].join(" | ")}`);
      if (bodyText.length > 200) parts.push(`Page text: ${bodyText}`);

      if (parts.length > 0) return parts.join("\n");
    } catch {
      // try next
    }
  }
  return "";
}

export async function pncExtract(url: string) {
  const system = `You are a business analyst. Analyze the given website and extract structured information for a prompt generator.
Return ONLY raw valid JSON — no markdown, no backticks, no commentary:
{
  "business_type_variants":["variant 1","variant 2","variant 3"],
  "service_types":["service 1","service 2","service 3"],
  "customer_types":["customer type 1","customer type 2","customer type 3"],
  "competitors":[{"name":"Name","location":"city or national","known_for":"what they do"}],
  "city":"primary city","country":"country"
}
Rules:
- business_type_variants: 3-5 natural ways to describe the business category
- service_types: every distinct service offered, short and clean
- customer_types: 4-6 specific customer segments
- competitors: up to 12 real competing businesses — search broadly, include direct competitors, aggregators, adjacent providers
- city and country from website; empty string if not found`;

  const cleanDomain = url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  // Scrape the homepage directly first — avoids web-search confusing similar domain names
  const pageContent = await scrapeHomepage(cleanDomain);

  let userContent: string;
  if (pageContent) {
    userContent = `Analyze this business and extract the required JSON.

Domain: ${cleanDomain}
Homepage content (scraped directly):
---
${pageContent}
---

Base your extraction on the homepage content above. Use web_search ONLY to find competitors in the same category — do NOT use it to identify the business itself.`;
  } else {
    userContent = `Analyze the business at this exact domain: ${cleanDomain}

Use web_search to find information about "${cleanDomain}" specifically. Search for:
1. site:${cleanDomain}
2. "${cleanDomain}" company services

CRITICAL: Only extract data from the business at "${cleanDomain}". Do NOT substitute a different domain or company even if the name looks similar.`;
  }

  const response = await (anthropic.messages.create as any)({
    model: "claude-sonnet-4-5",
    max_tokens: 6000,
    system,
    messages: [{ role: "user", content: userContent }],
    tools: [{ type: "web_search_20250305", name: "web_search" }],
  });

  const tb = (response.content || []).filter((b: any) => b.type === "text").pop() as any;
  if (!tb) throw new Error("No response from Claude");
  const result = extractJSON(tb.text, "{");
  if (result.error) throw new Error(`PNC extraction error: ${result.error}`);
  return { result, cost: calcCost(response.usage) };
}

export async function pncV1Generate(
  b1: string[],
  b2: string[],
  b3: string[],
  b4: string[],
  inclCust: boolean,
  loc: string
) {
  const sysP = `You are a search prompt strategist specialising in AI search visibility (Perplexity, ChatGPT, Google AI Overviews). Generate a curated set of 25-30 high-quality search prompts.
Each prompt follows one of these structures:
1. [Verb] 10 [qualifier] [business type] for [service] ${loc}
2. [Verb] 10 [qualifier] [service] ${loc}
${inclCust ? `3. [Verb] 10 [qualifier] [business type] for [service] for [customer type] ${loc}` : ""}
Verbs ONLY: Find, List, Rank. Rules:
- Curate BEST combinations — not all permutations
- Vary structure 1 and 2 roughly equally${inclCust ? ", structure 3 for ~30%" : ""}
- Vary verbs evenly. Vary qualifiers — max 3 repeats each
- Natural language, like a real person typing to an AI
- Return ONLY raw JSON array: [{"verb":"Find","text":"Find 10 most trusted..."},...]`;

  const userMsg = `Business type variants: ${JSON.stringify(b1)}
Service types: ${JSON.stringify(b2)}
${inclCust ? `Customer types: ${JSON.stringify(b3)}` : "(no customer types)"}
Qualifiers: ${JSON.stringify(b4)}
Location: "${loc}"
Generate 25-30 curated prompts.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 3000,
    system: sysP,
    messages: [{ role: "user", content: userMsg }],
  });

  const tb = (response.content || []).filter((b: any) => b.type === "text").pop() as any;
  if (!tb) throw new Error("No response from Claude");
  return { result: extractJSON(tb.text, "["), cost: calcCost(response.usage) };
}

export async function pncClassify(url: string) {
  const system = `You are a business analyst. Analyze the website and extract structured info.
Return ONLY raw valid JSON — no markdown, no backticks:
{"business_name":"name","business_category":"Short category","business_description":"One sentence","business_model":"B2B|B2C|Both","service_types":[{"label":"service","rank":1,"why":"reason"}],"customer_types":[{"label":"customer","rank":1,"why":"reason"}],"city":"city or empty","country":"country or empty","region":"GCC|MENA|Europe etc or empty","scope":"city|country|region|global","scope_confidence":"high|medium|low","scope_reason":"one sentence","scope_signals":["s1","s2"],"competitors":[{"name":"Company","location":"region","known_for":"differentiator"}]}

Rules for service_types:
1. If business_category contains words like service/care/therapy/healthcare/wellness/solutions/platform, include the business_category itself as rank 1 in service_types — it IS a searchable service term.
2. Then list every individual service found in search results, ranked by homepage prominence.
3. For healthcare businesses: explicitly check for and include any of these if mentioned ANYWHERE in search results, directory listings, or review snippets: nurse at home, nursing at home, doctor at home, blood test at home, IV drip therapy, physiotherapy at home, caregiver services, health monitoring, medication delivery.
4. For SaaS/software businesses: check pricing pages, feature lists, and directory entries for individual product modules or service tiers.
5. Never skip a service just because it is not in the meta description — search multiple result snippets.

Rules for customer_types: ALL segments ranked by who the site primarily addresses.
Rules for competitors:
1. ALWAYS scope your competitor search to the detected region. Search for "[business category] competitors [region]".
2. Prioritise regional and local sources over global directories.
3. Prefer locally headquartered or regionally dominant companies over global SaaS giants unless the business itself is global.
4. Up to 12 NAMED competing businesses or products.
Rules for scope: physical+1 city=city, multi-city=country; SaaS: regional TLD/VAT=region, no signals=global.`;

  const response = await (anthropic.messages.create as any)({
    model: "claude-sonnet-4-5",
    max_tokens: 8000,
    system,
    messages: [{ role: "user", content: `Extract blocks from: ${url}` }],
    tools: [{ type: "web_search_20250305", name: "web_search" }],
  });

  const tb = (response.content || []).filter((b: any) => b.type === "text").pop() as any;
  if (!tb) throw new Error("No response from Claude");
  return { result: extractJSON(tb.text, "{"), cost: calcCost(response.usage) };
}

const FLR_QUALIFIERS = [
  "most trusted", "most reliable", "most affordable", "highest rated",
  "most experienced", "best reviewed", "most recommended", "top rated",
];

function getOfferingSuffix(service: string): string {
  const s = service.toLowerCase();
  if (/agency|studio|firm|consultanc/.test(s)) return "";
  if (/marketplace|exchange|directory/.test(s)) return " platform";
  if (/healthcare|medical|care|therapy|nursing|clinic|physiother|homecare/.test(s)) return " services";
  if (/consulting|legal|accounting|coaching|training|staffing|recruitment|outsourc/.test(s)) return " services";
  if (/app|mobile|game/.test(s)) return " apps";
  return " software";
}

function getBusinessSuffix(businessTypeVariants: string[]): string {
  const combined = businessTypeVariants.join(" ").toLowerCase();
  if (/\bagency\b|agencies|studio|firm|consultanc/.test(combined)) return "";
  if (/\bapp\b|apps|mobile app/.test(combined)) return " apps";
  if (/\bplatform\b|marketplace|exchange|directory/.test(combined)) return " platform";
  if (/healthcare|medical|\bcare\b|therapy|nursing|clinic|hospital/.test(combined)) return " services";
  if (/consulting|legal|accounting|coaching|recruitment|staffing/.test(combined)) return " services";
  if (/\bsoftware\b|\bsaas\b|\btool\b|tools/.test(combined)) return " software";
  return " software";
}

// Fix service prompts: only repair ones that don't start with the right verb
function enforceFlrFormat(result: any, loc?: string): any {
  if (result.by_service) {
    result.by_service = result.by_service.map((s: any) => ({
      ...s,
      prompts: (s.prompts || []).map((p: any, i: number) => {
        let text: string = p.text || "";
        if (!text.toLowerCase().startsWith("find, list and rank")) {
          text = `Find, list and rank 10 ${FLR_QUALIFIERS[i % FLR_QUALIFIERS.length]} ${
            loc ? `${s.service} in ${loc}` : s.service
          }`;
        }
        return { verb: "Find, list and rank", text };
      }),
    }));
  }
  return result;
}

export async function pncClassifyGenerate(services: string[], customers: string[], loc: string, url: string, businessTypeVariants?: string[]) {
  const hasLocation = loc.trim().length > 0;
  const locPart = hasLocation ? ` in ${loc}` : "";

  // Derive one suffix for the whole business from its type variants (e.g. "apps", " software", "")
  // Falls back to per-service heuristic only if no variants available
  const suffix = businessTypeVariants && businessTypeVariants.length > 0
    ? getBusinessSuffix(businessTypeVariants)
    : getOfferingSuffix(services[0] ?? "");

  // Resolve business name cheaply — no tools needed
  const nameResponse = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 200,
    system: `You are a business analyst. Return ONLY raw valid JSON — no markdown: {"business_name":"the brand or company name from this URL"}`,
    messages: [{ role: "user", content: `URL: ${url}` }],
  });
  const nameTb = (nameResponse.content || []).filter((b: any) => b.type === "text").pop() as any;
  const { business_name = "" } = nameTb ? extractJSON(nameTb.text, "{") : {};

  // Tier 1 — service in location (only when geo present)
  // One segment per service, 8 qualifier-varied prompts each for scoring robustness
  const by_service = hasLocation
    ? services.map((svc) => ({
        service: svc,
        prompts: FLR_QUALIFIERS.map((q) => ({
          verb: "Find, list and rank",
          text: `Find, list and rank 10 ${q} ${svc}${suffix} in ${loc}`,
        })),
      }))
    : [];

  // Tier 2 — service for customer (always, geo appended when present)
  // One segment per S×C pair, 8 qualifier-varied prompts each for scoring robustness
  const by_customer: any[] = [];
  for (const svc of services) {
    for (const cust of customers) {
      by_customer.push({
        customer: cust,
        service: svc,
        prompts: FLR_QUALIFIERS.map((q) => ({
          verb: "Find, list and rank",
          text: `Find, list and rank 10 ${q} ${svc}${suffix} for ${cust}${locPart}`,
        })),
      });
    }
  }

  return {
    result: { business_name, by_service, by_customer },
    cost: calcCost(nameResponse.usage),
  };
}

export async function pncV2Generate(url: string, loc: string) {
  const sysP = `You are a search prompt strategist for AI search visibility (Perplexity, ChatGPT, Google AI Overviews).

Analyze the business website, identify all services and customer types, then generate search prompts grouped by both.

Return ONLY raw valid JSON — no markdown, no backticks:
{
  "business_name": "string",
  "total_prompts": 0,
  "by_service": [
    {
      "service": "service name",
      "prompts": [
        {"verb":"Find, list and rank","text":"Find, list and rank 10 most trusted X in ${loc}"},
        {"verb":"Find, list and rank","text":"Find, list and rank 10 most reliable X in ${loc}"},
        {"verb":"Find, list and rank","text":"Find, list and rank 10 most affordable X in ${loc}"}
      ]
    }
  ],
  "by_customer": [
    {
      "customer": "customer type name",
      "prompts": [
        {"verb":"Find, list and rank","text":"Find, list and rank 10 most trusted X for [customer] in ${loc}"},
        {"verb":"Find, list and rank","text":"Find, list and rank 10 most reliable X for [customer] in ${loc}"}
      ]
    }
  ]
}

Rules:
- Identify every service from the website
- Identify 4-6 distinct customer types who use this business
- Generate 8 prompts per service group, 8 prompts per customer group
- Every prompt MUST start with "Find, list and rank 10" — no other verb format allowed
- Qualifiers: most trusted, most reliable, most affordable, highest rated, most experienced, best reviewed, most recommended — vary, no repeats within a group
- Location string for all prompts: "${loc}"
- Make every prompt feel natural — like a real person typing to an AI assistant
- Do not repeat the same prompt across groups
- Set total_prompts to the actual count of all prompts generated`;

  const response = await (anthropic.messages.create as any)({
    model: "claude-sonnet-4-5",
    max_tokens: 8000,
    system: sysP,
    messages: [{ role: "user", content: `Analyze this website and generate grouped prompts: ${url}` }],
    tools: [{ type: "web_search_20250305", name: "web_search" }],
  });

  const tb = (response.content || []).filter((b: any) => b.type === "text").pop() as any;
  if (!tb) throw new Error("No response from Claude");
  return { result: enforceFlrFormat(extractJSON(tb.text, "{")), cost: calcCost(response.usage) };
}

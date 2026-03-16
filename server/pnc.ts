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

  const response = await (anthropic.messages.create as any)({
    model: "claude-sonnet-4-5",
    max_tokens: 2000,
    system,
    messages: [{ role: "user", content: `Extract blocks from: ${url}` }],
    tools: [{ type: "web_search_20250305", name: "web_search" }],
  });

  const tb = (response.content || []).filter((b: any) => b.type === "text").pop() as any;
  if (!tb) throw new Error("No response from Claude");
  return { result: extractJSON(tb.text, "{"), cost: calcCost(response.usage) };
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
    max_tokens: 2000,
    system,
    messages: [{ role: "user", content: `Extract blocks from: ${url}` }],
    tools: [{ type: "web_search_20250305", name: "web_search" }],
  });

  const tb = (response.content || []).filter((b: any) => b.type === "text").pop() as any;
  if (!tb) throw new Error("No response from Claude");
  return { result: extractJSON(tb.text, "{"), cost: calcCost(response.usage) };
}

export async function pncClassifyGenerate(services: string[], customers: string[], loc: string, url: string) {
  const sysP = `Search prompt strategist. Generate prompts using ONLY confirmed services and customers.
Return ONLY raw valid JSON:
{"business_name":"","by_service":[{"service":"","prompts":[{"verb":"Find","text":""},{"verb":"List","text":""},{"verb":"Rank","text":""}]}],"by_customer":[{"customer":"","prompts":[{"verb":"Find","text":""},{"verb":"List","text":""},{"verb":"Rank","text":""}]}]}
Rules: 4-5 prompts per service, 3-4 per customer. Verbs: Find/List/Rank evenly. Qualifiers: most trusted/reliable/affordable/highest rated/most experienced/best reviewed — vary, no repeats in group. Location: "${loc}". Natural language. ONLY use listed services and customers.`;

  const userMsg = `Services confirmed: ${JSON.stringify(services)}\nCustomer types confirmed: ${JSON.stringify(customers)}\nLocation: "${loc}"\nURL: ${url}\nGenerate grouped prompts.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4000,
    system: sysP,
    messages: [{ role: "user", content: userMsg }],
  });

  const tb = (response.content || []).filter((b: any) => b.type === "text").pop() as any;
  if (!tb) throw new Error("No response from Claude");
  return { result: extractJSON(tb.text, "{"), cost: calcCost(response.usage) };
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
        {"verb":"Find","text":"Find 10 most trusted X in Y"},
        {"verb":"List","text":"List 10 most reliable X in Y"},
        {"verb":"Rank","text":"Rank 10 most affordable X in Y"}
      ]
    }
  ],
  "by_customer": [
    {
      "customer": "customer type name",
      "prompts": [
        {"verb":"Find","text":"Find 10 most trusted X for [customer] in Y"},
        {"verb":"List","text":"..."},
        {"verb":"Rank","text":"..."}
      ]
    }
  ]
}

Rules:
- Identify every service from the website
- Identify 4-6 distinct customer types who use this business
- Generate 4-6 prompts per service group, 3-4 prompts per customer group
- Verbs ONLY: Find, List, Rank — vary evenly
- Qualifiers: most trusted, most reliable, most affordable, highest rated, most experienced, best reviewed, most recommended — vary, no repeats within a group
- Location string for all prompts: "${loc}"
- Make every prompt feel natural — like a real person typing to an AI assistant
- Do not repeat the same prompt across groups
- Set total_prompts to the actual count of all prompts generated`;

  const response = await (anthropic.messages.create as any)({
    model: "claude-sonnet-4-5",
    max_tokens: 4000,
    system: sysP,
    messages: [{ role: "user", content: `Analyze this website and generate grouped prompts: ${url}` }],
    tools: [{ type: "web_search_20250305", name: "web_search" }],
  });

  const tb = (response.content || []).filter((b: any) => b.type === "text").pop() as any;
  if (!tb) throw new Error("No response from Claude");
  return { result: extractJSON(tb.text, "{"), cost: calcCost(response.usage) };
}

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface QueryDimensions {
  category: string;
  geo: string;
  audience: string;
  qualifier: string;
  rawQuery: string;
}

export async function decomposeQuery(
  brandName: string,
  persona: string,
  services: string[],
  geo: string | null,
  verticals: string[],
): Promise<QueryDimensions> {
  const contextParts = [
    `Brand: ${brandName}`,
    `Persona/Industry: ${persona}`,
    `Services: ${services.join(", ")}`,
    geo ? `Location: ${geo}` : null,
    verticals.length > 0 ? `Target verticals: ${verticals.join(", ")}` : null,
  ].filter(Boolean).join("\n");

  const rawQuery = `best ${services[0] || persona.replace(/_/g, " ")} ${verticals[0] ? `for ${verticals[0]}` : ""} ${geo || ""}`.trim();

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: `You decompose search queries into intent dimensions. Return valid JSON only.`,
        },
        {
          role: "user",
          content: `Given this brand context:
${contextParts}

Decompose the implicit search intent into exactly 4 dimensions:
1. category: The product/service category being searched (e.g., "corporate cards", "marketing agency", "SEO services")
2. geo: The geographic constraint (e.g., "UAE", "Dubai", "global"). Use "global" if no specific location.
3. audience: The target audience/customer type (e.g., "startups", "SMEs", "medical clinics"). Use "general" if not specific.
4. qualifier: The evaluation criterion (e.g., "best", "top-rated", "affordable"). Default to "best".

Return JSON: {"category":"...","geo":"...","audience":"...","qualifier":"..."}`,
        },
      ],
      max_tokens: 200,
    });

    const text = response.choices[0]?.message?.content?.trim() || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        category: parsed.category || services[0] || persona.replace(/_/g, " "),
        geo: parsed.geo || geo || "global",
        audience: parsed.audience || verticals[0] || "general",
        qualifier: parsed.qualifier || "best",
        rawQuery,
      };
    }
  } catch (err) {
    console.error("[insights] Query decomposition failed, using fallback:", err);
  }

  return {
    category: services[0] || persona.replace(/_/g, " "),
    geo: geo || "global",
    audience: verticals[0] || "general",
    qualifier: "best",
    rawQuery,
  };
}

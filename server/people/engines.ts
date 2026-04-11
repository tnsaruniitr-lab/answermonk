import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import type { PeopleConfig } from "./config";

export interface PeopleEngineResult {
  rawText: string;
  citedUrls: string[];
  engine: string;
  inputTokens: number;
  outputTokens: number;
  error?: string;
}

const PEOPLE_SYSTEM_PROMPT = `You are a knowledgeable assistant. When asked about a person or people, provide accurate, factual information based on what you know or can find. Include details about their professional background, role, company, education, and what they are known for. Be specific and factual.`;

async function queryChatGPTForPeople(
  query: string,
  model: string,
  webSearch: boolean
): Promise<PeopleEngineResult> {
  try {
    const directOpenai = new OpenAI({ apiKey: process.env.OPENAI_DIRECT_API_KEY });

    if (webSearch) {
      const response = await directOpenai.responses.create({
        model,
        tools: [{ type: "web_search" as any }],
        tool_choice: "required" as any,
        input: query,
        temperature: 0.3,
      });
      const rawText = (response as any).output_text ?? "";
      const citedUrls = extractCitedUrls(rawText, response);
      const usage = (response as any).usage ?? {};
      return {
        rawText, citedUrls, engine: "chatgpt",
        inputTokens: usage.input_tokens ?? 0,
        outputTokens: usage.output_tokens ?? 0,
      };
    }
  } catch (err) {
    console.error("[people/chatgpt] web search failed, falling back:", err);
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: PEOPLE_SYSTEM_PROMPT },
        { role: "user", content: query },
      ],
      max_completion_tokens: 1024,
      temperature: 0.3,
    });
    const rawText = completion.choices[0]?.message?.content ?? "";
    const usage = completion.usage ?? { prompt_tokens: 0, completion_tokens: 0 };
    return {
      rawText, citedUrls: [], engine: "chatgpt",
      inputTokens: usage.prompt_tokens ?? 0,
      outputTokens: usage.completion_tokens ?? 0,
    };
  } catch (fallbackErr) {
    return { rawText: "", citedUrls: [], engine: "chatgpt", inputTokens: 0, outputTokens: 0, error: String(fallbackErr) };
  }
}

async function queryGeminiForPeople(
  query: string,
  model: string,
  webSearch: boolean
): Promise<PeopleEngineResult> {
  const gemini = new GoogleGenAI({
    apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
    httpOptions: { apiVersion: "", baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL },
  });

  try {
    const response = await gemini.models.generateContent({
      model,
      contents: query,
      config: {
        maxOutputTokens: 2048,
        tools: webSearch ? [{ googleSearch: {} }] : undefined,
      },
    });
    const rawText = response.text ?? "";
    const citedUrls = extractGeminiCitations(response);
    const usage = (response as any).usageMetadata ?? {};
    return {
      rawText, citedUrls, engine: "gemini",
      inputTokens: usage.promptTokenCount ?? 0,
      outputTokens: usage.candidatesTokenCount ?? 0,
    };
  } catch (err) {
    console.error("[people/gemini] failed:", err);
    return { rawText: "", citedUrls: [], engine: "gemini", inputTokens: 0, outputTokens: 0, error: String(err) };
  }
}

async function queryClaudeForPeople(
  query: string,
  model: string
): Promise<PeopleEngineResult> {
  const anthropic = new Anthropic({
    apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
  });

  try {
    const message = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      system: PEOPLE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: query }],
    });
    const rawText = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    return {
      rawText, citedUrls: [], engine: "claude",
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    };
  } catch (err) {
    return { rawText: "", citedUrls: [], engine: "claude", inputTokens: 0, outputTokens: 0, error: String(err) };
  }
}

function extractCitedUrls(text: string, response: any): string[] {
  const urls: string[] = [];
  try {
    const annotations = response?.output?.[0]?.content?.[0]?.annotations ?? [];
    for (const ann of annotations) {
      if (ann.url) urls.push(ann.url);
    }
  } catch {}
  const urlRegex = /https?:\/\/[^\s\)>"]+/g;
  const textUrls = text.match(urlRegex) ?? [];
  for (const u of textUrls) {
    const clean = u.replace(/[.,;)]+$/, "");
    if (!urls.includes(clean)) urls.push(clean);
  }
  return [...new Set(urls)].slice(0, 10);
}

function extractGeminiCitations(response: any): string[] {
  const urls: string[] = [];
  try {
    const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    for (const chunk of chunks) {
      if (chunk.web?.uri) urls.push(chunk.web.uri);
    }
  } catch {}
  return [...new Set(urls)].slice(0, 10);
}

export async function queryPeopleEngine(
  engine: "chatgpt" | "gemini" | "claude",
  query: string,
  config: PeopleConfig
): Promise<PeopleEngineResult> {
  switch (engine) {
    case "chatgpt":
      return queryChatGPTForPeople(query, config.chatgptModel, config.webSearch.chatgpt);
    case "gemini":
      return queryGeminiForPeople(query, config.geminiModel, config.webSearch.gemini);
    case "claude":
      return queryClaudeForPeople(query, config.claudeModel);
  }
}

export const PEOPLE_ENGINES: Array<"chatgpt" | "gemini" | "claude"> = ["chatgpt", "gemini", "claude"];

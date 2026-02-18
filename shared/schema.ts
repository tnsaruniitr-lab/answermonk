
import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const scoringJobs = pgTable("scoring_jobs", {
  id: serial("id").primaryKey(),
  brandName: text("brand_name").notNull(),
  brandDomain: text("brand_domain"),
  mode: text("mode").notNull(),
  status: text("status").notNull().default("pending"),
  promptCount: integer("prompt_count").notNull(),
  engineCount: integer("engine_count").notNull().default(3),
  resultJson: jsonb("result_json"),
  rawData: jsonb("raw_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertScoringJobSchema = createInsertSchema(scoringJobs).omit({ id: true, createdAt: true });
export type ScoringJob = typeof scoringJobs.$inferSelect;
export type InsertScoringJob = z.infer<typeof insertScoringJobSchema>;

export const savedProfiles = pgTable("saved_profiles", {
  id: serial("id").primaryKey(),
  brandName: text("brand_name").notNull().unique(),
  brandDomain: text("brand_domain"),
  persona: text("persona").notNull(),
  verticals: text("verticals").array().notNull(),
  services: text("services").array().notNull(),
  modifiers: text("modifiers").array().notNull(),
  geo: text("geo"),
  budgetTier: text("budget_tier").notNull().default("mid"),
  decisionMakers: text("decision_makers").array().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSavedProfileSchema = createInsertSchema(savedProfiles).omit({ id: true, createdAt: true });
export type SavedProfile = typeof savedProfiles.$inferSelect;
export type InsertSavedProfile = z.infer<typeof insertSavedProfileSchema>;

// We'll store search history/results here
export const analysisResults = pgTable("analysis_results", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  brand: text("brand").notNull(),
  presenceScore: integer("presence_score").notNull(),
  rankScore: integer("rank_score").notNull(),
  engineScores: jsonb("engine_scores").notNull(), // Store detailed breakdown
  createdAt: timestamp("created_at").defaultNow(),
});

// === BASE SCHEMAS ===
export const insertAnalysisResultSchema = createInsertSchema(analysisResults).omit({ id: true, createdAt: true });

// === EXPLICIT API CONTRACT TYPES ===
export type AnalysisResult = typeof analysisResults.$inferSelect;
export type InsertAnalysisResult = z.infer<typeof insertAnalysisResultSchema>;

// Request types based on the provided text file
export const EngineEnum = z.enum(["chatgpt", "gemini", "claude", "deepseek"]);
export type Engine = z.infer<typeof EngineEnum>;

export const EvalRequestSchema = z.object({
  query: z.string().min(3),
  brand: z.string().min(2),
  engine: EngineEnum,
  topN: z.number().int().min(1).max(20).default(10),
});
export type EvalRequest = z.infer<typeof EvalRequestSchema>;

export const EngineOutputSchema = z.object({
  engine: EngineEnum,
  presenceState: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  position: z.number().int().min(1).max(10).nullable(),
  topBrands: z.array(z.string()).max(20).default([]),
  rawAnswerText: z.string().optional(),
});
export type EngineOutput = z.infer<typeof EngineOutputSchema>;

export const AggregateRequestSchema = z.object({
  query: z.string().min(3),
  brand: z.string().min(2),
  weights: z.object({
    chatgpt: z.number().min(0).max(100).default(35),
    gemini: z.number().min(0).max(100).default(35),
    claude: z.number().min(0).max(100).default(20),
    deepseek: z.number().min(0).max(100).default(10),
  }).default({
    chatgpt: 35,
    gemini: 35,
    claude: 20,
    deepseek: 10,
  }),
  rankDecayP: z.number().min(0.2).max(5).default(1.2),
  engineOutputs: z.array(EngineOutputSchema),
});
export type AggregateRequest = z.infer<typeof AggregateRequestSchema>;

export const AggregateResponseSchema = z.object({
  query: z.string(),
  brand: z.string(),
  weights: z.record(z.number()),
  rankDecayP: z.number(),
  presenceScore: z.number(),
  rankingScore: z.number(),
  perEngine: z.object({
    presenceByEngine: z.record(z.number()),
    posByEngine: z.record(z.nullable(z.number())),
    rawResponses: z.record(z.string()).optional(),
  }),
  leaderboard: z.array(z.object({
    name: z.string(),
    freq: z.number(),
    presenceScore: z.number(),
    rankingScore: z.number(),
  })),
  ts: z.string(),
});
export type AggregateResponse = z.infer<typeof AggregateResponseSchema>;

export const EvalResponseSchema = z.object({
  engine: EngineEnum,
  query: z.string(),
  brand: z.string(),
  found_state: z.number(),
  pos: z.nullable(z.number()),
  top10_brands: z.array(z.string()),
  raw_answer_text: z.string().optional(),
  citations: z.array(z.string()).optional(),
  ts: z.string(),
});
export type EvalResponse = z.infer<typeof EvalResponseSchema>;

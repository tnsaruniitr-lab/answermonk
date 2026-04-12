
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, index, real } from "drizzle-orm/pg-core";
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
  insightsJson: jsonb("insights_json"),
  insightsStatus: text("insights_status"),
  source: text("source"),
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

export const multiSegmentSessions = pgTable("multi_segment_sessions", {
  id: serial("id").primaryKey(),
  brandName: text("brand_name").notNull(),
  brandDomain: text("brand_domain"),
  slug: text("slug"),
  promptsPerSegment: integer("prompts_per_segment").notNull().default(3),
  segments: jsonb("segments").notNull(),
  citationReport: jsonb("citation_report"),
  cachedReport: jsonb("cached_report"),
  sessionType: text("session_type").notNull().default("brand"),
  parentSessionId: integer("parent_session_id"),
  competitorName: text("competitor_name"),
  parentBrandName: text("parent_brand_name"),
  costBreakdown: jsonb("cost_breakdown"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reportCache = pgTable("report_cache", {
  id: serial("id").primaryKey(),
  cacheKey: text("cache_key").notNull().unique(),
  reportData: jsonb("report_data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMultiSegmentSessionSchema = createInsertSchema(multiSegmentSessions).omit({ id: true, createdAt: true });
export type MultiSegmentSession = typeof multiSegmentSessions.$inferSelect;
export type InsertMultiSegmentSession = z.infer<typeof insertMultiSegmentSessionSchema>;

export const savedV2Configs = pgTable("saved_v2_configs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  brandName: text("brand_name").notNull(),
  brandDomain: text("brand_domain"),
  promptsPerSegment: integer("prompts_per_segment").notNull().default(3),
  segments: jsonb("segments").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSavedV2ConfigSchema = createInsertSchema(savedV2Configs).omit({ id: true, createdAt: true });
export type SavedV2Config = typeof savedV2Configs.$inferSelect;
export type InsertSavedV2Config = z.infer<typeof insertSavedV2ConfigSchema>;

export const teaserLeads = pgTable("teaser_leads", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  brandName: text("brand_name").notNull(),
  interests: text("interests").array().notNull(),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTeaserLeadSchema = createInsertSchema(teaserLeads).omit({ id: true, createdAt: true });
export type TeaserLead = typeof teaserLeads.$inferSelect;
export type InsertTeaserLead = z.infer<typeof insertTeaserLeadSchema>;

export const summaryLeads = pgTable("summary_leads", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  brandName: text("brand_name").notNull(),
  sessionId: integer("session_id"),
  sourcePage: text("source_page"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSummaryLeadSchema = createInsertSchema(summaryLeads).omit({ id: true, createdAt: true });
export type SummaryLead = typeof summaryLeads.$inferSelect;
export type InsertSummaryLead = z.infer<typeof insertSummaryLeadSchema>;

export const citationPageMentions = pgTable("citation_page_mentions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id"),
  url: text("url").notNull(),
  resolvedUrl: text("resolved_url"),
  domain: text("domain").notNull(),
  brand: text("brand").notNull(),
  mentionIndex: integer("mention_index").notNull(),
  context: text("context").notNull(),
  sourceType: text("source_type").notNull(),
  engines: text("engines").array(),
  domainCategory: text("domain_category"),
  segmentIndices: integer("segment_indices").array(),
  segmentPersonas: text("segment_personas").array(),
  segmentQueries: text("segment_queries").array(),
  pageType: text("page_type"),
  pageTitle: text("page_title"),
  fetchStatus: text("fetch_status").notNull(),
  scrapedContent: text("scraped_content"),
  aiResponseText: jsonb("ai_response_text"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("idx_citation_mentions_session").on(t.sessionId),
  index("idx_citation_mentions_url").on(t.url),
  index("idx_citation_mentions_brand").on(t.brand),
]);

export const insertCitationPageMentionSchema = createInsertSchema(citationPageMentions).omit({ id: true, createdAt: true });
export type CitationPageMention = typeof citationPageMentions.$inferSelect;
export type InsertCitationPageMention = z.infer<typeof insertCitationPageMentionSchema>;

export const citationSignalIntelligence = pgTable("citation_signal_intelligence", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  result: jsonb("result").notNull(),
  promptTokens: integer("prompt_tokens").notNull().default(0),
  completionTokens: integer("completion_tokens").notNull().default(0),
  costUsd: real("cost_usd").notNull().default(0),
  promptText: text("prompt_text"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type CitationSignalIntelligence = typeof citationSignalIntelligence.$inferSelect;

export const brandIntelligenceJobs = pgTable("brand_intelligence_jobs", {
  id: serial("id").primaryKey(),
  brandName: text("brand_name").notNull(),
  brandUrl: text("brand_url"),
  engine: text("engine").notNull(),
  runCount: integer("run_count").notNull().default(15),
  webSearch: boolean("web_search").notNull().default(false),
  packetMode: boolean("packet_mode").notNull().default(false),
  packetDefinition: jsonb("packet_definition"),
  benchmarkMode: boolean("benchmark_mode").notNull().default(false),
  benchmarkCategory: text("benchmark_category"),
  status: text("status").notNull().default("pending"),
  progress: integer("progress").notNull().default(0),
  results: jsonb("results"),
  rawRuns: jsonb("raw_runs"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBrandIntelligenceJobSchema = createInsertSchema(brandIntelligenceJobs).omit({ id: true, createdAt: true });
export type BrandIntelligenceJob = typeof brandIntelligenceJobs.$inferSelect;
export type InsertBrandIntelligenceJob = z.infer<typeof insertBrandIntelligenceJobSchema>;

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
  webSearch: z.boolean().default(false),
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

export const incomingLeads = pgTable("incoming_leads", {
  id: serial("id").primaryKey(),
  url: text("url"),
  businessName: text("business_name"),
  services: text("services").array(),
  city: text("city"),
  rawPayload: jsonb("raw_payload"),
  status: text("status").notNull().default("pending"),
  receivedAt: timestamp("received_at").defaultNow(),
});

export const insertIncomingLeadSchema = createInsertSchema(incomingLeads).omit({ id: true, receivedAt: true });
export type IncomingLead = typeof incomingLeads.$inferSelect;
export type InsertIncomingLead = z.infer<typeof insertIncomingLeadSchema>;

export const signalConsistencyJobs = pgTable("signal_consistency_jobs", {
  id: serial("id").primaryKey(),
  status: text("status").notNull().default("pending"),
  brands: jsonb("brands").notNull().$type<string[]>(),
  engines: jsonb("engines").notNull().$type<string[]>(),
  runCount: integer("run_count").notNull().default(10),
  discoveredSignals: jsonb("discovered_signals").$type<Record<string, any>>(),
  rawResponses: jsonb("raw_responses").$type<Record<string, any>>(),
  scoringResults: jsonb("scoring_results").$type<Record<string, any>>(),
  progress: integer("progress").notNull().default(0),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSignalConsistencyJobSchema = createInsertSchema(signalConsistencyJobs).omit({ id: true, createdAt: true });
export type SignalConsistencyJob = typeof signalConsistencyJobs.$inferSelect;
export type InsertSignalConsistencyJob = z.infer<typeof insertSignalConsistencyJobSchema>;

export const citationInsights = pgTable("citation_insights", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  model: text("model").notNull(),
  resultText: text("result_text").notNull(),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  rowCount: integer("row_count"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type CitationInsight = typeof citationInsights.$inferSelect;

export const landingSubmissions = pgTable("landing_submissions", {
  id: serial("id").primaryKey(),
  websiteUrl: text("website_url").notNull(),
  normalizedDomain: text("normalized_domain").notNull(),
  ipAddress: text("ip_address"),
  status: text("status").notNull().default("pending"),
  pncResult: jsonb("pnc_result"),
  sessionId: integer("session_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLandingSubmissionSchema = createInsertSchema(landingSubmissions).omit({ id: true, createdAt: true });
export type LandingSubmission = typeof landingSubmissions.$inferSelect;
export type InsertLandingSubmission = z.infer<typeof insertLandingSubmissionSchema>;

// === DIRECTORY: Publishable segment pages ===
// One row per publishable segment. Session is a container only — invisible to directory.

export const directoryPages = pgTable("directory_pages", {
  id: serial("id").primaryKey(),

  // Source reference
  sessionId: integer("session_id").notNull(),
  segmentIndex: integer("segment_index").notNull().default(0),

  // Normalisation fields
  rawQuery: text("raw_query").notNull(),
  canonicalQuery: text("canonical_query").notNull(),
  canonicalSlug: text("canonical_slug").notNull().unique(),
  canonicalLocation: text("canonical_location"),
  clusterId: text("cluster_id"),
  vertical: text("vertical"),           // industry group: healthcare | b2b-saas | venture-capital | marketing | other

  // Publishing state
  publishStatus: text("publish_status").notNull().default("draft"),
  dedupeParentId: integer("dedupe_parent_id"),

  // Dataset versioning
  dataVersion: text("data_version"),
  engineSet: jsonb("engine_set").$type<string[]>(),

  // Quality gate
  evidenceScore: integer("evidence_score").notNull().default(0),
  brandCount: integer("brand_count").notNull().default(0),

  // Snapshot of ranking at publish time
  rankingSnapshot: jsonb("ranking_snapshot"),

  // Timestamps
  firstPublishedAt: timestamp("first_published_at"),
  lastUpdatedAt: timestamp("last_updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  slugIdx: index("directory_pages_slug_idx").on(t.canonicalSlug),
  clusterIdx: index("directory_pages_cluster_idx").on(t.clusterId),
  statusIdx: index("directory_pages_status_idx").on(t.publishStatus),
}));

export const insertDirectoryPageSchema = createInsertSchema(directoryPages).omit({ id: true, createdAt: true });
export type DirectoryPage = typeof directoryPages.$inferSelect;
export type InsertDirectoryPage = z.infer<typeof insertDirectoryPageSchema>;

// === DIRECTORY: Version history per query page ===
// Each time a page's rankings change, a new version row is inserted.
// The live page always points to the latest version.

export const queryPageVersions = pgTable("query_page_versions", {
  id: serial("id").primaryKey(),
  pageSlug: text("page_slug").notNull(),
  dataVersion: text("data_version").notNull(),
  analysisWindow: text("analysis_window"),
  promptCount: integer("prompt_count").notNull().default(0),
  rankingSnapshotJson: jsonb("ranking_snapshot_json").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  slugIdx: index("query_page_versions_slug_idx").on(t.pageSlug),
}));

export const insertQueryPageVersionSchema = createInsertSchema(queryPageVersions).omit({ id: true, createdAt: true });
export type QueryPageVersion = typeof queryPageVersions.$inferSelect;
export type InsertQueryPageVersion = z.infer<typeof insertQueryPageVersionSchema>;

export const agentInterest = pgTable("agent_interest", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  agentId: text("agent_id").notNull(),
  agentName: text("agent_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertAgentInterestSchema = createInsertSchema(agentInterest).omit({ id: true, createdAt: true });
export type AgentInterest = typeof agentInterest.$inferSelect;
export type InsertAgentInterest = z.infer<typeof insertAgentInterestSchema>;

export const auditWaitlist = pgTable("audit_waitlist", {
  id: serial("id").primaryKey(),
  website: text("website").notNull(),
  email: text("email").notNull(),
  submissionId: integer("submission_id"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertAuditWaitlistSchema = createInsertSchema(auditWaitlist).omit({ id: true, createdAt: true });
export type AuditWaitlistEntry = typeof auditWaitlist.$inferSelect;
export type InsertAuditWaitlistEntry = z.infer<typeof insertAuditWaitlistSchema>;

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

// === PEOPLE AI IDENTITY AUDIT ===

export const peopleSessions = pgTable("people_sessions", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  linkedinUrl: text("linkedin_url").notNull(),
  name: text("name").notNull(),
  headline: text("headline"),
  currentRole: text("current_role"),
  currentCompany: text("current_company"),
  pastCompanies: text("past_companies").array().notNull().default([]),
  roles: text("roles").array().notNull().default([]),
  education: text("education").array().notNull().default([]),
  location: text("location"),
  industry: text("industry"),
  selectedAnchors: jsonb("selected_anchors").$type<{ workplaces: string[]; roles: string[]; education: string[] }>(),
  status: text("status").notNull().default("pending"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPeopleSessionSchema = createInsertSchema(peopleSessions).omit({ id: true, createdAt: true });
export type PeopleSession = typeof peopleSessions.$inferSelect;
export type InsertPeopleSession = z.infer<typeof insertPeopleSessionSchema>;

export const peopleQueryResults = pgTable("people_query_results", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  track: text("track").notNull(),
  queryIndex: integer("query_index").notNull(),
  queryText: text("query_text").notNull(),
  engine: text("engine").notNull(),
  rawResponse: text("raw_response"),
  identityMatch: text("identity_match"),
  statedFacts: jsonb("stated_facts").$type<{ fact: string; value: string; sourceUrl: string | null; status: string }[]>(),
  citedUrls: text("cited_urls").array().notNull().default([]),
  targetRank: integer("target_rank"),
  targetFound: boolean("target_found").notNull().default(false),
  nameLandscape: jsonb("name_landscape").$type<{ name: string; description: string; rank: number; urls: string[] }[]>(),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PeopleQueryResult = typeof peopleQueryResults.$inferSelect;

export const peopleScores = pgTable("people_scores", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().unique(),
  recognitionScore: integer("recognition_score").notNull().default(0),
  recognitionGrade: text("recognition_grade").notNull().default("F"),
  proofScore: integer("proof_score").notNull().default(0),
  proofGrade: text("proof_grade").notNull().default("F"),
  diagnosticText: text("diagnostic_text"),
  reportData: jsonb("report_data").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PeopleScore = typeof peopleScores.$inferSelect;

// === BRANDSMITH ===

export const brandsmithJobs = pgTable("brandsmith_jobs", {
  id: serial("id").primaryKey(),
  jobId: text("job_id").notNull().unique(),
  sessionId: text("session_id").notNull(),
  websiteUrl: text("website_url").notNull(),
  status: text("status").notNull().default("complete"),
  sections: jsonb("sections").$type<BrandSection[]>(),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export interface BrandSectionField {
  key: string;
  label: string;
  type: "text" | "textarea" | "list" | "url";
  value: string | string[];
}

export interface BrandSection {
  section: string;
  title: string;
  card_order: number;
  ai_confidence: number;
  user_edited: boolean;
  data: Record<string, unknown>;
}

export const insertBrandsmithJobSchema = createInsertSchema(brandsmithJobs).omit({ id: true, createdAt: true });
export type BrandsmithJob = typeof brandsmithJobs.$inferSelect;
export type InsertBrandsmithJob = z.infer<typeof insertBrandsmithJobSchema>;

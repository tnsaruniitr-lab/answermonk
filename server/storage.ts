
import { db } from "./db";
import { and, asc, count, desc, eq, isNull, ne, or, sql } from "drizzle-orm";
import {
  analysisResults,
  scoringJobs,
  savedProfiles,
  multiSegmentSessions,
  savedV2Configs,
  reportCache,
  teaserLeads,
  summaryLeads,
  citationPageMentions,
  incomingLeads,
  landingSubmissions,
  directoryPages,
  queryPageVersions,
  auditWaitlist,
  type InsertIncomingLead,
  type IncomingLead,
  type InsertAnalysisResult,
  type AnalysisResult,
  type InsertScoringJob,
  type ScoringJob,
  type InsertSavedProfile,
  type SavedProfile,
  type InsertMultiSegmentSession,
  type MultiSegmentSession,
  type InsertSavedV2Config,
  type SavedV2Config,
  type InsertTeaserLead,
  type TeaserLead,
  type InsertSummaryLead,
  type SummaryLead,
  type CitationPageMention,
  type InsertCitationPageMention,
  type LandingSubmission,
  type InsertLandingSubmission,
  type DirectoryPage,
  type InsertDirectoryPage,
  type QueryPageVersion,
  type InsertQueryPageVersion,
  agentInterest,
  type AgentInterest,
  type InsertAgentInterest,
} from "@shared/schema";

export interface IStorage {
  createAnalysisResult(result: InsertAnalysisResult): Promise<AnalysisResult>;
  getAnalysisHistory(): Promise<AnalysisResult[]>;
  createScoringJob(job: InsertScoringJob): Promise<ScoringJob>;
  updateScoringJob(id: number, updates: Partial<InsertScoringJob>): Promise<ScoringJob>;
  getScoringJob(id: number): Promise<ScoringJob | undefined>;
  getScoringHistory(): Promise<ScoringJob[]>;
  listSavedProfiles(): Promise<SavedProfile[]>;
  upsertSavedProfile(profile: InsertSavedProfile): Promise<SavedProfile>;
  createMultiSegmentSession(session: InsertMultiSegmentSession): Promise<MultiSegmentSession>;
  listMultiSegmentSessions(): Promise<MultiSegmentSession[]>;
  getMultiSegmentSession(id: number): Promise<MultiSegmentSession | undefined>;
  getMultiSegmentSessionBySlug(slug: string): Promise<MultiSegmentSession | undefined>;
  updateMultiSegmentSessionSlug(sessionId: number, slug: string): Promise<void>;
  updateMultiSegmentSessionSegments(sessionId: number, segments: any): Promise<void>;
  updateCitationReport(sessionId: number, report: any): Promise<void>;
  createV2Config(config: InsertSavedV2Config): Promise<SavedV2Config>;
  listV2Configs(): Promise<SavedV2Config[]>;
  deleteV2Config(id: number): Promise<void>;
  getV2SegmentGroups(): Promise<Array<{
    groupKey: string;
    brandName: string;
    brandDomain: string | null;
    segmentJobIds: number[];
    segments: ScoringJob[];
    createdAt: Date;
  }>>;
  getV2SegmentGroup(groupKey: string): Promise<{
    groupKey: string;
    brandName: string;
    brandDomain: string | null;
    segmentJobIds: number[];
    segments: ScoringJob[];
    createdAt: Date;
  } | undefined>;
  updateCachedReport(sessionId: number, report: any): Promise<void>;
  deleteMultiSegmentSession(id: number): Promise<void>;
  getReportCache(cacheKey: string): Promise<any | null>;
  setReportCache(cacheKey: string, data: any): Promise<void>;
  createTeaserLead(lead: InsertTeaserLead): Promise<TeaserLead>;
  listTeaserLeads(): Promise<TeaserLead[]>;
  createSummaryLead(lead: InsertSummaryLead): Promise<SummaryLead>;
  listSummaryLeads(): Promise<SummaryLead[]>;
  createIncomingLead(lead: InsertIncomingLead): Promise<IncomingLead>;
  listIncomingLeads(): Promise<IncomingLead[]>;
  updateIncomingLeadStatus(id: number, status: string): Promise<void>;
  saveCitationMentions(sessionId: number, mentions: InsertCitationPageMention[]): Promise<void>;
  getCitationMentions(sessionId: number): Promise<CitationPageMention[]>;
  createLandingSubmission(data: InsertLandingSubmission): Promise<LandingSubmission>;
  getLandingSubmissionByDomain(domain: string, withinHours: number): Promise<LandingSubmission | undefined>;
  updateLandingSubmission(id: number, updates: Partial<InsertLandingSubmission>): Promise<LandingSubmission>;
  listLandingSubmissions(): Promise<LandingSubmission[]>;
  countLandingSubmissions(): Promise<number>;
  countLandingSubmissionsToday(): Promise<number>;

  // ── Directory pages ─────────────────────────────────────────────
  upsertDirectoryPage(data: InsertDirectoryPage): Promise<DirectoryPage>;
  getDirectoryPage(slug: string): Promise<DirectoryPage | undefined>;
  listDirectoryPages(opts?: { status?: string; limit?: number }): Promise<DirectoryPage[]>;
  publishDirectoryPage(slug: string): Promise<DirectoryPage>;
  blockDirectoryPage(slug: string): Promise<DirectoryPage>;
  forcePublishDirectoryPage(slug: string, reason: string): Promise<DirectoryPage>;
  addQueryPageVersion(v: InsertQueryPageVersion): Promise<QueryPageVersion>;
  createAgentInterest(data: InsertAgentInterest): Promise<AgentInterest>;
  countRunningSessions(): Promise<number>;
  createWaitlistEntry(website: string, email: string, submissionId?: number): Promise<void>;
  listWaitlistEntries(): Promise<AuditWaitlistEntry[]>;
}

export class DatabaseStorage implements IStorage {
  async createAnalysisResult(insertResult: InsertAnalysisResult): Promise<AnalysisResult> {
    const [result] = await db
      .insert(analysisResults)
      .values(insertResult)
      .returning();
    return result;
  }

  async getAnalysisHistory(): Promise<AnalysisResult[]> {
    return await db.select().from(analysisResults).orderBy(analysisResults.createdAt);
  }

  async createScoringJob(job: InsertScoringJob): Promise<ScoringJob> {
    const [result] = await db
      .insert(scoringJobs)
      .values(job)
      .returning();
    return result;
  }

  async updateScoringJob(id: number, updates: Partial<InsertScoringJob>): Promise<ScoringJob> {
    const [result] = await db
      .update(scoringJobs)
      .set(updates)
      .where(eq(scoringJobs.id, id))
      .returning();
    return result;
  }

  async getScoringJob(id: number): Promise<ScoringJob | undefined> {
    const [result] = await db
      .select()
      .from(scoringJobs)
      .where(eq(scoringJobs.id, id));
    return result;
  }

  async getScoringHistory(): Promise<ScoringJob[]> {
    return await db
      .select()
      .from(scoringJobs)
      .where(
        and(
          eq(scoringJobs.status, "completed"),
          or(isNull(scoringJobs.source), ne(scoringJobs.source, "v2segment"))
        )
      )
      .orderBy(desc(scoringJobs.createdAt))
      .limit(50);
  }

  async listSavedProfiles(): Promise<SavedProfile[]> {
    return await db
      .select()
      .from(savedProfiles)
      .orderBy(desc(savedProfiles.createdAt));
  }

  async upsertSavedProfile(profile: InsertSavedProfile): Promise<SavedProfile> {
    const [result] = await db
      .insert(savedProfiles)
      .values(profile)
      .onConflictDoNothing({ target: savedProfiles.brandName })
      .returning();
    if (result) return result;
    const [existing] = await db
      .select()
      .from(savedProfiles)
      .where(eq(savedProfiles.brandName, profile.brandName));
    return existing;
  }

  async createMultiSegmentSession(session: InsertMultiSegmentSession): Promise<MultiSegmentSession> {
    const [result] = await db
      .insert(multiSegmentSessions)
      .values(session)
      .returning();
    return result;
  }

  async listMultiSegmentSessions(): Promise<any[]> {
    const rows = await db
      .select({
        id: multiSegmentSessions.id,
        brandName: multiSegmentSessions.brandName,
        brandDomain: multiSegmentSessions.brandDomain,
        promptsPerSegment: multiSegmentSessions.promptsPerSegment,
        segmentsSummary: sql`(
          SELECT jsonb_agg(jsonb_build_object(
            'persona', elem->>'persona',
            'location', elem->>'location',
            'seedType', elem->>'seedType',
            'resultCount', (elem->>'resultCount')::int,
            'customerType', elem->>'customerType',
            'promptCount', CASE WHEN elem->'prompts' IS NOT NULL AND jsonb_typeof(elem->'prompts') = 'array' THEN jsonb_array_length(elem->'prompts') ELSE 0 END,
            'scoringResult', CASE WHEN elem->'scoringResult' IS NOT NULL THEN 'true'::jsonb ELSE 'null'::jsonb END
          ))
          FROM jsonb_array_elements(${multiSegmentSessions.segments}::jsonb) AS elem
        )`,
        createdAt: multiSegmentSessions.createdAt,
        sessionType: multiSegmentSessions.sessionType,
        parentSessionId: multiSegmentSessions.parentSessionId,
        competitorName: multiSegmentSessions.competitorName,
        parentBrandName: multiSegmentSessions.parentBrandName,
      })
      .from(multiSegmentSessions)
      .orderBy(desc(multiSegmentSessions.createdAt))
      .limit(50);
    return rows.map(r => ({
      id: r.id,
      brandName: r.brandName,
      brandDomain: r.brandDomain,
      promptsPerSegment: r.promptsPerSegment,
      segments: r.segmentsSummary || [],
      citationReport: null,
      createdAt: r.createdAt,
      sessionType: r.sessionType,
      parentSessionId: r.parentSessionId,
      competitorName: r.competitorName,
      parentBrandName: r.parentBrandName,
    }));
  }

  async getMultiSegmentSession(id: number): Promise<MultiSegmentSession | undefined> {
    const [result] = await db
      .select()
      .from(multiSegmentSessions)
      .where(eq(multiSegmentSessions.id, id));
    return result;
  }

  async getMultiSegmentSessionBySlug(slug: string): Promise<MultiSegmentSession | undefined> {
    const [result] = await db
      .select()
      .from(multiSegmentSessions)
      .where(eq(multiSegmentSessions.slug, slug))
      .orderBy(asc(multiSegmentSessions.id))
      .limit(1);
    return result;
  }

  async updateMultiSegmentSessionSlug(sessionId: number, slug: string): Promise<void> {
    await db
      .update(multiSegmentSessions)
      .set({ slug })
      .where(eq(multiSegmentSessions.id, sessionId));
  }

  async updateMultiSegmentSessionSegments(sessionId: number, segments: any): Promise<void> {
    await db
      .update(multiSegmentSessions)
      .set({ segments, cachedReport: null })
      .where(eq(multiSegmentSessions.id, sessionId));
  }

  async updateMultiSegmentSessionCost(sessionId: number, costBreakdown: any): Promise<void> {
    await db
      .update(multiSegmentSessions)
      .set({ costBreakdown })
      .where(eq(multiSegmentSessions.id, sessionId));
  }

  async listRunCosts(limit = 50): Promise<any[]> {
    const rows = await db
      .select({
        id: multiSegmentSessions.id,
        brandName: multiSegmentSessions.brandName,
        brandDomain: multiSegmentSessions.brandDomain,
        sessionType: multiSegmentSessions.sessionType,
        promptsPerSegment: multiSegmentSessions.promptsPerSegment,
        costBreakdown: multiSegmentSessions.costBreakdown,
        createdAt: multiSegmentSessions.createdAt,
      })
      .from(multiSegmentSessions)
      .orderBy(desc(multiSegmentSessions.createdAt))
      .limit(limit);
    return rows;
  }

  async updateCitationReport(sessionId: number, report: any): Promise<void> {
    await db
      .update(multiSegmentSessions)
      .set({ citationReport: report, cachedReport: null })
      .where(eq(multiSegmentSessions.id, sessionId));
  }

  async deleteMultiSegmentSession(id: number): Promise<void> {
    await db.delete(reportCache).where(
      or(
        eq(reportCache.cacheKey, `teaser:${id}`),
        eq(reportCache.cacheKey, `report:${id}`),
      )!
    );
    await db.delete(teaserLeads).where(eq(teaserLeads.sessionId, id));
    await db.delete(multiSegmentSessions).where(eq(multiSegmentSessions.id, id));
  }

  async createV2Config(config: InsertSavedV2Config): Promise<SavedV2Config> {
    const [result] = await db
      .insert(savedV2Configs)
      .values(config)
      .returning();
    return result;
  }

  async listV2Configs(): Promise<SavedV2Config[]> {
    return await db
      .select()
      .from(savedV2Configs)
      .orderBy(desc(savedV2Configs.createdAt))
      .limit(50);
  }

  async deleteV2Config(id: number): Promise<void> {
    await db.delete(savedV2Configs).where(eq(savedV2Configs.id, id));
  }

  async getV2SegmentGroups(): Promise<Array<{
    groupKey: string;
    brandName: string;
    brandDomain: string | null;
    segmentJobIds: number[];
    segments: ScoringJob[];
    createdAt: Date;
  }>> {
    const v2Jobs = await db
      .select()
      .from(scoringJobs)
      .where(eq(scoringJobs.source, "v2segment"))
      .orderBy(desc(scoringJobs.createdAt));

    if (v2Jobs.length === 0) return [];

    const groups: Array<{
      groupKey: string;
      brandName: string;
      brandDomain: string | null;
      segmentJobIds: number[];
      segments: ScoringJob[];
      createdAt: Date;
    }> = [];

    let currentGroup: typeof groups[number] | null = null;

    for (const job of v2Jobs) {
      const jobTime = job.createdAt ? new Date(job.createdAt).getTime() : 0;

      const lastJobInGroup = currentGroup ? currentGroup.segments[currentGroup.segments.length - 1] : null;
      const lastJobTime = lastJobInGroup?.createdAt ? new Date(lastJobInGroup.createdAt).getTime() : 0;

      if (
        currentGroup &&
        currentGroup.brandName.toLowerCase() === job.brandName.toLowerCase() &&
        Math.abs(jobTime - lastJobTime) < 10 * 60 * 1000
      ) {
        currentGroup.segmentJobIds.push(job.id);
        currentGroup.segments.push(job);
      } else {
        currentGroup = {
          groupKey: `v2auto-${job.id}`,
          brandName: job.brandName,
          brandDomain: job.brandDomain,
          segmentJobIds: [job.id],
          segments: [job],
          createdAt: job.createdAt ? new Date(job.createdAt) : new Date(),
        };
        groups.push(currentGroup);
      }
    }

    return groups;
  }

  async getV2SegmentGroup(groupKey: string): Promise<{
    groupKey: string;
    brandName: string;
    brandDomain: string | null;
    segmentJobIds: number[];
    segments: ScoringJob[];
    createdAt: Date;
  } | undefined> {
    const groups = await this.getV2SegmentGroups();
    return groups.find(g => g.groupKey === groupKey);
  }

  async updateCachedReport(sessionId: number, report: any): Promise<void> {
    await db
      .update(multiSegmentSessions)
      .set({ cachedReport: report })
      .where(eq(multiSegmentSessions.id, sessionId));
  }

  async getReportCache(cacheKey: string): Promise<any | null> {
    const [result] = await db
      .select()
      .from(reportCache)
      .where(eq(reportCache.cacheKey, cacheKey));
    return result?.reportData ?? null;
  }

  async setReportCache(cacheKey: string, data: any): Promise<void> {
    await db
      .insert(reportCache)
      .values({ cacheKey, reportData: data })
      .onConflictDoUpdate({
        target: reportCache.cacheKey,
        set: { reportData: data, createdAt: sql`NOW()` },
      });
  }

  async createTeaserLead(lead: InsertTeaserLead): Promise<TeaserLead> {
    const [result] = await db
      .insert(teaserLeads)
      .values(lead)
      .returning();
    return result;
  }

  async listTeaserLeads(): Promise<TeaserLead[]> {
    return db
      .select()
      .from(teaserLeads)
      .orderBy(desc(teaserLeads.createdAt));
  }

  async createSummaryLead(lead: InsertSummaryLead): Promise<SummaryLead> {
    const [result] = await db
      .insert(summaryLeads)
      .values(lead)
      .returning();
    return result;
  }

  async listSummaryLeads(): Promise<SummaryLead[]> {
    return db
      .select()
      .from(summaryLeads)
      .orderBy(desc(summaryLeads.createdAt));
  }

  async createIncomingLead(lead: InsertIncomingLead): Promise<IncomingLead> {
    const [result] = await db
      .insert(incomingLeads)
      .values(lead)
      .returning();
    return result;
  }

  async listIncomingLeads(): Promise<IncomingLead[]> {
    return db
      .select()
      .from(incomingLeads)
      .orderBy(desc(incomingLeads.receivedAt));
  }

  async updateIncomingLeadStatus(id: number, status: string): Promise<void> {
    await db
      .update(incomingLeads)
      .set({ status })
      .where(eq(incomingLeads.id, id));
  }

  async saveCitationMentions(sessionId: number, mentions: InsertCitationPageMention[]): Promise<void> {
    await db.delete(citationPageMentions).where(eq(citationPageMentions.sessionId, sessionId));
    if (mentions.length === 0) return;
    const CHUNK = 200;
    for (let i = 0; i < mentions.length; i += CHUNK) {
      await db.insert(citationPageMentions).values(mentions.slice(i, i + CHUNK));
    }
  }

  async getCitationMentions(sessionId: number): Promise<CitationPageMention[]> {
    return db
      .select()
      .from(citationPageMentions)
      .where(eq(citationPageMentions.sessionId, sessionId))
      .orderBy(citationPageMentions.url, citationPageMentions.brand, citationPageMentions.mentionIndex);
  }

  async createLandingSubmission(data: InsertLandingSubmission): Promise<LandingSubmission> {
    const [result] = await db.insert(landingSubmissions).values(data).returning();
    return result;
  }

  async getLandingSubmissionByDomain(domain: string, withinHours: number): Promise<LandingSubmission | undefined> {
    const cutoff = new Date(Date.now() - withinHours * 60 * 60 * 1000);
    const [result] = await db
      .select()
      .from(landingSubmissions)
      .where(
        and(
          eq(landingSubmissions.normalizedDomain, domain),
          sql`${landingSubmissions.createdAt} > ${cutoff}`
        )
      )
      .orderBy(desc(landingSubmissions.createdAt))
      .limit(1);
    return result;
  }

  async updateLandingSubmission(id: number, updates: Partial<InsertLandingSubmission>): Promise<LandingSubmission> {
    const [result] = await db
      .update(landingSubmissions)
      .set(updates)
      .where(eq(landingSubmissions.id, id))
      .returning();
    return result;
  }

  async listLandingSubmissions(): Promise<LandingSubmission[]> {
    return db
      .select()
      .from(landingSubmissions)
      .orderBy(desc(landingSubmissions.createdAt))
      .limit(100);
  }

  async countLandingSubmissions(): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(landingSubmissions);
    return row?.count ?? 0;
  }

  async countLandingSubmissionsToday(): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(landingSubmissions)
      .where(sql`${landingSubmissions.createdAt} >= now() - interval '24 hours'`);
    return row?.count ?? 0;
  }

  // ── Directory pages ─────────────────────────────────────────────

  /**
   * Create or update a directory page by canonical_slug.
   *
   * Immutability rules on conflict:
   *   - canonical_slug        → never updated (it's the conflict target)
   *   - first_published_at    → only set if currently NULL (COALESCE)
   *   - publish_status        → 'blocked' persists even on re-score; otherwise updated
   */
  async upsertDirectoryPage(data: InsertDirectoryPage): Promise<DirectoryPage> {
    const [row] = await db
      .insert(directoryPages)
      .values(data)
      .onConflictDoUpdate({
        target: directoryPages.canonicalSlug,
        set: {
          sessionId:         sql`EXCLUDED.session_id`,
          segmentIndex:      sql`EXCLUDED.segment_index`,
          rawQuery:          sql`EXCLUDED.raw_query`,
          // For published pages, canonical fields are frozen — never overwrite them.
          // This enforces slug/location/cluster immutability once a page is live.
          canonicalQuery:    sql`CASE WHEN directory_pages.publish_status = 'published' THEN directory_pages.canonical_query    ELSE EXCLUDED.canonical_query    END`,
          canonicalLocation: sql`CASE WHEN directory_pages.publish_status = 'published' THEN directory_pages.canonical_location ELSE EXCLUDED.canonical_location END`,
          clusterId:         sql`CASE WHEN directory_pages.publish_status = 'published' THEN directory_pages.cluster_id          ELSE EXCLUDED.cluster_id          END`,
          vertical:          sql`EXCLUDED.vertical`,
          dataVersion:       sql`EXCLUDED.data_version`,
          engineSet:         sql`EXCLUDED.engine_set`,
          evidenceScore:     sql`EXCLUDED.evidence_score`,
          brandCount:        sql`EXCLUDED.brand_count`,
          rankingSnapshot:   sql`EXCLUDED.ranking_snapshot`,
          lastUpdatedAt:     sql`NOW()`,
          // blocked status persists; first_published_at never regresses
          publishStatus: sql`CASE WHEN directory_pages.publish_status = 'blocked' THEN 'blocked' ELSE EXCLUDED.publish_status END`,
          firstPublishedAt:  sql`COALESCE(directory_pages.first_published_at, EXCLUDED.first_published_at)`,
        },
      })
      .returning();
    return row;
  }

  async getDirectoryPage(slug: string): Promise<DirectoryPage | undefined> {
    const [row] = await db
      .select()
      .from(directoryPages)
      .where(eq(directoryPages.canonicalSlug, slug));
    return row;
  }

  async listDirectoryPages(opts: { status?: string; limit?: number } = {}): Promise<DirectoryPage[]> {
    const { status, limit = 100 } = opts;
    return db
      .select()
      .from(directoryPages)
      .where(status ? eq(directoryPages.publishStatus, status) : undefined)
      .orderBy(desc(directoryPages.lastUpdatedAt))
      .limit(limit);
  }

  /** Promote a draft page to published. Sets first_published_at on first promotion. */
  async publishDirectoryPage(slug: string): Promise<DirectoryPage> {
    const [row] = await db
      .update(directoryPages)
      .set({
        publishStatus:    "published",
        firstPublishedAt: sql`COALESCE(first_published_at, NOW())`,
        lastUpdatedAt:    sql`NOW()`,
      })
      .where(and(
        eq(directoryPages.canonicalSlug, slug),
        ne(directoryPages.publishStatus, "blocked"),
      ))
      .returning();
    if (!row) throw new Error(`Cannot publish: page '${slug}' not found or is blocked`);

    // CDN PURGE HOOK — trigger after publish to invalidate stale edge caches.
    // Pages use Surrogate-Key headers: "geo-directory-page", "geo-directory-hub",
    // "geo-directory-brand", "geo-directory-comparison".
    // Sitemap routes use Cache-Control: no-cache and do not need purging.
    // To integrate: call your CDN purge API here (Cloudflare, Fastly, Varnish, etc.)
    //   e.g. await cloudflareApi.purgeByTag("geo-directory-page");
    //        await cloudflareApi.purgeByUrl(`https://example.com/${slug}`);

    return row;
  }

  /** Permanently block a page. Status persists through re-scoring. */
  async blockDirectoryPage(slug: string): Promise<DirectoryPage> {
    const [row] = await db
      .update(directoryPages)
      .set({ publishStatus: "blocked", lastUpdatedAt: sql`NOW()` })
      .where(eq(directoryPages.canonicalSlug, slug))
      .returning();
    if (!row) throw new Error(`Cannot block: page '${slug}' not found`);
    return row;
  }

  /**
   * Override quality gate — publish a failing segment.
   * Requires a non-empty reason (audit log).
   */
  async forcePublishDirectoryPage(slug: string, reason: string): Promise<DirectoryPage> {
    if (!reason || reason.trim().length < 3) {
      throw new Error("forcePublish requires a non-empty reason (min 3 chars)");
    }
    console.log(`[directory] force-publish '${slug}' — reason: ${reason.trim()}`);
    const [row] = await db
      .update(directoryPages)
      .set({
        publishStatus:    "published",
        firstPublishedAt: sql`COALESCE(first_published_at, NOW())`,
        lastUpdatedAt:    sql`NOW()`,
      })
      .where(eq(directoryPages.canonicalSlug, slug))
      .returning();
    if (!row) throw new Error(`forcePublish: page '${slug}' not found`);
    return row;
  }

  /** Append a version snapshot for a query page. */
  async addQueryPageVersion(v: InsertQueryPageVersion): Promise<QueryPageVersion> {
    const [row] = await db
      .insert(queryPageVersions)
      .values(v)
      .returning();
    return row;
  }

  async createAgentInterest(data: InsertAgentInterest): Promise<AgentInterest> {
    const [row] = await db.insert(agentInterest).values(data).returning();
    return row;
  }

  async countRunningSessions(): Promise<number> {
    const [row] = await db
      .select({ n: count() })
      .from(landingSubmissions)
      .where(eq(landingSubmissions.status, "running"));
    return Number(row?.n ?? 0);
  }

  async createWaitlistEntry(website: string, email: string, submissionId?: number): Promise<void> {
    await db.insert(auditWaitlist).values({ website, email, submissionId: submissionId ?? null });
  }

  async listWaitlistEntries(): Promise<AuditWaitlistEntry[]> {
    return db
      .select()
      .from(auditWaitlist)
      .orderBy(desc(auditWaitlist.createdAt))
      .limit(500);
  }
}

export const storage = new DatabaseStorage();

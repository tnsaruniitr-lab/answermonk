
import { db } from "./db";
import { and, desc, eq, isNull, ne, or } from "drizzle-orm";
import {
  analysisResults,
  scoringJobs,
  savedProfiles,
  multiSegmentSessions,
  savedV2Configs,
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

  async listMultiSegmentSessions(): Promise<MultiSegmentSession[]> {
    const rows = await db
      .select({
        id: multiSegmentSessions.id,
        brandName: multiSegmentSessions.brandName,
        brandDomain: multiSegmentSessions.brandDomain,
        promptsPerSegment: multiSegmentSessions.promptsPerSegment,
        segments: multiSegmentSessions.segments,
        createdAt: multiSegmentSessions.createdAt,
      })
      .from(multiSegmentSessions)
      .orderBy(desc(multiSegmentSessions.createdAt))
      .limit(50);
    return rows.map(r => ({ ...r, citationReport: null })) as MultiSegmentSession[];
  }

  async getMultiSegmentSession(id: number): Promise<MultiSegmentSession | undefined> {
    const [result] = await db
      .select()
      .from(multiSegmentSessions)
      .where(eq(multiSegmentSessions.id, id));
    return result;
  }

  async updateCitationReport(sessionId: number, report: any): Promise<void> {
    await db
      .update(multiSegmentSessions)
      .set({ citationReport: report })
      .where(eq(multiSegmentSessions.id, sessionId));
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
}

export const storage = new DatabaseStorage();

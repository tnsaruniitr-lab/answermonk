
import { db } from "./db";
import { desc, eq } from "drizzle-orm";
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
  createV2Config(config: InsertSavedV2Config): Promise<SavedV2Config>;
  listV2Configs(): Promise<SavedV2Config[]>;
  deleteV2Config(id: number): Promise<void>;
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
      .where(eq(scoringJobs.status, "completed"))
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
    return await db
      .select()
      .from(multiSegmentSessions)
      .orderBy(desc(multiSegmentSessions.createdAt))
      .limit(50);
  }

  async getMultiSegmentSession(id: number): Promise<MultiSegmentSession | undefined> {
    const [result] = await db
      .select()
      .from(multiSegmentSessions)
      .where(eq(multiSegmentSessions.id, id));
    return result;
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
}

export const storage = new DatabaseStorage();

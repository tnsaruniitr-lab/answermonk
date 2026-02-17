
import { db } from "./db";
import { desc, eq } from "drizzle-orm";
import {
  analysisResults,
  scoringJobs,
  type InsertAnalysisResult,
  type AnalysisResult,
  type InsertScoringJob,
  type ScoringJob,
} from "@shared/schema";

export interface IStorage {
  createAnalysisResult(result: InsertAnalysisResult): Promise<AnalysisResult>;
  getAnalysisHistory(): Promise<AnalysisResult[]>;
  createScoringJob(job: InsertScoringJob): Promise<ScoringJob>;
  updateScoringJob(id: number, updates: Partial<InsertScoringJob>): Promise<ScoringJob>;
  getScoringJob(id: number): Promise<ScoringJob | undefined>;
  getScoringHistory(): Promise<ScoringJob[]>;
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
}

export const storage = new DatabaseStorage();


import { db } from "./db";
import {
  analysisResults,
  type InsertAnalysisResult,
  type AnalysisResult
} from "@shared/schema";

export interface IStorage {
  createAnalysisResult(result: InsertAnalysisResult): Promise<AnalysisResult>;
  getAnalysisHistory(): Promise<AnalysisResult[]>;
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
}

export const storage = new DatabaseStorage();

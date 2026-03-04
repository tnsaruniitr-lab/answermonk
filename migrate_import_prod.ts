import { db } from "./server/db";
import { multiSegmentSessions } from "./shared/schema";
import { eq } from "drizzle-orm";
import fs from "fs";

async function importToProd() {
  const data = JSON.parse(fs.readFileSync("/tmp/united_seo_export.json", "utf8"));
  
  // Check if already exists in production by slug
  const existing = await db.select().from(multiSegmentSessions).where(eq(multiSegmentSessions.slug, "united-seo"));
  
  if (existing.length > 0) {
    console.log("Already exists with id:", existing[0].id);
    // Update it
    await db.update(multiSegmentSessions)
      .set({
        segments: data.segments,
        cachedReport: data.cachedReport,
        citationReport: data.citationReport,
      })
      .where(eq(multiSegmentSessions.slug, "united-seo"));
    console.log("Updated existing session");
  } else {
    // Insert - map parent session ID from dev (11) to production (3)
    const [inserted] = await db.insert(multiSegmentSessions).values({
      brandName: data.brandName,
      brandDomain: data.brandDomain,
      promptsPerSegment: data.promptsPerSegment,
      segments: data.segments,
      citationReport: data.citationReport,
      cachedReport: data.cachedReport,
      sessionType: data.sessionType,
      parentSessionId: 3, // SEO Sherpa is ID 3 in production
      competitorName: data.competitorName,
      parentBrandName: data.parentBrandName,
      slug: data.slug,
    }).returning();
    console.log("Inserted with id:", inserted.id);
  }
  
  process.exit(0);
}

importToProd().catch(e => { console.error(e); process.exit(1); });

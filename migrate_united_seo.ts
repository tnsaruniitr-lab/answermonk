import { db } from "./server/db";
import { multiSegmentSessions, reportCache } from "./shared/schema";
import { eq } from "drizzle-orm";
import fs from "fs";

async function migrate() {
  const [session] = await db.select().from(multiSegmentSessions).where(eq(multiSegmentSessions.id, 15));
  if (!session) {
    console.log("Session 15 not found");
    return;
  }
  console.log("Found:", session.brandName, "slug:", session.slug);
  console.log("Has cachedReport:", !!session.cachedReport);
  console.log("Has citationReport:", !!session.citationReport);
  
  const data = {
    brandName: session.brandName,
    brandDomain: session.brandDomain,
    promptsPerSegment: session.promptsPerSegment,
    segments: session.segments,
    citationReport: session.citationReport,
    cachedReport: session.cachedReport,
    sessionType: session.sessionType,
    parentSessionId: session.parentSessionId,
    competitorName: session.competitorName,
    parentBrandName: session.parentBrandName,
    slug: session.slug,
  };
  
  fs.writeFileSync("/tmp/united_seo_export.json", JSON.stringify(data));
  console.log("Exported, size:", JSON.stringify(data).length);
  process.exit(0);
}

migrate().catch(e => { console.error(e); process.exit(1); });

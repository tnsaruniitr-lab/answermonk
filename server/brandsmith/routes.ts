import type { Express, Request, Response } from "express";
import { db } from "../db";
import { brandsmithJobs, type BrandSection, type InsertBrandsmithJob } from "@shared/schema";
import { eq } from "drizzle-orm";


const MOCK_STEPS = [
  { step: "crawling", message: "Scanning homepage…", pct: 10 },
  { step: "crawling", message: "Reading about and pricing pages…", pct: 25 },
  { step: "researching", message: "Analysing competitors…", pct: 45 },
  { step: "researching", message: "Mapping market position…", pct: 60 },
  { step: "synthesizing", message: "Building brand profile…", pct: 80 },
  { step: "synthesizing", message: "Finalising cards…", pct: 95 },
];

function buildMockSections(websiteUrl: string): BrandSection[] {
  const domain = (() => {
    try { return new URL(websiteUrl).hostname.replace(/^www\./, ""); }
    catch { return websiteUrl; }
  })();
  const brand = domain.split(".")[0];
  const brandName = brand.charAt(0).toUpperCase() + brand.slice(1);

  return [
    {
      section: "identity",
      title: "Brand Identity",
      card_order: 0,
      ai_confidence: 0.82,
      user_edited: false,
      data: {
        brand_name: brandName,
        tagline: "Mock tagline — AI-generated placeholder",
        mission: "To deliver exceptional value through innovative solutions.",
        description: `${brandName} is a technology company focused on solving complex problems for modern teams.`,
        founding_story: "Founded with a vision to simplify how teams work.",
        founder: "Founder Name",
        hq: "San Francisco, CA",
        company_size: "11–50 employees",
        funding_stage: "Seed",
      },
    },
    {
      section: "product",
      title: "Product & Offerings",
      card_order: 1,
      ai_confidence: 0.78,
      user_edited: false,
      data: {
        core_products: ["Core Platform", "API Access", "Enterprise Suite"],
        key_features: ["Real-time collaboration", "Advanced analytics", "Integrations hub"],
        pricing_model: "Freemium with paid tiers",
        tech_stack: ["React", "Node.js", "PostgreSQL"],
        integrations: ["Slack", "Zapier", "HubSpot"],
      },
    },
    {
      section: "audience",
      title: "Target Audience",
      card_order: 2,
      ai_confidence: 0.75,
      user_edited: false,
      data: {
        icp: "Mid-market SaaS companies with 50–500 employees",
        buyer_personas: ["VP of Operations", "Head of Product", "Growth Lead"],
        pain_points: ["Manual processes slowing teams", "Lack of visibility across departments", "Scaling without adding headcount"],
        jobs_to_be_done: ["Automate repetitive workflows", "Report on progress without manual work"],
        target_industries: ["SaaS", "Fintech", "E-commerce"],
        target_geos: ["North America", "Western Europe"],
      },
    },
    {
      section: "competitive_landscape",
      title: "Competitive Landscape",
      card_order: 3,
      ai_confidence: 0.71,
      user_edited: false,
      data: {
        competitors: [
          { name: "Competitor A", url: "https://competitora.com", overlap: "High" },
          { name: "Competitor B", url: "https://competitorb.com", overlap: "Medium" },
          { name: "Competitor C", url: "https://competitorc.com", overlap: "Low" },
        ],
        positioning_statement: `${brandName} helps operations teams move faster by replacing manual workflows with intelligent automation.`,
        differentiators: ["Easiest onboarding in category", "Native integrations vs plug-ins", "Usage-based pricing"],
        market_category: "Workflow Automation",
      },
    },
    {
      section: "voice_and_tone",
      title: "Brand Voice & Tone",
      card_order: 4,
      ai_confidence: 0.80,
      user_edited: false,
      data: {
        voice_attributes: ["Clear", "Confident", "Human", "Helpful"],
        tone_do: ["Use plain language", "Lead with outcomes", "Celebrate the user's win"],
        tone_dont: ["Use jargon", "Sound corporate", "Over-promise"],
        banned_phrases: ["leverage synergies", "best-in-class", "disruptive"],
        content_pillars: ["Efficiency", "Visibility", "Growth"],
        naming_rules: "Product names are title case. Features are lowercase in context.",
      },
    },
    {
      section: "digital_presence",
      title: "Digital Presence",
      card_order: 5,
      ai_confidence: 0.88,
      user_edited: false,
      data: {
        website_url: websiteUrl,
        social_profiles: {
          linkedin: `https://linkedin.com/company/${brand}`,
          twitter: `https://twitter.com/${brand}`,
        },
        press_mentions: ["TechCrunch coverage (mock)", "Product Hunt launch (mock)"],
        testimonial_themes: ["Time saved", "Easy to set up", "Great support"],
        site_nav: ["Home", "Product", "Pricing", "Blog", "About"],
        footer_nav: ["Privacy", "Terms", "Careers", "Contact"],
      },
    },
    {
      section: "seo_content_strategy",
      title: "SEO & Content Strategy",
      card_order: 6,
      ai_confidence: 0.73,
      user_edited: false,
      data: {
        primary_keywords: [`${brand} software`, `${brand} platform`, `best ${brand} alternative`],
        secondary_keywords: ["workflow automation", "team productivity tool", "operations software"],
        content_themes: ["How-to guides", "Case studies", "Comparison posts"],
        target_queries: ["how to automate team workflows", "best ops tools for startups"],
        existing_content_urls: [`${websiteUrl}/blog`, `${websiteUrl}/resources`],
      },
    },
  ];
}

export function registerBrandsmithRoutes(app: Express) {
  // --- MOCK ENDPOINTS (used when VITE_BRANDSMITH_API_URL is unset) ---

  app.post("/api/brandsmith/mock/research", (req: Request, res: Response) => {
    const { website_url } = req.body;
    if (!website_url) {
      return res.status(400).json({ error: "website_url is required" });
    }
    const jobId = crypto.randomUUID();
    (global as any).__brandsmithMockJobs = (global as any).__brandsmithMockJobs || {};
    (global as any).__brandsmithMockJobs[jobId] = { websiteUrl: website_url, createdAt: Date.now() };
    return res.json({ job_id: jobId });
  });

  app.get("/api/brandsmith/mock/research/:jobId/stream", (req: Request, res: Response) => {
    const { jobId } = req.params;
    const store = (global as any).__brandsmithMockJobs || {};
    const job = store[jobId];
    const websiteUrl = job?.websiteUrl || "https://example.com";

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < MOCK_STEPS.length) {
        const s = MOCK_STEPS[stepIndex];
        res.write(`event: status\ndata: ${JSON.stringify(s)}\n\n`);
        stepIndex++;
      } else {
        clearInterval(interval);
        const sections = buildMockSections(websiteUrl);
        res.write(`event: complete\ndata: ${JSON.stringify({ job_id: jobId, sections })}\n\n`);
        res.end();
      }
    }, 1800);

    req.on("close", () => clearInterval(interval));
  });

  // --- PERSISTENCE ENDPOINTS (save/retrieve results in this app's DB) ---

  app.post("/api/brandsmith/jobs", async (req: Request, res: Response) => {
    try {
      const { jobId, sessionId, websiteUrl, sections } = req.body;
      if (!jobId || !sessionId || !websiteUrl) {
        return res.status(400).json({ error: "jobId, sessionId, websiteUrl required" });
      }
      const existing = await db.select().from(brandsmithJobs).where(eq(brandsmithJobs.jobId, jobId)).limit(1);
      if (existing.length > 0) {
        return res.json(existing[0]);
      }
      const [saved] = await db.insert(brandsmithJobs).values({
        jobId,
        sessionId,
        websiteUrl,
        sections: sections ?? [],
        status: "complete",
      } as InsertBrandsmithJob).returning();
      return res.json(saved);
    } catch (err: any) {
      console.error("[brandsmith/jobs POST]", err.message);
      return res.status(500).json({ error: "Failed to save job" });
    }
  });

  app.get("/api/brandsmith/jobs/:jobId", async (req: Request, res: Response) => {
    try {
      const [job] = await db.select().from(brandsmithJobs).where(eq(brandsmithJobs.jobId, req.params.jobId)).limit(1);
      if (!job) return res.status(404).json({ error: "Not found" });
      return res.json(job);
    } catch (err: any) {
      console.error("[brandsmith/jobs GET]", err.message);
      return res.status(500).json({ error: "Failed to retrieve job" });
    }
  });

  app.get("/api/brandsmith/jobs", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.query;
      if (!sessionId) return res.status(400).json({ error: "sessionId required" });
      const jobs = await db.select().from(brandsmithJobs)
        .where(eq(brandsmithJobs.sessionId, sessionId as string))
        .orderBy(brandsmithJobs.createdAt);
      return res.json(jobs);
    } catch (err: any) {
      console.error("[brandsmith/jobs list]", err.message);
      return res.status(500).json({ error: "Failed to list jobs" });
    }
  });

  app.post("/api/brandsmith/jobs/:jobId/confirm", async (req: Request, res: Response) => {
    try {
      const [updated] = await db.update(brandsmithJobs)
        .set({ confirmedAt: new Date() })
        .where(eq(brandsmithJobs.jobId, req.params.jobId))
        .returning();
      if (!updated) return res.status(404).json({ error: "Not found" });
      return res.json(updated);
    } catch (err: any) {
      console.error("[brandsmith/confirm]", err.message);
      return res.status(500).json({ error: "Failed to confirm" });
    }
  });

  app.put("/api/brandsmith/jobs/:jobId/cards", async (req: Request, res: Response) => {
    try {
      const { sections } = req.body;
      if (!sections) return res.status(400).json({ error: "sections required" });
      const [updated] = await db.update(brandsmithJobs)
        .set({ sections })
        .where(eq(brandsmithJobs.jobId, req.params.jobId))
        .returning();
      if (!updated) return res.status(404).json({ error: "Not found" });
      return res.json(updated);
    } catch (err: any) {
      console.error("[brandsmith/cards PUT]", err.message);
      return res.status(500).json({ error: "Failed to update cards" });
    }
  });
}

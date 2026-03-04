# GEO MVP - AI Brand Presence Analyzer

## Overview

This project is a **GEO (Generative Engine Optimization) MVP**—a full-stack web application designed to analyze a brand's presence in AI-generated recommendations across multiple AI engines (ChatGPT, Gemini, Claude, DeepSeek). Users input a search query and a brand name, and the system queries various AI engines to assess the brand's appearance in their recommendations. The results are then aggregated into presence and rank scores, utilizing configurable weights and rank decay functions.

The application aims to provide insights into how effectively a brand is being recommended by leading AI models, offering valuable data for optimizing brand visibility in the evolving landscape of AI-driven search and recommendations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application adopts a monorepo structure, separating concerns into `client/` (React SPA), `server/` (Express API), and `shared/` (common types and schemas).

### Frontend
- **Framework**: React 18 with TypeScript and Vite.
- **UI/UX**: Utilizes `shadcn/ui` (new-york style) built on Radix UI, styled with Tailwind CSS, and uses Framer Motion for animations. Recharts is used for data visualization.
- **State Management**: TanStack React Query for server state, local React state for forms.
- **Routing**: Wouter for client-side routing across Analyzer, History, and Prompt Generator pages.

### Backend
- **Framework**: Express.js with Node.js and TypeScript.
- **API Design**: RESTful JSON API with Zod for robust request/response validation.
- **AI Engine Integration**: Interfaces with OpenAI and Anthropic SDKs to query AI models like ChatGPT, Gemini, Claude, and DeepSeek.
- **Scoring Algorithms**:
    - **Presence Scoring**: Weighted average of presence states (absent, weak, strong).
    - **Rank Scoring**: Employs a rank decay formula (e.g., `1/pos^p`).
    - **GEO Scoring Service**: A probabilistic scoring pipeline for comprehensive brand analysis, including appearance rates, average rank, and competitor shares. It supports both Quick (10 prompts) and Full (40 prompts) analysis modes across multiple AI engines.
- **Prompt Generator**: Deterministically generates 40 vendor-seeking search prompts based on buyer intent profiles and predefined templates. Supports multiple persona types: marketing_agency, seo_agency, performance_marketing_agency, content_marketing_agency, social_media_agency, web_design_agency, pr_agency, branding_agency, digital_marketing_agency, automation_consultant, corporate_cards_provider, expense_management_software, accounting_automation, invoice_management, restaurant, construction_management, in_home_healthcare, at_home_healthcare, weight_loss_help, in_home_blood_tests, at_home_blood_tests. Healthcare personas support a blank seed type option for cleaner prompt phrasing. V2 Quick mode supports a Service Type dropdown (optional qualifier like "specializing in SEO") and a Customer Type toggle (enable/disable) per segment.
- **Insights & Recommender**: A post-scoring module that analyzes citations, classifies sources, identifies user intent, detects elimination signals, and generates actionable insight cards. It includes a sophisticated crawler and classifier for web content analysis. Action recommender filters T4 (competitor-owned) domains from all recommendations.
- **Citation Crawler**: `server/crawler.ts` crawls citation URLs with 20 concurrent connections, 30-second per-URL timeout (prevents hangs), and detailed progress logging (batch progress, success/fail counts). Progress is exposed via `GET /api/segment-analysis/progress/:key` for real-time polling from the frontend. The `SegmentCitationAnalyzer` component shows a progress bar with step labels, percentage, and crawl detail during analysis. Final results display success/fail counts.
- **Segment Citation Analyzer**: Provides post-scoring citation analysis to explain brand ranking differences across various segments, using detailed source classification, intent dictionaries, and comparative scoring.
- **Competitor Playbook**: Report section analyzing top 3 competitors per segment — LLM-powered narrative analysis (GPT-4o-mini via `server/report/competitor-narrative.ts`), quickStats strip (mentions, authority sources, avg rank, top themes, best prompt-match preview), positioning themes (cross-engine consistency), verbatim AI quotes extracted via sentence-level analysis, authority sources with expandable links, social/community mentions (Reddit, Trustpilot etc.), high-frequency source analysis per segment (domains backing 2+ competitors with actionables), and derived actionable recommendations. All 12 competitor narratives generated in parallel. Gemini grounding URLs (`vertexaisearch.cloud.google.com`) are resolved to actual destination domains at report time via `server/report/grounding-resolver.ts` (HEAD request redirect following, cached, 285 URLs resolved in ~5s).
- **Impact Summary Report**: A standalone summary page (`/summary/:id`) providing a high-impact overview of the full GEO analysis. Supports both numeric session IDs and group key sessions (`v2auto-*`). Includes: Brand Visibility Scorecard (per-engine rates with visual bars), What Top Scorers Are Doing Right (top 3 competitors with full narrative, non-brand source URLs, social mentions, mention counts, avg rank, themes), Brand Mention Audit (brand vs competitor source counts by type — publications, social, directories), Biggest Gaps (weakest segments with verbatim AI quotes), Quick Wins (ranked actionable steps), and Authority Source Snapshot (top 25 domains with entity mentions and brand presence check). Group key sessions use `GET /api/scoring/v2-groups/:groupKey/report` endpoint.
- **Web Search Grounding Tracking**: Monitors and reports whether AI model responses were grounded in web searches, providing transparency into the AI's information retrieval process.
- **Cost Tracking**: Per-segment and session-level cost tracking across all 3 AI engines (ChatGPT, Gemini, Claude) plus LLM extraction calls. Model pricing defined in `MODEL_PRICING` map in `server/scoring/runner.ts`. Costs displayed per-segment (inline beneath score cards) and as a session total summary card. Token usage captured from all API responses including error fallback paths.
- **Engine Selection**: Brand-level engine toggles (ChatGPT, Gemini, Claude checkboxes) in V2 mode. At least 1 engine must remain enabled. Applies to all segments uniformly. Fewer engines = proportionally lower cost. State resets on "Start Fresh".
- **Competitor Lens**: Zero-cost competitor analysis using existing raw run data. `server/scoring/competitor-lens.ts` re-scores any competitor as if they were the target brand. Shows full scorecard (appearance %, top 3 %, avg rank), per-engine breakdown, head-to-head comparison table (brand vs competitor per segment with win/loss highlighting), strongest prompt clusters, verbatim AI quotes, and co-appearing brands. Segments where competitor wasn't found show "~0% (not in top 10)". API: `POST /api/competitor-lens/list` and `POST /api/competitor-lens/analyse`. Frontend: collapsible section with competitor dropdown in V2 mode. Includes "Generate Full Report" button that produces a complete GEO report from the competitor's perspective via `POST /api/competitor-lens/report` (re-scores all segments and feeds into the standard `generateReport` pipeline). Report displays inline with visibility scorecard, engine breakdown, top competitors, quick wins, gap analysis, and competitor playbook.

### Database
- **Type**: PostgreSQL, accessed via `DATABASE_URL`.
- **ORM**: Drizzle ORM for schema management and data access.
- **Schema**: Includes tables for `analysis_results`, `scoring_jobs` (for GEO scoring runs), `multi_segment_sessions` (V2 analysis sessions with per-segment scoring results, cached reports), `saved_v2_configs` (for reusable multi-segment configurations), and `report_cache` (key-value cache for group key session reports).
- **Session Management**: V2 sessions support per-segment re-run (re-score individual segments without re-running the entire analysis) and incremental segment addition (add new segments to an existing session). Sessions auto-save via PATCH endpoint (`/api/multisegment/sessions/:id/segments`). Loaded sessions show an "Editing session #N" indicator with a "Start Fresh" button.
- **Report Caching**: Full GEO reports are persisted after first generation. Numeric sessions use `cached_report` JSONB column on `multi_segment_sessions`. Group key sessions use `report_cache` table with key `group:{groupKey}:report`. Cache is automatically invalidated when segments or citation reports update. Frontend checks cache first (`?cached_only=true`) — if cached, loads instantly; if not, shows "Generate Full Report" button. Users can force regeneration via "Regenerate" button (`?force=true`). Impact Summary page also benefits from backend caching.

### Build System
- **Development**: Uses `tsx` for the server and Vite for the client with HMR.
- **Production**: Vite builds the client, and esbuild bundles the server.

### Replit Integrations
- Provides auxiliary modules for Replit AI features such as Chat, Audio, and Image generation.

## External Dependencies

### Required Services
- **PostgreSQL Database**: Essential for data storage and retrieval.
- **OpenAI API**: For integrating with ChatGPT and potentially DeepSeek.
- **Anthropic API**: For integrating with Claude.

### Key npm Dependencies
- `drizzle-orm`, `drizzle-kit`: Database ORM and migration.
- `openai`, `@anthropic-ai/sdk`: AI model SDKs.
- `express`: Backend web framework.
- `zod`, `drizzle-zod`: Schema validation.
- `@tanstack/react-query`: Client-side data fetching.
- `framer-motion`: UI animations.
- `recharts`: Data visualization.
- `wouter`: Client-side routing.

### Authentication & Sharing
- **Auth System**: Password-based admin gate using `ADMIN_PASSWORD` env var. Cookie-based (`geo_admin_token`), in-memory token store (resets on server restart — re-login required). All `/api/*` routes require auth except `/api/auth/*`, `/api/multi-segment-sessions/:id/report`, and `/api/share/teaser/:id` (public for share links).
- **Share Links**: `/share/summary/:id` renders SummaryReport without internal navigation (no "Full Report" back button, no admin links). `/share/teaser/:id` renders ProspectTeaser dark-themed page. Both use public API endpoints. Share links work without login.
- **Prospect Teaser**: Dark-themed shareable teaser page (`client/src/pages/ProspectTeaser.tsx`) showing a brand's AI visibility analysis in a compelling format with aggressively locked/blurred sections (~70% shaded). Restructured layout: Score Card → Engine Split → "What Top Players Are Doing Right" (2 visible, rest locked) → "Key Actions For You" (1 visible, rest locked) → Competitive Ranking → Quote Contrast (1 comp + brand, rest locked) → Brand Voice (1 card visible) → Segments (1 row visible) → Authority Gap (1 row visible) → Prompts (1 visible) → Social (fully locked) → Citation Footprint → CTA. Section numbers (01-13) as faint markers. Backend generates `topPlayerInsights` (competitor advantages from T1 sources, engine consistency, narrative strength, segment dominance) and `keyActions` (prioritized fixes: engine gaps, missing sources, narrative positioning, segment opportunities, social presence). Data generated from existing session data via `server/report/teaser-generator.ts` (no extra AI calls). Cached in `report_cache` with key `teaser:{sessionId}`. API: `POST /api/multi-segment-sessions/:id/teaser` (auth, generates + caches), `GET /api/share/teaser/:id` (public, generates if not cached). Button in V2SessionDetail and History page for all scored sessions.
- **Competitor Dedup**: All competitor ranking displays merge name variants (e.g. "NEXA" / "Digital Nexa") into a single entry. Backend (report/teaser generators) recounts from raw_runs data for accurate unique run counts. Frontend uses shared utility `client/src/lib/competitor-merge.ts` with two functions: `mergeCompetitors` (recounts from raw_runs, used in V2SessionDetail) and `deduplicateStoredCompetitors` (merges stored entries, used in ScoringDetail/PromptGenerator). The scorer (`server/scoring/scorer.ts`) also has its own dedup for future scoring runs.
- **Login Page**: `client/src/pages/Login.tsx` — simple password form, gates all non-share frontend routes.
- **Frontend Auth Gate**: `client/src/App.tsx` — checks `/api/auth/check` on load, shows Login or AdminRouter/PublicRouter accordingly.

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string.
- `ADMIN_PASSWORD`: Admin password for accessing the full tool (required).
- `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`: OpenAI API credentials.
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY`, `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`: Anthropic API credentials.
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
- **Prompt Generator**: Deterministically generates 40 vendor-seeking search prompts based on buyer intent profiles and predefined templates. Supports multiple persona types: marketing_agency, seo_agency, performance_marketing_agency, content_marketing_agency, social_media_agency, web_design_agency, pr_agency, branding_agency, digital_marketing_agency, automation_consultant, corporate_cards_provider, expense_management_software, accounting_automation, invoice_management, credit_management_software, restaurant, construction_management, in_home_healthcare, at_home_healthcare, weight_loss_help, in_home_blood_tests, at_home_blood_tests. Healthcare personas support a blank seed type option for cleaner prompt phrasing. V2 Quick mode supports a Service Type dropdown (optional qualifier like "specializing in SEO") and a Customer Type toggle (enable/disable) per segment.
- **Insights & Recommender**: A post-scoring module that analyzes citations, classifies sources, identifies user intent, detects elimination signals, and generates actionable insight cards. It includes a sophisticated crawler and classifier for web content analysis. Action recommender filters T4 (competitor-owned) domains from all recommendations.
- **Citation Crawler**: `server/crawler.ts` crawls citation URLs with 20 concurrent connections, 30-second per-URL timeout (prevents hangs), and detailed progress logging (batch progress, success/fail counts). Progress is exposed via `GET /api/segment-analysis/progress/:key` for real-time polling from the frontend. The `SegmentCitationAnalyzer` component shows a progress bar with step labels, percentage, and crawl detail during analysis. Final results display success/fail counts.
- **Segment Citation Analyzer**: Provides post-scoring citation analysis to explain brand ranking differences across various segments, using detailed source classification, intent dictionaries, and comparative scoring.
- **Competitor Playbook**: Report section analyzing top 3 competitors per segment — LLM-powered narrative analysis (GPT-4o-mini via `server/report/competitor-narrative.ts`), quickStats strip (mentions, authority sources, avg rank, top themes, best prompt-match preview), positioning themes (cross-engine consistency), verbatim AI quotes extracted via sentence-level analysis, authority sources with expandable links, social/community mentions (Reddit, Trustpilot etc.), high-frequency source analysis per segment (domains backing 2+ competitors with actionables), and derived actionable recommendations. All 12 competitor narratives generated in parallel. Gemini grounding URLs (`vertexaisearch.cloud.google.com`) are resolved to actual destination domains at report time via `server/report/grounding-resolver.ts` (HEAD request redirect following, cached, 285 URLs resolved in ~5s).
- **Lead Capture CTA**: The Strategic Action Plan section on share/public views (`/share/summary/:id`) shows 1 preview action card, then a locked CTA overlay prompting visitors to enter their email to "Unlock Your Full AI Action Plan." Emails are captured to the `summary_leads` table via `POST /api/share/summary-lead` (public, no auth). Admin views (`/summary/:id`) show the full action plan unlocked. All leads (summary + teaser) viewable via `GET /api/leads` (admin-protected).
- **Impact Summary Report**: A standalone summary page (`/summary/:id`) providing a high-impact overview of the full GEO analysis. Supports both numeric session IDs and group key sessions (`v2auto-*`). Includes: Brand Visibility Scorecard (per-engine rates with visual bars), What Top Scorers Are Doing Right (top 3 competitors with full narrative, non-brand source URLs, social mentions, mention counts, avg rank, themes), Brand Mention Audit (brand vs competitor source counts by type — publications, social, directories), Biggest Gaps (weakest segments with verbatim AI quotes), Quick Wins (ranked actionable steps), and Authority Source Snapshot (top 25 domains with entity mentions and brand presence check). Group key sessions use `GET /api/scoring/v2-groups/:groupKey/report` endpoint. **Segment Categorization**: When a session has segments spanning multiple dimensions (service types and/or customer types), the "Who Shows Up" section auto-groups segments into 4 collapsible categories: General Search, By Service Type, By Customer Type, and By Service + Customer Niche. Each category bar shows aggregate stats (brand visibility %, avg rank, top 3 competitors with rates). Falls back to flat grid for simple sessions with only 1 category. **Segment badges**: Cards show indigo service-type and amber customer-type badges beneath the label. **Collapsible lists**: Long data lists across all sections collapse with "Show all X items" toggles — TopScorers sources/social (3 initial), Brand Audit sources (5 initial), Strategic Action Plan (3 initial actions), target domains (4 initial), Authority Snapshot table (10 initial rows). Uses shared `CollapsibleList` component.
- **Web Search Grounding Tracking**: Monitors and reports whether AI model responses were grounded in web searches, providing transparency into the AI's information retrieval process.
- **Cost Tracking**: Per-segment and session-level cost tracking across all 3 AI engines (ChatGPT, Gemini, Claude) plus LLM extraction calls. Model pricing defined in `MODEL_PRICING` map in `server/scoring/runner.ts`. Costs displayed per-segment (inline beneath score cards) and as a session total summary card. Token usage captured from all API responses including error fallback paths.
- **Engine Selection**: Brand-level engine toggles (ChatGPT, Gemini, Claude checkboxes) in V2 mode. At least 1 engine must remain enabled. Applies to all segments uniformly. Fewer engines = proportionally lower cost. State resets on "Start Fresh".
- **Competitor Lens**: Zero-cost competitor analysis using existing raw run data. `server/scoring/competitor-lens.ts` re-scores any competitor as if they were the target brand. Shows full scorecard (appearance %, top 3 %, avg rank), per-engine breakdown, head-to-head comparison table (brand vs competitor per segment with win/loss highlighting), strongest prompt clusters, verbatim AI quotes, and co-appearing brands. Segments where competitor wasn't found show "~0% (not in top 10)". API: `POST /api/competitor-lens/list` and `POST /api/competitor-lens/analyse`. Frontend: collapsible section with competitor dropdown in V2 mode. Also supports **custom business name input** — user can type any business name (not just those found in results) and check its visibility. When a business has 0% appearance, a "Zero AI Visibility" banner is shown with messaging about the business being invisible to AI. Full report and teaser generation still work for 0% businesses — report includes `meta.zeroVisibility` flag, teaser shows "Negligible visibility" copy. Includes "Generate Full Report" button that produces a complete GEO report from the competitor's perspective via `POST /api/competitor-lens/report` (re-scores all segments and feeds into the standard `generateReport` pipeline). Report displays inline with visibility scorecard, engine breakdown, top competitors, quick wins, gap analysis, and competitor playbook.

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
- **Share Links**: `/share/summary/:id` renders SummaryReport without internal navigation (no "Full Report" back button, no admin links). `/share/teaser/:id` renders ProspectTeaser dark-themed page. Both use public API endpoints. Share links work without login. `/audit/:slug` renders the Impact Summary report via slug lookup (e.g., `/audit/blue-beetle` for session 44). Uses existing `getMultiSegmentSessionBySlug` + `/api/share/summary/by-slug/:slug` endpoint. Hides "Full Report" back button for clean prospect-facing view. Slugs set via `POST /api/multisegment/sessions/:id/slug` (admin-protected). Previous teaser URLs at `/share/teaser/` and `/:slug` remain untouched.
- **Prospect Teaser**: Dark-themed shareable teaser page (`client/src/pages/ProspectTeaser.tsx`) showing a brand's AI visibility analysis in a compelling format with aggressively locked/blurred sections (~70% shaded). Restructured layout: Score Card → Engine Split → "What Top Players Are Doing Right" (2 visible, rest locked) → "Key Actions For You" (1 visible, rest locked) → Competitive Ranking → Quote Contrast (1 comp + brand, rest locked) → Brand Voice (1 card visible) → Segments (1 row visible) → Authority Gap (1 row visible) → Prompts (1 visible) → Social (fully locked) → Citation Footprint → CTA. Section numbers (01-13) as faint markers. Backend generates `topPlayerInsights` (competitor advantages from T1 sources, engine consistency, narrative strength, segment dominance) and `keyActions` (prioritized fixes: engine gaps, missing sources, narrative positioning, segment opportunities, social presence). Data generated from existing session data via `server/report/teaser-generator.ts` (no extra AI calls). Cached in `report_cache` with key `teaser:{sessionId}`. API: `POST /api/multi-segment-sessions/:id/teaser` (auth, generates + caches), `GET /api/share/teaser/:id` (public, generates if not cached). Button in V2SessionDetail and History page for all scored sessions.
- **Batch Competitor Impact Summaries**: Multi-select competitors in the Competitor Lens section, click "Generate Impact Summaries" to create reports sequentially with live SSE progress. Auto-generates slugs (e.g., `nexa`, `digital-gravity`), handles slug collisions with suffix, skips duplicates. Results panel shows `/audit/{slug}` links with copy and view buttons. Backend: `POST /api/competitor-lens/batch-reports` (admin-protected, SSE streaming). Frontend: checkbox grid in PromptGenerator.tsx Competitor Lens section.
- **Competitor Dedup**: All competitor ranking displays merge name variants (e.g. "NEXA" / "Digital Nexa") into a single entry. Backend (report/teaser generators) recounts from raw_runs data for accurate unique run counts. Frontend uses shared utility `client/src/lib/competitor-merge.ts` with two functions: `mergeCompetitors` (recounts from raw_runs, used in V2SessionDetail) and `deduplicateStoredCompetitors` (merges stored entries, used in ScoringDetail/PromptGenerator). The scorer (`server/scoring/scorer.ts`) also has its own dedup for future scoring runs.
- **Login Page**: `client/src/pages/Login.tsx` — simple password form, gates all non-share frontend routes.
- **Frontend Auth Gate**: `client/src/App.tsx` — checks `/api/auth/check` on load, shows Login or AdminRouter/PublicRouter accordingly.

### Citation Page Mentions (Brand Context Extraction)
- **Table**: `citation_page_mentions` — stores per-URL brand context windows (±35 words around each brand mention) extracted during the Analyse Sources crawl.
- **Schema**: `id`, `session_id`, `url`, `domain`, `brand`, `mention_index`, `context` (±35-word window), `source_type` (list_item/table_row/heading/paragraph/ai_fallback), `page_title`, `fetch_status` (crawled/ai_fallback/failed), `created_at`.
- **Persistence**: After each Analyse Sources run (when a `sessionId` is present), `runSegmentAnalysis` saves up to 5 deduplicated mentions per brand per URL. Failed-to-crawl URLs use the AI engine's own response text as fallback (`ai_fallback`), giving a secondary context source.
- **API**: `GET /api/multi-segment-sessions/:id/citation-mentions` (auth-required) returns all stored mentions for a session.
- **Live Crawl Counter**: During crawling, the progress payload now includes `crawlDone`, `crawlTotal`, `crawlSuccess`, `crawlFailed` fields. The `SegmentCitationAnalyzer` component renders these as a real-time counter (X/Y done · N ok · N failed) during the crawling step.

### Brand AI Memory (`/brand-intelligence`)
- **Route**: `/brand-intelligence` — standalone page, admin-gated
- **Purpose**: Diagnose what AI engines reliably know about a brand across 14 structured attributes
- **Three analysis modes**:
  - **Recall**: Samples the AI N times with varied query framings. Aggregates per-attribute confidence (% of informative runs) and coherence (% of runs agreeing on the same value). Expandable per-run chips show every raw answer. Coherence dots (green/yellow/red) flag identity instability.
  - **Packet**: User fills in ideal attribute values or loads a template (Healthcare — UAE). After sampling, a single LLM call semantically scores each attribute against the ideal (aligned/inconsistent/misaligned/absent). Concept coverage breakdown for the ideal identity statement.
  - **Benchmark**: No manual input needed. Brand is scored against a hardcoded winner knowledge graph (6 UAE home healthcare leaders: Manzil Health, Emirates Home Nursing, First Response Healthcare, Vesta Care, Nightingale Health Services, Call Doctor UAE). Single LLM call produces per-attribute gap classifications (exceeds/aligned/underspecified/outside), brand identity summary, and wedge collision check. Category Presence Score (weighted average) and Identity Coherence Score (average per-attribute coherence) displayed prominently.
- **Knowledge Graph**: `server/brand-intelligence/knowledge-graph.ts` — 14 attributes mapped with tier (floor/signal/differentiator), frequency, canonical value, alternatives, and human-readable description for LLM prompts.
- **DB Schema**: `brand_intelligence_jobs` table — `benchmark_mode` boolean, `benchmark_category` text, `results` jsonb (includes `benchmarkAnalysis`, `packetAnalysis`, per-attribute `coherence_pct`, `per_run_values`), `raw_runs` jsonb.
- **AI Models**: Gemini (`gemini-3-flash-preview` standard, `gemini-2.5-flash` web search), ChatGPT (`gpt-4o-mini` standard, `gpt-4o` web search via `OPENAI_DIRECT_API_KEY`), Claude (`claude-sonnet-4-5`). Benchmark/Packet analysis: `gpt-4o-mini` single call.

## Persona Group Management

**IMPORTANT: Never manually edit persona arrays, enums, or dropdowns.** Use the dedicated script instead.

### Adding personas to B2B SaaS – Collections (CM group)

When the user pastes a list of new personas (and optionally services / customers), run:

```bash
npx tsx scripts/add-persona-group.ts <input-file.txt>
# or pipe stdin:
cat input.txt | npx tsx scripts/add-persona-group.ts
```

**Input format** (plain text, three section headers required):

```
Personas
Invoice Reminder Software
Payment Reminder Software

Services
invoice reminder automation
automated payment reminders

Customers
Consumer-facing SMEs
Mid-market companies
```

The script deterministically updates **all 8 target files** (persona enum in `server/promptgen/types.ts`, CM_PERSONAS + service/vertical arrays + BUDGET_ADJ + SERVICE_VERB + PERSONA_CAT_LABEL + switch in `server/promptgen/presets.ts`, category map in `server/segment-analysis/index.ts`, label map in `server/report/generator.ts`, label map in `client/src/pages/History.tsx`, and all 3 persona dropdowns + seedType condition in `client/src/pages/PromptGenerator.tsx`) using sentinel comments (`[PG:…]`) — zero AI cost, fully deterministic.

After running the script, restart the dev server to pick up the changes.

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string.
- `ADMIN_PASSWORD`: Admin password for accessing the full tool (required).
- `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`: OpenAI API credentials.
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY`, `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`: Anthropic API credentials.
## GEO Directory — Auto-Publish Pipeline

### How it works
Every completed analysis session is automatically published to the GEO directory (`/best-{service}-{location}` pages). The pipeline:

1. **Auto-hook (new searches)**: Two trigger points in `server/routes.ts`:
   - After the landing flow finishes scoring all segments (`[Landing] All segments complete`)
   - After segment citation analysis saves a `citationReport`
   Both fire `syncSessionToDirectory(sessionId)` asynchronously (fire-and-forget, never blocks the user response).

2. **Backfill (historical)**: `POST /api/internal/directory/backfill?limit=N` with header `x-admin-key: $ADMIN_PASSWORD` runs `backfillRecentSessions(N)` over the last N sessions.

### Key file
- `server/directory/sessionToDirectory.ts` — maps session segments → directory pages
  - Quality gate: `MIN_COMPETITORS = 3`, `MIN_VALID_RUNS = 5`
  - Reads `segment.persona` (with underscore→space conversion), `location`, `scoringResult.score.competitors`
  - Skips `seedType = "__blank__"` sentinel values
  - Calls `storage.upsertDirectoryPage()` — fully idempotent, safe to call multiple times

### Deduplication
Pages are keyed on `canonical_slug` (unique DB constraint). Running the same analysis twice just updates the existing page. Published pages never change their slug/location/cluster even if re-scored.

### Current state
36 pages published as of first backfill (10 historical sessions, service categories across Dubai, MENA, Netherlands, Amsterdam).

## People AI Identity Audit (`/people`)

A fully parallel feature — zero overlap with the brand audit pipeline.

### Flow
1. `/people` — Landing page. User enters their LinkedIn URL.
2. `POST /api/people/crawl` — Crawls LinkedIn public profile, extracts name/headline/role/company/education. Falls back to name-from-URL-slug if LinkedIn blocks. Creates `people_sessions` row with status=`selecting`. Returns sessionId, slug, anchors.
3. `/people/anchors/:sessionId` — Anchor selection. Shows chips for workplaces, roles, education. User deselects anything irrelevant.
4. `POST /api/people/run/:sessionId` — Saves selected anchors, fires `runPeopleAudit()` async (fire-and-forget). Returns immediately.
5. `/people/analysis/:sessionId` — Progress screen. Polls `/api/people/session/:id` every 4s. Redirects to report when status=`complete`.
6. `/people/reports/:slug` — Full report page. Fetches via `GET /api/people/report/:slug`.

### Two-track scoring (never combined)
- **Track A (anchored)** — 4 query variations × 3 engines with web search. Tests "what does AI think of me when given my identity context?" → **Identity Proof Score**
- **Track B (unanchored)** — 3 queries × 3 engines. Tests "where do I rank among all [Name]s?" → **AI Recognition Score**

### Server pipeline
- `server/people/linkedin.ts` — LinkedIn public profile crawl + anchor group builder
- `server/people/engines.ts` — Raw text engine calls (ChatGPT + web search, Gemini + Google Search, Claude standard). Completely separate from brand `queryEngine`.
- `server/people/queries.ts` — Track A and Track B query builders
- `server/people/parser.ts` — GPT-4o-mini structured extraction from raw AI responses
- `server/people/resolver.ts` — Identity resolution (confirmed/partial/wrong/absent)
- `server/people/scorer.ts` — Recognition Score + Proof Score calculation + grade (A/B/C/D/F)
- `server/people/runner.ts` — Orchestrator: runs all 21 engine calls in parallel, saves results, calculates scores, builds report data, updates status

### DB tables (3 new, all isolated)
- `people_sessions` — One row per audit. Note: `current_role` is a PostgreSQL reserved keyword — always quote it in raw SQL (`"current_role"`).
- `people_query_results` — One row per engine × query combination (21 rows per complete audit)
- `people_scores` — Final scores + diagnostic text + full report JSONB per session

### Report page sections
1. Two score cards (Recognition Score + Proof Score with grade)
2. Diagnostic paragraph (one of 6 pre-written diagnoses based on grade combination)
3. How AI sees you — per-engine description card + identity badge + cited sources
4. Default recognition — what each AI says for "Who is [name]?"
5. Name landscape — all people with the user's name ranked by AI prominence
6. Source graph — domains cited when AI answers about the user
7. Recommendations — up to 5 prioritised recommendations based on scores

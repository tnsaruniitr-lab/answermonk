# GEO MVP - AI Brand Presence Analyzer

## Overview

This is a **GEO (Generative Engine Optimization) MVP** — a full-stack web application that analyzes how well a brand appears in AI-generated recommendations across multiple AI engines (ChatGPT, Gemini, Claude, DeepSeek). Users enter a search query and brand name, and the system queries multiple AI engines to determine where (and if) the brand appears in each engine's recommendations. Results are aggregated into presence and rank scores using configurable weights and rank decay functions.

The app follows a monorepo structure with three top-level concerns:
- `client/` — React SPA (Vite + TypeScript)
- `server/` — Express API server (TypeScript)
- `shared/` — Shared types, schemas, and route definitions used by both client and server

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (`client/src/`)
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router) with three main pages: `/` (Analyzer), `/history` (History), `/prompts` (Prompt Generator)
- **State Management**: TanStack React Query for server state; local React state for form inputs
- **UI Components**: shadcn/ui component library (new-york style) built on Radix UI primitives, styled with Tailwind CSS and CSS variables for theming
- **Animations**: Framer Motion for smooth transitions
- **Charts**: Recharts for data visualization of engine scores
- **Icons**: Lucide React
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend (`server/`)
- **Framework**: Express.js running on Node with TypeScript (tsx for development)
- **API Design**: RESTful JSON API with endpoints defined in `shared/routes.ts`
  - `POST /api/eval` — Query a single AI engine for brand recommendations
  - `POST /api/aggregate` — Aggregate results from multiple engines with weighted scoring
  - `GET /api/history` — Retrieve past analysis results
  - `POST /api/promptsets` — Generate a set of 40 deterministic search prompts from a buyer intent profile
  - `GET /api/promptgen/presets` — Retrieve preset verticals, services, and modifiers by persona type
- **AI Engine Integration** (`server/engines.ts`): Queries AI models via their respective SDKs
  - OpenAI SDK (for ChatGPT and potentially DeepSeek)
  - Anthropic SDK (for Claude)
  - Uses Replit AI Integrations environment variables for API keys and base URLs
- **Scoring Algorithm** (`server/routes.ts`):
  - Presence scoring: Weighted average of presence states (0=absent, 1=weak, 2=strong) across engines
  - Rank scoring: Uses rank decay formula `1/pos^p` where `p` defaults to 1.2
  - Default engine weights: ChatGPT 35%, Gemini 35%, Claude 20%, DeepSeek 10%
- **Prompt Generator Module** (`server/promptgen/`): Generates 40 deterministic, vendor-seeking search prompts
  - `types.ts` — Zod schemas for BuyerIntentProfile, SlotBank, Prompt, PromptSet
  - `presets.ts` — Exhaustive lists of verticals (30+), services (27+ channels / 58+ platforms), modifiers per persona
  - `templates.ts` — Template strings organized by cluster (direct/persona/budget/task) and persona mode
  - `generator.ts` — Seeded RNG, slot bank builder, shape distribution, modifier/geo guarantees, dedup logic
  - Two personas: Marketing Agency (provider-led) and Automation Consultant (problem-led)
  - Exact distributions: 10 per cluster, 14 open / 10 top5 / 10 top3 / 6 best shapes
  - Same seed + input = same 40 prompts (deterministic)
- **Panel Mode** (`server/panel/`): Website-first recall testing system
  - `territories.ts` — 7 fixed territories with weighted keywords, synonym map, and control territory logic
  - `templates.ts` — Deterministic prompt generation (4 prompts per territory: task_v1, task_v2, generic, local)
  - `aliases.ts` — Brand alias extraction from HTML + LLM expansion, dual normalization (tokens + compact)
  - `generator.ts` — Website crawling (2-page: home + /services|/about), GPT-5.2 extraction, territory matching
  - API endpoints: `POST /api/panel/analyze` (website analysis), `POST /api/panel/score` (scoring with aliases)
  - 12-16 standardized prompts per run across 3 AI engines
- **Validation**: Zod schemas for all request/response validation, shared between client and server
- **GEO Scoring Service** (`server/scoring/`): Separate probabilistic scoring pipeline
  - `panel.ts` — Deterministic mini-panel selector (10-from-40: 3 direct, 3 task, 2 persona, 2 budget)
  - `runner.ts` — Batched parallel LLM executor (ChatGPT, Gemini, Claude), rate-limited, with web search enabled for ChatGPT (via direct API key + Responses API) and Gemini (via Google Search grounding). Citations captured from ChatGPT url_citation annotations and Gemini groundingMetadata.groundingChunks, with markdown link fallback parsing.
  - `llm-extractor.ts` — LLM-based brand extraction using gpt-4o-mini; replaces regex-based extraction for both Analyzer and Scoring pipelines
  - `extractor.ts` — Legacy regex-based extraction (kept for reference, no longer primary)
  - `matcher.ts` — Tiered brand matching (exact name, domain root, alias), false-positive protection for short names
  - `scorer.ts` — Pure frequency math: appearance_rate, primary_rate, avg_rank, competitor shares, cluster/engine breakdowns
  - Two modes: Quick (10 prompts) and Full (40 prompts), both run against all 3 engines
  - Results stored in `scoring_jobs` table with JSONB columns for flexible iteration
- **Insights & Recommender** (`server/insights/`): Post-scoring citation analysis module
  - `crawler.ts` — URL fetching (HTTP + Puppeteer fallback), UTM stripping, redirect resolution (Gemini grounding URLs → final destination), canonical URL dedup, content hash dedup (MD5 of first 500 chars)
  - `classifier.ts` — Source classification with surface types (comparison, eligibility, authority, brand_owned, competitor_owned, social, redirect_wrapper), credibility tiers (1/2/3), authority domain detection
  - `intentParser.ts` — Query decomposition via gpt-4o-mini into 4 dimensions (category, geo, audience, qualifier); uses stored profile metadata and actual prompt texts
  - `synonyms.ts` — Synonym/implication maps for geo, audience, category with contradiction detection and evidence strength classification
  - `extractor.ts` — Surface-type-aware extraction: comparison (list position, multi-brand), eligibility (dimension confirmation), authority (funding/geo signals), brand_owned/competitor_owned (positioning signals in title/H1/first-200-words/FAQ). Per-dimension proximity scoring downgrades "supported" → "weak_support" when brand and keyword are far apart. Skips social and redirect_wrapper pages. Competitor passage extraction for evidence snippets. Semantic audience detection via LLM (infers audience from pricing, onboarding language, integration partners).
  - `elimination.ts` — Elimination signal detection per dimension with SignalType enum (elimination vs ranking_weakness), brand-owned page positioning gap detection (missing geo/audience/category in prominent locations vs competitors), competitor analysis
  - `scorer.ts` — Attribution checks per engine (citation_driven vs model_knowledge), comparative scoring with dimension support rates. Cross-engine overlap uses root domain canonicalization.
  - `reporter.ts` — Insight card generation with opportunity filtering (only comparison/eligibility/authority surfaces generate "get listed" cards; competitor_owned and brand_owned excluded). Elimination vs ranking weakness card types with differentiated language and severity. Competitor passages aggregated and deduped. Authority tier weights (T1=3.2x, T2=1.5x, T3=0.4x) shown on sources. All sources sorted by relevance/surfaceType/tier/crossEngine with source type labels.
  - `index.ts` — Orchestrator tying all modules together with progress callbacks, passes classified data to reporter
  - API: `POST /api/insights/analyze`, `GET /api/insights/:jobId`
  - Database: `insights_json` and `insights_status` JSONB/text columns on `scoring_jobs` table; profile metadata stored in `raw_data.profile`
  - Frontend: `InsightsPanel` component with surface type badges (Brand Site, Competitor, Authority, Comparison, Eligibility), "Show all" toggle, expanded source list (25 shown), confidence gauge, dimension breakdown, attribution section, insight cards, competitor passage snippets ("Why Competitors Rank Higher"), authority tier badges (T1/T2) on sources, counterfactual "What If" simulation panel, separate elimination vs ranking weakness card sections

### Database
- **Database**: PostgreSQL (required, referenced via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema** (`shared/schema.ts`): Tables include `analysis_results` (single-query analyzer) and `scoring_jobs` (GEO scoring runs with JSONB result/raw data)
- **Additional tables** (`shared/models/chat.ts`): `conversations` and `messages` tables exist for Replit AI integration features (chat/voice)
- **Migrations**: Managed via `drizzle-kit push` (schema push approach, not migration files)
- **Storage layer** (`server/storage.ts`): `DatabaseStorage` class implementing `IStorage` interface for data access

### Build System
- **Development**: `tsx server/index.ts` with Vite dev server middleware for HMR
- **Production Build** (`script/build.ts`): 
  - Vite builds the client to `dist/public/`
  - esbuild bundles the server to `dist/index.cjs`
  - Select dependencies are bundled (allowlisted) to reduce cold start syscalls
- **Static Serving**: In production, Express serves the built client files and falls back to `index.html` for SPA routing

### Replit Integrations (`server/replit_integrations/`, `client/replit_integrations/`)
Pre-built integration modules for Replit AI features. These are auxiliary and include:
- **Chat**: Anthropic-powered conversation routes and storage
- **Audio**: Voice recording, playback, and streaming (OpenAI TTS/STT)
- **Image**: Image generation via OpenAI's gpt-image-1
- **Batch**: Batch processing utilities with rate limiting

## External Dependencies

### Required Services
- **PostgreSQL Database**: Must be provisioned and `DATABASE_URL` set in environment
- **OpenAI API**: Used for ChatGPT engine queries; configured via `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL`
- **Anthropic API**: Used for Claude engine queries; configured via `AI_INTEGRATIONS_ANTHROPIC_API_KEY` and `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`

### Key npm Dependencies
- `drizzle-orm` + `drizzle-kit` — Database ORM and schema management
- `openai` — OpenAI API SDK
- `@anthropic-ai/sdk` — Anthropic API SDK
- `express` — HTTP server framework
- `zod` + `drizzle-zod` — Schema validation and type generation
- `@tanstack/react-query` — Client-side data fetching
- `framer-motion` — Animations
- `recharts` — Charts/visualization
- `wouter` — Client-side routing
- `connect-pg-simple` — PostgreSQL session store (available but may not be actively used)

### Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (required)
- `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI API key
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — OpenAI API base URL (Replit proxy)
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` — Anthropic API key
- `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` — Anthropic API base URL (Replit proxy)
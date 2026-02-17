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
- **Routing**: Wouter (lightweight client-side router) with two main pages: `/` (Analyzer) and `/history` (History)
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
- **AI Engine Integration** (`server/engines.ts`): Queries AI models via their respective SDKs
  - OpenAI SDK (for ChatGPT and potentially DeepSeek)
  - Anthropic SDK (for Claude)
  - Uses Replit AI Integrations environment variables for API keys and base URLs
- **Scoring Algorithm** (`server/routes.ts`):
  - Presence scoring: Weighted average of presence states (0=absent, 1=weak, 2=strong) across engines
  - Rank scoring: Uses rank decay formula `1/pos^p` where `p` defaults to 1.2
  - Default engine weights: ChatGPT 35%, Gemini 35%, Claude 20%, DeepSeek 10%
- **Validation**: Zod schemas for all request/response validation, shared between client and server

### Database
- **Database**: PostgreSQL (required, referenced via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema** (`shared/schema.ts`): Main table is `analysis_results` storing query, brand, scores, and detailed engine breakdowns as JSONB
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
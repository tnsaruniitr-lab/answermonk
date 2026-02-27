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
- **Prompt Generator**: Deterministically generates 40 vendor-seeking search prompts based on buyer intent profiles and predefined templates. Supports multiple persona types: marketing_agency, automation_consultant, corporate_cards_provider, expense_management_software, accounting_automation, invoice_management, restaurant, construction_management, in_home_healthcare, at_home_healthcare, weight_loss_help, in_home_blood_tests, at_home_blood_tests. Healthcare personas support a blank seed type option for cleaner prompt phrasing.
- **Insights & Recommender**: A post-scoring module that analyzes citations, classifies sources, identifies user intent, detects elimination signals, and generates actionable insight cards. It includes a sophisticated crawler and classifier for web content analysis. Action recommender filters T4 (competitor-owned) domains from all recommendations.
- **Segment Citation Analyzer**: Provides post-scoring citation analysis to explain brand ranking differences across various segments, using detailed source classification, intent dictionaries, and comparative scoring.
- **Competitor Playbook**: Report section analyzing top 3 competitors per segment — why AI ranks them, positioning themes (cross-engine consistency), verbatim AI quotes, authority sources with links, social/community mentions (Reddit, Trustpilot etc.), and derived actionable recommendations. AI infrastructure domains (vertexaisearch.cloud.google.com) are labeled as "Gemini grounding" links.
- **Web Search Grounding Tracking**: Monitors and reports whether AI model responses were grounded in web searches, providing transparency into the AI's information retrieval process.

### Database
- **Type**: PostgreSQL, accessed via `DATABASE_URL`.
- **ORM**: Drizzle ORM for schema management and data access.
- **Schema**: Includes tables for `analysis_results`, `scoring_jobs` (for GEO scoring runs), and `saved_v2_configs` (for reusable multi-segment configurations).

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

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string.
- `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`: OpenAI API credentials.
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY`, `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`: Anthropic API credentials.
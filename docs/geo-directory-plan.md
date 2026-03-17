# Nexalytics GEO Directory — Full Build Plan & UAT Checklist

> **Core principle:** Publish only canonical, evidence-backed, non-duplicate pages with explicit methodology.

---

## Architecture Decision (Final, Settled)

- Express HTML routes returning complete HTML — no React SSR, no hydration
- Prompt-based URLs as the primary unit (not session IDs)
- JSON-LD `@graph` schema on every page
- Auto-generated sitemap at `/sitemap.xml`
- React SPA untouched — directory pages are separate Express routes

---

## Database Schema

### Publishable segment fields (11 fields)

| Field | Type | Purpose |
|---|---|---|
| `raw_query` | text | Original query, untouched |
| `canonical_query` | text | Normalised, filler-stripped (`home healthcare dubai`) |
| `canonical_slug` | text | URL path (`best-home-healthcare-dubai`) |
| `canonical_location` | text | Normalised location entity (`dubai`, `netherlands`) |
| `cluster_id` | text | `serviceType_location` composite (`home_healthcare_dubai`) |
| `publish_status` | enum | `draft` / `published` / `noindex` / `blocked` |
| `dedupe_parent_id` | int | Points to canonical page ID if this is a duplicate |
| `data_version` | text | Analysis cohort identifier |
| `first_published_at` | timestamp | Separates creation from subsequent updates |
| `evidence_score` | int | Stored numeric score — not recomputed per request |
| `engine_set` | json array | `["chatgpt","claude","gemini","perplexity"]` |

### `query_page_versions` table

| Field | Type | Purpose |
|---|---|---|
| `page_slug` | text | Links to canonical page |
| `data_version` | text | Cohort identifier |
| `analysis_window` | text | e.g. "February–March 2026" |
| `prompt_count` | int | Number of prompts run |
| `ranking_snapshot_json` | json | Full ranked list at point of analysis (see structure below) |
| `created_at` | timestamp | Version timestamp |

### `ranking_snapshot_json` structure (locked)

```json
{
  "brands": [
    {
      "name": "Vestacare",
      "domain": "vestacare.ae",
      "appearance_rate": 0.83,
      "evidence": ["dha_licensing", "authority_directory_presence"]
    }
  ],
  "authority_sources": ["dha.gov.ae", "care24.ae", "reddit.com"]
}
```

---

## Normalisation Rules

Strip filler words: `best`, `top`, `in`, `providers`, `services`, `companies`

Normalise order to: `{serviceType} {location}`

**Example — all three map to one slug:**
- "best home healthcare in dubai"
- "top home healthcare dubai"
- "home healthcare providers dubai"

→ `canonical_query`: `home healthcare dubai`
→ `canonical_location`: `dubai`
→ `cluster_id`: `home_healthcare_dubai`
→ `canonical_slug`: `best-home-healthcare-dubai`

**One slug. Always.** Any variant resolving to an existing slug gets `dedupe_parent_id` set and is never published independently.

---

## Evidence Scoring (Numeric, Deterministic)

| Signal | Score |
|---|---|
| Citation frequency data present | +2 |
| Named authority-source present (DHA, G2, Reddit, etc.) | +2 |
| Brand appears across 3+ distinct prompts | +2 |
| Structured entity signals | +1 |

**Publishing threshold: `evidence_score >= 3` AND `brands >= 3`**

Manual override layer sits on top:
- **Force-publish**: page that misses one threshold can be published with a logged reason
- **Force-block**: page that passes can be permanently blocked
- Never 100% automatic

---

## Quality Gate (Pre-Publication)

All four must be true:
1. 3+ ranked brands with individual appearance rates
2. Evidence score ≥ 3 (see scoring above)
3. Commercially meaningful query (filters out test/internal runs)
4. No canonical duplicate (slug does not already exist)

---

## Page Types

### 1. Query Pages (Primary citation unit)
```
/best-home-healthcare-dubai
/best-debt-collection-software-netherlands
```
- One canonical page per normalised query
- Quality gate enforced before creation
- Template: 8 sections (see below)
- `Cache-Control: public, max-age=3600`
- `<link rel="canonical" href="...">` in `<head>`
- Published: `<meta name="robots" content="index,follow">`

**Page template — 8 sections, locked:**
1. Title + H1: "Best Home Healthcare in Dubai (2026 AI Analysis)"
2. Direct answer paragraph — one extractable sentence with top 3 brands + stat
3. Ranked list — numbered, all brands that passed threshold
4. Evidence block per brand — specific data-driven sentence (not templated)
5. Authority sources — named domains that fed the AI ranking
6. Versioning block — analysis window, engines, prompt count, data version, last updated
7. Related queries — 3 links (same `cluster_id`, ordered by `evidence_score DESC`)
8. Methodology link — always present

### 2. Brand Entity Pages
```
/brand/valeo-health
/brand/vestacare
```
- Entity-first: what the company is, service categories, detected locations
- AI engine appearance rates per engine
- Recurring authority sources
- List of all linked query pages where brand appears
- JSON-LD `Organization` schema
- Created after query pages (inherits real inbound links)

### 3. Category Hubs
```
/dubai/home-healthcare
/netherlands/debt-collection-software
```
- Only created when **5+ published** query pages exist in cluster
- Must include 2-paragraph editorial summary (not empty aggregation)
- Generated from: top signals across cluster, top appearing brands, most cited authority sources
- All cluster query pages linked from hub

### 4. Comparison Pages
```
/compare/valeo-vs-vestacare-dubai
```
- **Trigger rule**: co-occurrence ≥ 3 AND evidence difference meets threshold
- Template: comparison paragraph, side-by-side metrics, evidence differences, query page links
- Never generated speculatively

### 5. Methodology Pages (Static, built once)
```
/methodology
/about-the-data
/how-rankings-work
```
- Non-optional trust anchors
- Every query page links here
- Explain: how rankings are calculated, engine weightings, prompt design, data version

---

## JSON-LD — Single `@graph` Block Per Page

```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebPage" },
    { "@type": "Dataset" },
    { "@type": "ItemList" },
    { "@type": "Organization" },
    { "@type": "BreadcrumbList" }
  ]
}
```

---

## Internal Linking Rules (Per Query Page)

Every query page must link to:
- Top 3 brand pages
- Parent category hub
- 3 related queries (same `cluster_id`, `ORDER BY evidence_score DESC LIMIT 3`)
- Methodology page

---

## Robots + Indexing Rules

| publish_status | robots meta | In sitemap |
|---|---|---|
| `published` | `index,follow` | Yes |
| `noindex` | `noindex,nofollow` | No |
| `draft` | `noindex,nofollow` | No |
| `blocked` | `noindex,nofollow` | No |

---

## Sitemap

- Live Express route at `/sitemap.xml`
- Lists all `published` query pages, brand pages, category hubs
- Auto-updates on every new publication event
- Excludes `noindex`, `draft`, `blocked`

---

## Directory Listing API (Lightweight)

`/api/directory/list` returns only:
```json
{ "slug", "serviceType", "location", "data_version", "last_updated" }
```
Never returns `ranking_snapshot_json` or full scoring data.

---

## Build Order

### Build 1 — Backend Foundation + Core Pages

1. DB schema additions (11 fields + `query_page_versions` table)
2. Normalisation engine (slug generator, filler stripper, deduplication, `cluster_id` generation)
3. Evidence scoring (numeric gate, stored as `evidence_score`)
4. Quality gate logic + manual override layer
5. Query page Express HTML routes (full 8-section template, JSON-LD `@graph`, cache headers, canonical tags, robots meta)
6. Methodology pages (3 static HTML pages)
7. Sitemap Express route (`/sitemap.xml`)

### Build 2 — Directory Surface

8. Brand entity pages (`/brand/:domain`)
9. Category hubs (curated, 5+ threshold, with editorial summaries)
10. "AI Directory" nav link + React `/directory` listing page (filters, sort, lightweight API)
11. Comparison pages (rule-based, last)

---

## UAT Checklist

### Build 1 UATs

#### Normalisation Engine
- [ ] "best home healthcare in dubai" → `canonical_slug = best-home-healthcare-dubai`, `canonical_location = dubai`, `cluster_id = home_healthcare_dubai`
- [ ] "top home healthcare dubai" → same slug → `dedupe_parent_id` set, page not created
- [ ] "home healthcare providers in dubai" → same slug → deduplication detected

#### Evidence Scoring
- [ ] Segment with citation frequency + authority source → `evidence_score = 4` → gate passes
- [ ] Segment with entity signals only → `evidence_score = 1` → gate fails, stays `draft`
- [ ] Segment with `evidence_score = 4` but only 2 brands → gate fails (brands < 3)

#### Quality Gate + Override
- [ ] Segment passing all thresholds → `publish_status = draft`, ready for publish trigger
- [ ] Force-publish a failing segment → requires logged reason, page created
- [ ] Force-block a passing segment → `publish_status = blocked`, page not created, persists

#### Query Page HTML (View Source / curl)
- [ ] `GET /best-home-healthcare-dubai` → HTTP 200, `Content-Type: text/html`
- [ ] H1 present: "Best Home Healthcare in Dubai"
- [ ] Direct answer paragraph contains brand names and a percentage stat
- [ ] Ranked list is numbered (1, 2, 3…)
- [ ] Each brand has a distinct evidence sentence (not identical templated prose)
- [ ] Authority sources section lists named domains
- [ ] Versioning block: analysis window, engine names, prompt count, data version, last updated
- [ ] 3 related query links present, all from same `cluster_id`
- [ ] Methodology link present
- [ ] `<link rel="canonical" href="...">` in `<head>`
- [ ] `<script type="application/ld+json">` contains `@graph` with WebPage, Dataset, ItemList, Organization entries, BreadcrumbList
- [ ] Response header: `Cache-Control: public, max-age=3600`
- [ ] Published page: `<meta name="robots" content="index,follow">`
- [ ] Page is NOT the React SPA shell (no empty `<div id="root">`)

#### Noindex Pages
- [ ] Noindex-status page → HTTP 200, `<meta name="robots" content="noindex,nofollow">` present
- [ ] Noindex page NOT present in `/sitemap.xml`

#### Sitemap
- [ ] `GET /sitemap.xml` → HTTP 200, `Content-Type: application/xml`
- [ ] Contains all `published` query page URLs
- [ ] Zero `draft`, `noindex`, or `blocked` URLs present
- [ ] After publishing a new page → URL appears in sitemap immediately

#### Methodology Pages
- [ ] `GET /methodology` → HTTP 200, full HTML content (not React SPA shell)
- [ ] `GET /about-the-data` → HTTP 200, full HTML content
- [ ] `GET /how-rankings-work` → HTTP 200, full HTML content

---

### Build 2 UATs

#### Brand Entity Pages
- [ ] `GET /brand/valeo-health` → HTTP 200, full HTML (not SPA shell)
- [ ] Contains: service categories, detected locations, per-engine appearance rates, recurring authority sources, linked query pages
- [ ] JSON-LD `Organization` schema present in `@graph`
- [ ] Internal links resolve to published query pages (HTTP 200)

#### Category Hubs
- [ ] `GET /dubai/home-healthcare` → HTTP 404 when fewer than 5 published pages in cluster
- [ ] After 5th page published → HTTP 200
- [ ] Hub contains 2-paragraph editorial summary (not just a link list)
- [ ] All cluster query pages linked from hub

#### Comparison Pages
- [ ] `GET /compare/valeo-vs-vestacare-dubai` → HTTP 404 if co-occurrence < 3
- [ ] HTTP 200 only when co-occurrence ≥ 3 AND evidence difference meets threshold
- [ ] Page contains: comparison paragraph, side-by-side metrics, evidence differences, query page links

#### Nav + Directory Listing
- [ ] "AI Directory" visible in top-right nav on landing page
- [ ] `/directory` loads within 1 second
- [ ] Location filter applied → only matching pages shown
- [ ] Category filter applied → only matching pages shown
- [ ] Sort by newest → correct chronological order
- [ ] API response contains only: `slug`, `serviceType`, `location`, `data_version`, `last_updated` — no `ranking_snapshot_json`

#### Internal Linking Integrity
- [ ] Any published query page → 3 brand page links, 1 category hub link, 3 related query links, 1 methodology link — all resolve HTTP 200
- [ ] Related queries are from same `cluster_id`, highest `evidence_score` first

#### Growth Flywheel
- [ ] Complete a new analysis run → quality gate fires automatically → passing segment creates a new query page → brand pages updated → sitemap refreshed within same request cycle

---

## Growth Flywheel Model

```
prompt → brand → category → prompt
```

Each analysis run automatically generates:
- 1 new query page per qualifying segment
- Updated brand entity pages
- Refreshed category hub (once threshold met)
- Updated sitemap

At scale: thousands of AI-answer pages indexed and cited by AI engines as a structured ranking dataset.

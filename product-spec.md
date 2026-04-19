# AnswerMonk — AI Visibility Authority Extension
## Product Specification v1.0

**Date:** April 2026  
**Author:** AnswerMonk Engineering  
**Status:** Pre-build — pending audit  

---

## 1. Context & Purpose

AnswerMonk is a GEO (Generative Engine Optimisation) intelligence platform. The core product already runs a multi-segment brand audit that scores a brand's presence across ChatGPT, Gemini, and Claude using structured prompts derived from a service × customer matrix.

This spec defines three new modules that extend the existing audit report with:
- A structured competitor set (Module 1)
- An authority domain presence matrix (Module 2)
- A social media presence matrix (Module 3)

These modules run alongside the existing scoring pipeline and surface as new tabs in the session report. The existing audit flow is unchanged.

---

## 2. Existing System (Reference)

### Tech stack
- **Backend:** Node.js + TypeScript, Express
- **Frontend:** React + Vite + TanStack Query + Wouter
- **Database:** PostgreSQL via Drizzle ORM
- **LLM providers:** OpenAI (ChatGPT), Anthropic (Claude), Google (Gemini 2.5 Flash)
- **Hosting:** Replit

### Relevant existing tables
| Table | Purpose |
|---|---|
| `landing_submissions` | Website URLs submitted for audit |
| `multi_segment_sessions` | Parent session container, holds segments JSONB |
| `analysis_results` | Per-prompt engine responses and scores |
| `citation_page_mentions` | Crawled citation URLs with context |
| `citation_signal_intelligence` | AI analysis of citation evidence |

### Existing session data shape (simplified)
```typescript
{
  id: number;
  brandName: string;
  brandDomain: string;
  sessionType: "pnc_v1" | "landing_guided";
  segments: Array<{
    id: string;
    persona: string;
    serviceType: string | null;
    customerType: string | null;
    location: string;
    prompts: Array<{ id: string; text: string }>;
    scoringResult: {
      score: {
        appearance_rate: number;
        primary_rate: number;
        avg_rank: number | null;
        competitors: Array<{ name: string; share: number; appearances: number }>;
      };
      raw_runs: Array<{
        engine: string;
        prompt_text: string;
        citations: Array<{ url: string; title: string }>;
        found_state: number;
        rank: number | null;
      }>;
    } | null;
  }>;
}
```

---

## 3. Modules Overview

| Module | Input | Output | LLM calls | Timing |
|---|---|---|---|---|
| 1 — Competitor Extraction | Brand URL, pnc result | 5 competitors with scope tags | 3–4 | t+5s, parallel with scoring |
| 2 — Authority Domain Presence | Brand + 5 competitors + category | 6×5 evidence matrix | ~30 | t+30s after Module 1 |
| 3 — Social Media Presence | Brand + 5 competitors | 6×6 evidence matrix | ~36 | t+30s parallel with Module 2 |

**Total new LLM calls per audit:** ~70  
**Estimated wall-clock addition:** 30–60 seconds (all parallel, non-blocking to scoring)

---

## 4. Execution Timeline

```
t=0s    User clicks "Activate Audit Agent"
t=5s    pncClassifyGenerate returns (Claude) — segments + brand scope known
t=5s    Scoring starts across ChatGPT / Gemini / Claude (2–3 min)
t=5s    Module 1 starts in parallel (3–4 grounded Gemini calls)
t=30s   Module 1 complete → competitor_sets row saved
t=30s   Modules 2 + 3 start in parallel (66 calls via Promise.all)
t=60s   Modules 2 + 3 complete → authority_evidence + social_evidence saved
t=90s   First scoring segments arrive in UI
t=180s  Scoring fully complete
```

The Authority and Social tabs are populated before the user finishes reading their first scoring segment. No perceived wait.

---

## 5. Module 1 — Competitor Extraction

### Purpose
Produce a reliable, scope-aware list of 5 direct competitors. This list is the foundation of Modules 2 and 3 — if it is wrong, both downstream modules produce a confident but useless report.

### Input
- `brandUrl`: string (e.g. `https://brevo.com`)
- `pncResult`: existing PNC output containing `city`, `country`, `business_name`

### Output
```typescript
{
  scope: "local" | "regional" | "global" | "hybrid";
  category: "saas" | "healthtech" | "dtc" | "fintech" | "ecommerce" | "local-service" | "other";
  vantage: string; // e.g. "Paris, France" or "Global"
  competitors: Array<{
    name: string;
    domain: string;
    surfaced_by_query: string;
    serp_position: number;
    type: "direct" | "adjacent" | "aspirational";
  }>;
}
```

### Phase 1a — Scope & Category Classification
Signals used (all derived from existing pnc result + URL, no additional API call):
- `city` present and non-empty → candidate for `local` or `hybrid`
- Country-level hreflang or `.co.uk` / `.de` TLD → `regional`
- No city, no country TLD → `global`
- `hybrid` if city is present but brand has clear multi-market keywords

Category is inferred from the service types Claude returned in the PNC result. Mapped via a static keyword → category lookup (e.g. "email marketing" → `saas`, "dental clinic" → `local-service`).

**If confidence is low** (category = `other` and scope ambiguous): Module 1 still runs but flags `confidence: "low"` in the output. Modules 2 and 3 use `saas` defaults for the authority registry.

### Phase 1b — Scoped Query Templates

| Scope | Queries run |
|---|---|
| local | `"best {category} in {city}"`, `"{category} near me {city} {year}"` |
| regional | `"best {category} {region}"`, `"{category} comparison {region}"` |
| global | `"best {category} {year}"`, `"{category} alternatives"`, `"{brand} vs"` |
| hybrid | Union of local + global queries, results returned as two groups |

Each query is a grounded Gemini 2.5 Flash call with `googleSearch` tool enabled. The same grounding infrastructure as the existing scoring runner.

### Phase 1c — Deduplication and Filtering

**Strip these automatically:**
- Aggregators and review sites: G2, Capterra, Trustpilot, TechCrunch, Forbes, Clutch — these are Module 2 authority surfaces, not competitors
- The brand itself (self-reference)
- Generic SaaS platforms (AWS, Google, Microsoft) unless directly competing in the category
- Affiliate/SEO-spam domains (identified by high similarity of name to query)

**Ranking:** Aggregate SERP position across all queries run. Lower aggregate position = higher confidence competitor.

**Take top 5.** If fewer than 5 survive after filtering, return what is available and flag `partial: true`.

### LLM Used
- **Gemini 2.5 Flash** with Google Search grounding (same as existing scoring runner)
- Max 4 calls per audit
- Each call: structured JSON output enforced with retry (up to 2x)

### Files (new)
```
server/competitor/classifier.ts   — scope + category classification
server/competitor/discovery.ts    — scoped query runner + deduper
server/competitor/filter.ts       — aggregator strip list + ranking
```

---

## 6. Module 2 — Authority Domain Presence

### Purpose
For each entity (brand + 5 competitors), check presence on the authority domains that AI engines are most likely to cite. Show where the brand has coverage gaps vs. competitors.

### Input
- `brandName`, `brandDomain`
- `competitors[]` from Module 1
- `category` from Module 1
- `vantage` from Module 1

### Output
A 2D matrix:
- **Rows:** authority surfaces (5 per category, from registry)
- **Columns:** 6 entities (brand + 5 competitors)
- **Cells:** full evidence object (see Section 8)

### Category Registry (seed)
```
saas:        wikipedia.org, g2.com, capterra.com, reddit.com, producthunt.com
healthtech:  wikipedia.org, trustpilot.com, reddit.com, healthgrades.com, techcrunch.com
dtc:         wikipedia.org, trustpilot.com, reddit.com, youtube.com, instagram.com
local:       google.com/business, yelp.com, tripadvisor.com, reddit.com, [country-directory]
fintech:     wikipedia.org, crunchbase.com, g2.com, reddit.com, trustpilot.com
ecommerce:   wikipedia.org, trustpilot.com, reddit.com, youtube.com, reviews.io
```

Registry is a TypeScript constant in `server/authority/registry.ts`. Expandable — new categories added as coverage grows.

### LLM Calls
- **30 calls total** (6 entities × 5 surfaces)
- All run in parallel via `Promise.all`
- **Model:** Gemini 2.5 Flash with Google Search grounding
- Each call returns the fixed JSON evidence schema (Section 8)
- Validation + retry on schema mismatch (up to 2x)

### Prompt Shape (per cell)
```
You are a research assistant. For the entity "{entity_name}" ({entity_domain}),
find its presence on {surface}. Use web search.

Return ONLY a JSON object matching the schema below. If a field cannot be
verified with a cited source, set it to null. Do not estimate.

Required: primary_metric_value must come from a specific page you can link to.
Every URL in sample_evidence must be a direct link to the content you are
quoting, not a search results page.

Schema: { ...evidence schema from Section 8... }
```

### URL Verification
After each call:
1. HEAD-check `profile_url` — if 4xx/5xx, set `profile_verified: false` and downgrade tier
2. HEAD-check each `sample_evidence[].source_url` — remove row if fails
3. Cache HEAD results for 7 days (keyed on URL)

### Files (new)
```
server/authority/registry.ts    — category → surfaces mapping
server/authority/runner.ts      — orchestrates 30 parallel calls
server/authority/verifier.ts    — HEAD check + cache
server/authority/tier.ts        — tier calculator (shared with Module 3)
```

---

## 7. Module 3 — Social Media Presence

### Purpose
For each entity, show follower count, latest post date, and activity tier across the 6 major social platforms. "Dead profile" vs "active profile" distinction is the key output — a competitor posting weekly beats one with more followers but no recent posts.

### Input
Same as Module 2 (brand + 5 competitors, no category-dependency for social).

### Output
A 2D matrix:
- **Rows:** 6 platforms (Instagram, LinkedIn, YouTube, X/Twitter, TikTok, Reddit)
- **Columns:** 6 entities
- **Cells:** full evidence object (see Section 8)

### Platform Query Method
Each LLM call uses `site:` operator in web search:
- Instagram: `site:instagram.com "{entity_name}"`
- LinkedIn: `site:linkedin.com/company "{entity_name}"`
- YouTube: `site:youtube.com "{entity_name}"`
- X/Twitter: `site:x.com "{entity_name}"` (fallback: `site:twitter.com`)
- TikTok: `site:tiktok.com "{entity_name}"`
- Reddit: `site:reddit.com "{entity_name}"` (active community, not just mentions)

### LLM Calls
- **36 calls total** (6 entities × 6 platforms)
- All parallel via `Promise.all`
- **Same model and prompt shape as Module 2** — only `surface` parameter changes
- ~80% code reuse with Module 2 runner

### Social Tier Rules (extension of shared tier calculator)
- **Activity tier HIGH:** latest post within 30 days AND follower count above category median
- **Activity tier MID:** latest post within 90 days OR follower count above category median
- **Activity tier LOW:** latest post older than 90 days OR no verified profile

### Files (new)
```
server/social/runner.ts    — 36 parallel calls, reuses authority runner pattern
```
Tier calculator and verifier are shared with Module 2.

---

## 8. Shared Evidence Schema

Every LLM call across Modules 2 and 3 returns this exact shape. Validated after every call; malformed responses are retried up to 2x then stored with `tier: "LOW"` and `evidence_confidence_note: "schema validation failed"`.

```typescript
interface EvidenceCell {
  entity: string;
  surface: string;
  profile_url: string | null;
  profile_verified: boolean;
  primary_metric_name: string;           // e.g. "G2 Reviews", "Followers"
  primary_metric_value: number | null;   // null if not verifiable
  secondary_metric_name: string | null;
  secondary_metric_value: number | null;
  latest_activity_date: string | null;   // ISO 8601
  sample_evidence: Array<{
    text: string;
    source_url: string;
  }>;
  tier: "HIGH" | "MID" | "LOW";
  evidence_confidence_note: string;
}
```

---

## 9. Shared Tier Calculator

Single function, one source of truth. Used identically in Modules 2 and 3.

```
HIGH:  profile_url verified (2xx)
       AND primary_metric_value is not null
       AND at least one sample_evidence with source_url
       AND latest_activity_date within last 180 days

MID:   profile_url verified (2xx)
       AND (primary_metric_value not null OR sample_evidence non-empty)
       BUT fails HIGH criteria

LOW:   everything else
```

---

## 10. Database Schema (new tables)

All added to `shared/schema.ts` and pushed via `npm run db:push`.

### `competitor_sets`
```typescript
{
  id: serial PK
  session_id: integer FK → multi_segment_sessions.id
  scope: text                    // "local" | "regional" | "global" | "hybrid"
  category: text
  vantage: text                  // "Paris, France" or "Global"
  confidence: text               // "high" | "low"
  partial: boolean               // true if fewer than 5 competitors found
  competitors: jsonb             // Array<CompetitorObject>
  created_at: timestamp
}
```

### `authority_evidence`
```typescript
{
  id: serial PK
  session_id: integer FK → multi_segment_sessions.id
  entity: text
  entity_domain: text
  surface: text
  payload: jsonb                 // EvidenceCell
  tier: text
  profile_verified: boolean
  verified_at: timestamp
  expires_at: timestamp          // verified_at + 7 days (cache TTL)
}
```

### `social_evidence`
```typescript
// Identical shape to authority_evidence
// Separate table for query/index clarity
}
```

### `category_medians`
```typescript
{
  id: serial PK
  category: text
  surface: text
  median_value: numeric
  p25_value: numeric
  p75_value: numeric
  sample_size: integer
  updated_at: timestamp
  // Seeded with manual range estimates until sample_size > 30
}
```

---

## 11. API Routes (new)

All added to `server/routes.ts`.

| Route | Method | Purpose |
|---|---|---|
| `/api/authority/session/:id` | GET | Returns competitor_sets + authority_evidence + social_evidence for session |
| `/api/authority/session/:id/competitors` | GET | Competitor set only |
| `/api/authority/session/:id/matrix` | GET | Full 2D matrix for Authority tab |
| `/api/authority/session/:id/social` | GET | Full 2D matrix for Social tab |

The session poll endpoint `/api/multisegment/sessions/:id` gains three new top-level fields:
- `competitorData: CompetitorSet | null`
- `authorityData: EvidenceMatrix | null`
- `socialData: EvidenceMatrix | null`

These are `null` while modules are running and populate as they complete.

---

## 12. UI Integration

### Location
New tabs added to `ReportsSession.tsx` alongside existing citation/intelligence tabs.

### Tabs

**Authority tab**
- Headline: `"You appear on X of Y authority signals vs. category average Z"`
- Matrix: rows = authority surfaces, columns = 6 entities
- Each cell: metric value + tier dot (green=HIGH, amber=MID, red=LOW)
- Click cell → drawer showing sample_evidence quotes, profile URL, confidence note
- Vantage stamp at bottom: `"Queried from {city, country} on {date}"`

**Social tab**
- Same layout as Authority tab
- Rows = 6 platforms
- Cell shows: follower count + latest post date + activity tier
- "Dead profile" is explicitly called out (last post > 90 days)

### Loading states
- Both tabs show a skeleton matrix while modules run
- If a module fails entirely: tab shows `"Authority data unavailable for this audit"` — does not crash the report
- Partial data (some cells null): cells render as LOW tier with `"Unverified"` label

---

## 13. LLM Model Selection

| Use case | Model | Reason |
|---|---|---|
| Module 1 competitor discovery | Gemini 2.5 Flash + Google Search grounding | Cheapest, best web recall, grounding already working |
| Module 2 authority matrix | Gemini 2.5 Flash + Google Search grounding | Same — 30 parallel calls at fractions of a cent |
| Module 3 social matrix | Gemini 2.5 Flash + Google Search grounding | Same — 36 parallel calls |
| JSON schema validation / retry | Claude Haiku (claude-haiku-4-5) | Best strict JSON adherence for retry pass |
| Existing scoring (unchanged) | ChatGPT / Claude / Gemini | No change |

**Cost estimate per full audit (Modules 1+2+3):**
- ~70 calls × ~700 tokens average = ~49K tokens input
- Gemini 2.5 Flash: $0.075 / 1M tokens input → **~$0.004 per audit**
- Claude Haiku retry (worst case 20% retry rate): 14 calls × ~500 tokens → **~$0.001**
- **Total authority extension cost per audit: < $0.01**

---

## 14. Error Handling & Fault Tolerance

- **Module 1 fails:** Modules 2 and 3 do not run. Both tabs show "Unavailable." Scoring report is unaffected.
- **Module 2 fails:** Module 3 still runs (it has its own competitor list from Module 1). Authority tab shows "Unavailable."
- **Module 3 fails:** Social tab shows "Unavailable." Authority tab unaffected.
- **Individual cell fails (timeout / bad JSON after 2 retries):** Cell stored with `tier: "LOW"`, `evidence_confidence_note: "fetch failed"`. Matrix renders, cell shows LOW.
- **HEAD check fails for profile_url:** `profile_verified: false`, tier downgraded accordingly.
- **Rate limit hit:** Exponential backoff up to 3 retries per call. If still failing, cell stored as failed.

---

## 15. Caching Strategy

| Cache | TTL | Key |
|---|---|---|
| authority_evidence rows | 7 days | `(entity_name, surface, category)` |
| social_evidence rows | 7 days | `(entity_name, platform)` |
| HEAD check results | 7 days | URL |
| competitor_sets | Per-session (no TTL) | `session_id` |

On re-audit of the same brand within 7 days: Modules 2 and 3 read from cache, only Module 1 re-runs (competitor landscape can shift).

---

## 16. Build Order

| Step | What | Dependency |
|---|---|---|
| 1 | DB schema — 4 new tables | None |
| 2 | Shared infrastructure — evidence type, tier calculator, URL verifier | DB tables |
| 3 | Module 1 — classifier + discovery + filter | Shared infra |
| 4 | **Validation gate** — manually review Module 1 on 5 real brands | Module 1 |
| 5 | Module 2 — authority runner, registry, API routes | Module 1 validated |
| 6 | Module 3 — social runner (reuses Module 2 pattern) | Module 2 |
| 7 | UI — Authority + Social tabs, skeleton states, cell drawer | Modules 2 + 3 |
| 8 | Category medians — seed manually, compute once 30+ audits done | Module 2 data |

---

## 17. Launch Checklist

- [ ] Category registry validated against 3 real brands per category (18 brands total)
- [ ] Tier calculator unit-tested against 20 synthetic evidence objects (10 HIGH, 6 MID, 4 LOW)
- [ ] URL verifier tested with a known 200 URL and a known 404 URL
- [ ] Module 1 competitor list manually reviewed for 5 brands across different scopes
- [ ] End-to-end smoke test: full authority + social sidebar renders for a known brand in < 3 minutes
- [ ] Manual review: do 10 audit outputs feel specific to the brand, or generic?
- [ ] Partial failure tested: kill Module 2 mid-run, confirm scoring report unaffected
- [ ] Cost tracked: confirm < $0.05 per audit across all three modules

---

## 18. Explicitly Out of Scope for v1

- Outcome predictions ("25–40% lift in 60–90 days") — needs calibration data
- Numeric visibility scores with precise decimals — bands and tiers only
- Shareable preview images or PDF export
- Continuous monitoring / scheduled re-audits
- Email capture gating the authority report
- Webhooks or external integrations
- Mobile-optimised matrix view (desktop-first for v1)

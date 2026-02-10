# Matching Module — HLD §10: Job Matching Engine

## Purpose

The core of the platform. Evaluates every active job against a user's CV + preferences, computes a weighted match score across 5 dimensions, and persists all results. Users can browse, filter, and shortlist their matches.

## Files (5 — standard 4 + scorer)

| File | Role |
|------|------|
| `matching.schemas.ts` | Zod schemas for run trigger and results query params |
| `matching.scorer.ts` | Pure scoring logic — no DB, no side effects |
| `matching.service.ts` | Batch orchestration, results listing, shortlist/viewed actions |
| `matching.controller.ts` | Thin handlers |
| `matching.routes.ts` | All routes behind `authenticate` |

## Schema Tables Used

- `matchBatches` — one per matching run (links user + CV snapshot + trigger + counts)
- `jobMatches` — one per (batch, job) pair with score breakdown, unique on `(batchId, jobId)`

Also reads from: `cvSnapshots`, `jobPreferences`, `jobs`

## API Endpoints

All routes require authentication.

| Method | Path                         | Auth | Description                          |
|--------|------------------------------|------|--------------------------------------|
| POST   | `/api/matching/run`          | Yes  | Trigger a matching run               |
| GET    | `/api/matching/batches`      | Yes  | List user's match batches            |
| GET    | `/api/matching/batches/:id`  | Yes  | Get batch details with all matches + job info |
| GET    | `/api/matching/results`      | Yes  | Paginated match results (filterable) |
| PATCH  | `/api/matching/:id/shortlist`| Yes  | Toggle shortlist flag on a match     |
| PATCH  | `/api/matching/:id/viewed`   | Yes  | Mark a match as viewed               |

### GET /api/matching/results query params

| Param | Type | Description |
|-------|------|-------------|
| page | number | Page number (default 1) |
| limit | number | Items per page (1-100, default 20) |
| minPercentage | number | Minimum match % filter |
| shortlistedOnly | "true"/"false" | Only shortlisted matches |

## Scoring Engine (`matching.scorer.ts`)

### Dimensions & Weights

| Dimension | Weight | Data Sources |
|-----------|--------|-------------|
| Skill overlap | 30% | CV `parsedSkills` + `parsedTools` vs job title/description |
| Role match | 25% | CV `parsedRoles` + preferences `preferredRoles` vs job title |
| Location match | 20% | Preferences `locations` + `remotePreference` vs job location/isRemote |
| Salary compatibility | 15% | Preferences `expectedSalaryMin/Max` vs job `salaryMin/Max` |
| Experience alignment | 10% | CV `experienceYears` vs job title/description seniority hints |

### Scoring Logic

- Each dimension returns 0.0–1.0
- Weighted sum → multiply by 100 → `matchPercentage` (0–100)
- Skill overlap uses token matching with a 1.2x boost (capped at 1.0) to reward partial matches
- Role match checks both token overlap and substring containment
- Salary uses ratio-based scoring: `min(user, job) / max(user, job)`
- Experience uses keyword-based seniority detection (senior/mid/junior) and penalizes distance
- Missing data → neutral 0.5 score (doesn't penalize or reward)

### Exclusion Filters

Before scoring, the engine checks:
- `excludedKeywords` — if any appear in job title/description/company → excluded
- `blacklistedCompanies` — if job company matches → excluded
- Excluded jobs get `matchPercentage: 0` and `excluded: true`

### Output per match

```typescript
{
  matchPercentage: number,     // 0–100
  matchedSkills: string[],     // skills found in job
  missingSkills: string[],     // skills not in job
  scoreBreakdown: {            // per-dimension scores (0–100 each)
    skillOverlap, roleMatch, locationMatch, salaryCompat, experienceAlign
  },
  recommendationReason: string // human-readable summary
}
```

## Matching Run Flow

1. Fetch user's active CV and preferences (400 if either missing)
2. Create `matchBatches` record with status `in_progress`
3. Load all active jobs
4. For each job: score → if above `minimumMatchPercentage` and not excluded → insert into `jobMatches`
5. Update batch with final counts and status `completed`

## Key Design Decisions

- **All matches persisted** — not computed on the fly (per HLD)
- **Batch-based** — each run creates a batch, enabling history and comparison
- **Rule-based scoring** for now — semantic/AI similarity deferred to future phase
- **Unique constraint** on `(batchId, jobId)` prevents duplicates within a batch
- **Minimum match threshold** from user preferences (default 50%) filters out noise
- Scorer is a **pure function** with no DB or I/O — easy to unit test

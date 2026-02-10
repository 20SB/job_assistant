# Preferences Module — HLD §7: Job Preferences

## Purpose

Stores the user's job-matching preferences. These preferences directly affect **matching eligibility** (which jobs are considered a match), not job fetching. One-to-one relationship with users — each user has at most one preferences record.

## Schema Tables Used

- `jobPreferences` — single row per user (enforced by `unique` constraint on `userId`)

## API Endpoints

All routes require authentication (`router.use(authenticate)`). No `:id` params — everything operates on the authenticated user's preferences.

| Method | Path                | Auth | Validation Schema          | Description                         |
|--------|---------------------|------|----------------------------|-------------------------------------|
| POST   | `/api/preferences/` | Yes  | `createPreferencesSchema`  | Create preferences (409 if exists)  |
| GET    | `/api/preferences/` | Yes  | —                          | Get user's preferences              |
| PATCH  | `/api/preferences/` | Yes  | `updatePreferencesSchema`  | Partial update (sparse merge)       |
| DELETE | `/api/preferences/` | Yes  | —                          | Delete preferences                  |

## Preference Fields

### Required on create
| Field | Type | Notes |
|-------|------|-------|
| `preferredRoles` | string[] | Min 1 item |
| `locations` | string[] | Min 1 item (city/country/remote) |

### Optional
| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `remotePreference` | boolean | `false` | Open to remote work? |
| `minExperienceYears` | number | — | Range filter |
| `maxExperienceYears` | number | — | Range filter |
| `currentSalary` | number | — | For context |
| `expectedSalaryMin` | number | — | Salary range |
| `expectedSalaryMax` | number | — | Salary range |
| `salaryCurrency` | string(3) | `INR` | ISO currency code |
| `companySize` | enum | — | startup/small/medium/large/enterprise |
| `employmentType` | enum | `full_time` | full_time/contract/part_time/freelance/internship |
| `excludedKeywords` | string[] | — | Jobs containing these are filtered out |
| `blacklistedCompanies` | string[] | — | Companies to exclude |
| `minimumMatchPercentage` | int | `50` | 0-100, threshold for match results |

## Key Design Decisions

- **One-to-one with user**: POST returns 409 Conflict if preferences already exist, guiding the client to use PATCH
- **PATCH is sparse**: only fields present in the request body are updated; omitted fields remain unchanged
- **No `:id` routes**: since it's one-to-one, the authenticated `userId` is sufficient to locate the record
- Numeric fields (salary, experience) are `numeric` in the DB — converted to strings on write
- These preferences will be consumed by the matching engine (HLD §10) to filter and score jobs

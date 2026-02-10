# CV Module — HLD §6: User Profile & CV Management

## Purpose

Manages CV snapshots with append-only versioning. Every update creates a new snapshot rather than mutating the existing one. Matching always uses the latest active CV.

## Schema Tables Used

- `cvSnapshots` — stores each CV version (raw text, parsed fields, version number, active flag)

## API Endpoints

All routes require authentication (`router.use(authenticate)`).

| Method | Path                  | Auth | Validation Schema | Description                              |
|--------|-----------------------|------|-------------------|------------------------------------------|
| POST   | `/api/cv/`            | Yes  | `createCvSchema`  | Create new CV (deactivates previous)     |
| GET    | `/api/cv/active`      | Yes  | —                 | Get user's currently active CV           |
| GET    | `/api/cv/versions`    | Yes  | —                 | List all CV versions (summary, no raw text) |
| GET    | `/api/cv/:id`         | Yes  | —                 | Get a specific CV snapshot by ID         |
| PATCH  | `/api/cv/`            | Yes  | `updateCvSchema`  | Update = merge with active + create new snapshot |
| DELETE | `/api/cv/:id`         | Yes  | —                 | Delete a snapshot; promotes latest if active deleted |

## Versioning Flow

1. **Create** → deactivate all active CVs for user → get next version number → insert new snapshot with `isActive: true`
2. **Update** → find active CV → merge new fields over existing → call `createCv()` (which handles deactivation + version increment)
3. **Delete** → remove snapshot → if it was active, promote the latest remaining version to active

## CV Fields

| Field | Type | Source |
|-------|------|--------|
| `rawCvText` | text (required) | User-submitted CV text |
| `inputMethod` | enum: text/form/pdf | How the CV was entered |
| `parsedSkills` | string[] | Extracted skills |
| `parsedRoles` | string[] | Extracted roles |
| `parsedTools` | string[] | Extracted tools |
| `experienceYears` | numeric | Years of experience |
| `seniority` | enum | intern → executive |
| `parsedData` | jsonb | Any additional parsed data |

## Key Design Decisions

- **Append-only**: old snapshots are never mutated, only deactivated
- **One active CV per user**: enforced by deactivating previous before inserting new
- **Version numbers**: monotonically increasing per user, never reused
- `experienceYears` is `numeric` in DB — convert to string on write (`toString()`), number on read (`Number()`)
- `listCvVersions` returns a summary projection (no `rawCvText` or `parsedData`) to keep list responses light

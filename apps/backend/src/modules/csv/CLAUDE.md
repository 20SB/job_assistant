# CSV Module — HLD §12: CSV Generation

## Purpose

Generates CSV reports of job match results for a given match batch.
CSVs are built in-memory from DB data (no filesystem storage).
The `csvExports` table stores metadata only (fileName, fileSize, totalRows).
On download, the CSV is regenerated from the DB. Optionally sends CSV
as an email attachment.

## Files (4 — standard module pattern)

| File | Role |
|------|------|
| `csv.schemas.ts` | Zod schemas for generate body and list query params |
| `csv.service.ts` | CSV building, metadata persistence, email sending |
| `csv.controller.ts` | Thin handlers; download handler streams raw Buffer |
| `csv.routes.ts` | All routes behind `authenticate` + `requireSubscription("starter")` |

## Schema Tables Used

- `csvExports` — metadata per export (userId, batchId, fileName, fileSize, totalRows, isArchived)

Also reads from: `matchBatches`, `jobMatches`, `jobs`, `users`

## API Endpoints

All routes require authentication + starter subscription or above.

| Method | Path                     | Description                                |
|--------|--------------------------|--------------------------------------------|
| POST   | `/api/csv/generate`      | Generate CSV from a match batch, optionally email |
| GET    | `/api/csv/exports`       | List user's CSV exports (paginated)        |
| GET    | `/api/csv/download/:id`  | Download CSV (regenerated from DB)         |
| PATCH  | `/api/csv/:id/archive`   | Soft-delete an export                      |

## Generate Flow

1. Verify batch exists, belongs to user, and is completed
2. Query jobMatches + jobs for the batch (ordered by match % DESC)
3. Build CSV in-memory (8 columns per HLD Section 12)
4. Insert metadata row into csvExports
5. If sendEmail=true, fetch user email and send via sendCsvEmail()
6. Return metadata record

## Download Flow

1. Fetch csvExports record (verify ownership, not archived)
2. Re-query jobMatches + jobs using stored batchId
3. Rebuild CSV buffer in-memory
4. Stream as response with Content-Type: text/csv

## CSV Columns

Job Title | Company | Location | Salary | Match % | Matched Skills | Missing Skills | Apply URL

## Key Design Decisions

- **No filesystem storage** — CSV regenerated from DB on each download
- **No external CSV library** — fixed 8 columns, manual building with escapeCsvField helper
- **Subscription gated** — starter plan minimum (per HLD feature gating)
- **Email attachment** — uses extended sendEmail with Nodemailer attachments
- **Metadata only in DB** — filePath is null, fileSize computed from buffer length
- **Soft archive** — isArchived flag hides from listing, prevents download

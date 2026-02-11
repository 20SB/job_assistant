# Worker Tests

Tests for `src/lib/workers/` — thin wrapper functions that the task processor dispatches to.

Each worker accepts a payload object and delegates to the corresponding service function. Tests mock the service module and verify the correct function is called with the right arguments.

## Files

| Test File | Source | Tests | What It Covers |
|-----------|--------|-------|----------------|
| `job-fetch.worker.test.ts` | `workers/job-fetch.worker.ts` | 2 | Calls `triggerFetch` with payload; defaults `maxPages` to 1 |
| `matching.worker.test.ts` | `workers/matching.worker.ts` | 1 | Calls `runMatching` with userId and trigger |
| `csv-generation.worker.test.ts` | `workers/csv-generation.worker.ts` | 1 | Calls `generateCsv` with userId, batchId, sendEmail flag |
| `email-delivery.worker.test.ts` | `workers/email-delivery.worker.ts` | 2 | Calls `sendEmail` with payload; handles base64 attachments |

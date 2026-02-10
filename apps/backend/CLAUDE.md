# Backend — Express 5 API Server

## Tech Stack

- **Runtime**: Node.js with ESM (`"type": "module"`)
- **Framework**: Express 5.2.1 (async error catching built-in)
- **Language**: TypeScript (strict, NodeNext, ES2023)
- **ORM**: Drizzle ORM 0.45.1 + PostgreSQL on Supabase
- **Validation**: Zod 3.24
- **Auth**: JWT (jsonwebtoken) + bcrypt
- **Logging**: Pino (pretty in dev, JSON in prod)
- **Email**: Nodemailer (optional SMTP; logs in dev if not configured)

## Architecture

```
src/
  index.ts              → App entrypoint: wires middleware, routes, error handler
  config/env.ts         → Zod-validated env vars (dotenv loaded HERE only)
  db/
    schema.ts           → All 18 Drizzle tables, 14 enums, full relations
    index.ts            → Exports `db` (drizzle instance with schema)
  lib/
    logger.ts           → Pino logger instance
    errors.ts           → AppError class + factory functions (BadRequest, Unauthorized, NotFound, Conflict, Forbidden)
    error-handler.ts    → Global Express error middleware
    validate.ts         → Zod validation middleware factory: `validate(schema)`
    email.ts            → Nodemailer transporter + email templates
  middleware/
    auth.ts                 → JWT `authenticate` middleware, augments `req.user`
    require-subscription.ts → Feature gating: `requireSubscription("starter")` etc.
  modules/
    users/              → HLD §5: Auth & User Management
    cv/                 → HLD §6: CV Management
    preferences/        → HLD §7: Job Preferences
    subscriptions/      → HLD §8: Plans, Subscriptions, Payments
    jobs/               → HLD §9: Job Ingestion (Adzuna API)
```

## Module Pattern (4 files)

Every module follows this structure — **do not deviate**:

| File               | Role                                                              |
|--------------------|-------------------------------------------------------------------|
| `<name>.schemas.ts`    | Zod schemas for request validation                            |
| `<name>.service.ts`    | Business logic — DB queries, error throwing, logging          |
| `<name>.controller.ts` | Thin glue: extract from `req` → call service → `res.json()`  |
| `<name>.routes.ts`     | Express Router — wires middleware + controller handlers       |

### Adding a new module step-by-step

1. Create `src/modules/<name>/` directory
2. Create the 4 files above following existing modules as reference
3. Schema tables already exist in `db/schema.ts` — import what you need
4. Import the router in `src/index.ts` and mount at `/api/<name>`
5. Run `npx tsc --noEmit` to verify — must compile clean

## Patterns & Conventions

### Imports
- All relative imports use `.js` extension: `import { db } from "../../db/index.js"`
- Named exports preferred; default export only for routers

### Request Validation
```typescript
// In routes file:
router.post("/", validate(createSchema), controller.create);
```
`validate(schema)` parses `req.body`, replaces it with validated data, or throws 400.

### Error Handling
```typescript
// In services — just throw:
throw NotFound("CV not found");
throw Conflict("Email already registered");
throw BadRequest("Invalid token");
throw Unauthorized("Invalid credentials");
```
The global error handler in `lib/error-handler.ts` catches everything:
- `AppError` → logs warn + returns `{ status: "error", message }` with correct status code
- Unknown errors → logs error + returns 500 with generic message

### Authentication
```typescript
// In routes — protect with middleware:
router.use(authenticate);  // all routes in this router
// or per-route:
router.get("/me", authenticate, controller.getProfile);
```
After `authenticate`, `req.user` has `{ userId, email, role }`.

### Response Format
Always: `res.status(xxx).json({ status: "success", data: result })`
Never return raw arrays or objects without the wrapper.

### Database
- Import `db` from `../../db/index.js` and table schemas from `../../db/schema.js`
- Use Drizzle's query builder: `db.select()`, `db.insert()`, `db.update()`, `db.delete()`
- Numeric columns (salary, experience) are stored as strings — convert with `.toString()` on write, `Number()` on read if needed
- Always `.returning()` on insert/update to get the result back

### Logging
```typescript
import { logger } from "../../lib/logger.js";
logger.info({ userId, resourceId }, "Resource created");
```
Always include structured context (`userId`, resource IDs) as the first arg.

## TypeScript Gotchas

These are real issues encountered in this codebase — follow these patterns:

| Issue | Fix |
|-------|-----|
| `jwt.sign` expiresIn type mismatch | `expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]` |
| Zod `safeParse` error typing | Cast: `result.error as ZodError`, use `.issues` not `.errors` |
| Express 5 `req.params.id` is `string \| string[]` | Cast: `req.params.id as string` |
| `z.record()` needs 2 args in Zod 3.24 | `z.record(z.string(), z.unknown())` not `z.record(z.unknown())` |
| Global Request augmentation for `req.user` | `declare global { namespace Express { interface Request { user?: AuthPayload } } }` in `middleware/auth.ts` |
| Interface → JSONB cast | `raw as unknown as Record<string, unknown>` (double cast needed) |

## Environment Variables

Defined and validated in `config/env.ts`:

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `DATABASE_URL` | Yes | — | Supabase PostgreSQL connection string |
| `JWT_SECRET` | Yes | — | Min 32 chars |
| `JWT_EXPIRES_IN` | No | `7d` | |
| `NODE_ENV` | No | `development` | |
| `PORT` | No | `8000` | |
| `BCRYPT_SALT_ROUNDS` | No | `12` | |
| `SMTP_HOST` | No | — | If unset, emails are logged instead |
| `SMTP_PORT` | No | — | |
| `SMTP_USER` | No | — | |
| `SMTP_PASS` | No | — | |
| `EMAIL_FROM` | No | — | |
| `FRONTEND_URL` | No | `http://localhost:3000` | Used in email templates |
| `ADZUNA_APP_ID` | No | — | If unset, job fetch returns empty |
| `ADZUNA_APP_KEY` | No | — | Adzuna API key |
| `ADZUNA_BASE_URL` | No | `https://api.adzuna.com/v1/api` | API base URL |
| `ADZUNA_COUNTRY` | No | `in` | Country code for search |

## Local Development

```bash
# From apps/backend/
npx tsx src/index.ts          # Run dev server
npx tsc --noEmit              # Type check
npx drizzle-kit generate      # Generate migrations after schema changes
npx drizzle-kit migrate       # Apply migrations
```

**Important**: Kill old node processes before restarting — stale processes on the same port cause 404s.

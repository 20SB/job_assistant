# Frontend Modularization Plan

## Current State Analysis

### Backend Structure (Reference) ✅
```
apps/backend/
├── CLAUDE.md                    # Architecture, patterns, conventions
└── src/modules/
    ├── admin/CLAUDE.md          # Module-specific docs
    ├── csv/CLAUDE.md
    ├── cv/CLAUDE.md
    ├── jobs/CLAUDE.md
    ├── matching/CLAUDE.md
    ├── notifications/CLAUDE.md
    ├── preferences/CLAUDE.md
    ├── subscriptions/CLAUDE.md
    ├── tasks/CLAUDE.md
    └── users/CLAUDE.md
```

**Backend CLAUDE.md Content:**
- Purpose of the module
- API endpoints
- Schema tables used
- Request/response shapes
- Flows (step-by-step)
- Design decisions
- Dependencies

### Frontend Structure (Current) ⚠️
```
apps/frontend/
├── CLAUDE.md                    # High-level overview only
└── src/
    ├── app/
    │   ├── (auth)/             # No docs
    │   │   ├── login/
    │   │   ├── signup/
    │   │   └── verify/
    │   └── (dashboard)/        # No docs
    │       ├── admin/
    │       ├── cv/
    │       ├── dashboard/
    │       ├── exports/
    │       ├── jobs/
    │       ├── notifications/
    │       ├── onboarding/
    │       ├── preferences/
    │       ├── settings/
    │       └── subscription/
    ├── components/             # No docs
    │   ├── landing/
    │   └── ui/
    ├── context/                # No docs
    └── lib/api/                # No docs
```

**Problem:** No module-level documentation = hard to maintain context

---

## Proposed Modular Structure

### Level 1: Route Group Documentation
```
apps/frontend/src/app/
├── (auth)/CLAUDE.md            # Auth flow, pages, shared components
├── (dashboard)/CLAUDE.md       # Dashboard layout, navigation, common patterns
└── ROUTES.md                   # Complete route map with descriptions
```

### Level 2: Feature/Page Documentation
```
apps/frontend/src/app/(dashboard)/
├── admin/CLAUDE.md             # Admin dashboard: tabs, data, API calls
├── cv/CLAUDE.md                # CV management: forms, versions, upload
├── dashboard/CLAUDE.md         # Main dashboard: stats, widgets, flows
├── exports/CLAUDE.md           # CSV exports: generation, download, list
├── jobs/CLAUDE.md              # Job matches: filters, cards, pagination
├── notifications/CLAUDE.md     # Notifications: preferences, history
├── onboarding/CLAUDE.md        # Onboarding wizard: steps, validation
├── preferences/CLAUDE.md       # Job preferences: form, fields
├── settings/CLAUDE.md          # Account settings: email, password
└── subscription/CLAUDE.md      # Subscription: plans, payments, cancel
```

### Level 3: Shared Systems Documentation
```
apps/frontend/src/
├── components/CLAUDE.md        # UI components library overview
├── context/CLAUDE.md           # React contexts: Auth, Theme
├── lib/
│   ├── api/CLAUDE.md           # API clients overview
│   └── utils/CLAUDE.md         # Utility functions
└── hooks/CLAUDE.md             # Custom React hooks (if added)
```

---

## CLAUDE.md Template for Frontend Pages

### Template: Page-Level CLAUDE.md

```markdown
# [Page Name] — [HLD Section Reference]

## Purpose

Brief description of what this page does and why it exists.

## Route

- Path: `/path/to/page`
- Auth Required: Yes/No
- Role Required: user/admin (if applicable)

## Components Used

| Component | Source | Purpose |
|-----------|--------|---------|
| Card | `@/components/ui/card` | Display containers |
| Button | `@/components/ui/button` | Actions |
| CustomComponent | `./components/custom` | Page-specific |

## API Calls

| API Method | Endpoint | When | Purpose |
|------------|----------|------|---------|
| `jobsApi.list()` | GET /api/jobs | On mount | Fetch job list |
| `jobsApi.getById()` | GET /api/jobs/:id | On click | Fetch details |

## State Management

| State | Type | Purpose |
|-------|------|---------|
| `jobs` | `Job[]` | List of jobs |
| `loading` | `boolean` | Loading indicator |
| `filters` | `Filters` | User filter settings |

## User Flows

### Primary Flow: [Action Name]
1. User clicks "Generate CSV"
2. Call `csvApi.generate({ batchId })`
3. Show toast notification
4. Reload list after 2s

### Secondary Flow: [Action Name]
...

## Key Features

- Feature 1: Description
- Feature 2: Description
- Pagination with 20 items per page
- Real-time filtering
- Toast notifications for feedback

## Dependencies

- External: sonner (toasts), lucide-react (icons)
- Internal: AuthContext (user/token), csvApi (API calls)

## Design Decisions

### Why X instead of Y?
Explanation of architectural choices specific to this page.

### Known Limitations
- What doesn't work yet
- What's intentionally simplified

## Related Pages

- `/other-page` - How they're connected
- Backend module: `modules/jobs/` - API source
```

---

## API Client Documentation Template

### Template: lib/api/[module].ts CLAUDE.md

```markdown
# [Module] API Client

## Backend Module

Source: `apps/backend/src/modules/[module]/`
Routes: See backend `[module].routes.ts`

## Exported Methods

| Method | Endpoint | Returns | Purpose |
|--------|----------|---------|---------|
| `list()` | GET /api/[module] | `ListResponse<T>` | Fetch paginated list |
| `getById()` | GET /api/[module]/:id | `T` | Fetch single item |
| `create()` | POST /api/[module] | `T` | Create new item |
| `update()` | PATCH /api/[module]/:id | `T` | Update item |
| `delete()` | DELETE /api/[module]/:id | `void` | Delete item |

## Type Definitions

```typescript
export interface TypeName {
  id: string;
  field: string;
  createdAt: string;
}
```

## Usage Example

```typescript
import { moduleApi } from "@/lib/api/module";

const items = await moduleApi.list({ page: 1, limit: 20 }, token);
```

## Error Handling

All methods throw `ApiError` with:
- `message`: Error description
- `status`: HTTP status code

Catch errors in components and display with toast/alert.
```

---

## Context Documentation Template

### Template: context/[Context].tsx CLAUDE.md

```markdown
# [Context Name] Context

## Purpose

Provides [what] to all child components.

## Exported

- `[Context]Provider` - Wrapper component
- `use[Context]()` - Hook to access context

## State

| Field | Type | Description |
|-------|------|-------------|
| `user` | `User \| null` | Current user |
| `token` | `string \| null` | JWT token |

## Methods

| Method | Parameters | Returns | Purpose |
|--------|------------|---------|---------|
| `login()` | email, password | `Promise<void>` | Authenticate user |
| `logout()` | - | `void` | Clear session |

## Usage

```typescript
import { useAuth } from "@/context/AuthContext";

const { user, token, login, logout } = useAuth();
```

## Implementation Notes

- Persists to localStorage
- Syncs with cookies for middleware
- Auto-refreshes on mount
```

---

## Implementation Strategy

### Phase 1: Core Documentation (High Priority)
1. **Route Groups** (2 files)
   - `app/(auth)/CLAUDE.md`
   - `app/(dashboard)/CLAUDE.md`

2. **API Clients** (9 files)
   - `lib/api/CLAUDE.md` (overview)
   - Individual client docs (auth, cv, jobs, etc.)

3. **Context** (1-2 files)
   - `context/CLAUDE.md` (overview)
   - `context/AuthContext/CLAUDE.md` (detailed)

### Phase 2: Feature Pages (Medium Priority)
4. **Dashboard Pages** (10 files)
   - One CLAUDE.md per route (admin, cv, jobs, etc.)
   - Focus on complex pages first (admin, jobs, onboarding)

### Phase 3: Components (Lower Priority)
5. **Shared Components**
   - `components/CLAUDE.md` (UI library overview)
   - `components/landing/CLAUDE.md` (landing page components)

### Phase 4: Utilities & Hooks
6. **Support Systems**
   - `lib/utils/CLAUDE.md`
   - `hooks/CLAUDE.md` (if custom hooks are added)

---

## Benefits of This Approach

### 1. Context-Aware Development
- AI can read relevant CLAUDE.md files to understand pages
- No need to read entire page.tsx - docs give overview
- Faster onboarding for new features

### 2. Maintainability
- Changes documented alongside code
- Design decisions preserved
- Dependencies clearly listed

### 3. Consistency
- Templates ensure uniform documentation
- Easy to find information
- Mirrors backend structure = familiar

### 4. Modularity
- Each page/feature is self-contained
- Can be modified independently
- Clear boundaries between features

---

## Quick Start

### Step 1: Start with High-Impact Pages
Create CLAUDE.md for:
1. `app/(dashboard)/admin/` - Most complex
2. `app/(dashboard)/jobs/` - Core feature
3. `lib/api/` - API overview

### Step 2: Use Templates
Copy template above, fill in specifics for each page.

### Step 3: Keep it Concise
- Focus on "what" and "why", not "how" (code shows how)
- Include architecture decisions
- List key dependencies
- Document flows, not implementation details

### Step 4: Update on Changes
When modifying a page:
1. Update the CLAUDE.md first
2. Make code changes
3. Verify CLAUDE.md is still accurate

---

## Example: jobs/CLAUDE.md (Preview)

```markdown
# Job Matches Page — HLD §10: Job Matching & Results

## Purpose
Displays user's matched jobs with scores, filters, and actions (shortlist, view details).

## Route
- Path: `/jobs`
- Auth Required: Yes
- Subscription: Starter+ (via backend)

## Key Features
- Paginated job list (20 per page)
- Min percentage filter (0-100%)
- Shortlisted-only toggle
- Expandable job cards with score breakdown
- Shortlist/unshortlist action
- Mark as viewed tracking

## API Calls
- `matchingApi.getResults()` - Fetch matches with filters
- `matchingApi.toggleShortlist()` - Toggle shortlist status
- `matchingApi.markViewed()` - Mark job as viewed

## State
- `matches: MatchResult[]` - Current page of matches
- `filters: { page, limit, minPercentage, shortlistedOnly }`
- `loading: boolean`
- `expandedId: string | null` - Currently expanded card

## User Flows
### View Matches
1. Page loads → calls `getResults()` with default filters
2. Displays cards with match percentage badges
3. User can expand card → shows score breakdown

### Filter by Percentage
1. User adjusts slider (0-100%)
2. Updates `filters.minPercentage`
3. Reloads matches with new filter

### Shortlist Job
1. User clicks star icon
2. Calls `toggleShortlist(matchId)`
3. Updates local state + badge indicator

## Components
- Card, Badge, Button from `@/components/ui`
- Custom score breakdown display
- Pagination controls

## Design Decisions
- Pagination on backend (not infinite scroll) = simpler
- Score breakdown hidden by default = cleaner UI
- Filters in query params = shareable URLs (future)
```

---

## Recommendation

**Start with 5 key files:**

1. `app/(dashboard)/CLAUDE.md` - Dashboard layout & navigation
2. `app/(dashboard)/admin/CLAUDE.md` - Most complex page
3. `app/(dashboard)/jobs/CLAUDE.md` - Core feature
4. `lib/api/CLAUDE.md` - API clients overview
5. `context/CLAUDE.md` - State management overview

Then gradually add more as you modify pages. This gives you the biggest ROI with minimal upfront work.

---

## Next Steps

Would you like me to:
1. **Create the 5 starter CLAUDE.md files** with real content from your codebase?
2. **Create a script** to generate skeleton CLAUDE.md files for all pages?
3. **Create a detailed example** for one complex page (admin or jobs)?

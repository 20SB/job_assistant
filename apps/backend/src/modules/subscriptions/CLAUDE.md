# Subscriptions Module — HLD §8: Pricing & Subscription

## Purpose

Manages subscription plans, user subscriptions, and payment records. Provides feature gating via the `requireSubscription` middleware so other modules can restrict access based on plan tier.

## Schema Tables Used

- `subscriptionPlans` — plan catalog (free, starter, pro, power_user) with limits (match frequency, job fetch interval, CSV frequency, email limits, max CVs)
- `userSubscriptions` — links user to plan with period dates, status, optional Razorpay ID
- `payments` — individual payment records tied to subscriptions

## API Endpoints

| Method | Path                            | Auth | Validation Schema  | Description                        |
|--------|----------------------------------|------|--------------------|------------------------------------|
| GET    | `/api/subscriptions/plans`       | No   | —                  | List all active plans              |
| GET    | `/api/subscriptions/plans/:id`   | No   | —                  | Get plan details by ID             |
| POST   | `/api/subscriptions/subscribe`   | Yes  | `subscribeSchema`  | Subscribe to a plan                |
| GET    | `/api/subscriptions/me`          | Yes  | —                  | Get current active subscription + plan |
| POST   | `/api/subscriptions/cancel`      | Yes  | —                  | Cancel active subscription         |
| GET    | `/api/subscriptions/payments`    | Yes  | —                  | List user's payment history        |

## Subscribe Flow

1. Validate `planId` exists and is active
2. Check user doesn't already have an active subscription (409 if so)
3. Create `userSubscriptions` record with status `active`, 1-month period
4. For paid plans: create a `payments` record with status `pending` (Razorpay will confirm later)
5. For free plan: no payment record created

## Feature Gating Middleware

Located at `middleware/require-subscription.ts`:

```typescript
import { requireSubscription } from "../../middleware/require-subscription.js";

// Gate behind any active subscription:
router.use(authenticate, requireSubscription());

// Gate behind minimum plan tier:
router.use(authenticate, requireSubscription("starter"));
router.use(authenticate, requireSubscription("pro"));
```

Plan hierarchy: `free` < `starter` < `pro` < `power_user`

Must be placed **after** `authenticate` middleware (needs `req.user`).

## Key Design Decisions

- **Plans are seeded, not user-created**: plans table is managed by admin/migration, not via API
- **One active subscription per user**: must cancel before switching
- **Razorpay deferred**: schema has `razorpaySubscriptionId`, `razorpayPaymentId` etc. ready, but actual Razorpay integration is a future step. Currently subscriptions activate immediately.
- **Payment records**: created for paid plans on subscribe, will be updated via Razorpay webhooks later
- `getUserPlan()` helper in service is used by the `requireSubscription` middleware — looks up active subscription + plan in one flow

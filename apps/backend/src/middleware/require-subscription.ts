import type { Request, Response, NextFunction } from "express";
import { Forbidden } from "../lib/errors.js";
import { getUserPlan } from "../modules/subscriptions/subscriptions.service.js";

type PlanName = "free" | "starter" | "pro" | "power_user";

const PLAN_RANK: Record<PlanName, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  power_user: 3,
};

/**
 * Middleware factory that gates routes behind a minimum subscription plan.
 *
 * Usage:
 *   router.use(authenticate, requireSubscription("starter"));
 *
 * Must be used AFTER `authenticate` so `req.user` is available.
 */
export function requireSubscription(minimumPlan: PlanName = "free") {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const plan = await getUserPlan(req.user!.userId);

    if (!plan) {
      throw Forbidden("An active subscription is required to access this feature");
    }

    const userRank = PLAN_RANK[plan.name as PlanName] ?? -1;
    const requiredRank = PLAN_RANK[minimumPlan];

    if (userRank < requiredRank) {
      throw Forbidden(
        `This feature requires the ${minimumPlan.replace("_", " ")} plan or above`,
      );
    }

    next();
  };
}

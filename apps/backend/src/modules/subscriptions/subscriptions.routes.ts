import { Router } from "express";
import { validate } from "../../lib/validate.js";
import { authenticate } from "../../middleware/auth.js";
import * as subscriptionsController from "./subscriptions.controller.js";
import { subscribeSchema } from "./subscriptions.schemas.js";

const router = Router();

// Public — plan listing
router.get("/plans", subscriptionsController.listPlans);
router.get("/plans/:id", subscriptionsController.getPlan);

// Authenticated — subscription management
router.post("/subscribe", authenticate, validate(subscribeSchema), subscriptionsController.subscribe);
router.get("/me", authenticate, subscriptionsController.getMySubscription);
router.post("/cancel", authenticate, subscriptionsController.cancel);
router.get("/payments", authenticate, subscriptionsController.listPayments);

export default router;

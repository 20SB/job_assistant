import { Router } from "express";
import { validate } from "../../lib/validate.js";
import { authenticate } from "../../middleware/auth.js";
import * as matchingController from "./matching.controller.js";
import { runMatchingSchema } from "./matching.schemas.js";

const router = Router();

// All matching routes require authentication
router.use(authenticate);

router.post("/run", validate(runMatchingSchema), matchingController.runMatching);
router.get("/batches", matchingController.listBatches);
router.get("/batches/:id", matchingController.getBatch);
router.get("/results", matchingController.listMatches);
router.patch("/:id/shortlist", matchingController.toggleShortlist);
router.patch("/:id/viewed", matchingController.markViewed);

export default router;

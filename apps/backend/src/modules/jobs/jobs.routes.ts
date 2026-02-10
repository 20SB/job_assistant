import { Router } from "express";
import { validate } from "../../lib/validate.js";
import { authenticate } from "../../middleware/auth.js";
import * as jobsController from "./jobs.controller.js";
import { triggerFetchSchema } from "./jobs.schemas.js";

const router = Router();

// Authenticated — browse jobs
router.get("/", authenticate, jobsController.listJobs);
router.get("/fetch-logs", authenticate, jobsController.fetchLogs);
router.get("/:id", authenticate, jobsController.getJob);

// Admin — trigger a job fetch manually
router.post("/fetch", authenticate, validate(triggerFetchSchema), jobsController.triggerFetch);

export default router;

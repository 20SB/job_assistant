import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/require-admin.js";
import { validate } from "../../lib/validate.js";
import * as controller from "./admin.controller.js";
import * as schemas from "./admin.schemas.js";

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// ============================================================================
// USERS
// ============================================================================

router.get("/users", validate(schemas.usersQuerySchema, "query"), controller.listUsers);
router.get("/users/:id", controller.getUserDetails);

// ============================================================================
// JOB FETCH LOGS
// ============================================================================

router.get(
  "/job-fetch-logs",
  validate(schemas.jobFetchLogsQuerySchema, "query"),
  controller.listJobFetchLogs
);

// ============================================================================
// MATCHING LOGS
// ============================================================================

router.get(
  "/matching-logs",
  validate(schemas.matchingLogsQuerySchema, "query"),
  controller.listMatchingLogs
);

// ============================================================================
// EMAIL DELIVERY LOGS
// ============================================================================

router.get(
  "/email-delivery-logs",
  validate(schemas.emailDeliveryLogsQuerySchema, "query"),
  controller.listEmailDeliveryLogs
);

// ============================================================================
// TASK QUEUE
// ============================================================================

router.get(
  "/tasks",
  validate(schemas.taskQueueQuerySchema, "query"),
  controller.listTaskQueue
);

// ============================================================================
// DASHBOARD STATS
// ============================================================================

router.get("/stats", controller.getDashboardStats);

export default router;

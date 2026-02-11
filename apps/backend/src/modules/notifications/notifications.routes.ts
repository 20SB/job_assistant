import { Router } from "express";
import { validate } from "../../lib/validate.js";
import { authenticate } from "../../middleware/auth.js";
import * as notificationsController from "./notifications.controller.js";
import {
  createPreferencesSchema,
  updatePreferencesSchema,
} from "./notifications.schemas.js";

const router = Router();

router.use(authenticate);

// Notification preferences (one-to-one with user, no :id)
router.post(
  "/preferences",
  validate(createPreferencesSchema),
  notificationsController.createPreferences,
);
router.get("/preferences", notificationsController.getPreferences);
router.patch(
  "/preferences",
  validate(updatePreferencesSchema),
  notificationsController.updatePreferences,
);
router.delete("/preferences", notificationsController.deletePreferences);

// Notification history
router.get("/", notificationsController.listNotifications);
router.get("/:id", notificationsController.getNotification);

export default router;

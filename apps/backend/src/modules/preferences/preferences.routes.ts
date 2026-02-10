import { Router } from "express";
import { validate } from "../../lib/validate.js";
import { authenticate } from "../../middleware/auth.js";
import * as preferencesController from "./preferences.controller.js";
import { createPreferencesSchema, updatePreferencesSchema } from "./preferences.schemas.js";

const router = Router();

// All preferences routes require authentication
router.use(authenticate);

router.post("/", validate(createPreferencesSchema), preferencesController.create);
router.get("/", preferencesController.get);
router.patch("/", validate(updatePreferencesSchema), preferencesController.update);
router.delete("/", preferencesController.remove);

export default router;

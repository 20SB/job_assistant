import { Router } from "express";
import { validate } from "../../lib/validate.js";
import { authenticate } from "../../middleware/auth.js";
import { requireSubscription } from "../../middleware/require-subscription.js";
import * as csvController from "./csv.controller.js";
import { generateCsvSchema } from "./csv.schemas.js";

const router = Router();

router.use(authenticate);
router.use(requireSubscription("starter"));

router.post("/generate", validate(generateCsvSchema), csvController.generate);
router.get("/exports", csvController.listExports);
router.get("/download/:id", csvController.download);
router.patch("/:id/archive", csvController.archive);

export default router;

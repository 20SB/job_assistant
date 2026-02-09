import { Router } from "express";
import { validate } from "../../lib/validate.js";
import { authenticate } from "../../middleware/auth.js";
import * as cvController from "./cv.controller.js";
import { createCvSchema, updateCvSchema } from "./cv.schemas.js";

const router = Router();

// All CV routes require authentication
router.use(authenticate);

router.post("/", validate(createCvSchema), cvController.create);
router.get("/active", cvController.getActive);
router.get("/versions", cvController.listVersions);
router.get("/:id", cvController.getById);
router.patch("/", validate(updateCvSchema), cvController.update);
router.delete("/:id", cvController.remove);

export default router;

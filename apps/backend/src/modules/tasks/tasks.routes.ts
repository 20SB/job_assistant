import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import * as tasksController from "./tasks.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", tasksController.listTasks);
router.get("/:id", tasksController.getTask);

export default router;

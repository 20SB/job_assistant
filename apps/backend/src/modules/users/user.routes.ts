import { Router } from "express";
import { validate } from "../../lib/validate.js";
import { authenticate } from "../../middleware/auth.js";
import * as userController from "./user.controller.js";
import {
  signupSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "./user.schemas.js";

const router = Router();

// Public routes
router.post("/signup", validate(signupSchema), userController.signup);
router.post("/login", validate(loginSchema), userController.login);
router.post(
  "/verify-email",
  validate(verifyEmailSchema),
  userController.verifyEmail
);
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  userController.forgotPassword
);
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  userController.resetPassword
);

// Protected routes
router.get("/me", authenticate, userController.getMe);
router.patch(
  "/me",
  authenticate,
  validate(updateProfileSchema),
  userController.updateMe
);

export default router;

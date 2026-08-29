import { Router } from "express";

import authController from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/google",
  authController.login,
);

router.get(
  "/google/callback",
  authController.callback,
);

router.post(
  "/logout",
  authMiddleware,
  authController.logout,
);

router.get(
  "/me",
  authMiddleware,
  authController.me,
);

export default router;
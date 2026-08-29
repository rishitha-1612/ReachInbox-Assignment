import { Router } from "express";

import emailController from "../controllers/email.controller.js";

import {
  authMiddleware,
} from "../middleware/auth.middleware.js";

const router =
  Router();

router.post(
  "/schedule",
  authMiddleware,
  emailController.schedule,
);

router.get(
  "/scheduled",
  authMiddleware,
  emailController.scheduled,
);

router.get(
  "/sent",
  authMiddleware,
  emailController.sent,
);

export default router;
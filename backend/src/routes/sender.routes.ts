import { Router } from "express";

import senderController from "../controllers/sender.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/",
  authMiddleware,
  senderController.list,
);

export default router;
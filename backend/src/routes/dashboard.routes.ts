import { Router } from "express";

import dashboardController from "../controllers/dashboard.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/stats",
  authMiddleware,
  (req, res, next) => {
    void dashboardController.stats(
      req,
      res,
    ).catch(next);
  },
);

export default router;

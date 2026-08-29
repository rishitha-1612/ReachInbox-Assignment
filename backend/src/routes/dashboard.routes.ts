import { Router } from "express";

import dashboardController from "../controllers/dashboard.controller.js";

const router = Router();

router.get(
  "/stats",
  (req, res, next) => {
    void dashboardController.stats(
      req,
      res,
    ).catch(next);
  },
);

export default router;
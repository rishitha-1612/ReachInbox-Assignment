import type {
  Request,
  Response,
} from "express";

import { prisma } from "../config/prisma.js";

export class DashboardController {
  async stats(
    req: Request,
    res: Response,
  ) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const userId = req.user.id;

      const [
        total,
        scheduled,
        sent,
        failed,
      ] = await Promise.all([
        prisma.emailJob.count({
          where: {
            userId,
          },
        }),

        prisma.emailJob.count({
          where: {
            userId,
            status: {
              in: [
                "PENDING",
                "QUEUED",
                "PROCESSING",
              ],
            },
          },
        }),

        prisma.emailJob.count({
          where: {
            userId,
            status: "SENT",
          },
        }),

        prisma.emailJob.count({
          where: {
            userId,
            status: "FAILED",
          },
        }),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          total,
          scheduled,
          sent,
          failed,
        },
      });
    } catch (error) {
      console.error(
        "Dashboard stats error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message: "Unable to retrieve dashboard statistics",
      });
    }
  }
}

export default new DashboardController();

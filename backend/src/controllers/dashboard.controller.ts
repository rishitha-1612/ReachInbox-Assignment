import type {
  Request,
  Response,
} from "express";

import { prisma } from "../config/prisma.js";
import {
  verifySession,
} from "../services/auth.service.js";

const SESSION_COOKIE =
  process.env.AUTH_COOKIE_NAME ??
  "reachinbox_session";

export class DashboardController {
  async stats(
    req: Request,
    res: Response,
  ) {
    try {
      const token =
        req.cookies?.[SESSION_COOKIE];

      if (!token) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      const user =
        await verifySession(token);

      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            "User not found",
        });
      }

      const userId = user.id;

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

      return res.status(401).json({
        success: false,
        message:
          "Unable to authenticate dashboard request",
      });
    }
  }
}

export default new DashboardController();
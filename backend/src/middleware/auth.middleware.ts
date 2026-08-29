import type {
  Request,
  Response,
  NextFunction,
} from "express";

import { verifySession } from "../services/auth.service.js";

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token =
      req.cookies?.[
        process.env.AUTH_COOKIE_NAME ??
          "reachinbox_session"
      ];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await verifySession(token);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid session",
      });
    }

    req.user = {
      id: user.id,
      googleId: user.googleId,
      email: user.email,
      name: user.name,
      ...(user.avatar
        ? { avatar: user.avatar }
        : {}),
    };

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session",
    });
  }
}
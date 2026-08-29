import type { Request, Response } from "express";
import crypto from "node:crypto";

import {
  getGoogleAuthUrl,
  handleGoogleCallback,
} from "../services/auth.service.js";

const OAUTH_STATE_COOKIE = "google_oauth_state";
const SESSION_COOKIE =
  process.env.AUTH_COOKIE_NAME ?? "reachinbox_session";

export class AuthController {
  login(_req: Request, res: Response) {
    const state = crypto.randomBytes(32).toString("hex");

    res.cookie(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60 * 1000,
    });

    return res.redirect(getGoogleAuthUrl(state));
  }

  async callback(req: Request, res: Response) {
    const code = req.query.code;
    const state = req.query.state;

    if (
      typeof code !== "string" ||
      typeof state !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Google OAuth callback",
      });
    }

    const storedState =
      req.cookies?.[OAUTH_STATE_COOKIE];

    if (
      !storedState ||
      storedState !== state
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid OAuth state",
      });
    }

    const { sessionToken } =
      await handleGoogleCallback(code);

    res.cookie(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.clearCookie(OAUTH_STATE_COOKIE);

    return res.redirect(
      `${process.env.FRONTEND_URL}/dashboard`,
    );
  }

  async logout(_req: Request, res: Response) {
    res.clearCookie(SESSION_COOKIE);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  }

  me(req: Request, res: Response) {
    return res.status(200).json({
      success: true,
      data: req.user ?? null,
    });
  }
}

export default new AuthController();
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";

import emailRoutes from "./routes/email.routes.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

/**
 * Security headers
 */
app.use(
  helmet(),
);

/**
 * CORS
 *
 * Credentials are required because authentication
 * uses an HTTP-only cookie.
 */
app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ??
      "http://localhost:3000",
    credentials: true,
  }),
);

/**
 * Request logging
 */
app.use(
  pinoHttp({
    transport: {
      target: "pino-pretty",
    },
  }),
);

/**
 * Request body parsing
 */
app.use(
  express.json({
    limit: "1mb",
  }),
);

/**
 * Cookie parsing
 */
app.use(cookieParser());

/**
 * Health check
 */
app.get("/health", (_req, res) => {
  return res.status(200).json({
    success: true,
    message:
      "ReachInbox Scheduler API running",
  });
});

/**
 * API routes
 */
app.use(
  "/api/v1/auth",
  authRoutes,
);

app.use(
  "/api/v1/emails",
  emailRoutes,
);

export default app;
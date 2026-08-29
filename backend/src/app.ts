import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";

import authRoutes from "./routes/auth.routes.js";
import emailRoutes from "./routes/email.routes.js";

const app =
  express();

app.use(
  helmet(),
);

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ??
      "http://localhost:3000",
    credentials: true,
  }),
);

app.use(
  pinoHttp({
    transport: {
      target:
        "pino-pretty",
    },
  }),
);

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(
  cookieParser(),
);

app.get(
  "/health",
  (_req, res) => {
    return res.status(200).json({
      success: true,
      message:
        "ReachInbox Scheduler API running",
    });
  },
);

app.use(
  "/api/v1/auth",
  authRoutes,
);

app.use(
  "/api/v1/emails",
  emailRoutes,
);

export default app;
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import emailRoutes from "./routes/email.routes.js";
const app = express();
app.use(
  "/api/v1/emails",
  emailRoutes,
);

app.use(helmet());
app.use(cors());

app.use(express.json());

app.use(
  pinoHttp({
    transport: {
      target: "pino-pretty",
    },
  })
);

app.get("/health", (_, res) => {
  res.json({
    success: true,
    message: "ReachInbox Scheduler API running 🚀",
  });
});

export default app;
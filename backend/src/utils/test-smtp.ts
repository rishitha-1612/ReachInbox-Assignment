import "dotenv/config";

import { smtpService } from "../services/smtp.service.js";

try {
  await smtpService.verify();
  console.log("SMTP connection verified successfully.");
} catch (error) {
  console.error("SMTP verification failed:", error);
  process.exitCode = 1;
}
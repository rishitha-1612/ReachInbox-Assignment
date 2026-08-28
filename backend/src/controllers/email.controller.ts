import type { Request, Response } from "express";

import { successResponse } from "../utils/api-response.js";
import { schedulerService } from "../services/scheduler.service.js";
import { scheduleEmailsSchema } from "../validators/email.validator.js";

export class EmailController {
  async schedule(
    req: Request,
    res: Response,
  ) {
    const input = scheduleEmailsSchema.parse(
      req.body,
    );

    if (!req.user) {
      throw new Error("Authentication required");
    }

    const userId = req.user.id;

    const result =
      await schedulerService.scheduleEmails(
        userId,
        input,
      );

    return successResponse(
      res,
      201,
      "Emails scheduled successfully",
      result,
    );
  }
}

export default new EmailController();
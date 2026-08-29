import type {
  Request,
  Response,
} from "express";

import emailRepository from "../repositories/email.repository.js";

import {
  schedulerService,
} from "../services/scheduler.service.js";

import {
  scheduleEmailsSchema,
} from "../validators/email.validator.js";

import {
  successResponse,
} from "../utils/api-response.js";

export class EmailController {
  async schedule(
    req: Request,
    res: Response,
  ) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    const input =
      scheduleEmailsSchema.parse(
        req.body,
      );

    const result =
      await schedulerService.scheduleEmails(
        req.user.id,
        input,
      );

    return successResponse(
      res,
      201,
      "Emails scheduled successfully",
      result,
    );
  }

  async scheduled(
    req: Request,
    res: Response,
  ) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    const jobs =
      await emailRepository.findScheduled(
        req.user.id,
      );

    return successResponse(
      res,
      200,
      "Scheduled emails retrieved successfully",
      jobs,
    );
  }

  async sent(
    req: Request,
    res: Response,
  ) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    const jobs =
      await emailRepository.findSent(
        req.user.id,
      );

    return successResponse(
      res,
      200,
      "Sent emails retrieved successfully",
      jobs,
    );
  }
}

export default new EmailController();
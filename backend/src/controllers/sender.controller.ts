import type {
  Request,
  Response,
} from "express";

import senderRepository from "../repositories/sender.repository.js";

export class SenderController {
  async list(
    req: Request,
    res: Response,
  ) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const senders =
      await senderRepository.findForUser(
        req.user.id,
      );

    const safeSenders =
      senders.map((sender) => ({
        id: sender.id,
        email: sender.email,
        displayName:
          sender.displayName,
        isDefault:
          sender.isDefault,
        smtpHost:
          sender.smtpHost,
        smtpPort:
          sender.smtpPort,
      }));

    return res.status(200).json({
      success: true,
      data: safeSenders,
    });
  }
}

export default new SenderController();
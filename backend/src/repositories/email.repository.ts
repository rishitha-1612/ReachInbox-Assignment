import {
  EmailStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "../config/prisma.js";

export class EmailRepository {
  async createMany(
    data: Prisma.EmailJobCreateManyInput[],
  ) {
    return prisma.emailJob.createMany({
      data,
    });
  }

async findById(id: string) {
  return prisma.emailJob.findUnique({
    where: { id },
    include: {
      sender: true,
    },
  });
}

  async markQueued(
    id: string,
    bullJobId: string,
  ) {
    return prisma.emailJob.updateMany({
      where: {
        id,
        status: EmailStatus.PENDING,
      },
      data: {
        status: EmailStatus.QUEUED,
        bullJobId,
      },
    });
  }

  async markProcessing(id: string) {
    return prisma.emailJob.updateMany({
      where: {
        id,
        status: {
          in: [
            EmailStatus.PENDING,
            EmailStatus.QUEUED,
          ],
        },
      },
      data: {
        status: EmailStatus.PROCESSING,
      },
    });
  }

  async markSent(
    id: string,
    sentAt: Date,
    messageId: string,
  ) {
    return prisma.emailJob.updateMany({
      where: {
        id,
        status: EmailStatus.PROCESSING,
      },
      data: {
        status: EmailStatus.SENT,
        sentAt,
        messageId,
        failureReason: null,
      },
    });
  }

  async markFailed(
    id: string,
    failureReason: string,
  ) {
    return prisma.emailJob.updateMany({
      where: {
        id,
        status: EmailStatus.PROCESSING,
      },
      data: {
        status: EmailStatus.FAILED,
        failureReason,
      },
    });
  }

  async incrementAttempts(id: string) {
    return prisma.emailJob.update({
      where: { id },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });
  }

  async findScheduled(userId: string) {
    return prisma.emailJob.findMany({
      where: {
        userId,
        status: {
          in: [
            EmailStatus.PENDING,
            EmailStatus.QUEUED,
          ],
        },
      },
      orderBy: {
        scheduledFor: "asc",
      },
    });
  }

  async findSent(userId: string) {
    return prisma.emailJob.findMany({
      where: {
        userId,
        status: EmailStatus.SENT,
      },
      orderBy: {
        sentAt: "desc",
      },
    });
  }
}

export default new EmailRepository();
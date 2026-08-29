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

  async findByBatchId(batchId: string) {
    return prisma.emailJob.findMany({
      where: {
        batchId,
      },
      orderBy: {
        createdAt: "asc",
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

  async markQueuedFromProcessing(
    id: string,
  ) {
    return prisma.emailJob.updateMany({
      where: {
        id,
        status: EmailStatus.PROCESSING,
      },
      data: {
        status: EmailStatus.QUEUED,
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

  async findScheduled(userId: string) {
    return prisma.emailJob.findMany({
      where: {
        userId,
        status: {
          in: [
            EmailStatus.PENDING,
            EmailStatus.QUEUED,
            EmailStatus.PROCESSING,
          ],
        },
      },
      orderBy: [
        {
          scheduledFor: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
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

  async findJobsForReconciliation(
    limit = 100,
  ) {
    return prisma.emailJob.findMany({
      where: {
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
      take: limit,
    });
  }
}

export default new EmailRepository();
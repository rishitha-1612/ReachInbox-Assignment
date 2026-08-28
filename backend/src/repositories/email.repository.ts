import {
  EmailStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "../config/prisma.js";

export class EmailRepository {
  /**
   * Create multiple email jobs in a single database operation.
   *
   * Each recipient is represented by its own EmailJob row.
   * The batchId groups all jobs created from one scheduling request.
   */
  async createMany(
    data: Prisma.EmailJobCreateManyInput[],
  ) {
    return prisma.emailJob.createMany({
      data,
    });
  }

  /**
   * Find a single email job together with its sender.
   *
   * PostgreSQL is the source of truth for the email state.
   */
  async findById(id: string) {
    return prisma.emailJob.findUnique({
      where: { id },
      include: {
        sender: true,
      },
    });
  }

  /**
   * Transition PENDING → QUEUED.
   *
   * updateMany is intentional: the status condition makes
   * the transition safe when multiple processes try to
   * update the same job.
   */
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

  /**
   * Transition QUEUED → PROCESSING.
   *
   * PENDING is also accepted so reconciliation can process
   * a job that was persisted before it was successfully queued.
   */
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

  /**
   * Transition PROCESSING → QUEUED.
   *
   * Used when a job is throttled and needs to be rescheduled.
   */
  async markQueuedFromProcessing(id: string) {
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

  /**
   * Record one processing attempt.
   */
  async incrementAttempts(id: string) {
    return prisma.emailJob.update({
      where: {
        id,
      },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Transition PROCESSING → SENT.
   */
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

  /**
   * Transition PROCESSING → FAILED.
   */
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

  /**
   * Retrieve scheduled/queued emails for the dashboard.
   */
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

  /**
   * Retrieve sent emails for the dashboard.
   */
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

  /**
   * Find jobs that may need reconciliation.
   *
   * These are persisted jobs that are ready to be scheduled
   * but may not have a corresponding BullMQ job.
   */
  async findJobsForReconciliation(limit = 100) {
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
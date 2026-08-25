import { prisma } from "../config/prisma.js";

export class EmailRepository {
  async create(data: any) {
    return prisma.emailJob.create({
      data,
    });
  }

  async findScheduled(userId: string) {
    return prisma.emailJob.findMany({
      where: {
        userId,
        status: {
          in: ["PENDING", "QUEUED"],
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
        status: "SENT",
      },
      orderBy: {
        sentAt: "desc",
      },
    });
  }

  async updateStatus(id: string, data: any) {
    return prisma.emailJob.update({
      where: { id },
      data,
    });
  }
}

export default new EmailRepository();
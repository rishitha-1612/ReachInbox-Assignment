import { prisma } from "../config/prisma.js";

export class SenderRepository {
  async findDefaultSender(userId: string) {
    return prisma.sender.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });
  }

  async create(data: any) {
    return prisma.sender.create({
      data,
    });
  }
}

export default new SenderRepository();
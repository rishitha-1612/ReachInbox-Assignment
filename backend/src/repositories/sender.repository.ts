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

  async findByIdForUser(
    senderId: string,
    userId: string,
  ) {
    return prisma.sender.findFirst({
      where: {
        id: senderId,
        userId,
      },
    });
  }

  async create(data: {
    userId: string;
    email: string;
    displayName: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassEncrypted: string;
    isDefault?: boolean;
  }) {
    return prisma.sender.create({
      data,
    });
  }
}

export default new SenderRepository();
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

  async findForUser(userId: string) {
    return prisma.sender.findMany({
      where: {
        userId,
      },
      orderBy: [
        {
          isDefault: "desc",
        },
        {
          createdAt: "asc",
        },
      ],
    });
  }

  async createDefaultSender(data: {
    userId: string;
    email: string;
    displayName: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassEncrypted: string;
  }) {
    return prisma.sender.create({
      data: {
        userId: data.userId,
        email: data.email,
        displayName: data.displayName,
        smtpHost: data.smtpHost,
        smtpPort: data.smtpPort,
        smtpUser: data.smtpUser,
        smtpPassEncrypted:
          data.smtpPassEncrypted,
        isDefault: true,
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
      data: {
        userId: data.userId,
        email: data.email,
        displayName: data.displayName,
        smtpHost: data.smtpHost,
        smtpPort: data.smtpPort,
        smtpUser: data.smtpUser,
        smtpPassEncrypted:
          data.smtpPassEncrypted,
        ...(data.isDefault !== undefined
          ? {
              isDefault:
                data.isDefault,
            }
          : {}),
      },
    });
  }
}

export default new SenderRepository();
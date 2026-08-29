import { prisma } from "../config/prisma.js";

export class UserRepository {
  async upsertGoogleUser(data: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
  }) {
    return prisma.user.upsert({
      where: {
        googleId: data.googleId,
      },
      update: {
        email: data.email,
        name: data.name,
        ...(data.avatar !== undefined
          ? {
              avatar: data.avatar,
            }
          : {}),
      },
      create: {
        googleId: data.googleId,
        email: data.email,
        name: data.name,
        ...(data.avatar !== undefined
          ? {
              avatar: data.avatar,
            }
          : {}),
      },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: {
        id,
      },
    });
  }
}

export default new UserRepository();
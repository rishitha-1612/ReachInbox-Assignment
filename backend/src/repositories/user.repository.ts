import { prisma } from "../config/prisma.js";

export class UserRepository {
  async findByGoogleId(googleId: string) {
    return prisma.user.findUnique({
      where: { googleId },
    });
  }

  async create(data: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
  }) {
    return prisma.user.create({
      data,
    });
  }
}

export default new UserRepository();
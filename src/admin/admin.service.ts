import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        role: true,
        score: true,
        level: true,
        createdAt: true,
      },
    });
  }

  async promoteToAdmin(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      },
    });
  }

  async demoteToUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role: 'USER' },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      },
    });
  }
}

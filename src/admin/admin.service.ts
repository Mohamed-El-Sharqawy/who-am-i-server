import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PaginationService } from '../common/services/pagination.service';
import { PaginatedResult } from '../common/interfaces/pagination.interface';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private paginationService: PaginationService,
  ) {}

  async getAllUsers(page = 1, limit = 10): Promise<PaginatedResult<any>> {
    // Get total count for pagination
    const totalCount = await this.prisma.user.count();
    
    // Get paginated results
    const users = await this.prisma.user.findMany({
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
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    
    // Return paginated result
    return this.paginationService.paginate(users, totalCount, page, limit);
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

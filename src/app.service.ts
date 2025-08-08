import { Injectable } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  getHealth() {
    return {
      message: 'Who Am I API is running!',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  async getStatus() {
    try {
      // Get database statistics
      const [userCount, categoryCount, cardCount, roomCount] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.category.count({ where: { isActive: true } }),
        this.prisma.card.count({ where: { isActive: true } }),
        this.prisma.room.count({ where: { isActive: true } }),
      ]);

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        database: {
          connected: true,
          statistics: {
            users: userCount,
            categories: categoryCount,
            cards: cardCount,
            activeRooms: roomCount,
          },
        },
        features: {
          authentication: true,
          categories: true,
          cards: true,
          rooms: true,
          realTimeGame: true,
          caching: true,
          swagger: true,
        },
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        database: {
          connected: false,
          error: error.message,
        },
      };
    }
  }
}

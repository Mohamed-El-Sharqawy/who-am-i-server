import { Module } from '@nestjs/common';
import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';

@Module({
  controllers: [CardsController],
  providers: [CardsService, PrismaService, RedisService],
  exports: [CardsService],
})
export class CardsModule {}

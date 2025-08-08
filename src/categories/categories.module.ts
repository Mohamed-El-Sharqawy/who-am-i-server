import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, PrismaService, RedisService],
  exports: [CategoriesService],
})
export class CategoriesModule {}

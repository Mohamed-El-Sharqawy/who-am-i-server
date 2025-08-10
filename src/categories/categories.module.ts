import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CloudinaryModule, CommonModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, PrismaService, RedisService],
  exports: [CategoriesService],
})
export class CategoriesModule {}

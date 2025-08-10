import { Module } from '@nestjs/common';
import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CloudinaryModule, CommonModule],
  controllers: [CardsController],
  providers: [CardsService, PrismaService, RedisService],
  exports: [CardsService],
})
export class CardsModule {}

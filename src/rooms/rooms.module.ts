import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';

@Module({
  controllers: [RoomsController],
  providers: [RoomsService, PrismaService, RedisService],
  exports: [RoomsService],
})
export class RoomsModule {}

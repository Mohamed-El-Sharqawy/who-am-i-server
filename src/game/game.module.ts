import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GameGateway } from './game.gateway';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';
import { CardsService } from '../cards/cards.service';
import { FriendsService } from '../friends/friends.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: {
          expiresIn: configService.get('jwt.expiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [GameGateway, PrismaService, RedisService, CardsService, FriendsService],
  exports: [GameGateway],
})
export class GameModule {}

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';
import { PaginationService } from '../common/services/pagination.service';
import { PaginatedResult } from '../common/interfaces/pagination.interface';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomResponseDto } from './dto/room-response.dto';

@Injectable()
export class RoomsService {
  private readonly CACHE_TTL = 60 * 5; // 5 minutes
  private readonly CACHE_PREFIX = 'room';

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private paginationService: PaginationService,
  ) {}

  async create(createRoomDto: CreateRoomDto, creatorId: string): Promise<RoomResponseDto> {
    const { name, settings } = createRoomDto;

    // Check if user already has an active room
    const existingRoom = await this.prisma.room.findFirst({
      where: {
        creatorId,
        isActive: true,
        status: { in: ['WAITING', 'PLAYING'] },
      },
    });

    if (existingRoom) {
      throw new ConflictException('You already have an active room. Please finish or leave it first.');
    }

    // Default settings
    const defaultSettings = {
      maxRounds: 5,
      timePerRound: 60,
      categoryIds: [],
      difficulty: { min: 1, max: 5 },
      ...settings,
    };

    const room = await this.prisma.room.create({
      data: {
        name,
        creatorId,
        settings: defaultSettings,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        guest: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    // Cache the room
    const roomResponse = this.formatRoomResponse(room);
    await this.redisService.setObject(`${this.CACHE_PREFIX}:${room.id}`, roomResponse, this.CACHE_TTL);

    // Invalidate rooms list cache
    await this.redisService.invalidatePattern(`${this.CACHE_PREFIX}:list:*`);

    return roomResponse;
  }

  async findAll(
    status?: string,
    page = 1,
    limit = 20,
  ): Promise<{ rooms: RoomResponseDto[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;
    const cacheKey = `${this.CACHE_PREFIX}:list:${status || 'all'}:${page}:${limit}`;
    
    // Try to get from cache first
    const cachedResult = await this.redisService.getObject<{ rooms: RoomResponseDto[]; total: number; pages: number }>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const where = {
      isActive: true,
      ...(status && { status: status as any }),
    };

    const [rooms, total] = await Promise.all([
      this.prisma.room.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          guest: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.room.count({ where }),
    ]);

    const formattedRooms = rooms.map(room => this.formatRoomResponse(room));

    const result = {
      rooms: formattedRooms,
      total,
      pages: Math.ceil(total / limit),
    };

    // Cache the result
    await this.redisService.setObject(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async findOne(id: string): Promise<RoomResponseDto> {
    const cacheKey = `${this.CACHE_PREFIX}:${id}`;
    
    // Try to get from cache first
    const cachedRoom = await this.redisService.getObject<RoomResponseDto>(cacheKey);
    if (cachedRoom) {
      return cachedRoom;
    }

    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        guest: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const roomResponse = this.formatRoomResponse(room);

    // Cache the result
    await this.redisService.setObject(cacheKey, roomResponse, this.CACHE_TTL);

    return roomResponse;
  }

  async joinRoom(roomId: string, userId: string): Promise<RoomResponseDto> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        guest: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (!room.isActive) {
      throw new BadRequestException('Room is not active');
    }

    if (room.status !== 'WAITING') {
      throw new BadRequestException('Room is not accepting new players');
    }

    if (room.creatorId === userId) {
      throw new BadRequestException('You cannot join your own room');
    }

    if (room.guestId) {
      throw new ConflictException('Room is already full');
    }

    // Check if user is already in another active room
    const userActiveRoom = await this.prisma.room.findFirst({
      where: {
        OR: [
          { creatorId: userId },
          { guestId: userId },
        ],
        isActive: true,
        status: { in: ['WAITING', 'PLAYING'] },
      },
    });

    if (userActiveRoom) {
      throw new ConflictException('You are already in an active room');
    }

    // Join the room
    const updatedRoom = await this.prisma.room.update({
      where: { id: roomId },
      data: { guestId: userId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        guest: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    const roomResponse = this.formatRoomResponse(updatedRoom);

    // Update cache
    await this.redisService.setObject(`${this.CACHE_PREFIX}:${roomId}`, roomResponse, this.CACHE_TTL);
    await this.redisService.invalidatePattern(`${this.CACHE_PREFIX}:list:*`);

    return roomResponse;
  }

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.creatorId !== userId && room.guestId !== userId) {
      throw new ForbiddenException('You are not a member of this room');
    }

    if (room.creatorId === userId) {
      // If creator leaves, deactivate the room
      await this.prisma.room.update({
        where: { id: roomId },
        data: {
          isActive: false,
          status: 'FINISHED',
        },
      });
    } else {
      // If guest leaves, just remove them
      await this.prisma.room.update({
        where: { id: roomId },
        data: { guestId: null },
      });
    }

    // Invalidate cache
    await this.redisService.del(`${this.CACHE_PREFIX}:${roomId}`);
    await this.redisService.invalidatePattern(`${this.CACHE_PREFIX}:list:*`);
  }

  async startGame(roomId: string, userId: string): Promise<RoomResponseDto> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        guest: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.creatorId !== userId) {
      throw new ForbiddenException('Only the room creator can start the game');
    }

    if (!room.guestId) {
      throw new BadRequestException('Cannot start game without a second player');
    }

    if (room.status !== 'WAITING') {
      throw new BadRequestException('Game has already started or finished');
    }

    // Update room status
    const updatedRoom = await this.prisma.room.update({
      where: { id: roomId },
      data: { status: 'PLAYING' },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        guest: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    const roomResponse = this.formatRoomResponse(updatedRoom);

    // Update cache
    await this.redisService.setObject(`${this.CACHE_PREFIX}:${roomId}`, roomResponse, this.CACHE_TTL);
    await this.redisService.invalidatePattern(`${this.CACHE_PREFIX}:list:*`);

    return roomResponse;
  }

  async getAvailableRooms(page = 1, limit = 10): Promise<PaginatedResult<RoomResponseDto>> {
    const cacheKey = `${this.CACHE_PREFIX}:available:${page}:${limit}`;
    
    // Try to get from cache first
    const cachedResult = await this.redisService.getObject<PaginatedResult<RoomResponseDto>>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    const result = await this.findAll('WAITING', page, limit);
    const availableRooms = result.rooms.filter(room => room.playerCount < room.maxPlayers);
    
    // Calculate total count of available rooms
    const availableRoomsCount = await this.prisma.room.count({
      where: {
        status: 'WAITING',
        isActive: true,
        guestId: null, // No guest means available
      },
    });
    
    const paginatedResult = this.paginationService.paginate(
      availableRooms,
      availableRoomsCount,
      page,
      limit
    );
    
    // Cache the result
    await this.redisService.setObject(cacheKey, paginatedResult, this.CACHE_TTL);
    
    return paginatedResult;
  }

  async getUserRooms(userId: string, page = 1, limit = 10): Promise<PaginatedResult<RoomResponseDto>> {
    const cacheKey = `${this.CACHE_PREFIX}:user:${userId}:${page}:${limit}`;
    
    // Try to get from cache first
    const cachedResult = await this.redisService.getObject<PaginatedResult<RoomResponseDto>>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // Get total count for pagination
    const totalCount = await this.prisma.room.count({
      where: {
        OR: [
          { creatorId: userId },
          { guestId: userId },
        ],
        isActive: true,
      },
    });

    // Get paginated results
    const rooms = await this.prisma.room.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { guestId: userId },
        ],
        isActive: true,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        guest: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const formattedRooms = rooms.map(room => this.formatRoomResponse(room));
    
    // Create paginated result
    const paginatedResult = this.paginationService.paginate(
      formattedRooms,
      totalCount,
      page,
      limit
    );

    // Cache the result
    await this.redisService.setObject(cacheKey, paginatedResult, this.CACHE_TTL);

    return paginatedResult;
  }

  private formatRoomResponse(room: any): RoomResponseDto {
    return {
      id: room.id,
      name: room.name,
      isActive: room.isActive,
      maxPlayers: room.maxPlayers,
      status: room.status,
      settings: room.settings,
      creator: room.creator,
      guest: room.guest,
      playerCount: room.guest ? 2 : 1,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }
}

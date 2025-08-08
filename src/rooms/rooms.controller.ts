import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { RoomResponseDto } from './dto/room-response.dto';

@ApiTags('Rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new room' })
  @ApiResponse({
    status: 201,
    description: 'Room created successfully',
    type: RoomResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'User already has an active room',
  })
  create(@Body() createRoomDto: CreateRoomDto, @Request() req): Promise<RoomResponseDto> {
    return this.roomsService.create(createRoomDto, req.user.id);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all rooms with pagination' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by room status (WAITING, PLAYING, FINISHED)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'Rooms retrieved successfully',
  })
  findAll(
    @Query('status') status?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.roomsService.findAll(status, page, limit);
  }

  @Get('available')
  @Public()
  @ApiOperation({ summary: 'Get available rooms (waiting for players)' })
  @ApiResponse({
    status: 200,
    description: 'Available rooms retrieved successfully',
    type: [RoomResponseDto],
  })
  getAvailableRooms(): Promise<RoomResponseDto[]> {
    return this.roomsService.getAvailableRooms();
  }

  @Get('my-rooms')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user rooms' })
  @ApiResponse({
    status: 200,
    description: 'User rooms retrieved successfully',
    type: [RoomResponseDto],
  })
  getUserRooms(@Request() req): Promise<RoomResponseDto[]> {
    return this.roomsService.getUserRooms(req.user.id);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get room by ID' })
  @ApiParam({ name: 'id', description: 'Room ID' })
  @ApiResponse({
    status: 200,
    description: 'Room retrieved successfully',
    type: RoomResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Room not found',
  })
  findOne(@Param('id') id: string): Promise<RoomResponseDto> {
    return this.roomsService.findOne(id);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join a room' })
  @ApiParam({ name: 'id', description: 'Room ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully joined room',
    type: RoomResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Room not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot join room (full, not active, etc.)',
  })
  @ApiResponse({
    status: 409,
    description: 'User already in another room',
  })
  joinRoom(@Param('id') roomId: string, @Request() req): Promise<RoomResponseDto> {
    return this.roomsService.joinRoom(roomId, req.user.id);
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start the game in a room (creator only)' })
  @ApiParam({ name: 'id', description: 'Room ID' })
  @ApiResponse({
    status: 200,
    description: 'Game started successfully',
    type: RoomResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Room not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Only room creator can start the game',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot start game (not enough players, already started, etc.)',
  })
  startGame(@Param('id') roomId: string, @Request() req): Promise<RoomResponseDto> {
    return this.roomsService.startGame(roomId, req.user.id);
  }

  @Delete(':id/leave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leave a room' })
  @ApiParam({ name: 'id', description: 'Room ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully left room',
  })
  @ApiResponse({
    status: 404,
    description: 'Room not found',
  })
  @ApiResponse({
    status: 403,
    description: 'User is not a member of this room',
  })
  leaveRoom(@Param('id') roomId: string, @Request() req): Promise<void> {
    return this.roomsService.leaveRoom(roomId, req.user.id);
  }
}

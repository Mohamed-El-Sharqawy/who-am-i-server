import { ApiProperty } from '@nestjs/swagger';

export class RoomResponseDto {
  @ApiProperty({
    description: 'Room ID',
    example: 'clp1234567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'Room name',
    example: 'Epic Guessing Battle',
  })
  name: string;

  @ApiProperty({
    description: 'Whether the room is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Maximum number of players',
    example: 2,
  })
  maxPlayers: number;

  @ApiProperty({
    description: 'Room status',
    example: 'WAITING',
    enum: ['WAITING', 'PLAYING', 'FINISHED'],
  })
  status: string;

  @ApiProperty({
    description: 'Game settings',
    example: {
      maxRounds: 5,
      timePerRound: 60,
      categoryIds: ['clp1234567890abcdef'],
      difficulty: { min: 1, max: 5 }
    },
  })
  settings?: any;

  @ApiProperty({
    description: 'Room creator information',
  })
  creator: {
    id: string;
    username: string;
    avatar?: string;
  };

  @ApiProperty({
    description: 'Guest player information (if joined)',
    required: false,
  })
  guest?: {
    id: string;
    username: string;
    avatar?: string;
  };

  @ApiProperty({
    description: 'Current number of players',
    example: 1,
  })
  playerCount: number;

  @ApiProperty({
    description: 'Room creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Room last update date',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

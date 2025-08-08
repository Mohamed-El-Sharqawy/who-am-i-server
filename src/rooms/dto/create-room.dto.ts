import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, MinLength, MaxLength } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({
    description: 'Room name',
    example: 'Epic Guessing Battle',
  })
  @IsString()
  @MinLength(3, { message: 'Room name must be at least 3 characters long' })
  @MaxLength(50, { message: 'Room name must not exceed 50 characters' })
  name: string;

  @ApiProperty({
    description: 'Game settings (rounds, time per round, categories, etc.)',
    example: {
      maxRounds: 5,
      timePerRound: 60,
      categoryIds: ['clp1234567890abcdef'],
      difficulty: { min: 1, max: 5 }
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  settings?: {
    maxRounds?: number;
    timePerRound?: number;
    categoryIds?: string[];
    difficulty?: {
      min: number;
      max: number;
    };
  };
}

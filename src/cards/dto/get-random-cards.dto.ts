import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsArray, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetRandomCardsDto {
  @ApiProperty({
    description: 'Number of cards to retrieve',
    example: 5,
    minimum: 1,
    maximum: 50,
    default: 5,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1, { message: 'Count must be at least 1' })
  @Max(50, { message: 'Count must not exceed 50' })
  count?: number = 5;

  @ApiProperty({
    description: 'Category IDs to filter by (optional)',
    example: ['clp1234567890abcdef', 'clp0987654321fedcba'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @ApiProperty({
    description: 'Minimum difficulty level (1-5)',
    example: 1,
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1, { message: 'Minimum difficulty must be at least 1' })
  @Max(5, { message: 'Minimum difficulty must not exceed 5' })
  minDifficulty?: number;

  @ApiProperty({
    description: 'Maximum difficulty level (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1, { message: 'Maximum difficulty must be at least 1' })
  @Max(5, { message: 'Maximum difficulty must not exceed 5' })
  maxDifficulty?: number;
}

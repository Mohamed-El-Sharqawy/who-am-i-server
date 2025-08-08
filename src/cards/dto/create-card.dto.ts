import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  MinLength,
  MaxLength,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

export class CreateCardDto {
  @ApiProperty({
    description: 'Card name (person/character name)',
    example: 'Leonardo DiCaprio',
  })
  @IsString()
  @MinLength(2, { message: 'Card name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Card name must not exceed 100 characters' })
  name: string;

  @ApiProperty({
    description: 'Card description',
    example: 'Academy Award-winning American actor known for Titanic, Inception, and The Revenant',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  description?: string;

  @ApiProperty({
    description: 'Card image URL',
    example: 'https://example.com/leonardo-dicaprio.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({
    description: 'Array of hints for the card',
    example: ['Born in 1974', 'Starred in Titanic', 'Won Oscar for The Revenant', 'Environmental activist'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one hint is required' })
  @ArrayMaxSize(10, { message: 'Maximum 10 hints allowed' })
  @IsString({ each: true })
  @MaxLength(200, { each: true, message: 'Each hint must not exceed 200 characters' })
  hints: string[];

  @ApiProperty({
    description: 'Difficulty level (1-5)',
    example: 3,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1, { message: 'Difficulty must be at least 1' })
  @Max(5, { message: 'Difficulty must not exceed 5' })
  difficulty: number;

  @ApiProperty({
    description: 'Category ID this card belongs to',
    example: 'clp1234567890abcdef',
  })
  @IsString()
  categoryId: string;

  @ApiProperty({
    description: 'Whether the card is active',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

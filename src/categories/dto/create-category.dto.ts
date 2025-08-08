import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Actors & Actresses',
  })
  @IsString()
  @MinLength(2, { message: 'Category name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Category name must not exceed 50 characters' })
  name: string;

  @ApiProperty({
    description: 'Category description',
    example: 'Famous actors and actresses from movies and TV shows',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Description must not exceed 200 characters' })
  description?: string;

  @ApiProperty({
    description: 'Category image URL',
    example: 'https://example.com/category-image.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({
    description: 'Whether the category is active',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

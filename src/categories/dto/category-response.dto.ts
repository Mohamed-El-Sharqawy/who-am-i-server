import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({
    description: 'Category ID',
    example: 'clp1234567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'Category name',
    example: 'Actors & Actresses',
  })
  name: string;

  @ApiProperty({
    description: 'Category description',
    example: 'Famous actors and actresses from movies and TV shows',
  })
  description?: string;

  @ApiProperty({
    description: 'Category image URL',
    example: 'https://example.com/category-image.jpg',
  })
  imageUrl?: string;

  @ApiProperty({
    description: 'Whether the category is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Number of cards in this category',
    example: 150,
  })
  cardCount: number;

  @ApiProperty({
    description: 'Category creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Category last update date',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

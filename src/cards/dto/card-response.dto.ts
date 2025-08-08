import { ApiProperty } from '@nestjs/swagger';

export class CardResponseDto {
  @ApiProperty({
    description: 'Card ID',
    example: 'clp1234567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'Card name',
    example: 'Leonardo DiCaprio',
  })
  name: string;

  @ApiProperty({
    description: 'Card description',
    example: 'Academy Award-winning American actor known for Titanic, Inception, and The Revenant',
  })
  description?: string;

  @ApiProperty({
    description: 'Card image URL',
    example: 'https://example.com/leonardo-dicaprio.jpg',
  })
  imageUrl?: string;

  @ApiProperty({
    description: 'Array of hints for the card',
    example: ['Born in 1974', 'Starred in Titanic', 'Won Oscar for The Revenant', 'Environmental activist'],
    type: [String],
  })
  hints: string[];

  @ApiProperty({
    description: 'Difficulty level (1-5)',
    example: 3,
  })
  difficulty: number;

  @ApiProperty({
    description: 'Whether the card is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Category information',
  })
  category: {
    id: string;
    name: string;
  };

  @ApiProperty({
    description: 'Card creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Card last update date',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

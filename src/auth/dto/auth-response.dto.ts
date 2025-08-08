import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'User information',
  })
  user: {
    id: string;
    email: string;
    username: string;
    avatar?: string;
    score: number;
    level: number;
    createdAt: Date;
  };
}

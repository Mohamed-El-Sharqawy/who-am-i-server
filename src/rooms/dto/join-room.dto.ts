import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class JoinRoomDto {
  @ApiProperty({
    description: 'Room ID to join',
    example: 'clp1234567890abcdef',
  })
  @IsString()
  roomId: string;
}

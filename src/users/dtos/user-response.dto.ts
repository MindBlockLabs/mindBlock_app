import { ApiProperty } from '@nestjs/swagger';
import { userRole } from '../enums/userRole.enum';

export class UserResponseDto {
  @ApiProperty({ example: 1, description: 'User ID' })
  id: number;

  @ApiProperty({ example: 'fatimaaminu', description: 'Unique username' })
  username: string;

  @ApiProperty({ example: 'fatimaaminu@mail.com', description: 'User email' })
  email: string;

  @ApiProperty({
    enum: userRole,
    example: userRole.USER,
    description: 'Role of the user',
  })
  userRole: userRole;

  @ApiProperty({
    example: 'google-unique-id',
    description: 'Google ID of the user (if any)',
    required: false,
  })
  googleId?: string;

  @ApiProperty({
    example: ['rating123', 'rating124'],
    isArray: true,
    description: 'List of leaderboard entry IDs associated with this user',
  })
  leaderboardEntries?: string[];
}

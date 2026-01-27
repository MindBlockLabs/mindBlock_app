import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object (DTO) for refresh token.
 */
export class RefreshTokenDto {
  /**
   * The refresh token used for authentication.
   */
  @ApiProperty({
    description: 'The refresh token used for authentication.',
    example: 'some-refresh-token',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

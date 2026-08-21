import { Injectable } from '@nestjs/common';
import { RefreshTokenDto } from '../dtos/refreshTokenDto';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { SessionsProvider } from './sessions.provider';

/**
 * Refresh token provider class
 */
@ApiTags('Auth')
@Injectable()
export class RefreshTokensProvider {
  constructor(
    /**
     * Injecting SessionsProvider for secure session management
     */
    private readonly sessionsProvider: SessionsProvider,
  ) {}

  /**
   * Refreshes tokens using the provided refresh token DTO
   * @param refreshTokenDto The DTO containing the refresh token
   * @returns New access and refresh tokens
   */
  @ApiOperation({ summary: 'Refresh authentication tokens' })
  @ApiBody({ type: RefreshTokenDto })
  public async refreshTokens(
    refreshTokenDto: RefreshTokenDto,
    deviceInfo?: string,
    ipAddress?: string,
  ) {
    // Use sessions provider to validate and rotate the refresh token
    return await this.sessionsProvider.refreshSession(
      refreshTokenDto.refreshToken,
      deviceInfo,
      ipAddress,
    );
  }
}
/* eslint-disable prettier/prettier */
import { forwardRef, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from '../authConfig/jwt.config';
import { ConfigType } from '@nestjs/config';
import { UsersService } from 'src/users/providers/users.service';
import { User } from 'src/users/user.entity';

/**
 * Generate token provider
 */
@ApiTags('Auth')
@Injectable()
export class GenerateTokensProvider {
  constructor(
    /**
     * Injecting UserService repository
     */
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,

    /**
     * Injecting JwtService for token management
     */
    private readonly jwtService: JwtService,

    /**
     * Injecting JWT configuration
     */
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  /**
   * Signs a token for a user
   * @param userId - The ID of the user
   * @param expiresIn - Token expiration time
   * @param payload - Optional additional payload
   * @returns A signed JWT token
   */
  @ApiOperation({ summary: 'Sign JWT Token' })
  public async signToken<T>(userId: string, username: string, expiresIn: number, payload?: T) {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        username,
        ...payload,
      },
      {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        expiresIn,
      },
    );
  }

  /**
   * Generates access and refresh tokens for a user
   * @param user - The user entity
   * @returns An object containing access and refresh tokens
   */
  @ApiOperation({ summary: 'Generate Access and Refresh Tokens' })
public async generateTokens(user: User) {
  if (!user.username) {
    throw new Error('user not found');
  }

  const [accessToken, refreshToken] = await Promise.all([
    this.signToken(user.id, user.username, this.jwtConfiguration.ttl, { email: user.email }),
    this.signToken(user.id, user.username, this.jwtConfiguration.ttl)
  ]);

  return { accessToken, refreshToken, user };
}

}
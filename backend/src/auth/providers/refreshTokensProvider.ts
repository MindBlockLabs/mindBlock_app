import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RefreshTokenDto } from '../dtos/refreshTokenDto';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import jwtConfig from '../authConfig/jwt.config';
import { GenerateTokensProvider } from './generate-tokens.provider';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { UsersService } from '../../users/providers/users.service';

/**
 * Refresh token provider class
 */
@ApiTags('Auth')
@Injectable()
export class RefreshTokensProvider {
  constructor(
    /**
     * Injecting UserService repository
     */
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,

    /**
     * Injecting JwtService
     */
    private readonly jwtService: JwtService,

    /**
     * Injecting JWT Configuration
     */
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,

    /**
     * Injecting GenerateTokensProvider
     */
    private readonly generateTokenProvider: GenerateTokensProvider,
  ) {}

  /**
   * Refreshes tokens using the provided refresh token DTO
   * @param refreshTokenDto The DTO containing the refresh token
   * @returns New access and refresh tokens
   */
  @ApiOperation({ summary: 'Refresh authentication tokens' })
  @ApiBody({ type: RefreshTokenDto })
  public async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    // Validate the refresh token using JWT
    const { sub } = await this.jwtService.verifyAsync(
      refreshTokenDto.refreshToken,
      {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      },
    );

    // Retrieve the user from the database
    const user = await this.userService.findOneByGoogleId(sub);

    // inside refreshTokens
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new tokens
    return await this.generateTokenProvider.generateTokens(user);
  }
}

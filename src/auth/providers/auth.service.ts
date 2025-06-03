import { Injectable, Inject } from '@nestjs/common';
import { forwardRef } from '@nestjs/common';
import { LoginDto } from '../dtos/login.dto';
import { UsersService } from 'src/users/providers/users.service';
import { SignInProvider } from './sign-in.provider';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import { RefreshTokenDto } from '../dtos/refreshTokenDto';
import { RefreshTokensProvider } from './refreshTokensProvider';

interface OAuthUser {
  email: string;
  username: string;
  picture: string;
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    // injecting user service
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,

    // inject signInProvider
    private readonly signInProvider: SignInProvider,

    /**
     * Injecting RefreshTokensProvider for token management
     */
    private readonly refreshTokensProvider: RefreshTokensProvider,
  ) {}

  public async SignIn(signInDto: LoginDto) {
    return await this.signInProvider.SignIn(signInDto);
  }

  /**
   * Handles refreshing of access tokens
   * @param refreshTokenDto - DTO containing the refresh token
   * @returns A new access token if the refresh token is valid
   */
  @ApiOperation({ summary: 'Refresh Access Token' })
  @ApiBody({ type: RefreshTokenDto })
  public refreshToken(refreshTokenDto: RefreshTokenDto) {
    return this.refreshTokensProvider.refreshTokens(refreshTokenDto);
  }
}

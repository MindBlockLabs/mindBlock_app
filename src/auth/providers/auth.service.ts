import { Injectable } from '@nestjs/common';
import { LoginDto } from '../dtos/login.dto';
import { SignInProvider } from './sign-in.provider';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import { RefreshTokenDto } from '../dtos/refreshTokenDto';
import { RefreshTokensProvider } from './refreshTokensProvider';
import { WalletLoginDto } from '../dtos/walletLogin.dto';
import { WalletLoginProvider } from './wallet-login.provider';

interface OAuthUser {
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    // inject signInProvider
    private readonly signInProvider: SignInProvider,

    // inject walletLoginProvider
    private readonly walletLoginProvider: WalletLoginProvider,

    /**
     * Injecting RefreshTokensProvider for token management
     */
    private readonly refreshTokensProvider: RefreshTokensProvider,
  ) {}

  public async SignIn(signInDto: LoginDto) {
    return await this.signInProvider.SignIn(signInDto);
  }

  public async WalletLogin(dto: WalletLoginDto) {
    return await this.walletLoginProvider.WalletLogin(dto);
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

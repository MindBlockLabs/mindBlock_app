import { BadRequestException, Injectable } from '@nestjs/common';
import { LoginDto } from '../dtos/login.dto';
import { SignInProvider } from './sign-in.provider';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import { RefreshTokenDto } from '../dtos/refreshTokenDto';
import { RefreshTokensProvider } from './refreshTokensProvider';
import { StellarWalletLoginDto } from '../dtos/walletLogin.dto';
import { StellarWalletLoginProvider } from './wallet-login.provider';
import { NonceResponseDto } from '../dtos/nonceResponse.dto';
import { ForgotPasswordProvider } from './forgot-password.provider';
import { ResetPasswordProvider } from './reset-password.provider';
import { ForgotPasswordDto } from '../dtos/forgot-password.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { NonceService } from './nonce.service';

@Injectable()
export class AuthService {
  constructor(
    /**
     * inject signInProvider
     */
    private readonly signInProvider: SignInProvider,

    /**
     *  inject stellarWalletLoginProvider
     */
    private readonly stellarWalletLoginProvider: StellarWalletLoginProvider,

    /**
     * Injecting RefreshTokensProvider for token management
     */
    private readonly refreshTokensProvider: RefreshTokensProvider,

    /**
     *  inject forgotPasswordProvider
     */
    private readonly forgotPasswordProvider: ForgotPasswordProvider,

    /**
     *  inject resetPasswordProvider
     */
    private readonly resetPasswordProvider: ResetPasswordProvider,

    /**
     * inject nonceService
     */
    private readonly nonceService: NonceService,
  ) {}

  public async SignIn(signInDto: LoginDto) {
    return await this.signInProvider.SignIn(signInDto);
  }

  public async StellarWalletLogin(dto: StellarWalletLoginDto) {
    return await this.stellarWalletLoginProvider.StellarWalletLogin(dto);
  }

  // Generate nonce for wallet authentication
  public generateNonce(walletAddress: string): NonceResponseDto {
    // Validate wallet address format
    if (!walletAddress || !this.isValidStellarAddress(walletAddress)) {
      throw new BadRequestException('Invalid Stellar wallet address');
    }

    // Generate secure nonce
    const nonce = this.createSecureNonce(walletAddress);
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes from now

    // Store nonce via NonceService
    this.nonceService.storeNonce(nonce, walletAddress, expiresAt);

    // Clean up expired nonces periodically
    this.nonceService.cleanupExpiredNonces();

    return { nonce, expiresAt };
  }

  // Check nonce status (useful for debugging)
  public checkNonceStatus(nonce: string) {
    const nonceData = this.nonceService.getNonce(nonce);

    if (!nonceData) {
      return { valid: false, reason: 'Nonce not found' };
    }

    if (nonceData.used) {
      return { valid: false, reason: 'Nonce already used' };
    }

    if (Date.now() > nonceData.expiresAt) {
      return { valid: false, reason: 'Nonce expired' };
    }

    return {
      valid: true,
      walletAddress: nonceData.walletAddress,
      expiresAt: nonceData.expiresAt,
    };
  }

  // Verify and mark nonce as used (called by StellarWalletLoginProvider)
  public verifyAndUseNonce(nonce: string, walletAddress: string): void {
    this.nonceService.verifyAndUseNonce(nonce, walletAddress);
  }

  private createSecureNonce(walletAddress: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const addressSuffix = walletAddress.slice(-6);
    return `stellar_nonce_${timestamp}_${random}_${addressSuffix}`;
  }

  private isValidStellarAddress(address: string): boolean {
    // Stellar address validation - starts with G for public key or M for muxed account
    // and is 56 characters long (base32 encoded)
    return /^[GM][A-Z2-7]{55}$/.test(address);
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
  public async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    return await this.forgotPasswordProvider.forgotPassword(forgotPasswordDto);
  }

  public async resetPassword(
    token: string,
    resetPasswordDto: ResetPasswordDto,
  ) {
    return await this.resetPasswordProvider.resetPassword(
      token,
      resetPasswordDto,
    );
  }
}

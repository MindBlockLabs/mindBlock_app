import { BadRequestException, Injectable } from '@nestjs/common';
import { LoginDto } from '../dtos/login.dto';
import { SignInProvider } from './sign-in.provider';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import { RefreshTokenDto } from '../dtos/refreshTokenDto';
import { RefreshTokensProvider } from './refreshTokensProvider';
import { WalletLoginDto } from '../dtos/walletLogin.dto';
import { WalletLoginProvider } from './wallet-login.provider';
import { NonceResponseDto } from '../dtos/nonceResponse.dto';

interface OAuthUser {
  email: string;
  username: string;
  picture: string;
  accessToken: string;
}

@Injectable()
export class AuthService {
  private nonces = new Map<
    string,
    { walletAddress: string; expiresAt: number; used: boolean }
  >();

  constructor(
    /**
     * inject signInProvider
     */
    private readonly signInProvider: SignInProvider,

    /**
     *  inject walletLoginProvider
     */
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

  // Generate nonce for wallet authentication
  public async generateNonce(walletAddress: string): Promise<NonceResponseDto> {
    // Validate wallet address format
    if (!walletAddress || !this.isValidStarknetAddress(walletAddress)) {
      throw new BadRequestException('Invalid Starknet wallet address');
    }

    // Generate secure nonce
    const nonce = this.createSecureNonce(walletAddress);
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes from now

    // Store nonce
    this.nonces.set(nonce, {
      walletAddress,
      expiresAt,
      used: false,
    });

    // Clean up expired nonces periodically
    this.cleanupExpiredNonces();

    return { nonce, expiresAt };
  }

  // Check nonce status (useful for debugging)
  public async checkNonceStatus(nonce: string) {
    const nonceData = this.nonces.get(nonce);

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

  // Verify and mark nonce as used (called by WalletLoginProvider)
  public async verifyAndUseNonce(
    nonce: string,
    walletAddress: string,
  ): Promise<void> {
    const nonceData = this.nonces.get(nonce);

    if (!nonceData) {
      throw new BadRequestException('Invalid nonce');
    }

    if (nonceData.used) {
      throw new BadRequestException('Nonce already used');
    }

    if (Date.now() > nonceData.expiresAt) {
      throw new BadRequestException('Nonce expired');
    }

    if (nonceData.walletAddress !== walletAddress) {
      throw new BadRequestException('Nonce wallet address mismatch');
    }

    // Mark as used
    nonceData.used = true;
    this.nonces.set(nonce, nonceData);
  }

  private createSecureNonce(walletAddress: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const addressSuffix = walletAddress.slice(-6);
    return `nonce_${timestamp}_${random}_${addressSuffix}`;
  }

  private isValidStarknetAddress(address: string): boolean {
    // Basic Starknet address validation
    return /^0x[0-9a-fA-F]{1,64}$/.test(address);
  }

  private cleanupExpiredNonces(): void {
    const now = Date.now();
    for (const [nonce, data] of this.nonces.entries()) {
      if (now > data.expiresAt) {
        this.nonces.delete(nonce);
      }
    }
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

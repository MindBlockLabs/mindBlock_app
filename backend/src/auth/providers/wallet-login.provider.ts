import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import { UsersService } from '../../users/providers/users.service';
import jwtConfig from '../authConfig/jwt.config';
import { AuthService } from './auth.service';
import * as StellarSdk from 'stellar-sdk';
import * as crypto from 'crypto';
import { StellarWalletLoginDto } from '../dtos/walletLogin.dto';
import { ChallengeLevel } from '../../users/enums/challengeLevel.enum';
import { AgeGroup } from '../../users/enums/ageGroup.enum';

@Injectable()
export class StellarWalletLoginProvider {
  constructor(
    // injecting userService repo
    private readonly userService: UsersService,

    // inject jwt service
    private readonly jwtService: JwtService,

    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,

    // inject jwt
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  public async StellarWalletLogin(dto: StellarWalletLoginDto) {
    try {
      // 1. Verify nonce hasn't been used and use it (synchronous method)
      this.authService.verifyAndUseNonce(dto.nonce, dto.walletAddress);

      // 2. Create proper message to sign
      const message = this.createLoginMessage(dto.walletAddress, dto.nonce);

      // 3. Verify the signature using Stellar's ed25519 verification
      const isValid = this.verifySignature(
        message,
        dto.signature,
        dto.publicKey,
      );

      if (!isValid) {
        throw new UnauthorizedException('Signature is incorrect');
      }

      // 4. Verify the public key belongs to the wallet address
      this.verifyPublicKeyOwnership(dto.walletAddress, dto.publicKey);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new UnauthorizedException('Authentication failed: ' + message);
    }

    // Check if user exists in db
    let user = await this.userService.getOneByWallet(dto.walletAddress);

    if (!user) {
      // Auto-create a new user
      user = await this.userService.create({
        walletAddress: dto.walletAddress,
        publicKey: dto.publicKey,
        username: `stellar_user_${dto.walletAddress.slice(0, 6)}`,
        provider: 'stellar_wallet',
        challengeLevel: ChallengeLevel.BEGINNER,
        challengeTypes: [],
        ageGroup: AgeGroup.TEENS,
      });
    }

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        walletAddress: user.stellarWallet,
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        expiresIn: this.jwtConfiguration.ttl,
      },
    );

    return { accessToken };
  }

  private createLoginMessage(walletAddress: string, nonce: string): string {
    // Create a standardized message format for Stellar
    return `Login to MyApp\nWallet: ${walletAddress}\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;
  }

  private verifySignature(
    message: string,
    signature: string,
    publicKey: string,
  ): boolean {
    try {
      // Convert message to buffer
      const messageBuffer = Buffer.from(message, 'utf8');

      // Convert signature from base64 to buffer
      const signatureBuffer = Buffer.from(signature, 'base64');

      // Convert public key from Stellar format to PEM encoded ed25519 public key
      const stellarKeypair = StellarSdk.Keypair.fromPublicKey(publicKey);
      const publicKeyBuffer = stellarKeypair.rawPublicKey();

      // Convert raw public key to PEM format
      const publicKeyPem =
        '-----BEGIN PUBLIC KEY-----\n' +
        Buffer.from(publicKeyBuffer)
          .toString('base64')
          .match(/.{1,64}/g)
          ?.join('\n') +
        '\n-----END PUBLIC KEY-----\n';

      // Verify signature using ed25519
      const isValid = crypto.verify(
        null, // algorithm is null for ed25519
        messageBuffer,
        {
          key: publicKeyPem,
          format: 'pem',
          type: 'spki',
        },
        signatureBuffer,
      );

      return isValid;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  private verifyPublicKeyOwnership(
    walletAddress: string,
    publicKey: string,
  ): void {
    try {
      // Verify that the public key matches the wallet address
      const keypair = StellarSdk.Keypair.fromPublicKey(publicKey);
      const derivedAddress = keypair.publicKey();

      if (derivedAddress !== walletAddress) {
        throw new Error('Public key does not match wallet address');
      }

      // Basic validation: ensure public key is valid Stellar format
      if (!StellarSdk.StrKey.isValidEd25519PublicKey(publicKey)) {
        throw new Error('Invalid Stellar public key format');
      }

      // Additional validation: check if address is valid Stellar address
      if (!StellarSdk.StrKey.isValidEd25519PublicKey(walletAddress)) {
        throw new Error('Invalid Stellar wallet address format');
      }

      console.log(
        `Public key ownership verification for ${walletAddress} with key ${publicKey} - validation passed`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new UnauthorizedException(
        `Public key verification failed: ${message}`,
      );
    }
  }
}

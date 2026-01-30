import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import { UsersService } from '../../users/providers/users.service';
import jwtConfig from '../authConfig/jwt.config';
import { NonceService } from './nonce.service';
import * as StellarSdk from 'stellar-sdk';
import * as crypto from 'crypto';
import { StellarWalletLoginDto } from '../dtos/walletLogin.dto';
import { ChallengeLevel } from '../../users/enums/challengeLevel.enum';
import { AgeGroup } from '../../users/enums/ageGroup.enum';
import { User } from 'src/users/user.entity';

@Injectable()
export class StellarWalletLoginProvider {
  constructor(
    // injecting userService repo
    private readonly userService: UsersService,

    // inject jwt service
    private readonly jwtService: JwtService,

    private readonly nonceService: NonceService,

    // inject jwt
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  public async StellarWalletLogin(dto: StellarWalletLoginDto) {
    try {
      // 1. Verify nonce hasn't been used and use it (synchronous method)
      this.nonceService.verifyAndUseNonce(dto.nonce, dto.walletAddress);

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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      throw new UnauthorizedException('Authentication failed: ' + errorMessage);
    }

    // Check if user exists in db
    let user: User | null = null;
    try {
      user = await this.userService.getOneByWallet(dto.walletAddress);
    } catch {
      // If user doesn't exist, getOneByWallet throws UnauthorizedException
      // We catch it here so we can proceed to auto-create the user
      console.log(
        `User not found for wallet ${dto.walletAddress}, will attempt auto-creation.`,
      );
    }

    if (!user) {
      // Auto-create a new user
      user = await this.userService.create({
        walletAddress: dto.walletAddress,
        publicKey: dto.publicKey,
        username: `stellar_user_${dto.walletAddress.slice(-6)}`,
        fullname: `Stellar User ${dto.walletAddress.slice(0, 4)}...${dto.walletAddress.slice(-4)}`,
        provider: 'wallet',
        challengeLevel: ChallengeLevel.BEGINNER,
        challengeTypes: [],
        ageGroup: AgeGroup.TEENS,
      });
      console.log(`Successfully created new wallet user: ${user.id}`);
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
    // Simply sign the nonce to ensure determinism between frontend and backend
    return nonce;
  }

  private verifySignature(
    message: string,
    signature: string,
    publicKey: string,
  ): boolean {
    const prefix = 'Stellar Signed Message:\n';
    const fullMessage = prefix + message;

    console.log(`[Signature Verification] 
      Public Key: ${publicKey}
      Raw Message: ${message}
      Full Message (SEP-0053): ${JSON.stringify(fullMessage)}
      Signature (base64): ${signature}`);

    try {
      // 1. Convert combined message to UTF-8 bytes
      const messageBuffer = Buffer.from(fullMessage, 'utf8');

      // 2. Compute SHA-256 hash of the prefixed message (Standard for SEP-0053)
      const messageHash = crypto
        .createHash('sha256')
        .update(messageBuffer)
        .digest();

      // 3. Convert signature from base64 to buffer
      const signatureBuffer = Buffer.from(signature, 'base64');

      // 4. Use Stellar SDK's native verification on the HASH
      const keypair = StellarSdk.Keypair.fromPublicKey(publicKey);
      const isValid = keypair.verify(messageHash, signatureBuffer);

      if (!isValid) {
        console.error(
          `[Signature Verification Result] FAILED for ${publicKey}`,
        );
      } else {
        console.log(`[Signature Verification Result] SUCCESS for ${publicKey}`);
      }

      return isValid;
    } catch (error) {
      console.error('[Signature Verification Error]', error);
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
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new UnauthorizedException(
        `Public key verification failed: ${errorMessage}`,
      );
    }
  }
}

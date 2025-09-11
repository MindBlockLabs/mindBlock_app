import { forwardRef, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ec, hash } from 'starknet';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import { UsersService } from '../../users/providers/users.service';
import jwtConfig from '../authConfig/jwt.config';
import { WalletLoginDto } from '../dtos/walletLogin.dto';
import { AuthService } from './auth.service';

@Injectable()
export class WalletLoginProvider {
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

  public async WalletLogin(dto: WalletLoginDto) {
    try {
      // 1. Verify nonce hasn't been used and use it (implement nonce storage)
      await this.authService.verifyAndUseNonce(dto.nonce, dto.walletAddress);

      // 2. Create proper message to sign
      const message = this.createLoginMessage(dto.walletAddress, dto.nonce);

      // 3. Hash the message using Starknet's message hashing
      const messageHash = hash.starknetKeccak(message).toString(16);

      const r = BigInt(dto.signature[0]);
      const s = BigInt(dto.signature[1]);

      const isValid = ec.starkCurve.verify(
        [r, s] as any,
        messageHash,
        dto.publicKey,
      );

      if (!isValid) {
        throw new UnauthorizedException('signature is incorrect');
      }

      // 5. Verify the public key belongs to the wallet address
      await this.verifyPublicKeyOwnership(dto.walletAddress, dto.publicKey);
    } catch (err) {
      throw new UnauthorizedException('Authentication failed: ' + err.message);
    }
    // check if user exist in db
    // throw error if user doesnt exist
    let user = await this.userService.getOneByWallet(dto.walletAddress);

    if (!user) {
      // Auto-create a new user
      user = await this.userService.create({
        walletAddress: dto.walletAddress,
        publicKey: dto.publicKey,
        username: `user_${dto.walletAddress.slice(2, 8)}`,
        provider: 'wallet',
      });
    }

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        walletAddress: user.starknetWallet,
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        expiresIn: this.jwtConfiguration.ttl,
      },
    );

    // login
    return { accessToken };
  }

  private createLoginMessage(walletAddress: string, nonce: string): string {
    // Create a standardized message format
    return `Login to MyApp\nWallet: ${walletAddress}\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;
  }

  private async verifyPublicKeyOwnership(
    walletAddress: string,
    publicKey: string,
  ): Promise<void> {
    // Verify that the public key is associated with the wallet address
    // This might involve checking the account contract or using Starknet RPC
    // to verify the public key is valid for this address

    try {
      // Basic validation: ensure public key is valid format
      if (!publicKey || !publicKey.startsWith('0x')) {
        throw new Error('Invalid public key format');
      }

      // Additional validation: check if public key length is correct for Starknet
      const cleanPublicKey = publicKey.replace('0x', '');
      if (cleanPublicKey.length !== 64) {
        throw new Error('Invalid public key length');
      }

      // TODO: Implement actual verification against Starknet network
      // This could involve:
      // 1. Calling the account contract to verify the public key
      // 2. Using Starknet RPC to validate the relationship
      // 3. Checking a cached mapping of wallet->publicKey relationships

      console.log(
        `Public key ownership verification for ${walletAddress} with key ${publicKey} - basic validation passed`,
      );
    } catch (error) {
      throw new UnauthorizedException(
        `Public key verification failed: ${error.message}`,
      );
    }
  }
}

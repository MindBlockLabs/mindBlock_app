import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as StellarSdk from 'stellar-sdk';
import { BlockchainService } from './blockchain.service';

/**
 * LinkWalletOptions defines the shape of the user record the host
 * application passes in. The middleware stays agnostic of the ORM.
 */
export interface LinkWalletUser {
  /** Unique user identifier */
  id: string;
  /** Player username passed to the contract */
  username: string;
  /** Current level used as iq_level on the contract */
  level: number;
  /** Existing stellarWallet value — null/undefined means not yet linked */
  stellarWallet?: string | null;
}

/**
 * LinkWalletCallbacks provides two async functions the host application
 * supplies so the middleware can look up users and persist the wallet
 * without depending on any specific ORM or database layer.
 */
export interface LinkWalletCallbacks {
  /** Returns the user identified by id, or null if not found. */
  findUserById: (id: string) => Promise<LinkWalletUser | null>;
  /**
   * Returns the user whose stellarWallet matches the given address,
   * or null if no user owns that wallet.
   */
  findUserByWallet: (wallet: string) => Promise<LinkWalletUser | null>;
  /** Persists the stellarWallet on the user record and returns the updated user. */
  saveWallet: (
    userId: string,
    stellarWallet: string,
  ) => Promise<LinkWalletUser>;
}

export interface LinkWalletResult {
  success: boolean;
  message: string;
  stellarWallet: string;
}

/**
 * LinkWalletProvider — Issue #308
 *
 * Implements the PATCH /users/link-wallet business logic:
 *   1. Validates the Stellar address format (Ed25519 public key).
 *   2. Ensures the wallet is not already linked to another account.
 *   3. Saves the wallet to the user record via the provided callback.
 *   4. Fires registerPlayerOnChain non-blocking after the DB save.
 *
 * The provider is ORM-agnostic — the host module supplies LinkWalletCallbacks
 * so this middleware works with any persistence layer.
 *
 * Usage in a NestJS controller:
 *
 *   @Patch('link-wallet')
 *   @UseGuards(AuthGuard('jwt'))
 *   async linkWallet(@ActiveUser('sub') userId: string, @Body() dto: { stellarWallet: string }) {
 *     return this.linkWalletProvider.execute(userId, dto.stellarWallet, {
 *       findUserById:    (id)     => this.usersService.findOneById(id),
 *       findUserByWallet:(wallet) => this.usersService.getOneByWallet(wallet),
 *       saveWallet:      (id, w)  => this.usersService.updateWallet(id, w),
 *     });
 *   }
 */
@Injectable()
export class LinkWalletProvider {
  private readonly logger = new Logger(LinkWalletProvider.name);

  constructor(private readonly blockchainService: BlockchainService) {}

  /**
   * Executes the wallet linking flow.
   *
   * @param userId       - Authenticated user's ID from the JWT payload.
   * @param stellarWallet - Stellar public key the user wants to link.
   * @param callbacks    - ORM-agnostic DB access functions supplied by the host.
   */
  async execute(
    userId: string,
    stellarWallet: string,
    callbacks: LinkWalletCallbacks,
  ): Promise<LinkWalletResult> {
    // 1. Validate Stellar address format
    if (!this.isValidStellarAddress(stellarWallet)) {
      throw new BadRequestException(
        'Invalid Stellar wallet address. Must be a valid Ed25519 public key (starts with G, 56 characters).',
      );
    }

    // 2. Load the requesting user
    const user = await callbacks.findUserById(userId);
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // 3. Check if the wallet is already linked to another account
    const existingOwner = await callbacks.findUserByWallet(stellarWallet);
    if (existingOwner && existingOwner.id !== userId) {
      throw new ConflictException(
        'This Stellar wallet is already linked to a different account.',
      );
    }

    // 4. Save the wallet to the user record
    const updatedUser = await callbacks.saveWallet(userId, stellarWallet);
    this.logger.log(
      `Stellar wallet linked for user ${userId}: ${stellarWallet}`,
    );

    // 5. Trigger on-chain registration — non-blocking, must not affect the response
    this.blockchainService
      .registerPlayerOnChain(
        stellarWallet,
        updatedUser.username,
        updatedUser.level,
      )
      .catch((err) =>
        this.logger.error(
          `registerPlayerOnChain failed after wallet link for user ${userId}: ${err.message}`,
          err.stack,
        ),
      );

    return {
      success: true,
      message: 'Stellar wallet linked successfully.',
      stellarWallet,
    };
  }

  /**
   * Returns true when the address is a valid Stellar Ed25519 public key
   * (starts with G, 56 alphanumeric characters).
   */
  private isValidStellarAddress(address: string): boolean {
    try {
      return StellarSdk.StrKey.isValidEd25519PublicKey(address);
    } catch {
      return false;
    }
  }
}

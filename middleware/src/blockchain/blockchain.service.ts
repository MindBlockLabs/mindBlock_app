import { Injectable } from '@nestjs/common';
import { GetPlayerProvider } from './providers/get-player.provider';
import { RegisterPlayerProvider } from './providers/register-player.provider';
import { SubmitPuzzleProvider } from './providers/submit-puzzle.provider';
import { SyncXpMilestoneProvider } from './providers/sync-xp-milestone.provider';
import { SyncStreakProvider } from './providers/sync-streak.provider';

/**
 * BlockchainService — Issue #307
 *
 * Central passthrough service that exposes all Soroban contract interactions.
 * Inject this service into any NestJS provider that needs blockchain access
 * (ProgressCalculationProvider, CompleteDailyQuestProvider, UpdateStreakProvider,
 * StellarWalletLoginProvider, LinkWalletProvider).
 *
 * Environment variables required:
 *   STELLAR_SECRET_KEY          — Oracle wallet secret key (signs transactions)
 *   STELLAR_CONTRACT_ID         — Deployed Soroban contract ID
 *   STELLAR_RPC_URL             — Stellar RPC endpoint (default: testnet)
 *   STELLAR_NETWORK_PASSPHRASE  — Network passphrase (default: testnet)
 *   STREAK_SYNC_ENABLED         — true | false  (gates syncStreakOnChain)
 */
@Injectable()
export class BlockchainService {
  constructor(
    private readonly getPlayerProvider: GetPlayerProvider,
    private readonly registerPlayerProvider: RegisterPlayerProvider,
    private readonly submitPuzzleProvider: SubmitPuzzleProvider,
    private readonly syncXpMilestoneProvider: SyncXpMilestoneProvider,
    private readonly syncStreakProvider: SyncStreakProvider,
  ) {}

  /**
   * Fetches a player's on-chain profile (read-only simulation).
   */
  async getPlayerOnChain(stellarWallet: string): Promise<object | null> {
    return this.getPlayerProvider.getPlayerOnChain(stellarWallet);
  }

  /**
   * Registers a new player on the smart contract.
   * Called after wallet linking or first-time wallet login (Issue #308).
   */
  async registerPlayerOnChain(
    stellarWallet: string,
    username: string,
    iqLevel: number,
  ): Promise<void> {
    return this.registerPlayerProvider.registerPlayerOnChain(
      stellarWallet,
      username,
      iqLevel,
    );
  }

  /**
   * Records a correct puzzle submission on the smart contract (Issue #309).
   * Score must be normalized to a 0–100 scale before calling.
   */
  async submitPuzzleOnChain(
    stellarWallet: string,
    puzzleId: string,
    categoryId: string,
    score: number,
  ): Promise<void> {
    return this.submitPuzzleProvider.submitPuzzleOnChain(
      stellarWallet,
      puzzleId,
      categoryId,
      score,
    );
  }

  /**
   * Syncs a player's XP milestone (level-up) to the smart contract (Issue #309, #307).
   * Called from CompleteDailyQuestProvider when level changes after bonus XP.
   */
  async syncXpMilestone(
    stellarWallet: string,
    newLevel: number,
    totalXp: number,
  ): Promise<void> {
    return this.syncXpMilestoneProvider.syncXpMilestone(
      stellarWallet,
      newLevel,
      totalXp,
    );
  }

  /**
   * Pushes a verified Postgres streak count to the smart contract (Issue #310).
   * Gated behind STREAK_SYNC_ENABLED until the contract exposes sync_streak.
   */
  async syncStreakOnChain(
    stellarWallet: string,
    currentStreak: number,
  ): Promise<void> {
    return this.syncStreakProvider.syncStreakOnChain(
      stellarWallet,
      currentStreak,
    );
  }
}

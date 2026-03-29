import { Injectable } from '@nestjs/common';
import { GetPlayerProvider } from '../providers/get-player.provider';
import { RegisterPlayerProvider } from '../providers/register-player.provider';
import { SyncXpMilestoneProvider } from '../providers/sync-xp-milestone.provider';

@Injectable()
export class BlockchainService {
  constructor(
    private readonly getPlayerProvider: GetPlayerProvider,
    private readonly registerPlayerProvider: RegisterPlayerProvider,
    private readonly syncXpMilestoneProvider: SyncXpMilestoneProvider,
  ) {}

  getHello(): string {
    return 'Hello from Blockchain Service';
  }

  /**
   * Fetches a player's on-chain profile from the Soroban contract.
   * @param stellarWallet The player's Stellar wallet address.
   * @returns The player object if found, null otherwise.
   */
  async getPlayerOnChain(stellarWallet: string): Promise<object | null> {
    return this.getPlayerProvider.getPlayerOnChain(stellarWallet);
  }

  /**
   * Registers a player on the Soroban smart contract.
   * @param stellarWallet The player's Stellar wallet address.
   * @param username The player's chosen username.
   * @param iqLevel The player's initial IQ level.
   * @returns The transaction result if successful.
   */
  async registerPlayerOnChain(
    stellarWallet: string,
    username: string,
    iqLevel: number,
  ): Promise<any> {
    return this.registerPlayerProvider.registerPlayerOnChain(
      stellarWallet,
      username,
      iqLevel,
    );
  }

  /**
   * Syncs an XP milestone (level-up event) to the blockchain.
   * This is a fire-and-forget operation - failures are logged but never thrown.
   * @param stellarWallet The player's Stellar wallet address.
   * @param newLevel The player's new level after level-up.
   * @param totalXp The player's total XP at time of level-up.
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
}

import { Injectable } from '@nestjs/common';
import { SubmitPuzzleProvider } from '../providers/submit-puzzle.provider';

@Injectable()
export class BlockchainService {
  constructor(private readonly submitPuzzleProvider: SubmitPuzzleProvider) {}

  async submitPuzzleOnChain(
    stellarWallet: string,
    puzzleId: string,
    category: string,
    score: number,
  ): Promise<void> {
    return this.submitPuzzleProvider.submitPuzzleOnChain(
      stellarWallet,
      puzzleId,
      category,
      score,
    );
  }

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
}

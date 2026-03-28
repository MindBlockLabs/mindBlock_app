import { Injectable } from '@nestjs/common';
import { GetPlayerProvider } from '../providers/get-player.provider';

@Injectable()
export class BlockchainService {
  constructor(private readonly getPlayerProvider: GetPlayerProvider) {}

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

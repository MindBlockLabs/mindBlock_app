import { Injectable } from '@nestjs/common';
import { GetPlayerProvider } from '../providers/get-player.provider';
import { RegisterPlayerProvider } from '../providers/register-player.provider';

@Injectable()
export class BlockchainService {
  constructor(
    private readonly getPlayerProvider: GetPlayerProvider,
    private readonly registerPlayerProvider: RegisterPlayerProvider,
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
}

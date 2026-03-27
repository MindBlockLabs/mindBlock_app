import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as StellarSdk from 'stellar-sdk';

@Injectable()
export class GetPlayerProvider {
  private readonly logger = new Logger(GetPlayerProvider.name);
  private readonly server: StellarSdk.rpc.Server;
  private readonly contractId: string | undefined;

  constructor(private readonly configService: ConfigService) {
    const rpcUrl =
      this.configService.get<string>('SOROBAN_RPC_URL') ||
      'https://soroban-testnet.stellar.org';
    this.server = new StellarSdk.rpc.Server(rpcUrl);
    this.contractId = this.configService.get<string>('SOROBAN_CONTRACT_ID');
  }

  /**
   * Fetches a player's on-chain profile from the Soroban contract.
   * @param stellarWallet The player's Stellar wallet address.
   * @returns The player object if found, null otherwise.
   */
  async getPlayerOnChain(stellarWallet: string): Promise<object | null> {
    try {
      if (!this.contractId) {
        this.logger.error('SOROBAN_CONTRACT_ID is not defined in environment variables');
        return null;
      }

      // 1. Prepare contract and address
      const contract = new StellarSdk.Contract(this.contractId);
      const address = StellarSdk.Address.fromString(stellarWallet);

      // 2. Build simulation transaction
      // We use a dummy source account as this is a read-only simulation
      const sourceAccount = new StellarSdk.Account(
        'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
        '0',
      );
      
      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: '100',
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(
          contract.call(
            'get_player',
            StellarSdk.nativeToScVal(address, { type: 'address' }),
          ),
        )
        .setTimeout(StellarSdk.TimeoutInfinite)
        .build();

      // 3. Simulate the transaction
      const simulation = await this.server.simulateTransaction(transaction);

      // 4. Handle results
      if (StellarSdk.rpc.Api.isSimulationSuccess(simulation)) {
        const resultVal = simulation.result?.retval;

        // If result is null/void, it means the player wasn't found (Option::None)
        if (
          !resultVal ||
          resultVal.switch().value === StellarSdk.xdr.ScValType.scvVoid().value
        ) {
          this.logger.debug(`Player ${stellarWallet} not found on-chain.`);
          return null;
        }

        // Convert XDR value to native JS object
        const player = StellarSdk.scValToNative(resultVal);
        this.logger.log(`Successfully fetched on-chain stats for ${stellarWallet}`);
        
        return player;
      }

      this.logger.warn(`Simulation failed for get_player(${stellarWallet})`);
      return null;
    } catch (error) {
      this.logger.error(
        `Error fetching player on-chain (${stellarWallet}): ${error.message}`,
        error.stack,
      );
      return null;
    }
  }
}

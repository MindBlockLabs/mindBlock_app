import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as StellarSdk from 'stellar-sdk';

@Injectable()
export class GetPlayerProvider {
  private readonly logger = new Logger(GetPlayerProvider.name);
  private readonly server: StellarSdk.rpc.Server;
  private readonly contractId: string | undefined;
  private readonly networkPassphrase: string;

  constructor(private readonly configService: ConfigService) {
    const rpcUrl =
      this.configService.get<string>('STELLAR_RPC_URL') ||
      'https://soroban-testnet.stellar.org';
    this.server = new StellarSdk.rpc.Server(rpcUrl);
    this.contractId = this.configService.get<string>('STELLAR_CONTRACT_ID');
    this.networkPassphrase =
      this.configService.get<string>('STELLAR_NETWORK_PASSPHRASE') ||
      StellarSdk.Networks.TESTNET;
  }

  /**
   * Fetches a player's on-chain profile from the Soroban smart contract.
   * Read-only: uses simulation, no signing needed.
   *
   * @param stellarWallet - The player's Stellar public key address.
   * @returns The player object if found on-chain, null otherwise.
   */
  async getPlayerOnChain(stellarWallet: string): Promise<object | null> {
    try {
      if (!this.contractId) {
        this.logger.warn(
          'STELLAR_CONTRACT_ID not configured — skipping getPlayerOnChain',
        );
        return null;
      }

      const contract = new StellarSdk.Contract(this.contractId);
      const address = StellarSdk.Address.fromString(stellarWallet);

      // Use a dummy source account for read-only simulation
      const sourceAccount = new StellarSdk.Account(
        'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
        '0',
      );

      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: '100',
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          contract.call(
            'get_player',
            StellarSdk.nativeToScVal(address, { type: 'address' }),
          ),
        )
        .setTimeout(StellarSdk.TimeoutInfinite)
        .build();

      const simulation = await this.server.simulateTransaction(transaction);

      if (StellarSdk.rpc.Api.isSimulationSuccess(simulation)) {
        const resultVal = simulation.result?.retval;

        if (
          !resultVal ||
          resultVal.switch().value ===
            StellarSdk.xdr.ScValType.scvVoid().value
        ) {
          this.logger.debug(`Player ${stellarWallet} not found on-chain.`);
          return null;
        }

        const player = StellarSdk.scValToNative(resultVal);
        this.logger.log(
          `Successfully fetched on-chain profile for ${stellarWallet}`,
        );
        return player;
      }

      this.logger.warn(
        `Simulation failed for get_player(${stellarWallet})`,
      );
      return null;
    } catch (error) {
      this.logger.error(
        `getPlayerOnChain failed for ${stellarWallet}: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }
}

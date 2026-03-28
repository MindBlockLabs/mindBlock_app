import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as StellarSdk from 'stellar-sdk';

@Injectable()
export class RegisterPlayerProvider {
  private readonly logger = new Logger(RegisterPlayerProvider.name);
  private readonly server: StellarSdk.rpc.Server;
  private readonly contractId: string | undefined;
  private readonly adminSecret: string | undefined;

  constructor(private readonly configService: ConfigService) {
    const rpcUrl =
      this.configService.get<string>('SOROBAN_RPC_URL') ||
      'https://soroban-testnet.stellar.org';
    this.server = new StellarSdk.rpc.Server(rpcUrl);
    this.contractId = this.configService.get<string>('SOROBAN_CONTRACT_ID');
    this.adminSecret = this.configService.get<string>('SOROBAN_ADMIN_SECRET');
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
    try {
      if (!this.contractId) {
        throw new Error('SOROBAN_CONTRACT_ID is not defined');
      }
      if (!this.adminSecret) {
        throw new Error('SOROBAN_ADMIN_SECRET is not defined');
      }

      // 1. Prepare admin keypair and address
      const adminKeypair = StellarSdk.Keypair.fromSecret(this.adminSecret);
      const playerAddress = StellarSdk.Address.fromString(stellarWallet);
      const contract = new StellarSdk.Contract(this.contractId);

      // 2. Fetch source account details
      const sourceAccount = await this.server.getAccount(adminKeypair.publicKey());

      // 3. Build the transaction
      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: '1000', // Base fee for Soroban
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(
          contract.call(
            'register_player',
            StellarSdk.nativeToScVal(playerAddress, { type: 'address' }),
            StellarSdk.nativeToScVal(username, { type: 'string' }),
            StellarSdk.nativeToScVal(iqLevel, { type: 'u32' }),
          ),
        )
        .setTimeout(StellarSdk.TimeoutInfinite)
        .build();

      // 4. Simulate the transaction
      const simulation = await this.server.simulateTransaction(transaction);

      if (!StellarSdk.rpc.Api.isSimulationSuccess(simulation)) {
        const errorMsg = (simulation as any).error || 'Unknown simulation error';
        this.logger.error(`Simulation failed: ${errorMsg}`);
        throw new Error(`Simulation failed: ${errorMsg}`);
      }

      // 5. Assemble and sign the transaction
      // We need to add the footprint and other resources from simulation
      const assembledTransaction = StellarSdk.rpc.assembleTransaction(
        transaction,
        simulation,
      );
      
      assembledTransaction.sign(adminKeypair);

      // 6. Submit the transaction
      const result = await this.server.sendTransaction(assembledTransaction);

      if (result.status === 'PENDING') {
        const txHash = result.hash;
        this.logger.log(`Transaction submitted successfully. Hash: ${txHash}`);
        
        // Poll for result
        let txResult = await this.server.getTransaction(txHash);
        while (txResult.status === 'NOT_FOUND' || txResult.status === 'PENDING') {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          txResult = await this.server.getTransaction(txHash);
        }

        if (txResult.status === 'SUCCESS') {
          this.logger.log(`Player ${username} registered on-chain: ${stellarWallet}`);
          return txResult;
        } else {
          this.logger.error(`Transaction failed for ${stellarWallet}: ${JSON.stringify(txResult)}`);
          throw new Error('Transaction failed after submission');
        }
      }

      this.logger.error(`Transaction submission failed: ${JSON.stringify(result)}`);
      throw new Error('Transaction submission failed');
    } catch (error) {
      this.logger.error(
        `Error registering player on-chain (${stellarWallet}): ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}

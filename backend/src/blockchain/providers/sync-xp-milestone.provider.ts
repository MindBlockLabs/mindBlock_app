import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as StellarSdk from 'stellar-sdk';

@Injectable()
export class SyncXpMilestoneProvider {
  private readonly logger = new Logger(SyncXpMilestoneProvider.name);
  private readonly server: StellarSdk.rpc.Server;
  private readonly contractId: string | undefined;
  private readonly oracleSecret: string | undefined;

  constructor(private readonly configService: ConfigService) {
    const rpcUrl =
      this.configService.get<string>('SOROBAN_RPC_URL') ||
      'https://soroban-testnet.stellar.org';
    this.server = new StellarSdk.rpc.Server(rpcUrl);
    this.contractId = this.configService.get<string>('SOROBAN_CONTRACT_ID');
    this.oracleSecret = this.configService.get<string>('SOROBAN_ADMIN_SECRET');
  }

  /**
   * Syncs an XP milestone (level-up event) to the Soroban smart contract.
   * Uses update_iq_level contract function to record the milestone on-chain.
   * 
   * This method is fire-and-forget: failures are logged but never thrown
   * to ensure they don't affect the user's XP update in the database.
   * 
   * @param stellarWallet The player's Stellar wallet address.
   * @param newLevel The player's new level after level-up.
   * @param totalXp The player's total XP at time of level-up.
   */
  async syncXpMilestone(
    stellarWallet: string,
    newLevel: number,
    totalXp: number,
  ): Promise<void> {
    try {
      if (!this.contractId) {
        this.logger.warn(
          `Cannot sync XP milestone: SOROBAN_CONTRACT_ID not configured. ` +
          `Wallet: ${stellarWallet}, Level: ${newLevel}, XP: ${totalXp}`,
        );
        return;
      }

      if (!this.oracleSecret) {
        this.logger.warn(
          `Cannot sync XP milestone: SOROBAN_ADMIN_SECRET not configured. ` +
          `Wallet: ${stellarWallet}, Level: ${newLevel}, XP: ${totalXp}`,
        );
        return;
      }

      if (!stellarWallet) {
        this.logger.warn(
          `Cannot sync XP milestone: No Stellar wallet provided. ` +
          `Level: ${newLevel}, XP: ${totalXp}`,
        );
        return;
      }

      this.logger.log(
        `Syncing XP milestone to blockchain: ` +
        `Wallet: ${stellarWallet}, Level: ${newLevel}, XP: ${totalXp}`,
      );

      // 1. Prepare oracle keypair and player address
      const oracleKeypair = StellarSdk.Keypair.fromSecret(this.oracleSecret);
      const playerAddress = StellarSdk.Address.fromString(stellarWallet);
      const contract = new StellarSdk.Contract(this.contractId);

      // 2. Fetch source account details
      const sourceAccount = await this.server.getAccount(oracleKeypair.publicKey());

      // 3. Build the transaction calling update_iq_level
      // This is the closest existing contract function for milestone updates
      // until a dedicated milestone function is added in v2
      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: '1000',
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(
          contract.call(
            'update_iq_level',
            StellarSdk.nativeToScVal(playerAddress, { type: 'address' }),
            StellarSdk.nativeToScVal(newLevel, { type: 'u32' }),
          ),
        )
        .setTimeout(StellarSdk.TimeoutInfinite)
        .build();

      // 4. Simulate the transaction
      const simulation = await this.server.simulateTransaction(transaction);

      if (!StellarSdk.rpc.Api.isSimulationSuccess(simulation)) {
        const errorMsg = (simulation as any).error || 'Unknown simulation error';
        this.logger.error(
          `XP milestone simulation failed for ${stellarWallet}: ${errorMsg}. ` +
          `Level: ${newLevel}, XP: ${totalXp}`,
        );
        return;
      }

      // 5. Assemble and sign the transaction
      const assembledTransaction: any = StellarSdk.rpc.assembleTransaction(
        transaction,
        simulation,
      );

      let txToSign: any;
      if (typeof assembledTransaction.sign === 'function') {
        txToSign = assembledTransaction;
      } else if (typeof assembledTransaction.build === 'function') {
        txToSign = assembledTransaction.build();
      } else {
        this.logger.error(
          `XP milestone assembly failed for ${stellarWallet}: Invalid transaction type. ` +
          `Level: ${newLevel}, XP: ${totalXp}`,
        );
        return;
      }

      txToSign.sign(oracleKeypair);

      // 6. Submit the transaction
      const result: any = await this.server.sendTransaction(txToSign);

      if (result.status === 'PENDING') {
        const txHash = result.hash;
        this.logger.log(
          `XP milestone transaction submitted. Hash: ${txHash}, ` +
          `Wallet: ${stellarWallet}, Level: ${newLevel}`,
        );

        // Poll for result
        let txResult: any = await this.server.getTransaction(txHash);
        let pollCount = 0;
        const maxPolls = 30; // Max 30 seconds of polling

        while (
          (txResult.status === 'NOT_FOUND' || txResult.status === 'PENDING') &&
          pollCount < maxPolls
        ) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          txResult = await this.server.getTransaction(txHash);
          pollCount++;
        }

        if (txResult.status === 'SUCCESS') {
          this.logger.log(
            `XP milestone synced successfully: ` +
            `Wallet: ${stellarWallet}, Level: ${newLevel}, XP: ${totalXp}, Hash: ${txHash}`,
          );
          return;
        } else {
          this.logger.error(
            `XP milestone transaction failed for ${stellarWallet}: ` +
            `Status: ${txResult.status}, Level: ${newLevel}, XP: ${totalXp}`,
          );
          return;
        }
      }

      this.logger.error(
        `XP milestone submission failed for ${stellarWallet}: ` +
        `Status: ${result.status}, Level: ${newLevel}, XP: ${totalXp}`,
      );
    } catch (error) {
      // Never throw - log and continue
      this.logger.error(
        `Error syncing XP milestone for ${stellarWallet}: ${error.message}. ` +
        `Level: ${newLevel}, XP: ${totalXp}`,
        error.stack,
      );
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as StellarSdk from 'stellar-sdk';

@Injectable()
export class SyncXpMilestoneProvider {
  private readonly logger = new Logger(SyncXpMilestoneProvider.name);
  private readonly server: StellarSdk.rpc.Server;
  private readonly contractId: string | undefined;
  private readonly networkPassphrase: string;
  private readonly secretKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    const rpcUrl =
      this.configService.get<string>('STELLAR_RPC_URL') ||
      'https://soroban-testnet.stellar.org';
    this.server = new StellarSdk.rpc.Server(rpcUrl);
    this.contractId = this.configService.get<string>('STELLAR_CONTRACT_ID');
    this.networkPassphrase =
      this.configService.get<string>('STELLAR_NETWORK_PASSPHRASE') ||
      StellarSdk.Networks.TESTNET;
    this.secretKey = this.configService.get<string>('STELLAR_SECRET_KEY');
  }

  /**
   * Syncs a player's XP milestone (level-up) to the Soroban smart contract (Issues #309, #307).
   * Called after a level-up event is confirmed in Postgres.
   * Non-blocking: errors are caught and logged without propagation.
   *
   * @param stellarWallet - The player's Stellar public key address.
   * @param newLevel      - The player's new level after the XP milestone.
   * @param totalXp       - The player's cumulative XP total.
   */
  async syncXpMilestone(
    stellarWallet: string,
    newLevel: number,
    totalXp: number,
  ): Promise<void> {
    try {
      if (!this.contractId || !this.secretKey) {
        this.logger.warn(
          'STELLAR_CONTRACT_ID or STELLAR_SECRET_KEY not configured — skipping syncXpMilestone',
        );
        return;
      }

      const oracleKeypair = StellarSdk.Keypair.fromSecret(this.secretKey);
      const oracleAccount = await this.server.getAccount(
        oracleKeypair.publicKey(),
      );
      const contract = new StellarSdk.Contract(this.contractId);

      const transaction = new StellarSdk.TransactionBuilder(oracleAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          contract.call(
            'sync_xp_milestone',
            StellarSdk.nativeToScVal(
              StellarSdk.Address.fromString(stellarWallet),
              { type: 'address' },
            ),
            StellarSdk.nativeToScVal(newLevel, { type: 'u32' }),
            StellarSdk.nativeToScVal(totalXp, { type: 'u64' }),
          ),
        )
        .setTimeout(30)
        .build();

      const prepared = await this.server.prepareTransaction(transaction);
      (prepared as StellarSdk.Transaction).sign(oracleKeypair);

      const result = await this.server.sendTransaction(
        prepared as StellarSdk.Transaction,
      );
      this.logger.log(
        `syncXpMilestone submitted for ${stellarWallet}, level ${newLevel}: tx hash ${result.hash}`,
      );
    } catch (error) {
      this.logger.error(
        `syncXpMilestone failed for ${stellarWallet}: ${error.message}`,
        error.stack,
      );
    }
  }
}

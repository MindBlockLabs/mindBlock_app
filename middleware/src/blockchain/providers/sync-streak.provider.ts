import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as StellarSdk from 'stellar-sdk';

/**
 * SyncStreakProvider — Issue #310
 *
 * Pushes a verified Postgres streak count to the Soroban smart contract.
 * The backend Postgres record is always the source of truth; the contract reflects it.
 *
 * DEPENDENCY NOTE:
 * The Soroban contract currently has no dedicated streak-update function.
 * This provider is fully implemented and wired, but the actual contract call
 * is gated behind the `STREAK_SYNC_ENABLED` environment variable.
 * Set STREAK_SYNC_ENABLED=true once the contract's `sync_streak` function
 * is available (ref: contract Issue #2 — automatic streak reset) without
 * requiring a backend redeployment.
 */
@Injectable()
export class SyncStreakProvider {
  private readonly logger = new Logger(SyncStreakProvider.name);
  private readonly server: StellarSdk.rpc.Server;
  private readonly contractId: string | undefined;
  private readonly networkPassphrase: string;
  private readonly secretKey: string | undefined;
  private readonly streakSyncEnabled: boolean;

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
    this.streakSyncEnabled =
      this.configService.get<string>('STREAK_SYNC_ENABLED') === 'true';
  }

  /**
   * Syncs a player's current streak to the Soroban smart contract.
   * Gated behind STREAK_SYNC_ENABLED until the contract exposes sync_streak.
   * Non-blocking: errors are caught and logged without propagation.
   *
   * @param stellarWallet  - The player's Stellar public key address.
   * @param currentStreak  - The verified current streak count from Postgres.
   */
  async syncStreakOnChain(
    stellarWallet: string,
    currentStreak: number,
  ): Promise<void> {
    if (!this.streakSyncEnabled) {
      this.logger.debug(
        `STREAK_SYNC_ENABLED=false — skipping syncStreakOnChain for ${stellarWallet}`,
      );
      return;
    }

    try {
      if (!this.contractId || !this.secretKey) {
        this.logger.warn(
          'STELLAR_CONTRACT_ID or STELLAR_SECRET_KEY not configured — skipping syncStreakOnChain',
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
            'sync_streak',
            StellarSdk.nativeToScVal(
              StellarSdk.Address.fromString(stellarWallet),
              { type: 'address' },
            ),
            StellarSdk.nativeToScVal(currentStreak, { type: 'u32' }),
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
        `syncStreakOnChain submitted for ${stellarWallet}, streak ${currentStreak}: tx hash ${result.hash}`,
      );
    } catch (error) {
      this.logger.error(
        `syncStreakOnChain failed for ${stellarWallet}: ${error.message}`,
        error.stack,
      );
    }
  }
}

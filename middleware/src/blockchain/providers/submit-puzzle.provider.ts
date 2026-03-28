import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as StellarSdk from 'stellar-sdk';

@Injectable()
export class SubmitPuzzleProvider {
  private readonly logger = new Logger(SubmitPuzzleProvider.name);
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
   * Records a puzzle submission on the Soroban smart contract (Issue #309).
   * Called after a correct puzzle answer is verified and saved to Postgres.
   * Non-blocking: errors are caught and logged without propagation.
   *
   * @param stellarWallet - The player's Stellar public key address.
   * @param puzzleId      - The puzzle UUID.
   * @param categoryId    - The puzzle category UUID.
   * @param score         - Points earned normalized to a 0–100 scale.
   */
  async submitPuzzleOnChain(
    stellarWallet: string,
    puzzleId: string,
    categoryId: string,
    score: number,
  ): Promise<void> {
    try {
      if (!this.contractId || !this.secretKey) {
        this.logger.warn(
          'STELLAR_CONTRACT_ID or STELLAR_SECRET_KEY not configured — skipping submitPuzzleOnChain',
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
            'submit_puzzle',
            StellarSdk.nativeToScVal(
              StellarSdk.Address.fromString(stellarWallet),
              { type: 'address' },
            ),
            StellarSdk.nativeToScVal(puzzleId, { type: 'string' }),
            StellarSdk.nativeToScVal(categoryId, { type: 'string' }),
            StellarSdk.nativeToScVal(score, { type: 'u32' }),
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
        `submitPuzzleOnChain submitted for ${stellarWallet}, puzzle ${puzzleId}: tx hash ${result.hash}`,
      );
    } catch (error) {
      this.logger.error(
        `submitPuzzleOnChain failed for ${stellarWallet}, puzzle ${puzzleId}: ${error.message}`,
        error.stack,
      );
    }
  }
}

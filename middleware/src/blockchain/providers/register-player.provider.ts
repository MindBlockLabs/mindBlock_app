import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as StellarSdk from 'stellar-sdk';

@Injectable()
export class RegisterPlayerProvider {
  private readonly logger = new Logger(RegisterPlayerProvider.name);
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
   * Registers a new player on the Soroban smart contract (Issue #308).
   * Called after wallet linking or first-time wallet login.
   * Non-blocking: errors are caught and logged without propagation.
   *
   * @param stellarWallet - The player's Stellar public key address.
   * @param username - The player's username.
   * @param iqLevel - The player's current level (used as iq_level on-chain).
   */
  async registerPlayerOnChain(
    stellarWallet: string,
    username: string,
    iqLevel: number,
  ): Promise<void> {
    try {
      if (!this.contractId || !this.secretKey) {
        this.logger.warn(
          'STELLAR_CONTRACT_ID or STELLAR_SECRET_KEY not configured — skipping registerPlayerOnChain',
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
            'register_player',
            StellarSdk.nativeToScVal(
              StellarSdk.Address.fromString(stellarWallet),
              { type: 'address' },
            ),
            StellarSdk.nativeToScVal(username, { type: 'string' }),
            StellarSdk.nativeToScVal(iqLevel, { type: 'u32' }),
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
        `registerPlayerOnChain submitted for ${stellarWallet}: tx hash ${result.hash}`,
      );
    } catch (error) {
      this.logger.error(
        `registerPlayerOnChain failed for ${stellarWallet}: ${error.message}`,
        error.stack,
      );
    }
  }
}

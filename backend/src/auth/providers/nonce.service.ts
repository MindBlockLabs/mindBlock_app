import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class NonceService {
  private nonces = new Map<
    string,
    { walletAddress: string; expiresAt: number; used: boolean }
  >();

  public storeNonce(
    nonce: string,
    walletAddress: string,
    expiresAt: number,
  ): void {
    this.nonces.set(nonce, {
      walletAddress,
      expiresAt,
      used: false,
    });
    console.log(
      `[NonceService] Stored nonce: ${nonce}. Total: ${this.nonces.size}`,
    );
  }

  public getNonce(nonce: string) {
    return this.nonces.get(nonce);
  }

  public markAsUsed(nonce: string): void {
    const data = this.nonces.get(nonce);
    if (data) {
      data.used = true;
      this.nonces.set(nonce, data);
    }
  }

  public verifyAndUseNonce(nonce: string, walletAddress: string): void {
    console.log(
      `[NonceService] Verifying nonce: ${nonce} for wallet ${walletAddress}`,
    );
    const nonceData = this.nonces.get(nonce);

    if (!nonceData) {
      const known = Array.from(this.nonces.keys()).join(', ');
      console.error(
        `[NonceService] Nonce NOT FOUND: ${nonce}. Map size: ${this.nonces.size}. Known nonces: ${known}`,
      );
      throw new BadRequestException('Invalid nonce');
    }

    if (nonceData.used) {
      throw new BadRequestException('Nonce already used');
    }

    if (Date.now() > nonceData.expiresAt) {
      throw new BadRequestException('Nonce expired');
    }

    if (nonceData.walletAddress !== walletAddress) {
      throw new BadRequestException('Nonce wallet address mismatch');
    }

    // Mark as used
    this.markAsUsed(nonce);
  }

  public cleanupExpiredNonces(): void {
    const now = Date.now();
    let count = 0;
    for (const [nonce, data] of this.nonces.entries()) {
      if (now > data.expiresAt) {
        this.nonces.delete(nonce);
        count++;
      }
    }
    if (count > 0) {
      console.log(`[NonceService] Cleaned up ${count} expired nonces.`);
    }
  }
}

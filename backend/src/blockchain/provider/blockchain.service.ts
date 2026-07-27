import { Injectable, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface WalletLinkedPayload {
  userId: string;
  walletAddress: string;
  entityId: string;
  timestamp: Date;
}

export interface WalletLinkFailedPayload {
  userId: string;
  walletAddress?: string;
  reason: string;
  entityId: string;
  timestamp: Date;
}

@Injectable()
export class BlockchainService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  getHello(): string {
    return 'Hello from Blockchain Service';
  }

  async linkWallet(
    userId: string,
    walletAddress: string,
  ): Promise<{ success: boolean; walletAddress: string }> {
    if (
      !walletAddress ||
      typeof walletAddress !== 'string' ||
      walletAddress.trim().length === 0
    ) {
      const failedPayload: WalletLinkFailedPayload = {
        userId,
        walletAddress: walletAddress || '',
        reason: 'Invalid or missing wallet address',
        entityId: userId,
        timestamp: new Date(),
      };

      // Fire-and-forget analytics event emission
      setImmediate(() => {
        try {
          this.eventEmitter.emit('wallet_link_failed', failedPayload);
        } catch {
          // Swallow listener errors to keep request path safe
        }
      });

      throw new BadRequestException('Invalid or missing wallet address');
    }

    const linkedPayload: WalletLinkedPayload = {
      userId,
      walletAddress: walletAddress.trim(),
      entityId: walletAddress.trim(),
      timestamp: new Date(),
    };

    // Fire-and-forget analytics event emission
    setImmediate(() => {
      try {
        this.eventEmitter.emit('wallet_linked', linkedPayload);
      } catch {
        // Swallow listener errors to keep request path safe
      }
    });

    return {
      success: true,
      walletAddress: walletAddress.trim(),
    };
  }
}

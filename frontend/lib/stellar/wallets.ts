import freighterApi from '@stellar/freighter-api';
import type { WalletType } from './types';
import { StellarAuthError } from './types';


export async function detectWallet(type: WalletType): Promise<boolean> {
  try {
    switch (type) {
      case 'freighter': {
        const result = await freighterApi.isConnected();
        return result.isConnected;
      }
      case 'xbull':
        // xBull detection - check for window.xBullSDK
        return typeof window !== 'undefined' && 'xBullSDK' in window;
      case 'albedo':
        // Albedo detection - check for window.albedo
        return typeof window !== 'undefined' && 'albedo' in window;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * Get list of all available (installed) wallets
 */
export async function getAvailableWallets(): Promise<WalletType[]> {
  const wallets: WalletType[] = [];

  if (await detectWallet('freighter' as WalletType)) {
    wallets.push('freighter' as WalletType);
  }

  if (await detectWallet('xbull' as WalletType)) {
    wallets.push('xbull' as WalletType);
  }

  if (await detectWallet('albedo' as WalletType)) {
    wallets.push('albedo' as WalletType);
  }

  return wallets;
}

/**
 * Connect to wallet and retrieve public key
 */
export async function connectWallet(type: WalletType): Promise<string> {
  console.log(`Attempting to connect to wallet: ${type}`);
  try {
    switch (type) {
      case 'freighter': {
        const connectionResult = await freighterApi.isConnected();
        if (!connectionResult.isConnected) {
          throw new StellarAuthError(
            'Freighter wallet is not installed. Please install it from freighter.app',
            'WALLET_NOT_INSTALLED'
          );
        }

        const addressResponse = await freighterApi.requestAccess();
        
        if (addressResponse.error) {
          throw new StellarAuthError(
            `Freighter error: ${addressResponse.error}`,
            'CONNECTION_FAILED'
          );
        }

        const publicKey = addressResponse.address;
        
        if (!publicKey) {
          throw new StellarAuthError(
            'Failed to get wallet address. Please try again.',
            'CONNECTION_FAILED'
          );
        }

        return publicKey;
      }

      case 'xbull':
        throw new StellarAuthError(
          'xBull wallet support is not yet implemented',
          'WALLET_NOT_SUPPORTED'
        );

      case 'albedo':
        throw new StellarAuthError(
          'Albedo wallet support is not yet implemented',
          'WALLET_NOT_SUPPORTED'
        );

      default:
        throw new StellarAuthError('Unsupported wallet type', 'WALLET_NOT_SUPPORTED');
    }
  } catch (error) {
    if (error instanceof StellarAuthError) {
      throw error;
    }

    // Handle user rejection
    if (error instanceof Error && (error.message.includes('User declined') || error.message.includes('dismissed'))) {
      throw new StellarAuthError('Wallet connection was cancelled', 'USER_REJECTED');
    }

    console.error(`Connection failed for ${type}:`, error);
    throw new StellarAuthError(
      'Failed to connect to wallet',
      'CONNECTION_FAILED',
      error
    );
  }
}

/**
 * Sign a message with the connected wallet
 */
export async function signMessageWithWallet(
  message: string,
  walletType: WalletType
): Promise<string> {
  console.log(`Requesting signature from ${walletType} for message:`, message);
  if (!message) {
    throw new StellarAuthError('Message to sign is required', 'INVALID_MESSAGE');
  }

  try {
    switch (walletType) {
      case 'freighter': {
        const signatureResponse = await freighterApi.signMessage(message);
        
        if ('error' in signatureResponse && signatureResponse.error) {
          throw new StellarAuthError(
            `Freighter signing error: ${signatureResponse.error}`,
            'SIGNING_FAILED'
          );
        }

        // Extract signature from response
        const signed = signatureResponse.signedMessage;
        let signature: string | null = null;

        if (typeof signed === 'string') {
          signature = signed;
        } else if (signed instanceof Uint8Array || (signed && typeof (signed as ArrayLike<number>).length === 'number')) {
          // Robust conversion for Uint8Array to base64 in browser
          const binary = Array.from(new Uint8Array(signed as ArrayLike<number>))
            .map(b => String.fromCharCode(b))
            .join('');
          signature = window.btoa(binary);
        }
        
        console.log(`Generated signature (base64): ${signature}`);
        
        if (!signature) {
          throw new StellarAuthError(
            'Failed to sign message or invalid signature response. Please try again.',
            'SIGNING_FAILED'
          );
        }

        return signature;
      }

      case 'xbull':
        throw new StellarAuthError(
          'xBull wallet signing is not yet implemented',
          'WALLET_NOT_SUPPORTED'
        );

      case 'albedo':
        throw new StellarAuthError(
          'Albedo wallet signing is not yet implemented',
          'WALLET_NOT_SUPPORTED'
        );

      default:
        throw new StellarAuthError('Unsupported wallet type', 'WALLET_NOT_SUPPORTED');
    }
  } catch (error) {
    if (error instanceof StellarAuthError) {
      throw error;
    }

    // Handle user rejection
    if (error instanceof Error && (error.message.includes('User declined') || error.message.includes('dismissed'))) {
      throw new StellarAuthError('Message signing was cancelled', 'USER_REJECTED');
    }

    console.error(`Signing failed for ${walletType}:`, error);
    throw new StellarAuthError(
      'Failed to sign message',
      'SIGNING_FAILED',
      error
    );
  }
}

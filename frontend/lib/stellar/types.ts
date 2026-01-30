/**
 * Stellar Wallet Authentication Types
 */

export enum WalletType {
  Freighter = 'freighter',
  xBull = 'xbull',
  Albedo = 'albedo',
}

export interface NonceResponse {
  nonce: string;
  expiresAt: number;
}

export interface LoginRequest {
  walletAddress: string;
  publicKey: string;
  signature: string;
  nonce: string;
}

export interface LoginResponse {
  accessToken: string;
}

export interface WalletConnectionState {
  isConnected: boolean;
  walletAddress: string | null;
  walletType: WalletType | null;
  error: string | null;
}

export class StellarAuthError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'StellarAuthError';
  }
}

export interface WalletAuthState {
  isConnecting: boolean;
  isSigning: boolean;
  isLoggingIn: boolean;
  error: string | null;
  walletAddress: string | null;
  isAuthenticated: boolean;
}

'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  getAddress,
  isConnected,
  setAllowed,
  signMessage,
} from '@stellar/freighter-api';

type WalletLoginStep =
  | 'idle'
  | 'connecting_wallet'
  | 'requesting_nonce'
  | 'signing'
  | 'verifying'
  | 'success'
  | 'error';

type WalletLoginErrorCode =
  | 'WALLET_NOT_INSTALLED'
  | 'USER_REJECTED'
  | 'NONCE_EXPIRED'
  | 'INVALID_SIGNATURE'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

type WalletLoginError = {
  code: WalletLoginErrorCode;
  message: string;
};

type NonceResponse = {
  nonce: string;
  expiresAt: number;
};

type WalletLoginResponse = {
  accessToken: string;
};

function getApiBaseUrl() {
  // Keep a safe default that matches existing frontend usage.
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'https://mindblock-webaapp.onrender.com'
  );
}

function isLikelyUserRejected(err: unknown) {
  const msg = (err as any)?.message?.toString?.() ?? '';
  // Freighter + other wallets tend to throw "User declined"/"rejected" style messages.
  return /reject|declin|cancel/i.test(msg);
}

function pickSignature(result: any): string | null {
  if (!result) return null;
  if (typeof result === 'string') return result;
  // Try a few common shapes.
  return (
    result.signature ||
    result.signedMessage ||
    result.signed_message ||
    result.sig ||
    null
  );
}

async function safeReadJson(res: Response): Promise<any | null> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

const isDev = process.env.NODE_ENV === 'development';

function normalizeErrorMessage(payload: any, fallback: string, userFriendlyFallback?: string): string {
  const friendlyMessage = userFriendlyFallback || fallback;
  
  // In production, always return user-friendly message
  if (!isDev) {
    return friendlyMessage;
  }

  // In development, show detailed error messages
  if (!payload) return fallback;

  if (typeof payload === 'string') return payload;

  if (typeof payload === 'object') {
    if (typeof payload.message === 'string') return payload.message;
    if (typeof payload.error === 'string') return payload.error;
    try {
      return JSON.stringify(payload);
    } catch {
      return fallback;
    }
  }

  return fallback;
}

export function useWalletLogin() {
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);

  const [step, setStep] = useState<WalletLoginStep>('idle');
  const [error, setError] = useState<WalletLoginError | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [nonce, setNonce] = useState<string | null>(null);

  const isLoading =
    step === 'connecting_wallet' ||
    step === 'requesting_nonce' ||
    step === 'signing' ||
    step === 'verifying';

  const statusText = useMemo(() => {
    switch (step) {
      case 'connecting_wallet':
        return 'Connecting wallet...';
      case 'requesting_nonce':
        return 'Requesting nonce...';
      case 'signing':
        return 'Waiting for signature...';
      case 'verifying':
        return 'Verifying signature...';
      case 'success':
        return 'Wallet connected.';
      default:
        return null;
    }
  }, [step]);

  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
    setWalletAddress(null);
    setNonce(null);
  }, []);

  const loginWithWallet = useCallback(async () => {
    setError(null);
    setStep('connecting_wallet');

    try {
      // Add timeout wrapper for wallet operations
      const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error('Wallet operation timed out')), timeoutMs)
          ),
        ]);
      };

      // First check if Freighter API functions are available
      if (typeof isConnected !== 'function' || typeof setAllowed !== 'function' || typeof getAddress !== 'function') {
        console.error('Freighter API not available');
        setStep('error');
        setError({
          code: 'WALLET_NOT_INSTALLED',
          message:
            'No Stellar wallet detected. Please install Freighter (or a Freighter-compatible wallet like xBull).',
        });
        return { accessToken: null as string | null };
      }

      let connected = false;
      try {
        console.log('Checking wallet connection...');
        const connectionResult = await withTimeout(isConnected(), 5000);
        console.log('Connection result:', connectionResult);
        connected = connectionResult.isConnected ?? false;
      } catch (err: any) {
        console.error('Wallet connection check failed:', err);
        // Check if it's a wallet initialization error vs not installed
        const errorMsg = err?.message?.toString() || '';
        if (errorMsg.includes('not initialize') || errorMsg.includes('not installed') || errorMsg.includes('timed out')) {
          // Wallet extension exists but not initialized - treat as not connected
          connected = false;
        } else {
          // Other errors - log but treat as not connected
          console.warn('Wallet connection check error:', err);
          connected = false;
        }
      }

      if (!connected) {
        setStep('error');
        setError({
          code: 'WALLET_NOT_INSTALLED',
          message:
            'No Stellar wallet detected. Please install Freighter (or a Freighter-compatible wallet like xBull).',
        });
        return { accessToken: null as string | null };
      }

      try {
        console.log('Requesting wallet permission...');
        await withTimeout(setAllowed(), 30000); // 30s timeout for user interaction
        console.log('Wallet permission granted');
      } catch (err: any) {
        console.error('setAllowed error:', err);
        if (isLikelyUserRejected(err) || err?.message?.includes('timed out')) {
          setStep('error');
          setError({
            code: 'USER_REJECTED',
            message: err?.message?.includes('timed out') 
              ? 'Wallet connection timed out. Please try again.'
              : 'Wallet connection was cancelled.',
          });
          return { accessToken: null as string | null };
        }
        throw err;
      }

      console.log('Getting wallet address...');
      const addressResult = await withTimeout(getAddress(), 5000);
      console.log('Address result:', addressResult);
      const { address: publicKey } = addressResult;
      setWalletAddress(publicKey);

      setStep('requesting_nonce');
      const nonceRes = await fetch(
        `${apiBaseUrl}/auth/stellar-wallet-nonce?walletAddress=${encodeURIComponent(
          publicKey,
        )}`,
        { method: 'GET' },
      );

      if (!nonceRes.ok) {
        const body = await safeReadJson(nonceRes);

        if (nonceRes.status === 429) {
          setStep('error');
          setError({
            code: 'RATE_LIMITED',
            message: isDev
              ? 'Too many requests. Please wait a moment and try again (nonce endpoint is rate-limited).'
              : 'Too many requests. Please wait a moment and try again.',
          });
          return { accessToken: null as string | null };
        }

        setStep('error');
        setError({
          code: 'UNKNOWN',
          message: normalizeErrorMessage(
            body,
            isDev ? `Failed to generate nonce (HTTP ${nonceRes.status}). Please try again.` : 'Failed to generate nonce. Please try again.',
            'Failed to generate nonce. Please try again.',
          ),
        });
        return { accessToken: null as string | null };
      }

      const { nonce: rawNonce } = (await nonceRes.json()) as NonceResponse;
      setNonce(rawNonce);

      setStep('signing');
      let signature: string | null = null;
      try {
        // Important: sign ONLY the raw nonce string (no typed data / no tx signing).
        const signResult = await signMessage(rawNonce);
        signature = pickSignature(signResult);
      } catch (err) {
        if (isLikelyUserRejected(err)) {
          setStep('error');
          setError({
            code: 'USER_REJECTED',
            message: 'Signature request was cancelled.',
          });
          return { accessToken: null as string | null };
        }
        throw err;
      }

      if (!signature) {
        setStep('error');
        setError({
          code: 'UNKNOWN',
          message:
            'Wallet did not return a signature. Please try again or use a different wallet.',
        });
        return { accessToken: null as string | null };
      }

      setStep('verifying');
      const loginRes = await fetch(`${apiBaseUrl}/auth/stellar-wallet-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey,
          signature,
          nonce: rawNonce,
          publicKey: publicKey,
        }),
      });

      if (!loginRes.ok) {
        const body = await safeReadJson(loginRes);
        const serverMsg: string =
          (typeof body?.message === 'string' && body.message) ||
          (typeof body?.error === 'string' && body.error) ||
          '';

        if (loginRes.status === 401) {
          setStep('error');
          setError({
            code: 'INVALID_SIGNATURE',
            message: 'Invalid signature. Please try again.',
          });
          return { accessToken: null as string | null };
        }

        if (loginRes.status === 400 && /nonce.*expir|expir/i.test(serverMsg)) {
          setStep('error');
          setError({
            code: 'NONCE_EXPIRED',
            message: 'Nonce expired. Please try connecting again.',
          });
          return { accessToken: null as string | null };
        }

        setStep('error');
        setError({
          code: 'UNKNOWN',
          message: normalizeErrorMessage(
            body,
            isDev ? `Wallet login failed (HTTP ${loginRes.status}). Please try again.` : 'Wallet login failed. Please try again.',
            'Wallet login failed. Please try again.',
          ),
        });
        return { accessToken: null as string | null };
      }

      const loginBody = (await loginRes.json()) as WalletLoginResponse;
      if (!loginBody?.accessToken) {
        setStep('error');
        setError({
          code: 'UNKNOWN',
          message:
            'Login succeeded but no access token was returned. Please try again.',
        });
        return { accessToken: null as string | null };
      }

      try {
        localStorage.setItem('accessToken', loginBody.accessToken);
      } catch {
        // localStorage may be unavailable in some environments; still treat as logged in.
      }

      setStep('success');
      return { accessToken: loginBody.accessToken };
    } catch (err) {
      setStep('error');
      setError({
        code: (err as any)?.name === 'TypeError' ? 'NETWORK_ERROR' : 'UNKNOWN',
        message:
          (err as any)?.message?.toString?.() ||
          'Unexpected error during wallet login.',
      });
      return { accessToken: null as string | null };
    }
  }, [apiBaseUrl]);

  return {
    step,
    statusText,
    isLoading,
    error,
    walletAddress,
    nonce,
    loginWithWallet,
    reset,
  };
}


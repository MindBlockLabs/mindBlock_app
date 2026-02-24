
'use client';

import { useState, useCallback } from 'react';
import type { WalletType, WalletAuthState } from '../lib/stellar/types';
import { StellarAuthError } from '../lib/stellar/types';
import { connectWallet, signMessageWithWallet } from '../lib/stellar/wallets';
import { fetchNonce, submitWalletLogin } from '../lib/stellar/api';
import { useAppDispatch } from '../lib/reduxHooks';
import { walletLoginSuccess, walletLoginFailure } from '../lib/features/auth/authSlice';

export function useStellarWalletAuth() {
  const dispatch = useAppDispatch();
  const [state, setState] = useState<WalletAuthState>({
    isConnecting: false,
    isSigning: false,
    isLoggingIn: false,
    error: null,
    walletAddress: null,
    isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('accessToken') : false,
  });

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Set error state with user-friendly message
   */
  const setError = useCallback((error: unknown) => {
    let errorMessage = 'An unexpected error occurred';

    if (error instanceof StellarAuthError) {
      switch (error.code) {
        case 'WALLET_NOT_INSTALLED':
          errorMessage = 'Wallet not installed. Please install Freighter from freighter.app';
          break;
        case 'USER_REJECTED':
          errorMessage = 'Request was cancelled';
          break;
        case 'NONCE_FETCH_FAILED':
          errorMessage = 'Failed to initialize authentication. Please try again.';
          break;
        case 'RATE_LIMIT':
          errorMessage = 'Too many requests. Please wait a moment and try again.';
          break;
        case 'INVALID_SIGNATURE':
          errorMessage = 'Authentication failed. The signature is invalid or has expired.';
          break;
        case 'NETWORK_ERROR':
          errorMessage = 'Network error. Please check your connection and try again.';
          break;
        case 'SIGNING_FAILED':
          errorMessage = 'Failed to sign message. Please try again.';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    setState((prev) => ({ ...prev, error: errorMessage }));
  }, []);

  /**
   * Complete wallet authentication flow
   */
  const connectAndLogin = useCallback(
    async (walletType: WalletType = 'freighter' as WalletType) => {
      clearError();

      try {
        // Step 1: Connect wallet
        setState((prev) => ({ ...prev, isConnecting: true, error: null }));

        const walletAddress = await connectWallet(walletType);

        setState((prev) => ({
          ...prev,
          isConnecting: false,
          walletAddress,
        }));

        // Step 2: Fetch nonce from backend
        const nonceResponse = await fetchNonce(walletAddress);

        // Check if nonce is expired
        if (nonceResponse.expiresAt < Date.now()) {
          throw new StellarAuthError('Nonce has expired. Please try again.', 'NONCE_EXPIRED');
        }

        // Step 3: Sign the nonce with wallet
        setState((prev) => ({ ...prev, isSigning: true }));

        const signature = await signMessageWithWallet(nonceResponse.nonce, walletType);

        setState((prev) => ({ ...prev, isSigning: false }));

        // Step 4: Submit signature to backend
        setState((prev) => ({ ...prev, isLoggingIn: true }));

        const loginResponse = await submitWalletLogin({
          walletAddress,
          publicKey: walletAddress, // For account-based wallets, these are the same
          signature,
          nonce: nonceResponse.nonce,
        });

        // Step 5: Store JWT token
        localStorage.setItem('accessToken', loginResponse.accessToken);

        // Update Redux state
        dispatch(walletLoginSuccess({ walletAddress, token: loginResponse.accessToken }));

        setState((prev) => ({
          ...prev,
          isLoggingIn: false,
          isAuthenticated: true,
          error: null,
        }));

        return loginResponse.accessToken;
      } catch (error) {
        setError(error);
        
        // Update Redux state with failure
        const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
        dispatch(walletLoginFailure(errorMessage));

        setState((prev) => ({
          ...prev,
          isConnecting: false,
          isSigning: false,
          isLoggingIn: false,
          isAuthenticated: false,
        }));

        throw error;
      }
    },
    [clearError, setError, dispatch]
  );

  /**
   * Logout and clear authentication state
   */
  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    
    // Redux state will be cleared by the auth slice logout action
    // This hook maintains its own state for UI purposes
    
    setState({
      isConnecting: false,
      isSigning: false,
      isLoggingIn: false,
      error: null,
      walletAddress: null,
      isAuthenticated: false,
    });
  }, []);

  return {
    ...state,
    connectAndLogin,
    logout,
    clearError,
  };
}

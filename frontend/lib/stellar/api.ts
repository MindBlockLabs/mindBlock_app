/**
 * API Client for Stellar Wallet Authentication
 */

import type { NonceResponse, LoginRequest, LoginResponse } from './types';
import { StellarAuthError } from './types';

const API_BASE_URL = 'http://localhost:3000';

/**
 * Fetch nonce from backend for wallet authentication
 */
export async function fetchNonce(walletAddress: string): Promise<NonceResponse> {
  if (!walletAddress) {
    throw new StellarAuthError('Wallet address is required', 'INVALID_ADDRESS');
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/auth/stellar-wallet-nonce?walletAddress=${encodeURIComponent(walletAddress)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        throw new StellarAuthError(
          'Too many requests. Please try again in a moment.',
          'RATE_LIMIT'
        );
      }

      let errorMessage = 'Failed to fetch nonce';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Unable to parse error response
      }

      throw new StellarAuthError(errorMessage, 'NONCE_FETCH_FAILED');
    }

    const data = await response.json();

    if (!data.nonce || !data.expiresAt) {
      throw new StellarAuthError('Invalid nonce response from server', 'INVALID_RESPONSE');
    }

    return data;
  } catch (error) {
    if (error instanceof StellarAuthError) {
      throw error;
    }

    throw new StellarAuthError(
      'Network error. Please check your connection.',
      'NETWORK_ERROR',
      error
    );
  }
}

/**
 * Submit wallet login request to backend
 */
export async function submitWalletLogin(request: LoginRequest): Promise<LoginResponse> {
  if (!request.walletAddress || !request.signature || !request.nonce || !request.publicKey) {
    throw new StellarAuthError('Missing required login parameters', 'INVALID_REQUEST');
  }

  console.log('Submitting wallet login signature to backend...');
  console.log('Login request payload:', request);
  try {
    const response = await fetch(`${API_BASE_URL}/auth/stellar-wallet-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let errorMessage = 'Login failed';

      try {
        const errorData = await response.json();
        console.log('Login Error Data:', errorData);
        if (Array.isArray(errorData.message)) {
          errorMessage = errorData.message.join(', ');
        } else if (typeof errorData.message === 'object' && errorData.message !== null) {
          errorMessage = JSON.stringify(errorData.message);
        } else {
          errorMessage = errorData.message || errorMessage;
        }

        if (response.status === 401) {
          throw new StellarAuthError(
            errorMessage || 'Invalid signature or expired nonce',
            'INVALID_SIGNATURE'
          );
        }

        if (response.status === 400) {
          throw new StellarAuthError(errorMessage || 'Invalid request', 'INVALID_REQUEST');
        }
      } catch (error) {
        if (error instanceof StellarAuthError) {
          throw error;
        }
      }

      throw new StellarAuthError(errorMessage, 'LOGIN_FAILED');
    }

    const data = await response.json();

    if (!data.accessToken) {
      throw new StellarAuthError('Invalid response from server', 'INVALID_RESPONSE');
    }

    return data;
  } catch (error) {
    if (error instanceof StellarAuthError) {
      throw error;
    }

    throw new StellarAuthError(
      'Network error. Please check your connection.',
      'NETWORK_ERROR',
      error
    );
  }
}

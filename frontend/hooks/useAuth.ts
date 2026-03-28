'use client';

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../lib/reduxHooks';
import {
  selectUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  selectToken,
  selectIsRestoring,
  loginSuccess,
  loginFailure,
  logout,
  clearError,
  setLoading,
  updateUser,
  walletLoginSuccess,
  walletLoginFailure,
  restoreSession,
  refreshToken,
  type User,
} from '../lib/features/auth/authSlice';

// Auth hook that provides auth state and actions
export function useAuth() {
  const dispatch = useAppDispatch();
  
  // Selectors
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);
  const token = useAppSelector(selectToken);
  const isRestoring = useAppSelector(selectIsRestoring);

  // Actions
  const handleLoginSuccess = useCallback((user: User, token: string) => {
    dispatch(loginSuccess({ user, token }));
  }, [dispatch]);

  const handleLoginFailure = useCallback((error: string) => {
    dispatch(loginFailure(error));
  }, [dispatch]);

  const handleLogout = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSetLoading = useCallback((loading: boolean) => {
    dispatch(setLoading(loading));
  }, [dispatch]);

  const handleUpdateUser = useCallback((userData: Partial<User>) => {
    dispatch(updateUser(userData));
  }, [dispatch]);

  const handleWalletLoginSuccess = useCallback((walletAddress: string, token: string) => {
    dispatch(walletLoginSuccess({ walletAddress, token }));
  }, [dispatch]);

  const handleWalletLoginFailure = useCallback((error: string) => {
    dispatch(walletLoginFailure(error));
  }, [dispatch]);

  const handleRestoreSession = useCallback(() => {
    return dispatch(restoreSession());
  }, [dispatch]);

  const handleRefreshToken = useCallback(() => {
    return dispatch(refreshToken());
  }, [dispatch]);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    token,
    isRestoring,
    
    // Actions
    loginSuccess: handleLoginSuccess,
    loginFailure: handleLoginFailure,
    logout: handleLogout,
    clearError: handleClearError,
    setLoading: handleSetLoading,
    updateUser: handleUpdateUser,
    walletLoginSuccess: handleWalletLoginSuccess,
    walletLoginFailure: handleWalletLoginFailure,
    restoreSession: handleRestoreSession,
    refreshToken: handleRefreshToken,
  };
}

// Individual selector hooks for more granular usage
export function useUser() {
  return useAppSelector(selectUser);
}

export function useIsAuthenticated() {
  return useAppSelector(selectIsAuthenticated);
}

export function useAuthLoading() {
  return useAppSelector(selectAuthLoading);
}

export function useAuthError() {
  return useAppSelector(selectAuthError);
}

export function useAuthToken() {
  return useAppSelector(selectToken);
}

export function useIsRestoring() {
  return useAppSelector(selectIsRestoring);
}

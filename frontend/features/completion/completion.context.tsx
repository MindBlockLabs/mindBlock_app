"use client";

import { createContext, useContext, useState, useCallback } from 'react';
import { fetchUserStats, claimPoints as apiClaimPoints } from './completion.api';

export interface CompletionStats {
  points: number;
  correct: number;
  total: number;
  timeSeconds: number;
  level: number;
}

interface CompletionContextType {
  stats: CompletionStats | null;
  isClaiming: boolean;
  isSuccess: boolean;
  error: string | null;
  claimPoints: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

const CompletionContext = createContext<CompletionContextType | undefined>(undefined);

export const CompletionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<CompletionStats | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStats = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchUserStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch stats');
    }
  }, []);

  const claimPoints = useCallback(async () => {
    setIsClaiming(true);
    setIsSuccess(false);
    setError(null);
    try {
      await apiClaimPoints();
      setIsSuccess(true);
      await refreshStats();
    } catch (err: any) {
      setError(err.message || 'Failed to claim points');
    } finally {
      setIsClaiming(false);
    }
  }, [refreshStats]);

  return (
    <CompletionContext.Provider value={{ stats, isClaiming, isSuccess, error, claimPoints, refreshStats }}>
      {children}
    </CompletionContext.Provider>
  );
};

export function useCompletion() {
  const context = useContext(CompletionContext);
  if (!context) throw new Error('useCompletion must be used within CompletionProvider');
  return context;
}

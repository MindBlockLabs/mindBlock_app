"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  fetchDashboardStats,
  fetchCategories,
  DashboardStats,
  Category,
} from "./dashboard.api";

/**
 * Dashboard Context
 *
 * Provides dashboard data (stats and categories) to all child components.
 * Handles loading states, error states, and prevents duplicate API calls.
 */

// Dashboard data shape exposed to UI
export interface DashboardData {
  stats: {
    streak: number;
    points: number;
    dailyQuestProgress: {
      completed: number;
      total: number;
    };
  };
  categories: Category[];
}

// Context type definition
interface DashboardContextType {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  refreshDashboard: () => Promise<void>;
}

// Create context with undefined default
const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

// Default stats when API returns no data
const defaultStats: DashboardData["stats"] = {
  streak: 0,
  points: 0,
  dailyQuestProgress: {
    completed: 0,
    total: 5,
  },
};

// Props for the provider
interface DashboardProviderProps {
  children: React.ReactNode;
  autoFetch?: boolean;
}

/**
 * Dashboard Provider Component
 *
 * Wraps children with dashboard data context.
 * Fetches stats and categories on mount (if autoFetch is true).
 */
export const DashboardProvider: React.FC<DashboardProviderProps> = ({
  children,
  autoFetch = true,
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref to track if data has been fetched to prevent duplicate calls
  const hasFetchedRef = useRef(false);

  /**
   * Refresh dashboard data
   * Fetches both stats and categories in parallel
   */
  const refreshDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch stats and categories in parallel
      const [statsResponse, categoriesResponse] = await Promise.all([
        fetchDashboardStats().catch(() => null),
        fetchCategories().catch(() => null),
      ]);

      // Process stats response
      const stats: DashboardData["stats"] = statsResponse ?? defaultStats;

      // Process categories response
      const categories: Category[] =
        categoriesResponse?.success && Array.isArray(categoriesResponse.data)
          ? categoriesResponse.data
          : [];

      setData({
        stats,
        categories,
      });
    } catch (err: any) {
      setError(err.message || "Failed to fetch dashboard data");
      // Set default data on error
      setData({
        stats: defaultStats,
        categories: [],
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-fetch data on mount if enabled
  useEffect(() => {
    if (autoFetch && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      refreshDashboard();
    }
  }, [autoFetch, refreshDashboard]);

  const value: DashboardContextType = {
    data,
    isLoading,
    error,
    refreshDashboard,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

/**
 * useDashboard Hook
 *
 * Custom hook to consume dashboard context.
 * Must be used within a DashboardProvider.
 *
 * @example
 * const { data, isLoading, error, refreshDashboard } = useDashboard();
 */
export function useDashboard(): DashboardContextType {
  const context = useContext(DashboardContext);

  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }

  return context;
}

// Re-export types for convenience
export type { DashboardStats, Category };

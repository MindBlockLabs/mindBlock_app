/**
 * Dashboard Feature Module
 *
 * Centralized exports for dashboard-related functionality.
 * Use this barrel file to import dashboard components, hooks, and types.
 *
 * @example
 * import { DashboardProvider, useDashboard } from '@/features/dashboard';
 */

// Export API functions and types
export {
  fetchDashboardStats,
  fetchCategories,
  type DashboardStats,
  type Category,
  type CategoriesResponse,
} from "./dashboard.api";

// Export context, provider, and hook
export {
  DashboardProvider,
  useDashboard,
  type DashboardData,
  type DashboardStats as DashboardStatsType,
  type Category as CategoryType,
} from "./dashboard.context";

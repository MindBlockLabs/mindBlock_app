/**
 * Dashboard Feature Provider
 *
 * Wrapper component that provides dashboard data context to the application.
 * This separates the provider setup from the layout for cleaner code organization.
 */

import { DashboardProvider } from "../features/dashboard";

interface DashboardFeatureProviderProps {
  children: React.ReactNode;
}

/**
 * DashboardFeatureProvider
 *
 * Wraps children with DashboardProvider to enable dashboard data fetching
 * and state management throughout the application.
 */
export default function DashboardFeatureProvider({
  children,
}: DashboardFeatureProviderProps) {
  return <DashboardProvider autoFetch={true}>{children}</DashboardProvider>;
}

/**
 * Dashboard API Module
 * 
 * Handles all API calls related to dashboard data fetching.
 * Includes endpoints for stats and categories.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// Types for API responses
export interface DashboardStats {
  streak: number;
  points: number;
  dailyQuestProgress: {
    completed: number;
    total: number;
  };
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CategoriesResponse {
  success: boolean;
  data: Category[];
  count: number;
  message?: string;
  error?: string;
}

// Helper function to get auth headers
function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }

  const token = window.localStorage.getItem("accessToken");

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("Content-Type");
  const isJson = contentType && contentType.includes("application/json");

  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const message =
      (data && (data.message as string | undefined)) ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

/**
 * Fetch dashboard stats including streak, points, and daily quest progress
 * GET /dashboard/stats
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };

  const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
    method: "GET",
    headers,
  });

  return handleResponse<DashboardStats>(response);
}

/**
 * Fetch all available categories
 * GET /categories
 */
export async function fetchCategories(): Promise<CategoriesResponse> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };

  const response = await fetch(`${API_BASE_URL}/categories`, {
    method: "GET",
    headers,
  });

  return handleResponse<CategoriesResponse>(response);
}

export interface StreakResponseDto {
  id: number;
  userId: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: string;
  streakDates: string[];
  updatedAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

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

export async function fetchStreak(): Promise<StreakResponseDto | null> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };

  const response = await fetch(`${API_BASE_URL}/streaks`, {
    method: "GET",
    headers,
  });

  if (response.status === 404) {
    return null;
  }

  return handleResponse<StreakResponseDto>(response);
}

export async function updateStreak(): Promise<StreakResponseDto> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };

  const response = await fetch(`${API_BASE_URL}/streaks/update`, {
    method: "POST",
    headers,
  });

  return handleResponse<StreakResponseDto>(response);
}

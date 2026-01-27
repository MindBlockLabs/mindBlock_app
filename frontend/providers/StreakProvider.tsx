"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type StreakContextValue = {
  currentStreak: number;
  longestStreak: number;
  streakDates: string[];
  lastActivityDate: string | null;
  isLoading: boolean;
  updateStreak: () => Promise<void>;
  refetch: () => Promise<void>;
  timeZone: string;
};

type StreakState = {
  currentStreak: number;
  longestStreak: number;
  streakDates: string[];
  lastActivityDate: string | null;
};

const DEFAULT_STATE: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  streakDates: [],
  lastActivityDate: null,
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://mindblock-webaapp.onrender.com";

const StreakContext = createContext<StreakContextValue | undefined>(undefined);

export const StreakProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const timeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );
  const [state, setState] = useState<StreakState>(DEFAULT_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  const applyStreak = useCallback(
    (payload: StreakState) => {
      if (!mountedRef.current) return;
      setState(payload);
      setIsLoading(false);
    },
    [setState],
  );

  const fetchStreak = useCallback(async () => {
    const token = typeof window !== "undefined"
      ? localStorage.getItem("accessToken")
      : null;

    if (!token) {
      applyStreak(DEFAULT_STATE);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/streaks`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Timezone": timeZone,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch streak: ${response.status}`);
      }

      const data = await response.json();
      applyStreak({
        currentStreak: data.currentStreak ?? 0,
        longestStreak: data.longestStreak ?? 0,
        streakDates: data.streakDates ?? [],
        lastActivityDate: data.lastActivityDate ?? null,
      });
    } catch (error) {
      console.error("Failed to fetch streak", error);
      applyStreak(DEFAULT_STATE);
    }
  }, [applyStreak, timeZone]);

  const updateStreak = useCallback(async () => {
    const token = typeof window !== "undefined"
      ? localStorage.getItem("accessToken")
      : null;

    if (!token) {
      console.warn("Attempted to update streak without a token");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/streaks/update`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Timezone": timeZone,
        },
        body: JSON.stringify({ timeZone }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update streak: ${response.status}`);
      }

      const data = await response.json();
      applyStreak({
        currentStreak: data.currentStreak ?? 0,
        longestStreak: data.longestStreak ?? 0,
        streakDates: data.streakDates ?? [],
        lastActivityDate: data.lastActivityDate ?? null,
      });
    } catch (error) {
      console.error("Failed to update streak", error);
      setIsLoading(false);
    }
  }, [applyStreak, timeZone]);

  useEffect(() => {
    mountedRef.current = true;
    fetchStreak();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchStreak]);

  const value = useMemo<StreakContextValue>(
    () => ({
      ...state,
      isLoading,
      updateStreak,
      refetch: fetchStreak,
      timeZone,
    }),
    [state, isLoading, updateStreak, fetchStreak, timeZone],
  );

  return (
    <StreakContext.Provider value={value}>{children}</StreakContext.Provider>
  );
};

export const useStreak = (): StreakContextValue => {
  const ctx = useContext(StreakContext);
  if (!ctx) {
    throw new Error("useStreak must be used within a StreakProvider");
  }
  return ctx;
};

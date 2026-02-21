"use client";

import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../lib/reduxHooks";
import {
  fetchStreakThunk,
  updateStreakThunk,
  resetStreak,
  clearStreakError,
} from "../lib/features/streak/streakSlice";

export interface UseStreakOptions {
  autoFetch?: boolean;
}

export function useStreak(options: UseStreakOptions = {}) {
  const { autoFetch = true } = options;

  const dispatch = useAppDispatch();
  const streakState = useAppSelector((state) => state.streak);

  const {
    currentStreak,
    longestStreak,
    streakDates,
    isLoading,
    error,
  } = streakState;

  // Auto-fetch streak on mount if requested
  useEffect(() => {
    if (autoFetch) {
      dispatch(fetchStreakThunk());
    }
  }, [autoFetch, dispatch]);

  const fetchStreak = useCallback(() => {
    dispatch(fetchStreakThunk());
  }, [dispatch]);

  const updateStreak = useCallback(async () => {
    await dispatch(updateStreakThunk()).unwrap();
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(clearStreakError());
  }, [dispatch]);

  const reset = useCallback(() => {
    dispatch(resetStreak());
  }, [dispatch]);

  return {
    currentStreak,
    longestStreak,
    streakDates,
    isLoading,
    error,
    fetchStreak,
    updateStreak,
    clearError,
    reset,
  };
}

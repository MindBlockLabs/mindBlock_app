"use client";

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { fetchStreak, updateStreak, StreakResponseDto } from "../../api/streakApi";

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  streakDates: string[];
  isLoading: boolean;
  error: string | null;
}

const initialState: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  streakDates: [],
  isLoading: false,
  error: null,
};

export const fetchStreakThunk = createAsyncThunk(
  "streak/fetchStreak",
  async (_, { rejectWithValue }) => {
    try {
      const streak = await fetchStreak();
      return streak;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch streak"
      );
    }
  }
);

export const updateStreakThunk = createAsyncThunk(
  "streak/updateStreak",
  async (_, { rejectWithValue }) => {
    try {
      const streak = await updateStreak();
      return streak;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to update streak"
      );
    }
  }
);

const streakSlice = createSlice({
  name: "streak",
  initialState,
  reducers: {
    resetStreak: (state) => {
      state.currentStreak = 0;
      state.longestStreak = 0;
      state.streakDates = [];
      state.error = null;
    },
    clearStreakError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch streak
      .addCase(fetchStreakThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchStreakThunk.fulfilled,
        (state, action: PayloadAction<StreakResponseDto | null>) => {
          state.isLoading = false;
          if (action.payload) {
            state.currentStreak = action.payload.currentStreak;
            state.longestStreak = action.payload.longestStreak;
            state.streakDates = action.payload.streakDates || [];
          }
        }
      )
      .addCase(fetchStreakThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update streak
      .addCase(updateStreakThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        updateStreakThunk.fulfilled,
        (state, action: PayloadAction<StreakResponseDto>) => {
          state.isLoading = false;
          state.currentStreak = action.payload.currentStreak;
          state.longestStreak = action.payload.longestStreak;
          state.streakDates = action.payload.streakDates || [];
        }
      )
      .addCase(updateStreakThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetStreak, clearStreakError } = streakSlice.actions;
export default streakSlice.reducer;

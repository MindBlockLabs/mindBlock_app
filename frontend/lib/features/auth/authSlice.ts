import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface User {
  id: string;
  email?: string;
  walletAddress?: string;
  username?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isRestoring: boolean;
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null,
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('accessToken') : false,
  isLoading: false,
  error: null,
  isRestoring: false,
};

// Async thunks
export const loginStart = createAsyncThunk(
  'auth/loginStart',
  async () => {
    // This is a placeholder for future email/password login
    // For now, this will be used with wallet authentication
    return null;
  }
);

export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No token found');
      }
      
      // TODO: Validate token with backend and fetch user data
      // For now, just return the token
      return { token };
    } catch {
      localStorage.removeItem('accessToken');
      return rejectWithValue('Session expired');
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Implement token refresh logic
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No token to refresh');
      }
      return { token };
    } catch {
      localStorage.removeItem('accessToken');
      return rejectWithValue('Failed to refresh token');
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
      
      // Store token in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', action.payload.token);
      }
    },
    
    loginFailure: (state, action: PayloadAction<string>) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = action.payload;
      
      // Remove token from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
      }
    },
    
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      
      // Remove token from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
      }
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    
    // For wallet authentication integration
    walletLoginSuccess: (state, action: PayloadAction<{ walletAddress: string; token: string }>) => {
      const user: User = {
        id: action.payload.walletAddress,
        walletAddress: action.payload.walletAddress,
      };
      
      state.user = user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
      
      // Token is already stored by the wallet hook
    },
    
    walletLoginFailure: (state, action: PayloadAction<string>) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // loginStart
      .addCase(loginStart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginStart.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(loginStart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Login failed';
      })
      
      // restoreSession
      .addCase(restoreSession.pending, (state) => {
        state.isRestoring = true;
        state.error = null;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.isRestoring = false;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(restoreSession.rejected, (state, action) => {
        state.isRestoring = false;
        state.token = null;
        state.isAuthenticated = false;
        state.error = action.payload as string || 'Failed to restore session';
      })
      
      // refreshToken
      .addCase(refreshToken.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.isLoading = false;
        state.token = null;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload as string || 'Failed to refresh token';
      });
  },
});

// Actions
export const {
  loginSuccess,
  loginFailure,
  logout,
  clearError,
  setLoading,
  updateUser,
  walletLoginSuccess,
  walletLoginFailure,
} = authSlice.actions;

// Selectors
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectToken = (state: { auth: AuthState }) => state.auth.token;
export const selectIsRestoring = (state: { auth: AuthState }) => state.auth.isRestoring;

// Reducer
export default authSlice.reducer;

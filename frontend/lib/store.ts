import { configureStore } from '@reduxjs/toolkit';
import quizReducer from './features/quiz/quizSlice';
import streakReducer from './features/streak/streakSlice';
import authReducer from './features/auth/authSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      quiz: quizReducer,
      streak: streakReducer,
      auth: authReducer,
    },
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

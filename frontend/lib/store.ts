import { configureStore } from '@reduxjs/toolkit';
import quizReducer from './features/quiz/quizSlice';
import streakReducer from './features/streak/streakSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      quiz: quizReducer,
      streak: streakReducer,
    },
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

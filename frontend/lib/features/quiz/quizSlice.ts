import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  points: number;
}

interface QuizState {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, string>;

  questionStartTime: number | null;
  totalSessionTime: number;

  score: number;
  status: 'idle' | 'loading' | 'active' | 'submitting' | 'completed' | 'error';
  error: string | null;
}

const initialState: QuizState = {
  questions: [],
  currentIndex: 0,
  answers: {},
  questionStartTime: null,
  totalSessionTime: 0,
  score: 0,
  status: 'idle',
  error: null,
};

export const fetchQuestions = createAsyncThunk(
  'quiz/fetchQuestions',
  async (category: string) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return [
      {
        id: 'q1',
        text: 'What is 2+2?',
        options: ['3', '4', '5'],
        correctAnswer: '4',
        points: 10,
      },
      {
        id: 'q2',
        text: 'What is Next.js?',
        options: ['DB', 'Framework', 'Language'],
        correctAnswer: 'Framework',
        points: 20,
      },
    ] as Question[];
  },
);

const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    startQuiz: (state) => {
      state.status = 'active';
      state.currentIndex = 0;
      state.score = 0;
      state.totalSessionTime = 0;
      state.answers = {};
      state.questionStartTime = Date.now();
    },
    submitAnswer: (state, action: PayloadAction<string>) => {
      const currentQ = state.questions[state.currentIndex];
      if (!currentQ || state.status !== 'active') return;

      const now = Date.now();
      const duration = state.questionStartTime
        ? now - state.questionStartTime
        : 0;
      state.totalSessionTime += duration;

      state.answers[currentQ.id] = action.payload;

      if (action.payload === currentQ.correctAnswer) {
        state.score += currentQ.points;
      }

      state.status = 'submitting';
      state.questionStartTime = null;
    },
    nextQuestion: (state) => {
      if (state.currentIndex < state.questions.length - 1) {
        state.currentIndex++;
        state.status = 'active';
        state.questionStartTime = Date.now();
      } else {
        state.status = 'completed';
        state.questionStartTime = null;
      }
    },
    exitQuiz: (state) => {
      state.status = 'idle';
      state.questions = [];
      state.answers = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuestions.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.status = 'idle';
        state.questions = action.payload;
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.error.message || 'Error';
      });
  },
});

export const { startQuiz, submitAnswer, nextQuestion, exitQuiz } =
  quizSlice.actions;
export default quizSlice.reducer;

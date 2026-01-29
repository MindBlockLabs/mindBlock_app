import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  fetchDailyQuest,
  fetchPuzzles,
  submitAnswer as submitAnswerApi,
  type PuzzleResponseDto,
  type SubmitAnswerRequestDto,
} from "../../api/quizApi";

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer?: string; // May be undefined until submission
  points: number;
  categoryId: string;
  difficulty?: string;
  timeLimit?: number;
  isCompleted?: boolean;
}

interface SubmissionResult {
  isCorrect: boolean;
  pointsEarned: number;
}

interface QuizState {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, string>;
  selectedAnswerId: string | null;
  isSubmitting: boolean;
  submissionResult: SubmissionResult | null;

  questionStartTime: number | null;
  totalSessionTime: number;

  score: number;
  correctAnswersCount: number;
  status: "idle" | "loading" | "active" | "submitting" | "completed" | "error";
  error: string | null;
}

const initialState: QuizState = {
  questions: [],
  currentIndex: 0,
  answers: {},
  selectedAnswerId: null,
  isSubmitting: false,
  submissionResult: null,
  questionStartTime: null,
  totalSessionTime: 0,
  score: 0,
  correctAnswersCount: 0,
  status: "idle",
  error: null,
};

export type FetchQuestionsParams =
  | { type: "daily-quest" }
  | { type: "category"; categoryId: string; difficulty?: string };

function mapPuzzleToQuestion(puzzle: PuzzleResponseDto): Question {
  return {
    id: puzzle.id,
    text: puzzle.question,
    options: puzzle.options,
    correctAnswer: puzzle.correctAnswer,
    points: puzzle.points,
    categoryId: puzzle.categoryId,
    difficulty: puzzle.difficulty,
    timeLimit: puzzle.timeLimit,
    isCompleted: puzzle.isCompleted,
  };
}

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
  name: "quiz",
  initialState,
  reducers: {
    startQuiz: (state) => {
      state.status = "active";
      state.currentIndex = 0;
      state.score = 0;
      state.correctAnswersCount = 0;
      state.totalSessionTime = 0;
      state.answers = {};
      state.selectedAnswerId = null;
      state.submissionResult = null;
      state.questionStartTime = Date.now();
    },
    selectAnswer: (state, action: PayloadAction<string>) => {
      state.selectedAnswerId = action.payload;
    },
    submitAnswer: (state, action: PayloadAction<string>) => {
      const currentQ = state.questions[state.currentIndex];
      if (!currentQ || state.status !== "active") return;

      const now = Date.now();
      const duration = state.questionStartTime
        ? now - state.questionStartTime
        : 0;
      state.totalSessionTime += duration;

      state.answers[currentQ.id] = action.payload;

      if (action.payload === currentQ.correctAnswer) {
        state.score += currentQ.points;
      }

      state.status = "submitting";
      state.questionStartTime = null;
    },
    nextQuestion: (state) => {
      if (state.currentIndex < state.questions.length - 1) {
        state.currentIndex++;
        state.status = "active";
        state.selectedAnswerId = null;
        state.submissionResult = null;
        state.questionStartTime = Date.now();
      } else {
        state.status = "completed";
        state.questionStartTime = null;
      }
    },
    exitQuiz: (state) => {
      state.status = "idle";
      state.questions = [];
      state.answers = {};
      state.selectedAnswerId = null;
      state.submissionResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuestions.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.status = "idle";
        state.questions = action.payload;
        state.currentIndex = 0;
        state.error = null;
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message || "Failed to fetch questions";
      })
      .addCase(submitAnswerThunk.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(submitAnswerThunk.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.submissionResult = {
          isCorrect: action.payload.isCorrect,
          pointsEarned: action.payload.pointsEarned,
        };

        // Update score and correct answers count if correct
        if (action.payload.isCorrect) {
          const currentQ = state.questions[state.currentIndex];
          if (currentQ) {
            state.score += action.payload.pointsEarned;
            state.correctAnswersCount += 1;
          }
        }

        // Store the answer
        const currentQ = state.questions[state.currentIndex];
        if (currentQ && state.selectedAnswerId) {
          state.answers[currentQ.id] = state.selectedAnswerId;
        }
      })
      .addCase(submitAnswerThunk.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.error.message || "Failed to submit answer";
      });
  },
});

export const {
  startQuiz,
  submitAnswer,
  nextQuestion,
  exitQuiz,
  selectAnswer,
} = quizSlice.actions;
export default quizSlice.reducer;

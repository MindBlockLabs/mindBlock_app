"use client";

import { useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/reduxHooks";
import {
  fetchQuestions,
  submitAnswerThunk,
  selectAnswer,
  nextQuestion,
  startQuiz,
  type FetchQuestionsParams,
} from "@/lib/features/quiz/quizSlice";
import type { Question } from "@/lib/features/quiz/quizSlice";

function getUserIdFromToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const token = localStorage.getItem("accessToken");
  if (!token) {
    return null;
  }

  try {
    // Decode JWT token (base64url decode the payload)
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );
    return decoded.sub || null;
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
}

export interface UseQuizOptions {
  autoFetch?: boolean;
  fetchParams?: FetchQuestionsParams;
}

export function useQuiz(options: UseQuizOptions = {}) {
  const { autoFetch = false, fetchParams = { type: "daily-quest" } } =
    options;

  const dispatch = useAppDispatch();
  const quizState = useAppSelector((state) => state.quiz);

  const {
    questions,
    currentIndex,
    selectedAnswerId,
    isSubmitting,
    submissionResult,
    status,
    error,
    questionStartTime,
    score,
    correctAnswersCount,
  } = quizState;

  const currentQuestion: Question | null =
    questions.length > 0 && currentIndex < questions.length
      ? questions[currentIndex]
      : null;

  const isLoading = status === "loading";
  const isFinished = status === "completed";

  // Auto-fetch questions on mount if requested
  useEffect(() => {
    if (autoFetch && questions.length === 0 && status === "idle") {
      dispatch(fetchQuestions(fetchParams));
    }
  }, [autoFetch, questions.length, status, fetchParams, dispatch]);

  // Start quiz when questions are loaded
  useEffect(() => {
    if (
      questions.length > 0 &&
      status === "idle" &&
      questionStartTime === null
    ) {
      dispatch(startQuiz());
    }
  }, [questions.length, status, questionStartTime, dispatch]);

  const selectAnswerHandler = useCallback(
    (answerId: string) => {
      if (status !== "active" || isSubmitting) {
        return;
      }
      dispatch(selectAnswer(answerId));
    },
    [dispatch, status, isSubmitting],
  );

  const submitAnswerHandler = useCallback(async () => {
    if (!currentQuestion || !selectedAnswerId || isSubmitting) {
      return;
    }

    const userId = getUserIdFromToken();
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Calculate time spent
    const timeSpent = questionStartTime
      ? Math.floor((Date.now() - questionStartTime) / 1000)
      : 0;

    await dispatch(
      submitAnswerThunk({
        userId,
        puzzleId: currentQuestion.id,
        categoryId: currentQuestion.categoryId,
        userAnswer: selectedAnswerId,
        timeSpent,
      }),
    ).unwrap();
  }, [
    currentQuestion,
    selectedAnswerId,
    isSubmitting,
    questionStartTime,
    dispatch,
  ]);

  const goToNextQuestion = useCallback(() => {
    if (status === "submitting" || status === "active") {
      dispatch(nextQuestion());
    }
  }, [dispatch, status]);

  return {
    questions,
    currentQuestionIndex: currentIndex,
    currentQuestion,
    selectedAnswerId,
    isLoading,
    isSubmitting,
    error,
    isFinished,
    submissionResult,
    score,
    correctAnswersCount,
    selectAnswer: selectAnswerHandler,
    submitAnswer: submitAnswerHandler,
    goToNextQuestion,
  };
}

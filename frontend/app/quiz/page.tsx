"use client";

import { useRef, useEffect } from "react";
import { Nunito } from "next/font/google";
import { QuizHeader } from "@/components/quiz/QuizHeader";
import { AnswerOption } from "@/components/quiz/AnswerOption";
import { LevelComplete } from "@/components/quiz/LevelComplete";
import { QuizCompletionStats } from "../../components/quiz/QuizCompletionStats";
import { useQuiz } from "../../hooks/useQuiz";
import { useAppSelector } from "../../lib/reduxHooks";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
});

export default function QuizPage() {
  const actionBtnRef = useRef<HTMLButtonElement>(null);

  const {
    questions,
    currentQuestion,
    currentQuestionIndex,
    selectedAnswerId,
    isLoading,
    isSubmitting,
    isFinished,
    submissionResult,
    error,
    score,
    correctAnswersCount,
    selectAnswer,
    submitAnswer,
    goToNextQuestion,
  } = useQuiz({
    autoFetch: true,
    fetchParams: { type: "daily-quest" },
  });

  const quizState = useAppSelector((state) => state.quiz);

  const isSubmitted = submissionResult !== null;

  useEffect(() => {
    if (selectedAnswerId && actionBtnRef.current) {
      actionBtnRef.current.focus();
    }
  }, [selectedAnswerId]);

  const handleAction = async () => {
    if (!isSubmitted) {
      try {
        await submitAnswer();
      } catch (err) {
        console.error("Failed to submit answer:", err);
      }
    } else {
      goToNextQuestion();
    }
  };

  // Format time taken from total session time
  const formatTimeTaken = () => {
    const totalSeconds = Math.floor(quizState.totalSessionTime / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`${nunito.className} min-h-screen bg-[#050C16] text-white flex flex-col items-center justify-center p-6`}
      >
        <div className="text-xl">Loading questions...</div>
      </div>
    );
  }

  // Error state
  if (error && questions.length === 0) {
    return (
      <div
        className={`${nunito.className} min-h-screen bg-[#050C16] text-white flex flex-col items-center justify-center p-6`}
      >
        <div className="text-xl text-red-500">Error: {error}</div>
      </div>
    );
  }

  // No questions state
  if (!currentQuestion && !isLoading) {
    return (
      <div
        className={`${nunito.className} min-h-screen bg-[#050C16] text-white flex flex-col items-center justify-center p-6`}
      >
        <div className="text-xl">No questions available</div>
      </div>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <div
      className={`${nunito.className} min-h-screen bg-[#050C16] text-white flex flex-col p-6`}
    >
      {!isFinished && (
        <QuizHeader
          current={currentQuestionIndex + 1}
          total={questions.length}
        />
      )}

      <main className="grow flex flex-col items-center justify-center max-w-[566px] mx-auto w-full">
        {isFinished ? (
          <div>
            <QuizCompletionStats />
            <LevelComplete
              totalPts={score}
              correctAnswers={correctAnswersCount}
              totalQuestions={questions.length}
              timeTaken={formatTimeTaken()}
              onClaim={() => alert("Points Claimed!")}
            />
          </div>
        ) : (
          <div className="w-full space-y-12">
            <h2 className="text-[28px] mt-10 font-semibold text-center">
              {currentQuestion.text}
            </h2>
            <p className="text-center text-sm text-[#E6E6E6]">
              Points: {score * 10}
            </p>
            <div className="space-y-7">
              {currentQuestion.options.map((optionText, index) => {
                const isSelected = selectedAnswerId === optionText;
                let state: "default" | "red" | "green" | "teal" = "default";

                if (isSubmitted && submissionResult) {
                  if (isSelected) {
                    state = submissionResult.isCorrect ? "green" : "red";
                  } else if (submissionResult.isCorrect) {
                    // Show correct answer in green even if not selected
                    // Note: We don't know which option is correct from backend
                    // This would need backend to return correctAnswer in response
                    state = "default";
                  }
                } else if (isSelected) {
                  state = "teal";
                }

                return (
                  <AnswerOption
                    key={`${currentQuestion.id}-${index}`}
                    text={optionText}
                    state={state}
                    disabled={isSubmitted || isSubmitting}
                    onSelect={() => selectAnswer(optionText)}
                  />
                );
              })}
            </div>
            {isSubmitted && submissionResult && (
              <div className="mt-4 space-y-2 text-center">
                <div
                  className={`text-sm font-semibold ${
                    submissionResult.isCorrect ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {submissionResult.isCorrect
                    ? `Correct! +${submissionResult.pointsEarned} pts`
                    : "Incorrect"}
                </div>
                <p className="text-xs text-[#E6E6E6]">
                  Note: backend does not return the correct option, so we only highlight your selected answer.
                </p>
              </div>
            )}

            <button
              ref={actionBtnRef}
              onClick={handleAction}
              disabled={selectedAnswerId === null || isSubmitting}
              style={{ boxShadow: `0 4px 0 0 #2663C7` }}
              className={`w-full h-[50px] bg-[#3B82F6] rounded-[8px] font-bold transition-all outline-none focus-visible:ring-4 focus-visible:ring-white/30 ${
                selectedAnswerId && !isSubmitting
                  ? "cursor-pointer opacity-100"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              {isSubmitting
                ? "Submitting..."
                : isSubmitted
                  ? "Continue"
                  : "Submit Answer"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

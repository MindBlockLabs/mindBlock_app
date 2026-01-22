"use client";
import { useState } from "react";
import { Nunito } from "next/font/google";
import { MOCK_QUIZ } from "@/lib/Quiz_data";
import { QuizHeader } from "@/components/quiz/QuizHeader";
import { LevelComplete } from "@/components/quiz/LevelComplete";
import { AnswerOption } from "@/components/quiz/AnswerOption";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
});

export default function QuizPage() {
  const [step, setStep] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const question = MOCK_QUIZ[step];

  const handleSelectOption = (optionId: string, isCorrect: boolean) => {
    if (selectedId) return;
    setSelectedId(optionId);
    if (isCorrect) setScore((prev) => prev + 1);
  };

  const handleNext = () => {
    if (step < MOCK_QUIZ.length - 1) {
      setStep(step + 1);
      setSelectedId(null);
    } else {
      setIsFinished(true);
    }
  };

  return (
    <div
      className={`${nunito.className} min-h-screen bg-[#050C16] text-white flex flex-col p-6`}
    >
      {!isFinished && (
        <QuizHeader current={step + 1} total={MOCK_QUIZ.length} />
      )}

      <main className="flex-grow flex flex-col items-center justify-center max-w-[566px] mx-auto w-full">
        {isFinished ? (
          <LevelComplete
            totalPts={score * 10}
            correctAnswers={score}
            totalQuestions={MOCK_QUIZ.length}
            timeTaken="3:10"
            onClaim={() => alert("Points Claimed!")}
          />
        ) : (
          <div className="w-full space-y-12">
            <h2 className="text-[28px] mt-10 font-semibold text-center">
              {question.question}
            </h2>
            <div className="space-y-7">
              {question.options.map((opt) => {
                const isSelected = selectedId === opt.id;
                const hasPicked = selectedId !== null;
                const state = isSelected
                  ? opt.isCorrect
                    ? "green"
                    : "red"
                  : hasPicked && opt.isCorrect
                    ? "green"
                    : "default";

                return (
                  <AnswerOption
                    key={opt.id}
                    text={opt.text}
                    state={state}
                    disabled={hasPicked}
                    onSelect={() => handleSelectOption(opt.id, opt.isCorrect)}
                  />
                );
              })}
            </div>
            <button
              onClick={handleNext}
              disabled={selectedId === null}
              style={{ boxShadow: `0 4px 0 0 #2663C7` }}
              className={`w-full h-[50px] bg-[#3B82F6] rounded-[8px] font-bold ${selectedId ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
            >
              Continue
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

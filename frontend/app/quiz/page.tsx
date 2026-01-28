"use client";
import { useState, useRef, useEffect } from "react";
import { Nunito } from "next/font/google";
import { MOCK_QUIZ } from "@/lib/Quiz_data";
import { QuizHeader } from "@/components/quiz/QuizHeader";
import { AnswerOption } from "@/components/quiz/AnswerOption";
import { LevelComplete } from "@/components/quiz/LevelComplete";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
});

export default function QuizPage() {
  const [step, setStep] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const actionBtnRef = useRef<HTMLButtonElement>(null);

  const question = MOCK_QUIZ[step];

  const handleSelectOption = (optionId: string) => {
    if (isSubmitted) return;
    setSelectedId(optionId);
  };

  useEffect(() => {
    if (selectedId && actionBtnRef.current) {
      actionBtnRef.current.focus();
    }
  }, [selectedId]);

  const handleAction = () => {
    if (!isSubmitted) {
      setIsSubmitted(true);
      const selectedOption = question.options.find(
        (opt) => opt.id === selectedId,
      );
      if (selectedOption?.isCorrect) {
        setScore((prev) => prev + 1);
      }
    } else {
      if (step < MOCK_QUIZ.length - 1) {
        setStep(step + 1);
        setSelectedId(null);
        setIsSubmitted(false);
      } else {
        setIsFinished(true);
      }
    }
  };

  return (
    <div
      className={`${nunito.className} min-h-screen bg-[#050C16] text-white flex flex-col p-6`}
    >
      {!isFinished && (
        <QuizHeader current={step + 1} total={MOCK_QUIZ.length} />
      )}

      <main className="grow flex flex-col items-center justify-center max-w-[566px] mx-auto w-full">
        {isFinished ? (
          <QuizCompletionStats />
        ) : (
          <div className="w-full space-y-12">
            <h2 className="text-[28px] mt-10 font-semibold text-center">
              {question.question}
            </h2>
            <div className="space-y-7">
              {question.options.map((opt) => {
                const isSelected = selectedId === opt.id;
                let state: "default" | "red" | "green" | "teal" = "default";

                if (isSubmitted) {
                  if (isSelected) {
                    state = opt.isCorrect ? "green" : "red";
                  } else if (opt.isCorrect) {
                    state = "green";
                  }
                } else if (isSelected) {
                  state = "teal";
                }

                return (
                  <AnswerOption
                    key={opt.id}
                    text={opt.text}
                    state={state}
                    disabled={isSubmitted}
                    onSelect={() => handleSelectOption(opt.id)}
                  />
                );
              })}
            </div>

            <button
              ref={actionBtnRef}
              onClick={handleAction}
              disabled={selectedId === null}
              style={{ boxShadow: `0 4px 0 0 #2663C7` }}
              className={`w-full h-[50px] bg-[#3B82F6] rounded-lg font-bold transition-all outline-none focus-visible:ring-4 focus-visible:ring-white/30 ${
                selectedId
                  ? "cursor-pointer opacity-100"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              {isSubmitted ? "Continue" : "Submit Answer"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

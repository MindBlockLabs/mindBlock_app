"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnswerOption } from "@/components/quiz/AnswerOption";
import { getPuzzleById } from "@/lib/api/puzzleApi";
import {
  ChallengeAttemptApiError,
  createAttempt,
  getAttempt,
  submitAttempt,
} from "@/lib/api/challengeAttemptApi";
import {
  ChallengeAttempt,
  PuzzleSummary,
  SubmitAttemptResult,
} from "@/lib/types/challengeAttempt";

const STORAGE_KEY = "activeGameSession";

interface StoredSession {
  sessionId?: string;
  attemptId: string;
  challengeId: string;
}

type Phase = "loading" | "active" | "submitting" | "result" | "error";

const TERMINAL_STATUSES = new Set(["CORRECT", "INCORRECT", "EXPIRED"]);

function readStoredSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

function persistSession(session: StoredSession): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // localStorage may be unavailable in certain environments; ignore silently.
  }
}

function generateUUID(): string {
  if (
    typeof window !== "undefined" &&
    typeof window.crypto?.randomUUID === "function"
  ) {
    return window.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * getPuzzleById is typed against `frontend/lib/types/puzzles.ts`'s `Puzzle`,
 * which doesn't match what the backend `Puzzle` entity actually returns
 * (that type has phantom `title`/`description`/`type` fields and is
 * missing `question`/`options`, which the real API response does include).
 * We hit the same endpoint but trust our own accurate `PuzzleSummary` shape
 * for the response instead of the mismatched frontend type.
 */
async function fetchPuzzleSummary(id: string): Promise<PuzzleSummary> {
  const raw = await getPuzzleById(id);
  return raw as unknown as PuzzleSummary;
}

export default function SolvePuzzlePage() {
  const params = useParams();
  const router = useRouter();
  const puzzleId = params.id as string;

  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<ChallengeAttempt | null>(null);
  const [puzzle, setPuzzle] = useState<PuzzleSummary | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitAttemptResult | null>(null);
  const [startedAtMs, setStartedAtMs] = useState<number>(Date.now());

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setPhase("loading");
      setErrorMessage(null);

      try {
        const stored = readStoredSession();
        const resumable =
          stored && stored.challengeId === puzzleId && stored.attemptId
            ? stored
            : null;

        const puzzleData = await fetchPuzzleSummary(puzzleId);
        if (cancelled) return;
        setPuzzle(puzzleData);

        if (resumable) {
          // Refresh-safe path: rehydrate the existing attempt rather than
          // starting a new one.
          const existing = await getAttempt(resumable.attemptId);
          if (cancelled) return;

          if (TERMINAL_STATUSES.has(existing.status)) {
            // Already graded — show the cached result instead of
            // re-submitting. This is the frontend half of duplicate
            // submission safety: refreshing after a submit never re-POSTs.
            setAttempt(existing);
            setResult({
              attempt: existing,
              isCorrect: existing.status === "CORRECT",
              feedback:
                existing.status === "CORRECT"
                  ? "Correct!"
                  : "Not quite — try the next one.",
              xp: null,
              progress: {
                attemptsInSession: 0,
                sessionTarget: 5,
                sessionCompleted: existing.sessionCompleted,
              },
              nextChallenge: null,
              isDuplicateReplay: true,
            });
            setPhase("result");
          } else {
            setAttempt(existing);
            setStartedAtMs(Date.now());
            setPhase("active");
          }
          return;
        }

        // No resumable attempt for this puzzle: start a fresh one. Reuse the
        // session id already in storage (if any) so a multi-puzzle session
        // stays grouped; only mint a new one if there truly is no session yet.
        const sessionId = stored?.sessionId ?? generateUUID();
        const newAttempt = await createAttempt(puzzleId, sessionId);
        if (cancelled) return;

        persistSession({
          sessionId,
          attemptId: newAttempt.id,
          challengeId: puzzleId,
        });
        setAttempt(newAttempt);
        setStartedAtMs(Date.now());
        setPhase("active");
      } catch (err) {
        if (cancelled) return;
        setErrorMessage(
          err instanceof ChallengeAttemptApiError
            ? err.message
            : "Failed to load this challenge.",
        );
        setPhase("error");
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [puzzleId]);

  const handleSubmit = useCallback(async () => {
    if (!attempt || !selected) return;
    setPhase("submitting");
    setErrorMessage(null);

    try {
      const timeSpent = Math.round((Date.now() - startedAtMs) / 1000);
      const res = await submitAttempt(attempt.id, selected, timeSpent);
      if (typeof window !== "undefined") {
        // Keep storage pointed at this (now terminal) attempt so a refresh
        // right after submitting still shows the cached result rather than
        // starting a new attempt.
        persistSession({
          sessionId: attempt.sessionId,
          attemptId: attempt.id,
          challengeId: attempt.challengeId,
        });
      }
      setResult(res);
      setAttempt(res.attempt);
      setPhase("result");
    } catch (err) {
      setErrorMessage(
        err instanceof ChallengeAttemptApiError
          ? err.message
          : "Failed to submit your answer.",
      );
      setPhase("error");
    }
  }, [attempt, selected, startedAtMs]);

  const handleContinue = useCallback(() => {
    if (!result?.nextChallenge) return;
    // Deliberately not clearing localStorage here: the stored sessionId
    // needs to carry forward to the next puzzle's page so the session stays
    // grouped. That page's own init logic sees a non-matching challengeId
    // and starts a fresh attempt for the new puzzle while reusing the
    // existing sessionId.
    router.push(`/puzzles/${result.nextChallenge.id}/solve`);
  }, [result, router]);

  const handleFinishSession = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    router.push("/puzzles");
  }, [router]);

  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4" />
          <p>Loading challenge...</p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-slate-400 mb-6">
            {errorMessage ?? "Something went wrong."}
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!puzzle) {
    return null;
  }

  const isSubmitting = phase === "submitting";
  const isResult = phase === "result";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8">
      <div className="mx-auto max-w-3xl w-full space-y-12">
        <h2 className="text-[28px] mt-10 font-semibold text-center">
          {puzzle.question}
        </h2>

        <div className="space-y-7">
          {puzzle.options.map((optionText, index) => {
            const isSelected = selected === optionText;
            let state: "default" | "red" | "green" | "teal" = "default";

            if (isResult && result) {
              if (isSelected) {
                state = result.isCorrect ? "green" : "red";
              }
              // We don't know which option was actually correct from the
              // response (it isn't sent back), so unselected options stay
              // "default" — same known limitation as the /quiz flow.
            } else if (isSelected) {
              state = "teal";
            }

            return (
              <AnswerOption
                key={`${puzzle.id}-${index}`}
                text={optionText}
                state={state}
                disabled={isResult || isSubmitting}
                onSelect={() => setSelected(optionText)}
              />
            );
          })}
        </div>

        {isResult && result && (
          <div className="space-y-2 text-center">
            <div
              className={`text-sm font-semibold ${
                result.isCorrect ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {result.isCorrect
                ? `Correct!${result.xp ? ` +${result.xp.awarded} XP` : ""}`
                : "Incorrect"}
            </div>
            {result.progress.sessionCompleted ? (
              <p className="text-xs text-[#E6E6E6]">
                Session complete — {result.progress.attemptsInSession} of{" "}
                {result.progress.sessionTarget} challenges done.
              </p>
            ) : (
              <p className="text-xs text-[#E6E6E6]">
                {result.progress.attemptsInSession} of{" "}
                {result.progress.sessionTarget} challenges in this session.
              </p>
            )}
          </div>
        )}

        {isResult ? (
          result?.progress.sessionCompleted || !result?.nextChallenge ? (
            <button
              onClick={handleFinishSession}
              style={{ boxShadow: "0 4px 0 0 #2663C7" }}
              className="w-full h-[50px] bg-[#3B82F6] rounded-[8px] font-bold transition-all outline-none focus-visible:ring-4 focus-visible:ring-white/30 cursor-pointer"
            >
              Finish Session
            </button>
          ) : (
            <button
              onClick={handleContinue}
              style={{ boxShadow: "0 4px 0 0 #2663C7" }}
              className="w-full h-[50px] bg-[#3B82F6] rounded-[8px] font-bold transition-all outline-none focus-visible:ring-4 focus-visible:ring-white/30 cursor-pointer"
            >
              Continue
            </button>
          )
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!selected || isSubmitting}
            style={{ boxShadow: "0 4px 0 0 #2663C7" }}
            className={`w-full h-[50px] bg-[#3B82F6] rounded-[8px] font-bold transition-all outline-none focus-visible:ring-4 focus-visible:ring-white/30 ${
              selected && !isSubmitting
                ? "cursor-pointer opacity-100"
                : "opacity-50 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        )}
      </div>
    </div>
  );
}

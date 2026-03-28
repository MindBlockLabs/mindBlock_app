"use client";

import React from "react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface ChallengeExample {
  input: string;
  output: string;
}

export interface ChallengeData {
  title: string;
  description: string;
  examples: ChallengeExample[];
  requirements: string[];
  timeRemaining?: number; // in seconds
}

// ─────────────────────────────────────────────
// Mock Data (swap with API data when ready)
// ─────────────────────────────────────────────
const MOCK_CHALLENGE: ChallengeData = {
  title: "Input And Reverses The Order Of The Words",
  description:
    "Write a function that takes a sentence as input and reverses the order of the words, but keeps each word itself intact.",
  examples: [
    {
      input: '"JavaScript is fun"',
      output: '"fun is JavaScript"',
    },
  ],
  requirements: [
    "Handle any number of spaces between words.",
    "Trim leading or trailing spaces.",
    "Work for sentences containing punctuation",
  ],
  timeRemaining: 5144,
};

// ─────────────────────────────────────────────
// TimerDisplay
// ─────────────────────────────────────────────
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

function TimerDisplay({ timeRemaining }: { timeRemaining: number }) {
  return (
    <div
      className="flex items-center gap-2"
      aria-label={`Time remaining: ${formatTime(timeRemaining)}`}
    >
      {/* Clock icon */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#6b8cae"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span
        className="text-sm font-semibold tracking-widest"
        style={{ fontFamily: "monospace", color: "#c8d8f0" }}
      >
        {formatTime(timeRemaining)}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// ChallengeHeader
// ─────────────────────────────────────────────
function ChallengeHeader({ title }: { title: string }) {
  return (
    <h1 className="text-lg font-bold leading-snug" style={{ color: "#e8f0fe" }}>
      {title}
    </h1>
  );
}

// ─────────────────────────────────────────────
// ChallengeDescription
// ─────────────────────────────────────────────
function ChallengeDescription({ description }: { description: string }) {
  return (
    <div className="flex flex-col gap-3">
      {description.split("\n\n").map((paragraph, idx) => (
        <p
          key={idx}
          className="text-sm leading-relaxed"
          style={{ color: "#8ba4c4" }}
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// ExampleSection
// ─────────────────────────────────────────────
function ExampleSection({ examples }: { examples: ChallengeExample[] }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-bold" style={{ color: "#e8f0fe" }}>
        For example,
      </h2>
      {examples.map((example, idx) => (
        <div
          key={idx}
          className="flex flex-col gap-1.5 pl-4 py-2.5 rounded-r-md"
          style={{
            borderLeft: "3px solid #4c9be8",
            backgroundColor: "#0d1b2e",
          }}
        >
          <div className="flex items-baseline gap-2 text-sm">
            <span className="font-bold" style={{ color: "#e8f0fe" }}>
              Input:
            </span>
            <code
              className="text-sm"
              style={{ fontFamily: "monospace", color: "#8ba4c4" }}
            >
              {example.input}
            </code>
          </div>
          <div className="flex items-baseline gap-2 text-sm">
            <span className="font-bold" style={{ color: "#e8f0fe" }}>
              Output:
            </span>
            <code
              className="text-sm"
              style={{ fontFamily: "monospace", color: "#8ba4c4" }}
            >
              {example.output}
            </code>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// RequirementsList
// ─────────────────────────────────────────────
function RequirementsList({ requirements }: { requirements: string[] }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-bold" style={{ color: "#e8f0fe" }}>
        The function should:
      </h2>
      <ul className="flex flex-col gap-2 pl-5 list-disc" role="list">
        {requirements.map((req, idx) => (
          <li
            key={idx}
            className="text-sm leading-relaxed"
            style={{ color: "#8ba4c4" }}
          >
            {req}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────
// ChallengeDescriptionPanel (main export)
// ─────────────────────────────────────────────
interface ChallengeDescriptionPanelProps {
  challenge?: ChallengeData; // optional: falls back to mock data
}

export default function ChallengeDescriptionPanel({
  challenge = MOCK_CHALLENGE,
}: ChallengeDescriptionPanelProps) {
  const { title, description, examples, requirements, timeRemaining } =
    challenge;

  return (
    <aside
      className="flex flex-col w-full h-screen overflow-hidden md:w-2/5 md:min-w-[340px]"
      style={{ backgroundColor: "#0d1b2e", fontFamily: "Poppins, sans-serif" }}
      aria-label="Challenge description"
    >
      {/* ── Top bar ── */}
      <div
        className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
        style={{
          backgroundColor: "#0d1b2e",
          borderBottom: "1px solid #1e3a5f",
        }}
      >
        <span
          className="text-sm font-semibold truncate"
          style={{ color: "#8ba4c4" }}
        >
          {title}
        </span>
        {timeRemaining !== undefined && (
          <TimerDisplay timeRemaining={timeRemaining} />
        )}
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Card */}
        <section
          className="flex flex-col overflow-hidden rounded-xl"
          style={{
            backgroundColor: "#112240",
            border: "1px solid #1e3a5f",
          }}
          aria-labelledby="desc-section-heading"
        >
          {/* Card tab header */}
          <div
            className="flex items-center gap-2 px-5 py-3"
            style={{
              backgroundColor: "#1a3358",
              borderBottom: "1px solid #1e3a5f",
            }}
          >
            {/* Document icon */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4c9be8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="8" y1="9" x2="16" y2="9" />
              <line x1="8" y1="13" x2="16" y2="13" />
              <line x1="8" y1="17" x2="12" y2="17" />
            </svg>
            <span
              id="desc-section-heading"
              className="text-sm font-semibold"
              style={{ color: "#e8f0fe" }}
            >
              Description
            </span>
          </div>

          {/* Card body */}
          <div className="flex flex-col gap-6 px-6 py-6">
            <ChallengeHeader title={title} />
            <ChallengeDescription description={description} />
            <ExampleSection examples={examples} />
            <RequirementsList requirements={requirements} />
          </div>
        </section>
      </div>
    </aside>
  );
}

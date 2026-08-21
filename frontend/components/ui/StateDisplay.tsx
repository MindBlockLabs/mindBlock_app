"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Inbox,
  LockKeyhole,
  Puzzle,
  RefreshCw,
} from "lucide-react";

type StateAction = {
  label: string;
  onClick: () => void;
};

type StateDisplayProps = {
  title: string;
  message?: string;
  action?: StateAction;
  icon?: ReactNode;
  className?: string;
};

const StateDisplay = ({
  title,
  message,
  action,
  icon,
  className = "",
}: StateDisplayProps) => (
  <section
    className={`state-display ${className}`}
    aria-live="polite"
    aria-atomic="true"
  >
    <div className="state-display__icon" aria-hidden="true">
      {icon}
    </div>
    <h2 className="state-display__title">{title}</h2>
    {message && <p className="state-display__message">{message}</p>}
    {action && (
      <button type="button" className="state-display__action" onClick={action.onClick}>
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        {action.label}
      </button>
    )}
  </section>
);

export const LoadingState = ({
  message = "Loading your next challenge...",
  className = "",
}: { message?: string; className?: string }) => (
  <StateDisplay
    title={message}
    className={`state-display--loading ${className}`}
    icon={<Brain className="h-9 w-9" />}
  />
);

export const ErrorState = ({
  message = "We could not load this right now. Please try again.",
  onRetry,
  className = "",
}: { message?: string; onRetry: () => void; className?: string }) => (
  <StateDisplay
    title="Something went wrong"
    message={message}
    action={{ label: "Try again", onClick: onRetry }}
    className={`state-display--error ${className}`}
    icon={<AlertTriangle className="h-9 w-9" />}
  />
);

export const EmptyState = ({
  title = "Nothing here yet",
  message = "Try changing your filters or come back after your next challenge.",
  action,
  className = "",
}: StateDisplayProps) => (
  <StateDisplay
    title={title}
    message={message}
    action={action}
    className={`state-display--empty ${className}`}
    icon={<Inbox className="h-9 w-9" />}
  />
);

export const SuccessState = ({
  title = "Nice work!",
  message,
  action,
  className = "",
}: StateDisplayProps) => (
  <StateDisplay
    title={title}
    message={message}
    action={action}
    className={`state-display--success ${className}`}
    icon={<CheckCircle2 className="h-9 w-9" />}
  />
);

export const SessionExpiredState = ({ onSignIn, className = "" }: {
  onSignIn: () => void;
  className?: string;
}) => (
  <StateDisplay
    title="Your session expired"
    message="Sign in again to keep your progress moving."
    action={{ label: "Sign in", onClick: onSignIn }}
    className={`state-display--expired ${className}`}
    icon={<Puzzle className="h-9 w-9" />}
  />
);

export const LockedState = ({
  title = "Challenge locked",
  message = "Complete the previous challenge to unlock this one.",
  className = "",
}: Omit<StateDisplayProps, "action" | "icon">) => (
  <StateDisplay
    title={title}
    message={message}
    className={`state-display--locked ${className}`}
    icon={<LockKeyhole className="h-9 w-9" />}
  />
);

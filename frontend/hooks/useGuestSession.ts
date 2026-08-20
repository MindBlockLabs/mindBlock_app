import { useState, useEffect, useCallback } from 'react';

export interface GuestSessionData {
  sessionId: string;
  createdAt: number;
  expiresAt: number;
  hintsUsed: number;
  maxHints: number;
}

const GUEST_KEY = 'mb_guest_session';

export function useGuestSession() {
  const [session, setSession] = useState<GuestSessionData | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [showSignupModal, setShowSignupModal] = useState<boolean>(false);

  // Initialize or load guest session
  useEffect(() => {
    const stored = localStorage.getItem(GUEST_KEY);
    if (stored) {
      try {
        const parsed: GuestSessionData = JSON.parse(stored);
        if (Date.now() > parsed.expiresAt) {
          setIsExpired(true);
          setShowSignupModal(true);
        } else {
          setSession(parsed);
          setTimeLeft(Math.max(0, Math.floor((parsed.expiresAt - Date.now()) / 1000)));
        }
      } catch {
        localStorage.removeItem(GUEST_KEY);
      }
    }
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!session || isExpired) return;

    const timer = setInterval(() => {
      const remaining = Math.floor((session.expiresAt - Date.now()) / 1000);
      if (remaining <= 0) {
        setTimeLeft(0);
        setIsExpired(true);
        setShowSignupModal(true);
        clearInterval(timer);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session, isExpired]);

  const startGuestSession = useCallback(() => {
    const now = Date.now();
    const newSession: GuestSessionData = {
      sessionId: `guest_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: now,
      expiresAt: now + 15 * 60 * 1000,
      hintsUsed: 0,
      maxHints: 2,
    };
    localStorage.setItem(GUEST_KEY, JSON.stringify(newSession));
    setSession(newSession);
    setIsExpired(false);
    setTimeLeft(15 * 60);
  }, []);

  const useHint = useCallback((): boolean => {
    if (!session || isExpired) return false;
    if (session.hintsUsed >= session.maxHints) {
      setShowSignupModal(true);
      return false;
    }

    const updated = { ...session, hintsUsed: session.hintsUsed + 1 };
    setSession(updated);
    localStorage.setItem(GUEST_KEY, JSON.stringify(updated));
    return true;
  }, [session, isExpired]);

  const clearGuestSession = useCallback(() => {
    localStorage.removeItem(GUEST_KEY);
    setSession(null);
    setIsExpired(false);
    setTimeLeft(0);
  }, []);

  return {
    session,
    timeLeft,
    isExpired,
    showSignupModal,
    setShowSignupModal,
    startGuestSession,
    useHint,
    clearGuestSession,
  };
}

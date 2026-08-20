'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

const STORAGE_KEY = 'onboardingData';

export interface OnboardingData {
  challengeLevel: string;
  challengeTypes: string[];
  referralSource: string;
  ageGroup: string;
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: <K extends keyof OnboardingData>(
    section: K,
    payload: OnboardingData[K],
  ) => void;
  resetData: () => void;
}

const defaultData: OnboardingData = {
  challengeLevel: '',
  challengeTypes: [],
  referralSource: '',
  ageGroup: '',
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

/**
 * Reads onboarding data from localStorage.
 * Returns defaultData when localStorage is unavailable or the stored value
 * is malformed.
 */
function readFromStorage(): OnboardingData {
  if (typeof window === 'undefined') return defaultData;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;

    const parsed = JSON.parse(raw) as Partial<OnboardingData>;

    return {
      challengeLevel:
        typeof parsed.challengeLevel === 'string'
          ? parsed.challengeLevel
          : defaultData.challengeLevel,
      challengeTypes: Array.isArray(parsed.challengeTypes)
        ? parsed.challengeTypes
        : defaultData.challengeTypes,
      referralSource:
        typeof parsed.referralSource === 'string'
          ? parsed.referralSource
          : defaultData.referralSource,
      ageGroup:
        typeof parsed.ageGroup === 'string'
          ? parsed.ageGroup
          : defaultData.ageGroup,
    };
  } catch {
    return defaultData;
  }
}

/**
 * Writes onboarding data to localStorage.
 * Silently ignores errors (e.g. private browsing quota exceeded).
 */
function writeToStorage(data: OnboardingData): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore write failures.
  }
}

/**
 * Removes the onboarding data entry from localStorage.
 */
function clearStorage(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  // Initialise from localStorage so a page refresh does not lose data.
  const [data, setData] = useState<OnboardingData>(defaultData);

  // Hydrate from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    const stored = readFromStorage();
    // Only restore if at least one field was actually saved (avoids
    // overwriting in-memory state with an empty object on first visit).
    const hasStoredData =
      stored.challengeLevel ||
      stored.challengeTypes.length > 0 ||
      stored.referralSource ||
      stored.ageGroup;

    if (hasStoredData) {
      setData(stored);
    }
  }, []);

  const updateData = <K extends keyof OnboardingData>(
    section: K,
    payload: OnboardingData[K],
  ) => {
    setData((prev) => {
      const next = { ...prev, [section]: payload };
      writeToStorage(next);
      return next;
    });
  };

  const resetData = () => {
    clearStorage();
    setData(defaultData);
  };

  return (
    <OnboardingContext.Provider value={{ data, updateData, resetData }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

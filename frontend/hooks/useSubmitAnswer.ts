import { useState, useCallback } from 'react';
import { submitAnswer, SubmitAnswerDto, SubmitAnswerResponse } from '../lib/api/progressApi';

interface UseSubmitAnswerResult {
  submit: (dto: SubmitAnswerDto) => Promise<SubmitAnswerResponse | undefined>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useSubmitAnswer(): UseSubmitAnswerResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (dto: SubmitAnswerDto) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await submitAnswer(dto);
      return response;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'An unexpected error occurred while submitting the answer';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    submit,
    isLoading,
    error,
    clearError,
  };
}

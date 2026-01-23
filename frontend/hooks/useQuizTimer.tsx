import { useState, useEffect } from 'react';

export const useQuizTimer = (startTime: number | null, isPaused: boolean) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime || isPaused) return;

    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isPaused]);

  useEffect(() => {
    setElapsed(0);
  }, [startTime]);

  return elapsed;
};

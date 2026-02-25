import { usePrefersReducedMotion } from '@/lib/animations/hooks';

const useReducedMotionCheck = () => {
  const prefersReducedMotion = usePrefersReducedMotion();

  return prefersReducedMotion;
};

export default useReducedMotionCheck;
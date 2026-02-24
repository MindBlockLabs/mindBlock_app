import { usePrefersReducedMotion } from 'framer-motion';

const useReducedMotionCheck = () => {
  const prefersReducedMotion = usePrefersReducedMotion();

  return prefersReducedMotion;
};

export default useReducedMotionCheck;
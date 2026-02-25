import { useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Hook to determine if animations should be disabled based on user preferences.
 */
export const usePrefersReducedMotion = (): boolean => {
  return useReducedMotion() ?? false;
};

/**
 * Hook to trigger animations on scroll.
 * @param ref - React ref to the element to observe.
 * @param callback - Callback to trigger when the element is in view.
 */
export const useScrollAnimation = (ref: React.RefObject<HTMLElement>, callback: () => void) => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          callback();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, callback]);
};
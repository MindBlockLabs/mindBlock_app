import { Variants } from 'framer-motion';

// Ensure consistent timing for animations
export const DEFAULT_ANIMATION_DURATION = 0.3; // 300ms
export const MICRO_INTERACTION_DURATION = 0.15; // 150ms

// Fade-in animation
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DEFAULT_ANIMATION_DURATION } },
};

// Slide-up animation
export const slideUp: Variants = {
  hidden: { y: 50, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: DEFAULT_ANIMATION_DURATION } },
};

// Scale-in animation
export const scaleIn: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: DEFAULT_ANIMATION_DURATION } },
};

// Stagger container for list animations
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Pulse animation
export const pulse: Variants = {
  hidden: { scale: 1 },
  visible: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.6,
      repeat: Infinity,
    },
  },
};
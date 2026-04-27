import { useReducedMotion } from 'framer-motion';

/**
 * Wraps a Framer Motion animation spec with prefers-reduced-motion support.
 * When reduced motion is on, animations are stripped to instant.
 */
export function useMotion(spec) {
  const reduced = useReducedMotion();
  if (reduced) {
    return {
      initial: spec?.initial ? {} : undefined,
      animate: spec?.animate ? {} : undefined,
      exit: spec?.exit ? {} : undefined,
      transition: { duration: 0 },
    };
  }
  return spec;
}

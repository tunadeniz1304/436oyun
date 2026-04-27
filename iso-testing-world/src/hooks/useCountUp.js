import { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

export function useCountUp(value, duration = 600) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      prev.current = value;
      return;
    }
    const start = prev.current;
    const delta = value - start;
    if (delta === 0) {
      setDisplay(value);
      return;
    }
    const startTime = performance.now();
    let raf;
    const tick = (t) => {
      const progress = Math.min(1, (t - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      setDisplay(Math.round(start + delta * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        prev.current = value;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduced]);

  return display;
}

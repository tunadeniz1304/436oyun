import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Counts down from `initial` seconds with 100ms tick precision.
 * `paused` halts ticks (used while FeedbackModal is open during Zone 2).
 * `onExpire` fires once when remaining hits 0.
 */
export function useTimer({ initial, paused = false, onExpire }) {
  const [remaining, setRemaining] = useState(initial);
  const intervalRef = useRef(null);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (paused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return undefined;
    }
    if (remaining <= 0) {
      return undefined;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        const next = Math.max(0, r - 0.1);
        if (next <= 0 && !expiredRef.current) {
          expiredRef.current = true;
          if (onExpireRef.current) onExpireRef.current();
        }
        return next;
      });
    }, 100);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [paused, remaining]);

  const reset = useCallback(
    (next = initial) => {
      expiredRef.current = false;
      setRemaining(next);
    },
    [initial]
  );

  return { remaining, reset };
}

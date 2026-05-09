import { useState, useCallback } from 'react';

/**
 * Queues FeedbackModal payloads. Multiple wrong answers fired in quick
 * succession are shown one at a time — the player must click "I understand"
 * on the current one before the next appears.
 */
export function useFeedbackQueue() {
  const [queue, setQueue] = useState([]);

  const push = useCallback((payload) => {
    setQueue((q) => [...q, payload]);
  }, []);

  const pop = useCallback(() => {
    setQueue((q) => q.slice(1));
  }, []);

  const clear = useCallback(() => setQueue([]), []);

  const current = queue[0] ?? null;
  const isOpen = !!current;

  return { current, isOpen, push, pop, clear, depth: queue.length };
}

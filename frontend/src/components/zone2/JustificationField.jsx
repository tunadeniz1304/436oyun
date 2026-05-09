import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../shared/Button.jsx';
import { useMotion } from '../../hooks/useMotion.js';
import './JustificationField.css';

const MIN_WORDS = 3;

function countWords(s) {
  return s.trim().length === 0 ? 0 : s.trim().split(/\s+/).length;
}

function JustificationField({
  visible,
  value,
  onChange,
  onSubmit,
  onCancel,
}) {
  const taRef = useRef(null);
  const expandMotion = useMotion({
    initial: { height: 0, opacity: 0 },
    animate: { height: 'auto', opacity: 1 },
    exit: { height: 0, opacity: 0 },
    transition: { duration: 0.22, ease: 'easeOut' },
  });

  useEffect(() => {
    if (visible) {
      const id = requestAnimationFrame(() => taRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [visible]);

  const words = countWords(value);
  const ok = words >= MIN_WORDS;

  return (
    <AnimatePresence initial={false}>
      {visible ? (
        <motion.div
          className="justification-field"
          {...expandMotion}
          style={{ overflow: 'hidden' }}
        >
          <label htmlFor="z2-justification" className="justification-field__label">
            Why both? — explain in at least {MIN_WORDS} words.
          </label>
          <textarea
            id="z2-justification"
            ref={taRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={2}
            placeholder="e.g. need to confirm the spec is met AND that real users can complete the task"
            className="justification-field__textarea"
            aria-describedby="z2-justification-help"
          />
          <div className="justification-field__row">
            <span
              id="z2-justification-help"
              className={`justification-field__count ${ok ? 'is-ok' : ''}`}
            >
              {words} word{words === 1 ? '' : 's'}
              {ok ? ' ✓' : ` — need ${MIN_WORDS - words} more`}
            </span>
            <div className="justification-field__actions">
              <Button
                variant="ghost"
                size="sm"
                zoneColor="var(--zone2-color)"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                zoneColor="var(--zone2-color)"
                disabled={!ok}
                onClick={onSubmit}
              >
                Submit BOTH →
              </Button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default JustificationField;
export { MIN_WORDS, countWords };

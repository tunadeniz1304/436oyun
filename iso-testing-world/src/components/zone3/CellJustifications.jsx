import { motion, AnimatePresence } from 'framer-motion';
import { useMotion } from '../../hooks/useMotion.js';
import { TEST_LEVELS, TEST_TYPES } from '../../data/zone3-scenarios.js';
import './CellJustifications.css';

const MIN_WORDS = 3;

function countWords(s) {
  return s.trim().length === 0 ? 0 : s.trim().split(/\s+/).length;
}

function levelLabel(id) {
  return TEST_LEVELS.find((l) => l.id === id)?.label ?? id;
}
function typeLabel(id) {
  return TEST_TYPES.find((t) => t.id === id)?.label ?? id;
}

function CellJustifications({ selected, justifications, onChange, errors }) {
  const fieldMotion = useMotion({
    initial: { opacity: 0, y: 4 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
    transition: { duration: 0.2 },
  });

  if (selected.length === 0) {
    return (
      <p className="cell-justifications__empty">
        Pick at least one cell, then justify each in one short line.
      </p>
    );
  }

  return (
    <div className="cell-justifications" aria-live="polite">
      <h4 className="cell-justifications__title">
        Justify each selection (≥ {MIN_WORDS} words)
      </h4>
      <AnimatePresence initial={false}>
        {selected.map((key) => {
          const [level, type] = key.split('__');
          const value = justifications[key] ?? '';
          const words = countWords(value);
          const isError = errors?.has(key);
          return (
            <motion.div key={key} className="cell-justifications__row" {...fieldMotion}>
              <label
                className="cell-justifications__label"
                htmlFor={`just-${key}`}
              >
                <span className="cell-justifications__chip">
                  {levelLabel(level)} × {typeLabel(type)}
                </span>
              </label>
              <input
                id={`just-${key}`}
                type="text"
                value={value}
                onChange={(e) => onChange(key, e.target.value)}
                className={`cell-justifications__input ${isError ? 'is-error' : ''}`}
                placeholder="why this cell?"
                aria-invalid={isError || undefined}
              />
              <span
                className={`cell-justifications__count ${
                  words >= MIN_WORDS ? 'is-ok' : ''
                }`}
              >
                {words}
                <span className="cell-justifications__count-min"> / {MIN_WORDS}</span>
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default CellJustifications;
export { countWords, MIN_WORDS };

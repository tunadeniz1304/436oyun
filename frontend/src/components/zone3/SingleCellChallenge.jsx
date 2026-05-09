import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../shared/Button.jsx';
import { getISODefinition } from '../../data/iso-definitions.js';
import { useMotion } from '../../hooks/useMotion.js';
import './SingleCellChallenge.css';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function SingleCellChallenge({ open, onAddMore, onGoBack }) {
  const dialogRef = useRef(null);
  const addMoreRef = useRef(null);
  const def = getISODefinition('§3.130 Note 1');

  const backdrop = useMotion({
    initial: { opacity: 0 },
    animate: { opacity: 0.55 },
    exit: { opacity: 0 },
    transition: { duration: 0.15 },
  });
  const box = useMotion({
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
    transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
  });

  useEffect(() => {
    if (!open) return undefined;
    const id = requestAnimationFrame(() => addMoreRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (e.key !== 'Tab') return;
      const focusables = dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR);
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="single-cell-challenge-root">
          <motion.div className="single-cell-challenge-backdrop" {...backdrop} />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="single-cell-challenge-title"
            className="single-cell-challenge"
            {...box}
          >
            <div className="single-cell-challenge__header">
              <span className="single-cell-challenge__pill">CHALLENGE</span>
              <h2 id="single-cell-challenge-title">Why only one?</h2>
            </div>
            <div className="single-cell-challenge__body">
              <p>
                You have selected exactly one cell. Worth pausing for a moment —
                the standard says a test type can apply across multiple test levels.
              </p>
              <blockquote
                className="single-cell-challenge__quote"
                cite="ISO/IEC/IEEE 29119-1:2022"
              >
                &ldquo;{def.definition}&rdquo;
                <footer>§3.130 Note 1 to entry</footer>
              </blockquote>
              <p>
                If your single cell really is the right answer for this scenario,
                go ahead — but if you read the brief assuming &ldquo;one cell per
                row,&rdquo; reconsider.
              </p>
            </div>
            <div className="single-cell-challenge__actions">
              <Button
                ref={addMoreRef}
                variant="secondary"
                size="md"
                zoneColor="var(--zone3-color)"
                onClick={onAddMore}
              >
                Add more cells
              </Button>
              <Button
                variant="primary"
                size="md"
                zoneColor="var(--zone3-color)"
                onClick={onGoBack}
              >
                Submit anyway
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

export default SingleCellChallenge;

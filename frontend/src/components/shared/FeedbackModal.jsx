import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button.jsx';
import { useMotion } from '../../hooks/useMotion.js';
import './FeedbackModal.css';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M12 3 L22 21 H2 Z" fill="currentColor" />
      <rect x="11" y="9"  width="2" height="6" fill="white" />
      <rect x="11" y="16" width="2" height="2" fill="white" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M3 3 L13 13 M13 3 L3 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * FeedbackModal — fires on every wrong answer in every zone.
 *
 * IMPORTANT (CLAUDE.md §13/§15): cannot be dismissed without clicking
 * "I understand". No × button, no backdrop click, no ESC handler.
 */
function FeedbackModal({
  isOpen,
  onClose,
  isoRef,
  term,
  definition,
  note,
  playerAnswer,
  explanation,
  headerColor = 'var(--zone1-color)',
  title = 'WRONG ANSWER',
}) {
  const dialogRef = useRef(null);
  const understandRef = useRef(null);
  const previouslyFocused = useRef(null);

  const backdropMotion = useMotion({
    initial: { opacity: 0 },
    animate: { opacity: 0.55 },
    exit: { opacity: 0 },
    transition: { duration: 0.15 },
  });
  const boxMotion = useMotion({
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
    transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
  });

  // Focus management
  useEffect(() => {
    if (!isOpen) return undefined;
    previouslyFocused.current = document.activeElement;
    const id = requestAnimationFrame(() => {
      understandRef.current?.focus();
    });
    return () => {
      cancelAnimationFrame(id);
      const target = previouslyFocused.current;
      if (target && typeof target.focus === 'function') {
        target.focus();
      }
    };
  }, [isOpen]);

  // Focus trap (Tab cycles inside dialog)
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (e) => {
      if (e.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = dialog.querySelectorAll(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="feedback-modal-root">
          <motion.div className="feedback-modal-backdrop" {...backdropMotion} />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-modal-title"
            aria-describedby="feedback-modal-explanation"
            className="feedback-modal"
            {...boxMotion}
          >
            <div
              className="feedback-modal__header"
              style={{ background: headerColor }}
            >
              <span className="feedback-modal__warning" aria-hidden="true">
                <WarningIcon />
              </span>
              <h2 id="feedback-modal-title" className="feedback-modal__title">
                {title}
              </h2>
              <span className="feedback-modal__no-dismiss">
                no × · no backdrop
              </span>
            </div>

            <div className="feedback-modal__body">
              <div className="feedback-modal__row">
                <div>
                  <span className="feedback-modal__label">ISO TERM</span>
                  <div className="feedback-modal__value">{term}</div>
                </div>
                <div className="feedback-modal__clause">
                  <span className="feedback-modal__label">CLAUSE</span>
                  <div
                    className="feedback-modal__value"
                    style={{ color: headerColor }}
                  >
                    {isoRef}
                  </div>
                </div>
              </div>

              <hr className="feedback-modal__divider" />

              <span className="feedback-modal__label">VERBATIM ISO DEFINITION</span>
              <div
                className="feedback-modal__definition"
                style={{
                  background: `color-mix(in srgb, ${headerColor} 8%, white)`,
                  borderLeft: `3px solid ${headerColor}`,
                }}
              >
                <p className="feedback-modal__definition-text">
                  &ldquo;{definition}&rdquo;
                </p>
                {note ? (
                  <p
                    className="feedback-modal__note"
                    style={{ color: headerColor }}
                  >
                    Note 1 to entry: &ldquo;{note}&rdquo;
                  </p>
                ) : null}
              </div>

              <span className="feedback-modal__label">YOU ANSWERED</span>
              <div className="feedback-modal__answer">
                <span className="feedback-modal__answer-icon" aria-hidden="true">
                  <CrossIcon />
                </span>
                <span>{playerAnswer}</span>
              </div>

              <span className="feedback-modal__label">
                WHY YOUR ANSWER VIOLATED THE STANDARD
              </span>
              <p
                id="feedback-modal-explanation"
                className="feedback-modal__explanation"
              >
                {explanation}
              </p>

              <div className="feedback-modal__actions">
                <Button
                  ref={understandRef}
                  variant="primary"
                  size="lg"
                  zoneColor={headerColor}
                  onClick={onClose}
                >
                  I understand →
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default FeedbackModal;

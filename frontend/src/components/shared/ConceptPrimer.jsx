import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button.jsx';
import { useMotion } from '../../hooks/useMotion.js';
import { getISODefinition } from '../../data/iso-definitions.js';
import './ConceptPrimer.css';

/**
 * ConceptPrimer — shown on first entry to a zone (per session).
 *
 * Purpose: frame the misconception this zone targets BEFORE the player
 * makes wrong answers, so the pedagogical loop is anticipatory + corrective.
 *
 * Unlike FeedbackModal, this IS dismissable (backdrop click + ESC + Skip).
 */
function ConceptPrimer({
  isOpen,
  primer,
  zoneColor = 'var(--ink)',
  onBegin,
  onSkipAll,
  skipZoneLabel,
  onSkipZone,
}) {
  const dialogRef = useRef(null);
  const beginRef = useRef(null);
  const previouslyFocused = useRef(null);

  const backdropMotion = useMotion({
    initial: { opacity: 0 },
    animate: { opacity: 0.45 },
    exit: { opacity: 0 },
    transition: { duration: 0.18 },
  });

  const cardMotion = useMotion({
    initial: { opacity: 0, y: 18, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 12, scale: 0.98 },
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
  });

  useEffect(() => {
    if (!isOpen) return undefined;
    previouslyFocused.current = document.activeElement;
    const id = requestAnimationFrame(() => beginRef.current?.focus());
    const onKey = (e) => {
      if (e.key === 'Escape') onBegin?.();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('keydown', onKey);
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen, onBegin]);

  if (!primer) return null;

  const def = primer.isoRef ? getISODefinition(primer.isoRef) : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="concept-primer-root">
          <motion.div
            className="concept-primer-backdrop"
            onClick={() => onBegin?.()}
            {...backdropMotion}
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="concept-primer-title"
            className="concept-primer"
            style={{ '--primer-color': zoneColor }}
            {...cardMotion}
          >
            <div className="concept-primer__accent" />

            <div className="concept-primer__head">
              <span className="concept-primer__eyebrow">
                Before you start
              </span>
              <h2 id="concept-primer-title" className="concept-primer__title">
                {primer.title}
              </h2>
            </div>

            <div className="concept-primer__body">
              <section className="concept-primer__block concept-primer__block--myth">
                <span className="concept-primer__block-label">
                  The common belief
                </span>
                <p className="concept-primer__block-text">
                  {primer.misconception}
                </p>
              </section>

              <section className="concept-primer__block concept-primer__block--truth">
                <span className="concept-primer__block-label">
                  What ISO 29119-1 actually says
                  {primer.isoRef ? (
                    <span className="concept-primer__clause">{primer.isoRef}</span>
                  ) : null}
                </span>
                <p className="concept-primer__block-text">
                  {primer.isoTruth}
                </p>
                {def?.note ? (
                  <p className="concept-primer__note">
                    Note: &ldquo;{def.note}&rdquo;
                  </p>
                ) : null}
              </section>

              {primer.example ? (
                <section className="concept-primer__block concept-primer__block--example">
                  <span className="concept-primer__block-label">
                    Quick example
                  </span>
                  <p className="concept-primer__block-text">
                    {primer.example}
                  </p>
                </section>
              ) : null}
            </div>

            <div className="concept-primer__actions">
              <button
                type="button"
                className="concept-primer__skip-link"
                onClick={onSkipAll}
              >
                Skip all primers
              </button>
              {skipZoneLabel && onSkipZone ? (
                <Button
                  variant="secondary"
                  size="lg"
                  zoneColor={zoneColor}
                  onClick={onSkipZone}
                >
                  {skipZoneLabel}
                </Button>
              ) : null}
              <Button
                ref={beginRef}
                variant="primary"
                size="lg"
                zoneColor={zoneColor}
                onClick={onBegin}
              >
                Begin zone →
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ConceptPrimer;

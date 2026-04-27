import { useState, useEffect, useRef, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getISODefinition } from '../../data/iso-definitions.js';
import { useMotion } from '../../hooks/useMotion.js';
import './ISOTooltip.css';

function ISOTooltip({ clauseRef, children, className = '' }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const tooltipId = useId();
  const def = getISODefinition(clauseRef);

  const tooltipMotion = useMotion({
    initial: { opacity: 0, y: -4, scale: 0.97 },
    animate: { opacity: 1, y: 0,  scale: 1 },
    exit:    { opacity: 0, y: -4, scale: 0.97 },
    transition: { duration: 0.14, ease: 'easeOut' },
  });

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onEsc = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', handler);
    window.addEventListener('keydown', onEsc);
    return () => {
      window.removeEventListener('mousedown', handler);
      window.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <span ref={wrapRef} className={`iso-tooltip-wrap ${className}`.trim()}>
      <span className="iso-tooltip-children">{children}</span>
      <button
        type="button"
        aria-label={`Show ISO definition for ${clauseRef}`}
        aria-expanded={open}
        aria-controls={open ? tooltipId : undefined}
        className="iso-tooltip-badge"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        {clauseRef}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id={tooltipId}
            role="tooltip"
            className="iso-tooltip"
            {...tooltipMotion}
          >
            <div className="iso-tooltip__term">{def.term}</div>
            <div className="iso-tooltip__definition">
              &ldquo;{def.definition}&rdquo;
            </div>
            {def.note ? (
              <div className="iso-tooltip__note">
                <em>Note:</em> {def.note}
              </div>
            ) : null}
            <div className="iso-tooltip__source">{def.source}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

export default ISOTooltip;

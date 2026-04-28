import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMotion } from '../../hooks/useMotion.js';
import './HintButton.css';

function BulbIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M8 1.5a4.5 4.5 0 0 0-2.5 8.27V11.5h5V9.77A4.5 4.5 0 0 0 8 1.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
        strokeLinejoin="round"
      />
      <rect x="6" y="12.5" width="4" height="1.4" rx="0.6" fill="currentColor" />
      <rect x="6.5" y="14.4" width="3" height="1" rx="0.5" fill="currentColor" />
    </svg>
  );
}

/**
 * HintButton — soft-nudge popover. On first use, calls `onUse()` so the page
 * can deduct points (typically half-credit). Hints never reveal the answer.
 */
function HintButton({
  hint,
  used = false,
  onUse,
  zoneColor = 'var(--ink)',
  disabled = false,
  costLabel = 'half points',
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const popMotion = useMotion({
    initial: { opacity: 0, y: 4, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit:    { opacity: 0, y: 4, scale: 0.96 },
    transition: { duration: 0.16, ease: [0.16, 1, 0.3, 1] },
  });

  // close on outside click / ESC
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleToggle = () => {
    if (disabled) return;
    if (!open && !used) onUse?.();
    setOpen((v) => !v);
  };

  if (!hint) return null;

  return (
    <div className="hint-btn-wrap" ref={wrapRef} style={{ '--hint-color': zoneColor }}>
      <button
        type="button"
        className={`hint-btn ${used ? 'hint-btn--used' : ''}`}
        onClick={handleToggle}
        disabled={disabled}
        aria-expanded={open}
        aria-label={used ? 'Hint used (already revealed)' : 'Show hint (uses half points)'}
      >
        <span className="hint-btn__icon"><BulbIcon /></span>
        <span className="hint-btn__label">
          {used ? 'Hint shown' : 'Hint'}
        </span>
        {!used && (
          <span className="hint-btn__cost">−{costLabel}</span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div className="hint-btn__popover" role="tooltip" {...popMotion}>
            <div className="hint-btn__popover-arrow" aria-hidden="true" />
            <span className="hint-btn__popover-label">HINT</span>
            <p className="hint-btn__popover-text">{hint}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default HintButton;

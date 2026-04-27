import { motion } from 'framer-motion';
import { useMotion } from '../../hooks/useMotion.js';
import './Pill.css';

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
      <path
        d="M3 8.5 L6.5 12 L13 4.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function Pill({
  children,
  selected = false,
  onChange,
  zoneColor = 'var(--ink)',
  disabled = false,
  ariaLabel,
}) {
  const checkMotion = useMotion({
    initial: { opacity: 0, scale: 0.5 },
    animate: { opacity: 1, scale: 1 },
    exit:    { opacity: 0, scale: 0.5 },
    transition: { type: 'spring', stiffness: 500, damping: 22 },
  });

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-pressed={selected}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!selected)}
      className={`pill ${selected ? 'pill--selected' : ''}`}
      style={{ '--pill-color': zoneColor }}
    >
      {selected ? (
        <motion.span className="pill__check" {...checkMotion}>
          <CheckIcon />
        </motion.span>
      ) : null}
      <span className="pill__label">{children}</span>
    </button>
  );
}

export default Pill;

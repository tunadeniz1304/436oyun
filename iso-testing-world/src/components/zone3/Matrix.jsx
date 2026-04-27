import { motion } from 'framer-motion';
import ISOTooltip from '../shared/ISOTooltip.jsx';
import { useMotion } from '../../hooks/useMotion.js';
import { TEST_LEVELS, TEST_TYPES } from '../../data/zone3-scenarios.js';
import './Matrix.css';

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M3 8.5 L6.5 12 L13 4.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function key(level, type) {
  return `${level}__${type}`;
}

function Matrix({ selected, onToggle, disabled = false }) {
  const checkMotion = useMotion({
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit:    { scale: 0, opacity: 0 },
    transition: { type: 'spring', stiffness: 500, damping: 22 },
  });

  return (
    <div className="matrix-wrap" role="grid" aria-label="Test levels by test types">
      <div className="matrix">
        <div className="matrix__corner" aria-hidden="true">
          <span>level ×</span>
          <span>type</span>
        </div>

        {TEST_TYPES.map((t) => (
          <div key={t.id} className="matrix__col-head" role="columnheader">
            <ISOTooltip clauseRef={t.clauseRef}>{t.label}</ISOTooltip>
          </div>
        ))}

        {TEST_LEVELS.map((lv) => (
          <div key={lv.id} className="matrix__row" role="row">
            <div className="matrix__row-head" role="rowheader">
              <ISOTooltip clauseRef={lv.clauseRef}>{lv.label}</ISOTooltip>
            </div>
            {TEST_TYPES.map((t) => {
              const k = key(lv.id, t.id);
              const isSelected = selected.has(k);
              return (
                <button
                  type="button"
                  key={k}
                  role="gridcell"
                  aria-selected={isSelected}
                  disabled={disabled}
                  onClick={() => !disabled && onToggle(lv.id, t.id)}
                  className={`matrix__cell ${isSelected ? 'is-selected' : ''}`}
                  aria-label={`${lv.label} × ${t.label}${isSelected ? ', selected' : ''}`}
                >
                  {isSelected ? (
                    <motion.span className="matrix__check" {...checkMotion}>
                      <CheckIcon />
                    </motion.span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="matrix__legend">
        <div>
          <strong>Rows</strong> — Test Level <ISOTooltip clauseRef="§3.108">§3.108</ISOTooltip>
        </div>
        <div>
          <strong>Columns</strong> — Test Type <ISOTooltip clauseRef="§3.130">§3.130</ISOTooltip>
        </div>
      </div>
    </div>
  );
}

export default Matrix;
export { key as cellKey };

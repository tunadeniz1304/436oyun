import { motion } from 'framer-motion';
import Button from '../shared/Button.jsx';
import { useMotion } from '../../hooks/useMotion.js';
import { useCountUp } from '../../hooks/useCountUp.js';
import { normalizeScore } from '../../context/scoreUtils.js';
import './ScoreRow.css';

function statusFor(score) {
  if (score >= 200) return { kind: 'correct', label: 'CORRECT' };
  if (score >= 100) return { kind: 'partial', label: 'PARTIAL' };
  return { kind: 'review', label: 'REVIEW' };
}

function ScoreRow({
  rowKey,
  label,
  subLabel,
  score,
  total = 200,
  zoneColor,
  errorCount = 0,
  violatedClause,
  onReplay,
  index = 0,
}) {
  const displayedScore = normalizeScore(score);
  const pct = Math.max(0, Math.min(1, displayedScore / total));
  const status = statusFor(displayedScore);
  const animatedScore = useCountUp(displayedScore, 700);

  const fillMotion = useMotion({
    initial: { width: 0 },
    animate: { width: `${pct * 100}%` },
    transition: { duration: 0.8, ease: 'easeOut', delay: index * 0.1 },
  });

  return (
    <div
      className="score-row"
      style={{ '--row-color': zoneColor }}
      data-row={rowKey}
    >
      <div className="score-row__bar" aria-hidden="true" />
      <div className="score-row__main">
        <div className="score-row__heading">
          <div>
            <h4 className="score-row__label">{label}</h4>
            <span className="score-row__sub">{subLabel}</span>
          </div>
          <span className={`score-row__status score-row__status--${status.kind}`}>
            {status.label}
            {errorCount > 0 ? ` · ${errorCount} error${errorCount === 1 ? '' : 's'}` : null}
          </span>
        </div>
        <div className="score-row__progress" aria-hidden="true">
          <motion.div className="score-row__fill" {...fillMotion} />
        </div>
        <div className="score-row__footer">
          <span className="score-row__score">
            <strong>{animatedScore}</strong> / {total}
          </span>
          {violatedClause ? (
            <span className="score-row__clause">violated: {violatedClause}</span>
          ) : (
            <span className="score-row__clause score-row__clause--ok">no clause violations</span>
          )}
          {onReplay && displayedScore < total ? (
            <Button
              variant="ghost"
              size="sm"
              zoneColor={zoneColor}
              onClick={onReplay}
            >
              Replay zone
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default ScoreRow;
export { statusFor };

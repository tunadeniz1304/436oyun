import { useCountUp } from '../../hooks/useCountUp.js';
import { normalizeScore } from '../../context/scoreUtils.js';
import './ScoreBadge.css';

function ScoreBadge({
  current,
  total = 200,
  zoneColor = 'var(--ink)',
  label = 'Score',
}) {
  const showCurrent = current === null || current === undefined;
  const normalizedCurrent = normalizeScore(current);
  const animated = useCountUp(showCurrent ? 0 : normalizedCurrent, 600);
  const display = showCurrent ? '—' : animated;

  return (
    <div
      className="score-badge"
      role="status"
      aria-live="polite"
      aria-label={`${label}: ${showCurrent ? 'not started' : `${normalizedCurrent} of ${total}`}`}
      style={{ '--badge-color': zoneColor }}
    >
      <span className="score-badge__label">{label}</span>
      <span className="score-badge__value">
        <span className="score-badge__current">{display}</span>
        <span className="score-badge__sep">/</span>
        <span className="score-badge__total">{total}</span>
      </span>
    </div>
  );
}

export default ScoreBadge;

import { useCountUp } from '../../hooks/useCountUp.js';
import './ScoreBadge.css';

function ScoreBadge({
  current,
  total = 200,
  zoneColor = 'var(--ink)',
  label = 'Score',
}) {
  const animated = useCountUp(current ?? 0, 600);
  const showCurrent = current === null || current === undefined;
  const display = showCurrent ? '—' : animated;

  return (
    <div
      className="score-badge"
      role="status"
      aria-live="polite"
      aria-label={`${label}: ${showCurrent ? 'not started' : `${current} of ${total}`}`}
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

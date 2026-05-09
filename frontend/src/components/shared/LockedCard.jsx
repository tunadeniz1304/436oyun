import './LockedCard.css';

function LockIcon() {
  return (
    <svg viewBox="0 0 36 40" width="36" height="40" aria-hidden="true">
      <path
        d="M 8 14 q 0 -10 10 -10 t 10 10 v 6"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
      />
      <rect x="2" y="14" width="32" height="24" rx="3" fill="currentColor" />
      <circle cx="18" cy="24" r="2.5" fill="white" />
      <rect x="17" y="25" width="2" height="6" fill="white" />
    </svg>
  );
}

function LockedCard({
  zoneNumber,
  zoneName,
  prerequisiteName,
  zoneColor = 'var(--ink-soft)',
  zoneBg = '#f3f3f3',
  className = '',
}) {
  const tooltip = prerequisiteName
    ? `Complete ${prerequisiteName} first`
    : 'Locked';
  return (
    <div
      className={`locked-card ${className}`.trim()}
      role="img"
      aria-label={`Zone ${zoneNumber} ${zoneName} — locked. ${tooltip}.`}
      title={tooltip}
      style={{ '--locked-color': zoneColor, '--locked-bg': zoneBg }}
    >
      <div className="locked-card__hatch" aria-hidden="true" />
      <div className="locked-card__content">
        <div className="locked-card__number">Zone {zoneNumber}</div>
        <div className="locked-card__name">{zoneName}</div>
        <div className="locked-card__lock" aria-hidden="true">
          <LockIcon />
        </div>
        <div className="locked-card__hint">{tooltip}</div>
      </div>
    </div>
  );
}

export default LockedCard;

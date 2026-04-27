import { Link } from 'react-router-dom';
import ScoreBadge from './ScoreBadge.jsx';
import './ZoneLayout.css';

function BackArrow() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M10 3 L4 8 L10 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function ZoneLayout({
  zoneId,
  zoneName,
  zoneColor,
  zoneBg,
  scoreCurrent,
  scoreTotal = 200,
  subtitle,
  children,
}) {
  return (
    <div
      className="zone-layout"
      style={{
        '--zone-color': zoneColor,
        '--zone-bg': zoneBg ?? 'var(--paper)',
      }}
      data-zone={zoneId}
    >
      <header className="zone-layout__header">
        <Link to="/" className="zone-layout__back" aria-label="Back to map">
          <BackArrow />
          <span>Back to map</span>
        </Link>

        <div className="zone-layout__heading">
          <h1 className="zone-layout__title">{zoneName}</h1>
          {subtitle ? (
            <p className="zone-layout__subtitle">{subtitle}</p>
          ) : null}
        </div>

        <div className="zone-layout__score">
          <ScoreBadge
            current={scoreCurrent}
            total={scoreTotal}
            zoneColor={zoneColor}
            label="Zone Score"
          />
        </div>
      </header>

      <main className="zone-layout__main">{children}</main>
    </div>
  );
}

export default ZoneLayout;

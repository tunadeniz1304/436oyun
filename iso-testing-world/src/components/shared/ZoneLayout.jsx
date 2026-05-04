import { Link } from 'react-router-dom';
import { normalizeScore } from '../../context/scoreUtils.js';
import './ZoneLayout.css';

const ZONE_NUMBER = {
  'error-district':   1,
  'vv-headquarters':  2,
  'matrix-tower':     3,
  'artefact-archive': 4,
  'final-inspection': 5,
};

const ZONE_ICON = {
  'error-district':   '◬',
  'vv-headquarters':  '◇',
  'matrix-tower':     '▦',
  'artefact-archive': '▤',
  'final-inspection': '◈',
};

function ZoneLayout({
  zoneId,
  zoneName,
  zoneColor,
  scoreCurrent = 0,
  scoreTotal = 200,
  subtitle,
  reviewMode = false,
  toolbar,
  children,
}) {
  const zoneNum = ZONE_NUMBER[zoneId];
  const icon    = ZONE_ICON[zoneId] ?? '◆';
  const padded  = String(normalizeScore(scoreCurrent)).padStart(3, '0');

  return (
    <div
      className="zone-layout"
      style={{ '--zone-color': zoneColor }}
      data-zone={zoneId}
    >
      <header className="zone-layout__header">
        <div className="zone-layout__heading">
          <div className="zone-layout__zone-icon" aria-hidden="true">{icon}</div>
          <div className="zone-layout__heading-text">
            {zoneNum ? (
              <span className="zone-layout__zone-label">Zone {zoneNum}</span>
            ) : null}
            <h1 className="zone-layout__title">{zoneName}</h1>
            {subtitle ? <p className="zone-layout__subtitle">{subtitle}</p> : null}
          </div>
        </div>

        <div className="zone-layout__actions">
          {reviewMode && (
            <span className="zone-layout__review-badge" aria-label="Review mode — score locked">
              REVIEW MODE
            </span>
          )}
          <Link to="/" className="zone-layout__back" aria-label="Back to world map">
            ← BACK TO MAP
          </Link>
          <span className="zone-layout__score-badge" aria-label={`Score: ${padded} of ${scoreTotal}`}>
            {padded} / {scoreTotal}
          </span>
        </div>
      </header>

      {toolbar ? <div className="zone-layout__toolbar">{toolbar}</div> : null}

      <main className="zone-layout__main">{children}</main>
    </div>
  );
}

export default ZoneLayout;

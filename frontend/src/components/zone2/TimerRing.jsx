import './TimerRing.css';

const SIZE = 56;
const STROKE = 5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

function lerpColor(a, b, t) {
  const ah = parseInt(a.slice(1), 16);
  const bh = parseInt(b.slice(1), 16);
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function TimerRing({ remaining, total }) {
  const ratio = Math.max(0, Math.min(1, remaining / total));
  const offset = CIRC * (1 - ratio);
  const warningT = remaining <= 5 ? Math.min(1, (5 - remaining) / 5) : 0;
  const stroke = lerpColor('#0C447C', '#854F0B', warningT);
  const display = remaining < 10 ? remaining.toFixed(1) : Math.ceil(remaining);

  return (
    <div
      className="timer-ring"
      role="timer"
      aria-live="off"
      aria-label={`${Math.ceil(remaining)} seconds remaining`}
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="rgba(0, 0, 0, 0.08)"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={stroke}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={{ transition: 'stroke-dashoffset 100ms linear, stroke 200ms ease' }}
        />
      </svg>
      <span className="timer-ring__value" style={{ color: stroke }}>
        {display}
      </span>
    </div>
  );
}

export default TimerRing;

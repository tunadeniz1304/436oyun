import './PixelCharacter.css';

function OutfitTorso({ outfit, accentColor, sitting }) {
  const base = sitting
    ? 'M 18 36 C 18 28, 46 28, 46 36 L 48 54 C 48 58, 16 58, 16 54 Z'
    : 'M 20 36 C 20 28, 44 28, 44 36 L 46 58 C 46 62, 18 62, 18 58 Z';

  if (outfit === 'suit') {
    return (
      <g>
        <path d={base} fill="#1e293b" />
        {/* white shirt strip */}
        <rect x="29" y={sitting ? 28 : 29} width="6" height={sitting ? 18 : 20} fill="#f1f5f9" />
        {/* lapels */}
        <path d={sitting ? 'M 30 28 L 24 40 L 29 40 Z' : 'M 30 29 L 22 44 L 29 44 Z'} fill="#0f172a" />
        <path d={sitting ? 'M 34 28 L 40 40 L 35 40 Z' : 'M 34 29 L 42 44 L 35 44 Z'} fill="#0f172a" />
        {/* accent pocket square */}
        <rect x="34" y={sitting ? 30 : 31} width="6" height="4" rx="1" fill={accentColor} opacity="0.8" />
      </g>
    );
  }
  if (outfit === 'lab') {
    return (
      <g>
        <path d={base} fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
        {/* lab coat collar */}
        <path d={sitting ? 'M 30 28 L 26 40 L 30 38 Z' : 'M 30 29 L 24 46 L 29 44 Z'} fill="#e2e8f0" />
        <path d={sitting ? 'M 34 28 L 38 40 L 34 38 Z' : 'M 34 29 L 40 46 L 35 44 Z'} fill="#e2e8f0" />
        {/* accent badge */}
        <rect x="20" y={sitting ? 38 : 40} width="8" height="5" rx="2" fill={accentColor} opacity="0.9" />
        <rect x="21" y={sitting ? 39 : 41} width="3" height="3" rx="1" fill="#fff" opacity="0.6" />
      </g>
    );
  }
  // casual (default)
  return (
    <g>
      <path d={base} fill={accentColor} opacity="0.85" />
      {/* collar */}
      <path d={sitting ? 'M 28 28 L 32 34 L 36 28' : 'M 28 29 L 32 36 L 36 29'} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  );
}

function HairFront({ gender, hair, isUp }) {
  if (isUp) return null;
  if (gender === 'f') {
    return (
      <g>
        {/* longer side hair */}
        <path d="M 18 22 C 18 8, 46 8, 46 22 C 46 16, 18 16, 18 22 Z" fill={hair} />
        {/* side strands */}
        <path d="M 18 22 C 14 28, 14 36, 16 42" fill="none" stroke={hair} strokeWidth="4" strokeLinecap="round" />
        <path d="M 46 22 C 50 28, 50 36, 48 42" fill="none" stroke={hair} strokeWidth="4" strokeLinecap="round" />
      </g>
    );
  }
  return <path d="M 18 22 C 18 8, 46 8, 46 22 C 46 16, 18 16, 18 22 Z" fill={hair} />;
}

function Accessory({ accessory, skin }) {
  if (accessory === 'glasses') {
    return (
      <g>
        <rect x="22" y="20" width="8" height="6" rx="2" fill="none" stroke="#334155" strokeWidth="1.2" />
        <rect x="34" y="20" width="8" height="6" rx="2" fill="none" stroke="#334155" strokeWidth="1.2" />
        <line x1="30" y1="23" x2="34" y2="23" stroke="#334155" strokeWidth="1" />
        <line x1="22" y1="23" x2="18" y2="22" stroke="#334155" strokeWidth="1" />
        <line x1="42" y1="23" x2="46" y2="22" stroke="#334155" strokeWidth="1" />
      </g>
    );
  }
  if (accessory === 'headset') {
    return (
      <g>
        <path d="M 18 18 C 18 8, 46 8, 46 18" fill="none" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="14" y="16" width="6" height="8" rx="2" fill="#334155" />
        <rect x="44" y="16" width="6" height="8" rx="2" fill="#334155" />
        <rect x="44" y="24" width="2" height="8" rx="1" fill="#475569" />
        <circle cx="44" cy="33" r="2" fill={skin} />
      </g>
    );
  }
  return null;
}

/**
 * @param {{
 *   type: 'player'|'npc-main'|'npc-worker',
 *   facing: 'down'|'up'|'left'|'right',
 *   color: string,
 *   label: string,
 *   isNear?: boolean,
 *   bubble?: string,
 *   sitting?: boolean,
 *   hasQuest?: boolean,
 *   questDone?: boolean,
 *   isMoving?: boolean,
 *   hair?: string,
 *   skin?: string,
 *   outfit?: 'suit'|'casual'|'lab'|'default',
 *   gender?: 'm'|'f',
 *   accessory?: 'glasses'|'headset'|null,
 * }} props
 */
export default function PixelCharacter({
  type,
  facing,
  color,
  label,
  isNear = false,
  bubble,
  sitting = false,
  hasQuest = false,
  questDone = false,
  isMoving = false,
  hair = '#1e293b',
  skin = '#fcd34d',
  outfit = 'default',
  gender = 'm',
  accessory = null,
}) {
  const isLeft = facing === 'left';
  const isUp = facing === 'up';
  const accentColor = color || '#3b82f6';

  const questColor = questDone ? '#22c55e' : '#fbbf24';
  const questGlow  = questDone ? 'rgba(34,197,94,0.8)' : 'rgba(251,191,36,0.8)';

  return (
    <div
      className={`vector-char vector-char--${type} vector-char--${facing} ${sitting ? 'vector-char--sitting' : ''} ${isNear ? 'vector-char--near' : ''} ${isMoving ? 'vector-char--moving' : ''}`}
      style={{ '--char-accent': accentColor }}
    >
      {/* Interaction hint */}
      {isNear && (type === 'npc-main' || type === 'npc-worker') && (
        <div className="vector-char__hint">
          <span className="vector-char__key">E</span> Talk
        </div>
      )}

      {/* Dialogue bubble for non-interactable workers */}
      {type === 'npc-worker' && bubble && !isNear && (
        <div className="vector-char__bubble">{bubble}</div>
      )}

      {/* Quest indicator */}
      {hasQuest && (
        <div className="vector-char__quest-indicator">
          <div className="quest-exclamation">
            <div className="quest-exclamation__top" style={{ background: questColor, boxShadow: `0 0 12px ${questGlow}, inset 0 0 4px rgba(255,255,255,0.8)` }} />
            <div className="quest-exclamation__dot" style={{ background: questColor, boxShadow: `0 0 12px ${questGlow}, inset 0 0 2px rgba(255,255,255,0.8)` }} />
          </div>
          <div className="quest-glow-ring" style={{ borderColor: `${questColor}80` }} />
        </div>
      )}

      {/* Quest-done checkmark badge */}
      {questDone && !hasQuest && (
        <div className="vector-char__quest-done">✓</div>
      )}

      {/* Character figure */}
      <div className="vector-char__figure" style={{ transform: isLeft ? 'scaleX(-1)' : 'none' }}>
        <svg viewBox="0 0 64 80" width="40" height="50" className="vector-char__svg">
          <defs>
            <filter id={`shadow-${type}-${gender}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.15" />
            </filter>
          </defs>

          {!sitting && <ellipse cx="32" cy="74" rx="16" ry="6" fill="rgba(15, 23, 42, 0.15)" />}

          <g filter={`url(#shadow-${type}-${gender})`} className="vector-char__body-group">
            {/* Back hair (facing up) */}
            {isUp && (
              gender === 'f'
                ? <path d="M 18 20 C 18 8, 46 8, 46 20 L 50 40 C 50 44, 14 44, 14 40 Z" fill={hair} />
                : <path d="M 20 20 C 20 10, 44 10, 44 20 L 46 36 C 46 40, 18 40, 18 36 Z" fill={hair} />
            )}

            {/* Legs */}
            {!sitting && (
              <g className="vector-char__legs">
                <g className="vc-leg-l">
                  <rect x="22" y="56" width="6" height="14" rx="3" fill="#334155" />
                  <rect x="20" y="66" width="8" height="6" rx="2" fill="#0f172a" />
                </g>
                <g className="vc-leg-r">
                  <rect x="36" y="56" width="6" height="14" rx="3" fill="#334155" />
                  <rect x="36" y="66" width="8" height="6" rx="2" fill="#0f172a" />
                </g>
              </g>
            )}

            {/* Torso */}
            <OutfitTorso outfit={outfit} accentColor={accentColor} sitting={sitting} />

            {/* Neck */}
            {!isUp && <rect x="28" y="32" width="8" height="6" fill={skin} />}

            {/* Head */}
            <circle cx="32" cy="22" r={gender === 'f' ? 13 : 14} fill={skin} />

            {/* Face */}
            {!isUp && (
              <g className="vector-char__face">
                <circle cx="27" cy="22" r="2" fill="#1e293b" />
                <circle cx="37" cy="22" r="2" fill="#1e293b" />
                <circle cx="23" cy="26" r="2.5" fill="#f43f5e" opacity="0.3" />
                <circle cx="41" cy="26" r="2.5" fill="#f43f5e" opacity="0.3" />
                <path d="M 29 27 Q 32 30 35 27" fill="none" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
              </g>
            )}

            {/* Hair front */}
            <HairFront gender={gender} hair={hair} isUp={isUp} />

            {/* Accessory */}
            {!isUp && <Accessory accessory={accessory} skin={skin} />}

            {/* Arms */}
            {sitting ? (
              <g className="vector-char__arms-sitting">
                <path d="M 17 38 L 17 48 L 26 48" fill="none" stroke={outfit === 'suit' ? '#1e293b' : accentColor} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="27" cy="48" r="3" fill={skin} />
                <path d="M 47 38 L 47 48 L 38 48" fill="none" stroke={outfit === 'suit' ? '#1e293b' : accentColor} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="37" cy="48" r="3" fill={skin} />
              </g>
            ) : (
              <g className="vector-char__arms">
                <rect x="14" y="38" width="6" height="16" rx="3" fill={type === 'player' ? '#f8fafc' : outfit === 'suit' ? '#1e293b' : accentColor} />
                <circle cx="17" cy="54" r="3" fill={skin} />
                <rect x="44" y="38" width="6" height="16" rx="3" fill={type === 'player' ? '#f8fafc' : outfit === 'suit' ? '#1e293b' : accentColor} />
                <circle cx="47" cy="54" r="3" fill={skin} />
              </g>
            )}
          </g>
        </svg>
      </div>

      {label && <div className="vector-char__label">{label}</div>}
    </div>
  );
}

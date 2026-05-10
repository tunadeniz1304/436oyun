import './PixelCharacter.css';

/**
 * Outfit torso SVG — swaps based on outfit prop
 */
function OutfitTorso({ outfit, accentColor, sitting }) {
  const path = sitting
    ? 'M 18 36 C 18 28, 46 28, 46 36 L 48 54 C 48 58, 16 58, 16 54 Z'
    : 'M 20 36 C 20 28, 44 28, 44 36 L 46 58 C 46 62, 18 58, 18 58 Z';

  if (outfit === 'suit') {
    return (
      <g>
        {/* Base jacket */}
        <path d={path} fill="#1e293b" />
        {/* White shirt collar */}
        <rect x="27" y="35" width="10" height="10" rx="1" fill="#f8fafc" />
        {/* Lapels */}
        <path d="M 27 35 L 22 45 L 27 45 Z" fill="#334155" />
        <path d="M 37 35 L 42 45 L 37 45 Z" fill="#334155" />
        {/* Accent tie */}
        <path d="M 30 36 L 34 36 L 33 50 L 31.5 52 L 30 50 Z" fill={accentColor} opacity="0.9" />
      </g>
    );
  }

  if (outfit === 'lab') {
    return (
      <g>
        {/* White coat */}
        <path d={path} fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1" />
        {/* Coat lapels */}
        <path d="M 28 35 L 22 58 L 28 58 Z" fill="#e2e8f0" />
        <path d="M 36 35 L 42 58 L 36 58 Z" fill="#e2e8f0" />
        {/* Accent badge */}
        <rect x="30" y="40" width="8" height="5" rx="1.5" fill={accentColor} opacity="0.85" />
        <rect x="31" y="41" width="6" height="1" rx="0.5" fill="rgba(255,255,255,0.7)" />
      </g>
    );
  }

  // casual (default)
  return (
    <g>
      <path d={path} fill={accentColor} opacity="0.85" />
      {/* Short sleeve cutout */}
      <path
        d={sitting
          ? 'M 18 36 L 14 42 L 18 46 Z M 46 36 L 50 42 L 46 46 Z'
          : 'M 20 36 L 14 42 L 18 46 Z M 44 36 L 50 42 L 46 46 Z'}
        fill={accentColor} opacity="0.6"
      />
    </g>
  );
}

/**
 * Hair SVG — female adds longer back hair
 */
function HairFront({ gender, hair, isUp }) {
  if (isUp) {
    return (
      <path
        d="M 20 20 C 20 10, 44 10, 44 20 L 46 36 C 46 40, 18 40, 18 36 Z"
        fill={hair}
      />
    );
  }
  return (
    <g>
      {/* Front fringe */}
      <path d="M 18 22 C 18 8, 46 8, 46 22 C 46 16, 18 16, 18 22 Z" fill={hair} />
      {/* Longer back hair for female */}
      {gender === 'f' && (
        <path d="M 18 22 C 16 32, 16 44, 20 50 Q 18 38 18 22 Z M 46 22 C 48 32, 48 44, 44 50 Q 46 38 46 22 Z" fill={hair} opacity="0.85" />
      )}
    </g>
  );
}

/**
 * Accessory overlay — glasses or headset
 */
function Accessory({ type, isUp }) {
  if (isUp || !type) return null;
  if (type === 'glasses') {
    return (
      <g>
        <rect x="22" y="20" width="8" height="5" rx="2" fill="none" stroke="#475569" strokeWidth="1.2" />
        <rect x="33" y="20" width="8" height="5" rx="2" fill="none" stroke="#475569" strokeWidth="1.2" />
        <line x1="30" y1="22" x2="33" y2="22" stroke="#475569" strokeWidth="1.2" />
        <line x1="16" y1="22" x2="22" y2="22" stroke="#475569" strokeWidth="1" />
        <line x1="41" y1="22" x2="47" y2="22" stroke="#475569" strokeWidth="1" />
      </g>
    );
  }
  if (type === 'headset') {
    return (
      <g>
        <path d="M 18 18 C 18 8, 46 8, 46 18" fill="none" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="14" y="17" width="5" height="8" rx="2" fill="#334155" />
        <rect x="45" y="17" width="5" height="8" rx="2" fill="#334155" />
        <line x1="14" y1="25" x2="12" y2="30" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="11" cy="31" r="2" fill="#475569" />
      </g>
    );
  }
  return null;
}

/**
 * Premium Vector Character
 * @param {{
 *   type: 'player'|'npc-main'|'npc-worker',
 *   facing: 'down'|'up'|'left'|'right',
 *   color: string,
 *   label: string,
 *   isNear?: boolean,
 *   bubble?: string,
 *   sitting?: boolean,
 *   hair?: string,
 *   skin?: string,
 *   outfit?: 'suit'|'casual'|'lab'|'default',
 *   gender?: 'm'|'f',
 *   accessory?: 'glasses'|'headset'|null,
 *   hasQuest?: boolean,
 *   questDone?: boolean,
 *   isMoving?: boolean,
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
  hair = '#1e293b',
  skin = '#fcd34d',
  outfit = 'default',
  gender = 'm',
  accessory = null,
  hasQuest = false,
  questDone = false,
  isMoving = false,
}) {
  const isLeft = facing === 'left';
  const isUp = facing === 'up';
  const accentColor = color || '#3b82f6';

  // For default outfit (player or legacy NPC) keep original shirt behaviour
  const shirtColor = type === 'player'
    ? '#ffffff'
    : (outfit === 'default' ? (type === 'npc-worker' ? '#e2e8f0' : accentColor) : accentColor);

  const showHint = isNear && (type === 'npc-main' || type === 'npc-worker');

  return (
    <div
      className={`vector-char vector-char--${type} vector-char--${facing} ${sitting ? 'vector-char--sitting' : ''} ${isNear ? 'vector-char--near' : ''} ${isMoving ? 'vector-char--moving' : ''}`}
      style={{ '--char-accent': accentColor }}
    >
      {/* Interaction hint — shown for any interactable NPC when near */}
      {showHint && (
        <div className="vector-char__hint">
          <span className="vector-char__key">E</span>
          {type === 'npc-main' ? 'Talk' : 'Quiz'}
        </div>
      )}

      {/* Dialogue bubble for decorative workers */}
      {type === 'npc-worker' && bubble && !isNear && (
        <div className="vector-char__bubble">{bubble}</div>
      )}

      {/* Quest indicator — yellow ! if pending, green ✓ if done */}
      {hasQuest && !questDone && (
        <div className="vector-char__quest-indicator">
          <div className="quest-exclamation">
            <div className="quest-exclamation__top"></div>
            <div className="quest-exclamation__dot"></div>
          </div>
          <div className="quest-glow-ring"></div>
        </div>
      )}
      {hasQuest && questDone && (
        <div className="vector-char__quest-done">✓</div>
      )}

      {/* Character SVG */}
      <div className="vector-char__figure" style={{ transform: isLeft ? 'scaleX(-1)' : 'none' }}>
        <svg viewBox="0 0 64 80" width="40" height="50" className="vector-char__svg">
          <defs>
            <linearGradient id={`shirtGrad-${type}-${outfit}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={shirtColor} />
              <stop offset="100%" stopColor={type === 'player' ? '#f1f5f9' : accentColor} stopOpacity="0.7" />
            </linearGradient>
            <filter id={`shadow-${type}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.15" />
            </filter>
          </defs>

          {!sitting && <ellipse cx="32" cy="74" rx="16" ry="6" fill="rgba(15, 23, 42, 0.15)" />}

          <g filter={`url(#shadow-${type})`} className="vector-char__body-group">
            {/* Back hair */}
            {isUp && (
              <HairFront gender={gender} hair={hair} isUp={true} />
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
            {outfit === 'default' ? (
              sitting ? (
                <path d="M 18 36 C 18 28, 46 28, 46 36 L 48 54 C 48 58, 16 58, 16 54 Z" fill={`url(#shirtGrad-${type}-${outfit})`} />
              ) : (
                <path d="M 20 36 C 20 28, 44 28, 44 36 L 46 58 C 46 62, 18 62, 18 58 Z" fill={`url(#shirtGrad-${type}-${outfit})`} />
              )
            ) : (
              <OutfitTorso outfit={outfit} accentColor={accentColor} sitting={sitting} />
            )}

            {/* Neck */}
            {!isUp && <rect x="28" y="32" width="8" height="6" fill={skin} />}

            {/* Head */}
            <circle cx="32" cy="22" r="14" fill={skin} />

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

            {/* Hair */}
            {!isUp && <HairFront gender={gender} hair={hair} isUp={false} />}

            {/* Accessory over hair */}
            {!isUp && <Accessory type={accessory} isUp={false} />}

            {/* Arms */}
            {sitting ? (
              <g className="vector-char__arms-sitting">
                <path d="M 17 38 L 17 48 L 26 48" fill="none" stroke={type === 'player' ? '#f8fafc' : accentColor} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="27" cy="48" r="3" fill={skin} />
                <path d="M 47 38 L 47 48 L 38 48" fill="none" stroke={type === 'player' ? '#f8fafc' : accentColor} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="37" cy="48" r="3" fill={skin} />
              </g>
            ) : (
              <g className="vector-char__arms">
                <rect x="14" y="38" width="6" height="16" rx="3" fill={type === 'player' ? '#f8fafc' : accentColor} />
                <circle cx="17" cy="54" r="3" fill={skin} />
                <rect x="44" y="38" width="6" height="16" rx="3" fill={type === 'player' ? '#f8fafc' : accentColor} />
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

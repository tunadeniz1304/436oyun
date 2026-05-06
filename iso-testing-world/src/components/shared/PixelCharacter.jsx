import './PixelCharacter.css';

/**
 * Premium Modern Vector Character
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
  hair = '#1e293b', // Modern dark slate hair by default
  skin = '#fcd34d', // Warm skin tone
}) {
  const isLeft = facing === 'left';
  const isUp = facing === 'up';

  // For high-end UI, we use beautiful flat design colors
  const shirtColor = type === 'player' ? '#ffffff' : type === 'npc-worker' ? '#e2e8f0' : color;
  const accentColor = color || '#3b82f6';

  return (
    <div
      className={`vector-char vector-char--${type} vector-char--${facing} ${sitting ? 'vector-char--sitting' : ''} ${isNear ? 'vector-char--near' : ''}`}
      style={{ '--char-accent': accentColor }}
    >
      {/* Interaction Hint */}
      {type === 'npc-main' && isNear && (
        <div className="vector-char__hint">
          <span className="vector-char__key">E</span> Talk
        </div>
      )}

      {/* Dialogue Bubble */}
      {type === 'npc-worker' && bubble && (
        <div className="vector-char__bubble">{bubble}</div>
      )}

      {/* Quest Indicator */}
      {hasQuest && (
        <div className="vector-char__quest-indicator">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <defs>
              <filter id="glow-quest" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <path d="M12 2 L12 14 M12 18 L12 20" stroke="#facc15" strokeWidth="4" strokeLinecap="round" filter="url(#glow-quest)" />
          </svg>
        </div>
      )}

      {/* Character Figure (SVG) */}
      <div className="vector-char__figure" style={{ transform: isLeft ? 'scaleX(-1)' : 'none' }}>
        <svg viewBox="0 0 64 80" width="40" height="50" className="vector-char__svg">
          <defs>
            <linearGradient id={`shirtGrad-${type}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={shirtColor} />
              <stop offset="100%" stopColor={type === 'player' ? '#f1f5f9' : color} />
            </linearGradient>
            <filter id={`shadow-${type}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* Shadow on the ground */}
          {!sitting && <ellipse cx="32" cy="74" rx="16" ry="6" fill="rgba(15, 23, 42, 0.15)" />}

          <g filter={`url(#shadow-${type})`} className="vector-char__body-group">
            {/* Back Hair (if looking up) */}
            {isUp && (
              <path d="M 20 20 C 20 10, 44 10, 44 20 L 46 36 C 46 40, 18 40, 18 36 Z" fill={hair} />
            )}

            {/* Legs (if standing) */}
            {!sitting && (
              <g className="vector-char__legs">
                {/* Left Leg */}
                <rect x="22" y="56" width="6" height="14" rx="3" fill="#334155" />
                <rect x="20" y="66" width="8" height="6" rx="2" fill="#0f172a" />
                {/* Right Leg */}
                <rect x="36" y="56" width="6" height="14" rx="3" fill="#334155" />
                <rect x="36" y="66" width="8" height="6" rx="2" fill="#0f172a" />
              </g>
            )}

            {/* Torso */}
            {sitting ? (
              <path d="M 18 36 C 18 28, 46 28, 46 36 L 48 56 C 48 60, 16 60, 16 56 Z" fill={`url(#shirtGrad-${type})`} />
            ) : (
              <path d="M 20 36 C 20 28, 44 28, 44 36 L 46 58 C 46 62, 18 62, 18 58 Z" fill={`url(#shirtGrad-${type})`} />
            )}
            
            {/* Neck */}
            {!isUp && <rect x="28" y="32" width="8" height="6" fill={skin} />}

            {/* Head */}
            <circle cx="32" cy="22" r="14" fill={skin} />

            {/* Face details (if not looking up) */}
            {!isUp && (
              <g className="vector-char__face">
                {/* Eyes */}
                <circle cx="27" cy="22" r="2" fill="#1e293b" />
                <circle cx="37" cy="22" r="2" fill="#1e293b" />
                {/* Cheeks */}
                <circle cx="23" cy="26" r="2.5" fill="#f43f5e" opacity="0.3" />
                <circle cx="41" cy="26" r="2.5" fill="#f43f5e" opacity="0.3" />
                {/* Smile */}
                <path d="M 29 27 Q 32 30 35 27" fill="none" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
              </g>
            )}

            {/* Front Hair */}
            {!isUp && (
              <path d="M 18 22 C 18 8, 46 8, 46 22 C 46 16, 18 16, 18 22 Z" fill={hair} />
            )}

            {/* Arms */}
            <g className="vector-char__arms">
              <rect x="14" y="38" width="6" height="16" rx="3" fill={type === 'player' ? '#f8fafc' : accentColor} />
              <circle cx="17" cy="54" r="3" fill={skin} />
              <rect x="44" y="38" width="6" height="16" rx="3" fill={type === 'player' ? '#f8fafc' : accentColor} />
              <circle cx="47" cy="54" r="3" fill={skin} />
            </g>
          </g>
        </svg>
      </div>

      {/* Label under character */}
      {label && <div className="vector-char__label">{label}</div>}
    </div>
  );
}

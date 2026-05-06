import './PixelCharacter.css';

/**
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
  hair = '#5a3a1a',
  skin = '#f5c8a0',
}) {
  return (
    <div
      className={`px-char px-char--${type} px-char--${facing}${sitting ? ' px-char--sitting' : ''}`}
      style={{
        '--char-accent': color,
        '--char-hair': hair,
        '--char-skin': skin,
      }}
    >
      {type === 'npc-main' && isNear && (
        <div className="px-char__hint">[E] Talk</div>
      )}
      {type === 'npc-worker' && bubble && (
        <div className="px-char__bubble">{bubble}</div>
      )}
      <div className="px-char__figure">
        <div className="px-char__head">
          <div className="px-char__hair" />
          <div className="px-char__face">
            <div className="px-char__eyes">
              <span className="px-char__eye" />
              <span className="px-char__eye" />
            </div>
            <div className="px-char__mouth" />
          </div>
        </div>
        <div className="px-char__torso">
          <div className="px-char__arm px-char__arm--left" />
          <div className="px-char__arm px-char__arm--right" />
        </div>
        {!sitting && (
          <>
            <div className="px-char__legs">
              <span className="px-char__leg" />
              <span className="px-char__leg" />
            </div>
            <div className="px-char__feet">
              <span className="px-char__foot" />
              <span className="px-char__foot" />
            </div>
          </>
        )}
        {sitting && (
          <div className="px-char__seated-base" />
        )}
      </div>
      {!sitting && <div className="px-char__shadow" />}
      {label && <div className="px-char__label">{label}</div>}
    </div>
  );
}

import { useState } from 'react';
import './RetroDesktop.css';

const ALL_FOLDERS = [
  { zoneId: 'error-district',   label: 'Zone1_Incident047', ext: '/',    icon: '📁' },
  { zoneId: 'vv-headquarters',  label: 'Zone2_VVMissions',  ext: '/',    icon: '📁' },
  { zoneId: 'matrix-tower',     label: 'Zone3_TestMatrix',  ext: '/',    icon: '📁' },
  { zoneId: 'artefact-archive', label: 'Zone4_Artefacts',   ext: '/',    icon: '📁' },
  { zoneId: 'final-inspection', label: 'FinalInspection',   ext: '.exe', icon: '💾' },
];

/**
 * @param {{
 *   zoneId: string,
 *   completedZones: Set<string>,
 *   zoneOrder: string[],
 *   onLaunchZone: ()=>void,
 *   onClose: ()=>void,
 * }} props
 */
export default function RetroDesktop({ zoneId, completedZones, zoneOrder, onLaunchZone, onClose }) {
  const [selectedId, setSelectedId] = useState(null);
  const [launchingId, setLaunchingId] = useState(null);

  const currentIdx = zoneOrder.indexOf(zoneId);

  const getFolderState = (fZoneId) => {
    const fIdx = zoneOrder.indexOf(fZoneId);
    if (completedZones.has(fZoneId)) return 'done';
    if (fIdx === currentIdx) return 'current';
    if (fIdx < currentIdx) return 'done'; // shouldn't happen but safe fallback
    return 'locked';
  };

  const handleSingleClick = (fZoneId) => {
    setSelectedId(prev => prev === fZoneId ? null : fZoneId);
  };

  const handleDoubleClick = (fZoneId) => {
    const st = getFolderState(fZoneId);
    if (st !== 'current') return;
    setLaunchingId(fZoneId);
    setTimeout(() => onLaunchZone(), 420);
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="retro-desktop" onClick={(e) => { if (e.target === e.currentTarget) setSelectedId(null); }}>
      <div className="retro-desktop__window">

        {/* Title bar */}
        <div className="retro-desktop__titlebar">
          <span className="retro-desktop__titlebar-icon">🖥</span>
          <span className="retro-desktop__titlebar-text">My Computer — Office Console</span>
          <div className="retro-desktop__titlebar-btns">
            <button className="retro-desktop__wbtn retro-desktop__wbtn--min" aria-label="Minimize">_</button>
            <button className="retro-desktop__wbtn retro-desktop__wbtn--max" aria-label="Maximize">□</button>
            <button className="retro-desktop__wbtn retro-desktop__wbtn--close" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>

        {/* Desktop canvas */}
        <div className="retro-desktop__canvas" onClick={(e) => { if (e.target === e.currentTarget) setSelectedId(null); }}>

          <div className="retro-desktop__folder-grid">
            {ALL_FOLDERS.map((f) => {
              const st = getFolderState(f.zoneId);
              const isSelected = selectedId === f.zoneId;
              const isLaunching = launchingId === f.zoneId;
              const displayLabel =
                st === 'done'    ? f.label + f.ext + ' ✓' :
                st === 'locked'  ? f.label + f.ext + ' 🔒' :
                f.label + f.ext;

              return (
                <div
                  key={f.zoneId}
                  className={[
                    'retro-desktop__folder',
                    `retro-desktop__folder--${st}`,
                    isSelected  ? 'retro-desktop__folder--selected'  : '',
                    isLaunching ? 'retro-desktop__folder--launching'  : '',
                  ].join(' ')}
                  onClick={() => handleSingleClick(f.zoneId)}
                  onDoubleClick={() => handleDoubleClick(f.zoneId)}
                  role="button"
                  tabIndex={st === 'locked' ? -1 : 0}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleDoubleClick(f.zoneId); }}
                  aria-label={displayLabel}
                  aria-disabled={st === 'locked'}
                >
                  <div className="retro-desktop__folder-icon">
                    {f.icon}
                    {st === 'done'    && <span className="retro-desktop__folder-badge retro-desktop__folder-badge--done">✓</span>}
                    {st === 'current' && <span className="retro-desktop__folder-badge retro-desktop__folder-badge--corrupt">!</span>}
                    {st === 'locked'  && <span className="retro-desktop__folder-badge retro-desktop__folder-badge--lock">🔒</span>}
                  </div>
                  <div className="retro-desktop__folder-label">{displayLabel}</div>
                </div>
              );
            })}
          </div>

          {/* Status hint */}
          <div className="retro-desktop__hint">
            {launchingId
              ? 'Opening…'
              : selectedId
                ? getFolderState(selectedId) === 'current'
                  ? 'Double-click to open'
                  : getFolderState(selectedId) === 'done'
                    ? 'Task already completed.'
                    : 'Complete previous zones to unlock.'
                : 'Select a folder'}
          </div>
        </div>

        {/* Taskbar */}
        <div className="retro-desktop__taskbar">
          <button className="retro-desktop__start"><span>⊞</span> Start</button>
          <div className="retro-desktop__taskbar-spacer" />
          <div className="retro-desktop__tray">
            <span className="retro-desktop__clock">{timeStr}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

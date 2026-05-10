import { useState } from 'react';
import './RetroDesktop.css';

const ZONE_FOLDERS = {
  'error-district':   { label: 'Zone1_Incident047',  ext: '/',    icon: '📁' },
  'vv-headquarters':  { label: 'Zone2_VVMissions',   ext: '/',    icon: '📁' },
  'matrix-tower':     { label: 'Zone3_TestMatrix',   ext: '/',    icon: '📁' },
  'artefact-archive': { label: 'Zone4_Artefacts',    ext: '/',    icon: '📁' },
  'final-inspection': { label: 'FinalInspection',    ext: '.exe', icon: '💾' },
};

/**
 * @param {{
 *   zoneId: string,
 *   zoneDone: boolean,
 *   onLaunchZone: ()=>void,
 *   onClose: ()=>void,
 * }} props
 */
export default function RetroDesktop({ zoneId, zoneDone, onLaunchZone, onClose }) {
  const [clicked, setClicked] = useState(false);
  const [doubleClicked, setDoubleClicked] = useState(false);

  const folder = ZONE_FOLDERS[zoneId] ?? ZONE_FOLDERS['error-district'];
  const folderName = folder.label + folder.ext + (zoneDone ? ' [RESOLVED]' : '');

  const handleFolderClick = () => setClicked(true);

  const handleFolderDoubleClick = () => {
    if (zoneDone) return;
    setDoubleClicked(true);
    setTimeout(() => onLaunchZone(), 400);
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="retro-desktop" onClick={(e) => { if (e.target === e.currentTarget) setClicked(false); }}>

      {/* Window chrome */}
      <div className="retro-desktop__window">
        <div className="retro-desktop__titlebar">
          <span className="retro-desktop__titlebar-icon">🖥</span>
          <span className="retro-desktop__titlebar-text">My Computer — Office Console</span>
          <div className="retro-desktop__titlebar-btns">
            <button className="retro-desktop__wbtn retro-desktop__wbtn--min" aria-label="Minimize">_</button>
            <button className="retro-desktop__wbtn retro-desktop__wbtn--max" aria-label="Maximize">□</button>
            <button className="retro-desktop__wbtn retro-desktop__wbtn--close" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>

        {/* Desktop area */}
        <div className="retro-desktop__canvas">

          {/* Folder icon */}
          <div
            className={`retro-desktop__folder ${clicked ? 'retro-desktop__folder--selected' : ''} ${zoneDone ? 'retro-desktop__folder--done' : 'retro-desktop__folder--corrupted'} ${doubleClicked ? 'retro-desktop__folder--launching' : ''}`}
            onClick={handleFolderClick}
            onDoubleClick={handleFolderDoubleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') handleFolderDoubleClick(); }}
            aria-label={`Open ${folderName}`}
          >
            <div className="retro-desktop__folder-icon">
              {folder.icon}
              {!zoneDone && <span className="retro-desktop__folder-badge">!</span>}
              {zoneDone && <span className="retro-desktop__folder-badge retro-desktop__folder-badge--done">✓</span>}
            </div>
            <div className="retro-desktop__folder-label">{folderName}</div>
          </div>

          {/* Double-click hint */}
          {!zoneDone && (
            <div className="retro-desktop__hint">
              {doubleClicked ? 'Opening…' : 'Double-click to open'}
            </div>
          )}
          {zoneDone && (
            <div className="retro-desktop__hint retro-desktop__hint--done">
              Task completed — folder is locked.
            </div>
          )}

        </div>

        {/* Taskbar */}
        <div className="retro-desktop__taskbar">
          <button className="retro-desktop__start">
            <span>⊞</span> Start
          </button>
          <div className="retro-desktop__taskbar-spacer" />
          <div className="retro-desktop__tray">
            <span className="retro-desktop__clock">{timeStr}</span>
          </div>
        </div>
      </div>

    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import './RetroDesktop.css';
import RetroBugSweeper from './RetroBugSweeper.jsx';
import RetroBrowser from './RetroBrowser.jsx';
import RetroDocsFolder from './RetroDocsFolder.jsx';
import RetroPipelineOps from './RetroPipelineOps.jsx';

const ALL_FOLDERS = [
  { zoneId: 'error-district',   label: 'Zone1_Incident047', ext: '/',    icon: '📁' },
  { zoneId: 'vv-headquarters',  label: 'Zone2_VVMissions',  ext: '/',    icon: '📁' },
  { zoneId: 'matrix-tower',     label: 'Zone3_TestMatrix',  ext: '/',    icon: '📁' },
  { zoneId: 'artefact-archive', label: 'Zone4_Artefacts',   ext: '/',    icon: '📁' },
  { zoneId: 'final-inspection', label: 'FinalInspection',   ext: '.exe', icon: '💾' },
];

// Decorative left-column shortcuts (Win95/XP style desktop icons)
const SHORTCUTS = [
  { id: 'my-computer',  label: 'My Computer',      icon: '🖥️',  msg: 'My Computer\n\nDrives: C:\\ (OPUS Corp)\nFree space: 47%\n\nThis console is read-only for non-admin users.' },
  { id: 'my-docs',      label: 'My Documents',     icon: '📂',  msg: '' },
  { id: 'recycle-bin',  label: 'Recycle Bin',      icon: '🗑️',  msg: 'Recycle Bin\n\nDeleted incidents archive — empty.\n(Audit policy: incidents are never deleted.)' },
  { id: 'ie',           label: 'Internet Explorer', icon: '🌐', msg: '' },
  { id: 'outlook',      label: 'Outlook Express',  icon: '📧',  msg: 'Outlook Express\n\nInbox (3 unread):\n• Manager: "Did you classify yet?"\n• IT: "Password expires in 0 days"\n• HR: "Mandatory ISO 29119 training"' },
  { id: 'bugsweeper',    label: 'TriageDesk.exe',   icon: '🗂️',  msg: '' },
  { id: 'pipeline-ops', label: 'PipelineOps.exe',  icon: '🔧',  msg: '' },
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
  const [startOpen, setStartOpen] = useState(false);
  const [dialog, setDialog] = useState(null); // { title, body } | null
  const [loadingFolder, setLoadingFolder] = useState(null); // zoneId being "opened"
  const [now, setNow] = useState(() => new Date());
  const startBtnRef = useRef(null);

  // Live clock — update every second
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // ESC closes overlay (or close open popup first)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (dialog)         { setDialog(null); return; }
      if (loadingFolder)  return; // wait for launch
      if (startOpen)      { setStartOpen(false); return; }
      onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog, startOpen, loadingFolder, onClose]);

  const currentIdx = zoneOrder.indexOf(zoneId);

  const getFolderState = (fZoneId) => {
    const fIdx = zoneOrder.indexOf(fZoneId);
    if (completedZones.has(fZoneId)) return 'done';
    if (fIdx === currentIdx) return 'current';
    if (fIdx < currentIdx) return 'done';
    return 'locked';
  };

  const handleSingleClick = (id) => {
    setSelectedId(prev => prev === id ? null : id);
    setStartOpen(false);
  };

  const handleFolderDoubleClick = (fZoneId) => {
    const st = getFolderState(fZoneId);
    if (st === 'locked') {
      setDialog({ title: 'Access Denied', body: `Permission denied.\n\nComplete previous zones to unlock this folder.`, icon: '🔒' });
      return;
    }
    if (st === 'done') {
      setDialog({ title: 'Folder Restored', body: `This task has already been completed.\nThe folder is no longer corrupted.`, icon: '✓' });
      return;
    }
    // current → loading window then launch
    setLaunchingId(fZoneId);
    setLoadingFolder(fZoneId);
    setTimeout(() => onLaunchZone(), 900);
  };

  const handleShortcutDoubleClick = (sc) => {
    if (sc.id === 'pipeline-ops') {
      setDialog({ title: 'PipelineOps.exe', icon: '🔧', size: 'lg', content: <RetroPipelineOps onClose={() => setDialog(null)} /> });
      return;
    }
    if (sc.id === 'bugsweeper') {
      setDialog({ title: 'BugSweeper.exe', icon: '🐛', size: 'lg', content: <RetroBugSweeper onClose={() => setDialog(null)} /> });
    } else if (sc.id === 'ie') {
      setDialog({ title: 'Internet Explorer 6', icon: '🌐', size: 'lg', chromeless: true, content: <RetroBrowser onClose={() => setDialog(null)} /> });
    } else if (sc.id === 'my-docs') {
      setDialog({ title: 'My Documents', icon: '📂', size: 'lg', chromeless: true, content: <RetroDocsFolder onClose={() => setDialog(null)} /> });
    } else {
      setDialog({ title: sc.label, body: sc.msg, icon: sc.icon });
    }
  };

  const timeStr  = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr  = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const handleStartItem = (action) => {
    setStartOpen(false);
    if (action === 'shutdown') {
      setDialog({
        title: 'Shut Down Windows',
        body: 'It is now safe to turn off your computer.\n\n(Closing the console will return you to your desk.)',
        icon: '⏻',
        confirmLabel: 'Shut Down',
        onConfirm: onClose,
      });
    } else if (action === 'run') {
      setDialog({ title: 'Run', body: 'Type the name of a program, folder, or document.\n\n> _\n\n(Command-line interface disabled by IT policy.)', icon: '▶' });
    } else if (action === 'find') {
      setDialog({ title: 'Find: All Files', body: 'No files match your search.\n\nTip: All incident folders are visible on the desktop.', icon: '🔍' });
    } else if (action === 'help') {
      setDialog({ title: 'Help and Support', body: 'OPUS Corp Console v1.0\n\n• Double-click a folder to open it.\n• Locked folders unlock as you finish zones.\n• Press ESC to close.', icon: '?' });
    }
  };

  return (
    <div className="retro-desktop" onClick={(e) => { if (e.target === e.currentTarget) { setSelectedId(null); setStartOpen(false); } }}>
      <div className="retro-desktop__window">

        {/* Title bar */}
        <div className="retro-desktop__titlebar">
          <span className="retro-desktop__titlebar-icon">🖥</span>
          <span className="retro-desktop__titlebar-text">OPUS Corp — Office Console</span>
          <div className="retro-desktop__titlebar-btns">
            <button className="retro-desktop__wbtn retro-desktop__wbtn--min" aria-label="Minimize">_</button>
            <button className="retro-desktop__wbtn retro-desktop__wbtn--max" aria-label="Maximize">□</button>
            <button className="retro-desktop__wbtn retro-desktop__wbtn--close" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>

        {/* Desktop canvas — XP-Bliss wallpaper */}
        <div className="retro-desktop__canvas" onClick={(e) => { if (e.target === e.currentTarget) { setSelectedId(null); setStartOpen(false); } }}>

          {/* Left shortcut column */}
          <div className="retro-desktop__shortcuts" onClick={(e) => e.stopPropagation()}>
            {SHORTCUTS.map((sc) => {
              const isSelected = selectedId === sc.id;
              return (
                <div
                  key={sc.id}
                  className={[
                    'retro-desktop__shortcut',
                    isSelected ? 'retro-desktop__shortcut--selected' : '',
                  ].join(' ')}
                  onClick={() => handleSingleClick(sc.id)}
                  onDoubleClick={() => handleShortcutDoubleClick(sc)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleShortcutDoubleClick(sc); }}
                  aria-label={sc.label}
                >
                  <div className="retro-desktop__shortcut-icon">{sc.icon}</div>
                  <div className="retro-desktop__shortcut-label">{sc.label}</div>
                </div>
              );
            })}
          </div>

          {/* Zone folder grid */}
          <div className="retro-desktop__folder-grid" onClick={(e) => e.stopPropagation()}>
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
                  onDoubleClick={() => handleFolderDoubleClick(f.zoneId)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleFolderDoubleClick(f.zoneId); }}
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

          {/* Loading dialog (when launching a zone) */}
          {loadingFolder && (
            <div className="retro-desktop__popup retro-desktop__popup--loading">
              <div className="retro-desktop__popup-titlebar">
                <span>📂 Opening folder…</span>
              </div>
              <div className="retro-desktop__popup-body">
                <div className="retro-desktop__popup-row">
                  <span className="retro-desktop__popup-icon">📁</span>
                  <div>
                    <div className="retro-desktop__popup-line">Mounting {ALL_FOLDERS.find(f => f.zoneId === loadingFolder)?.label}…</div>
                    <div className="retro-desktop__progress">
                      <div className="retro-desktop__progress-bar" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Generic dialog popup */}
          {dialog && (
            <div
              className={['retro-desktop__popup', dialog.size === 'lg' ? 'retro-desktop__popup--lg' : ''].join(' ')}
              onClick={(e) => e.stopPropagation()}
            >
              {!dialog.chromeless && (
                <div className="retro-desktop__popup-titlebar">
                  <span>{dialog.title}</span>
                  <button className="retro-desktop__wbtn retro-desktop__wbtn--close" onClick={() => setDialog(null)} aria-label="Close">✕</button>
                </div>
              )}
              {dialog.content ? (
                <div className="retro-desktop__popup-rich">{dialog.content}</div>
              ) : (
                <div className="retro-desktop__popup-body">
                  <div className="retro-desktop__popup-row">
                    <span className="retro-desktop__popup-icon">{dialog.icon || 'ℹ️'}</span>
                    <pre className="retro-desktop__popup-text">{dialog.body}</pre>
                  </div>
                  <div className="retro-desktop__popup-buttons">
                    {dialog.onConfirm && (
                      <button
                        className="retro-desktop__dialog-btn"
                        onClick={() => { const cb = dialog.onConfirm; setDialog(null); cb(); }}
                      >
                        {dialog.confirmLabel || 'OK'}
                      </button>
                    )}
                    <button className="retro-desktop__dialog-btn" onClick={() => setDialog(null)}>
                      {dialog.onConfirm ? 'Cancel' : 'OK'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Start menu popup */}
        {startOpen && (
          <div className="retro-desktop__startmenu" onClick={(e) => e.stopPropagation()}>
            <div className="retro-desktop__startmenu-banner">
              <span className="retro-desktop__startmenu-banner-text">OPUS<span>95</span></span>
            </div>
            <div className="retro-desktop__startmenu-items">
              <button className="retro-desktop__startmenu-item" onClick={() => handleStartItem('programs')}>
                <span className="retro-desktop__startmenu-icon">📂</span>
                <span>Programs</span>
                <span className="retro-desktop__startmenu-arrow">▶</span>
              </button>
              <button className="retro-desktop__startmenu-item" onClick={() => handleStartItem('documents')}>
                <span className="retro-desktop__startmenu-icon">📄</span>
                <span>Documents</span>
                <span className="retro-desktop__startmenu-arrow">▶</span>
              </button>
              <button className="retro-desktop__startmenu-item" onClick={() => handleStartItem('find')}>
                <span className="retro-desktop__startmenu-icon">🔍</span>
                <span>Find</span>
              </button>
              <button className="retro-desktop__startmenu-item" onClick={() => handleStartItem('help')}>
                <span className="retro-desktop__startmenu-icon">❓</span>
                <span>Help</span>
              </button>
              <button className="retro-desktop__startmenu-item" onClick={() => handleStartItem('run')}>
                <span className="retro-desktop__startmenu-icon">▶</span>
                <span>Run…</span>
              </button>
              <div className="retro-desktop__startmenu-divider" />
              <button className="retro-desktop__startmenu-item retro-desktop__startmenu-item--shutdown" onClick={() => handleStartItem('shutdown')}>
                <span className="retro-desktop__startmenu-icon">⏻</span>
                <span>Shut Down…</span>
              </button>
            </div>
          </div>
        )}

        {/* Taskbar */}
        <div className="retro-desktop__taskbar">
          <button
            ref={startBtnRef}
            className={['retro-desktop__start', startOpen ? 'retro-desktop__start--active' : ''].join(' ')}
            onClick={(e) => { e.stopPropagation(); setStartOpen(v => !v); }}
          >
            <span className="retro-desktop__start-flag">⊞</span>
            <span className="retro-desktop__start-text">Start</span>
          </button>
          <div className="retro-desktop__taskbar-spacer">
            {/* fake "active window" tab */}
            <div className="retro-desktop__taskbar-tab retro-desktop__taskbar-tab--active">
              🖥 OPUS Corp — Office Console
            </div>
          </div>
          <div className="retro-desktop__tray">
            <span className="retro-desktop__tray-icon" title="Volume">🔊</span>
            <span className="retro-desktop__tray-icon" title="Network">📶</span>
            <span className="retro-desktop__clock" title={dateStr}>{timeStr}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

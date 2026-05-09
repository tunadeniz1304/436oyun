import './FileExplorer.css';

const ICON_COLORS = {
  doc:   '#0C447C',
  code:  '#3B6D11',
  chat:  '#854F0B',
  chart: '#993C1D',
  txt:   '#3C3489',
};

function FileIcon({ kind }) {
  const color = ICON_COLORS[kind] ?? 'var(--zone4-color)';
  switch (kind) {
    case 'doc':
      return (
        <svg viewBox="0 0 20 24" width="18" height="22" aria-hidden="true">
          <path d="M2 1 H13 L18 6 V23 H2 Z" fill="#EBF3FF" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M13 1 V6 H18" fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
          <line x1="5" y1="11" x2="15" y2="11" stroke={color} strokeWidth="1.1" />
          <line x1="5" y1="14" x2="15" y2="14" stroke={color} strokeWidth="1.1" />
          <line x1="5" y1="17" x2="13" y2="17" stroke={color} strokeWidth="1.1" />
        </svg>
      );
    case 'code':
      return (
        <svg viewBox="0 0 20 24" width="18" height="22" aria-hidden="true">
          <path d="M2 1 H13 L18 6 V23 H2 Z" fill="#EAF3DE" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M13 1 V6 H18" fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M7 11 L4 14 L7 17" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <path d="M13 11 L16 14 L13 17" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <path d="M11 10 L9 18" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'chat':
      return (
        <svg viewBox="0 0 20 24" width="18" height="22" aria-hidden="true">
          <rect x="2" y="4" width="16" height="13" rx="2" fill="#FAEEDA" stroke={color} strokeWidth="1.4" />
          <path d="M6 17 L6 22 L11 17" fill="#FAEEDA" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
          <line x1="5" y1="9" x2="13" y2="9" stroke={color} strokeWidth="1.1" />
          <line x1="5" y1="12" x2="11" y2="12" stroke={color} strokeWidth="1.1" />
        </svg>
      );
    case 'chart':
      return (
        <svg viewBox="0 0 20 24" width="18" height="22" aria-hidden="true">
          <rect x="2" y="3" width="16" height="18" rx="1.5" fill="#FAECE7" stroke={color} strokeWidth="1.4" />
          <rect x="5" y="14" width="2.5" height="4" fill={color} />
          <rect x="9" y="11" width="2.5" height="7" fill={color} />
          <rect x="13" y="7"  width="2.5" height="11" fill={color} />
        </svg>
      );
    case 'txt':
      return (
        <svg viewBox="0 0 20 24" width="18" height="22" aria-hidden="true">
          <path d="M2 1 H13 L18 6 V23 H2 Z" fill="#EEEDFE" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M13 1 V6 H18" fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
          <line x1="5" y1="11" x2="15" y2="11" stroke={color} strokeWidth="1.1" />
          <line x1="5" y1="14" x2="12" y2="14" stroke={color} strokeWidth="1.1" />
        </svg>
      );
    default:
      return null;
  }
}

function StatusDot({ status }) {
  if (!status) return null;
  const map = {
    exact:   { cls: 'is-exact',   label: '✓' },
    partial: { cls: 'is-partial', label: '~' },
    wrong:   { cls: 'is-wrong',   label: '✕' },
  };
  const s = map[status];
  if (!s) return null;
  return <span className={`file-row__dot ${s.cls}`} aria-hidden="true">{s.label}</span>;
}

function FileExplorer({ artefacts, selectedId, onSelect, statusById, disabled = false }) {
  return (
    <div className="file-explorer" role="listbox" aria-label="Artefact list">
      <div className="file-explorer__header">
        <span className="file-explorer__header-label">ARTEFACTS</span>
        <span className="file-explorer__header-count">
          {Object.keys(statusById ?? {}).length} / {artefacts.length} tagged
        </span>
      </div>
      <ul className="file-explorer__list">
        {artefacts.map((a) => {
          const status = statusById?.[a.id];
          const isSelected = selectedId === a.id;
          return (
            <li
              key={a.id}
              role="option"
              aria-selected={isSelected}
              className={`file-row ${isSelected ? 'is-selected' : ''} ${status ? `is-${status}` : ''} ${a.trap ? 'is-trap' : ''}`}
              onClick={() => !disabled && onSelect(a.id)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (!disabled) onSelect(a.id);
                }
              }}
            >
              <span className="file-row__icon">
                <FileIcon kind={a.icon} />
              </span>
              <div className="file-row__meta">
                <div className="file-row__name">
                  {a.name}
                  {a.trap && <span className="file-row__trap-badge" title="Trap artefact">!</span>}
                </div>
                <div className="file-row__type">{a.fileType ?? a.icon.toUpperCase()}</div>
              </div>
              <StatusDot status={status} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default FileExplorer;

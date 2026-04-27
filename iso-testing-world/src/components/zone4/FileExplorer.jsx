import './FileExplorer.css';

function FileIcon({ kind, color }) {
  switch (kind) {
    case 'doc':
      return (
        <svg viewBox="0 0 20 24" width="20" height="24" aria-hidden="true">
          <path d="M2 1 H13 L18 6 V23 H2 Z" fill="#ffffff" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M13 1 V6 H18" fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
          <line x1="5" y1="11" x2="15" y2="11" stroke={color} strokeWidth="1.1" />
          <line x1="5" y1="14" x2="15" y2="14" stroke={color} strokeWidth="1.1" />
          <line x1="5" y1="17" x2="13" y2="17" stroke={color} strokeWidth="1.1" />
        </svg>
      );
    case 'code':
      return (
        <svg viewBox="0 0 20 24" width="20" height="24" aria-hidden="true">
          <path d="M2 1 H13 L18 6 V23 H2 Z" fill="#ffffff" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M13 1 V6 H18" fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M7 11 L4 14 L7 17" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <path d="M13 11 L16 14 L13 17" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <path d="M11 10 L9 18" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'chat':
      return (
        <svg viewBox="0 0 20 24" width="20" height="24" aria-hidden="true">
          <rect x="2" y="4" width="16" height="13" rx="2" fill="#ffffff" stroke={color} strokeWidth="1.4" />
          <path d="M6 17 L6 22 L11 17" fill="#ffffff" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
          <line x1="5" y1="9" x2="13" y2="9" stroke={color} strokeWidth="1.1" />
          <line x1="5" y1="12" x2="11" y2="12" stroke={color} strokeWidth="1.1" />
        </svg>
      );
    case 'chart':
      return (
        <svg viewBox="0 0 20 24" width="20" height="24" aria-hidden="true">
          <rect x="2" y="3" width="16" height="18" rx="1.5" fill="#ffffff" stroke={color} strokeWidth="1.4" />
          <rect x="5" y="14" width="2.5" height="4" fill={color} />
          <rect x="9" y="11" width="2.5" height="7" fill={color} />
          <rect x="13" y="7"  width="2.5" height="11" fill={color} />
        </svg>
      );
    default:
      return null;
  }
}

function FileExplorer({ artefacts, selectedId, onSelect, statusById }) {
  return (
    <ul className="file-explorer" role="listbox" aria-label="Artefact list">
      {artefacts.map((a) => {
        const status = statusById?.[a.id]; // 'done' | 'wrong' | 'partial' | undefined
        const isSelected = selectedId === a.id;
        return (
          <li
            key={a.id}
            role="option"
            aria-selected={isSelected}
            className={`file-row ${isSelected ? 'is-selected' : ''} ${status ? `is-${status}` : ''}`}
            onClick={() => onSelect(a.id)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(a.id);
              }
            }}
          >
            <span className="file-row__icon" aria-hidden="true">
              <FileIcon kind={a.icon} color="var(--zone4-color)" />
            </span>
            <div className="file-row__meta">
              <div className="file-row__name">{a.name}</div>
              <div className="file-row__status">
                {status === 'done'    && <span className="file-row__pill is-correct">tagged ✓</span>}
                {status === 'partial' && <span className="file-row__pill is-partial">partial</span>}
                {status === 'wrong'   && <span className="file-row__pill is-wrong">review</span>}
                {!status && <span className="file-row__pill">untagged</span>}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default FileExplorer;

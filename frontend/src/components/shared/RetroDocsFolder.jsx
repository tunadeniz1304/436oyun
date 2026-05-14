import { useState } from 'react';
import RetroDocViewer from './RetroDocViewer.jsx';
import { desktopDocuments } from '../../data/desktop-documents.js';
import './RetroPopups.css';

/** @param {{ onClose: () => void }} props */
export default function RetroDocsFolder({ onClose }) {
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [openDocId, setOpenDocId] = useState(null);

  /** @type {React.MouseEventHandler<HTMLButtonElement>} */
  function handleFileClick(e, id) {
    if (e.detail === 2) {
      setOpenDocId(id);
    } else {
      setSelectedDocId(id);
    }
  }

  return (
    <div className="retro-docs-folder">
      <div className="retro-browser__titlebar">
        <span className="retro-browser__titlebar-icon">📂</span>
        <span className="retro-browser__titlebar-text">My Documents</span>
        <button className="retro-browser__close-btn" onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className="retro-docs-folder__menubar">
        <button className="retro-docs-folder__menu-item">File</button>
        <button className="retro-docs-folder__menu-item">Edit</button>
        <button className="retro-docs-folder__menu-item">View</button>
        <button className="retro-docs-folder__menu-item">Help</button>
      </div>

      <div className="retro-docs-folder__toolbar">
        <button className="retro-docs-folder__toolbar-btn">←</button>
        <button className="retro-docs-folder__toolbar-btn">↑</button>
        <button className="retro-docs-folder__toolbar-btn">Views ▼</button>
      </div>

      <div className="retro-docs-folder__file-area">
        <div className="retro-docs-folder__file-grid">
          {desktopDocuments.map((doc) => (
            <button
              key={doc.id}
              className={`retro-docs-folder__file-btn${selectedDocId === doc.id ? ' retro-docs-folder__file-btn--selected' : ''}`}
              onClick={(e) => handleFileClick(e, doc.id)}
              aria-label={`Open ${doc.filename}`}
            >
              <span className="retro-docs-folder__file-icon">{doc.icon}</span>
              <span className="retro-docs-folder__file-name">{doc.filename}</span>
            </button>
          ))}
        </div>
        {openDocId && (
          <div className="retro-docs-folder__viewer-overlay">
            <RetroDocViewer docId={openDocId} onClose={() => setOpenDocId(null)} />
          </div>
        )}
      </div>

      <div className="retro-docs-folder__statusbar">
        {desktopDocuments.length} object(s)
      </div>
    </div>
  );
}

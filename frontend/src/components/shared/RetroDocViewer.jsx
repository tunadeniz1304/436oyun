import { desktopDocuments } from '../../data/desktop-documents.js';
import { getISODefinition } from '../../data/iso-definitions.js';
import './RetroPopups.css';

/** @param {{ docId: string, onClose: () => void }} props */
export default function RetroDocViewer({ docId, onClose }) {
  const doc = desktopDocuments.find((d) => d.id === docId);
  if (!doc) return null;

  return (
    <div className="retro-doc-viewer">
      <div className="retro-doc-viewer__titlebar">
        <span className="retro-doc-viewer__titlebar-icon">📄</span>
        <span className="retro-doc-viewer__titlebar-text">{doc.filename}</span>
        <button className="retro-browser__close-btn" onClick={onClose} aria-label="Close document">×</button>
      </div>

      <div className="retro-doc-viewer__content">
        {doc.pages.map((page, i) => (
          <div key={i} className="retro-doc-viewer__page">
            <h2 className="retro-doc-viewer__heading">{page.heading}</h2>
            {page.paragraphs.map((para, j) => (
              <p key={j} className="retro-doc-viewer__para">{para}</p>
            ))}
          </div>
        ))}

        <div className="retro-doc-viewer__iso-section">
          {doc.isoRefs.map((ref) => {
            const def = getISODefinition(ref);
            return (
              <div key={ref} className="retro-doc-viewer__iso-callout">
                <div className="retro-doc-viewer__iso-label">📌 {ref} — {def.term}</div>
                <p>{def.definition}</p>
                {def.note && (
                  <p className="retro-doc-viewer__iso-note"><em>{def.note}</em></p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="retro-doc-viewer__footer">
        <span>Page 1 of 1</span>
        <button className="retro-docs-folder__toolbar-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

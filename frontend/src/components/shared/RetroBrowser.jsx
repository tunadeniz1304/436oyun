import { useState } from 'react';
import { browserPages } from '../../data/desktop-browser-pages.js';
import { getISODefinition } from '../../data/iso-definitions.js';
import './RetroPopups.css';

/** @param {{ onClose: () => void }} props */
export default function RetroBrowser({ onClose }) {
  const [history, setHistory] = useState(['index']);
  const [cursor, setCursor] = useState(0);

  const currentPageId = history[cursor];
  const page = browserPages[currentPageId] ?? browserPages['index'];

  function navigate(pageId) {
    const next = [...history.slice(0, cursor + 1), pageId];
    setHistory(next);
    setCursor(next.length - 1);
  }

  function goBack() {
    if (cursor > 0) setCursor(c => c - 1);
  }

  function goForward() {
    if (cursor < history.length - 1) setCursor(c => c + 1);
  }

  function goHome() {
    navigate('index');
  }

  return (
    <div className="retro-browser">
      {/* Title bar */}
      <div className="retro-browser__titlebar">
        <span className="retro-browser__titlebar-icon">🌐</span>
        <span className="retro-browser__titlebar-text">
          Internet Explorer — {page.title}
        </span>
        <button
          className="retro-browser__close-btn"
          onClick={onClose}
          aria-label="Close Internet Explorer"
        >
          ✕
        </button>
      </div>

      {/* Toolbar */}
      <div className="retro-browser__toolbar">
        <div className="retro-browser__nav-btns">
          <button
            className="retro-browser__toolbar-btn"
            onClick={goBack}
            disabled={cursor === 0}
            aria-label="Back"
          >
            ← Back
          </button>
          <button
            className="retro-browser__toolbar-btn"
            onClick={goForward}
            disabled={cursor >= history.length - 1}
            aria-label="Forward"
          >
            Forward →
          </button>
          <button className="retro-browser__toolbar-btn" aria-label="Stop">
            ■ Stop
          </button>
          <button className="retro-browser__toolbar-btn" aria-label="Refresh">
            ⟳ Refresh
          </button>
          <button
            className="retro-browser__toolbar-btn"
            onClick={goHome}
            aria-label="Home"
          >
            🏠 Home
          </button>
        </div>
        <div className="retro-browser__address-row">
          <label className="retro-browser__address-label" htmlFor="retro-browser-address">
            Address:
          </label>
          <input
            id="retro-browser-address"
            className="retro-browser__address-input"
            type="text"
            readOnly
            value={`iso://research/${currentPageId}`}
          />
          <button className="retro-browser__toolbar-btn" aria-label="Go">
            Go
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="retro-browser__content">
        <h1 className="retro-browser__page-title">{page.title}</h1>
        <p className="retro-browser__lede">{page.lede}</p>

        {page.sections.map((section, sIdx) => (
          <div key={sIdx} className="retro-browser__section">
            <h2 className="retro-browser__section-heading">{section.heading}</h2>

            {section.paragraphs.map((para, pIdx) => (
              <p key={pIdx} className="retro-browser__paragraph">{para}</p>
            ))}

            {section.isoCallout && (() => {
              const def = getISODefinition(section.isoCallout);
              return (
                <div className="retro-browser__iso-callout">
                  <strong>{def.term}</strong> ({section.isoCallout})
                  <p>{def.definition}</p>
                  {def.note && (
                    <p className="retro-browser__iso-note">
                      <em>Note: {def.note}</em>
                    </p>
                  )}
                </div>
              );
            })()}

            {section.links.length > 0 && (
              <ul className="retro-browser__link-list">
                {section.links.map(link => (
                  <li key={link.toId}>
                    <button
                      className="retro-browser__link-btn"
                      onClick={() => navigate(link.toId)}
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Status bar */}
      <div className="retro-browser__statusbar">Done</div>
    </div>
  );
}

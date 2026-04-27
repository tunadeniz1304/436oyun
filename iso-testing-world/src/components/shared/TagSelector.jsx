import Pill from './Pill.jsx';
import ISOTooltip from './ISOTooltip.jsx';
import './TagSelector.css';

/**
 * Multi-select tag selector. Used in Zone 4 (Artefact Archive).
 * The label "Test Item / Test Object" must always show both terms (CLAUDE.md §15).
 */
export const TAG_DEFINITIONS = {
  basis:    { label: 'Test Basis',                 clauseRef: '§3.84' },
  testitem: { label: 'Test Item / Test Object',    clauseRef: '§3.107' },
  static:   { label: 'Static Testing',             clauseRef: '§3.78' },
  dynamic:  { label: 'Dynamic Testing',            clauseRef: '§3.29' },
};

function TagSelector({
  tags = ['basis', 'testitem', 'static', 'dynamic'],
  selectedTags = [],
  onChange,
  zoneColor = 'var(--zone4-color)',
  disabled = false,
}) {
  if (!tags?.length) return null;

  const toggle = (key) => {
    const next = selectedTags.includes(key)
      ? selectedTags.filter((t) => t !== key)
      : [...selectedTags, key];
    onChange?.(next);
  };

  return (
    <div className="tag-selector" role="group" aria-label="Artefact role tags">
      {tags.map((key) => {
        const def = TAG_DEFINITIONS[key];
        if (!def) return null;
        const selected = selectedTags.includes(key);
        return (
          <span key={key} className="tag-selector__item">
            <Pill
              selected={selected}
              onChange={() => toggle(key)}
              zoneColor={zoneColor}
              disabled={disabled}
              ariaLabel={`Tag as ${def.label}`}
            >
              {def.label}
            </Pill>
            <ISOTooltip clauseRef={def.clauseRef}>
              <span className="sr-only">{def.label} definition</span>
            </ISOTooltip>
          </span>
        );
      })}
    </div>
  );
}

export default TagSelector;

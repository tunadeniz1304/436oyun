import { useDraggable } from '@dnd-kit/core';
import './IncidentCard.css';

const TAG_LABEL = {
  LOG: 'log line',
  DEV: 'developer note',
  USER: 'user report',
};

function IncidentCard({ id, text, tag, locked = false, shake = false }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id, disabled: locked });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0) ${isDragging ? 'scale(1.02)' : ''}`,
        zIndex: isDragging ? 50 : 'auto',
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`incident-card ${isDragging ? 'is-dragging' : ''} ${locked ? 'is-locked' : ''} ${shake ? 'is-shaking' : ''}`}
      {...listeners}
      {...attributes}
      aria-label={`Incident item, ${TAG_LABEL[tag] ?? tag}: ${text}`}
    >
      <div className="incident-card__header">
        <span className={`incident-card__tag tag-${tag.toLowerCase()}`}>{tag}</span>
        <span className="incident-card__handle" aria-hidden="true">
          <svg viewBox="0 0 14 14" width="12" height="12">
            <circle cx="3.5" cy="3.5" r="1.2" fill="currentColor" />
            <circle cx="3.5" cy="7"   r="1.2" fill="currentColor" />
            <circle cx="3.5" cy="10.5" r="1.2" fill="currentColor" />
            <circle cx="10.5" cy="3.5" r="1.2" fill="currentColor" />
            <circle cx="10.5" cy="7"   r="1.2" fill="currentColor" />
            <circle cx="10.5" cy="10.5" r="1.2" fill="currentColor" />
          </svg>
        </span>
      </div>
      <p className="incident-card__text">{text}</p>
    </div>
  );
}

export default IncidentCard;

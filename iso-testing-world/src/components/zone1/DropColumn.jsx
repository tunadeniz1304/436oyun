import { useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { useMotion } from '../../hooks/useMotion.js';
import ISOTooltip from '../shared/ISOTooltip.jsx';
import './DropColumn.css';

function DropColumn({ id, label, sublabel, clauseRef, blurb, children, flashKey }) {
  const { isOver, setNodeRef } = useDroppable({ id });

  // flashKey changes when a correct drop lands here, triggering the animation
  const flashMotion = useMotion({
    initial: false,
    animate: flashKey
      ? {
          backgroundColor: ['var(--zone1-bg)', '#ffffff', 'var(--zone1-bg)'],
        }
      : {},
    transition: { duration: 0.4 },
  });

  return (
    <motion.div
      ref={setNodeRef}
      className={`drop-column ${isOver ? 'is-over' : ''}`}
      key={flashKey || 'idle'}
      {...flashMotion}
    >
      <div className="drop-column__header">
        <h3 className="drop-column__label">
          <ISOTooltip clauseRef={clauseRef}>{label}</ISOTooltip>
        </h3>
        <span className="drop-column__sublabel">{sublabel}</span>
      </div>
      <p className="drop-column__blurb">{blurb}</p>
      <div className="drop-column__items">{children}</div>
    </motion.div>
  );
}

export default DropColumn;

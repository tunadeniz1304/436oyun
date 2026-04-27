import { motion } from 'framer-motion';
import { useMotion } from '../../hooks/useMotion.js';
import ISOTooltip from '../shared/ISOTooltip.jsx';
import './MissionCard.css';

function MissionCard({ index, total, mission, flash }) {
  const cardMotion = useMotion({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.25, ease: 'easeOut' },
  });
  return (
    <motion.div
      key={mission.id}
      className={`mission-card ${flash ? `mission-card--${flash}` : ''}`}
      {...cardMotion}
    >
      <div className="mission-card__header">
        <div className="mission-card__index">
          Mission <strong>{index + 1}</strong>
          <span className="mission-card__divider"> / </span>
          <span>{total}</span>
        </div>
        <span className="mission-card__clause">
          <ISOTooltip clauseRef={mission.isoRef}>verification &amp; validation</ISOTooltip>
        </span>
      </div>
      <p className="mission-card__text">{mission.text}</p>
      <div className="mission-card__prompt">
        Which kind of assessment does this mission ask for?
      </div>
    </motion.div>
  );
}

export default MissionCard;

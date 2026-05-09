import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PixelCharacter from './PixelCharacter.jsx';
import './NpcDialog.css';

/**
 * @param {{ npc: {name:string,role:string,lines:string[]}, zoneColor: string, onClose: ()=>void, onEnterZone: ()=>void }} props
 */
export default function NpcDialog({ npc, zoneColor, onClose, onEnterZone }) {
  const [idx, setIdx] = useState(0);
  const isLast = idx === npc.lines.length - 1;

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (isLast) onEnterZone();
        else setIdx(i => i + 1);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, onEnterZone, isLast]);

  return (
    <div className="npc-dialog" style={{ '--dialog-color': zoneColor }}>
      <div className="npc-dialog__inner">
        <div className="npc-dialog__card">

          <div className="npc-dialog__header">
            <div className="npc-dialog__avatar">
              <PixelCharacter type="npc-main" facing="down" color={zoneColor} label="" />
            </div>
            <div className="npc-dialog__meta">
              <div className="npc-dialog__name">{npc.name}</div>
              <div className="npc-dialog__role">{npc.role}</div>
            </div>
            <span className="npc-dialog__key-hint">ESC close · ENTER next</span>
            <button className="npc-dialog__close" onClick={onClose} aria-label="Close">✕</button>
          </div>

          <div className="npc-dialog__divider" />

          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              className="npc-dialog__text"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              {npc.lines[idx]}
            </motion.div>
          </AnimatePresence>

          <div className="npc-dialog__footer">
            <div className="npc-dialog__dots">
              {npc.lines.map((_, i) => (
                <div
                  key={i}
                  className={`npc-dialog__dot${i === idx ? ' npc-dialog__dot--active' : ''}`}
                />
              ))}
            </div>
            <button
              className={`npc-dialog__btn${isLast ? ' npc-dialog__btn--enter' : ''}`}
              onClick={isLast ? onEnterZone : () => setIdx(i => i + 1)}
            >
              {isLast ? 'Enter Zone →' : 'Continue →'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

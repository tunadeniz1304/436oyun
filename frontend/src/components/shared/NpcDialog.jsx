import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PixelCharacter from './PixelCharacter.jsx';
import { NPC_VARIANTS } from '../../data/npc-variants.js';
import './NpcDialog.css';

/**
 * Multiple-choice quiz body for worker NPCs
 */
function QuizBody({ quiz, onComplete, zoneColor }) {
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(false);

  const handleChoice = (idx) => {
    if (answered && correct) return;
    const choice = quiz.choices[idx];
    setSelected(idx);
    setAnswered(true);
    setCorrect(!!choice.correct);
  };

  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div className="npc-quiz">
      <div className="npc-quiz__prompt">{quiz.prompt}</div>

      <div className="npc-quiz__choices">
        {quiz.choices.map((choice, idx) => {
          const isSelected = selected === idx;
          const showResult = answered && isSelected;
          const stateClass = showResult
            ? (choice.correct ? 'npc-quiz__choice--correct' : 'npc-quiz__choice--wrong')
            : '';

          return (
            <button
              key={idx}
              className={`npc-quiz__choice ${stateClass}`}
              onClick={() => handleChoice(idx)}
              disabled={answered && correct}
            >
              <span className="npc-quiz__letter">{letters[idx]}</span>
              <span className="npc-quiz__choice-text">{choice.text}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {answered && selected !== null && (
          <motion.div
            key={`feedback-${selected}`}
            className={`npc-quiz__feedback ${correct ? 'npc-quiz__feedback--correct' : 'npc-quiz__feedback--wrong'}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <span className="npc-quiz__feedback-icon">{correct ? '✓' : '✗'}</span>
            <div>
              <div className="npc-quiz__feedback-text">
                {quiz.choices[selected].explanation}
              </div>
              <span className="npc-quiz__iso-badge">{quiz.choices[selected].isoRef}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {answered && correct && (
        <motion.div
          className="npc-quiz__reward"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, delay: 0.15 }}
        >
          <div className="npc-quiz__reward-hint">
            <span className="npc-quiz__reward-icon">💡</span>
            {quiz.rewardHint}
          </div>
          <button
            className="npc-quiz__got-it"
            style={{ '--dialog-color': zoneColor }}
            onClick={onComplete}
          >
            Got it →
          </button>
        </motion.div>
      )}
    </div>
  );
}

/**
 * @param {{
 *   npc: object,
 *   zoneColor: string,
 *   onClose: ()=>void,
 *   onEnterZone?: ()=>void,
 *   onQuestComplete?: (npcId:string)=>void,
 * }} props
 */
export default function NpcDialog({ npc, zoneColor, onClose, onEnterZone, onQuestComplete }) {
  const [idx, setIdx] = useState(0);
  const isQuizMode = !!npc.quiz;
  const isLast = !isQuizMode && idx === npc.lines.length - 1;

  // Resolve NPC visual variant
  const variant = npc.variantId ? NPC_VARIANTS[npc.variantId] : null;
  const npcType = npc.type === 'main' ? 'npc-main' : 'npc-worker';

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (isQuizMode) return; // quiz uses click-only
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (isLast) onEnterZone?.();
        else setIdx(i => i + 1);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, onEnterZone, isLast, isQuizMode]);

  const handleQuestComplete = () => {
    onQuestComplete?.(npc.id);
    onClose();
  };

  return (
    <div className="npc-dialog" style={{ '--dialog-color': zoneColor }}>
      <div className="npc-dialog__inner">
        <div className={`npc-dialog__card${isQuizMode ? ' npc-dialog__card--quiz' : ''}`}>

          <div className="npc-dialog__header">
            <div className="npc-dialog__avatar">
              <PixelCharacter
                type={npcType}
                facing="down"
                color={zoneColor}
                label=""
                hair={variant?.hair}
                skin={variant?.skin}
                outfit={variant?.outfit || 'default'}
                gender={variant?.gender || 'm'}
                accessory={npc.accessory}
              />
            </div>
            <div className="npc-dialog__meta">
              <div className="npc-dialog__name">{npc.name}</div>
              <div className="npc-dialog__role">{npc.role}</div>
            </div>
            {!isQuizMode && (
              <span className="npc-dialog__key-hint">ESC close · ENTER next</span>
            )}
            {isQuizMode && (
              <span className="npc-dialog__key-hint">ESC close</span>
            )}
            <button className="npc-dialog__close" onClick={onClose} aria-label="Close">✕</button>
          </div>

          <div className="npc-dialog__divider" />

          {isQuizMode ? (
            <QuizBody quiz={npc.quiz} onComplete={handleQuestComplete} zoneColor={zoneColor} />
          ) : (
            <>
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
            </>
          )}

        </div>
      </div>
    </div>
  );
}

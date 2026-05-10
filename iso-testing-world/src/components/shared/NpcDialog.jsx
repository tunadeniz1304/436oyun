import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PixelCharacter from './PixelCharacter.jsx';
import './NpcDialog.css';

function QuizBody({ npc, zoneColor, onComplete, onClose }) {
  const { quiz } = npc;
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);

  const handleChoice = (idx) => {
    if (revealed && quiz.choices[selected]?.correct) return;
    setSelected(idx);
    setRevealed(true);
    if (quiz.choices[idx].correct) {
      setTimeout(() => setDone(true), 600);
    }
  };

  return (
    <div className="npc-quiz">
      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <p className="npc-quiz__prompt">{quiz.prompt}</p>
            <div className="npc-quiz__choices">
              {quiz.choices.map((c, i) => {
                let state = '';
                if (revealed && selected === i) {
                  state = c.correct ? 'correct' : 'wrong';
                }
                return (
                  <button
                    key={i}
                    className={`npc-quiz__choice ${state}`}
                    style={{ '--qcolor': zoneColor }}
                    onClick={() => handleChoice(i)}
                    disabled={revealed && quiz.choices[selected]?.correct}
                  >
                    <span className="npc-quiz__choice-letter">{String.fromCharCode(65 + i)}</span>
                    {c.text}
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {revealed && selected !== null && (
                <motion.div
                  key="feedback"
                  className={`npc-quiz__feedback ${quiz.choices[selected].correct ? 'npc-quiz__feedback--correct' : 'npc-quiz__feedback--wrong'}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <span className="npc-quiz__feedback-icon">
                    {quiz.choices[selected].correct ? '✓' : '✗'}
                  </span>
                  <span>{quiz.choices[selected].explanation}</span>
                  {quiz.choices[selected].isoRef && (
                    <span className="npc-quiz__iso-ref" style={{ color: zoneColor }}>
                      {quiz.choices[selected].isoRef}
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="reward"
            className="npc-quiz__reward"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="npc-quiz__reward-badge" style={{ background: zoneColor }}>
              ✓ Correct!
            </div>
            <p className="npc-quiz__hint-label">Hint unlocked</p>
            <p className="npc-quiz__hint-text">{quiz.rewardHint}</p>
            <button
              className="npc-dialog__btn npc-dialog__btn--enter"
              style={{ '--dialog-color': zoneColor }}
              onClick={() => onComplete(npc.id)}
            >
              Got it →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * @param {{
 *   npc: object,
 *   zoneColor: string,
 *   onClose: ()=>void,
 *   onEnterZone: ()=>void,
 *   onQuestComplete?: (npcId:string)=>void,
 *   npcVariant?: object,
 * }} props
 */
export default function NpcDialog({ npc, zoneColor, onClose, onEnterZone, onQuestComplete, npcVariant }) {
  const isQuiz = !!npc.quiz;
  const [idx, setIdx] = useState(0);
  const isLast = !isQuiz && idx === (npc.lines?.length ?? 1) - 1;

  useEffect(() => {
    if (isQuiz) return;
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
  }, [onClose, onEnterZone, isLast, isQuiz]);

  const avatarType = npc.type === 'main' ? 'npc-main' : 'npc-worker';

  return (
    <div className="npc-dialog" style={{ '--dialog-color': zoneColor }}>
      <div className="npc-dialog__inner">
        <div className={`npc-dialog__card ${isQuiz ? 'npc-dialog__card--quiz' : ''}`}>

          <div className="npc-dialog__header">
            <div className="npc-dialog__avatar">
              <PixelCharacter
                type={avatarType}
                facing="down"
                color={zoneColor}
                label=""
                outfit={npcVariant?.outfit}
                gender={npcVariant?.gender}
                hair={npcVariant?.hair}
                skin={npcVariant?.skin}
                accessory={npc.accessory}
              />
            </div>
            <div className="npc-dialog__meta">
              <div className="npc-dialog__name">{npc.name}</div>
              <div className="npc-dialog__role">{npc.role}</div>
            </div>
            {!isQuiz && <span className="npc-dialog__key-hint">ESC close · ENTER next</span>}
            {isQuiz && <span className="npc-dialog__key-hint">ISO warm-up quiz</span>}
            <button className="npc-dialog__close" onClick={onClose} aria-label="Close">✕</button>
          </div>

          <div className="npc-dialog__divider" />

          {isQuiz ? (
            <QuizBody
              npc={npc}
              zoneColor={zoneColor}
              onComplete={(id) => { onQuestComplete?.(id); onClose(); }}
              onClose={onClose}
            />
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

import { useState, useEffect } from 'react';
import { getISODefinition } from '../../data/iso-definitions.js';
import './RetroPopups.css';

const DECK = [
  { id: 's1', text: 'A developer removed a null-check during refactoring, thinking it was redundant.', answer: 'error',   isoRef: '§4.7' },
  { id: 's2', text: 'The null-check removal left a code path that can produce a divide-by-zero.',      answer: 'fault',   isoRef: '§4.7' },
  { id: 's3', text: 'In production, the payment service crashes whenever a user has zero pending orders.', answer: 'failure', isoRef: '§4.7' },
  { id: 's4', text: 'During code review, a tester wrote a test case with an incorrect expected value.', answer: 'error',   isoRef: '§4.7' },
  { id: 's5', text: 'After deployment, the login page returns a blank screen for users with long usernames.', answer: 'failure', isoRef: '§4.7' },
];

const TARGETS = [
  { id: 'error',   label: 'Error' },
  { id: 'fault',   label: 'Fault / Defect' },
  { id: 'failure', label: 'Failure' },
];

const HEARTS = ['❤️', '❤️', '❤️'];

/**
 * @param {{ onClose: () => void }} props
 */
export default function RetroBugSweeper({ onClose }) {
  const [round, setRound]       = useState(0);
  const [score, setScore]       = useState(0);
  const [lives, setLives]       = useState(3);
  const [feedback, setFeedback] = useState(null); // { target: string, correct: bool } | null
  const [status, setStatus]     = useState('playing'); // 'playing' | 'won' | 'lost'
  const [phase, setPhase]       = useState('loading'); // 'loading' | 'ready'

  useEffect(() => {
    if (phase !== 'loading') return;
    const id = setTimeout(() => setPhase('ready'), 900);
    return () => clearTimeout(id);
  }, [phase]);

  const isoDef = getISODefinition('§4.7');

  const handleAnswer = (targetId) => {
    if (feedback !== null || status !== 'playing') return;

    const card = DECK[round];
    const correct = targetId === card.answer;

    setFeedback({ target: targetId, correct });

    if (correct) {
      const nextScore = score + 1;
      setScore(nextScore);
      setTimeout(() => {
        setFeedback(null);
        const nextRound = round + 1;
        if (nextRound >= DECK.length) {
          setStatus('won');
        } else {
          setRound(nextRound);
        }
      }, 600);
    } else {
      const nextLives = lives - 1;
      setLives(nextLives);
      setTimeout(() => {
        setFeedback(null);
        if (nextLives <= 0) {
          setStatus('lost');
        }
      }, 600);
    }
  };

  const handleReset = () => {
    setRound(0);
    setScore(0);
    setLives(3);
    setFeedback(null);
    setStatus('playing');
  };

  if (phase === 'loading') {
    return (
      <div className="bug-sweeper bug-sweeper--loading">
        <div className="bug-sweeper__loading-card">
          <div className="bug-sweeper__loading-icon">🐛</div>
          <div className="bug-sweeper__loading-title">TriageDesk.exe</div>
          <div className="bug-sweeper__loading-subtitle">Loading incident triage console…</div>
          <div className="bug-sweeper__loading-progress">
            <div className="bug-sweeper__loading-bar" />
          </div>
          <div className="bug-sweeper__loading-log">
            <div>&gt; Reading incident log………… OK</div>
            <div>&gt; Loading ISO 29119-1 §4.7… OK</div>
            <div>&gt; Connecting to defect tracker…</div>
          </div>
        </div>
      </div>
    );
  }

  if (status !== 'playing') {
    return (
      <div className="bug-sweeper">
        <div className="bug-sweeper__result">
          <div className="bug-sweeper__result-title">
            {status === 'won' ? '🎉 You Win!' : '💀 Game Over'}
          </div>
          <div className="bug-sweeper__result-score">
            Score: {score} / {DECK.length}
            {status === 'lost' && ' — Lives exhausted.'}
          </div>
          <div className="bug-sweeper__iso-callout">
            <div className="bug-sweeper__iso-callout-ref">{isoDef.term} ({isoDef.source})</div>
            <div>{isoDef.definition}</div>
            {isoDef.note && <div style={{ marginTop: '6px', fontStyle: 'italic' }}>{isoDef.note}</div>}
          </div>
          <div className="bug-sweeper__result-actions">
            {status === 'lost' && (
              <button className="bug-sweeper__result-btn" onClick={handleReset}>Try Again</button>
            )}
            <button className="bug-sweeper__result-btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  const card = DECK[round];

  return (
    <div className="bug-sweeper">
      <div className="bug-sweeper__header">
        <span className="bug-sweeper__title">🐛 BugSweeper</span>
        <span className="bug-sweeper__lives" aria-label={`${lives} lives remaining`}>
          {HEARTS.map((h, i) => (
            <span key={i} style={{ opacity: i < lives ? 1 : 0.2 }}>{h}</span>
          ))}
        </span>
        <span className="bug-sweeper__round">Round {round + 1} / {DECK.length}</span>
      </div>

      <div className="bug-sweeper__card">{card.text}</div>

      <div className="bug-sweeper__targets">
        {TARGETS.map((t) => {
          let modifier = '';
          if (feedback && feedback.target === t.id) {
            modifier = feedback.correct ? 'bug-sweeper__btn--correct' : 'bug-sweeper__btn--wrong';
          }
          return (
            <button
              key={t.id}
              className={['bug-sweeper__btn', modifier].filter(Boolean).join(' ')}
              onClick={() => handleAnswer(t.id)}
              disabled={feedback !== null}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="bug-sweeper__footer">
        <span className="bug-sweeper__score">Score: {score}</span>
        <span className="bug-sweeper__hint">Classify the incident!</span>
      </div>
    </div>
  );
}

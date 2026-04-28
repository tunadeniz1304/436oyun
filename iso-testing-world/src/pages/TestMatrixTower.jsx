import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ZoneLayout from '../components/shared/ZoneLayout.jsx';
import FeedbackModal from '../components/shared/FeedbackModal.jsx';
import Button from '../components/shared/Button.jsx';
import Matrix, { cellKey } from '../components/zone3/Matrix.jsx';
import SingleCellChallenge from '../components/zone3/SingleCellChallenge.jsx';
import { useGame } from '../hooks/useGame.js';
import { useFeedbackQueue } from '../hooks/useFeedbackQueue.js';
import { useMotion } from '../hooks/useMotion.js';
import {
  zone3Scenarios,
  ZONE3_FULL_SCORE,
  ZONE3_PER_SCENARIO,
  ZONE3_HALF,
} from '../data/zone3-scenarios.js';
import { getISODefinition } from '../data/iso-definitions.js';
import './TestMatrixTower.css';

function correctSet(scenario) {
  return new Set(scenario.correctCells.map((c) => cellKey(c.level, c.type)));
}

function evaluate(scenario, selected) {
  const correct = correctSet(scenario);
  let hits = 0;
  let wrong = 0;
  selected.forEach((k) => {
    if (correct.has(k)) hits += 1;
    else wrong += 1;
  });
  const exact = wrong === 0 && hits === correct.size;
  if (exact) return { kind: 'exact', score: ZONE3_PER_SCENARIO, hits, wrong };
  if (wrong > 0) return { kind: 'wrong', score: ZONE3_HALF, hits, wrong };
  return { kind: 'partial', score: (hits / correct.size) * ZONE3_PER_SCENARIO, hits, wrong };
}

const TOTAL = zone3Scenarios.length;

function TestMatrixTower() {
  const navigate = useNavigate();
  const { state, isZoneUnlocked, completeZone, recordWrong } = useGame();
  const { current: feedbackCurrent, isOpen: feedbackIsOpen, push: pushFeedback, pop: popFeedback } = useFeedbackQueue();

  const [idx, setIdx]           = useState(0);
  const [selected, setSelected] = useState(() => new Set());
  const [showChallenge, setShowChallenge] = useState(false);
  const [scores, setScores]     = useState([]);
  const [results, setResults]   = useState([]);  // 'exact' | 'partial' | 'wrong'
  const [verdict, setVerdict]   = useState(null);
  const [completed, setCompleted] = useState(false);

  const scenario = zone3Scenarios[idx];

  const cardMotion = useMotion({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  });

  const onToggle = useCallback(
    (level, type) => {
      if (verdict || completed) return;
      const k = cellKey(level, type);
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(k)) next.delete(k);
        else next.add(k);
        return next;
      });
    },
    [verdict, completed]
  );

  const selectedArr = useMemo(() => Array.from(selected), [selected]);

  function handleSubmit() {
    if (selected.size === 0 || verdict) return;
    if (selected.size === 1 && scenario.correctCells.length > 1) {
      setShowChallenge(true);
      return;
    }
    submitNow();
  }

  function submitNow() {
    setShowChallenge(false);
    const result = evaluate(scenario, selected);
    setScores((prev) => [...prev, result.score]);
    setResults((prev) => [...prev, result.kind]);
    setVerdict(result.kind);

    if (result.kind !== 'exact') {
      const def = getISODefinition(scenario.isoRef);
      pushFeedback({
        isoRef: scenario.isoRef,
        term: def.term,
        definition: def.definition,
        note: def.note,
        playerAnswer:
          result.kind === 'wrong'
            ? `${selected.size} cell(s) — ${result.wrong} wrong selection(s)`
            : `${selected.size} cell(s), but ${scenario.correctCells.length - result.hits} correct cell(s) missed`,
        explanation: scenario.feedbackPartial,
        title: result.kind === 'wrong' ? 'WRONG CELLS SELECTED' : 'INCOMPLETE SELECTION',
        headerColor: 'var(--zone3-color)',
      });
      recordWrong({
        zoneId: 'matrix-tower',
        itemId: scenario.id,
        playerAnswer: selectedArr.join(', '),
        correctAnswer: Array.from(correctSet(scenario)).join(', '),
        isoRef: scenario.isoRef,
      });
    }

    setTimeout(() => {
      if (idx + 1 >= TOTAL) {
        setCompleted(true);
      } else {
        setSelected(new Set());
        setVerdict(null);
        setIdx(idx + 1);
      }
    }, 1500);
  }

  useEffect(() => {
    if (!completed) return;
    const sum = scores.reduce((a, b) => a + b, 0);
    completeZone('matrix-tower', Math.round(Math.min(ZONE3_FULL_SCORE, sum)));
  }, [completed, scores, completeZone]);

  if (!isZoneUnlocked('matrix-tower')) return <Navigate to="/" replace />;

  const submitDisabled = selected.size === 0 || !!verdict;

  const verdictLabel =
    verdict === 'exact'   ? '✓ EXACT MATCH — FULL CREDIT' :
    verdict === 'partial' ? '⚠ INCOMPLETE — PARTIAL CREDIT' :
    verdict === 'wrong'   ? '✕ WRONG CELLS — HALF CREDIT' : null;

  const exactCount   = results.filter((r) => r === 'exact').length;
  const partialCount = results.filter((r) => r === 'partial').length;
  const wrongCount   = results.filter((r) => r === 'wrong').length;
  const finalScore   = Math.round(scores.reduce((a, b) => a + b, 0));

  return (
    <ZoneLayout
      zoneId="matrix-tower"
      zoneName="Test Matrix Tower"
      zoneColor="var(--zone3-color)"
      zoneBg="var(--zone3-bg)"
      subtitle="ISO/IEC/IEEE 29119-1 — §3.108 (level) × §3.130 (type)"
      scoreCurrent={state.zoneScores['matrix-tower']}
    >
      <div className="cmd-center">
        {!completed ? (
          <>
            {/* Mission header */}
            <motion.div className="cmd-center__mission" {...cardMotion}>
              <div className="cmd-center__mission-top">
                <span className="cmd-center__label">MISSION {idx + 1} / {TOTAL}</span>
                <div className="cmd-center__dots" aria-hidden="true">
                  {zone3Scenarios.map((_, i) => (
                    <span
                      key={i}
                      className={`cmd-center__dot ${i < idx ? 'is-done' : i === idx ? 'is-active' : ''}`}
                    />
                  ))}
                </div>
              </div>
              <p className="cmd-center__scenario-text">{scenario.text}</p>
              {verdictLabel && (
                <div className={`cmd-center__verdict cmd-center__verdict--${verdict}`}>
                  {verdictLabel}
                </div>
              )}
            </motion.div>

            {/* Matrix */}
            <div className="cmd-center__board">
              <Matrix selected={selected} onToggle={onToggle} disabled={!!verdict} />
            </div>

            {/* Action bar */}
            <div className="cmd-center__actions">
              <span className="cmd-center__counter">
                {selected.size} cell{selected.size === 1 ? '' : 's'} selected
              </span>
              <Button
                variant="primary"
                size="lg"
                zoneColor="var(--zone3-color)"
                disabled={submitDisabled}
                onClick={handleSubmit}
              >
                DEPLOY TEST PLAN →
              </Button>
            </div>

            {/* Scope note */}
            <p className="cmd-center__scope-note">
              <strong>⚐ SCOPE:</strong> Test Practices (§4.2.4.5) form a third axis in the
              standard but are Part 2 normative content — intentionally outside this matrix.
            </p>
          </>
        ) : (
          /* Completion screen */
          <div className="cmd-center__complete">
            <div className="cmd-center__complete-header">
              <span className="cmd-center__label">MISSION COMPLETE</span>
              <h2 className="cmd-center__complete-title">Test Plan Deployed</h2>
            </div>
            <div className="cmd-center__breakdown">
              <div className="cmd-center__breakdown-row cmd-center__breakdown-row--exact">
                <span>Exact matches</span>
                <span className="cmd-center__breakdown-val">{exactCount} / {TOTAL}</span>
              </div>
              <div className="cmd-center__breakdown-row cmd-center__breakdown-row--partial">
                <span>Partial selections</span>
                <span className="cmd-center__breakdown-val">{partialCount} / {TOTAL}</span>
              </div>
              <div className="cmd-center__breakdown-row cmd-center__breakdown-row--wrong">
                <span>Wrong cells</span>
                <span className="cmd-center__breakdown-val">{wrongCount} / {TOTAL}</span>
              </div>
              <div className="cmd-center__breakdown-total">
                <span>Final Score</span>
                <span>{finalScore} / {ZONE3_FULL_SCORE}</span>
              </div>
            </div>
            <Button
              variant="primary"
              size="lg"
              zoneColor="var(--zone3-color)"
              onClick={() => navigate('/zone/artefact-archive')}
            >
              Continue → Zone 4
            </Button>
          </div>
        )}
      </div>

      <SingleCellChallenge
        open={showChallenge}
        onAddMore={() => setShowChallenge(false)}
        onGoBack={submitNow}
      />
      <FeedbackModal
        isOpen={feedbackIsOpen}
        onClose={popFeedback}
        headerColor="var(--zone3-color)"
        {...(feedbackCurrent ?? {})}
      />
    </ZoneLayout>
  );
}

export default TestMatrixTower;

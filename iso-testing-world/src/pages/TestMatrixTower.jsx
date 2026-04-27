import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ZoneLayout from '../components/shared/ZoneLayout.jsx';
import FeedbackModal from '../components/shared/FeedbackModal.jsx';
import Button from '../components/shared/Button.jsx';
import Matrix, { cellKey } from '../components/zone3/Matrix.jsx';
import SingleCellChallenge from '../components/zone3/SingleCellChallenge.jsx';
import CellJustifications, {
  countWords,
  MIN_WORDS,
} from '../components/zone3/CellJustifications.jsx';
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
  if (exact) {
    return { kind: 'exact', score: ZONE3_PER_SCENARIO, hits, wrong };
  }
  if (wrong > 0) {
    return { kind: 'wrong', score: ZONE3_HALF, hits, wrong };
  }
  // strict subset
  return {
    kind: 'partial',
    score: (hits / correct.size) * ZONE3_PER_SCENARIO,
    hits,
    wrong,
  };
}

function TestMatrixTower() {
  const navigate = useNavigate();
  const { state, isZoneUnlocked, completeZone, recordWrong } = useGame();
  const feedback = useFeedbackQueue();

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(() => new Set());
  const [justifications, setJustifications] = useState({});
  const [errors, setErrors] = useState(() => new Set());
  const [showChallenge, setShowChallenge] = useState(false);
  const [scores, setScores] = useState([]);
  const [verdict, setVerdict] = useState(null);   // 'exact' | 'partial' | 'wrong' | null
  const [completed, setCompleted] = useState(false);

  const scenario = zone3Scenarios[idx];
  const total = zone3Scenarios.length;

  const headerMotion = useMotion({
    initial: { opacity: 0, y: 6 },
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
      setJustifications((prev) => {
        const next = { ...prev };
        if (selected.has(k)) {
          delete next[k];
        }
        return next;
      });
      setErrors((prev) => {
        const next = new Set(prev);
        next.delete(k);
        return next;
      });
    },
    [verdict, completed, selected]
  );

  const selectedArr = useMemo(() => Array.from(selected), [selected]);

  const handleSubmit = useCallback(() => {
    if (selected.size === 0 || verdict) return;
    // Single-cell challenge gate (only when correctCells.length > 1)
    if (selected.size === 1 && scenario.correctCells.length > 1) {
      setShowChallenge(true);
      return;
    }
    submitNow();
  }, [selected, verdict, scenario]);

  function submitNow() {
    setShowChallenge(false);
    // Validate justifications: every selected cell needs ≥ MIN_WORDS
    const errs = new Set();
    selectedArr.forEach((k) => {
      if (countWords(justifications[k] ?? '') < MIN_WORDS) errs.add(k);
    });
    if (errs.size > 0) {
      setErrors(errs);
      // focus first invalid input
      requestAnimationFrame(() => {
        const first = errs.values().next().value;
        if (first) {
          const el = document.getElementById(`just-${first}`);
          el?.focus();
        }
      });
      return;
    }

    const result = evaluate(scenario, selected);
    setScores((prev) => [...prev, result.score]);
    setVerdict(result.kind);

    if (result.kind !== 'exact') {
      const def = getISODefinition(scenario.isoRef);
      feedback.push({
        isoRef: scenario.isoRef,
        term: def.term,
        definition: def.definition,
        note: def.note,
        playerAnswer:
          result.kind === 'wrong'
            ? `${selected.size} cell(s) — ${result.wrong} wrong`
            : `${selected.size} cell(s), but ${
                scenario.correctCells.length - result.hits
              } correct cell(s) missed`,
        explanation: scenario.feedbackPartial,
        title: result.kind === 'wrong' ? 'PARTIALLY WRONG' : 'PARTIAL ANSWER',
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

    // Advance after 1.5s OR after feedback dismissal
    setTimeout(() => {
      if (idx + 1 >= total) {
        setCompleted(true);
      } else {
        setSelected(new Set());
        setJustifications({});
        setErrors(new Set());
        setVerdict(null);
        setIdx(idx + 1);
      }
    }, 1500);
  }

  // Compute total and dispatch on completion
  useEffect(() => {
    if (!completed) return;
    const sum = scores.reduce((a, b) => a + b, 0);
    completeZone('matrix-tower', Math.round(Math.min(ZONE3_FULL_SCORE, sum)));
  }, [completed, scores, completeZone]);

  if (!isZoneUnlocked('matrix-tower')) {
    return <Navigate to="/" replace />;
  }

  const submitDisabled = selected.size === 0 || !!verdict;
  const verdictLabel =
    verdict === 'exact'
      ? 'Exact match — full credit'
      : verdict === 'partial'
      ? 'Partial — missed some cells'
      : verdict === 'wrong'
      ? 'Includes wrong cell — half credit'
      : null;

  return (
    <ZoneLayout
      zoneId="matrix-tower"
      zoneName="Zone 3 — Test Matrix Tower"
      zoneColor="var(--zone3-color)"
      zoneBg="var(--zone3-bg)"
      subtitle="ISO/IEC/IEEE 29119-1 — §3.108 (level) × §3.130 (type)"
      scoreCurrent={state.zoneScores['matrix-tower']}
    >
      <motion.section className="matrix-tower" {...headerMotion}>
        {!completed ? (
          <>
            <div className="matrix-tower__brief">
              <div className="matrix-tower__brief-meta">
                Scenario <strong>{idx + 1}</strong> / {total}
              </div>
              <p>{scenario.text}</p>
              {verdictLabel ? (
                <div
                  className={`matrix-tower__verdict matrix-tower__verdict--${verdict}`}
                >
                  {verdictLabel}
                </div>
              ) : null}
            </div>

            <div className="matrix-tower__board">
              <Matrix
                selected={selected}
                onToggle={onToggle}
                disabled={!!verdict}
              />

              <CellJustifications
                selected={selectedArr}
                justifications={justifications}
                onChange={(k, v) =>
                  setJustifications((prev) => ({ ...prev, [k]: v }))
                }
                errors={errors}
              />

              <div className="matrix-tower__actions">
                <span className="matrix-tower__counter">
                  {selected.size} cell{selected.size === 1 ? '' : 's'} selected
                </span>
                <Button
                  variant="primary"
                  size="lg"
                  zoneColor="var(--zone3-color)"
                  disabled={submitDisabled}
                  onClick={handleSubmit}
                >
                  Submit selection →
                </Button>
              </div>
            </div>

            <div className="matrix-tower__scope-note">
              <strong>⚐ Scope note:</strong> Test Practices (§4.2.4.5) form a
              third axis in the standard but are Part 2 normative content —
              intentionally outside this matrix.
            </div>
          </>
        ) : (
          <div className="matrix-tower__complete">
            <h2>Zone 3 complete</h2>
            <p>
              Final score:{' '}
              <strong>
                {Math.round(scores.reduce((a, b) => a + b, 0))} / {ZONE3_FULL_SCORE}
              </strong>
            </p>
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
      </motion.section>

      <SingleCellChallenge
        open={showChallenge}
        onAddMore={() => setShowChallenge(false)}
        onGoBack={submitNow}
      />
      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={feedback.pop}
        headerColor="var(--zone3-color)"
        {...(feedback.current ?? {})}
      />
    </ZoneLayout>
  );
}

export default TestMatrixTower;

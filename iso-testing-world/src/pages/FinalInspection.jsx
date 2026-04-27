import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ZoneLayout from '../components/shared/ZoneLayout.jsx';
import FeedbackModal from '../components/shared/FeedbackModal.jsx';
import Button from '../components/shared/Button.jsx';
import TagSelector from '../components/shared/TagSelector.jsx';
import Matrix, { cellKey } from '../components/zone3/Matrix.jsx';
import IncidentReport from '../components/final/IncidentReport.jsx';
import { useGame } from '../hooks/useGame.js';
import { useFeedbackQueue } from '../hooks/useFeedbackQueue.js';
import { useMotion } from '../hooks/useMotion.js';
import {
  finalSteps,
  FINAL_PER_STEP,
  FINAL_FULL,
} from '../data/final-scenarios.js';
import { getISODefinition } from '../data/iso-definitions.js';
import './FinalInspection.css';

function FinalInspection() {
  const {
    state,
    isZoneUnlocked,
    completeZone,
    recordWrong,
    addOraclePoints,
  } = useGame();
  const feedback = useFeedbackQueue();

  const [stepIdx, setStepIdx] = useState(0);
  const [choice, setChoice] = useState(null);
  const [matrixSelected, setMatrixSelected] = useState(() => new Set());
  const [draftTags, setDraftTags] = useState([]);
  const [stepScores, setStepScores] = useState([]);
  const [verdict, setVerdict] = useState(null);   // 'exact' | 'partial' | 'wrong' | null
  const [reportOpen, setReportOpen] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [startTime] = useState(() => Date.now());
  const [endTime, setEndTime] = useState(null);

  const step = finalSteps[stepIdx];
  const total = finalSteps.length;

  const headerMotion = useMotion({
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  });

  const reset = useCallback(() => {
    setChoice(null);
    setMatrixSelected(new Set());
    setDraftTags([]);
    setVerdict(null);
  }, []);

  const recordOutcome = useCallback(
    ({ kind, pointsForRow, recordedAnswer }) => {
      setStepScores((prev) => [...prev, kind === 'exact' ? FINAL_PER_STEP : kind === 'partial' ? FINAL_PER_STEP / 2 : 0]);
      setVerdict(kind);

      // Add the points to the corresponding report-row score (capped to 200).
      if (step.concept === 'oracle') {
        if (pointsForRow > 0) addOraclePoints(pointsForRow);
      } else {
        // We bump the existing zone-row score by the per-step value, capped at 200.
        // Final step is 40 points; we add it directly to the row's running score.
        // (state.zoneScores are scoped 0..200 per row.)
        const rowKey = step.concept;
        const current = state.zoneScores[rowKey] ?? 0;
        const target = Math.min(200, current + pointsForRow);
        completeZone(rowKey, target); // COMPLETE_ZONE allows in-place update of row score
      }

      if (kind !== 'exact') {
        const def = getISODefinition(step.isoRef);
        feedback.push({
          isoRef: step.isoRef,
          term: def.term,
          definition: def.definition,
          note: def.note,
          playerAnswer: recordedAnswer,
          explanation: step.feedbackWrong ?? step.feedbackPartial ?? 'Partial answer.',
          headerColor: 'var(--final-color)',
          title: kind === 'wrong' ? 'WRONG ANSWER' : 'PARTIAL ANSWER',
        });
        recordWrong({
          zoneId: 'final-inspection',
          itemId: step.id,
          playerAnswer: recordedAnswer,
          correctAnswer: step.correctKey ?? JSON.stringify(step.correctCells ?? step.correctTags),
          isoRef: step.isoRef,
        });
      }

      setTimeout(() => {
        if (stepIdx + 1 >= total) {
          setCompleted(true);
          setReportOpen(true);
          setEndTime(Date.now());
        } else {
          setStepIdx(stepIdx + 1);
          reset();
        }
      }, 1100);
    },
    [step, stepIdx, total, state, addOraclePoints, completeZone, feedback, recordWrong, reset]
  );

  const submitChoice = useCallback(() => {
    if (verdict || !choice) return;
    if (choice === step.correctKey) {
      recordOutcome({
        kind: 'exact',
        pointsForRow: FINAL_PER_STEP,
        recordedAnswer: `selected ${choice}`,
      });
    } else {
      recordOutcome({
        kind: 'wrong',
        pointsForRow: 0,
        recordedAnswer: `selected ${choice}`,
      });
    }
  }, [verdict, choice, step, recordOutcome]);

  const submitMatrix = useCallback(() => {
    if (verdict || matrixSelected.size === 0) return;
    const correctSet = new Set(step.correctCells.map((c) => cellKey(c.level, c.type)));
    let hits = 0;
    let wrong = 0;
    matrixSelected.forEach((k) => {
      if (correctSet.has(k)) hits += 1;
      else wrong += 1;
    });
    const exact = wrong === 0 && hits === correctSet.size;
    if (exact) {
      recordOutcome({
        kind: 'exact',
        pointsForRow: FINAL_PER_STEP,
        recordedAnswer: Array.from(matrixSelected).join(', '),
      });
    } else if (wrong > 0) {
      recordOutcome({
        kind: 'wrong',
        pointsForRow: 0,
        recordedAnswer: Array.from(matrixSelected).join(', '),
      });
    } else {
      // strict subset
      const partialPts = Math.round((hits / correctSet.size) * FINAL_PER_STEP);
      recordOutcome({
        kind: 'partial',
        pointsForRow: partialPts,
        recordedAnswer: Array.from(matrixSelected).join(', '),
      });
    }
  }, [verdict, matrixSelected, step, recordOutcome]);

  const submitTags = useCallback(() => {
    if (verdict || draftTags.length === 0) return;
    const correctSet = new Set(step.correctTags);
    const draftSet = new Set(draftTags);
    let hits = 0;
    let wrong = 0;
    draftTags.forEach((t) => {
      if (correctSet.has(t)) hits += 1;
      else wrong += 1;
    });
    const missed = step.correctTags.filter((t) => !draftSet.has(t)).length;
    const exact = wrong === 0 && missed === 0;
    if (exact) {
      recordOutcome({
        kind: 'exact',
        pointsForRow: FINAL_PER_STEP,
        recordedAnswer: draftTags.join(', '),
      });
    } else if (wrong > 0) {
      recordOutcome({
        kind: 'wrong',
        pointsForRow: 0,
        recordedAnswer: draftTags.join(', ') || '(none)',
      });
    } else {
      const partialPts = Math.round((hits / step.correctTags.length) * FINAL_PER_STEP);
      recordOutcome({
        kind: 'partial',
        pointsForRow: partialPts,
        recordedAnswer: draftTags.join(', '),
      });
    }
  }, [verdict, draftTags, step, recordOutcome]);

  const onMatrixToggle = useCallback((level, type) => {
    setMatrixSelected((prev) => {
      const next = new Set(prev);
      const k = cellKey(level, type);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }, []);

  // Once all 5 steps done, also dispatch a final-inspection score (avg over steps).
  useEffect(() => {
    if (!completed) return;
    const sum = stepScores.reduce((a, b) => a + b, 0);
    const finalScoreRow = Math.round(Math.min(FINAL_FULL, sum * (FINAL_FULL / (FINAL_PER_STEP * total))));
    completeZone('final-inspection', finalScoreRow);
  }, [completed, stepScores, total, completeZone]);

  if (!isZoneUnlocked('final-inspection')) {
    return <Navigate to="/" replace />;
  }

  const durationMin = endTime
    ? Math.max(1, Math.round((endTime - startTime) / 60000))
    : 0;

  return (
    <ZoneLayout
      zoneId="final-inspection"
      zoneName="Final Inspection"
      zoneColor="var(--final-color)"
      zoneBg="var(--final-bg)"
      subtitle="ISO/IEC/IEEE 29119-1 — integrating all five concept areas + Test Oracle"
      scoreCurrent={state.zoneScores['final-inspection']}
    >
      <motion.section className="final-inspection" {...headerMotion}>
        {!reportOpen ? (
          <>
            <div className="final-inspection__brief">
              <span className="final-inspection__pill">INCIDENT #048 — escalation of #047</span>
              <h2>Five integrated decisions</h2>
              <p>
                Five decisions, one per concept area, taken across the same
                follow-on incident. Each step writes to its corresponding row
                of the ISO Incident Report.
              </p>
              <div className="final-inspection__queue">
                {finalSteps.map((s, i) => (
                  <span
                    key={s.id}
                    className={`final-inspection__queue-dot ${
                      i < stepIdx ? 'is-done' : i === stepIdx ? 'is-active' : ''
                    }`}
                    aria-label={`Step ${i + 1} ${
                      i < stepIdx ? 'done' : i === stepIdx ? 'active' : 'pending'
                    }`}
                  />
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                className="final-inspection__step"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <h3 className="final-inspection__step-title">{step.title}</h3>
                <p className="final-inspection__step-text">{step.text}</p>

                {step.type === 'choice' ? (
                  <div className="final-inspection__choices">
                    {step.options.map((opt) => (
                      <Button
                        key={opt.key}
                        variant={choice === opt.key ? 'primary' : 'secondary'}
                        size="lg"
                        zoneColor="var(--final-color)"
                        disabled={!!verdict}
                        onClick={() => setChoice(opt.key)}
                      >
                        <span className="final-inspection__choice-label">{opt.label}</span>
                        <span className="final-inspection__choice-sub">{opt.sublabel}</span>
                      </Button>
                    ))}
                  </div>
                ) : null}

                {step.type === 'matrix' ? (
                  <div className="final-inspection__matrix">
                    <Matrix
                      selected={matrixSelected}
                      onToggle={onMatrixToggle}
                      disabled={!!verdict}
                    />
                  </div>
                ) : null}

                {step.type === 'tags' ? (
                  <div className="final-inspection__tags">
                    <TagSelector
                      selectedTags={draftTags}
                      onChange={setDraftTags}
                      zoneColor="var(--final-color)"
                      disabled={!!verdict}
                    />
                  </div>
                ) : null}

                <div className="final-inspection__step-actions">
                  {step.type === 'choice' ? (
                    <Button
                      variant="primary"
                      size="lg"
                      zoneColor="var(--final-color)"
                      disabled={!choice || !!verdict}
                      onClick={submitChoice}
                    >
                      Submit decision →
                    </Button>
                  ) : null}
                  {step.type === 'matrix' ? (
                    <Button
                      variant="primary"
                      size="lg"
                      zoneColor="var(--final-color)"
                      disabled={matrixSelected.size === 0 || !!verdict}
                      onClick={submitMatrix}
                    >
                      Submit selection →
                    </Button>
                  ) : null}
                  {step.type === 'tags' ? (
                    <Button
                      variant="primary"
                      size="lg"
                      zoneColor="var(--final-color)"
                      disabled={draftTags.length === 0 || !!verdict}
                      onClick={submitTags}
                    >
                      Submit tags →
                    </Button>
                  ) : null}
                </div>
              </motion.div>
            </AnimatePresence>
          </>
        ) : (
          <IncidentReport durationMin={durationMin} />
        )}
      </motion.section>

      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={feedback.pop}
        headerColor="var(--final-color)"
        {...(feedback.current ?? {})}
      />
    </ZoneLayout>
  );
}

export default FinalInspection;

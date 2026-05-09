import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import ZoneLayout from '../components/shared/ZoneLayout.jsx';
import FeedbackModal from '../components/shared/FeedbackModal.jsx';
import ConceptPrimer from '../components/shared/ConceptPrimer.jsx';
import Button from '../components/shared/Button.jsx';
import IncidentCard from '../components/zone1/IncidentCard.jsx';
import DropColumn from '../components/zone1/DropColumn.jsx';
import CausalChain from '../components/zone1/CausalChain.jsx';
import { useGame } from '../hooks/useGame.js';
import { useFeedbackQueue } from '../hooks/useFeedbackQueue.js';
import { useMotion } from '../hooks/useMotion.js';
import { getZoneSkipTarget } from '../context/zoneNavigation.js';
import {
  zone1Scenarios,
  COLUMN_DEFS,
  ZONE1_FULL_SCORE,
  ZONE1_PER_ITEM,
} from '../data/zone1-scenarios.js';
import { getISODefinition } from '../data/iso-definitions.js';
import { getConceptPrimer } from '../data/concept-primers.js';
import './ErrorDistrict.css';

const ZONE_ID = 'error-district';
const ZONE_COLOR = 'var(--zone1-color)';
const SKIP_TARGET = getZoneSkipTarget(ZONE_ID);

function ErrorDistrict() {
  const navigate = useNavigate();
  const { state, isZoneUnlocked, completeZone, recordWrong, hasSeenPrimer, markPrimerSeen, skipAllPrimers } = useGame();
  const feedback = useFeedbackQueue();
  const primer = getConceptPrimer(ZONE_ID);
  const [primerOpen, setPrimerOpen] = useState(() => !hasSeenPrimer(ZONE_ID));

  // Per-item state: 'pool' (in source deck), 'placed' (locked into column), 'none' (intermediate)
  // wrongCount: how many incorrect first-try drops the player has burned on this item
  const [items, setItems] = useState(() =>
    zone1Scenarios.map((s) => ({
      id: s.id,
      placedIn: null,           // null while in pool; column id once placed correctly
      wrongDrops: 0,
    }))
  );
  const [shakeId, setShakeId] = useState(null);
  const [flashColumn, setFlashColumn] = useState(null);
  const isReview = state.completedZones.has('error-district');
  const [zoneScore, setZoneScore] = useState(isReview ? state.zoneScores['error-district'] : null);
  const [completed, setCompleted] = useState(isReview);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor)
  );

  const headerMotion = useMotion({
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: 'easeOut' },
  });
  const successMotion = useMotion({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, delay: 0.45 },
  });

  const placedCount = items.filter((i) => i.placedIn).length;
  const remainingCount = zone1Scenarios.length - placedCount;

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      if (!over) return; // released over nothing — snap-back is automatic
      if (completed) return;

      const scenario = zone1Scenarios.find((s) => s.id === active.id);
      const item = items.find((i) => i.id === active.id);
      if (!scenario || !item || item.placedIn) return;

      const targetColumn = over.id;
      const isCorrect = scenario.correctColumn === targetColumn;

      if (isCorrect) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === active.id ? { ...i, placedIn: targetColumn } : i
          )
        );
        setFlashColumn(`${targetColumn}-${Date.now()}`);
      } else {
        // Wrong drop: card stays in source, shake + feedback
        setItems((prev) =>
          prev.map((i) =>
            i.id === active.id ? { ...i, wrongDrops: i.wrongDrops + 1 } : i
          )
        );
        setShakeId(active.id);
        setTimeout(() => setShakeId(null), 240);

        const def = getISODefinition(scenario.isoRef);
        feedback.push({
          isoRef: scenario.isoRef,
          term: def.term,
          definition: def.definition,
          note: def.note,
          playerAnswer: `dropped into "${COLUMN_DEFS.find((c) => c.id === targetColumn)?.label ?? targetColumn}"`,
          explanation: scenario.feedbackWrong,
          headerColor: 'var(--zone1-color)',
        });
        recordWrong({
          zoneId: 'error-district',
          itemId: scenario.id,
          playerAnswer: targetColumn,
          correctAnswer: scenario.correctColumn,
          isoRef: scenario.isoRef,
        });
      }
    },
    [items, completed, feedback, recordWrong]
  );

  // When all 5 placed, compute score and dispatch
  const allPlaced = placedCount === zone1Scenarios.length;
  useEffect(() => {
    if (!allPlaced || completed) return;
    const score = items.reduce((acc, i) => {
      const itemScore = Math.max(0, ZONE1_PER_ITEM - i.wrongDrops * ZONE1_PER_ITEM);
      return acc + itemScore;
    }, 0);
    const final = Math.min(ZONE1_FULL_SCORE, score);
    setZoneScore(final);
    setCompleted(true);
    completeZone('error-district', final);
  }, [allPlaced, completed, items, completeZone]);

  const cardsByColumn = useMemo(() => {
    const map = { error: [], fault: [], failure: [] };
    items.forEach((i) => {
      if (i.placedIn) {
        const scenario = zone1Scenarios.find((s) => s.id === i.id);
        if (scenario) map[i.placedIn].push(scenario);
      }
    });
    return map;
  }, [items]);

  const handlePrimerBegin = useCallback(() => {
    markPrimerSeen(ZONE_ID);
    setPrimerOpen(false);
  }, [markPrimerSeen]);

  const handleSkipAll = useCallback(() => {
    skipAllPrimers();
    setPrimerOpen(false);
  }, [skipAllPrimers]);

  const handleSkipZone = useCallback(() => {
    if (!SKIP_TARGET) return;
    if (!state.completedZones.has(ZONE_ID)) {
      completeZone(ZONE_ID, 0);
    }
    navigate(SKIP_TARGET.route);
  }, [completeZone, navigate, state.completedZones]);

  // Route guard
  if (!isZoneUnlocked('error-district')) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
    <ConceptPrimer
      isOpen={primerOpen}
      primer={primer}
      zoneColor={ZONE_COLOR}
      onBegin={handlePrimerBegin}
      onSkipAll={handleSkipAll}
      skipZoneLabel={SKIP_TARGET?.label}
      onSkipZone={handleSkipZone}
    />
    <ZoneLayout
      zoneId="error-district"
      zoneName="Zone 1 — Error District"
      zoneColor="var(--zone1-color)"
      zoneBg="var(--zone1-bg)"
      subtitle="ISO/IEC/IEEE 29119-1 — §3.39, §3.40, §4.7"
      scoreCurrent={state.zoneScores['error-district']}
      reviewMode={state.completedZones.has('error-district')}
      skipLabel={SKIP_TARGET?.label}
      onSkipZone={handleSkipZone}
    >
      <motion.section className="error-district" {...headerMotion}>
        <div className="error-district__brief">
          <h2>Production incident #047 — classify each item from the report</h2>
          <p>
            Your monitoring just flooded with logs, dev notes, and a customer
            ticket. Sort each item along the causal chain. Drop a card into the
            column that names <em>what kind of thing it is</em> — not which
            tag it carries.
          </p>
        </div>

        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="error-district__board">
            <div className="error-district__pool">
              <div className="error-district__pool-header">
                <strong>Incident items</strong>
                <span>
                  {remainingCount} of {zone1Scenarios.length} left
                </span>
              </div>
              <div className="error-district__pool-items">
                {items
                  .filter((i) => !i.placedIn)
                  .map((i) => {
                    const scenario = zone1Scenarios.find((s) => s.id === i.id);
                    if (!scenario) return null;
                    return (
                      <IncidentCard
                        key={scenario.id}
                        id={scenario.id}
                        text={scenario.text}
                        tag={scenario.tag}
                        shake={shakeId === scenario.id}
                      />
                    );
                  })}
                {remainingCount === 0 ? (
                  <p className="error-district__pool-empty">
                    All five items classified.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="error-district__columns">
              {COLUMN_DEFS.map((col) => (
                <DropColumn
                  key={col.id}
                  id={col.id}
                  label={col.label}
                  sublabel={col.sublabel}
                  clauseRef={col.clauseRef}
                  blurb={col.blurb}
                  flashKey={
                    flashColumn && flashColumn.startsWith(col.id)
                      ? flashColumn
                      : null
                  }
                >
                  {cardsByColumn[col.id].map((scenario) => (
                    <IncidentCard
                      key={scenario.id}
                      id={scenario.id}
                      text={scenario.text}
                      tag={scenario.tag}
                      locked
                    />
                  ))}
                  {cardsByColumn[col.id].length === 0 ? (
                    <p className="error-district__empty">
                      Drop items here.
                    </p>
                  ) : null}
                </DropColumn>
              ))}
            </div>
          </div>
        </DndContext>

        <AnimatePresence>
          {completed ? (
            <motion.div className="error-district__success" {...successMotion}>
              <CausalChain />
              <div className="error-district__success-actions">
                <p className="error-district__success-line">
                  Zone 1 complete — <strong>{zoneScore} / 200</strong>
                  {zoneScore === ZONE1_FULL_SCORE
                    ? ' (perfect run)'
                    : ' (penalty applied for incorrect drops)'}
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  zoneColor="var(--zone1-color)"
                  onClick={() => navigate('/zone/vv-headquarters')}
                >
                  Continue → Zone 2
                </Button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.section>

      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={feedback.pop}
        headerColor="var(--zone1-color)"
        {...(feedback.current ?? {})}
      />
    </ZoneLayout>
    </>
  );
}

export default ErrorDistrict;

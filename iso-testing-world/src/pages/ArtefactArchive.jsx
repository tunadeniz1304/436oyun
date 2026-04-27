import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ZoneLayout from '../components/shared/ZoneLayout.jsx';
import FeedbackModal from '../components/shared/FeedbackModal.jsx';
import Button from '../components/shared/Button.jsx';
import TagSelector from '../components/shared/TagSelector.jsx';
import FileExplorer from '../components/zone4/FileExplorer.jsx';
import Note1Callout from '../components/zone4/Note1Callout.jsx';
import DependencyMap from '../components/zone4/DependencyMap.jsx';
import { useGame } from '../hooks/useGame.js';
import { useFeedbackQueue } from '../hooks/useFeedbackQueue.js';
import { useMotion } from '../hooks/useMotion.js';
import {
  zone4Artefacts,
  ZONE4_FULL_SCORE,
  ZONE4_PER_ARTEFACT,
  ZONE4_HALF,
} from '../data/zone4-artefacts.js';
import { getISODefinition } from '../data/iso-definitions.js';
import './ArtefactArchive.css';

function evaluateTags(artefact, picked) {
  const correct = artefact.correctTags;
  const correctSet = new Set(correct);
  const pickedSet = new Set(picked);

  const hits = picked.filter((t) => correctSet.has(t)).length;
  const wrong = picked.filter((t) => !correctSet.has(t)).length;
  const missed = correct.filter((t) => !pickedSet.has(t)).length;

  // Empty-correct case: success only if also empty
  if (correct.length === 0) {
    if (picked.length === 0) {
      return { kind: 'exact', score: ZONE4_PER_ARTEFACT };
    }
    return { kind: 'wrong', score: ZONE4_HALF, wrong, missed: 0 };
  }

  if (wrong === 0 && missed === 0) {
    return { kind: 'exact', score: ZONE4_PER_ARTEFACT };
  }
  if (wrong > 0) {
    return { kind: 'wrong', score: ZONE4_HALF, wrong, missed };
  }
  // strict subset (some hits, no wrong)
  return {
    kind: 'partial',
    score: (hits / correct.length) * ZONE4_PER_ARTEFACT,
    wrong: 0,
    missed,
  };
}

function ArtefactArchive() {
  const navigate = useNavigate();
  const { state, isZoneUnlocked, completeZone, recordWrong } = useGame();
  const feedback = useFeedbackQueue();

  const [selectedId, setSelectedId] = useState(zone4Artefacts[0].id);
  const [draftTags, setDraftTags] = useState({}); // id → string[]
  const [confirmedById, setConfirmedById] = useState({}); // id → 'exact' | 'partial' | 'wrong'
  const [scoresById, setScoresById] = useState({});
  const [note1Open, setNote1Open] = useState(false);
  const [note1ShownFor, setNote1ShownFor] = useState(null); // tracks which artefact triggered it
  const [completed, setCompleted] = useState(false);

  const artefact = zone4Artefacts.find((a) => a.id === selectedId);

  const headerMotion = useMotion({
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  });
  const panelMotion = useMotion({
    initial: { opacity: 0, x: 6 },
    animate: { opacity: 1, x: 0 },
    exit:    { opacity: 0, x: -6 },
    transition: { duration: 0.2 },
  });

  const currentTags = draftTags[selectedId] ?? [];
  const isConfirmed = !!confirmedById[selectedId];
  const isTrap = artefact.trap;

  const tagsMissingBasis =
    isTrap &&
    !currentTags.includes('basis');

  const handleConfirm = useCallback(() => {
    if (isConfirmed) return;

    // Trap gate: verbal_agreement must be tagged with `basis`. If not, fire
    // the §3.84 Note 1 callout BEFORE running the evaluation. Only fires once.
    if (
      isTrap &&
      tagsMissingBasis &&
      note1ShownFor !== artefact.id
    ) {
      setNote1Open(true);
      setNote1ShownFor(artefact.id);
      return;
    }

    const result = evaluateTags(artefact, currentTags);
    setScoresById((prev) => ({ ...prev, [artefact.id]: result.score }));
    setConfirmedById((prev) => ({ ...prev, [artefact.id]: result.kind }));

    if (result.kind !== 'exact') {
      const def = getISODefinition(artefact.isoRef);
      feedback.push({
        isoRef: artefact.isoRef,
        term: def.term,
        definition: def.definition,
        note: def.note,
        playerAnswer:
          currentTags.length === 0
            ? 'left untagged'
            : `tagged: ${currentTags.join(', ')}`,
        explanation: artefact.feedbackWrong,
        title: result.kind === 'wrong' ? 'WRONG TAGS' : 'PARTIAL TAGS',
        headerColor: 'var(--zone4-color)',
      });
      recordWrong({
        zoneId: 'artefact-archive',
        itemId: artefact.id,
        playerAnswer: currentTags.join(',') || '(none)',
        correctAnswer: artefact.correctTags.join(',') || '(none)',
        isoRef: artefact.isoRef,
      });
    }

    // Auto-advance to next unconfirmed
    const nextUnconfirmed = zone4Artefacts.find(
      (a) => a.id !== artefact.id && !confirmedById[a.id]
    );
    if (nextUnconfirmed) {
      setTimeout(() => setSelectedId(nextUnconfirmed.id), 700);
    }
  }, [
    isConfirmed,
    isTrap,
    tagsMissingBasis,
    note1ShownFor,
    artefact,
    currentTags,
    confirmedById,
    feedback,
    recordWrong,
  ]);

  const handleSkipNoRole = useCallback(() => {
    if (isConfirmed) return;
    // explicit "no role" — set tags to empty and confirm
    setDraftTags((prev) => ({ ...prev, [artefact.id]: [] }));
    const result = evaluateTags({ ...artefact }, []);
    setScoresById((prev) => ({ ...prev, [artefact.id]: result.score }));
    setConfirmedById((prev) => ({ ...prev, [artefact.id]: result.kind }));
    if (result.kind !== 'exact') {
      const def = getISODefinition(artefact.isoRef);
      feedback.push({
        isoRef: artefact.isoRef,
        term: def.term,
        definition: def.definition,
        note: def.note,
        playerAnswer: 'skipped — no role',
        explanation: artefact.feedbackWrong,
        title: 'WRONG SKIP',
        headerColor: 'var(--zone4-color)',
      });
      recordWrong({
        zoneId: 'artefact-archive',
        itemId: artefact.id,
        playerAnswer: 'skip',
        correctAnswer: artefact.correctTags.join(',') || '(none)',
        isoRef: artefact.isoRef,
      });
    }
    const nextUnconfirmed = zone4Artefacts.find(
      (a) => a.id !== artefact.id && !confirmedById[a.id]
    );
    if (nextUnconfirmed) {
      setTimeout(() => setSelectedId(nextUnconfirmed.id), 700);
    }
  }, [isConfirmed, artefact, confirmedById, feedback, recordWrong]);

  const completedCount = Object.keys(confirmedById).length;
  const allDone = completedCount === zone4Artefacts.length;

  useEffect(() => {
    if (allDone && !completed) {
      const total = Object.values(scoresById).reduce((a, b) => a + b, 0);
      setCompleted(true);
      completeZone('artefact-archive', Math.round(Math.min(ZONE4_FULL_SCORE, total)));
    }
  }, [allDone, completed, scoresById, completeZone]);

  if (!isZoneUnlocked('artefact-archive')) {
    return <Navigate to="/" replace />;
  }

  return (
    <ZoneLayout
      zoneId="artefact-archive"
      zoneName="Zone 4 — Artefact Archive"
      zoneColor="var(--zone4-color)"
      zoneBg="var(--zone4-bg)"
      subtitle="ISO/IEC/IEEE 29119-1 — §3.84, §3.107, §3.78, §3.29"
      scoreCurrent={state.zoneScores['artefact-archive']}
    >
      <motion.section className="artefact-archive" {...headerMotion}>
        <div className="artefact-archive__brief">
          <h2>Tag each artefact's role in the test process</h2>
          <p>
            Six items recovered from the project workspace. For each, decide
            which role(s) it plays — Test Basis, Test Item / Test Object,
            Static Testing, Dynamic Testing — or skip if it fits none of those
            four roles.
          </p>
          <div className="artefact-archive__progress">
            <strong>{completedCount}</strong> of {zone4Artefacts.length} tagged
          </div>
        </div>

        <div className="artefact-archive__board">
          <FileExplorer
            artefacts={zone4Artefacts}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id)}
            statusById={confirmedById}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedId}
              className="artefact-archive__detail"
              {...panelMotion}
            >
              <header className="artefact-archive__detail-head">
                <code className="artefact-archive__detail-name">
                  {artefact.name}
                </code>
                {isConfirmed ? (
                  <span
                    className={`artefact-archive__verdict artefact-archive__verdict--${confirmedById[selectedId]}`}
                  >
                    {confirmedById[selectedId] === 'exact'
                      ? 'Exact'
                      : confirmedById[selectedId] === 'partial'
                      ? 'Partial'
                      : 'Wrong'}
                  </span>
                ) : null}
              </header>
              <p className="artefact-archive__detail-desc">{artefact.description}</p>

              <div className="artefact-archive__tags">
                <span className="artefact-archive__tags-label">
                  Apply role tag(s):
                </span>
                <TagSelector
                  selectedTags={currentTags}
                  onChange={(next) =>
                    setDraftTags((prev) => ({ ...prev, [artefact.id]: next }))
                  }
                  zoneColor="var(--zone4-color)"
                  disabled={isConfirmed}
                />
              </div>

              <div className="artefact-archive__detail-actions">
                <Button
                  variant="ghost"
                  size="sm"
                  zoneColor="var(--zone4-color)"
                  disabled={isConfirmed}
                  onClick={handleSkipNoRole}
                >
                  Skip — no role
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  zoneColor="var(--zone4-color)"
                  disabled={isConfirmed || currentTags.length === 0}
                  onClick={handleConfirm}
                >
                  Confirm tags →
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {completed ? (
          <>
            <DependencyMap />
            <div className="artefact-archive__continue">
              <p>
                Zone 4 complete — final score{' '}
                <strong>
                  {Math.round(Object.values(scoresById).reduce((a, b) => a + b, 0))} / {ZONE4_FULL_SCORE}
                </strong>
              </p>
              <Button
                variant="primary"
                size="lg"
                zoneColor="var(--zone4-color)"
                onClick={() => navigate('/final-inspection')}
              >
                Continue → Final Inspection
              </Button>
            </div>
          </>
        ) : null}
      </motion.section>

      <Note1Callout open={note1Open} onClose={() => setNote1Open(false)} />
      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={feedback.pop}
        headerColor="var(--zone4-color)"
        {...(feedback.current ?? {})}
      />
    </ZoneLayout>
  );
}

export default ArtefactArchive;

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ZoneLayout from '../components/shared/ZoneLayout.jsx';
import FeedbackModal from '../components/shared/FeedbackModal.jsx';
import Button from '../components/shared/Button.jsx';
import MissionCard from '../components/zone2/MissionCard.jsx';
import RoutingButtons from '../components/zone2/RoutingButtons.jsx';
import JustificationField, { countWords, MIN_WORDS } from '../components/zone2/JustificationField.jsx';
import TimerRing from '../components/zone2/TimerRing.jsx';
import OraclePrompt from '../components/zone2/OraclePrompt.jsx';
import { useGame } from '../hooks/useGame.js';
import { useFeedbackQueue } from '../hooks/useFeedbackQueue.js';
import { useTimer } from '../hooks/useTimer.js';
import { useMotion } from '../hooks/useMotion.js';
import {
  zone2Missions,
  ZONE2_FULL_SCORE,
  ZONE2_PER_MISSION,
  ORACLE_FULL_POINTS,
} from '../data/zone2-missions.js';
import { getISODefinition } from '../data/iso-definitions.js';
import './VVHeadquarters.css';

const TIMER_SECONDS = 30;
const ROUTING_LABEL = {
  verification: 'VERIFICATION',
  validation: 'VALIDATION',
  both: 'BOTH',
};

function VVHeadquarters() {
  const navigate = useNavigate();
  const { state, isZoneUnlocked, completeZone, recordWrong, addOraclePoints } = useGame();
  const {
    current: feedbackCurrent,
    isOpen: feedbackIsOpen,
    push: pushFeedback,
    pop: popFeedback,
  } = useFeedbackQueue();

  const [idx, setIdx] = useState(0);
  const [tentative, setTentative] = useState(null);  // 'verification' | 'validation' | 'both' | null
  const [justification, setJustification] = useState('');
  const [missionScores, setMissionScores] = useState([]);   // numeric per mission (filled left to right)
  const [flash, setFlash] = useState(null);                  // 'correct' | 'wrong'
  const [oracleAnswered, setOracleAnswered] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [oracleAwarded, setOracleAwarded] = useState(false);
  const advanceTimerRef = useRef(null);

  const mission = zone2Missions[idx];
  const total = zone2Missions.length;
  const finishedMissions = idx >= total;
  const showingComplete = completed || finishedMissions;
  const showOracle = !!mission?.oraclePromptHere;

  const { remaining, reset: resetTimer } = useTimer({
    initial: TIMER_SECONDS,
    paused: feedbackIsOpen || showingComplete || flash === 'correct' || flash === 'wrong',
    onExpire: () => handleTimeout(),
  });

  const headerMotion = useMotion({
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  });

  const advanceToNext = useCallback(() => {
    setFlash(null);
    setTentative(null);
    setJustification('');
    setOracleAnswered(null);
    setOracleAwarded(false);
    setIdx((prev) => Math.min(prev + 1, total));
    resetTimer(TIMER_SECONDS);
  }, [resetTimer, total]);

  // schedule advance after success/wrong flash + feedback dismissal
  const scheduleAdvance = useCallback(() => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(advanceToNext, 600);
  }, [advanceToNext]);

  useEffect(() => () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
  }, []);

  // Once feedback queue is empty AND flash is 'wrong', advance
  useEffect(() => {
    if (flash === 'wrong' && !feedbackIsOpen) {
      scheduleAdvance();
    }
  }, [flash, feedbackIsOpen, scheduleAdvance]);

  const commitWrongAnswer = useCallback(({ playerAnswer, recordedAnswer }) => {
    if (!mission) return;
    const def = getISODefinition(mission.isoRef);
    pushFeedback({
      isoRef: mission.isoRef,
      term: def.term,
      definition: def.definition,
      note: def.note,
      playerAnswer,
      explanation: mission.feedbackWrong,
      headerColor: 'var(--zone2-color)',
    });
    recordWrong({
      zoneId: 'vv-headquarters',
      itemId: mission.id,
      playerAnswer: recordedAnswer,
      correctAnswer: mission.correctRouting,
      isoRef: mission.isoRef,
    });
    setMissionScores((prev) => [...prev, 0]);
    setFlash('wrong');
  }, [mission, pushFeedback, recordWrong]);

  const commitCorrectAnswer = useCallback((score) => {
    setMissionScores((prev) => [...prev, score]);
    setFlash('correct');
    scheduleAdvance();
  }, [scheduleAdvance]);

  const handleSelectRouting = useCallback(
    (key) => {
      if (showingComplete || flash || !mission) return;
      if (key === 'both') {
        setTentative('both');
        return;
      }
      // immediate v/v decision
      if (key === mission.correctRouting) {
        commitCorrectAnswer(ZONE2_PER_MISSION);
      } else {
        commitWrongAnswer({
          playerAnswer: `routed as ${ROUTING_LABEL[key]}`,
          recordedAnswer: key,
        });
      }
    },
    [showingComplete, flash, mission, commitCorrectAnswer, commitWrongAnswer]
  );

  const handleSubmitBoth = useCallback(() => {
    if (!mission) return;
    if (countWords(justification) < MIN_WORDS) return;
    if (mission.correctRouting === 'both') {
      // valid justification = full points
      commitCorrectAnswer(ZONE2_PER_MISSION);
    } else if (justification && countWords(justification) >= MIN_WORDS) {
      // wrong "both" but justified — still wrong, but record the prose
      commitWrongAnswer({
        playerAnswer: `routed as BOTH — "${justification}"`,
        recordedAnswer: `both:${justification}`,
      });
    }
  }, [justification, mission, commitCorrectAnswer, commitWrongAnswer]);

  const handleCancelBoth = useCallback(() => {
    setTentative(null);
    setJustification('');
  }, []);

  function handleTimeout() {
    if (showingComplete || flash) return;
    if (!mission) return;
    commitWrongAnswer({
      playerAnswer: 'no answer — timer expired',
      recordedAnswer: 'no-answer-timeout',
    });
  }

  const handleOracleChoose = useCallback(
    (choice) => {
      if (oracleAnswered || oracleAwarded) return;
      setOracleAnswered(choice);
      if (choice === 'both') {
        addOraclePoints(ORACLE_FULL_POINTS);
        setOracleAwarded(true);
      } else {
        recordWrong({
          zoneId: 'vv-headquarters',
          itemId: `${mission.id}-oracle`,
          playerAnswer: choice,
          correctAnswer: 'both',
          isoRef: '§3.115',
        });
      }
    },
    [oracleAnswered, oracleAwarded, addOraclePoints, recordWrong, mission]
  );

  // Completion
  useEffect(() => {
    if (finishedMissions && !completed) {
      const sum = missionScores.reduce((a, b) => a + b, 0);
      const final = Math.min(ZONE2_FULL_SCORE, sum);
      setCompleted(true);
      completeZone('vv-headquarters', final);
    }
  }, [finishedMissions, completed, missionScores, completeZone]);

  // Route guard
  if (!isZoneUnlocked('vv-headquarters')) {
    return <Navigate to="/" replace />;
  }

  const finalScore = Math.min(ZONE2_FULL_SCORE, missionScores.reduce((a, b) => a + b, 0));
  const completionRecorded = state.completedZones.has('vv-headquarters');

  return (
    <ZoneLayout
      zoneId="vv-headquarters"
      zoneName="Zone 2 — V&V Headquarters"
      zoneColor="var(--zone2-color)"
      zoneBg="var(--zone2-bg)"
      subtitle="ISO/IEC/IEEE 29119-1 — §4.1.3 (and §3.115 oracle prompt)"
      scoreCurrent={state.zoneScores['vv-headquarters']}
    >
      <motion.section className="vv-hq" {...headerMotion}>
        {!showingComplete ? (
          <>
            <div className="vv-hq__topbar">
              <div className="vv-hq__queue">
                {Array.from({ length: total }).map((_, i) => (
                  <span
                    key={i}
                    className={`vv-hq__queue-dot ${
                      i < idx ? 'is-done' : i === idx ? 'is-active' : ''
                    }`}
                    aria-label={`Mission ${i + 1} ${i < idx ? 'done' : i === idx ? 'active' : 'pending'}`}
                  />
                ))}
              </div>
              <div className="vv-hq__timer">
                <span className="vv-hq__timer-label">Time</span>
                <TimerRing remaining={remaining} total={TIMER_SECONDS} />
              </div>
            </div>

            <div className="vv-hq__layout">
              <div className="vv-hq__main">
                <AnimatePresence mode="wait">
                  <MissionCard
                    key={mission.id}
                    index={idx}
                    total={total}
                    mission={mission}
                    flash={flash}
                  />
                </AnimatePresence>

                <RoutingButtons
                  onSelect={handleSelectRouting}
                  selected={tentative}
                  disabled={!!flash}
                />

                <JustificationField
                  visible={tentative === 'both'}
                  value={justification}
                  onChange={setJustification}
                  onSubmit={handleSubmitBoth}
                  onCancel={handleCancelBoth}
                />
              </div>

              {showOracle ? (
                <OraclePrompt
                  open={showOracle}
                  answered={oracleAnswered}
                  onChoose={handleOracleChoose}
                />
              ) : null}
            </div>
          </>
        ) : (
          <div className="vv-hq__complete">
            <h2>Zone 2 complete</h2>
            <p>
              Final routing score: <strong>{finalScore} / {ZONE2_FULL_SCORE}</strong>.
              Test-Oracle points so far: <strong>{state.zoneScores.oracle} / 200</strong>.
            </p>
            <Button
              variant="primary"
              size="lg"
              zoneColor="var(--zone2-color)"
              disabled={!completionRecorded}
              onClick={() => navigate('/zone/matrix-tower')}
            >
              Continue → Zone 3
            </Button>
          </div>
        )}
      </motion.section>

      <FeedbackModal
        isOpen={feedbackIsOpen}
        onClose={popFeedback}
        headerColor="var(--zone2-color)"
        {...(feedbackCurrent ?? {})}
      />
    </ZoneLayout>
  );
}

export default VVHeadquarters;

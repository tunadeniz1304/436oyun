import { normalizeScore, recomputeTotal } from './scoreUtils.js';

function arrayToSet(value) {
  return new Set(Array.isArray(value) ? value : []);
}

function hydrateHints(baseHints, savedHints = {}) {
  return Object.fromEntries(
    Object.entries(baseHints ?? {}).map(([zoneId, hints]) => [
      zoneId,
      arrayToSet(savedHints[zoneId] ?? Array.from(hints ?? [])),
    ])
  );
}

export function sessionToGameState(session, baseState) {
  const zoneScores = Object.fromEntries(
    Object.entries({
      ...baseState.zoneScores,
      ...(session.zoneScores ?? {}),
    }).map(([zoneId, score]) => [zoneId, normalizeScore(score)])
  );

  return {
    ...baseState,
    completedZones: arrayToSet(session.completedZones),
    zoneScores,
    totalScore: normalizeScore(session.totalScore ?? recomputeTotal(zoneScores)),
    wrongAnswers: session.wrongAnswers ?? baseState.wrongAnswers,
    sessionStarted: true,
    primersSeen: arrayToSet(session.primersSeen),
    hintsUsed: hydrateHints(baseState.hintsUsed, session.hintsUsed),
  };
}

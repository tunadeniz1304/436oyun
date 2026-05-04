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
  return {
    ...baseState,
    completedZones: arrayToSet(session.completedZones),
    zoneScores: {
      ...baseState.zoneScores,
      ...(session.zoneScores ?? {}),
    },
    totalScore: session.totalScore ?? baseState.totalScore,
    wrongAnswers: session.wrongAnswers ?? baseState.wrongAnswers,
    sessionStarted: true,
    primersSeen: arrayToSet(session.primersSeen),
    hintsUsed: hydrateHints(baseState.hintsUsed, session.hintsUsed),
  };
}

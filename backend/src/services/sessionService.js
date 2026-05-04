function ok(data) {
  return { ok: true, data };
}

function fail(status, error) {
  return { ok: false, status, error };
}

function notFound() {
  return fail(404, 'Session not found');
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function isScore(value) {
  return Number.isInteger(value) && value >= 0 && value <= 200;
}

function validateProgress(payload) {
  if (!Array.isArray(payload.completedZones)) {
    return 'completedZones must be an array';
  }
  if (!isPlainObject(payload.zoneScores)) {
    return 'zoneScores must be an object';
  }
  if (!isNonNegativeInteger(payload.totalScore)) {
    return 'totalScore must be a non-negative integer';
  }
  if (!Array.isArray(payload.primersSeen)) {
    return 'primersSeen must be an array';
  }
  if (!isPlainObject(payload.hintsUsed)) {
    return 'hintsUsed must be an object';
  }
  return null;
}

function validateWrongAnswer(payload) {
  for (const key of ['zoneId', 'itemId', 'playerAnswer', 'correctAnswer', 'isoRef']) {
    if (!isString(payload[key])) {
      return `${key} must be a non-empty string`;
    }
  }
  return null;
}

function validateZoneCompletion(payload) {
  if (!isString(payload.zoneId)) {
    return 'zoneId must be a non-empty string';
  }
  if (!isScore(payload.score)) {
    return 'score must be an integer between 0 and 200';
  }
  if (payload.wrongCount !== undefined && !isNonNegativeInteger(payload.wrongCount)) {
    return 'wrongCount must be a non-negative integer';
  }
  if (payload.hintsUsedCount !== undefined && !isNonNegativeInteger(payload.hintsUsedCount)) {
    return 'hintsUsedCount must be a non-negative integer';
  }
  return null;
}

export async function createSession(repository, payload) {
  if (payload.playerName !== undefined && typeof payload.playerName !== 'string') {
    return fail(400, 'playerName must be a string');
  }
  const session = await repository.createSession({
    playerName: payload.playerName?.trim() || null,
  });
  return ok(session);
}

export async function getSession(repository, sessionId) {
  const session = await repository.getSession(sessionId);
  if (!session) return notFound();
  return ok(session);
}

export async function saveProgress(repository, sessionId, payload) {
  const validationError = validateProgress(payload);
  if (validationError) return fail(400, validationError);

  const session = await repository.saveProgress(sessionId, {
    completedZones: payload.completedZones,
    zoneScores: payload.zoneScores,
    totalScore: payload.totalScore,
    primersSeen: payload.primersSeen,
    hintsUsed: payload.hintsUsed,
  });

  if (!session) return notFound();
  return ok(session);
}

export async function recordWrongAnswer(repository, sessionId, payload) {
  const validationError = validateWrongAnswer(payload);
  if (validationError) return fail(400, validationError);

  const wrongAnswer = await repository.recordWrongAnswer(sessionId, {
    zoneId: payload.zoneId,
    itemId: payload.itemId,
    playerAnswer: payload.playerAnswer,
    correctAnswer: payload.correctAnswer,
    isoRef: payload.isoRef,
  });

  if (!wrongAnswer) return notFound();
  return ok(wrongAnswer);
}

export async function completeZone(repository, sessionId, payload) {
  const validationError = validateZoneCompletion(payload);
  if (validationError) return fail(400, validationError);

  const session = await repository.completeZone(sessionId, {
    zoneId: payload.zoneId,
    score: payload.score,
    wrongCount: payload.wrongCount ?? 0,
    hintsUsedCount: payload.hintsUsedCount ?? 0,
  });

  if (!session) return notFound();
  return ok(session);
}

export async function getReport(repository, sessionId) {
  const session = await repository.getSession(sessionId);
  if (!session) return notFound();
  return ok({
    sessionId: session.sessionId,
    totalScore: session.totalScore,
    zoneScores: session.zoneScores,
    completedZones: session.completedZones,
    wrongAnswers: session.wrongAnswers,
    zoneAttempts: session.zoneAttempts,
  });
}

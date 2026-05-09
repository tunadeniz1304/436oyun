export function normalizeScore(score) {
  return Math.trunc(score ?? 0);
}

export function recomputeTotal(zoneScores) {
  const total = Object.values(zoneScores).reduce((sum, score) => sum + score, 0);
  return normalizeScore(total);
}

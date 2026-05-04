import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeScore, recomputeTotal } from './scoreUtils.js';
import { sessionToGameState } from './gameStateSerialization.js';

const baseState = {
  completedZones: new Set(),
  zoneScores: {
    'error-district': 0,
    'vv-headquarters': 0,
    'matrix-tower': 0,
    'artefact-archive': 0,
    'final-inspection': 0,
    oracle: 0,
  },
  totalScore: 0,
  wrongAnswers: [],
  sessionStarted: false,
  primersSeen: new Set(),
  skipAllPrimers: false,
  hintsUsed: {
    'error-district': new Set(),
    'vv-headquarters': new Set(),
  },
};

test('sessionToGameState hydrates backend JSON into reducer state', () => {
  const state = sessionToGameState({
    completedZones: ['error-district'],
    zoneScores: { 'error-district': 180 },
    totalScore: 180,
    wrongAnswers: [{ zoneId: 'error-district', itemId: 'z1-s1' }],
    primersSeen: ['error-district'],
    hintsUsed: { 'error-district': ['z1-s2'] },
  }, baseState);

  assert.equal(state.sessionStarted, true);
  assert.equal(state.completedZones.has('error-district'), true);
  assert.equal(state.zoneScores['error-district'], 180);
  assert.equal(state.zoneScores['vv-headquarters'], 0);
  assert.equal(state.primersSeen.has('error-district'), true);
  assert.equal(state.hintsUsed['error-district'].has('z1-s2'), true);
  assert.equal(state.hintsUsed['vv-headquarters'].size, 0);
  assert.equal(state.wrongAnswers.length, 1);
});

test('sessionToGameState drops fractional saved scores', () => {
  const state = sessionToGameState({
    completedZones: ['matrix-tower'],
    zoneScores: { 'matrix-tower': 127.272727272 },
    totalScore: 127.272727272,
  }, baseState);

  assert.equal(state.zoneScores['matrix-tower'], 127);
  assert.equal(state.totalScore, 127);
});

test('recomputeTotal drops fractional score parts', () => {
  const total = recomputeTotal({
    'error-district': 200,
    'vv-headquarters': 180,
    'matrix-tower': 127.272727272,
    'artefact-archive': 173,
    'final-inspection': 200,
  });

  assert.equal(total, 880);
});

test('normalizeScore drops fractional score parts', () => {
  assert.equal(normalizeScore(127.272727272), 127);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGameSessionApi,
  toProgressPayload,
} from './gameSessionApi.js';

function createFetchStub(responses) {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    const response = responses.shift();
    if (!response) throw new Error(`No stubbed response for ${url}`);
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      async json() {
        return response.body;
      },
    };
  };
  fetchImpl.calls = calls;
  return fetchImpl;
}

test('getOrCreateSession reuses the current backend session', async () => {
  const fetchImpl = createFetchStub([
    { status: 200, body: { sessionId: 'session-existing', completedZones: [] } },
  ]);
  const api = createGameSessionApi({ baseUrl: 'http://api.test', fetchImpl });

  const session = await api.getOrCreateSession();

  assert.equal(session.sessionId, 'session-existing');
  assert.equal(fetchImpl.calls.length, 1);
  assert.equal(fetchImpl.calls[0].url, 'http://api.test/api/sessions/current');
  assert.equal(fetchImpl.calls[0].options.credentials, 'include');
});

test('getOrCreateSession creates a session when no current cookie exists', async () => {
  const fetchImpl = createFetchStub([
    { status: 404, body: { error: 'Session not found' } },
    { status: 201, body: { sessionId: 'session-new', completedZones: [] } },
  ]);
  const api = createGameSessionApi({ baseUrl: 'http://api.test', fetchImpl });

  const session = await api.getOrCreateSession();

  assert.equal(session.sessionId, 'session-new');
  assert.equal(fetchImpl.calls.length, 2);
  assert.equal(fetchImpl.calls[1].url, 'http://api.test/api/sessions');
  assert.equal(fetchImpl.calls[1].options.method, 'POST');
});

test('toProgressPayload converts reducer state to backend-safe JSON', () => {
  const payload = toProgressPayload({
    completedZones: new Set(['error-district']),
    zoneScores: { 'error-district': 180, oracle: 20 },
    totalScore: 200,
    primersSeen: new Set(['error-district']),
    hintsUsed: {
      'error-district': new Set(['z1-s2']),
      'vv-headquarters': new Set(),
    },
  });

  assert.deepEqual(payload, {
    completedZones: ['error-district'],
    zoneScores: { 'error-district': 180, oracle: 20 },
    totalScore: 200,
    primersSeen: ['error-district'],
    hintsUsed: {
      'error-district': ['z1-s2'],
      'vv-headquarters': [],
    },
  });
});

test('session api writes progress, wrong answers, and zone completion', async () => {
  const fetchImpl = createFetchStub([
    { status: 200, body: { sessionId: 's1' } },
    { status: 201, body: { id: 'w1' } },
    { status: 200, body: { sessionId: 's1' } },
  ]);
  const api = createGameSessionApi({ baseUrl: 'http://api.test', fetchImpl });

  await api.saveProgress('s1', { completedZones: [], zoneScores: {}, totalScore: 0, primersSeen: [], hintsUsed: {} });
  await api.recordWrongAnswer('s1', {
    zoneId: 'vv-headquarters',
    itemId: 'z2-m1',
    playerAnswer: 'validation',
    correctAnswer: 'verification',
    isoRef: '§4.1.3',
  });
  await api.completeZone('s1', 'matrix-tower', 160);

  assert.equal(fetchImpl.calls[0].url, 'http://api.test/api/sessions/s1/progress');
  assert.equal(fetchImpl.calls[0].options.method, 'PATCH');
  assert.equal(fetchImpl.calls[1].url, 'http://api.test/api/sessions/s1/wrong-answers');
  assert.equal(fetchImpl.calls[1].options.method, 'POST');
  assert.equal(fetchImpl.calls[2].url, 'http://api.test/api/sessions/s1/complete-zone');
  assert.equal(fetchImpl.calls[2].options.method, 'POST');
  assert.equal(fetchImpl.calls[2].options.body, JSON.stringify({ zoneId: 'matrix-tower', score: 160 }));
});

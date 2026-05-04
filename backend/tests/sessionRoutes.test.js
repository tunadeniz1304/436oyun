import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';

function createFakeRepository() {
  const sessions = new Map();
  const wrongAnswers = new Map();
  const attempts = new Map();

  return {
    async createSession({ playerName }) {
      const id = '11111111-1111-4111-8111-111111111111';
      sessions.set(id, {
        sessionId: id,
        playerName: playerName ?? null,
        completedZones: [],
        zoneScores: {},
        totalScore: 0,
        primersSeen: [],
        hintsUsed: {},
        status: 'active',
      });
      wrongAnswers.set(id, []);
      attempts.set(id, []);
      return sessions.get(id);
    },

    async getSession(sessionId) {
      const session = sessions.get(sessionId);
      if (!session) return null;
      return {
        ...session,
        wrongAnswers: wrongAnswers.get(sessionId) ?? [],
        zoneAttempts: attempts.get(sessionId) ?? [],
      };
    },

    async saveProgress(sessionId, progress) {
      const session = sessions.get(sessionId);
      if (!session) return null;
      const next = { ...session, ...progress };
      sessions.set(sessionId, next);
      return this.getSession(sessionId);
    },

    async recordWrongAnswer(sessionId, payload) {
      if (!sessions.has(sessionId)) return null;
      const entry = {
        id: '22222222-2222-4222-8222-222222222222',
        ...payload,
      };
      wrongAnswers.set(sessionId, [...(wrongAnswers.get(sessionId) ?? []), entry]);
      return entry;
    },

    async completeZone(sessionId, payload) {
      const session = sessions.get(sessionId);
      if (!session) return null;
      const existingAttempts = attempts.get(sessionId) ?? [];
      const nextAttempt = {
        zoneId: payload.zoneId,
        score: payload.score,
        wrongCount: payload.wrongCount ?? 0,
        hintsUsedCount: payload.hintsUsedCount ?? 0,
      };
      attempts.set(sessionId, [
        ...existingAttempts.filter((attempt) => attempt.zoneId !== payload.zoneId),
        nextAttempt,
      ]);
      const completedZones = Array.from(new Set([...session.completedZones, payload.zoneId]));
      const zoneScores = { ...session.zoneScores, [payload.zoneId]: payload.score };
      const totalScore = Object.values(zoneScores).reduce((sum, score) => sum + score, 0);
      sessions.set(sessionId, { ...session, completedZones, zoneScores, totalScore });
      return this.getSession(sessionId);
    },
  };
}

test('session routes create and read a game session', async () => {
  const app = createApp({ repository: createFakeRepository() });

  const created = await request(app)
    .post('/api/sessions')
    .send({ playerName: 'Oğuzhan' })
    .expect(201);

  assert.equal(created.body.sessionId, '11111111-1111-4111-8111-111111111111');
  assert.match(created.headers['set-cookie'][0], /iso_session_id=11111111-1111-4111-8111-111111111111/);

  const loaded = await request(app)
    .get(`/api/sessions/${created.body.sessionId}`)
    .expect(200);

  assert.deepEqual(loaded.body.completedZones, []);
  assert.equal(loaded.body.totalScore, 0);
  assert.equal(loaded.body.playerName, 'Oğuzhan');
});

test('session routes read the current session from the session cookie', async () => {
  const app = createApp({ repository: createFakeRepository() });

  await request(app)
    .get('/api/sessions/current')
    .expect(404);

  const created = await request(app)
    .post('/api/sessions')
    .send({})
    .expect(201);

  const loaded = await request(app)
    .get('/api/sessions/current')
    .set('Cookie', created.headers['set-cookie'])
    .expect(200);

  assert.equal(loaded.body.sessionId, created.body.sessionId);
});

test('session routes save progress snapshots', async () => {
  const app = createApp({ repository: createFakeRepository() });
  const { body } = await request(app).post('/api/sessions').send({}).expect(201);

  const saved = await request(app)
    .patch(`/api/sessions/${body.sessionId}/progress`)
    .send({
      completedZones: ['error-district'],
      zoneScores: { 'error-district': 180 },
      totalScore: 180,
      primersSeen: ['error-district'],
      hintsUsed: { 'error-district': ['z1-s2'] },
    })
    .expect(200);

  assert.deepEqual(saved.body.completedZones, ['error-district']);
  assert.equal(saved.body.zoneScores['error-district'], 180);
  assert.deepEqual(saved.body.primersSeen, ['error-district']);
});

test('session routes record wrong answers', async () => {
  const app = createApp({ repository: createFakeRepository() });
  const { body } = await request(app).post('/api/sessions').send({}).expect(201);

  const saved = await request(app)
    .post(`/api/sessions/${body.sessionId}/wrong-answers`)
    .send({
      zoneId: 'vv-headquarters',
      itemId: 'z2-m1',
      playerAnswer: 'validation',
      correctAnswer: 'verification',
      isoRef: '§4.1.3',
    })
    .expect(201);

  assert.equal(saved.body.zoneId, 'vv-headquarters');
  assert.equal(saved.body.isoRef, '§4.1.3');

  const loaded = await request(app).get(`/api/sessions/${body.sessionId}`).expect(200);
  assert.equal(loaded.body.wrongAnswers.length, 1);
});

test('session routes complete zones and expose reports', async () => {
  const app = createApp({ repository: createFakeRepository() });
  const { body } = await request(app).post('/api/sessions').send({}).expect(201);

  const completed = await request(app)
    .post(`/api/sessions/${body.sessionId}/complete-zone`)
    .send({
      zoneId: 'matrix-tower',
      score: 160,
      wrongCount: 1,
      hintsUsedCount: 2,
    })
    .expect(200);

  assert.deepEqual(completed.body.completedZones, ['matrix-tower']);
  assert.equal(completed.body.zoneScores['matrix-tower'], 160);

  const report = await request(app)
    .get(`/api/sessions/${body.sessionId}/report`)
    .expect(200);

  assert.equal(report.body.totalScore, 160);
  assert.equal(report.body.zoneAttempts[0].zoneId, 'matrix-tower');
});

test('session routes reject malformed progress and missing sessions', async () => {
  const app = createApp({ repository: createFakeRepository() });

  await request(app)
    .patch('/api/sessions/11111111-1111-4111-8111-111111111111/progress')
    .send({ completedZones: 'error-district' })
    .expect(400);

  await request(app)
    .get('/api/sessions/99999999-9999-4999-8999-999999999999')
    .expect(404);
});

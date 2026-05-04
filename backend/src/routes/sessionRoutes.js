import { Router } from 'express';
import {
  completeZone,
  createSession,
  getReport,
  getSession,
  recordWrongAnswer,
  saveProgress,
} from '../services/sessionService.js';

const SESSION_COOKIE = 'iso_session_id';

function sendResult(res, result, successStatus = 200) {
  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.status(successStatus).json(result.data);
}

function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;

  return header
    .split(';')
    .map((entry) => entry.trim())
    .map((entry) => entry.split('='))
    .find(([key]) => key === name)?.[1] ?? null;
}

function setSessionCookie(res, sessionId) {
  res.cookie(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}

export function createSessionRouter({ repository }) {
  const router = Router();

  router.post('/', async (req, res, next) => {
    try {
      const result = await createSession(repository, req.body ?? {});
      if (result.ok) {
        setSessionCookie(res, result.data.sessionId);
      }
      sendResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  });

  router.get('/current', async (req, res, next) => {
    try {
      const sessionId = readCookie(req, SESSION_COOKIE);
      if (!sessionId) {
        return res.status(404).json({ error: 'Session not found' });
      }
      const result = await getSession(repository, sessionId);
      sendResult(res, result);
    } catch (error) {
      next(error);
    }
  });

  router.get('/:sessionId', async (req, res, next) => {
    try {
      const result = await getSession(repository, req.params.sessionId);
      sendResult(res, result);
    } catch (error) {
      next(error);
    }
  });

  router.patch('/:sessionId/progress', async (req, res, next) => {
    try {
      const result = await saveProgress(repository, req.params.sessionId, req.body ?? {});
      sendResult(res, result);
    } catch (error) {
      next(error);
    }
  });

  router.post('/:sessionId/wrong-answers', async (req, res, next) => {
    try {
      const result = await recordWrongAnswer(repository, req.params.sessionId, req.body ?? {});
      sendResult(res, result, 201);
    } catch (error) {
      next(error);
    }
  });

  router.post('/:sessionId/complete-zone', async (req, res, next) => {
    try {
      const result = await completeZone(repository, req.params.sessionId, req.body ?? {});
      sendResult(res, result);
    } catch (error) {
      next(error);
    }
  });

  router.get('/:sessionId/report', async (req, res, next) => {
    try {
      const result = await getReport(repository, req.params.sessionId);
      sendResult(res, result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

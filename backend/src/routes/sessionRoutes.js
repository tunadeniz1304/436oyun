import { Router } from 'express';
import {
  completeZone,
  createSession,
  getReport,
  getSession,
  recordWrongAnswer,
  saveProgress,
} from '../services/sessionService.js';

function sendResult(res, result, successStatus = 200) {
  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.status(successStatus).json(result.data);
}

export function createSessionRouter({ repository }) {
  const router = Router();

  router.post('/', async (req, res, next) => {
    try {
      const result = await createSession(repository, req.body ?? {});
      sendResult(res, result, 201);
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

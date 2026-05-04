import cors from 'cors';
import express from 'express';
import { createSessionRepository } from './repositories/sessionRepository.js';
import { createSessionRouter } from './routes/sessionRoutes.js';

export function createApp({ repository = createSessionRepository() } = {}) {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/sessions', createSessionRouter({ repository }));

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

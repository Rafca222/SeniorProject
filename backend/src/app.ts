import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import authRoutes from './modules/auth/auth.controller';
import eventsRoutes from './modules/events/events.controller';
import usersRoutes from './modules/users/users.controller';
import safetyRoutes from './modules/safety/safety.controller';
import aiRoutes from './modules/ai/ai.controller';
import { AppDataSource } from './data-source';

// Builds the Express app WITHOUT starting a listener or touching the
// database connection -- server.ts does both of those. Tests import this
// directly and drive it with supertest, which never needs a real open
// port; only integration tests that actually hit the database still
// need AppDataSource.initialize() to have run first (see tests/setup.ts).
export function createApp() {
  const app = express();

  const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');
  app.use(cors({ origin: corsOrigins }));
  app.use(express.json());

  app.get('/health', async (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.get('/health/db', async (_req, res) => {
    try {
      await AppDataSource.query('SELECT 1');
      res.json({ status: 'ok', db: 'connected' });
    } catch (err: any) {
      console.error('DB health check failed:', err);
      res.status(500).json({
        status: 'error',
        db: 'unreachable',
        detail: err?.message || err?.code || 'see backend terminal for details',
      });
    }
  });

  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 });
  app.use('/auth', authLimiter, authRoutes);
  app.use('/events', eventsRoutes);
  app.use('/users', usersRoutes);
  app.use('/', safetyRoutes);

  const aiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 });
  app.use('/ai', aiLimiter, aiRoutes);

  return app;
}

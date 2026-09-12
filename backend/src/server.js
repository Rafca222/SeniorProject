import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes.js';
import eventsRoutes from './routes/events.routes.js';
import { pool } from './db/pool.js';

const app = express();
const httpServer = createServer(app);

const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');

app.use(cors({ origin: corsOrigins }));
app.use(express.json());

// Basic health check -- confirms the server (and later, the DB) is reachable
app.get('/health', async (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Confirms the DB connection specifically -- use this once DATABASE_URL is set
app.get('/health/db', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'unreachable', detail: err.message });
  }
});

// Rate-limit auth endpoints against brute-force / abuse
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 });
app.use('/auth', authLimiter, authRoutes);
app.use('/events', eventsRoutes);

// --- Socket.IO: per-event chat rooms ---
const io = new Server(httpServer, { cors: { origin: corsOrigins } });

io.on('connection', (socket) => {
  socket.on('join_event_room', (eventId) => {
    socket.join(`event:${eventId}`);
  });

  socket.on('new_message', async ({ eventId, userId, body }) => {
    try {
      const { rows } = await pool.query(
        `INSERT INTO messages (event_id, user_id, body) VALUES ($1, $2, $3)
         RETURNING id, event_id, user_id, body, created_at`,
        [eventId, userId, body]
      );
      io.to(`event:${eventId}`).emit('new_message', rows[0]);
    } catch (err) {
      console.error('Failed to persist message', err);
    }
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Eventure backend running on http://localhost:${PORT}`);
});

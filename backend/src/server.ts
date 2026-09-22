import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';

import { AppDataSource } from './data-source';
import { Message } from './modules/events/entities/message.entity';
import authRoutes from './modules/auth/auth.controller';
import eventsRoutes from './modules/events/events.controller';

const app = express();
const httpServer = createServer(app);

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

const io = new Server(httpServer, { cors: { origin: corsOrigins } });

io.on('connection', (socket) => {
  socket.on('join_event_room', (eventId: string) => {
    socket.join(`event:${eventId}`);
  });

  socket.on('new_message', async ({ eventId, userId, body }: { eventId: string; userId: string; body: string }) => {
    try {
      const messageRepo = AppDataSource.getRepository(Message);
      const message = await messageRepo.save(messageRepo.create({ eventId, userId, body }));
      io.to(`event:${eventId}`).emit('new_message', message);
    } catch (err) {
      console.error('Failed to persist message', err);
    }
  });
});

const PORT = process.env.PORT || 4000;

// Connect to the database FIRST, then start listening -- if the DB
// connection is broken, we want a clear error at startup, not a server
// that boots fine and only fails the moment someone hits an endpoint.
AppDataSource.initialize()
  .then(() => {
    console.log('Database connected.');
    httpServer.listen(PORT, () => {
      console.log(`Eventure backend running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to the database:', err);
    process.exit(1);
  });

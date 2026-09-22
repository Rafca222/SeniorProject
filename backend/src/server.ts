import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';

import { AppDataSource } from './data-source';
import { Message } from './modules/events/entities/message.entity';
import authRoutes from './modules/auth/auth.controller';
import eventsRoutes from './modules/events/events.controller';
import usersRoutes from './modules/users/users.controller';

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
app.use('/users', usersRoutes);

const io = new Server(httpServer, { cors: { origin: corsOrigins } });

// Authenticate every socket connection with the same JWT used for HTTP
// requests. Without this, any connected client could claim to be anyone
// by just sending a different userId in the message payload -- there was
// nothing stopping that before. The verified userId is stored on
// socket.data, where the app trusts it instead of anything the client
// sends directly.
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Missing auth token'));
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as { sub: string };
    socket.data.userId = payload.sub;
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
});

io.on('connection', (socket) => {
  socket.on('join_event_room', (eventId: string) => {
    socket.join(`event:${eventId}`);
  });

  socket.on('new_message', async ({ eventId, body }: { eventId: string; body: string }) => {
    try {
      const messageRepo = AppDataSource.getRepository(Message);
      const message = await messageRepo.save(
        messageRepo.create({ eventId, userId: socket.data.userId, body })
      );
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

import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { createApp } from './app';
import { AppDataSource } from './data-source';
import { Message } from './modules/events/entities/message.entity';
import { User } from './modules/users/entities/user.entity';

const app = createApp();
const httpServer = createServer(app);

const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');
const io = new Server(httpServer, { cors: { origin: corsOrigins } });

// Authenticate every socket connection with the same JWT used for HTTP
// requests. Without this, any connected client could claim to be anyone
// by just sending a different userId in the message payload -- there was
// nothing stopping that before. The verified userId is stored on
// socket.data, where the app trusts it instead of anything the client
// sends directly.
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Missing auth token'));
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as { sub: string };
    socket.data.userId = payload.sub;
    // Looked up once here rather than on every single message -- a chat
    // session might send dozens of messages, no need to re-query the name
    // each time.
    const user = await AppDataSource.getRepository(User).findOne({ where: { id: payload.sub } });
    socket.data.userName = user?.name ?? 'Unknown';
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
      const saved = await messageRepo.save(
        messageRepo.create({ eventId, userId: socket.data.userId, body })
      );
      io.to(`event:${eventId}`).emit('new_message', {
        id: saved.id,
        eventId: saved.eventId,
        userId: saved.userId,
        userName: socket.data.userName,
        body: saved.body,
        createdAt: saved.createdAt,
      });
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

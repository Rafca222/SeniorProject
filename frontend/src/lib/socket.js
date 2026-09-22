import { io } from 'socket.io-client';

// One shared socket for the whole app, created lazily on first use rather
// than at import time -- so it doesn't try to connect before the user has
// actually opened a chat screen. The access token is sent in the auth
// handshake so the backend can verify who's connecting (see server.ts's
// io.use() middleware) instead of trusting whatever userId a message
// claims to be from.
let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL, {
      autoConnect: true,
      auth: { token: localStorage.getItem('accessToken') },
    });
  }
  return socket;
}

// Call this after a fresh login, or if the access token was just refreshed,
// so a currently-open socket reconnects with the new token instead of
// carrying on with a stale one.
export function reconnectSocket() {
  if (socket) {
    socket.auth = { token: localStorage.getItem('accessToken') };
    socket.disconnect().connect();
  }
}

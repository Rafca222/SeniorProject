import { io } from 'socket.io-client';

// Deliberately NOT a singleton. A previous version cached one shared
// socket for the whole app's lifetime -- but the server only checks who
// you are once, at the initial handshake. If someone logged into a
// different account in the same tab afterward, that cached connection
// kept using the OLD identity forever, silently mislabeling every
// message. Creating a fresh connection each time a chat screen opens
// means it always authenticates with whoever is CURRENTLY logged in.
export function createSocket() {
  return io(import.meta.env.VITE_API_URL, {
    auth: { token: localStorage.getItem('accessToken') },
  });
}

// Singleton Socket.IO client with lazy connect
import { io } from 'socket.io-client';

// Reuse one connection across the app
export const socket = io(import.meta.env.VITE_API_BASE || 'http://localhost:3001', {
  path: '/socket.io',     // default; keep explicit
  autoConnect: false,     // we call connect() when needed
  withCredentials: true,
  transports: ['websocket'], // faster & avoids long-polling churn
});

// optional: simple loggers (comment out in prod)
socket.on('connect', () => console.log('[socket] connected', socket.id));
socket.on('disconnect', (r) => console.log('[socket] disconnected', r));

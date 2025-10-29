import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server as IOServer } from 'socket.io';
import { cfg } from './config.js';

// Core routes (must exist)
import authRoutes from './routes/auth.js';
import boxRoutes from './routes/boxes.js';
import progressRoutes from './routes/progress.js';
import adminChatRoutes from './routes/adminChat.js';
import userChatRoutes from './routes/userChat.js';
import uploadsRouter from './routes/uploads.js';

// Optional routes
let adminIntakeRoutes = null;
try {
  const mod = await import('./routes/adminIntake.js');
  adminIntakeRoutes = mod?.default || null;
} catch {}

let infoRoutes = null;
try {
  const mod = await import('./routes/info.js');
  infoRoutes = mod?.default || null;
} catch {}

const app = express();

/* ----------------------------- basic logger ----------------------------- */
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});

/* --------------------------------- CORS --------------------------------- */
const allowedOrigins = [
  cfg.clientOrigin,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  })
);

/* ----------------------------- body parsing ----------------------------- */
app.use(express.json());

/* ------------------------------- mount API ------------------------------ */
console.log('Mounting /api/auth');
app.use('/api/auth', authRoutes);

console.log('Mounting /api/boxes');
app.use('/api/boxes', boxRoutes);

console.log('Mounting /api/progress');
app.use('/api/progress', progressRoutes);

console.log('Mounting /api/admin/chat');
app.use('/api/admin/chat', adminChatRoutes);

console.log('Mounting /api/user/chat');
app.use('/api/user/chat', userChatRoutes);

console.log('Mounting /api/uploads');
app.use('/api/uploads', uploadsRouter);

if (adminIntakeRoutes) {
  console.log('Mounting /api/admin/intake');
  app.use('/api/admin/intake', adminIntakeRoutes);
} else {
  console.log('Skipping /api/admin/intake (routes/adminIntake.js not found)');
}

if (infoRoutes) {
  console.log('Mounting /api/info');
  app.use('/api/info', infoRoutes);
} else {
  console.log('Skipping /api/info (routes/info.js not found)');
}

/* ---------------------------- health endpoint --------------------------- */
app.get('/api/health', (_req, res) => res.json({ ok: true }));

/* ------------------------------- database ------------------------------- */
if (cfg.mongoUrl) {
  mongoose
    .connect(cfg.mongoUrl, { dbName: cfg.dbName })
    .then(() => console.log('Mongo connected'))
    .catch((e) => console.log('Mongo connect error:', e.message));
} else {
  console.log('Warning: MONGO_URL not set in .env — API will run without DB');
}

/* --------------------------- http + socket.io --------------------------- */
const server = http.createServer(app);
const io = new IOServer(server, {
  cors: { origin: allowedOrigins, credentials: true },
});
app.set('io', io);

io.on('connection', (socket) => {
  console.log('socket connected:', socket.id);

  // NEW: admins room
  socket.on('joinAdmins', () => {
    socket.join('admins');
    console.log(`socket ${socket.id} joined admins`);
  });

  socket.on('joinCountry', ({ country }) => {
    if (['USA', 'Russia', 'Canada'].includes(country)) {
      socket.join(country);
      console.log(`socket ${socket.id} joined country room: ${country}`);
    }
  });

  socket.on('joinUser', ({ userId }) => {
    if (userId) {
      socket.join(String(userId));
      console.log(`socket ${socket.id} joined user room: ${String(userId)}`);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('socket disconnected:', socket.id, reason);
  });
});

/* ----------------------------- route printer ---------------------------- */
function printRoutes(app) {
  const lines = [];
  const stack = app?._router?.stack || [];

  function collect(layer, prefix = '') {
    if (layer?.route?.path) {
      const methods = Object.keys(layer.route.methods)
        .filter((k) => layer.route.methods[k])
        .map((m) => m.toUpperCase())
        .join(',');
      lines.push(`${methods} ${prefix}${layer.route.path}`);
    } else if (layer?.name === 'router' && layer?.handle?.stack) {
      for (const h of layer.handle.stack) collect(h, prefix);
    } else if (layer?.regexp && layer?.handle?.stack) {
      const match = layer.regexp?.toString?.() || '';
      const base = match.split('\\/?')[1]?.replaceAll('\\/', '/')?.replace(/\(\?:\(\?\=\/\|\$\)\)\?\$$/, '') || '';
      for (const h of layer.handle.stack) collect(h, base);
    }
  }

  for (const l of stack) collect(l, '');
  console.log('Registered routes:\n  ' + (lines.join('\n  ') || '(none)'));
}

/* --------------------------- 404 & error handler ------------------------ */
app.use((req, res, _next) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Internal server error' });
});

/* --------------------------------- start -------------------------------- */
server.listen(cfg.port, () => {
  console.log('API listening on http://localhost:' + cfg.port);
  printRoutes(app);
});

export default app;

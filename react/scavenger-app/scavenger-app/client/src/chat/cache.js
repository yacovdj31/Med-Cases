// client/src/chat/cache.js
const get = (k, d = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export const chatKeys = (userId) => ({
  USER:   `user:chat:user:${userId}`,
  THREAD: `user:chat:thread:${userId}`,
  META:   `user:chat:meta:${userId}`, // e.g., lastFetchedAt
});

export function readThread(userId) {
  const { THREAD } = chatKeys(userId);
  return get(THREAD, []);
}

export function writeThread(userId, messages, max = 300) {
  const { THREAD, META } = chatKeys(userId);
  const msgs = Array.isArray(messages) ? messages.slice(-max) : [];
  set(THREAD, msgs);
  set(META, { lastFetchedAt: Date.now(), count: msgs.length });
}

export function readUser(userId) {
  const { USER } = chatKeys(userId);
  return get(USER, null);
}

export function writeUser(userId, me) {
  const { USER } = chatKeys(userId);
  set(USER, me);
}

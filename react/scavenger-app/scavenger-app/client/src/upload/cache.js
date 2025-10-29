// client/src/upload/cache.js
const get = (k, d = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export const uploadKeys = (userId) => ({
  ASSIGNED: `upload:assigned:${userId}`, // [{_id,key,title}]
  MINE:     `upload:mine:${userId}`,     // uploads metadata list
  META:     `upload:meta:${userId}`,     // { lastFetchedAt, count }
});

export function readAssigned(userId) {
  return get(uploadKeys(userId).ASSIGNED, []);
}
export function writeAssigned(userId, list) {
  set(uploadKeys(userId).ASSIGNED, Array.isArray(list) ? list : []);
}

export function readMine(userId) {
  return get(uploadKeys(userId).MINE, []);
}
export function writeMine(userId, items) {
  const safe = Array.isArray(items) ? items.map(it => ({
    // keep only light metadata needed for lists/gallery; NO blobs
    _id: it._id,
    boxId: it.boxId ? { _id: it.boxId._id, key: it.boxId.key, title: it.boxId.title } : null,
    originalName: it.originalName,
    createdAt: it.createdAt,
    updatedAt: it.updatedAt,
    // any tiny fields you rely on in UI can be kept
  })) : [];
  set(uploadKeys(userId).MINE, safe);
  set(uploadKeys(userId).META, { lastFetchedAt: Date.now(), count: safe.length });
}

// client/src/api.js
import axios from 'axios';

// ---- Origins / base URL ----
export const socketOrigin =
  (typeof window !== 'undefined' && window.APP_API_ORIGIN) ||
  import.meta?.env?.VITE_API_ORIGIN ||
  'http://localhost:3001';

export const API_BASE = `${socketOrigin}/api`;

// ---- Token helpers ----
function readTokenKey(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'string') return parsed;
      if (parsed?.token) return parsed.token;
      return String(parsed);
    } catch {
      return raw;
    }
  } catch {
    return null;
  }
}

function getAnyToken(order = ['user:jwt', 'admin:jwt', 'token', 'auth:token', 'jwt']) {
  for (const k of order) {
    const v = readTokenKey(k);
    if (v) return v;
  }
  return null;
}

// Decide which token to use, based on path
function pickTokenKey(url = '') {
  const u = url.startsWith('/') ? url : `/${url}`;
  if (u.startsWith('/auth/admin')) return 'admin:jwt';
  if (u.startsWith('/admin/')) return 'admin:jwt';
  if (u.startsWith('/user/')) return 'user:jwt';
  // Neutral endpoints -> handled in interceptor (below)
  return null;
}

// ---- Axios instance ----
export const api = axios.create({
  baseURL: API_BASE,
  // withCredentials: true,
});

// Attach Bearer token with smart preference for neutral endpoints
api.interceptors.request.use((cfg) => {
  const key = pickTokenKey(cfg.url || '');
  let token = null;

  if (key) {
    token = readTokenKey(key);
  } else {
    // Neutral endpoints like /boxes, /progress/me, /auth/me
    const isAdminPath =
      typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

    // Prefer user token on user-side routes; admin token on admin routes
    token = isAdminPath
      ? (readTokenKey('admin:jwt') || readTokenKey('token') || getAnyToken(['admin:jwt', 'user:jwt', 'token']))
      : (readTokenKey('user:jwt')  || readTokenKey('token') || getAnyToken(['user:jwt', 'admin:jwt', 'token']));

    // Final fallback (keeps your previous behavior)
    if (!token) token = getAnyToken();
  }

  if (token) {
    cfg.headers = cfg.headers || {};
    cfg.headers.Authorization = `Bearer ${token}`;
  } else if (cfg.headers && 'Authorization' in cfg.headers && !cfg.headers.Authorization) {
    delete cfg.headers.Authorization;
  }

  return cfg;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      // optional: console.warn(`[API ${status}] ${err?.config?.url}`);
    }
    return Promise.reject(err);
  }
);

export default api;

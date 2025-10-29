// client/src/App.jsx
import React from 'react';
import { Routes, Route, Navigate, Outlet, NavLink } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { api } from './api';
import { ThemeProvider, useTheme } from './theme/ThemeProvider.jsx';

/* user pages */
import HomePage from './pages/user/HomePage.jsx';
import ChatPage, { ChatPanel } from './pages/user/ChatPage.jsx';
import UploadPage from './pages/user/UploadPage.jsx';
import LoginPage from './pages/user/LoginPage.jsx';
import SignupPage from './pages/user/SignupPage.jsx';
import BoxDetailPage from './pages/user/BoxDetaiPage.jsx';

/* admin pages */
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx';
import AdminHomePage from './pages/admin/AdminHomePage.jsx';
import AdminBoxesPage from './pages/admin/AdminBoxesPage.jsx';
import AdminUserPage from './pages/admin/AdminUserPage.jsx';
import AdminUserFilesPage from './pages/admin/AdminUserFilesPage.jsx';
import AdminChatPage from './pages/admin/AdminChatPage.jsx';

/* overlays */
import ProgressSideBar from './components/progress/ProgressSideBar.jsx';
import ChatSlideOver from './components/chat/ChatSlideOver.jsx';

/* socket.io (client) */
import { io } from 'socket.io-client';

/* cache helpers */
import { writeThread, writeUser } from './chat/cache.js';
import { writeAssigned, writeMine } from './upload/cache.js';

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Admin-only */}
        <Route path="/admin" element={<PrivateRoute role="admin"><AdminHomePage /></PrivateRoute>} />
        <Route path="/admin/boxes" element={<PrivateRoute role="admin"><AdminBoxesPage /></PrivateRoute>} />
        <Route path="/admin/user/:id" element={<PrivateRoute role="admin"><AdminUserPage /></PrivateRoute>} />
        <Route path="/admin/user/:id/files" element={<PrivateRoute role="admin"><AdminUserFilesPage /></PrivateRoute>} />
        <Route path="/admin/chat/:id" element={<PrivateRoute role="admin"><AdminChatPage /></PrivateRoute>} />

        {/* Protected user area */}
        <Route element={<ProtectedShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/info/:id" element={<BoxDetailPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

/* =================== Layout + Protection =================== */
function ProtectedShell() {
  const { user, logout } = useAuth();
  const { t, toggle, isDark } = useTheme();

  const [unread, setUnread] = React.useState(0);
  const [chatOpen, setChatOpen] = React.useState(false);
  const [progressOpen, setProgressOpen] = React.useState(false);

  const isUser = !!user && user.role === 'user';
  const userId = user?._id || user?.id || null;

  // --- tiny throttle helper to avoid spam ---
  function throttle(fn, delay = 2000) {
    let last = 0, timer = null;
    return (...args) => {
      const now = Date.now();
      if (now - last >= delay) { last = now; fn(...args); }
      else {
        clearTimeout(timer);
        timer = setTimeout(() => { last = Date.now(); fn(...args); }, delay);
      }
    };
  }

  // === Helper: prewarm chat cache for instant open ===
  const prewarmChat = React.useCallback(async () => {
    if (!isUser || !userId) return;
    try {
      const [meRes, tRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/user/chat/thread'),
      ]);
      const me = meRes.data?.user;
      const msgs = tRes.data?.messages || [];
      if (me) writeUser(userId, me);
      writeThread(userId, msgs); // clamps & stores last N
    } catch {
      // silent: best-effort
    }
  }, [isUser, userId]);
  const prewarmChatThrottled = React.useMemo(() => throttle(prewarmChat, 2000), [prewarmChat]);

  // === Helper: prewarm uploads (assigned boxes + my uploads metadata) ===
  const prewarmUploads = React.useCallback(async () => {
    if (!isUser || !userId) return;
    try {
      const [pRes, uRes] = await Promise.all([
        api.get('/progress/me'),
        api.get('/uploads/me'),
      ]);
      const statuses = pRes.data?.statuses || [];
      const assigned = [];
      for (const st of statuses) {
        const b = st.boxId;
        if (b && b._id) assigned.push({ _id: b._id, key: b.key, title: b.title });
      }
      const items = uRes.data || [];
      writeAssigned(userId, assigned);
      writeMine(userId, items); // store slim metadata only
    } catch {
      // silent: best-effort
    }
  }, [isUser, userId]);

  // === Listen for custom event from HomePage "Open chat" button ===
  React.useEffect(() => {
    const onOpenChat = () => setChatOpen(true);
    window.addEventListener('app:open-chat', onOpenChat);
    return () => window.removeEventListener('app:open-chat', onOpenChat);
  }, []);

  // --- socket.io realtime unread (admin -> this user) + keep chat cache hot ---
  React.useEffect(() => {
    if (!isUser) return;

    const base =
      (typeof window !== 'undefined' && window?.APP_API_ORIGIN) ||
      import.meta?.env?.VITE_API_ORIGIN ||
      'http://localhost:3001';

    const socket = io(base, { withCredentials: true });

    socket.on('connect', () => {
      socket.emit('joinUser', { userId: userId });
      socket.emit('joinCountry', { country: user.country });
    });

    socket.on('user:chat:update', (payload) => {
      const pid = String(payload?.userId ?? '');
      const uid = String(userId ?? '');
      if (pid && uid && pid === uid) {
        // 1) bump unread fast
        setUnread((u) => u + 1);
        // 2) sync unread count from server
        api.get('/user/chat/unread').then(r => {
          setUnread(r.data?.unread ?? 0);
        }).catch(() => {});
        // 3) keep thread cache hot for instant open
        prewarmChatThrottled();
      }
    });

    return () => {
      socket.off('user:chat:update');
      socket.disconnect();
    };
  }, [isUser, userId, user?.country, prewarmChatThrottled]);

  // --- polling fallback (visible tab only), NO auto-clear here ---
  React.useEffect(() => {
    if (!isUser) return;
    let timer = null;

    const poll = async () => {
      try {
        if (!document.hidden) {
          const r = await api.get('/user/chat/unread');
          setUnread(r.data?.unread ?? 0);
          if (r.data?.unread > 0) prewarmChatThrottled(); // warm only if new stuff
        }
      } catch {
        // ignore
      } finally {
        timer = setTimeout(poll, document.hidden ? 15000 : 7000);
      }
    };

    poll();
    const onVis = () => {
      if (!document.hidden) {
        clearTimeout(timer);
        poll();
        prewarmChatThrottled();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [isUser, prewarmChatThrottled]);

  // --- prewarm as soon as protected shell mounts for users ---
  React.useEffect(() => {
    prewarmChat();
    prewarmUploads();
  }, [prewarmChat, prewarmUploads]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className={t('min-h-screen bg-sky-100 text-slate-800','min-h-screen bg-sky-900 text-slate-100')}>
      {/* NAV */}
      <nav
        className={t(
          'sticky top-0 z-20 border-b border-sky-200/70 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/55',
          'sticky top-0 z-20 border-b border-slate-800/60 bg-slate-900/85 backdrop-blur supports-[backdrop-filter]:bg-slate-900/70'
        )}
      >
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center gap-6 overflow-x-auto">
          <div className={t('font-semibold tracking-tight text-slate-900','font-semibold tracking-tight text-white')}>
            Mahal
          </div>

          <div className="flex gap-2 ml-auto items-center">
            <Nav to="/" exact>Home</Nav>

            {isUser && (
              <>
                {/* Progress overlay */}
                <button
                  onClick={() => setProgressOpen(true)}
                  className={t(
                    'px-3 py-1.5 rounded-md text-slate-800 hover:bg-slate-200 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 !border-0 !ring-0 !shadow-none',
                    'px-3 py-1.5 rounded-md text-slate-200 hover:bg-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70'
                  )}
                >
                  Progress
                </button>

                {/* Chat overlay — clear ONLY when this button is clicked */}
                <button
                  onClick={() => {
                    api.post('/user/chat/mark-read')
                      .then(() => setUnread(0))
                      .catch(() => {});
                    setChatOpen(true);
                  }}
                  className={t(
                    'px-3 py-1.5 rounded-md text-slate-800 hover:bg-slate-200 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 !border-0 !ring-0 !shadow-none',
                    'px-3 py-1.5 rounded-md text-slate-200 hover:bg-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70'
                  )}
                >
                  <span className="relative inline-flex items-center">
                    Chat
                    {unread > 0 && (
                      <span
                        className={t(
                          'ml-2 inline-flex items-center justify-center text-xs font-semibold rounded-full bg-gradient-to-r from-sky-600 to-blue-600 text-white px-2 py-[2px]',
                          'ml-2 inline-flex items-center justify-center text-xs font-semibold rounded-full bg-sky-400 text-sky-950 px-2 py-[2px]'
                        )}
                      >
                        {unread}
                      </span>
                    )}
                  </span>
                </button>
              </>
            )}

            <Nav to="/upload">Upload</Nav>

            {/* Theme toggle */}
            <button
              onClick={toggle}
              className={t(
                'ml-1 px-3 py-1.5 rounded-md text-slate-800 hover:bg-slate-200 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 !border-0 !ring-0 !shadow-none',
                'ml-1 px-3 py-1.5 rounded-md text-slate-200 hover:bg-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70'
              )}
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
                </svg>
              )}
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              className={t(
                'px-3 py-1.5 rounded-md text-slate-700 hover:bg-slate-200 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 !border-0 !ring-0 !shadow-none',
                'px-3 py-1.5 rounded-md text-slate-200 hover:bg-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70'
              )}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-5 py-6 overflow-x-hidden">
        <Outlet />
      </main>

      {/* Overlays */}
      {isUser && (
        <>
          <ProgressSideBar open={progressOpen} onClose={() => setProgressOpen(false)} />
          <ChatSlideOver open={chatOpen} onClose={() => setChatOpen(false)} title="Chat" width="50vw">
            {/* Mount ChatPanel ONLY when the slide-over is open. Do NOT auto mark-read here. */}
            {chatOpen && (
              <ChatPanel showHeader={false} heightClass="h-[calc(100vh-7rem)]" markOnMount={false} />
            )}
          </ChatSlideOver>
        </>
      )}
    </div>
  );
}

/* =================== Shared Nav Link =================== */
function Nav({ to, exact = false, children }) {
  const { t } = useTheme();
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        t(
          [
            'px-3 py-1.5 rounded-md transition font-medium',
            'text-slate-700 hover:bg-slate-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
            '!border-0 !ring-0 !shadow-none',
            isActive ? 'bg-sky-100 text-slate-900' : '',
          ].join(' '),
          [
            'px-3 py-1.5 rounded-md transition font-medium',
            'text-slate-200 hover:bg-white/10',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70',
            isActive ? 'bg-sky-800/40 text-white' : '',
          ].join(' ')
        )
      }
    >
      {children}
    </NavLink>
  );
}

/* =================== Route Guard =================== */
function PrivateRoute({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children ?? <Outlet />;
}

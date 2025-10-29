// client/src/pages/admin/AdminChatPage.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api';
import { useTheme } from '../../theme/ThemeProvider.jsx';
import AdminTopNav from '../admin/AdminTopNav.jsx';

const getLS = (k, d = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const setLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const titleCase = (s='') => s.toLowerCase().replace(/\b[\p{L}]/gu, ch => ch.toUpperCase());

// cache knobs
const MAX_CACHE = 300;      // keep last N messages in localStorage
const PAGE_SIZE = 60;       // how many messages to reveal when scrolling up

export default function AdminChatPage() {
  const { id: userId } = useParams();
  const { t } = useTheme();

  const USER_KEY   = `admin:chat:user:${userId}`;
  const THREAD_KEY = `admin:chat:thread:${userId}`; // stores last MAX_CACHE msgs

  const [userInfo, setUserInfo] = useState(() => getLS(USER_KEY, null));
  const [allMsgs, setAllMsgs]   = useState(() => getLS(THREAD_KEY, [])); // full in-memory list (we may have > MAX_CACHE after refresh)
  const [visibleCount, setVisibleCount] = useState(() => Math.min(PAGE_SIZE, getLS(THREAD_KEY, []).length || PAGE_SIZE));
  const [text, setText]       = useState('');
  const [loading, setLoading] = useState(allMsgs.length === 0);
  const [err, setErr]         = useState('');
  const listRef               = useRef(null);
  const bottomRef             = useRef(null);
  const stickToBottomAlways   = useRef(true); // always keep at bottom per your request

  const scrollToBottom = (smooth = true) =>
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' }), 0);

  const clampCache = (arr) => {
    // persist only the last MAX_CACHE to localStorage for speed on next open
    const sliced = arr.slice(Math.max(0, arr.length - MAX_CACHE));
    setLS(THREAD_KEY, sliced);
  };

  const mergeById = (oldList, newList) => {
    // simple stable merge by _id (server gives full thread, we replace; still keep util)
    const map = new Map();
    for (const m of oldList) map.set(m._id, m);
    for (const m of newList) map.set(m._id, m);
    const merged = Array.from(map.values()).sort((a,b)=> new Date(a.createdAt) - new Date(b.createdAt));
    return merged;
  };

  async function refresh() {
    try {
      setErr('');
      // user info (cache)
      const ures = await api.get('/auth/admin/users');
      const u = Array.isArray(ures.data) ? ures.data.find(x => x._id === userId) : null;
      if (u) { setUserInfo(u); setLS(USER_KEY, u); }

      // full thread (server still returns all)
      const tRes = await api.get(`/admin/chat/thread/${userId}`);
      const next = tRes.data?.messages || [];

      setAllMsgs(prev => {
        const merged = mergeById(prev, next);
        clampCache(merged);
        // keep showing at least PAGE_SIZE or however many we already show
        setVisibleCount(v => Math.max(v, Math.min(merged.length, PAGE_SIZE)));
        return merged;
      });
    } catch (e) {
      setErr(e?.response?.data?.error || e.message || 'Failed to load chat');
    } finally {
      setLoading(false);
      if (stickToBottomAlways.current) scrollToBottom(false);
    }
  }

  async function markRead() {
    try { await api.post(`/admin/chat/mark-read/${userId}`); } catch {}
  }

  // initial load (instant from LS, then background refresh)
  useEffect(() => {
    setLoading(allMsgs.length === 0);
    // always start pinned to bottom
    scrollToBottom(false);
    refresh();
    markRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // upward infinite scroll from in-memory list (no extra API)
  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    if (el.scrollTop < 60) {
      setVisibleCount((v) => Math.min(allMsgs.length, v + PAGE_SIZE));
    }
  };

  async function send(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;

    const optimistic = {
      _id: 'tmp-' + Date.now(),
      text: body,
      createdAt: new Date().toISOString(),
      from: { role: 'admin' },
    };

    setAllMsgs(prev => {
      const next = [...prev, optimistic];
      clampCache(next);
      setVisibleCount(v => Math.min(next.length, Math.max(v, PAGE_SIZE)));
      return next;
    });
    setText('');
    if (stickToBottomAlways.current) scrollToBottom();

    try {
      await api.post(`/admin/chat/thread/${userId}`, { text: body });
      await refresh();
    } catch (e2) {
      setErr(e2?.response?.data?.error || e2.message || 'Send failed');
    }
  }

  const onlyTime = d => new Date(d).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const ymd = d => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  };
  const labelForDay = d => {
    const dt = new Date(d);
    const today = new Date();
    const y = ymd(dt), yt = ymd(today);
    const yy = ymd(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1));
    if (y === yt) return 'Today';
    if (y === yy) return 'Yesterday';
    return dt.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const secondaryLinks = [
    { to: `/admin/user/${userId}`, label:  'Progress', exact: true },
    { to: `/admin/user/${userId}/files`, label:  'Files' },
    { to: `/admin/chat/${userId}`, label:  'Chat' },
  ];
  const rightText = userInfo ? (userInfo.name ? titleCase(userInfo.name) : userInfo.email) : '—';

  // render list with day dividers from the last `visibleCount` messages
  const tail = useMemo(() => allMsgs.slice(Math.max(0, allMsgs.length - visibleCount)), [allMsgs, visibleCount]);

  const renderItems = useMemo(() => {
    const out = [];
    let lastDay = null;
    for (const m of tail) {
      const day = ymd(m.createdAt);
      if (day !== lastDay) {
        out.push({ type: 'divider', id: `div-${day}`, label: labelForDay(m.createdAt) });
        lastDay = day;
      }
      out.push({ type: 'msg', data: m, id: m._id });
    }
    return out;
  }, [tail]);

  return (
    <div className={t(
      'min-h-screen bg-sky-100 text-slate-800 flex flex-col',
      'min-h-screen bg-sky-900 text-slate-100 flex flex-col'
    )}>
      <AdminTopNav secondary={secondaryLinks} rightText={rightText} />

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-5 py-5 h-[calc(100vh-4rem)]">
          <div className={t(
            'h-full flex flex-col rounded-xl border border-sky-200 bg-white shadow-sm overflow-hidden',
            'h-full flex flex-col rounded-xl border border-slate-700 bg-slate-900/40 shadow-sm overflow-hidden'
          )}>
            <div
              ref={listRef}
              onScroll={onScroll}
              className="p-4 pt-5 overflow-y-auto no-scrollbar flex-1"
            >
              {err && (
                <div className={t(
                  'mb-3 p-2 rounded-md border border-red-300 bg-red-50 text-red-700 text-sm',
                  'mb-3 p-2 rounded-md border border-red-400/50 bg-red-500/10 text-red-200 text-sm'
                )}>
                  {err}
                </div>
              )}

              {loading ? (
                <div className={t('text-sm text-slate-600', 'text-sm text-slate-400')}>Loading…</div>
              ) : (
                <>
                  {renderItems.map(item => {
                    if (item.type === 'divider') return <DayDivider key={item.id} label={item.label} />;
                    const m = item.data;
                    const fromAdmin = m.from?.role === 'admin';
                    return (
                      <div key={item.id} className={`mt-2 mb-3 flex ${fromAdmin ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={[
                            'px-3 py-2 rounded-2xl max-w-[75%] shadow-sm border',
                            fromAdmin
                              ? 'bg-sky-600 text-white border-sky-700'
                              : t('bg-slate-100 text-slate-800 border-slate-200', 'bg-slate-800 text-slate-100 border-slate-700')
                          ].join(' ')}
                          style={{ borderRadius: 14 }}
                        >
                          <div className="text-sm whitespace-pre-wrap break-words">{m.text}</div>
                          <div className={`${fromAdmin ? 'text-white/80' : t('text-slate-500', 'text-slate-400')} text-[10px] mt-1`}>
                            {onlyTime(m.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </>
              )}
            </div>

            <form
              onSubmit={send}
              className={t(
                'border-t border-sky-200 bg-white/80 px-3 py-2',
                'border-t border-slate-800 bg-slate-950/70 px-3 py-2'
              )}
            >
              <div className="flex items-center gap-2">
                <div className={t(
                  'flex items-center gap-2 flex-1 rounded-xl border border-sky-200 bg-white px-2.5 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-sky-400',
                  'flex items-center gap-2 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-sky-300/70'
                )}>
                  <input
                    className={t(
                      'flex-1 bg-transparent outline-none text-sm text-slate-900 placeholder-slate-400',
                      'flex-1 bg-transparent outline-none text-sm text-slate-100 placeholder-slate-500'
                    )}
                    placeholder="Type a message…"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!text.trim()}
                  className={[
                    'inline-flex items-center justify-center h-11 w-11 rounded-xl',
                    'bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed',
                    'text-white shadow-sm border border-sky-700',
                    'transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70'
                  ].join(' ')}
                  aria-label="Send message"
                  title="Send"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m22 2-7 20-4-9-9-4Z" />
                    <path d="M22 2 11 13" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

function DayDivider({ label }) {
  return (
    <div className="my-3 flex items-center justify-center">
      <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1" />
      <span className="mx-3 text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1" />
    </div>
  );
}

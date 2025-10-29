// client/src/pages/user/HomePage.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../api';
import ProgressDial from '../../components/ProgressDial';
import { socket } from '../../socket';
import { useTheme } from '../../theme/ThemeProvider.jsx';

/* ---------- tiny cache helpers ---------- */
const getCache = (k, f = null) => { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } };
const setCache = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

/* ---------- utils ---------- */
const firstNameCap = (s) => (s ? String(s).trim().split(/\s+/)[0].replace(/^./, c => c.toUpperCase()) : '');
const normalizeState = (st) => {
  const s = String(st || '').toLowerCase();
  if (['done','complete','completed','finished'].includes(s)) return 'completed';
  if (s && !['new','not_started','todo','null','undefined',''].includes(s)) return 'pending';
  return 'not_touched';
};

export default function HomePage() {
  const { user } = useAuth();
  const { t } = useTheme();

  const userId  = user?._id || user?.id;
  const country = user?.country;

  const BOXES_KEY    = country ? `hp:boxes:${country}` : 'hp:boxes';
  const PROGRESS_KEY = userId ?  `hp:progress:${userId}` : 'hp:progress';

  const [boxes, setBoxes]       = useState(() => getCache(BOXES_KEY, []));
  const [progress, setProgress] = useState(() => getCache(PROGRESS_KEY, { statuses: [] }));
  const [loading, setLoading]   = useState(() => getCache(BOXES_KEY) == null || getCache(PROGRESS_KEY) == null);

  /* ---------------- data refresh ---------------- */
  useEffect(() => {
    let stop = false;
    if (!userId || !country) return;
    (async () => {
      try {
        const [b, p] = await Promise.all([api.get('/boxes'), api.get('/progress/me')]);
        if (stop) return;

        const newBoxes = b.data || [];
        const newProg  = p.data || { statuses: [] };

        // Save caches
        setCache(BOXES_KEY, newBoxes);
        setCache(PROGRESS_KEY, newProg);

        // First set the raw results
        setBoxes(newBoxes);
        setProgress(newProg);

        // ---- Hydrate any missing boxes referenced by progress ----
        // (covers cases where a box is inactive or not listed in /boxes but is assigned)
        const existingMap = new Map(newBoxes.map(x => [String(x._id), x]));
        const missingIds = [];
        for (const st of (newProg.statuses || [])) {
          const id = String(st.boxId?._id || st.boxId || '');
          const hasObjAlready = !!(st.boxId && typeof st.boxId === 'object' && st.boxId._id);
          if (!id) continue;
          if (!hasObjAlready && !existingMap.has(id)) missingIds.push(id);
        }

        if (missingIds.length) {
          const uniq = Array.from(new Set(missingIds));
          try {
            const fetched = await Promise.all(
              uniq.map(id => api.get(`/boxes/${id}`).then(r => r.data).catch(() => null))
            );
            const toAdd = fetched.filter(Boolean);
            if (toAdd.length) {
              const next = [...newBoxes, ...toAdd];
              setBoxes(next);
              setCache(BOXES_KEY, next);
            }
          } catch {}
        }
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => { stop = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, country]);

  /* ---------------- sockets ---------------- */
  useEffect(() => {
    if (!userId || !country) return;
    socket.connect();
    socket.emit('joinCountry', { country });
    socket.emit('joinUser', { userId: String(userId) });

    const onBoxes = (payload) => {
      if (payload?.country !== country) return;
      api.get('/boxes')
        .then(r => {
          const d = r.data || [];
          setBoxes(d);
          setCache(BOXES_KEY, d);
        })
        .catch(() => {});
    };
    const onProgress = (payload) => {
      if (String(payload?.userId) !== String(userId)) return;
      api.get('/progress/me')
        .then(async r => {
          const d = r.data || { statuses: [] };
          setProgress(d);
          setCache(PROGRESS_KEY, d);

          // also hydrate any newly referenced boxes (same logic as above)
          const existingMap = new Map((boxes || []).map(x => [String(x._id), x]));
          const missingIds = [];
          for (const st of (d.statuses || [])) {
            const id = String(st.boxId?._id || st.boxId || '');
            const hasObj = !!(st.boxId && typeof st.boxId === 'object' && st.boxId._id);
            if (!id) continue;
            if (!hasObj && !existingMap.has(id)) missingIds.push(id);
          }
          if (missingIds.length) {
            const uniq = Array.from(new Set(missingIds));
            try {
              const fetched = await Promise.all(
                uniq.map(id => api.get(`/boxes/${id}`).then(rr => rr.data).catch(() => null))
              );
              const toAdd = fetched.filter(Boolean);
              if (toAdd.length) {
                const next = [...(boxes || []), ...toAdd];
                setBoxes(next);
                setCache(BOXES_KEY, next);
              }
            } catch {}
          }
        })
        .catch(() => {});
    };

    socket.on('boxes:update', onBoxes);
    socket.on('progress:update', onProgress);

    return () => {
      socket.off('boxes:update', onBoxes);
      socket.off('progress:update', onProgress);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, country, boxes]);

  /* ---- Re-fetch on window focus (covers missed socket pushes) ---- */
  useEffect(() => {
    if (!userId || !country) return;
    const refresh = () => {
      Promise.all([api.get('/boxes'), api.get('/progress/me')])
        .then(async ([b, p]) => {
          const newBoxes = b.data || [];
          const newProg  = p.data || { statuses: [] };
          setBoxes(newBoxes); setCache(BOXES_KEY, newBoxes);
          setProgress(newProg); setCache(PROGRESS_KEY, newProg);

          // hydrate again on focus if needed
          const existingMap = new Map(newBoxes.map(x => [String(x._id), x]));
          const missingIds = [];
          for (const st of (newProg.statuses || [])) {
            const id = String(st.boxId?._id || st.boxId || '');
            const hasObj = !!(st.boxId && typeof st.boxId === 'object' && st.boxId._id);
            if (!id) continue;
            if (!hasObj && !existingMap.has(id)) missingIds.push(id);
          }
          if (missingIds.length) {
            const uniq = Array.from(new Set(missingIds));
            try {
              const fetched = await Promise.all(
                uniq.map(id => api.get(`/boxes/${id}`).then(rr => rr.data).catch(() => null))
              );
              const toAdd = fetched.filter(Boolean);
              if (toAdd.length) {
                const next = [...newBoxes, ...toAdd];
                setBoxes(next);
                setCache(BOXES_KEY, next);
              }
            } catch {}
          }
        })
        .catch(() => {});
    };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [userId, country]);

  /* ---------------- warm chat cache ---------------- */
  useEffect(() => {
    if (!userId || user?.role !== 'user') return;
    const THREAD_KEY = `user:chat:thread:${userId}`;
    const USER_KEY   = `user:chat:user:${userId}`;
    (async () => {
      try {
        const [meRes, tRes] = await Promise.all([api.get('/auth/me'), api.get('/user/chat/thread')]);
        const me = meRes.data?.user;
        const msgs = tRes.data?.messages || [];
        if (me) localStorage.setItem(USER_KEY, JSON.stringify(me));
        if (msgs.length) localStorage.setItem(THREAD_KEY, JSON.stringify(msgs));
      } catch {}
    })();
  }, [userId, user?.role]);

  /* ---------------- progress math ---------------- */
  const boxMap = useMemo(() => {
    const m = new Map();
    for (const b of boxes) m.set(String(b._id), b);
    return m;
  }, [boxes]);

  const assigned = useMemo(() => {
    const sts = progress?.statuses || [];
    return sts.map(st => {
      const id  = String(st.boxId?._id || st.boxId);
      // prefer populated box from /progress; fallback to /boxes map; as a last resort, show a stub
      const box = (st.boxId && st.boxId._id)
        ? st.boxId
        : (boxMap.get(id) || { _id: id, key: 'Box', title: 'Details', description: '' });
      const weight = Number(box?.weight) || 0;
      const completed = st?.completed === true || st?.state === 'completed';
      const state = completed ? 'completed' : normalizeState(st?.state);
      return { id, st, box, weight, completed, state };
    }).filter(x => x.id); // keep only valid items
  }, [progress, boxMap]);

  const percent = useMemo(() => {
    if (!assigned.length) return 0;
    const denom  = assigned.reduce((a, x) => a + (Number(x.weight) || 0), 0) || 0;
    const gained = assigned.reduce((a, x) => a + ((x.completed ? Number(x.weight) : 0) || 0), 0);
    return denom ? Math.round((gained / denom) * 100) : 0;
  }, [assigned]);

  const counts = useMemo(() => {
    let c = 0, p = 0, n = 0;
    for (const x of assigned) {
      if (x.state === 'completed') c++;
      else if (x.state === 'pending') p++;
      else n++;
    }
    return { completed: c, pending: p, not: n, total: assigned.length };
  }, [assigned]);

  /* ---------------- ordered list (NT -> P -> C) ---------------- */
  const ordered = useMemo(() => {
    const prio = { not_touched: 0, pending: 1, completed: 2 };
    return [...assigned].sort((a, b) => {
      const da = prio[a.state] ?? 9, db = prio[b.state] ?? 9;
      if (da !== db) return da - db;
      const ak = `${a.box?.key || ''} ${a.box?.title || ''}`.toLowerCase();
      const bk = `${b.box?.key || ''} ${b.box?.title || ''}`.toLowerCase();
      return ak.localeCompare(bk);
    });
  }, [assigned]);

  /* ---------------- looped free scroll list (no snap) ---------------- */
  const listRef = useRef(null);
  const LOOP_MULT = 3;
  const looped = useMemo(() => (ordered.length ? Array.from({ length: LOOP_MULT }, () => ordered).flat() : []), [ordered]);

  const segmentRef = useRef(0);
  useEffect(() => {
    const el = listRef.current;
    if (!el || ordered.length === 0) return;
    const id = setTimeout(() => {
      const seg = el.scrollHeight / LOOP_MULT;
      segmentRef.current = seg;
      el.scrollTop = seg;
    }, 0);
    return () => clearTimeout(id);
  }, [ordered.length]);

  const onListScroll = () => {
    const el = listRef.current;
    const seg = segmentRef.current;
    if (!el || !seg) return;
    if (el.scrollTop < 8) el.scrollTop += seg;
    else if (el.scrollTop > seg * 2) el.scrollTop -= seg;
  };

  /* ---------------- UI bits ---------------- */
  const StatusPill = ({ state }) => {
    if (state === 'completed') {
      return <span className={t('px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 border border-emerald-300 text-emerald-800','px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-300/15 border border-emerald-200/25 text-emerald-100')}>Completed</span>;
    }
    if (state === 'pending') {
      return <span className={t('px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 border border-amber-300 text-amber-800','px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-300/15 border border-amber-200/25 text-amber-100')}>In progress</span>;
    }
    return <span className={t('px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 border border-slate-300 text-slate-800','px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-300/10 border border-slate-200/20 text-slate-100')}>Not started</span>;
  };

  const Row = ({ x }) => (
    <Link
      to={`/info/${x.box._id}`}
      className={[
        'w-[820px] max-w-[92vw] mx-auto mb-2 rounded-xl border transition card-hover',
        t('bg-white/90 border-sky-200','bg-slate-900/40 border-slate-800/50'),
        'block px-4 py-3'
      ].join(' ')}
    >
      <div className="flex items-center gap-3">
        <div className="w-1.5 rounded self-stretch bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600" />
        <div className={t('min-w-0 font-semibold text-slate-900 truncate','min-w-0 font-semibold text-slate-50 truncate')}>
          {x.box.key} — {x.box.title}
        </div>
        <div className="ml-auto"><StatusPill state={x.state} /></div>
      </div>
    </Link>
  );

  const first = firstNameCap(user?.name);
  const openChatSlide = () => window.dispatchEvent(new CustomEvent('app:open-chat'));

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className={t('text-2xl md:text-3xl font-bold text-slate-900','text-2xl md:text-3xl font-bold text-white')}>
          {`Welcome${first ? `, ${first}` : ''}`}
        </h1>
        <button
          onClick={openChatSlide}
          aria-label="Open chat"
          title="Messages"
          className={[
            'h-10 w-10 rounded-xl inline-flex items-center justify-center',
            'text-white bg-sky-500 hover:bg-sky-600 border border-sky-600 shadow-sm',
            'transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80'
          ].join(' ')}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H9l-4 4v-4H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <circle cx="9" cy="10" r="1" /><circle cx="12" cy="10" r="1" /><circle cx="15" cy="10" r="1" />
          </svg>
        </button>
      </div>

      <section className={['mt-2 mx-auto w-full max-w-[900px]', t('sky-100','sky-900')].join(' ')}>
        <div className="relative px-6 pt-8 pb-6 grid place-items-center">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className="w-64 h-64 rounded-full blur-2xl opacity-20"
              style={{ background: 'radial-gradient(closest-side, rgba(2,132,199,0.45), transparent 70%)' }}
            />
          </div>

          <ProgressDial
            percent={percent}
            glow={0}
            showHead={true}
            colorsLight={['#FFA94D', '#FF7A1A']}
            colorsDark={['#FFA94D', '#FF7A1A']}
            trackLight="rgba(2,132,199,0.20)"
            trackDark="rgba(148,163,184,0.30)"
          />

          <div className={t('mt-3 text-sm text-slate-600','mt-3 text-sm text-slate-300')}>Overall completion</div>
          <div className="mt-4 flex items-center gap-2">
            <span className={t('badge','badge')}>Completed: <strong className="ml-1">{counts.completed}</strong></span>
            <span className={t('badge','badge')}>In progress: <strong className="ml-1">{counts.pending}</strong></span>
            <span className={t('badge','badge')}>Not started: <strong className="ml-1">{counts.not}</strong></span>
          </div>
        </div>
      </section>

      <section className="mt-6 flex-1 flex items-start justify-center overflow-hidden">
        <div
          ref={listRef}
          onScroll={onListScroll}
          className="h-[360px] overflow-y-auto no-scrollbar w-full"
        >
          <div className="pb-2">
            {loading ? (
              <div className={t('text-sm text-slate-700 text-center','text-sm text-slate-300 text-center')}>Loading…</div>
            ) : (!looped.length ? (
              <div className={t('text-sm text-slate-700 text-center','text-sm text-slate-300 text-center')}>No assignments yet.</div>
            ) : (
              looped.map((x, i) => <Row key={`${x.id}-${i}`} x={x} />)
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

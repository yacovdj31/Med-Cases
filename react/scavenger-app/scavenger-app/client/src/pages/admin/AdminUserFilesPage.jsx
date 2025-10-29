// client/src/pages/admin/AdminUserFilesPage.jsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { api } from '../../api';
import SecureImage from '../../components/media/SecureImage.jsx';
import { useTheme } from '../../theme/ThemeProvider.jsx';
import AdminTopNav from './AdminTopNav.jsx';

/* ----------------- localStorage helpers ----------------- */
const getLS = (k, d = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const setLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const META_KEY = (userId) => `admin:files:meta:${userId}`;      // [{key, box:{key,title}, count}]
const DATA_KEY = (userId) => `admin:files:data:${userId}`;      // raw items
const SEL_KEY  = (userId, groupKey) => `admin:files:sel:${userId}:${groupKey}`;
const EMAIL_SUGGEST_KEY = 'admin:fileSend:recentEmails';        // string[] of emails (lower-cased)

/* ----------------- tiny utils ----------------- */
const titleCase = (s='') => s
  .toLowerCase()
  .replace(/\b[\p{L}]/gu, ch => ch.toUpperCase());

const niceBoxTitle = (g) => g?.box ? `${g.box.key || 'Box'} — ${g.box.title || 'Untitled'}` : 'Other';

const fmtDate = (iso) => {
  const d = new Date(iso);
  const opt = { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' };
  return d.toLocaleString(undefined, opt); // e.g., "Sep 12, 1:03 PM"
};

/* =================================================================== */
export default function AdminUserFilesPage() {
  const { id: userId } = useParams();
  const { t } = useTheme();

  // seed from LS for instant UI
  const seedItems = getLS(DATA_KEY(userId), []);
  const seedMeta  = getLS(META_KEY(userId), null);

  const [data, setData] = useState({ items: seedItems, counts: {} });
  const [userInfo, setUserInfo] = useState(null);
  const [meta, setMeta] = useState(seedMeta);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(seedItems.length === 0);

  // modal (category grid)
  const [open, setOpen] = useState(false);
  const [activeKey, setActiveKey] = useState(null);

  // lightbox (full-screen single preview)
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const viewerItemsRef = useRef([]);

  // email sending
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [emailSuggestions, setEmailSuggestions] = useState(() => getLS(EMAIL_SUGGEST_KEY, []) || []);

  const secondaryLinks = [
    { to: `/admin/user/${userId}`, label: 'Progress', exact: true },
    { to: `/admin/user/${userId}/files`, label: 'Files' },
    { to: `/admin/chat/${userId}`, label: 'Chat' },
  ];

  const personLabel = useMemo(() => {
    if (!userInfo) return '—';
    if (userInfo.name) return titleCase(userInfo.name);
    return userInfo.email || '—';
  }, [userInfo]);

  /* ----------------- refresh ----------------- */
  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        setErr('');
        setLoading(seedItems.length === 0);

        // header user
        const ures = await api.get('/auth/admin/users');
        if (!stop) {
          const u = Array.isArray(ures.data) ? ures.data.find((x) => x._id === userId) : null;
          setUserInfo(u || null);
        }

        // files
        const r = await api.get(`/uploads/user/${userId}`);
        const next = r.data || { items: [], counts: {} };

        if (!stop) {
          setData(next);
          setLS(DATA_KEY(userId), next.items);

          // build & cache meta
          const groupsMap = new Map();
          for (const it of next.items) {
            const key = it.boxId?._id || 'other';
            if (!groupsMap.has(key)) groupsMap.set(key, { box: it.boxId || null, count: 0 });
            groupsMap.get(key).count += 1;
          }
          const metaList = Array.from(groupsMap.entries()).map(([key, v]) =>
            ({ key, box: v.box ? { key: v.box.key, title: v.box.title } : null, count: v.count })
          );
          setMeta(metaList);
          setLS(META_KEY(userId), metaList);
        }
      } catch (e) {
        if (!stop) setErr(e?.response?.data?.error || e.message || 'Failed to load files');
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => { stop = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  /* ----------------- grouping derived from data ----------------- */
  const groups = useMemo(() => {
    const byKey = new Map();
    for (const it of data.items) {
      const k = it.boxId?._id || 'other';
      if (!byKey.has(k)) byKey.set(k, { key: k, box: it.boxId || null, items: [] });
      byKey.get(k).items.push(it);
    }
    let arr = Array.from(byKey.values());
    if (meta && Array.isArray(meta) && meta.length) {
      const order = new Map(meta.map((m, i) => [m.key, i]));
      arr.sort((a, b) => (order.get(a.key) ?? 9999) - (order.get(b.key) ?? 9999));
      arr = arr.map(g => {
        const m = meta.find(x => x.key === g.key);
        return { ...g, count: m?.count ?? g.items.length };
      });
    } else {
      arr = arr.map(g => ({ ...g, count: g.items.length }));
    }
    return arr;
  }, [data.items, meta]);

  const total = useMemo(() => groups.reduce((s, g) => s + (g.count || 0), 0), [groups]);

  /* ----------------- selections (persist per group) ----------------- */
  const [selected, setSelected] = useState(() => {
    const map = new Map();
    for (const g of groups) {
      const seed = new Set(getLS(SEL_KEY(userId, g.key), []));
      map.set(g.key, seed);
    }
    return map;
  });
  useEffect(() => {
    setSelected(prev => {
      const next = new Map();
      for (const g of groups) {
        next.set(g.key, new Set(prev.get(g.key) || getLS(SEL_KEY(userId, g.key), [])));
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups.length]);

  const setSelFor = useCallback((groupKey, setObj) => {
    setSelected(prev => {
      const next = new Map(prev);
      next.set(groupKey, new Set(setObj));
      setLS(SEL_KEY(userId, groupKey), Array.from(setObj));
      return next;
    });
  }, [userId]);

  /* ----------------- modal open/close ----------------- */
  function openGroup(key) {
    setActiveKey(key);
    setOpen(true);
  }
  function closeGroup() {
    setOpen(false);
    setActiveKey(null);
    setSendMsg('');
    setEmailInput('');
  }
  const activeGroup = useMemo(
    () => (activeKey == null ? null : groups.find((g) => g.key === activeKey) || null),
    [activeKey, groups]
  );

  /* ----------------- lightbox ----------------- */
  const openViewer = useCallback((files, index) => {
    viewerItemsRef.current = files;
    setViewerIndex(index);
    setViewerOpen(true);
  }, []);
  const closeViewer = useCallback(() => {
    setViewerOpen(false);
    viewerItemsRef.current = [];
  }, []);
  const goPrev = useCallback(() => {
    const arr = viewerItemsRef.current;
    setViewerIndex(i => (i - 1 + arr.length) % arr.length);
  }, []);
  const goNext = useCallback(() => {
    const arr = viewerItemsRef.current;
    setViewerIndex(i => (i + 1) % arr.length);
  }, []);
  useEffect(() => {
    if (!viewerOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeViewer();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewerOpen, closeViewer, goPrev, goNext]);

  /* ----------------- email selected ----------------- */
  function ensureEmailListUnique(list) {
    const seen = new Set();
    const out = [];
    for (const e of list) {
      const lower = (e || '').toLowerCase();
      if (!lower || seen.has(lower)) continue;
      seen.add(lower);
      out.push(lower);
    }
    return out;
  }

  async function emailSelected() {
    if (!activeGroup) return;
    const sel = selected.get(activeGroup.key) || new Set();
    const fileIds = Array.from(sel);
    if (fileIds.length === 0) { setSendMsg('Select at least one file.'); return; }

    // parse and validate the emails
    const parts = emailInput.split(/[,\s;]+/).map(s => s.trim()).filter(Boolean);
    const ok = parts.filter(s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
    if (!ok.length) { setSendMsg('Add at least one valid email.'); return; }

    setSending(true);
    setSendMsg('');
    try {
      await api.post('/uploads/admin/send-selected', {
        userId,
        fileIds,
        to: ok, // array of emails
      });
      setSendMsg('Sent!');

      // save/refresh suggestions
      const saved = getLS(EMAIL_SUGGEST_KEY, []) || [];
      const merged = ensureEmailListUnique([...ok, ...saved]).slice(0, 30);
      setLS(EMAIL_SUGGEST_KEY, merged);
      setEmailSuggestions(merged);
    } catch (e) {
      setSendMsg(e?.response?.data?.error || e.message || 'Send failed');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={t('min-h-screen bg-sky-100 text-slate-800','min-h-screen bg-sky-900 text-slate-100')}>
      <AdminTopNav secondary={secondaryLinks} rightText={personLabel} />

      <main className="max-w-6xl mx-auto px-5 py-6 grid gap-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">
              {personLabel} — Files
            </h1>
            <p className={t('text-sm text-slate-600','text-sm text-slate-300')}>
              Grouped by category. Images load on demand. Selections persist.
            </p>
          </div>
          <div className={t('text-sm text-slate-600','text-sm text-slate-300')}>
            Total files: <span className="font-semibold">{total}</span>
          </div>
        </div>

        {err && (
          <div className={t(
            'p-3 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm',
            'p-3 rounded-lg border border-red-400/40 bg-red-500/15 text-red-200 text-sm'
          )}>
            {err}
          </div>
        )}

        {loading ? (
          <div className={t('text-sm text-slate-600','text-sm text-slate-300')}>Loading…</div>
        ) : groups.length === 0 ? (
          <div className={t('text-sm text-slate-600','text-sm text-slate-300')}>No files uploaded yet.</div>
        ) : (
          <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((g) => (
              <button
                key={g.key}
                type="button"
                onClick={() => openGroup(g.key)}
                className={t(
                  'text-left rounded-2xl border border-sky-200 bg-white hover:bg-sky-50 transition shadow-sm p-4',
                  'text-left rounded-2xl border border-slate-800/60 bg-slate-900/40 hover:bg-slate-900 transition shadow-sm p-4'
                )}
                title="Open category"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold truncate">{niceBoxTitle(g)}</div>
                  <span
                    className={t(
                      'px-2 py-0.5 text-xs rounded-full bg-sky-100 text-sky-800 border border-sky-200',
                      'px-2 py-0.5 text-xs rounded-full bg-sky-800/40 text-sky-100 border border-sky-700'
                    )}
                  >
                    {g.count}
                  </span>
                </div>
                <div className={t('mt-2 text-sm text-slate-600','mt-2 text-sm text-slate-300')}>
                  Click to view files
                </div>
              </button>
            ))}
          </section>
        )}
      </main>

      {/* Category Modal (compact, centered, better use of space) */}
      {open && activeGroup && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-3">
            <div className={t(
              'w-full max-w-5xl max-h-[88vh] overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-2xl',
              'w-full max-w-5xl max-h-[88vh] overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl'
            )}>
              {/* Header */}
              <div className={t(
                'px-4 py-2 border-b border-sky-200 bg-white flex items-center gap-3',
                'px-4 py-2 border-b border-slate-700 bg-slate-900 flex items-center gap-3'
              )}>
                <div className="font-semibold truncate flex-1">
                  {niceBoxTitle(activeGroup)} <span className={t('text-slate-500','text-slate-400')}>· {activeGroup.items.length} file{activeGroup.items.length===1?'':'s'}</span>
                </div>

                {/* Select All */}
                <SelectAll
                  groupKey={activeGroup.key}
                  items={activeGroup.items}
                  selected={selected}
                  setSelFor={setSelFor}
                />

                {/* Email input with suggestions */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Recipients… e.g. alice@site.com, bob@site.com"
                    list="email-suggestions"
                    className={t(
                      'h-8 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 w-[360px]',
                      'h-8 rounded-md border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 w-[360px]'
                    )}
                  />
                  <datalist id="email-suggestions">
                    {emailSuggestions.map((em) => <option key={em} value={em} />)}
                  </datalist>

                  <button
                    type="button"
                    disabled={sending}
                    onClick={emailSelected}
                    className={[
                      'px-3 py-1.5 rounded-md text-sm border',
                      sending
                        ? t('bg-slate-200 text-slate-500 border-slate-300','bg-slate-800 text-slate-400 border-slate-600')
                        : 'bg-sky-600 text-white border-sky-700 hover:bg-sky-700'
                    ].join(' ')}
                    title="Send selected files"
                  >
                    {sending ? 'Sending…' : 'Send'}
                  </button>

                  <button
                    onClick={() => closeGroup()}
                    className={t(
                      'px-2 py-1 text-sm rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-300',
                      'px-2 py-1 text-sm rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-600'
                    )}
                  >
                    Close
                  </button>
                </div>
              </div>

              {sendMsg && (
                <div className={t('px-4 py-1 text-xs text-slate-600','px-4 py-1 text-xs text-slate-300')}>
                  {sendMsg}
                </div>
              )}

              {/* Content */}
              <div className="p-4 overflow-auto max-h-[calc(88vh-92px)]">
                {/* tighter, responsive grid with better card density */}
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {activeGroup.items.map((it, idx) => (
                    <FileCard
                      key={it._id}
                      it={it}
                      idx={idx}
                      groupKey={activeGroup.key}
                      selected={selected}
                      setSelFor={setSelFor}
                      onOpenViewer={(index) => openViewer(activeGroup.items, index)}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {viewerOpen && viewerItemsRef.current.length > 0 && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/80" onClick={closeViewer} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="relative max-w-[95vw] max-h-[90vh] w-full">
              <div className="w-full h-full flex items-center justify-center">
                <SecureImage
                  fileId={viewerItemsRef.current[viewerIndex]._id}
                  alt={viewerItemsRef.current[viewerIndex].originalName}
                  className="max-w-full max-h-[90vh] rounded-xl"
                />
              </div>

              <button
                onClick={goPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center"
                title="Previous"
              >
                ‹
              </button>
              <button
                onClick={goNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center"
                title="Next"
              >
                ›
              </button>
              <button
                onClick={closeViewer}
                className="absolute -top-3 -right-3 h-10 w-10 rounded-full bg-white shadow flex items-center justify-center"
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ====================== sub components ====================== */

function SelectAll({ groupKey, items, selected, setSelFor }) {
  const sel = selected.get(groupKey) || new Set();
  const allIds = items.map(it => it._id);
  const isAll = sel.size > 0 && sel.size === allIds.length;

  const toggle = () => {
    if (isAll) setSelFor(groupKey, new Set());
    else setSelFor(groupKey, new Set(allIds));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="px-2 py-1 text-xs rounded-md border bg-transparent hover:bg-white/10"
      title="Toggle select all in this category"
    >
      {isAll ? 'Unselect all' : 'Select all'}
    </button>
  );
}

function FileCard({ it, idx, groupKey, selected, setSelFor, onOpenViewer, t }) {
  const isChecked = (selected.get(groupKey) || new Set()).has(it._id);

  const toggle = () => {
    const cur = selected.get(groupKey) || new Set();
    const next = new Set(cur);
    if (next.has(it._id)) next.delete(it._id); else next.add(it._id);
    setSelFor(groupKey, next);
  };

  const name = it.originalName || 'file';
  const when = fmtDate(it.createdAt || it.updatedAt || Date.now());

  return (
    <div className={t(
      'rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden',
      'rounded-xl border border-slate-700 bg-slate-900 shadow-sm overflow-hidden'
    )}>
      {/* Image area (no overlays) */}
      <button
        type="button"
        className="block w-full aspect-[4/3] overflow-hidden"
        onClick={() => onOpenViewer(idx)}
        title="Open large view"
      >
        <SecureImage fileId={it._id} alt={name} className="w-full h-full object-cover" />
      </button>

      {/* Meta row: outside the photo, clean and compact */}
      <div className="px-3 py-2 flex items-center gap-3 text-[13px]">
        <label className="inline-flex items-center gap-2 select-none">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={toggle}
            className="accent-sky-600"
            title="Select this file"
          />
          <span className={t('text-slate-700','text-slate-200')}>Select</span>
        </label>

        <div className="ml-auto text-[12px]">
          <span className={t('text-slate-500','text-slate-400')}>{when}</span>
        </div>
      </div>
    </div>
  );
}

function Tab({ to, exact = false, children }) {
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
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
            isActive ? 'bg-sky-200 text-slate-900' : ''
          ].join(' '),
          [
            'px-3 py-1.5 rounded-md transition font-medium',
            'text-slate-200 hover:bg-white/10',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70',
            isActive ? 'bg-sky-800/50 text-white' : ''
          ].join(' ')
        )
      }
    >
      {children}
    </NavLink>
  );
}

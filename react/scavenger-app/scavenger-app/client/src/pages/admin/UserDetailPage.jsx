// client/src/pages/admin/AdminFilesPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { api } from '../../api';
import { useTheme } from '../../theme/ThemeProvider.jsx';
import AdminTopNav from './AdminTopNav.jsx';

/* ----------------- tiny utils ----------------- */
const getLS = (k, d=null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const setLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const titleCaseName = (s='') => s.toLowerCase().replace(/\b[\p{L}]/gu, ch => ch.toUpperCase());

const META_KEY = (id) => `admin:files:meta:${id}`;       // cached list of categories + counts
const META_TS  = (id) => `admin:files:meta:ts:${id}`;

/* Inferred shape from your repo:
   GET /uploads/admin/:userId -> { user: {...}, categories: [{ name, count }] }
   GET /uploads/admin/:userId/list?category=Cat -> [{ _id, name, mime, size, createdAt, url }]
   If your endpoints differ, just adapt the two API calls inside refresh() and openCategory().
*/

export default function AdminFilesPage() {
  const { id: userId } = useParams();
  const { t } = useTheme();

  const [userInfo, setUserInfo]     = useState(null);
  const [categories, setCategories] = useState(() => getLS(META_KEY(userId), []) || []);
  const [loading, setLoading]       = useState(categories.length === 0);
  const [err, setErr]               = useState('');

  // modal state
  const [modalOpen, setModalOpen]       = useState(false);
  const [modalTitle, setModalTitle]     = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [files, setFiles]               = useState([]);

  async function refresh() {
    try {
      setErr('');
      setLoading(categories.length === 0);

      // Fetch user (same call style as AdminChatPage)
      const ures = await api.get('/auth/admin/users');
      const u = Array.isArray(ures.data) ? ures.data.find(x => x._id === userId) : null;
      setUserInfo(u || null);

      // Fetch categories meta
      const res = await api.get(`/uploads/admin/${userId}`);
      const cats = Array.isArray(res.data?.categories) ? res.data.categories : [];
      setCategories(prev => {
        const same = JSON.stringify(prev) === JSON.stringify(cats);
        if (!same) {
          setLS(META_KEY(userId), cats);
          setLS(META_TS(userId), Date.now());
        }
        return same ? prev : cats;
      });
    } catch (e) {
      setErr(e?.response?.data?.error || e.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const totalCount = useMemo(() => categories.reduce((s,c)=> s + (c.count || 0), 0), [categories]);

  /* ---------- on-demand load into modal ---------- */
  async function openCategory(catName) {
    setModalTitle(catName);
    setFiles([]);
    setModalLoading(true);
    setModalOpen(true);

    try {
      const listRes = await api.get(`/uploads/admin/${userId}/list`, { params: { category: catName }});
      const list = Array.isArray(listRes.data) ? listRes.data : (listRes.data?.files || []);
      setFiles(list);
    } catch (e) {
      setFiles([]);
    } finally {
      setModalLoading(false);
    }
  }

  function closeModal() {
    setModalOpen(false);
    setFiles([]);
  }

  /* ---------- helpers ---------- */
  const isImage = (mime='') => /^image\//.test(mime);
  const formatSize = (n) => {
    if (!Number.isFinite(n)) return '—';
    if (n < 1024) return `${n} B`;
    if (n < 1024*1024) return `${(n/1024).toFixed(1)} KB`;
    if (n < 1024*1024*1024) return `${(n/1024/1024).toFixed(1)} MB`;
    return `${(n/1024/1024/1024).toFixed(1)} GB`;
  };

  return (
    <div className={t(
      'min-h-screen bg-sky-100 text-slate-800',   // LIGHT
      'min-h-screen bg-sky-900 text-slate-100'    // DARK (sky-900)
    )}>
      {/* Global admin nav */}
      <AdminTopNav />

      {/* Sub-nav (same style as Chat/User) */}
      <div className={t(
        'border-b border-sky-200 bg-white/80 backdrop-blur',
        'border-b border-slate-800 bg-slate-950/70 backdrop-blur'
      )}>
        <div className="max-w-6xl mx-auto px-5 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Tab to={`/admin/user/${userId}`}>User</Tab>
          <Tab to={`/admin/user/${userId}/files`} exact>Files</Tab>
          <Tab to={`/admin/chat/${userId}`}>Chat</Tab>
          <div className="ml-auto text-xs opacity-70 truncate">
            {userInfo ? (userInfo.name ? titleCaseName(userInfo.name) : userInfo.email) : '—'}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-5 py-6 grid gap-5">
        {/* Page header */}
        <header className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">User Files</h1>
            <p className={t('text-slate-600 text-sm','text-slate-300 text-sm')}>
              Organized by category. Images are loaded only when you open a category.
            </p>
          </div>
          <div className={t('text-sm text-slate-600','text-sm text-slate-300')}>
            Total files: <span className="font-semibold">{totalCount}</span>
          </div>
        </header>

        {err && (
          <div className={t(
            'p-3 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm',
            'p-3 rounded-lg border border-red-400/40 bg-red-500/15 text-red-200 text-sm'
          )}>{err}</div>
        )}

        {loading ? (
          <div className={t('text-sm text-slate-600','text-sm text-slate-300')}>Loading…</div>
        ) : (
          <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <button
                key={cat.name}
                type="button"
                onClick={() => openCategory(cat.name)}
                className={t(
                  'group text-left rounded-2xl border border-sky-200 bg-white hover:bg-sky-50 transition shadow-sm p-4',
                  'group text-left rounded-2xl border border-slate-800/60 bg-slate-900/40 hover:bg-slate-900 transition shadow-sm p-4'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{cat.name || 'Uncategorized'}</div>
                  <span className={t(
                    'px-2 py-0.5 text-xs rounded-full bg-sky-100 text-sky-800 border border-sky-200',
                    'px-2 py-0.5 text-xs rounded-full bg-sky-800/40 text-sky-100 border border-sky-700'
                  )}>
                    {cat.count}
                  </span>
                </div>
                <div className={t('mt-2 text-sm text-slate-600','mt-2 text-sm text-slate-300')}>
                  Click to view files
                </div>
              </button>
            ))}

            {categories.length === 0 && (
              <div className={t('text-sm text-slate-600','text-sm text-slate-300')}>No files yet.</div>
            )}
          </section>
        )}
      </main>

      {/* Modal (centered) */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50"
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          />
          {/* Panel */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className={t(
              'w-full max-w-5xl max-h-[85vh] overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-xl',
              'w-full max-w-5xl max-h-[85vh] overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-xl'
            )}>
              <div className={t(
                'px-4 py-2 border-b border-sky-200 bg-white flex items-center justify-between',
                'px-4 py-2 border-b border-slate-700 bg-slate-900 flex items-center justify-between'
              )}>
                <div className="font-semibold">{modalTitle}</div>
                <button
                  onClick={closeModal}
                  className={t(
                    'px-2 py-1 text-sm rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-300',
                    'px-2 py-1 text-sm rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-600'
                  )}
                >
                  Close
                </button>
              </div>

              <div className="p-4 overflow-auto max-h-[calc(85vh-48px)]">
                {modalLoading ? (
                  <div className={t('text-sm text-slate-600','text-sm text-slate-300')}>Loading…</div>
                ) : files.length === 0 ? (
                  <div className={t('text-sm text-slate-600','text-sm text-slate-300')}>No files in this category.</div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {files.map(f => (
                      <FileCard key={f._id} file={f} isImage={isImage} formatSize={formatSize} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Sub-nav Tab (same style as Chat/User) ---------- */
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

/* ---------- file card ---------- */
function FileCard({ file, isImage, formatSize }) {
  const { t } = useTheme();
  const image = isImage(file.mime || file.mimetype || '');

  if (image) {
    return (
      <a
        href={file.url}
        target="_blank"
        rel="noreferrer"
        className={t(
          'block rounded-xl overflow-hidden border border-sky-200 bg-white hover:shadow-sm',
          'block rounded-xl overflow-hidden border border-slate-700 bg-slate-900 hover:shadow-sm'
        )}
        title={file.name}
      >
        {/* Lazy fetch happens here by browser because modal just rendered */}
        <img
          src={file.url}
          alt={file.name || 'image'}
          loading="lazy"
          className="w-full h-48 object-cover"
        />
        <div className="px-3 py-2 text-xs flex items-center justify-between">
          <span className="truncate">{file.name || 'image'}</span>
          <span className={t('text-slate-500','text-slate-400')}>{formatSize(file.size)}</span>
        </div>
      </a>
    );
  }

  // Non-image fallback
  return (
    <a
      href={file.url}
      target="_blank"
      rel="noreferrer"
      className={t(
        'block rounded-xl border border-sky-200 bg-white hover:bg-slate-50 p-3',
        'block rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 p-3'
      )}
      title={file.name}
    >
      <div className="flex items-center gap-3">
        <div className={t(
          'w-10 h-10 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 text-xs',
          'w-10 h-10 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-200 text-xs'
        )}>
          {(file.mime || '').split('/')[1]?.toUpperCase() || 'FILE'}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{file.name || 'file'}</div>
          <div className={t('text-xs text-slate-600','text-xs text-slate-400')}>
            {formatSize(file.size)} • {(file.mime || '').toUpperCase()}
          </div>
        </div>
      </div>
    </a>
  );
}

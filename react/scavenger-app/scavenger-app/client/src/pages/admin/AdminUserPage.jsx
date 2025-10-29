// // client/src/pages/admin/AdminUserPage.jsx
// import React, { useEffect, useMemo, useRef, useState } from 'react';
// import { useParams, NavLink } from 'react-router-dom';
// import { api } from '../../api';
// import { useAuth } from '../../auth/AuthContext';
// import { useTheme } from '../../theme/ThemeProvider.jsx';
// import AdminTopNav from './AdminTopNav.jsx';

// /* ---------- Title-case helpers ---------- */
// const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s);
// const toTitleCase = (str = '') =>
//   str
//     .trim()
//     .split(/\s+/)
//     .map((w) => w.split('-').map((h) => h.split("'").map(cap).join("'")).join('-'))
//     .join(' ');

// // Name title-caser (matches AdminChatPage behavior)
// function titleCaseName(s = '') {
//   return s.toLowerCase().replace(/\b[\p{L}]/gu, (ch) => ch.toUpperCase());
// }

// /* ---------- localStorage helpers ---------- */
// const getLS = (k, d = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
// const setLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// const USER_INFO_KEY   = (id) => `admin:user:info:${id}`;
// const USER_INFO_TS    = (id) => `admin:user:info:ts:${id}`;
// const BOXES_KEY       = (country) => `admin:user:boxes:${country}`;
// const BOXES_TS        = (country) => `admin:user:boxes:ts:${country}`;
// const PROGRESS_KEY    = (id) => `admin:user:progress:${id}`;
// const PROGRESS_TS     = (id) => `admin:user:progress:ts:${id}`;

// /* ---------- id guards ---------- */
// const normalizeId = (x) => (typeof x === 'string' ? x : x ? String(x) : '');
// const isValidId = (x) => typeof x === 'string' && x.trim().length > 0;
// const uniq = (arr) => Array.from(new Set(arr));

// export default function AdminUserPage() {
//   const { t } = useTheme();
//   const { user } = useAuth();
//   const { id: userId } = useParams();

//   // ---- seed from cache for instant UI
//   const [userInfo, setUserInfo] = useState(() => getLS(USER_INFO_KEY(userId), null));
//   const seedCountry = userInfo?.country || null;

//   const seedProgress = getLS(PROGRESS_KEY(userId), { assignedOrder: [], stateMap: {} }) || { assignedOrder: [], stateMap: {} };
//   const seededOrder = Array.isArray(seedProgress.assignedOrder) ? seedProgress.assignedOrder : [];
//   // sanitize cached order immediately
//   const [assignedOrder, setAssignedOrder] = useState(() =>
//     uniq(seededOrder.map(normalizeId).filter(isValidId))
//   );
//   const [stateMap, setStateMap] = useState(() => seedProgress.stateMap || {});
//   const [allCountryBoxes, setAllCountryBoxes] = useState(() =>
//     seedCountry ? getLS(BOXES_KEY(seedCountry), []) : []
//   );

//   // Fallback map from /progress (populated statuses.boxId)
//   const [progressBoxMap, setProgressBoxMap] = useState({});

//   const [loading, setLoading] = useState(() => (!userInfo || allCountryBoxes.length === 0));
//   const [err, setErr] = useState('');
//   const [warn, setWarn] = useState(''); // show if we drop bad IDs on save

//   function friendlyError(e, fallback = 'Request failed') {
//     const status = e?.response?.status;
//     const msg = e?.response?.data?.error || e?.message || fallback;
//     return `[${status || 'ERR'}] ${msg}`;
//   }

//   /* ---------------- background refresh (seeded UI → fresh data) ---------------- */
//   const refresh = async () => {
//     if (!user || user.role !== 'admin') return;
//     try {
//       setErr('');
//       setWarn('');

//       // 1) user info
//       const ures = await api.get(`/auth/admin/users`);
//       const u = Array.isArray(ures.data) ? ures.data.find((x) => x._id === userId) : null;
//       if (!u) throw new Error('User not found');
//       const prevUser = getLS(USER_INFO_KEY(userId), null);
//       const sameUser = JSON.stringify(prevUser) === JSON.stringify(u);
//       if (!sameUser) {
//         setLS(USER_INFO_KEY(userId), u);
//         setLS(USER_INFO_TS(userId), Date.now());
//       }
//       setUserInfo((old) => (sameUser ? old : u));

//       // 2) boxes (by country)
//       const country = u.country || '';
//       const bres = await api.get(`/boxes/admin?country=${encodeURIComponent(country)}`);
//       const boxes = Array.isArray(bres.data) ? bres.data : [];
//       const prevBoxes = getLS(BOXES_KEY(country), []);
//       const sameBoxes = JSON.stringify(prevBoxes) === JSON.stringify(boxes);
//       if (!sameBoxes) {
//         setLS(BOXES_KEY(country), boxes);
//         setLS(BOXES_TS(country), Date.now());
//       }
//       setAllCountryBoxes((old) => (sameBoxes ? old : boxes));

//       // 3) progress / statuses (populated)
//       const pres = await api.get(`/progress/user/${userId}`);
//       const st = Array.isArray(pres.data?.statuses) ? pres.data.statuses : [];

//       const orderRaw = st.map((s) => normalizeId(s.boxId?._id || s.boxId));
//       const order = uniq(orderRaw.filter(isValidId)); // sanitize order from server, too

//       const map = {};
//       const pbox = {};
//       st.forEach((s) => {
//         const id = normalizeId(s.boxId?._id || s.boxId);
//         if (!isValidId(id)) return;

//         if (typeof s.state !== 'undefined') map[id] = s.state; // null | 'pending' | 'completed'
//         else map[id] = s.completed ? 'completed' : null;

//         if (s.boxId && s.boxId._id) {
//           pbox[id] = {
//             _id: s.boxId._id,
//             key: s.boxId.key,
//             title: s.boxId.title,
//             description: s.boxId.description,
//             weight: s.boxId.weight,
//             country: s.boxId.country,
//           };
//         }
//       });
//       setProgressBoxMap(pbox);

//       const prevProgress = getLS(PROGRESS_KEY(userId), { assignedOrder: [], stateMap: {} }) || { assignedOrder: [], stateMap: {} };
//       const sameProgress =
//         JSON.stringify(prevProgress.assignedOrder) === JSON.stringify(order) &&
//         JSON.stringify(prevProgress.stateMap) === JSON.stringify(map);

//       if (!sameProgress) {
//         setLS(PROGRESS_KEY(userId), { assignedOrder: order, stateMap: map });
//         setLS(PROGRESS_TS(userId), Date.now());
//       }
//       setAssignedOrder(order);   // already sanitized
//       setStateMap((old) => (sameProgress ? old : map));
//     } catch (e) {
//       setErr(friendlyError(e, 'Failed to load'));
//     } finally {
//       setLoading(false);
//     }
//   };

//   // On mount / user change → refresh
//   useEffect(() => {
//     if (user?.role === 'admin') refresh();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [userId, user?.role]);

//   // Gentle polling to keep "real-time-ish"
//   useEffect(() => {
//     const id = setInterval(() => refresh(), 45000); // 45s
//     return () => clearInterval(id);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [userId, user?.role]);

//   // Persist progress changes immediately to cache
//   useEffect(() => {
//     // store sanitized version
//     const clean = uniq(assignedOrder.map(normalizeId).filter(isValidId));
//     if (clean.length !== assignedOrder.length || clean.some((v, i) => v !== assignedOrder[i])) {
//       setAssignedOrder(clean);
//       setLS(PROGRESS_KEY(userId), { assignedOrder: clean, stateMap });
//       setLS(PROGRESS_TS(userId), Date.now());
//     } else {
//       setLS(PROGRESS_KEY(userId), { assignedOrder, stateMap });
//       setLS(PROGRESS_TS(userId), Date.now());
//     }
//   }, [assignedOrder, stateMap, userId]);

//   const assignedSet = useMemo(() => new Set(assignedOrder), [assignedOrder]);

//   const totalWeight = useMemo(
//     () => allCountryBoxes.reduce((sum, b) => sum + (Number(b.weight) || 0), 0),
//     [allCountryBoxes]
//   );
//   const earnedWeight = useMemo(
//     () =>
//       allCountryBoxes.reduce((sum, b) => {
//         const isAssigned = assignedSet.has(b._id);
//         const isCompleted = (stateMap[b._id] || null) === 'completed';
//         return sum + (isAssigned && isCompleted ? (Number(b.weight) || 0) : 0);
//       }, 0),
//     [allCountryBoxes, assignedSet, stateMap]
//   );
//   const percent = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

//   /* ---------------------- Assign / Unassign ---------------------- */
//   function toggleAssign(boxIdRaw, checked) {
//     const boxId = normalizeId(boxIdRaw);
//     if (!isValidId(boxId)) return;

//     setAssignedOrder((prev) => {
//       const set = new Set(prev);
//       if (checked) {
//         if (!set.has(boxId)) return [...prev, boxId]; // append to end
//         return prev;
//       } else {
//         return prev.filter((id) => id !== boxId);
//       }
//     });

//     setStateMap((prev) => {
//       if (checked) {
//         if (Object.prototype.hasOwnProperty.call(prev, boxId)) return prev;
//         return { ...prev, [boxId]: null };
//       } else {
//         const copy = { ...prev };
//         delete copy[boxId];
//         return copy;
//       }
//     });
//   }

//   // Assign All (adds every box in current country in the shown order)
//   function assignAll() {
//     const ids = allCountryBoxes.map((b) => normalizeId(b._id)).filter(isValidId);
//     setAssignedOrder(uniq(ids));
//     setStateMap((prev) => {
//       const next = { ...prev };
//       for (const id of ids) {
//         if (!Object.prototype.hasOwnProperty.call(next, id)) next[id] = null;
//       }
//       return next;
//     });
//   }

//   /* -------------------------- Change state -------------------------- */
//   function changeStatus(boxIdRaw, next) {
//     const boxId = normalizeId(boxIdRaw);
//     if (!isValidId(boxId)) return;
//     const val = next === 'null' ? null : next;
//     const norm = val === 'pending' || val === 'completed' || val === null ? val : null;
//     setStateMap((prev) => ({ ...prev, [boxId]: norm }));
//   }

//   /* ------------------------ Drag & Drop order ----------------------- */
//   const dragFromIndex = useRef(null);
//   function onDragStart(e, index) {
//     dragFromIndex.current = index;
//     e.dataTransfer.effectAllowed = 'move';
//   }
//   function onDragOver(e) {
//     e.preventDefault();
//   }
//   function onDrop(e, toIndex) {
//     e.preventDefault();
//     const fromIndex = dragFromIndex.current;
//     if (fromIndex === null || fromIndex === toIndex) return;
//     setAssignedOrder((prev) => {
//       const next = [...prev];
//       const [moved] = next.splice(fromIndex, 1);
//       if (!isValidId(moved)) return prev; // guard
//       next.splice(toIndex, 0, moved);
//       return next;
//     });
//     dragFromIndex.current = null;
//   }

//   /* --------------------------- Save to API -------------------------- */
//   async function saveAssignment(e) {
//     e.preventDefault();
//     try {
//       setErr('');
//       setWarn('');

//       // Only keep boxes that exist and match the user's country
//       const country = userInfo?.country || '';
//       const byId = (id) =>
//         allCountryBoxes.find((b) => b._id === id) ||
//         progressBoxMap[id] ||
//         null;

//       const droppedUnknown = [];
//       const droppedCountry = [];

//       const cleanOrder = uniq(
//         assignedOrder
//           .map(normalizeId)
//           .filter(isValidId)
//           .filter((id) => {
//             const box = byId(id);
//             if (!box) { droppedUnknown.push(id); return false; }
//             if (country && box.country && box.country !== country) { droppedCountry.push(id); return false; }
//             return true;
//           })
//       );

//       const sanitizeState = (v) => (v === 'pending' || v === 'completed' || v === null ? v : null);

//       const assignments = cleanOrder.map((boxId) => ({
//         boxId,
//         state: sanitizeState(Object.prototype.hasOwnProperty.call(stateMap, boxId) ? stateMap[boxId] : null),
//       }));

//       // Send both for compatibility (server will prefer `assignments`)
//       await api.post('/progress/assign', { userId, assignments, boxIds: cleanOrder });

//       if (droppedUnknown.length || droppedCountry.length) {
//         setWarn(
//           [
//             droppedUnknown.length ? `Skipped ${droppedUnknown.length} unknown/deleted box(es).` : '',
//             droppedCountry.length ? `Skipped ${droppedCountry.length} box(es) from a different country.` : '',
//           ].filter(Boolean).join(' ')
//         );
//       }

//       await refresh(); // pull latest after save
//     } catch (e2) {
//       setErr(friendlyError(e2, 'Assign failed'));
//     }
//   }

//   if (!user || user.role !== 'admin') {
//     return (
//       <div className="p-4">
//         <div className="text-red-700 text-sm">Admins only.</div>
//       </div>
//     );
//   }

//   // Append these links to the main nav
//   const secondaryLinks = [
//     { to: `/admin/user/${userId}`, label: 'Progress', exact: true },
//     { to: `/admin/user/${userId}/files`, label: 'Files' },
//     { to: `/admin/chat/${userId}`, label: 'Chat' },
//   ];

//   // Right side context text (name/email)
//   const rightText = userInfo ? (userInfo.name ? titleCaseName(userInfo.name) : userInfo.email) : '—';

//   // Helper for rendering a box by id, using both sources
//   const findBox = (id) => allCountryBoxes.find((b) => b._id === id) || progressBoxMap[id] || null;

//   return (
//     <div className={t(
//       'min-h-screen bg-sky-100 text-slate-800',
//       'min-h-screen bg-sky-900 text-slate-100'
//     )}>
//       <AdminTopNav secondary={secondaryLinks} rightText={rightText} />

//       <main className="mx-auto p-4 max-w-[1200px] grid gap-4">
//         {/* Header row */}
//         <header className={t(
//           'rounded-xl overflow-hidden border border-sky-200 shadow-sm',
//           'rounded-xl overflow-hidden border border-slate-900 shadow-sm'
//         )}>
//           {/* User summary */}
//           <div className={t('p-4 grid gap-3 sm:grid-cols-2 bg-sky-50 text-slate-800', 'p-4 grid gap-3 sm:grid-cols-2 bg-slate-950/40 text-slate-200')}>
//             <div className="grid gap-1">
//               <div>
//                 <span className={t('text-slate-600', 'text-slate-300')}>Name:</span>{' '}
//                 <span className="font-medium">{userInfo ? toTitleCase(userInfo.name || '') : '—'}</span>
//               </div>
//               <div>
//                 <span className={t('text-slate-600', 'text-slate-300')}>Email:</span>{' '}
//                 {userInfo?.email ? (
//                   <a className={t('underline underline-offset-2 hover:text-slate-900', 'underline underline-offset-2 hover:text-white')} href={`mailto:${userInfo.email}`}>
//                     {userInfo.email}
//                   </a>
//                 ) : (
//                   <span>—</span>
//                 )}
//               </div>
//               <div>
//                 <span className={t('text-slate-600', 'text-slate-300')}>Country:</span>{' '}
//                 <span className="font-medium">{userInfo?.country || '—'}</span>
//               </div>
//             </div>

//             <div className="grid gap-1">
//               <div className="flex items-center justify-between text-sm">
//                 <span className={t('text-slate-600', 'text-slate-300')}>Progress</span>
//                 <span className={t('font-semibold text-slate-900', 'font-semibold text-slate-100')}>{percent}%</span>
//               </div>
//               <div className={t('h-2 rounded-full bg-slate-200 overflow-hidden border border-slate-300', 'h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700')}>
//                 <div className="h-full bg-emerald-500" style={{ width: `${percent}%` }} />
//               </div>
//             </div>
//           </div>
//         </header>

//         {err && (
//           <div className={t(
//             'p-3 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm whitespace-pre-wrap',
//             'p-3 rounded-lg border border-red-400/40 bg-red-500/15 text-red-200 text-sm whitespace-pre-wrap'
//           )}>
//             {err}
//           </div>
//         )}

//         {warn && !err && (
//           <div className={t(
//             'p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm whitespace-pre-wrap',
//             'p-3 rounded-lg border border-amber-400/40 bg-amber-600/15 text-amber-200 text-sm whitespace-pre-wrap'
//           )}>
//             {warn}
//           </div>
//         )}

//         {loading ? (
//           <div className={t('text-sm text-slate-600', 'text-sm text-slate-300')}>Loading…</div>
//         ) : (
//           <>
//             {/* Assignment editor */}
//             <section className="grid lg:grid-cols-2 gap-4">
//               {/* LEFT: all boxes with assign checkbox */}
//               <div className={t('rounded-xl border border-sky-200 shadow-sm overflow-hidden bg-white', 'rounded-xl border border-slate-800/60 shadow-sm overflow-hidden bg-slate-950/40')}>
//                 <div className={t(
//                   'px-4 py-2 border-b border-sky-200 bg-white text-slate-900 flex items-center justify-between',
//                   'px-4 py-2 border-b border-slate-800 bg-slate-900 text-white flex items-center justify-between'
//                 )}>
//                   <h2 className="text-sm font-semibold">All Boxes</h2>
//                   <div className="flex items-center gap-2">
//                     <button
//                       type="button"
//                       onClick={assignAll}
//                       className={t(
//                         'px-2 py-1 rounded-md border border-sky-300 bg-sky-100 text-sky-700 text-[11px] hover:bg-sky-200',
//                         'px-2 py-1 rounded-md border border-emerald-500/40 bg-emerald-600/20 text-emerald-200 text-[11px] hover:bg-emerald-600/30'
//                       )}
//                     >
//                       Assign All
//                     </button>
//                   </div>
//                 </div>

//                 <div className={t('p-4 grid gap-2 bg-white', 'p-4 grid gap-2 bg-slate-950/40')}>
//                   {allCountryBoxes.map((b) => {
//                     const assigned = assignedSet.has(b._id);

//                     const unassignedCls = t('border-slate-200 bg-white hover:bg-slate-50', 'border-slate-800 bg-slate-900 hover:bg-slate-900/70');
//                     const assignedCls   = t('border-sky-400/50 bg-sky-50', 'border-sky-500/40 bg-sky-500/10');

//                     return (
//                       <label
//                         key={b._id}
//                         className={[
//                           'p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition leading-tight min-w-0',
//                           assigned ? assignedCls : unassignedCls
//                         ].join(' ')}
//                       >
//                         <input
//                           type="checkbox"
//                           checked={assigned}
//                           onChange={(e) => toggleAssign(b._id, e.target.checked)}
//                           className="accent-sky-600"
//                         />
//                         <div className="min-w-0">
//                           <div className={t('font-semibold truncate text-slate-900 text-[13px]', 'font-semibold truncate text-slate-100 text-[13px]')}>
//                             {toTitleCase(b.title || '')}{' '}
//                             <span className={t('text-slate-500 text-[11px]', 'text-slate-400 text-[11px]')}>({b.key})</span>
//                           </div>
//                           <div className={t('text-[12px] text-slate-600 truncate', 'text-[12px] text-slate-300 truncate')}>
//                             {b.description || '—'}
//                           </div>
//                         </div>
//                         <div className="ml-auto flex items-center gap-2">
//                           <span className={t('font-mono text-xs text-slate-800', 'font-mono text-xs text-slate-200')}>{b.weight}%</span>
//                         </div>
//                       </label>
//                     );
//                   })}
//                 </div>
//               </div>

//               {/* RIGHT: Assigned (ordered + tri-state + DnD) */}
//               <div className={t('rounded-xl border border-sky-200 shadow-sm overflow-hidden bg-white', 'rounded-xl border border-slate-800/60 shadow-sm overflow-hidden bg-slate-950/40')}>
//                 <div className={t(
//                   'px-4 py-2 border-b border-sky-200 bg-white text-slate-900 flex items-center justify-between',
//                   'px-4 py-2 border-b border-slate-800 bg-slate-900 text-white flex items-center justify-between'
//                 )}>
//                   <h2 className="text-sm font-semibold">Assigned Order</h2>
//                   <span className={t('text-[11px] text-slate-600', 'text-[11px] text-white/80')}>Drag to reorder</span>
//                 </div>

//                 {!assignedOrder.length ? (
//                   <div className={t('p-4 text-sm text-slate-600 bg-white', 'p-4 text-sm text-slate-300 bg-slate-950/40')}>
//                     No boxes assigned yet. Click <span className="font-semibold">Assign All</span> or check items on the left to assign.
//                   </div>
//                 ) : (
//                   <ul className={t('p-4 space-y-2 bg-white', 'p-4 space-y-2 bg-slate-950/40')}>
//                     {assignedOrder.map((boxIdRaw, idx) => {
//                       const boxId = normalizeId(boxIdRaw);
//                       const box = isValidId(boxId) ? findBox(boxId) : null;
//                       const status = isValidId(boxId) ? (stateMap[boxId] ?? null) : null;

//                       if (!isValidId(boxId) || !box) {
//                         // Unknown/deleted/invalid ID — still render so you can Remove it
//                         const shortId = isValidId(boxId) ? String(boxId).slice(-6) : 'unknown';
//                         return (
//                           <li
//                             key={boxId || `invalid-${idx}`}
//                             draggable
//                             onDragStart={(e) => onDragStart(e, idx)}
//                             onDragOver={onDragOver}
//                             onDrop={(e) => onDrop(e, idx)}
//                             className={`rounded-lg border ${t('border-amber-300 bg-amber-50','border-amber-600/40 bg-amber-600/15')} hover:shadow-sm transition`}
//                           >
//                             <div className="p-3 flex items-center gap-3 leading-tight">
//                               <span className={t('cursor-grab select-none text-slate-500 pr-1 text-sm', 'cursor-grab select-none text-slate-500 pr-1 text-sm')}>⋮⋮</span>
//                               <div className={t(
//                                 'w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-semibold text-slate-700 text-[12px]',
//                                 'w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center font-semibold text-slate-100 text-[12px]'
//                               )}>
//                                 {idx + 1}
//                               </div>
//                               <div className="min-w-0">
//                                 <div className={t('font-medium text-slate-900 text-[14px]', 'font-medium text-slate-100 text-[14px]')}>
//                                   Unknown box (id: {shortId})
//                                 </div>
//                                 <div className={t('text-[12px] text-slate-600', 'text-[12px] text-slate-300')}>
//                                   This box no longer exists or the ID is invalid. Remove it to save.
//                                 </div>
//                               </div>
//                               <div className="ml-auto">
//                                 <button
//                                   type="button"
//                                   onClick={() => toggleAssign(boxId, false)}
//                                   className={t(
//                                     'px-2 py-1 text-xs rounded-md bg-red-50 text-red-700 hover:bg-red-100 border border-red-200',
//                                     'px-2 py-1 text-xs rounded-md bg-red-600/20 text-red-200 hover:bg-red-600/30 border border-red-600/40'
//                                   )}
//                                   title="Unassign"
//                                 >
//                                   Remove
//                                 </button>
//                               </div>
//                             </div>
//                           </li>
//                         );
//                       }

//                       const wrap =
//                         status === 'completed'
//                           ? t('border-emerald-400/50 bg-emerald-50', 'border-emerald-600/40 bg-emerald-600/15')
//                           : status === 'pending'
//                           ? t('border-amber-400/50 bg-amber-50', 'border-amber-600/40 bg-amber-600/15')
//                           : t('border-slate-200 bg-white', 'border-slate-800 bg-slate-900');

//                       return (
//                         <li
//                           key={boxId}
//                           draggable
//                           onDragStart={(e) => onDragStart(e, idx)}
//                           onDragOver={onDragOver}
//                           onDrop={(e) => onDrop(e, idx)}
//                           className={`rounded-lg border ${wrap} hover:shadow-sm transition`}
//                         >
//                           <div className="p-3 flex items-center gap-3 leading-tight">
//                             {/* drag handle */}
//                             <span className={t('cursor-grab select-none text-slate-500 pr-1 text-sm', 'cursor-grab select-none text-slate-500 pr-1 text-sm')}>⋮⋮</span>

//                             {/* order # */}
//                             <div className={t(
//                               'w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-semibold text-slate-700 text-[12px]',
//                               'w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center font-semibold text-slate-100 text-[12px]'
//                             )}>
//                               {idx + 1}
//                             </div>

//                             {/* label */}
//                             <div className="min-w-0">
//                               <div className={t('font-medium truncate text-slate-900 text-[14px]', 'font-medium truncate text-slate-100 text-[14px]')}>
//                                 {box.key} — {toTitleCase(box.title || '')}
//                               </div>
//                               <div className={t('text-[12px] text-slate-600 truncate', 'text-[12px] text-slate-300 truncate')}>
//                                 {box.description || '—'}
//                               </div>
//                             </div>

//                             {/* status selector */}
//                             <div className="ml-auto flex items-center gap-2">
//                               <select
//                                 value={status === null ? 'null' : status}
//                                 onChange={(e) => changeStatus(boxId, e.target.value)}
//                                 className={t(
//                                   'border border-slate-300 rounded-md px-2 py-1 text-sm bg-white text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
//                                   'border border-slate-700 rounded-md px-2 py-1 text-sm bg-slate-900 text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70'
//                                 )}
//                               >
//                                 <option value="null">Not touched</option>
//                                 <option value="pending">Pending</option>
//                                 <option value="completed">Completed</option>
//                               </select>
//                               <button
//                                 type="button"
//                                 onClick={() => toggleAssign(boxId, false)}
//                                 className={t(
//                                   'px-2 py-1 text-xs rounded-md bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300',
//                                   'px-2 py-1 text-xs rounded-md bg-red-600/20 text-red-200 hover:bg-red-600/30 border border-red-600/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70'
//                                 )}
//                                 title="Unassign"
//                               >
//                                 Remove
//                               </button>
//                             </div>
//                           </div>
//                         </li>
//                       );
//                     })}
//                   </ul>
//                 )}
//               </div>
//             </section>

//             {/* Footer actions */}
//             <form
//               onSubmit={saveAssignment}
//               className={t(
//                 'mt-1 rounded-xl border border-sky-200 bg-white shadow-sm p-3 flex items-center justify-between',
//                 'mt-1 rounded-xl border border-slate-800/60 bg-slate-950/40 shadow-sm p-3 flex items-center justify-between'
//               )}
//             >
//               <div className={t('text-sm text-slate-700', 'text-sm text-slate-300')}>
//                 Assigned: <span className={t('font-semibold text-slate-900', 'font-semibold text-slate-100')}>{assignedOrder.length}</span> / {allCountryBoxes.length}
//               </div>
//               <button
//                 className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white border border-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70"
//               >
//                 Save Assignment
//               </button>
//             </form>
//           </>
//         )}
//       </main>
//     </div>
//   );
// }

// /* ---------- shared Tab (same styling as AdminChatPage) ---------- */
// function Tab({ to, exact = false, children }) {
//   const { t } = useTheme();
//   return (
//     <NavLink
//       to={to}
//       end={exact}
//       className={({ isActive }) =>
//         t(
//           [
//             'px-3 py-1.5 rounded-md transition font-medium',
//             'text-slate-700 hover:bg-slate-200',
//             'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
//             isActive ? 'bg-sky-200 text-slate-900' : ''
//           ].join(' '),
//           [
//             'px-3 py-1.5 rounded-md transition font-medium',
//             'text-slate-200 hover:bg-white/10',
//             'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70',
//             isActive ? 'bg-sky-800/50 text-white' : ''
//           ].join(' ')
//         )
//       }
//     >
//       {children}
//     </NavLink>
//   );
// }














// import React, { useEffect, useMemo, useRef, useState } from 'react';
// import { useParams, NavLink } from 'react-router-dom';
// import { api } from '../../api';
// import { useAuth } from '../../auth/AuthContext';
// import { useTheme } from '../../theme/ThemeProvider.jsx';
// import AdminTopNav from './AdminTopNav.jsx';

// /* ---------- Title-case helpers ---------- */
// const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s);
// const toTitleCase = (str = '') =>
//   str
//     .trim()
//     .split(/\s+/)
//     .map((w) => w.split('-').map((h) => h.split("'").map(cap).join("'")).join('-'))
//     .join(' ');

// // Name title-caser (matches AdminChatPage behavior)
// function titleCaseName(s = '') {
//   return s.toLowerCase().replace(/\b[\p{L}]/gu, (ch) => ch.toUpperCase());
// }

// /* ---------- localStorage helpers ---------- */
// const getLS = (k, d = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
// const setLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// const USER_INFO_KEY   = (id) => `admin:user:info:${id}`;
// const USER_INFO_TS    = (id) => `admin:user:info:ts:${id}`;
// const BOXES_KEY       = (country) => `admin:user:boxes:${country}`;
// const BOXES_TS        = (country) => `admin:user:boxes:ts:${country}`;
// const PROGRESS_KEY    = (id) => `admin:user:progress:${id}`;
// const PROGRESS_TS     = (id) => `admin:user:progress:ts:${id}`;
// const INTAKE_KEY      = (id) => `admin:user:intake:${id}`;
// const INTAKE_TS       = (id) => `admin:user:intake:ts:${id}`;

// /* ---------- id guards ---------- */
// const normalizeId = (x) => (typeof x === 'string' ? x : x ? String(x) : '');
// const isValidId = (x) => typeof x === 'string' && x.trim().length > 0;
// const uniq = (arr) => Array.from(new Set(arr));

// export default function AdminUserPage() {
//   const { t } = useTheme();
//   const { user } = useAuth();
//   const { id: userId } = useParams();

//   // ---- seed from cache for instant UI
//   const [userInfo, setUserInfo] = useState(() => getLS(USER_INFO_KEY(userId), null));
//   const seedCountry = userInfo?.country || null;

//   const seedProgress = getLS(PROGRESS_KEY(userId), { assignedOrder: [], stateMap: {} }) || { assignedOrder: [], stateMap: {} };
//   const seededOrder = Array.isArray(seedProgress.assignedOrder) ? seedProgress.assignedOrder : [];
//   // sanitize cached order immediately
//   const [assignedOrder, setAssignedOrder] = useState(() =>
//     uniq(seededOrder.map(normalizeId).filter(isValidId))
//   );
//   const [stateMap, setStateMap] = useState(() => seedProgress.stateMap || {});
//   const [allCountryBoxes, setAllCountryBoxes] = useState(() =>
//     seedCountry ? getLS(BOXES_KEY(seedCountry), []) : []
//   );
//   const [intake, setIntake] = useState(() => getLS(INTAKE_KEY(userId), null));

//   // Fallback map from /progress (populated statuses.boxId)
//   const [progressBoxMap, setProgressBoxMap] = useState({});

//   const [loading, setLoading] = useState(() => (!userInfo || allCountryBoxes.length === 0));
//   const [err, setErr] = useState('');
//   const [warn, setWarn] = useState(''); // show if we drop bad IDs on save
//   const [openIntake, setOpenIntake] = useState(true);

//   function friendlyError(e, fallback = 'Request failed') {
//     const status = e?.response?.status;
//     const msg = e?.response?.data?.error || e?.message || fallback;
//     return `[${status || 'ERR'}] ${msg}`;
//   }

//   /* ---------------- background refresh (seeded UI → fresh data) ---------------- */
//   const refresh = async () => {
//     if (!user || user.role !== 'admin') return;
//     try {
//       setErr('');
//       setWarn('');

//       // 1) user info
//       const ures = await api.get(`/auth/admin/users`);
//       const u = Array.isArray(ures.data) ? ures.data.find((x) => x._id === userId) : null;
//       if (!u) throw new Error('User not found');
//       const prevUser = getLS(USER_INFO_KEY(userId), null);
//       const sameUser = JSON.stringify(prevUser) === JSON.stringify(u);
//       if (!sameUser) {
//         setLS(USER_INFO_KEY(userId), u);
//         setLS(USER_INFO_TS(userId), Date.now());
//       }
//       setUserInfo((old) => (sameUser ? old : u));

//       // 2) boxes (by country)
//       const country = u.country || '';
//       const bres = await api.get(`/boxes/admin?country=${encodeURIComponent(country)}`);
//       const boxes = Array.isArray(bres.data) ? bres.data : [];
//       const prevBoxes = getLS(BOXES_KEY(country), []);
//       const sameBoxes = JSON.stringify(prevBoxes) === JSON.stringify(boxes);
//       if (!sameBoxes) {
//         setLS(BOXES_KEY(country), boxes);
//         setLS(BOXES_TS(country), Date.now());
//       }
//       setAllCountryBoxes((old) => (sameBoxes ? old : boxes));

//       // 3) progress / statuses (populated)
//       const pres = await api.get(`/progress/user/${userId}`);
//       const st = Array.isArray(pres.data?.statuses) ? pres.data.statuses : [];

//       const orderRaw = st.map((s) => normalizeId(s.boxId?._id || s.boxId));
//       const order = uniq(orderRaw.filter(isValidId)); // sanitize order from server, too

//       const map = {};
//       const pbox = {};
//       st.forEach((s) => {
//         const id = normalizeId(s.boxId?._id || s.boxId);
//         if (!isValidId(id)) return;

//         if (typeof s.state !== 'undefined') map[id] = s.state; // null | 'pending' | 'completed'
//         else map[id] = s.completed ? 'completed' : null;

//         if (s.boxId && s.boxId._id) {
//           pbox[id] = {
//             _id: s.boxId._id,
//             key: s.boxId.key,
//             title: s.boxId.title,
//             description: s.boxId.description,
//             weight: s.boxId.weight,
//             country: s.boxId.country,
//           };
//         }
//       });
//       setProgressBoxMap(pbox);

//       const prevProgress = getLS(PROGRESS_KEY(userId), { assignedOrder: [], stateMap: {} }) || { assignedOrder: [], stateMap: {} };
//       const sameProgress =
//         JSON.stringify(prevProgress.assignedOrder) === JSON.stringify(order) &&
//         JSON.stringify(prevProgress.stateMap) === JSON.stringify(map);

//       if (!sameProgress) {
//         setLS(PROGRESS_KEY(userId), { assignedOrder: order, stateMap: map });
//         setLS(PROGRESS_TS(userId), Date.now());
//       }
//       setAssignedOrder(order);   // already sanitized
//       setStateMap((old) => (sameProgress ? old : map));

//       // 4) intake (admin view)
//       try {
//         const ires = await api.get(`/admin/intake/${userId}`);
//         const doc = ires.data || null;
//         const i = doc?.intake || null;
//         const prevI = getLS(INTAKE_KEY(userId), null);
//         const sameI = JSON.stringify(prevI) === JSON.stringify(i);
//         if (!sameI) {
//           setLS(INTAKE_KEY(userId), i);
//           setLS(INTAKE_TS(userId), Date.now());
//         }
//         setIntake((old) => (sameI ? old : i));
//       } catch (ie) {
//         console.warn('[AdminUserPage] intake fetch failed:', ie?.message || ie);
//       }
//     } catch (e) {
//       setErr(friendlyError(e, 'Failed to load'));
//     } finally {
//       setLoading(false);
//     }
//   };

//   // On mount / user change → refresh
//   useEffect(() => {
//     if (user?.role === 'admin') refresh();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [userId, user?.role]);

//   // Gentle polling
//   useEffect(() => {
//     const id = setInterval(() => refresh(), 45000);
//     return () => clearInterval(id);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [userId, user?.role]);

//   // Persist progress changes immediately to cache
//   useEffect(() => {
//     const clean = uniq(assignedOrder.map(normalizeId).filter(isValidId));
//     if (clean.length !== assignedOrder.length || clean.some((v, i) => v !== assignedOrder[i])) {
//       setAssignedOrder(clean);
//       setLS(PROGRESS_KEY(userId), { assignedOrder: clean, stateMap });
//       setLS(PROGRESS_TS(userId), Date.now());
//     } else {
//       setLS(PROGRESS_KEY(userId), { assignedOrder, stateMap });
//       setLS(PROGRESS_TS(userId), Date.now());
//     }
//   }, [assignedOrder, stateMap, userId]);

//   const assignedSet = useMemo(() => new Set(assignedOrder), [assignedOrder]);

//   const totalWeight = useMemo(
//     () => allCountryBoxes.reduce((sum, b) => sum + (Number(b.weight) || 0), 0),
//     [allCountryBoxes]
//   );
//   const earnedWeight = useMemo(
//     () =>
//       allCountryBoxes.reduce((sum, b) => {
//         const isAssigned = assignedSet.has(b._id);
//         const isCompleted = (stateMap[b._id] || null) === 'completed';
//         return sum + (isAssigned && isCompleted ? (Number(b.weight) || 0) : 0);
//       }, 0),
//     [allCountryBoxes, assignedSet, stateMap]
//   );
//   const percent = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

//   /* ---------------------- Assign / Unassign ---------------------- */
//   function toggleAssign(boxIdRaw, checked) {
//     const boxId = normalizeId(boxIdRaw);
//     if (!isValidId(boxId)) return;

//     setAssignedOrder((prev) => {
//       const set = new Set(prev);
//       if (checked) {
//         if (!set.has(boxId)) return [...prev, boxId];
//         return prev;
//       } else {
//         return prev.filter((id) => id !== boxId);
//       }
//     });

//     setStateMap((prev) => {
//       if (checked) {
//         if (Object.prototype.hasOwnProperty.call(prev, boxId)) return prev;
//         return { ...prev, [boxId]: null };
//       } else {
//         const copy = { ...prev };
//         delete copy[boxId];
//         return copy;
//       }
//     });
//   }

//   // Assign All
//   function assignAll() {
//     const ids = allCountryBoxes.map((b) => normalizeId(b._id)).filter(isValidId);
//     setAssignedOrder(uniq(ids));
//     setStateMap((prev) => {
//       const next = { ...prev };
//       for (const id of ids) {
//         if (!Object.prototype.hasOwnProperty.call(next, id)) next[id] = null;
//       }
//       return next;
//     });
//   }

//   /* -------------------------- Change state -------------------------- */
//   function changeStatus(boxIdRaw, next) {
//     const boxId = normalizeId(boxIdRaw);
//     if (!isValidId(boxId)) return;
//     const val = next === 'null' ? null : next;
//     const norm = val === 'pending' || val === 'completed' || val === null ? val : null;
//     setStateMap((prev) => ({ ...prev, [boxId]: norm }));
//   }

//   /* ------------------------ Drag & Drop order ----------------------- */
//   const dragFromIndex = useRef(null);
//   function onDragStart(e, index) {
//     dragFromIndex.current = index;
//     e.dataTransfer.effectAllowed = 'move';
//   }
//   function onDragOver(e) {
//     e.preventDefault();
//   }
//   function onDrop(e, toIndex) {
//     e.preventDefault();
//     const fromIndex = dragFromIndex.current;
//     if (fromIndex === null || fromIndex === toIndex) return;
//     setAssignedOrder((prev) => {
//       const next = [...prev];
//       const [moved] = next.splice(fromIndex, 1);
//       if (!isValidId(moved)) return prev;
//       next.splice(toIndex, 0, moved);
//       return next;
//     });
//     dragFromIndex.current = null;
//   }

//   /* --------------------------- Save to API -------------------------- */
//   async function saveAssignment(e) {
//     e.preventDefault();
//     try {
//       setErr('');
//       setWarn('');

//       const country = userInfo?.country || '';
//       const byId = (id) =>
//         allCountryBoxes.find((b) => b._id === id) ||
//         progressBoxMap[id] ||
//         null;

//       const droppedUnknown = [];
//       const droppedCountry = [];

//       const cleanOrder = uniq(
//         assignedOrder
//           .map(normalizeId)
//           .filter(isValidId)
//           .filter((id) => {
//             const box = byId(id);
//             if (!box) { droppedUnknown.push(id); return false; }
//             if (country && box.country && box.country !== country) { droppedCountry.push(id); return false; }
//             return true;
//           })
//       );

//       const sanitizeState = (v) => (v === 'pending' || v === 'completed' || v === null ? v : null);

//       const assignments = cleanOrder.map((boxId) => ({
//         boxId,
//         state: sanitizeState(Object.prototype.hasOwnProperty.call(stateMap, boxId) ? stateMap[boxId] : null),
//       }));

//       await api.post('/progress/assign', { userId, assignments, boxIds: cleanOrder });

//       if (droppedUnknown.length || droppedCountry.length) {
//         setWarn(
//           [
//             droppedUnknown.length ? `Skipped ${droppedUnknown.length} unknown/deleted box(es).` : '',
//             droppedCountry.length ? `Skipped ${droppedCountry.length} box(es) from a different country.` : '',
//           ].filter(Boolean).join(' ')
//         );
//       }

//       await refresh();
//     } catch (e2) {
//       setErr(friendlyError(e2, 'Assign failed'));
//     }
//   }

//   if (!user || user.role !== 'admin') {
//     return (
//       <div className="p-4">
//         <div className="text-red-700 text-sm">Admins only.</div>
//       </div>
//     );
//   }

//   // Append these links to the main nav
//   const secondaryLinks = [
//     { to: `/admin/user/${userId}`, label: 'Progress', exact: true },
//     { to: `/admin/user/${userId}/files`, label: 'Files' },
//     { to: `/admin/chat/${userId}`, label: 'Chat' },
//   ];

//   // Right side context text (name/email)
//   const rightText = userInfo ? (userInfo.name ? titleCaseName(userInfo.name) : userInfo.email) : '—';

//   // Helper for rendering a box by id, using both sources
//   const findBox = (id) => allCountryBoxes.find((b) => b._id === id) || progressBoxMap[id] || null;

//   /* ---------- Intake render helpers ---------- */
//   const Row = ({ k, v }) => (
//     <div className="grid grid-cols-3 gap-2 text-[13px]">
//       <div className="text-slate-400">{k}</div>
//       <div className="col-span-2 break-words">{v ?? '—'}</div>
//     </div>
//   );

//   function fmtBool(v) {
//     return v === true ? 'Yes' : v === false ? 'No' : '—';
//   }

//   function renderIntake() {
//     if (!intake) return <div className="text-sm text-slate-400">No intake submitted.</div>;

//     const p = intake.personal || {};
//     const i = intake.identity || {};
//     const f = intake.familyIsrael || {};
//     const s = intake.stayStatus || {};
//     const l = intake.legal || {};
//     const m = intake.medical || {};
//     const r = intake.serviceIntent || {};

//     return (
//       <div className="grid gap-4">
//         <section className="grid gap-2">
//           <div className="font-semibold">Personal</div>
//           <Row k="Full name" v={p.fullName} />
//           <Row k="DOB" v={p.dob} />
//           <Row k="Country" v={p.country} />
//           <Row k="Citizenships" v={(p.citizenships || []).join(', ') || '—'} />
//           <Row k="Address" v={p.address} />
//           <Row k="Phone" v={p.phone} />
//           <Row k="Email" v={p.email} />
//         </section>

//         <section className="grid gap-2">
//           <div className="font-semibold">Jewish Background</div>
//           <Row k="Jewish" v={fmtBool(i.isJewish)} />
//           {i.isJewish === true && (
//             <>
//               <Row k="Born to Jewish mother" v={fmtBool(i.bornToJewishMother)} />
//               {i.bornToJewishMother === false && (
//                 <>
//                   <Row k="Converted" v={fmtBool(i.converted)} />
//                   {i.converted === true && <Row k="Court" v={i.conversionCourt} />}
//                 </>
//               )}
//               <Row k="Both parents Jewish" v={fmtBool(i.parentsBothJewish)} />
//               <Row k="Grandparents (notes)" v={i.grandparentsJewish} />
//             </>
//           )}
//         </section>

//         <section className="grid gap-2">
//           <div className="font-semibold">Family / Israel</div>
//           <Row k="Parents' names" v={f.parentNames} />
//           <Row k="Parents in Israel" v={fmtBool(f.parentsInIsrael)} />
//           <Row k="Relatives in Israel" v={fmtBool(f.relativesInIsrael)} />
//           {f.relativesInIsrael === true && <Row k="Relatives notes" v={f.relativesNotes} />}
//           <Row k="Marital status" v={f.maritalStatus} />
//           <Row k="Has children" v={fmtBool(f.hasChildren)} />
//           {f.hasChildren === true && <Row k="Children count" v={String(f.childrenCount)} />}
//         </section>

//         <section className="grid gap-2">
//           <div className="font-semibold">Israel Status</div>
//           <Row k="Visited before" v={fmtBool(s.visitedBefore)} />
//           {s.visitedBefore === true && <Row k="How long in Israel" v={s.howLongInIsrael} />}
//           <Row k="Visa type" v={s.visaType} />
//           <Row k="Made Aliyah before" v={fmtBool(s.madeAliyahBefore)} />
//           <Row k="Held Israeli citizenship" v={fmtBool(s.heldIsraeliCitizenship)} />
//           <Row k="Valid passport" v={fmtBool(s.hasValidPassport)} />
//         </section>

//         <section className="grid gap-2">
//           <div className="font-semibold">Legal & Medical</div>
//           <Row k="Served other army" v={fmtBool(l.servedOtherArmy)} />
//           <Row k="Criminal record" v={fmtBool(l.criminalRecord)} />
//           <Row k="Pending legal" v={fmtBool(l.pendingLegal)} />
//           {(l.criminalRecord || l.pendingLegal) && <Row k="Legal notes" v={l.legalNotes} />}

//           <Row k="Medical conditions" v={fmtBool(m.medicalConditions)} />
//           {m.medicalConditions === true && <Row k="Conditions list" v={m.medicalList} />}
//           <Row k="Hospitalized/surgery" v={fmtBool(m.hospitalizedOrSurgery)} />
//           <Row k="Limitations" v={m.limitations} />
//           <Row k="Psychological help" v={fmtBool(m.psychHelp)} />
//         </section>

//         <section className="grid gap-2">
//           <div className="font-semibold">Service Intent</div>
//           <Row k="Why serve" v={r.whyServe} />
//           <Row k="Service kind" v={r.serviceKind} />
//           <Row k="Commit full service" v={fmtBool(r.commitFullService)} />
//           <Row k="Hebrew level" v={r.hebrewLevel} />
//           <Row k="Draft preference" v={r.draftPreference || '—'} />
//         </section>
//       </div>
//     );
//   }

//   return (
//     <div className={t('min-h-screen bg-sky-100 text-slate-800','min-h-screen bg-sky-900 text-slate-100')}>
//       <AdminTopNav secondary={[
//         { to: `/admin/user/${userId}`, label: 'Progress', exact: true },
//         { to: `/admin/user/${userId}/files`, label: 'Files' },
//         { to: `/admin/chat/${userId}`, label: 'Chat' },
//       ]} rightText={userInfo ? (userInfo.name ? titleCaseName(userInfo.name) : userInfo.email) : '—'} />

//       <main className="mx-auto p-4 max-w-[1200px] grid gap-4">
//         {/* Header row with intake summary */}
//         <header className={t('rounded-xl overflow-hidden border border-sky-200 shadow-sm','rounded-xl overflow-hidden border border-slate-900 shadow-sm')}>
//           <div className={t('p-4 grid gap-3 bg-sky-50 text-slate-800','p-4 grid gap-3 bg-slate-950/40 text-slate-200')}>
//             <div className="grid sm:grid-cols-2 gap-3">
//               <div className="grid gap-1">
//                 <div><span className={t('text-slate-600','text-slate-300')}>Name:</span> <span className="font-medium">{userInfo ? toTitleCase(userInfo.name || '') : '—'}</span></div>
//                 <div><span className={t('text-slate-600','text-slate-300')}>Email:</span> {userInfo?.email ? (<a className={t('underline underline-offset-2 hover:text-slate-900','underline underline-offset-2 hover:text-white')} href={`mailto:${userInfo.email}`}>{userInfo.email}</a>) : (<span>—</span>)}</div>
//                 <div><span className={t('text-slate-600','text-slate-300')}>Country:</span> <span className="font-medium">{userInfo?.country || '—'}</span></div>
//               </div>

//               <div className="grid gap-1">
//                 <div className="flex items-center justify-between text-sm">
//                   <span className={t('text-slate-600','text-slate-300')}>Progress</span>
//                   <span className={t('font-semibold text-slate-900','font-semibold text-slate-100')}>{percent}%</span>
//                 </div>
//                 <div className={t('h-2 rounded-full bg-slate-200 overflow-hidden border border-slate-300','h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700')}>
//                   <div className="h-full bg-emerald-500" style={{ width: `${percent}%` }} />
//                 </div>
//               </div>
//             </div>

//             {/* Intake toggle + content */}
//             <div className="mt-2">
//               <button
//                 type="button"
//                 onClick={() => setOpenIntake((v) => !v)}
//                 className={t('text-sm underline underline-offset-4 hover:text-slate-900','text-sm underline underline-offset-4 hover:text-white')}
//               >
//                 {openIntake ? 'Hide' : 'Show'} Intake
//               </button>

//               {openIntake && (
//                 <div className={t('mt-3 p-3 rounded-lg border border-sky-200 bg-white','mt-3 p-3 rounded-lg border border-slate-800 bg-slate-900')}>
//                   {renderIntake()}
//                 </div>
//               )}
//             </div>
//           </div>
//         </header>

//         {err && (
//           <div className={t('p-3 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm whitespace-pre-wrap','p-3 rounded-lg border border-red-400/40 bg-red-500/15 text-red-200 text-sm whitespace-pre-wrap')}>
//             {err}
//           </div>
//         )}

//         {warn && !err && (
//           <div className={t('p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm whitespace-pre-wrap','p-3 rounded-lg border border-amber-400/40 bg-amber-600/15 text-amber-200 text-sm whitespace-pre-wrap')}>
//             {warn}
//           </div>
//         )}

//         {loading ? (
//           <div className={t('text-sm text-slate-600','text-sm text-slate-300')}>Loading…</div>
//         ) : (
//           <>
//             {/* Assignment editor (unchanged) */}
//             <section className="grid lg:grid-cols-2 gap-4">
//               {/* LEFT: all boxes with assign checkbox */}
//               <div className={t('rounded-xl border border-sky-200 shadow-sm overflow-hidden bg-white','rounded-xl border border-slate-800/60 shadow-sm overflow-hidden bg-slate-950/40')}>
//                 <div className={t('px-4 py-2 border-b border-sky-200 bg-white text-slate-900 flex items-center justify-between','px-4 py-2 border-b border-slate-800 bg-slate-900 text-white flex items-center justify-between')}>
//                   <h2 className="text-sm font-semibold">All Boxes</h2>
//                   <div className="flex items-center gap-2">
//                     <button type="button" onClick={assignAll} className={t('px-2 py-1 rounded-md border border-sky-300 bg-sky-100 text-sky-700 text-[11px] hover:bg-sky-200','px-2 py-1 rounded-md border border-emerald-500/40 bg-emerald-600/20 text-emerald-200 text-[11px] hover:bg-emerald-600/30')}>
//                       Assign All
//                     </button>
//                   </div>
//                 </div>

//                 <div className={t('p-4 grid gap-2 bg-white','p-4 grid gap-2 bg-slate-950/40')}>
//                   {allCountryBoxes.map((b) => {
//                     const assigned = assignedSet.has(b._id);
//                     const unassignedCls = t('border-slate-200 bg-white hover:bg-slate-50','border-slate-800 bg-slate-900 hover:bg-slate-900/70');
//                     const assignedCls   = t('border-sky-400/50 bg-sky-50','border-sky-500/40 bg-sky-500/10');

//                     return (
//                       <label key={b._id} className={['p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition leading-tight min-w-0', assigned ? assignedCls : unassignedCls].join(' ')}>
//                         <input type="checkbox" checked={assigned} onChange={(e) => toggleAssign(b._id, e.target.checked)} className="accent-sky-600" />
//                         <div className="min-w-0">
//                           <div className={t('font-semibold truncate text-slate-900 text-[13px]','font-semibold truncate text-slate-100 text-[13px]')}>
//                             {toTitleCase(b.title || '')} <span className={t('text-slate-500 text-[11px]','text-slate-400 text-[11px]')}>({b.key})</span>
//                           </div>
//                           <div className={t('text-[12px] text-slate-600 truncate','text-[12px] text-slate-300 truncate')}>
//                             {b.description || '—'}
//                           </div>
//                         </div>
//                         <div className="ml-auto flex items-center gap-2">
//                           <span className={t('font-mono text-xs text-slate-800','font-mono text-xs text-slate-200')}>{b.weight}%</span>
//                         </div>
//                       </label>
//                     );
//                   })}
//                 </div>
//               </div>

//               {/* RIGHT: Assigned (ordered + tri-state + DnD) */}
//               <div className={t('rounded-xl border border-sky-200 shadow-sm overflow-hidden bg-white','rounded-xl border border-slate-800/60 shadow-sm overflow-hidden bg-slate-950/40')}>
//                 <div className={t('px-4 py-2 border-b border-sky-200 bg-white text-slate-900 flex items-center justify-between','px-4 py-2 border-b border-slate-800 bg-slate-900 text-white flex items-center justify-between')}>
//                   <h2 className="text-sm font-semibold">Assigned Order</h2>
//                   <span className={t('text-[11px] text-slate-600','text-[11px] text-white/80')}>Drag to reorder</span>
//                 </div>

//                 {!assignedOrder.length ? (
//                   <div className={t('p-4 text-sm text-slate-600 bg-white','p-4 text-sm text-slate-300 bg-slate-950/40')}>
//                     No boxes assigned yet. Click <span className="font-semibold">Assign All</span> or check items on the left to assign.
//                   </div>
//                 ) : (
//                   <ul className={t('p-4 space-y-2 bg-white','p-4 space-y-2 bg-slate-950/40')}>
//                     {assignedOrder.map((boxIdRaw, idx) => {
//                       const boxId = normalizeId(boxIdRaw);
//                       const box = isValidId(boxId) ? findBox(boxId) : null;
//                       const status = isValidId(boxId) ? (stateMap[boxId] ?? null) : null;

//                       if (!isValidId(boxId) || !box) {
//                         const shortId = isValidId(boxId) ? String(boxId).slice(-6) : 'unknown';
//                         return (
//                           <li key={boxId || `invalid-${idx}`} draggable onDragStart={(e) => onDragStart(e, idx)} onDragOver={onDragOver} onDrop={(e) => onDrop(e, idx)} className={`rounded-lg border ${t('border-amber-300 bg-amber-50','border-amber-600/40 bg-amber-600/15')} hover:shadow-sm transition`}>
//                             <div className="p-3 flex items-center gap-3 leading-tight">
//                               <span className={t('cursor-grab select-none text-slate-500 pr-1 text-sm','cursor-grab select-none text-slate-500 pr-1 text-sm')}>⋮⋮</span>
//                               <div className={t('w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-semibold text-slate-700 text-[12px]','w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center font-semibold text-slate-100 text-[12px]')}>{idx + 1}</div>
//                               <div className="min-w-0">
//                                 <div className={t('font-medium text-slate-900 text-[14px]','font-medium text-slate-100 text-[14px]')}>Unknown box (id: {shortId})</div>
//                                 <div className={t('text-[12px] text-slate-600','text-[12px] text-slate-300')}>This box no longer exists or the ID is invalid. Remove it to save.</div>
//                               </div>
//                               <div className="ml-auto">
//                                 <button type="button" onClick={() => toggleAssign(boxId, false)} className={t('px-2 py-1 text-xs rounded-md bg-red-50 text-red-700 hover:bg-red-100 border border-red-200','px-2 py-1 text-xs rounded-md bg-red-600/20 text-red-200 hover:bg-red-600/30 border border-red-600/40')} title="Unassign">
//                                   Remove
//                                 </button>
//                               </div>
//                             </div>
//                           </li>
//                         );
//                       }

//                       const wrap =
//                         status === 'completed'
//                           ? t('border-emerald-400/50 bg-emerald-50','border-emerald-600/40 bg-emerald-600/15')
//                           : status === 'pending'
//                           ? t('border-amber-400/50 bg-amber-50','border-amber-600/40 bg-amber-600/15')
//                           : t('border-slate-200 bg-white','border-slate-800 bg-slate-900');

//                       return (
//                         <li key={boxId} draggable onDragStart={(e) => onDragStart(e, idx)} onDragOver={onDragOver} onDrop={(e) => onDrop(e, idx)} className={`rounded-lg border ${wrap} hover:shadow-sm transition`}>
//                           <div className="p-3 flex items-center gap-3 leading-tight">
//                             <span className={t('cursor-grab select-none text-slate-500 pr-1 text-sm','cursor-grab select-none text-slate-500 pr-1 text-sm')}>⋮⋮</span>
//                             <div className={t('w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-semibold text-slate-700 text-[12px]','w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center font-semibold text-slate-100 text-[12px]')}>{idx + 1}</div>
//                             <div className="min-w-0">
//                               <div className={t('font-medium truncate text-slate-900 text-[14px]','font-medium truncate text-slate-100 text-[14px]')}>{box.key} — {toTitleCase(box.title || '')}</div>
//                               <div className={t('text-[12px] text-slate-600 truncate','text-[12px] text-slate-300 truncate')}>{box.description || '—'}</div>
//                             </div>
//                             <div className="ml-auto flex items-center gap-2">
//                               <select value={status === null ? 'null' : status} onChange={(e) => changeStatus(boxId, e.target.value)} className={t('border border-slate-300 rounded-md px-2 py-1 text-sm bg-white text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400','border border-slate-700 rounded-md px-2 py-1 text-sm bg-slate-900 text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70')}>
//                                 <option value="null">Not touched</option>
//                                 <option value="pending">Pending</option>
//                                 <option value="completed">Completed</option>
//                               </select>
//                               <button type="button" onClick={() => toggleAssign(boxId, false)} className={t('px-2 py-1 text-xs rounded-md bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300','px-2 py-1 text-xs rounded-md bg-red-600/20 text-red-200 hover:bg-red-600/30 border border-red-600/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70')} title="Unassign">
//                                 Remove
//                               </button>
//                             </div>
//                           </div>
//                         </li>
//                       );
//                     })}
//                   </ul>
//                 )}
//               </div>
//             </section>

//             {/* Footer actions */}
//             <form onSubmit={saveAssignment} className={t('mt-1 rounded-xl border border-sky-200 bg-white shadow-sm p-3 flex items-center justify-between','mt-1 rounded-xl border border-slate-800/60 bg-slate-950/40 shadow-sm p-3 flex items-center justify-between')}>
//               <div className={t('text-sm text-slate-700','text-sm text-slate-300')}>
//                 Assigned: <span className={t('font-semibold text-slate-900','font-semibold text-slate-100')}>{assignedOrder.length}</span> / {allCountryBoxes.length}
//               </div>
//               <button className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white border border-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70">
//                 Save Assignment
//               </button>
//             </form>
//           </>
//         )}
//       </main>
//     </div>
//   );
// }

// /* ---------- shared Tab (same styling as AdminChatPage) ---------- */
// function Tab({ to, exact = false, children }) {
//   const { t } = useTheme();
//   return (
//     <NavLink
//       to={to}
//       end={exact}
//       className={({ isActive }) =>
//         t(
//           [
//             'px-3 py-1.5 rounded-md transition font-medium',
//             'text-slate-700 hover:bg-slate-200',
//             'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
//             isActive ? 'bg-sky-200 text-slate-900' : ''
//           ].join(' '),
//           [
//             'px-3 py-1.5 rounded-md transition font-medium',
//             'text-slate-200 hover:bg-white/10',
//             'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70',
//             isActive ? 'bg-sky-800/50 text-white' : ''
//           ].join(' ')
//         )
//       }
//     >
//       {children}
//     </NavLink>
//   );
// }










import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { useTheme } from '../../theme/ThemeProvider.jsx';
import AdminTopNav from './AdminTopNav.jsx';

/* ---------- Title-case helpers ---------- */
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s);
const toTitleCase = (str = '') =>
  str
    .trim()
    .split(/\s+/)
    .map((w) => w.split('-').map((h) => h.split("'").map(cap).join("'")).join('-'))
    .join(' ');

function titleCaseName(s = '') {
  return s.toLowerCase().replace(/\b[\p{L}]/gu, (ch) => ch.toUpperCase());
}

/* ---------- localStorage helpers ---------- */
const getLS = (k, d = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const setLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const USER_INFO_KEY   = (id) => `admin:user:info:${id}`;
const USER_INFO_TS    = (id) => `admin:user:info:ts:${id}`;
const BOXES_KEY       = (country) => `admin:user:boxes:${country}`;
const BOXES_TS        = (country) => `admin:user:boxes:ts:${country}`;
const PROGRESS_KEY    = (id) => `admin:user:progress:${id}`;
const PROGRESS_TS     = (id) => `admin:user:progress:ts:${id}`;
const INTAKE_KEY      = (id) => `admin:user:intake:${id}`;
const INTAKE_TS       = (id) => `admin:user:intake:ts:${id}`;

/* ---------- id guards ---------- */
const normalizeId = (x) => (typeof x === 'string' ? x : x ? String(x) : '');
const isValidId = (x) => typeof x === 'string' && x.trim().length > 0;
const uniq = (arr) => Array.from(new Set(arr));

export default function AdminUserPage() {
  const { t } = useTheme();
  const { user } = useAuth();
  const { id: userId } = useParams();

  // seed from cache
  const [userInfo, setUserInfo] = useState(() => getLS(USER_INFO_KEY(userId), null));
  const seedCountry = userInfo?.country || null;

  const seedProgress = getLS(PROGRESS_KEY(userId), { assignedOrder: [], stateMap: {} }) || { assignedOrder: [], stateMap: {} };
  const seededOrder = Array.isArray(seedProgress.assignedOrder) ? seedProgress.assignedOrder : [];
  const [assignedOrder, setAssignedOrder] = useState(() => uniq(seededOrder.map(normalizeId).filter(isValidId)));
  const [stateMap, setStateMap] = useState(() => seedProgress.stateMap || {});
  const [allCountryBoxes, setAllCountryBoxes] = useState(() => seedCountry ? getLS(BOXES_KEY(seedCountry), []) : []);
  const [intake, setIntake] = useState(() => getLS(INTAKE_KEY(userId), null));

  const [progressBoxMap, setProgressBoxMap] = useState({});
  const [loading, setLoading] = useState(() => (!userInfo || allCountryBoxes.length === 0));
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [openIntake, setOpenIntake] = useState(true);

  function friendlyError(e, fallback = 'Request failed') {
    const status = e?.response?.status;
    const msg = e?.response?.data?.error || e?.message || fallback;
    return `[${status || 'ERR'}] ${msg}`;
  }

  const refresh = async () => {
    if (!user || user.role !== 'admin') return;
    try {
      setErr('');
      setWarn('');

      // 1) user info
      const ures = await api.get(`/auth/admin/users`);
      const u = Array.isArray(ures.data) ? ures.data.find((x) => x._id === userId) : null;
      if (!u) throw new Error('User not found');
      const prevUser = getLS(USER_INFO_KEY(userId), null);
      const sameUser = JSON.stringify(prevUser) === JSON.stringify(u);
      if (!sameUser) {
        setLS(USER_INFO_KEY(userId), u);
        setLS(USER_INFO_TS(userId), Date.now());
      }
      setUserInfo((old) => (sameUser ? old : u));

      // 2) boxes for this country
      const country = u.country || '';
      const bres = await api.get(`/boxes/admin?country=${encodeURIComponent(country)}`);
      const boxes = Array.isArray(bres.data) ? bres.data : [];
      const prevBoxes = getLS(BOXES_KEY(country), []);
      const sameBoxes = JSON.stringify(prevBoxes) === JSON.stringify(boxes);
      if (!sameBoxes) {
        setLS(BOXES_KEY(country), boxes);
        setLS(BOXES_TS(country), Date.now());
      }
      setAllCountryBoxes((old) => (sameBoxes ? old : boxes));

      // 3) progress / statuses
      const pres = await api.get(`/progress/user/${userId}`);
      const st = Array.isArray(pres.data?.statuses) ? pres.data.statuses : [];

      const orderRaw = st.map((s) => normalizeId(s.boxId?._id || s.boxId));
      const order = uniq(orderRaw.filter(isValidId));

      const map = {};
      const pbox = {};
      st.forEach((s) => {
        const id = normalizeId(s.boxId?._id || s.boxId);
        if (!isValidId(id)) return;
        if (typeof s.state !== 'undefined') map[id] = s.state;
        else map[id] = s.completed ? 'completed' : null;

        if (s.boxId && s.boxId._id) {
          pbox[id] = {
            _id: s.boxId._id,
            key: s.boxId.key,
            title: s.boxId.title,
            description: s.boxId.description,
            weight: s.boxId.weight,
            country: s.boxId.country,
          };
        }
      });
      setProgressBoxMap(pbox);

      const prevProgress = getLS(PROGRESS_KEY(userId), { assignedOrder: [], stateMap: {} }) || { assignedOrder: [], stateMap: {} };
      const sameProgress =
        JSON.stringify(prevProgress.assignedOrder) === JSON.stringify(order) &&
        JSON.stringify(prevProgress.stateMap) === JSON.stringify(map);

      if (!sameProgress) {
        setLS(PROGRESS_KEY(userId), { assignedOrder: order, stateMap: map });
        setLS(PROGRESS_TS(userId), Date.now());
      }
      setAssignedOrder(order);
      setStateMap((old) => (sameProgress ? old : map));

      // 4) intake for admin
      try {
        const ires = await api.get(`/admin/intake/${userId}`);
        const doc = ires.data || null;
        const i = doc?.intake || null;
        const prevI = getLS(INTAKE_KEY(userId), null);
        const sameI = JSON.stringify(prevI) === JSON.stringify(i);
        if (!sameI) {
          setLS(INTAKE_KEY(userId), i);
          setLS(INTAKE_TS(userId), Date.now());
        }
        setIntake((old) => (sameI ? old : i));
      } catch (ie) {
        console.warn('[AdminUserPage] intake fetch failed:', ie?.message || ie);
      }
    } catch (e) {
      setErr(friendlyError(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, user?.role]);

  useEffect(() => {
    const id = setInterval(() => refresh(), 45000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, user?.role]);

  useEffect(() => {
    const clean = uniq(assignedOrder.map(normalizeId).filter(isValidId));
    if (clean.length !== assignedOrder.length || clean.some((v, i) => v !== assignedOrder[i])) {
      setAssignedOrder(clean);
      setLS(PROGRESS_KEY(userId), { assignedOrder: clean, stateMap });
      setLS(PROGRESS_TS(userId), Date.now());
    } else {
      setLS(PROGRESS_KEY(userId), { assignedOrder, stateMap });
      setLS(PROGRESS_TS(userId), Date.now());
    }
  }, [assignedOrder, stateMap, userId]);

  const assignedSet = useMemo(() => new Set(assignedOrder), [assignedOrder]);
  const totalWeight = useMemo(() => allCountryBoxes.reduce((sum, b) => sum + (Number(b.weight) || 0), 0), [allCountryBoxes]);
  const earnedWeight = useMemo(
    () => allCountryBoxes.reduce((sum, b) => {
      const isAssigned = assignedSet.has(b._id);
      const isCompleted = (stateMap[b._id] || null) === 'completed';
      return sum + (isAssigned && isCompleted ? (Number(b.weight) || 0) : 0);
    }, 0),
    [allCountryBoxes, assignedSet, stateMap]
  );
  const percent = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  function toggleAssign(boxIdRaw, checked) {
    const boxId = normalizeId(boxIdRaw);
    if (!isValidId(boxId)) return;

    setAssignedOrder((prev) => {
      const set = new Set(prev);
      if (checked) {
        if (!set.has(boxId)) return [...prev, boxId];
        return prev;
      } else {
        return prev.filter((id) => id !== boxId);
      }
    });

    setStateMap((prev) => {
      if (checked) {
        if (Object.prototype.hasOwnProperty.call(prev, boxId)) return prev;
        return { ...prev, [boxId]: null };
      } else {
        const copy = { ...prev };
        delete copy[boxId];
        return copy;
      }
    });
  }

  function assignAll() {
    const ids = allCountryBoxes.map((b) => normalizeId(b._id)).filter(isValidId);
    setAssignedOrder(uniq(ids));
    setStateMap((prev) => {
      const next = { ...prev };
      for (const id of ids) {
        if (!Object.prototype.hasOwnProperty.call(next, id)) next[id] = null;
      }
      return next;
    });
  }

  function changeStatus(boxIdRaw, next) {
    const boxId = normalizeId(boxIdRaw);
    if (!isValidId(boxId)) return;
    const val = next === 'null' ? null : next;
    const norm = val === 'pending' || val === 'completed' || val === null ? val : null;
    setStateMap((prev) => ({ ...prev, [boxId]: norm }));
  }

  const dragFromIndex = useRef(null);
  function onDragStart(e, index) {
    dragFromIndex.current = index;
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOver(e) { e.preventDefault(); }
  function onDrop(e, toIndex) {
    e.preventDefault();
    const fromIndex = dragFromIndex.current;
    if (fromIndex === null || fromIndex === toIndex) return;
    setAssignedOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      if (!isValidId(moved)) return prev;
      next.splice(toIndex, 0, moved);
      return next;
    });
    dragFromIndex.current = null;
  }

  async function saveAssignment(e) {
    e.preventDefault();
    try {
      setErr('');
      setWarn('');

      const country = userInfo?.country || '';
      const byId = (id) =>
        allCountryBoxes.find((b) => b._id === id) ||
        progressBoxMap[id] ||
        null;

      const droppedUnknown = [];
      const droppedCountry = [];

      const cleanOrder = uniq(
        assignedOrder
          .map(normalizeId)
          .filter(isValidId)
          .filter((id) => {
            const box = byId(id);
            if (!box) { droppedUnknown.push(id); return false; }
            if (country && box.country && box.country !== country) { droppedCountry.push(id); return false; }
            return true;
          })
      );

      const sanitizeState = (v) => (v === 'pending' || v === 'completed' || v === null ? v : null);

      const assignments = cleanOrder.map((boxId) => ({
        boxId,
        state: sanitizeState(Object.prototype.hasOwnProperty.call(stateMap, boxId) ? stateMap[boxId] : null),
      }));

      await api.post('/progress/assign', { userId, assignments, boxIds: cleanOrder });

      if (droppedUnknown.length || droppedCountry.length) {
        setWarn(
          [
            droppedUnknown.length ? `Skipped ${droppedUnknown.length} unknown/deleted box(es).` : '',
            droppedCountry.length ? `Skipped ${droppedCountry.length} box(es) from a different country.` : '',
          ].filter(Boolean).join(' ')
        );
      }

      await refresh();
    } catch (e2) {
      setErr(friendlyError(e2, 'Assign failed'));
    }
  }

  const secondaryLinks = [
    { to: `/admin/user/${userId}`, label: 'Progress', exact: true },
    { to: `/admin/user/${userId}/files`, label: 'Files' },
    { to: `/admin/chat/${userId}`, label: 'Chat' },
  ];

  const rightText = userInfo ? (userInfo.name ? titleCaseName(userInfo.name) : userInfo.email) : '—';
  const findBox = (id) => allCountryBoxes.find((b) => b._id === id) || progressBoxMap[id] || null;

  const Row = ({ k, v }) => (
    <div className="grid grid-cols-3 gap-2 text-[13px]">
      <div className="text-slate-400">{k}</div>
      <div className="col-span-2 break-words">{v ?? '—'}</div>
    </div>
  );
  const fmtBool = (v) => (v === true ? 'Yes' : v === false ? 'No' : '—');

  function renderIntake() {
    if (!intake) return <div className="text-sm text-slate-400">No intake submitted.</div>;

    const p = intake.personal || {};
    const i = intake.identity || {};
    const f = intake.familyIsrael || {};
    const s = intake.stayStatus || {};
    const l = intake.legal || {};
    const m = intake.medical || {};
    const r = intake.serviceIntent || {};

    return (
      <div className="grid gap-4">
        <section className="grid gap-2">
          <div className="font-semibold">Personal</div>
          <Row k="Full name" v={p.fullName} />
          <Row k="DOB" v={p.dob} />
          <Row k="Country" v={p.country} />
          <Row k="Citizenships" v={(p.citizenships || []).join(', ') || '—'} />
          <Row k="Address" v={p.address} />
          <Row k="Phone" v={p.phone} />
          <Row k="Email" v={p.email} />
        </section>

        <section className="grid gap-2">
          <div className="font-semibold">Jewish Background</div>
          <Row k="Jewish" v={fmtBool(i.isJewish)} />
          {i.isJewish === true && (
            <>
              <Row k="Born to Jewish mother" v={fmtBool(i.bornToJewishMother)} />
              {i.bornToJewishMother === false && (
                <>
                  <Row k="Converted" v={fmtBool(i.converted)} />
                  {i.converted === true && <Row k="Court" v={i.conversionCourt} />}
                </>
              )}
              <Row k="Both parents Jewish" v={fmtBool(i.parentsBothJewish)} />
              <Row k="Grandparents (notes)" v={i.grandparentsJewish} />
            </>
          )}
        </section>

        <section className="grid gap-2">
          <div className="font-semibold">Family / Israel</div>
          <Row k="Parents' names" v={f.parentNames} />
          <Row k="Parents in Israel" v={fmtBool(f.parentsInIsrael)} />
          <Row k="Relatives in Israel" v={fmtBool(f.relativesInIsrael)} />
          {f.relativesInIsrael === true && <Row k="Relatives notes" v={f.relativesNotes} />}
          <Row k="Marital status" v={f.maritalStatus} />
          <Row k="Has children" v={fmtBool(f.hasChildren)} />
          {f.hasChildren === true && <Row k="Children count" v={String(f.childrenCount)} />}
        </section>

        <section className="grid gap-2">
          <div className="font-semibold">Israel Status</div>
          <Row k="Visited before" v={fmtBool(s.visitedBefore)} />
          {s.visitedBefore === true && <Row k="How long in Israel" v={s.howLongInIsrael} />}
          <Row k="Visa type" v={s.visaType} />
          <Row k="Made Aliyah before" v={fmtBool(s.madeAliyahBefore)} />
          <Row k="Held Israeli citizenship" v={fmtBool(s.heldIsraeliCitizenship)} />
          <Row k="Valid passport" v={fmtBool(s.hasValidPassport)} />
        </section>

        <section className="grid gap-2">
          <div className="font-semibold">Legal & Medical</div>
          <Row k="Served other army" v={fmtBool(l.servedOtherArmy)} />
          <Row k="Criminal record" v={fmtBool(l.criminalRecord)} />
          <Row k="Pending legal" v={fmtBool(l.pendingLegal)} />
          {(l.criminalRecord || l.pendingLegal) && <Row k="Legal notes" v={l.legalNotes} />}

          <Row k="Medical conditions" v={fmtBool(m.medicalConditions)} />
          {m.medicalConditions === true && <Row k="Conditions list" v={m.medicalList} />}
          <Row k="Hospitalized/surgery" v={fmtBool(m.hospitalizedOrSurgery)} />
          <Row k="Limitations" v={m.limitations} />
          <Row k="Psychological help" v={fmtBool(m.psychHelp)} />
        </section>

        <section className="grid gap-2">
          <div className="font-semibold">Service Intent</div>
          <Row k="Why serve" v={r.whyServe} />
          <Row k="Service kind" v={r.serviceKind} />
          <Row k="Commit full service" v={fmtBool(r.commitFullService)} />
          <Row k="Hebrew level" v={r.hebrewLevel} />
          <Row k="Draft preference" v={r.draftPreference || '—'} />
        </section>
      </div>
    );
  }

  return (
    <div className={t('min-h-screen bg-sky-100 text-slate-800','min-h-screen bg-sky-900 text-slate-100')}>
      <AdminTopNav
        secondary={[
          { to: `/admin/user/${userId}`, label: 'Progress', exact: true },
          { to: `/admin/user/${userId}/files`, label: 'Files' },
          { to: `/admin/chat/${userId}`, label: 'Chat' },
        ]}
        rightText={userInfo ? (userInfo.name ? titleCaseName(userInfo.name) : userInfo.email) : '—'}
      />

      <main className="mx-auto p-4 max-w-[1200px] grid gap-4">
        {/* Header w/ intake */}
        <header className={t('rounded-xl overflow-hidden border border-sky-200 shadow-sm','rounded-xl overflow-hidden border border-slate-900 shadow-sm')}>
          <div className={t('p-4 grid gap-3 bg-sky-50 text-slate-800','p-4 grid gap-3 bg-slate-950/40 text-slate-200')}>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="grid gap-1">
                <div>
                  <span className={t('text-slate-600','text-slate-300')}>Name:</span>{' '}
                  <span className="font-medium">{userInfo ? toTitleCase(userInfo.name || '') : '—'}</span>
                </div>
                <div>
                  <span className={t('text-slate-600','text-slate-300')}>Email:</span>{' '}
                  {userInfo?.email ? (
                    <a className={t('underline underline-offset-2 hover:text-slate-900','underline underline-offset-2 hover:text-white')} href={`mailto:${userInfo.email}`}>
                      {userInfo.email}
                    </a>
                  ) : '—'}
                </div>
                <div>
                  <span className={t('text-slate-600','text-slate-300')}>Country:</span>{' '}
                  <span className="font-medium">{userInfo?.country || '—'}</span>
                </div>
              </div>

              <div className="grid gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span className={t('text-slate-600','text-slate-300')}>Progress</span>
                  <span className={t('font-semibold text-slate-900','font-semibold text-slate-100')}>{percent}%</span>
                </div>
                <div className={t('h-2 rounded-full bg-slate-200 overflow-hidden border border-slate-300','h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700')}>
                  <div className="h-full bg-emerald-500" style={{ width: `${percent}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-2">
              <button
                type="button"
                onClick={() => setOpenIntake((v) => !v)}
                className={t('text-sm underline underline-offset-4 hover:text-slate-900','text-sm underline underline-offset-4 hover:text-white')}
              >
                {openIntake ? 'Hide' : 'Show'} Intake
              </button>

              {openIntake && (
                <div className={t('mt-3 p-3 rounded-lg border border-sky-200 bg-white','mt-3 p-3 rounded-lg border border-slate-800 bg-slate-900')}>
                  {renderIntake()}
                </div>
              )}
            </div>
          </div>
        </header>

        {err && (
          <div className={t('p-3 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm whitespace-pre-wrap','p-3 rounded-lg border border-red-400/40 bg-red-500/15 text-red-200 text-sm whitespace-pre-wrap')}>
            {err}
          </div>
        )}

        {warn && !err && (
          <div className={t('p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm whitespace-pre-wrap','p-3 rounded-lg border border-amber-400/40 bg-amber-600/15 text-amber-200 text-sm whitespace-pre-wrap')}>
            {warn}
          </div>
        )}

        {/* Progress editor */}
        {loading ? (
          <div className={t('text-sm text-slate-600','text-sm text-slate-300')}>Loading…</div>
        ) : (
          <>
            <section className="grid lg:grid-cols-2 gap-4">
              {/* left: all boxes */}
              <div className={t('rounded-xl border border-sky-200 shadow-sm overflow-hidden bg-white','rounded-xl border border-slate-800/60 shadow-sm overflow-hidden bg-slate-950/40')}>
                <div className={t('px-4 py-2 border-b border-sky-200 bg-white text-slate-900 flex items-center justify-between','px-4 py-2 border-b border-slate-800 bg-slate-900 text-white flex items-center justify-between')}>
                  <h2 className="text-sm font-semibold">All Boxes</h2>
                  <button
                    type="button"
                    onClick={assignAll}
                    className={t('px-2 py-1 rounded-md border border-sky-300 bg-sky-100 text-sky-700 text-[11px] hover:bg-sky-200','px-2 py-1 rounded-md border border-emerald-500/40 bg-emerald-600/20 text-emerald-200 text-[11px] hover:bg-emerald-600/30')}
                  >
                    Assign All
                  </button>
                </div>

                <div className={t('p-4 grid gap-2 bg-white','p-4 grid gap-2 bg-slate-950/40')}>
                  {allCountryBoxes.map((b) => {
                    const assigned = assignedSet.has(b._id);
                    const unassignedCls = t('border-slate-200 bg-white hover:bg-slate-50','border-slate-800 bg-slate-900 hover:bg-slate-900/70');
                    const assignedCls   = t('border-sky-400/50 bg-sky-50','border-sky-500/40 bg-sky-500/10');

                    return (
                      <label key={b._id} className={['p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition leading-tight min-w-0', assigned ? assignedCls : unassignedCls].join(' ')}>
                        <input type="checkbox" checked={assigned} onChange={(e) => toggleAssign(b._id, e.target.checked)} className="accent-sky-600" />
                        <div className="min-w-0">
                          <div className={t('font-semibold truncate text-slate-900 text-[13px]','font-semibold truncate text-slate-100 text-[13px]')}>
                            {toTitleCase(b.title || '')} <span className={t('text-slate-500 text-[11px]','text-slate-400 text-[11px]')}>({b.key})</span>
                          </div>
                          <div className={t('text-[12px] text-slate-600 truncate','text-[12px] text-slate-300 truncate')}>
                            {b.description || '—'}
                          </div>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                          <span className={t('font-mono text-xs text-slate-800','font-mono text-xs text-slate-200')}>{b.weight}%</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* right: assigned list */}
              <div className={t('rounded-xl border border-sky-200 shadow-sm overflow-hidden bg-white','rounded-xl border border-slate-800/60 shadow-sm overflow-hidden bg-slate-950/40')}>
                <div className={t('px-4 py-2 border-b border-sky-200 bg-white text-slate-900 flex items-center justify-between','px-4 py-2 border-b border-slate-800 bg-slate-900 text-white flex items-center justify-between')}>
                  <h2 className="text-sm font-semibold">Assigned Order</h2>
                  <span className={t('text-[11px] text-slate-600','text-[11px] text-white/80')}>Drag to reorder</span>
                </div>

                {!assignedOrder.length ? (
                  <div className={t('p-4 text-sm text-slate-600 bg-white','p-4 text-sm text-slate-300 bg-slate-950/40')}>
                    No boxes assigned yet. Click <span className="font-semibold">Assign All</span> or check items on the left to assign.
                  </div>
                ) : (
                  <ul className={t('p-4 space-y-2 bg-white','p-4 space-y-2 bg-slate-950/40')}>
                    {assignedOrder.map((boxIdRaw, idx) => {
                      const boxId = normalizeId(boxIdRaw);
                      const box = isValidId(boxId) ? findBox(boxId) : null;
                      const status = isValidId(boxId) ? (stateMap[boxId] ?? null) : null;

                      if (!isValidId(boxId) || !box) {
                        const shortId = isValidId(boxId) ? String(boxId).slice(-6) : 'unknown';
                        return (
                          <li key={boxId || `invalid-${idx}`} draggable onDragStart={(e) => onDragStart(e, idx)} onDragOver={onDragOver} onDrop={(e) => onDrop(e, idx)} className={`rounded-lg border ${t('border-amber-300 bg-amber-50','border-amber-600/40 bg-amber-600/15')} hover:shadow-sm transition`}>
                            <div className="p-3 flex items-center gap-3 leading-tight">
                              <span className={t('cursor-grab select-none text-slate-500 pr-1 text-sm','cursor-grab select-none text-slate-500 pr-1 text-sm')}>⋮⋮</span>
                              <div className={t('w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-semibold text-slate-700 text-[12px]','w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center font-semibold text-slate-100 text-[12px]')}>{idx + 1}</div>
                              <div className="min-w-0">
                                <div className={t('font-medium text-slate-900 text-[14px]','font-medium text-slate-100 text-[14px]')}>Unknown box (id: {shortId})</div>
                                <div className={t('text-[12px] text-slate-600','text-[12px] text-slate-300')}>This box no longer exists or the ID is invalid. Remove it to save.</div>
                              </div>
                              <div className="ml-auto">
                                <button type="button" onClick={() => toggleAssign(boxId, false)} className={t('px-2 py-1 text-xs rounded-md bg-red-50 text-red-700 hover:bg-red-100 border border-red-200','px-2 py-1 text-xs rounded-md bg-red-600/20 text-red-200 hover:bg-red-600/30 border border-red-600/40')} title="Unassign">
                                  Remove
                                </button>
                              </div>
                            </div>
                          </li>
                        );
                      }

                      const wrap =
                        status === 'completed'
                          ? t('border-emerald-400/50 bg-emerald-50','border-emerald-600/40 bg-emerald-600/15')
                          : status === 'pending'
                          ? t('border-amber-400/50 bg-amber-50','border-amber-600/40 bg-amber-600/15')
                          : t('border-slate-200 bg-white','border-slate-800 bg-slate-900');

                      return (
                        <li key={boxId} draggable onDragStart={(e) => onDragStart(e, idx)} onDragOver={onDragOver} onDrop={(e) => onDrop(e, idx)} className={`rounded-lg border ${wrap} hover:shadow-sm transition`}>
                          <div className="p-3 flex items-center gap-3 leading-tight">
                            <span className={t('cursor-grab select-none text-slate-500 pr-1 text-sm','cursor-grab select-none text-slate-500 pr-1 text-sm')}>⋮⋮</span>
                            <div className={t('w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-semibold text-slate-700 text-[12px]','w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center font-semibold text-slate-100 text-[12px]')}>{idx + 1}</div>
                            <div className="min-w-0">
                              <div className={t('font-medium truncate text-slate-900 text-[14px]','font-medium truncate text-slate-100 text-[14px]')}>{box.key} — {toTitleCase(box.title || '')}</div>
                              <div className={t('text-[12px] text-slate-600 truncate','text-[12px] text-slate-300 truncate')}>{box.description || '—'}</div>
                            </div>
                            <div className="ml-auto flex items-center gap-2">
                              <select value={status === null ? 'null' : status} onChange={(e) => changeStatus(boxId, e.target.value)} className={t('border border-slate-300 rounded-md px-2 py-1 text-sm bg-white text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400','border border-slate-700 rounded-md px-2 py-1 text-sm bg-slate-900 text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70')}>
                                <option value="null">Not touched</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                              </select>
                              <button type="button" onClick={() => toggleAssign(boxId, false)} className={t('px-2 py-1 text-xs rounded-md bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300','px-2 py-1 text-xs rounded-md bg-red-600/20 text-red-200 hover:bg-red-600/30 border border-red-600/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70')} title="Unassign">
                                Remove
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>

            <form onSubmit={saveAssignment} className={t('mt-1 rounded-xl border border-sky-200 bg-white shadow-sm p-3 flex items-center justify-between','mt-1 rounded-xl border border-slate-800/60 bg-slate-950/40 shadow-sm p-3 flex items-center justify-between')}>
              <div className={t('text-sm text-slate-700','text-sm text-slate-300')}>
                Assigned: <span className={t('font-semibold text-slate-900','font-semibold text-slate-100')}>{assignedOrder.length}</span> / {allCountryBoxes.length}
              </div>
              <button className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white border border-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70">
                Save Assignment
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}

/* ---------- shared Tab (kept for parity) ---------- */
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





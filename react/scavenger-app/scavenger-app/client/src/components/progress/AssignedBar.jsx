// // client/src/components/progress/AssignedBar.jsx
// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import { api } from '../../api';

// const MIN_CARD_PX = 220;
// const MAX_CARD_PX = 320;
// const GAP_PX = 12; // Tailwind gap-3

// export default function AssignedBar({ title = "Your Assigned Boxes" }) {
//   const [progress, setProgress] = React.useState(null);
//   const [loading, setLoading] = React.useState(true);

//   // layout state
//   const containerRef = React.useRef(null);
//   const [cardW, setCardW] = React.useState(256);
//   const [visible, setVisible] = React.useState(1);
//   const [index, setIndex] = React.useState(0);

//   const nav = useNavigate();

//   // Fetch assigned statuses
//   React.useEffect(() => {
//     let stop = false;
//     (async () => {
//       try {
//         const p = await api.get('/progress/me');
//         if (!stop) setProgress(p.data || { statuses: [] });
//       } finally {
//         if (!stop) setLoading(false);
//       }
//     })();
//     return () => { stop = true; };
//   }, []);

//   const items = React.useMemo(() => {
//     const statuses = progress?.statuses || [];
//     return statuses
//       .map((s, idx) => {
//         const box = s.boxId; // populated by backend
//         if (!box || !box._id) return null;

//         let state = 'not_touched';
//         if (s.state === 'completed' || s.completed === true) state = 'completed';
//         else if (s.state === 'pending') state = 'pending';

//         return { order: idx, box, state };
//       })
//       .filter(Boolean);
//   }, [progress]);

//   // Layout compute: whole-card fit, no half cards
//   React.useEffect(() => {
//     function compute() {
//       const el = containerRef.current;
//       if (!el) return;
//       const width = el.getBoundingClientRect().width;
//       if (!width) return;

//       const minVis = Math.max(1, Math.floor((width + GAP_PX) / (MAX_CARD_PX + GAP_PX)));
//       const maxVis = Math.max(1, Math.floor((width + GAP_PX) / (MIN_CARD_PX + GAP_PX)));
//       let bestVis = Math.min(maxVis, Math.max(minVis, 1));
//       let w = Math.floor((width + GAP_PX) / bestVis) - GAP_PX;

//       while (w > MAX_CARD_PX && bestVis < maxVis) {
//         bestVis += 1;
//         w = Math.floor((width + GAP_PX) / bestVis) - GAP_PX;
//       }
//       while (w < MIN_CARD_PX && bestVis > 1) {
//         bestVis -= 1;
//         w = Math.floor((width + GAP_PX) / bestVis) - GAP_PX;
//       }
//       w = Math.min(MAX_CARD_PX, Math.max(MIN_CARD_PX, w));

//       setVisible(bestVis);
//       setCardW(w);
//     }

//     compute();
//     const ro = new ResizeObserver(compute);
//     if (containerRef.current) ro.observe(containerRef.current);
//     window.addEventListener('resize', compute);
//     return () => {
//       ro.disconnect();
//       window.removeEventListener('resize', compute);
//     };
//   }, []);

//   const maxIndex = Math.max(0, (items.length || 0) - visible);
//   const canLeft = index > 0;
//   const canRight = index < maxIndex;

//   React.useEffect(() => {
//     setIndex((prev) => Math.min(prev, Math.max(0, (items.length || 0) - visible)));
//   }, [items.length, visible]);

//   function go(dir) {
//     setIndex((prev) => (dir === 'left' ? Math.max(0, prev - 1) : Math.min(maxIndex, prev + 1)));
//   }

//   if (loading) {
//     return (
//       <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 w-full max-w-full">
//         <div className="text-sm text-gray-500">Loading assigned boxes…</div>
//       </div>
//     );
//   }

//   const trackW = Math.max(0, items.length * (cardW + GAP_PX) - GAP_PX);

//   return (
//     <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 w-full max-w-full">
//       <div className="flex items-center justify-between mb-3">
//         <h2 className="font-semibold">{title}</h2>
//         <div className="flex items-center gap-2">
//           <button
//             onClick={() => go('left')}
//             disabled={!canLeft}
//             className={`px-2 py-1 rounded border text-sm ${canLeft ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
//             aria-label="Scroll left"
//           >
//             ←
//           </button>
//           <button
//             onClick={() => go('right')}
//             disabled={!canRight}
//             className={`px-2 py-1 rounded border text-sm ${canRight ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
//             aria-label="Scroll right"
//           >
//             →
//           </button>
//         </div>
//       </div>

//       {items.length === 0 ? (
//         <div className="text-sm text-gray-500">No boxes assigned yet.</div>
//       ) : (
//         <div
//         ref={containerRef}
//         className="relative w-full max-w-full overflow-hidden"
//         style={{ contain: 'layout paint', isolation: 'isolate' }}   // <— stronger isolation
//       >
//         <ul
//           className="flex gap-3 will-change-transform transition-transform duration-300 ease-out list-none m-0 p-0"
//           style={{
//             width: `${trackW}px`,
//             transform: `translate3d(-${index * (cardW + GAP_PX)}px, 0, 0)`,
//           }}
//         >
//             {items.map((it) => {
//               const classes = colorClasses(it.state);
//               return (
//                 <li key={it.box._id} className="shrink-0">
//                   <button
//                     onClick={() => nav(`/info/${it.box._id}`)}
//                     className={`rounded-xl border ${classes.wrap} hover:opacity-95 transition shadow-sm text-left box-border`}
//                     style={{ width: `${cardW}px` }}
//                     title={`${it.box.key} — ${it.box.title}`}
//                   >
//                     <div className="p-3 flex items-start gap-3">
//                       <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border flex items-center justify-center font-semibold">
//                         {it.order + 1}
//                       </div>
//                       <div className="min-w-0">
//                         <div className="font-medium truncate">
//                           {it.box.key} — {it.box.title}
//                         </div>
//                         <div className="text-xs opacity-80 truncate">
//                           {it.box.description || 'No description'}
//                         </div>
//                       </div>
//                       <div className="ml-auto flex items-center gap-2">
//                         <span className={`inline-flex h-2 w-2 rounded-full ${classes.dot}`} />
//                         <span className={`text-xs font-semibold ${classes.tag}`}>
//                           {label(it.state)}
//                         </span>
//                       </div>
//                     </div>
//                   </button>
//                 </li>
//               );
//             })}
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// }

// function label(state) {
//   if (state === 'completed') return 'Completed';
//   if (state === 'pending') return 'Pending';
//   return 'Not touched';
// }

// function colorClasses(state) {
//   if (state === 'completed') {
//     return { wrap: 'border-green-500 bg-green-50', tag: 'text-green-700', dot: 'bg-green-500' };
//   }
//   if (state === 'pending') {
//     return { wrap: 'border-yellow-500 bg-yellow-50', tag: 'text-yellow-700', dot: 'bg-yellow-500' };
//   }
//   return { wrap: 'border-gray-300 bg-gray-50', tag: 'text-gray-600', dot: 'bg-gray-400' };
// }

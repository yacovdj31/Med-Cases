// client/src/pages/user/BoxDetaiPage.jsx  (a.k.a. InfoPage)
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import SecureImage from '../../components/media/SecureImage.jsx';

export default function BoxDetailPage() {
  // Support either :id or :boxId param (your routes used /info/:id previously)
  const { id: routeId, boxId: routeBoxId } = useParams();
  const boxId = routeBoxId || routeId;

  const { user } = useAuth();
  const [box, setBox] = useState(null);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        setErr('');
        setLoading(true);

        const country = user?.country || 'USA';
        const [boxRes, infoRes] = await Promise.all([
          api.get(`/boxes/${boxId}`),
          api.get('/info', { params: { boxId, country } }).catch(() => ({ data: null })), // tolerant if /info absent
        ]);

        if (!stop) {
          setBox(boxRes.data);
          setInfo(infoRes?.data || null);
        }
      } catch (e) {
        if (!stop) setErr(e?.response?.data?.error || e.message || 'Failed to load');
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => { stop = true; };
  }, [boxId, user?.country]);

  const photoId =
    box?.photoFileId ||
    box?.photoId ||
    (typeof box?.photo === 'string' ? box.photo : box?.photo?._id) ||
    null;

  const titleText = box
    ? `${box.key} — ${box.title}`
    : (info?.title || 'Info');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
        {/* Themed header */}
        <div className="px-4 py-2 bg-gradient-to-b from-blue-900/80 to-slate-900/70 text-white border-b border-slate-800">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-semibold">Box details</h1>
            <Link
              to="/"
              className="text-xs rounded-md px-2 py-1 bg-white/10 hover:bg-white/15"
            >
              ← Back
            </Link>
          </div>
        </div>

        <div className="p-5 bg-white">
          {loading ? (
            <div className="text-sm text-slate-600">Loading…</div>
          ) : err ? (
            <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700 text-sm">
              {err}
            </div>
          ) : (
            <div className="grid gap-5">
              {/* Name — Title + Status */}
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-2xl font-bold tracking-tight">{titleText}</h2>
                {box && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border
                      ${box.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}
                    title={box.active ? 'Active' : 'Inactive'}
                  >
                    {box.active ? 'Active' : 'Inactive'}
                  </span>
                )}
              </div>

              {/* Photo */}
              <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                {photoId ? (
                  <SecureImage
                    fileId={photoId}
                    alt={titleText}
                    className="w-full h-[40vh] sm:h-[50vh] object-cover"
                  />
                ) : (
                  <div className="h-[40vh] sm:h-[50vh] grid place-items-center text-slate-400 text-sm">
                    No photo
                  </div>
                )}
              </div>

              {/* Description (primary) */}
              <div className="rounded-lg border border-slate-200 p-4 bg-white">
                <h3 className="text-sm font-semibold text-slate-700 mb-1">Description</h3>
                <p className="text-slate-700 leading-relaxed">
                  {(box?.description && box.description.trim()) ||
                    (info?.content && String(info.content).trim()) ||
                    '—'}
                </p>
              </div>

              {/* Optional extra Info content separate from box description */}
              {info?.content && box?.description && (
                <div className="rounded-lg border border-slate-200 p-4 bg-white">
                  <h3 className="text-sm font-semibold text-slate-700 mb-1">Info</h3>
                  <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {info.content}
                  </div>
                </div>
              )}

              {/* Links (optional) */}
              {Array.isArray(info?.links) && info.links.length > 0 && (
                <div className="rounded-lg border border-slate-200 p-4 bg-white">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Links</h3>
                  <ul className="list-disc ml-5 space-y-1">
                    {info.links.map((l, i) => (
                      <li key={i}>
                        <a
                          className="text-indigo-600 hover:text-indigo-700 underline"
                          href={l.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {l.label || l.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Meta (optional) */}
              {box && (
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="rounded-md border border-slate-200 px-2 py-1 bg-slate-50">
                    Country: <span className="font-medium text-slate-700">{box.country}</span>
                  </span>
                  <span className="rounded-md border border-slate-200 px-2 py-1 bg-slate-50">
                    Weight: <span className="font-mono">{box.weight}%</span>
                  </span>
                  <span className="rounded-md border border-slate-200 px-2 py-1 bg-slate-50">
                    Created: {new Date(box.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

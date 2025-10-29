// client/src/pages/user/UploadPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import SecureImage from "../../components/media/SecureImage.jsx";
import { api } from "../../api";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { useAuth } from "../../auth/AuthContext";
import { readAssigned, writeAssigned, readMine, writeMine } from "../../upload/cache.js";

/* --------------------------- tiny helpers --------------------------- */
const cx = (...a) => a.filter(Boolean).join(" ");

export default function UploadPage() {
  const { t } = useTheme();
  const { user } = useAuth();
  const userId = user?._id || user?.id;

  // seed instantly from cache
  const [assigned, setAssigned] = useState(() => (userId ? readAssigned(userId) : []));   // [{_id,key,title}]
  const [mine, setMine]         = useState(() => (userId ? readMine(userId) : []));       // my uploads (metadata)

  const [target, setTarget] = useState("other"); // boxId or "other"
  const [files, setFiles]   = useState([]);
  const [busy, setBusy]     = useState(false);
  const [err, setErr]       = useState("");

  // lightbox
  const [gallery, setGallery] = useState(null);   // {label, items: []}

  // carousel (3 visible)
  const PAGE = 3;
  const [start, setStart] = useState(0);

  // background refresh — metadata only (boxes + uploads)
  useEffect(() => {
    let stop = false;
    if (!userId) return;
    (async () => {
      try {
        // assigned boxes
        const p = await api.get("/progress/me");
        if (stop) return;
        const statuses = p.data?.statuses || [];
        const list = [];
        for (const st of statuses) {
          const b = st.boxId;
          if (b && b._id) list.push({ _id: b._id, key: b.key, title: b.title });
        }
        setAssigned(prev => {
          const same = JSON.stringify(prev) === JSON.stringify(list);
          if (!same) writeAssigned(userId, list);
          return same ? prev : list;
        });

        // my uploads (metadata only)
        const my = await api.get("/uploads/me");
        if (stop) return;
        const items = my.data || [];
        const slim = items.map(it => ({
          _id: it._id,
          boxId: it.boxId ? { _id: it.boxId._id, key: it.boxId.key, title: it.boxId.title } : null,
          originalName: it.originalName,
          createdAt: it.createdAt,
          updatedAt: it.updatedAt,
        }));
        setMine(prev => {
          const same = JSON.stringify(prev) === JSON.stringify(slim);
          if (!same) writeMine(userId, items);
          return same ? prev : slim;
        });
      } catch (e) {
        if (!stop) setErr(e?.response?.data?.error || e.message);
      }
    })();
    return () => { stop = true; };
  }, [userId]);

  function onPick(e) { setFiles(Array.from(e.target.files || [])); }

  async function submit(e) {
    e.preventDefault();
    if (!files.length) return;
    setBusy(true); setErr("");
    try {
      const form = new FormData();
      for (const f of files) form.append("files", f);
      form.append("boxId", target || "other");
      await api.post("/uploads", form, { headers: { "Content-Type": "multipart/form-data" } });

      // refresh metadata after upload
      const my = await api.get("/uploads/me");
      const items = my.data || [];
      writeMine(userId, items);
      setMine(readMine(userId));
      setFiles([]);
    } catch (e2) {
      setErr(e2?.response?.data?.error || e2.message);
    } finally {
      setBusy(false);
    }
  }

  // group uploads by box
  const groups = useMemo(() => {
    const map = new Map();
    for (const it of mine) {
      const key = it.boxId?._id || "other";
      if (!map.has(key)) map.set(key, { box: it.boxId || null, items: [] });
      map.get(key).items.push(it);
    }
    const arr = Array.from(map.entries()).map(([key, g]) => {
      const first = g.items.reduce(
        (m, it) => Math.min(m, new Date(it.createdAt || it.updatedAt || 0).getTime()),
        Infinity
      );
      const label = g.box ? `${g.box.key} — ${g.box.title}` : "Other";
      return { key, label, items: g.items, firstDate: first, count: g.items.length };
    });
    arr.sort((a, b) => a.firstDate - b.firstDate);
    return arr;
  }, [mine]);

  // keep start in range
  useEffect(() => {
    if (!groups.length) { setStart(0); return; }
    setStart((s) => (s % groups.length + groups.length) % groups.length);
  }, [groups.length]);

  // 3 visible (wrap)
  const visible = useMemo(() => {
    const out = [];
    const n = groups.length;
    for (let i = 0; i < Math.min(PAGE, n); i++) out.push(groups[(start + i) % n]);
    return out;
  }, [groups, start]);

  function next() { if (groups.length > PAGE) setStart((s) => (s + 1) % groups.length); }
  function prev() { if (groups.length > PAGE) setStart((s) => (s - 1 + groups.length) % groups.length); }

  function openBox(g) {
    const items = g.items
      .slice()
      .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));
    setGallery({ label: g.label, items });
  }

  /* ==================== RENDER ==================== */
  return (
    <div className="grid gap-5">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className={t("text-xl font-semibold text-slate-900","text-xl font-semibold text-white")}>
          Upload files
        </h1>
        <span
          className={t(
            "inline-flex items-center rounded-md bg-sky-200 text-slate-900 px-2.5 py-0.5 text-[11px] font-semibold",
            "inline-flex items-center rounded-md bg-sky-800/50 text-white px-2.5 py-0.5 text-[11px] font-semibold"
          )}
        >
          {mine.length} file{mine.length === 1 ? "" : "s"}
        </span>
      </header>

      {err && (
        <div
          className={t(
            "p-2 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm",
            "p-2 rounded-lg border border-red-400/40 bg-red-500/10 text-red-200 text-sm"
          )}
        >
          {err}
        </div>
      )}

      {/* COMPACT FORM — smaller width, zero dead space */}
      <form
        onSubmit={submit}
        className={t(
          "rounded-2xl border border-slate-200 bg-white shadow-sm px-4 py-3 mx-auto w-full max-w-[420px]",
          "rounded-2xl border border-slate-700 bg-slate-950/70 shadow-[0_10px_30px_rgba(0,0,0,0.45)] px-4 py-3 mx-auto w-full max-w-[420px]"
        )}
      >
        {/* hard cap on width to remove wasted space */}
        <div className="mx-auto w-full max-w-[420px]">
          {/* align to top; keep tight gaps; same row on md+ */}
          <div className="grid items-start gap-4 md:grid-cols-2">
            {/* Assign to — sits at the very top, left column */}
            <div className="grid gap-1">
              <label className={t("text-[11px] font-medium text-slate-600","text-[11px] font-medium text-slate-300")}>
                Assign to
              </label>
              <SmartSelect
                value={target}
                onChange={setTarget}
                items={[
                  { value: "other", label: "Other" },
                  ...assigned.map(b => ({ value: b._id, label: `${b.key} — ${b.title}` })),
                ]}
                t={t}
              />
            </div>

            {/* Files — right column; small height */}
            <div className="grid gap-1">
              <label className={t("text-[11px] font-medium text-slate-600","text-[11px] font-medium text-slate-300")}>
                Files
              </label>

              <input
                id="upload-files"
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={onPick}
                className="hidden"
              />

              {(() => {
                const hasFiles = files && files.length > 0;
                return (
                  <label
                    htmlFor="upload-files"
                    className={cx(
                      "w-full h-24 rounded-xl border-2 border-dashed grid place-items-center text-center cursor-pointer transition",
                      hasFiles
                        ? t("border-sky-400 bg-sky-50 ring-2 ring-sky-300/40","border-sky-500/60 bg-sky-500/10 ring-1 ring-sky-400/40")
                        : t("border-slate-300 bg-white hover:bg-slate-50","border-slate-700 bg-slate-900 hover:bg-slate-900/70")
                    )}
                  >
                    <div className="flex flex-col items-center gap-1" aria-live="polite">
                      {hasFiles ? (
                        <svg className={t("h-5 w-5 text-sky-700","h-5 w-5 text-sky-300")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        <svg className={t("h-5 w-5 text-slate-500","h-5 w-5 text-slate-400")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      )}
                      <div className={t("text-sm font-medium text-slate-700","text-sm font-medium text-slate-200")}>
                        {hasFiles ? "File added" : "Add file(s)"}
                      </div>
                      <div className={t("text-[11px] text-slate-500","text-[11px] text-slate-400")}>
                        {hasFiles ? `${files.length} selected — click to change` : "Images or PDFs • click to choose"}
                      </div>
                    </div>
                  </label>
                );
              })()}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-3 flex items-center justify-center gap-3">
            <button
              type="submit"
              disabled={busy || !files.length}
              className={cx(
                "px-3 py-1.5 rounded-md text-sm text-white transition border",
                busy || !files.length
                  ? "bg-sky-300 border-sky-300 cursor-not-allowed"
                  : "bg-sky-600 hover:bg-sky-700 border-sky-700"
              )}
            >
              {busy ? "Uploading…" : "Upload"}
            </button>
            <button
              type="button"
              onClick={() => setFiles([])}
              disabled={!files.length || busy}
              className={t(
                "px-3 py-1.5 rounded-md border border-slate-300 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50",
                "px-3 py-1.5 rounded-md border border-slate-600 text-sm text-slate-200 bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
              )}
            >
              Clear
            </button>
          </div>
        </div>
      </form>

      {/* Your boxes — roomy & attractive */}
      <section className={t(
        "rounded-2xl border border-slate-200 bg-white shadow-sm",
        "rounded-2xl border border-slate-700 bg-slate-950/70 shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
      )}>
        <div className={t("px-4 py-3 border-b border-slate-200","px-4 py-3 border-b border-slate-700")}>
          <h2 className={t("font-semibold text-slate-800","font-semibold text-slate-100")}>Your boxes</h2>
        </div>

        <div className="py-4">
          <div className="mx-auto w-[88%] max-w-[1100px]">
            <div className="relative">
              {groups.length > PAGE && (
                <button
                  onClick={prev}
                  className={t(
                    "absolute left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-sky-500 text-white shadow hover:bg-sky-600",
                    "absolute left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-sky-500 text-white shadow hover:bg-sky-600"
                  )}
                  aria-label="Previous"
                >
                  ‹
                </button>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-12">
                {visible.map((g) => (
                  <button
                    key={g.key}
                    onClick={() => openBox(g)}
                    className={t(
                      "group h-20 rounded-xl border text-left px-4 py-3 transition shadow-sm bg-gradient-to-br from-sky-50 to-white border-sky-200 hover:from-sky-100 hover:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400",
                      "group h-20 rounded-xl border text-left px-4 py-3 transition shadow-sm bg-gradient-to-br from-slate-900 to-slate-950 border-slate-700 hover:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-300/70"
                    )}
                    title={g.label}
                  >
                    <div className="flex items-center gap-3">
                      <div className={t(
                        "h-9 w-9 rounded-lg grid place-items-center bg-sky-100 text-sky-700 border border-sky-200",
                        "h-9 w-9 rounded-lg grid place-items-center bg-sky-900/40 text-sky-200 border border-sky-700/50"
                      )}>
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M10 4h2l2 2h6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6h6l2-2z"/></svg>
                      </div>
                      <div className="min-w-0">
                        <div className={t("text-[14px] font-semibold text-slate-800 truncate","text-[14px] font-semibold text-slate-100 truncate")}>
                          {g.label}
                        </div>
                        <div className={t("text-[12px] text-slate-600","text-[12px] text-slate-400")}>
                          {g.count} file{g.count === 1 ? "" : "s"}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
                {groups.length < PAGE &&
                  Array.from({ length: PAGE - groups.length }).map((_, i) => <div key={`spacer-${i}`} />)}
              </div>

              {groups.length > PAGE && (
                <button
                  onClick={next}
                  className={t(
                    "absolute right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-sky-500 text-white shadow hover:bg-sky-600",
                    "absolute right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-sky-500 text-white shadow hover:bg-sky-600"
                  )}
                  aria-label="Next"
                >
                  ›
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {gallery && (
        <Lightbox onClose={() => setGallery(null)}>
          <GalleryBody title={gallery.label} items={gallery.items} />
        </Lightbox>
      )}
    </div>
  );
}

/* =================== Custom Select (opens DOWN, compact) =================== */
function SmartSelect({ value, onChange, items, t }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrapRef = useRef(null);

  const selected = items.find(i => i.value === value) || items[0];
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(i => i.label.toLowerCase().includes(s));
  }, [q, items]);

  useEffect(() => {
    function onDoc(e) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cx(
          "h-9 w-full rounded-xl px-3 pr-9 text-left text-[13px]",
          t("bg-white text-slate-900 border border-slate-300 shadow-sm","bg-slate-900 text-slate-100 border border-slate-700"),
          "focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
        )}
        title={selected?.label}
      >
        {selected?.label}
      </button>

      {/* arrow */}
      <svg
        className={cx(
          "pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 transition",
          t("text-slate-400","text-slate-400"),
          open ? "rotate-180" : ""
        )}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>

      {open && (
        <div
          className={cx(
            "absolute left-0 right-0 mt-1 rounded-xl overflow-hidden z-20",
            t("bg-white border border-slate-200 shadow-xl","bg-slate-900 border border-slate-700 shadow-2xl")
          )}
          style={{ maxHeight: 280 }}
        >
          <div className={t("p-2 border-b border-slate-200","p-2 border-b border-slate-700")}>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className={t(
                "w-full h-8 rounded-md px-2 text-sm bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400",
                "w-full h-8 rounded-md px-2 text-sm bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-300/70"
              )}
            />
          </div>
          <ul className="max-h-[220px] overflow-auto py-1">
            {filtered.map(opt => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); setQ(""); }}
                  className={cx(
                    "w-full text-left px-3 py-2 text-sm",
                    t("hover:bg-sky-50 text-slate-800","hover:bg-slate-800 text-slate-100")
                  )}
                  title={opt.label}
                >
                  {opt.label}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className={t("px-3 py-2 text-sm text-slate-500","px-3 py-2 text-sm text-slate-400")}>No results</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/* =================== Lightbox & Gallery =================== */

function Lightbox({ onClose, children }) {
  const { t } = useTheme();
  const panelRef = React.useRef(null);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    const onPointer = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) onClose?.(); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer, { passive: true });
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4">
        <div
          ref={panelRef}
          className={t(
            "relative bg-white rounded-2xl shadow-2xl w-[min(96vw,1100px)] max-h-[90vh] overflow-hidden",
            "relative bg-slate-950 rounded-2xl shadow-2xl w-[min(96vw,1100px)] max-h-[90vh] overflow-hidden border border-slate-700"
          )}
        >
          <button
            onClick={onClose}
            className={t(
              "absolute top-2 left-2 rounded-md bg-white/90 border border-slate-200 px-2 py-1 text-slate-700 hover:bg-white",
              "absolute top-2 left-2 rounded-md bg-slate-900/90 border border-slate-700 px-2 py-1 text-slate-200 hover:bg-slate-900"
            )}
            title="Close"
          >
            ✕
          </button>
          <div className="overflow-auto max-h-[90vh]">{children}</div>
        </div>
      </div>
    </div>
  );
}

function GalleryBody({ title, items }) {
  const { t } = useTheme();
  return (
    <div className="p-4">
      <div className="mb-3 text-center">
        <h3 className={t("font-semibold text-slate-800 truncate","font-semibold text-slate-100 truncate")}>
          {title}
        </h3>
        <div className={t("mt-1 text-xs text-slate-500","mt-1 text-xs text-slate-400")}>
          {items.length} file{items.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((it) => (
          <PreviewItem key={it._id} file={it} />
        ))}
      </div>
    </div>
  );
}

function PreviewItem({ file }) {
  const { t } = useTheme();
  const id = file._id;
  const name = file.originalName || "file";
  const ext = (name.split(".").pop() || "").toLowerCase();
  const isImg = ["png", "jpg", "jpeg", "webp", "gif", "bmp", "tiff", "svg"].includes(ext);
  const isPdf = ext === "pdf";

  const frameCls = t(
    "bg-white rounded-xl border border-slate-200 overflow-hidden",
    "bg-slate-900 rounded-xl border border-slate-700 overflow-hidden"
  );
  const capCls = t(
    "px-3 py-2 text-sm text-slate-700 truncate border-b border-slate-200",
    "px-3 py-2 text-sm text-slate-200 truncate border-b border-slate-700"
  );

  if (isImg) {
    return (
      <figure className={frameCls}>
        <figcaption className={capCls}>{name}</figcaption>
        <div className="grid place-items-center p-2">
          <SecureImage fileId={id} alt={name} className="max-h-[70vh] w-full object-contain rounded-lg" />
        </div>
      </figure>
    );
  }

  if (isPdf) {
    return (
      <figure className={frameCls}>
        <figcaption className={capCls}>{name}</figcaption>
        <iframe title={name} src={`/uploads/file/${id}`} className={t("w-full h-[70vh] bg-white","w-full h-[70vh] bg-slate-900")} />
      </figure>
    );
  }

  return (
    <figure className={frameCls}>
      <figcaption className={capCls}>{name}</figcaption>
      <div className={t("p-6 text-center text-slate-600","p-6 text-center text-slate-300")}>
        Preview not available.
      </div>
    </figure>
  );
}

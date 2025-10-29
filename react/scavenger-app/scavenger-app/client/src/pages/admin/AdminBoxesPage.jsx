// client/src/pages/admin/AdminBoxesPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../api";
import { useAuth } from "../../auth/AuthContext";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import AdminTopNav from "./AdminTopNav.jsx";
import SecureImage from "../../components/media/SecureImage.jsx";

/* ---------------- localStorage helpers ---------------- */
const getLS = (k, d = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const setLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const BOXES_KEY = (country) => `admin:boxes:${country}`;
const BOXES_TS  = (country) => `admin:boxes:ts:${country}`;

/* ---------------- misc helpers ---------------- */
function friendlyError(e, fallback = "Request failed") {
  const status = e?.response?.status;
  const msg = e?.response?.data?.error || e?.message || fallback;
  return `[${status || "ERR"}] ${msg}`;
}

async function uploadOneFile(file) {
  const fd = new FormData();
  fd.append("files", file);
  const res = await api.post("/uploads", fd, { headers: { "Content-Type": "multipart/form-data" } });

  const data = res?.data;
  const candidate = (Array.isArray(data) && data[0]) || data?.file || data;
  let fileId = candidate?._id || candidate?.id || null;

  if (!fileId) {
    const mine = await api.get("/uploads/me");
    const latest = (mine.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    fileId = latest?._id || latest?.id || null;
  }
  return fileId;
}

/* =========================== PAGE =========================== */
export default function AdminBoxesPage() {
  const { user } = useAuth();
  const { t } = useTheme();

  const [country, setCountry] = useState("USA");
  const [boxes, setBoxes] = useState(() => getLS(BOXES_KEY("USA"), []));
  const [loading, setLoading] = useState(boxes.length === 0);
  const [err, setErr] = useState("");

  // modal (edit/create)
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = create, otherwise the box object

  const total = useMemo(
    () => boxes.reduce((sum, b) => sum + (Number(b.weight) || 0), 0),
    [boxes]
  );
  const remaining = Math.max(0, 100 - total);

  async function refresh(countryArg = country) {
    if (!user || user.role !== "admin") return;
    setErr("");
    try {
      const res = await api.get(`/boxes/admin?country=${encodeURIComponent(countryArg)}`);
      const list = res.data || [];
      const prev = getLS(BOXES_KEY(countryArg), []);
      const same = JSON.stringify(prev) === JSON.stringify(list);
      if (!same) {
        setLS(BOXES_KEY(countryArg), list);
        setLS(BOXES_TS(countryArg), Date.now());
      }
      if (countryArg === country) setBoxes(same ? prev : list);
    } catch (e) {
      setErr(friendlyError(e, "Failed to load boxes"));
    } finally {
      setLoading(false);
    }
  }

  // seed & refresh on country/user
  useEffect(() => {
    const cached = getLS(BOXES_KEY(country), []);
    setBoxes(cached);
    setLoading(cached.length === 0);
    refresh(country);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, user?.role]);

  /* ---------- create/update/delete ---------- */
  async function createBox(payload) {
    const { data: created } = await api.post("/boxes/admin", payload);
    const next = [created, ...boxes];
    setBoxes(next);
    setLS(BOXES_KEY(country), next);
    setLS(BOXES_TS(country), Date.now());
  }

  async function updateBox(id, patch) {
    await api.put(`/boxes/admin/${id}`, patch);
    const next = boxes.map((b) => (b._id === id ? { ...b, ...patch } : b));
    setBoxes(next);
    setLS(BOXES_KEY(country), next);
    setLS(BOXES_TS(country), Date.now());
  }

  async function deleteBox(id) {
    await api.delete(`/boxes/admin/${id}`);
    const next = boxes.filter((b) => b._id !== id);
    setBoxes(next);
    setLS(BOXES_KEY(country), next);
    setLS(BOXES_TS(country), Date.now());
  }

  const openCreate = () => { setEditing(null); setOpen(true); };
  const openEdit = (box) => { setEditing(box); setOpen(true); };

  if (!user || user.role !== "admin") {
    return (
      <div className={t("min-h-screen bg-sky-100 text-slate-800","min-h-screen bg-sky-900 text-slate-100")}>
        <AdminTopNav />
        <main className="max-w-6xl mx-auto px-5 py-6">
          <div className={t("p-3 rounded-lg bg-white","p-3 rounded-lg bg-slate-900")}>
            Admins only.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={t("min-h-screen bg-sky-100 text-slate-800","min-h-screen bg-sky-900 text-slate-100")}>
      <AdminTopNav />
      <main className="max-w-6xl mx-auto px-5 py-6 grid gap-4">

        {/* Header / Filters */}
        <section className={t(
          "rounded-xl border border-sky-200 bg-white/70 backdrop-blur",
          "rounded-xl border border-slate-700 bg-slate-900/70 backdrop-blur"
        )}>
          <div className={t(
            "px-4 py-2 border-b border-sky-200 text-slate-900 bg-white/60 rounded-t-xl",
            "px-4 py-2 border-b border-slate-700 text-white bg-slate-950/40 rounded-t-xl"
          )}>
            <h1 className="text-sm font-semibold">Manage Boxes</h1>
          </div>
          <div className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className={t("text-sm text-slate-700","text-sm text-slate-300")}>
              <span className={`font-semibold ${total === 100 ? "text-emerald-600" : t("text-amber-700","text-amber-300")}`}>{total}%</span>
              {" "}Used • Remaining: <span className="font-semibold">{Math.max(0, 100 - total)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <label className={t("text-sm text-slate-700","text-sm text-slate-300")}>Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={t(
                  "rounded-md border border-slate-300 bg-white text-slate-900 px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                  "rounded-md border border-slate-700 bg-slate-950 text-slate-100 px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70"
                )}
              >
                {["USA","Russia","Canada"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <button
                onClick={openCreate}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              >
                New Box
              </button>
            </div>
          </div>
        </section>

        {err && (
          <div className={t(
            "p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm",
            "p-3 rounded-lg border border-red-400/40 bg-red-500/10 text-red-200 text-sm"
          )}>{err}</div>
        )}

        {/* Card grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {loading ? (
            <div className={t("text-sm text-slate-700","text-sm text-slate-300")}>Loading…</div>
          ) : boxes.length === 0 ? (
            <div className={t("text-sm text-slate-700","text-sm text-slate-300")}>No boxes yet.</div>
          ) : (
            boxes.map((b) => {
              const photoId =
                b.photoFileId ||
                b.photoId ||
                (typeof b.photo === "string" ? b.photo : b.photo?._id) ||
                null;
              const hasPhoto = !!photoId;

              return (
                <button
                  key={b._id}
                  onClick={() => openEdit(b)}
                  className={t(
                    "w-full text-left rounded-xl border border-sky-200 bg-white/90 hover:bg-white shadow-sm hover:shadow transition p-4",
                    "w-full text-left rounded-xl border border-slate-700 bg-slate-900/90 hover:bg-slate-900 shadow-sm hover:shadow transition p-4"
                  )}
                  title="Edit box"
                >
                  {/* Title */}
                  <div className="flex items-center gap-2">
                    <div className="font-semibold truncate">{b.title || "Untitled"}</div>
                  </div>

                  {/* Badges row */}
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={t(
                        `inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                          hasPhoto
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-slate-50 border-slate-200 text-slate-600"
                        }`,
                        `inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                          hasPhoto
                            ? "bg-emerald-500/10 border-emerald-400/40 text-emerald-300"
                            : "bg-slate-800/60 border-slate-700 text-slate-300"
                        }`
                      )}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                      {hasPhoto ? "Photo" : "No photo"}
                    </span>

                    <span className={t(
                      "inline-flex items-center rounded-full bg-sky-50 border border-sky-200 text-sky-700 px-2 py-0.5 text-[11px] font-semibold",
                      "inline-flex items-center rounded-full bg-sky-500/10 border border-sky-400/40 text-sky-300 px-2 py-0.5 text-[11px] font-semibold"
                    )}>
                      {Number(b.weight) || 0}% weight
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </section>
      </main>

      {/* Modal */}
      <EditModal
        open={open}
        box={editing}
        country={country}
        allBoxes={boxes}
        onClose={() => setOpen(false)}
        onCreate={async (payload) => { await createBox(payload); setOpen(false); }}
        onUpdate={async (id, patch) => { await updateBox(id, patch); setOpen(false); }}
        onDelete={async (id) => { await deleteBox(id); setOpen(false); }}
      />
    </div>
  );
}

/* =========================== MODAL =========================== */
function EditModal({ open, box, country, allBoxes, onClose, onCreate, onUpdate, onDelete }) {
  const { t } = useTheme();
  const isEdit = !!box;

  // freeze background
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const originalPhotoId =
    box?.photoFileId ||
    box?.photoId ||
    (typeof box?.photo === "string" ? box?.photo : box?.photo?._id) ||
    null;

  // contacts support (front-end data shape)
  const initialContacts = Array.isArray(box?.contacts) ? box.contacts : [];

  const [form, setForm] = useState(() => ({
    key: box?.key || "",
    title: box?.title || "",
    description: box?.description || "",
    weight: box?.weight ?? 0,
    active: box?.active ?? true,
    photoFileId: originalPhotoId,
    contacts: initialContacts.length ? initialContacts : [], // [{name, phone, email, notes}]
  }));
  useEffect(() => {
    if (!open) return;
    setForm({
      key: box?.key || "",
      title: box?.title || "",
      description: box?.description || "",
      weight: box?.weight ?? 0,
      active: box?.active ?? true,
      photoFileId: originalPhotoId,
      contacts: Array.isArray(box?.contacts) ? box.contacts : [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, box?._id]);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [uploading, setUploading] = useState(false);

  // autosize description
  const descRef = useRef(null);
  const autoSize = () => {
    const el = descRef.current;
    if (!el) return;
    el.style.height = "0px";
    const h = Math.min(220, Math.max(80, el.scrollHeight));
    el.style.height = h + "px";
  };
  useEffect(() => { autoSize(); }, [form.description]);

  function sumOthers() {
    const currentId = box?._id;
    return allBoxes.reduce((acc, b) => {
      if (currentId && b._id === currentId) return acc;
      return acc + (Number(b.weight) || 0);
    }, 0);
  }

  function fillTo100() {
    const used = sumOthers();
    const remaining = Math.max(0, 100 - used);
    setForm((f) => ({ ...f, weight: remaining }));
  }

  async function onPickPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr("");
    try {
      setUploading(true);
      const fileId = await uploadOneFile(file);
      setForm((f) => ({ ...f, photoFileId: fileId || null }));
    } catch (e2) {
      setErr(e2?.response?.data?.error || e2.message || "Photo upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save(e) {
    e?.preventDefault?.();
    setErr("");

    // validate total <= 100
    const usedOthers = sumOthers();
    const newTotal = usedOthers + (Number(form.weight) || 0);
    if (newTotal > 100) {
      setErr(`Total weight would be ${newTotal}%. Reduce this box's weight or use "Fill to 100%".`);
      return;
    }

    setBusy(true);
    try {
      const payload = {
        key: form.key,
        title: form.title,
        description: form.description,
        weight: Number(form.weight) || 0,
        active: !!form.active,
        country: box?.country || country,
        contacts: form.contacts, // expects backend to accept this optional array
      };

      if (form.photoFileId && form.photoFileId !== originalPhotoId) {
        payload.photoFileId = form.photoFileId;
      } else if (!form.photoFileId && originalPhotoId) {
        payload.photoClear = true;
      }

      if (isEdit) await onUpdate(box._id, payload);
      else await onCreate(payload);
    } catch (e2) {
      setErr(e2?.response?.data?.error || e2.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  const previewId = form.photoFileId;
  const usedOthers = sumOthers();
  const remainingForThis = Math.max(0, 100 - usedOthers);

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 transition-opacity opacity-100"
      />
      {/* Panel */}
      <div
        className={t(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(880px,96vw)] rounded-2xl border border-sky-200 bg-white shadow-2xl",
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(880px,96vw)] rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className={t(
          "px-5 py-3 border-b border-sky-200 bg-sky-50/70 rounded-t-2xl",
          "px-5 py-3 border-b border-slate-700 bg-slate-950/40 rounded-t-2xl"
        )}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">{isEdit ? "Edit Box" : "New Box"}</h3>
            <button
              onClick={onClose}
              className={t(
                "rounded-md px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100",
                "rounded-md px-3 py-1.5 text-sm text-slate-200 hover:bg-white/10"
              )}
            >
              X
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={save} className="max-h-[78vh] overflow-y-auto no-scrollbar p-5 grid gap-3">
          {err && (
            <div className={t(
              "p-2 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm",
              "p-2 rounded-md border border-red-400/40 bg-red-500/10 text-red-200 text-sm"
            )}>{err}</div>
          )}

          {/* Title / Key */}
          <div className="grid md:grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className={t("text-xs font-medium text-slate-700","text-xs font-medium text-slate-300")}>Key</span>
              <input
                className={t(
                  "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                  "rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70"
                )}
                value={form.key}
                onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
                placeholder="e.g. A"
                required
              />
            </label>

            <label className="grid gap-1">
              <span className={t("text-xs font-medium text-slate-700","text-xs font-medium text-slate-300")}>Title</span>
              <input
                className={t(
                  "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                  "rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70"
                )}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Title"
                required
              />
            </label>
          </div>

          {/* Description (autosize) */}
          <label className="grid gap-1">
            <span className={t("text-xs font-medium text-slate-700","text-xs font-medium text-slate-300")}>Description</span>
            <textarea
              ref={descRef}
              rows={4}
              className={t(
                "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                "rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70"
              )}
              value={form.description}
              onChange={(e) => { setForm((f) => ({ ...f, description: e.target.value })); }}
              onInput={autoSize}
              placeholder="Write a longer description…"
            />
          </label>

          {/* Upload (left) + Weight (right) */}
          <div className="grid md:grid-cols-2 gap-3 items-start">
            {/* Upload box (like UploadPage) */}
            <div className="grid gap-1">
              <span className={t("text-xs font-medium text-slate-700","text-xs font-medium text-slate-300")}>Photo</span>

              <input id="box-photo" type="file" accept="image/*" onChange={onPickPhoto} className="hidden" />

              <label
                htmlFor="box-photo"
                className={[
                  "w-full min-h-[120px] rounded-xl border-2 border-dashed grid place-items-center text-center cursor-pointer transition",
                  t("border-slate-300 bg-white hover:bg-slate-50","border-slate-700 bg-slate-900 hover:bg-slate-900/70")
                ].join(" ")}
              >
                {previewId ? (
                  <div className="p-2 w-full">
                    <SecureImage fileId={previewId} alt="Preview" className="h-28 w-full object-contain rounded-lg" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <svg className={t("h-5 w-5 text-slate-500","h-5 w-5 text-slate-400")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    <div className={t("text-sm font-medium text-slate-700","text-sm font-medium text-slate-200")}>Upload photo</div>
                    <div className={t("text-[11px] text-slate-500","text-[11px] text-slate-400")}>Images only</div>
                  </div>
                )}
              </label>

              <div className="flex items-center gap-2">
                {previewId && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, photoFileId: null }))}
                    className={t(
                      "rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50",
                      "rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                    )}
                  >
                    Remove
                  </button>
                )}
                {uploading && <span className={t("text-xs text-slate-500","text-xs text-slate-400")}>Uploading…</span>}
              </div>
            </div>

            {/* Weight with Fill button */}
            <div className="grid gap-1">
              <span className={t("text-xs font-medium text-slate-700","text-xs font-medium text-slate-300")}>Weight (%)</span>

              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.weight}
                  onChange={(e) => {
                    const v = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                    setForm((f) => ({ ...f, weight: v }));
                  }}
                  className={t(
                    "w-32 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                    "w-32 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70"
                  )}
                />
                <button
                  type="button"
                  onClick={fillTo100}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                  title={`Fill to remaining (${remainingForThis}%)`}
                >
                  Fill to 100%
                </button>
              </div>

              <div className={t("text-xs text-slate-500","text-xs text-slate-400")}>
                Used (others): <b>{usedOthers}%</b> • Remaining: <b>{remainingForThis}%</b>
              </div>

              {/* Active checkbox */}
              <label className="mt-2 inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                />
                <span className={t("text-sm text-slate-700","text-sm text-slate-300")}>Active</span>
              </label>
            </div>
          </div>

          {/* Contacts */}
          <div className="mt-1">
            <div className={t("text-sm font-semibold text-slate-800 mb-2","text-sm font-semibold text-slate-100 mb-2")}>
              Contacts (optional)
            </div>
            <ContactEditor
              value={form.contacts}
              onChange={(contacts) => setForm((f) => ({ ...f, contacts }))}
            />
          </div>

          {/* Footer buttons */}
          <div className="mt-2 flex items-center justify-between">
            {isEdit ? (
              <button
                type="button"
                onClick={async () => {
                  if (!window.confirm("Delete this box?")) return;
                  setBusy(true);
                  try { await onDelete(box._id); } finally { setBusy(false); }
                }}
                className="px-3 py-1.5 rounded-md border border-red-200 text-sm text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70"
                disabled={busy}
              >
                Delete
              </button>
            ) : <span />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className={t(
                  "rounded-md px-3 py-1.5 text-sm border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
                  "rounded-md px-3 py-1.5 text-sm border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                )}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-md px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =================== Contacts Editor =================== */
function ContactEditor({ value = [], onChange }) {
  const { t } = useTheme();

  const add = () => {
    onChange([...(value || []), { name: "", phone: "", email: "", notes: "" }]);
  };
  const remove = (idx) => {
    const next = [...value];
    next.splice(idx, 1);
    onChange(next);
  };
  const patch = (idx, field, v) => {
    const next = [...value];
    next[idx] = { ...(next[idx] || {}), [field]: v };
    onChange(next);
  };

  return (
    <div className="grid gap-2">
      {(value || []).map((c, i) => (
        <div
          key={i}
          className={t(
            "rounded-xl border border-slate-200 bg-white p-3 grid gap-2",
            "rounded-xl border border-slate-700 bg-slate-950/70 p-3 grid gap-2"
          )}
        >
          <div className="grid md:grid-cols-3 gap-2">
            <input
              value={c.name || ""}
              onChange={(e) => patch(i, "name", e.target.value)}
              placeholder="Name"
              className={t(
                "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900",
                "rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              )}
            />
            <input
              value={c.phone || ""}
              onChange={(e) => patch(i, "phone", e.target.value)}
              placeholder="Phone"
              className={t(
                "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900",
                "rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              )}
            />
            <input
              value={c.email || ""}
              onChange={(e) => patch(i, "email", e.target.value)}
              placeholder="Email"
              className={t(
                "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900",
                "rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              )}
            />
          </div>

          <textarea
            rows={2}
            value={c.notes || ""}
            onChange={(e) => patch(i, "notes", e.target.value)}
            placeholder="Notes / description"
            className={t(
              "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 resize-y",
              "rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 resize-y"
            )}
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => remove(i)}
              className={t(
                "rounded-md px-2 py-1 text-xs border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
                "rounded-md px-2 py-1 text-xs border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
              )}
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="self-start rounded-md px-3 py-1.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
      >
        Add contact
      </button>
    </div>
  );
}




// client/src/pages/user/BoxDetaiPage.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api";
import SecureImage from "../../components/media/SecureImage.jsx";
import { useTheme } from "../../theme/ThemeProvider.jsx";

/* small utils */
const cx = (...a) => a.filter(Boolean).join(" ");
const initials = (name = "") =>
  String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() || "")
    .join("");

export default function BoxDetaiPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t } = useTheme();

  const [box, setBox] = React.useState(null);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    let stop = false;
    (async () => {
      try {
        const r = await api.get(`/boxes/${id}`);
        if (!stop) setBox(r.data || null);
      } catch (e) {
        if (!stop) setErr(e?.response?.data?.error || e.message || "Failed to load");
      }
    })();
    return () => { stop = true; };
  }, [id]);

  // widths
  const container    = "mx-auto w-[min(92vw,1100px)]";
  const containerFit = "mx-auto w-full sm:w-fit max-w-[min(92vw,1100px)]";

  const sectionWrap  = t(
    "rounded-xl border border-slate-200 bg-white",
    "rounded-xl border border-slate-700 bg-slate-950/70"
  );

  // tight photo frame: tiny border only, no big panel
  const photoFrame = t(
    "mx-auto w-[min(96vw,1000px)] ",
    "mx-auto w-[min(96vw,1000px)] "
  );

  if (err) {
    return (
      <div className={container}>
        <div
          className={t(
            "mt-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm",
            "mt-4 p-3 rounded-lg border border-red-400/40 bg-red-500/10 text-red-200 text-sm"
          )}
        >
          {err}
        </div>
      </div>
    );
  }

  if (!box) return <div className={t("text-sm text-slate-700","text-sm text-slate-300")}>Loading…</div>;

  const photoId =
    box.photoFileId ||
    box.photoId ||
    (typeof box.photo === "string" ? box.photo : box.photo?._id) ||
    null;

  return (
    <div className="grid gap-5">
      {/* Page header row */}
      <div className={cx(container, "flex items-center gap-3 mt-2")}>
        {/* <button
          onClick={() => nav(-1)}
          className={t(
            "px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50",
            "px-3 py-1.5 rounded-md border border-slate-600 text-slate-200 bg-slate-800 hover:bg-slate-700"
          )}
          aria-label="Go back"
        >
          ← Back
        </button> */}
        <h1 className={t("text-xl font-semibold text-slate-900","text-xl font-semibold text-white")}>
          {box.title}
        </h1>
      </div>

      {/* Photo — tight frame, zero dead space, always fully visible & readable */}
      {photoId ? (
        <figure className={photoFrame}>
          <SecureImage
            fileId={photoId}
            alt={box.title}
            className={
              // fully fit: no crop; big enough to read; never overtakes the page
              "block mx-auto max-w-full h-auto max-h-[80vh] object-contain rounded-lg"
            }
          />
        </figure>
      ) : (
        <div className={cx(container, sectionWrap, t("p-4 text-sm text-slate-600","p-4 text-sm text-slate-300"))}>
          No photo for this box.
        </div>
      )}

      {/* Description */}
      <section className={cx(container, sectionWrap)}>
        <div className={t("px-4 py-2 border-b border-slate-200","px-4 py-2 border-b border-slate-700")}>
          <h3 className={t("font-semibold text-slate-800","font-semibold text-slate-100")}>Description</h3>
        </div>
        <div className={t("p-4 text-slate-800 overflow-x-hidden","p-4 text-slate-100 overflow-x-hidden")}>
          {box.description ? (
            <p className="leading-6 whitespace-pre-wrap break-words">{box.description}</p>
          ) : (
            <span className={t("text-slate-500","text-slate-400")}>—</span>
          )}
        </div>
      </section>

      {/* Contacts – outer box shrinks to content, cards centered and wrap into rows */}
      <section className={cx(containerFit, sectionWrap)}>
        <div className={t("px-4 py-2 border-b border-slate-200","px-4 py-2 border-b border-slate-700")}>
          <h3 className={t("font-semibold text-slate-800","font-semibold text-slate-100")}>Contacts</h3>
        </div>

        {Array.isArray(box.contacts) && box.contacts.length > 0 ? (
          <div className="p-3">
            <div className="flex flex-wrap justify-center gap-3">
              {box.contacts.map((c, i) => (
                <ContactCard key={i} contact={c} className="w-[280px] sm:w-[320px]" />
              ))}
            </div>
          </div>
        ) : (
          <div className={t("p-4 text-sm text-slate-600","p-4 text-sm text-slate-300")}>No contacts yet.</div>
        )}
      </section>
    </div>
  );
}

/* -------------------- Compact contact card -------------------- */
function ContactCard({ contact, className = "" }) {
  const { t } = useTheme();

  const copy = (txt) => {
    if (!txt) return;
    try { navigator.clipboard?.writeText(String(txt)); } catch {}
  };

  return (
    <div
      className={cx(
        className,
        t(
          "rounded-xl border border-slate-200 bg-white px-3 py-2",
          "rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2"
        )
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={t(
            "h-8 w-8 rounded-full grid place-items-center bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold",
            "h-8 w-8 rounded-full grid place-items-center bg-slate-800 text-slate-100 border border-slate-700 text-xs font-semibold"
          )}
          aria-hidden
        >
          {initials(contact?.name || "") || "?"}
        </div>

        <div className="min-w-0 flex-1">
          <div className={t("text-[13px] font-semibold text-slate-900 truncate","text-[13px] font-semibold text-slate-50 truncate")}>
            {contact?.name || "—"}
          </div>

          <div className="mt-1 grid gap-1">
            {contact?.phone && (
              <div className="flex items-center gap-2 min-w-0">
                <svg className={t("h-3.5 w-3.5 text-slate-500","h-3.5 w-3.5 text-slate-400")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92V21a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.99 5.2 2 2 0 0 1 5 3h4.09a2 2 0 0 1 2 1.72c.12.86.32 1.7.59 2.5a2 2 0 0 1-.45 2.11L10 10a16 16 0 0 0 6 6l.67-1.22a2 2 0 0 1 2.11-.9c.8.22 1.64.38 2.5.46A2 2 0 0 1 22 16.92Z"/></svg>
                <span className={t("text-[12px] text-slate-700 truncate","text-[12px] text-slate-300 truncate")}>
                  {contact.phone}
                </span>
                <button
                  onClick={() => copy(contact.phone)}
                  className={t(
                    "ml-auto text-[11px] px-1.5 py-0.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50",
                    "ml-auto text-[11px] px-1.5 py-0.5 rounded border border-slate-700 text-slate-200 hover:bg-slate-800"
                  )}
                >
                  Copy
                </button>
              </div>
            )}
            {contact?.email && (
              <div className="flex items-center gap-2 min-w-0">
                <svg className={t("h-3.5 w-3.5 text-slate-500","h-3.5 w-3.5 text-slate-400")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16v16H4z"/><path d="m22 6-10 7L2 6"/></svg>
                <span className={t("text-[12px] text-slate-700 truncate","text-[12px] text-slate-300 truncate")}>
                  {contact.email}
                </span>
                <button
                  onClick={() => copy(contact.email)}
                  className={t(
                    "ml-auto text-[11px] px-1.5 py-0.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50",
                    "ml-auto text-[11px] px-1.5 py-0.5 rounded border border-slate-700 text-slate-200 hover:bg-slate-800"
                  )}
                >
                  Copy
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {contact?.notes && (
        <>
          <div className={t("mt-2 border-t border-slate-200","mt-2 border-t border-slate-700")} />
          <div className={t("mt-2 text-[12px] leading-5 text-slate-600","mt-2 text-[12px] leading-5 text-slate-300")}>
            {contact.notes}
          </div>
        </>
      )}
    </div>
  );
}

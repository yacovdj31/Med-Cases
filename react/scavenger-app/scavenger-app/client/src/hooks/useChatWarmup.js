// client/src/components/progress/ProgressSideBar.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { useTheme } from "../../theme/ThemeProvider.jsx";

export default function ProgressSideBar({ open, onClose, title = "Progress", width = "50vw" }) {
  const { t } = useTheme();

  // ESC to close
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // lock body scroll while open
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <div className={`${open ? "pointer-events-auto" : "pointer-events-none"} fixed inset-0 z-40`}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
      />

      {/* Panel — use HOME BG COLORS (light: sky-100, dark: sky-900) */}
      <div
        className={[
          "absolute top-2 bottom-2 left-2 flex flex-col overflow-hidden rounded-xl shadow-2xl",
          "transition-transform duration-300 will-change-transform",
          open ? "translate-x-0" : "-translate-x-[calc(100%+0.5rem)]",
          t("bg-sky-100 text-slate-800 border border-sky-200",
            "bg-sky-900 text-slate-100 border border-sky-800"),
        ].join(" ")}
        style={{ width, maxWidth: "calc(100vw - 1rem)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar — also home bg color */}
        <div className={t(
          "px-4 py-3 border-b border-sky-200 bg-sky-100",
          "px-4 py-3 border-b border-sky-800 bg-sky-900"
        )}>
          <h3 className="font-semibold">{title}</h3>
        </div>

        {/* Content (hidden scrollbar) */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <ProgressContent />
        </div>
      </div>
    </div>
  );
}

function ProgressContent() {
  const { t } = useTheme();
  const [boxes, setBoxes] = React.useState([]);
  const [progress, setProgress] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const nav = useNavigate();

  React.useEffect(() => {
    let stop = false;
    (async () => {
      try {
        const [b, p] = await Promise.all([api.get("/boxes"), api.get("/progress/me")]);
        if (!stop) { setBoxes(b.data || []); setProgress(p.data || null); }
      } finally { if (!stop) setLoading(false); }
    })();
    return () => { stop = true; };
  }, []);

  // id -> box
  const boxMap = React.useMemo(() => {
    const m = new Map();
    for (const b of boxes) m.set(b._id, b);
    return m;
  }, [boxes]);

  // Assigned in order
  const items = React.useMemo(() => {
    const statuses = progress?.statuses || [];
    return statuses
      .map((st, idx) => {
        const id = st.boxId?._id || st.boxId;
        const box = boxMap.get(id);
        if (!box) return null;
        let state = "not_touched";
        if (st?.state === "completed" || st?.completed) state = "completed";
        else if (st?.state === "pending") state = "pending";
        return { order: idx, box, state };
      })
      .filter(Boolean);
  }, [progress, boxMap]);

  if (loading) return <div className="p-4 text-sm opacity-70">Loading progress…</div>;
  if (!items.length) return <div className="p-4 text-sm opacity-70">No boxes assigned yet.</div>;

  return (
    <ul className="p-4 space-y-3">
      {items.map((it) => {
        const kls = stateClasses(it.state, t);
        return (
          <li key={it.box._id}>
            <button
              onClick={() => nav(`/info/${it.box._id}`)}
              title={`${it.box.key} — ${it.box.title}`}
              className={[
                "w-full text-left rounded-2xl border transition",
                "min-h-[88px]", // uniform height
                kls.wrap,
              ].join(" ")}
            >
              <div className="p-3 flex items-center gap-3">
                {/* left accent bar = same highlight family as Home */}
                <div className={t("w-1.5 rounded self-stretch bg-sky-500", "w-1.5 rounded self-stretch bg-sky-400")} />

                {/* order circle */}
                <div className={t(
                  "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-semibold bg-white border border-slate-200 text-slate-700",
                  "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-semibold bg-slate-900/60 border border-slate-700 text-slate-100"
                )}>
                  {it.order + 1}
                </div>

                {/* content (truncate for long strings) */}
                <div className="min-w-0 flex-1">
                  <div className={t("font-medium truncate text-slate-900","font-medium truncate text-white")}>
                    {it.box.key} — {it.box.title}
                  </div>
                  <div
                    className={t("text-xs truncate text-slate-600","text-xs truncate text-slate-300")}
                    title={it.box.description || "—"}
                  >
                    {it.box.description || "—"}
                  </div>
                </div>

                {/* status */}
                <div className="ml-auto flex items-center gap-2">
                  <span className={`inline-flex h-2 w-2 rounded-full ${kls.dot}`} />
                  <span className={`text-xs font-semibold ${kls.tag}`}>{label(it.state)}</span>
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------------- helpers ---------------- */

function label(state) {
  if (state === "completed") return "Completed";
  if (state === "pending") return "Pending";
  return "Not touched";
}

function stateClasses(state, t) {
  if (state === "completed") {
    return {
      wrap: t(
        "bg-green-50 border-green-300 ring-2 ring-green-400/45 hover:border-green-400",
        "bg-emerald-900/15 border-emerald-500/40 ring-emerald-400/35 hover:border-emerald-400/50"
      ),
      tag: t("text-green-700", "text-emerald-300"),
      dot: t("bg-green-500", "bg-emerald-400"),
    };
  }
  if (state === "pending") {
    return {
      wrap: t(
        "bg-amber-50 border-amber-300 ring-2 ring-amber-400/45 hover:border-amber-400",
        "bg-amber-900/15 border-amber-500/40 ring-amber-400/35 hover:border-amber-400/50"
      ),
      tag: t("text-amber-700", "text-amber-300"),
      dot: t("bg-amber-500", "bg-amber-400"),
    };
  }
  return {
    wrap: t(
      "bg-white border-slate-200 hover:border-sky-300",
      "bg-slate-900/40 border-slate-700 hover:border-sky-400/40"
    ),
    tag: t("text-slate-600", "text-slate-300"),
    dot: "bg-slate-400",
  };
}



import React from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";

export default function ChatSlideOver({ open, onClose, title = "Chat", width = "50vw", children }) {
  const { t } = useTheme();

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <div className={`${open ? "pointer-events-auto" : "pointer-events-none"} fixed inset-0 z-50`}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
      />

      {/* Panel — match Home bg (sky-100 / sky-900) */}
      <div
        className={[
          "absolute top-2 bottom-2 right-2 flex flex-col overflow-hidden rounded-xl shadow-2xl",
          "transition-transform duration-300 will-change-transform",
          open ? "translate-x-0" : "translate-x-[calc(100%+0.5rem)]",
          t("bg-sky-100 text-slate-800 border border-sky-200",
            "bg-sky-900 text-slate-100 border border-sky-800"),
        ].join(" ")}
        style={{ width, maxWidth: "calc(100vw - 1rem)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
      >
        {/* Content (kept mounted) */}
        <div className="flex-1 overflow-hidden no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}

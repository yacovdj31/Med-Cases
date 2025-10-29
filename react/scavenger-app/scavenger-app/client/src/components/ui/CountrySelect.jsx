import React, { useEffect, useRef, useState } from "react";

/**
 * Props:
 * - value: string
 * - onChange: (val) => void
 * - options: [{ value: "all", label: "All" }, ...]
 * - placeholder?: string
 * - className?: string   // wrapper width, etc.
 * - t: theme mapper from useTheme (for light/dark classes)
 */
export default function CountrySelect({
  value,
  onChange,
  options = [],
  placeholder = "Select…",
  className = "",
  t = (l) => l, // no-op if not provided
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const listRef = useRef(null);

  const current = options.find((o) => o.value === value);
  const label = current?.label ?? placeholder;

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (
        !btnRef.current?.contains(e.target) &&
        !listRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // keyboard support when list is open (ArrowUp/Down + Enter)
  const [activeIndex, setActiveIndex] = useState(-1);
  useEffect(() => {
    if (!open) { setActiveIndex(-1); return; }
    const onKey = (e) => {
      const max = options.length - 1;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i < max ? i + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i > 0 ? i - 1 : max));
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        const opt = options[activeIndex];
        if (opt) {
          onChange(opt.value);
          setOpen(false);
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, options, activeIndex, onChange]);

  return (
    <div className={`relative ${className}`}>
      {/* trigger */}
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={t(
          // LIGHT
          "flex w-full items-center justify-between gap-2 h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
          // DARK
          "flex w-full items-center justify-between gap-2 h-9 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 shadow-sm hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={t("text-slate-700", "text-slate-200")}>
          {label}
        </span>
        <svg
          viewBox="0 0 24 24"
          className={t("h-4 w-4 text-slate-500","h-4 w-4 text-slate-400")}
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* menu */}
      {open && (
        <div
          ref={listRef}
          className={t(
            // LIGHT
            "absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl",
            // DARK – strong separation so it's readable
            "absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-[0_16px_48px_rgba(0,0,0,0.6)]"
          )}
          role="listbox"
        >
          <ul className="py-1 max-h-[280px] overflow-auto">
            {options.map((opt, i) => {
              const selected = opt.value === value;
              const active = i === activeIndex;
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    role="option"
                    aria-selected={selected}
                    className={[
                      "w-full text-left px-3 py-2 text-sm transition",
                      selected
                        ? t("bg-sky-50 text-slate-900","bg-sky-900/30 text-slate-100")
                        : t("text-slate-700","text-slate-200"),
                      active && !selected
                        ? t("bg-slate-100","bg-slate-800/70")
                        : ""
                    ].join(" ")}
                  >
                    {opt.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

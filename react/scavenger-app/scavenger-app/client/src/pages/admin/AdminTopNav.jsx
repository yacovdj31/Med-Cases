// client/src/components/admin/AdminTopNav.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { useAuth } from "../../auth/AuthContext";
import { IconChat, IconFile, IconX } from "../../components/ui/Icons.jsx";
export default function AdminTopNav({ secondary = [], rightText }) {
  const { t, toggle, isDark } = useTheme();
  const { logout } = useAuth();
  const nav = useNavigate();

  return (
    <nav
      className={t(
        "sticky top-0 z-30 border-b border-sky-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75",
        "sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80"
      )}
    >
      <div className="max-w-6xl mx-auto px-5 py-3 flex items-center gap-4 overflow-x-auto no-scrollbar">
        {/* Brand / Home */}
        <button
          onClick={() => nav("/admin")}
          className={t("font-semibold tracking-tight text-slate-900", "font-semibold tracking-tight text-white")}
          aria-label="Admin home"
        >
          Admin
        </button>

        {/* Primary group — stays first & in place */}
        <div className="flex items-center gap-2 min-w-fit">
          <AdminLink to="/admin" exact>Users</AdminLink>
          <AdminLink to="/admin/boxes">Boxes</AdminLink>
        </div>

        {/* Secondary group — appended inline, does not alter primary order */}
        {!!secondary.length && (
          <>
            <span className={t("h-5 w-px bg-slate-200", "h-5 w-px bg-slate-700")} />
            <div className="flex items-center gap-1 min-w-fit">
              {secondary.map((s) => (
                <AdminLink key={s.to} to={s.to} exact={!!s.exact}>
                  {s.label}
                </AdminLink>
              ))}
            </div>
          </>
        )}

        {/* Spacer keeps right controls pinned to the right without moving primary */}
        <div className="flex-1" />

        {/* Optional right-side context (user name/email, etc.) */}
        {rightText ? (
          <div className={t("text-xs text-slate-600 truncate max-w-[40%]", "text-xs text-slate-300 truncate max-w-[40%]")}>
            {rightText}
          </div>
        ) : null}

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className={t(
            "px-3 py-1.5 rounded-md text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
            "px-3 py-1.5 rounded-md text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70"
          )}
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z"/></svg>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className={t(
            "px-3 py-1.5 rounded-md text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
            "px-3 py-1.5 rounded-md text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70"
          )}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

function AdminLink({ to, exact = false, children }) {
  const { t } = useTheme();
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        t(
          [
            "px-3 py-1.5 rounded-md transition font-medium",
            "text-slate-700 hover:bg-slate-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
            isActive ? "bg-sky-200 text-slate-900" : ""
          ].join(" "),
          [
            "px-3 py-1.5 rounded-md transition font-medium",
            "text-slate-200 hover:bg-white/10",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70",
            isActive ? "bg-sky-800/50 text-white" : ""
          ].join(" ")
        )
      }
    >
      {children}
    </NavLink>
  );
}





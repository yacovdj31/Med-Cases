import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await login(email, password); // navigates on success
    } catch (e2) {
      setErr(e2?.response?.data?.error || "Invalid email or password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-sky-900 text-slate-100 px-3">
      <div className="w-full max-w-sm rounded-2xl border border-sky-800 bg-slate-900/60 backdrop-blur-sm shadow-[0_8px_30px_rgba(2,132,199,0.15)] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-sky-800 bg-sky-900">
          <h1 className="text-base font-semibold">Log in</h1>
        </div>

        {/* Body */}
        <form onSubmit={submit} className="p-4 grid gap-3">
          {err && (
            <div className="p-2 rounded-lg border border-red-400/40 bg-red-500/10 text-red-300 text-sm">
              {err}
            </div>
          )}

          <label className="grid gap-1">
            <span className="text-xs font-medium text-slate-300">Email</span>
            <input
              className="rounded-xl px-3 py-2 text-sm bg-slate-900/60 text-slate-100 placeholder-slate-400/70 border border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-medium text-slate-300">Password</span>
            <input
              className="rounded-xl px-3 py-2 text-sm bg-slate-900/60 text-slate-100 placeholder-slate-400/70 border border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          <button
            disabled={busy}
            className={[
              "rounded-xl px-4 py-2 text-sm font-medium text-white border border-sky-700",
              "bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600",
              "shadow-[0_6px_20px_rgba(2,132,199,0.25)]",
              "transition-all duration-200 hover:translate-y-[-1px] hover:shadow-[0_12px_30px_rgba(2,132,199,0.35)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300",
              busy ? "opacity-60 cursor-not-allowed" : ""
            ].join(" ")}
          >
            {busy ? "Signing in…" : "Continue"}
          </button>

          <div className="text-xs text-slate-400">
            New here?{" "}
            <Link className="text-sky-300 hover:underline" to="/signup">
              Create an account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

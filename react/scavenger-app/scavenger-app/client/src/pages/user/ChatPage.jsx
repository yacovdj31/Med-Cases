// client/src/pages/user/ChatPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../api";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { useAuth } from "../../auth/AuthContext";
import { readThread, writeThread, readUser, writeUser } from "../../chat/cache";

const MAX_CACHE = 300;
const PAGE_SIZE = 60;

export default function ChatPage() {
  return (
    <div className="grid gap-3">
      <ChatPanel showHeader={false} />
    </div>
  );
}

export function ChatPanel({ showHeader = false, heightClass, markOnMount = true }) {
  const { t } = useTheme();
  const { user } = useAuth();
  const userId = user?._id || user?.id;

  // seed immediately from cache (per-user key)
  const [allMsgs, setAllMsgs] = useState(() => (userId ? readThread(userId) : []));
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(PAGE_SIZE, (userId ? readThread(userId).length : 0) || PAGE_SIZE)
  );
  const [text, setText] = useState("");
  const listRef = useRef(null);
  const bottomRef = useRef(null);
  const stickToBottomAlways = useRef(true); // "always scroll to bottom"

  const scrollToBottom = (smooth = true) =>
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" }), 0);

  const clampAndPersist = (arr) => {
    const msgs = Array.isArray(arr) ? arr.slice(-MAX_CACHE) : [];
    if (userId) writeThread(userId, msgs, MAX_CACHE);
    return msgs;
  };

  const fetchThread = async () => {
    const res = await api.get("/user/chat/thread");
    const next = res.data?.messages || [];
    const clamped = clampAndPersist(next);
    setAllMsgs(clamped);
    setVisibleCount((v) => Math.max(v, Math.min(clamped.length, PAGE_SIZE)));
  };

  const initialLoad = async () => {
    // If cache exists, we do NOT show a spinner; just update in the background
    try {
      // ensure we also have /auth/me cached (optional)
      const meRes = await api.get("/auth/me");
      const me = meRes.data?.user;
      if (me && userId) writeUser(userId, me);

      await fetchThread();
    } finally {
      if (stickToBottomAlways.current) scrollToBottom(false);
    }
  };

  const markRead = async () => {
    try { await api.post("/user/chat/mark-read"); } catch {}
  };

  // mount: show cached immediately; then refresh
  useEffect(() => {
    if (!userId) return;
    // instantly go to bottom of cached content
    scrollToBottom(false);
    initialLoad();
    if (markOnMount) markRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // light polling while visible
  useEffect(() => {
    if (!userId) return;
    let timer;
    const tick = async () => {
      if (document.visibilityState === "visible") {
        try { await fetchThread(); } catch {}
      }
      timer = setTimeout(tick, 5000);
    };
    tick();
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // infinite scroll up
  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    if (el.scrollTop < 60) {
      setVisibleCount((v) => Math.min(allMsgs.length, v + PAGE_SIZE));
    }
  };

  async function send(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;

    const optimistic = {
      _id: "tmp-" + Date.now(),
      text: body,
      createdAt: new Date().toISOString(),
      from: { role: "user" },
    };

    setAllMsgs((prev) => {
      const next = clampAndPersist([...prev, optimistic]);
      setVisibleCount((v) => Math.min(next.length, Math.max(v, PAGE_SIZE)));
      return next;
    });
    setText("");
    if (stickToBottomAlways.current) scrollToBottom();

    try {
      await api.post("/user/chat/thread", { text: body });
      await fetchThread();
      if (stickToBottomAlways.current) scrollToBottom(false);
      markRead();
    } catch {
      // optional: toast
    }
  }

  const onlyTime = (d) =>
    new Date(d).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const ymd = (d) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
      dt.getDate()
    ).padStart(2, "0")}`;
  };
  const labelForDay = (d) => {
    const dt = new Date(d);
    const today = new Date();
    const ymdMsg = ymd(dt);
    const ymdToday = ymd(today);
    const ymdYesterday = ymd(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1));
    if (ymdMsg === ymdToday) return "Today";
    if (ymdMsg === ymdYesterday) return "Yesterday";
    return dt.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  };

  // show last `visibleCount` messages with day dividers
  const tail = useMemo(() => allMsgs.slice(Math.max(0, allMsgs.length - visibleCount)), [allMsgs, visibleCount]);

  const renderItems = useMemo(() => {
    const out = [];
    let lastDay = null;
    for (const m of tail) {
      const day = ymd(m.createdAt);
      if (day !== lastDay) {
        out.push({ type: "divider", id: `div-${day}`, label: labelForDay(m.createdAt) });
        lastDay = day;
      }
      out.push({ type: "msg", data: m, id: m._id });
    }
    return out;
  }, [tail]);

  return (
    <div
      className={t(
        "h-full flex flex-col rounded-xl border border-sky-200 overflow-hidden shadow-sm bg-sky-100 text-slate-800",
        "h-full flex flex-col rounded-xl border border-sky-800 overflow-hidden shadow-sm bg-sky-900 text-slate-100"
      )}
    >
      {showHeader && (
        <div
          className={t(
            "px-4 py-3 border-b border-sky-200 bg-sky-100",
            "px-4 py-3 border-b border-sky-800 bg-sky-900"
          )}
        >
          <h1 className="text-base font-semibold">Chat with Admin</h1>
        </div>
      )}

      {/* Messages */}
      <div
        ref={listRef}
        onScroll={onScroll}
        className={[
          "p-4 pt-5 overflow-y-auto no-scrollbar flex-1",
          heightClass ? "" : "min-h-[60vh]",
        ].join(" ")}
      >
        {/* No "Loading…" — we always render from cache */}
        <>
          {renderItems.map((item) => {
            if (item.type === "divider") return <DayDivider key={item.id} label={item.label} />;
            const m = item.data;
            const fromAdmin = m.from?.role === "admin";
            return (
              <div
                key={item.id}
                className={`mt-2 mb-3 flex ${fromAdmin ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={[
                    "px-3 py-2 rounded-2xl max-w-[75%] border",
                    fromAdmin
                      ? t(
                          "bg-white text-slate-800 border-slate-200",
                          "bg-slate-900/50 text-slate-100 border-slate-700"
                        )
                      : "bg-sky-600 text-white border-sky-700",
                  ].join(" ")}
                  style={{ borderRadius: 14 }}
                >
                  <div className="text-sm break-words">{m.text}</div>
                  <div className={`${fromAdmin ? "opacity-70" : "text-white/80"} text-[10px] mt-1`}>
                    {onlyTime(m.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </>
      </div>

      {/* Composer */}
      <form
        onSubmit={send}
        className={t(
          "border-t border-sky-200 bg-sky-100 px-3 py-2",
          "border-t border-sky-800 bg-sky-900 px-3 py-2"
        )}
      >
        <div className="flex items-center gap-2">
          <label
            className={t(
              "flex items-center gap-2 flex-1 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-sky-400",
              "flex items-center gap-2 flex-1 rounded-xl border border-slate-700 bg-slate-900/60 px-2.5 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-sky-300/70"
            )}
          >
            <input
              className={t(
                "flex-1 bg-transparent outline-none text-sm text-slate-900 placeholder-slate-400",
                "flex-1 bg-transparent outline-none text-sm text-slate-100 placeholder-slate-400/70"
              )}
              placeholder="Type a message…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </label>

          <button
            type="submit"
            disabled={!text.trim()}
            className={[
              "inline-flex items-center justify-center h-11 w-11 rounded-xl",
              "bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed",
              "text-white shadow-sm border border-sky-700",
              "transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
            ].join(" ")}
            aria-label="Send message"
            title="Send"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-[18px] w-[18px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

function DayDivider({ label }) {
  const { t } = useTheme();
  return (
    <div className="my-3 flex items-center justify-center">
      <div className={t("h-px bg-slate-300 flex-1", "h-px bg-slate-700 flex-1")} />
      <span
        className={t(
          "mx-3 text-[11px] uppercase tracking-wide text-slate-500",
          "mx-3 text-[11px] uppercase tracking-wide text-slate-300/80"
        )}
      >
        {label}
      </span>
      <div className={t("h-px bg-slate-300 flex-1", "h-px bg-slate-700 flex-1")} />
    </div>
  );
}

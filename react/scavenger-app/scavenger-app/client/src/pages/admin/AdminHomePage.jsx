// client/src/pages/admin/AdminHomePage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api";
import { useAuth } from "../../auth/AuthContext";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import AdminTopNav from "../admin/AdminTopNav.jsx";
import { IconChat, IconFile, IconX } from "../../components/ui/Icons.jsx";
import { socket } from "../../socket"; // <-- NEW

/* -------- localStorage helpers & keys -------- */
const getLS = (k, d = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const setLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const USERS_KEY          = "admin:users";
const LATEST_CHAT_KEY    = "admin:latestChatAt";
const LATEST_FILES_KEY   = "admin:latestFileAt";
const LATEST_CHAT_TXTKEY = "admin:latestChatText";
const LATEST_CHAT_CNTKEY = "admin:latestChatCount";
const DRAFT_PREF_KEY     = "admin:draftPrefMap";

const chatSeenKey       = (userId) => `admin:lastSeen:chat:${userId}`;
const chatSeenCntKey    = (userId) => `admin:lastSeen:chatCount:${userId}`;
const filesSeenKey      = (userId) => `admin:lastSeen:files:${userId}`;

/* helpers */
function titleCaseName(s = "") {
  return s.toLowerCase().replace(/\b[\p{L}]/gu, (ch) => ch.toUpperCase());
}

/* Always-visible Draft choices */
const DRAFT_STATIC = ["August", "November", "March"];

/* ---------- avatar color + timeago (kept simple) ---------- */
const AVATAR_PALETTE = [
  ["bg-sky-600","border-sky-700"],
  ["bg-indigo-600","border-indigo-700"],
  ["bg-emerald-600","border-emerald-700"],
  ["bg-fuchsia-600","border-fuchsia-700"],
  ["bg-rose-600","border-rose-700"],
  ["bg-amber-600","border-amber-700"],
  ["bg-cyan-600","border-cyan-700"],
  ["bg-violet-600","border-violet-700"],
  ["bg-teal-600","border-teal-700"],
];
const hashStr = (s="") => { let h=0; for (let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; return h; };
function pickAvatar(seed) {
  const [bg,border] = AVATAR_PALETTE[hashStr(String(seed||"")) % AVATAR_PALETTE.length];
  return { bg, border };
}
function timeAgo(ts) {
  const t = Number(ts||0); if (!t) return "";
  const d = Date.now()-t, m=60e3, h=60*m, day=24*h;
  if (d < m) return "now";
  if (d < h) return `${Math.floor(d/m)}m`;
  if (d < day) return `${Math.floor(d/h)}h`;
  const days = Math.floor(d/day);
  return days===1 ? "yday" : `${days}d`;
}

/* ---------- Left Messages Drawer ---------- */
function MessagesDrawer({ open, onClose, items, onAckAndGo }) {
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
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
      />
      <div
        className={[
          "absolute top-2 bottom-2 left-2 w-[520px] max-w-[95vw]",
          "rounded-[22px] shadow-2xl overflow-hidden border",
          "transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-[calc(100%+0.5rem)]",
          t("bg-slate-100/95 border-slate-200", "bg-slate-900/95 border-slate-700")
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
      >
        <div className="p-3 h-full overflow-y-auto no-scrollbar">
          <ul className="space-y-2">
            {items.map((it) => {
              const av = pickAvatar(it.seed);
              const rowCls = it.highlight
                ? t("bg-sky-200/70 border-slate-300","bg-sky-800/50 border-slate-600")
                : t("bg-white/90 border-slate-200","bg-slate-900/70 border-slate-700");
              return (
                <li key={it.id}>
                  <button
                    type="button"
                    onClick={() => onAckAndGo(it.id)}
                    className={[
                      "w-full text-left flex items-center gap-3 rounded-2xl px-3 py-3 border transition",
                      "hover:bg-white/95 dark:hover:bg-slate-900/80",
                      rowCls
                    ].join(" ")}
                    title={`Open chat with ${titleCaseName(it.name || "")}`}
                  >
                    <div
                      className={[
                        "h-10 w-10 rounded-2xl grid place-items-center text-white border font-semibold shrink-0",
                        av.bg, av.border
                      ].join(" ")}
                    >
                      {String(it.name || "—").trim().charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className={t("truncate font-semibold text-slate-900","truncate font-semibold text-white")}>
                          {titleCaseName(it.name || "")}
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          {it.when && (
                            <span className={t("text-[11px] text-slate-500","text-[11px] text-slate-300")}>
                              {it.when}
                            </span>
                          )}
                          {it.unread > 0 && (
                            <span
                              className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full text-[10px] font-semibold text-white bg-sky-500 border border-sky-600"
                              title={`${it.unread} message${it.unread > 1 ? "s" : ""}`}
                            >
                              {it.unread}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={t("text-[12px] leading-snug text-slate-600 truncate","text-[12px] leading-snug text-slate-300 truncate")}>
                        {it.preview || "—"}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
            {items.length === 0 && (
              <li className={t("text-sm text-slate-700 px-1 py-2", "text-sm text-slate-300 px-1 py-2")}>
                No conversations.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function AdminHomePage() {
  const { t } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();

  // seed from cache
  const [users, setUsers] = useState(() => getLS(USERS_KEY, []));
  const [latestChatAt, setLatestChatAt] = useState(() => getLS(LATEST_CHAT_KEY, {}));
  const [latestFileAt, setLatestFileAt] = useState(() => getLS(LATEST_FILES_KEY, {}));
  const [latestChatText, setLatestChatText] = useState(() => getLS(LATEST_CHAT_TXTKEY, {}));
  const [latestChatCount, setLatestChatCount] = useState(() => getLS(LATEST_CHAT_CNTKEY, {}));
  const [draftPrefMap, setDraftPrefMap] = useState(() => getLS(DRAFT_PREF_KEY, {}));

  const [loading, setLoading] = useState(users.length === 0);
  const [err, setErr] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // filters
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("all");
  const [draftFilter, setDraftFilter] = useState("all");

  // drawer visibility
  const [openDrawer, setOpenDrawer] = useState(false);

  // meta fetch concurrency
  const busyFetchers = useRef(0);
  const [seenVer, setSeenVer] = useState(0);

  /* ---------- users refresh ---------- */
  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        const me = await api.get("/auth/me").then(r => r.data?.user);
        if (!me || (me.role || "").toLowerCase() !== "admin") {
          setErr("Not authorized. Please sign in with an admin account.");
          setLoading(false);
          return;
        }
        const res = await api.get("/auth/admin/users");
        if (stop) return;
        const list = res.data || [];
        setUsers((prev) => {
          const same = JSON.stringify(prev) === JSON.stringify(list);
          if (!same) setLS(USERS_KEY, list);
          return same ? prev : list;
        });
      } catch (e) {
        if (!users.length) setErr(e?.response?.data?.error || "Failed to load users");
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => { stop = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- SOCKET: live chat notifications ---------- */
  useEffect(() => {
    // ensure single connection
    socket.connect();
    const onConnect = () => socket.emit('joinAdmins');
    socket.on('connect', onConnect);

    const onChatNew = ({ userId }) => {
      // 1) bump the timestamp so the card highlights immediately
      setLatestChatAt((prev) => {
        const next = { ...prev, [userId]: Date.now() };
        setLS(LATEST_CHAT_KEY, next);
        return next;
      });

      // 2) refresh snippet + count for THIS user only (cheap)
      api.get(`/admin/chat/thread/${userId}`)
        .then(r => {
          const msgs = r.data?.messages || [];
          const count = msgs.length;
          const newest = msgs[msgs.length - 1];
          const raw = (newest?.text || newest?.content || "").toString().trim();
          const snippet = raw ? (raw.length > 70 ? raw.slice(0, 70) + "…" : raw) : "";

          setLatestChatText(prev => {
            const next = { ...prev, [userId]: snippet };
            setLS(LATEST_CHAT_TXTKEY, next);
            return next;
          });
          setLatestChatCount(prev => {
            const next = { ...prev, [userId]: count };
            setLS(LATEST_CHAT_CNTKEY, next);
            return next;
          });
        })
        .catch(() => {});
    };

    socket.on('chat:new', onChatNew);

    return () => {
      socket.off('connect', onConnect);
      socket.off('chat:new', onChatNew);
      // keep socket connected globally if other admin pages use it
    };
  }, []);

  /* ---------- latest chat/files + snippet/count + draft refresh ---------- */
  useEffect(() => {
    if (!users.length) return;
    let stop = false;
    const MAX_CONCURRENCY = 4;
    const queue = [...users];

    const pump = async () => {
      if (stop || busyFetchers.current >= MAX_CONCURRENCY) return;
      const u = queue.shift();
      if (!u) return;

      busyFetchers.current++;
      try {
        // latest chat
        let chatTs = latestChatAt[u._id] || 0;
        let snippet = latestChatText[u._id] || "";
        let count = latestChatCount[u._id] || 0;
        try {
          const tRes = await api.get(`/admin/chat/thread/${u._id}`);
          const msgs = tRes.data?.messages || [];
          count = msgs.length;
          if (msgs.length) {
            const newest = msgs[msgs.length - 1];
            chatTs = new Date(newest.createdAt || newest.updatedAt || 0).getTime();
            const raw = (newest?.text || newest?.content || "").toString().trim();
            snippet = raw ? (raw.length > 70 ? raw.slice(0, 70) + "…" : raw) : "";
          }
        } catch {}

        // latest files
        let fileTs = latestFileAt[u._id] || 0;
        try {
          const fRes = await api.get(`/uploads/user/${u._id}`);
          const items = fRes.data?.items || fRes.data || [];
          if (items.length) {
            fileTs = items.reduce((m, it) => {
              const t = new Date(it.createdAt || it.updatedAt || 0).getTime();
              return Math.max(m, t);
            }, 0);
          }
        } catch {}

        // draft preference
        let draft = draftPrefMap[u._id];
        if (typeof draft === "undefined") {
          try {
            const iRes = await api.get(`/admin/intake/${u._id}`);
            draft = iRes.data?.intake?.serviceIntent?.draftPreference || null;
          } catch {
            draft = null;
          }
        }

        setLatestChatAt((prev) => {
          if (prev[u._id] === chatTs) return prev;
          const next = { ...prev, [u._id]: chatTs };
          setLS(LATEST_CHAT_KEY, next);
          return next;
        });
        setLatestFileAt((prev) => {
          if (prev[u._id] === fileTs) return prev;
          const next = { ...prev, [u._id]: fileTs };
          setLS(LATEST_FILES_KEY, next);
          return next;
        });
        setLatestChatText((prev) => {
          if (prev[u._id] === snippet) return prev;
          const next = { ...prev, [u._id]: snippet };
          setLS(LATEST_CHAT_TXTKEY, next);
          return next;
        });
        setLatestChatCount((prev) => {
          if (prev[u._id] === count) return prev;
          const next = { ...prev, [u._id]: count };
          setLS(LATEST_CHAT_CNTKEY, next);
          return next;
        });
        setDraftPrefMap((prev) => {
          if (prev[u._id] === draft) return prev;
          const next = { ...prev, [u._id]: draft };
          setLS(DRAFT_PREF_KEY, next);
          return next;
        });
      } finally {
        busyFetchers.current--;
        if (!stop && queue.length) pump();
      }
    };

    for (let i = 0; i < Math.min(MAX_CONCURRENCY, users.length); i++) pump();
    return () => { stop = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users.length]);

  /* ---------- unseen helpers (timestamp OR count) ---------- */
  const unseenChat = (id) => {
    const lastTs   = getLS(chatSeenKey(id), 0) || 0;
    const lastCnt  = getLS(chatSeenCntKey(id), 0) || 0;
    const nowTs    = latestChatAt[id] || 0;
    const nowCnt   = latestChatCount[id] || 0;
    return (nowTs > lastTs) || (nowCnt > lastCnt);
  };
  const unseenFiles = (id) => (latestFileAt[id] || 0) > (getLS(filesSeenKey(id), 0) || 0);

  const ackChat = (id) => {
    setLS(chatSeenKey(id), latestChatAt[id] || Date.now());
    setLS(chatSeenCntKey(id), latestChatCount[id] || 0);
    setSeenVer((v) => v + 1);
  };
  const ackFiles = (id) => {
    setLS(filesSeenKey(id), latestFileAt[id] || Date.now());
    setSeenVer((v) => v + 1);
  };

  /* ---------- recency & weighting ---------- */
  const recencyTs = (u) => Math.max(latestChatAt[u._id] || 0, latestFileAt[u._id] || 0);
  const weightTs = (u) => (recencyTs(u) || 0) + ((unseenChat(u._id) || unseenFiles(u._id)) ? 9e12 : 0);

  /* ---------- filters/options ---------- */
  const draftOptions = useMemo(() => {
    const s = new Set(DRAFT_STATIC);
    users.forEach((u) => {
      const v = draftPrefMap[u._id];
      if (v && typeof v === "string") s.add(v);
    });
    return ["all", ...Array.from(s)];
  }, [users, draftPrefMap]);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    return users.filter((u) => {
      if (country !== "all" && (u.country || "").toLowerCase() !== country.toLowerCase()) return false;
      if (draftFilter !== "all") {
        const v = draftPrefMap[u._id] || "";
        if (String(v) !== String(draftFilter)) return false;
      }
      if (!text) return true;
      const hay = [u.name || "", u.email || ""].join(" ").toLowerCase();
      return hay.includes(text);
    });
  }, [users, q, country, draftFilter, draftPrefMap]);

  const sorted = useMemo(() => {
    const byAlpha = (a, b) =>
      (titleCaseName(a.name || a.email) || "").localeCompare(titleCaseName(b.name || b.email) || "");
    return [...filtered].sort((a, b) => {
      const wb = weightTs(b);
      const wa = weightTs(a);
      if (wb !== wa) return wb - wa;
      const rb = recencyTs(b);
      const ra = recencyTs(a);
      if (rb !== ra) return rb - ra;
      return byAlpha(a, b);
    });
  }, [filtered, latestChatAt, latestFileAt, seenVer]);

  /* ---------- Cards styling ---------- */
  const cardCls = (id) => {
    const hasAny = unseenChat(id) || unseenFiles(id);
    if (hasAny) {
      return t(
        "rounded-2xl border shadow-sm bg-sky-200 border-slate-400 ring-2 ring-slate-400/50",
        "rounded-2xl border shadow-[0_12px_36px_rgba(0,0,0,0.50)] bg-sky-800/60 border-slate-500 ring-2 ring-slate-400/40"
      );
    }
    return t(
      "rounded-2xl border shadow-sm bg-white border-slate-200",
      "rounded-2xl border shadow-[0_12px_36px_rgba(0,0,0,0.45)] bg-slate-950/80 border-slate-700"
    );
  };

  const neutralBtn = t(
    "px-3 py-1.5 rounded-md border text-sm bg-slate-100 text-slate-700 hover:bg-slate-200",
    "px-3 py-1.5 rounded-md border border-slate-600 text-slate-200 bg-slate-800 hover:bg-slate-700"
  );
  const activeSkyBtn =
    "px-3 py-1.5 rounded-md text-sm text-white bg-sky-500 hover:bg-sky-600 border border-sky-600 shadow-sm";

  /* ---------- Drawer items ---------- */
  const drawerItems = useMemo(() => {
    return sorted.map((u) => {
      const text = latestChatText[u._id] || "";
      const unread = unseenChat(u._id) ? Math.max(1, latestChatCount[u._id] || 0) : 0;
      return {
        id: u._id,
        name: u.name || u.email || "—",
        seed: u._id || u.email || u.name || "x",
        preview: text ? (text.length > 80 ? text.slice(0, 79) + "…" : text) : "",
        when: timeAgo(latestChatAt[u._id]),
        unread,
        highlight: unseenChat(u._id),
      };
    });
  }, [sorted, latestChatText, latestChatCount, latestChatAt, seenVer]);

  /* ---------- delete ---------- */
  async function handleDelete(id) {
    if (!window.confirm("Delete this user? This cannot be undone.") ) return;
    try {
      setDeletingId(id);
      await api.delete(`/auth/admin/users/${id}`);
      setUsers((prev) => {
        const next = prev.filter((u) => u._id !== id);
        setLS(USERS_KEY, next);
        return next;
      });
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  }

  /* ---------- ack + navigate from drawer ---------- */
  const ackAndGoFromDrawer = (id) => {
    setLS(chatSeenKey(id), latestChatAt[id] || Date.now());
    setLS(chatSeenCntKey(id), latestChatCount[id] || 0);
    setSeenVer((v) => v + 1);
    setOpenDrawer(false);
    navigate(`/admin/chat/${id}`);
  };

  return (
    <div className={t(
      "min-h-screen bg-sky-100 text-slate-800 overscroll-contain no-scrollbar overflow-x-hidden",
      "min-h-screen bg-sky-900 text-slate-100 overscroll-contain no-scrollbar overflow-x-hidden"
    )}>
      <AdminTopNav />

      <main className="max-w-6xl mx-auto px-5 py-6 grid gap-4">
        {/* Header: icon-only Messages button + filtered count */}
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setOpenDrawer(true)}
            className={[
              "h-10 w-10 rounded-xl inline-flex items-center justify-center",
              "text-white bg-sky-500 hover:bg-sky-600 border border-sky-600 shadow-sm",
              "transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            ].join(" ")}
            aria-label="Messages"
            title="Messages"
          >
            <IconChat />
          </button>

          <div className={t("text-sm text-slate-700", "text-sm text-slate-300")}>
            <span
              className={t(
                "inline-flex items-center rounded-md bg-sky-200 text-slate-900 px-2.5 py-0.5 text-[11px] font-semibold",
                "inline-flex items-center rounded-md bg-sky-800/50 text-white px-2.5 py-0.5 text-[11px] font-semibold"
              )}
            >
              {filtered.length}
            </span>
          </div>
        </header>

        {/* Filters */}
        <section
          className={t(
            "mx-auto w-full max-w-[520px] rounded-xl border border-sky-200 bg-white/80 backdrop-blur p-3 shadow-md",
            "mx-auto w-full max-w-[520px] rounded-xl border border-slate-700 bg-slate-900/80 backdrop-blur p-3 shadow-lg"
          )}
        >
          <div className="flex gap-3 items-end">
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium mb-1">Search</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Filter users..."
                className={t(
                  "w-full rounded-md bg-white text-slate-900 px-3 py-2 text-sm border border-slate-300 focus:ring-2 focus:ring-sky-400",
                  "w-full rounded-md bg-slate-800 text-slate-100 px-3 py-2 text-sm border border-slate-600 focus:ring-2 focus:ring-sky-300"
                )}
              />
            </div>

            <div className="w-[168px]">
              <label className="block text-xs font-medium mb-1">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={t(
                  "w-full rounded-md bg-white text-slate-900 px-3 py-2 text-sm border border-slate-300 focus:ring-2 focus:ring-sky-400",
                  "w-full rounded-md bg-slate-800 text-slate-100 px-3 py-2 text-sm border border-slate-600 focus:ring-2 focus:ring-sky-300"
                )}
              >
                <option value="all">All</option>
                <option value="USA">USA</option>
                <option value="Russia">Russia</option>
                <option value="Canada">Canada</option>
              </select>
            </div>

            <div className="w-[168px]">
              <label className="block text-xs font-medium mb-1">Draft</label>
              <select
                value={draftFilter}
                onChange={(e) => setDraftFilter(e.target.value)}
                className={t(
                  "w-full rounded-md bg-white text-slate-900 px-3 py-2 text-sm border border-slate-300 focus:ring-2 focus:ring-sky-400",
                  "w-full rounded-md bg-slate-800 text-slate-100 px-3 py-2 text-sm border border-slate-600 focus:ring-2 focus:ring-sky-300"
                )}
              >
                {(["all", ...DRAFT_STATIC]).map((opt) => (
                  <option key={opt} value={opt}>{opt === "all" ? "All" : opt}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {err && (
          <div
            className={t(
              "p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm",
              "p-3 rounded-lg border border-red-400/40 bg-red-500/10 text-red-200 text-sm"
            )}
          >
            {err}
          </div>
        )}

        {loading ? (
          <div className={t("text-sm text-slate-700", "text-sm text-slate-300")}>Loading…</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((u) => {
              const unseen = unseenChat(u._id) || unseenFiles(u._id);
              const neutralBtn = t(
                "px-3 py-1.5 rounded-md border text-sm bg-slate-100 text-slate-700 hover:bg-slate-200",
                "px-3 py-1.5 rounded-md border border-slate-600 text-slate-200 bg-slate-800 hover:bg-slate-700"
              );
              const activeSkyBtn =
                "px-3 py-1.5 rounded-md text-sm text-white bg-sky-500 hover:bg-sky-600 border border-sky-600 shadow-sm";
              return (
                <article key={u._id} className={unseen
                  ? t("rounded-2xl border shadow-sm bg-sky-200 border-slate-400 ring-2 ring-slate-400/50",
                      "rounded-2xl border shadow-[0_12px_36px_rgba(0,0,0,0.50)] bg-sky-800/60 border-slate-500 ring-2 ring-slate-400/40")
                  : t("rounded-2xl border shadow-sm bg-white border-slate-200",
                      "rounded-2xl border shadow-[0_12px_36px_rgba(0,0,0,0.45)] bg-slate-950/80 border-slate-700")
                }>
                  <div className="p-4">
                    <div className="text-center">
                      <div className={t("font-semibold truncate text-slate-900", "font-semibold truncate text-slate-100")}>
                        {u.name ? titleCaseName(u.name) : u.email}
                      </div>
                    </div>

                    <div className="mt-1 flex items-center justify-center">
                      <span
                        className={t(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 border border-slate-200 text-slate-700",
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-100 border border-slate-700"
                        )}
                        title="Country"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" />
                        </svg>
                        {u.country || "—"}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      <Link to={`/admin/user/${u._id}`} className={`${neutralBtn} inline-flex items-center gap-2`}>
                        <span>Progress</span>
                      </Link>

                      <Link
                        to={`/admin/chat/${u._id}`}
                        onClick={() => {
                          setLS(chatSeenKey(u._id), latestChatAt[u._id] || Date.now());
                          setLS(chatSeenCntKey(u._id), latestChatCount[u._id] || 0);
                          setSeenVer((v) => v + 1);
                        }}
                        className={`${unseenChat(u._id) ? activeSkyBtn : neutralBtn} inline-flex items-center gap-2`}
                        title="Chat"
                      >
                        <IconChat />
                      </Link>

                      <Link
                        to={`/admin/user/${u._id}/files`}
                        onClick={() => {
                          setLS(filesSeenKey(u._id), latestFileAt[u._id] || Date.now());
                          setSeenVer((v) => v + 1);
                        }}
                        className={`${(latestFileAt[u._id] || 0) > (getLS(filesSeenKey(u._id), 0) || 0) ? activeSkyBtn : neutralBtn} inline-flex items-center gap-2`}
                        title="Files"
                      >
                        <IconFile />
                      </Link>

                      <button
                        onClick={() => handleDelete(u._id)}
                        disabled={deletingId === u._id}
                        className={[
                          "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm",
                          t(
                            "border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300",
                            "border border-red-400/40 text-red-300 bg-red-500/10 hover:bg-red-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
                          ),
                          deletingId === u._id ? "opacity-50 cursor-not-allowed" : ""
                        ].join(" ")}
                        title="Delete user"
                      >
                        <IconX />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
            {sorted.length === 0 && (
              <div className={t("text-sm text-slate-700", "text-sm text-slate-300")}>
                No users match your filters.
              </div>
            )}
          </div>
        )}
      </main>

      <MessagesDrawer
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        items={drawerItems}
        onAckAndGo={(id) => {
          setLS(chatSeenKey(id), latestChatAt[id] || Date.now());
          setLS(chatSeenCntKey(id), latestChatCount[id] || 0);
          setSeenVer((v) => v + 1);
          setOpenDrawer(false);
          navigate(`/admin/chat/${id}`);
        }}
      />
    </div>
  );
}

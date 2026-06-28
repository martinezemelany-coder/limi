import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  MapPin,
  Heart,
  User,
  Film,
  Newspaper,
  MessageCircle,
  Search,
} from "lucide-react";

const navItems = [
  { label: "Feed", to: "/feed", icon: Newspaper },
  { label: "Reels", to: "/reels", icon: Film },
  { label: "Hangouts", to: "/hangouts", icon: MapPin },
  { label: "Match", to: "/match", icon: Heart },
  { label: "Profile", to: "/profile", icon: User },
];

function loadJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export default function Chats() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [threads, setThreads] = useState(() => loadJson("limi-chat-threads", []));

  useEffect(() => {
    const refresh = () => {
      setThreads(loadJson("limi-chat-threads", []));
    };

    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const filteredThreads = useMemo(() => {
    return threads.filter((thread) =>
      thread.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [threads, query]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fdf0f3] via-[#fbeaf0] to-[#f9e5ed]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pt-6 pb-28">
        <header className="rounded-[30px] bg-[#fff7fa] px-5 pt-5 pb-5 shadow-sm">
          <h1
            className="text-[3rem] leading-none tracking-[-0.05em] text-[#d94b93]"
            style={{ fontWeight: 1000 }}
          >
            Chats
          </h1>
          <p className="mt-2 text-xl text-gray-700">your matches and convos 💕</p>

          <div className="mt-5 flex items-center gap-3 rounded-[22px] border border-[#f0d8e2] bg-white px-4 py-3">
            <Search size={18} className="text-[#d95a97]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats"
              className="w-full bg-transparent outline-none"
            />
          </div>
        </header>

        <main className="mt-5 flex-1 space-y-4">
          {filteredThreads.length ? (
            filteredThreads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => navigate(`/chat/${thread.id}`)}
                className="flex w-full items-center gap-4 rounded-[28px] bg-white p-4 text-left shadow-[0_12px_28px_rgba(222,94,146,0.10)]"
              >
                <img
                  src={thread.image}
                  alt={thread.name}
                  className="h-16 w-16 rounded-[20px] object-cover"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="truncate text-lg font-black text-[#201721]">
                      {thread.name}
                    </h3>
                    {thread.unread > 0 && (
                      <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[#d95a97] px-2 text-xs font-black text-white">
                        {thread.unread}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 truncate text-sm font-medium text-[#8e667c]">
                    {thread.city}
                  </p>

                  <p className="mt-2 truncate text-sm text-gray-600">
                    {thread.lastMessage || "Start chatting 💕"}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-[30px] bg-white p-8 text-center shadow-[0_12px_28px_rgba(222,94,146,0.10)]">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-[#ef9ca2] via-[#eb7aa0] to-[#d94b93] text-white">
                <MessageCircle size={32} />
              </div>
              <h2 className="mt-5 text-2xl font-black text-[#d94b93]">No chats yet</h2>
              <p className="mt-3 text-gray-600">
                Get some matches first and your chats will show here 💕
              </p>
            </div>
          )}
        </main>

        <nav className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-[28px] border border-[#f2dbe4] bg-white/95 px-2 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur">
          <div className="grid grid-cols-5 gap-2">
            {navItems.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={label}
                to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-black uppercase tracking-wide transition ${
                    isActive
                      ? "bg-gradient-to-b from-[#eca1a5] to-[#d95a97] text-white"
                      : "text-gray-700"
                  }`
                }
              >
                <Icon size={21} />
                <span className="mt-1">{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Search,
  Users,
  Heart,
  MapPin,
  Sparkles,
} from "lucide-react";

import { auth, db } from "../lib/firebase";

import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

function getInitials(text = "L") {
  return text
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatChatTime(value) {
  if (!value) return "";

  const date = value?.toDate ? value.toDate() : new Date(value);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function ChatAvatar({ chat }) {
  const isHangout = chat.type === "hangout";

  if (chat.photoURL) {
    return (
      <img
        src={chat.photoURL}
        alt=""
        className="h-14 w-14 rounded-[20px] object-cover"
      />
    );
  }

  return (
    <div
      className={`flex h-14 w-14 items-center justify-center rounded-[20px] text-xl font-black text-white ${
        isHangout
          ? "bg-gradient-to-br from-[#f5a8bf] via-[#ef77ae] to-[#f97d8b]"
          : "bg-gradient-to-br from-[#d85fa0] to-[#b94e80]"
      }`}
    >
      {isHangout ? <Users size={24} /> : getInitials(chat.title || "L")}
    </div>
  );
}

function ChatCard({ chat, onClick }) {
  const isHangout = chat.type === "hangout";

  return (
    <button
      onClick={onClick}
      className="w-full rounded-[28px] bg-white p-4 text-left shadow-[0_10px_28px_rgba(239,148,181,0.13)] transition active:scale-[0.99]"
    >
      <div className="flex items-center gap-4">
        <ChatAvatar chat={chat} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-lg font-black text-[#1f1720]">
                  {chat.title || "Limi Chat"}
                </h3>

                <span className="rounded-full bg-[#fff0f6] px-2 py-1 text-[10px] font-black uppercase text-[#d85fa0]">
                  {isHangout ? "Group" : "DM"}
                </span>
              </div>

              {chat.location && (
                <div className="mt-1 flex items-center gap-1 text-xs font-bold text-[#96607f]">
                  <MapPin size={13} />
                  <span className="truncate">{chat.location}</span>
                </div>
              )}
            </div>

            <p className="shrink-0 text-xs font-black text-[#b8839a]">
              {formatChatTime(chat.updatedAt || chat.createdAt)}
            </p>
          </div>

          <p className="mt-2 truncate text-sm font-semibold text-[#80636f]">
            {chat.lastMessage || "Say hi 💕"}
          </p>
        </div>
      </div>
    </button>
  );
}

function ChatSection({ title, subtitle, icon: Icon, chats, onOpenChat }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-1">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ffe4ef] text-[#d94b93]">
          <Icon size={21} />
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-[-0.04em] text-[#1f1720]">
            {title}
          </h2>
          <p className="text-sm font-bold text-[#80636f]">{subtitle}</p>
        </div>
      </div>

      {chats.length ? (
        <div className="space-y-3">
          {chats.map((chat) => (
            <ChatCard
              key={chat.id}
              chat={chat}
              onClick={() => onOpenChat(chat)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-bold text-[#80636f]">
            Nothing here yet 💕
          </p>
        </div>
      )}
    </div>
  );
}

export default function MainChat() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [chats, setChats] = useState([]);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, "chats"),
      where("members", "array-contains", currentUser.uid),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      setChats(data);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const filteredChats = useMemo(() => {
    if (!searchText.trim()) return chats;

    const search = searchText.toLowerCase();

    return chats.filter((chat) =>
      `${chat.title || ""} ${chat.lastMessage || ""} ${chat.location || ""}`
        .toLowerCase()
        .includes(search)
    );
  }, [chats, searchText]);

  const directMessages = filteredChats.filter((chat) => chat.type !== "hangout");
  const hangoutGroups = filteredChats.filter((chat) => chat.type === "hangout");

  const openChat = (chat) => {
    if (chat.type === "hangout") {
      navigate(`/hangout-chat/${chat.hangoutId || chat.id}`);
      return;
    }

    navigate(`/chat/${chat.id}`);
  };

  return (
    <div className="min-h-screen bg-[#fff6fa] pb-28">
      <div className="mx-auto max-w-md px-4 pt-5">
        <div className="rounded-[38px] bg-[#fffdfd] p-5 shadow-[0_10px_35px_rgba(244,168,194,0.14)]">
          <div className="flex items-start justify-between">
            <div>
              <h1
                className="text-[54px] leading-none tracking-[-0.06em] text-[#eb6aaa]"
                style={{ fontWeight: 1000 }}
              >
                Chats
              </h1>

              <p className="mt-2 text-lg font-bold text-[#80636f]">
                keep the friendship going 💕
              </p>
            </div>

            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#f5a8bf] via-[#ef77ae] to-[#f97d8b] text-white shadow-[0_12px_24px_rgba(237,102,157,0.3)]">
              <MessageCircle size={34} />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-full border border-[#f1d8e3] bg-white px-4 py-3">
            <Search size={18} className="text-[#d86592]" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search chats..."
              className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#5f4b56] outline-none placeholder:text-[#bd91a4]"
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[24px] bg-[#fff0f6] p-4 text-center">
              <Heart size={22} className="mx-auto text-[#d94b93]" />
              <p className="mt-2 text-2xl font-black text-[#d94b93]">
                {directMessages.length}
              </p>
              <p className="text-xs font-black uppercase text-[#96607f]">
                Messages
              </p>
            </div>

            <div className="rounded-[24px] bg-[#fff0f6] p-4 text-center">
              <Users size={22} className="mx-auto text-[#d94b93]" />
              <p className="mt-2 text-2xl font-black text-[#d94b93]">
                {hangoutGroups.length}
              </p>
              <p className="text-xs font-black uppercase text-[#96607f]">
                Groups
              </p>
            </div>
          </div>
        </div>

        <div className="mt-7 space-y-8">
          {filteredChats.length ? (
            <>
              <ChatSection
                title="Messages"
                subtitle="one-on-one chats from matches"
                icon={Heart}
                chats={directMessages}
                onOpenChat={openChat}
              />

              <ChatSection
                title="Hangout Groups"
                subtitle="group chats from plans you joined"
                icon={Users}
                chats={hangoutGroups}
                onOpenChat={openChat}
              />
            </>
          ) : (
            <div className="rounded-[36px] bg-white p-10 text-center shadow-sm">
              <Sparkles size={48} className="mx-auto mb-4 text-[#f089b0]" />

              <h3 className="text-2xl font-black text-[#e85da2]">
                No chats yet
              </h3>

              <p className="mt-2 text-sm font-semibold text-[#80636f]">
                Match with someone or join a hangout to start chatting 💕
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}